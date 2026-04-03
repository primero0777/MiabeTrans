<?php
class Reservation {
    private $conn;
    private $table_name = "reservations";

    public $id;
    public $reference;
    public $utilisateur_id;
    public $trajet_id;
    public $nombre_places;
    public $prix_total;
    public $statut;
    public $date_reservation;
    public $moyen_paiement;
    public $statut_paiement;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Créer une réservation
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET reference=:reference, utilisateur_id=:utilisateur_id,
                    trajet_id=:trajet_id, nombre_places=:nombre_places,
                    prix_total=:prix_total, statut=:statut,
                    moyen_paiement=:moyen_paiement, statut_paiement=:statut_paiement";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":reference", $this->reference);
        $stmt->bindParam(":utilisateur_id", $this->utilisateur_id);
        $stmt->bindParam(":trajet_id", $this->trajet_id);
        $stmt->bindParam(":nombre_places", $this->nombre_places);
        $stmt->bindParam(":prix_total", $this->prix_total);
        $stmt->bindParam(":statut", $this->statut);
        $stmt->bindParam(":moyen_paiement", $this->moyen_paiement);
        $stmt->bindParam(":statut_paiement", $this->statut_paiement);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Obtenir une réservation par ID
    public function getById($id = null) {
        $reservation_id = $id ?: $this->id;
        
        $query = "SELECT r.*, u.nom, u.prenom, u.email, u.telephone,
                         t.ville_depart, t.ville_arrivee, t.date_depart, 
                         t.heure_depart, t.prix as prix_unitaire,
                         t.duree_estimee, c.nom as chauffeur_nom
                  FROM " . $this->table_name . " r
                  JOIN utilisateurs u ON r.utilisateur_id = u.id
                  JOIN trajets t ON r.trajet_id = t.id
                  LEFT JOIN chauffeurs ch ON t.chauffeur_id = ch.id
                  LEFT JOIN utilisateurs c ON ch.utilisateur_id = c.id
                  WHERE r.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $reservation_id);
        $stmt->execute();

        if($stmt->rowCount() == 1) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Obtenir les réservations d'un utilisateur
    public function getByUser($user_id, $limit = 10, $offset = 0) {
        $query = "SELECT r.*, t.ville_depart, t.ville_arrivee, t.date_depart, 
                         t.heure_depart, t.prix as prix_unitaire
                  FROM " . $this->table_name . " r
                  JOIN trajets t ON r.trajet_id = t.id
                  WHERE r.utilisateur_id = :user_id
                  ORDER BY r.date_reservation DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obtenir toutes les réservations (admin)
    public function getAll($limit = 10, $offset = 0) {
        $query = "SELECT r.*, u.nom, u.prenom, u.email,
                         t.ville_depart, t.ville_arrivee, t.date_depart
                  FROM " . $this->table_name . " r
                  JOIN utilisateurs u ON r.utilisateur_id = u.id
                  JOIN trajets t ON r.trajet_id = t.id
                  ORDER BY r.date_reservation DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Mettre à jour une réservation
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET statut = :statut, statut_paiement = :statut_paiement
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":statut", $this->statut);
        $stmt->bindParam(":statut_paiement", $this->statut_paiement);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Annuler une réservation
    public function cancel($reservation_id) {
        // Récupérer les informations de la réservation
        $reservation_data = $this->getById($reservation_id);
        if(!$reservation_data) {
            return false;
        }

        try {
            $this->conn->beginTransaction();

            // Marquer la réservation comme annulée
            $query = "UPDATE " . $this->table_name . "
                    SET statut = 'annule'
                    WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $reservation_id);
            
            if(!$stmt->execute()) {
                throw new Exception('Erreur annulation réservation');
            }

            // Remettre les places disponibles
            $update_places_query = "UPDATE trajets 
                                  SET places_disponibles = places_disponibles + :places
                                  WHERE id = :trajet_id";
            
            $update_stmt = $this->conn->prepare($update_places_query);
            $update_stmt->bindParam(":places", $reservation_data['nombre_places']);
            $update_stmt->bindParam(":trajet_id", $reservation_data['trajet_id']);
            
            if(!$update_stmt->execute()) {
                throw new Exception('Erreur mise à jour places');
            }

            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    // Compter le total des réservations
    public function getTotalCount() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    // Compter les réservations d'un utilisateur
    public function getUserReservationsCount($user_id) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE utilisateur_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    // Obtenir les statistiques des réservations
    public function getStats($period = 'month') {
        switch($period) {
            case 'day':
                $format = '%Y-%m-%d';
                break;
            case 'week':
                $format = '%Y-%u';
                break;
            default:
                $format = '%Y-%m';
        }

        $query = "SELECT DATE_FORMAT(date_reservation, :format) as period,
                         COUNT(*) as total_reservations,
                         SUM(prix_total) as chiffre_affaires,
                         AVG(prix_total) as moyenne_par_reservation
                  FROM " . $this->table_name . "
                  WHERE statut != 'annule'
                  GROUP BY period
                  ORDER BY period DESC
                  LIMIT 12";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":format", $format);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>