import { useState, useEffect } from 'react';
import { api } from '../api';
import MarkFoundModal from '../components/MarkFoundModal';

const IMG = 'https://whocareswashere-missing-persons-ai-backend.hf.space/';

export default function ShowcasePage({ setPage, setDetailId }) {
  const [data, setData]       = useState({ results: [], total: 0, pages: 1 });
  const [page, setP]          = useState(1);
  const [filter, setFilter]   = useState('');
  const [loading, setLoading] = useState(true);
  const [modalPerson, setModal] = useState(null);

  const load = (p, s) => {
    setLoading(true);
    api.listPersons(p, s || null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, filter); }, []);

  const handleFilter = (s) => { setFilter(s); setP(1); load(1, s); };
  const handlePage   = (p) => { setP(p); load(p, filter); };
  const openDetail   = (id) => { setDetailId(id); setPage('detail'); };

  const handleFoundSuccess = (name) => {
    const updated = modalPerson.id;
    setModal(null);
    // Flip locally so the badge updates instantly
    setData(prev => ({
      ...prev,
      results: prev.results.map(p =>
        p.id === updated ? { ...p, status: 'found' } : p
      )
    }));
  };

  return (
    <div className="showcase-page fade-in">
      {modalPerson && (
        <MarkFoundModal
          person={modalPerson}
          onClose={() => setModal(null)}
          onSuccess={handleFoundSuccess}
        />
      )}

      <div className="showcase-header">
        <h2>👥 پایگاه داده افراد</h2>
        <div className="filter-tabs">
          {[['', 'همه'], ['missing', 'گمشده'], ['found', 'پیدا شده']].map(([v, l]) => (
            <button key={v} className={filter === v ? 'active' : ''}
              onClick={() => handleFilter(v)}>{l}</button>
          ))}
        </div>
        <p className="total-count">{data.total} پرونده</p>
      </div>

      {loading ? (
        <div className="loading-spinner">⏳ در حال بارگذاری...</div>
      ) : (
        <>
          <div className="cards-grid">
            {data.results.length === 0 ? (
              <div className="empty-state">هیچ پرونده‌ای یافت نشد</div>
            ) : data.results.map(p => (
              <div key={p.id} className="person-card glass">
                {/* Image → detail */}
                <div className="card-img" onClick={() => openDetail(p.id)} style={{cursor:'pointer'}}>
                  <img src={IMG + p.image_path} alt={p.name}
                    onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231e293b" width="100" height="100"/><text y="55" x="50" text-anchor="middle" font-size="40">👤</text></svg>'; }} />
                  <span className={`status-badge ${p.status}`}>
                    {p.status === 'missing' ? 'گمشده' : 'پیدا شده'}
                  </span>
                </div>
                <div className="card-body">
                  <h3 onClick={() => openDetail(p.id)} style={{cursor:'pointer'}}>{p.name}</h3>
                  <div className="card-meta">
                    {p.age && <span>سن: {p.age}</span>}
                    {p.last_location && <span>📍 {p.last_location}</span>}
                  </div>
                  <p className="card-desc">{p.description?.slice(0, 80) || '—'}{p.description?.length > 80 ? '...' : ''}</p>

                  {/* ── Mark-found button ── only for missing records */}
                  {p.status === 'missing' && (
                    <button
                      className="btn-found-report btn-found-card"
                      onClick={() => setModal(p)}
                    >
                      🟢 پیدا شد
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="pagination">
              {Array.from({length: data.pages}, (_, i) => i + 1).map(n => (
                <button key={n} className={n === page ? 'active' : ''}
                  onClick={() => handlePage(n)}>{n}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
