import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChauffeurDashboard from './ChauffeurDashboard';
import ChauffeurAccount   from './ChauffeurAccount';
import './Chauffeur.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBus, faRoute, faUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

export default function ChauffeurLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (p) => location.pathname === p;

  return (
    <div className="chauffeur-layout">
      {/* Sidebar */}
      <aside className="chauffeur-sidebar">
        <div className="chauffeur-sidebar-header">
          <div className="chauffeur-logo"><FontAwesomeIcon icon={faBus} /> MiabeTrans</div>
        </div>
        <nav className="chauffeur-nav">
          <Link to="/chauffeur" className={`chauffeur-nav-item ${isActive('/chauffeur')?'active':''}`}>
            <span><FontAwesomeIcon icon={faRoute} /></span> Mes trajets
          </Link>
          <Link to="/chauffeur/account" className={`chauffeur-nav-item ${isActive('/chauffeur/account')?'active':''}`}>
            <span><FontAwesomeIcon icon={faUser} /></span> Mon compte
          </Link>
        </nav>
        <div className="chauffeur-sidebar-footer">
          <div className="chauffeur-user">
            <div className="chauffeur-avatar">{(user?.prenom||'C').charAt(0)}</div>
            <div>
              <div className="cu-name">{user?.prenom} {user?.nom}</div>
              <div className="cu-role">Chauffeur</div>
            </div>
          </div>
          <button className="chauffeur-logout" onClick={() => { logout(); navigate('/'); }}>
            <FontAwesomeIcon icon={faRightFromBracket} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="chauffeur-main">
        <Routes>
          <Route index         element={<ChauffeurDashboard/>}/>
          <Route path="account" element={<ChauffeurAccount/>}/>
        </Routes>
      </main>
    </div>
  );
}
