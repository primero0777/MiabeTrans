import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBus, faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

const STATUTS_BUS = ['actif','en_maintenance','indisponible'];

export default function AdminBus() {
  const [data, setData]           = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ numero_bus:'', chauffeur_id:'', capacite:30, statut:'actif' });

  const loadData = () => {
    setLoading(true); setError('');
    Promise.all([adminAPI.getBus(), adminAPI.getChauffeurs()])
      .then(([b,c]) => { setData(b.data.data||[]); setChauffeurs(c.data.data||[]); })
      .catch(e => setError(e.response?.data?.message||'Erreur'))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const openCreate = () => { setForm({ numero_bus:'', chauffeur_id:'', capacite:30, statut:'actif' }); setModal('create'); };
  const openEdit   = (b) => { setForm({ numero_bus:b.numero_bus, chauffeur_id:b.chauffeur_id||'', capacite:b.capacite, statut:b.statut }); setModal(b); };

  const handleSave = async () => {
    if (!form.numero_bus) { alert('Numéro de bus requis.'); return; }
    setSaving(true);
    try {
      if (modal === 'create') await adminAPI.createBus(form);
      else await adminAPI.updateBus(modal.id_bus, form);
      setModal(null); loadData();
    } catch(e) { alert(e.response?.data?.message||'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce bus ?')) return;
    try { await adminAPI.deleteBus(id); loadData(); }
    catch(e) { alert(e.response?.data?.message||'Erreur'); }
  };

  const statusBadge = (s) => {
    const m = { actif:'badge-success', en_maintenance:'badge-warning', indisponible:'badge-danger' };
    return <span className={`badge ${m[s]||'badge-info'}`}>{s.replace('_',' ')}</span>;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1><FontAwesomeIcon icon={faBus} /> Bus</h1><p>{data.length} véhicule{data.length>1?'s':''} dans la flotte</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau bus</button>
      </div>

      {error && <div className="alert alert-danger" style={{marginBottom:'var(--space-lg)'}}>{error}</div>}

      {loading ? <div className="loader"><div className="spinner"/></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Immatriculation</th><th>Capacité</th><th>Chauffeur</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:'center',color:'var(--gray-400)',padding:'var(--space-2xl)'}}>Aucun bus enregistré</td></tr>
                ) : data.map(b => (
                  <tr key={b.id_bus}>
                    <td style={{color:'var(--gray-400)',fontWeight:600}}>#{b.id_bus}</td>
                    <td><strong style={{fontFamily:'monospace'}}>{b.numero_bus}</strong></td>
                    <td>{b.capacite} places</td>
                    <td>{b.chauffeur || <span style={{color:'var(--gray-400)'}}>Non assigné</span>}</td>
                    <td>{statusBadge(b.statut)}</td>
                    <td>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}><FontAwesomeIcon icon={faPen} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id_bus)}><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal==='create'?'Nouveau bus':`Modifier le bus ${modal.numero_bus}`}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-group"><label className="form-label">Immatriculation *</label>
                <input type="text" className="form-input" placeholder="TG-0000-XX" value={form.numero_bus} onChange={e=>setForm({...form,numero_bus:e.target.value})}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-md)'}}>
                <div className="form-group"><label className="form-label">Capacité (places)</label>
                  <input type="number" className="form-input" value={form.capacite} onChange={e=>setForm({...form,capacite:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Statut</label>
                  <select className="form-input" value={form.statut} onChange={e=>setForm({...form,statut:e.target.value})}>
                    {STATUTS_BUS.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select></div>
              </div>
              <div className="form-group"><label className="form-label">Chauffeur assigné</label>
                <select className="form-input" value={form.chauffeur_id} onChange={e=>setForm({...form,chauffeur_id:e.target.value})}>
                  <option value="">-- Aucun --</option>
                  {chauffeurs.map(c=><option key={c.id_utilisateur} value={c.id_utilisateur}>{c.nom}</option>)}
                </select></div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
