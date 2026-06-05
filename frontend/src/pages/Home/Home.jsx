import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBus, faMobileScreen, faLock, faClock,
  faShieldHalved, faHeadset, faArrowRight,
  faLocationDot, faCalendarDays, faMagnifyingGlass,
  faArrowsLeftRight, faStar, faChevronRight, faChevronLeft, faCheck,
  faUserPlus, faMagnifyingGlassLocation, faCreditCard,
  faTicket, faCircleCheck, faPhone, faEnvelope,
  faChevronDown, faMobile, faMoneyBill,
  faRoute, faUsers, faCalendarCheck, faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';
import './Home.css';

const HERO_WORDS = ['sérénité', 'confiance', 'ponctualité', 'confort', 'sécurité'];

function AnimatedWord() {
  const [index, setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % HERO_WORDS.length);
        setVisible(true);          // Fade in avec le nouveau mot
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`hero-accent hero-word-anim${visible ? ' visible' : ''}`}>
      {HERO_WORDS[index]}
    </span>
  );
}

const STATS = [
  { value: '10+',   label: 'Villes desservies',   icon: faRoute },
  { value: '50+',   label: 'Trajets par semaine',  icon: faBus },
  { value: '5000+', label: 'Voyageurs satisfaits', icon: faUsers },
  { value: '98%',   label: 'Taux de ponctualité',  icon: faCalendarCheck },
];

const POPULAR_ROUTES = [
  { label: 'Lomé → Kpalimé',  depart: 'Lomé', arrivee: 'Kpalimé' },
  { label: 'Lomé → Atakpamé', depart: 'Lomé', arrivee: 'Atakpamé' },
  { label: 'Lomé → Sokodé',   depart: 'Lomé', arrivee: 'Sokodé' },
  { label: 'Lomé → Kara',     depart: 'Lomé', arrivee: 'Kara' },
  { label: 'Lomé → Dapaong',  depart: 'Lomé', arrivee: 'Dapaong' },
];

const SERVICES = [
  { color: '#1B4332', bg: '#ECFDF5', icon: faBus,          num: '01', title: 'Confort Premium',      desc: 'Bus climatisés avec sièges ergonomiques pour un voyage agréable sur toutes nos liaisons.' },
  { color: '#2563EB', bg: '#EFF6FF', icon: faMobileScreen,  num: '02', title: 'Réservation en ligne', desc: "Réservez votre place en quelques clics depuis n'importe où, 24h/24 et 7j/7." },
  { color: '#D97706', bg: '#FFFBEB', icon: faLock,          num: '03', title: 'Paiement sécurisé',    desc: 'Mixx By Yas, Moov Money, MobileMoney, transactions chiffrées et sécurisées.' },
  { color: '#059669', bg: '#ECFDF5', icon: faClock,         num: '04', title: 'Ponctualité garantie', desc: "Départs à l'heure avec suivi en temps réel de vos trajets interurbains." },
  { color: '#7C3AED', bg: '#F5F3FF', icon: faShieldHalved,  num: '05', title: 'Sécurité maximale',    desc: 'Chauffeurs professionnels certifiés et véhicules régulièrement contrôlés.' },
  { color: '#DC2626', bg: '#FEF2F2', icon: faHeadset,       num: '06', title: 'Support 24/7',         desc: 'Notre équipe est disponible à tout moment pour vous assister.' },
];

const renderStars = (rating) =>
  Array.from({ length: 5 }, (_, i) => (
    <FontAwesomeIcon
      key={i}
      icon={i < rating ? faStar : faStarEmpty}
      className={`star${i >= rating ? ' empty' : ''}`}
    />
  ));

const DESTINATIONS = [
  {
    city: 'Kpalimé',
    desc: 'La ville des cascades',
    duration: '2h30',
    price: '2 500',
    image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&q=80',
  },
  {
    city: 'Atakpamé',
    desc: 'Carrefour du centre',
    duration: '3h00',
    price: '3 000',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80',
  },
  {
    city: 'Sokodé',
    desc: 'Cœur du Togo',
    duration: '5h00',
    price: '5 500',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&q=80',
  },
  {
    city: 'Kara',
    desc: 'Porte du nord',
    duration: '6h30',
    price: '6 500',
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400&q=80',
  },
  {
    city: 'Dapaong',
    desc: 'Extrême nord',
    duration: '10h00',
    price: '9 000',
    image: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=400&q=80',
  },
  {
    city: 'Tsévié',
    desc: 'Proche banlieue',
    duration: '45min',
    price: '1 000',
    image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=80',
  },
];

const TESTIMONIALS = [
  {
    name: 'Kossi Attivor',
    role: 'Client régulier',
    text: 'MiabeTrans a complètement changé ma façon de voyager. La réservation en ligne est simple et les bus sont toujours à l\'heure !',
    rating: 5,
    avatar: 'K',
  },
  {
    name: 'Afi Mensah',
    role: 'Commerçante',
    text: 'Je voyage chaque semaine entre Lomé et Atakpamé. MiabeTrans est ma première choice pour le confort et la sécurité.',
    rating: 5,
    avatar: 'A',
  },
  {
    name: 'Yao Dossou',
    role: 'Étudiant',
    text: 'Les prix sont très abordables et le service client est excellent. Je recommande vivement MiabeTrans à tous !',
    rating: 4,
    avatar: 'Y',
  },
];

const HOW_STEPS = [
  {
    num: '01', icon: faUserPlus, color: '#1B4332', bg: '#ECFDF5',
    title: 'Créez votre compte',
    desc: 'Inscription gratuite en 2 minutes. Renseignez votre nom, email et téléphone. C\'est tout !',
    tip: 'Déjà inscrit ? Connectez-vous directement.',
  },
  {
    num: '02', icon: faMagnifyingGlassLocation, color: '#2563EB', bg: '#EFF6FF',
    title: 'Choisissez votre trajet',
    desc: 'Saisissez votre ville de départ, d\'arrivée et la date souhaitée. Comparez les horaires et les prix.',
    tip: 'Disponible 24h/24, 7j/7.',
  },
  {
    num: '03', icon: faCreditCard, color: '#D97706', bg: '#FFFBEB',
    title: 'Payez en toute sécurité',
    desc: 'Réglez via Mixx By Yas, Moov Money ou MobileMoney depuis votre téléphone. Paiement instantané et sécurisé.',
    tip: 'Aucune commission cachée.',
  },
  {
    num: '04', icon: faTicket, color: '#7C3AED', bg: '#F5F3FF',
    title: 'Montez dans le bus !',
    desc: 'Recevez votre reçu par email avec QR code. Présentez-le à l\'embarquement et profitez du voyage.',
    tip: 'Sur papier ou sur écran.',
  },
];

const FAQS = [
  {
    q: 'Comment réserver un billet en ligne ?',
    a: 'Créez un compte, cherchez votre trajet dans la barre de recherche, choisissez un horaire disponible et payez via Mixx By Yas, Moov Money ou MobileMoney. Vous recevrez un reçu par email immédiatement.',
  },
  {
    q: 'Quels modes de paiement sont acceptés ?',
    a: 'Nous acceptons Mixx By Yas (Togocom), Moov Money et tout service MobileMoney disponible au Togo. Le paiement s\'effectue depuis votre téléphone en quelques secondes.',
  },
  {
    q: 'Puis-je annuler ou modifier ma réservation ?',
    a: 'Vous pouvez annuler votre réservation depuis votre espace "Mes réservations" avant le départ. Contactez notre support au +228 90 00 00 01 pour toute modification urgente.',
  },
  {
    q: 'Que faire si je rate mon bus ?',
    a: 'Contactez-nous immédiatement au +228 90 00 00 01 ou via WhatsApp. Notre équipe fera tout son possible pour vous placer sur le prochain départ disponible.',
  },
  {
    q: 'Les billets sont-ils nominatifs ?',
    a: 'Oui, chaque billet est nominatif et lié à votre compte. Munissez-vous d\'une pièce d\'identité à l\'embarquement. Le QR code de votre reçu suffit pour monter à bord.',
  },
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Carousel({ items, renderItem, perView = 3, autoPlayMs = 0, className = '' }) {
  const pages      = chunk(items, perView);
  const total      = pages.length;
  const [idx, setIdx] = useState(0);
  const timerRef   = useRef(null);

  const goTo = useCallback((i) => setIdx(((i % total) + total) % total), [total]);
  const prev = () => goTo(idx - 1);
  const next = useCallback(() => goTo(idx + 1), [idx, goTo]);

  useEffect(() => {
    if (!autoPlayMs) return;
    timerRef.current = setInterval(next, autoPlayMs);
    return () => clearInterval(timerRef.current);
  }, [next, autoPlayMs]);

  const pause  = () => clearInterval(timerRef.current);
  const resume = () => { if (autoPlayMs) timerRef.current = setInterval(next, autoPlayMs); };

  return (
    <div className={`carousel ${className}`} onMouseEnter={pause} onMouseLeave={resume}>
      <div className="carousel-viewport">
        <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {pages.map((group, gi) => (
            <div key={gi} className="carousel-slide">
              {group.map((item, ii) => renderItem(item, gi * perView + ii))}
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-controls">
        <button className="carousel-btn" onClick={prev} aria-label="Précédent">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <div className="carousel-dots">
          {pages.map((_, i) => (
            <button key={i} className={`carousel-dot${i === idx ? ' active' : ''}`} onClick={() => goTo(i)} aria-label={`Page ${i + 1}`} />
          ))}
        </div>
        <button className="carousel-btn" onClick={next} aria-label="Suivant">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}

function HomeFaqItem({ faq, open, onToggle }) {
  const bodyRef = useRef(null);
  return (
    <div className={`faq-home-item ${open ? 'open' : ''}`} onClick={onToggle}>
      <div className="faq-home-q">
        <span>{faq.q}</span>
        <span className="faq-home-chevron"><FontAwesomeIcon icon={faChevronDown} /></span>
      </div>
      <div
        className="faq-home-answer-wrap"
        ref={bodyRef}
        style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 300) + 'px' : '0' }}
      >
        <div className="faq-home-a">{faq.a}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate  = useNavigate();
  const [form, setForm] = useState({ depart: '', arrivee: '', date: '' });
  const [openFaq, setOpenFaq] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!form.depart || !form.arrivee) return;
    navigate(`/search?depart=${form.depart}&arrivee=${form.arrivee}&date=${form.date}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="home">

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=90"
            alt="Bus MiabeTrans"
            className="hero-img"
          />
          <div className="hero-overlay" />
        </div>

        <div className="container hero-content">
          <div className="hero-badge">🇹🇬 Transport interurbain au Togo</div>
          <h1 className="hero-title">
            Voyagez avec MiabeTrans<br />
            en toute <AnimatedWord />
          </h1>
          <p className="hero-subtitle">
            Réservez vos billets en ligne pour tous vos voyages interurbains.
            Confort, sécurité et ponctualité garantis.
          </p>

          {/* Formulaire de recherche */}
          <div className="hero-search-card">
            <h3 className="search-card-title">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              Rechercher un trajet
            </h3>
            <form className="hero-search-form" onSubmit={handleSearch}>
              <div className="search-field">
                <label>Ville de départ</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Lomé"
                    value={form.depart}
                    onChange={e => setForm({...form, depart: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="search-swap" onClick={() =>
                setForm({ ...form, depart: form.arrivee, arrivee: form.depart })
              }>
                <FontAwesomeIcon icon={faArrowsLeftRight} />
              </div>

              <div className="search-field">
                <label>Ville d'arrivée</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Kara"
                    value={form.arrivee}
                    onChange={e => setForm({...form, arrivee: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="search-field">
                <label>Date de départ</label>
                <div className="input-icon-wrapper">
                  <span className="input-icon">
                    <FontAwesomeIcon icon={faCalendarDays} />
                  </span>
                  <input
                    type="date"
                    className="form-input"
                    min={today}
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-accent btn-lg search-btn">
                Rechercher
              </button>
            </form>
            <div className="hero-popular">
              <span className="hero-popular-label">Trajets populaires :</span>
              {POPULAR_ROUTES.map((r, i) => (
                <button
                  key={i}
                  className="hero-popular-chip"
                  type="button"
                  onClick={() => navigate(`/search?depart=${r.depart}&arrivee=${r.arrivee}`)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-icon"><FontAwesomeIcon icon={s.icon} /></div>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DESTINATIONS ===== */}
      <section className="section destinations-section">
        <div className="container">
          <div className="text-center">
            <p className="section-eyebrow">Nos liaisons</p>
            <h2 className="section-title">Destinations populaires</h2>
            <p className="section-subtitle">
              Découvrez toutes nos liaisons interurbaines depuis Lomé
            </p>
          </div>

          <Carousel
            items={DESTINATIONS}
            perView={3}
            autoPlayMs={4500}
            className="destinations-carousel"
            renderItem={(d, i) => (
              <div
                key={i}
                className="destination-card"
                onClick={() => navigate(`/search?depart=Lomé&arrivee=${d.city}`)}
              >
                <div className="destination-img-wrapper">
                  <img src={d.image} alt={d.city} className="destination-img" loading="lazy" />
                  <div className="destination-overlay" />
                  <div className="destination-price">À partir de {d.price} FCFA</div>
                  <div className="destination-hover-cta">
                    <span><FontAwesomeIcon icon={faBus} /> Réserver ce trajet</span>
                  </div>
                </div>
                <div className="destination-body">
                  <h3 className="destination-city">{d.city}</h3>
                  <p className="destination-desc">{d.desc}</p>
                  <div className="destination-meta">
                    <span className="destination-duration">
                      <FontAwesomeIcon icon={faClock} style={{marginRight:4}} />{d.duration}
                    </span>
                    <span className="destination-cta">
                      Voir <FontAwesomeIcon icon={faChevronRight} style={{fontSize:'0.7rem'}} />
                    </span>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section className="section how-section">
        <div className="container">
          <div className="text-center">
            <p className="section-eyebrow">Simple comme bonjour</p>
            <h2 className="section-title">Comment réserver votre billet ?</h2>
            <p className="section-subtitle">
              De l'inscription à l'embarquement, tout se passe en ligne en moins de 5 minutes.
            </p>
          </div>
          <div className="how-grid">
            {HOW_STEPS.map((s, i) => (
              <div key={i} className="how-card" style={{'--how-color': s.color, '--how-bg': s.bg}}>
                <div className="how-card-top">
                  <div className="how-icon" style={{background: s.bg, color: s.color}}>
                    <FontAwesomeIcon icon={s.icon} />
                  </div>
                  <span className="how-num">{s.num}</span>
                </div>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-desc">{s.desc}</p>
                <div className="how-tip">
                  <FontAwesomeIcon icon={faCircleCheck} style={{color: s.color, marginRight: 6}} />
                  {s.tip}
                </div>
                {i < HOW_STEPS.length - 1 && (
                  <div className="how-connector">
                    <FontAwesomeIcon icon={faArrowRight} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="how-cta text-center">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
              <FontAwesomeIcon icon={faUserPlus} /> Commencer maintenant, c'est gratuit
            </button>
          </div>
        </div>
      </section>

      {/* ===== PAIEMENTS ACCEPTÉS ===== */}
      <section className="payment-section">
        <div className="container">
          <div className="payment-inner">
            <div className="payment-left">
              <p className="section-eyebrow">Paiement mobile</p>
              <h2 className="payment-title">Payez avec votre téléphone</h2>
              <p className="payment-desc">
                MiabeTrans accepte les principaux opérateurs de mobile money au Togo.
                Aucune carte bancaire requise, réglez directement depuis votre téléphone.
              </p>
              <div className="payment-methods">
                <div className="pay-method">
                  <div className="pay-icon" style={{background:'#FF6B0020', color:'#FF6B00'}}>
                    <FontAwesomeIcon icon={faMobile} />
                  </div>
                  <div>
                    <strong>Mixx By Yas</strong>
                    <span>Mobile Money Togocom, composez *144#</span>
                  </div>
                </div>
                <div className="pay-method">
                  <div className="pay-icon" style={{background:'#0070C020', color:'#0070C0'}}>
                    <FontAwesomeIcon icon={faMobile} />
                  </div>
                  <div>
                    <strong>Moov Money</strong>
                    <span>Mobile Money Moov Africa, composez *155#</span>
                  </div>
                </div>
                <div className="pay-method">
                  <div className="pay-icon" style={{background:'#10B98120', color:'#10B981'}}>
                    <FontAwesomeIcon icon={faMoneyBill} />
                  </div>
                  <div>
                    <strong>Espèces en agence</strong>
                    <span>Paiement à notre guichet à Lomé</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="payment-right">
              <div className="payment-guarantee">
                <div className="pg-icon"><FontAwesomeIcon icon={faLock} /></div>
                <h3>Paiement 100% sécurisé</h3>
                <p>Toutes les transactions sont chiffrées et protégées. Vous recevez une confirmation immédiate par email à chaque paiement.</p>
                <ul className="pg-list">
                  <li><FontAwesomeIcon icon={faCheck} /> Confirmation email instantanée</li>
                  <li><FontAwesomeIcon icon={faCheck} /> Reçu PDF téléchargeable</li>
                  <li><FontAwesomeIcon icon={faCheck} /> Aucun frais caché</li>
                  <li><FontAwesomeIcon icon={faCheck} /> Remboursement en cas d'annulation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="section services-section">
        <div className="container">

          {/* En-tête */}
          <div className="services-header">
            <div>
              <p className="section-eyebrow">Pourquoi nous choisir</p>
              <h2 className="section-title" style={{marginBottom:0}}>Nos engagements</h2>
            </div>
            <p className="services-header-sub">
              MiabeTrans s'engage à vous offrir<br/>la meilleure expérience de voyage.
            </p>
          </div>

          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div
                key={i}
                className="service-card"
                style={{ '--svc-color': s.color, '--svc-bg': s.bg }}
              >
                <div className="service-card-top">
                  <div className="service-icon-wrap" style={{ background: s.bg, color: s.color }}>
                    <FontAwesomeIcon icon={s.icon} style={{ fontSize: '1.3rem' }} />
                  </div>
                  <span className="service-num">{s.num}</span>
                </div>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-desc">{s.desc}</p>
                <div className="service-arrow">
                  <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.9rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Prêt pour votre prochain voyage ?</h2>
              <p>Inscrivez-vous gratuitement et réservez vos billets en quelques secondes.</p>
            </div>
            <div className="cta-actions">
              <button className="btn btn-accent btn-lg" onClick={() => navigate('/register')}>
                Créer un compte gratuit
              </button>
              <button className="btn btn-outline-white btn-lg" onClick={() => navigate('/search')}>
                Voir les trajets
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ RAPIDE ===== */}
      <section className="section faq-home-section">
        <div className="container">
          <div className="faq-home-inner">
            <div className="faq-home-left">
              <p className="section-eyebrow">Questions fréquentes</p>
              <h2 className="section-title" style={{marginBottom: 'var(--space-4)'}}>
                Tout ce que vous devez savoir
              </h2>
              <p style={{color:'var(--gray-500)', marginBottom:'var(--space-8)', lineHeight:1.7}}>
                Vous avez une question ? Retrouvez ici les réponses aux questions les plus posées par nos voyageurs.
              </p>
              <div style={{display:'flex', flexDirection:'column', gap:'var(--space-3)'}}>
                <a href="tel:+22890000001" className="faq-contact-btn">
                  <div className="faq-contact-icon"><FontAwesomeIcon icon={faPhone} /></div>
                  <div>
                    <strong>Appelez-nous</strong>
                    <span>+228 90 00 00 01, Lun–Sam 6h–20h</span>
                  </div>
                </a>
                <a href="mailto:contact@miabetrans.tg" className="faq-contact-btn">
                  <div className="faq-contact-icon"><FontAwesomeIcon icon={faEnvelope} /></div>
                  <div>
                    <strong>Écrivez-nous</strong>
                    <span>contact@miabetrans.tg</span>
                  </div>
                </a>
              </div>
              <button
                className="btn btn-outline btn-lg"
                style={{marginTop:'var(--space-6)', width:'100%'}}
                onClick={() => navigate('/faq')}
              >
                Voir toutes les questions <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
            <div className="faq-home-right">
              {FAQS.map((faq, i) => (
                <HomeFaqItem
                  key={i}
                  faq={faq}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TÉMOIGNAGES ===== */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="text-center">
            <p className="section-eyebrow">Ce que disent nos clients</p>
            <h2 className="section-title">Témoignages</h2>
          </div>
          <Carousel
            items={TESTIMONIALS}
            perView={1}
            autoPlayMs={5500}
            className="testimonials-carousel"
            renderItem={(t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-top">
                  <div className="testimonial-stars">{renderStars(t.rating)}</div>
                  <div className="testimonial-quote-icon">
                    <FontAwesomeIcon icon={faQuoteLeft} />
                  </div>
                </div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </section>

    </main>
  );
}
