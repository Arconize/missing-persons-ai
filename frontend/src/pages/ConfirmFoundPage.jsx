import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const IMG = 'http://127.0.0.1:8000/';

const FR_STATUS = {
  pending:   { label: '⏳ در انتظار بررسی',  cls: 'fr-pending'   },
  confirmed: { label: '✅ تأیید شده',         cls: 'fr-confirmed' },
  rejected:  { label: '❌ رد شده',            cls: 'fr-rejected'  },
};

export default function ConfirmFoundPage({ setPage }) {
  const { user } = useAuth();

  // My submitted persons (with pending_found_reports count)
  const [myPersons, setMyPersons] = useState([]);
  const [loadingPersons, setLP]   = useState(true);

  // Expanded person → show their found-reports
  const [expanded, setExpanded]         = useState(null); // person_id
  const [reportsFor, setReportsFor]     = useState({});   // { [person_id]: [report, ...] }
  const [loadingReports, setLR]         = useState(false);

  const [msg, setMsg]   = useState('');
  const [actionLoading, setAL] = useState(false);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  // Load my persons on mount
  useEffect(() => {
    if (!user) return;
    api.myPersons()
      .then(setMyPersons)
      .catch(e => notify('❌ ' + e.message))
      .finally(() => setLP(false));
  }, [user]);

  // Load found-reports for a specific person
  const loadReports = async (personId) => {
    if (reportsFor[personId]) { setExpanded(personId); return; }
    setLR(true);
    try {
      const d = await api.getFoundReports(personId);
      setReportsFor(prev => ({ ...prev, [personId]: d.reports || [] }));
      setExpanded(personId);
    } catch (e) {
      notify('❌ ' + e.message);
    } finally { setLR(false); }
  };

  const toggle = (personId) => {
    if (expanded === personId) { setExpanded(null); return; }
    loadReports(personId);
  };

  // Refresh a single person's reports after action
  const refreshReports = async (personId) => {
    try {
      const d = await api.getFoundReports(personId);
      setReportsFor(prev => ({ ...prev, [personId]: d.reports || [] }));
    } catch {}
    // Refresh persons list too for updated status + count
    try {
      const p = await api.myPersons();
      setMyPersons(p);
    } catch {}
  };

  const confirmReport = async (reportId, personId) => {
    setAL(true);
    try {
      const res = await api.confirmFoundReport(reportId);
      notify('✅ ' + res.message);
      await refreshReports(personId);
    } catch (e) {
      notify('❌ ' + e.message);
    } finally { setAL(false); }
  };

  const rejectReport = async (reportId, personId) => {
    setAL(true);
    try {
      const res = await api.rejectFoundReport(reportId);
      notify('🔄 ' + res.message);
      await refreshReports(personId);
    } catch (e) {
      notify('❌ ' + e.message);
    } finally { setAL(false); }
  };

  // ── Guard: must be logged in ──
  if (!user) return (
    <div className="page-content fade-in">
      <div className="auth-required glass">
        <div className="auth-req-icon">🔐</div>
        <h2>ورود الزامی است</h2>
        <p>برای مشاهده گزارش‌های تأیید پیدا شدن، ابتدا وارد سامانه شوید</p>
        <button className="btn-primary" onClick={() => setPage('auth')}>ورود / ثبت‌نام</button>
      </div>
    </div>
  );

  // Count total pending across all persons
  const totalPending = myPersons.reduce((s, p) => s + (p.pending_found_reports || 0), 0);

  return (
    <div className="page-content fade-in">
      <div className="cfp-wrap">

        {/* ── Page header ── */}
        <div className="cfp-header glass">
          <div className="cfp-header-icon">🔔</div>
          <div className="cfp-header-text">
            <h2>تأیید پیدا شدن افراد</h2>
            <p>
              وقتی کسی گزارش می‌دهد که یکی از افراد ثبت‌شده توسط شما پیدا شده،
              اینجا می‌توانید آن گزارش را بررسی و تأیید یا رد کنید.
            </p>
          </div>
          {totalPending > 0 && (
            <div className="cfp-alert">
              <span className="cfp-alert-num">{totalPending}</span>
              گزارش جدید منتظر بررسی شماست
            </div>
          )}
        </div>

        {/* ── Toast ── */}
        {msg && <div className="cfp-toast glass">{msg}</div>}

        {/* ── No persons ── */}
        {loadingPersons ? (
          <div className="loading-spinner">⏳ در حال بارگذاری...</div>
        ) : myPersons.length === 0 ? (
          <div className="empty-state glass cfp-empty">
            <div style={{ fontSize: '3em', marginBottom: '12px' }}>📋</div>
            <h3>هنوز گزارشی ثبت نکرده‌اید</h3>
            <p>بعد از ثبت گزارش افراد گمشده، وضعیت آن‌ها را اینجا دنبال کنید</p>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setPage('submit')}>
              📋 ثبت گزارش جدید
            </button>
          </div>
        ) : (

          /* ── Person list ── */
          <div className="cfp-list">
            {myPersons.map(p => {
              const hasPending = p.pending_found_reports > 0;
              const isOpen     = expanded === p.id;
              const reports    = reportsFor[p.id] || [];
              const statusMap  = {
                missing:              { label: '🔴 گمشده',              cls: 'missing'      },
                pending_confirmation: { label: '🔔 در انتظار تأیید پیدا شدن', cls: 'pending-conf' },
                found:                { label: '🟢 پیدا شده',            cls: 'found'        },
              };
              const st = statusMap[p.status] || statusMap.missing;

              return (
                <div key={p.id} className={`cfp-person-card glass ${hasPending ? 'cfp-has-pending' : ''}`}>

                  {/* ── Person row ── */}
                  <div className="cfp-person-row" onClick={() => toggle(p.id)}>
                    <div className="cfp-person-img">
                      <img src={IMG + p.image_path} alt={p.name}
                        onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect fill="%231e293b" width="80" height="80"/><text y="50" x="40" text-anchor="middle" font-size="36">👤</text></svg>'; }} />
                    </div>

                    <div className="cfp-person-info">
                      <div className="cfp-person-name-row">
                        <h3>{p.name}</h3>
                        <span className={`status-badge ${st.cls}`}>{st.label}</span>
                        {hasPending && (
                          <span className="cfp-pending-pill">
                            {p.pending_found_reports} گزارش جدید
                          </span>
                        )}
                      </div>
                      <div className="cfp-person-meta">
                        {p.age && <span>سن: {p.age}</span>}
                        {p.last_location && <span>📍 {p.last_location}</span>}
                        {p.created_at && <span>ثبت: {new Date(p.created_at).toLocaleDateString('fa-IR')}</span>}
                      </div>
                    </div>

                    <div className="cfp-expand-arrow">{isOpen ? '▲' : '▼'}</div>
                  </div>

                  {/* ── Found-reports for this person ── */}
                  {isOpen && (
                    <div className="cfp-reports">
                      {loadingReports && <div className="loading-spinner">⏳</div>}
                      {!loadingReports && reports.length === 0 && (
                        <div className="cfp-no-reports">
                          هیچ گزارش پیدا شدنی برای این پرونده ثبت نشده است
                        </div>
                      )}
                      {reports.map(r => {
                        const fr = FR_STATUS[r.status] || FR_STATUS.pending;
                        return (
                          <div key={r.id} className={`cfp-report-card ${fr.cls}`}>
                            <div className="cfp-report-top">
                              <span className={`fr-status-badge ${fr.cls}`}>{fr.label}</span>
                              <small>{r.created_at ? new Date(r.created_at).toLocaleString('fa-IR') : '—'}</small>
                            </div>

                            <div className="cfp-report-body">
                              {r.reporter_name && (
                                <div className="cfp-report-field">
                                  <span className="cfp-field-label">👤 گزارش‌دهنده</span>
                                  <span>{r.reporter_name}</span>
                                </div>
                              )}
                              {r.location_seen && (
                                <div className="cfp-report-field">
                                  <span className="cfp-field-label">📍 محل مشاهده</span>
                                  <span>{r.location_seen}</span>
                                </div>
                              )}
                              {r.contact_info && (
                                <div className="cfp-report-field">
                                  <span className="cfp-field-label">📞 تماس</span>
                                  <span className="cfp-contact">{r.contact_info}</span>
                                </div>
                              )}
                              {r.description && (
                                <div className="cfp-report-field cfp-field-full">
                                  <span className="cfp-field-label">📝 توضیحات</span>
                                  <span>{r.description}</span>
                                </div>
                              )}
                            </div>

                            {/* ── Action buttons — only for pending reports ── */}
                            {r.status === 'pending' && (
                              <div className="cfp-report-actions">
                                <div className="cfp-action-prompt">
                                  آیا این گزارش را تأیید می‌کنید؟
                                </div>
                                <div className="cfp-action-btns">
                                  <button
                                    className="btn-confirm-found"
                                    disabled={actionLoading}
                                    onClick={() => confirmReport(r.id, p.id)}
                                  >
                                    ✅ بله، این فرد پیدا شده
                                  </button>
                                  <button
                                    className="btn-reject-found"
                                    disabled={actionLoading}
                                    onClick={() => rejectReport(r.id, p.id)}
                                  >
                                    ❌ خیر، اشتباه است
                                  </button>
                                </div>
                              </div>
                            )}

                            {r.status === 'confirmed' && (
                              <div className="cfp-report-result confirmed">
                                ✅ شما این گزارش را تأیید کردید — وضعیت پرونده به «پیدا شده» تغییر کرد
                              </div>
                            )}
                            {r.status === 'rejected' && (
                              <div className="cfp-report-result rejected">
                                ❌ شما این گزارش را رد کردید
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
