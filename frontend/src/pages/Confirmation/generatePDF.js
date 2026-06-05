// generatePDF.js - Génération PDF propre sans emojis (compatibilité maximale)

/**
 * Normalise une chaîne pour jsPDF (Helvetica ne supporte pas les accents UTF-8)
 * Remplace les caractères accentués par leurs équivalents ASCII
 */
function n(str) {
  if (!str) return '';
  return String(str)
    .replace(/[éèêë]/g, 'e').replace(/[ÉÈÊË]/g, 'E')
    .replace(/[àâä]/g,  'a').replace(/[ÀÂÄ]/g,  'A')
    .replace(/[ùûü]/g,  'u').replace(/[ÙÛÜ]/g,  'U')
    .replace(/[îï]/g,   'i').replace(/[ÎÏ]/g,   'I')
    .replace(/[ôö]/g,   'o').replace(/[ÔÖ]/g,   'O')
    .replace(/ç/g,      'c').replace(/Ç/g,      'C')
    .replace(/œ/g,      'oe').replace(/Œ/g,     'OE')
    .replace(/æ/g,      'ae').replace(/Æ/g,     'AE')
    .replace(/[^\x00-\x7E]/g, ''); // supprimer tout autre caractère non-ASCII
}

export async function generateRecuPDF(recu) {
  // Charger jsPDF si pas déjà chargé
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const numero = recu.numero_recu || `MT-${String(recu.id_reservation).padStart(6,'0')}`;
  const W = 210, margin = 15;

  // ── HEADER VERT ──────────────────────────────────────────
  doc.setFillColor(13, 43, 31);
  doc.rect(0, 0, W, 42, 'F');

  // Bande accent
  doc.setFillColor(244, 161, 0);
  doc.rect(0, 42, W, 2, 'F');

  // Logo texte
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('MiabeTrans', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 220, 200);
  doc.text('Transport Interurbain - Lome, Togo', margin, 24);
  doc.text('contact@miabetrans.tg  |  +228 90 00 00 01', margin, 30);

  // Numero recu (droite)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(244, 161, 0);
  doc.text(numero, W - margin, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 220, 200);
  doc.text('Recu de reservation', W - margin, 24, { align: 'right' });
  doc.text('Emis le ' + new Date(recu.date_reservation).toLocaleDateString('fr-FR'), W - margin, 30, { align: 'right' });

  // ── BADGE STATUT ──────────────────────────────────────────
  let y = 52;
  const isConfirmed = recu.statut_reservation === 'confirmee' || recu.statut_reservation === 'confirmée';
  doc.setFillColor(...(isConfirmed ? [16, 185, 129] : [239, 68, 68]));
  doc.roundedRect(margin, y, 38, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(n(recu.statut_reservation).toUpperCase(), margin + 19, y + 5.5, { align: 'center' });

  // ── BLOC TRAJET ──────────────────────────────────────────
  y = 68;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, y, W - 2*margin, 32, 4, 4, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, W - 2*margin, 32, 4, 4, 'S');

  // Ville depart
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(13, 43, 31);
  doc.text(n(recu.ville_depart), margin + 8, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 150, 120);
  doc.text('DEPART', margin + 8, y + 22);

  const heure = new Date(recu.date_depart).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(244, 161, 0);
  doc.text(heure, margin + 8, y + 28);

  // Milieu
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(70, y + 16, 140, y + 16);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(recu.distance_km + ' km', W/2, y + 22, { align: 'center' });

  // Triangle fleche
  doc.setFillColor(16, 185, 129);
  doc.triangle(138, y+13, 133, y+10, 133, y+16, 'F');

  // Ville arrivee
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(13, 43, 31);
  doc.text(n(recu.ville_arrivee), W - margin - 8, y + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 150, 120);
  doc.text('ARRIVEE', W - margin - 8, y + 22, { align: 'right' });

  // ── SECTION INFOS ──────────────────────────────────────────
  y = 108;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(13, 43, 31);
  doc.text('INFORMATIONS DU VOYAGE', margin, y);

  // Ligne decorative
  doc.setDrawColor(13, 43, 31);
  doc.setLineWidth(0.5);
  doc.line(margin, y+2, margin+55, y+2);

  y += 8;

  // Formatage date en ASCII (pas de caractères accentués)
  const dateStr = new Date(recu.date_depart).toLocaleDateString('fr-FR', {
    weekday:'long', day:'numeric', month:'long', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });

  const rows = [
    ['Date de depart',   n(dateStr)],
    ['Numero de bus',    n(recu.numero_bus) || '-'],
    ['Chauffeur',        n(recu.chauffeur_nom) || 'Non renseigne'],
    ['Voyageur',         n(((recu.client_prenom||'') + ' ' + (recu.client_nom||'')).trim())],
    ['Email',            n(recu.client_email) || '-'],
    ['Telephone',        n(recu.client_telephone) || '-'],
    ['Mode de paiement', n({'TMoney':'Mixx By Yas','Flooz':'Moov Money'}[recu.mode_paiement] || recu.mode_paiement) || 'A la montee'],
  ];

  rows.forEach((row, i) => {
    const rowY = y + i * 9;
    // Fond alterné
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY - 3, W - 2*margin, 9, 'F');
    }
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(n(row[0]), margin + 3, rowY + 3);
    // Valeur
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    // Normaliser + tronquer si trop long
    const valStr = n(String(row[1]));
    const maxLen = 45;
    doc.text(valStr.length > maxLen ? valStr.substring(0, maxLen)+'...' : valStr, W/2, rowY + 3);
  });

  // ── MONTANT TOTAL ──────────────────────────────────────────
  y = y + rows.length * 9 + 6;
  doc.setFillColor(13, 43, 31);
  doc.roundedRect(margin, y, W - 2*margin, 14, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('MONTANT TOTAL', margin + 6, y + 9);

  doc.setFontSize(14);
  doc.setTextColor(244, 161, 0);
  const prixStr = parseInt(recu.prix).toLocaleString('fr-FR') + ' FCFA';
  doc.text(prixStr, W - margin - 4, y + 9, { align: 'right' });

  // ── LIGNE POINTILLEE ──────────────────────────────────────
  y += 20;
  doc.setLineDashPattern([3, 2], 0);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, y, W - margin, y);
  doc.setLineDashPattern([], 0);

  // Cercles aux extremites
  doc.setFillColor(249, 250, 251);
  doc.circle(margin - 4, y, 4, 'FD');
  doc.circle(W - margin + 4, y, 4, 'FD');

  // ── QR CODE + INSTRUCTIONS ──────────────────────────────
  y += 8;

  // Essayer de charger le QR code
  try {
    const qrVal = encodeURIComponent(numero + '|' + recu.ville_depart + '->' + recu.ville_arrivee + '|' + recu.client_email);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrVal}&bgcolor=ffffff&color=0D2B1F&qzone=1&format=png`;
    const img = new Image(); img.crossOrigin = 'anonymous';
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = qrUrl; });
    if (img.complete && img.naturalWidth > 0) {
      const c = document.createElement('canvas'); c.width=80; c.height=80;
      c.getContext('2d').drawImage(img,0,0);
      doc.addImage(c.toDataURL('image/png'), 'PNG', margin, y, 28, 28);
    }
  } catch {}

  // Instructions (a droite du QR)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(13, 43, 31);
  doc.text('INSTRUCTIONS', margin + 34, y + 5);

  const instructions = [
    'Presentez-vous 30 min avant le depart',
    'Munissez-vous de ce recu (papier ou ecran)',
    'Le QR code sera scanne a l\'embarquement',
    'Assistance : +228 90 00 00 01',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  instructions.forEach((inst, i) => {
    doc.text('- ' + inst, margin + 34, y + 12 + i * 6);
  });

  // Tampon VALIDE
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.5);
  doc.circle(W - margin - 14, y + 14, 14, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129);
  doc.text('VALIDE', W - margin - 14, y + 12, { align: 'center' });
  doc.setFontSize(6);
  doc.text('MiabeTrans', W - margin - 14, y + 18, { align: 'center' });

  // ── FOOTER ──────────────────────────────────────────────
  const footerY = 287;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY - 3, W, 15, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(0, footerY - 3, W, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text('(c) 2026 MiabeTrans - Lome, Togo  |  contact@miabetrans.tg  |  +228 90 00 00 01', W/2, footerY + 2, { align: 'center' });
  doc.text('Ce document est votre titre de transport. Conservez-le jusqu\'a destination.', W/2, footerY + 7, { align: 'center' });

  doc.save(`Recu_MiabeTrans_${numero}.pdf`);
}

export async function generateRapportPDF(stats, reservations) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 15;
  const dateRapport = n(new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}));

  // Header
  doc.setFillColor(13, 43, 31);
  doc.rect(0, 0, W, 38, 'F');
  doc.setFillColor(244, 161, 0);
  doc.rect(0, 38, W, 2, 'F');

  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.text('MiabeTrans - Rapport de statistiques', margin, 16);
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(180,220,200);
  doc.text('Genere le ' + dateRapport + '  |  contact@miabetrans.tg', margin, 25);
  doc.text('Document confidentiel - Usage interne', margin, 32);

  // KPIs en grille
  let y = 50;
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.setTextColor(13,43,31);
  doc.text('INDICATEURS CLES', margin, y);
  doc.setDrawColor(13,43,31);
  doc.setLineWidth(0.5);
  doc.line(margin, y+2, margin+45, y+2);
  y += 8;

  const PDF_ICONS = {
    users:  '[C]',
    bus:    '[B]',
    route:  '[T]',
    driver: '[D]',
    ticket: '[R]',
    check:  '[+]',
    cross:  '[-]',
    money:  '[$]',
  };

  const kpiData = [
    [PDF_ICONS.users,  'Clients actifs',     stats.total_utilisateurs,                                   [16,185,129]],
    [PDF_ICONS.bus,    'Bus dans la flotte', stats.total_bus,                                            [59,130,246]],
    [PDF_ICONS.route,  'Trajets',            stats.total_trajets,                                        [245,158,11]],
    [PDF_ICONS.driver, 'Chauffeurs',         stats.total_chauffeurs,                                     [139,92,246]],
    [PDF_ICONS.ticket, 'Reservations',       stats.total_reservations,                                   [107,114,128]],
    [PDF_ICONS.check,  'Confirmees',         stats.reservations_confirmees,                              [16,185,129]],
    [PDF_ICONS.cross,  'Annulees',           stats.reservations_annulees,                                [239,68,68]],
    [PDF_ICONS.money,  'Revenus (FCFA)',      parseInt(stats.revenus_total||0).toLocaleString('fr-FR'),   [13,43,31]],
  ];

  kpiData.forEach((k, i) => {
    const col = i % 2, row = Math.floor(i/2);
    const x = col === 0 ? margin : margin + 95;
    const ky = y + row * 18;

    // Fond de la card
    doc.setFillColor(248,250,252);
    doc.roundedRect(x, ky, 88, 16, 2, 2, 'F');

    // Bande colorée gauche
    doc.setFillColor(...k[3]);
    doc.roundedRect(x, ky, 3, 16, 1, 1, 'F');

    // Icone ASCII
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.setTextColor(...k[3]);
    doc.text(k[0], x + 5, ky + 10);

    // Label
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(107,114,128);
    doc.text(n(k[1]), x + 14, ky + 6);

    // Valeur
    doc.setFont('helvetica','bold');
    doc.setFontSize(13);
    doc.setTextColor(...k[3]);
    doc.text(String(k[2]), x + 14, ky + 13);
  });

  // Taux de confirmation
  y = y + Math.ceil(kpiData.length/2)*18 + 12;
  const taux = stats.total_reservations > 0
    ? Math.round((stats.reservations_confirmees/stats.total_reservations)*100) : 0;

  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.setTextColor(13,43,31);
  doc.text('TAUX DE CONFIRMATION : ' + taux + '%', margin, y);

  doc.setFillColor(229,231,235);
  doc.roundedRect(margin, y+3, W-2*margin, 7, 2, 2, 'F');
  doc.setFillColor(16,185,129);
  doc.roundedRect(margin, y+3, Math.max(1,(W-2*margin)*taux/100), 7, 2, 2, 'F');

  // Tableau reservations
  y += 18;
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.setTextColor(13,43,31);
  doc.text('RESERVATIONS RECENTES', margin, y);
  doc.line(margin, y+2, margin+55, y+2);
  y += 7;

  // En-tetes
  doc.setFillColor(13,43,31);
  doc.rect(margin, y, W-2*margin, 8, 'F');
  const headers = ['#','Client','Trajet','Date','Prix','Statut'];
  const colX    = [margin+2, margin+12, margin+55, margin+105, margin+140, margin+163];
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(7.5);
  headers.forEach((h,i) => doc.text(h, colX[i], y+5.5));
  y += 8;

  const list = (reservations||[]).slice(0,25);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);

  list.forEach((r, i) => {
    if (y > 268) { doc.addPage(); y = 15; }
    if (i%2===0) { doc.setFillColor(248,250,252); doc.rect(margin,y,W-2*margin,8,'F'); }

    doc.setTextColor(50,50,50);
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);

    doc.text('#'+r.id_reservation, colX[0], y+5.5);

    const nom = (r.client||'').substring(0,18);
    doc.text(nom, colX[1], y+5.5);

    // Trajet avec flèche Unicode
    const trajet = `${r.ville_depart||''} > ${r.ville_arrivee||''}`.substring(0,24);
    doc.text(trajet, colX[2], y+5.5);

    doc.text(new Date(r.date_depart).toLocaleDateString('fr-FR'), colX[3], y+5.5);
    doc.text(parseInt(r.prix).toLocaleString('fr-FR')+' F', colX[4], y+5.5);

    // Badge statut
    const sc = {
      'confirmée':  { color:[16,185,129],  label:'[OK] confirme' },
      'confirmee':  { color:[16,185,129],  label:'[OK] confirme' },
      'annulée':    { color:[239,68,68],   label:'[X] annule'    },
      'annulee':    { color:[239,68,68],   label:'[X] annule'    },
      'en_attente': { color:[245,158,11],  label:'[~] attente'   },
    };
    const s = sc[r.statut_reservation] || { color:[107,114,128], label: n(r.statut_reservation||'-') };
    doc.setTextColor(...s.color);
    doc.setFont('helvetica','bold');
    doc.text(s.label, colX[5], y+5.5);

    doc.setTextColor(50,50,50);
    y += 8;
  });

  // Footer toutes pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i=1; i<=pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248,250,252);
    doc.rect(0,283,W,14,'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(7);
    doc.setTextColor(156,163,175);
    doc.text(`(c) 2026 MiabeTrans - Document confidentiel - Page ${i}/${pageCount}`, W/2, 289, {align:'center'});
    doc.text('contact@miabetrans.tg  |  +228 90 00 00 01  |  Lome, Togo', W/2, 294, {align:'center'});
  }

  doc.save(`Rapport_MiabeTrans_${dateRapport.replace(/ /g,'_')}.pdf`);
}
