<?php
class Notification {
    private $conn;
    private $table_name = "notifications";

    public $id;
    public $utilisateur_id;
    public $titre;
    public $message;
    public $type;
    public $lu;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Créer une notification
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET utilisateur_id=:utilisateur_id, titre=:titre,
                    message=:message, type=:type, lu=FALSE";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":utilisateur_id", $this->utilisateur_id);
        $stmt->bindParam(":titre", $this->titre);
        $stmt->bindParam(":message", $this->message);
        $stmt->bindParam(":type", $this->type);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Obtenir les notifications d'un utilisateur
    public function getByUser($user_id, $limit = 20, $offset = 0) {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE utilisateur_id = :user_id OR utilisateur_id IS NULL
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Marquer une notification comme lue
    public function markAsRead($notification_id, $user_id) {
        $query = "UPDATE " . $this->table_name . "
                SET lu = TRUE
                WHERE id = :id AND (utilisateur_id = :user_id OR utilisateur_id IS NULL)";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $notification_id);
        $stmt->bindParam(":user_id", $user_id);

        return $stmt->execute() && $stmt->rowCount() > 0;
    }

    // Compter les notifications non lues
    public function getUnreadCount($user_id) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . "
                WHERE (utilisateur_id = :user_id OR utilisateur_id IS NULL)
                AND lu = FALSE";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row['count'];
    }

    // Compter le total des notifications d'un utilisateur
    public function getUserNotificationsCount($user_id) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . "
                WHERE utilisateur_id = :user_id OR utilisateur_id IS NULL";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row['count'];
    }

    // Notifier les utilisateurs d'un trajet
    public function notifyTripUsers($trajet_id, $message, $type = 'info') {
        // Obtenir tous les utilisateurs ayant réservé ce trajet
        $query = "SELECT DISTINCT r.utilisateur_id 
                  FROM reservations r 
                  WHERE r.trajet_id = :trajet_id 
                  AND r.statut = 'confirme'";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":trajet_id", $trajet_id);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $success_count = 0;
        
        foreach($users as $user) {
            $this->utilisateur_id = $user['utilisateur_id'];
            $this->titre = "Mise à jour de votre trajet";
            $this->message = $message;
            $this->type = $type;
            
            if($this->create()) {
                $success_count++;
            }
        }

        return $success_count;
    }
}
?>