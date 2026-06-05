import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FAQ.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicket, faCreditCard, faBus, faXmark, faUser, faPhone,
  faMagnifyingGlass, faChevronDown, faCircleQuestion, faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const CATEGORY_COLORS = {
  reservation: { color: '#1B4332', bg: '#ECFDF5', border: '#A7F3D0' },
  paiement:    { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  voyage:      { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  annulation:  { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  compte:      { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  contact:     { color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
};

const CATEGORIES = [
  {
    id: 'reservation', icon: faTicket, label: 'Réservation',
    questions: [
      {
        q: 'Comment réserver un billet en ligne ?',
        a: `C'est simple en 4 étapes :\n1. Créez un compte ou connectez-vous sur MiabeTrans\n2. Allez sur "Rechercher" et entrez votre ville de départ, d'arrivée et la date\n3. Choisissez le trajet qui vous convient et cliquez "Réserver"\n4. Confirmez votre réservation et recevez votre reçu par email\n\nVous pouvez également appeler le **+228 90 00 00 01** pour une réservation par téléphone.`
      },
      {
        q: 'Faut-il obligatoirement un compte pour réserver ?',
        a: `Oui, un compte est requis pour réserver en ligne. L'inscription est **gratuite** et ne prend que 2 minutes.\nCela nous permet de vous envoyer votre reçu par email et de gérer vos réservations.\n\nPour créer votre compte, cliquez sur "S'inscrire" en haut de la page.`
      },
      {
        q: 'Combien de temps à l\'avance peut-on réserver ?',
        a: `Vous pouvez réserver jusqu'à la veille du départ, sous réserve de disponibilité des places.\nNous recommandons de réserver au moins **24h à l'avance**, surtout pour les fins de semaine et les jours fériés où la demande est forte.`
      },
      {
        q: 'Peut-on réserver pour quelqu\'un d\'autre ?',
        a: `Oui, vous pouvez réserver pour un proche en utilisant votre compte.\nLors de la montée dans le bus, présentez simplement le numéro de réservation ou le reçu (papier ou écran).\nLe billet est nominatif mais le contrôle se fait sur présentation du reçu.`
      },
      {
        q: 'Combien de places peut-on réserver à la fois ?',
        a: `Actuellement, le système permet **une réservation par trajet** par compte.\nPour réserver plusieurs places (groupe, famille), veuillez nous contacter directement au **+228 90 00 00 01** ou par WhatsApp.`
      },
    ]
  },
  {
    id: 'paiement', icon: faCreditCard, label: 'Paiement',
    questions: [
      {
        q: 'Quels sont les modes de paiement acceptés ?',
        a: `MiabeTrans accepte les modes de paiement suivants :\n• **Mixx By Yas** : Paiement mobile Togocom (*144#)\n• **Moov Money** : Paiement mobile Moov Africa (*155#)\n• **Carte Bancaire** : Visa / Mastercard\n• **Cash (espèces)** : Paiement à la montée dans le bus\n\nPour les paiements mobiles, vous recevrez les instructions par email après confirmation de votre réservation.`
      },
      {
        q: 'Quand faut-il payer ?',
        a: `Le paiement peut se faire :\n• **En ligne** lors de la réservation (Mixx By Yas, Moov Money, Carte Bancaire)\n• **En espèces** directement au chauffeur au moment de la montée dans le bus\n\nSi vous choisissez "Cash", assurez-vous d'avoir le montant exact pour éviter les retards.`
      },
      {
        q: 'Le paiement en ligne est-il sécurisé ?',
        a: `Oui, tous les paiements en ligne sont traités de manière **sécurisée**.\nNous n'enregistrons aucune information bancaire sur nos serveurs.\nToutes les transactions sont chiffrées et protégées selon les standards internationaux.`
      },
      {
        q: 'Peut-on obtenir une facture ?',
        a: `Oui ! Un **reçu détaillé** est automatiquement envoyé par email après chaque réservation confirmée.\nCe reçu contient : votre numéro de réservation, le trajet, la date, le prix, et un QR code de vérification.\nVous pouvez également le télécharger en **PDF** depuis la page de confirmation.`
      },
    ]
  },
  {
    id: 'voyage', icon: faBus, label: 'Voyage',
    questions: [
      {
        q: 'Que faut-il apporter le jour du départ ?',
        a: `Pour monter dans le bus, vous devez présenter :\n• Votre **reçu de réservation** (numéro ou QR code, sur papier ou écran)\n• Une **pièce d'identité** (CNI, passeport, ou permis de conduire)\n\nPrésentez-vous au point de départ au moins **30 minutes avant** l'heure prévue.`
      },
      {
        q: 'D\'où partent les bus ?',
        a: `Les bus partent de l'agence MiabeTrans, situé sur le **Boulevard du Mono, Lomé**.\nL'adresse exacte du point de départ est précisée sur votre reçu de réservation.\n\nPour les villes de province, le point de départ est indiqué lors de la réservation.`
      },
      {
        q: 'Quelle est la politique concernant les bagages ?',
        a: `Chaque passager a droit à :\n• **1 bagage en soute** (max 20 kg), inclus dans le prix du billet\n• **1 bagage à main** (petite taille), à garder avec soi dans le bus\n\nPour les bagages supplémentaires ou très volumineux, des frais peuvent s'appliquer.\nContactez-nous à l'avance pour les grandes quantités.`
      },
      {
        q: 'Y a-t-il de la climatisation dans les bus ?',
        a: `Oui, **tous nos bus sont climatisés** pour votre confort.\nNous recommandons d'apporter un vêtement léger pour les longs trajets car la climatisation peut être fraîche.`
      },
      {
        q: 'Que se passe-t-il si le bus est en retard ?',
        a: `En cas de retard imprévu, nous vous informons par notification et par email.\nNotre taux de ponctualité est de **98%**.\n\nSi le retard dépasse 1 heure, vous pouvez annuler votre réservation sans frais et être remboursé ou bénéficier d'un avoir pour un prochain trajet.`
      },
    ]
  },
  {
    id: 'annulation', icon: faXmark, label: 'Annulation',
    questions: [
      {
        q: 'Comment annuler une réservation ?',
        a: `Pour annuler votre réservation :\n1. Connectez-vous à votre compte MiabeTrans\n2. Allez dans "Mes réservations"\n3. Cliquez sur "Annuler" à côté de la réservation concernée\n\nVous pouvez aussi nous contacter au **+228 90 00 00 01** ou par WhatsApp.`
      },
      {
        q: 'Peut-on être remboursé en cas d\'annulation ?',
        a: `La politique de remboursement est la suivante :\n• Annulation **plus de 24h** avant le départ → remboursement intégral\n• Annulation entre **12h et 24h** avant → remboursement à 50%\n• Annulation **moins de 12h** avant → pas de remboursement (avoir possible)\n\nEn cas d'annulation par MiabeTrans, vous êtes remboursé intégralement.`
      },
      {
        q: 'Peut-on modifier une réservation ?',
        a: `Oui, il est possible de modifier la date d'un trajet, sous réserve de disponibilité.\nContactez-nous au moins **12h avant le départ** au +228 90 00 00 01.\nDes frais de modification peuvent s'appliquer selon le cas.`
      },
    ]
  },
  {
    id: 'compte', icon: faUser, label: 'Mon compte',
    questions: [
      {
        q: 'Comment créer un compte ?',
        a: `Cliquez sur "S'inscrire" en haut de la page et remplissez le formulaire avec :\n• Votre nom et prénom\n• Votre adresse email (elle servira d'identifiant)\n• Votre numéro de téléphone\n• Un mot de passe sécurisé (min. 6 caractères)\n\nL'inscription est **gratuite et instantanée**.`
      },
      {
        q: 'J\'ai oublié mon mot de passe, que faire ?',
        a: `Pas de panique ! Sur la page de connexion, cliquez sur **"Mot de passe oublié ?"** et entrez votre adresse email.\nVous recevrez un lien de réinitialisation valable **1 heure**.\n\nSi vous ne recevez pas l'email, vérifiez votre dossier spam ou contactez-nous.`
      },
      {
        q: 'Comment modifier mes informations personnelles ?',
        a: `Connectez-vous et allez dans **"Mon compte" → "Mon profil"**.\nVous pouvez modifier votre nom, prénom, email, et numéro de téléphone.\nPour changer votre mot de passe, allez dans "Mon compte" → "Mot de passe".`
      },
      {
        q: 'Comment voir l\'historique de mes réservations ?',
        a: `Connectez-vous et cliquez sur **"Mes réservations"** dans le menu de votre compte.\nVous y trouverez toutes vos réservations passées et en cours, avec leur statut et la possibilité de télécharger les reçus.`
      },
    ]
  },
  {
    id: 'contact', icon: faPhone, label: 'Assistance',
    questions: [
      {
        q: 'Comment contacter MiabeTrans ?',
        a: `Vous pouvez nous contacter via :\n• **Téléphone** : +228 90 00 00 01 (Lun-Sam, 6h-20h)\n• **WhatsApp** : +228 90 00 00 01 (réponse sous 30 min)\n• **Email** : contact@miabetrans.tg\n• **Formulaire** de contact sur notre site\n\nLe bouton WhatsApp vert en bas à droite vous connecte directement à notre équipe.`
      },
      {
        q: 'Quels sont les horaires du service client ?',
        a: `Notre service client est disponible du **lundi au samedi de 6h00 à 20h00**.\nPour les urgences liées à un voyage en cours, le **+228 90 00 00 01** est joignable 7j/7.`
      },
      {
        q: 'Comment signaler un problème avec un chauffeur ou un bus ?',
        a: `Nous prenons très au sérieux la qualité de notre service. Pour signaler un problème :\n1. Contactez-nous immédiatement au **+228 90 00 00 01** ou via WhatsApp\n2. Ou remplissez le formulaire de contact avec le numéro de votre réservation\n3. Ou envoyez un email à **contact@miabetrans.tg**\n\nToutes les réclamations sont traitées dans les **48h ouvrées**.`
      },
    ]
  },
];

const POPULAR = [
  { label: 'Annuler une réservation', cat: 'annulation', q: 'Comment annuler une réservation ?' },
  { label: 'Modes de paiement',       cat: 'paiement',  q: 'Quels sont les modes de paiement acceptés ?' },
  { label: 'Bagages autorisés',       cat: 'voyage',    q: 'Quelle est la politique concernant les bagages ?' },
  { label: 'Mot de passe oublié',     cat: 'compte',    q: 'J\'ai oublié mon mot de passe, que faire ?' },
];

function parseAnswer(text) {
  const lines = text.split('\n');
  const result = [];
  let olItems = [], ulItems = [];

  const flush = () => {
    if (olItems.length) { result.push(<ol key={result.length}>{olItems}</ol>); olItems = []; }
    if (ulItems.length) { result.push(<ul key={result.length}>{ulItems}</ul>); ulItems = []; }
  };

  const renderBold = (str) => {
    const parts = str.split(/\*\*(.+?)\*\*/g);
    return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p);
  };

  lines.forEach((line, i) => {
    const ol = line.match(/^(\d+)\.\s+(.+)/);
    const ul = line.match(/^[•\-]\s+(.+)/);

    if (ol) {
      if (ulItems.length) flush();
      olItems.push(<li key={i}>{renderBold(ol[2])}</li>);
    } else if (ul) {
      if (olItems.length) flush();
      ulItems.push(<li key={i}>{renderBold(ul[1])}</li>);
    } else if (line.trim() === '') {
      flush();
      result.push(<br key={`br-${i}`} />);
    } else {
      flush();
      result.push(<p key={i}>{renderBold(line)}</p>);
    }
  });
  flush();
  return result;
}

function FaqItem({ question, answer, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const bodyRef = useRef(null);

  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{question}</span>
        <span className="faq-chevron"><FontAwesomeIcon icon={faChevronDown} /></span>
      </button>
      <div className="faq-answer-wrap" ref={bodyRef} style={{ maxHeight: open ? bodyRef.current?.scrollHeight + 'px' : '0' }}>
        <div className="faq-answer">
          {parseAnswer(answer)}
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('reservation');
  const [searchFaq, setSearchFaq] = useState('');

  const currentCat = CATEGORIES.find(c => c.id === activeCategory);
  const totalQuestions = CATEGORIES.reduce((acc, c) => acc + c.questions.length, 0);

  const searchResults = searchFaq.length > 2
    ? CATEGORIES.flatMap(cat =>
        cat.questions
          .filter(q =>
            q.q.toLowerCase().includes(searchFaq.toLowerCase()) ||
            q.a.toLowerCase().includes(searchFaq.toLowerCase())
          )
          .map(q => ({ ...q, cat: cat.label, catId: cat.id, catIcon: cat.icon }))
      )
    : [];

  const handlePopular = (item) => {
    setSearchFaq('');
    setActiveCategory(item.cat);
    setTimeout(() => {
      const el = document.querySelector('.faq-item');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="faq-page">
      <div className="faq-hero">
        <div className="container faq-hero-inner">
          <div className="faq-hero-badge">
            <span className="faq-hero-badge-dot" />
            Support disponible Lun–Sam 6h–20h
          </div>
          <h1>Centre d'aide MiabeTrans</h1>
          <p>Trouvez rapidement les réponses à vos questions parmi nos <strong>{totalQuestions} articles</strong></p>

          <div className="faq-search-wrapper">
            <span className="faq-search-icon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
            <input
              type="text"
              className="faq-search-input"
              placeholder="Rechercher : annulation, paiement, bagage..."
              value={searchFaq}
              onChange={e => setSearchFaq(e.target.value)}
            />
            {searchFaq && (
              <button className="faq-search-clear" onClick={() => setSearchFaq('')}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          <div className="faq-popular">
            <span className="faq-popular-label">Questions fréquentes :</span>
            {POPULAR.map((p, i) => (
              <button key={i} className="faq-popular-chip" onClick={() => handlePopular(p)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container faq-body">
        {searchFaq.length > 2 ? (
          <div className="faq-search-results">
            <div className="faq-results-header">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <h2>{searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''} pour «&nbsp;{searchFaq}&nbsp;»</h2>
            </div>
            {searchResults.length === 0 ? (
              <div className="faq-empty">
                <div className="faq-empty-icon"><FontAwesomeIcon icon={faCircleQuestion} /></div>
                <h3>Aucun résultat trouvé</h3>
                <p>Essayez avec d'autres mots-clés ou parcourez les catégories ci-dessous.</p>
                <div className="faq-empty-actions">
                  <button className="btn btn-outline" onClick={() => setSearchFaq('')}>Voir toutes les catégories</button>
                  <button className="btn btn-primary" onClick={() => navigate('/contact')}>Contacter le support</button>
                </div>
              </div>
            ) : (
              <div className="faq-list">
                {searchResults.map((r, i) => (
                  <div key={i} className="faq-result-item">
                    <span className="faq-cat-badge" style={{ '--cat-color': CATEGORY_COLORS[r.catId]?.color, '--cat-bg': CATEGORY_COLORS[r.catId]?.bg }}>
                      <FontAwesomeIcon icon={r.catIcon} /> {r.cat}
                    </span>
                    <FaqItem question={r.q} answer={r.a} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="faq-layout">
            <aside className="faq-sidebar">
              <p className="faq-sidebar-label">Catégories</p>
              {CATEGORIES.map(cat => {
                const c = CATEGORY_COLORS[cat.id];
                return (
                  <button
                    key={cat.id}
                    className={`faq-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    style={activeCategory === cat.id ? { '--cat-color': c.color, '--cat-bg': c.bg, '--cat-border': c.border } : {}}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span className="faq-cat-icon" style={{ background: activeCategory === cat.id ? c.bg : 'var(--gray-100)', color: activeCategory === cat.id ? c.color : 'var(--gray-400)' }}>
                      <FontAwesomeIcon icon={cat.icon} />
                    </span>
                    <span className="faq-cat-name">{cat.label}</span>
                    <span className="faq-cat-count">{cat.questions.length}</span>
                  </button>
                );
              })}

              <div className="faq-cta-card">
                <div className="faq-cta-icon"><FontAwesomeIcon icon={faHeadset} /></div>
                <h4>Pas trouvé ?</h4>
                <p>Notre équipe répond en moins de 30 min</p>
                <button className="btn btn-primary btn-sm btn-full" onClick={() => navigate('/contact')}>
                  Envoyer un message
                </button>
                <a href="https://wa.me/22890000001" target="_blank" rel="noreferrer" className="faq-wa-btn">
                  <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp direct
                </a>
              </div>
            </aside>

            <div className="faq-content">
              {currentCat && (
                <>
                  <div className="faq-content-header" style={{ '--cat-color': CATEGORY_COLORS[currentCat.id]?.color, '--cat-bg': CATEGORY_COLORS[currentCat.id]?.bg }}>
                    <span className="faq-content-icon">
                      <FontAwesomeIcon icon={currentCat.icon} />
                    </span>
                    <div>
                      <h2>{currentCat.label}</h2>
                      <p>{currentCat.questions.length} question{currentCat.questions.length > 1 ? 's' : ''} dans cette catégorie</p>
                    </div>
                  </div>
                  <div className="faq-list">
                    {currentCat.questions.map((q, i) => (
                      <FaqItem key={`${currentCat.id}-${i}`} question={q.q} answer={q.a} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="faq-bottom-banner">
          <div className="faq-banner-left">
            <div className="faq-banner-icon"><FontAwesomeIcon icon={faHeadset} /></div>
            <div>
              <h3>Vous n'avez pas trouvé votre réponse ?</h3>
              <p>Notre équipe de support est disponible du lundi au samedi de 6h à 20h pour vous aider.</p>
            </div>
          </div>
          <div className="faq-banner-actions">
            <a href="tel:+22890000001" className="btn btn-outline faq-banner-btn">
              <FontAwesomeIcon icon={faPhone} /> Appeler
            </a>
            <a href="https://wa.me/22890000001" target="_blank" rel="noreferrer" className="btn faq-banner-btn faq-wa-cta">
              <FontAwesomeIcon icon={faWhatsapp} /> Chat WhatsApp
            </a>
            <button className="btn btn-primary faq-banner-btn" onClick={() => navigate('/contact')}>
              Formulaire de contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
