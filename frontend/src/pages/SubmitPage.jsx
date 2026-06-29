import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function SubmitPage({ setPage }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', status: 'missing', description: '',
    age: '', height: '', national_code: '',
    last_location: '', contact_info: ''
  });
  const [image, setImage]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const f = e.target.files[0];
    setImage(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handle = async (e) => {
    e.preventDefault();
    if (!image) { setMsg('❌ لطفاً یک عکس انتخاب کنید'); return; }
    setLoading(true); setMsg('⏳ در حال ارسال...');
    const fd = new FormData();
    fd.append('image', image);
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    try {
      const res = await api.submitPerson(fd);
      setMsg('✅ ' + res.message);
      setForm({ name:'',status:'missing',description:'',age:'',height:'',national_code:'',last_location:'',contact_info:'' });
      setImage(null); setPreview(null);
      e.target.reset();
    } catch (err) {
      setMsg('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="page-content fade-in">
      <div className="auth-required glass">
        <div className="auth-req-icon">🔐</div>
        <h2>ورود الزامی است</h2>
        <p>برای ثبت گزارش ابتدا وارد سامانه شوید</p>
        <button className="btn-primary" onClick={() => setPage('auth')}>ورود / ثبت‌نام</button>
      </div>
    </div>
  );

  return (
    <div className="page-content fade-in">
      <div className="form-card glass wide-card">
        <h2>📋 ثبت اطلاعات فرد گمشده یا پیدا شده</h2>
        <p className="form-desc">
          لطفاً اطلاعات را تا حد امکان دقیق و کامل وارد کنید.
          گزارش شما پس از بررسی توسط مدیران در سامانه منتشر می‌شود.
        </p>

        <form onSubmit={handle}>
          <div className="form-grid">
            <div className="form-group">
              <label>نام و نام خانوادگی *</label>
              <input type="text" required
                placeholder="نام کامل فرد"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label>وضعیت *</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="missing">🔴 گمشده</option>
                <option value="found">🟢 پیدا شده</option>
              </select>
            </div>

            <div className="form-group">
              <label>سن (تقریبی)</label>
              <input type="number" min="0" max="120"
                placeholder="مثال: ۲۵"
                value={form.age}
                onChange={e => setForm({...form, age: e.target.value})} />
            </div>

            <div className="form-group">
              <label>قد</label>
              <input type="text"
                placeholder="مثال: ۱۷۵ سانتی‌متر"
                value={form.height}
                onChange={e => setForm({...form, height: e.target.value})} />
            </div>

            <div className="form-group">
              <label>کد ملی</label>
              <input type="text" maxLength={10}
                placeholder="۱۰ رقمی"
                value={form.national_code}
                onChange={e => setForm({...form, national_code: e.target.value})} />
            </div>

            <div className="form-group">
              <label>آخرین محل مشاهده</label>
              <input type="text"
                placeholder="مثال: میدان آزادی، تهران"
                value={form.last_location}
                onChange={e => setForm({...form, last_location: e.target.value})} />
            </div>

            <div className="form-group full-width">
              <label>اطلاعات تماس</label>
              <input type="text"
                placeholder="شماره تلفن یا آدرس محل نگهداری"
                value={form.contact_info}
                onChange={e => setForm({...form, contact_info: e.target.value})} />
            </div>

            <div className="form-group full-width">
              <label>توضیحات / لباس / نشانه‌های خاص</label>
              <textarea rows="3"
                placeholder="هر اطلاعات تکمیلی که می‌تواند در شناسایی کمک کند..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>

          <div className="upload-zone">
            <label>عکس فرد *</label>
            <div className="upload-inner">
              {preview ? (
                <div className="preview-wrapper">
                  <img src={preview} alt="preview" className="img-preview" />
                  <button type="button" className="btn-ghost btn-sm"
                    onClick={() => { setImage(null); setPreview(null); }}>
                    ✕ حذف عکس
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📸</div>
                  <p>کلیک کنید یا عکس را اینجا بکشید</p>
                  <small>فرمت‌های مجاز: JPG, PNG, WEBP</small>
                </div>
              )}
              <input type="file" accept="image/*" className="file-input-overlay"
                onChange={handleImage} />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? '⏳ در حال ارسال...' : '📋 ثبت گزارش'}
          </button>
          {msg && <p className="message">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
