<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../models/Chauffeur.php';
require_once '../utils/responseHandler.php';
require_once '../middlewares/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$chauffeur = new Chauffeur($db);
$responseHandler = new ResponseHandler();
$auth = new AuthMiddleware();

$auth->requireAuth();

$user_role = $auth->getUserRole();

switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest($chauffeur, $responseHandler, $user_role);
        break;
        
    case 'POST':
        handlePostRequest($chauffeur, $responseHandler, $user_role);
        break;
        
    case 'PUT':
        handlePutRequest($chauffeur, $responseHandler, $user_role);
        break;
        
    default:
        $responseHandler->sendError('Méthode non autorisée', 405);
}

function handleGetRequest($chauffeur, $responseHandler, $user_role) {
    if(isset($_GET['id'])) {
        $chauffeur_data = $chauffeur->getById($_GET['id']);
        
        if($chauffeur_data) {
            $responseHandler->sendSuccess($chauffeur_data);
        } else {
            $responseHandler->sendError('Chauffeur non trouvé', 404);
        }
        
    } else {
        // Obtenir tous les chauffeurs (admin seulement)
        if($user_role != 'admin') {
            $responseHandler->sendError('Permission refusée', 403);
            return;
        }
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        $chauffeurs = $chauffeur->getAll($limit, $offset);
        $total = $chauffeur->getTotalCount();
        
        $responseHandler->sendSuccess([
            'chauffeurs' => $chauffeurs,
            'pagination' => [
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
}

function handlePostRequest($chauffeur, $responseHandler, $user_role) {
    if($user_role != 'admin') {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $required_fields = ['utilisateur_id', 'numero_permis', 'vehicule_type', 'immatriculation'];
    
    foreach($required_fields as $field) {
        if(empty($data[$field])) {
            $responseHandler->sendError("Le champ $field est requis", 400);
            return;
        }
    }
    
    $chauffeur->utilisateur_id = $data['utilisateur_id'];
    $chauffeur->numero_permis = $data['numero_permis'];
    $chauffeur->vehicule_type = $data['vehicule_type'];
    $chauffeur->immatriculation = $data['immatriculation'];
    $chauffeur->date_expiration_permis = $data['date_expiration_permis'] ?? null;
    
    if($chauffeur->create()) {
        $responseHandler->sendSuccess([
            'message' => 'Chauffeur créé avec succès',
            'chauffeur_id' => $chauffeur->id
        ]);
    } else {
        $responseHandler->sendError('Erreur lors de la création du chauffeur', 500);
    }
}

function handlePutRequest($chauffeur, $responseHandler, $user_role) {
    if($user_role != 'admin') {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(empty($data['id'])) {
        $responseHandler->sendError('ID du chauffeur requis', 400);
        return;
    }
    
    $chauffeur->id = $data['id'];
    
    $updatable_fields = ['numero_permis', 'vehicule_type', 'immatriculation', 'date_expiration_permis', 'statut'];
    
    foreach($updatable_fields as $field) {
        if(isset($data[$field])) {
            $chauffeur->$field = $data[$field];
        }
    }
    
    if($chauffeur->update()) {
        $responseHandler->sendSuccess(['message' => 'Chauffeur mis à jour avec succès']);
    } else {
        $responseHandler->sendError('Erreur lors de la mise à jour du chauffeur', 500);
    }
}
?>