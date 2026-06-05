// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faLocationDot, faPhone, faEnvelope, faClock } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">

            <div className="footer-brand">
              <div className="footer-togo-badge">🇹🇬 Transport interurbain au Togo</div>
              <div className="footer-logo">
                <div className="footer-logo-icon">🚌</div>
                <span className="footer-logo-name">MiabeTrans</span>
              </div>
              <p className="footer-desc">
                Votre partenaire de confiance pour les voyages interurbains au Togo.
                Confort, ponctualité et sécurité garantis à chaque trajet.
              </p>
              <div className="footer-socials">
                <a href="#" className="social-btn" aria-label="Facebook">
                  <FontAwesomeIcon icon={faFacebookF} />
                </a>
                <a href="#" className="social-btn" aria-label="WhatsApp">
                  <FontAwesomeIcon icon={faWhatsapp} />
                </a>
                <a href="#" className="social-btn" aria-label="Twitter / X">
                  <FontAwesomeIcon icon={faXTwitter} />
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul>
                <li><Link to="/">Accueil</Link></li>
                <li><Link to="/search">Rechercher un trajet</Link></li>
                <li><Link to="/about">À propos</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/faq">FAQ / Aide</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Mon espace</h4>
              <ul>
                <li><Link to="/login">Connexion</Link></li>
                <li><Link to="/register">Inscription</Link></li>
                <li><Link to="/account">Mon compte</Link></li>
                <li><Link to="/history">Mes réservations</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <ul className="footer-contact">
                <li>
                  <span className="footer-contact-icon">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </span>
                  <span>Lomé, Togo</span>
                </li>
                <li>
                  <span className="footer-contact-icon">
                    <FontAwesomeIcon icon={faPhone} />
                  </span>
                  <span>+228 90 00 00 01</span>
                </li>
                <li>
                  <span className="footer-contact-icon">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </span>
                  <span>contact@miabetrans.tg</span>
                </li>
                <li>
                  <span className="footer-contact-icon">
                    <FontAwesomeIcon icon={faClock} />
                  </span>
                  <span>Lun–Sam : 6h00 – 20h00</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      <div className="container">
        <div className="footer-bottom">
          <p>© {year} MiabeTrans. Tous droits réservés.</p>
          <div className="footer-bottom-links">
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
          </div>
          <p>Par <strong>NATO Komi Ephraïm</strong>, FORMATEC</p>
        </div>
      </div>
    </footer>
  );
}
