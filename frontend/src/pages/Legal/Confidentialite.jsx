import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Legal.css';

const SECTIONS = [
  { id: 'intro',         title: 'Introduction'               },
  { id: 'responsable',   title: 'Responsable du traitement'  },
  { id: 'collecte',      title: 'Données collectées'         },
  { id: 'finalites',     title: 'Finalités du traitement'    },
  { id: 'conservation',  title: 'Conservation des données'   },
  { id: 'partage',       title: 'Partage des données'        },
  { id: 'securite',      title: 'Sécurité'                   },
  { id: 'droits',        title: 'Vos droits'                 },
  { id: 'paiement',      title: 'Paiements mobiles'          },
  { id: 'cookies',       title: 'Cookies & stockage local'   },
  { id: 'contact',       title: 'Contact & réclamations'     },
];

export default function Confidentialite() {
  const [activeId, setActiveId] = useState('intro');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="container legal-hero-inner">
          <div className="legal-hero-badge">
            <span className="legal-badge-dot" />
            Vie privée &amp; données personnelles
          </div>
          <h1>Politique de confidentialité</h1>
          <p className="legal-hero-sub">
            Conforme à la Loi N° 2019-014 du 29 octobre 2019 · Protection des données personnelles au Togo
          </p>
          <div className="legal-hero-meta">
            <span className="legal-meta-chip">Dernière mise à jour : juin 2026</span>
            <span className="legal-meta-chip">Loi N° 2019-014 · ANPD Togo</span>
          </div>
        </div>
      </div>

      <div className="container legal-layout">

        <aside className="legal-toc">
          <div className="legal-toc-card">
            <p className="legal-toc-title">Table des matières</p>
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                className={`legal-toc-item ${activeId === s.id ? 'active' : ''}`}
                onClick={() => scrollTo(s.id)}
              >
                <span className="toc-num">{String(i + 1).padStart(2, '0')}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="legal-body">

          <section className="legal-section" id="intro">
            <div className="legal-section-header">
              <span className="legal-section-num">01</span>
              <h2>Introduction</h2>
            </div>
            <p>
              MiabeTrans s'engage à protéger les données personnelles de ses utilisateurs conformément
              à la <strong>Loi N° 2019-014 du 29 octobre 2019</strong> relative à la protection des
              données à caractère personnel en République Togolaise, ainsi qu'aux recommandations de
              l'<strong>ANPD</strong> (Autorité Nationale de Protection des Données personnelles du Togo).
            </p>
            <p>
              La présente politique décrit quelles données nous collectons, pourquoi, comment nous les
              utilisons et quels sont vos droits. En utilisant la plateforme MiabeTrans, vous acceptez
              les termes de cette politique.
            </p>
            <div className="legal-highlight-box legal-highlight-primary">
              MiabeTrans ne vend jamais vos données personnelles à des tiers à des fins commerciales.
              Vos données sont utilisées exclusivement pour vous fournir le service de transport.
            </div>
          </section>

          <section className="legal-section" id="responsable">
            <div className="legal-section-header">
              <span className="legal-section-num">02</span>
              <h2>Responsable du traitement</h2>
            </div>
            <div className="legal-info-grid">
              {[
                { label: 'Responsable',     value: 'MiabeTrans'                          },
                { label: 'Adresse',         value: 'Boulevard du Mono, Lomé, Togo'       },
                { label: 'Email',           value: 'contact@miabetrans.tg'               },
                { label: 'Téléphone',       value: '+228 90 00 00 01'                    },
                { label: 'Délégué DPO',     value: 'NATO Komi Ephraïm Dieudonné'         },
                { label: 'Autorité de tutelle', value: 'ANPD (Autorité Nationale de Protection des Données personnelles du Togo)' },
              ].map((r, i) => (
                <div key={i} className="legal-info-row">
                  <span className="lir-label">{r.label}</span>
                  <span className="lir-value">{r.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="legal-section" id="collecte">
            <div className="legal-section-header">
              <span className="legal-section-num">03</span>
              <h2>Données collectées</h2>
            </div>
            <p>Dans le cadre de l'utilisation de la plateforme MiabeTrans, nous collectons uniquement
            les données strictement nécessaires à la fourniture du service :</p>

            <div className="legal-data-table">
              {[
                {
                  cat: 'Identité',
                  icon: '👤',
                  items: ['Nom et prénom', 'Numéro de téléphone', 'Adresse email'],
                  base: 'Exécution du contrat de transport',
                },
                {
                  cat: 'Réservations',
                  icon: '🎫',
                  items: ['Trajet (ville départ/arrivée)', 'Date et heure de départ', 'Mode de paiement choisi', 'Référence de paiement'],
                  base: 'Exécution du contrat de transport',
                },
                {
                  cat: 'Authentification',
                  icon: '🔐',
                  items: ['Adresse email (identifiant)', 'Mot de passe (haché, jamais stocké en clair)', 'Token JWT de session'],
                  base: 'Sécurité et accès au compte',
                },
                {
                  cat: 'Données techniques',
                  icon: '💻',
                  items: ['Adresse IP (logs serveur)', 'Type de navigateur', 'Date et heure des connexions'],
                  base: 'Sécurité et prévention des fraudes',
                },
              ].map((d, i) => (
                <div key={i} className="legal-data-row">
                  <div className="ldr-header">
                    <span className="ldr-icon">{d.icon}</span>
                    <strong>{d.cat}</strong>
                    <span className="ldr-base">{d.base}</span>
                  </div>
                  <ul className="legal-list legal-list-sm">
                    {d.items.map((it, j) => <li key={j}>{it}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="legal-section" id="finalites">
            <div className="legal-section-header">
              <span className="legal-section-num">04</span>
              <h2>Finalités du traitement</h2>
            </div>
            <p>Vos données sont traitées pour les finalités suivantes, conformément à la
            Loi N° 2019-014 :</p>
            <ul className="legal-list">
              <li><strong>Gestion des réservations :</strong> création, confirmation, modification et annulation de billets de voyage</li>
              <li><strong>Émission des reçus :</strong> envoi automatique par email du billet électronique avec QR code</li>
              <li><strong>Traitement des paiements :</strong> coordination avec les opérateurs Mixx By Yas (Togocom) et Moov Money selon la réglementation BCEAO</li>
              <li><strong>Service client :</strong> traitement de vos demandes, réclamations et notifications de modification de trajet</li>
              <li><strong>Sécurité du service :</strong> prévention des fraudes, double réservation et abus</li>
              <li><strong>Amélioration de la plateforme :</strong> statistiques anonymisées et agrégées uniquement</li>
              <li><strong>Obligations légales :</strong> conservation des données de transport à des fins réglementaires et comptables</li>
            </ul>
          </section>

          <section className="legal-section" id="conservation">
            <div className="legal-section-header">
              <span className="legal-section-num">05</span>
              <h2>Conservation des données</h2>
            </div>
            <p>Conformément à l'article 17 de la Loi N° 2019-014, vos données sont conservées
            pour la durée strictement nécessaire aux finalités pour lesquelles elles ont été collectées :</p>
            <div className="legal-info-grid">
              {[
                { label: 'Données de compte (actif)',           value: 'Pendant toute la durée d\'utilisation du service' },
                { label: 'Données de compte (inactif)',         value: '3 ans après la dernière connexion' },
                { label: 'Données de réservation',              value: '5 ans (obligations comptables et fiscales togolaises)' },
                { label: 'Données de paiement mobile',          value: '5 ans (BCEAO, Instruction N° 008-05-2015)' },
                { label: 'Logs techniques (IP, connexions)',    value: '12 mois' },
                { label: 'Données d\'un compte supprimé',       value: '30 jours (période de rétention avant effacement définitif)' },
              ].map((r, i) => (
                <div key={i} className="legal-info-row">
                  <span className="lir-label">{r.label}</span>
                  <span className="lir-value">{r.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="legal-section" id="partage">
            <div className="legal-section-header">
              <span className="legal-section-num">06</span>
              <h2>Partage des données</h2>
            </div>
            <p>
              MiabeTrans ne vend ni ne loue vos données personnelles. Les données peuvent être
              communiquées uniquement dans les cas suivants :
            </p>
            <ul className="legal-list">
              <li>
                <strong>Chauffeurs assignés :</strong> uniquement votre nom et le numéro de réservation,
                strictement nécessaires à la vérification de votre billet à l'embarquement
              </li>
              <li>
                <strong>Opérateurs de mobile money :</strong> Togocom (Mixx By Yas) et Moov Africa Togo
                (Moov Money) reçoivent uniquement les données nécessaires à la transaction de paiement,
                conformément à la réglementation BCEAO sur la monnaie électronique
              </li>
              <li>
                <strong>Autorités compétentes :</strong> en cas d'obligation légale, réquisition judiciaire
                ou demande des autorités togolaises compétentes (Police nationale, Gendarmerie, Justice)
              </li>
              <li>
                <strong>Service d'email transactionnel :</strong> votre adresse email est communiquée
                au prestataire d'envoi pour la délivrance de vos billets électroniques uniquement
              </li>
            </ul>
            <div className="legal-highlight-box">
              Aucun transfert de données en dehors de l'espace CEDEAO n'est effectué sans garanties
              adéquates conformément à l'article 43 de la Loi N° 2019-014.
            </div>
          </section>

          <section className="legal-section" id="securite">
            <div className="legal-section-header">
              <span className="legal-section-num">07</span>
              <h2>Sécurité</h2>
            </div>
            <p>
              MiabeTrans met en œuvre des mesures techniques et organisationnelles conformes à
              l'article 32 de la Loi N° 2019-014 pour protéger vos données :
            </p>
            <ul className="legal-list">
              <li><strong>Chiffrement des mots de passe :</strong> algorithme de hachage sécurisé, votre mot de passe n'est jamais stocké en clair</li>
              <li><strong>Authentification JWT :</strong> tokens d'accès signés et à durée limitée pour sécuriser les sessions</li>
              <li><strong>HTTPS :</strong> toutes les communications entre votre navigateur et nos serveurs sont chiffrées</li>
              <li><strong>Contrôle d'accès :</strong> les données personnelles ne sont accessibles qu'aux personnels autorisés selon leur rôle (client, chauffeur, administrateur)</li>
              <li><strong>Journalisation :</strong> les accès aux données sensibles sont enregistrés pour détecter toute activité suspecte</li>
            </ul>
            <p>
              En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits,
              MiabeTrans s'engage à vous en informer dans les <strong>72 heures</strong> conformément
              à l'article 36 de la Loi N° 2019-014, et à notifier l'<strong>ANPD</strong>.
            </p>
          </section>

          <section className="legal-section" id="droits">
            <div className="legal-section-header">
              <span className="legal-section-num">08</span>
              <h2>Vos droits</h2>
            </div>
            <p>
              Conformément aux articles 19 à 28 de la <strong>Loi N° 2019-014</strong>,
              vous disposez des droits suivants sur vos données personnelles :
            </p>
            <div className="legal-rights-grid">
              {[
                { title: 'Droit d\'accès',        desc: 'Obtenir la confirmation que vos données sont traitées et en obtenir une copie (art. 19)' },
                { title: 'Droit de rectification', desc: 'Faire corriger ou compléter vos données inexactes ou incomplètes (art. 20)' },
                { title: 'Droit à l\'effacement',  desc: 'Demander la suppression de votre compte et de vos données, sous réserve des obligations légales de conservation (art. 21)' },
                { title: 'Droit d\'opposition',    desc: 'Vous opposer au traitement de vos données pour des raisons légitimes (art. 24)' },
                { title: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré et lisible par machine (art. 23)' },
                { title: 'Droit de limitation',    desc: 'Demander la suspension temporaire du traitement de vos données (art. 22)' },
              ].map((r, i) => (
                <div key={i} className="legal-right-card">
                  <h4>{r.title}</h4>
                  <p>{r.desc}</p>
                </div>
              ))}
            </div>
            <p>
              Pour exercer vos droits, contactez-nous à <strong>contact@miabetrans.tg</strong>.
              Nous répondrons dans un délai maximum de <strong>30 jours</strong> suivant la réception
              de votre demande, accompagnée d'une preuve d'identité.
            </p>
          </section>

          <section className="legal-section" id="paiement">
            <div className="legal-section-header">
              <span className="legal-section-num">09</span>
              <h2>Paiements mobiles</h2>
            </div>
            <p>
              Les paiements sur MiabeTrans sont traités via les opérateurs togolais de mobile money,
              conformément à l'<strong>Instruction N° 008-05-2015/SP</strong> de la BCEAO relative aux
              émetteurs de monnaie électronique dans l'espace UEMOA :
            </p>
            <ul className="legal-list">
              <li>
                <strong>Mixx By Yas (Togocom) :</strong> service de mobile money réglementé par l'ARCEP
                Togo et la BCEAO. Les transactions sont sécurisées via le réseau Togocom (*144#)
              </li>
              <li>
                <strong>Moov Money (Moov Africa Togo) :</strong> service de mobile money réglementé.
                Transactions via le réseau Moov Africa (*155#)
              </li>
            </ul>
            <p>
              MiabeTrans ne stocke <strong>aucun numéro de compte mobile money</strong> ni aucun
              identifiant de paiement sensible. Seule la référence de transaction générée par
              l'opérateur est conservée à des fins de justification comptable.
            </p>
            <div className="legal-highlight-box">
              En cas de litige sur une transaction mobile, vous pouvez vous adresser directement
              au service client de votre opérateur (Togocom / Moov Africa) ou saisir l'<strong>ARCEP Togo</strong>.
            </div>
          </section>

          <section className="legal-section" id="cookies">
            <div className="legal-section-header">
              <span className="legal-section-num">10</span>
              <h2>Cookies &amp; stockage local</h2>
            </div>
            <p>
              MiabeTrans utilise le <strong>localStorage</strong> du navigateur (mécanisme de stockage
              local, distinct des cookies) pour les finalités techniques strictement nécessaires :
            </p>
            <ul className="legal-list">
              <li>
                <strong>Token d'authentification JWT :</strong> maintient votre session de connexion
                active. Supprimé à la déconnexion
              </li>
              <li>
                <strong>Préférences d'interface :</strong> état de la navigation (aucune donnée personnelle)
              </li>
            </ul>
            <p>
              <strong>Aucun cookie de tracking, de publicité ou d'analyse tiers</strong> n'est utilisé
              sur la plateforme MiabeTrans. Aucune donnée n'est partagée avec des régies publicitaires.
            </p>
            <p>
              Vous pouvez effacer le stockage local à tout moment via les paramètres de votre navigateur
              (Outils → Confidentialité → Effacer les données du site).
            </p>
          </section>

          <section className="legal-section" id="contact">
            <div className="legal-section-header">
              <span className="legal-section-num">11</span>
              <h2>Contact &amp; réclamations</h2>
            </div>
            <p>
              Pour toute question, demande d'exercice de droits ou réclamation relative à vos
              données personnelles :
            </p>
            <div className="legal-contact-grid">
              <a href="mailto:contact@miabetrans.tg" className="legal-contact-card">
                <span className="legal-contact-icon">✉</span>
                <span>contact@miabetrans.tg</span>
              </a>
              <a href="tel:+22890000001" className="legal-contact-card">
                <span className="legal-contact-icon">📞</span>
                <span>+228 90 00 00 01</span>
              </a>
              <div className="legal-contact-card">
                <span className="legal-contact-icon">📍</span>
                <span>Boulevard du Mono, Lomé, Togo</span>
              </div>
            </div>

            <div className="legal-anpd-box">
              <h4>Droit de réclamation auprès de l'ANPD</h4>
              <p>
                Si vous estimez que le traitement de vos données personnelles par MiabeTrans
                n'est pas conforme à la Loi N° 2019-014, vous avez le droit d'introduire une
                réclamation auprès de l'<strong>ANPD</strong> (Autorité Nationale de Protection
                des Données personnelles du Togo), conformément à l'article 57 de cette loi.
              </p>
              <p>
                <strong>ANPD, République Togolaise</strong><br/>
                Site officiel : <em>www.anpd.tg</em>
              </p>
            </div>

            <p style={{marginTop:'var(--space-4)'}}>
              Voir également nos <Link to="/mentions-legales" className="legal-link">
                Mentions légales
              </Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
