<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/mailer.php';

setCorsHeaders();
$method   = $_SERVER['REQUEST_METHOD'];
$authUser = getAuthUser();
$pdo      = getDB();

if ($method === 'GET') {
    if ($authUser['role'] === 'Administrateur') {
        $stmt = $pdo->query('
            SELECT r.id_reservation, r.statut_reservation,
                   COALESCE(r.statut_paiement,"non_paye") AS statut_paiement,
                   COALESCE(r.statut_validation,"en_attente") AS statut_validation,
                   r.mode_paiement, r.reference_paiement,
                   r.date_reservation, r.numero_recu, r.expire_le,
                   CONCAT(u.prenom," ",u.nom) AS client,
                   u.email, u.telephone,
                   h.date_depart, vd.nom_ville AS ville_depart,
                   va.nom_ville AS ville_arrivee, t.prix, b.numero_bus
            FROM reservations r
            JOIN utilisateurs u ON u.id_utilisateur = r.id_utilisateur
            JOIN horaires h     ON h.id_horaire     = r.id_horaire
            JOIN trajets t      ON t.id_trajet      = h.id_trajet
            JOIN villes vd      ON vd.id_ville      = t.id_ville_depart
            JOIN villes va      ON va.id_ville      = t.id_ville_arrivee
            JOIN bus b          ON b.id_bus         = h.id_bus
            ORDER BY r.date_reservation DESC
        ');
    } else {
        $stmt = $pdo->prepare('
            SELECT r.id_reservation, r.statut_reservation,
                   COALESCE(r.statut_paiement,"non_paye") AS statut_paiement,
                   r.mode_paiement, r.reference_paiement,
                   r.date_reservation, r.numero_recu, r.expire_le,
                   h.date_depart, vd.nom_ville AS ville_depart,
                   va.nom_ville AS ville_arrivee, t.prix, b.numero_bus
            FROM reservations r
            JOIN horaires h ON h.id_horaire = r.id_horaire
            JOIN trajets t  ON t.id_trajet  = h.id_trajet
            JOIN villes vd  ON vd.id_ville  = t.id_ville_depart
            JOIN villes va  ON va.id_ville  = t.id_ville_arrivee
            JOIN bus b      ON b.id_bus     = h.id_bus
            WHERE r.id_utilisateur = ?
            ORDER BY r.date_reservation DESC
        ');
        $stmt->execute([$authUser['id']]);
    }
    sendSuccess($stmt->fetchAll());
}

if ($method === 'POST') {
    $data      = getBody();
    $idHoraire = (int)($data['id_horaire']   ?? 0);
    $modePaie  = trim($data['mode_paiement'] ?? '');

    if (!$idHoraire) sendError('Horaire manquant.', 400);
    if (!$modePaie)  sendError('Mode de paiement requis.', 422);

    // Modes valides — EXACTEMENT les mêmes que dans le frontend
    $modesValides = ['Mixx By Yas', 'Flooz', 'Carte Bancaire', 'Cash'];
    if (!in_array($modePaie, $modesValides)) {
        sendError('Mode invalide. Choisissez parmi : ' . implode(', ', $modesValides), 422);
    }

    // Vérifier disponibilité
    $stmt = $pdo->prepare('
        SELECT h.id_horaire, b.capacite,
            (SELECT COUNT(*) FROM reservations r2
             WHERE r2.id_horaire = h.id_horaire
               AND r2.statut_reservation != "annulée"
               AND (r2.statut_paiement = "paye"
                    OR (r2.expire_le IS NOT NULL AND r2.expire_le > NOW()))
            ) AS reservees
        FROM horaires h JOIN bus b ON b.id_bus = h.id_bus
        WHERE h.id_horaire = ? AND h.statut = "prevu" AND h.deleted_at IS NULL
    ');
    $stmt->execute([$idHoraire]);
    $hor = $stmt->fetch();

    // Essayer aussi avec accent si pas trouvé
    if (!$hor) {
        $stmt2 = $pdo->prepare('
            SELECT h.id_horaire, b.capacite,
                (SELECT COUNT(*) FROM reservations r2
                 WHERE r2.id_horaire = h.id_horaire
                   AND r2.statut_reservation != "annulée"
                   AND (r2.statut_paiement = "paye"
                        OR (r2.expire_le IS NOT NULL AND r2.expire_le > NOW()))
                ) AS reservees
            FROM horaires h JOIN bus b ON b.id_bus = h.id_bus
            WHERE h.id_horaire = ? AND h.deleted_at IS NULL
        ');
        $stmt2->execute([$idHoraire]);
        $hor = $stmt2->fetch();
    }

    if (!$hor) sendError('Horaire introuvable.', 404);
    if ((int)$hor['reservees'] >= (int)$hor['capacite']) sendError('Plus de places disponibles.', 409);

    // Pas de doublon
    $stmtDbl = $pdo->prepare('
        SELECT id_reservation FROM reservations
        WHERE id_utilisateur = ? AND id_horaire = ?
          AND statut_reservation != "annulée"
          AND (statut_paiement = "paye"
               OR (expire_le IS NOT NULL AND expire_le > NOW()))
    ');
    $stmtDbl->execute([$authUser['id'], $idHoraire]);
    if ($stmtDbl->fetch()) sendError('Vous avez déjà une réservation active pour ce trajet.', 409);

    $durees   = ['Cash'=>45,'Mixx By Yas'=>30,'Flooz'=>30,'Carte Bancaire'=>20];
    $duree    = $durees[$modePaie] ?? 30;
    $expireLe = date('Y-m-d H:i:s', time() + $duree * 60);

    $pdo->prepare('
        INSERT INTO reservations
            (id_utilisateur, id_horaire, date_reservation,
             statut_reservation, mode_paiement, statut_paiement, expire_le)
        VALUES (?,?,NOW(),"en_attente",?,"non_paye",?)
    ')->execute([$authUser['id'], $idHoraire, $modePaie, $expireLe]);

    $newId = (int)$pdo->lastInsertId();
    sendSuccess([
        'id_reservation'  => $newId,
        'mode_paiement'   => $modePaie,
        'expire_dans_min' => $duree,
        'expire_le'       => $expireLe,
    ], 'Réservation initiée.', 201);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('ID manquant.', 400);
    $pdo->prepare('UPDATE reservations SET statut_reservation="annulée" WHERE id_reservation=? AND id_utilisateur=?')
        ->execute([$id, $authUser['id']]);
    sendSuccess([], 'Réservation annulée.');
}

sendError('Requête invalide.', 400);
