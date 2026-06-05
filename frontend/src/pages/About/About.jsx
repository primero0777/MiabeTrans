import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye, faHeart, faGlobe, faBus, faUsers, faRoute,
  faShieldHalved, faClock, faHeadset, faCheckCircle,
  faArrowRight, faPhone, faEnvelope, faLocationDot,
  faCalendarDays, faStar, faAward, faHandshake,
  faLeaf, faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import './About.css';

const STATS = [
  { value: '2020',   label: 'Année de fondation',   icon: faCalendarDays, color: '#1B4332' },
  { value: '5 000+', label: 'Voyageurs satisfaits',  icon: faUsers,        color: '#2563EB' },
  { value: '10+',    label: 'Villes connectées',     icon: faRoute,        color: '#D97706' },
  { value: '98%',    label: 'Taux de ponctualité',   icon: faStar,         color: '#7C3AED' },
];

const VALUES = [
  {
    icon: faShieldHalved, color: '#1B4332', bg: '#ECFDF5',
    title: 'Sécurité avant tout',
    desc: 'Chauffeurs professionnels certifiés, véhicules contrôlés régulièrement, assurance voyageurs incluse sur tous nos trajets.',
  },
  {
    icon: faClock, color: '#2563EB', bg: '#EFF6FF',
    title: 'Ponctualité garantie',
    desc: 'Chaque départ est planifié à la minute. Nous savons que votre temps est précieux — 98% de nos bus partent à l\'heure.',
  },
  {
    icon: faHeart, color: '#DC2626', bg: '#FEF2F2',
    title: 'Client au centre',
    desc: 'Votre satisfaction est notre priorité absolue. Support disponible 6 jours sur 7, avant, pendant et après votre voyage.',
  },
  {
    icon: faLeaf, color: '#059669', bg: '#ECFDF5',
    title: 'Engagement durable',
    desc: 'Nous optimisons nos routes pour réduire notre empreinte carbone et contribuons activement au développement du Togo.',
  },
  {
    icon: faLightbulb, color: '#D97706', bg: '#FFFBEB',
    title: 'Innovation continue',
    desc: 'Premiers à digitaliser la réservation de bus au Togo, nous investissons sans cesse dans des solutions modernes pour nos voyageurs.',
  },
  {
    icon: faHandshake, color: '#7C3AED', bg: '#F5F3FF',
    title: 'Confiance & transparence',
    desc: 'Prix affichés clairement, aucun frais caché, confirmation immédiate. Ce que vous réservez est exactement ce que vous obtenez.',
  },
];

const TIMELINE = [
  { year: '2020', title: 'Fondation de MiabeTrans', desc: 'Création de l\'entreprise à Lomé avec 3 bus et 2 liaisons : Lomé–Kpalimé et Lomé–Atakpamé.' },
  { year: '2021', title: 'Expansion vers le nord', desc: 'Ouverture de nouvelles liaisons vers Sokodé et Kara. La flotte passe à 8 véhicules.' },
  { year: '2022', title: 'Lancement de la réservation en ligne', desc: 'Première plateforme de réservation de bus en ligne au Togo. Plus de 500 réservations le premier mois.' },
  { year: '2023', title: 'Partenariat mobile money', desc: 'Intégration Mixx By Yas, Moov Money et MobileMoney pour des paiements instantanés depuis le téléphone.' },
  { year: '2024', title: '5 000 voyageurs satisfaits', desc: 'MiabeTrans franchit le cap des 5 000 voyageurs et couvre désormais 10+ villes togolaises.' },
  { year: '2026', title: 'Refonte digitale complète', desc: 'Nouvelle application web responsive, reçus PDF, espace client et tableau de bord admin avancé.' },
];

const TEAM = [
  { initials: 'NK', name: 'NATO Komi Ephraïm', role: 'Fondateur & Développeur', color: '#1B4332' },
  { initials: 'AM', name: 'Afi Mensah',         role: 'Responsable clientèle',  color: '#2563EB' },
  { initials: 'KD', name: 'Kofi Dossou',        role: 'Chef des opérations',    color: '#D97706' },
];

const ENGAGEMENTS = [
  'Remboursement intégral en cas d\'annulation de trajet par MiabeTrans',
  'Bus climatisés sur tous nos trajets, garantis à chaque départ',
  'Confirmation de réservation par email dans les 60 secondes',
  'Support client joignable 6 jours/7 de 6h à 20h',
  'Chauffeurs formés à la conduite sécuritaire et au service client',
  'Prix affiché = prix final, aucun frais supplémentaire à l\'embarquement',
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <div className="about-hero">
        <img
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=85"
          alt="Bus MiabeTrans"
          className="about-hero-img"
        />
        <div className="about-hero-overlay" />
        <div className="container about-hero-content">
          <div className="about-hero-badge">
            <FontAwesomeIcon icon={faBus} /> Transport interurbain · Lomé, Togo
          </div>
          <h1>À propos de MiabeTrans</h1>
          <p>
            Depuis 2020, nous connectons les villes du Togo avec fiabilité,
            confort et innovation. Plus de 5 000 voyageurs nous font confiance.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="about-stats-bar">
        <div className="container">
          <div className="about-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="about-stat-item">
                <div className="about-stat-icon" style={{color: s.color}}>
                  <FontAwesomeIcon icon={s.icon} />
                </div>
                <span className="about-stat-value">{s.value}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container about-body">

        {/* ── Mission & Vision ── */}
        <div className="about-mission-grid">
          <div className="about-mission-card primary">
            <div className="about-mission-icon">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <h2>Notre mission</h2>
            <p>
              Rendre le transport interurbain accessible, fiable et moderne pour tous les Togolais.
              MiabeTrans a été fondée avec une conviction simple : chaque voyageur mérite un service
              digne, ponctuel et sécurisé — quel que soit sa destination.
            </p>
            <p>
              En digitalisant la réservation de bus, nous éliminons les files d'attente,
              les incertitudes de places et les paiements en espèces. Voyager devient aussi
              simple que quelques clics sur votre téléphone.
            </p>
          </div>
          <div className="about-mission-card accent">
            <div className="about-mission-icon">
              <FontAwesomeIcon icon={faGlobe} />
            </div>
            <h2>Notre vision</h2>
            <p>
              Devenir la référence du transport interurbain numérique en Afrique de l'Ouest.
              Nous voulons que chaque ville du Togo — des plus grandes aux plus reculées —
              soit accessible en quelques clics, avec un service de qualité internationale.
            </p>
            <p>
              À terme, MiabeTrans ambitionne de s'étendre aux pays voisins (Bénin, Ghana, Burkina)
              pour créer un réseau de transport régional moderne et connecté.
            </p>
          </div>
        </div>

        {/* ── Nos valeurs ── */}
        <div className="about-section">
          <div className="text-center" style={{marginBottom:'var(--space-10)'}}>
            <p className="about-eyebrow">Ce qui nous guide</p>
            <h2 className="about-section-title">Nos valeurs fondamentales</h2>
            <p className="about-section-sub">
              Chaque décision que nous prenons est guidée par ces principes.
            </p>
          </div>
          <div className="about-values-grid">
            {VALUES.map((v, i) => (
              <div key={i} className="about-value-card" style={{'--val-color': v.color, '--val-bg': v.bg}}>
                <div className="about-value-icon" style={{background: v.bg, color: v.color}}>
                  <FontAwesomeIcon icon={v.icon} />
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Notre histoire ── */}
        <div className="about-section">
          <div style={{marginBottom:'var(--space-8)'}}>
            <p className="about-eyebrow">Notre parcours</p>
            <h2 className="about-section-title">Une histoire de croissance</h2>
          </div>
          <div className="about-timeline">
            {TIMELINE.map((t, i) => (
              <div key={i} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-year">{t.year}</div>
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Nos engagements clients ── */}
        <div className="about-engagements">
          <div className="about-engage-left">
            <p className="about-eyebrow">Ce que nous vous promettons</p>
            <h2 className="about-section-title">Nos engagements envers vous</h2>
            <p className="about-engage-desc">
              Chez MiabeTrans, un engagement n'est pas un slogan — c'est une promesse
              concrète que nous prenons envers chaque voyageur, à chaque trajet.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/search')}>
              Réserver un trajet <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
          <div className="about-engage-right">
            {ENGAGEMENTS.map((e, i) => (
              <div key={i} className="engage-item">
                <div className="engage-check">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                <span>{e}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── L'équipe ── */}
        <div className="about-section">
          <div className="text-center" style={{marginBottom:'var(--space-10)'}}>
            <p className="about-eyebrow">Les visages de MiabeTrans</p>
            <h2 className="about-section-title">Notre équipe</h2>
            <p className="about-section-sub">
              Une équipe passionnée, dédiée à vous offrir la meilleure expérience de transport.
            </p>
          </div>
          <div className="about-team-grid">
            {TEAM.map((m, i) => (
              <div key={i} className="about-team-card">
                <div className="about-team-avatar" style={{background: m.color}}>
                  {m.initials}
                </div>
                <h3 className="about-team-name">{m.name}</h3>
                <p className="about-team-role">{m.role}</p>
                <div className="about-team-award">
                  <FontAwesomeIcon icon={faAward} style={{color: m.color, marginRight: 4}} />
                  Équipe fondatrice
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact / CTA ── */}
        <div className="about-contact-cta">
          <div className="about-cta-content">
            <h2>Prêt à voyager avec nous ?</h2>
            <p>Rejoignez les 5 000+ voyageurs qui font confiance à MiabeTrans pour leurs trajets interurbains au Togo.</p>
            <div className="about-cta-btns">
              <button className="btn btn-accent btn-lg" onClick={() => navigate('/register')}>
                Créer mon compte gratuit
              </button>
              <button className="btn btn-outline-white btn-lg" onClick={() => navigate('/contact')}>
                Nous contacter
              </button>
            </div>
          </div>
          <div className="about-cta-contacts">
            <a href="tel:+22890000001" className="about-cta-contact">
              <FontAwesomeIcon icon={faPhone} />
              <span>+228 90 00 00 01</span>
            </a>
            <a href="mailto:contact@miabetrans.tg" className="about-cta-contact">
              <FontAwesomeIcon icon={faEnvelope} />
              <span>contact@miabetrans.tg</span>
            </a>
            <div className="about-cta-contact">
              <FontAwesomeIcon icon={faLocationDot} />
              <span>Boulevard du Mono, Lomé, Togo</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
