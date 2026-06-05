<?php
// api/horaires/index.php - Tous les horaires disponibles (publique)
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Méthode non autorisée.', 405);

$pdo = getDB();
$stmt = $pdo->prepare('
    SELECT
        h.id_horaire, h.date_depart, h.statut,
        vd.nom_ville  AS ville_depart,
        va.nom_ville  AS ville_arrivee,
        t.id_trajet, t.distance_km, t.prix,
        b.numero_bus, b.capacite,
        CONCAT(u.prenom," ",u.nom) AS chauffeur,
        (SELECT COUNT(*) FROM reservations r
         WHERE r.id_horaire = h.id_horaire
         AND r.statut_reservation = "confirmée") AS places_reservees,
        (b.capacite - (SELECT COUNT(*) FROM reservations r
         WHERE r.id_horaire = h.id_horaire
         AND r.statut_reservation = "confirmée")) AS places_disponibles
    FROM horaires h
    JOIN trajets t   ON t.id_trajet = h.id_trajet
    JOIN villes vd   ON vd.id_ville = t.id_ville_depart
    JOIN villes va   ON va.id_ville = t.id_ville_arrivee
    JOIN bus b       ON b.id_bus = h.id_bus
    LEFT JOIN utilisateurs u ON u.id_utilisateur = b.chauffeur_id
    WHERE h.statut = "prévu"
    AND h.deleted_at IS NULL
    AND h.date_depart > NOW()
    ORDER BY h.date_depart ASC
');
$stmt->execute();
sendSuccess($stmt->fetchAll());
