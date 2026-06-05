import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBus, faEnvelope, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch(err) {
      setError(err.response?.data?.message || 'Erreur. Réessayez.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=85" alt="" className="auth-bg-img"/>
        <div className="auth-bg-overlay"/>
        <div className="auth-left-content">
          <div className="auth-logo"><FontAwesomeIcon icon={faBus} /> MiabeTrans</div>
          <h2>Mot de passe oublié ?</h2>
          <p>Pas de panique ! Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrapper">
          {sent ? (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'4rem',marginBottom:'var(--space-lg)'}}><FontAwesomeIcon icon={faEnvelope} /></div>
              <h1 style={{fontFamily:'var(--font-heading)',fontSize:'1.6rem',fontWeight:700,marginBottom:'var(--space-md)'}}>Email envoyé !</h1>
              <p style={{color:'var(--gray-500)',marginBottom:'var(--space-xl)'}}>
                Si <strong>{email}</strong> est associé à un compte MiabeTrans, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <div className="alert alert-info">Vérifiez aussi votre dossier spam.</div>
              <Link to="/login" className="btn btn-primary btn-full" style={{marginTop:'var(--space-xl)',display:'flex'}}>
                <FontAwesomeIcon icon={faChevronLeft} /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h1>Réinitialiser le mot de passe</h1>
                <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Adresse email</label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                    <input type="email" className="form-input" placeholder="votre@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required autoFocus/>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
              <p className="auth-switch"><Link to="/login"><FontAwesomeIcon icon={faChevronLeft} /> Retour à la connexion</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
