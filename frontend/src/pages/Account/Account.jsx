import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Account.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faTicket, faRightFromBracket, faPen, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

export default function Account() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('profil');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({
    nom:       user.nom       || '',
    prenom:    user.prenom    || '',
    email:     user.email     || '',
    telephone: user.telephone || '',
  });
  const [pwd, setPwd] = useState({ ancien:'', nouveau:'', confirm:'' });

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      await authAPI.updateProfile({ ...form });
      // Mettre à jour le localStorage
      const stored = JSON.parse(localStorage.getItem('miabetrans_user') || '{}');
      localStorage.setItem('miabetrans_user', JSON.stringify({ ...stored, ...form }));
      setSuccess('Profil mis à jour avec succès !');
    } catch(err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally { setSaving(false); }
  };

  const handleSavePwd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (pwd.nouveau !== pwd.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.nouveau.length < 6) { setError('Minimum 6 caractères.'); return; }
    setSaving(true);
    try {
      await authAPI.updateProfile({
        ...form,
        ancien_mot_de_passe:  pwd.ancien,
        nouveau_mot_de_passe: pwd.nouveau,
      });
      setSuccess('Mot de passe modifié !');
      setPwd({ ancien:'', nouveau:'', confirm:'' });
    } catch(err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally { setSaving(false); }
  };

  const TABS = [
    { key:'profil',      label:'Mon profil',       icon:faUser   },
    { key:'password',    label:'Mot de passe',      icon:faLock   },
    { key:'reservations',label:'Mes réservations',  icon:faTicket },
  ];

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-hero">
          <div className="account-avatar-big">{(user.prenom||user.nom||'U').charAt(0).toUpperCase()}</div>
          <div>
            <h1>{user.prenom} {user.nom}</h1>
            <p>{user.email}</p>
            <span className="badge badge-primary">{user.role}</span>
          </div>
        </div>

        <div className="account-layout">
          {/* Sidebar tabs */}
          <div className="account-sidebar">
            {TABS.map(t => (
              <button key={t.key} className={`account-tab ${tab===t.key?'active':''}`} onClick={()=>{setTab(t.key);setError('');setSuccess('');}}>
                <span style={{fontSize:'1.1rem'}}><FontAwesomeIcon icon={t.icon} /></span> {t.label}
              </button>
            ))}
            <button className="account-tab danger" onClick={()=>{logout();navigate('/');}}>
              <span style={{fontSize:'1.1rem'}}><FontAwesomeIcon icon={faRightFromBracket} /></span> Déconnexion
            </button>
          </div>

          {/* Contenu */}
          <div className="account-content">
            {success && <div className="alert alert-success" style={{marginBottom:'var(--space-md)'}}>{success}</div>}
            {error   && <div className="alert alert-danger"  style={{marginBottom:'var(--space-md)'}}>{error}</div>}

            {/* Onglet Profil */}
            {tab === 'profil' && (
              <div className="card">
                <div className="card-header"><FontAwesomeIcon icon={faPen} /> Modifier mes informations</div>
                <div className="card-body">
                  <form onSubmit={handleSaveProfil}>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">Nom *</label>
                        <input type="text" className="form-input" value={form.nom}
                          onChange={e=>setForm({...form,nom:e.target.value})} required/>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Prénom *</label>
                        <input type="text" className="form-input" value={form.prenom}
                          onChange={e=>setForm({...form,prenom:e.target.value})} required/>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input type="email" className="form-input" value={form.email}
                        onChange={e=>setForm({...form,email:e.target.value})} required/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Téléphone</label>
                      <input type="tel" className="form-input" value={form.telephone}
                        onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+228 90 00 00 00"/>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Enregistrement...' : <><FontAwesomeIcon icon={faFloppyDisk} /> Enregistrer les modifications</>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Onglet Mot de passe */}
            {tab === 'password' && (
              <div className="card">
                <div className="card-header"><FontAwesomeIcon icon={faLock} /> Changer le mot de passe</div>
                <div className="card-body">
                  <form onSubmit={handleSavePwd}>
                    <div className="form-group">
                      <label className="form-label">Mot de passe actuel *</label>
                      <input type="password" className="form-input" value={pwd.ancien}
                        onChange={e=>setPwd({...pwd,ancien:e.target.value})} required placeholder="Votre mot de passe actuel"/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nouveau mot de passe *</label>
                      <input type="password" className="form-input" value={pwd.nouveau}
                        onChange={e=>setPwd({...pwd,nouveau:e.target.value})} required placeholder="Min. 6 caractères"/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirmer le nouveau mot de passe *</label>
                      <input type="password" className="form-input" value={pwd.confirm}
                        onChange={e=>setPwd({...pwd,confirm:e.target.value})} required placeholder="Répéter le nouveau mot de passe"/>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Modification...' : <><FontAwesomeIcon icon={faLock} /> Changer le mot de passe</>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Onglet Réservations */}
            {tab === 'reservations' && (
              <div style={{textAlign:'center',padding:'var(--space-2xl)'}}>
                <div style={{fontSize:'3rem',marginBottom:'var(--space-md)'}}><FontAwesomeIcon icon={faTicket} /></div>
                <h3 style={{fontFamily:'var(--font-heading)',marginBottom:'var(--space-sm)'}}>Mes réservations</h3>
                <p style={{color:'var(--gray-500)',marginBottom:'var(--space-lg)'}}>Consultez l'historique complet de vos voyages.</p>
                <button className="btn btn-primary" onClick={()=>navigate('/history')}>Voir mes réservations →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
