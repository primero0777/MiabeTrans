<?php
// api/auth/reset-password.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$data     = getBody();
$token    = sanitize($data['token'] ?? '');
$password = $data['mot_de_passe'] ?? '';

if (!$token)              sendError('Token manquant.', 400);
if (strlen($password) < 6) sendError('Le mot de passe doit contenir au moins 6 caractères.', 422);

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()');
$stmt->execute([$token]);
$reset = $stmt->fetch();

if (!$reset) sendError('Lien invalide ou expiré. Veuillez faire une nouvelle demande.', 400);

// Mettre à jour le mot de passe
$hash = password_hash($password, PASSWORD_BCRYPT);
$pdo->prepare('UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?')
    ->execute([$hash, $reset['email']]);

// Marquer le token comme utilisé
$pdo->prepare('UPDATE password_resets SET used = 1 WHERE token = ?')
    ->execute([$token]);

sendSuccess([], 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.');
