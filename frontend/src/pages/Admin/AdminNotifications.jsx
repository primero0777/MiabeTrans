import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell, faUser, faClock, faCircleCheck,
  faEnvelope, faTicket, faXmark, faInbox,
  faCalendarDays, faEye,
} from '@fortawesome/free-solid-svg-icons';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
};

const notifIcon = (contenu = '') => {
  const c = contenu.toLowerCase();
  if (c.includes('réserv') || c.includes('billet')) return { icon: faTicket,      color: '#1B4332', bg: '#D1FAE5' };
  if (c.includes('annul'))                           return { icon: faXmark,       color: '#EF4444', bg: '#FEE2E2' };
  if (c.includes('paie') || c.includes('confirm'))   return { icon: faCircleCheck, color: '#10B981', bg: '#D1FAE5' };
  if (c.includes('email') || c.includes('message'))  return { icon: faEnvelope,    color: '#3B82F6', bg: '#DBEAFE' };
  return { icon: faBell, color: '#F59E0B', bg: '#FEF3C7' };
};

export default function AdminNotifications() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all');
  const [selected, setSelected] = useState(null); // notification ouverte dans le modal

  const loadData = () => {
    setLoading(true); setError('');
    adminAPI.getNotifications()
      .then(r => setData(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const markRead = async (id) => {
    setData(prev => prev.map(n => n.id_notification === id ? { ...n, lu: true } : n));
    try { await adminAPI.markRead(id); }
    catch { loadData(); }
  };

  // Ouvrir le modal et marquer comme lu en même temps
  const openNotif = (n) => {
    setSelected(n);
    if (!n.lu) markRead(n.id_notification);
  };

  const closeModal = () => setSelected(null);

  const markAllRead = () =>
    data.filter(n => !n.lu).forEach(n => markRead(n.id_notification));

  const unread  = data.filter(n => !n.lu);
  const read    = data.filter(n =>  n.lu);
  const display = filter === 'unread' ? unread : filter === 'read' ? read : data;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1><FontAwesomeIcon icon={faBell} /> Notifications</h1>
          <p>
            {unread.length > 0
              ? <><span className="notif-unread-count">{unread.length} non lue{unread.length > 1 ? 's' : ''}</span> · {data.length} au total</>
              : `${data.length} notification${data.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {unread.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <FontAwesomeIcon icon={faCircleCheck} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="notif-filter-bar">
        {[
          { key: 'all',    label: 'Toutes',   count: data.length   },
          { key: 'unread', label: 'Non lues', count: unread.length },
          { key: 'read',   label: 'Lues',     count: read.length   },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="filter-tab-count">{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-skeleton-table">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton-row" />)}
        </div>
      ) : display.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon"><FontAwesomeIcon icon={faInbox} /></div>
          <h3>Aucune notification</h3>
          <p>{filter === 'unread' ? 'Toutes les notifications sont lues.' : 'Les notifications apparaîtront ici.'}</p>
        </div>
      ) : (
        <div className="notif-list">
          {display.map(n => {
            const { icon, color, bg } = notifIcon(n.contenu);
            return (
              <div
                key={n.id_notification}
                className={`notif-item ${n.lu ? 'read' : 'unread'}`}
                onClick={() => openNotif(n)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notif-icon-wrap" style={{ background: bg, color }}>
                  <FontAwesomeIcon icon={icon} />
                </div>
                <div className="notif-body">
                  <div className="notif-content">
                    {!n.lu && <span className="notif-dot" />}
                    <p>{n.contenu}</p>
                  </div>
                  <div className="notif-meta">
                    <span><FontAwesomeIcon icon={faUser} /> {n.utilisateur}</span>
                    <span className="notif-meta-sep">·</span>
                    <span className="notif-email">{n.email}</span>
                    <span className="notif-meta-sep">·</span>
                    <span><FontAwesomeIcon icon={faClock} /> {timeAgo(n.date_notification)}</span>
                  </div>
                </div>
                <span className="notif-read-hint">
                  <FontAwesomeIcon icon={n.lu ? faEye : faCircleCheck} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal détail notification */}
      {selected && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal notif-detail-modal" onClick={e => e.stopPropagation()}>
            {(() => {
              const { icon, color, bg } = notifIcon(selected.contenu);
              return (
                <>
                  <div className="notif-modal-header">
                    <div className="notif-modal-icon" style={{ background: bg, color }}>
                      <FontAwesomeIcon icon={icon} />
                    </div>
                    <div className="notif-modal-title">
                      <h2>Notification</h2>
                      <span className="badge badge-success">
                        <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 4 }} />
                        Lu
                      </span>
                    </div>
                    <button className="admin-modal-close" onClick={closeModal}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>

                  <div className="notif-modal-body">
                    <div className="notif-modal-message">
                      <p>{selected.contenu}</p>
                    </div>

                    <div className="notif-modal-meta-grid">
                      <div className="notif-modal-meta-item">
                        <div className="nmm-label"><FontAwesomeIcon icon={faUser} /> Utilisateur</div>
                        <div className="nmm-value">{selected.utilisateur}</div>
                      </div>
                      <div className="notif-modal-meta-item">
                        <div className="nmm-label"><FontAwesomeIcon icon={faEnvelope} /> Email</div>
                        <div className="nmm-value">{selected.email}</div>
                      </div>
                      <div className="notif-modal-meta-item">
                        <div className="nmm-label"><FontAwesomeIcon icon={faCalendarDays} /> Date</div>
                        <div className="nmm-value">
                          {new Date(selected.date_notification).toLocaleString('fr-FR', {
                            weekday: 'long', day: 'numeric', month: 'long',
                            year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="notif-modal-meta-item">
                        <div className="nmm-label"><FontAwesomeIcon icon={faClock} /> Il y a</div>
                        <div className="nmm-value">{timeAgo(selected.date_notification)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-modal-footer">
                    <button className="btn btn-primary" onClick={closeModal}>
                      Fermer
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
