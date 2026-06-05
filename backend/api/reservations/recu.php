<?php
// api/reservations/recu.php - Détail complet d'une réservation (pour le reçu)
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Méthode non autorisée.', 405);

$authUser = getAuthUser();
$id       = $_GET['id'] ?? null;
if (!$id) sendError('ID réservation manquant.', 400);

$pdo = getDB();

$stmt = $pdo->prepare('
    SELECT
        r.id_reservation,
        r.numero_recu,
        r.date_reservation,
        r.statut_reservation,
        u.nom           AS client_nom,
        u.email         AS client_email,
        u.telephone     AS client_telephone,
        h.id_horaire,
        h.date_depart,
        vd.nom_ville    AS ville_depart,
        va.nom_ville    AS ville_arrivee,
        t.distance_km,
        t.prix,
        b.numero_bus,
        b.capacite,
        chauffeur.nom   AS chauffeur_nom,
        chauffeur.telephone AS chauffeur_telephone,
        p.mode_paiement,
        p.montant,
        p.date_paiement
    FROM reservations r
    JOIN utilisateurs u     ON u.id_utilisateur = r.id_utilisateur
    JOIN horaires h         ON h.id_horaire = r.id_horaire
    JOIN trajets t          ON t.id_trajet = h.id_trajet
    JOIN villes vd          ON vd.id_ville = t.id_ville_depart
    JOIN villes va          ON va.id_ville = t.id_ville_arrivee
    JOIN bus b              ON b.id_bus = h.id_bus
    LEFT JOIN utilisateurs chauffeur ON chauffeur.id_utilisateur = b.chauffeur_id
    LEFT JOIN paiements p   ON p.id_reservation = r.id_reservation
    WHERE r.id_reservation = ?
');
$stmt->execute([$id]);
$recu = $stmt->fetch();

if (!$recu) sendError('Réservation introuvable.', 404);

// Vérifier que c'est bien la réservation du client connecté (ou admin)
if ($authUser['role'] !== 'Administrateur' && $recu['client_email'] !== $authUser['email']) {
    sendError('Accès non autorisé.', 403);
}

sendSuccess($recu);
