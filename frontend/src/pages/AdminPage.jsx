import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const IMG = 'https://whocareswashere-missing-persons-ai-backend.hf.space/';

export default function AdminPage({ setPage }) {
  const { user } = useAuth();
  const [tab, setTab]     = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [msg, setMsg]     = useState('');

  const loadStats   = () => api.adminStats().then(setStats).catch(()=>{});
  const loadPending = () => api.adminPending(1).then(d => setPending(d.results)).catch(()=>{});
  const loadUsers   = () => api.adminUsers().then(setUsers).catch(()=>{});

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadStats(); loadPending(); loadUsers();
  }, [user]);

  if (!user || user.role !== 'admin') return (
    <div className="page-content fade-in">
      <div className="auth-required glass">
        <div className="auth-req-icon">🛡️</div>
        <h2>دسترسی مدیر الزامی است</h2>
        <p>این بخش فقط برای مدیران سامانه قابل دسترسی است</p>
        <button className="btn-primary" onClick={() => setPage('auth')}>ورود به سامانه</button>
      </div>
    </div>
  );

  const approve = async (id) => {
    try { await api.approve(id); setMsg('✅ تأیید شد'); loadPending(); loadStats(); }
    catch(e) { setMsg('❌ '+e.message); }
  };
  const reject = async (id) => {
    try { await api.reject(id); setMsg('🗑️ رد شد'); loadPending(); loadStats(); }
    catch(e) { setMsg('❌ '+e.message); }
  };
  const toggleUser = async (id) => {
    try { await api.toggleUser(id); loadUsers(); }
    catch(e) { setMsg('❌ '+e.message); }
  };
  const setRole = async (id, role) => {
    try { await api.setRole(id, role); loadUsers(); }
    catch(e) { setMsg('❌ '+e.message); }
  };

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <h1>🛡️ پانل مدیریت</h1>
        <p>خوش آمدید، {user.username}</p>
      </div>

      {msg && <div className="admin-toast glass">{msg}<button onClick={()=>setMsg('')}>✕</button></div>}

      <div className="admin-tabs">
        {[['dashboard','📊 داشبورد'],['pending','⏳ در انتظار تأیید'],['users','👥 کاربران']].map(([k,l])=>(
          <button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}
            {k==='pending' && pending.length>0 && <span className="badge-count">{pending.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {tab==='dashboard' && stats && (
        <div className="admin-content">
          <div className="stats-grid">
            {[
              {label:'کل پرونده‌ها', val:stats.total, icon:'📁', color:'blue'},
              {label:'در انتظار تأیید', val:stats.pending, icon:'⏳', color:'yellow'},
              {label:'تأیید شده', val:stats.approved, icon:'✅', color:'green'},
              {label:'گمشده', val:stats.missing, icon:'🔴', color:'red'},
              {label:'پیدا شده', val:stats.found, icon:'🟢', color:'green'},
              {label:'کاربران', val:stats.users, icon:'👥', color:'purple'},
            ].map(s=>(
              <div key={s.label} className={`stat-card glass stat-${s.color}`}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-section glass">
            <h3>نرخ تأیید</h3>
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{width: stats.total ? `${Math.round(stats.approved/stats.total*100)}%` : '0%'}} />
            </div>
            <p>{stats.total ? Math.round(stats.approved/stats.total*100) : 0}% از کل پرونده‌ها تأیید شده‌اند</p>
          </div>
        </div>
      )}

      {/* ── Pending ── */}
      {tab==='pending' && (
        <div className="admin-content">
          {pending.length===0 ? (
            <div className="empty-state glass">✅ هیچ پرونده‌ای در انتظار تأیید نیست</div>
          ) : pending.map(p=>(
            <div key={p.id} className="pending-card glass">
              <img src={IMG+p.image_path} alt={p.name}
                onError={e=>{e.target.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect fill="%231e293b" width="60" height="60"/><text y="38" x="30" text-anchor="middle" font-size="28">👤</text></svg>';}} />
              <div className="pending-info">
                <h3>{p.name} <span className={`status-badge ${p.status}`}>{p.status==='missing'?'گمشده':'پیدا شده'}</span></h3>
                <p>{p.age && `سن: ${p.age}`} {p.last_location && `| 📍 ${p.last_location}`}</p>
                <p className="desc-sm">{p.description?.slice(0,100)}</p>
                <small>ثبت: {p.created_at ? new Date(p.created_at).toLocaleDateString('fa-IR') : '—'}</small>
              </div>
              <div className="pending-actions">
                <button className="btn-success" onClick={()=>approve(p.id)}>✅ تأیید</button>
                <button className="btn-danger" onClick={()=>reject(p.id)}>❌ رد</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Users ── */}
      {tab==='users' && (
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
                {users.map(u=>(
                  <tr key={u.id} className={!u.is_active?'inactive-row':''}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <select value={u.role} onChange={e=>setRole(u.id,e.target.value)}
                        disabled={u.id===user.id}>
                        <option value="user">کاربر</option>
                        <option value="admin">مدیر</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${u.is_active?'found':'missing'}`}>
                        {u.is_active?'فعال':'غیرفعال'}
                      </span>
                    </td>
                    <td>
                      {u.id!==user.id && (
                        <button className={u.is_active?'btn-danger btn-sm':'btn-success btn-sm'}
                          onClick={()=>toggleUser(u.id)}>
                          {u.is_active?'غیرفعال‌سازی':'فعال‌سازی'}
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
