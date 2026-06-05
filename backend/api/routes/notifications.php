<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../models/Notification.php';
require_once '../utils/responseHandler.php';
require_once '../middlewares/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$notification = new Notification($db);
$responseHandler = new ResponseHandler();
$auth = new AuthMiddleware();

if (!$auth->authenticate()) {
    $responseHandler->sendError('Non authentifié', 401);
    exit();
}

$user_id = $auth->getUserId();

switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest($notification, $responseHandler, $user_id);
        break;
        
    case 'POST':
        handlePostRequest($notification, $responseHandler, $auth);
        break;
        
    case 'PUT':
        handlePutRequest($notification, $responseHandler, $user_id);
        break;
        
    default:
        $responseHandler->sendError('Méthode non autorisée', 405);
}

function handleGetRequest($notification, $responseHandler, $user_id) {
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 20;
    $offset = ($page - 1) * $limit;
    
    $notifications = $notification->getByUser($user_id, $limit, $offset);
    $unread_count = $notification->getUnreadCount($user_id);
    
    $responseHandler->sendSuccess([
        'notifications' => $notifications,
        'unread_count' => $unread_count,
        'pagination' => [
            'page' => (int)$page,
            'limit' => (int)$limit,
            'total' => $notification->getUserNotificationsCount($user_id)
        ]
    ]);
}

function handlePostRequest($notification, $responseHandler, $auth) {
    // Seuls les admins peuvent envoyer des notifications
    if (!$auth->hasRole('admin')) {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $required_fields = ['titre', 'message', 'type'];
    
    foreach($required_fields as $field) {
        if(empty($data[$field])) {
            $responseHandler->sendError("Le champ $field est requis", 400);
            return;
        }
    }
    
    $notification->titre = $data['titre'];
    $notification->message = $data['message'];
    $notification->type = $data['type'];
    $notification->utilisateur_id = $data['utilisateur_id'] ?? null; // null = notification globale
    
    if($notification->create()) {
        $responseHandler->sendSuccess([
            'message' => 'Notification créée avec succès',
            'notification_id' => $notification->id
        ]);
    } else {
        $responseHandler->sendError('Erreur lors de la création de la notification', 500);
    }
}

function handlePutRequest($notification, $responseHandler, $user_id) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(empty($data['notification_id'])) {
        $responseHandler->sendError('ID de notification requis', 400);
        return;
    }
    
    // Marquer comme lu
    if($notification->markAsRead($data['notification_id'], $user_id)) {
        $responseHandler->sendSuccess(['message' => 'Notification marquée comme lue']);
    } else {
        $responseHandler->sendError('Notification non trouvée', 404);
    }
}
?>