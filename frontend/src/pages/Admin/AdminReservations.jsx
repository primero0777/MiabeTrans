import { useState, useEffect } from 'react';
import { reservationsAPI, adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicket, faMagnifyingGlass, faCircleCheck, faClock,
  faXmark, faEye, faEnvelope, faSpinner, faUser,
  faBus, faCalendarDays, faMoneyBill, faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const STATUTS = [
  { key: '',           label: 'Tous',        color: '' },
  { key: 'confirmée',  label: 'Confirmées',  color: 'success' },
  { key: 'en_attente', label: 'En attente',  color: 'warning' },
  { key: 'annulée',    label: 'Annulées',    color: 'danger'  },
];

const PAGE_SIZE = 15;

export default function AdminReservations() {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterStatut, setFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [detailModal, setDetailModal] = useState(null);
  const [annulModal, setAnnulModal]   = useState(null);
  const [raison, setRaison]           = useState('');
  const [annulLoading, setAnnulLoading] = useState(false);
  const [waLink, setWaLink]           = useState('');

  const loadData = () => {
    setLoading(true); setError('');
    reservationsAPI.getAll()
      .then(r => setData(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const handleAnnuler = async () => {
    if (!raison.trim()) { alert('La raison est obligatoire.'); return; }
    setAnnulLoading(true);
    try {
      const res = await adminAPI.annulerReservation({ id_reservation: annulModal.id_reservation, raison });
      if (res.data.data?.whatsapp_link) setWaLink(res.data.data.whatsapp_link);
      loadData();
      setAnnulModal(null); setRaison('');
      if (detailModal?.id_reservation === annulModal.id_reservation)
        setDetailModal(prev => ({...prev, statut_reservation:'annulée'}));
    } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setAnnulLoading(false); }
  };

  const statusBadge = (s) => {
    const m = { confirmée:'badge-success', annulée:'badge-danger', en_attente:'badge-warning' };
    const icons = { confirmée: faCircleCheck, annulée: faXmark, en_attente: faClock };
    return (
      <span className={`badge ${m[s] || 'badge-info'}`}>
        <FontAwesomeIcon icon={icons[s] || faTicket} style={{marginRight:4,fontSize:'0.7rem'}} />
        {s === 'en_attente' ? 'En attente' : s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  const filtered = data.filter(r => {
    const ms = !search ||
      r.client?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.ville_depart?.toLowerCase().includes(search.toLowerCase()) ||
      r.ville_arrivee?.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id_reservation).includes(search);
    return ms && (!filterStatut || r.statut_reservation === filterStatut);
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const counts = {
    confirmée:  data.filter(r => r.statut_reservation === 'confirmée').length,
    annulée:    data.filter(r => r.statut_reservation === 'annulée').length,
    en_attente: data.filter(r => r.statut_reservation === 'en_attente').length,
  };

  const totalRevenu = data
    .filter(r => r.statut_reservation === 'confirmée')
    .reduce((acc, r) => acc + parseInt(r.prix || 0), 0);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1><FontAwesomeIcon icon={faTicket} /> Réservations</h1>
          <p>{data.length} réservation{data.length > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {waLink && (
        <div className="alert alert-success admin-alert-banner">
          <FontAwesomeIcon icon={faCircleCheck} />
          <span>Réservation annulée. Email envoyé au client.</span>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-wa">
            <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
          </a>
          <button className="alert-close" onClick={() => setWaLink('')}><FontAwesomeIcon icon={faXmark} /></button>
        </div>
      )}

      {/* KPI row */}
      <div className="resa-kpi-row">
        {[
          { label: 'Total', value: data.length,        icon: faTicket,      color: '#6B7280', bg: '#F3F4F6' },
          { label: 'Confirmées', value: counts.confirmée, icon: faCircleCheck, color: '#10B981', bg: '#D1FAE5' },
          { label: 'En attente', value: counts.en_attente,icon: faClock,       color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'Annulées',   value: counts.annulée,   icon: faXmark,       color: '#EF4444', bg: '#FEE2E2' },
          { label: 'Revenus',    value: `${totalRevenu.toLocaleString('fr-FR')} F`, icon: faMoneyBill, color: '#1B4332', bg: '#ECFDF5', wide: true },
        ].map((c, i) => (
          <div key={i} className={`resa-kpi-card ${c.wide ? 'wide' : ''}`}>
            <div className="resa-kpi-icon" style={{ background: c.bg, color: c.color }}>
              <FontAwesomeIcon icon={c.icon} />
            </div>
            <div>
              <div className="resa-kpi-value" style={{ color: c.color }}>{c.value}</div>
              <div className="resa-kpi-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="admin-filter-bar">
        <div className="filter-tabs">
          {STATUTS.map(s => (
            <button
              key={s.key}
              className={`filter-tab ${filterStatut === s.key ? 'active' : ''} ${s.color ? `tab-${s.color}` : ''}`}
              onClick={() => { setFilter(s.key); setPage(1); }}
            >
              {s.label}
              <span className="filter-tab-count">
                {s.key === '' ? data.length : counts[s.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="filter-search-wrap">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="filter-search-icon" />
          <input
            type="text"
            className="form-input filter-search-input"
            placeholder="Client, email, ville, #ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className="filter-search-clear" onClick={() => { setSearch(''); setPage(1); }}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="admin-skeleton-table">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton-row" />)}
        </div>
      ) : (
        <>
          <div className="card admin-table-card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width:60}} className="table-hide-mobile">ID</th>
                    <th>Client</th>
                    <th>Trajet</th>
                    <th className="table-hide-mobile">Départ</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th style={{width:90}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="table-empty">
                          <FontAwesomeIcon icon={faFilter} />
                          <span>Aucune réservation pour ces filtres</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginated.map(r => (
                    <tr key={r.id_reservation} className="table-row-hover">
                      <td className="table-hide-mobile"><span className="row-id">#{r.id_reservation}</span></td>
                      <td>
                        <div className="cell-user">
                          <div className="cell-user-avatar">{r.client?.[0] || '?'}</div>
                          <div>
                            <div className="cell-user-name">{r.client}</div>
                            <div className="cell-user-email">{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-route">
                          <span className="cell-route-from">{r.ville_depart}</span>
                          <span className="cell-route-arrow">→</span>
                          <span className="cell-route-to">{r.ville_arrivee}</span>
                        </div>
                      </td>
                      <td className="cell-date table-hide-mobile">
                        {new Date(r.date_depart).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td><span className="cell-price">{parseInt(r.prix).toLocaleString('fr-FR')} F</span></td>
                      <td>{statusBadge(r.statut_reservation)}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-ghost btn-sm row-action-btn" onClick={() => setDetailModal(r)} title="Détails">
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          {r.statut_reservation !== 'annulée' && (
                            <button className="btn btn-danger btn-sm row-action-btn" onClick={() => setAnnulModal(r)} title="Annuler">
                              <FontAwesomeIcon icon={faXmark} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="table-pagination">
                <span className="pagination-info">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
                </span>
                <div className="pagination-btns">
                  <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setPage(i + 1)}
                    >{i + 1}</button>
                  ))}
                  <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal détails */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="admin-modal admin-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon"><FontAwesomeIcon icon={faTicket} /></div>
                <div>
                  <h2>Réservation #{detailModal.id_reservation}</h2>
                  <p>{statusBadge(detailModal.statut_reservation)}</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setDetailModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="modal-detail-grid">
                <div className="modal-detail-section">
                  <div className="modal-section-label"><FontAwesomeIcon icon={faUser} /> Client</div>
                  {[
                    { l: 'Nom complet', v: detailModal.client },
                    { l: 'Email',       v: detailModal.email },
                    { l: 'Téléphone',   v: detailModal.telephone || '-' },
                  ].map((r, i) => (
                    <div key={i} className="modal-detail-row">
                      <span className="mdr-label">{r.l}</span>
                      <strong className="mdr-value">{r.v}</strong>
                    </div>
                  ))}
                </div>
                <div className="modal-detail-section">
                  <div className="modal-section-label"><FontAwesomeIcon icon={faBus} /> Trajet</div>
                  {[
                    { l: 'Trajet', v: `${detailModal.ville_depart} → ${detailModal.ville_arrivee}` },
                    { l: 'Départ', v: new Date(detailModal.date_depart).toLocaleString('fr-FR') },
                    { l: 'Bus',    v: detailModal.numero_bus },
                    { l: 'Prix',   v: `${parseInt(detailModal.prix).toLocaleString('fr-FR')} FCFA` },
                  ].map((r, i) => (
                    <div key={i} className="modal-detail-row">
                      <span className="mdr-label">{r.l}</span>
                      <strong className="mdr-value">{r.v}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-detail-footer-row">
                <div className="modal-footer-info">
                  <FontAwesomeIcon icon={faCalendarDays} />
                  Réservé le {new Date(detailModal.date_reservation).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                </div>
                {detailModal.mode_paiement && (
                  <span className="badge badge-info">{detailModal.mode_paiement}</span>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              {detailModal.statut_reservation !== 'annulée' && (
                <button className="btn btn-danger btn-sm" onClick={() => { setDetailModal(null); setAnnulModal(detailModal); }}>
                  <FontAwesomeIcon icon={faXmark} /> Annuler la réservation
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setDetailModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal annulation */}
      {annulModal && (
        <div className="admin-modal-overlay" onClick={() => setAnnulModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-header-left">
                <div className="modal-header-icon danger"><FontAwesomeIcon icon={faXmark} /></div>
                <div>
                  <h2>Annuler la réservation</h2>
                  <p>#{annulModal.id_reservation}, {annulModal.client}</p>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setAnnulModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="modal-annul-info">
                <div className="annul-route">{annulModal.ville_depart} → {annulModal.ville_arrivee}</div>
                <div className="annul-date">Départ : {new Date(annulModal.date_depart).toLocaleString('fr-FR')}</div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Raison de l'annulation <span className="req">*</span>
                  <span className="form-label-hint">(envoyée au client par email)</span>
                </label>
                <textarea
                  className="form-input form-textarea"
                  rows={4}
                  value={raison}
                  onChange={e => setRaison(e.target.value)}
                  placeholder="Ex: Le bus est en maintenance. Nous vous prions de nous excuser pour la gêne occasionnée..."
                />
              </div>
              <div className="alert alert-info">
                <FontAwesomeIcon icon={faEnvelope} />
                Un email sera automatiquement envoyé à <strong>{annulModal.email}</strong>.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-ghost" onClick={() => setAnnulModal(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleAnnuler} disabled={annulLoading}>
                {annulLoading
                  ? <><FontAwesomeIcon icon={faSpinner} spin /> Envoi en cours...</>
                  : <><FontAwesomeIcon icon={faXmark} /> Confirmer l'annulation</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
