import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faMagnifyingGlass, faUser, faKey, faCalendarDays, faEye, faTrash, faFloppyDisk, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

const ROLES = [{id:1,label:'Administrateur'},{id:2,label:'Client'},{id:3,label:'Chauffeur'}];

export default function AdminUsers() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');

  const loadData = () => {
    setLoading(true); setError('');
    adminAPI.getUsers()
      .then(r => setData(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const openDetail = (u) => {
    setDetailModal(u);
    setEditForm({ nom:u.nom, prenom:u.prenom, telephone:u.telephone||'', id_role:u.id_role||2 });
    setSaveMsg('');
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await adminAPI.updateUser(detailModal.id_utilisateur, editForm);
      setSaveMsg('success');
      loadData();
      setDetailModal(prev => ({...prev, ...editForm,
        libelle_role: ROLES.find(r=>r.id==editForm.id_role)?.label || prev.libelle_role
      }));
    } catch(e) { setSaveMsg('error:' + (e.response?.data?.message||'Erreur')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Désactiver cet utilisateur ?')) return;
    await adminAPI.deleteUser(id);
    setDetailModal(null);
    loadData();
  };

  const filtered = data.filter(u =>
    !search ||
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role) => {
    const m = {Administrateur:'badge-primary',Chauffeur:'badge-info',Client:'badge-success'};
    return <span className={`badge ${m[role]||'badge-info'}`}>{role}</span>;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1><FontAwesomeIcon icon={faUsers} /> Utilisateurs</h1><p>{data.length} compte{data.length>1?'s':''}</p></div>
        <div style={{position:'relative'}}>
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)',pointerEvents:'none'}}/>
          <input type="text" className="form-input" placeholder="Rechercher..."
            value={search} onChange={e=>setSearch(e.target.value)} style={{width:'240px',paddingLeft:'32px'}}/>
        </div>
      </div>
      {error && <div className="alert alert-danger" style={{marginBottom:'var(--space-lg)'}}>{error}</div>}
      {loading ? <div className="loader"><div className="spinner"/></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Nom complet</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Inscription</th><th>Détails</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',color:'var(--gray-400)',padding:'var(--space-2xl)'}}>Aucun utilisateur</td></tr>
                ) : filtered.map(u=>(
                  <tr key={u.id_utilisateur}>
                    <td style={{color:'var(--gray-400)'}}>#{u.id_utilisateur}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'32px',height:'32px',background:'var(--primary)',color:'white',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.82rem',flexShrink:0}}>
                          {(u.prenom||u.nom||'?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:'0.9rem'}}>{u.prenom} {u.nom}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:'0.875rem'}}>{u.email}</td>
                    <td>{u.telephone||'-'}</td>
                    <td>{roleBadge(u.libelle_role)}</td>
                    <td style={{fontSize:'0.8rem',color:'var(--gray-400)'}}>{new Date(u.date_creation).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openDetail(u)}><FontAwesomeIcon icon={faEye} /> Détails</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal détails + modification */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={()=>setDetailModal(null)}>
          <div className="admin-modal" style={{maxWidth:'520px'}} onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2><FontAwesomeIcon icon={faUser} /> Fiche utilisateur #{detailModal.id_utilisateur}</h2>
              <button className="admin-modal-close" onClick={()=>setDetailModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {/* Avatar */}
              <div style={{display:'flex',alignItems:'center',gap:'var(--space-md)',marginBottom:'var(--space-xl)',padding:'var(--space-md)',background:'var(--gray-50)',borderRadius:'var(--radius-md)'}}>
                <div style={{width:'56px',height:'56px',background:'var(--primary)',color:'white',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',fontWeight:700,flexShrink:0}}>
                  {(detailModal.prenom||detailModal.nom||'?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:'1.05rem'}}>{detailModal.prenom} {detailModal.nom}</div>
                  <div style={{fontSize:'0.85rem',color:'var(--gray-500)'}}>{detailModal.email}</div>
                  <div style={{marginTop:'4px'}}>{roleBadge(detailModal.libelle_role)}</div>
                </div>
              </div>

              {/* Formulaire modification */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-md)'}}>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input type="text" className="form-input" value={editForm.nom||''}
                    onChange={e=>setEditForm({...editForm,nom:e.target.value})}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input type="text" className="form-input" value={editForm.prenom||''}
                    onChange={e=>setEditForm({...editForm,prenom:e.target.value})}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input type="tel" className="form-input" value={editForm.telephone||''}
                  onChange={e=>setEditForm({...editForm,telephone:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label"><FontAwesomeIcon icon={faKey} /> Rôle</label>
                <select className="form-input" value={editForm.id_role||2}
                  onChange={e=>setEditForm({...editForm,id_role:parseInt(e.target.value)})}>
                  {ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div style={{background:'var(--gray-50)',borderRadius:'var(--radius-md)',padding:'var(--space-md)',fontSize:'0.82rem',color:'var(--gray-500)'}}>
                <FontAwesomeIcon icon={faCalendarDays} /> Inscrit le {new Date(detailModal.date_creation).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
              </div>
              {saveMsg && (
                <div className={`alert ${saveMsg === 'success' ? 'alert-success' : 'alert-danger'}`} style={{marginTop:'var(--space-md)'}}>
                  {saveMsg === 'success'
                    ? <><FontAwesomeIcon icon={faCircleCheck} /> Modifications enregistrées !</>
                    : <><FontAwesomeIcon icon={faCircleXmark} /> {saveMsg.replace('error:','')}</>
                  }
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              {detailModal.libelle_role !== 'Administrateur' && (
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(detailModal.id_utilisateur)}><FontAwesomeIcon icon={faTrash} /> Désactiver</button>
              )}
              <button className="btn btn-ghost" onClick={()=>setDetailModal(null)}>Fermer</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '...' : <><FontAwesomeIcon icon={faFloppyDisk} /> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
