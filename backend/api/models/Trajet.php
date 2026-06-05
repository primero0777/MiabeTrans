<?php
class Trajet {
    private $conn;
    private $table_name = "trajets";

    public $id;
    public $ville_depart;
    public $ville_arrivee;
    public $date_depart;
    public $heure_depart;
    public $prix;
    public $places_disponibles;
    public $chauffeur_id;
    public $statut;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Créer un trajet (Admin)
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET ville_depart=:ville_depart, ville_arrivee=:ville_arrivee,
                    date_depart=:date_depart, heure_depart=:heure_depart,
                    prix=:prix, places_disponibles=:places_disponibles,
                    chauffeur_id=:chauffeur_id, statut='actif'";

        $stmt = $this->conn->prepare($query);

        // Nettoyage des données
        $this->ville_depart = htmlspecialchars(strip_tags($this->ville_depart));
        $this->ville_arrivee = htmlspecialchars(strip_tags($this->ville_arrivee));

        $stmt->bindParam(":ville_depart", $this->ville_depart);
        $stmt->bindParam(":ville_arrivee", $this->ville_arrivee);
        $stmt->bindParam(":date_depart", $this->date_depart);
        $stmt->bindParam(":heure_depart", $this->heure_depart);
        $stmt->bindParam(":prix", $this->prix);
        $stmt->bindParam(":places_disponibles", $this->places_disponibles);
        $stmt->bindParam(":chauffeur_id", $this->chauffeur_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Recherche de trajets (inspiré de Rome2Rio)
    public function search($depart, $arrivee, $date, $passagers = 1) {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE ville_depart LIKE :depart 
                AND ville_arrivee LIKE :arrivee
                AND date_depart = :date
                AND places_disponibles >= :passagers
                AND statut = 'actif'
                ORDER BY heure_depart ASC";

        $stmt = $this->conn->prepare($query);
        
        $depart = "%$depart%";
        $arrivee = "%$arrivee%";
        
        $stmt->bindParam(":depart", $depart);
        $stmt->bindParam(":arrivee", $arrivee);
        $stmt->bindParam(":date", $date);
        $stmt->bindParam(":passagers", $passagers);
        
        $stmt->execute();
        return $stmt;
    }

    // Mettre à jour les places disponibles
    public function updatePlaces($trajet_id, $places_reservees) {
        $query = "UPDATE " . $this->table_name . "
                SET places_disponibles = places_disponibles - :places
                WHERE id = :id AND places_disponibles >= :places";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":places", $places_reservees);
        $stmt->bindParam(":id", $trajet_id);

        return $stmt->execute();
    }
}
?>