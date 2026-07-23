import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const IMG = 'http://127.0.0.1:8000/';

const STATUS_OPTIONS = [
  { value: 'missing',              label: '🔴 گمشده' },
  { value: 'pending_confirmation', label: '🔔 در انتظار تأیید پیدا شدن' },
  { value: 'found',                label: '🟢 پیدا شده' },
];
const STATUS_CLS  = { missing: 'missing', found: 'found', pending_confirmation: 'pending-conf' };
const STATUS_TEXT = { missing: 'گمشده', found: 'پیدا شده', pending_confirmation: 'در انتظار تأیید' };
const FR_STATUS   = {
  pending:   { label: '⏳ در انتظار', cls: 'fr-pending'   },
  confirmed: { label: '✅ تأیید',     cls: 'fr-confirmed' },
  rejected:  { label: '❌ رد شده',   cls: 'fr-rejected'  },
};

export default function AdminPage({ setPage }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [msg, setMsg] = useState('');

  /* ── State: stats ── */
  const [stats, setStats] = useState(null);

  /* ── State: pending submissions ── */
  const [pending, setPending] = useState([]);

  /* ── State: persons management ── */
  const [persons, setPersons]       = useState([]);
  const [pFilter, setPF]            = useState({ name: '', status: '', approved: '' });
  const [pPage, setPPage]           = useState(1);
  const [pTotal, setPTotal]         = useState(0);
  const [pPages, setPPages]         = useState(1);
  const [editNotes, setEditNotes]   = useState({});

  /* ── State: found-reports ── */
  const [fReports, setFReports]     = useState([]);
  const [frFilter, setFrFilter]     = useState('');
  const [frPage, setFrPage]         = useState(1);
  const [frTotal, setFrTotal]       = useState(0);
  const [frPages, setFrPages]       = useState(1);

  /* ── State: users ── */
  const [users, setUsers] = useState([]);

  /* ── Loaders ── */
  const loadStats   = () => api.adminStats().then(setStats).catch(() => {});
  const loadPending = () => api.adminPending(1).then(d => setPending(d.results)).catch(() => {});
  const loadUsers   = () => api.adminUsers().then(setUsers).catch(() => {});

  const loadPersons = (page = 1, f = pFilter) =>
    api.adminPersons({ page, limit: 15, ...f }).then(d => {
      setPersons(d.results); setPTotal(d.total); setPPages(d.pages); setPPage(page);
    }).catch(() => {});

  const loadFR = (page = 1, status = frFilter) =>
    api.adminFoundReports(page, status).then(d => {
      setFReports(d.results); setFrTotal(d.total); setFrPages(d.pages); setFrPage(page);
    }).catch(() => {});

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadStats(); loadPending(); loadUsers(); loadPersons(1); loadFR(1);
  }, [user]);

  if (!user || user.role !== 'admin') return (
    <div className="page-content fade-in">
      <div className="auth-required glass">
        <div className="auth-req-icon">🛡️</div>
        <h2>دسترسی مدیر الزامی است</h2>
        <button className="btn-primary" onClick={() => setPage('auth')}>ورود به سامانه</button>
      </div>
    </div>
  );

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  /* ── Actions: pending ── */
  const approvePerson = async id => {
    try { await api.approve(id); notify('✅ پرونده منتشر شد'); loadPending(); loadStats(); loadPersons(pPage); }
    catch (e) { notify('❌ ' + e.message); }
  };
  const rejectPerson = async id => {
    try { await api.reject(id); notify('🗑️ پرونده رد شد'); loadPending(); loadStats(); loadPersons(pPage); }
    catch (e) { notify('❌ ' + e.message); }
  };

  /* ── Actions: persons ── */
  const deletePerson = async id => {
    if (!confirm('آیا مطمئن هستید؟ این عمل قابل بازگشت نیست.')) return;
    try { await api.adminDeletePerson(id); notify('🗑️ پرونده حذف شد'); loadPersons(pPage); loadStats(); }
    catch (e) { notify('❌ ' + e.message); }
  };
  const setPersonStatus = async (id, status) => {
    try { await api.adminSetStatus(id, status); notify('✅ وضعیت به‌روز شد'); loadPersons(pPage); loadStats(); }
    catch (e) { notify('❌ ' + e.message); }
  };
  const saveNotes = async id => {
    try { await api.adminSetNotes(id, editNotes[id] ?? ''); notify('✅ یادداشت ذخیره شد'); }
    catch (e) { notify('❌ ' + e.message); }
  };
  const approveDraft = async id => {
    try { await api.approve(id); notify('✅ منتشر شد'); loadPersons(pPage); loadStats(); }
    catch (e) { notify('❌ ' + e.message); }
  };

  /* ── Actions: found-reports ── */
  const confirmFR = async id => {
    try { await api.adminConfirmFoundReport(id); notify('✅ گزارش تأیید و پرونده «پیدا شده» شد'); loadFR(frPage); loadStats(); loadPersons(pPage); }
    catch (e) { notify('❌ ' + e.message); }
  };
  const rejectFR = async id => {
    try { await api.adminRejectFoundReport(id); notify('❌ گزارش رد شد'); loadFR(frPage); loadStats(); loadPersons(pPage); }
    catch (e) { notify('❌ ' + e.message); }
  };
  const deleteFR = async id => {
    try { await api.adminDeleteFoundReport(id); notify('🗑️ گزارش حذف شد'); loadFR(frPage); loadStats(); }
    catch (e) { notify('❌ ' + e.message); }
  };

  /* ── Actions: users ── */
  const toggleUser = async id => {
    try { await api.toggleUser(id); loadUsers(); }
    catch (e) { notify('❌ ' + e.message); }
  };
  const setRole = async (id, role) => {
    try { await api.setRole(id, role); loadUsers(); }
    catch (e) { notify('❌ ' + e.message); }
  };

  const TABS = [
    { key: 'dashboard',    label: '📊 داشبورد',                cnt: null },
    { key: 'pending',      label: '⏳ تأیید ارسال‌ها',         cnt: pending.length },
    { key: 'persons',      label: '📁 مدیریت پرونده‌ها',       cnt: null },
    { key: 'found-reports',label: '🟢 گزارشات پیدا شدن',      cnt: stats?.fr_pending },
    { key: 'users',        label: '👥 کاربران',                 cnt: null },
  ];

  return (
    <div className="admin-page fade-in">

      <div className="admin-header">
        <h1>🛡️ پانل مدیریت</h1>
        <p>خوش آمدید، <strong>{user.username}</strong></p>
      </div>

      {msg && <div className="admin-toast glass">{msg}<button onClick={() => setMsg('')}>✕</button></div>}

      <div className="admin-tabs">
        {TABS.map(({ key, label, cnt }) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
            {cnt > 0 && <span className="badge-count">{cnt}</span>}
          </button>
        ))}
      </div>

      {/* ════════════════════ DASHBOARD ════════════════════ */}
      {tab === 'dashboard' && stats && (
        <div className="admin-content">
          <div className="stats-grid">
            {[
              { label: 'کل پرونده‌ها',             val: stats.total,                icon: '📁', color: 'blue'   },
              { label: 'در انتظار تأیید ارسال',     val: stats.pending,              icon: '⏳', color: 'yellow' },
              { label: 'منتشر شده',                 val: stats.approved,             icon: '✅', color: 'green'  },
              { label: 'گمشده',                     val: stats.missing,              icon: '🔴', color: 'red'    },
              { label: 'در انتظار تأیید پیدا شدن', val: stats.pending_confirmation, icon: '🔔', color: 'yellow' },
              { label: 'پیدا شده',                  val: stats.found,                icon: '🟢', color: 'green'  },
              { label: 'گزارشات پیدا شدن جدید',    val: stats.fr_pending,           icon: '📨', color: 'purple' },
              { label: 'کاربران',                   val: stats.users,                icon: '👥', color: 'blue'   },
            ].map(s => (
              <div key={s.label} className={`stat-card glass stat-${s.color}`}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="admin-section glass">
            <h3>نرخ تأیید گزارش‌های ارسالی</h3>
            <div className="progress-bar-wrap">
              <div className="progress-bar"
                style={{ width: stats.total ? `${Math.round(stats.approved / stats.total * 100)}%` : '0%' }} />
            </div>
            <p style={{ marginTop: '10px', color: 'var(--text-s)', fontSize: '14px' }}>
              {stats.total ? Math.round(stats.approved / stats.total * 100) : 0}٪ از کل پرونده‌ها منتشر شده‌اند
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════ PENDING SUBMISSIONS ════════════════════ */}
      {tab === 'pending' && (
        <div className="admin-content">
          <p className="admin-section-desc">{pending.length} پرونده در انتظار بررسی و انتشار</p>
          {pending.length === 0
            ? <div className="empty-state glass">✅ هیچ پرونده‌ای در انتظار تأیید نیست</div>
            : pending.map(p => (
              <div key={p.id} className="pending-card glass">
                <img src={IMG + p.image_path} alt={p.name}
                  onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect fill="%231e293b" width="60" height="60"/><text y="38" x="30" text-anchor="middle" font-size="28">👤</text></svg>'; }} />
                <div className="pending-info">
                  <h3>
                    {p.name}
                    <span className={`status-badge ${STATUS_CLS[p.status] || 'missing'}`}>{STATUS_TEXT[p.status] || p.status}</span>
                  </h3>
                  <p>{p.age && `سن: ${p.age}`}{p.last_location && ` | 📍 ${p.last_location}`}</p>
                  <p className="desc-sm">{p.description?.slice(0, 120)}</p>
                  <small>ثبت: {p.created_at ? new Date(p.created_at).toLocaleDateString('fa-IR') : '—'}</small>
                </div>
                <div className="pending-actions">
                  <button className="btn-success" onClick={() => approvePerson(p.id)}>✅ تأیید و انتشار</button>
                  <button className="btn-danger"  onClick={() => rejectPerson(p.id)}>❌ رد و حذف</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ════════════════════ PERSONS MANAGEMENT ════════════════════ */}
      {tab === 'persons' && (
        <div className="admin-content">
          {/* Filter bar */}
          <div className="admin-filters glass">
            <input type="text" placeholder="جستجو بر اساس نام..."
              value={pFilter.name}
              onChange={e => setPF({ ...pFilter, name: e.target.value })} />
            <select value={pFilter.status}
              onChange={e => setPF({ ...pFilter, status: e.target.value })}>
              <option value="">همه وضعیت‌ها</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={pFilter.approved}
              onChange={e => setPF({ ...pFilter, approved: e.target.value })}>
              <option value="">همه (منتشر / پیش‌نویس)</option>
              <option value="true">فقط منتشر شده</option>
              <option value="false">فقط پیش‌نویس</option>
            </select>
            <button className="btn-primary btn-sm" onClick={() => loadPersons(1, pFilter)}>
              🔍 اعمال فیلتر
            </button>
          </div>

          <p className="admin-section-desc">{pTotal} پرونده — صفحه {pPage} از {pPages}</p>

          <div className="persons-mgmt-list">
            {persons.length === 0
              ? <div className="empty-state">هیچ پرونده‌ای یافت نشد</div>
              : persons.map(p => (
                <div key={p.id} className="person-mgmt-card glass">
                  <img src={IMG + p.image_path} alt={p.name}
                    onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect fill="%231e293b" width="60" height="60"/><text y="38" x="30" text-anchor="middle" font-size="28">👤</text></svg>'; }} />

                  <div className="pmgmt-info">
                    <div className="pmgmt-row1">
                      <h4>{p.name}</h4>
                      <span className={`status-badge ${STATUS_CLS[p.status] || 'missing'}`}>
                        {STATUS_TEXT[p.status] || p.status}
                      </span>
                      <span className={`approved-badge ${p.approved ? 'appr-yes' : 'appr-no'}`}>
                        {p.approved ? '✅ منتشر' : '⏳ پیش‌نویس'}
                      </span>
                    </div>
                    <p className="pmgmt-meta">
                      {p.age && `سن: ${p.age}  `}
                      {p.last_location && `📍 ${p.last_location}  `}
                      {p.created_at && new Date(p.created_at).toLocaleDateString('fa-IR')}
                    </p>
                    <p className="desc-sm">{p.description?.slice(0, 100) || '—'}</p>

                    {/* Notes editor */}
                    <div className="notes-editor">
                      <input type="text" placeholder="یادداشت داخلی مدیر..."
                        value={editNotes[p.id] !== undefined ? editNotes[p.id] : (p.notes || '')}
                        onChange={e => setEditNotes({ ...editNotes, [p.id]: e.target.value })} />
                      <button className="btn-ghost btn-sm" onClick={() => saveNotes(p.id)}>💾</button>
                    </div>
                  </div>

                  <div className="pmgmt-actions">
                    {/* Status dropdown */}
                    <select className="status-select"
                      value={p.status}
                      onChange={e => setPersonStatus(p.id, e.target.value)}>
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {/* Publish button for drafts */}
                    {!p.approved && (
                      <button className="btn-success btn-sm" onClick={() => approveDraft(p.id)}>
                        📢 انتشار
                      </button>
                    )}
                    {/* Delete */}
                    <button className="btn-danger btn-sm" onClick={() => deletePerson(p.id)}>
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))
            }
          </div>

          {pPages > 1 && (
            <div className="pagination">
              {Array.from({ length: pPages }, (_, i) => i + 1).map(n => (
                <button key={n} className={n === pPage ? 'active' : ''}
                  onClick={() => loadPersons(n)}>{n}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ FOUND-REPORTS MANAGEMENT ════════════════════ */}
      {tab === 'found-reports' && (
        <div className="admin-content">

          <div className="fr-admin-intro glass">
            <h3>📨 گزارشات پیدا شدن</h3>
            <p>
              این گزارش‌ها توسط کاربران عمومی ثبت می‌شوند. گزارش‌های «در انتظار» باید
              توسط گزارش‌دهنده اصلی یا مدیر تأیید شوند تا وضعیت پرونده به «پیدا شده» تغییر کند.
              مدیر می‌تواند مستقل از گزارش‌دهنده اصلی، گزارش‌ها را تأیید یا رد کند.
            </p>
          </div>

          {/* Filter */}
          <div className="admin-filters glass">
            <select value={frFilter}
              onChange={e => { setFrFilter(e.target.value); loadFR(1, e.target.value); }}>
              <option value="">همه گزارش‌ها</option>
              <option value="pending">⏳ در انتظار</option>
              <option value="confirmed">✅ تأیید شده</option>
              <option value="rejected">❌ رد شده</option>
            </select>
          </div>

          <p className="admin-section-desc">{frTotal} گزارش — صفحه {frPage} از {frPages}</p>

          {fReports.length === 0
            ? <div className="empty-state">هیچ گزارشی یافت نشد</div>
            : fReports.map(r => {
              const frSt = FR_STATUS[r.status] || FR_STATUS.pending;
              return (
                <div key={r.id} className={`fr-admin-card glass fr-admin-${r.status}`}>
                  <div className="fr-admin-header">
                    <div className="fr-admin-person">
                      <span>👤</span>
                      <strong>{r.person_name}</strong>
                    </div>
                    <span className={`fr-status-badge ${frSt.cls}`}>{frSt.label}</span>
                    <small className="fr-admin-date">
                      {r.created_at ? new Date(r.created_at).toLocaleString('fa-IR') : '—'}
                    </small>
                  </div>

                  <div className="fr-admin-body">
                    {r.reporter_name && (
                      <div className="fr-field">
                        <span className="fr-field-label">گزارش‌دهنده</span>
                        <span>{r.reporter_name}</span>
                      </div>
                    )}
                    {r.location_seen && (
                      <div className="fr-field">
                        <span className="fr-field-label">📍 محل مشاهده</span>
                        <span>{r.location_seen}</span>
                      </div>
                    )}
                    {r.contact_info && (
                      <div className="fr-field">
                        <span className="fr-field-label">📞 تماس</span>
                        <span className="fr-contact">{r.contact_info}</span>
                      </div>
                    )}
                    {r.description && (
                      <div className="fr-field fr-field-full">
                        <span className="fr-field-label">📝 توضیحات</span>
                        <span>{r.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="fr-admin-actions">
                    {r.status === 'pending' && (
                      <>
                        <button className="btn-success btn-sm" onClick={() => confirmFR(r.id)}>
                          ✅ تأیید — وضعیت به «پیدا شده» برود
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => rejectFR(r.id)}>
                          ❌ رد گزارش
                        </button>
                      </>
                    )}
                    <button className="btn-ghost btn-sm" onClick={() => deleteFR(r.id)}>
                      🗑️ حذف گزارش
                    </button>
                  </div>
                </div>
              );
            })
          }

          {frPages > 1 && (
            <div className="pagination">
              {Array.from({ length: frPages }, (_, i) => i + 1).map(n => (
                <button key={n} className={n === frPage ? 'active' : ''}
                  onClick={() => loadFR(n)}>{n}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ USERS ════════════════════ */}
      {tab === 'users' && (
        <div className="admin-content">
          <div className="users-table glass">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>نام کاربری</th><th>ایمیل</th>
                  <th>نقش</th><th>وضعیت</th><th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={!u.is_active ? 'inactive-row' : ''}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <select value={u.role}
                        onChange={e => setRole(u.id, e.target.value)}
                        disabled={u.id === user.id}>
                        <option value="user">کاربر</option>
                        <option value="admin">مدیر</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${u.is_active ? 'found' : 'missing'}`}>
                        {u.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td>
                      {u.id !== user.id && (
                        <button
                          className={u.is_active ? 'btn-danger btn-sm' : 'btn-success btn-sm'}
                          onClick={() => toggleUser(u.id)}>
                          {u.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
