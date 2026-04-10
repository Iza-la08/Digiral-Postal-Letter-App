document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // CORE SETUP
    // ==========================================
    const navBtns = document.querySelectorAll('.nav-btn');
    const appContainer = document.getElementById('app');
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');

    let currentUserEmail = null;

    // ==========================================
    // CLIENT-SIDE DB HELPERS
    // ==========================================
    function getUsersDB() {
        const dbStr = localStorage.getItem('iLetterU_usersDB');
        return dbStr ? JSON.parse(dbStr) : {};
    }

    function saveUserDB(db) {
        localStorage.setItem('iLetterU_usersDB', JSON.stringify(db));
    }

    // SHA-256 hash via Web Crypto API
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ==========================================
    // AUTH MODE TOGGLE (Login ↔ Sign Up)
    // ==========================================
    let isSignUpMode = false;
    const authTitle = document.getElementById('auth-title');
    const authError = document.getElementById('auth-error');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    const confirmPassGroup = document.getElementById('confirm-pass-group');
    const confirmPassInput = document.getElementById('confirm-password');
    const confirmPassToggle = document.getElementById('confirm-pass-toggle');

    function setAuthMode(signUp) {
        isSignUpMode = signUp;
        authError.style.display = 'none';
        if (signUp) {
            authTitle.textContent = 'Create Account';
            authSubmitBtn.textContent = 'Sign Up';
            authToggleText.textContent = 'Already have an account?';
            authToggleBtn.textContent = 'Log In';
            confirmPassGroup.style.display = 'flex';
            if (confirmPassInput) confirmPassInput.required = true;
        } else {
            authTitle.textContent = 'Sign In';
            authSubmitBtn.textContent = 'Log In';
            authToggleText.textContent = "Don't have an account?";
            authToggleBtn.textContent = 'Sign Up';
            confirmPassGroup.style.display = 'none';
            if (confirmPassInput) confirmPassInput.required = false;
        }
    }

    if (authToggleBtn) {
        authToggleBtn.addEventListener('click', () => setAuthMode(!isSignUpMode));
    }

    // Confirm password eye toggle
    if (confirmPassToggle && confirmPassInput) {
        confirmPassToggle.addEventListener('click', () => {
            const type = confirmPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPassInput.setAttribute('type', type);
            confirmPassToggle.innerText = type === 'password' ? '👁️' : '🙈';
        });
    }

    function showAuthError(msg) {
        authError.textContent = msg;
        authError.className = 'auth-error';
        authError.style.display = 'block';
    }

    // ==========================================
    // SESSION CHECK (on page load)
    // ==========================================
    const savedSession = localStorage.getItem('iLetterU_session');
    if (savedSession) {
        try {
            const sessionEmail = JSON.parse(savedSession);
            const db = getUsersDB();
            if (db[sessionEmail]) {
                currentUserEmail = sessionEmail;
                populateUser(db[currentUserEmail]);
                loginScreen.style.display = 'none';
                appContainer.style.display = 'flex';
            }
        } catch (e) {}
    }

    // ==========================================
    // AUTH FORM HANDLER
    // ==========================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showAuthError('Please fill in all fields.');
            return;
        }

        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = isSignUpMode ? 'Creating...' : 'Logging in...';
        authError.style.display = 'none';

        try {
            const hashedPass = await hashPassword(password);
            const db = getUsersDB();

            if (isSignUpMode) {
                // --- SIGN UP ---
                const confirmPass = confirmPassInput ? confirmPassInput.value : '';
                if (password !== confirmPass) {
                    showAuthError('Passwords do not match.');
                    return;
                }
                if (password.length < 6) {
                    showAuthError('Password must be at least 6 characters.');
                    return;
                }
                if (db[email]) {
                    showAuthError('An account with this email already exists. Please log in instead.');
                    return;
                }

                // Create new account
                db[email] = {
                    email,
                    passwordHash: hashedPass,
                    nickname: "",
                    avatar: "",
                    letters: [],
                    inbox: []
                };
                saveUserDB(db);

            } else {
                // --- LOGIN ---
                if (!db[email]) {
                    showAuthError('Account does not exist. Please create an account first.');
                    return;
                }

                // Verify password
                if (db[email].passwordHash !== hashedPass) {
                    showAuthError('Incorrect password. Please try again.');
                    return;
                }
            }

            // Success — save session and enter app
            localStorage.setItem('iLetterU_session', JSON.stringify(email));
            currentUserEmail = email;

            // Ensure data arrays exist
            if (!db[email].letters) db[email].letters = [];
            if (!db[email].inbox) db[email].inbox = [];
            saveUserDB(db);

            populateUser(db[email]);

            loginScreen.style.animation = 'fadeOut 0.4s ease forwards';
            setTimeout(() => {
                loginScreen.style.display = 'none';
                appContainer.style.display = 'flex';
                appContainer.style.animation = 'fadeIn 0.6s ease';
            }, 400);

        } catch (err) {
            showAuthError('Something went wrong. Please try again.');
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
        }
    });

    let currentProfilePassword = "";
    let currentProfileEmail = "";

    // ==========================================
    // ASSET ARRAYS
    // ==========================================
    const AVATARS = [
        "00943468-7202-4802-AF11-DBEC4D56AFA6.JPEG",
        "083A24EF-2045-4F05-B760-098E061F7EAA.JPEG",
        "1A49B1F3-C2C5-41ED-946F-B88B25BBCFBB.JPEG",
        "1CAA6A67-5122-472A-8602-AFE17728AA8C.JPEG",
        "224BD801-F2D2-4130-B2F4-F68ABA83C807.JPEG",
        "65687E71-F1AB-4382-AD72-D57D41551716.JPEG",
        "6B650109-0589-4BB9-8567-7BC938DFBEEA.JPEG",
        "759D4ED3-F56D-414F-AFA8-28098BA29692.JPEG",
        "7A3D879A-1225-4810-AD64-4AD4BFF4964B.JPEG",
        "7FD962FC-DA9B-4544-848E-C663753ABBD5.JPEG",
        "8631BE5F-7811-4836-9716-5C54DA7176AC.JPEG",
        "BD80A122-02D4-4E9A-B9B0-617003D02410.JPEG",
        "BE560142-D801-4ACA-90DE-06DD9E8F47D9.JPEG",
        "C9048FB9-012C-4980-8E93-9670D63C5B48.JPEG",
        "CA87C237-5D82-49F3-8887-FA63D2527DE8.JPEG"
    ];

    const LETTERS_OPT = [
        "Lett1.PNG",
        "Lett2.PNG",
        "Lett3.JPEG",
        "Lett4.PNG",
        "Lett5.PNG",
        "Lett6.PNG",
        "Lett7.PNG"
    ];

    const LETTER_PROMPTS = [
        "Every story and memory begins with the conversations we share… so start one.",
        "Every story, every memory, starts with a simple conversation… so why not begin yours?",
        "Every story and memory begins with a conversation—so turn yours into a letter meant for someone.",
        "Turn every story and memory into a conversation, written as a letter between hearts.",
        "Every story and memory begins with a conversation—so turn yours into a letter meant for someone."
    ];

    // ==========================================
    // POPULATE USER
    // ==========================================
    function populateUser(data) {
        const badge = document.getElementById('user-badge');
        badge.style.display = 'flex';

        const headerAvaCont = document.getElementById('header-avatar');
        if (headerAvaCont) headerAvaCont.style.display = 'flex';

        const defaultPic = document.getElementById('default-profile-pic');
        const activePic = document.getElementById('active-profile-pic');
        const hActivePic = document.getElementById('header-active-pic');
        const hDefaultPic = document.getElementById('header-default-pic');

        if (data.avatar) {
            activePic.src = "Avatars Imagex/" + data.avatar;
            activePic.style.display = 'block';
            defaultPic.style.display = 'none';
            if (hActivePic && hDefaultPic) {
                hActivePic.src = "Avatars Imagex/" + data.avatar;
                hActivePic.style.display = 'block';
                hDefaultPic.style.display = 'none';
            }
        } else {
            activePic.style.display = 'none';
            defaultPic.style.display = 'flex';
            if (hActivePic && hDefaultPic) {
                hActivePic.style.display = 'none';
                hDefaultPic.style.display = 'flex';
            }
        }

        const nickname = data.nickname || "";
        const nickInput = document.getElementById('nickname-input');
        const profileNickInput = document.getElementById('profile-nickname-input');
        if (nickInput) nickInput.value = nickname;
        if (profileNickInput) profileNickInput.value = nickname;

        renderPhantomNickname(nickInput, document.getElementById('phantom-wavy-display'), "Please create the most silliest nickname", true);
        renderPhantomNickname(profileNickInput, document.getElementById('profile-phantom-wavy'), "Please create the most silliest nickname", false);

        currentProfileEmail = data.email;
        const emailParts = currentProfileEmail.split('@');
        let maskedEmail = currentProfileEmail;
        if (emailParts.length === 2 && emailParts[0].length > 2) {
            maskedEmail = "•".repeat(emailParts[0].length - 2) + emailParts[0].slice(-2) + "@" + emailParts[1];
        }
        document.getElementById('profile-email').innerText = maskedEmail;
        const eToggle = document.getElementById('profile-email-toggle');
        if (eToggle) eToggle.innerText = '👁️';

        // Password is hashed — show locked dots
        currentProfilePassword = "••••••••";
        document.getElementById('profile-password').innerText = "••••••••";
        const pToggle = document.getElementById('profile-pass-toggle');
        if (pToggle) pToggle.innerText = '🔒';

        renderLettersThread(data.letters || []);
        renderInbox(data.inbox || []);
    }

    // ==========================================
    // TOGGLE BUTTONS
    // ==========================================
    const loginToggle = document.getElementById('login-pass-toggle');
    const loginPass = document.getElementById('password');
    if (loginToggle && loginPass) {
        loginToggle.addEventListener('click', () => {
            const type = loginPass.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPass.setAttribute('type', type);
            loginToggle.innerText = type === 'password' ? '👁️' : '🙈';
        });
    }

    const profileToggle = document.getElementById('profile-pass-toggle');
    const profilePass = document.getElementById('profile-password');
    if (profileToggle && profilePass) {
        profileToggle.addEventListener('click', () => {
            // Password is securely hashed — cannot reveal
        });
    }

    const emailToggle = document.getElementById('profile-email-toggle');
    const profileEmailEl = document.getElementById('profile-email');
    if (emailToggle && profileEmailEl) {
        emailToggle.addEventListener('click', () => {
            if (profileEmailEl.innerText.includes("•")) {
                profileEmailEl.innerText = currentProfileEmail;
                emailToggle.innerText = '🙈';
            } else {
                const emailParts = currentProfileEmail.split('@');
                let masked = currentProfileEmail;
                if (emailParts.length === 2 && emailParts[0].length > 2) {
                    masked = "•".repeat(emailParts[0].length - 2) + emailParts[0].slice(-2) + "@" + emailParts[1];
                }
                profileEmailEl.innerText = masked;
                emailToggle.innerText = '👁️';
            }
        });
    }

    // ==========================================
    // AVATAR SELECTION
    // ==========================================
    const avaContainer = document.getElementById('profile-pic-btn');
    const avatarModal = document.getElementById('avatar-modal');
    const closeAvatarBtn = document.getElementById('close-avatar-btn');
    const avatarGrid = document.getElementById('avatar-grid');

    if (avaContainer) {
        avaContainer.addEventListener('click', () => { avatarModal.style.display = 'flex'; });
    }
    if (closeAvatarBtn) {
        closeAvatarBtn.addEventListener('click', () => { avatarModal.style.display = 'none'; });
    }

    if (avatarGrid) {
        AVATARS.forEach(filename => {
            const img = document.createElement('img');
            img.src = `Avatars Imagex/${filename}`;
            img.className = 'avatar-option';
            img.addEventListener('click', () => selectAvatar(filename));
            avatarGrid.appendChild(img);
        });
    }

    function selectAvatar(filename) {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail]) {
            db[currentUserEmail].avatar = filename;
            saveUserDB(db);
            populateUser(db[currentUserEmail]);
            avatarModal.style.display = 'none';
        }
    }

    // ==========================================
    // LETTER THREAD
    // ==========================================
    const letterModal = document.getElementById('letter-modal');
    const closeLetterBtn = document.getElementById('close-letter-btn');
    const letterGrid = document.getElementById('letter-grid');
    const threadContainer = document.getElementById('letters-thread-container');

    if (closeLetterBtn) {
        closeLetterBtn.addEventListener('click', () => { letterModal.style.display = 'none'; });
    }

    if (letterGrid) {
        LETTERS_OPT.forEach(filename => {
            const img = document.createElement('img');
            img.src = `Letters Options/${filename}`;
            img.className = 'avatar-option';
            img.style.aspectRatio = 'auto';
            img.style.maxHeight = '140px';
            img.style.borderRadius = '8px';
            img.addEventListener('click', () => selectLetterBackground(filename));
            letterGrid.appendChild(img);
        });
    }

    function selectLetterBackground(filename) {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail]) {
            if (!db[currentUserEmail].letters) db[currentUserEmail].letters = [];
            const dateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            db[currentUserEmail].letters.push({
                file: filename,
                date: dateStr,
                id: Date.now(),
                content: "",
                fontFamily: "'Caveat', cursive",
                fontSize: "1.3rem"
            });
            saveUserDB(db);
            renderLettersThread(db[currentUserEmail].letters);
            letterModal.style.display = 'none';
        }
    }

    function deleteThreadLetter(id) {
        if (!confirm("Are you sure you want to delete this specific letter?")) return;
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail] && db[currentUserEmail].letters) {
            db[currentUserEmail].letters = db[currentUserEmail].letters.filter(l => l.id !== id);
            saveUserDB(db);
            renderLettersThread(db[currentUserEmail].letters);
        }
    }

    function renderLettersThread(lettersArray) {
        if (!threadContainer) return;
        threadContainer.innerHTML = '';

        (lettersArray || []).forEach(letterObj => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'thread-item';

            const topBar = document.createElement('div');
            topBar.className = 'letter-top-bar';

            const dateDiv = document.createElement('div');
            dateDiv.className = 'letter-date';
            dateDiv.innerText = letterObj.date.split(',').slice(0, 2).join(',').trim();

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-letter-btn';
            delBtn.innerText = '✕';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteThreadLetter(letterObj.id);
            });

            const img = document.createElement('img');
            img.src = `Letters Options/${letterObj.file}`;
            img.className = 'chosen-letter';
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => openLetterWriter(letterObj.id));

            topBar.appendChild(dateDiv);
            topBar.appendChild(delBtn);
            itemDiv.appendChild(topBar);
            itemDiv.appendChild(img);
            threadContainer.appendChild(itemDiv);
        });

        const promptDiv = document.createElement('div');
        promptDiv.className = 'letter-prompt-box';
        promptDiv.innerText = "Pick your letter!";
        promptDiv.addEventListener('click', () => { letterModal.style.display = 'flex'; });
        threadContainer.appendChild(promptDiv);
    }

    // ==========================================
    // INFINITE PAPER WRITER
    // ==========================================
    const paperAudio = document.getElementById('paper-sound');
    if (paperAudio) paperAudio.volume = 0.6;

    const writerModal = document.getElementById('writer-modal');
    const writerContent = document.getElementById('writer-content');
    const writerFontOpt = document.getElementById('writer-font-opt');
    const writerSizeOpt = document.getElementById('writer-size-opt');
    const closeWriterBtn = document.getElementById('close-writer-btn');
    const writerPaperMiddle = document.getElementById('writer-paper-middle');
    const writerTopImg = document.getElementById('writer-top-img');
    const writerBottomImg = document.getElementById('writer-bottom-img');
    const writerScrollArea = document.getElementById('writer-scroll-area');

    let activeEditorId = null;
    let activeLetterFile = null;

    if (closeWriterBtn) {
        closeWriterBtn.addEventListener('click', () => {
            if (paperAudio) {
                paperAudio.currentTime = 0;
                paperAudio.play().catch(() => {});
            }
            writerModal.style.display = 'none';
            activeEditorId = null;
            activeLetterFile = null;
        });
    }

    function openLetterWriter(id) {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (!db[currentUserEmail] || !db[currentUserEmail].letters) return;

        const letterData = db[currentUserEmail].letters.find(l => l.id === id);
        if (!letterData) return;

        // Random quote
        const randomQuote = LETTER_PROMPTS[Math.floor(Math.random() * LETTER_PROMPTS.length)];
        writerContent.setAttribute('data-placeholder', randomQuote);

        // Sound
        if (paperAudio) {
            paperAudio.currentTime = 0;
            paperAudio.play().catch(() => {});
        }

        activeEditorId = id;
        activeLetterFile = letterData.file;

        // Set letter covers
        const letterImgPath = `Letters Options/${letterData.file}`;
        writerTopImg.src = letterImgPath;
        writerBottomImg.src = letterImgPath;

        // Load content
        writerContent.innerText = letterData.content || "";

        // Load font/size with defaults
        writerFontOpt.value = letterData.fontFamily || "'Caveat', cursive";
        writerSizeOpt.value = letterData.fontSize || "1.3rem";

        // Apply styles
        writerContent.style.fontFamily = writerFontOpt.value;
        writerContent.style.fontSize = writerSizeOpt.value;

        writerModal.style.display = 'flex';

        // Auto-resize paper
        requestAnimationFrame(autoResizePaper);
    }

    // Make available globally
    window.openLetterWriter = openLetterWriter;

    // Auto-resize paper middle to fit content
    function autoResizePaper() {
        if (!writerContent || !writerPaperMiddle) return;
        const contentHeight = writerContent.scrollHeight;
        const minHeight = 500;
        writerPaperMiddle.style.minHeight = Math.max(minHeight, contentHeight + 80) + 'px';
    }

    // Contenteditable autosave + auto-resize
    if (writerContent) {
        writerContent.addEventListener('input', () => {
            saveActiveLetterProperty('content', writerContent.innerText);
            autoResizePaper();
        });

        writerContent.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertText', false, '    ');
                saveActiveLetterProperty('content', writerContent.innerText);
            }
        });
    }

    // Click anywhere on the paper to focus the editor
    if (writerPaperMiddle && writerContent) {
        writerPaperMiddle.addEventListener('click', (e) => {
            if (e.target === writerPaperMiddle) {
                writerContent.focus();
                const sel = window.getSelection();
                sel.selectAllChildren(writerContent);
                sel.collapseToEnd();
            }
        });
    }

    if (writerFontOpt) {
        writerFontOpt.addEventListener('change', () => {
            writerContent.style.fontFamily = writerFontOpt.value;
            saveActiveLetterProperty('fontFamily', writerFontOpt.value);
        });
    }

    if (writerSizeOpt) {
        writerSizeOpt.addEventListener('change', () => {
            writerContent.style.fontSize = writerSizeOpt.value;
            saveActiveLetterProperty('fontSize', writerSizeOpt.value);
            requestAnimationFrame(autoResizePaper);
        });
    }

    function saveActiveLetterProperty(key, value) {
        if (!activeEditorId || !currentUserEmail) return;
        const db = getUsersDB();
        const letterIndex = db[currentUserEmail].letters.findIndex(l => l.id === activeEditorId);
        if (letterIndex !== -1) {
            db[currentUserEmail].letters[letterIndex][key] = value;
            saveUserDB(db);
        }
    }

    // ==========================================
    // SHARE SYSTEM
    // ==========================================
    const shareModal = document.getElementById('share-modal');
    const closeShareBtn = document.getElementById('close-share-btn');
    const shareOpenBtn = document.getElementById('share-open-btn');
    const shareScheduleToggle = document.getElementById('share-schedule-toggle');
    const shareScheduleOptions = document.getElementById('share-schedule-options');
    const shareCodeInput = document.getElementById('share-code-input');
    const shareCodeGen = document.getElementById('share-code-gen');
    const shareGenerateBtn = document.getElementById('share-generate-btn');
    const shareLinkBox = document.getElementById('share-link-box');
    const shareLinkText = document.getElementById('share-link-text');
    const shareCopyBtn = document.getElementById('share-copy-btn');
    const shareCopyFeedback = document.getElementById('share-copy-feedback');

    if (shareOpenBtn) {
        shareOpenBtn.addEventListener('click', () => {
            if (!activeEditorId) return;
            shareModal.style.display = 'flex';
            shareLinkBox.style.display = 'none';
            shareCopyFeedback.style.display = 'none';
        });
    }

    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', () => { shareModal.style.display = 'none'; });
    }

    if (shareScheduleToggle) {
        shareScheduleToggle.addEventListener('change', () => {
            shareScheduleOptions.style.display = shareScheduleToggle.checked ? 'flex' : 'none';
        });
    }

    // Auto-generate code
    if (shareCodeGen) {
        shareCodeGen.addEventListener('click', () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            shareCodeInput.value = code;
        });
    }

    // Generate share link
    if (shareGenerateBtn) {
        shareGenerateBtn.addEventListener('click', () => {
            if (!activeEditorId || !currentUserEmail) return;

            const db = getUsersDB();
            const letterData = db[currentUserEmail].letters.find(l => l.id === activeEditorId);
            if (!letterData) return;

            const secretCode = shareCodeInput.value.trim();
            if (!secretCode) {
                alert('Please enter a secret code or click Auto to generate one.');
                return;
            }

            // Build share payload
            const payload = {
                content: letterData.content || '',
                letterFile: letterData.file,
                fontFamily: letterData.fontFamily || "'Caveat', cursive",
                fontSize: letterData.fontSize || "1.3rem",
                secretCode: secretCode
            };

            // Schedule
            if (shareScheduleToggle.checked) {
                const datetime = document.getElementById('share-datetime').value;
                const timezone = document.getElementById('share-timezone').value;
                if (datetime) {
                    const localDate = new Date(datetime);
                    payload.scheduledTime = localDate.toISOString();
                    payload.scheduledTimezone = timezone;
                }
            }

            // Unlock message
            const unlockMsg = document.getElementById('share-unlock-msg').value.trim();
            if (unlockMsg) {
                payload.unlockMessage = unlockMsg;
                payload.unlockStyle = {
                    font: document.getElementById('share-msg-font').value,
                    color: document.getElementById('share-msg-color').value,
                    size: document.getElementById('share-msg-size').value
                };
            }

            // Compress and encode
            const jsonStr = JSON.stringify(payload);
            const compressed = window.LZString.compressToEncodedURIComponent(jsonStr);

            // Build URL
            const baseUrl = window.location.href.replace(/\/[^\/]*$/, '/');
            const shareUrl = baseUrl + 'share.html#data=' + compressed;

            shareLinkText.value = shareUrl;
            shareLinkBox.style.display = 'block';
            shareCopyFeedback.style.display = 'none';
        });
    }

    // Copy link
    if (shareCopyBtn) {
        shareCopyBtn.addEventListener('click', () => {
            shareLinkText.select();
            navigator.clipboard.writeText(shareLinkText.value).then(() => {
                shareCopyFeedback.style.display = 'block';
                setTimeout(() => { shareCopyFeedback.style.display = 'none'; }, 3000);
            }).catch(() => {
                document.execCommand('copy');
                shareCopyFeedback.style.display = 'block';
            });
        });
    }

    // ==========================================
    // INBOX / MAILBOX
    // ==========================================
    function renderInbox(inboxArray) {
        const inboxList = document.getElementById('inbox-letters-list');
        if (!inboxList) return;
        inboxList.innerHTML = '';

        if (!inboxArray || inboxArray.length === 0) {
            inboxList.innerHTML = `
                <div class="inbox-empty">
                    <div class="inbox-empty-icon">📭</div>
                    <p>No letters yet.<br>When someone shares a letter with you, it will appear here.</p>
                </div>
            `;
            return;
        }

        inboxArray.forEach(item => {
            const div = document.createElement('div');
            div.className = 'inbox-item';
            div.innerHTML = `
                <div class="inbox-item-header">
                    <span>💌 Letter</span>
                    <span class="inbox-item-date">${item.receivedDate || ''}</span>
                </div>
                <p class="inbox-item-preview">${(item.content || '').substring(0, 100)}${(item.content || '').length > 100 ? '...' : ''}</p>
            `;
            div.addEventListener('click', () => {
                openReadOnlyLetter(item);
            });
            inboxList.appendChild(div);
        });
    }

    function openReadOnlyLetter(letterItem) {
        const letterImgPath = `Letters Options/${letterItem.letterFile || letterItem.file || ''}`;
        writerTopImg.src = letterImgPath;
        writerBottomImg.src = letterImgPath;
        writerContent.innerText = letterItem.content || '';
        writerContent.contentEditable = 'false';
        writerContent.style.fontFamily = letterItem.fontFamily || "'Caveat', cursive";
        writerContent.style.fontSize = letterItem.fontSize || "1.3rem";
        writerModal.style.display = 'flex';
        activeEditorId = null;

        requestAnimationFrame(autoResizePaper);

        const restoreHandler = () => {
            writerContent.contentEditable = 'true';
            closeWriterBtn.removeEventListener('click', restoreHandler);
        };
        closeWriterBtn.addEventListener('click', restoreHandler);
    }

    // ==========================================
    // NICKNAME SYSTEM
    // ==========================================
    const nickInput = document.getElementById('nickname-input');
    const profileNickInput = document.getElementById('profile-nickname-input');

    if (nickInput) {
        nickInput.addEventListener('input', (e) => unifyNicknames(e.target.value));
    }
    if (profileNickInput) {
        profileNickInput.addEventListener('input', (e) => unifyNicknames(e.target.value));
    }

    window.unifyNicknames = function (newVal) {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail]) {
            db[currentUserEmail].nickname = newVal;
            saveUserDB(db);
        }
        if (nickInput && nickInput.value !== newVal) nickInput.value = newVal;
        if (profileNickInput && profileNickInput.value !== newVal) profileNickInput.value = newVal;

        renderPhantomNickname(nickInput, document.getElementById('phantom-wavy-display'), "Please create the most silliest nickname", true);
        renderPhantomNickname(profileNickInput, document.getElementById('profile-phantom-wavy'), "Please create the most silliest nickname", false);
    };

    window.renderPhantomNickname = function (inputEl, phantomEl, placeholderText, scaleWidth) {
        if (!inputEl || !phantomEl) return;
        const isPlaceholder = !inputEl.value;
        const textToMeasure = inputEl.value || placeholderText;

        if (scaleWidth) {
            inputEl.style.width = (textToMeasure.length + 1) + "ch";
        }

        phantomEl.innerHTML = '';
        [...textToMeasure].forEach((char, idx) => {
            const sp = document.createElement('span');
            sp.innerText = char === ' ' ? '\u00A0' : char;
            sp.className = 'wave-letter';
            if (isPlaceholder) {
                sp.style.opacity = '0.5';
                sp.style.fontStyle = 'italic';
            }
            sp.style.animationDelay = `${idx * 0.05}s`;
            phantomEl.appendChild(sp);
        });
    };

    const blurHandler = () => {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail]) saveUserDB(db);
    };

    if (nickInput) {
        nickInput.addEventListener('blur', blurHandler);
        nickInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') nickInput.blur(); });
    }
    if (profileNickInput) {
        profileNickInput.addEventListener('blur', blurHandler);
        profileNickInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') profileNickInput.blur(); });
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    let lastActiveView = 'view-home';

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const viewId = 'view-' + btn.innerText.trim().toLowerCase();
            lastActiveView = viewId;

            document.querySelectorAll('.view-section').forEach(v => { v.style.display = 'none'; });
            const targetView = document.getElementById(viewId);
            if (targetView) targetView.style.display = 'block';
        });
    });

    // Logo click → go to Home
    const logoHomeBtn = document.getElementById('logo-home-btn');
    if (logoHomeBtn) {
        logoHomeBtn.addEventListener('click', () => {
            document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
            const homeView = document.getElementById('view-home');
            if (homeView) homeView.style.display = 'block';
            lastActiveView = 'view-home';
            navBtns.forEach(b => b.classList.remove('active'));
            if (navBtns[0]) navBtns[0].classList.add('active');
        });
    }

    // Header avatar → profile toggle
    const headerAvatarBtn = document.getElementById('header-avatar');
    if (headerAvatarBtn) {
        headerAvatarBtn.addEventListener('click', () => {
            const profileView = document.getElementById('view-profile');
            if (profileView && profileView.style.display === 'block') {
                document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
                const targetView = document.getElementById(lastActiveView);
                if (targetView) targetView.style.display = 'block';
                navBtns.forEach(b => {
                    if ('view-' + b.innerText.trim().toLowerCase() === lastActiveView) {
                        b.classList.add('active');
                    }
                });
            } else {
                document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
                if (profileView) profileView.style.display = 'block';
                navBtns.forEach(b => b.classList.remove('active'));
            }
        });
    }

    // ==========================================
    // LOGOUT
    // ==========================================
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const logout = confirm('Are you sure you want to log out?');
            if (logout) {
                localStorage.removeItem('iLetterU_session');
                currentUserEmail = null;
                appContainer.style.display = 'none';
                loginScreen.style.display = 'flex';
                loginScreen.style.animation = 'fadeIn 0.6s ease';
                loginForm.reset();
                setAuthMode(false);
                document.getElementById('user-badge').style.display = 'none';
                if (document.getElementById('header-avatar')) document.getElementById('header-avatar').style.display = 'none';

                lastActiveView = 'view-home';
                document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
                document.getElementById('view-home').style.display = 'block';
                navBtns.forEach(b => b.classList.remove('active'));
                navBtns[0].classList.add('active');
            }
        });
    }

    console.log('iLetterU Postal App initialized!');
});
