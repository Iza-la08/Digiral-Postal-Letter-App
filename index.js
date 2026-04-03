document.addEventListener('DOMContentLoaded', () => {
    // Navigation and Elements setup
    const navBtns = document.querySelectorAll('.nav-btn');
    const appContainer = document.getElementById('app');
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');
    let currentUserEmail = null;

    // Helper functions for DB
    function getUsersDB() {
        const dbStr = localStorage.getItem('iLetterU_usersDB');
        return dbStr ? JSON.parse(dbStr) : {};
    }
    
    function saveUserDB(db) {
        localStorage.setItem('iLetterU_usersDB', JSON.stringify(db));
    }

    // 1. Session check on load
    const savedStr = localStorage.getItem('iLetterU_session');
    if (savedStr) {
        try {
            const sessionEmail = JSON.parse(savedStr);
            const db = getUsersDB();
            if(db[sessionEmail]) {
                currentUserEmail = sessionEmail;
                populateUser(db[currentUserEmail]);
                loginScreen.style.display = 'none';
                appContainer.style.display = 'flex';
            }
        } catch(e) {}
    }

    // 2. Handle Login Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            const db = getUsersDB();
            // Initialize or update user
            if (!db[email]) {
                db[email] = { email: email, password: password, nickname: "", letters: [] };
            } else {
                db[email].password = password; 
            }
            saveUserDB(db);

            // Establish Local Session
            localStorage.setItem('iLetterU_session', JSON.stringify(email));
            currentUserEmail = email;
            
            populateUser(db[email]);

            // Transition beautifully
            loginScreen.style.animation = 'fadeOut 0.4s ease forwards';
            setTimeout(() => {
                loginScreen.style.display = 'none';
                appContainer.style.display = 'flex';
                appContainer.style.animation = 'fadeIn 0.6s ease';
            }, 400);
        }
    });

    let currentProfilePassword = "";
    let currentProfileEmail = "";
    
    // Hardcoded List from Avatars Imagex folder
    const AVATARS = [
        "00943468-7202-4802-AF11-DBEC4D56AFA6.JPEG",
        "083A24EF-2045-4F05-B760-098E061F7EAA.JPEG",
        "1A49B1F3-C2C5-41ED-946F-B88B25BBCFBB.JPEG",
        "6B650109-0589-4BB9-8567-7BC938DFBEEA.JPEG",
        "759D4ED3-F56D-414F-AFA8-28098BA29692.JPEG",
        "7FD962FC-DA9B-4544-848E-C663753ABBD5.JPEG",
        "BD80A122-02D4-4E9A-B9B0-617003D02410.JPEG",
        "BE560142-D801-4ACA-90DE-06DD9E8F47D9.JPEG",
        "CA87C237-5D82-49F3-8887-FA63D2527DE8.JPEG"
    ];

    const LETTERS_OPT = [
        "0332225D-658A-41E3-96B4-1A02F576021B.PNG",
        "22526E2A-A1CF-4C8E-BE36-89240A38DCAA.PNG",
        "31680764-45F4-4434-8382-BD45488FB058.PNG",
        "491FF327-9B1F-4E23-8898-EC322F5A2D9C.PNG",
        "4F7B763F-3324-4F2E-B81E-EFF7FA08A395.PNG",
        "53D87EF8-6E50-46FC-A35D-C5EC146CF76F.PNG",
        "D3A73407-E073-4D29-BF06-E787D606FFB9.PNG",
        "F5EDF3F8-006F-4FAD-842B-A2019A410431.PNG"
    ];

    const LETTER_PROMPTS = [
        "Every story and memory begins with the conversations we share… so start one.",
        "Every story, every memory, starts with a simple conversation… so why not begin yours?",
        "Every story and memory begins with a conversation—so turn yours into a letter meant for someone.",
        "Turn every story and memory into a conversation, written as a letter between hearts.",
        "Every story and memory begins with a conversation—so turn yours into a letter meant for someone."
    ];

    // Populate user helper
    function populateUser(data) {
        const badge = document.getElementById('user-badge');
        badge.style.display = 'flex';
        
        const headerAvaCont = document.getElementById('header-avatar');
        if(headerAvaCont) headerAvaCont.style.display = 'flex';

        // Set Avatar Picture
        const defaultPic = document.getElementById('default-profile-pic');
        const activePic = document.getElementById('active-profile-pic');
        const hActivePic = document.getElementById('header-active-pic');
        const hDefaultPic = document.getElementById('header-default-pic');

        if (data.avatar) {
            activePic.src = "Avatars Imagex/" + data.avatar;
            activePic.style.display = 'block';
            defaultPic.style.display = 'none';
            if(hActivePic && hDefaultPic) {
                hActivePic.src = "Avatars Imagex/" + data.avatar;
                hActivePic.style.display = 'block';
                hDefaultPic.style.display = 'none';
            }
        } else {
            activePic.style.display = 'none';
            defaultPic.style.display = 'flex';
            if(hActivePic && hDefaultPic) {
                hActivePic.style.display = 'none';
                hDefaultPic.style.display = 'flex';
            }
        }

        const nickname = data.nickname || "";
        
        const nickInput = document.getElementById('nickname-input');
        const profileNickInput = document.getElementById('profile-nickname-input');
        if(nickInput) nickInput.value = nickname;
        if(profileNickInput) profileNickInput.value = nickname;

        renderPhantomNickname(nickInput, document.getElementById('phantom-wavy-display'), "Please create the most silliest nickname", true);
        renderPhantomNickname(profileNickInput, document.getElementById('profile-phantom-wavy'), "Please create the most silliest nickname", false);
        
        // Obfuscating email for presentation
        currentProfileEmail = data.email;
        const emailParts = currentProfileEmail.split('@');
        let maskedEmail = currentProfileEmail;
        if (emailParts.length === 2 && emailParts[0].length > 2) {
            maskedEmail = "•".repeat(emailParts[0].length - 2) + emailParts[0].slice(-2) + "@" + emailParts[1];
        }
        document.getElementById('profile-email').innerText = maskedEmail;
        const eToggle = document.getElementById('profile-email-toggle');
        if(eToggle) eToggle.innerText = '👁️';

        // Obfuscating password for presentation
        currentProfilePassword = data.password;
        document.getElementById('profile-password').innerText = "•".repeat(data.password.length);
        const pToggle = document.getElementById('profile-pass-toggle');
        if(pToggle) pToggle.innerText = '👁️';

        renderLettersThread(data.letters || []);
    }

    // Toggle logic for Login password
    const loginToggle = document.getElementById('login-pass-toggle');
    const loginPass = document.getElementById('password');
    if (loginToggle && loginPass) {
        loginToggle.addEventListener('click', () => {
            const type = loginPass.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPass.setAttribute('type', type);
            loginToggle.innerText = type === 'password' ? '👁️' : '🙈';
        });
    }

    // Toggle logic for Profile password
    const profileToggle = document.getElementById('profile-pass-toggle');
    const profilePass = document.getElementById('profile-password');
    if (profileToggle && profilePass) {
        profileToggle.addEventListener('click', () => {
            if (profilePass.innerText.includes("•")) {
                profilePass.innerText = currentProfilePassword;
                profileToggle.innerText = '🙈';
            } else {
                profilePass.innerText = "•".repeat(currentProfilePassword.length);
                profileToggle.innerText = '👁️';
            }
        });
    }

    // Toggle logic for Profile Email
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

    // Avatar logic
    const avaContainer = document.getElementById('profile-pic-btn');
    const avatarModal = document.getElementById('avatar-modal');
    const closeAvatarBtn = document.getElementById('close-avatar-btn');
    const avatarGrid = document.getElementById('avatar-grid');

    if (avaContainer) {
        avaContainer.addEventListener('click', () => {
            avatarModal.style.display = 'flex';
        });
    }

    if (closeAvatarBtn) {
        closeAvatarBtn.addEventListener('click', () => {
            avatarModal.style.display = 'none';
        });
    }

    if (avatarGrid) {
        AVATARS.forEach(filename => {
            const img = document.createElement('img');
            img.src = `Avatars Imagex/${filename}`;
            img.className = 'avatar-option';
            img.addEventListener('click', () => {
                selectAvatar(filename);
            });
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

    // --- Letter Thread Logic ---
    const letterModal = document.getElementById('letter-modal');
    const closeLetterBtn = document.getElementById('close-letter-btn');
    const letterGrid = document.getElementById('letter-grid');
    const threadContainer = document.getElementById('letters-thread-container');

    if (closeLetterBtn) {
        closeLetterBtn.addEventListener('click', () => {
            letterModal.style.display = 'none';
        });
    }

    if (letterGrid) {
        LETTERS_OPT.forEach(filename => {
            const img = document.createElement('img');
            img.src = `Letters Options/${filename}`;
            img.className = 'avatar-option'; 
            img.style.aspectRatio = 'auto'; // Disable 1:1 circle rule for letter tiles
            img.style.maxHeight = '140px'; 
            img.style.borderRadius = '8px';
            img.addEventListener('click', () => {
                selectLetterBackground(filename);
            });
            letterGrid.appendChild(img);
        });
    }

    function selectLetterBackground(filename) {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail]) {
            if(!db[currentUserEmail].letters) db[currentUserEmail].letters = [];
            
            const dateStr = new Date().toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'});
            
            db[currentUserEmail].letters.push({
                file: filename,
                date: dateStr,
                id: Date.now()
            });
            saveUserDB(db);
            renderLettersThread(db[currentUserEmail].letters);
            letterModal.style.display = 'none';
        }
    }

    function deleteThreadLetter(id) {
        if(!confirm("Are you sure you want to delete this specific letter?")) return;
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail] && db[currentUserEmail].letters) {
            db[currentUserEmail].letters = db[currentUserEmail].letters.filter(l => l.id !== id);
            saveUserDB(db);
            renderLettersThread(db[currentUserEmail].letters);
        }
    }

    function renderLettersThread(lettersArray) {
        if(!threadContainer) return;
        threadContainer.innerHTML = '';

        (lettersArray || []).forEach(letterObj => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'thread-item';

            const topBar = document.createElement('div');
            topBar.className = 'letter-top-bar';

            const dateDiv = document.createElement('div');
            dateDiv.className = 'letter-date';
            // Ensure old entries strip explicit minutes/hours format, preserving clean logic
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
            img.addEventListener('click', () => {
                openLetterWriter(letterObj.id);
            });

            topBar.appendChild(dateDiv);
            topBar.appendChild(delBtn);
            itemDiv.appendChild(topBar);
            itemDiv.appendChild(img);
            
            threadContainer.appendChild(itemDiv);
        });

        // Always append infinite chaining box
        const promptDiv = document.createElement('div');
        promptDiv.className = 'letter-prompt-box';
        promptDiv.innerText = "Pick your letter!";
        promptDiv.addEventListener('click', () => {
            letterModal.style.display = 'flex';
        });
        
        threadContainer.appendChild(promptDiv);
    }

    // --- Letter Writer UI & Autosave Features ---
    const paperAudio = document.getElementById('paper-sound');
    if (paperAudio) {
        paperAudio.volume = 0.6; // Scale down 60% as requested
    }
    const writerModal = document.getElementById('writer-modal');
    const writerTextarea = document.getElementById('writer-textarea');
    const writerFontOpt = document.getElementById('writer-font-opt');
    const writerSizeOpt = document.getElementById('writer-size-opt');
    const closeWriterBtn = document.getElementById('close-writer-btn');

    let activeEditorId = null;

    if (closeWriterBtn) {
        closeWriterBtn.addEventListener('click', () => {
            // Play authentic paper sound exclusively on fold (close)
            if(paperAudio) {
                paperAudio.currentTime = 0;
                paperAudio.play().catch(e=>console.log(e));
            }
            writerModal.style.display = 'none';
            activeEditorId = null;
        });
    }

    window.openLetterWriter = function(id) {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (!db[currentUserEmail] || !db[currentUserEmail].letters) return;
        
        const letterData = db[currentUserEmail].letters.find(l => l.id === id);
        if(!letterData) return;

        // Apply a random immersive quote
        const randomQuote = LETTER_PROMPTS[Math.floor(Math.random() * LETTER_PROMPTS.length)];
        writerTextarea.placeholder = randomQuote;

        // Play authentic paper sound
        if(paperAudio) {
            paperAudio.currentTime = 0;
            paperAudio.play().catch(e=>console.log(e));
        }

        activeEditorId = id;
        
        // Load persistent data formatting or default setup
        writerTextarea.value = letterData.content || "";
        writerFontOpt.value = letterData.fontFamily || "'Inter', sans-serif";
        writerSizeOpt.value = letterData.fontSize || "1.3rem";

        // Apply physical visual attributes to canvas instantly
        writerTextarea.style.fontFamily = writerFontOpt.value;
        writerTextarea.style.fontSize = writerSizeOpt.value;

        writerModal.style.display = 'flex';
    };

    // Passive Keylogging Autosave engine
    if (writerTextarea) {
        writerTextarea.addEventListener('input', () => {
            saveActiveLetterProperty('content', writerTextarea.value);
        });

        // Advanced internal keyboard functionality (Default Editor Systems)
        writerTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault(); // Stop cursor leaving box

                const start = writerTextarea.selectionStart;
                const end = writerTextarea.selectionEnd;

                // Splice exactly 4 native spaces logically directly onto the string map dynamically 
                writerTextarea.value = writerTextarea.value.substring(0, start) + "    " + writerTextarea.value.substring(end);

                // Seamless cursor positioning correction
                writerTextarea.selectionStart = writerTextarea.selectionEnd = start + 4;

                // Sync internal backend sequence bypassing explicit keystroke logic
                saveActiveLetterProperty('content', writerTextarea.value);
            }
        });
    }
    // Record Toolbar dropdown updates globally
    if (writerFontOpt) {
        writerFontOpt.addEventListener('change', () => {
            writerTextarea.style.fontFamily = writerFontOpt.value;
            saveActiveLetterProperty('fontFamily', writerFontOpt.value);
        });
    }
    if (writerSizeOpt) {
        writerSizeOpt.addEventListener('change', () => {
            writerTextarea.style.fontSize = writerSizeOpt.value;
            saveActiveLetterProperty('fontSize', writerSizeOpt.value);
        });
    }

    function saveActiveLetterProperty(key, value) {
        if (!activeEditorId || !currentUserEmail) return;
        const db = getUsersDB();
        const letterIndex = db[currentUserEmail].letters.findIndex(l => l.id === activeEditorId);
        if(letterIndex !== -1) {
            db[currentUserEmail].letters[letterIndex][key] = value;
            saveUserDB(db);
        }
    }

    // Unified Nickname Controller Logic
    const nickInput = document.getElementById('nickname-input');
    const profileNickInput = document.getElementById('profile-nickname-input');
    
    if (nickInput) {
        nickInput.addEventListener('input', (e) => {
            unifyNicknames(e.target.value);
        });
    }

    if (profileNickInput) {
        profileNickInput.addEventListener('input', (e) => {
            unifyNicknames(e.target.value);
        });
    }

    // Centrally ties the entire ecosystem ensuring inputs dynamically mirror arrays cross-component
    window.unifyNicknames = function(newVal) {
        if (!currentUserEmail) return;
        const db = getUsersDB();
        if (db[currentUserEmail]) {
            db[currentUserEmail].nickname = newVal;
            saveUserDB(db);
        }

        if(nickInput && nickInput.value !== newVal) nickInput.value = newVal;
        if(profileNickInput && profileNickInput.value !== newVal) profileNickInput.value = newVal;

        renderPhantomNickname(nickInput, document.getElementById('phantom-wavy-display'), "Please create the most silliest nickname", true);
        renderPhantomNickname(profileNickInput, document.getElementById('profile-phantom-wavy'), "Please create the most silliest nickname", false);
    };

    // Shared Phantom Generator API rendering sequential CSS animations overlaying inputs completely!
    window.renderPhantomNickname = function(inputEl, phantomEl, placeholderText, scaleWidth) {
        if(!inputEl || !phantomEl) return;
        
        const isPlaceholder = !inputEl.value;
        const textToMeasure = inputEl.value || placeholderText;
        
        if(scaleWidth) {
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
            // Generate sequence sequentially natively!
            sp.style.animationDelay = `${idx * 0.05}s`;
            phantomEl.appendChild(sp);
        });
    };

    const blurHandler = () => {
        if(!currentUserEmail) return;
        const db = getUsersDB();
        if(db[currentUserEmail]) saveUserDB(db);
    };

    if(nickInput) {
        nickInput.addEventListener('blur', blurHandler);
        nickInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') nickInput.blur();
        });
    }
    if(profileNickInput) {
        profileNickInput.addEventListener('blur', blurHandler);
        profileNickInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') profileNickInput.blur();
        });
    }

    // 3. Navigation interaction (Swapping Views)
    let lastActiveView = 'view-home';
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const viewId = 'view-' + btn.innerText.trim().toLowerCase();
            lastActiveView = viewId;
            
            document.querySelectorAll('.view-section').forEach(v => {
                v.style.display = 'none';
            });
            const targetView = document.getElementById(viewId);
            if(targetView) targetView.style.display = 'block';
        });
    });

    // Navigate to Profile via Header Avatar (Toggle)
    const headerAvatarBtn = document.getElementById('header-avatar');
    if (headerAvatarBtn) {
        headerAvatarBtn.addEventListener('click', () => {
            const profileView = document.getElementById('view-profile');
            
            // If already open, close it and return to previous view
            if (profileView && profileView.style.display === 'block') {
                document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
                
                const targetView = document.getElementById(lastActiveView);
                if(targetView) targetView.style.display = 'block';
                
                // Re-enable correct lower nav glow
                navBtns.forEach(b => {
                    if ('view-' + b.innerText.trim().toLowerCase() === lastActiveView) {
                        b.classList.add('active');
                    }
                });
            } else {
                // Open Profile normally
                document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
                if(profileView) profileView.style.display = 'block';
                
                // Turn off lower nav glow
                navBtns.forEach(b => b.classList.remove('active'));
            }
        });
    }

    // 4. Logout handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const logout = confirm(`Are you sure you want to log out?`);
            if (logout) {
                // Wipe active session but keep the user database
                localStorage.removeItem('iLetterU_session');
                currentUserEmail = null;
                
                appContainer.style.display = 'none';
                loginScreen.style.display = 'flex';
                loginScreen.style.animation = 'fadeIn 0.6s ease';
                loginForm.reset();
                document.getElementById('user-badge').style.display = 'none';
                if(document.getElementById('header-avatar')) document.getElementById('header-avatar').style.display = 'none';
                
                // Reset views for next login
                lastActiveView = 'view-home';
                document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
                document.getElementById('view-home').style.display = 'block';
                navBtns.forEach(b => b.classList.remove('active'));
                navBtns[0].classList.add('active');
            }
        });
    }

    console.log('Postal App initialized!');
});
