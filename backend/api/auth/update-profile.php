<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') sendError('Méthode non autorisée.', 405);

$authUser = getAuthUser();
$data     = getBody();
$pdo      = getDB();

$nom       = sanitize($data['nom']       ?? '');
$prenom    = sanitize($data['prenom']    ?? '');
$telephone = sanitize($data['telephone'] ?? '');
$email     = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);

if (!$nom || !$prenom)  sendError('Nom et prénom requis.', 422);
if (!$email)            sendError('Email invalide.', 422);

// Vérifier unicité email
$stmt = $pdo->prepare('SELECT id_utilisateur FROM utilisateurs WHERE email = ? AND id_utilisateur != ?');
$stmt->execute([$email, $authUser['id']]);
if ($stmt->fetch()) sendError('Cet email est déjà utilisé.', 409);

// Mettre à jour les infos de base
$pdo->prepare('UPDATE utilisateurs SET nom=?, prenom=?, email=?, telephone=? WHERE id_utilisateur=?')
    ->execute([$nom, $prenom, $email, $telephone, $authUser['id']]);

// Changer le mot de passe si fourni
if (!empty($data['nouveau_mot_de_passe'])) {
    $ancien = $data['ancien_mot_de_passe'] ?? '';
    $stmt   = $pdo->prepare('SELECT mot_de_passe FROM utilisateurs WHERE id_utilisateur=?');
    $stmt->execute([$authUser['id']]);
    $row = $stmt->fetch();
    if (!password_verify($ancien, $row['mot_de_passe'])) sendError('Ancien mot de passe incorrect.', 401);
    $hash = password_hash($data['nouveau_mot_de_passe'], PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE utilisateurs SET mot_de_passe=? WHERE id_utilisateur=?')->execute([$hash, $authUser['id']]);
}

sendSuccess([], 'Profil mis à jour avec succès.');
