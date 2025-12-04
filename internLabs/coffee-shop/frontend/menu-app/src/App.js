import React, { useState, useEffect, useCallback } from 'react';
import {
  Coffee, ArrowLeft, Plus, Trash2, Settings, Globe, Loader2, LogIn, LogOut, X
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost'
  }[variant];

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn ${variantClass} ${className}`}>
      {children}
    </button>
  );
};

const Input = (props) => <input {...props} className="input" />;

const LanguageScreen = ({ setLang }) => (
  <div className="lang-screen">
    <div className="lang-logo">
      <Coffee size={64} />
    </div>
    <h1 className="lang-title">Coffee House</h1>
    <p className="lang-subtitle">Digital Menu / Электронное меню</p>
    <div className="lang-buttons">
      <Button variant="secondary" onClick={() => setLang('ru')} className="btn-lang">
        🇷🇺 Русский
      </Button>
      <Button variant="primary" onClick={() => setLang('en')} className="btn-lang">
        🇺🇸 English
      </Button>
    </div>
  </div>
);

// Модальное окно авторизации
const LoginModal = ({ isOpen, onClose, onLogin, t }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        onLogin(data.token);
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError(t('Неверный логин или пароль', 'Invalid username or password'));
      }
    } catch (err) {
      setError(t('Ошибка соединения', 'Connection error'));
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('Вход для администратора', 'Admin Login')}</h2>
          <Button variant="ghost" onClick={onClose} className="icon-btn">
            <X size={20} />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            type="text"
            placeholder={t('Логин', 'Username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder={t('Пароль', 'Password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-message">{error}</div>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? <Loader2 size={18} className="spinner" /> : <LogIn size={18} />}
            {t('Войти', 'Login')}
          </Button>
        </form>
      </div>
    </div>
  );
};

// --- ГЛАВНОЕ ПРИЛОЖЕНИЕ ---

const App = () => {
  const [lang, setLang] = useState(null);
  const [view, setView] = useState('categories');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const t = useCallback((ru, en) => (lang === 'ru' ? ru : en), [lang]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetch(`${API_BASE_URL}/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setAdminToken(token);
            setIsAdmin(true);
          } else {
            localStorage.removeItem('adminToken');
          }
        })
        .catch(() => localStorage.removeItem('adminToken'));
    }
  }, []);

  const handleLogin = (token) => {
    setAdminToken(token);
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setIsAdmin(false);
  };

  const fetchData = useCallback(async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchData('/categories');
    setCategories(data);
    setIsLoading(false);
  }, [fetchData]);

  const loadItems = useCallback(async (id) => {
    setIsLoading(true);
    const data = await fetchData(`/items/${id}`);
    setItems(data);
    setIsLoading(false);
  }, [fetchData]);

  useEffect(() => {
    if (lang) loadCategories();
  }, [lang, loadCategories]);

  useEffect(() => {
    if (activeCategory) {
      loadItems(activeCategory.id);
    }
  }, [activeCategory, loadItems]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!adminToken) {
      window.alert(t('Необходима авторизация', 'Authorization required'));
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.target);
    const isCategory = view === 'categories';

    const data = isCategory ? {
      nameRu: formData.get('name_ru'),
      nameEn: formData.get('name_en'),
      image: formData.get('image') || 'https://placehold.co/400x160/f0f0f0/999?text=Image'
    } : {
      categoryId: activeCategory.id,
      nameRu: formData.get('name_ru'),
      nameEn: formData.get('name_en'),
      descRu: formData.get('desc_ru'),
      descEn: formData.get('desc_en'),
      price: Number(formData.get('price')),
      image: formData.get('image') || 'https://placehold.co/150x150/f0f0f0/999?text=Image'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/${isCategory ? 'categories' : 'items'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        handleLogout();
        window.alert(t('Сессия истекла. Войдите снова.', 'Session expired. Please login again.'));
        return;
      }

      isCategory ? loadCategories() : loadItems(activeCategory.id);
    } catch (error) {
      window.alert(t('Ошибка сохранения.', 'Save error.'));
    }
    e.target.reset();
  };

  const handleDelete = async (type, id) => {
    if (!adminToken) {
      window.alert(t('Необходима авторизация', 'Authorization required'));
      return;
    }
    if (!window.confirm(t('Удалить?', 'Delete?'))) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 401) {
        handleLogout();
        window.alert(t('Сессия истекла. Войдите снова.', 'Session expired. Please login again.'));
        return;
      }

      type === 'categories' ? loadCategories() : loadItems(activeCategory.id);
    } catch (error) {
      window.alert(t('Ошибка удаления.', 'Delete error.'));
    }
  };

  if (!lang) return <LanguageScreen setLang={setLang} />;

  return (
    <div>
      {/* МОДАЛЬНОЕ ОКНО ВХОДА */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        t={t}
      />

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          {view === 'items' && (
            <Button variant="ghost" onClick={() => { setView('categories'); setActiveCategory(null); }} className="icon-btn">
              <ArrowLeft size={24} />
            </Button>
          )}
          <h1 className="header-title">
            {view === 'categories' ? t('Меню', 'Menu') : t(activeCategory?.name_ru, activeCategory?.name_en)}
          </h1>
        </div>
        <div className="header-right">
          {isLoading && <Loader2 size={20} className="spinner" />}
          <Button variant="ghost" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} className="icon-btn">
            <Globe size={20} />
          </Button>
          {isAdmin ? (
            <>
              <Button variant="ghost" className="icon-btn active" title={t('Админ режим', 'Admin mode')}>
                <Settings size={20} />
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="icon-btn" title={t('Выйти', 'Logout')}>
                <LogOut size={20} />
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setShowLoginModal(true)} className="icon-btn" title={t('Войти как админ', 'Login as admin')}>
              <LogIn size={20} />
            </Button>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        {/* АДМИН ПАНЕЛЬ */}
        {isAdmin && (
          <div className="admin-panel">
            <h3 className="admin-title">
              {view === 'categories' ? t('Добавить категорию', 'Add Category') : t('Добавить товар', 'Add Item')}
            </h3>
            <form onSubmit={handleFormSubmit} className="admin-form">
              <div className="form-row">
                <Input name="name_ru" placeholder="Название RU" required />
                <Input name="name_en" placeholder="Name EN" required />
              </div>
              {view === 'items' && (
                <>
                  <div className="form-row">
                    <Input name="desc_ru" placeholder="Описание RU" />
                    <Input name="desc_en" placeholder="Desc EN" />
                  </div>
                  <Input name="price" type="number" placeholder={t("Цена", "Price")} required />
                </>
              )}
              <Input name="image" placeholder="URL картинки" />
              <Button type="submit" disabled={isLoading} style={{ width: '100%' }}>
                <Plus size={18} /> {t('Добавить', 'Add')}
              </Button>
            </form>
          </div>
        )}

        {/* КАТЕГОРИИ */}
        {view === 'categories' && (
          <div className="categories-grid">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className="category-card animate-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => { setActiveCategory(cat); setView('items'); }}
              >
                <img src={cat.image} alt={t(cat.name_ru, cat.name_en)} onError={(e) => e.target.src = 'https://placehold.co/400x160/e7e5e4/999?text=Image'} />
                <div className="category-overlay">
                  <span className="category-name">{t(cat.name_ru, cat.name_en)}</span>
                </div>
                {isAdmin && (
                  <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete('categories', cat.id); }} className="delete-btn">
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ТОВАРЫ - ПРОСТОЙ СПИСОК С АНИМАЦИЕЙ */}
        {view === 'items' && (
          <div className="items-list">
            {items.length === 0 && !isLoading && (
              <div className="empty-message">{t('В этой категории пока пусто', 'Empty category')}</div>
            )}
            {items.map((item, index) => (
              <div
                key={item.id}
                className="item-card animate-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="item-image">
                  <img
                    src={item.image}
                    alt={t(item.name_ru, item.name_en)}
                    onError={(e) => e.target.src = 'https://placehold.co/150x150/f5f5f4/999?text=Image'}
                  />
                </div>
                <div className="item-content">
                  <div>
                    <div className="item-header">
                      <h3 className="item-name">{t(item.name_ru, item.name_en)}</h3>
                      <span className="item-price">{item.price} ₽</span>
                    </div>
                    <p className="item-desc">{t(item.desc_ru, item.desc_en)}</p>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" onClick={() => handleDelete('items', item.id)} className="item-delete">
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
