import React, { useState, useEffect, useCallback } from 'react';
import {
  Coffee, ArrowLeft, Plus, Trash2, Settings, Globe, Loader2
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---

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

// --- ГЛАВНОЕ ПРИЛОЖЕНИЕ ---

const App = () => {
  const [lang, setLang] = useState(null);
  const [view, setView] = useState('categories');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const t = useCallback((ru, en) => (lang === 'ru' ? ru : en), [lang]);

  const fetchData = useCallback(async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      window.alert(t('Ошибка загрузки данных.', 'Data loading error.'));
      return [];
    }
  }, [t]);

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
    if (activeCategory) loadItems(activeCategory.id);
  }, [activeCategory, loadItems]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
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
      await fetch(`${API_BASE_URL}/${isCategory ? 'categories' : 'items'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      isCategory ? loadCategories() : loadItems(activeCategory.id);
    } catch (error) {
      window.alert(t('Ошибка сохранения.', 'Save error.'));
    }
    e.target.reset();
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(t('Удалить?', 'Delete?'))) return;
    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/${type}/${id}`, { method: 'DELETE' });
      type === 'categories' ? loadCategories() : loadItems(activeCategory.id);
    } catch (error) {
      window.alert(t('Ошибка удаления.', 'Delete error.'));
    }
  };

  if (!lang) return <LanguageScreen setLang={setLang} />;

  return (
    <div>
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
          <Button variant="ghost" onClick={() => setIsAdmin(!isAdmin)} className={`icon-btn ${isAdmin ? 'active' : ''}`}>
            <Settings size={20} />
          </Button>
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
            {categories.map(cat => (
              <div key={cat.id} className="category-card" onClick={() => { setActiveCategory(cat); setView('items'); }}>
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

        {/* ТОВАРЫ */}
        {view === 'items' && (
          <div className="items-list">
            {items.length === 0 && !isLoading && (
              <div className="empty-message">{t('В этой категории пока пусто', 'Empty category')}</div>
            )}
            {items.map(item => (
              <div key={item.id} className="item-card">
                <div className="item-image">
                  <img src={item.image} alt={t(item.name_ru, item.name_en)} onError={(e) => e.target.src = 'https://placehold.co/150x150/f5f5f4/999?text=Image'} />
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

