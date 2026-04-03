<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/responseHandler.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

class NotificationController {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    public function getNotifications() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $offset = ($page - 1) * $limit;
            
            // Compter le total
            $countQuery = "SELECT COUNT(*) FROM notifications WHERE utilisateur_id = :user_id";
            $countStmt = $this->conn->prepare($countQuery);
            $countStmt->bindParam(':user_id', $user['id']);
            $countStmt->execute();
            $total = $countStmt->fetchColumn();
            
            // Récupérer les notifications
            $query = "SELECT * FROM notifications 
                     WHERE utilisateur_id = :user_id 
                     ORDER BY date_envoi DESC 
                     LIMIT :limit OFFSET :offset";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $notifications = $stmt->fetchAll();
            
            // Marquer comme lues si demandé
            if (isset($_GET['mark_read']) && $_GET['mark_read'] === 'true') {
                $this->markAllAsRead($user['id']);
            }
            
            ResponseHandler::sendSuccess([
                'notifications' => $notifications,
                'pagination' => [
                    'page' => intval($page),
                    'limit' => intval($limit),
                    'total' => intval($total),
                    'pages' => ceil($total / $limit)
                ],
                'unread_count' => $this->getUnreadCount($user['id'])
            ], "Notifications récupérées avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération notifications: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération des notifications", 500);
        }
    }
    
    public function getUnreadCount() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $count = $this->getUnreadCount($user['id']);
            
            ResponseHandler::sendSuccess(['unread_count' => $count], "Nombre de notifications non lues récupéré");
            
        } catch (PDOException $e) {
            error_log("Erreur comptage notifications: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors du comptage des notifications", 500);
        }
    }
    
    public function markAsRead($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $query = "UPDATE notifications SET lu = 1 
                     WHERE id = :id AND utilisateur_id = :user_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                ResponseHandler::sendSuccess(null, "Notification marquée comme lue");
            } else {
                ResponseHandler::sendError("Notification non trouvée", 404);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur marquage notification: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors du marquage de la notification", 500);
        }
    }
    
    public function markAllAsRead() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $this->markAllAsRead($user['id']);
            
            ResponseHandler::sendSuccess(null, "Toutes les notifications marquées comme lues");
            
        } catch (PDOException $e) {
            error_log("Erreur marquage notifications: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors du marquage des notifications", 500);
        }
    }
    
    public function deleteNotification($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $query = "DELETE FROM notifications 
                     WHERE id = :id AND utilisateur_id = :user_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                ResponseHandler::sendSuccess(null, "Notification supprimée");
            } else {
                ResponseHandler::sendError("Notification non trouvée", 404);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur suppression notification: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la suppression de la notification", 500);
        }
    }
    
    public function createNotification() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Validation des données
            if (empty($data['titre']) || empty($data['message']) || empty($data['utilisateur_id'])) {
                ResponseHandler::sendError("Données manquantes", 400);
            }
            
            $query = "INSERT INTO notifications (utilisateur_id, titre, message, type, lien) 
                     VALUES (:user_id, :titre, :message, :type, :lien)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $data['utilisateur_id']);
            $stmt->bindParam(':titre', $data['titre']);
            $stmt->bindParam(':message', $data['message']);
            $stmt->bindParam(':type', $data['type'] ?? 'info');
            $stmt->bindParam(':lien', $data['lien']);
            
            if ($stmt->execute()) {
                ResponseHandler::sendSuccess(['notification_id' => $this->conn->lastInsertId()], "Notification créée avec succès", 201);
            } else {
                ResponseHandler::sendError("Erreur lors de la création de la notification", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur création notification: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la création de la notification", 500);
        }
    }
    
    private function getUnreadCount($userId) {
        $query = "SELECT COUNT(*) FROM notifications 
                 WHERE utilisateur_id = :user_id AND lu = 0";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        return intval($stmt->fetchColumn());
    }
    
    private function markAllAsRead($userId) {
        $query = "UPDATE notifications SET lu = 1 
                 WHERE utilisateur_id = :user_id AND lu = 0";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
    }
}
?>