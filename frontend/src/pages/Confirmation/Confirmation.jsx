import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationsAPI } from '../../services/api';
import { generateRecuPDF } from './generatePDF';
import './Confirmation.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBus, faCircleCheck, faPrint, faDownload, faClipboardList, faHouse, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';

function QRCode({ value, size = 160 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=0D2B1F&qzone=2&format=png`;
  return (
    <div className="qr-wrapper">
      <img src={url} alt="QR Code" className="qr-img"/>
      <p className="qr-hint">Scannez pour vérifier</p>
    </div>
  );
}

const PAYMENT_LABELS = { 'TMoney': 'Mixx By Yas', 'Flooz': 'Moov Money', 'Togocel': 'Togocom' };
const displayPayment = (mode) => PAYMENT_LABELS[mode] || mode;

export default function Confirmation() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [recu, setRecu]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    reservationsAPI.getRecu(id)
      .then(r => setRecu(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { await generateRecuPDF(recu); }
    catch(e) { console.error(e); alert('Erreur PDF. Utilisez Imprimer → Enregistrer en PDF.'); }
    finally { setPdfLoading(false); }
  };

  if (loading) return <div className="confirmation-page"><div className="loader"><div className="spinner"/><p>Chargement...</p></div></div>;

  if (error) return (
    <div className="confirmation-page">
      <div style={{textAlign:'center',padding:'var(--space-3xl)'}}>
        <div style={{fontSize:'3rem',marginBottom:'var(--space-md)'}}><FontAwesomeIcon icon={faXmark} /></div>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Retour</button>
      </div>
    </div>
  );

  const numero = recu.numero_recu || `MT-${String(recu.id_reservation).padStart(6,'0')}`;
  const qrData = `${numero}|${recu.ville_depart}->${recu.ville_arrivee}|${recu.client_email}`;

  return (
    <div className="confirmation-page">
      <div className="conf-banner">
        <div className="conf-check"><FontAwesomeIcon icon={faCircleCheck} /></div>
        <h1>Réservation confirmée !</h1>
        <p>Votre billet a été émis avec succès. Bon voyage !</p>
      </div>

      <div className="container conf-body">
        <div className="recu-card">
          <div className="recu-header">
            <div className="recu-brand">
              <span className="recu-logo"><FontAwesomeIcon icon={faBus} /></span>
              <div>
                <div className="recu-brand-name">MiabeTrans</div>
                <div className="recu-brand-sub">Transport Interurbain — Lomé, Togo</div>
              </div>
            </div>
            <div className="recu-meta">
              <div className="recu-numero">{numero}</div>
              <div className="recu-date">Émis le {new Date(recu.date_reservation).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
              <span className={`badge ${recu.statut_reservation==='confirmée'?'badge-success':'badge-warning'}`}>{recu.statut_reservation}</span>
            </div>
          </div>

          <div className="recu-trajet">
            <div className="recu-ville">
              <div className="rv-time">{new Date(recu.date_depart).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
              <div className="rv-name">{recu.ville_depart}</div>
              <div className="rv-date">{new Date(recu.date_depart).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
            </div>
            <div className="recu-trajet-mid">
              <div className="recu-bus-icon"><FontAwesomeIcon icon={faBus} /></div>
              <div className="recu-ligne"><div className="recu-ligne-bar"/></div>
              <div className="recu-distance">{recu.distance_km} km</div>
            </div>
            <div className="recu-ville recu-ville-right">
              <div className="rv-time">—</div>
              <div className="rv-name">{recu.ville_arrivee}</div>
              <div className="rv-date">Heure d'arrivée estimée</div>
            </div>
          </div>

          <div className="recu-infos">
            <div className="recu-section">
              <h4>Voyageur</h4>
              <div className="recu-row"><span>Nom</span><strong>{recu.client_prenom} {recu.client_nom}</strong></div>
              <div className="recu-row"><span>Email</span><strong>{recu.client_email}</strong></div>
              {recu.client_telephone && <div className="recu-row"><span>Tél.</span><strong>{recu.client_telephone}</strong></div>}
            </div>
            <div className="recu-section">
              <h4>Véhicule</h4>
              <div className="recu-row"><span>Bus</span><strong style={{fontFamily:'monospace'}}>{recu.numero_bus}</strong></div>
              <div className="recu-row"><span>Capacité</span><strong>{recu.capacite} places</strong></div>
              {recu.chauffeur_nom && <div className="recu-row"><span>Chauffeur</span><strong>{recu.chauffeur_nom}</strong></div>}
            </div>
            <div className="recu-section">
              <h4>Paiement</h4>
              <div className="recu-row"><span>Mode</span><strong>{displayPayment(recu.mode_paiement) || 'À la montée'}</strong></div>
              <div className="recu-row"><span>Montant</span><strong style={{color:'var(--primary)',fontSize:'1.1rem'}}>{parseInt(recu.prix).toLocaleString('fr-FR')} FCFA</strong></div>
            </div>
          </div>

          <div className="recu-perfore"/>

          <div className="recu-footer">
            <div className="recu-qr-section"><QRCode value={qrData} size={150}/></div>
            <div className="recu-instructions">
              <h4>Instructions</h4>
              <ul>
                <li>Présentez-vous <strong>30 min avant le départ</strong></li>
                <li>Munissez-vous de ce reçu (papier ou écran)</li>
                <li>Le QR code sera scanné à l'embarquement</li>
                <li>Assistance : <strong>+228 90 00 00 01</strong></li>
              </ul>
            </div>
            <div className="recu-stamp">
              <div className="stamp-circle"><span>VALIDÉ</span><span>MiabeTrans</span></div>
            </div>
          </div>
        </div>

        <div className="conf-actions">
          <button className="btn btn-primary btn-lg" onClick={handlePrint}><FontAwesomeIcon icon={faPrint} /> Imprimer</button>
          <button className="btn btn-accent btn-lg" onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Génération...</> : <><FontAwesomeIcon icon={faDownload} /> Télécharger PDF</>}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/history')}><FontAwesomeIcon icon={faClipboardList} /> Mes réservations</button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/')}><FontAwesomeIcon icon={faHouse} /> Accueil</button>
        </div>
      </div>
    </div>
  );
}
