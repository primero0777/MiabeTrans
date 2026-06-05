<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') sendError('Méthode non autorisée.', 405);

$id   = (int)($_GET['id'] ?? 0);
$data = getBody();
if (!$id) sendError('ID utilisateur manquant.', 400);

$pdo = getDB();

// Vérifier que l'user existe
$stmt = $pdo->prepare('SELECT id_utilisateur, id_role FROM utilisateurs WHERE id_utilisateur = ? AND deleted_at IS NULL');
$stmt->execute([$id]);
$user = $stmt->fetch();
if (!$user) sendError('Utilisateur introuvable.', 404);

$fields = []; $params = [];

if (isset($data['nom']))       { $fields[] = 'nom = ?';       $params[] = sanitize($data['nom']); }
if (isset($data['prenom']))    { $fields[] = 'prenom = ?';    $params[] = sanitize($data['prenom']); }
if (isset($data['telephone'])) { $fields[] = 'telephone = ?'; $params[] = sanitize($data['telephone']); }
if (isset($data['id_role'])) {
    $roleId = (int)$data['id_role'];
    if (!in_array($roleId, [1,2,3])) sendError('Rôle invalide.', 422);
    $fields[] = 'id_role = ?';
    $params[]  = $roleId;
}

if (empty($fields)) sendError('Aucune modification.', 400);

$params[] = $id;
$pdo->prepare('UPDATE utilisateurs SET ' . implode(', ', $fields) . ' WHERE id_utilisateur = ?')
    ->execute($params);

sendSuccess([], 'Utilisateur mis à jour.');
