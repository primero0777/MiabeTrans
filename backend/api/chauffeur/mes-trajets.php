<?php
// api/chauffeur/mes-trajets.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Methode non autorisee.', 405);

$authUser = getAuthUser();
// Accepter chauffeur et admin (admin peut tester)
if (!in_array($authUser['role'], ['Chauffeur', 'Administrateur'])) {
    sendError('Acces refuse.', 403);
}

$pdo = getDB();

// Le chauffeur est lié à un bus via bus.chauffeur_id = utilisateurs.id_utilisateur
// On cherche tous les horaires où le bus assigné a ce chauffeur
$stmt = $pdo->prepare('
    SELECT
        h.id_horaire,
        h.date_depart,
        h.statut,
        vd.nom_ville  AS ville_depart,
        va.nom_ville  AS ville_arrivee,
        t.distance_km,
        t.prix,
        b.id_bus,
        b.numero_bus,
        b.capacite,
        (
            SELECT COUNT(*) FROM reservations r
            WHERE r.id_horaire = h.id_horaire
            AND r.statut_reservation = "confirmee"
        ) AS places_reservees
    FROM horaires h
    JOIN bus b     ON b.id_bus = h.id_bus
    JOIN trajets t ON t.id_trajet = h.id_trajet
    JOIN villes vd ON vd.id_ville = t.id_ville_depart
    JOIN villes va ON va.id_ville = t.id_ville_arrivee
    WHERE b.chauffeur_id = ?
      AND h.deleted_at IS NULL
    ORDER BY h.date_depart DESC
');
$stmt->execute([$authUser['id']]);
$rows = $stmt->fetchAll();

// Ajouter places_disponibles
foreach ($rows as &$row) {
    $row['places_disponibles'] = max(0, (int)$row['capacite'] - (int)$row['places_reservees']);
}

sendSuccess($rows);
