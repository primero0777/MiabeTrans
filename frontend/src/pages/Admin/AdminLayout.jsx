import { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faListCheck, faRoute, faBus,
  faCity, faIdCard, faUsers, faTicket,
  faBell, faChartBar, faChevronLeft,
  faChevronRight, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import AdminDashboard    from './AdminDashboard';
import AdminTrajets      from './AdminTrajets';
import AdminBus          from './AdminBus';
import AdminVilles       from './AdminVilles';
import AdminChauffeurs   from './AdminChauffeurs';
import AdminUsers        from './AdminUsers';
import AdminReservations from './AdminReservations';
import AdminNotifications from './AdminNotifications';
import AdminAssignations from './AdminAssignations';
import AdminStats        from './AdminStats';
import './Admin.css';

const NAV = [
  { path: '',              faIcon: faGauge,    label: 'Tableau de bord' },
  { path: 'assignations',  faIcon: faListCheck,label: 'Assignations'    },
  { path: 'trajets',       faIcon: faRoute,    label: 'Trajets'         },
  { path: 'bus',           faIcon: faBus,      label: 'Bus'             },
  { path: 'villes',        faIcon: faCity,     label: 'Villes'          },
  { path: 'chauffeurs',    faIcon: faIdCard,   label: 'Chauffeurs'      },
  { path: 'users',         faIcon: faUsers,    label: 'Utilisateurs'    },
  { path: 'reservations',  faIcon: faTicket,   label: 'Réservations'    },
  { path: 'notifications', faIcon: faBell,     label: 'Notifications'   },
  { path: 'stats',         faIcon: faChartBar, label: 'Statistiques'    },
];

export default function AdminLayout() {
  const { logout, user }  = useAuth();
  const location          = useLocation();
  const navigate          = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (p) => {
    const full = `/admin${p ? '/' + p : ''}`;
    return p === '' ? location.pathname === '/admin' : location.pathname.startsWith(full);
  };

  return (
    <div className={`admin-layout ${collapsed ? 'collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <div className="admin-logo-icon"><FontAwesomeIcon icon={faBus} /></div>
            {!collapsed && <span>MiabeTrans</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV.map(n => (
            <Link
              key={n.path}
              to={`/admin${n.path ? '/' + n.path : ''}`}
              className={`admin-nav-item ${isActive(n.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">
                <FontAwesomeIcon icon={n.faIcon} fixedWidth />
              </span>
              {!collapsed && <span className="nav-label">{n.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">
              {user?.prenom?.charAt(0) || user?.nom?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="admin-user-info">
                <div className="aui-name">{user?.prenom} {user?.nom}</div>
                <div className="aui-role">Administrateur</div>
              </div>
            )}
          </div>
          <button className="admin-logout" onClick={() => { logout(); navigate('/'); }}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            {!collapsed && ' Déconnexion'}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index                   element={<AdminDashboard />} />
          <Route path="assignations"     element={<AdminAssignations />} />
          <Route path="trajets"          element={<AdminTrajets />} />
          <Route path="bus"              element={<AdminBus />} />
          <Route path="villes"           element={<AdminVilles />} />
          <Route path="chauffeurs"       element={<AdminChauffeurs />} />
          <Route path="users"            element={<AdminUsers />} />
          <Route path="reservations"     element={<AdminReservations />} />
          <Route path="notifications"    element={<AdminNotifications />} />
          <Route path="stats"            element={<AdminStats />} />
        </Routes>
      </main>
    </div>
  );
}
