const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3001;

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '123',
    token: 'secret-admin-token-12345'
};
app.use(cors());
app.use(express.json());
const requireAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== ADMIN_CREDENTIALS.token) {
        return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
    }
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
});
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (Сервер запущен)`);
});