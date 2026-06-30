<?php
// =====================================================
// Endpoint : POST /api/voice
// Reçoit un fichier audio, le stocke temporairement,
// retourne une URL publique (utilisée dans WhatsApp).
// Les fichiers sont purgés après 2h automatiquement.
// =====================================================

require_once __DIR__ . '/../../config/helpers.php';

// CORS permissif pour cet endpoint public
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    sendError('Méthode non autorisée.', 405);
if (empty($_FILES['audio']))                  sendError('Aucun fichier audio reçu.', 400);

$file    = $_FILES['audio'];
$maxSize = 10 * 1024 * 1024; // 10 MB
$allowed = [
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg',
    'audio/wav',  'audio/aac', 'audio/x-m4a',
    'application/octet-stream', // fallback certains navigateurs
];

if ($file['error'] !== UPLOAD_ERR_OK) sendError('Erreur lors du transfert.', 500);
if ($file['size'] > $maxSize)         sendError('Fichier trop volumineux (max 10 MB).', 422);

// Vérifier le type MIME réel (pas celui déclaré par le client)
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeReal = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$isAudio = str_starts_with($mimeReal, 'audio/') || in_array($file['type'], $allowed);
if (!$isAudio) sendError('Format non supporté. Envoyez un fichier audio.', 422);

// Détecter l'extension
$extMap = [
    'audio/webm'  => 'webm',
    'audio/ogg'   => 'ogg',
    'audio/mp4'   => 'mp4',
    'audio/mpeg'  => 'mp3',
    'audio/wav'   => 'wav',
    'audio/aac'   => 'aac',
    'audio/x-m4a' => 'm4a',
];
$ext = $extMap[$mimeReal] ?? ($extMap[$file['type']] ?? 'webm');

// Dossier de stockage
$uploadDir = __DIR__ . '/../../../../uploads/voice-messages/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

// Purge automatique des fichiers > 2h
foreach (glob($uploadDir . '*.{webm,ogg,mp4,mp3,wav,aac,m4a}', GLOB_BRACE) as $old) {
    if (filemtime($old) < time() - 7200) @unlink($old);
}

// Nom unique
$filename = 'vocal_' . bin2hex(random_bytes(8)) . '_' . time() . '.' . $ext;
$destPath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) sendError('Impossible de sauvegarder le fichier.', 500);

// URL publique dynamique
$scheme  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host    = $_SERVER['HTTP_HOST'];
$baseUrl = $scheme . '://' . $host . '/miabetrans/uploads/voice-messages/';

sendSuccess([
    'url'      => $baseUrl . $filename,
    'filename' => $filename,
    'expires'  => '2 heures',
], 'Message vocal reçu.');
?>
