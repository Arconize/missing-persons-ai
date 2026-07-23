import { useState, useEffect } from 'react';
import { api } from '../api';
import MarkFoundModal from '../components/MarkFoundModal';

const IMG = 'http://127.0.0.1:8000/';

export default function DetailPage({ personId, setPage }) {
  const [p, setP]           = useState(null);
  const [loading, setL]     = useState(true);
  const [err, setErr]       = useState('');
  const [showModal, setModal] = useState(false);
  const [foundMsg, setFoundMsg] = useState('');

  useEffect(() => {
    if (!personId) { setPage('showcase'); return; }
    api.getPerson(personId)
      .then(setP)
      .catch(e => setErr(e.message))
      .finally(() => setL(false));
  }, [personId]);

  const handleFoundSuccess = (name) => {
    setModal(false);
    setP(prev => ({ ...prev, status: 'found' }));
    setFoundMsg(`✅ وضعیت ${name} با موفقیت به «پیدا شده» تغییر کرد`);
  };

  if (loading) return <div className="page-content"><div className="loading-spinner">⏳ در حال بارگذاری...</div></div>;
  if (err)     return <div className="page-content"><div className="error-box glass">❌ {err}</div></div>;
  if (!p)      return null;

  return (
    <div className="page-content fade-in">
      {showModal && (
        <MarkFoundModal
          person={p}
          onClose={() => setModal(false)}
          onSuccess={handleFoundSuccess}
        />
      )}

      <button className="btn-ghost back-btn" onClick={() => setPage('showcase')}>← بازگشت</button>

      {foundMsg && <p className="message found-success-msg">{foundMsg}</p>}

      <div className="detail-card glass">
        <div className="detail-img-col">
          <img src={IMG + p.image_path} alt={p.name}
            onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%231e293b" width="200" height="200"/><text y="110" x="100" text-anchor="middle" font-size="80">👤</text></svg>'; }} />
          <span className={`status-badge ${p.status} big-badge`}>
            {p.status === 'missing' ? '🔴 گمشده' : '🟢 پیدا شده'}
          </span>

          {/* Mark-found button — visible on detail page for missing persons */}
          {p.status === 'missing' && (
            <button
              className="btn-found-report btn-found-detail"
              onClick={() => setModal(true)}
            >
              🟢 این فرد را پیدا کردم
            </button>
          )}
        </div>

        <div className="detail-info-col">
          <h1>{p.name}</h1>
          <p className="detail-date">ثبت شده در: {p.created_at ? new Date(p.created_at).toLocaleDateString('fa-IR') : '—'}</p>

          <div className="detail-grid">
            <div className="detail-item"><span className="di-label">سن</span><span>{p.age || 'نامشخص'}</span></div>
            <div className="detail-item"><span className="di-label">قد</span><span>{p.height || 'نامشخص'}</span></div>
            <div className="detail-item"><span className="di-label">کد ملی</span><span>{p.national_code || 'نامشخص'}</span></div>
            <div className="detail-item"><span className="di-label">📍 محل مشاهده</span><span>{p.last_location || 'نامشخص'}</span></div>
          </div>

          {p.description && (
            <div className="detail-section">
              <h3>توضیحات</h3>
              <p>{p.description}</p>
            </div>
          )}

          {p.contact_info && (
            <div className="contact-box">
              <strong>📞 اطلاعات تماس / محل نگهداری:</strong>
              <span>{p.contact_info}</span>
            </div>
          )}

          {p.status === 'missing' && (
            <div className="info-box">
              <p>اگر این فرد را دیده‌اید، می‌توانید گزارش دهید:</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => setPage('submit')}>📋 ثبت مشاهده با عکس</button>
                <button className="btn-found-report" onClick={() => setModal(true)}>🟢 پیدا شده</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
