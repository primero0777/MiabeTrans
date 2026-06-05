import { useNavigate } from 'react-router-dom';
import './NotFound.css';
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <div className="notfound-number">404</div>
        <h1>Page introuvable</h1>
        <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <div className="notfound-actions">
          <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>Page précédente</button>
        </div>
      </div>
    </div>
  );
}
