<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$data      = getBody();
validateRequired($data, ['nom', 'prenom', 'email', 'mot_de_passe', 'otp_verifie']);

$nom       = sanitize($data['nom']);
$prenom    = sanitize($data['prenom']);
$email     = filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL);
$telephone = sanitize($data['telephone'] ?? '');
$password  = $data['mot_de_passe'];
$otpVerif  = (bool)$data['otp_verifie']; // true si le frontend a vérifié l'OTP

if (!$email)               sendError('Adresse email invalide.', 422);
if (!$nom || !$prenom)     sendError('Nom et prénom requis.', 422);
if (strlen($password) < 6) sendError('Le mot de passe doit contenir au moins 6 caractères.', 422);
if (!$otpVerif)            sendError('Vérification email requise.', 422);

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id_utilisateur FROM utilisateurs WHERE email = ? AND deleted_at IS NULL');
$stmt->execute([$email]);
if ($stmt->fetch()) sendError('Cet email est déjà utilisé.', 409);

$hash = password_hash($password, PASSWORD_BCRYPT);
$pdo->prepare('
    INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, id_role, email_verifie)
    VALUES (?,?,?,?,?,2,1)
')->execute([$nom, $prenom, $email, $telephone, $hash]);

$newId = $pdo->lastInsertId();
sendSuccess([
    'id_utilisateur' => (int)$newId,
    'nom'    => $nom,
    'prenom' => $prenom,
    'email'  => $email,
], 'Inscription réussie.', 201);
