import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function AdminVilles() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [nom, setNom]         = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editNom, setEditNom] = useState('');
  const [saving, setSaving]   = useState(false);

  const loadData = () => {
    setLoading(true); setError('');
    adminAPI.getVilles()
      .then(r => setData(r.data.data||[]))
      .catch(e => setError(e.response?.data?.message||'Erreur'))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setSaving(true);
    try { await adminAPI.createVille({ nom_ville: nom.trim() }); setNom(''); loadData(); }
    catch(e) { alert(e.response?.data?.message||'Erreur'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editNom.trim()) return;
    try { await adminAPI.updateVille(editModal.id_ville, { nom_ville: editNom }); setEditModal(null); loadData(); }
    catch(e) { alert(e.response?.data?.message||'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette ville ? Attention si elle est utilisée dans des trajets.')) return;
    try { await adminAPI.deleteVille(id); loadData(); }
    catch(e) { alert(e.response?.data?.message||'Cette ville est utilisée dans des trajets.'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1><FontAwesomeIcon icon={faLocationDot} /> Villes</h1><p>{data.length} ville{data.length>1?'s':''} desservie{data.length>1?'s':''}</p></div>
      </div>

      {error && <div className="alert alert-danger" style={{marginBottom:'var(--space-lg)'}}>{error}</div>}

      <div style={{display:'grid',gridTemplateColumns:'360px 1fr',gap:'var(--space-xl)'}}>
        <div className="card">
          <div className="card-header"><FontAwesomeIcon icon={faPlus} /> Ajouter une ville</div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Nom de la ville</label>
                <input type="text" className="form-input" placeholder="Ex: Aného" value={nom} onChange={e=>setNom(e.target.value)} required/>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>{saving?'Ajout...':'Ajouter la ville'}</button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Liste des villes ({data.length})</div>
          {loading ? <div className="loader"><div className="spinner"/></div> : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>#</th><th>Nom</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.map(v => (
                    <tr key={v.id_ville}>
                      <td style={{color:'var(--gray-400)'}}>#{v.id_ville}</td>
                      <td><strong><FontAwesomeIcon icon={faLocationDot} /> {v.nom_ville}</strong></td>
                      <td>
                        <div style={{display:'flex',gap:'4px'}}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditModal(v); setEditNom(v.nom_ville); }}><FontAwesomeIcon icon={faPen} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id_ville)}><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editModal && (
        <div className="admin-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="admin-modal" onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Modifier la ville</h2>
              <button className="admin-modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="form-group"><label className="form-label">Nom de la ville</label>
                <input type="text" className="form-input" value={editNom} onChange={e=>setEditNom(e.target.value)}/></div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
