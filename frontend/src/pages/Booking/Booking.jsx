import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { horairesAPI, reservationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMobileScreen, faCreditCard, faBuilding, faMoneyBill,
  faLock, faClock, faBus, faEnvelope, faCheck,
  faCircleCheck, faChevronLeft, faArrowRight, faUser,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import './Booking.css';

const MODES = [
  { id:'Mixx By Yas',    faIcon: faMobileScreen, label:'Mixx By Yas',       desc:'Mobile Money Togocom',     color:'#FF6B00', ussd:'*144#', marchand:'MIABETRANS' },
  { id:'Flooz',          faIcon: faCreditCard,   label:'Moov Money',        desc:'Mobile Money Moov Africa', color:'#0070C0', ussd:'*155#', marchand:'MIABETRANS' },
  { id:'Carte Bancaire', faIcon: faBuilding,     label:'Carte Bancaire',    desc:'Visa / Mastercard',        color:'#6366F1' },
  { id:'Cash',           faIcon: faMoneyBill,    label:'Espèces en agence', desc:'Paiement à la caisse',     color:'#10B981' },
];

function Countdown({ expireAt, onExpire }) {
  const [txt, setTxt]     = useState('--:--');
  const [urgent, setUrg]  = useState(false);
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, Math.floor((new Date(expireAt) - Date.now()) / 1000));
      if (d === 0) { setTxt('Expiré'); onExpire?.(); return; }
      setTxt(`${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`);
      setUrg(d < 120);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expireAt]);
  return <span className={`bk-countdown ${urgent?'urgent':''}`}><FontAwesomeIcon icon={faClock} /> {txt}</span>;
}

function CarteForm({ onSubmit, loading, error }) {
  const [c, setC] = useState({num:'',mois:'',annee:'',cvv:'',nom:''});
  const fmtNum = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const submit = (e) => {
    e.preventDefault();
    onSubmit({ numero_carte:c.num.replace(/\s/g,''), expiration_mois:parseInt(c.mois),
               expiration_annee:parseInt(c.annee), cvv:c.cvv, nom_porteur:c.nom });
  };
  return (
    <form onSubmit={submit} className="carte-form">
      <div className="form-group">
        <label className="form-label">Numéro de carte</label>
        <input type="text" className="form-input" inputMode="numeric" placeholder="1234 5678 9012 3456"
          maxLength={19} value={c.num} onChange={e=>setC({...c,num:fmtNum(e.target.value)})} required
          style={{fontFamily:'monospace',letterSpacing:'2px',fontSize:'1.05rem'}}/>
      </div>
      <div className="carte-row-3">
        <div className="form-group">
          <label className="form-label">Mois (MM)</label>
          <input type="text" className="form-input" inputMode="numeric" placeholder="08"
            maxLength={2} value={c.mois} onChange={e=>setC({...c,mois:e.target.value.replace(/\D/g,'')})} required/>
        </div>
        <div className="form-group">
          <label className="form-label">Année (YYYY)</label>
          <input type="text" className="form-input" inputMode="numeric" placeholder="2028"
            maxLength={4} value={c.annee} onChange={e=>setC({...c,annee:e.target.value.replace(/\D/g,'')})} required/>
        </div>
        <div className="form-group">
          <label className="form-label">CVV</label>
          <input type="password" className="form-input" inputMode="numeric" placeholder="•••"
            maxLength={4} value={c.cvv} onChange={e=>setC({...c,cvv:e.target.value.replace(/\D/g,'')})} required/>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Nom sur la carte</label>
        <input type="text" className="form-input" placeholder="TEL QU'IL FIGURE SUR LA CARTE"
          value={c.nom} onChange={e=>setC({...c,nom:e.target.value.toUpperCase()})}
          style={{textTransform:'uppercase'}} required/>
      </div>
      <div className="carte-secure"><FontAwesomeIcon icon={faLock} /> Paiement simulé, données non conservées</div>
      {error && <div className="alert alert-danger">{error}</div>}
      <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
        style={{marginTop:'var(--space-lg)'}}>
        {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Validation...</> : <><FontAwesomeIcon icon={faLock} /> Valider le paiement par carte</>}
      </button>
    </form>
  );
}

export default function Booking() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [horaire, setHoraire]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [step, setStep]         = useState(1);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [modePaie, setModePaie] = useState('');
  const [resa, setResa]         = useState(null);
  const [refRecu, setRefRecu]   = useState('');    // référence envoyée par email
  const [refSaisie, setRefSaisie] = useState('');  // saisie par le client
  const [emailDest, setEmailDest] = useState('');
  const [confirmation, setConf] = useState(null);

  useEffect(() => {
    horairesAPI.getById(id)
      .then(r => setHoraire(r.data.data))
      .catch(() => setError('Trajet introuvable.'))
      .finally(() => setLoading(false));
  }, [id]);

  const prix = horaire ? parseInt(horaire.prix).toLocaleString('fr-FR') + ' FCFA' : '';
  const modeInfo = MODES.find(m => m.id === modePaie);

  // Étape 2 → créer réservation
  const handleChoixMode = async () => {
    if (!modePaie) { setError('Choisissez un mode de paiement.'); return; }
    setSaving(true); setError('');
    try {
      const res = await reservationsAPI.create({ id_horaire: parseInt(id), mode_paiement: modePaie });
      setResa(res.data.data);
      setStep(3);
    } catch(e) { setError(e.response?.data?.message || 'Erreur.'); }
    finally { setSaving(false); }
  };

  // Étape 3 → simuler paiement (+ validation carte si besoin)
  const handleSimuler = async (carteData = null) => {
    setSaving(true); setError('');
    try {
      const payload = { id_reservation: resa.id_reservation, ...(carteData || {}) };
      const res = await reservationsAPI.simuler(payload);
      const d   = res.data.data;
      setRefRecu(d.reference);
      setEmailDest(d.email);
      setStep(4);
    } catch(e) { setError(e.response?.data?.message || 'Erreur.'); }
    finally { setSaving(false); }
  };

  // Étape 4 → valider référence
  const handleValider = async () => {
    if (!refSaisie.trim()) { setError('Saisissez la référence reçue par email.'); return; }
    setSaving(true); setError('');
    try {
      const res = await reservationsAPI.payer({
        id_reservation: resa.id_reservation,
        reference_paiement: refSaisie.trim().toUpperCase(),
      });
      setConf(res.data.data);
      setStep(5);
    } catch(e) { setError(e.response?.data?.message || 'Référence incorrecte.'); }
    finally { setSaving(false); }
  };

  const handleExpire = () => {
    setError('⏰ Délai expiré. Recommencez.');
    setStep(1); setResa(null);
  };

  const STEPS_LABELS = ['Détails','Paiement','Simuler','Valider','Reçu'];

  if (loading) return <div className="bk-page"><div className="loader"><div className="spinner"/></div></div>;

  return (
    <div className="bk-page">
      <div className="container">

        {/* ── Barre de progression ── */}
        <div className="bk-progress">
          {/* Ligne de fond */}
          <div className="bk-track">
            <div
              className="bk-track-fill"
              style={{ width: `${((step - 1) / (STEPS_LABELS.length - 1)) * 100}%` }}
            />
          </div>

          {STEPS_LABELS.map((lbl, i) => {
            const n    = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className={`bk-prog-item${done ? ' done' : ''}${active ? ' active' : ''}`}>
                <div className="bk-prog-circle">
                  {done
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : n
                  }
                </div>
                <span className="bk-prog-label">{lbl}</span>
              </div>
            );
          })}
        </div>

        <div className="bk-layout">
          {/* ── Colonne principale ── */}
          <div className="bk-main">

            {/* ─ 1 : Détails du trajet ─ */}
            {step === 1 && horaire && (
              <div className="bk-card">
                <h2 className="bk-card-title">Récapitulatif du trajet</h2>

                <div className="bk-route">
                  <div className="bk-city">
                    <div className="bk-city-time">
                      {new Date(horaire.date_depart).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                    <div className="bk-city-name">{horaire.ville_depart}</div>
                    <div className="bk-city-tag">Départ</div>
                  </div>
                  <div className="bk-route-mid">
                    <div className="bk-route-icon"><FontAwesomeIcon icon={faBus} /></div>
                    <div className="bk-route-dist">{horaire.distance_km} km</div>
                  </div>
                  <div className="bk-city bk-city-right">
                    <div className="bk-city-time bk-time-dim">-</div>
                    <div className="bk-city-name">{horaire.ville_arrivee}</div>
                    <div className="bk-city-tag">Arrivée</div>
                  </div>
                </div>

                <div className="bk-info-list">
                  {[
                    ['Date de départ', new Date(horaire.date_depart).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})],
                    ['Heure de départ', new Date(horaire.date_depart).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})],
                    ['Numéro de bus', horaire.numero_bus],
                    ['Chauffeur', horaire.chauffeur || 'Non renseigné'],
                    ['Places disponibles', `${horaire.places_disponibles} / ${horaire.capacite}`],
                  ].map(([l,v],i) => (
                    <div key={i} className="bk-info-row">
                      <span className="bk-info-label">{l}</span>
                      <span className="bk-info-val">{v}</span>
                    </div>
                  ))}
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <button className="btn btn-primary btn-full btn-lg"
                  onClick={() => { setError(''); setStep(2); }}>
                  Choisir le mode de paiement →
                </button>
              </div>
            )}

            {/* ─ 2 : Mode de paiement ─ */}
            {step === 2 && (
              <div className="bk-card">
                <h2 className="bk-card-title">Mode de paiement</h2>
                <p className="bk-subtitle">Comment souhaitez-vous régler <strong>{prix}</strong> ?</p>

                <div className="bk-modes">
                  {MODES.map(m => (
                    <label key={m.id} className={`bk-mode ${modePaie===m.id?'bk-mode-sel':''}`}>
                      <input type="radio" name="mode" hidden
                        checked={modePaie===m.id} onChange={() => { setModePaie(m.id); setError(''); }}/>
                      <div className="bk-mode-icon" style={{background:m.color+'20', color:m.color}}>
                        <FontAwesomeIcon icon={m.faIcon} style={{fontSize:'1.3rem'}} />
                      </div>
                      <div className="bk-mode-text">
                        <div className="bk-mode-label">{m.label}</div>
                        <div className="bk-mode-desc">{m.desc}</div>
                      </div>
                      <div className="bk-mode-check">{modePaie===m.id?'●':'○'}</div>
                    </label>
                  ))}
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="bk-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}><FontAwesomeIcon icon={faChevronLeft} /> Retour</button>
                  <button className="btn btn-primary btn-lg" onClick={handleChoixMode}
                    disabled={saving || !modePaie}>
                    {saving ? <><FontAwesomeIcon icon={faSpinner} spin /></> : <>Continuer <FontAwesomeIcon icon={faArrowRight} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ─ 3 : Instructions + simuler paiement ─ */}
            {step === 3 && resa && (
              <div className="bk-card">
                <h2 className="bk-card-title">
                  {modePaie === 'Carte Bancaire' ? 'Informations de carte' :
                   modePaie === 'Cash' ? 'Paiement en espèces' :
                   `Paiement ${modePaie}`}
                </h2>

                <div className="bk-timer-bar">
                  <span>Place réservée, temps restant :</span>
                  <Countdown expireAt={resa.expire_le} onExpire={handleExpire}/>
                </div>

                {/* Carte bancaire → formulaire */}
                {modePaie === 'Carte Bancaire' && (
                  <CarteForm onSubmit={handleSimuler} loading={saving} error={error}/>
                )}

                {/* Mixx By Yas ou Flooz → instructions visuelles */}
                {(modePaie === 'Mixx By Yas' || modePaie === 'Flooz') && (
                  <>
                    <div className="bk-mobile-instructions" style={{borderColor: modeInfo?.color}}>
                      <div className="bk-mi-header" style={{background: modeInfo?.color}}>
                        <span style={{fontSize:'1.8rem'}}>{modeInfo?.icon}</span>
                        <div>
                          <div className="bk-mi-title">{modeInfo?.label}</div>
                          <div className="bk-mi-sub">{modeInfo?.desc}</div>
                        </div>
                      </div>
                      <div className="bk-mi-steps">
                        <div className="bk-mi-step"><span className="bk-mi-n">1</span>
                          Composez <strong className="bk-ussd">{modeInfo?.ussd}</strong>
                        </div>
                        <div className="bk-mi-step"><span className="bk-mi-n">2</span>
                          Sélectionnez <strong>Paiement marchand</strong>
                        </div>
                        <div className="bk-mi-step"><span className="bk-mi-n">3</span>
                          Code marchand :
                          <div className="bk-marchand">{modeInfo?.marchand}</div>
                        </div>
                        <div className="bk-mi-step"><span className="bk-mi-n">4</span>
                          Montant : <strong className="bk-prix">{prix}</strong>
                        </div>
                        <div className="bk-mi-step"><span className="bk-mi-n">5</span>
                          Confirmez avec votre PIN
                        </div>
                      </div>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="bk-actions">
                      <button className="btn btn-ghost" onClick={() => setStep(2)}><FontAwesomeIcon icon={faChevronLeft} /> Retour</button>
                      <button className="btn btn-primary btn-lg" onClick={() => handleSimuler()} disabled={saving}>
                        {saving ? <><FontAwesomeIcon icon={faSpinner} spin /> Envoi...</> : <><FontAwesomeIcon icon={faEnvelope} /> J'ai payé, recevoir ma référence</>}
                      </button>
                    </div>
                  </>
                )}

                {/* Cash → instructions agence */}
                {modePaie === 'Cash' && (
                  <>
                    <div className="bk-cash-box">
                      <div className="bk-cash-icon">🏢</div>
                      <h3>Rendez-vous à l'agence MiabeTrans</h3>
                      <p>Votre place est temporairement réservée. Vous devez vous présenter en agence, payer, puis valider votre réservation en entrant la référence qui vous sera envoyée.</p>
                      <div className="bk-cash-steps">
                        {['Notez votre numéro de réservation',
                          'Rendez-vous Boulevard du Mono, Lomé',
                          'Payez ' + prix + ' au caissier',
                          'Revenez ici et entrez la référence reçue par email'].map((s,i) => (
                          <div key={i} className="bk-cash-step">
                            <span className="bk-cash-n">{i+1}</span> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="bk-actions">
                      <button className="btn btn-ghost" onClick={() => setStep(2)}><FontAwesomeIcon icon={faChevronLeft} /> Retour</button>
                      <button className="btn btn-primary btn-lg" onClick={() => handleSimuler()} disabled={saving}>
                        {saving ? <><FontAwesomeIcon icon={faSpinner} spin /></> : <><FontAwesomeIcon icon={faEnvelope} /> Recevoir mes instructions par email</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─ 4 : Saisie référence ─ */}
            {step === 4 && resa && (
              <div className="bk-card">
                <h2 className="bk-card-title">Entrez votre référence de paiement</h2>

                <div className="bk-timer-bar">
                  <span>Temps restant :</span>
                  <Countdown expireAt={resa.expire_le} onExpire={handleExpire}/>
                </div>

                <div className="bk-email-notice">
                  <span style={{fontSize:'1.8rem', color:'var(--primary)'}}><FontAwesomeIcon icon={faEnvelope} /></span>
                  <div>
                    <div className="bk-en-title">Email envoyé !</div>
                    <div className="bk-en-sub">
                      Consultez votre boîte <strong>{emailDest}</strong><br/>
                      Copiez la référence et collez-la ci-dessous.
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Référence de paiement *</label>
                  <input type="text" className="form-input bk-ref-input"
                    placeholder="Ex: YAS-A3F8C291-07042026"
                    value={refSaisie}
                    onChange={e => { setRefSaisie(e.target.value.toUpperCase()); setError(''); }}
                    autoFocus/>
                  <p className="bk-ref-hint">
                    La référence ressemble à <code>XXX-XXXXXXXX-DDMMYYYY</code>
                  </p>
                </div>

                <button className="btn btn-ghost btn-sm"
                  onClick={() => { handleSimuler(); setRefSaisie(''); }}>
                  🔄 Renvoyer l'email
                </button>

                {error && <div className="alert alert-danger" style={{marginTop:'var(--space-md)'}}>{error}</div>}

                <div className="bk-actions">
                  <button className="btn btn-ghost" onClick={() => setStep(3)}><FontAwesomeIcon icon={faChevronLeft} /> Retour</button>
                  <button className="btn btn-accent btn-lg" onClick={handleValider}
                    disabled={saving || refSaisie.length < 8}>
                    {saving ? <><FontAwesomeIcon icon={faSpinner} spin /> Validation...</> : <><FontAwesomeIcon icon={faCheck} /> Valider et obtenir mon reçu</>}
                  </button>
                </div>
              </div>
            )}

            {/* ─ 5 : Succès ─ */}
            {step === 5 && (
              <div className="bk-card bk-success">
                <div className="bk-success-icon"><FontAwesomeIcon icon={faCircleCheck} style={{color:'var(--success)'}} /></div>
                <h2>Réservation confirmée !</h2>
                <p>Votre paiement a été validé. Votre billet est émis.</p>

                <div className="bk-success-num">
                  <span>Numéro de réservation</span>
                  <strong>{confirmation?.numero_recu || `MT-${String(resa?.id_reservation).padStart(6,'0')}`}</strong>
                </div>

                <div className="bk-success-email">
                  <span>📧</span>
                  <span>Reçu envoyé à <strong>{user?.email}</strong></span>
                </div>

                <div className="bk-success-actions">
                  <button className="btn btn-primary btn-lg btn-full"
                    onClick={() => navigate(`/confirmation/${resa?.id_reservation}`)}>
                    📄 Voir, imprimer ou télécharger le reçu
                  </button>
                  <button className="btn btn-outline btn-full"
                    onClick={() => navigate('/history')}>
                    📋 Mes réservations
                  </button>
                  <button className="btn btn-ghost btn-sm btn-full"
                    onClick={() => navigate('/')}>Retour à l'accueil</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Résumé latéral ── */}
          {horaire && step < 5 && (
            <div className="bk-sidebar">
              <div className="bk-summary">
                <h3 className="bk-sum-title">Récapitulatif</h3>
                <div className="bk-sum-route">
                  <div className="bk-sum-city">{horaire.ville_depart}</div>
                  <div className="bk-sum-arrow"><FontAwesomeIcon icon={faBus} /></div>
                  <div className="bk-sum-city">{horaire.ville_arrivee}</div>
                </div>
                <div className="bk-sum-rows">
                  {[
                    ['Date',    new Date(horaire.date_depart).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})],
                    ['Heure',   new Date(horaire.date_depart).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})],
                    ['Bus',     horaire.numero_bus],
                    ...(modePaie ? [['Mode', modePaie]] : []),
                  ].map(([l,v],i) => (
                    <div key={i} className="bk-sum-row">
                      <span>{l}</span><strong>{v}</strong>
                    </div>
                  ))}
                </div>
                <div className="bk-sum-total">
                  <span>Total</span>
                  <strong>{prix}</strong>
                </div>
                <div className="bk-sum-user"><FontAwesomeIcon icon={faUser} /> {user?.prenom} {user?.nom}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
