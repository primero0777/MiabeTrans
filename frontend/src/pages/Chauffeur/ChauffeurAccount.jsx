import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

export default function ChauffeurAccount() {
  const { user } = useAuth();
  const [tab, setTab] = useState('profil');
  const [form, setForm] = useState({ nom:user?.nom||'', prenom:user?.prenom||'', email:user?.email||'', telephone:user?.telephone||'' });
  const [pwd, setPwd]   = useState({ ancien:'', nouveau:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');

  const handleSaveProfil = async (e) => {
    e.preventDefault(); setMsg(''); setErr(''); setSaving(true);
    try {
      await authAPI.updateProfile(form);
      const stored = JSON.parse(localStorage.getItem('miabetrans_user')||'{}');
      localStorage.setItem('miabetrans_user', JSON.stringify({...stored,...form}));
      setMsg('Profil mis à jour avec succès !');
    } catch(e) { setErr(e.response?.data?.message||'Erreur'); }
    finally { setSaving(false); }
  };

  const handleSavePwd = async (e) => {
    e.preventDefault(); setMsg(''); setErr('');
    if (pwd.nouveau !== pwd.confirm) { setErr('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.nouveau.length < 6) { setErr('Minimum 6 caractères.'); return; }
    setSaving(true);
    try {
      await authAPI.updateProfile({...form, ancien_mot_de_passe:pwd.ancien, nouveau_mot_de_passe:pwd.nouveau});
      setMsg('Mot de passe modifié !'); setPwd({ancien:'',nouveau:'',confirm:''});
    } catch(e) { setErr(e.response?.data?.message||'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="chauffeur-page">
      <div className="chauffeur-page-header">
        <h1>Mon compte</h1>
      </div>

      <div className="account-layout">
        <div className="account-sidebar">
          {[
            {key:'profil',   label:'Mon profil',    icon:faUser},
            {key:'password', label:'Mot de passe',  icon:faLock},
          ].map(t=>(
            <button key={t.key} className={`account-tab ${tab===t.key?'active':''}`} onClick={()=>{setTab(t.key);setMsg('');setErr('');}}>
              <FontAwesomeIcon icon={t.icon} /> {t.label}
            </button>
          ))}
        </div>
        <div className="account-content">
          {msg && <div className="alert alert-success" style={{marginBottom:'var(--space-md)'}}>{msg}</div>}
          {err && <div className="alert alert-danger"  style={{marginBottom:'var(--space-md)'}}>{err}</div>}

          {tab === 'profil' && (
            <div className="card">
              <div className="card-header">Modifier mes informations</div>
              <div className="card-body">
                <form onSubmit={handleSaveProfil}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-md)'}}>
                    <div className="form-group"><label className="form-label">Nom</label><input type="text" className="form-input" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} required/></div>
                    <div className="form-group"><label className="form-label">Prénom</label><input type="text" className="form-input" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} required/></div>
                  </div>
                  <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
                  <div className="form-group"><label className="form-label">Téléphone</label><input type="tel" className="form-input" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} placeholder="+228 90 00 00 00"/></div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : <><FontAwesomeIcon icon={faFloppyDisk} /> Enregistrer</>}</button>
                </form>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div className="card">
              <div className="card-header">Changer le mot de passe</div>
              <div className="card-body">
                <form onSubmit={handleSavePwd}>
                  <div className="form-group"><label className="form-label">Mot de passe actuel</label><input type="password" className="form-input" value={pwd.ancien} onChange={e=>setPwd({...pwd,ancien:e.target.value})} required/></div>
                  <div className="form-group"><label className="form-label">Nouveau mot de passe</label><input type="password" className="form-input" value={pwd.nouveau} onChange={e=>setPwd({...pwd,nouveau:e.target.value})} required/></div>
                  <div className="form-group"><label className="form-label">Confirmer</label><input type="password" className="form-input" value={pwd.confirm} onChange={e=>setPwd({...pwd,confirm:e.target.value})} required/></div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : <><FontAwesomeIcon icon={faLock} /> Modifier</>}</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
