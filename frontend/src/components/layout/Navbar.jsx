// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faMagnifyingGlass, faUser, faClipboardList,
  faRightFromBracket, faChevronDown, faBus,
} from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isLoggedIn, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropRef  = useRef(null);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    if (!dropOpen) return;
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`navbar ${scrolled || !isHome ? 'navbar-solid' : 'navbar-transparent'}`}>
      <div className="container navbar-inner">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon"><FontAwesomeIcon icon={faBus} /></div>
          <div className="logo-text">
            <span className="logo-name">MiabeTrans</span>
            <span className="logo-tagline">Transport Interurbain</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/"        className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} end>Accueil</NavLink>
          <NavLink to="/search"  className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>Rechercher</NavLink>
          <NavLink to="/about"   className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>À propos</NavLink>
          <NavLink to="/contact" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>Contact</NavLink>
          <NavLink to="/faq"     className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>Aide</NavLink>

          {/* Auth visible uniquement dans le menu burger mobile */}
          <div className="nav-auth-mobile">
            {!isLoggedIn && (
              <div className="nav-auth">
                <Link to="/login"    className="btn btn-ghost btn-sm">Connexion</Link>
                <Link to="/register" className="btn btn-accent btn-sm">S'inscrire</Link>
              </div>
            )}
          </div>
        </nav>

        {/* Auth / User — visible desktop uniquement */}
        <div className="nav-actions-right">
          {isLoggedIn ? (
            <div className="nav-dropdown" ref={dropRef}>
              <button
                className="nav-user-btn"
                onClick={() => setDropOpen(!dropOpen)}
                aria-expanded={dropOpen}
              >
                <span className="user-avatar">{user.nom.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.nom.split(' ')[0]}</span>
                <FontAwesomeIcon icon={faChevronDown} className="chevron" style={{fontSize:'0.65rem'}} />
              </button>
              {dropOpen && (
                <div className="dropdown-menu">
                  {isAdmin ? (
                    <Link to="/admin" className="dropdown-item">
                      <FontAwesomeIcon icon={faGauge} fixedWidth /> Dashboard Admin
                    </Link>
                  ) : (
                    <>
                      <Link to="/account" className="dropdown-item">
                        <FontAwesomeIcon icon={faUser} fixedWidth /> Mon compte
                      </Link>
                      <Link to="/history" className="dropdown-item">
                        <FontAwesomeIcon icon={faClipboardList} fixedWidth /> Mes réservations
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} fixedWidth /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login"    className="btn btn-ghost btn-sm">Connexion</Link>
              <Link to="/register" className="btn btn-accent btn-sm">S'inscrire</Link>
            </div>
          )}
        </div>

        {/* Burger mobile */}
        <button
          className={`burger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

      </div>
    </header>
  );
}
