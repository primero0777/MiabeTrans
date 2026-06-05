import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUser, faClock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

export default function AdminNotifications() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const loadData = () => {
    setLoading(true); setError('');
    adminAPI.getNotifications()
      .then(r => setData(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const markRead = async (id) => {
    try { await adminAPI.markRead(id); loadData(); }
    catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const unread = data.filter(n => !n.lu).length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1><FontAwesomeIcon icon={faBell} /> Notifications</h1>
          <p>{unread} non lue{unread>1?'s':''} · {data.length} au total</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={() =>
            data.filter(n=>!n.lu).forEach(n => markRead(n.id_notification))
          }>
            <FontAwesomeIcon icon={faCircleCheck} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger" style={{marginBottom:'var(--space-lg)'}}>{error}</div>}

      {loading ? <div className="loader"><div className="spinner"/></div> :
        data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FontAwesomeIcon icon={faBell} /></div>
            <h3>Aucune notification</h3>
            <p>Les notifications apparaîtront ici.</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'var(--space-sm)'}}>
            {data.map(n => (
              <div key={n.id_notification} style={{
                background: n.lu ? 'var(--white)' : 'var(--info-light)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-md) var(--space-lg)',
                border: `1px solid ${n.lu ? 'var(--gray-200)' : '#BFDBFE'}`,
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 'var(--space-md)',
                transition: 'all var(--transition)'
              }}>
                <div style={{flex:1}}>
                  <div style={{
                    fontWeight: n.lu ? 400 : 600,
                    color: 'var(--gray-900)',
                    marginBottom: '4px',
                    fontSize: '0.9rem'
                  }}>
                    {!n.lu && <span style={{display:'inline-block',width:'8px',height:'8px',background:'var(--info)',borderRadius:'50%',marginRight:'8px'}}/>}
                    {n.contenu}
                  </div>
                  <div style={{fontSize:'0.78rem', color:'var(--gray-400)'}}>
                    <FontAwesomeIcon icon={faUser} /> {n.utilisateur} ({n.email}) · <FontAwesomeIcon icon={faClock} /> {new Date(n.date_notification).toLocaleString('fr-FR')}
                  </div>
                </div>
                {!n.lu && (
                  <button className="btn btn-primary btn-sm" onClick={() => markRead(n.id_notification)}>
                    Marquer lu
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
