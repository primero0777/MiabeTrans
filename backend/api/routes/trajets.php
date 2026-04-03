<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../models/Trajet.php';
require_once '../utils/responseHandler.php';
require_once '../middlewares/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$trajet = new Trajet($db);
$responseHandler = new ResponseHandler();
$auth = new AuthMiddleware();

// Vérifier l'authentification pour les routes protégées
if (!$auth->authenticate()) {
    $responseHandler->sendError('Non authentifié', 401);
    exit();
}

switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest($trajet, $responseHandler);
        break;
        
    case 'POST':
        handlePostRequest($trajet, $responseHandler, $auth);
        break;
        
    case 'PUT':
        handlePutRequest($trajet, $responseHandler, $auth);
        break;
        
    case 'DELETE':
        handleDeleteRequest($trajet, $responseHandler, $auth);
        break;
        
    default:
        $responseHandler->sendError('Méthode non autorisée', 405);
}

function handleGetRequest($trajet, $responseHandler) {
    if(isset($_GET['id'])) {
        // Obtenir un trajet spécifique
        $trajet->id = $_GET['id'];
        $trajet_data = $trajet->getById();
        
        if($trajet_data) {
            $responseHandler->sendSuccess($trajet_data);
        } else {
            $responseHandler->sendError('Trajet non trouvé', 404);
        }
        
    } elseif(isset($_GET['search'])) {
        // Recherche de trajets
        $depart = $_GET['depart'] ?? '';
        $arrivee = $_GET['arrivee'] ?? '';
        $date = $_GET['date'] ?? '';
        $passagers = $_GET['passagers'] ?? 1;
        
        $results = $trajet->search($depart, $arrivee, $date, $passagers);
        $trajets = $results->fetchAll(PDO::FETCH_ASSOC);
        
        $responseHandler->sendSuccess([
            'count' => count($trajets),
            'trajets' => $trajets
        ]);
        
    } else {
        // Obtenir tous les trajets (avec pagination)
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        $trajets = $trajet->getAll($limit, $offset);
        $total = $trajet->getTotalCount();
        
        $responseHandler->sendSuccess([
            'trajets' => $trajets,
            'pagination' => [
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
}

function handlePostRequest($trajet, $responseHandler, $auth) {
    // Vérifier les permissions admin
    if (!$auth->hasRole('admin')) {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validation des données requises
    $required_fields = ['ville_depart', 'ville_arrivee', 'date_depart', 'heure_depart', 'prix', 'places_total', 'chauffeur_id'];
    
    foreach($required_fields as $field) {
        if(empty($data[$field])) {
            $responseHandler->sendError("Le champ $field est requis", 400);
            return;
        }
    }
    
    // Assigner les valeurs
    $trajet->ville_depart = $data['ville_depart'];
    $trajet->ville_arrivee = $data['ville_arrivee'];
    $trajet->date_depart = $data['date_depart'];
    $trajet->heure_depart = $data['heure_depart'];
    $trajet->prix = $data['prix'];
    $trajet->places_disponibles = $data['places_total'];
    $trajet->places_total = $data['places_total'];
    $trajet->chauffeur_id = $data['chauffeur_id'];
    $trajet->duree_estimee = $data['duree_estimee'] ?? '';
    
    if($trajet->create()) {
        $responseHandler->sendSuccess([
            'message' => 'Trajet créé avec succès',
            'trajet_id' => $trajet->id
        ]);
    } else {
        $responseHandler->sendError('Erreur lors de la création du trajet', 500);
    }
}

function handlePutRequest($trajet, $responseHandler, $auth) {
    if (!$auth->hasRole('admin')) {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(empty($data['id'])) {
        $responseHandler->sendError('ID du trajet requis', 400);
        return;
    }
    
    $trajet->id = $data['id'];
    
    // Mettre à jour seulement les champs fournis
    $updatable_fields = [
        'ville_depart', 'ville_arrivee', 'date_depart', 'heure_depart',
        'prix', 'places_disponibles', 'chauffeur_id', 'duree_estimee', 'statut'
    ];
    
    foreach($updatable_fields as $field) {
        if(isset($data[$field])) {
            $trajet->$field = $data[$field];
        }
    }
    
    if($trajet->update()) {
        $responseHandler->sendSuccess(['message' => 'Trajet mis à jour avec succès']);
    } else {
        $responseHandler->sendError('Erreur lors de la mise à jour du trajet', 500);
    }
}

function handleDeleteRequest($trajet, $responseHandler, $auth) {
    if (!$auth->hasRole('admin')) {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(empty($data['id'])) {
        $responseHandler->sendError('ID du trajet requis', 400);
        return;
    }
    
    $trajet->id = $data['id'];
    
    if($trajet->delete()) {
        $responseHandler->sendSuccess(['message' => 'Trajet supprimé avec succès']);
    } else {
        $responseHandler->sendError('Erreur lors de la suppression du trajet', 500);
    }
}
?>
