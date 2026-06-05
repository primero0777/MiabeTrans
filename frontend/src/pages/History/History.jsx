// src/pages/History/History.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationsAPI } from '../../services/api';
import './History.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicket, faCalendarDays, faBus } from '@fortawesome/free-solid-svg-icons';

export default function History() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reservationsAPI.getAll()
      .then(res => setReservations(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return;
    await reservationsAPI.cancel(id);
    setReservations(prev => prev.map(r => r.id_reservation === id ? {...r, statut_reservation:'annulée'} : r));
  };

  const statusBadge = (s) => {
    if (s === 'confirmée') return <span className="badge badge-success">Confirmée</span>;
    if (s === 'annulée')   return <span className="badge badge-danger">Annulée</span>;
    return <span className="badge badge-warning">En attente</span>;
  };

  return (
    <div className="history-page">
      <div className="container">
        <div className="history-header">
          <h1>Mes réservations</h1>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/search')}>+ Nouvelle réservation</button>
        </div>
        {loading ? (
          <div className="loader"><div className="spinner"/></div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FontAwesomeIcon icon={faTicket} /></div>
            <h3>Aucune réservation</h3>
            <p>Vous n'avez pas encore de réservation.</p>
            <button className="btn btn-primary" style={{marginTop:'var(--space-lg)'}} onClick={() => navigate('/search')}>Rechercher un trajet</button>
          </div>
        ) : (
          <div className="history-list">
            {reservations.map(r => (
              <div key={r.id_reservation} className="history-card">
                <div className="hc-left">
                  <div className="hc-id">#{r.id_reservation}</div>
                  <div className="hc-route">{r.ville_depart} <span>→</span> {r.ville_arrivee}</div>
                  <div className="hc-date"><FontAwesomeIcon icon={faCalendarDays} /> {new Date(r.date_depart).toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
                  <div className="hc-meta"><FontAwesomeIcon icon={faBus} /> {r.numero_bus} · Réservé le {new Date(r.date_reservation).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="hc-right">
                  {statusBadge(r.statut_reservation)}
                  <div className="hc-price">{parseInt(r.prix).toLocaleString('fr-FR')} FCFA</div>
                  {r.statut_reservation === 'confirmée' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id_reservation)}>Annuler</button>
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
