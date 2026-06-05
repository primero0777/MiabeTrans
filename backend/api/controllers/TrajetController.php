<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/responseHandler.php';
require_once __DIR__ . '/../utils/validator.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

class TrajetController {
    private $db;
    private $conn;
    private $validator;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->validator = new Validator();
    }
    
    public function getTrajets() {
        try {
            $query = "SELECT t.*, 
                             c.utilisateur_id as chauffeur_user_id,
                             u.prenom as chauffeur_prenom, 
                             u.nom as chauffeur_nom,
                             u.telephone as chauffeur_telephone,
                             v.marque as vehicule_marque,
                             v.modele as vehicule_modele,
                             v.immatriculation as vehicule_immatriculation,
                             v.type_vehicule,
                             v.climatisation,
                             v.wifi,
                             v.prises_electriques
                      FROM trajets t
                      LEFT JOIN chauffeurs c ON t.chauffeur_id = c.id
                      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
                      LEFT JOIN vehicules v ON t.vehicule_id = v.id
                      WHERE t.statut = 'actif' AND t.date_depart >= CURDATE()";
            
            // Filtres
            $filters = [];
            $params = [];
            
            if (isset($_GET['depart'])) {
                $filters[] = "t.ville_depart = :depart";
                $params[':depart'] = $_GET['depart'];
            }
            
            if (isset($_GET['arrivee'])) {
                $filters[] = "t.ville_arrivee = :arrivee";
                $params[':arrivee'] = $_GET['arrivee'];
            }
            
            if (isset($_GET['date'])) {
                $filters[] = "t.date_depart = :date";
                $params[':date'] = $_GET['date'];
            }
            
            if (isset($_GET['prix_max'])) {
                $filters[] = "t.prix <= :prix_max";
                $params[':prix_max'] = $_GET['prix_max'];
            }
            
            if (!empty($filters)) {
                $query .= " AND " . implode(" AND ", $filters);
            }
            
            // Tri
            $sort = $_GET['sort'] ?? 'date_depart';
            $order = $_GET['order'] ?? 'ASC';
            $allowedSort = ['prix', 'date_depart', 'heure_depart', 'duree_estimee'];
            $allowedOrder = ['ASC', 'DESC'];
            
            if (in_array($sort, $allowedSort) && in_array($order, $allowedOrder)) {
                $query .= " ORDER BY t.$sort $order";
            } else {
                $query .= " ORDER BY t.date_depart ASC, t.heure_depart ASC";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $trajets = $stmt->fetchAll();
            
            ResponseHandler::sendSuccess(['trajets' => $trajets], "Trajets récupérés avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération trajets: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération des trajets", 500);
        }
    }
    
    public function getTrajet($id) {
        try {
            $query = "SELECT t.*, 
                             c.utilisateur_id as chauffeur_user_id,
                             u.prenom as chauffeur_prenom, 
                             u.nom as chauffeur_nom,
                             u.telephone as chauffeur_telephone,
                             v.marque as vehicule_marque,
                             v.modele as vehicule_modele,
                             v.immatriculation as vehicule_immatriculation,
                             v.type_vehicule,
                             v.climatisation,
                             v.wifi,
                             v.prises_electriques,
                             v.toilettes,
                             v.nombre_places as vehicule_places_total
                      FROM trajets t
                      LEFT JOIN chauffeurs c ON t.chauffeur_id = c.id
                      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
                      LEFT JOIN vehicules v ON t.vehicule_id = v.id
                      WHERE t.id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                ResponseHandler::sendError("Trajet non trouvé", 404);
            }
            
            $trajet = $stmt->fetch();
            ResponseHandler::sendSuccess($trajet, "Trajet récupéré avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération trajet: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération du trajet", 500);
        }
    }
    
    public function createTrajet() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Validation des données
            $errors = $this->validator->validate($data, [
                'ville_depart' => 'required|min:2|max:100',
                'ville_arrivee' => 'required|min:2|max:100',
                'date_depart' => 'required|date',
                'heure_depart' => 'required',
                'duree_estimee' => 'required',
                'prix' => 'required|numeric|min:0',
                'nombre_places' => 'required|integer|min:1',
                'chauffeur_id' => 'required|integer',
                'vehicule_id' => 'required|integer'
            ]);
            
            if (!empty($errors)) {
                ResponseHandler::sendValidationError($errors);
            }
            
            // Vérifier la disponibilité du véhicule
            if (!$this->checkVehiculeDisponible($data['vehicule_id'], $data['date_depart'])) {
                ResponseHandler::sendError("Véhicule non disponible à cette date", 400);
            }
            
            // Vérifier la disponibilité du chauffeur
            if (!$this->checkChauffeurDisponible($data['chauffeur_id'], $data['date_depart'])) {
                ResponseHandler::sendError("Chauffeur non disponible à cette date", 400);
            }
            
            $query = "INSERT INTO trajets (ville_depart, ville_arrivee, date_depart, heure_depart, 
                                          duree_estimee, prix, nombre_places, places_disponibles,
                                          chauffeur_id, vehicule_id, description) 
                     VALUES (:depart, :arrivee, :date_depart, :heure_depart, :duree, :prix, 
                             :places, :places_disponibles, :chauffeur_id, :vehicule_id, :description)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':depart', $data['ville_depart']);
            $stmt->bindParam(':arrivee', $data['ville_arrivee']);
            $stmt->bindParam(':date_depart', $data['date_depart']);
            $stmt->bindParam(':heure_depart', $data['heure_depart']);
            $stmt->bindParam(':duree', $data['duree_estimee']);
            $stmt->bindParam(':prix', $data['prix']);
            $stmt->bindParam(':places', $data['nombre_places']);
            $stmt->bindParam(':places_disponibles', $data['nombre_places']);
            $stmt->bindParam(':chauffeur_id', $data['chauffeur_id']);
            $stmt->bindParam(':vehicule_id', $data['vehicule_id']);
            $stmt->bindParam(':description', $data['description']);
            
            if ($stmt->execute()) {
                $trajetId = $this->conn->lastInsertId();
                
                // Log d'activité
                $this->logActivity($user['id'], 'creation_trajet', "Nouveau trajet créé: {$data['ville_depart']} → {$data['ville_arrivee']}");
                
                ResponseHandler::sendSuccess(['trajet_id' => $trajetId], "Trajet créé avec succès", 201);
            } else {
                ResponseHandler::sendError("Erreur lors de la création du trajet", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur création trajet: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la création du trajet", 500);
        }
    }
    
    private function checkVehiculeDisponible($vehiculeId, $date) {
        $query = "SELECT COUNT(*) FROM trajets 
                 WHERE vehicule_id = :vehicule_id AND date_depart = :date AND statut != 'annule'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':vehicule_id', $vehiculeId);
        $stmt->bindParam(':date', $date);
        $stmt->execute();
        
        return $stmt->fetchColumn() == 0;
    }
    
    private function checkChauffeurDisponible($chauffeurId, $date) {
        $query = "SELECT COUNT(*) FROM trajets 
                 WHERE chauffeur_id = :chauffeur_id AND date_depart = :date AND statut != 'annule'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':chauffeur_id', $chauffeurId);
        $stmt->bindParam(':date', $date);
        $stmt->execute();
        
        return $stmt->fetchColumn() == 0;
    }
    
    private function logActivity($userId, $action, $description) {
        try {
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            
            $query = "INSERT INTO logs_activite (utilisateur_id, action, description, ip_address, user_agent) 
                     VALUES (:user_id, :action, :description, :ip, :user_agent)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':ip', $ip);
            $stmt->bindParam(':user_agent', $userAgent);
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erreur log activité: " . $e->getMessage());
        }
    }
}
?>