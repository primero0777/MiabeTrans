<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Méthode non autorisée.', 405);

$authUser = getAuthUser();
$pdo      = getDB();
$stmt     = $pdo->prepare('
    SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
           u.date_creation, r.libelle_role
    FROM utilisateurs u
    JOIN roles r ON r.id_role = u.id_role
    WHERE u.id_utilisateur = ? AND u.deleted_at IS NULL
');
$stmt->execute([$authUser['id']]);
$user = $stmt->fetch();
if (!$user) sendError('Utilisateur introuvable.', 404);
sendSuccess($user);
