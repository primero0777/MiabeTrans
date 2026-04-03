<?php
class Chauffeur {
    private $conn;
    private $table_name = "chauffeurs";

    public $id;
    public $utilisateur_id;
    public $numero_permis;
    public $date_expiration_permis;
    public $vehicule_type;
    public $immatriculation;
    public $statut;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Créer un chauffeur
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET utilisateur_id=:utilisateur_id, numero_permis=:numero_permis,
                    date_expiration_permis=:date_expiration_permis,
                    vehicule_type=:vehicule_type, immatriculation=:immatriculation,
                    statut='actif'";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":utilisateur_id", $this->utilisateur_id);
        $stmt->bindParam(":numero_permis", $this->numero_permis);
        $stmt->bindParam(":date_expiration_permis", $this->date_expiration_permis);
        $stmt->bindParam(":vehicule_type", $this->vehicule_type);
        $stmt->bindParam(":immatriculation", $this->immatriculation);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Obtenir un chauffeur par ID
    public function getById($id = null) {
        $chauffeur_id = $id ?: $this->id;
        
        $query = "SELECT c.*, u.nom, u.prenom, u.email, u.telephone
                  FROM " . $this->table_name . " c
                  JOIN utilisateurs u ON c.utilisateur_id = u.id
                  WHERE c.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $chauffeur_id);
        $stmt->execute();

        if($stmt->rowCount() == 1) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    // Obtenir tous les chauffeurs
    public function getAll($limit = 10, $offset = 0) {
        $query = "SELECT c.*, u.nom, u.prenom, u.email, u.telephone
                  FROM " . $this->table_name . " c
                  JOIN utilisateurs u ON c.utilisateur_id = u.id
                  ORDER BY c.id DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Mettre à jour un chauffeur
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET numero_permis = :numero_permis,
                    date_expiration_permis = :date_expiration_permis,
                    vehicule_type = :vehicule_type,
                    immatriculation = :immatriculation,
                    statut = :statut
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":numero_permis", $this->numero_permis);
        $stmt->bindParam(":date_expiration_permis", $this->date_expiration_permis);
        $stmt->bindParam(":vehicule_type", $this->vehicule_type);
        $stmt->bindParam(":immatriculation", $this->immatriculation);
        $stmt->bindParam(":statut", $this->statut);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Obtenir les chauffeurs actifs
    public function getActiveDrivers() {
        $query = "SELECT c.*, u.nom, u.prenom
                  FROM " . $this->table_name . " c
                  JOIN utilisateurs u ON c.utilisateur_id = u.id
                  WHERE c.statut = 'actif'
                  ORDER BY u.nom, u.prenom";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Compter le total des chauffeurs
    public function getTotalCount() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    // Vérifier si un utilisateur est déjà chauffeur
    public function isUserDriver($user_id) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE utilisateur_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
}
?>