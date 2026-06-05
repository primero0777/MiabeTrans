<?php
// api/trajets/index.php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée.', 405);
}

$pdo = getDB();

// Recherche par ville de départ, arrivée et date
$depart  = $_GET['depart']  ?? null;
$arrivee = $_GET['arrivee'] ?? null;
$date    = $_GET['date']    ?? null;

if ($depart && $arrivee) {
    // Recherche avec critères
    $sql = '
        SELECT h.id_horaire, h.date_depart, h.statut,
               vd.nom_ville AS ville_depart,
               va.nom_ville AS ville_arrivee,
               t.id_trajet, t.distance_km, t.prix,
               b.numero_bus, b.capacite,
               u.nom AS chauffeur,
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
        WHERE vd.nom_ville LIKE ?
        AND va.nom_ville LIKE ?
        AND h.statut = "prévu"
        AND h.deleted_at IS NULL
        AND t.deleted_at IS NULL
    ';
    $params = ["%$depart%", "%$arrivee%"];

    if ($date) {
        $sql .= ' AND DATE(h.date_depart) = ?';
        $params[] = $date;
    }

    $sql .= ' ORDER BY h.date_depart ASC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
} else {
    // Seulement les trajets qui ont au moins 1 horaire "prévu" à venir
    $stmt = $pdo->prepare('
        SELECT t.id_trajet, t.distance_km, t.prix,
               vd.nom_ville AS ville_depart,
               va.nom_ville AS ville_arrivee,
               MIN(h.date_depart)   AS prochain_depart,
               COUNT(h.id_horaire)  AS nb_horaires
        FROM trajets t
        JOIN villes vd   ON vd.id_ville = t.id_ville_depart
        JOIN villes va   ON va.id_ville = t.id_ville_arrivee
        JOIN horaires h  ON h.id_trajet  = t.id_trajet
        WHERE t.deleted_at  IS NULL
          AND h.deleted_at  IS NULL
          AND h.statut      = "prévu"
          AND h.date_depart >= NOW()
        GROUP BY t.id_trajet, t.distance_km, t.prix,
                 vd.nom_ville, va.nom_ville
        ORDER BY prochain_depart ASC
    ');
    $stmt->execute();
}

$results = $stmt->fetchAll();
sendSuccess($results);