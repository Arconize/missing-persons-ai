import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import HomePage     from './pages/HomePage';
import AuthPage     from './pages/AuthPage';
import SubmitPage   from './pages/SubmitPage';
import ShowcasePage from './pages/ShowcasePage';
import DetailPage   from './pages/DetailPage';
import SearchPage   from './pages/SearchPage';
import AdminPage    from './pages/AdminPage';
import DocsPage     from './pages/DocsPage';
import './App.css';

function AppInner() {
  const { user, logout } = useAuth();
  const [page, setPage]       = useState('home');
  const [detailId, setDetailId] = useState(null);
  const [menuOpen, setMenu]   = useState(false);

  const nav = (p) => { setPage(p); setMenu(false); };

  const navItems = [
    { key: 'home',     label: '🏠 خانه' },
    { key: 'showcase', label: '👥 پرونده‌ها' },
    { key: 'search',   label: '🔍 جستجو' },
    { key: 'submit',   label: '📋 ثبت گزارش' },
    { key: 'docs',     label: '📚 راهنما' },
    ...(user?.role === 'admin' ? [{ key: 'admin', label: '🛡️ مدیریت' }] : []),
  ];

  return (
    <div className="app-container" dir="rtl">
      {/* ── Navbar ── */}
      <nav className="navbar glass">
        <div className="nav-brand" onClick={() => nav('home')}>
          <span className="brand-icon">🔍</span>
          <span className="brand-text">FindMe</span>
        </div>

        {/* Desktop links */}
        <div className="nav-links desktop-nav">
          {navItems.map(n => (
            <button key={n.key} className={page === n.key ? 'active' : ''}
              onClick={() => nav(n.key)}>{n.label}</button>
          ))}
        </div>

        {/* Auth area */}
        <div className="nav-auth">
          {user ? (
            <div className="user-menu">
              <span className="user-badge glass">
                {user.role === 'admin' ? '🛡️' : '👤'} {user.username}
              </span>
              <button className="btn-ghost btn-sm" onClick={logout}>خروج</button>
            </div>
          ) : (
            <button className="btn-primary btn-sm" onClick={() => nav('auth')}>
              🔑 ورود
            </button>
          )}
          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMenu(o => !o)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mobile-menu glass">
          {navItems.map(n => (
            <button key={n.key} className={page === n.key ? 'active' : ''}
              onClick={() => nav(n.key)}>{n.label}</button>
          ))}
        </div>
      )}

      {/* ── Page router ── */}
      <main className="main-content">
        {page === 'home'     && <HomePage     setPage={nav} />}
        {page === 'auth'     && <AuthPage     setPage={nav} />}
        {page === 'submit'   && <SubmitPage   setPage={nav} />}
        {page === 'showcase' && <ShowcasePage setPage={nav} setDetailId={setDetailId} />}
        {page === 'detail'   && <DetailPage   personId={detailId} setPage={nav} />}
        {page === 'search'   && <SearchPage   setPage={nav} setDetailId={setDetailId} />}
        {page === 'admin'    && <AdminPage    setPage={nav} />}
        {page === 'docs'     && <DocsPage />}
      </main>

      <footer className="footer glass">
        <p>© ۱۴۰۵ سامانه هوشمند جستجوی افراد گمشده — FindMe v2.0</p>
        <p>ساخته‌شده با ❤️ برای کمک به جامعه</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
