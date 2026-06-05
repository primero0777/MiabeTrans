<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../models/Utilisateur.php';
require_once '../utils/responseHandler.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$user = new Utilisateur($db);
$responseHandler = new ResponseHandler();

switch($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if(isset($data->action)) {
            switch($data->action) {
                case 'login':
                    handleLogin($data, $user, $responseHandler);
                    break;
                case 'register':
                    handleRegister($data, $user, $responseHandler);
                    break;
                default:
                    $responseHandler->sendError('Action non valide', 400);
            }
        } else {
            $responseHandler->sendError('Action manquante', 400);
        }
        break;
        
    default:
        $responseHandler->sendError('Méthode non autorisée', 405);
}

function handleLogin($data, $user, $responseHandler) {
    if(!empty($data->email) && !empty($data->mot_de_passe)) {
        $user->email = $data->email;
        
        if($user->login($data->mot_de_passe)) {
            session_start();
            $_SESSION['user_id'] = $user->id;
            $_SESSION['user_role'] = $user->role;
            $_SESSION['user_email'] = $user->email;
            
            $responseHandler->sendSuccess([
                'message' => 'Connexion réussie',
                'user' => [
                    'id' => $user->id,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'role' => $user->role,
                    'telephone' => $user->telephone
                ],
                'session_id' => session_id()
            ]);
        } else {
            $responseHandler->sendError('Email ou mot de passe incorrect', 401);
        }
    } else {
        $responseHandler->sendError('Email et mot de passe requis', 400);
    }
}

function handleRegister($data, $user, $responseHandler) {
    $required_fields = ['nom', 'prenom', 'email', 'telephone', 'mot_de_passe'];
    
    foreach($required_fields as $field) {
        if(empty($data->$field)) {
            $responseHandler->sendError("Le champ $field est requis", 400);
            return;
        }
    }
    
    // Validation email
    if(!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        $responseHandler->sendError('Format email invalide', 400);
        return;
    }
    
    // Validation téléphone Togo
    if(!preg_match('/^(\+228|00228)?[0-9]{8}$/', $data->telephone)) {
        $responseHandler->sendError('Numéro de téléphone togolais invalide', 400);
        return;
    }
    
    $user->nom = htmlspecialchars(strip_tags($data->nom));
    $user->prenom = htmlspecialchars(strip_tags($data->prenom));
    $user->email = htmlspecialchars(strip_tags($data->email));
    $user->telephone = htmlspecialchars(strip_tags($data->telephone));
    $user->mot_de_passe = $data->mot_de_passe;
    $user->role = 'client';
    
    if($user->register()) {
        $responseHandler->sendSuccess([
            'message' => 'Inscription réussie',
            'user_id' => $user->id
        ]);
    } else {
        $responseHandler->sendError("Erreur lors de l'inscription", 500);
    }
}
?>