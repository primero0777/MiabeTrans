import { useState, useEffect, useRef } from 'react';
import { adminAPI, reservationsAPI } from '../../services/api';
import './AdminStats.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faPrint, faDownload, faSpinner, faUsers, faBus, faRoute, faIdCard, faTicket, faCircleCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function AdminStats() {
  const [stats, setStats]         = useState(null);
  const [reservations, setResa]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [periode, setPeriode]     = useState('mois');
  const reportRef = useRef();

  useEffect(() => {
    Promise.all([adminAPI.getStats(), reservationsAPI.getAll()])
      .then(([s, r]) => { setStats(s.data.data); setResa(r.data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Imprimer le rapport
  const handlePrint = () => {
    const printContent = reportRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
      <html><head><title>Rapport MiabeTrans</title>
      <style>
        /* ── Reset icônes FontAwesome : masquer les SVG, garder le texte ── */
        svg.svg-inline--fa, .svg-inline--fa {
          display: none !important;
        }

        body { font-family: Arial, sans-serif; padding: 24px 32px; color: #111; font-size: 13px; }
        h1 { color: #1B4332; border-bottom: 3px solid #F4A100; padding-bottom: 8px; font-size: 1.4rem; margin-bottom: 6px; }
        h2 { color: #1B4332; margin-top: 28px; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #1B4332; padding-left: 8px; }
        p  { color: #6b7280; font-size: 0.8rem; margin-bottom: 16px; }

        /* Masquer les éléments UI non pertinents pour l'impression */
        button, .btn, .admin-page-header > div:last-child { display: none !important; }

        /* KPI cards */
        .stats-cards, .kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 10px !important;
          margin: 12px 0 !important;
        }
        .stat-card, .kpi-card {
          background: #f0fdf4 !important;
          border: 1px solid #a7f3d0 !important;
          border-radius: 6px !important;
          padding: 10px !important;
          text-align: center !important;
          page-break-inside: avoid !important;
        }
        .stat-card-icon, .kpi-icon { display: none !important; }
        .stat-card-val, .kpi-value { font-size: 1.6rem !important; font-weight: 800 !important; color: #1B4332 !important; display: block !important; }
        .stat-card-label, .kpi-label { font-size: 0.75rem !important; color: #6b7280 !important; display: block !important; }

        /* Tableaux */
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.8rem; page-break-inside: auto; }
        thead { display: table-header-group; }
        th { background: #1B4332 !important; color: white !important; padding: 7px 10px; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        td { padding: 6px 10px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) td { background: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        tr { page-break-inside: avoid; }

        /* Badges */
        .badge { padding: 2px 8px !important; border-radius: 99px !important; font-size: 0.7rem !important; font-weight: 600 !important; }

        /* Footer */
        .print-footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 0.72rem; color: #9ca3af; text-align: center; }

        @page { margin: 1.5cm; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style></head>
      <body>
        ${printContent}
        <div class="print-footer">
          Rapport MiabeTrans &mdash; Généré le ${new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
          &mdash; contact@miabetrans.tg &mdash; Document confidentiel
        </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  // Générer PDF avec jsPDF
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const dateRapport = new Date().toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'});

      // Header
      doc.setFillColor(13, 43, 31);
      doc.rect(0, 0, 210, 38, 'F');
      doc.setTextColor(255,255,255);
      doc.setFont('helvetica','bold');
      doc.setFontSize(18);
      doc.text('MiabeTrans — Rapport de statistiques', 15, 18);
      doc.setFont('helvetica','normal');
      doc.setFontSize(9);
      doc.setTextColor(200,230,215);
      doc.text(`Généré le ${dateRapport}  |  contact@miabetrans.tg`, 15, 28);
      doc.text(`Période : ${periode === 'mois' ? 'Ce mois' : periode === 'semaine' ? 'Cette semaine' : 'Tout le temps'}`, 15, 34);

      // KPIs
      let y = 48;
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      doc.setTextColor(27,67,50);
      doc.text('Indicateurs clés', 15, y);
      y += 6;

      const kpiData = [
        ['Clients',           stats.total_utilisateurs],
        ['Bus actifs',        stats.total_bus],
        ['Trajets',           stats.total_trajets],
        ['Chauffeurs',        stats.total_chauffeurs],
        ['Réservations',      stats.total_reservations],
        ['Confirmées',        stats.reservations_confirmees],
        ['Annulées',          stats.reservations_annulees],
        ['Revenus (FCFA)',    parseInt(stats.revenus_total||0).toLocaleString('fr-FR')],
      ];

      kpiData.forEach((k, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = col === 0 ? 15 : 110;
        const rowY = y + row * 14;
        doc.setFillColor(col === 0 ? 240 : 244, col === 0 ? 253 : 249, col === 0 ? 244 : 253);
        doc.roundedRect(x, rowY, 90, 12, 2, 2, 'F');
        doc.setFont('helvetica','normal');
        doc.setFontSize(9);
        doc.setTextColor(107,114,128);
        doc.text(k[0], x + 4, rowY + 7.5);
        doc.setFont('helvetica','bold');
        doc.setTextColor(27,67,50);
        doc.text(String(k[1]), x + 86, rowY + 7.5, { align: 'right' });
      });

      // Tableau réservations récentes
      y += Math.ceil(kpiData.length/2) * 14 + 14;
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      doc.setTextColor(27,67,50);
      doc.text('Réservations récentes (20 dernières)', 15, y);
      y += 6;

      // En-têtes table
      doc.setFillColor(27,67,50);
      doc.rect(15, y, 180, 9, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(8);
      doc.setFont('helvetica','bold');
      ['#', 'Client', 'Trajet', 'Date départ', 'Prix', 'Statut'].forEach((h, i) => {
        const xs = [18, 28, 75, 120, 155, 170];
        doc.text(h, xs[i], y + 6);
      });
      y += 9;

      const recent = reservations.slice(0, 20);
      doc.setFont('helvetica','normal');
      doc.setFontSize(7.5);
      recent.forEach((r, i) => {
        if (i % 2 === 0) { doc.setFillColor(249,250,251); doc.rect(15, y, 180, 8, 'F'); }
        doc.setTextColor(50,50,50);
        doc.text('#'+r.id_reservation,           18, y + 5.5);
        doc.text((r.client||'').substring(0,18), 28, y + 5.5);
        doc.text(`${r.ville_depart}→${r.ville_arrivee}`.substring(0,22), 75, y + 5.5);
        doc.text(new Date(r.date_depart).toLocaleDateString('fr-FR'), 120, y + 5.5);
        doc.text(parseInt(r.prix).toLocaleString('fr-FR')+' F', 155, y + 5.5);
        const colors = {confirmée:[16,185,129], annulée:[239,68,68], en_attente:[245,158,11]};
        const [cr,cg,cb] = colors[r.statut_reservation] || [107,114,128];
        doc.setTextColor(cr,cg,cb);
        doc.text(r.statut_reservation, 170, y + 5.5);
        doc.setTextColor(50,50,50);
        y += 8;
        if (y > 270) { doc.addPage(); y = 15; }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(249,250,251);
        doc.rect(0, 285, 210, 12, 'F');
        doc.setFont('helvetica','normal');
        doc.setFontSize(7);
        doc.setTextColor(156,163,175);
        doc.text(`© ${new Date().getFullYear()} MiabeTrans — Document confidentiel — Page ${i} / ${pageCount}`, 105, 291, { align: 'center' });
      }

      doc.save(`Rapport_MiabeTrans_${dateRapport.replace(/ /g,'_')}.pdf`);
    } catch(err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF. Réessayez.');
    } finally { setPdfLoading(false); }
  };

  if (loading) return <div className="loader"><div className="spinner"/></div>;
  if (!stats)  return <div className="admin-page"><p>Erreur de chargement.</p></div>;

  const taux = stats.total_reservations > 0
    ? Math.round((stats.reservations_confirmees / stats.total_reservations) * 100) : 0;

  const kpis = [
    {icon:faUsers,        label:'Clients',      value:stats.total_utilisateurs,              color:'#10B981', bg:'#D1FAE5'},
    {icon:faBus,          label:'Bus',          value:stats.total_bus,                       color:'#3B82F6', bg:'#DBEAFE'},
    {icon:faRoute,        label:'Trajets',      value:stats.total_trajets,                   color:'#F59E0B', bg:'#FEF3C7'},
    {icon:faIdCard,       label:'Chauffeurs',   value:stats.total_chauffeurs,                color:'#8B5CF6', bg:'#EDE9FE'},
    {icon:faTicket,       label:'Réservations', value:stats.total_reservations,              color:'#6B7280', bg:'#F3F4F6'},
    {icon:faCircleCheck,  label:'Confirmées',   value:stats.reservations_confirmees,         color:'#10B981', bg:'#D1FAE5'},
    {icon:faXmark,        label:'Annulées',     value:stats.reservations_annulees,           color:'#EF4444', bg:'#FEE2E2'},
    {icon:null,           label:'Revenus FCFA', value:parseInt(stats.revenus_total||0).toLocaleString('fr-FR'), color:'#1B4332', bg:'#ECFDF5', text:'💰'},
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1><FontAwesomeIcon icon={faChartBar} /> Statistiques & Rapports</h1><p>Vue d'ensemble et exportation</p></div>
        <div style={{display:'flex',gap:'var(--space-sm)',alignItems:'center'}}>
          <select className="form-input" value={periode} onChange={e=>setPeriode(e.target.value)} style={{width:'140px'}}>
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois</option>
            <option value="tout">Tout le temps</option>
          </select>
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>
            <FontAwesomeIcon icon={faPrint} /> Imprimer
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> ...</> : <><FontAwesomeIcon icon={faDownload} /> Télécharger PDF</>}
          </button>
        </div>
      </div>

      {/* Contenu du rapport (référencé pour impression) */}
      <div ref={reportRef}>
        {/* Titre rapport */}
        <div className="report-title">
          <h2>Rapport de statistiques — MiabeTrans</h2>
          <p>Généré le {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
        </div>

        {/* KPIs */}
        <div className="stats-kpi-grid">
          {kpis.map((k,i)=>(
            <div key={i} className="stat-kpi-card">
              <div className="skc-icon" style={{background:k.bg, color:k.color}}>
                {k.icon ? <FontAwesomeIcon icon={k.icon} /> : k.text}
              </div>
              <div className="skc-val" style={{color:k.color}}>{k.value}</div>
              <div className="skc-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Taux de confirmation */}
        <div className="stats-section">
          <h3>📈 Taux de confirmation</h3>
          <div className="taux-bar-wrap">
            <div className="taux-bar-track">
              <div className="taux-bar-fill" style={{width:`${taux}%`}}/>
            </div>
            <span className="taux-val">{taux}%</span>
          </div>
          <p style={{fontSize:'0.85rem',color:'var(--gray-500)',marginTop:'8px'}}>
            {stats.reservations_confirmees} confirmées sur {stats.total_reservations} réservations totales
          </p>
        </div>

        {/* Tableau réservations récentes */}
        <div className="stats-section">
          <h3><FontAwesomeIcon icon={faTicket} /> Réservations récentes</h3>
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>Client</th><th>Trajet</th><th>Date départ</th><th>Prix</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {reservations.slice(0,20).map(r=>(
                    <tr key={r.id_reservation}>
                      <td style={{color:'var(--gray-400)'}}>#{r.id_reservation}</td>
                      <td><strong>{r.client}</strong></td>
                      <td>{r.ville_depart} → {r.ville_arrivee}</td>
                      <td style={{fontSize:'0.85rem'}}>{new Date(r.date_depart).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td style={{fontWeight:700,color:'var(--primary)'}}>{parseInt(r.prix).toLocaleString('fr-FR')} FCFA</td>
                      <td>
                        <span className={`badge ${r.statut_reservation==='confirmée'?'badge-success':r.statut_reservation==='annulée'?'badge-danger':'badge-warning'}`}>
                          {r.statut_reservation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="report-footer">
          © {new Date().getFullYear()} MiabeTrans — Lomé, Togo | contact@miabetrans.tg | +228 90 00 00 01
        </div>
      </div>
    </div>
  );
}
