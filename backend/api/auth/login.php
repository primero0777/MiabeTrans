<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$data     = getBody();
validateRequired($data, ['email', 'mot_de_passe']);

$email    = filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL);
$password = $data['mot_de_passe'];
if (!$email) sendError('Email invalide.', 422);

$pdo  = getDB();
$stmt = $pdo->prepare('
    SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
           u.mot_de_passe, u.deleted_at, r.libelle_role
    FROM utilisateurs u
    JOIN roles r ON r.id_role = u.id_role
    WHERE u.email = ?
');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['mot_de_passe'])) sendError('Email ou mot de passe incorrect.', 401);
if ($user['deleted_at']) sendError('Compte désactivé. Contactez l\'administrateur.', 403);

$token = generateJWT([
    'id'     => $user['id_utilisateur'],
    'nom'    => $user['nom'],
    'prenom' => $user['prenom'],
    'email'  => $user['email'],
    'role'   => $user['libelle_role'],
]);

sendSuccess([
    'token' => $token,
    'user'  => [
        'id_utilisateur' => $user['id_utilisateur'],
        'nom'            => $user['nom'],
        'prenom'         => $user['prenom'],
        'email'          => $user['email'],
        'telephone'      => $user['telephone'],
        'role'           => $user['libelle_role'],
    ]
], 'Connexion réussie.');
