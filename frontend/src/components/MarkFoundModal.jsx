import { useState } from 'react';
import { api } from '../api';

/**
 * Modal for filing a found-report.
 * Calls POST /persons/{id}/found-reports — no auth required.
 * onSuccess(personName) is called after successful submission.
 */
export default function MarkFoundModal({ person, onClose, onSuccess }) {
  const [form, setForm] = useState({
    reporter_name: '',
    contact_info:  '',
    location_seen: '',
    description:   '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const submit = async () => {
    setLoading(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      await api.fileFoundReport(person.id, fd);
      onSuccess(person.name);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box glass" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-icon">🟢</div>
        <h2>گزارش یافتن فرد</h2>
        <p className="modal-sub">
          گزارش پیدا شدن <strong>{person.name}</strong> ثبت می‌شود
          و به گزارش‌دهنده اصلی برای تأیید ارسال خواهد شد.
        </p>

        <div className="modal-form">
          <div className="form-group">
            <label>نام شما (اختیاری)</label>
            <input type="text" placeholder="نام گزارش‌دهنده"
              value={form.reporter_name}
              onChange={e => setForm({ ...form, reporter_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>اطلاعات تماس شما (اختیاری)</label>
            <input type="text" placeholder="شماره تلفن یا ایمیل"
              value={form.contact_info}
              onChange={e => setForm({ ...form, contact_info: e.target.value })} />
          </div>
          <div className="form-group">
            <label>محل مشاهده</label>
            <input type="text" placeholder="کجا این فرد را دیدید؟"
              value={form.location_seen}
              onChange={e => setForm({ ...form, location_seen: e.target.value })} />
          </div>
          <div className="form-group">
            <label>توضیحات بیشتر</label>
            <textarea rows="2" placeholder="جزئیات بیشتر در مورد مشاهده..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        {err && <p className="message" style={{ color: '#f87171', marginTop: '10px' }}>❌ {err}</p>}

        <div className="modal-actions">
          <button className="btn-success" onClick={submit} disabled={loading}>
            {loading ? '⏳ در حال ثبت...' : '✅ ثبت گزارش'}
          </button>
          <button className="btn-ghost" onClick={onClose} disabled={loading}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
