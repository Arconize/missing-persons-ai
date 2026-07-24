import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function AuthPage({ setPage }) {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState('login');
  const [form, setForm]     = useState({ username: '', email: '', password: '' });
  const [msg, setMsg]       = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.username, form.password);
      } else {
        user = await register(form.username, form.email, form.password);
      }
      setMsg('✅ موفق! در حال انتقال...');
      setTimeout(() => setPage(user.role === 'admin' ? 'admin' : 'showcase'), 800);
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="auth-card glass">
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            🔑 ورود
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            📝 ثبت‌نام
          </button>
        </div>

        <h2>{mode === 'login' ? 'ورود به سامانه' : 'ثبت‌نام در سامانه'}</h2>

        <form onSubmit={handle}>
          <div className="form-group">
            <label>نام کاربری</label>
            <input
              type="text" required
              placeholder="نام کاربری خود را وارد کنید"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>ایمیل</label>
              <input
                type="email" required
                placeholder="example@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label>رمز عبور</label>
            <input
              type="password" required
              placeholder="حداقل ۶ کاراکتر"
              minLength={6}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? '⏳ در حال پردازش...' : (mode === 'login' ? '🔑 ورود' : '📝 ثبت‌نام')}
          </button>
        </form>

        {msg && <p className="message">{msg}</p>}

      </div>
    </div>
  );
}
