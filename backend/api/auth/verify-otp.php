<?php
// api/auth/verify-otp.php
// Vérifie le code OTP saisi par l'utilisateur

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$data  = getBody();
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$code  = trim($data['otp_code'] ?? '');
$type  = sanitize($data['type'] ?? 'inscription');

if (!$email) sendError('Email invalide.', 422);
if (!$code)  sendError('Code OTP manquant.', 422);

$pdo = getDB();

// Récupérer le dernier OTP valide
$stmt = $pdo->prepare('
    SELECT * FROM otp_verifications
    WHERE email = ? AND type = ? AND used = 0 AND expires_at > NOW()
    ORDER BY created_at DESC LIMIT 1
');
$stmt->execute([$email, $type]);
$otp = $stmt->fetch();

if (!$otp) sendError('Code expiré ou introuvable. Demandez un nouveau code.', 400);

// Incrémenter les tentatives
$pdo->prepare('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?')
    ->execute([$otp['id']]);

// Max 5 tentatives
if ($otp['attempts'] >= 5) {
    $pdo->prepare('UPDATE otp_verifications SET used = 1 WHERE id = ?')->execute([$otp['id']]);
    sendError('Trop de tentatives. Demandez un nouveau code.', 429);
}

// Vérifier le code
if ($otp['otp_code'] !== $code) {
    $restantes = max(0, 5 - $otp['attempts'] - 1);
    sendError("Code incorrect. {$restantes} tentative(s) restante(s).", 422);
}

// ✓ Code correct — marquer comme utilisé
$pdo->prepare('UPDATE otp_verifications SET used = 1 WHERE id = ?')->execute([$otp['id']]);

sendSuccess(['verified' => true, 'email' => $email], 'Email vérifié avec succès.');
