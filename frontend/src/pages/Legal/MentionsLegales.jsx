import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Legal.css';

const SECTIONS = [
  { id: 'editeur',       title: 'Éditeur du site'            },
  { id: 'activite',      title: 'Activité réglementée'       },
  { id: 'hebergement',   title: 'Hébergement'                },
  { id: 'propriete',     title: 'Propriété intellectuelle'   },
  { id: 'responsabilite',title: 'Responsabilité'             },
  { id: 'liens',         title: 'Liens hypertextes'          },
  { id: 'droit',         title: 'Droit applicable'           },
  { id: 'contact',       title: 'Contact'                    },
];

export default function MentionsLegales() {
  const [activeId, setActiveId] = useState('editeur');

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
            Informations légales
          </div>
          <h1>Mentions légales</h1>
          <p className="legal-hero-sub">
            Conformément aux dispositions du droit togolais et de l'Acte Uniforme OHADA
          </p>
          <div className="legal-hero-meta">
            <span className="legal-meta-chip">Dernière mise à jour : juin 2026</span>
            <span className="legal-meta-chip">Droit applicable : Togo · OHADA</span>
          </div>
        </div>
      </div>

      <div className="container legal-layout">

        {/* Table des matières */}
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

        {/* Contenu */}
        <div className="legal-body">

          <section className="legal-section" id="editeur">
            <div className="legal-section-header">
              <span className="legal-section-num">01</span>
              <h2>Éditeur du site</h2>
            </div>
            <p>Le site <strong>MiabeTrans</strong> est édité par la société de transport de voyageurs :</p>
            <div className="legal-info-grid">
              {[
                { label: 'Dénomination sociale', value: 'MiabeTrans' },
                { label: 'Forme juridique',       value: 'Entreprise de transport de voyageurs' },
                { label: 'Siège social',           value: 'Boulevard du Mono, Lomé, Togo' },
                { label: 'Téléphone',              value: '+228 90 00 00 01' },
                { label: 'Email',                  value: 'contact@miabetrans.tg' },
                { label: 'Pays d\'immatriculation',value: 'République Togolaise' },
                { label: 'Développeur',            value: 'NATO Komi Ephraïm Dieudonné — FORMATEC' },
              ].map((r, i) => (
                <div key={i} className="legal-info-row">
                  <span className="lir-label">{r.label}</span>
                  <span className="lir-value">{r.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="legal-section" id="activite">
            <div className="legal-section-header">
              <span className="legal-section-num">02</span>
              <h2>Activité réglementée</h2>
            </div>
            <p>
              MiabeTrans exerce l'activité de <strong>transport public interurbain de voyageurs par route</strong>
              sur le territoire togolais, conformément aux textes réglementaires en vigueur :
            </p>
            <ul className="legal-list">
              <li>
                <strong>Loi N° 2007-011 du 13 mars 2007</strong> relative à la sécurité routière et au transport
                routier en République Togolaise
              </li>
              <li>
                <strong>Décret N° 2009-092/PR du 23 avril 2009</strong> fixant les conditions d'exercice
                de l'activité de transport routier de personnes au Togo
              </li>
              <li>
                <strong>Ministère des Transports et de la Logistique</strong> de la République Togolaise —
                autorité de tutelle et de délivrance des agréments de transport
              </li>
              <li>
                Règlement communautaire <strong>UEMOA N° 14/2005/CM</strong> relatif à la libéralisation
                du transport routier inter-États
              </li>
            </ul>
            <div className="legal-highlight-box">
              <strong>Obligations légales respectées :</strong> documents de voyage, assurance responsabilité
              civile obligatoire, visite technique périodique des véhicules, carte grise et vignette
              en règle conformément au Code de la Route togolais.
            </div>
          </section>

          <section className="legal-section" id="hebergement">
            <div className="legal-section-header">
              <span className="legal-section-num">03</span>
              <h2>Hébergement</h2>
            </div>
            <p>
              Ce site est actuellement hébergé dans un environnement de développement local (WAMP).
              Pour la mise en production, MiabeTrans s'engage à héberger la plateforme auprès d'un
              prestataire agréé et conforme aux exigences de l'<strong>ARCEP Togo</strong>
              (Autorité de Régulation des Communications Électroniques et des Postes).
            </p>
            <p>
              Les serveurs seront situés en Afrique de l'Ouest ou en Europe, conformément aux
              obligations de conservation et de localisation des données personnelles prévues par
              la <strong>Loi N° 2019-014</strong> du 29 octobre 2019 relative à la protection des données
              à caractère personnel au Togo.
            </p>
          </section>

          <section className="legal-section" id="propriete">
            <div className="legal-section-header">
              <span className="legal-section-num">04</span>
              <h2>Propriété intellectuelle</h2>
            </div>
            <p>
              L'ensemble des éléments du site MiabeTrans — textes, logos, icônes, interface graphique,
              base de données, structure et code source — sont protégés par le droit de la propriété
              intellectuelle applicable en République Togolaise et par les conventions internationales
              auxquelles le Togo est partie.
            </p>
            <ul className="legal-list">
              <li>
                Toute reproduction totale ou partielle sans autorisation écrite préalable de MiabeTrans
                est strictement interdite et constitue une contrefaçon sanctionnée par la loi
              </li>
              <li>
                Le logo, la marque et le nom <strong>MiabeTrans</strong> sont des signes distinctifs
                dont l'utilisation non autorisée est prohibée
              </li>
              <li>
                La base de données des trajets, horaires et tarifs constitue une œuvre protégée
                au sens du droit OHADA et du droit togolais
              </li>
            </ul>
          </section>

          <section className="legal-section" id="responsabilite">
            <div className="legal-section-header">
              <span className="legal-section-num">05</span>
              <h2>Responsabilité</h2>
            </div>
            <p>
              MiabeTrans s'engage à fournir un service de transport sûr et ponctuel conformément
              à ses obligations légales. En tant que transporteur public, MiabeTrans est soumis au
              régime de <strong>responsabilité de plein droit</strong> du transporteur vis-à-vis des
              voyageurs, conformément aux dispositions du Code des Transports Terrestres togolais.
            </p>
            <ul className="legal-list">
              <li>
                <strong>Responsabilité du transporteur :</strong> MiabeTrans est responsable des
                dommages corporels et matériels subis par les voyageurs durant le trajet, sous
                réserve des causes exonératoires prévues par la loi
              </li>
              <li>
                <strong>Assurance obligatoire :</strong> tous nos véhicules sont couverts par une
                assurance responsabilité civile conformément aux exigences de la
                <strong> Loi N° 2007-011</strong>
              </li>
              <li>
                <strong>Informations du site :</strong> MiabeTrans met tout en œuvre pour assurer
                l'exactitude des horaires et tarifs affichés, mais décline toute responsabilité en
                cas d'erreur involontaire ou de force majeure
              </li>
            </ul>
          </section>

          <section className="legal-section" id="liens">
            <div className="legal-section-header">
              <span className="legal-section-num">06</span>
              <h2>Liens hypertextes</h2>
            </div>
            <p>
              Le site MiabeTrans peut contenir des liens vers des sites partenaires ou institutionnels
              (Ministère des Transports, ARCEP, opérateurs de mobile money). Ces liens sont fournis à
              titre informatif. MiabeTrans n'est pas responsable du contenu de ces sites tiers et ne
              saurait être tenu pour responsable de leur politique de confidentialité.
            </p>
          </section>

          <section className="legal-section" id="droit">
            <div className="legal-section-header">
              <span className="legal-section-num">07</span>
              <h2>Droit applicable</h2>
            </div>
            <p>
              Les présentes mentions légales sont régies par le <strong>droit de la République Togolaise</strong>
              et les actes uniformes de l'<strong>OHADA</strong> (Organisation pour l'Harmonisation
              en Afrique du Droit des Affaires).
            </p>
            <p>
              En cas de litige relatif à l'utilisation du site ou aux services de transport, les parties
              s'engagent à rechercher une solution amiable. À défaut d'accord, tout litige sera soumis
              à la compétence exclusive des <strong>Tribunaux de Lomé</strong>, République Togolaise.
            </p>
            <div className="legal-highlight-box">
              Pour les litiges liés aux paiements mobiles (Mixx By Yas / Moov Money), les dispositions
              du règlement de la <strong>BCEAO</strong> (Banque Centrale des États de l'Afrique de
              l'Ouest) relatif à la monnaie électronique sont également applicables.
            </div>
          </section>

          <section className="legal-section" id="contact">
            <div className="legal-section-header">
              <span className="legal-section-num">08</span>
              <h2>Contact</h2>
            </div>
            <p>
              Pour toute question relative à ces mentions légales ou à vos droits, notre service
              juridique est joignable aux coordonnées suivantes :
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
            <p style={{marginTop:'var(--space-4)'}}>
              Voir également notre <Link to="/confidentialite" className="legal-link">
                Politique de confidentialité
              </Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
