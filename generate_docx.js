// Génération du cahier des charges MiabeTrans en .docx
const path = require('path');
const fs = require('fs');

const globalNodeModules = 'C:\\Users\\ephra\\AppData\\Roaming\\npm\\node_modules';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  ExternalHyperlink, InternalHyperlink, Bookmark,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition,
} = require(path.join(globalNodeModules, 'docx'));

// =====================================
//  Constants & helpers
// =====================================
const PRIMARY = '1E40AF';
const SECONDARY = 'F97316';
const GREY_BG = 'F1F5F9';
const HEAD_BG = 'D5E8F0';
const BORDER_GREY = 'CCCCCC';

// A4 portrait : 11906 x 16838 DXA. Marges 1 inch (1440 DXA).
const A4_WIDTH = 11906;
const PAGE_MARGIN = 1440;
const CONTENT_WIDTH = A4_WIDTH - 2 * PAGE_MARGIN; // 9026

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: BORDER_GREY };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: opts.spacing || { before: 60, after: 60 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size, color: opts.color })],
  });
}

function pRich(runs, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: opts.spacing || { before: 60, after: 60 },
    children: runs,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    children: [new TextRun({ text, bold: true, color: PRIMARY, size: 32 })],
    spacing: { before: 240, after: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: PRIMARY, size: 26 })],
    spacing: { before: 200, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, color: '111827', size: 22 })],
    spacing: { before: 160, after: 80 },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: [new TextRun({ text, size: 22 })],
    spacing: { before: 40, after: 40 },
  });
}

function bulletRich(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: runs,
    spacing: { before: 40, after: 40 },
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    children: [new TextRun({ text, size: 22 })],
    spacing: { before: 40, after: 40 },
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: 60, after: 60 } });
}

function code(text) {
  // Each line as separate paragraph because no \n in TextRun
  const lines = text.split('\n');
  return lines.map((line) =>
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: GREY_BG },
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 18 })],
    })
  );
}

// Build a table from header + rows. columnWidthsRatios sum to 1.
function makeTable(headers, rows, ratios) {
  const widths = ratios.map((r) => Math.round(CONTENT_WIDTH * r));
  // Adjust to sum exactly
  const diff = CONTENT_WIDTH - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += diff;

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((text, i) =>
      new TableCell({
        borders: cellBorders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: HEAD_BG },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
      })
    ),
  });

  const bodyRows = rows.map((row, rIdx) =>
    new TableRow({
      children: row.map((cellContent, i) => {
        // cellContent can be string or array of strings (multi-line)
        const lines = Array.isArray(cellContent) ? cellContent : [cellContent];
        return new TableCell({
          borders: cellBorders,
          width: { size: widths[i], type: WidthType.DXA },
          shading: rIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: 'FAFAFA' } : undefined,
          margins: cellMargins,
          children: lines.map((l) =>
            new Paragraph({ children: [new TextRun({ text: String(l), size: 20 })], spacing: { before: 20, after: 20 } })
          ),
        });
      }),
    })
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

// Title page
function titlePage() {
  return [
    new Paragraph({ children: [new TextRun('')], spacing: { before: 2000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'CAHIER DES CHARGES', bold: true, color: PRIMARY, size: 56 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'MIABETRANS', bold: true, color: SECONDARY, size: 72 })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Plateforme de réservation de trajets interurbains au Togo', italics: true, size: 28, color: '6B7280' })],
      spacing: { after: 1200 },
    }),
    makeTable(
      ['', ''],
      [
        ['Projet', 'MiabeTrans'],
        ['Type', 'Application web SPA + API REST'],
        ['Version document', '2.0'],
        ['Date', '2026-05-01'],
        ['Auteur', 'Ephraïm NATO'],
        ['Statut', 'Document de référence'],
      ],
      [0.35, 0.65]
    ),
    new Paragraph({ children: [new TextRun('')], spacing: { before: 1600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Document confidentiel', italics: true, size: 18, color: '9CA3AF' })],
    }),
  ];
}

// =====================================
//  CONTENT BUILDERS
// =====================================
const content = [];

// ----- Title page -----
content.push(...titlePage());

// ----- Sommaire (TOC) -----
content.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun('')] }));
content.push(new Paragraph({
  alignment: AlignmentType.LEFT,
  children: [new TextRun({ text: 'SOMMAIRE', bold: true, color: PRIMARY, size: 36 })],
  spacing: { after: 240 },
}));
content.push(new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-3' }));

// ----- Section 1 -----
content.push(h1('1. Présentation générale du projet'));

content.push(h2('1.1. Identité du projet'));
content.push(p('MiabeTrans est une plateforme web full-stack destinée à digitaliser la réservation de trajets en bus interurbains au Togo. Le nom « Miabe » (en éwé : « venez » / « bienvenue ») reflète une volonté d\'accessibilité et d\'accueil au cœur du service.'));

content.push(h2('1.2. Vision'));
content.push(p('Devenir la référence numérique du transport interurbain au Togo, puis dans la sous-région ouest-africaine, en offrant aux voyageurs une expérience de réservation simple, sécurisée et 100 % mobile, et aux opérateurs un outil de gestion centralisé de leur activité.'));

content.push(h2('1.3. Mission'));
content.push(bullet('Pour les voyageurs : permettre la réservation et le paiement d\'un trajet en moins de 2 minutes, depuis n\'importe où.'));
content.push(bullet('Pour les opérateurs : digitaliser la gestion de la flotte, des chauffeurs, des horaires et des paiements.'));
content.push(bullet('Pour l\'écosystème : produire de la donnée structurée sur la mobilité interurbaine togolaise.'));

content.push(h2('1.4. Valeurs de marque'));
content.push(makeTable(
  ['Valeur', 'Traduction concrète'],
  [
    ['Simplicité', 'Parcours de réservation en 4 clics maximum'],
    ['Confiance', 'Reçu numérique, référence unique, traçabilité complète'],
    ['Proximité', 'Interface en français, support WhatsApp, paiement mobile money local'],
    ['Modernité', 'Stack web 2025 (React 19, API REST, JWT)'],
  ],
  [0.25, 0.75]
));

// ----- Section 2 -----
content.push(h1('2. Contexte & étude de l\'existant'));

content.push(h2('2.1. Contexte sectoriel'));
content.push(p('Le transport interurbain au Togo est dominé par des compagnies privées dont la commercialisation est presque exclusivement physique : achat de tickets en gare, file d\'attente, espèces. Le taux de pénétration mobile (~85 %) et l\'usage massif des solutions de mobile money (Mixx By Yas, Flooz) créent un terrain favorable à la digitalisation.'));

content.push(h2('2.2. Problèmes adressés'));
content.push(makeTable(
  ['Problème', 'Impact actuel', 'Solution MiabeTrans'],
  [
    ['Files d\'attente en gare', 'Perte de temps des voyageurs', 'Réservation en ligne 24/7'],
    ['Indisponibilité visible des places', 'Voyageurs revenant bredouilles', 'Affichage temps réel des places'],
    ['Doubles assignations bus / chauffeur', 'Conflits opérationnels en gare', 'Détection automatique ±3h'],
    ['Pas de reçu standardisé', 'Aucune preuve d\'achat fiable', 'Reçu PDF + référence MT-XXXXXX-AAAA'],
    ['Communication chauffeurs ↔ direction', 'Coups de fil manuels', 'Notifications email automatiques'],
  ],
  [0.3, 0.35, 0.35]
));

content.push(h2('2.3. Étude rapide de la concurrence'));
content.push(makeTable(
  ['Acteur', 'Couverture', 'Réservation en ligne', 'Paiement mobile', 'Multi-opérateurs'],
  [
    ['Compagnies traditionnelles (gares)', 'Forte', 'Non', 'Non', 'Non'],
    ['Solutions panafricaines', 'Partielle Togo', 'Oui', 'Oui', 'Oui'],
    ['MiabeTrans', 'Togo V1, Afrique Ouest V3', 'Oui', 'V1 simulé', 'Non V1 / V2 cible'],
  ],
  [0.25, 0.2, 0.2, 0.15, 0.2]
));

content.push(h2('2.4. Analyse SWOT'));
content.push(makeTable(
  ['Forces', 'Faiblesses'],
  [
    ['Stack moderne et maintenable (React 19, REST API, JWT)', 'Paiement uniquement simulé en V1'],
    ['Détection automatique des conflits d\'assignation', 'Dépendance à un compte SMTP Gmail personnel'],
    ['Couverture des 10 principales villes du Togo', 'Pas encore de version mobile native'],
    ['Notifications email transactionnelles complètes', 'Pas de rate limiting / monitoring en V1'],
  ],
  [0.5, 0.5]
));
content.push(spacer());
content.push(makeTable(
  ['Opportunités', 'Menaces'],
  [
    ['Croissance du e-commerce et du mobile money', 'Concurrence d\'agrégateurs régionaux établis'],
    ['Possibilité d\'agréger plusieurs compagnies', 'Réticence d\'opérateurs traditionnels'],
    ['Extension UEMOA (Bénin, Burkina, Côte d\'Ivoire)', 'Réglementation transports en évolution'],
    ['Données mobilité monétisables (B2B, État)', 'Risque de fraude sur paiement simulé'],
  ],
  [0.5, 0.5]
));

// ----- Section 3 -----
content.push(h1('3. Objectifs & enjeux'));

content.push(h2('3.1. Objectifs SMART'));
content.push(makeTable(
  ['Code', 'Objectif', 'Indicateur', 'Cible', 'Échéance'],
  [
    ['OBJ-01', 'Réduire le temps de réservation', 'Temps moyen', '< 2 min', 'V1'],
    ['OBJ-02', 'Atteindre la disponibilité 24/7', 'Taux d\'uptime', '≥ 99 %', 'V1 + 3 mois'],
    ['OBJ-03', 'Garantir la traçabilité des paiements', '% reçus émis', '100 %', 'V1'],
    ['OBJ-04', 'Supprimer les conflits d\'assignation', 'Conflits non détectés', '0', 'V1'],
    ['OBJ-05', 'Convertir en clients enregistrés', 'Visiteur → inscrit', '≥ 25 %', 'V1 + 6 mois'],
    ['OBJ-06', 'Volume de réservations', 'Mensuel', '1 000', 'V1 + 12 mois'],
  ],
  [0.1, 0.3, 0.2, 0.15, 0.25]
));

content.push(h2('3.2. Enjeux'));
content.push(bullet('Économique : ouvrir un canal de vente complémentaire pour les opérateurs.'));
content.push(bullet('Opérationnel : fiabiliser les assignations et l\'information voyageur.'));
content.push(bullet('Stratégique : poser la première brique d\'une plateforme de mobilité régionale.'));
content.push(bullet('Image : positionner le Togo comme territoire d\'innovation en transport.'));

// ----- Section 4 -----
content.push(h1('4. Périmètre du projet'));

content.push(h2('4.1. Inclus en V1'));
[
  'Site web responsive (desktop / tablette / mobile).',
  'Espace public : accueil, recherche, détail trajet, FAQ, contact, à propos.',
  'Espace authentifié : réservation, paiement (simulé), historique, profil.',
  'Espace administrateur : CRUD complet, assignation horaires, dashboard.',
  'Espace chauffeur : trajets affectés et passagers attendus.',
  'Notifications email transactionnelles (PHPMailer SMTP).',
  'Authentification JWT + OTP par email.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('4.2. Exclus de la V1'));
[
  'Application mobile native iOS / Android.',
  'Intégration des passerelles de paiement réelles.',
  'Géolocalisation temps réel des bus.',
  'Système d\'avis / notation publique.',
  'Multi-langue.',
  'Marketplace multi-opérateurs.',
  'Rappels SMS automatiques.',
  'Programme de fidélité.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('4.3. Hors périmètre permanent'));
[
  'Vente de billets pour d\'autres modes (avion, train, taxi).',
  'Assurance voyage intégrée.',
  'Logistique colis / fret.',
].forEach((t) => content.push(bullet(t)));

// ----- Section 5 -----
content.push(h1('5. Acteurs, rôles & personas'));

content.push(h2('5.1. Matrice des rôles applicatifs'));
content.push(makeTable(
  ['Rôle', 'Code BDD', 'Authentifié', 'Description', 'Périmètre'],
  [
    ['Visiteur', '—', 'Non', 'Internaute non inscrit', 'Recherche, consultation, inscription'],
    ['Client', 'id_role = 2 (défaut)', 'Oui', 'Voyageur enregistré', 'Réservation, paiement, historique'],
    ['Chauffeur', 'id_role = 3', 'Oui', 'Conducteur affecté à un bus', 'Consultation trajets et passagers'],
    ['Administrateur', 'id_role = 1', 'Oui', 'Gestionnaire plateforme', 'Tout'],
  ],
  [0.18, 0.18, 0.12, 0.22, 0.3]
));

content.push(h2('5.2. Persona — Kossi, le voyageur étudiant'));
content.push(p('22 ans, étudiant à Lomé, originaire de Kara. Voyage 1 fois/mois pour rentrer en famille.'));
content.push(bullet('Smartphone Android entrée de gamme, connexion 4G intermittente.'));
content.push(bullet('Paie avec Mixx By Yas, jamais en carte bancaire.'));
content.push(bullet('Frustrations : files d\'attente du vendredi soir, ne sait jamais s\'il restera des places.'));
content.push(bullet('Attentes : interface mobile rapide, paiement mobile money simple, reçu sur WhatsApp.'));

content.push(h2('5.3. Persona — Ama, l\'entrepreneure'));
content.push(p('35 ans, dirige une boutique à Lomé, voyage régulièrement à Kpalimé pour son approvisionnement.'));
content.push(bullet('Smartphone milieu de gamme, à l\'aise avec les apps.'));
content.push(bullet('Paie indifféremment par mobile money ou carte bancaire.'));
content.push(bullet('Frustrations : pas de visibilité sur les horaires à l\'avance.'));
content.push(bullet('Attentes : pouvoir réserver la veille, recevoir une confirmation par email, télécharger un reçu pour sa comptabilité.'));

content.push(h2('5.4. Persona — Kofi, le chauffeur'));
content.push(p('42 ans, chauffeur depuis 15 ans, basé à la gare routière.'));
content.push(bullet('Smartphone basique, peu à l\'aise avec les applications complexes.'));
content.push(bullet('Frustrations : être prévenu en dernière minute d\'un trajet.'));
content.push(bullet('Attentes : voir clairement ses trajets de la semaine et la liste de ses passagers.'));

content.push(h2('5.5. Persona — Madame Adjo, l\'administratrice'));
content.push(p('38 ans, responsable d\'exploitation chez l\'opérateur partenaire.'));
content.push(bullet('Travaille sur ordinateur la majeure partie du temps.'));
content.push(bullet('Frustrations : tableaux Excel multiples, doubles affectations, suivi manuel des paiements.'));
content.push(bullet('Attentes : un outil unique pour gérer flotte, chauffeurs, horaires et voir les revenus du mois.'));

// ----- Section 6 -----
content.push(h1('6. Parcours utilisateurs'));

content.push(h2('6.1. Parcours voyageur — Réserver un trajet'));
content.push(...code(
`[Accueil] → [Recherche : Lomé → Kara, 15 mai]
   → [Liste horaires + places restantes]
   → [Détail horaire]
   → [Connexion ou Inscription]
       └─ Inscription : email → OTP 6 chiffres → mot de passe
   → [Sélection mode de paiement]
   → [Création réservation : statut "en_attente"]
   → [Email avec référence à composer]
   → [Saisie de la référence sur la plateforme]
   → [Validation paiement → statut "confirmée"]
   → [Reçu PDF + email confirmation]`));

content.push(p('Points de friction à minimiser :', { bold: true }));
content.push(bullet('Délai entre création de la réservation et paiement effectif.'));
content.push(bullet('Reconnexion mobile/desktop pour saisir la référence.'));
content.push(bullet('Lecture/saisie correcte de la référence depuis l\'email.'));

content.push(h2('6.2. Parcours administrateur — Créer un horaire'));
content.push(...code(
`[Login admin] → [Dashboard] → [Assignations]
   → [Sélection trajet : Lomé → Kara]
   → [Sélection bus disponible (filtre auto)]
   → [Date/heure de départ]
   → Vérification automatique de conflits (±3h)
       ├─ Aucun conflit : création immédiate
       └─ Conflit détecté : alerte + option "Forcer"
   → [Notification email automatique au chauffeur]
   → [Horaire visible côté public]`));

content.push(h2('6.3. Parcours chauffeur — Préparer son trajet'));
content.push(...code(
`[Email "Vous avez un nouveau trajet"]
   → [Login chauffeur]
   → [Liste de mes trajets]
   → [Sélection horaire]
   → [Vue passagers réservés]
   → [Préparation du voyage]`));

content.push(h2('6.4. Parcours mot de passe oublié'));
content.push(...code(
`[Login] → [Mot de passe oublié ?]
   → [Saisie email]
   → [Email avec lien de reset (token 64 chars, 1h)]
   → [Page reset : nouveau mot de passe]
   → [Confirmation + redirection login]`));

// ----- Section 7 -----
content.push(h1('7. Exigences fonctionnelles détaillées'));

content.push(p('Convention de notation des priorités (méthode MoSCoW) : MUST = indispensable V1, SHOULD = important, COULD = bonus, WON\'T = hors scope V1.', { italics: true }));

content.push(h2('7.1. Module Authentification'));
content.push(makeTable(
  ['Réf', 'Exigence', 'Priorité'],
  [
    ['AUTH-01', 'Inscription par email avec OTP (6 chiffres, 10 min, 5 tentatives max)', 'MUST'],
    ['AUTH-02', 'Connexion email + mot de passe → JWT HS256, 24h', 'MUST'],
    ['AUTH-03', 'Hachage bcrypt des mots de passe (cost ≥ 10)', 'MUST'],
    ['AUTH-04', 'Mot de passe oublié → token 64 chars, 1h, usage unique', 'MUST'],
    ['AUTH-05', 'Modification du profil (nom, prénom, email, téléphone, mot de passe)', 'MUST'],
    ['AUTH-06', 'Vérification de l\'ancien mot de passe avant modification', 'MUST'],
    ['AUTH-07', 'Déconnexion automatique sur 401', 'MUST'],
    ['AUTH-08', 'Soft delete des comptes (deleted_at)', 'SHOULD'],
    ['AUTH-09', 'Re-envoi d\'OTP avec cooldown 60s', 'SHOULD'],
    ['AUTH-10', 'Authentification à 2 facteurs persistante', 'COULD'],
    ['AUTH-11', 'Connexion via Google / Apple', 'WON\'T (V1)'],
  ],
  [0.12, 0.68, 0.2]
));

content.push(h2('7.2. Module Catalogue & recherche'));
content.push(makeTable(
  ['Réf', 'Exigence', 'Priorité'],
  [
    ['SRCH-01', 'Recherche d\'horaires par ville de départ, ville d\'arrivée et date', 'MUST'],
    ['SRCH-02', 'Affichage en temps réel des places restantes par horaire', 'MUST'],
    ['SRCH-03', 'Affichage prix, distance, bus, chauffeur', 'MUST'],
    ['SRCH-04', 'Page détail horaire complète', 'MUST'],
    ['SRCH-05', 'Pages institutionnelles (Accueil, À propos, FAQ, Contact)', 'MUST'],
    ['SRCH-06', 'Filtres avancés : tranche horaire, prix, places minimum', 'SHOULD'],
    ['SRCH-07', 'Tri (prix, heure départ, places restantes)', 'SHOULD'],
    ['SRCH-08', 'Pagination ou scroll infini sur résultats', 'SHOULD'],
    ['SRCH-09', 'Suggestions « Trajets populaires » sur l\'accueil', 'COULD'],
  ],
  [0.12, 0.68, 0.2]
));

content.push(h2('7.3. Module Réservation'));
content.push(makeTable(
  ['Réf', 'Exigence', 'Priorité'],
  [
    ['RES-01', 'Création réservation au statut en_attente avec mode de paiement', 'MUST'],
    ['RES-02', 'Numéro de reçu auto au format MT-XXXXXX-AAAA (trigger BDD)', 'MUST'],
    ['RES-03', 'Délai d\'expiration selon le mode (30/20/45 min)', 'MUST'],
    ['RES-04', 'Simulation paiement → génération référence + email', 'MUST'],
    ['RES-05', 'Validation paiement par saisie de la référence', 'MUST'],
    ['RES-06', 'Email de confirmation', 'MUST'],
    ['RES-07', 'Téléchargement du reçu en PDF', 'MUST'],
    ['RES-08', 'Annulation par le client (sous conditions de délai)', 'MUST'],
    ['RES-09', 'Annulation par admin avec raison + email client', 'MUST'],
    ['RES-10', 'Historique des réservations du client', 'MUST'],
    ['RES-11', 'Affichage du compte à rebours d\'expiration', 'SHOULD'],
    ['RES-12', 'Réservation multi-passagers (1 paiement, n places)', 'SHOULD'],
    ['RES-13', 'Choix du siège', 'COULD'],
    ['RES-14', 'Programme de fidélité', 'WON\'T (V1)'],
  ],
  [0.12, 0.68, 0.2]
));

content.push(h2('7.4. Module Administration'));
content.push(makeTable(
  ['Réf', 'Exigence', 'Priorité'],
  [
    ['ADM-01', 'CRUD villes', 'MUST'],
    ['ADM-02', 'CRUD trajets', 'MUST'],
    ['ADM-03', 'CRUD bus (numéro, capacité, statut, chauffeur)', 'MUST'],
    ['ADM-04', 'Création comptes chauffeurs + upload photo profil & CNI', 'MUST'],
    ['ADM-05', 'Liste, modification de rôle et désactivation des utilisateurs', 'MUST'],
    ['ADM-06', 'Création d\'un horaire (trajet × bus × date)', 'MUST'],
    ['ADM-07', 'Détection des conflits ±3h, option de forçage', 'MUST'],
    ['ADM-08', 'Notification email automatique au chauffeur sur assignation', 'MUST'],
    ['ADM-09', 'Modification du statut d\'un horaire', 'MUST'],
    ['ADM-10', 'Vue consolidée de toutes les réservations', 'MUST'],
    ['ADM-11', 'Tableau de bord KPIs (revenus, volumes, statuts)', 'MUST'],
    ['ADM-12', 'Centre de notifications avec lu/non lu', 'SHOULD'],
    ['ADM-13', 'Validation manuelle d\'un paiement (cash en gare)', 'SHOULD'],
    ['ADM-14', 'Export CSV/Excel des réservations et revenus', 'SHOULD'],
    ['ADM-15', 'Logs d\'audit (qui a fait quoi, quand)', 'COULD'],
  ],
  [0.12, 0.68, 0.2]
));

content.push(h2('7.5. Module Chauffeur'));
content.push(makeTable(
  ['Réf', 'Exigence', 'Priorité'],
  [
    ['CHF-01', 'Liste des trajets affectés au bus du chauffeur', 'MUST'],
    ['CHF-02', 'Liste des passagers par horaire (nom, téléphone, statut paiement)', 'MUST'],
    ['CHF-03', 'Modification de son profil personnel', 'MUST'],
    ['CHF-04', 'Marquer un trajet comme démarré / terminé', 'SHOULD'],
    ['CHF-05', 'Confirmer la présence d\'un passager (check-in)', 'SHOULD'],
  ],
  [0.12, 0.68, 0.2]
));

content.push(h2('7.6. Module Notifications'));
content.push(makeTable(
  ['Réf', 'Exigence', 'Priorité'],
  [
    ['NOT-01', 'Email transactionnel à chaque événement clé (8 templates)', 'MUST'],
    ['NOT-02', 'Trace des envois en base (notifications_envoi)', 'MUST'],
    ['NOT-03', 'Lien WhatsApp pré-rempli depuis page contact', 'MUST'],
    ['NOT-04', 'Rappel automatique J-1 et H-1 par email', 'SHOULD'],
    ['NOT-05', 'Notifications push web (PWA)', 'COULD'],
    ['NOT-06', 'SMS via passerelle locale', 'COULD'],
  ],
  [0.12, 0.68, 0.2]
));

// ----- Section 8 -----
content.push(h1('8. Exigences non fonctionnelles'));

content.push(h2('8.1. Performance'));
content.push(makeTable(
  ['Réf', 'Exigence', 'Cible'],
  [
    ['PERF-01', 'Temps de chargement initial du front', '< 3 s sur 4G'],
    ['PERF-02', 'Temps de réponse API standard', 'P95 < 500 ms'],
    ['PERF-03', 'Recherche d\'horaires sur 1 000 entrées', '< 1 s'],
    ['PERF-04', 'Lazy loading des routes React', 'Activé'],
    ['PERF-05', 'Pagination listes admin > 50 entrées', 'À implémenter'],
  ],
  [0.15, 0.55, 0.3]
));

content.push(h2('8.2. Disponibilité & robustesse'));
[
  'DIS-01 : Sauvegarde quotidienne automatique de la base.',
  'DIS-02 : Soft delete sur les entités sensibles.',
  'DIS-03 : Logs serveur centralisés (à implémenter).',
  'DIS-04 : Plan de reprise d\'activité (RPO 24h, RTO 4h).',
].forEach((t) => content.push(bullet(t)));

content.push(h2('8.3. Compatibilité'));
[
  'COM-01 : Navigateurs Chrome, Firefox, Edge, Safari (2 dernières versions).',
  'COM-02 : Responsive (breakpoints 360 / 768 / 1024 / 1440 px).',
  'COM-03 : OS serveur Linux Ubuntu 22.04 LTS recommandé.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('8.4. Accessibilité'));
[
  'ACC-01 : Contrastes WCAG AA minimum.',
  'ACC-02 : Libellés explicites sur tous les formulaires.',
  'ACC-03 : Navigation clavier complète.',
  'ACC-04 : Attributs ARIA sur composants dynamiques.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('8.5. Maintenabilité'));
[
  'MAI-01 : Séparation backend / frontend.',
  'MAI-02 : snake_case BDD, camelCase JS, PascalCase composants React.',
  'MAI-03 : Variables sensibles dans .env, jamais en dur.',
  'MAI-04 : Documentation API au format OpenAPI.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('8.6. Évolutivité'));
[
  'EVO-01 : Architecture stateless (JWT) → scale horizontal possible.',
  'EVO-02 : Schéma BDD ouvert au multi-opérateurs.',
  'EVO-03 : Front prêt pour PWA / mobile (réutilisation API).',
].forEach((t) => content.push(bullet(t)));

// ----- Section 9 -----
content.push(h1('9. Règles de gestion'));
const RG = [
  ['RG-01', 'Une réservation ne peut concerner qu\'un horaire dont la date de départ est strictement future.'],
  ['RG-02', 'Le nombre cumulé de réservations confirmées + en_attente non expirées ≤ capacité du bus.'],
  ['RG-03', 'Une réservation en_attente non payée à expire_le est automatiquement basculée annulée.'],
  ['RG-04', 'La référence de paiement est générée serveur, jamais saisie librement.'],
  ['RG-05', 'Un bus ne peut avoir deux horaires distants de moins de 3h. Idem pour son chauffeur.'],
  ['RG-06', 'L\'admin peut forcer l\'assignation conflictuelle via force=true, traçabilité conservée.'],
  ['RG-07', 'Un client peut annuler tant que statut_paiement ≠ paye ou que le départ est à plus de 12h.'],
  ['RG-08', 'Toute suppression d\'entité métier est logique (deleted_at).'],
  ['RG-09', 'Tout événement majeur déclenche un email transactionnel.'],
  ['RG-10', 'Un utilisateur soft-deleted ne peut plus se connecter.'],
  ['RG-11', 'L\'email est unique parmi les comptes actifs.'],
  ['RG-12', 'Le numéro de bus est unique parmi les bus actifs.'],
  ['RG-13', 'Le numéro de reçu suit strictement le format MT-XXXXXX-AAAA.'],
  ['RG-14', 'Un chauffeur ne peut être assigné qu\'à un seul bus actif simultanément.'],
  ['RG-15', 'Un OTP utilisé ou expiré est marqué used = 1 et ne peut être réutilisé.'],
  ['RG-16', 'Un token de reset utilisé ne peut servir une seconde fois.'],
  ['RG-17', 'Le délai d\'expiration d\'une réservation dépend strictement du mode de paiement.'],
  ['RG-18', 'Les uploads acceptent uniquement JPG, PNG, WebP, ≤ 5 Mo.'],
  ['RG-19', 'Seul un administrateur peut créer un compte chauffeur.'],
  ['RG-20', 'Le rôle Client est attribué par défaut à toute inscription publique.'],
];
content.push(makeTable(['Réf', 'Règle'], RG, [0.12, 0.88]));

// ----- Section 10 -----
content.push(h1('10. Architecture technique'));

content.push(h2('10.1. Vue d\'ensemble'));
content.push(...code(
`                ┌──────────────────────────┐
                │  Navigateur (React SPA)  │
                │  Vite + React Router     │
                │  Axios + JWT localStorage│
                └────────────┬─────────────┘
                             │  HTTPS (REST JSON)
                             ▼
                ┌──────────────────────────┐
                │  Apache + PHP (REST API) │
                │  Middleware JWT + rôles  │
                └────────────┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌───────────┐ ┌──────────────┐
      │ MySQL 5.7+   │ │ PHPMailer │ │ /uploads/    │
      │ miabetrans_db│ │ SMTP Gmail│ │ chauffeurs/  │
      └──────────────┘ └───────────┘ └──────────────┘`));

content.push(h2('10.2. Stack technologique'));
content.push(makeTable(
  ['Couche', 'Technologie', 'Version'],
  [
    ['Front-end framework', 'React', '19.2.4'],
    ['Build tool', 'Vite', '8.0.1'],
    ['Routage', 'React Router DOM', '7.14.0'],
    ['HTTP client', 'Axios', '1.14.0'],
    ['Linting', 'ESLint', '9.39.4'],
    ['Back-end', 'PHP', '≥ 7.4'],
    ['Serveur web', 'Apache', '2.4'],
    ['Base de données', 'MySQL', '≥ 5.7'],
    ['Email', 'PHPMailer', 'embarqué'],
    ['Authentification', 'JWT custom HS256', '—'],
    ['Encodage', 'UTF-8 / utf8mb4', '—'],
  ],
  [0.3, 0.4, 0.3]
));

content.push(h2('10.3. Pattern d\'architecture'));
[
  'REST stateless : chaque requête porte son JWT.',
  'SPA : tout est rendu côté client après chargement initial.',
  'Routage API par domaine : /api/<domaine>/<action>.php ou ?resource=.',
  'Middleware centralisé pour authentification et contrôle de rôle.',
  'Séparation environnement via .env.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('10.4. Arborescence cible'));
content.push(...code(
`MiabeTrans/
├── backend/
│   ├── api/
│   │   ├── auth/                # login, register, OTP, reset, profile
│   │   ├── trajets/             # recherche, CRUD
│   │   ├── horaires/            # liste publique, détail
│   │   ├── reservations/        # CRUD, simuler-paiement, payer, recu
│   │   ├── admin/               # gestion globale, assignation
│   │   ├── chauffeur/           # mes-trajets
│   │   └── upload/              # photos profil & CNI
│   ├── config/                  # database, helpers, mailer
│   ├── middleware/              # auth.php (JWT, rôles)
│   ├── database/                # SQL + migrations
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/               # Home, Search, Booking, Admin, etc.
│   │   ├── components/          # Layout, UI
│   │   ├── context/             # AuthContext
│   │   ├── services/            # api.js
│   │   └── styles/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── uploads/
│   └── chauffeurs/
└── CAHIER_DES_CHARGES.md`));

content.push(h2('10.5. Flux d\'authentification'));
content.push(...code(
`1. POST /auth/login {email, mot_de_passe}
2. Serveur : vérifie hash bcrypt
3. Serveur : génère JWT (id_utilisateur, id_role, iat, exp)
4. Réponse : { token, user }
5. Client : stocke token en localStorage
6. Axios interceptor : ajoute Authorization: Bearer <token>
7. Middleware backend : vérifie signature + expiration
8. Si 401 : déconnexion automatique côté client`));

content.push(h2('10.6. Flux de réservation et paiement'));
content.push(...code(
`1. Client → POST /reservations { id_horaire, mode_paiement }
2. Serveur : crée réservation (statut "en_attente", expire_le calculé)
3. Serveur : trigger BDD génère numero_recu MT-XXXXXX-AAAA
4. Réponse : { id_reservation, numero_recu, expire_le }
5. Client → POST /reservations/simuler-paiement { ... }
6. Serveur : génère reference_paiement, envoie email
7. Email reçu → client saisit la référence
8. Client → POST /reservations/payer { id_reservation, reference }
9. Serveur : vérifie référence, marque "paye" et "confirmée"
10. Serveur : envoie email confirmation + reçu`));

// ----- Section 11 -----
content.push(h1('11. Modèle conceptuel de données'));

content.push(h2('11.1. Vue d\'ensemble du modèle'));
content.push(...code(
`roles ─< utilisateurs ─< reservations >─ horaires >─ trajets >─ villes (×2)
                              │              │
                              │              └─< bus >─ utilisateurs (chauffeur)
                              │
                              └─< paiements
                              └─< evaluations
                              └─< notifications_envoi

utilisateurs ─< notifications
utilisateurs ─< otp_verifications
utilisateurs ─< password_resets (par email)`));

content.push(h2('11.2. Tables détaillées'));

const tableSchemas = [
  { name: 'roles', rows: [
    ['id_role', 'INT(11)', 'PK, AUTO_INCREMENT'],
    ['libelle_role', 'VARCHAR(50)', 'UNIQUE, NOT NULL'],
  ], note: 'Données : Administrateur, Client, Chauffeur.' },
  { name: 'utilisateurs', rows: [
    ['id_utilisateur', 'INT(11)', 'PK'],
    ['nom', 'VARCHAR(100)', 'NOT NULL'],
    ['prenom', 'VARCHAR(100)', "NOT NULL DEFAULT ''"],
    ['email', 'VARCHAR(100)', 'UNIQUE, NOT NULL'],
    ['telephone', 'VARCHAR(20)', '—'],
    ['photo_profil', 'VARCHAR(255)', '—'],
    ['photo_cni', 'VARCHAR(255)', '—'],
    ['email_verifie', 'TINYINT(1)', 'DEFAULT 0'],
    ['mot_de_passe', 'VARCHAR(255)', 'bcrypt'],
    ['id_role', 'INT(11)', 'FK → roles, DEFAULT 2'],
    ['date_creation', 'DATETIME', 'DEFAULT CURRENT_TIMESTAMP'],
    ['deleted_at', 'DATETIME', 'nullable'],
  ]},
  { name: 'villes', rows: [
    ['id_ville', 'INT(11)', 'PK'],
    ['nom_ville', 'VARCHAR(100)', 'UNIQUE, NOT NULL'],
  ], note: 'Initial : Lomé, Kpalimé, Atakpamé, Sokodé, Kara, Dapaong, Tsévié, Notsé, Badou, Mango.' },
  { name: 'bus', rows: [
    ['id_bus', 'INT(11)', 'PK'],
    ['numero_bus', 'VARCHAR(20)', 'UNIQUE'],
    ['chauffeur_id', 'INT(11)', 'FK → utilisateurs, nullable'],
    ['capacite', 'INT(4)', 'DEFAULT 30'],
    ['statut', 'ENUM', 'actif, en_maintenance, indisponible'],
    ['deleted_at', 'DATETIME', 'nullable'],
  ]},
  { name: 'trajets', rows: [
    ['id_trajet', 'INT(11)', 'PK'],
    ['id_ville_depart', 'INT(11)', 'FK → villes'],
    ['id_ville_arrivee', 'INT(11)', 'FK → villes'],
    ['distance_km', 'DECIMAL(10,2)', 'DEFAULT 0'],
    ['prix', 'DECIMAL(10,2)', 'FCFA'],
    ['deleted_at', 'DATETIME', 'nullable'],
  ]},
  { name: 'horaires', rows: [
    ['id_horaire', 'INT(11)', 'PK'],
    ['id_trajet', 'INT(11)', 'FK → trajets'],
    ['id_bus', 'INT(11)', 'FK → bus'],
    ['date_depart', 'DATETIME', 'NOT NULL'],
    ['statut', 'ENUM', 'prévu, en_cours, terminé, annulé'],
    ['deleted_at', 'DATETIME', 'nullable'],
  ]},
  { name: 'reservations', rows: [
    ['id_reservation', 'INT(11)', 'PK'],
    ['id_utilisateur', 'INT(11)', 'FK'],
    ['id_horaire', 'INT(11)', 'FK'],
    ['date_reservation', 'DATETIME', 'DEFAULT CURRENT_TIMESTAMP'],
    ['statut_reservation', 'ENUM', 'en_attente, confirmée, annulée'],
    ['numero_recu', 'VARCHAR(20)', 'UNIQUE, MT-XXXXXX-AAAA'],
    ['mode_paiement', 'VARCHAR(30)', 'Mixx / Flooz / Carte / Cash'],
    ['reference_paiement', 'VARCHAR(100)', 'générée par simulation'],
    ['statut_paiement', 'ENUM', 'non_paye, en_attente, paye'],
    ['expire_le', 'DATETIME', 'dépend du mode'],
  ]},
  { name: 'paiements', rows: [
    ['id_paiement', 'INT(11)', 'PK'],
    ['id_reservation', 'INT(11)', 'FK'],
    ['montant', 'DECIMAL(10,2)', 'NOT NULL'],
    ['mode_paiement', 'ENUM', 'TMoney, Flooz, Cash, MobileMoney'],
    ['date_paiement', 'DATETIME', 'DEFAULT NOW'],
  ]},
  { name: 'notifications', rows: [
    ['id_notification', 'INT(11)', 'PK'],
    ['id_utilisateur', 'INT(11)', 'FK'],
    ['contenu', 'VARCHAR(255)', 'NOT NULL'],
    ['lu', 'TINYINT(1)', 'DEFAULT 0'],
    ['date_notification', 'DATETIME', 'DEFAULT NOW'],
  ]},
  { name: 'evaluations', rows: [
    ['id_evaluation', 'INT(11)', 'PK'],
    ['id_utilisateur', 'INT(11)', 'FK'],
    ['id_horaire', 'INT(11)', 'FK'],
    ['note', 'TINYINT(1)', '1-5'],
    ['commentaire', 'VARCHAR(255)', '—'],
    ['date_evaluation', 'DATETIME', 'DEFAULT NOW'],
  ]},
  { name: 'otp_verifications', rows: [
    ['id', 'INT(11)', 'PK'],
    ['email', 'VARCHAR(100)', 'NOT NULL'],
    ['otp_code', 'VARCHAR(8)', 'NOT NULL'],
    ['type', 'ENUM', 'inscription, reset_mdp, autre'],
    ['used', 'TINYINT(1)', 'DEFAULT 0'],
    ['attempts', 'TINYINT(1)', 'DEFAULT 0'],
    ['expires_at', 'DATETIME', '+10 min'],
    ['created_at', 'DATETIME', 'DEFAULT NOW'],
  ]},
  { name: 'password_resets', rows: [
    ['id', 'INT(11)', 'PK'],
    ['email', 'VARCHAR(100)', 'NOT NULL'],
    ['token', 'VARCHAR(64)', 'UNIQUE'],
    ['expires_at', 'DATETIME', '+1h'],
    ['used', 'TINYINT(1)', 'DEFAULT 0'],
    ['created_at', 'DATETIME', 'DEFAULT NOW'],
  ]},
  { name: 'notifications_envoi', rows: [
    ['id', 'INT(11)', 'PK'],
    ['id_reservation', 'INT(11)', 'FK nullable'],
    ['id_utilisateur', 'INT(11)', 'FK'],
    ['type_envoi', 'ENUM', 'email, whatsapp, sms'],
    ['sujet', 'VARCHAR(255)', '—'],
    ['contenu', 'TEXT', '—'],
    ['statut', 'ENUM', 'envoyé, échec, en_attente'],
    ['created_at', 'DATETIME', 'DEFAULT NOW'],
  ]},
];

tableSchemas.forEach((t) => {
  content.push(h3(`Table : ${t.name}`));
  content.push(makeTable(['Champ', 'Type', 'Contraintes'], t.rows, [0.3, 0.25, 0.45]));
  if (t.note) content.push(p(t.note, { italics: true }));
});

content.push(h2('11.3. Vues SQL'));
content.push(p('vue_horaires_details : agrège trajet, ville départ/arrivée, places libres, bus, chauffeur. Utilisée par les pages de recherche et le détail horaire.'));

content.push(h2('11.4. Triggers'));
content.push(p('Auto-génération du numero_recu au format MT-XXXXXX-AAAA à l\'insertion d\'une réservation.'));

content.push(h2('11.5. Index recommandés'));
content.push(makeTable(
  ['Table', 'Colonne(s)'],
  [
    ['utilisateurs', 'email, id_role'],
    ['bus', 'numero_bus, chauffeur_id'],
    ['trajets', 'id_ville_depart, id_ville_arrivee'],
    ['horaires', 'date_depart, id_bus'],
    ['reservations', 'id_utilisateur, id_horaire, numero_recu, expire_le'],
    ['otp_verifications', 'email, expires_at'],
    ['password_resets', 'token'],
  ],
  [0.3, 0.7]
));

// ----- Section 12 -----
content.push(h1('12. Spécifications API détaillées'));

content.push(h2('12.1. Conventions'));
[
  'Base URL (dev) : http://localhost/miabetrans/backend/api',
  'Base URL (prod) : https://api.miabetrans.tg',
  'Format : JSON UTF-8.',
  'Authentification : header Authorization: Bearer <jwt>.',
  'Codes : 200, 201, 400, 401, 403, 404, 409, 422, 500.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('12.2. Endpoints — Authentification'));
content.push(makeTable(
  ['Méthode', 'Endpoint', 'Description'],
  [
    ['POST', '/auth/login.php', 'Connexion'],
    ['POST', '/auth/register.php', 'Inscription client (après OTP)'],
    ['GET', '/auth/me.php', 'Profil courant'],
    ['PUT', '/auth/update-profile.php', 'Modification profil'],
    ['POST', '/auth/send-otp.php', 'Envoi OTP'],
    ['POST', '/auth/verify-otp.php', 'Vérification OTP'],
    ['POST', '/auth/forgot-password.php', 'Demande de reset'],
    ['POST', '/auth/reset-password.php', 'Reset effectif'],
  ],
  [0.12, 0.45, 0.43]
));
content.push(h3('Exemple — POST /auth/login.php'));
content.push(p('Requête :', { bold: true }));
content.push(...code(`{ "email": "kossi@example.com", "mot_de_passe": "MotDePasse123" }`));
content.push(p('Réponse 200 :', { bold: true }));
content.push(...code(
`{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id_utilisateur": 4,
    "nom": "Mensah",
    "prenom": "Kossi",
    "email": "kossi@example.com",
    "id_role": 2
  }
}`));

content.push(h2('12.3. Endpoints — Catalogue'));
content.push(makeTable(
  ['Méthode', 'Endpoint', 'Description'],
  [
    ['GET', '/trajets/index.php', 'Recherche (depart, arrivee, date)'],
    ['GET/POST/PUT/DELETE', '/trajets/crud.php', 'CRUD trajets (admin)'],
    ['GET', '/horaires/index.php', 'Liste horaires futurs avec places'],
    ['GET', '/horaires/detail.php', 'Détail d\'un horaire'],
  ],
  [0.2, 0.4, 0.4]
));

content.push(h2('12.4. Endpoints — Réservations'));
content.push(makeTable(
  ['Méthode', 'Endpoint', 'Description'],
  [
    ['GET', '/reservations/index.php', 'Liste (du client ou globales pour admin)'],
    ['POST', '/reservations/index.php', 'Création (en_attente)'],
    ['DELETE', '/reservations/index.php?id=X', 'Annulation client'],
    ['GET', '/reservations/recu.php?id=X', 'Détail / reçu'],
    ['POST', '/reservations/simuler-paiement.php', 'Génère référence + email'],
    ['POST', '/reservations/payer.php', 'Valide paiement → confirmée'],
  ],
  [0.12, 0.45, 0.43]
));

content.push(h2('12.5. Endpoints — Administration'));
content.push(makeTable(
  ['Méthode', 'Endpoint', 'Ressources'],
  [
    ['GET/POST/PUT/DELETE', '/admin/index.php?resource=…', 'bus, villes, utilisateurs, chauffeurs, roles, notifications, stats'],
    ['PUT', '/admin/update-user.php?id=X', 'Modification utilisateur'],
    ['POST', '/admin/annuler-reservation.php', '{ id_reservation, raison }'],
    ['GET/POST/PUT/DELETE', '/admin/assignation.php', 'Horaires + détection conflits'],
  ],
  [0.2, 0.4, 0.4]
));
content.push(h3('Exemple — GET /admin/index.php?resource=stats'));
content.push(...code(
`{
  "utilisateurs": 124,
  "chauffeurs": 8,
  "trajets": 10,
  "bus": 12,
  "reservations_total": 357,
  "reservations_en_attente": 14,
  "reservations_confirmees": 312,
  "reservations_annulees": 31,
  "revenus_total": 1250000,
  "revenus_mois": 215000
}`));

content.push(h2('12.6. Endpoints — Chauffeur & Upload'));
content.push(makeTable(
  ['Méthode', 'Endpoint', 'Description'],
  [
    ['GET', '/chauffeur/mes-trajets.php', 'Trajets affectés au chauffeur'],
    ['POST', '/upload/index.php?type=photo|cni', 'Upload photo profil ou CNI (max 5 Mo)'],
  ],
  [0.12, 0.45, 0.43]
));

content.push(h2('12.7. Format d\'erreur uniforme'));
content.push(...code(
`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le champ email est requis.",
    "details": { "field": "email" }
  }
}`));

// ----- Section 13 -----
content.push(h1('13. Description écran par écran'));

const screens = [
  ['13.1. Accueil (/)', 'Hero + barre de recherche, trajets populaires, arguments clés, footer.'],
  ['13.2. Recherche (/search)', 'Filtres en haut, liste cards horaires, état vide explicite.'],
  ['13.3. Détail trajet (/trajets/:id)', 'Récap complet + CTA Réserver.'],
  ['13.4. Inscription (/register)', '3 étapes : formulaire → OTP → succès.'],
  ['13.5. Connexion (/login)', 'Email + mot de passe, lien Mot de passe oublié.'],
  ['13.6. Mot de passe oublié et Reset', 'Saisie email puis page reset avec confirmation.'],
  ['13.7. Réservation (/booking/:id)', 'Récap horaire + sélection mode paiement + compte à rebours.'],
  ['13.8. Confirmation (/confirmation/:id)', 'Reçu + bouton télécharger PDF.'],
  ['13.9. Compte (/account)', 'Édition profil + changement mot de passe.'],
  ['13.10. Historique (/history)', 'Liste réservations + filtres + actions.'],
  ['13.11. Pages institutionnelles', 'About, FAQ, Contact (formulaire / WhatsApp).'],
  ['13.12. Admin Dashboard (/admin)', 'KPIs + graphiques.'],
  ['13.13. Admin CRUD', 'Tableaux paginés (trajets, bus, villes, chauffeurs, utilisateurs).'],
  ['13.14. Admin Assignations', 'Création horaires + détection conflits.'],
  ['13.15. Admin Réservations', 'Tableau filtrable + annulation avec raison.'],
  ['13.16. Chauffeur Dashboard', 'Trajets affectés + passagers détaillés.'],
  ['13.17. 404', 'Page d\'erreur sympathique avec retour accueil.'],
];
screens.forEach(([title, desc]) => {
  content.push(h3(title));
  content.push(p(desc));
});

// ----- Section 14 -----
content.push(h1('14. Charte graphique & UX'));

content.push(h2('14.1. Identité visuelle'));
content.push(makeTable(
  ['Élément', 'Valeur'],
  [
    ['Couleur primaire', 'Bleu route #1E40AF'],
    ['Couleur secondaire', 'Orange chaleur #F97316'],
    ['Couleur succès', 'Vert #16A34A'],
    ['Couleur erreur', 'Rouge #DC2626'],
    ['Couleur fond', '#F9FAFB'],
    ['Texte principal', '#111827'],
    ['Texte secondaire', '#6B7280'],
  ],
  [0.4, 0.6]
));

content.push(h2('14.2. Typographie'));
[
  'Titres : Inter / Poppins, 600-700.',
  'Texte courant : Inter / system-ui, 400-500.',
  'Tailles : 32 / 24 / 18 / 16 / 14 / 12 px.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('14.3. Composants UI réutilisables'));
[
  'Boutons : primaire, secondaire, danger, ghost (3 tailles).',
  'Cards : trajet, KPI, formulaire.',
  'Inputs : texte, email, password (avec œil), date, select.',
  'Modales : confirmation, formulaire, alerte conflit.',
  'Toasts : succès, erreur, info.',
  'Tableaux : tri, pagination, recherche.',
  'Navbar responsive avec menu mobile.',
  'Footer : liens utiles + contact.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('14.4. Principes UX'));
[
  '3 clics maximum pour atteindre la réservation depuis l\'accueil.',
  'Feedback immédiat sur toute action (loader, toast).',
  'Accessibilité clavier complète.',
  'Messages d\'erreur explicites (jamais erreur 500 brute).',
  'Mobile-first.',
].forEach((t) => content.push(bullet(t)));

// ----- Section 15 -----
content.push(h1('15. Sécurité & conformité'));

content.push(h2('15.1. Mesures actuelles'));
content.push(makeTable(
  ['Réf', 'Mesure'],
  [
    ['SEC-01', 'JWT HS256, expiration 24h'],
    ['SEC-02', 'Hachage bcrypt des mots de passe'],
    ['SEC-03', 'Prepared statements PDO partout'],
    ['SEC-04', 'Sanitisation systématique des entrées'],
    ['SEC-05', 'Validation MIME-type et taille des uploads'],
    ['SEC-06', 'OTP 6 chiffres / 10 min / 5 tentatives'],
    ['SEC-07', 'Token reset 64 chars / 1h / usage unique'],
    ['SEC-08', 'CORS restreint à l\'origine front'],
    ['SEC-09', 'Vérification de rôle systématique'],
    ['SEC-10', 'Soft delete pour audit'],
  ],
  [0.12, 0.88]
));

content.push(h2('15.2. À renforcer (V1+)'));
content.push(makeTable(
  ['Réf', 'Mesure'],
  [
    ['SEC-11', 'Rate limiting sur login, OTP, forgot-password'],
    ['SEC-12', 'Headers : CSP, X-Frame-Options, X-Content-Type-Options, HSTS'],
    ['SEC-13', 'HTTPS obligatoire en production'],
    ['SEC-14', 'Rotation des secrets (JWT_SECRET, SMTP)'],
    ['SEC-15', 'Logs d\'audit complets'],
    ['SEC-16', 'Détection de comportements anormaux (bruteforce, scraping)'],
    ['SEC-17', 'Tests d\'intrusion avant mise en production'],
    ['SEC-18', 'Politique mot de passe forte (≥ 8, maj, chiffre, spécial)'],
  ],
  [0.12, 0.88]
));

content.push(h2('15.3. Conformité'));
[
  'RGPD si exposition européenne (voir section 27).',
  'Politique de confidentialité et CGU à publier avant lancement.',
  'Cookies : politique stricte, consentement explicite si analytics.',
].forEach((t) => content.push(bullet(t)));

// ----- Section 16 -----
content.push(h1('16. Intégrations externes'));
content.push(makeTable(
  ['Intégration', 'Statut V1', 'Description', 'Évolution'],
  [
    ['SMTP Gmail (PHPMailer)', 'Opérationnel', 'Tous les emails transactionnels', 'Migrer vers SMTP pro'],
    ['WhatsApp (lien wa.me)', 'OK', 'Lien pré-rempli pour le support', 'WhatsApp Business API'],
    ['Mixx By Yas (Togocel)', 'Simulé', 'Référence générée serveur', 'API officielle V2'],
    ['Flooz (Moov Africa)', 'Simulé', 'Idem', 'API officielle V2'],
    ['Carte bancaire', 'Simulé', 'Idem', 'Stripe / CinetPay / PayDunya V2'],
    ['Cash en gare', 'Manuel', 'Référence à présenter à la caisse', '—'],
    ['SMS', 'Absent', '—', 'Twilio / passerelle locale V2'],
    ['Analytics', 'Absent', '—', 'Plausible / Matomo (RGPD) V2'],
  ],
  [0.25, 0.15, 0.3, 0.3]
));

// ----- Section 17 -----
content.push(h1('17. Performance & scalabilité'));

content.push(h2('17.1. Optimisations actuelles'));
[
  'Lazy loading des routes (React.lazy + Suspense).',
  'Vue SQL pour agréger les données complexes.',
  'Index sur clés étrangères et champs de recherche.',
  'Sanitisation au niveau base.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('17.2. À mettre en place'));
[
  'Cache Redis sur horaires et trajets (TTL 5 min).',
  'Pagination sur toutes les listes admin.',
  'Compression Gzip / Brotli côté Apache.',
  'CDN pour les assets statiques.',
  'Workers / cron pour les tâches asynchrones.',
  'Monitoring : Sentry (erreurs), Plausible (audience), UptimeRobot (uptime).',
].forEach((t) => content.push(bullet(t)));

content.push(h2('17.3. Scalabilité horizontale'));
content.push(p('L\'API étant stateless (JWT, aucune session serveur), elle peut être scalée horizontalement derrière un load balancer. La base MySQL devra évoluer vers une réplication maître-esclave puis un sharding par région à long terme.'));

// ----- Section 18 -----
content.push(h1('18. Plan de tests'));

content.push(h2('18.1. Stratégie'));
content.push(makeTable(
  ['Niveau', 'Outil(s)', 'Couverture cible'],
  [
    ['Tests unitaires backend', 'PHPUnit', '≥ 70 %'],
    ['Tests unitaires frontend', 'Vitest / Jest + Testing Library', '≥ 60 %'],
    ['Tests d\'intégration API', 'Postman / Newman', '100 % endpoints'],
    ['Tests E2E', 'Playwright / Cypress', 'Parcours critiques'],
    ['Tests de charge', 'k6 / JMeter', '1 000 utilisateurs simultanés'],
  ],
  [0.3, 0.4, 0.3]
));

content.push(h2('18.2. Scénarios critiques'));
content.push(makeTable(
  ['ID', 'Scénario', 'Résultat attendu'],
  [
    ['TST-01', 'Inscription complète + OTP', 'Compte créé, JWT retourné'],
    ['TST-02', 'Connexion avec mauvais mot de passe', '401'],
    ['TST-03', 'Réservation jusqu\'à confirmation paiement', 'Statut confirmée, email, reçu PDF'],
    ['TST-04', 'Réservation expirée non payée', 'Auto-passage à annulée'],
    ['TST-05', 'Annulation client puis admin', 'Email envoyé dans les deux cas'],
    ['TST-06', 'Création horaire avec conflit bus', 'Refus avec détails du conflit'],
    ['TST-07', 'Création horaire avec force=true', 'Acceptation, log d\'audit'],
    ['TST-08', 'Upload fichier > 5 Mo', 'Refus avec message clair'],
    ['TST-09', 'Upload PDF (mauvais type)', 'Refus'],
    ['TST-10', 'Tentative accès admin avec rôle client', '403'],
    ['TST-11', 'Réservation alors que places = 0', 'Refus'],
    ['TST-12', 'Recherche sans résultats', 'Message aucun horaire trouvé'],
    ['TST-13', 'Reset mot de passe expiré', '422'],
    ['TST-14', 'OTP utilisé deux fois', 'Refus à la 2ᵉ'],
    ['TST-15', 'Réservation par utilisateur soft-deleted', 'Impossible (login bloqué)'],
  ],
  [0.1, 0.45, 0.45]
));

content.push(h2('18.3. Critères de sortie tests'));
[
  '0 bug critique ou bloquant ouvert.',
  '≤ 5 bugs majeurs ouverts (avec contournement).',
  'Couverture de code conforme aux cibles.',
  'Tous les scénarios critiques en succès.',
].forEach((t) => content.push(bullet(t)));

// ----- Section 19 -----
content.push(h1('19. Stratégie de déploiement'));

content.push(h2('19.1. Environnements'));
content.push(makeTable(
  ['Env', 'URL', 'Branche', 'Données'],
  [
    ['Développement', 'http://localhost:5173', 'dev', 'Jeu de test'],
    ['Recette', 'https://staging.miabetrans.tg', 'staging', 'Anonymisée'],
    ['Production', 'https://app.miabetrans.tg', 'main', 'Réelles'],
  ],
  [0.2, 0.35, 0.15, 0.3]
));

content.push(h2('19.2. Pré-requis serveur production'));
[
  'Linux Ubuntu 22.04 LTS (recommandé) ou Windows Server.',
  'Apache 2.4 + mod_rewrite + SSL (Let\'s Encrypt).',
  'PHP ≥ 8.0 (recommandé) avec extensions pdo_mysql, mbstring, openssl, fileinfo, gd.',
  'MySQL ≥ 5.7 / MariaDB 10.5+.',
  'Stockage /uploads writable (chmod 755 + propriétaire www-data).',
  'Certificat SSL valide.',
  'Compte SMTP professionnel.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('19.3. Procédure de déploiement'));
[
  'Build front : cd frontend && npm install && npm run build.',
  'Copier frontend/dist → racine web ou sous-domaine app.',
  'Copier backend → sous-domaine api. (ou racine /api).',
  'Importer database/miabetrans.sql puis migrations OTP et paiement.',
  'Configurer .env production (DB, JWT_SECRET fort, SMTP).',
  'Vérifier permissions /uploads/chauffeurs.',
  'Tester un scénario complet en production.',
  'Activer monitoring (UptimeRobot / Sentry).',
].forEach((t) => content.push(numbered(t)));

content.push(h2('19.4. Stratégie de rollback'));
[
  'Sauvegarde BDD avant chaque déploiement.',
  'Versionnement git avec tags par release.',
  'Possibilité de redéploiement rapide (< 15 min) sur la version précédente.',
].forEach((t) => content.push(bullet(t)));

// ----- Section 20 -----
content.push(h1('20. Maintenance & support'));

content.push(h2('20.1. Niveaux de service (SLA proposés)'));
content.push(makeTable(
  ['Sévérité', 'Description', 'Prise en charge', 'Résolution'],
  [
    ['Critique', 'Site inaccessible / paiement bloqué', '< 1h', '< 4h'],
    ['Majeur', 'Fonctionnalité majeure HS', '< 4h', '< 24h'],
    ['Mineur', 'Bug non bloquant', '< 1 jour ouvré', '< 5 jours ouvrés'],
    ['Évolution', 'Demande de nouveauté', '< 5 jours ouvrés', 'Selon planning'],
  ],
  [0.18, 0.42, 0.2, 0.2]
));

content.push(h2('20.2. Maintenance préventive'));
[
  'Mises à jour mensuelles (sécurité PHP, npm).',
  'Vérification des sauvegardes hebdomadaire.',
  'Revue des logs hebdomadaire.',
  'Audit de sécurité semestriel.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('20.3. Maintenance évolutive'));
[
  'Sprints de 2 semaines.',
  'Réunion de cadrage mensuelle.',
  'Roadmap publique partagée avec le client.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('20.4. Support utilisateur'));
[
  'WhatsApp Business + email support@miabetrans.tg.',
  'FAQ enrichie en continu.',
  'Délai de réponse cible : < 4h ouvrés.',
].forEach((t) => content.push(bullet(t)));

// ----- Section 21 -----
content.push(h1('21. Matrice des risques'));
content.push(makeTable(
  ['ID', 'Risque', 'Probabilité', 'Impact', 'Criticité', 'Mitigation'],
  [
    ['RIS-01', 'Compte SMTP Gmail bloqué', 'Moyenne', 'Élevé', 'Haute', 'Migrer vers SendGrid/Brevo'],
    ['RIS-02', 'Secret JWT compromis', 'Faible', 'Critique', 'Haute', 'Hors dépôt + rotation trimestrielle'],
    ['RIS-03', 'Paiement simulé exploité', 'Élevée', 'Critique', 'Haute', 'Désactiver simulation en prod'],
    ['RIS-04', 'Bruteforce sur login', 'Élevée', 'Élevé', 'Haute', 'Rate limiting + captcha'],
    ['RIS-05', 'Pic de trafic non absorbé', 'Moyenne', 'Élevé', 'Moyenne', 'Cache + CDN, scale horizontal'],
    ['RIS-06', 'Perte de données', 'Faible', 'Critique', 'Haute', 'Sauvegardes hors site'],
    ['RIS-07', 'Indisponibilité Apache/MySQL', 'Faible', 'Élevé', 'Moyenne', 'Monitoring + plan de reprise'],
    ['RIS-08', 'Adoption faible des chauffeurs', 'Moyenne', 'Moyen', 'Faible', 'Formation, onboarding'],
    ['RIS-09', 'Conflit avec opérateur partenaire', 'Moyenne', 'Élevé', 'Moyenne', 'Contrat clair'],
    ['RIS-10', 'Évolution réglementaire', 'Faible', 'Moyen', 'Faible', 'Veille juridique'],
    ['RIS-11', 'Faille XSS / SQLi', 'Moyenne', 'Critique', 'Haute', 'Audit annuel + bug bounty'],
    ['RIS-12', 'Dépendance npm vulnérable', 'Élevée', 'Moyen', 'Moyenne', 'npm audit + Dependabot'],
  ],
  [0.08, 0.3, 0.12, 0.1, 0.1, 0.3]
));

// ----- Section 22 -----
content.push(h1('22. Planning & lotissement'));

content.push(h2('22.1. Lots V1 (déjà livrés)'));
content.push(makeTable(
  ['Lot', 'Contenu', 'Statut'],
  [
    ['L1', 'Schéma BDD + migrations', 'Livré'],
    ['L2', 'Authentification + OTP', 'Livré'],
    ['L3', 'Catalogue + recherche', 'Livré'],
    ['L4', 'Réservation + simulation paiement', 'Livré'],
    ['L5', 'Espace administrateur', 'Livré'],
    ['L6', 'Espace chauffeur', 'Livré'],
    ['L7', 'Notifications email', 'Livré'],
    ['L8', 'Pages institutionnelles', 'Livré'],
  ],
  [0.1, 0.6, 0.3]
));

content.push(h2('22.2. Lots V1+ (renforcement avant production)'));
content.push(makeTable(
  ['Lot', 'Contenu', 'Effort estimé'],
  [
    ['L9', 'Rate limiting + headers sécurité', '2 j'],
    ['L10', 'Validation manuelle paiement (admin)', '1 j'],
    ['L11', 'Pagination listes admin', '2 j'],
    ['L12', 'Export CSV/Excel', '2 j'],
    ['L13', 'Tests automatisés (PHPUnit + Vitest)', '5 j'],
    ['L14', 'Documentation OpenAPI', '2 j'],
    ['L15', 'Configuration HTTPS + monitoring', '2 j'],
    ['Total V1+', '', '16 j'],
  ],
  [0.12, 0.6, 0.28]
));

content.push(h2('22.3. Lots V2 (extension)'));
content.push(makeTable(
  ['Lot', 'Contenu', 'Effort estimé'],
  [
    ['L16', 'Intégration paiement réel (Mixx, Flooz)', '10 j'],
    ['L17', 'Intégration carte bancaire', '5 j'],
    ['L18', 'Module évaluations', '3 j'],
    ['L19', 'Rappels automatiques cron', '3 j'],
    ['L20', 'QR code sur reçu', '1 j'],
    ['L21', 'Filtres avancés de recherche', '2 j'],
    ['L22', 'Multi-langue (FR/EN)', '5 j'],
    ['L23', 'PWA + notifications push', '5 j'],
    ['Total V2', '', '34 j'],
  ],
  [0.12, 0.6, 0.28]
));

content.push(h2('22.4. Lots V3 (long terme)'));
[
  'L24 : App mobile native (React Native ou Flutter).',
  'L25 : Multi-opérateurs.',
  'L26 : Programme de fidélité.',
  'L27 : Géolocalisation temps réel.',
  'L28 : Extension UEMOA.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('22.5. Diagramme de Gantt simplifié'));
content.push(...code(
`Mois 1    | L9 L10 L11 L12 L13 L14 L15
Mois 2-3  | L16 L17 (paiement réel) + tests pilote
Mois 4    | L18 L19 L20 L21
Mois 5    | L22 L23 + audit sécurité
Mois 6+   | V3`));

// ----- Section 23 -----
content.push(h1('23. Budget estimatif'));

content.push(h2('23.1. Coût de développement (V1+ et V2)'));
content.push(makeTable(
  ['Lot', 'Effort (j)', 'TJM (FCFA)', 'Coût (FCFA)'],
  [
    ['V1+ (16 j)', '16', '50 000', '800 000'],
    ['V2 (34 j)', '34', '50 000', '1 700 000'],
    ['Total dev', '50 j', '', '2 500 000 FCFA'],
  ],
  [0.3, 0.2, 0.2, 0.3]
));
content.push(p('TJM moyen développeur fullstack indépendant Togo. À ajuster selon prestataire.', { italics: true }));

content.push(h2('23.2. Coûts récurrents annuels'));
content.push(makeTable(
  ['Poste', 'Estimation annuelle (FCFA)'],
  [
    ['Hébergement VPS (4 vCPU, 8 Go RAM)', '240 000'],
    ['Nom de domaine .tg', '30 000'],
    ['Certificat SSL (Let\'s Encrypt)', '0'],
    ['SMTP professionnel (Brevo / SendGrid)', '60 000'],
    ['Monitoring (UptimeRobot, Sentry free)', '0'],
    ['Sauvegardes externes (S3 / Backblaze)', '60 000'],
    ['Frais passerelle paiement', 'Variable (1-3% du CA)'],
    ['Total infra fixe', '390 000 FCFA / an'],
  ],
  [0.65, 0.35]
));

content.push(h2('23.3. Coûts de maintenance'));
content.push(p('Forfait mensuel recommandé : 8h / mois → 200 000 FCFA / mois. Inclut monitoring, mises à jour, support utilisateur, petites évolutions.'));

content.push(h2('23.4. Modèle de revenu suggéré'));
content.push(makeTable(
  ['Modèle', 'Description', 'Estimation'],
  [
    ['Commission par réservation', '5-8 % du prix du billet', '50-80 FCFA / billet'],
    ['Abonnement opérateur', 'Forfait mensuel par opérateur', '25 000 FCFA / mois'],
    ['Mise en avant horaires', 'Boost payant', 'À définir'],
  ],
  [0.3, 0.45, 0.25]
));

// ----- Section 24 -----
content.push(h1('24. Livrables attendus'));

content.push(h2('24.1. Livrables techniques'));
[
  'Code source complet versionné Git.',
  'Schéma SQL + scripts de migration.',
  'Documentation API (OpenAPI / Swagger).',
  'Documentation technique (architecture, déploiement).',
  'Documentation utilisateur (admin, chauffeur, voyageur).',
  'Jeu de tests automatisés.',
  'Fichier .env.example.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('24.2. Livrables fonctionnels'));
[
  'Site web déployé en production.',
  'Comptes admin initialisés.',
  'Données de référence chargées (villes, trajets, bus, chauffeurs).',
  'Templates email validés.',
  'Reçus PDF testés.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('24.3. Livrables documentaires'));
[
  'Présent cahier des charges.',
  'Procès-verbaux de recette.',
  'Manuel administrateur.',
  'Manuel chauffeur.',
  'FAQ voyageur.',
  'Politique de confidentialité, CGU, mentions légales.',
].forEach((t) => content.push(bullet(t)));

// ----- Section 25 -----
content.push(h1('25. Critères d\'acceptation'));
content.push(p('La V1 est validée si :'));
[
  'Un visiteur peut s\'inscrire, vérifier son email par OTP, se connecter, rechercher un trajet, réserver, simuler un paiement, valider et télécharger son reçu — sans erreur.',
  'Un chauffeur peut consulter ses trajets affectés et la liste de ses passagers.',
  'Un administrateur peut gérer villes, trajets, bus, chauffeurs et créer des horaires sans pouvoir provoquer de double assignation involontaire.',
  'Tous les emails transactionnels sont effectivement envoyés.',
  'Aucune route protégée n\'est accessible sans JWT valide et rôle adéquat.',
  'Le schéma SQL et les migrations s\'exécutent sans erreur sur une base vierge.',
  'La couverture de tests automatisés atteint les cibles définies.',
  'L\'audit de sécurité ne révèle aucune vulnérabilité critique.',
  'Les pages se chargent en moins de 3 s sur 4G.',
  'Les documents légaux (CGU, confidentialité) sont publiés.',
].forEach((t) => content.push(numbered(t)));

// ----- Section 26 -----
content.push(h1('26. Évolutions futures (V2 / V3)'));

content.push(h2('26.1. V2 — Production-ready (mois 1-5)'));
[
  'Intégration des paiements réels.',
  'Module d\'évaluation post-trajet.',
  'Rappels automatiques.',
  'Export et reporting avancé.',
  'Multi-langue.',
  'PWA + notifications push.',
  'Validation manuelle des paiements cash par l\'admin.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('26.2. V3 — Plateforme régionale (mois 6+)'));
[
  'App mobile native.',
  'Multi-opérateurs (chaque transporteur a son back-office).',
  'Programme de fidélité.',
  'Géolocalisation temps réel des bus.',
  'Extension à l\'UEMOA.',
  'API publique pour partenaires.',
  'Analytics avancées (data mobilité).',
].forEach((t) => content.push(bullet(t)));

// ----- Section 27 -----
content.push(h1('27. Contraintes légales & RGPD'));

content.push(h2('27.1. Données personnelles collectées'));
content.push(makeTable(
  ['Donnée', 'Finalité', 'Base légale', 'Conservation'],
  [
    ['Nom, prénom', 'Identification', 'Exécution du contrat', 'Compte actif + 3 ans'],
    ['Email', 'Authentification, communication', 'Exécution du contrat', 'Compte actif + 3 ans'],
    ['Téléphone', 'Contact, support', 'Intérêt légitime', 'Compte actif + 3 ans'],
    ['Mot de passe (haché)', 'Authentification', 'Exécution du contrat', 'Compte actif'],
    ['Photo profil et CNI', 'Identification professionnelle', 'Obligation contractuelle', 'Contrat + 5 ans'],
    ['Historique réservations', 'Service rendu, comptabilité', 'Exécution + obligation légale', '10 ans'],
    ['Logs de connexion', 'Sécurité', 'Intérêt légitime', '1 an'],
  ],
  [0.22, 0.28, 0.25, 0.25]
));

content.push(h2('27.2. Droits des utilisateurs'));
[
  'Droit d\'accès, de rectification, d\'effacement.',
  'Droit à la portabilité.',
  'Droit d\'opposition.',
  'Procédure : demande à dpo@miabetrans.tg, traitement < 30 jours.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('27.3. Documents à publier'));
[
  'Politique de confidentialité.',
  'Conditions Générales d\'Utilisation.',
  'Conditions Générales de Vente.',
  'Mentions légales.',
  'Politique de cookies.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('27.4. Contraintes locales (Togo)'));
[
  'Conformité à la loi n°2019-014 relative à la protection des données à caractère personnel au Togo.',
  'Déclaration éventuelle auprès de l\'Instance de Protection des Données Personnelles (IPDCP).',
].forEach((t) => content.push(bullet(t)));

// ----- Section 28 -----
content.push(h1('28. Annexes'));

content.push(h2('28.1. Configuration .env type'));
content.push(...code(
`# Base de données
DB_HOST=localhost
DB_NAME=miabetrans_db
DB_USER=miabetrans_user
DB_PASS=

# JWT
JWT_SECRET=
JWT_EXPIRATION=86400

# Application
APP_ENV=production
APP_URL=https://api.miabetrans.tg

# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=MiabeTrans

# Externe
WHATSAPP_NUM=`));

content.push(h2('28.2. Scripts SQL fournis'));
[
  'backend/database/miabetrans.sql — schéma initial complet.',
  'backend/database/migration_otp.sql — table OTP + champ email_verifie.',
  'backend/database/migration_paiement_requis.sql — colonnes paiement enrichies.',
].forEach((t) => content.push(bullet(t)));

content.push(h2('28.3. Comptes de démonstration'));
content.push(makeTable(
  ['Rôle', 'Email', 'Mot de passe'],
  [
    ['Administrateur', 'admin@miabetrans.tg', 'Admin@123'],
    ['Client', 'komi.mensah@gmail.com', '(à initialiser)'],
    ['Client', 'ama.dzifa@gmail.com', '(à initialiser)'],
    ['Chauffeur', 'kofi.chauffeur@miabetrans.tg', '(à initialiser)'],
    ['Chauffeur', 'yao.chauffeur@miabetrans.tg', '(à initialiser)'],
  ],
  [0.25, 0.5, 0.25]
));

content.push(h2('28.4. Référentiel des modes de paiement'));
content.push(makeTable(
  ['Mode', 'Délai d\'expiration', 'Process'],
  [
    ['Mixx By Yas', '30 min', '*144# Togocel + référence'],
    ['Flooz', '30 min', '*155# Moov + référence'],
    ['Carte Bancaire', '20 min', 'Saisie en ligne (simulée V1)'],
    ['Cash', '45 min', 'Référence à présenter à la caisse'],
  ],
  [0.25, 0.25, 0.5]
));

content.push(h2('28.5. Templates email (8)'));
[
  'Confirmation d\'inscription (OTP).',
  'Réinitialisation de mot de passe.',
  'Confirmation de réservation.',
  'Annulation de réservation (par client).',
  'Annulation de réservation (par admin, avec raison).',
  'Simulation de paiement (référence à utiliser).',
  'Confirmation de paiement.',
  'Notification d\'assignation chauffeur.',
].forEach((t) => content.push(numbered(t)));

content.push(h2('28.6. Liste des trajets pré-configurés'));
content.push(makeTable(
  ['Départ', 'Arrivée', 'Distance (km)', 'Prix (FCFA)'],
  [
    ['Lomé', 'Kpalimé', '120', '2 500'],
    ['Lomé', 'Atakpamé', '165', '3 500'],
    ['Lomé', 'Sokodé', '340', '5 500'],
    ['Lomé', 'Kara', '420', '7 000'],
    ['Lomé', 'Dapaong', '634', '9 000'],
    ['(et leurs trajets retours bidirectionnels)', '', '', ''],
  ],
  [0.25, 0.25, 0.25, 0.25]
));

// ----- Section 29 -----
content.push(h1('29. Glossaire'));
content.push(makeTable(
  ['Terme', 'Définition'],
  [
    ['API', 'Application Programming Interface — interface de programmation.'],
    ['Bcrypt', 'Algorithme de hachage de mots de passe résistant.'],
    ['Bus', 'Véhicule effectuant un trajet, avec une capacité fixe.'],
    ['CDN', 'Content Delivery Network — réseau de distribution de contenu.'],
    ['Chauffeur', 'Conducteur affecté à un bus, avec un compte plateforme.'],
    ['CRUD', 'Create / Read / Update / Delete.'],
    ['CORS', 'Cross-Origin Resource Sharing — politique d\'accès cross-domain.'],
    ['CSP', 'Content Security Policy — en-tête HTTP de sécurité.'],
    ['FCFA', 'Franc CFA (XOF), monnaie de l\'UEMOA.'],
    ['Flooz', 'Service mobile money de Moov Africa Togo.'],
    ['HSTS', 'HTTP Strict Transport Security — force HTTPS.'],
    ['Horaire', 'Instance d\'un trajet à une date/heure donnée, attaché à un bus.'],
    ['JWT', 'JSON Web Token — jeton d\'authentification signé.'],
    ['Mixx By Yas', 'Service mobile money de Togocel.'],
    ['OTP', 'One-Time Password — code à usage unique.'],
    ['PWA', 'Progressive Web App — application web installable.'],
    ['REST', 'REpresentational State Transfer — style d\'architecture API.'],
    ['RGPD', 'Règlement Général sur la Protection des Données (UE).'],
    ['Soft delete', 'Suppression logique (ligne marquée deleted_at, conservée).'],
    ['SPA', 'Single Page Application — application web mono-page.'],
    ['SLA', 'Service Level Agreement — niveau de service contractuel.'],
    ['TJM', 'Taux Journalier Moyen.'],
    ['Trajet', 'Itinéraire (ville départ → ville arrivée) avec un prix.'],
    ['UEMOA', 'Union Économique et Monétaire Ouest-Africaine.'],
  ],
  [0.2, 0.8]
));

// ----- Section 30 -----
content.push(h1('30. Validation & signatures'));
content.push(makeTable(
  ['Rôle', 'Nom', 'Date', 'Signature'],
  [
    ['Maîtrise d\'ouvrage (client)', '', '', ''],
    ['Maîtrise d\'œuvre (développeur)', 'Ephraïm NATO', '2026-05-01', ''],
    ['Responsable technique', '', '', ''],
    ['Responsable qualité', '', '', ''],
  ],
  [0.3, 0.3, 0.2, 0.2]
));
content.push(spacer());
content.push(p('Document de référence — Toute modification fait l\'objet d\'un avenant numéroté et signé.', { italics: true, bold: true }));
content.push(p('Fin du cahier des charges — version 2.0 — 2026-05-01.', { italics: true, align: AlignmentType.CENTER }));

// =====================================
//  DOCUMENT
// =====================================
const doc = new Document({
  creator: 'Ephraïm NATO',
  title: 'Cahier des charges MiabeTrans',
  description: 'Plateforme de réservation de trajets interurbains au Togo',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: PRIMARY },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: PRIMARY },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: '111827' },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
      {
        reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: A4_WIDTH, height: 16838 },
          margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'MiabeTrans — Cahier des charges', size: 18, color: '6B7280' })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PRIMARY, space: 4 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: 'Confidentiel — © 2026 MiabeTrans', size: 18, color: '6B7280' }),
              new TextRun({ text: '\tPage ', size: 18, color: '6B7280' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '6B7280' }),
              new TextRun({ text: ' / ', size: 18, color: '6B7280' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '6B7280' }),
            ],
          })],
        }),
      },
      children: content,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const out = path.join(__dirname, 'CAHIER_DES_CHARGES.docx');
  fs.writeFileSync(out, buffer);
  console.log('OK ->', out, '(' + buffer.length + ' bytes)');
}).catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
