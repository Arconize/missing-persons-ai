import { useState } from 'react';
import { api } from '../api';
import MarkFoundModal from '../components/MarkFoundModal';

const IMG = 'http://127.0.0.1:8000/';

export default function SearchPage({ setPage, setDetailId }) {
  const [tab, setTab]         = useState('meta');
  const [filters, setFilters] = useState({ name:'', status:'', age_min:'', age_max:'', last_location:'', national_code:'', height:'' });
  const [faceImg, setFaceImg] = useState(null);
  const [faceFilters, setFF]  = useState({ age:'', height:'', national_code:'', last_location:'' });
  const [results, setResults] = useState(null);
  const [msg, setMsg]         = useState('');
  const [loading, setL]       = useState(false);

  // mark-found modal state
  const [modalPerson, setModalPerson] = useState(null);

  const handleMeta = async (e) => {
    e.preventDefault();
    setL(true); setMsg('⏳ در حال جستجو...');
    try {
      const d = await api.searchPersons({ ...filters, page: 1, limit: 20 });
      setResults(d.results);
      setMsg(`✅ ${d.total} نتیجه یافت شد`);
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally { setL(false); }
  };

  const handleFace = async (e) => {
    e.preventDefault();
    if (!faceImg) { setMsg('❌ لطفاً عکس را انتخاب کنید'); return; }
    setL(true); setMsg('⏳ در حال تحلیل چهره با هوش مصنوعی...');
    const fd = new FormData();
    fd.append('image', faceImg);
    Object.entries(faceFilters).forEach(([k,v]) => { if(v) fd.append(k,v); });
    try {
      const d = await api.matchFace(fd);
      setResults(d.matches);
      setMsg(d.message);
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally { setL(false); }
  };

  const openDetail = (id) => { setDetailId(id); setPage('detail'); };

  // Called when modal confirms — update the card locally without re-fetching
  const handleFoundSuccess = (name) => {
    setModalPerson(null);
    setResults(prev => prev.map(p =>
      p.id === modalPerson.id ? { ...p, status: 'found' } : p
    ));
    setMsg(`✅ وضعیت ${name} به «پیدا شده» تغییر کرد`);
  };

  return (
    <div className="page-content fade-in">
      {/* Mark-found modal */}
      {modalPerson && (
        <MarkFoundModal
          person={modalPerson}
          onClose={() => setModalPerson(null)}
          onSuccess={handleFoundSuccess}
        />
      )}

      <div className="form-card glass wide-card">
        <h2>🔍 جستجوی پیشرفته</h2>

        <div className="search-tabs">
          <button className={tab === 'meta' ? 'active' : ''} onClick={() => setTab('meta')}>
            🔎 جستجو با فیلتر
          </button>
          <button className={tab === 'face' ? 'active' : ''} onClick={() => setTab('face')}>
            🤖 تطبیق چهره با هوش مصنوعی
          </button>
        </div>

        {tab === 'meta' && (
          <form onSubmit={handleMeta}>
            <div className="form-grid">
              <div className="form-group">
                <label>نام</label>
                <input type="text" placeholder="جستجو بر اساس نام"
                  value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>وضعیت</label>
                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                  <option value="">همه</option>
                  <option value="missing">گمشده</option>
                  <option value="found">پیدا شده</option>
                </select>
              </div>
              <div className="form-group">
                <label>حداقل سن</label>
                <input type="number" min="0" placeholder="مثال: ۱۸"
                  value={filters.age_min} onChange={e => setFilters({...filters, age_min: e.target.value})} />
              </div>
              <div className="form-group">
                <label>حداکثر سن</label>
                <input type="number" min="0" placeholder="مثال: ۴۵"
                  value={filters.age_max} onChange={e => setFilters({...filters, age_max: e.target.value})} />
              </div>
              <div className="form-group">
                <label>محل مشاهده</label>
                <input type="text" placeholder="شهر یا محله"
                  value={filters.last_location} onChange={e => setFilters({...filters, last_location: e.target.value})} />
              </div>
              <div className="form-group">
                <label>کد ملی</label>
                <input type="text" placeholder="۱۰ رقمی"
                  value={filters.national_code} onChange={e => setFilters({...filters, national_code: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ در حال جستجو...' : '🔍 جستجو'}
            </button>
          </form>
        )}

        {tab === 'face' && (
          <form onSubmit={handleFace}>
            <div className="upload-zone">
              <label>عکس برای تطبیق *</label>
              <div className="upload-inner">
                {faceImg ? (
                  <div className="preview-wrapper">
                    <img src={URL.createObjectURL(faceImg)} alt="face" className="img-preview" />
                    <button type="button" className="btn-ghost btn-sm"
                      onClick={() => setFaceImg(null)}>✕ حذف</button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📸</div>
                    <p>عکس فرد مورد نظر را آپلود کنید</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="file-input-overlay"
                  onChange={e => setFaceImg(e.target.files[0])} />
              </div>
            </div>
            <h3 style={{margin:'20px 0 10px',color:'#e2e8f0'}}>فیلترهای اختیاری</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>سن</label>
                <input type="number" value={faceFilters.age}
                  onChange={e => setFF({...faceFilters, age: e.target.value})} />
              </div>
              <div className="form-group">
                <label>قد</label>
                <input type="text" value={faceFilters.height}
                  onChange={e => setFF({...faceFilters, height: e.target.value})} />
              </div>
              <div className="form-group">
                <label>کد ملی</label>
                <input type="text" value={faceFilters.national_code}
                  onChange={e => setFF({...faceFilters, national_code: e.target.value})} />
              </div>
              <div className="form-group">
                <label>محل</label>
                <input type="text" value={faceFilters.last_location}
                  onChange={e => setFF({...faceFilters, last_location: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ در حال تحلیل چهره‌ها...' : '🤖 شروع جستجوی هوشمند'}
            </button>
          </form>
        )}

        {msg && <p className="message">{msg}</p>}

        {results && (
          <div className="results-container">
            {results.length === 0 ? (
              <div className="empty-state">هیچ نتیجه‌ای یافت نشد</div>
            ) : results.map(p => (
              <div key={p.id} className="result-card glass">
                {/* Clickable image area → detail */}
                <div className="result-img-wrapper" onClick={() => openDetail(p.id)} style={{cursor:'pointer'}}>
                  <img src={IMG + p.image_path} alt={p.name}
                    onError={e => { e.target.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231e293b" width="100" height="100"/><text y="55" x="50" text-anchor="middle" font-size="40">👤</text></svg>'; }} />
                </div>
                <div className="result-info">
                  <h3 onClick={() => openDetail(p.id)} style={{cursor:'pointer'}}>
                    {p.name}
                    <span className={`status-badge ${p.status}`}>{p.status==='missing'?'گمشده':'پیدا شده'}</span>
                  </h3>
                  <div className="info-grid">
                    <p><strong>سن:</strong> {p.age||'نامشخص'}</p>
                    <p><strong>قد:</strong> {p.height||'نامشخص'}</p>
                    <p><strong>کد ملی:</strong> {p.national_code||'نامشخص'}</p>
                    <p><strong>📍 محل:</strong> {p.last_location||'نامشخص'}</p>
                  </div>
                  <p className="desc"><strong>توضیحات:</strong> {p.description||'—'}</p>
                  {p.contact_info && (
                    <div className="contact-box">
                      <strong>📞 اطلاعات تماس:</strong>
                      <span>{p.contact_info}</span>
                    </div>
                  )}

                  {/* ── Mark-found button ── only shows for missing records */}
                  {p.status === 'missing' && (
                    <button
                      className="btn-found-report"
                      onClick={() => setModalPerson(p)}
                    >
                      🟢 این فرد پیدا شد
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
