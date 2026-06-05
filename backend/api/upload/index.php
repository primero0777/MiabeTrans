<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
requireAdmin();

$type        = $_GET['type']         ?? '';
$chauffeurId = $_GET['chauffeur_id'] ?? null;

if (!$chauffeurId)                          sendError('ID chauffeur manquant.', 400);
if (!in_array($type, ['photo', 'cni']))     sendError('Type invalide.', 400);
if ($_SERVER['REQUEST_METHOD'] !== 'POST')  sendError('Méthode non autorisée.', 405);
if (empty($_FILES['file']))                 sendError('Aucun fichier reçu.', 400);

$file    = $_FILES['file'];
$maxSize = 5 * 1024 * 1024;
$allowed = ['image/jpeg','image/png','image/webp','image/jpg'];

if ($file['size'] > $maxSize)               sendError('Fichier trop volumineux (max 5 MB).', 422);
if (!in_array($file['type'], $allowed))     sendError('Format non supporté (JPG/PNG).', 422);

$uploadDir = __DIR__ . '/../../../uploads/chauffeurs/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$filename = "{$type}_{$chauffeurId}_" . time() . ".{$ext}";
$destPath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) sendError('Erreur enregistrement.', 500);

$pdo   = getDB();
$field = $type === 'photo' ? 'photo_profil' : 'photo_cni';
$pdo->prepare("UPDATE utilisateurs SET {$field} = ? WHERE id_utilisateur = ?")
    ->execute([$filename, $chauffeurId]);

sendSuccess([
    'filename' => $filename,
    'url'      => "http://localhost/miabetrans/uploads/chauffeurs/{$filename}"
], 'Fichier uploadé avec succès.');
