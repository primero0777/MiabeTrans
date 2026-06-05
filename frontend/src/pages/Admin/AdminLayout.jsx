import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faListCheck, faRoute, faBus,
  faCity, faIdCard, faUsers, faTicket,
  faBell, faChartBar, faChevronLeft,
  faChevronRight, faRightFromBracket, faBars, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '../../services/api';
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

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { path: '',             faIcon: faGauge,     label: 'Tableau de bord' },
      { path: 'reservations', faIcon: faTicket,    label: 'Réservations'    },
      { path: 'assignations', faIcon: faListCheck, label: 'Assignations'    },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { path: 'trajets',    faIcon: faRoute,  label: 'Trajets'      },
      { path: 'bus',        faIcon: faBus,    label: 'Bus'          },
      { path: 'villes',     faIcon: faCity,   label: 'Villes'       },
      { path: 'chauffeurs', faIcon: faIdCard, label: 'Chauffeurs'   },
      { path: 'users',      faIcon: faUsers,  label: 'Utilisateurs' },
    ],
  },
  {
    label: 'Rapports',
    items: [
      { path: 'notifications', faIcon: faBell,     label: 'Notifications', badge: true },
      { path: 'stats',         faIcon: faChartBar, label: 'Statistiques'               },
    ],
  },
];

export default function AdminLayout() {
  const { logout, user }  = useAuth();
  const location          = useLocation();
  const navigate          = useNavigate();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
    adminAPI.getNotifications()
      .then(r => setUnreadCount((r.data.data || []).filter(n => !n.lu).length))
      .catch(() => {});
  }, [location.pathname]);

  const isActive = (p) => {
    const full = `/admin${p ? '/' + p : ''}`;
    return p === '' ? location.pathname === '/admin' : location.pathname.startsWith(full);
  };

  const currentLabel = NAV_SECTIONS.flatMap(s => s.items).find(n => isActive(n.path))?.label || 'Admin';

  return (
    <div className={`admin-layout ${collapsed ? 'collapsed' : ''}`}>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <div className="admin-logo-icon"><FontAwesomeIcon icon={faBus} /></div>
            {!collapsed && <div className="admin-logo-text"><span>MiabeTrans</span><small>Administration</small></div>}
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Agrandir' : 'Réduire'}>
            <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="admin-nav-group">
              {!collapsed && <div className="admin-nav-section">{section.label}</div>}
              {section.items.map(n => {
                const badge = n.badge && unreadCount > 0;
                return (
                  <Link
                    key={n.path}
                    to={`/admin${n.path ? '/' + n.path : ''}`}
                    className={`admin-nav-item ${isActive(n.path) ? 'active' : ''}`}
                    title={collapsed ? n.label : undefined}
                  >
                    <span className="nav-icon">
                      <FontAwesomeIcon icon={n.faIcon} fixedWidth />
                      {badge && <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </span>
                    {!collapsed && <span className="nav-label">{n.label}</span>}
                    {!collapsed && badge && <span className="nav-badge-pill">{unreadCount}</span>}
                  </Link>
                );
              })}
            </div>
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
                <div className="aui-role">
                  <span className="aui-dot" />
                  Administrateur
                </div>
              </div>
            )}
          </div>
          <button className="admin-logout" onClick={() => { logout(); navigate('/'); }} title="Déconnexion">
            <FontAwesomeIcon icon={faRightFromBracket} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="admin-content-wrap">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
              <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} />
            </button>
            <div className="admin-breadcrumb">
              <span>Admin</span>
              <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentLabel}</span>
            </div>
          </div>
          <div className="admin-topbar-right">
            <Link to="/admin/notifications" className="topbar-notif-btn" title="Notifications">
              <FontAwesomeIcon icon={faBell} />
              {unreadCount > 0 && <span className="topbar-notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Link>
            <div className="topbar-user">
              <div className="topbar-avatar">{user?.prenom?.charAt(0) || 'A'}</div>
              <span className="topbar-user-name">{user?.prenom}</span>
            </div>
          </div>
        </header>

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
    </div>
  );
}
