import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import Navbar           from './components/layout/Navbar';
import ScrollToTop      from './components/layout/ScrollToTop';
import Footer           from './components/layout/Footer';
import WhatsAppButton   from './components/ui/WhatsAppButton';
import Home             from './pages/Home/Home';
import './styles/global.css';
import './styles/components.css';

const Search          = lazy(() => import('./pages/Search/Search'));
const Booking         = lazy(() => import('./pages/Booking/Booking'));
const Confirmation    = lazy(() => import('./pages/Confirmation/Confirmation'));
const Login           = lazy(() => import('./pages/Auth/Login'));
const Register        = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword  = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/Auth/ResetPassword'));
const Account         = lazy(() => import('./pages/Account/Account'));
const History         = lazy(() => import('./pages/History/History'));
const Contact         = lazy(() => import('./pages/Contact/Contact'));
const About           = lazy(() => import('./pages/About/About'));
const FAQ             = lazy(() => import('./pages/FAQ/FAQ'));
const NotFound        = lazy(() => import('./pages/Error/NotFound'));
const AdminLayout       = lazy(() => import('./pages/Admin/AdminLayout'));
const ChauffeurLayout   = lazy(() => import('./pages/Chauffeur/ChauffeurLayout'));
const MentionsLegales   = lazy(() => import('./pages/Legal/MentionsLegales'));
const Confidentialite   = lazy(() => import('./pages/Legal/Confidentialite'));

const Loader = () => <div className="loader"><div className="spinner"/></div>;

function PrivateRoute({ children, adminOnly=false, chauffeurOnly=false }) {
  const { isLoggedIn, isAdmin, isChauffeur, loading } = useAuth();
  if (loading) return <Loader/>;
  if (!isLoggedIn) return <Navigate to="/login" replace/>;
  if (adminOnly    && !isAdmin)                  return <Navigate to="/" replace/>;
  if (chauffeurOnly && !isChauffeur && !isAdmin) return <Navigate to="/" replace/>;
  return children;
}

function PublicRoute({ children }) {
  const { isLoggedIn, isAdmin, isChauffeur, loading } = useAuth();
  if (loading) return <Loader/>;
  if (isLoggedIn) {
    if (isAdmin)     return <Navigate to="/admin"     replace/>;
    if (isChauffeur) return <Navigate to="/chauffeur" replace/>;
    return <Navigate to="/" replace/>;
  }
  return children;
}

function Layout({ children }) {
  return (<><Navbar/>{children}<Footer/><WhatsAppButton/></>);
}

function AuthLayout({ children }) {
  return (<><Navbar/>{children}</>);
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loader/>}>
      <Routes>
        {/* Pages publiques */}
        <Route path="/"        element={<Layout><Home/></Layout>}/>
        <Route path="/search"  element={<Layout><Search/></Layout>}/>
        <Route path="/about"   element={<Layout><About/></Layout>}/>
        <Route path="/contact" element={<Layout><Contact/></Layout>}/>
        <Route path="/faq"     element={<Layout><FAQ/></Layout>}/>

        {/* Auth — sans footer */}
        <Route path="/login"           element={<PublicRoute><AuthLayout><Login/></AuthLayout></PublicRoute>}/>
        <Route path="/register"        element={<PublicRoute><AuthLayout><Register/></AuthLayout></PublicRoute>}/>
        <Route path="/forgot-password" element={<AuthLayout><ForgotPassword/></AuthLayout>}/>
        <Route path="/reset-password"  element={<AuthLayout><ResetPassword/></AuthLayout>}/>

        {/* Client connecté */}
        <Route path="/booking/:id"      element={<PrivateRoute><Layout><Booking/></Layout></PrivateRoute>}/>
        <Route path="/confirmation/:id" element={<PrivateRoute><Layout><Confirmation/></Layout></PrivateRoute>}/>
        <Route path="/account"          element={<PrivateRoute><Layout><Account/></Layout></PrivateRoute>}/>
        <Route path="/history"          element={<PrivateRoute><Layout><History/></Layout></PrivateRoute>}/>

        {/* Admin */}
        <Route path="/admin/*"     element={<PrivateRoute adminOnly><AdminLayout/></PrivateRoute>}/>

        {/* Chauffeur */}
        <Route path="/chauffeur/*" element={<PrivateRoute chauffeurOnly><ChauffeurLayout/></PrivateRoute>}/>

        {/* Pages légales */}
        <Route path="/mentions-legales"  element={<Layout><MentionsLegales/></Layout>}/>
        <Route path="/confidentialite"   element={<Layout><Confidentialite/></Layout>}/>

        {/* 404 */}
        <Route path="*" element={<Layout><NotFound/></Layout>}/>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop/>
      <AuthProvider>
        <AppRoutes/>
      </AuthProvider>
    </BrowserRouter>
  );
}
