/* ==========================================
   iLetterU — Share Page Logic
   Handles: URL decoding, countdown, confetti,
   code validation, and letter rendering
   ========================================== */

// --- LZ-String Compression Library (minimal, exposed globally) ---
window.LZString = (function() {
        const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        const baseReverseDic = {};

        function getBaseValue(alphabet, character) {
            if (!baseReverseDic[alphabet]) {
                baseReverseDic[alphabet] = {};
                for (let i = 0; i < alphabet.length; i++) {
                    baseReverseDic[alphabet][alphabet.charAt(i)] = i;
                }
            }
            return baseReverseDic[alphabet][character];
        }

        function _compress(uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            let i, value, ii, context_dictionary = {}, context_dictionaryToCreate = {},
                context_c = "", context_wc = "", context_w = "",
                context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2,
                context_data = [], context_data_val = 0, context_data_position = 0;

            for (ii = 0; ii < uncompressed.length; ii++) {
                context_c = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }
                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                    context_w = context_wc;
                } else {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else { context_data_position++; }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else { context_data_position++; }
                                value = value >> 1;
                            }
                        } else {
                            value = 1;
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else { context_data_position++; }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else { context_data_position++; }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    } else {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else { context_data_position++; }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }
            if (context_w !== "") {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; }
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; }
                            value = value >> 1;
                        }
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; }
                        value = value >> 1;
                    }
                }
            }
            value = 2;
            for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0; } else { context_data_position++; }
                value = value >> 1;
            }
            while (true) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar - 1) { context_data.push(getCharFromInt(context_data_val)); break; }
                else context_data_position++;
            }
            return context_data.join('');
        }

        function _decompress(length, resetValue, getNextValue) {
            let dictionary = [], enlargeIn = 4, dictSize = 4, numBits = 3,
                entry = "", result = [], i, w, c, bits, resb, maxpower, power,
                data = { val: getNextValue(0), position: resetValue, index: 1 };

            for (i = 0; i < 3; i++) dictionary[i] = i;
            bits = 0; maxpower = Math.pow(2, 2); power = 1;
            while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            switch (bits) {
                case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position; data.position >>= 1;
                        if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                        bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
                    }
                    c = String.fromCharCode(bits); break;
                case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position; data.position >>= 1;
                        if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                        bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
                    }
                    c = String.fromCharCode(bits); break;
                case 2: return "";
            }
            dictionary[3] = c; w = c; result.push(c);
            while (true) {
                if (data.index > length) return "";
                bits = 0; maxpower = Math.pow(2, numBits); power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position; data.position >>= 1;
                    if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                    bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
                }
                switch (c = bits) {
                    case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position; data.position >>= 1;
                            if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                            bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
                        }
                        dictionary[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
                    case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position; data.position >>= 1;
                            if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
                            bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
                        }
                        dictionary[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--; break;
                    case 2: return result.join('');
                }
                if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
                if (dictionary[c]) { entry = dictionary[c]; }
                else if (c === dictSize) { entry = w + w.charAt(0); }
                else { return null; }
                result.push(entry);
                dictionary[dictSize++] = w + entry.charAt(0);
                enlargeIn--;
                if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
                w = entry;
            }
        }

        return {
            compressToEncodedURIComponent: function(input) {
                if (input == null) return "";
                return _compress(input, 6, function(a) {
                    return keyStr.charAt(a);
                }) + (input.length % 2 === 0 ? "=" : "");
            },
            decompressFromEncodedURIComponent: function(input) {
                if (input == null) return "";
                if (input === "") return null;
                input = input.replace(/ /g, "+");
                return _decompress(input.length, 32, function(index) {
                    return getBaseValue(keyStr, input.charAt(index));
                });
            }
        };
    })();

// Only run share page logic if share.html elements exist
document.addEventListener('DOMContentLoaded', () => {
    // Guard: only run on share.html (check for a share-page-specific element)
    if (!document.getElementById('error-screen') || !document.getElementById('countdown-screen')) {
        return; // Not on share.html, skip share logic
    }

    const LZString = window.LZString;

    // --- Parse URL Data ---
    let letterData = null;

    function parseLetterFromURL() {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#data=')) return null;
        try {
            const compressed = hash.substring(6);
            const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
            if (!jsonStr) return null;
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse letter data:', e);
            return null;
        }
    }

    letterData = parseLetterFromURL();

    if (!letterData) {
        showScreen('error-screen');
        return;
    }

    // --- Flow Controller ---
    function startFlow() {
        if (letterData.scheduledTime) {
            const unlockTime = new Date(letterData.scheduledTime).getTime();
            const now = Date.now();
            if (now < unlockTime) {
                showScreen('countdown-screen');
                startCountdown(unlockTime);
                return;
            }
        }
        // No schedule or already past → go to unlock/celebration
        triggerCelebration();
    }

    startFlow();

    // --- Screen Management ---
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        const screen = document.getElementById(id);
        if (screen) {
            screen.style.display = 'flex';
            screen.style.animation = 'screenFadeIn 0.8s ease';
        }
    }

    // --- Countdown System ---
    function startCountdown(unlockTime) {
        const display = document.getElementById('countdown-display');

        function update() {
            const now = Date.now();
            const diff = unlockTime - now;

            if (diff <= 0) {
                triggerCelebration();
                return;
            }

            const seconds = Math.floor(diff / 1000) % 60;
            const minutes = Math.floor(diff / (1000 * 60)) % 60;
            const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const months = Math.floor(days / 30);
            const remainingDays = days % 30;

            let units = [];

            if (days > 30) {
                // Far away: months + days
                units.push({ value: months, label: months === 1 ? 'Month' : 'Months' });
                units.push({ value: remainingDays, label: remainingDays === 1 ? 'Day' : 'Days' });
                units.push({ value: hours, label: hours === 1 ? 'Hour' : 'Hours' });
            } else if (days > 0) {
                // Closer: days, hours, minutes
                units.push({ value: days, label: days === 1 ? 'Day' : 'Days' });
                units.push({ value: hours, label: hours === 1 ? 'Hour' : 'Hours' });
                units.push({ value: minutes, label: minutes === 1 ? 'Min' : 'Mins' });
            } else {
                // Within hours: hours, minutes, seconds
                units.push({ value: hours, label: hours === 1 ? 'Hour' : 'Hours' });
                units.push({ value: minutes, label: minutes === 1 ? 'Min' : 'Mins' });
                units.push({ value: seconds, label: seconds === 1 ? 'Sec' : 'Secs' });
            }

            display.innerHTML = units.map(u => `
                <div class="countdown-unit">
                    <span class="countdown-value">${String(u.value).padStart(2, '0')}</span>
                    <span class="countdown-label">${u.label}</span>
                </div>
            `).join('');

            requestAnimationFrame(() => setTimeout(update, 250));
        }

        update();
    }

    // --- Confetti System ---
    function launchConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#c084fc', '#6366f1', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c'];
        const confettiPieces = [];
        const count = 150;

        for (let i = 0; i < count; i++) {
            confettiPieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let frame = 0;
        const maxFrames = 300;

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;

            confettiPieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.rotation += p.rotationSpeed;

                if (frame > maxFrames - 60) {
                    p.opacity -= 0.016;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (frame < maxFrames) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        animate();
    }

    // --- Celebration Trigger ---
    function triggerCelebration() {
        showScreen('unlock-screen');

        // Apply custom unlock message if set
        const msgEl = document.getElementById('unlock-message-display');
        if (letterData.unlockMessage) {
            msgEl.textContent = letterData.unlockMessage;
        }
        if (letterData.unlockStyle) {
            if (letterData.unlockStyle.font) msgEl.style.fontFamily = letterData.unlockStyle.font;
            if (letterData.unlockStyle.color) msgEl.style.color = letterData.unlockStyle.color;
            if (letterData.unlockStyle.size) msgEl.style.fontSize = letterData.unlockStyle.size;
        }

        // Launch confetti
        launchConfetti();

        // Play sound
        const popSound = document.getElementById('pop-sound');
        if (popSound) {
            popSound.volume = 0.5;
            popSound.play().catch(() => {});
        }

        // Dim background
        document.body.style.transition = 'background 1s ease';

        // Open button handler
        document.getElementById('open-letter-btn').addEventListener('click', () => {
            if (letterData.secretCode) {
                showScreen('code-screen');
                document.getElementById('code-input').focus();
            } else {
                showEnvelopePreview();
            }
        });
    }

    // --- Code Validation ---
    const codeSubmitBtn = document.getElementById('code-submit-btn');
    const codeInput = document.getElementById('code-input');
    const codeError = document.getElementById('code-error');

    if (codeSubmitBtn) {
        codeSubmitBtn.addEventListener('click', validateCode);
    }
    if (codeInput) {
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validateCode();
        });
    }

    function validateCode() {
        const entered = codeInput.value.trim();
        if (entered === letterData.secretCode) {
            codeError.style.display = 'none';
            showEnvelopePreview();
        } else {
            codeError.style.display = 'block';
            codeInput.style.animation = 'shake 0.4s ease';
            setTimeout(() => { codeInput.style.animation = ''; }, 400);
        }
    }

    // --- Envelope Preview (tap to open) ---
    function showEnvelopePreview() {
        showScreen('envelope-screen');

        // Show the letter image as the envelope
        const envelopeImg = document.getElementById('envelope-preview-img');
        const letterImgPath = 'Letters Options/' + (letterData.letterFile || '');
        envelopeImg.src = letterImgPath;

        // Click envelope to open letter
        const envelopePreview = document.getElementById('envelope-preview');
        envelopePreview.addEventListener('click', () => {
            // Play paper sound
            const popSound = document.getElementById('pop-sound');
            if (popSound) {
                popSound.currentTime = 0;
                popSound.volume = 0.6;
                popSound.play().catch(() => {});
            }

            // Animate envelope out then render letter
            envelopePreview.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
            envelopePreview.style.transform = 'scale(1.1) translateY(-30px)';
            envelopePreview.style.opacity = '0';

            setTimeout(() => {
                renderLetter();
            }, 500);
        }, { once: true });
    }

    // --- Render Letter (Read-Only) ---
    function renderLetter() {
        showScreen('letter-screen');
        document.body.style.overflow = 'auto';

        const topImg = document.getElementById('view-top-img');
        const bottomImg = document.getElementById('view-bottom-img');
        const paperMiddle = document.getElementById('view-paper-middle');
        const contentEl = document.getElementById('view-letter-content');

        // Set letter covers
        const letterImgPath = 'Letters Options/' + (letterData.letterFile || '');
        topImg.src = letterImgPath;
        bottomImg.src = letterImgPath;

        // Set content
        contentEl.textContent = letterData.content || '';

        // Apply font styles
        if (letterData.fontFamily) {
            contentEl.style.fontFamily = letterData.fontFamily;
        }
        if (letterData.fontSize) {
            contentEl.style.fontSize = letterData.fontSize;
        }

        // Auto-size paper to content
        requestAnimationFrame(() => {
            const contentHeight = contentEl.scrollHeight;
            paperMiddle.style.minHeight = Math.max(400, contentHeight + 80) + 'px';
        });

        // Play paper sound
        const popSound = document.getElementById('pop-sound');
        if (popSound) {
            popSound.currentTime = 0;
            popSound.play().catch(() => {});
        }
    }
});
