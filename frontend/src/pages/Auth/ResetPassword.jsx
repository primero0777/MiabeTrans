import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBus, faLock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

export default function ResetPassword() {
  const [searchParams]      = useSearchParams();
  const navigate            = useNavigate();
  const token               = searchParams.get('token') || '';
  const [form, setForm]     = useState({ mot_de_passe:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.mot_de_passe !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.mot_de_passe.length < 6) { setError('Minimum 6 caractères.'); return; }
    setError(''); setLoading(true);
    try {
      await authAPI.resetPassword({ token, mot_de_passe: form.mot_de_passe });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch(err) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré.');
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div className="auth-page"><div className="auth-right"><div className="auth-form-wrapper">
      <div className="alert alert-danger">Lien invalide. <Link to="/forgot-password">Faire une nouvelle demande</Link>.</div>
    </div></div></div>
  );

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=85" alt="" className="auth-bg-img"/>
        <div className="auth-bg-overlay"/>
        <div className="auth-left-content">
          <div className="auth-logo"><FontAwesomeIcon icon={faBus} /> MiabeTrans</div>
          <h2>Nouveau mot de passe</h2>
          <p>Choisissez un mot de passe sécurisé d'au moins 6 caractères.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrapper">
          {success ? (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'4rem',marginBottom:'var(--space-lg)'}}><FontAwesomeIcon icon={faCircleCheck} /></div>
              <h1 style={{fontFamily:'var(--font-heading)',fontSize:'1.6rem',fontWeight:700,marginBottom:'var(--space-md)'}}>Mot de passe modifié !</h1>
              <p style={{color:'var(--gray-500)'}}>Redirection vers la connexion dans 3 secondes...</p>
              <Link to="/login" className="btn btn-primary btn-full" style={{marginTop:'var(--space-xl)',display:'flex'}}>Se connecter</Link>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h1>Nouveau mot de passe</h1>
                <p>Choisissez un mot de passe sécurisé</p>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Nouveau mot de passe</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
                    <input type="password" className="form-input" placeholder="Min. 6 caractères"
                      value={form.mot_de_passe} onChange={e => setForm({...form,mot_de_passe:e.target.value})} required/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmer le mot de passe</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
                    <input type="password" className="form-input" placeholder="Répéter le mot de passe"
                      value={form.confirm} onChange={e => setForm({...form,confirm:e.target.value})} required/>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? 'Modification...' : 'Modifier le mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
