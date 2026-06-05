import { useState, useEffect } from 'react';
import { trajetsAPI, adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRoute, faMagnifyingGlass, faLocationDot, faEye, faPen, faTrash, faPlus, faSpinner, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

export default function AdminTrajets() {
  const [data, setData]       = useState([]);
  const [villes, setVilles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [form, setForm]       = useState({ id_ville_depart:'', id_ville_arrivee:'', distance_km:'', prix:'' });

  const loadData = () => {
    setLoading(true); setError('');
    Promise.all([trajetsAPI.getAll(), adminAPI.getVilles()])
      .then(([t, v]) => { setData(t.data.data || []); setVilles(v.data.data || []); })
      .catch(e => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const openCreate = () => {
    setForm({ id_ville_depart:'', id_ville_arrivee:'', distance_km:'', prix:'' });
    setModal('create');
  };

  const openEdit = (t) => {
    // Trouver les IDs de ville correspondants
    const vDepart  = villes.find(v => v.nom_ville === t.ville_depart);
    const vArrivee = villes.find(v => v.nom_ville === t.ville_arrivee);
    setForm({
      id_ville_depart:  vDepart?.id_ville  || '',
      id_ville_arrivee: vArrivee?.id_ville || '',
      distance_km: t.distance_km,
      prix: t.prix,
    });
    setDetailModal(null);
    setModal(t);
  };

  const handleSave = async () => {
    if (!form.id_ville_depart || !form.id_ville_arrivee || !form.prix) {
      alert('Départ, arrivée et prix sont requis.'); return;
    }
    if (form.id_ville_depart === form.id_ville_arrivee) {
      alert('Départ et arrivée doivent être différents.'); return;
    }
    setSaving(true);
    try {
      if (modal === 'create') await trajetsAPI.create(form);
      else await trajetsAPI.update(modal.id_trajet, form);
      setModal(null); loadData();
    } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce trajet ? Les horaires associés seront également supprimés.')) return;
    try { await trajetsAPI.delete(id); setDetailModal(null); loadData(); }
    catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const filtered = data.filter(t =>
    !search ||
    t.ville_depart?.toLowerCase().includes(search.toLowerCase()) ||
    t.ville_arrivee?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1><FontAwesomeIcon icon={faRoute} /> Trajets</h1><p>{data.length} trajet{data.length>1?'s':''} actif{data.length>1?'s':''}</p></div>
        <div style={{display:'flex', gap:'var(--space-sm)'}}>
          <div style={{position:'relative'}}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)',pointerEvents:'none'}}/>
            <input type="text" className="form-input" placeholder="Rechercher..."
              value={search} onChange={e => setSearch(e.target.value)} style={{width:'200px',paddingLeft:'32px'}}/>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Nouveau trajet</button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{marginBottom:'var(--space-lg)'}}>{error}</div>}

      {loading ? <div className="loader"><div className="spinner"/></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Départ</th><th>Arrivée</th><th>Distance</th><th>Prix</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center',color:'var(--gray-400)',padding:'var(--space-2xl)'}}>Aucun trajet</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id_trajet}>
                    <td style={{color:'var(--gray-400)',fontWeight:600}}>#{t.id_trajet}</td>
                    <td><strong><FontAwesomeIcon icon={faLocationDot} /> {t.ville_depart}</strong></td>
                    <td><strong><FontAwesomeIcon icon={faLocationDot} /> {t.ville_arrivee}</strong></td>
                    <td style={{color:'var(--gray-500)'}}>{t.distance_km} km</td>
                    <td style={{fontWeight:700,color:'var(--primary)'}}>{parseInt(t.prix).toLocaleString('fr-FR')} FCFA</td>
                    <td>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(t)}><FontAwesomeIcon icon={faEye} /> Détails</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}><FontAwesomeIcon icon={faPen} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id_trajet)}><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="admin-modal" style={{maxWidth:'480px'}} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2><FontAwesomeIcon icon={faRoute} /> Trajet #{detailModal.id_trajet}</h2>
              <button className="admin-modal-close" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {/* Visuel trajet */}
              <div style={{background:'linear-gradient(135deg,var(--primary-dark),var(--primary-light))',borderRadius:'var(--radius-lg)',padding:'var(--space-xl)',marginBottom:'var(--space-lg)',color:'white',textAlign:'center'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'var(--space-xl)'}}>
                  <div>
                    <div style={{fontSize:'1.4rem',fontWeight:800,fontFamily:'var(--font-heading)'}}>{detailModal.ville_depart}</div>
                    <div style={{fontSize:'0.78rem',opacity:0.7}}>Départ</div>
                  </div>
                  <div style={{fontSize:'1.5rem'}}>✈️</div>
                  <div>
                    <div style={{fontSize:'1.4rem',fontWeight:800,fontFamily:'var(--font-heading)'}}>{detailModal.ville_arrivee}</div>
                    <div style={{fontSize:'0.78rem',opacity:0.7}}>Arrivée</div>
                  </div>
                </div>
              </div>

              {/* Infos détaillées */}
              {[
                {label:'Distance',      value:`${detailModal.distance_km} km`},
                {label:'Prix du billet',value:`${parseInt(detailModal.prix).toLocaleString('fr-FR')} FCFA`},
              ].map((r,i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--gray-100)',fontSize:'0.9rem'}}>
                  <span style={{color:'var(--gray-500)'}}>{r.label}</span>
                  <strong>{r.value}</strong>
                </div>
              ))}
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(detailModal.id_trajet)}><FontAwesomeIcon icon={faTrash} /> Supprimer</button>
              <button className="btn btn-ghost" onClick={() => setDetailModal(null)}>Fermer</button>
              <button className="btn btn-primary" onClick={() => openEdit(detailModal)}><FontAwesomeIcon icon={faPen} /> Modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Créer/Modifier */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal === 'create' ? <><FontAwesomeIcon icon={faPlus} /> Nouveau trajet</> : <><FontAwesomeIcon icon={faPen} /> Modifier le trajet #{modal.id_trajet}</>}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-group">
                <label className="form-label">Ville de départ *</label>
                <select className="form-input" value={form.id_ville_depart}
                  onChange={e => setForm({...form, id_ville_depart: e.target.value})}>
                  <option value="">-- Sélectionner --</option>
                  {villes.map(v => <option key={v.id_ville} value={v.id_ville}>{v.nom_ville}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ville d'arrivée *</label>
                <select className="form-input" value={form.id_ville_arrivee}
                  onChange={e => setForm({...form, id_ville_arrivee: e.target.value})}>
                  <option value="">-- Sélectionner --</option>
                  {villes.map(v => <option key={v.id_ville} value={v.id_ville}>{v.nom_ville}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-md)'}}>
                <div className="form-group">
                  <label className="form-label">Distance (km)</label>
                  <input type="number" className="form-input" placeholder="Ex: 120"
                    value={form.distance_km} onChange={e => setForm({...form, distance_km: e.target.value})}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Prix (FCFA) *</label>
                  <input type="number" className="form-input" placeholder="Ex: 2500"
                    value={form.prix} onChange={e => setForm({...form, prix: e.target.value})}/>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faFloppyDisk} /> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
