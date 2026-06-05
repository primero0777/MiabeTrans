import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faUser, faTrash, faCircleCheck, faTriangleExclamation, faSpinner, faUpload } from '@fortawesome/free-solid-svg-icons';

const BASE_URL = 'http://localhost/miabetrans/backend';

export default function AdminChauffeurs() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState(null); // null | 'create' | {chauffeur}
  const [detailModal, setDetailModal] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState({ photo: false, cni: false });
  const [form, setForm]       = useState({ nom:'', email:'', telephone:'', mot_de_passe:'' });
  const photoRef = useRef();
  const cniRef   = useRef();

  const loadData = () => {
    setLoading(true); setError('');
    adminAPI.getChauffeurs()
      .then(r => setData(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const handleSave = async () => {
    if (!form.nom || !form.email || !form.mot_de_passe) { alert('Nom, email et mot de passe requis.'); return; }
    setSaving(true);
    try { await adminAPI.createChauffeur(form); setModal(null); setForm({nom:'',email:'',telephone:'',mot_de_passe:''}); loadData(); }
    catch(e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Désactiver ce chauffeur ?')) return;
    try { await adminAPI.deleteChauffeur(id); loadData(); setDetailModal(null); }
    catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleUpload = async (chauffeurId, type, file) => {
    if (!file) return;
    setUploading(u => ({...u, [type]: true}));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('miabetrans_token');
      const res = await fetch(
        `${BASE_URL}/api/upload/index.php?type=${type}&chauffeur_id=${chauffeurId}`,
        { method:'POST', headers:{ Authorization: `Bearer ${token}` }, body: formData }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      // Mettre à jour localement
      setDetailModal(prev => ({
        ...prev,
        [`${type === 'photo' ? 'photo_profil' : 'photo_cni'}_url`]: json.data.url
      }));
      loadData();
    } catch(e) { alert(e.message || 'Erreur upload'); }
    finally { setUploading(u => ({...u, [type]: false})); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1><FontAwesomeIcon icon={faIdCard} /> Chauffeurs</h1><p>{data.length} chauffeur{data.length>1?'s':''}</p></div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Nouveau chauffeur</button>
      </div>

      {error && <div className="alert alert-danger" style={{marginBottom:'var(--space-lg)'}}>{error}</div>}

      {loading ? <div className="loader"><div className="spinner"/></div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'var(--space-md)'}}>
          {data.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><FontAwesomeIcon icon={faIdCard} /></div><h3>Aucun chauffeur</h3></div>
          ) : data.map(c => (
            <div key={c.id_utilisateur} className="card" style={{cursor:'pointer',transition:'all 0.2s'}}
              onClick={() => setDetailModal(c)}>
              <div className="card-body" style={{textAlign:'center',padding:'var(--space-xl)'}}>
                {c.photo_profil_url ? (
                  <img src={c.photo_profil_url} alt={c.nom} style={{width:'72px',height:'72px',borderRadius:'50%',objectFit:'cover',border:'3px solid var(--primary)',marginBottom:'var(--space-md)'}}/>
                ) : (
                  <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'var(--primary)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',fontWeight:700,margin:'0 auto var(--space-md)'}}>
                    {c.nom.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{fontWeight:700,fontSize:'1rem',color:'var(--gray-900)',marginBottom:'4px'}}>{c.nom}</div>
                <div style={{fontSize:'0.8rem',color:'var(--gray-400)',marginBottom:'var(--space-sm)'}}>{c.email}</div>
                <div style={{display:'flex',gap:'var(--space-xs)',justifyContent:'center'}}>
                  <span className={`badge ${c.photo_profil ? 'badge-success' : 'badge-warning'}`} style={{fontSize:'0.68rem'}}>
                    {c.photo_profil
                      ? <><FontAwesomeIcon icon={faCircleCheck} /> Photo</>
                      : <><FontAwesomeIcon icon={faTriangleExclamation} /> Photo</>
                    }
                  </span>
                  <span className={`badge ${c.photo_cni ? 'badge-success' : 'badge-warning'}`} style={{fontSize:'0.68rem'}}>
                    {c.photo_cni
                      ? <><FontAwesomeIcon icon={faCircleCheck} /> CNI</>
                      : <><FontAwesomeIcon icon={faTriangleExclamation} /> CNI</>
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal créer chauffeur */}
      {modal === 'create' && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header"><h2>Nouveau chauffeur</h2><button className="admin-modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="admin-modal-body">
              <div className="form-group"><label className="form-label">Nom complet *</label><input type="text" className="form-input" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} placeholder="Kofi Mensah"/></div>
              <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="chauffeur@miabetrans.tg"/></div>
              <div className="form-group"><label className="form-label">Téléphone</label><input type="tel" className="form-input" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+228 90 00 00 00"/></div>
              <div className="form-group"><label className="form-label">Mot de passe *</label><input type="password" className="form-input" value={form.mot_de_passe} onChange={e=>setForm({...form,mot_de_passe:e.target.value})} placeholder="Min. 6 caractères"/></div>
            </div>
            <div className="admin-modal-footer"><button className="btn btn-ghost" onClick={() => setModal(null)}>Annuler</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'...':'Enregistrer'}</button></div>
          </div>
        </div>
      )}

      {/* Modal détail chauffeur avec upload */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="admin-modal" style={{maxWidth:'560px'}} onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Fiche chauffeur</h2>
              <button className="admin-modal-close" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {/* Photo profil */}
              <div style={{display:'flex',gap:'var(--space-xl)',marginBottom:'var(--space-xl)'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{marginBottom:'var(--space-sm)',fontSize:'0.8rem',fontWeight:600,color:'var(--gray-600)'}}>Photo de profil</div>
                  {detailModal.photo_profil_url ? (
                    <img src={detailModal.photo_profil_url} alt="Photo" style={{width:'100px',height:'100px',borderRadius:'50%',objectFit:'cover',border:'3px solid var(--primary)',display:'block',marginBottom:'var(--space-sm)'}}/>
                  ) : (
                    <div style={{width:'100px',height:'100px',borderRadius:'50%',background:'var(--gray-100)',border:'3px dashed var(--gray-300)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',marginBottom:'var(--space-sm)'}}>
                      <FontAwesomeIcon icon={faUser} style={{color:'var(--gray-400)'}}/>
                    </div>
                  )}
                  <input type="file" ref={photoRef} accept="image/*" style={{display:'none'}}
                    onChange={e => handleUpload(detailModal.id_utilisateur, 'photo', e.target.files[0])}/>
                  <button className="btn btn-outline btn-sm" onClick={() => photoRef.current.click()} disabled={uploading.photo}>
                    {uploading.photo ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faUpload} /> Changer</>}
                  </button>
                </div>

                {/* CNI */}
                <div style={{textAlign:'center'}}>
                  <div style={{marginBottom:'var(--space-sm)',fontSize:'0.8rem',fontWeight:600,color:'var(--gray-600)'}}>Carte d'identité (CNI)</div>
                  {detailModal.photo_cni_url ? (
                    <img src={detailModal.photo_cni_url} alt="CNI" style={{width:'160px',height:'100px',objectFit:'cover',borderRadius:'var(--radius-md)',border:'2px solid var(--gray-200)',display:'block',marginBottom:'var(--space-sm)'}}/>
                  ) : (
                    <div style={{width:'160px',height:'100px',background:'var(--gray-100)',border:'3px dashed var(--gray-300)',borderRadius:'var(--radius-md)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',marginBottom:'var(--space-sm)'}}>
                      <FontAwesomeIcon icon={faIdCard} style={{color:'var(--gray-400)'}}/>
                    </div>
                  )}
                  <input type="file" ref={cniRef} accept="image/*" style={{display:'none'}}
                    onChange={e => handleUpload(detailModal.id_utilisateur, 'cni', e.target.files[0])}/>
                  <button className="btn btn-outline btn-sm" onClick={() => cniRef.current.click()} disabled={uploading.cni}>
                    {uploading.cni ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faUpload} /> Changer</>}
                  </button>
                </div>
              </div>

              {/* Infos */}
              <div style={{background:'var(--gray-50)',borderRadius:'var(--radius-md)',padding:'var(--space-md)'}}>
                {[
                  {label:'Nom',       value: detailModal.nom},
                  {label:'Email',     value: detailModal.email},
                  {label:'Téléphone', value: detailModal.telephone || '—'},
                ].map((r,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gray-200)',fontSize:'0.9rem'}}>
                    <span style={{color:'var(--gray-500)'}}>{r.label}</span>
                    <strong>{r.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(detailModal.id_utilisateur)}><FontAwesomeIcon icon={faTrash} /> Désactiver</button>
              <button className="btn btn-ghost" onClick={() => setDetailModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
