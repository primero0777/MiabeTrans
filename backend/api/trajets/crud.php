<?php
// api/trajets/crud.php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
requireAdmin();

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

// GET - détail d'un trajet
if ($method === 'GET' && $id) {
    $stmt = $pdo->prepare('
        SELECT t.*, vd.nom_ville AS ville_depart, va.nom_ville AS ville_arrivee
        FROM trajets t
        JOIN villes vd ON vd.id_ville = t.id_ville_depart
        JOIN villes va ON va.id_ville = t.id_ville_arrivee
        WHERE t.id_trajet = ? AND t.deleted_at IS NULL
    ');
    $stmt->execute([$id]);
    $trajet = $stmt->fetch();
    if (!$trajet) sendError('Trajet introuvable.', 404);
    sendSuccess($trajet);
}

// POST - créer un trajet
if ($method === 'POST') {
    $data = getBody();
    validateRequired($data, ['id_ville_depart', 'id_ville_arrivee', 'distance_km', 'prix']);

    if ($data['id_ville_depart'] == $data['id_ville_arrivee']) {
        sendError('La ville de départ et d\'arrivée doivent être différentes.', 422);
    }

    $stmt = $pdo->prepare('
        INSERT INTO trajets (id_ville_depart, id_ville_arrivee, distance_km, prix)
        VALUES (?, ?, ?, ?)
    ');
    $stmt->execute([
        $data['id_ville_depart'],
        $data['id_ville_arrivee'],
        $data['distance_km'],
        $data['prix']
    ]);
    sendSuccess(['id_trajet' => (int)$pdo->lastInsertId()], 'Trajet créé.', 201);
}

// PUT - modifier un trajet
if ($method === 'PUT' && $id) {
    $data = getBody();
    validateRequired($data, ['id_ville_depart', 'id_ville_arrivee', 'distance_km', 'prix']);

    $stmt = $pdo->prepare('
        UPDATE trajets
        SET id_ville_depart=?, id_ville_arrivee=?, distance_km=?, prix=?
        WHERE id_trajet=? AND deleted_at IS NULL
    ');
    $stmt->execute([
        $data['id_ville_depart'],
        $data['id_ville_arrivee'],
        $data['distance_km'],
        $data['prix'],
        $id
    ]);
    sendSuccess([], 'Trajet mis à jour.');
}

// DELETE - suppression logique
if ($method === 'DELETE' && $id) {
    $stmt = $pdo->prepare('UPDATE trajets SET deleted_at = NOW() WHERE id_trajet = ?');
    $stmt->execute([$id]);
    sendSuccess([], 'Trajet supprimé.');
}

sendError('Requête invalide.', 400);
