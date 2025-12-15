const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');
const app = express();
const PORT = 3001;

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '123',
    token: 'secret-admin-token-12345'
};

const userTokens = new Map();

app.use(cors());
app.use(express.json());

const requireAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== ADMIN_CREDENTIALS.token) {
        return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
    }
    next();
};

// Middleware для проверки авторизации пользователя
const requireUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = userTokens.get(token);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    req.userId = userId;
    next();
};

const db = new sqlite3.Database('./menu.db', (err) => {
    if (err) console.error('Database connection error:', err.message);
    console.log('Connected to the SQLite database. (Подключено к базе данных)');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS categories (
                                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                      name_ru TEXT,
                                                      name_en TEXT,
                                                      image TEXT,
                                                      sort_order INTEGER DEFAULT 0
            )`);
    console.log("Table 'categories' ensured. (Таблица категорий готова)");
    db.run(`CREATE TABLE IF NOT EXISTS items (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 category_id INTEGER,
                                                 name_ru TEXT,
                                                 name_en TEXT,
                                                 desc_ru TEXT,
                                                 desc_en TEXT,
                                                 price REAL,
                                                 image TEXT,
                                                 FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
        )`);
    console.log("Table 'items' ensured. (Таблица товаров готова)");

    db.run(`CREATE TABLE IF NOT EXISTS banners (
                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                   title_ru TEXT,
                                                   title_en TEXT,
                                                   image TEXT,
                                                   sort_order INTEGER DEFAULT 0
            )`);
    console.log("Table 'banners' ensured. (Таблица баннеров готова)");

    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 username TEXT UNIQUE NOT NULL,
                                                 password TEXT NOT NULL,
                                                 bonuses INTEGER DEFAULT 0,
                                                 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
    console.log("Table 'users' ensured. (Таблица пользователей готова)");
});

// === ADMIN AUTH ===
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ success: true, token: ADMIN_CREDENTIALS.token });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.get('/api/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token === ADMIN_CREDENTIALS.token) {
        res.json({ valid: true });
    } else {
        res.status(401).json({ valid: false });
    }
});

// === USER AUTH ===
app.post('/api/user/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    if (username.length < 3 || password.length < 3) {
        return res.status(400).json({ error: 'Username and password must be at least 3 characters' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;

    db.run(sql, [username, hashedPassword], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: err.message });
        }

        const token = crypto.randomBytes(32).toString('hex');
        userTokens.set(token, this.lastID);

        res.json({
            success: true,
            token,
            user: { id: this.lastID, username, bonuses: 0 }
        });
    });
});

app.post('/api/user/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const sql = `SELECT id, username, bonuses FROM users WHERE username = ? AND password = ?`;

    db.get(sql, [username, hashedPassword], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });

        const token = crypto.randomBytes(32).toString('hex');
        userTokens.set(token, row.id);

        res.json({
            success: true,
            token,
            user: { id: row.id, username: row.username, bonuses: row.bonuses }
        });
    });
});

app.get('/api/user/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = userTokens.get(token);

    if (!userId) {
        return res.status(401).json({ valid: false });
    }

    db.get(`SELECT id, username, bonuses FROM users WHERE id = ?`, [userId], (err, row) => {
        if (err || !row) return res.status(401).json({ valid: false });
        res.json({ valid: true, user: row });
    });
});

app.post('/api/user/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    userTokens.delete(token);
    res.json({ success: true });
});

app.post('/api/user/add-bonuses', requireUser, (req, res) => {
    const { bonuses } = req.body;
    if (typeof bonuses !== 'number' || bonuses < 0) {
        return res.status(400).json({ error: 'Invalid bonuses amount' });
    }

    const sql = `UPDATE users SET bonuses = bonuses + ? WHERE id = ?`;
    db.run(sql, [Math.floor(bonuses), req.userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        db.get(`SELECT bonuses FROM users WHERE id = ?`, [req.userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, totalBonuses: row.bonuses });
        });
    });
});

// === CATEGORIES API ===
app.get('/api/categories', (req, res) => {
    db.all("SELECT id, name_ru, name_en, image FROM categories ORDER BY sort_order", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});
app.post('/api/categories', requireAdmin, (req, res) => {
    const { nameRu, nameEn, image } = req.body;
    const sql = `INSERT INTO categories (name_ru, name_en, image, sort_order) VALUES (?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM categories))`;
    db.run(sql, [nameRu, nameEn, image], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID });
    });
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
    db.run(`DELETE FROM categories WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Deleted", changes: this.changes });
    });
});
app.get('/api/items/:categoryId', (req, res) => {
    const sql = "SELECT id, category_id, name_ru, name_en, desc_ru, desc_en, price, image FROM items WHERE category_id = ?";
    db.all(sql, [req.params.categoryId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.post('/api/items', requireAdmin, (req, res) => {
    const { categoryId, nameRu, nameEn, descRu, descEn, price, image } = req.body;
    const sql = `INSERT INTO items (category_id, name_ru, name_en, desc_ru, desc_en, price, image)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [categoryId, nameRu, nameEn, descRu, descEn, price, image], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID });
    });
});
app.delete('/api/items/:id', requireAdmin, (req, res) => {
    db.run(`DELETE FROM items WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Deleted", changes: this.changes });
    });
});

// === BANNERS API ===
app.get('/api/banners', (req, res) => {
    db.all("SELECT id, title_ru, title_en, image FROM banners ORDER BY sort_order", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/banners', requireAdmin, (req, res) => {
    const { titleRu, titleEn, image } = req.body;
    const sql = `INSERT INTO banners (title_ru, title_en, image, sort_order) VALUES (?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM banners))`;
    db.run(sql, [titleRu, titleEn, image], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.delete('/api/banners/:id', requireAdmin, (req, res) => {
    db.run(`DELETE FROM banners WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted", changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (Сервер запущен)`);
});