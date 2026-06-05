import { useState, useEffect } from 'react';
import { adminAPI, trajetsAPI } from '../../services/api';
import './AdminAssignations.css';
import './AdminAssignations.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faBus, faIdCard, faTriangleExclamation, faCircleCheck, faClock, faArrowLeft, faSpinner, faChevronUp, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function AdminAssignations() {
  const [horaires, setHoraires]         = useState([]);
  const [trajets, setTrajets]           = useState([]);
  const [busDispos, setBusDispos]       = useState([]);
  const [chauffeursDispos, setChauffeursDispos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(false);
  const [saving, setSaving]             = useState(false);
  const [alertes, setAlertes]           = useState([]);
  const [pendingData, setPendingData]   = useState(null);
  const [loadingDispos, setLoadingDispos] = useState(false);

  const [form, setForm] = useState({
    id_trajet: '', id_bus: '', date_depart: '',
  });

  const loadHoraires = () => {
    setLoading(true);
    adminAPI.getAssignations()
      .then(r => setHoraires(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHoraires();
    trajetsAPI.getAll().then(r => setTrajets(r.data.data || []));
  }, []);

  // Charger bus et chauffeurs disponibles quand la date change
  const handleDateChange = async (date) => {
    setForm(f => ({...f, date_depart: date, id_bus: ''}));
    if (!date) { setBusDispos([]); setChauffeursDispos([]); return; }
    setLoadingDispos(true);
    try {
      const [busRes, chaufRes] = await Promise.all([
        adminAPI.getBusDisponibles(date),
        adminAPI.getChauffeursDisponibles(date),
      ]);
      setBusDispos(busRes.data.data || []);
      setChauffeursDispos(chaufRes.data.data || []);
    } catch {}
    finally { setLoadingDispos(false); }
  };

  const openModal = () => {
    setForm({ id_trajet:'', id_bus:'', date_depart:'' });
    setBusDispos([]); setChauffeursDispos([]);
    setAlertes([]); setPendingData(null);
    setModal(true);
  };

  const handleSave = async (force = false) => {
    if (!form.id_trajet || !form.id_bus || !form.date_depart) {
      alert('Trajet, bus et date sont obligatoires.'); return;
    }
    setSaving(true);
    try {
      await adminAPI.createAssignation({ ...form, force });
      setModal(false); setAlertes([]); setPendingData(null);
      loadHoraires();
    } catch(err) {
      const data = err.response?.data;
      if (data?.conflict) {
        // Conflit détecté — afficher les alertes et proposer de forcer
        setAlertes(data.alertes || []);
        setPendingData(form);
      } else {
        alert(data?.message || 'Erreur lors de la création.');
      }
    } finally { setSaving(false); }
  };

  const handleForce = () => handleSave(true);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce départ planifié ? Les réservations associées resteront mais le départ sera annulé.')) return;
    await adminAPI.deleteAssignation(id);
    loadHoraires();
  };

  const handleChangeStatut = async (id, statut) => {
    await adminAPI.updateAssignation(id, { statut });
    loadHoraires();
  };

  const statusBadge = (s) => {
    const m = { prévu:'badge-info', en_cours:'badge-warning', terminé:'badge-success', annulé:'badge-danger' };
    return <span className={`badge ${m[s]||'badge-info'}`}>{s}</span>;
  };

  const now = new Date();
  const upcoming = horaires.filter(h => new Date(h.date_depart) > now);
  const past     = horaires.filter(h => new Date(h.date_depart) <= now);

  // Bus sélectionné — retrouver son chauffeur
  const selectedBus = busDispos.find(b => b.id_bus == form.id_bus);
  const chauffeurDuBus = selectedBus
    ? chauffeursDispos.find(c => c.id_utilisateur == selectedBus.chauffeur_id)
    : null;

  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 1);
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1><FontAwesomeIcon icon={faClipboardList} /> Assignations & Horaires</h1>
          <p>Planifiez les départs · {upcoming.length} à venir · {past.length} passés</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ Planifier un départ</button>
      </div>

      {/* Tableau horaires */}
      {loading ? <div className="loader"><div className="spinner"/></div> : (
        <>
          {upcoming.length > 0 && (
            <div className="card" style={{marginBottom:'var(--space-xl)'}}>
              <div className="card-header" style={{display:'flex',alignItems:'center',gap:'var(--space-sm)'}}>
                <span>🚀</span> Prochains départs ({upcoming.length})
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Trajet</th><th>Date départ</th><th>Bus</th><th>Chauffeur</th><th>Places</th><th>Statut</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {upcoming.map(h => (
                      <tr key={h.id_horaire}>
                        <td><strong>{h.ville_depart} → {h.ville_arrivee}</strong><br/><span style={{fontSize:'0.78rem',color:'var(--gray-400)'}}>{parseInt(h.prix).toLocaleString('fr-FR')} FCFA · {h.distance_km} km</span></td>
                        <td style={{fontSize:'0.875rem'}}>{new Date(h.date_depart).toLocaleString('fr-FR',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                        <td><span style={{fontFamily:'monospace',fontWeight:600,fontSize:'0.9rem'}}>{h.numero_bus}</span><br/><span style={{fontSize:'0.75rem',color:'var(--gray-400)'}}>{h.capacite} places</span></td>
                        <td>
                          {h.chauffeur_nom_complet
                            ? <><strong>{h.chauffeur_nom_complet}</strong></>
                            : <span style={{color:'var(--warning)',fontSize:'0.82rem'}}><FontAwesomeIcon icon={faTriangleExclamation} /> Non assigné</span>
                          }
                        </td>
                        <td>
                          <div style={{fontSize:'0.875rem'}}>
                            <span style={{color:'var(--success)',fontWeight:600}}>{h.places_disponibles}</span>
                            <span style={{color:'var(--gray-400)'}}> / {h.capacite}</span>
                          </div>
                          <div style={{height:'4px',background:'var(--gray-100)',borderRadius:'2px',marginTop:'4px',overflow:'hidden'}}>
                            <div style={{height:'100%',background:h.places_disponibles > 5 ? 'var(--success)' : h.places_disponibles > 0 ? 'var(--warning)' : 'var(--danger)',width:`${((h.capacite-h.places_disponibles)/h.capacite)*100}%`,borderRadius:'2px'}}/>
                          </div>
                        </td>
                        <td>
                          <select className="form-input" style={{padding:'4px 8px',fontSize:'0.8rem',width:'auto'}}
                            value={h.statut} onChange={e => handleChangeStatut(h.id_horaire, e.target.value)}>
                            <option value="prévu">Prévu</option>
                            <option value="en_cours">En cours</option>
                            <option value="terminé">Terminé</option>
                            <option value="annulé">Annulé</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(h.id_horaire)}><FontAwesomeIcon icon={faTrash} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="card">
              <div className="card-header" style={{display:'flex',alignItems:'center',gap:'var(--space-sm)',color:'var(--gray-400)'}}>
                <FontAwesomeIcon icon={faClock} /> Historique ({past.length})
              </div>
              <div className="table-wrapper">
                <table className="table" style={{opacity:0.7}}>
                  <thead>
                    <tr><th>Trajet</th><th>Date</th><th>Bus</th><th>Chauffeur</th><th>Statut</th></tr>
                  </thead>
                  <tbody>
                    {past.slice(0,10).map(h => (
                      <tr key={h.id_horaire}>
                        <td>{h.ville_depart} → {h.ville_arrivee}</td>
                        <td style={{fontSize:'0.85rem'}}>{new Date(h.date_depart).toLocaleString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                        <td style={{fontFamily:'monospace',fontSize:'0.85rem'}}>{h.numero_bus}</td>
                        <td style={{fontSize:'0.85rem'}}>{h.chauffeur_nom_complet || '—'}</td>
                        <td>{statusBadge(h.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {horaires.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><FontAwesomeIcon icon={faClipboardList} /></div>
              <h3>Aucun horaire planifié</h3>
              <p>Cliquez sur "+ Planifier un départ" pour commencer.</p>
            </div>
          )}
        </>
      )}

      {/* Modal planifier */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => { setModal(false); setAlertes([]); }}>
          <div className="assignation-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2><FontAwesomeIcon icon={faClipboardList} /> Planifier un nouveau départ</h2>
              <button className="admin-modal-close" onClick={() => { setModal(false); setAlertes([]); }}>✕</button>
            </div>

            <div className="admin-modal-body">
              {/* Alertes conflits */}
              {alertes.length > 0 && (
                <div className="conflict-banner">
                  <div className="conflict-title"><FontAwesomeIcon icon={faTriangleExclamation} /> Conflits détectés</div>
                  {alertes.map((a, i) => (
                    <div key={i} className={`conflict-item conflict-${a.type}`}>
                      <span className="conflict-icon">
                        {a.type === 'bus'
                          ? <FontAwesomeIcon icon={faBus} />
                          : <FontAwesomeIcon icon={faIdCard} />
                        }
                      </span>
                      <span>{a.message}</span>
                    </div>
                  ))}
                  <p className="conflict-note">
                    Vous pouvez forcer l'assignation si nécessaire (double service, remplacement d'urgence).
                  </p>
                  <div style={{display:'flex',gap:'var(--space-sm)',marginTop:'var(--space-md)'}}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAlertes([])}><FontAwesomeIcon icon={faArrowLeft} /> Modifier</button>
                    <button className="btn btn-danger btn-sm" onClick={handleForce} disabled={saving}>
                      {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : '⚡ Forcer l\'assignation quand même'}
                    </button>
                  </div>
                </div>
              )}

              {/* Formulaire (masqué si alertes) */}
              {alertes.length === 0 && (
                <>
                  {/* Étape 1 : Date */}
                  <div className="assign-step">
                    <div className="assign-step-label">
                      <span className="step-num">1</span>
                      Choisir la date et l'heure de départ
                    </div>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={form.date_depart}
                      min={minDateStr}
                      onChange={e => handleDateChange(e.target.value)}
                    />
                    {loadingDispos && <p style={{fontSize:'0.8rem',color:'var(--gray-400)',marginTop:'6px'}}><FontAwesomeIcon icon={faSpinner} spin /> Vérification des disponibilités...</p>}
                  </div>

                  {/* Étape 2 : Trajet */}
                  <div className="assign-step">
                    <div className="assign-step-label">
                      <span className="step-num">2</span>
                      Choisir le trajet
                    </div>
                    <select className="form-input" value={form.id_trajet}
                      onChange={e => setForm(f => ({...f, id_trajet: e.target.value}))}>
                      <option value="">-- Sélectionner un trajet --</option>
                      {trajets.map(t => (
                        <option key={t.id_trajet} value={t.id_trajet}>
                          {t.ville_depart} → {t.ville_arrivee} · {parseInt(t.prix).toLocaleString('fr-FR')} FCFA · {t.distance_km} km
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Étape 3 : Bus */}
                  <div className="assign-step">
                    <div className="assign-step-label">
                      <span className="step-num">3</span>
                      Choisir le bus
                      {form.date_depart && <span style={{fontSize:'0.75rem',color:'var(--gray-400)',marginLeft:'8px'}}>— disponibilités pour la date choisie</span>}
                    </div>
                    {!form.date_depart ? (
                      <p className="assign-hint">Choisissez d'abord une date pour voir les bus disponibles</p>
                    ) : (
                      <div className="bus-grid">
                        {busDispos.length === 0 ? (
                          <p style={{color:'var(--gray-400)',fontSize:'0.875rem'}}>Aucun bus actif trouvé.</p>
                        ) : busDispos.map(b => (
                          <label
                            key={b.id_bus}
                            className={`bus-card ${form.id_bus == b.id_bus ? 'selected' : ''} ${b.occupe ? 'occupe' : ''}`}
                          >
                            <input type="radio" name="bus" value={b.id_bus} hidden
                              checked={form.id_bus == b.id_bus}
                              onChange={() => setForm(f => ({...f, id_bus: b.id_bus}))}/>
                            <div className="bus-card-header">
                              <span className="bus-immat">{b.numero_bus}</span>
                              {b.occupe
                                ? <span className="bus-status occupe"><FontAwesomeIcon icon={faTriangleExclamation} /> Occupé</span>
                                : <span className="bus-status libre"><FontAwesomeIcon icon={faCircleCheck} /> Libre</span>
                              }
                            </div>
                            <div className="bus-card-info">
                              <span>💺 {b.capacite} places</span>
                              {b.chauffeur_nom_complet
                                ? <span><FontAwesomeIcon icon={faIdCard} /> {b.chauffeur_nom_complet}</span>
                                : <span style={{color:'var(--warning)'}}><FontAwesomeIcon icon={faTriangleExclamation} /> Sans chauffeur</span>
                              }
                            </div>
                            {b.occupe && b.conflit_horaire && (
                              <div className="bus-conflict-info">
                                🚨 En service : {b.conflit_horaire.ville_depart} → {b.conflit_horaire.ville_arrivee}<br/>
                                {new Date(b.conflit_horaire.date_depart).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Résumé chauffeur du bus sélectionné */}
                  {selectedBus && (
                    <div className={`assign-summary ${selectedBus.occupe ? 'warning' : 'success'}`}>
                      <div className="summary-row-assign">
                        <span><FontAwesomeIcon icon={faBus} /> Bus sélectionné</span>
                        <strong>{selectedBus.numero_bus} · {selectedBus.capacite} places</strong>
                      </div>
                      <div className="summary-row-assign">
                        <span><FontAwesomeIcon icon={faIdCard} /> Chauffeur assigné</span>
                        <strong>
                          {selectedBus.chauffeur_nom_complet || <span style={{color:'var(--warning)'}}>Aucun chauffeur</span>}
                        </strong>
                      </div>
                      {selectedBus.occupe && (
                        <div className="summary-warning">
                          <FontAwesomeIcon icon={faTriangleExclamation} /> Ce bus (et son chauffeur) sont déjà planifiés dans un créneau proche. Une alerte sera affichée à la confirmation.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {alertes.length === 0 && (
              <div className="admin-modal-footer">
                <button className="btn btn-ghost" onClick={() => { setModal(false); setAlertes([]); }}>Annuler</button>
                <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving || !form.id_trajet || !form.id_bus || !form.date_depart}>
                  {saving ? <><FontAwesomeIcon icon={faSpinner} spin /> Vérification...</> : <><FontAwesomeIcon icon={faCircleCheck} /> Planifier le départ</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
