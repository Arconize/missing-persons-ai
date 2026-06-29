import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function HomePage({ setPage }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Quick public stats from listing
    api.listPersons(1, null).then(d => setStats({ total: d.total })).catch(() => {});
  }, []);

  return (
    <div className="home-page fade-in">
      <div className="hero-section">
        <div className="hero-badge">🤖 هوش مصنوعی تشخیص چهره</div>
        <h1>کمک به بازگشت عزیزان گمشده</h1>
        <p>
          هر فرد گمشده، خانواده‌ای دارد که با اشتیاق منتظر بازگشت اوست.
          با استفاده از پیشرفته‌ترین الگوریتم‌های هوش مصنوعی و تطبیق چهره،
          روند جستجو را سریع‌تر و دقیق‌تر می‌کنیم.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary" onClick={() => setPage('submit')}>
            📋 ثبت گزارش
          </button>
          <button className="btn-secondary" onClick={() => setPage('search')}>
            🔍 جستجو در پایگاه داده
          </button>
          <button className="btn-ghost" onClick={() => setPage('showcase')}>
            👥 مشاهده همه موارد
          </button>
        </div>
        {stats && (
          <div className="hero-stat glass">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">پرونده ثبت‌شده در سامانه</span>
          </div>
        )}
      </div>

      <div className="how-it-works">
        <h2>نحوه کار سامانه</h2>
        <div className="steps">
          {[
            { icon: '📝', n: '۱', title: 'ثبت گزارش', desc: 'اطلاعات و عکس فرد گمشده یا پیدا شده را ثبت کنید' },
            { icon: '✅', n: '۲', title: 'تأیید مدیر', desc: 'تیم مدیریت گزارش را بررسی و تأیید می‌کند' },
            { icon: '📸', n: '۳', title: 'آپلود عکس', desc: 'یک عکس واضح از فرد مورد نظر بارگذاری کنید' },
            { icon: '🤖', n: '۴', title: 'تحلیل هوش مصنوعی', desc: 'سیستم دیتابیس را برای یافتن شباهت‌های چهره بررسی می‌کند' },
            { icon: '🤝', n: '۵', title: 'اتصال دوباره', desc: 'در صورت تطابق چهره، خانواده‌ها به هم متصل می‌شوند' },
          ].map(s => (
            <div key={s.n} className="step-card glass fade-in-up">
              <div className="step-icon">{s.icon}</div>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card glass">
          <span>🔐</span>
          <h3>امنیت پیشرفته</h3>
          <p>احراز هویت امن با توکن‌های رمزنگاری‌شده و کنترل دسترسی مبتنی بر نقش</p>
        </div>
        <div className="feature-card glass">
          <span>🧠</span>
          <h3>هوش مصنوعی VGG-Face</h3>
          <p>تشخیص چهره با استفاده از مدل پیشرفته DeepFace برای دقت بالا</p>
        </div>
        <div className="feature-card glass">
          <span>🛡️</span>
          <h3>نظارت مدیران</h3>
          <p>تمام گزارش‌ها قبل از انتشار توسط مدیران تأیید می‌شوند</p>
        </div>
        <div className="feature-card glass">
          <span>📱</span>
          <h3>طراحی واکنش‌گرا</h3>
          <p>قابل استفاده در تمامی دستگاه‌ها از موبایل تا دسکتاپ</p>
        </div>
      </div>
    </div>
  );
}
