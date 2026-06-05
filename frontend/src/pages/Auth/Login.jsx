import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faUser } from '@fortawesome/free-solid-svg-icons';
import './Auth.css';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', mot_de_passe: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.mot_de_passe);
      if (user.role === 'Administrateur') navigate('/admin');
      else if (user.role === 'Chauffeur') navigate('/chauffeur');
      else                                navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin')  setForm({ email: 'admin@miabetrans.tg',    mot_de_passe: 'password' });
    if (role === 'client') setForm({ email: 'komi.mensah@gmail.com',  mot_de_passe: 'password' });
  };

  return (
    <div className="auth-page">

      {/* ── Panneau gauche ── */}
      <div className="auth-left">
        <img
          src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=900&q=85"
          alt="Voyage en bus"
          className="auth-bg-img"
        />
        <div className="auth-bg-overlay" />

        <div className="auth-left-content">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">🚌</div>
            <span className="auth-logo-name">MiabeTrans</span>
          </div>

          <h2>Bienvenue à bord !</h2>
          <p>Votre partenaire de confiance pour les voyages interurbains au Togo.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              Réservation en ligne 24h/24 et 7j/7
            </div>
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              Paiement sécurisé — Mixx By Yas, Moov Money, MobileMoney
            </div>
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              Suivi en temps réel de vos réservations
            </div>
          </div>
        </div>

        {/* Stats bas de page */}
        <div className="auth-left-deco">
          <div className="auth-stat-row">
            <div>
              <span className="auth-stat-num">5 000+</span>
              <span className="auth-stat-lab">Voyageurs</span>
            </div>
            <div>
              <span className="auth-stat-num">10+</span>
              <span className="auth-stat-lab">Villes</span>
            </div>
            <div>
              <span className="auth-stat-num">98%</span>
              <span className="auth-stat-lab">Satisfaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className="auth-right">
        <div className="auth-form-wrapper">

          {/* Mini logo — visible uniquement quand le panneau gauche est masqué */}
          <div className="auth-mobile-brand">
            <div className="auth-mobile-brand-icon">🚌</div>
            <span className="auth-mobile-brand-name">MiabeTrans</span>
          </div>

          <div className="auth-header">
            <h1>Se connecter</h1>
            <p>Accédez à votre espace MiabeTrans</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Adresse email</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="password">Mot de passe</label>
                <Link to="/forgot-password" className="form-label-link">Oublié ?</Link>
              </div>
              <div className="input-icon-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.mot_de_passe}
                  onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading
                ? <><span className="auth-spinner" />Connexion en cours…</>
                : 'Se connecter'
              }
            </button>
          </form>

          {/* Démo */}
          <div className="auth-divider"><span>Comptes de démo</span></div>
          <div className="demo-btns">
            <button className="demo-btn" onClick={() => fillDemo('admin')}>
              <FontAwesomeIcon icon={faGear} className="demo-btn-icon" />
              <span>Administrateur</span>
            </button>
            <button className="demo-btn" onClick={() => fillDemo('client')}>
              <FontAwesomeIcon icon={faUser} className="demo-btn-icon" />
              <span>Client</span>
            </button>
          </div>

          <p className="auth-switch">
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </p>
          <Link to="/" className="auth-back">← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
