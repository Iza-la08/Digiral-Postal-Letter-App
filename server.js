/* ==========================================
   iLetterU — Backend Server
   Express + SQLite + bcrypt Authentication
   ========================================== */

const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project root
app.use(express.static(path.join(__dirname), {
    extensions: ['html'],
    index: 'index.html'
}));

// --- Database Setup ---
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'iletterU.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nickname TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file TEXT NOT NULL,
        date TEXT NOT NULL,
        content TEXT DEFAULT '',
        font_family TEXT DEFAULT '''Caveat'', cursive',
        font_size TEXT DEFAULT '1.3rem',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        letter_file TEXT DEFAULT '',
        content TEXT DEFAULT '',
        font_family TEXT DEFAULT '''Caveat'', cursive',
        font_size TEXT DEFAULT '1.3rem',
        received_date TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

// --- Prepared Statements ---
const stmts = {
    findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    createUser: db.prepare('INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)'),
    updateUser: db.prepare('UPDATE users SET nickname = ?, avatar = ? WHERE id = ?'),

    createSession: db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)'),
    findSession: db.prepare('SELECT s.*, u.id as uid, u.email, u.nickname, u.avatar FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
    deleteUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),

    getLetters: db.prepare('SELECT * FROM letters WHERE user_id = ? ORDER BY created_at ASC'),
    createLetter: db.prepare('INSERT INTO letters (user_id, file, date, content, font_family, font_size) VALUES (?, ?, ?, ?, ?, ?)'),
    updateLetter: db.prepare('UPDATE letters SET content = ?, font_family = ?, font_size = ? WHERE id = ? AND user_id = ?'),
    deleteLetter: db.prepare('DELETE FROM letters WHERE id = ? AND user_id = ?'),
    findLetter: db.prepare('SELECT * FROM letters WHERE id = ? AND user_id = ?'),

    getInbox: db.prepare('SELECT * FROM inbox WHERE user_id = ? ORDER BY created_at DESC'),
    addToInbox: db.prepare('INSERT INTO inbox (user_id, letter_file, content, font_family, font_size, received_date) VALUES (?, ?, ?, ?, ?, ?)')
};

// --- Auth Middleware ---
function authenticate(req, res, next) {
    const token = req.headers['x-session-token'];
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = stmts.findSession.get(token);
    if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
    }

    req.user = {
        id: session.uid,
        email: session.email,
        nickname: session.nickname,
        avatar: session.avatar
    };
    req.sessionToken = token;
    next();
}

// ==========================================
// AUTH ROUTES
// ==========================================

// --- Sign Up ---
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if email already exists
        const existing = stmts.findUserByEmail.get(email.toLowerCase().trim());
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
        }

        // Hash password (12 salt rounds)
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const result = stmts.createUser.run(email.toLowerCase().trim(), passwordHash, '');
        const userId = result.lastInsertRowid;

        // Create session
        const token = crypto.randomUUID();
        stmts.createSession.run(token, userId);

        res.status(201).json({
            message: 'Account created successfully!',
            token,
            user: {
                id: userId,
                email: email.toLowerCase().trim(),
                nickname: '',
                avatar: ''
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// --- Login ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const user = stmts.findUserByEmail.get(email.toLowerCase().trim());
        if (!user) {
            return res.status(404).json({ error: 'Account does not exist. Please create an account first.' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }

        // Create session
        const token = crypto.randomUUID();
        stmts.createSession.run(token, user.id);

        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// --- Logout ---
app.post('/api/logout', authenticate, (req, res) => {
    stmts.deleteSession.run(req.sessionToken);
    res.json({ message: 'Logged out successfully.' });
});

// --- Session Check ---
app.get('/api/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

// ==========================================
// USER ROUTES
// ==========================================

// --- Update Profile ---
app.put('/api/user', authenticate, (req, res) => {
    const { nickname, avatar } = req.body;
    stmts.updateUser.run(
        nickname !== undefined ? nickname : req.user.nickname,
        avatar !== undefined ? avatar : req.user.avatar,
        req.user.id
    );
    res.json({
        user: {
            ...req.user,
            nickname: nickname !== undefined ? nickname : req.user.nickname,
            avatar: avatar !== undefined ? avatar : req.user.avatar
        }
    });
});

// ==========================================
// LETTER ROUTES
// ==========================================

// --- Get Letters ---
app.get('/api/letters', authenticate, (req, res) => {
    const letters = stmts.getLetters.all(req.user.id);
    res.json({
        letters: letters.map(l => ({
            id: l.id,
            file: l.file,
            date: l.date,
            content: l.content,
            fontFamily: l.font_family,
            fontSize: l.font_size
        }))
    });
});

// --- Create Letter ---
app.post('/api/letters', authenticate, (req, res) => {
    const { file, date, content, fontFamily, fontSize } = req.body;
    const result = stmts.createLetter.run(
        req.user.id,
        file || '',
        date || new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        content || '',
        fontFamily || "'Caveat', cursive",
        fontSize || '1.3rem'
    );
    res.status(201).json({
        letter: {
            id: result.lastInsertRowid,
            file,
            date,
            content: content || '',
            fontFamily: fontFamily || "'Caveat', cursive",
            fontSize: fontSize || '1.3rem'
        }
    });
});

// --- Update Letter ---
app.put('/api/letters/:id', authenticate, (req, res) => {
    const letterId = parseInt(req.params.id);
    const { content, fontFamily, fontSize } = req.body;

    const existing = stmts.findLetter.get(letterId, req.user.id);
    if (!existing) {
        return res.status(404).json({ error: 'Letter not found.' });
    }

    stmts.updateLetter.run(
        content !== undefined ? content : existing.content,
        fontFamily !== undefined ? fontFamily : existing.font_family,
        fontSize !== undefined ? fontSize : existing.font_size,
        letterId,
        req.user.id
    );

    res.json({ message: 'Letter updated.' });
});

// --- Delete Letter ---
app.delete('/api/letters/:id', authenticate, (req, res) => {
    const letterId = parseInt(req.params.id);
    const result = stmts.deleteLetter.run(letterId, req.user.id);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Letter not found.' });
    }
    res.json({ message: 'Letter deleted.' });
});

// ==========================================
// INBOX ROUTES
// ==========================================

// --- Get Inbox ---
app.get('/api/inbox', authenticate, (req, res) => {
    const items = stmts.getInbox.all(req.user.id);
    res.json({
        inbox: items.map(i => ({
            id: i.id,
            letterFile: i.letter_file,
            content: i.content,
            fontFamily: i.font_family,
            fontSize: i.font_size,
            receivedDate: i.received_date
        }))
    });
});

// --- Save to Inbox ---
app.post('/api/inbox', authenticate, (req, res) => {
    const { letterFile, content, fontFamily, fontSize, receivedDate } = req.body;
    const result = stmts.addToInbox.run(
        req.user.id,
        letterFile || '',
        content || '',
        fontFamily || "'Caveat', cursive",
        fontSize || '1.3rem',
        receivedDate || new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    );
    res.status(201).json({
        message: 'Letter saved to inbox.',
        id: result.lastInsertRowid
    });
});

// --- Catch-all: serve index.html for SPA routes ---
app.get('{*path}', (req, res) => {
    // Don't interfere with share.html
    if (req.path === '/share.html' || req.path.startsWith('/api/')) return;
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\n  🏛️  iLetterU Server running at http://localhost:${PORT}\n`);
});
