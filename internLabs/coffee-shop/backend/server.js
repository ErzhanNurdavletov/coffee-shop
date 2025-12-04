// server.js - Главный файл бэкенда
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3001; // Порт, на котором будет работать наш сервер

// --- НАСТРОЙКА СЕРВЕРА ---

// 1. Разрешаем запросы с других доменов (CORS), в частности, с React (обычно порт 3000)
app.use(cors());
// 2. Парсер для автоматического преобразования входящих JSON-запросов
app.use(express.json());

// --- НАСТРОЙКА БАЗЫ ДАННЫХ SQLite ---

// Подключение к базе данных. Файл menu.db будет создан автоматически.
const db = new sqlite3.Database('./menu.db', (err) => {
    if (err) console.error('Database connection error:', err.message);
    console.log('Connected to the SQLite database. (Подключено к базе данных)');
});

// Создание таблиц, если они еще не существуют
db.serialize(() => {
    // Таблица для категорий (Например: Кофе, Десерты, Сэндвичи)
    db.run(`CREATE TABLE IF NOT EXISTS categories (
                                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                      name_ru TEXT,
                                                      name_en TEXT,
                                                      image TEXT,
                                                      sort_order INTEGER DEFAULT 0
            )`);
    console.log("Table 'categories' ensured. (Таблица категорий готова)");

    // Таблица для товаров (Например: Латте, Чизкейк)
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

// --- API МАРШРУТЫ (ROUTES) ---

// 1. Получить все категории
app.get('/api/categories', (req, res) => {
    db.all("SELECT id, name_ru, name_en, image FROM categories ORDER BY sort_order", [], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// 2. Добавить новую категорию
app.post('/api/categories', (req, res) => {
    const { nameRu, nameEn, image } = req.body;
    const sql = `INSERT INTO categories (name_ru, name_en, image, sort_order) VALUES (?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM categories))`;
    db.run(sql, [nameRu, nameEn, image], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID });
    });
});

// 3. Удалить категорию
app.delete('/api/categories/:id', (req, res) => {
    db.run(`DELETE FROM categories WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Deleted", changes: this.changes });
    });
});

// 4. Получить товары конкретной категории
app.get('/api/items/:categoryId', (req, res) => {
    const sql = "SELECT id, category_id, name_ru, name_en, desc_ru, desc_en, price, image FROM items WHERE category_id = ?";
    db.all(sql, [req.params.categoryId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// 5. Добавить новый товар
app.post('/api/items', (req, res) => {
    const { categoryId, nameRu, nameEn, descRu, descEn, price, image } = req.body;
    const sql = `INSERT INTO items (category_id, name_ru, name_en, desc_ru, desc_en, price, image)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [categoryId, nameRu, nameEn, descRu, descEn, price, image], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID });
    });
});

// 6. Удалить товар
app.delete('/api/items/:id', (req, res) => {
    db.run(`DELETE FROM items WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({ message: "Deleted", changes: this.changes });
    });
});

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (Сервер запущен)`);
});