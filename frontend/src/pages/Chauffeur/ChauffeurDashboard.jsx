import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBus, faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';

export default function ChauffeurDashboard() {
  const { user } = useAuth();
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les trajets assignés à ce chauffeur
    api.get('/chauffeur/mes-trajets.php')
      .then(r => setTrajets(r.data.data || []))
      .catch(() => setTrajets([]))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => {
    const m = { prévu:'badge-info', en_cours:'badge-warning', terminé:'badge-success', annulé:'badge-danger' };
    return <span className={`badge ${m[s]||'badge-info'}`}>{s}</span>;
  };

  const upcoming = trajets.filter(t => t.statut === 'prévu');
  const past     = trajets.filter(t => t.statut !== 'prévu');

  return (
    <div className="chauffeur-page">
      <div className="chauffeur-page-header">
        <div>
          <h1>Mes trajets assignés</h1>
          <p>Bonjour {user?.prenom} ! Voici vos prochains départs.</p>
        </div>
        <div className="chauffeur-stats">
          <div className="cs-item"><div className="cs-val">{upcoming.length}</div><div className="cs-label">À venir</div></div>
          <div className="cs-item"><div className="cs-val">{past.length}</div><div className="cs-label">Effectués</div></div>
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner"/></div> :
        trajets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FontAwesomeIcon icon={faBus} /></div>
            <h3>Aucun trajet assigné</h3>
            <p>Votre planning apparaîtra ici dès qu'un trajet vous sera attribué.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={{marginBottom:'var(--space-2xl)'}}>
                <h2 style={{fontFamily:'var(--font-heading)',fontSize:'1rem',fontWeight:700,color:'var(--gray-700)',marginBottom:'var(--space-md)'}}>
                  🚀 Prochains départs ({upcoming.length})
                </h2>
                <div style={{display:'flex',flexDirection:'column',gap:'var(--space-md)'}}>
                  {upcoming.map(t => (
                    <div key={t.id_horaire} className="chauffeur-trip-card featured">
                      <div className="ctc-route">
                        <div>
                          <div className="ctc-time">{new Date(t.date_depart).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                          <div className="ctc-city">{t.ville_depart}</div>
                        </div>
                        <div className="ctc-arrow"><FontAwesomeIcon icon={faBus} /> →</div>
                        <div style={{textAlign:'right'}}>
                          <div className="ctc-time">—</div>
                          <div className="ctc-city">{t.ville_arrivee}</div>
                        </div>
                      </div>
                      <div className="ctc-details">
                        <div className="ctc-detail-item"><span><FontAwesomeIcon icon={faCalendarDays} /> Date</span><strong>{new Date(t.date_depart).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</strong></div>
                        <div className="ctc-detail-item"><span><FontAwesomeIcon icon={faBus} /> Bus</span><strong style={{fontFamily:'monospace'}}>{t.numero_bus}</strong></div>
                        <div className="ctc-detail-item"><span>💺 Places reservées</span><strong>{t.places_reservees} / {t.capacite}</strong></div>
                        <div className="ctc-detail-item"><span>📏 Distance</span><strong>{t.distance_km} km</strong></div>
                        <div className="ctc-detail-item"><span>Statut</span>{statusBadge(t.statut)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 style={{fontFamily:'var(--font-heading)',fontSize:'1rem',fontWeight:700,color:'var(--gray-500)',marginBottom:'var(--space-md)'}}>
                  <FontAwesomeIcon icon={faClock} /> Historique ({past.length})
                </h2>
                <div className="card">
                  <div className="table-wrapper">
                    <table className="table">
                      <thead><tr><th>Trajet</th><th>Date</th><th>Bus</th><th>Passagers</th><th>Statut</th></tr></thead>
                      <tbody>
                        {past.map(t => (
                          <tr key={t.id_horaire}>
                            <td><strong>{t.ville_depart} → {t.ville_arrivee}</strong></td>
                            <td style={{fontSize:'0.875rem'}}>{new Date(t.date_depart).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</td>
                            <td style={{fontFamily:'monospace'}}>{t.numero_bus}</td>
                            <td>{t.places_reservees} / {t.capacite}</td>
                            <td>{statusBadge(t.statut)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      }
    </div>
  );
}
