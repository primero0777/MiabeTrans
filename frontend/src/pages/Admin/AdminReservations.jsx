import { useState, useEffect } from 'react';
import { reservationsAPI, adminAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicket, faMagnifyingGlass, faCircleCheck, faClock, faXmark, faEye, faEnvelope, faSpinner } from '@fortawesome/free-solid-svg-icons';

const STATUTS = ['confirmée','en_attente','annulée'];

export default function AdminReservations() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [filterStatut, setFilter] = useState('');
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
      setAnnulModal(null);
      setRaison('');
      if (detailModal?.id_reservation === annulModal.id_reservation) {
        setDetailModal(prev => ({...prev, statut_reservation:'annulée'}));
      }
    } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
    finally { setAnnulLoading(false); }
  };

  const statusBadge = (s) => {
    const m={'confirmée':'badge-success','annulée':'badge-danger','en_attente':'badge-warning'};
    return <span className={`badge ${m[s]||'badge-info'}`}>{s}</span>;
  };

  const filtered = data.filter(r => {
    const ms = !search || r.client?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.ville_depart?.toLowerCase().includes(search.toLowerCase()) ||
      r.ville_arrivee?.toLowerCase().includes(search.toLowerCase());
    return ms && (!filterStatut || r.statut_reservation === filterStatut);
  });

  const counts = {
    confirmée:  data.filter(r=>r.statut_reservation==='confirmée').length,
    annulée:    data.filter(r=>r.statut_reservation==='annulée').length,
    en_attente: data.filter(r=>r.statut_reservation==='en_attente').length,
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1><FontAwesomeIcon icon={faTicket} /> Réservations</h1><p>{data.length} au total</p></div>
        <div style={{display:'flex',gap:'var(--space-sm)'}}>
          <div style={{position:'relative'}}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'var(--gray-400)',pointerEvents:'none'}}/>
            <input type="text" className="form-input" placeholder="Rechercher..."
              value={search} onChange={e=>setSearch(e.target.value)} style={{width:'200px',paddingLeft:'32px'}}/>
          </div>
          <select className="form-input" value={filterStatut} onChange={e=>setFilter(e.target.value)} style={{width:'160px'}}>
            <option value="">Tous statuts</option>
            {STATUTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* WhatsApp link après annulation */}
      {waLink && (
        <div className="alert alert-success" style={{marginBottom:'var(--space-md)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span><FontAwesomeIcon icon={faCircleCheck} /> Réservation annulée. Email envoyé au client.</span>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-sm" style={{background:'#25D366',color:'white',border:'none'}}>
            Envoyer sur WhatsApp
          </a>
        </div>
      )}

      {/* Compteurs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'var(--space-md)',marginBottom:'var(--space-lg)'}}>
        {[
          {label:'Confirmées', count:counts.confirmée, icon:faCircleCheck, color:'#10B981', bg:'#D1FAE5'},
          {label:'En attente', count:counts.en_attente,icon:faClock,        color:'#F59E0B', bg:'#FEF3C7'},
          {label:'Annulées',   count:counts.annulée,   icon:faXmark,        color:'#EF4444', bg:'#FEE2E2'},
        ].map((c,i)=>(
          <div key={i} style={{background:'var(--white)',borderRadius:'var(--radius-lg)',padding:'var(--space-md) var(--space-lg)',border:'1px solid var(--gray-100)',display:'flex',alignItems:'center',gap:'var(--space-md)'}}>
            <div style={{width:'44px',height:'44px',borderRadius:'var(--radius-md)',background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',flexShrink:0,color:c.color}}>
              <FontAwesomeIcon icon={c.icon} />
            </div>
            <div><div style={{fontFamily:'var(--font-heading)',fontSize:'1.4rem',fontWeight:800,color:c.color}}>{c.count}</div><div style={{fontSize:'0.8rem',color:'var(--gray-500)'}}>{c.label}</div></div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger" style={{marginBottom:'var(--space-lg)'}}>{error}</div>}

      {loading ? <div className="loader"><div className="spinner"/></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>Client</th><th>Trajet</th><th>Départ</th><th>Prix</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',color:'var(--gray-400)',padding:'var(--space-2xl)'}}>Aucune réservation</td></tr>
                ) : filtered.map(r=>(
                  <tr key={r.id_reservation}>
                    <td style={{color:'var(--gray-400)',fontWeight:600}}>#{r.id_reservation}</td>
                    <td><div style={{fontWeight:600}}>{r.client}</div><div style={{fontSize:'0.78rem',color:'var(--gray-400)'}}>{r.email}</div></td>
                    <td style={{fontWeight:500}}>{r.ville_depart} → {r.ville_arrivee}</td>
                    <td style={{fontSize:'0.85rem'}}>{new Date(r.date_depart).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                    <td style={{fontWeight:700,color:'var(--primary)'}}>{parseInt(r.prix).toLocaleString('fr-FR')} F</td>
                    <td>{statusBadge(r.statut_reservation)}</td>
                    <td>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setDetailModal(r)} title="Voir détails"><FontAwesomeIcon icon={faEye} /></button>
                        {r.statut_reservation !== 'annulée' && (
                          <button className="btn btn-danger btn-sm" onClick={()=>setAnnulModal(r)} title="Annuler"><FontAwesomeIcon icon={faXmark} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal détails */}
      {detailModal && (
        <div className="admin-modal-overlay" onClick={()=>setDetailModal(null)}>
          <div className="admin-modal" style={{maxWidth:'540px'}} onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2><FontAwesomeIcon icon={faTicket} /> Réservation #{detailModal.id_reservation}</h2>
              <button className="admin-modal-close" onClick={()=>setDetailModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-lg)'}}>
                <div>
                  <h4 style={{fontSize:'0.8rem',fontWeight:700,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'var(--space-sm)'}}>Client</h4>
                  {[
                    {l:'Nom complet', v:`${detailModal.client}`},
                    {l:'Email',       v: detailModal.email},
                    {l:'Téléphone',   v: detailModal.telephone||'—'},
                  ].map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--gray-50)',fontSize:'0.85rem'}}>
                      <span style={{color:'var(--gray-500)'}}>{r.l}</span><strong>{r.v}</strong>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 style={{fontSize:'0.8rem',fontWeight:700,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'var(--space-sm)'}}>Trajet</h4>
                  {[
                    {l:'Trajet',  v:`${detailModal.ville_depart} → ${detailModal.ville_arrivee}`},
                    {l:'Départ',  v: new Date(detailModal.date_depart).toLocaleString('fr-FR')},
                    {l:'Bus',     v: detailModal.numero_bus},
                    {l:'Prix',    v:`${parseInt(detailModal.prix).toLocaleString('fr-FR')} FCFA`},
                  ].map((r,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--gray-50)',fontSize:'0.85rem'}}>
                      <span style={{color:'var(--gray-500)'}}>{r.l}</span><strong>{r.v}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginTop:'var(--space-lg)',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'var(--space-md)',background:'var(--gray-50)',borderRadius:'var(--radius-md)'}}>
                <div>
                  <span style={{fontSize:'0.8rem',color:'var(--gray-500)'}}>Statut : </span>
                  {statusBadge(detailModal.statut_reservation)}
                </div>
                <div style={{fontSize:'0.78rem',color:'var(--gray-400)'}}>
                  Réservé le {new Date(detailModal.date_reservation).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              {detailModal.statut_reservation !== 'annulée' && (
                <button className="btn btn-danger btn-sm" onClick={()=>{setDetailModal(null);setAnnulModal(detailModal);}}><FontAwesomeIcon icon={faXmark} /> Annuler</button>
              )}
              <button className="btn btn-ghost" onClick={()=>setDetailModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal annulation avec raison */}
      {annulModal && (
        <div className="admin-modal-overlay" onClick={()=>setAnnulModal(null)}>
          <div className="admin-modal" onClick={e=>e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2><FontAwesomeIcon icon={faXmark} /> Annuler la réservation #{annulModal.id_reservation}</h2>
              <button className="admin-modal-close" onClick={()=>setAnnulModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{background:'var(--gray-50)',borderRadius:'var(--radius-md)',padding:'var(--space-md)',marginBottom:'var(--space-lg)'}}>
                <div style={{fontWeight:600,marginBottom:'4px'}}>{annulModal.client}</div>
                <div style={{fontSize:'0.85rem',color:'var(--gray-500)'}}>{annulModal.ville_depart} → {annulModal.ville_arrivee}</div>
                <div style={{fontSize:'0.85rem',color:'var(--gray-500)'}}>Départ : {new Date(annulModal.date_depart).toLocaleString('fr-FR')}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Raison de l'annulation * <span style={{fontSize:'0.78rem',color:'var(--gray-400)',fontWeight:400}}>(sera envoyée au client par email)</span></label>
                <textarea className="form-input" rows={4} value={raison}
                  onChange={e=>setRaison(e.target.value)}
                  placeholder="Ex: Le bus est en maintenance. Nous vous prions de nous excuser pour la gêne occasionnée..."
                  style={{resize:'vertical'}}/>
              </div>
              <div className="alert alert-info">
                <FontAwesomeIcon icon={faEnvelope} /> Un email d'annulation sera automatiquement envoyé à <strong>{annulModal.email}</strong>.
                Si le client a un numéro WhatsApp, un lien sera généré.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-ghost" onClick={()=>setAnnulModal(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleAnnuler} disabled={annulLoading}>
                {annulLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Envoi...</> : <><FontAwesomeIcon icon={faXmark} /> Confirmer l'annulation</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
