<?php
// api/auth/forgot-password.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../config/mailer.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$data  = getBody();
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
if (!$email) sendError('Email invalide.', 422);

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id_utilisateur, nom, prenom FROM utilisateurs WHERE email = ? AND deleted_at IS NULL');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Toujours répondre OK pour ne pas révéler si l'email existe
if (!$user) {
    sendSuccess([], 'Si cet email existe, un lien de réinitialisation a été envoyé.');
}

// Supprimer les anciens tokens
$pdo->prepare('DELETE FROM password_resets WHERE email = ?')->execute([$email]);

// Générer token sécurisé
$token     = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1h

$pdo->prepare('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)')
    ->execute([$email, $token, $expiresAt]);

// Envoyer l'email
$sent = sendResetPasswordEmail($email, $user['prenom'], $user['nom'], $token);

sendSuccess(['sent' => $sent], 'Si cet email existe, un lien de réinitialisation a été envoyé.');
