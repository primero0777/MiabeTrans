import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Auth.css';

/* ── Icônes SVG inline ── */
const IconUser  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IconPhone = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 10a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 14.92z"/></svg>;
const IconLock  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconEye   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>;

/* ── Composant OTP ── */
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits  = value.split('');

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const next = [...digits];
    next[i] = val[val.length - 1];
    onChange(next.join('').slice(0, 6));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[i]) { next[i] = ''; onChange(next.join('')); }
      else if (i > 0) { inputs.current[i - 1]?.focus(); next[i - 1] = ''; onChange(next.join('')); }
    }
    if (e.key === 'ArrowLeft'  && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, '').slice(0, 6));
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="otp-inputs">
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-digit${digits[i] ? ' filled' : ''}`}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

export default function Register() {
  const { register: authRegister, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({ nom: '', prenom: '', email: '', telephone: '', mot_de_passe: '', confirm: '' });
  const [otp, setOtp]     = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError]   = useState('');
  const [info, setInfo]     = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const f = (k) => ({
    value: form[k],
    onChange: e => setForm({ ...form, [k]: e.target.value }),
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (form.mot_de_passe !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.mot_de_passe.length < 6)       { setError('Mot de passe : minimum 6 caractères.'); return; }
    setLoading(true);
    try {
      await authAPI.sendOtp({ email: form.email, type: 'inscription' });
      setInfo(`Code envoyé à ${form.email}`);
      setCountdown(60);
      setStep(2);
    } catch (err) { setError(err.response?.data?.message || 'Erreur lors de l\'envoi.'); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError(''); setLoading(true);
    try {
      await authAPI.sendOtp({ email: form.email, type: 'inscription' });
      setInfo('Nouveau code envoyé !');
      setCountdown(60);
      setOtp('');
    } catch (err) { setError(err.response?.data?.message || 'Erreur.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('Entrez les 6 chiffres du code.'); return; }
    setError(''); setLoading(true);
    try {
      await authAPI.verifyOtp({ email: form.email, otp_code: otp, type: 'inscription' });
      await authAPI.register({
        nom: form.nom, prenom: form.prenom, email: form.email,
        telephone: form.telephone, mot_de_passe: form.mot_de_passe,
        otp_verifie: true,
      });
      await login(form.email, form.mot_de_passe);
      navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Code incorrect ou expiré.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">

      {/* ── Panneau gauche ── */}
      <div className="auth-left">
        <img
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&q=85"
          alt="Bus MiabeTrans"
          className="auth-bg-img"
        />
        <div className="auth-bg-overlay" />
        <div className="auth-left-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">🚌</div>
            <span className="auth-logo-name">MiabeTrans</span>
          </div>
          <h2>Rejoignez<br/>l'aventure !</h2>
          <p>Créez votre compte gratuitement et réservez vos billets en quelques secondes.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              Inscription 100% gratuite
            </div>
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              Réservation instantanée en ligne
            </div>
            <div className="auth-feature">
              <div className="auth-feature-dot" />
              Email vérifié pour votre sécurité
            </div>
          </div>
        </div>
        <div className="auth-left-deco">
          <div className="auth-stat-row">
            <div>
              <span className="auth-stat-num">5 000+</span>
              <span className="auth-stat-lab">Membres</span>
            </div>
            <div>
              <span className="auth-stat-num">Gratuit</span>
              <span className="auth-stat-lab">Inscription</span>
            </div>
            <div>
              <span className="auth-stat-num">2 min</span>
              <span className="auth-stat-lab">Pour créer</span>
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

          {/* Indicateur d'étapes */}
          <div className="auth-steps">
            <div className={`auth-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
              <div className="auth-step-circle">{step > 1 ? '✓' : '1'}</div>
              <span>Informations</span>
            </div>
            <div className="auth-step-line" />
            <div className={`auth-step ${step >= 2 ? 'active' : ''}`}>
              <div className="auth-step-circle">2</div>
              <span>Vérification</span>
            </div>
          </div>

          {/* ─── ÉTAPE 1 ─── */}
          {step === 1 && (
            <>
              <div className="auth-header">
                <h1>Créer un compte</h1>
                <p>Renseignez vos informations pour commencer</p>
              </div>

              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <form onSubmit={handleSendOtp} className="auth-form" noValidate>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="nom">Nom <span className="required">*</span></label>
                    <div className="input-icon-wrapper">
                      <span className="input-icon"><IconUser /></span>
                      <input id="nom" type="text" className="form-input" placeholder="Mensah" {...f('nom')} required autoComplete="family-name" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="prenom">Prénom <span className="required">*</span></label>
                    <div className="input-icon-wrapper">
                      <span className="input-icon"><IconUser /></span>
                      <input id="prenom" type="text" className="form-input" placeholder="Komi" {...f('prenom')} required autoComplete="given-name" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email <span className="required">*</span></label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><IconMail /></span>
                    <input id="reg-email" type="email" className="form-input" placeholder="votre@email.com" {...f('email')} required autoComplete="email" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tel">
                    Téléphone <span className="form-label-optional">(optionnel)</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><IconPhone /></span>
                    <input id="tel" type="tel" className="form-input" placeholder="+228 90 00 00 00" {...f('telephone')} autoComplete="tel" />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="pwd">Mot de passe <span className="required">*</span></label>
                    <div className="input-icon-wrapper">
                      <span className="input-icon"><IconLock /></span>
                      <input id="pwd" type={showPwd ? 'text' : 'password'} className="form-input" placeholder="Min. 6 car." {...f('mot_de_passe')} required style={{ paddingRight: '48px' }} />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)} tabIndex={-1} aria-label="Afficher/masquer">
                        {showPwd ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="conf">Confirmer <span className="required">*</span></label>
                    <div className="input-icon-wrapper">
                      <span className="input-icon"><IconLock /></span>
                      <input id="conf" type={showConf ? 'text' : 'password'} className="form-input" placeholder="Répéter" {...f('confirm')} required style={{ paddingRight: '48px' }} />
                      <button type="button" className="pwd-toggle" onClick={() => setShowConf(!showConf)} tabIndex={-1} aria-label="Afficher/masquer">
                        {showConf ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading
                    ? <><span className="auth-spinner" />Envoi du code…</>
                    : 'Continuer, vérifier l\'email'
                  }
                </button>
              </form>

              <p className="auth-switch">
                Déjà un compte ? <Link to="/login">Se connecter</Link>
              </p>
              <Link to="/" className="auth-back">← Retour à l'accueil</Link>
            </>
          )}

          {/* ─── ÉTAPE 2 : OTP ─── */}
          {step === 2 && (
            <>
              <div className="auth-header">
                <h1>Vérifiez votre email</h1>
                <p>Confirmation de votre adresse</p>
              </div>

              <div className="otp-sent-banner">
                <div className="otp-sent-icon">📧</div>
                <div>
                  <div className="osb-title">Code envoyé !</div>
                  <div className="osb-sub">
                    Nous avons envoyé un code à 6 chiffres à<br />
                    <strong>{form.email}</strong>
                  </div>
                </div>
              </div>

              {info  && <div className="alert alert-success">{info}</div>}
              {error && <div className="alert alert-danger"  role="alert">{error}</div>}

              <div className="otp-section">
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '16px' }}>
                  Entrez le code à 6 chiffres
                </label>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                style={{ marginTop: '20px' }}
              >
                {loading
                  ? <><span className="auth-spinner" />Vérification…</>
                  : 'Vérifier et créer mon compte'
                }
              </button>

              <div className="otp-resend">
                <span>Pas reçu ?</span>
                {countdown > 0
                  ? <span className="otp-countdown">Renvoyer dans {countdown}s</span>
                  : <button className="btn-link" onClick={handleResendOtp} disabled={loading}>Renvoyer le code</button>
                }
              </div>

              <button
                className="btn btn-ghost btn-sm btn-full"
                onClick={() => { setStep(1); setError(''); setOtp(''); }}
                style={{ marginTop: '8px' }}
              >
                ← Modifier mon email
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
