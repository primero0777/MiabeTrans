import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot, faPhone, faEnvelope, faClock,
  faCommentDots, faCheck, faPaperPlane, faChevronRight,
  faHeadset, faCircleCheck, faTicket,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import './Contact.css';

const CONTACT_CARDS = [
  {
    icon: faPhone,
    color: '#1B4332', bg: '#ECFDF5',
    label: 'Téléphone',
    value: '+228 90 00 00 01',
    sub: 'Lun–Sam · 6h00 – 20h00',
    badge: 'Appel direct',
    href: 'tel:+22890000001',
  },
  {
    icon: faWhatsapp,
    color: '#128C7E', bg: '#F0FDF9',
    label: 'WhatsApp',
    value: '+228 90 00 00 01',
    sub: 'Réponse en moins de 30 min',
    badge: 'Recommandé',
    href: 'https://wa.me/22890000001',
  },
  {
    icon: faEnvelope,
    color: '#2563EB', bg: '#EFF6FF',
    label: 'Email',
    value: 'contact@miabetrans.tg',
    sub: 'Réponse sous 24h ouvrées',
    badge: 'Email',
    href: 'mailto:contact@miabetrans.tg',
  },
  {
    icon: faLocationDot,
    color: '#DC2626', bg: '#FEF2F2',
    label: 'Adresse',
    value: 'Boulevard du Mono, Lomé',
    sub: 'Togo, Afrique de l\'Ouest',
    badge: 'Agence',
    href: null,
  },
  {
    icon: faClock,
    color: '#7C3AED', bg: '#F5F3FF',
    label: 'Horaires',
    value: 'Lun–Sam : 6h00 – 20h00',
    sub: 'Urgences voyage : 7j/7',
    badge: 'Disponible',
    href: null,
  },
];

const SUBJECTS = [
  'Sélectionnez un sujet',
  'Réservation / Billet',
  'Paiement / Remboursement',
  'Problème technique',
  'Réclamation chauffeur',
  'Bagages / Retard',
  'Partenariat commercial',
  'Autre demande',
];

const MAX_MSG = 1000;

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', sujet: '', message: '' });
  const [sent, setSent]  = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.nom.trim())     e.nom = 'Requis';
    if (!form.email.trim())   e.email = 'Requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
    if (!form.sujet || form.sujet === SUBJECTS[0]) e.sujet = 'Choisissez un sujet';
    if (!form.message.trim()) e.message = 'Requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = (e) => {
    e.preventDefault();
    if (validate()) setSent(true);
  };

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="contact-hero-bg" />
        <div className="container contact-hero-inner">
          <div className="contact-hero-badge">
            <span className="contact-hero-dot" />
            Support en ligne · Répond sous 30 min via WhatsApp
          </div>
          <h1>Contactez-nous</h1>
          <p>Une question, une réclamation ou juste besoin d'aide ?<br/>Notre équipe est là pour vous.</p>

          <div className="contact-quick-actions">
            <a href="tel:+22890000001" className="contact-quick-btn contact-quick-call">
              <FontAwesomeIcon icon={faPhone} />
              <div>
                <strong>Appeler maintenant</strong>
                <span>+228 90 00 00 01</span>
              </div>
            </a>
            <a href="https://wa.me/22890000001" target="_blank" rel="noreferrer" className="contact-quick-btn contact-quick-wa">
              <FontAwesomeIcon icon={faWhatsapp} />
              <div>
                <strong>Chat WhatsApp</strong>
                <span>Réponse en 30 min</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="container contact-body">
        <div className="contact-cards-row">
          {CONTACT_CARDS.map((c, i) => (
            <div
              key={i}
              className={`contact-card ${c.href ? 'clickable' : ''}`}
              style={{ '--cc-color': c.color, '--cc-bg': c.bg }}
              onClick={() => c.href && (c.href.startsWith('http') ? window.open(c.href, '_blank') : window.location.assign(c.href))}
            >
              <div className="cc-icon">
                <FontAwesomeIcon icon={c.icon} />
              </div>
              <div className="cc-body">
                <p className="cc-label">{c.label}</p>
                <p className="cc-value">{c.value}</p>
                <p className="cc-sub">{c.sub}</p>
              </div>
              {c.href && <FontAwesomeIcon icon={faChevronRight} className="cc-arrow" />}
            </div>
          ))}
        </div>

        <div className="contact-main">
          <div className="contact-info-col">
            <div className="contact-info-card">
              <h3>Pourquoi nous contacter ?</h3>
              <div className="contact-reasons">
                {[
                  { icon: faTicket,   text: 'Problème avec votre réservation ou votre reçu' },
                  { icon: faHeadset,  text: 'Besoin d\'assistance avant ou pendant le voyage' },
                  { icon: faCommentDots, text: 'Question sur nos tarifs, trajets ou horaires' },
                  { icon: faCircleCheck, text: 'Réclamation ou suggestion d\'amélioration' },
                ].map((r, i) => (
                  <div key={i} className="contact-reason">
                    <div className="cr-icon"><FontAwesomeIcon icon={r.icon} /></div>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="contact-hours-card">
              <h3>Horaires d'ouverture</h3>
              <div className="contact-hours">
                {[
                  { days: 'Lundi – Samedi', hours: '6h00 – 20h00', open: true },
                  { days: 'Dimanche',       hours: 'Urgences uniquement', open: false },
                  { days: 'Jours fériés',   hours: 'Services réduits', open: false },
                ].map((h, i) => (
                  <div key={i} className={`hours-row ${h.open ? 'open' : ''}`}>
                    <span className="hours-days">{h.days}</span>
                    <span className="hours-time">{h.hours}</span>
                  </div>
                ))}
              </div>
              <p className="contact-hours-note">
                Pour les urgences en cours de voyage, le <strong>+228 90 00 00 01</strong> est joignable 7j/7.
              </p>
            </div>
          </div>

          <div className="contact-form-col">
            {sent ? (
              <div className="contact-success">
                <div className="contact-success-icon">
                  <FontAwesomeIcon icon={faCircleCheck} />
                </div>
                <h2>Message envoyé !</h2>
                <p>Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais (généralement sous 24h ouvrées).</p>
                <div className="contact-success-actions">
                  <button className="btn btn-outline" onClick={() => { setSent(false); setForm({ nom:'', email:'', telephone:'', sujet:'', message:'' }); }}>
                    Envoyer un autre message
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate('/')}>
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            ) : (
              <div className="contact-form-card">
                <div className="contact-form-header">
                  <div className="cfh-icon"><FontAwesomeIcon icon={faPaperPlane} /></div>
                  <div>
                    <h2>Envoyer un message</h2>
                    <p>Nous répondons sous 24h ouvrées</p>
                  </div>
                </div>

                <form onSubmit={handle} noValidate>
                  <div className="contact-form-row">
                    <div className={`form-group ${errors.nom ? 'has-error' : ''}`}>
                      <label className="form-label">Nom complet <span className="req">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Kofi Mensah"
                        value={form.nom}
                        onChange={e => set('nom', e.target.value)}
                      />
                      {errors.nom && <span className="form-error">{errors.nom}</span>}
                    </div>
                    <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                      <label className="form-label">Email <span className="req">*</span></label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="kofi@example.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                      />
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="contact-form-row">
                    <div className="form-group">
                      <label className="form-label">Téléphone <span className="optional">(optionnel)</span></label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+228 90 00 00 00"
                        value={form.telephone}
                        onChange={e => set('telephone', e.target.value)}
                      />
                    </div>
                    <div className={`form-group ${errors.sujet ? 'has-error' : ''}`}>
                      <label className="form-label">Sujet <span className="req">*</span></label>
                      <select
                        className="form-input form-select"
                        value={form.sujet}
                        onChange={e => set('sujet', e.target.value)}
                      >
                        {SUBJECTS.map((s, i) => (
                          <option key={i} value={s} disabled={i === 0}>{s}</option>
                        ))}
                      </select>
                      {errors.sujet && <span className="form-error">{errors.sujet}</span>}
                    </div>
                  </div>

                  <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
                    <div className="form-label-row">
                      <label className="form-label">Message <span className="req">*</span></label>
                      <span className={`char-count ${form.message.length > MAX_MSG * 0.9 ? 'warn' : ''}`}>
                        {form.message.length}/{MAX_MSG}
                      </span>
                    </div>
                    <textarea
                      className="form-input form-textarea"
                      rows={5}
                      placeholder="Décrivez votre demande en détail (numéro de réservation, trajet concerné, etc.)..."
                      value={form.message}
                      maxLength={MAX_MSG}
                      onChange={e => set('message', e.target.value)}
                    />
                    {errors.message && <span className="form-error">{errors.message}</span>}
                  </div>

                  <button type="submit" className="btn btn-primary btn-full contact-submit-btn">
                    <FontAwesomeIcon icon={faPaperPlane} /> Envoyer le message
                  </button>

                  <p className="contact-form-note">
                    En soumettant ce formulaire, vous acceptez que vos données soient utilisées pour traiter votre demande.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
