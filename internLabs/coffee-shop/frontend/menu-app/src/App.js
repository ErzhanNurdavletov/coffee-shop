import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Coffee, ArrowLeft, Plus, Trash2, Settings, Globe, Loader2, LogIn, LogOut, X,
  ChevronLeft, ChevronRight, Image, Gift, Gamepad2, User, Trophy
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, style = {} }) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    bonus: 'btn-bonus'
  }[variant];

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn ${variantClass} ${className}`} style={style}>
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

// Модальное окно авторизации АДМИНА
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

// Модальное окно регистрации/авторизации ПОЛЬЗОВАТЕЛЯ
const UserAuthModal = ({ isOpen, onClose, onAuth, t }) => {
  const [mode, setMode] = useState('login'); // 'login' или 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/user/login' : '/user/register';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('userToken', data.token);
        onAuth(data.token, data.user);
        onClose();
        setUsername('');
        setPassword('');
      } else {
        setError(data.error || t('Ошибка', 'Error'));
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
          <h2>{mode === 'login' ? t('Вход', 'Login') : t('Регистрация', 'Register')}</h2>
          <Button variant="ghost" onClick={onClose} className="icon-btn">
            <X size={20} />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            type="text"
            placeholder={t('Имя пользователя', 'Username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
          <Input
            type="password"
            placeholder={t('Пароль', 'Password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={3}
          />
          {error && <div className="error-message">{error}</div>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? <Loader2 size={18} className="spinner" /> : <User size={18} />}
            {mode === 'login' ? t('Войти', 'Login') : t('Зарегистрироваться', 'Register')}
          </Button>
          <button
            type="button"
            className="switch-mode-btn"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login'
              ? t('Нет аккаунта? Зарегистрироваться', "Don't have an account? Register")
              : t('Уже есть аккаунт? Войти', 'Already have an account? Login')}
          </button>
        </form>
      </div>
    </div>
  );
};

// МИНИ-ИГРА
const MiniGame = ({ onClose, onGameEnd, t }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'ended'
  const [score, setScore] = useState(0);
  const gameRef = useRef({
    player: { x: 175, width: 60, height: 20 },
    obstacles: [],
    particles: [],
    stars: [],
    score: 0,
    speed: 2,
    spawnTimer: 0,
    keys: { a: false, d: false, left: false, right: false },
    playerGlow: 0
  });

  // Инициализация звёзд
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * 400,
        y: Math.random() * 500,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
    gameRef.current.stars = stars;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'ф') gameRef.current.keys.a = true;
      if (key === 'd' || key === 'в') gameRef.current.keys.d = true;
      if (key === 'arrowleft') gameRef.current.keys.left = true;
      if (key === 'arrowright') gameRef.current.keys.right = true;
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'ф') gameRef.current.keys.a = false;
      if (key === 'd' || key === 'в') gameRef.current.keys.d = false;
      if (key === 'arrowleft') gameRef.current.keys.left = false;
      if (key === 'arrowright') gameRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const createParticle = (x, y, color) => {
      for (let i = 0; i < 5; i++) {
        gameRef.current.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * -3 - 1,
          life: 1,
          color,
          size: Math.random() * 4 + 2
        });
      }
    };

    const gameLoop = () => {
      const game = gameRef.current;

      // Градиентный фон
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 500);
      bgGradient.addColorStop(0, '#0f0c29');
      bgGradient.addColorStop(0.5, '#302b63');
      bgGradient.addColorStop(1, '#24243e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 400, 500);

      // Анимация звёзд
      game.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > 500) {
          star.y = 0;
          star.x = Math.random() * 400;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });

      // Движение игрока
      const moveLeft = game.keys.a || game.keys.left;
      const moveRight = game.keys.d || game.keys.right;
      if (moveLeft && game.player.x > 0) {
        game.player.x -= 6;
        createParticle(game.player.x + game.player.width, 475, '#4ade80');
      }
      if (moveRight && game.player.x < 400 - game.player.width) {
        game.player.x += 6;
        createParticle(game.player.x, 475, '#4ade80');
      }

      // Эффект свечения игрока
      game.playerGlow = (game.playerGlow + 0.1) % (Math.PI * 2);
      const glowIntensity = Math.sin(game.playerGlow) * 0.3 + 0.7;

      // Рисуем игрока с градиентом и свечением
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 20 * glowIntensity;

      const playerGradient = ctx.createLinearGradient(
        game.player.x, 460,
        game.player.x, 485
      );
      playerGradient.addColorStop(0, '#86efac');
      playerGradient.addColorStop(0.5, '#4ade80');
      playerGradient.addColorStop(1, '#22c55e');

      ctx.fillStyle = playerGradient;
      ctx.beginPath();
      ctx.roundRect(game.player.x, 465, game.player.width, game.player.height, 6);
      ctx.fill();

      // Детали игрока
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(game.player.x + 5, 468, game.player.width - 10, 4);

      ctx.shadowBlur = 0;

      // Спавн препятствий
      game.spawnTimer++;
      const spawnRate = Math.max(20, 60 - game.score / 3);
      if (game.spawnTimer > spawnRate) {
        const obstacleTypes = ['square', 'diamond', 'circle'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        game.obstacles.push({
          x: Math.random() * (400 - 35),
          y: -35,
          width: 35,
          height: 35,
          type,
          rotation: 0,
          hue: Math.random() * 60 // Оттенок красного-оранжевого
        });
        game.spawnTimer = 0;
      }

      // Обновление и рисование препятствий
      game.obstacles = game.obstacles.filter(obs => {
        obs.y += game.speed + game.score / 40;
        obs.rotation += 0.05;

        // Проверка столкновения
        const hitboxPadding = 5;
        if (
          obs.x + hitboxPadding < game.player.x + game.player.width - hitboxPadding &&
          obs.x + obs.width - hitboxPadding > game.player.x + hitboxPadding &&
          obs.y + obs.height - hitboxPadding > 465 &&
          obs.y + hitboxPadding < 485
        ) {
          // Создаём частицы взрыва
          for (let i = 0; i < 20; i++) {
            game.particles.push({
              x: game.player.x + game.player.width / 2,
              y: 475,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 1,
              color: i % 2 === 0 ? '#ef4444' : '#4ade80',
              size: Math.random() * 6 + 3
            });
          }
          setGameState('ended');
          setScore(Math.floor(game.score));
          return false;
        }

        // Свечение препятствия
        ctx.shadowColor = `hsl(${obs.hue}, 100%, 50%)`;
        ctx.shadowBlur = 15;

        // Градиент препятствия
        const obsGradient = ctx.createRadialGradient(
          obs.x + obs.width / 2, obs.y + obs.height / 2, 0,
          obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width
        );
        obsGradient.addColorStop(0, `hsl(${obs.hue}, 100%, 60%)`);
        obsGradient.addColorStop(0.7, `hsl(${obs.hue}, 100%, 45%)`);
        obsGradient.addColorStop(1, `hsl(${obs.hue}, 80%, 30%)`);

        ctx.fillStyle = obsGradient;

        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);

        if (obs.type === 'diamond') {
          ctx.rotate(obs.rotation);
          ctx.beginPath();
          ctx.moveTo(0, -obs.height / 2);
          ctx.lineTo(obs.width / 2, 0);
          ctx.lineTo(0, obs.height / 2);
          ctx.lineTo(-obs.width / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.rotate(obs.rotation);
          ctx.beginPath();
          ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 4);
          ctx.fill();
        }
        ctx.restore();

        ctx.shadowBlur = 0;

        return obs.y < 550;
      });

      // Обновление частиц
      game.particles = game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Гравитация
        p.life -= 0.02;

        if (p.life > 0) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          return true;
        }
        return false;
      });

      // Очки
      game.score += 0.1;
      setScore(Math.floor(game.score));

      // UI - Счёт с эффектом
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillText(`★ ${Math.floor(game.score)}`, 15, 35);
      ctx.restore();

      // Подсказки управления
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '12px sans-serif';
      ctx.fillText('← A/D →', 340, 490);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  const startGame = () => {
    gameRef.current = {
      player: { x: 170, width: 60, height: 20 },
      obstacles: [],
      particles: [],
      stars: gameRef.current.stars || [],
      score: 0,
      speed: 2,
      spawnTimer: 0,
      keys: { a: false, d: false, left: false, right: false },
      playerGlow: 0
    };
    setScore(0);
    setGameState('playing');
  };

  const handleFinish = () => {
    onGameEnd(score);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="game-modal" onClick={(e) => e.stopPropagation()}>
        <div className="game-header">
          <h2><Gamepad2 size={24} /> {t('Космический уворот', 'Space Dodge')}</h2>
          <Button variant="ghost" onClick={onClose} className="icon-btn game-close-btn">
            <X size={20} />
          </Button>
        </div>

        {gameState === 'ready' && (
          <div className="game-ready">
            <div className="game-preview">
              <div className="preview-player"></div>
              <div className="preview-obstacle"></div>
              <div className="preview-obstacle delay"></div>
            </div>
            <div className="game-instructions">
              <h3>{t('Управление', 'Controls')}</h3>
              <div className="controls-grid">
                <div className="control-key">
                  <span className="key">A</span>
                  <span className="key-label">{t('или', 'or')}</span>
                  <span className="key">←</span>
                </div>
                <div className="control-desc">{t('Влево', 'Left')}</div>
                <div className="control-key">
                  <span className="key">D</span>
                  <span className="key-label">{t('или', 'or')}</span>
                  <span className="key">→</span>
                </div>
                <div className="control-desc">{t('Вправо', 'Right')}</div>
              </div>
              <p className="game-tip">💡 {t('Уворачивайтесь от падающих фигур!', 'Dodge the falling shapes!')}</p>
            </div>
            <Button onClick={startGame} className="start-game-btn">
              <Gamepad2 size={20} /> {t('Начать игру', 'Start Game')}
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <canvas ref={canvasRef} width={400} height={500} className="game-canvas" />
        )}

        {gameState === 'ended' && (
          <div className="game-ended">
            <div className="trophy-container">
              <Trophy size={72} className="trophy-icon" />
              <div className="trophy-sparkles">
                <span></span><span></span><span></span>
              </div>
            </div>
            <h3>{t('Игра окончена!', 'Game Over!')}</h3>
            <div className="score-display">
              <span className="score-label">{t('Ваш счёт', 'Your score')}</span>
              <span className="score-value">{score}</span>
            </div>
            <div className="bonus-reward">
              <Gift size={24} />
              <span>+{score} {t('бонусов', 'bonuses')}</span>
            </div>
            <div className="game-buttons">
              <Button variant="secondary" onClick={startGame}>
                {t('Ещё раз', 'Try Again')}
              </Button>
              <Button onClick={handleFinish} className="claim-btn">
                <Gift size={18} /> {t('Забрать', 'Claim')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент карусели баннеров
const BannerCarousel = ({ banners, isAdmin, onDelete, t }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goTo = (index) => {
    if (index === currentIndex || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
  };

  const goNext = () => {
    if (isAnimating || banners.length <= 1) return;
    goTo((currentIndex + 1) % banners.length);
  };

  const goPrev = () => {
    if (isAnimating || banners.length <= 1) return;
    goTo((currentIndex - 1 + banners.length) % banners.length);
  };

  if (banners.length === 0) {
    return (
      <div className="banner-empty">
        <Image size={48} />
        <p>{t('Баннеры не добавлены', 'No banners yet')}</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="banner-carousel">
      <div className={`banner-slide ${isAnimating ? 'animating' : ''}`}>
        <img
          src={currentBanner.image}
          alt={t(currentBanner.title_ru, currentBanner.title_en)}
          onError={(e) => e.target.src = 'https://placehold.co/800x300/78350f/white?text=Banner'}
        />
        {(currentBanner.title_ru || currentBanner.title_en) && (
          <div className="banner-title">
            {t(currentBanner.title_ru, currentBanner.title_en)}
          </div>
        )}
        {isAdmin && (
          <button
            className="banner-delete-btn"
            onClick={() => onDelete(currentBanner.id)}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button className="banner-nav banner-prev" onClick={goPrev}>
            <ChevronLeft size={24} />
          </button>
          <button className="banner-nav banner-next" onClick={goNext}>
            <ChevronRight size={24} />
          </button>

          <div className="banner-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Форма добавления баннера (только для админа)
const BannerForm = ({ onSubmit, isLoading, t }) => {
  return (
    <div className="admin-panel banner-form-panel">
      <h3 className="admin-title">{t('Добавить баннер', 'Add Banner')}</h3>
      <form onSubmit={onSubmit} className="admin-form">
        <div className="form-row">
          <Input name="title_ru" placeholder="Заголовок RU (опционально)" />
          <Input name="title_en" placeholder="Title EN (optional)" />
        </div>
        <Input name="image" placeholder="URL изображения баннера *" required />
        <Button type="submit" disabled={isLoading} style={{ width: '100%' }}>
          <Plus size={18} /> {t('Добавить баннер', 'Add Banner')}
        </Button>
      </form>
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
  const [banners, setBanners] = useState([]);

  // Состояния пользователя
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [showUserAuthModal, setShowUserAuthModal] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const t = useCallback((ru, en) => (lang === 'ru' ? ru : en), [lang]);

  // Проверка токена админа
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

  // Проверка токена пользователя
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      fetch(`${API_BASE_URL}/user/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setUserToken(token);
            setUser(data.user);
          } else {
            localStorage.removeItem('userToken');
          }
        })
        .catch(() => localStorage.removeItem('userToken'));
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

  const handleUserAuth = (token, userData) => {
    setUserToken(token);
    setUser(userData);
  };

  const handleUserLogout = () => {
    localStorage.removeItem('userToken');
    setUserToken(null);
    setUser(null);
  };

  const handleBonusClick = () => {
    if (!user) {
      setShowUserAuthModal(true);
    } else {
      setShowGame(true);
    }
  };

  const handleGameEnd = async (bonuses) => {
    if (!userToken || bonuses <= 0) {
      setShowGame(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/add-bonuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ bonuses })
      });

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, bonuses: data.totalBonuses }));
        window.alert(t(`Поздравляем! Вы получили ${bonuses} бонусов!`, `Congratulations! You received ${bonuses} bonuses!`));
      }
    } catch (error) {
      console.error('Error adding bonuses:', error);
    }

    setShowGame(false);
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

  const loadBanners = useCallback(async () => {
    const data = await fetchData('/banners');
    setBanners(data);
  }, [fetchData]);

  useEffect(() => {
    if (lang) {
      loadCategories();
      loadBanners();
    }
  }, [lang, loadCategories, loadBanners]);

  useEffect(() => {
    if (activeCategory) {
      loadItems(activeCategory.id);
    }
  }, [activeCategory, loadItems]);

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!adminToken) {
      window.alert(t('Необходима авторизация', 'Authorization required'));
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.target);
    const data = {
      titleRu: formData.get('title_ru') || '',
      titleEn: formData.get('title_en') || '',
      image: formData.get('image')
    };

    try {
      const response = await fetch(`${API_BASE_URL}/banners`, {
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

      loadBanners();
      e.target.reset();
    } catch (error) {
      window.alert(t('Ошибка сохранения.', 'Save error.'));
    }
    setIsLoading(false);
  };

  const handleBannerDelete = async (id) => {
    if (!adminToken) {
      window.alert(t('Необходима авторизация', 'Authorization required'));
      return;
    }
    if (!window.confirm(t('Удалить баннер?', 'Delete banner?'))) return;

    try {
      const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 401) {
        handleLogout();
        window.alert(t('Сессия истекла. Войдите снова.', 'Session expired. Please login again.'));
        return;
      }

      loadBanners();
    } catch (error) {
      window.alert(t('Ошибка удаления.', 'Delete error.'));
    }
  };

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
    setIsLoading(false);
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
    setIsLoading(false);
  };

  if (!lang) return <LanguageScreen setLang={setLang} />;

  return (
    <div>
      {/* МОДАЛЬНЫЕ ОКНА */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        t={t}
      />
      <UserAuthModal
        isOpen={showUserAuthModal}
        onClose={() => setShowUserAuthModal(false)}
        onAuth={handleUserAuth}
        t={t}
      />
      {showGame && (
        <MiniGame
          onClose={() => setShowGame(false)}
          onGameEnd={handleGameEnd}
          t={t}
        />
      )}

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

          {/* Информация о пользователе */}
          {user && (
            <div className="user-info">
              <Gift size={16} />
              <span>{user.bonuses}</span>
            </div>
          )}

          <Button variant="ghost" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} className="icon-btn">
            <Globe size={20} />
          </Button>

          {/* Кнопки пользователя */}
          {user ? (
            <Button variant="ghost" onClick={handleUserLogout} className="icon-btn user-btn" title={`${user.username} - ${t('Выйти', 'Logout')}`}>
              <User size={20} />
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setShowUserAuthModal(true)} className="icon-btn" title={t('Войти', 'Login')}>
              <User size={20} />
            </Button>
          )}

          {/* Кнопки админа */}
          {isAdmin ? (
            <>
              <Button variant="ghost" className="icon-btn active" title={t('Админ режим', 'Admin mode')}>
                <Settings size={20} />
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="icon-btn" title={t('Выйти (админ)', 'Logout (admin)')}>
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

      {/* КНОПКА ПОЛУЧИТЬ БОНУСЫ */}
      <div className="bonus-button-container">
        <Button variant="bonus" onClick={handleBonusClick} className="bonus-btn">
          <Gift size={20} />
          {t('Получить бонусы', 'Get Bonuses')}
          <Gamepad2 size={20} />
        </Button>
      </div>

      {/* MAIN */}
      <main className="main">
        {/* БАННЕР-КАРУСЕЛЬ */}
        {view === 'categories' && (
          <>
            <BannerCarousel
              banners={banners}
              isAdmin={isAdmin}
              onDelete={handleBannerDelete}
              t={t}
            />
            {isAdmin && (
              <BannerForm
                onSubmit={handleBannerSubmit}
                isLoading={isLoading}
                t={t}
              />
            )}
          </>
        )}

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

        {/* ТОВАРЫ */}
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
