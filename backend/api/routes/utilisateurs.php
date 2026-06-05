<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../models/Utilisateur.php';
require_once '../utils/responseHandler.php';
require_once '../middlewares/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$user = new Utilisateur($db);
$responseHandler = new ResponseHandler();
$auth = new AuthMiddleware();

if (!$auth->authenticate()) {
    $responseHandler->sendError('Non authentifié', 401);
    exit();
}

$user_id = $auth->getUserId();
$user_role = $auth->getUserRole();

switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest($user, $responseHandler, $auth, $user_id, $user_role);
        break;
        
    case 'PUT':
        handlePutRequest($user, $responseHandler, $auth, $user_id, $user_role);
        break;
        
    default:
        $responseHandler->sendError('Méthode non autorisée', 405);
}

function handleGetRequest($user, $responseHandler, $auth, $user_id, $user_role) {
    if(isset($_GET['id'])) {
        $requested_id = $_GET['id'];
        
        // Vérifier les permissions
        if($user_role != 'admin' && $requested_id != $user_id) {
            $responseHandler->sendError('Permission refusée', 403);
            return;
        }
        
        $user_data = $user->getProfile($requested_id);
        
        if($user_data) {
            $responseHandler->sendSuccess($user_data);
        } else {
            $responseHandler->sendError('Utilisateur non trouvé', 404);
        }
        
    } else {
        // Obtenir le profil de l'utilisateur connecté
        $user_data = $user->getProfile($user_id);
        
        if($user_data) {
            $responseHandler->sendSuccess($user_data);
        } else {
            $responseHandler->sendError('Utilisateur non trouvé', 404);
        }
    }
}

function handlePutRequest($user, $responseHandler, $auth, $user_id, $user_role) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $target_user_id = $data['id'] ?? $user_id;
    
    // Vérifier les permissions
    if($user_role != 'admin' && $target_user_id != $user_id) {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    if(isset($data['current_password']) && isset($data['new_password'])) {
        // Changement de mot de passe
        if($user->changePassword($target_user_id, $data['current_password'], $data['new_password'])) {
            $responseHandler->sendSuccess(['message' => 'Mot de passe mis à jour avec succès']);
        } else {
            $responseHandler->sendError('Mot de passe actuel incorrect', 400);
        }
        
    } else {
        // Mise à jour du profil
        $update_data = [];
        $allowed_fields = ['nom', 'prenom', 'telephone'];
        
        foreach($allowed_fields as $field) {
            if(isset($data[$field])) {
                $update_data[$field] = $data[$field];
            }
        }
        
        if($user->updateProfile($target_user_id, $update_data)) {
            $responseHandler->sendSuccess(['message' => 'Profil mis à jour avec succès']);
        } else {
            $responseHandler->sendError('Erreur lors de la mise à jour du profil', 500);
        }
    }
}
?>