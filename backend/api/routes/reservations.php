<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../models/Reservation.php';
require_once '../models/Trajet.php';
require_once '../utils/responseHandler.php';
require_once '../middlewares/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$reservation = new Reservation($db);
$trajet = new Trajet($db);
$responseHandler = new ResponseHandler();
$auth = new AuthMiddleware();

if (!$auth->authenticate()) {
    $responseHandler->sendError('Non authentifié', 401);
    exit();
}

switch($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetRequest($reservation, $responseHandler, $auth);
        break;
        
    case 'POST':
        handlePostRequest($reservation, $trajet, $responseHandler, $auth);
        break;
        
    case 'PUT':
        handlePutRequest($reservation, $responseHandler, $auth);
        break;
        
    default:
        $responseHandler->sendError('Méthode non autorisée', 405);
}

function handleGetRequest($reservation, $responseHandler, $auth) {
    $user_id = $auth->getUserId();
    $user_role = $auth->getUserRole();
    
    if(isset($_GET['id'])) {
        // Obtenir une réservation spécifique
        $reservation_data = $reservation->getById($_GET['id']);
        
        if($reservation_data) {
            // Vérifier les permissions
            if($user_role != 'admin' && $reservation_data['utilisateur_id'] != $user_id) {
                $responseHandler->sendError('Permission refusée', 403);
                return;
            }
            
            $responseHandler->sendSuccess($reservation_data);
        } else {
            $responseHandler->sendError('Réservation non trouvée', 404);
        }
        
    } else {
        // Obtenir les réservations de l'utilisateur ou toutes (admin)
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        if($user_role == 'admin') {
            $reservations = $reservation->getAll($limit, $offset);
            $total = $reservation->getTotalCount();
        } else {
            $reservations = $reservation->getByUser($user_id, $limit, $offset);
            $total = $reservation->getUserReservationsCount($user_id);
        }
        
        $responseHandler->sendSuccess([
            'reservations' => $reservations,
            'pagination' => [
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
}

function handlePostRequest($reservation, $trajet, $responseHandler, $auth) {
    $user_id = $auth->getUserId();
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validation des données requises
    $required_fields = ['trajet_id', 'nombre_places'];
    
    foreach($required_fields as $field) {
        if(empty($data[$field])) {
            $responseHandler->sendError("Le champ $field est requis", 400);
            return;
        }
    }
    
    // Vérifier la disponibilité du trajet
    $trajet->id = $data['trajet_id'];
    $trajet_data = $trajet->getById();
    
    if(!$trajet_data) {
        $responseHandler->sendError('Trajet non trouvé', 404);
        return;
    }
    
    if($trajet_data['statut'] != 'actif') {
        $responseHandler->sendError('Ce trajet n\'est plus disponible', 400);
        return;
    }
    
    if($trajet_data['places_disponibles'] < $data['nombre_places']) {
        $responseHandler->sendError('Nombre de places insuffisant', 400);
        return;
    }
    
    // Générer une référence unique
    $reference = 'RES' . date('Ymd') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    // Calculer le prix total
    $prix_total = $trajet_data['prix'] * $data['nombre_places'];
    
    // Démarrer une transaction
    try {
        $db = $reservation->conn;
        $db->beginTransaction();
        
        // Créer la réservation
        $reservation->reference = $reference;
        $reservation->utilisateur_id = $user_id;
        $reservation->trajet_id = $data['trajet_id'];
        $reservation->nombre_places = $data['nombre_places'];
        $reservation->prix_total = $prix_total;
        $reservation->statut = 'confirme';
        $reservation->moyen_paiement = $data['moyen_paiement'] ?? 'especes';
        $reservation->statut_paiement = 'impaye';
        
        if(!$reservation->create()) {
            throw new Exception('Erreur création réservation');
        }
        
        // Mettre à jour les places disponibles
        if(!$trajet->updatePlaces($data['trajet_id'], $data['nombre_places'])) {
            throw new Exception('Erreur mise à jour places');
        }
        
        $db->commit();
        
        $responseHandler->sendSuccess([
            'message' => 'Réservation créée avec succès',
            'reservation_id' => $reservation->id,
            'reference' => $reference,
            'prix_total' => $prix_total
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        $responseHandler->sendError('Erreur lors de la réservation: ' . $e->getMessage(), 500);
    }
}

function handlePutRequest($reservation, $responseHandler, $auth) {
    $user_id = $auth->getUserId();
    $user_role = $auth->getUserRole();
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if(empty($data['id'])) {
        $responseHandler->sendError('ID de réservation requis', 400);
        return;
    }
    
    // Vérifier les permissions
    $reservation_data = $reservation->getById($data['id']);
    if(!$reservation_data) {
        $responseHandler->sendError('Réservation non trouvée', 404);
        return;
    }
    
    if($user_role != 'admin' && $reservation_data['utilisateur_id'] != $user_id) {
        $responseHandler->sendError('Permission refusée', 403);
        return;
    }
    
    // Mettre à jour la réservation
    $reservation->id = $data['id'];
    
    if(isset($data['statut'])) {
        $reservation->statut = $data['statut'];
    }
    
    if(isset($data['statut_paiement'])) {
        $reservation->statut_paiement = $data['statut_paiement'];
    }
    
    if($reservation->update()) {
        $responseHandler->sendSuccess(['message' => 'Réservation mise à jour avec succès']);
    } else {
        $responseHandler->sendError('Erreur lors de la mise à jour', 500);
    }
}
?>