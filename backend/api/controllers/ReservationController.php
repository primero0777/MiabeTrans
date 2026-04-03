<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/responseHandler.php';
require_once __DIR__ . '/../utils/validator.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

class ReservationController {
    private $db;
    private $conn;
    private $validator;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->validator = new Validator();
    }
    
    public function getReservations() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $query = "SELECT r.*, 
                             t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart,
                             t.duree_estimee, t.prix as prix_unitaire,
                             c.utilisateur_id as chauffeur_user_id,
                             u.prenom as chauffeur_prenom, u.nom as chauffeur_nom,
                             v.marque as vehicule_marque, v.modele as vehicule_modele,
                             v.immatriculation as vehicule_immatriculation
                      FROM reservations r
                      INNER JOIN trajets t ON r.trajet_id = t.id
                      LEFT JOIN chauffeurs c ON t.chauffeur_id = c.id
                      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
                      LEFT JOIN vehicules v ON t.vehicule_id = v.id
                      WHERE r.utilisateur_id = :user_id";
            
            // Filtres pour l'admin
            if ($user['role'] === 'admin') {
                $query = str_replace("WHERE r.utilisateur_id = :user_id", "", $query);
                $params = [];
            } else {
                $params = [':user_id' => $user['id']];
            }
            
            // Appliquer les filtres
            $filters = [];
            
            if (isset($_GET['statut'])) {
                $filters[] = "r.statut = :statut";
                $params[':statut'] = $_GET['statut'];
            }
            
            if (isset($_GET['date_debut'])) {
                $filters[] = "r.date_reservation >= :date_debut";
                $params[':date_debut'] = $_GET['date_debut'];
            }
            
            if (isset($_GET['date_fin'])) {
                $filters[] = "r.date_reservation <= :date_fin";
                $params[':date_fin'] = $_GET['date_fin'];
            }
            
            if (!empty($filters)) {
                $query .= " WHERE " . implode(" AND ", $filters);
            }
            
            $query .= " ORDER BY r.date_reservation DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $reservations = $stmt->fetchAll();
            
            ResponseHandler::sendSuccess(['reservations' => $reservations], "Réservations récupérées avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération réservations: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération des réservations", 500);
        }
    }
    
    public function getReservation($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $query = "SELECT r.*, 
                             t.ville_depart, t.ville_arrivee, t.date_depart, t.heure_depart,
                             t.duree_estimee, t.prix as prix_unitaire, t.places_disponibles,
                             c.utilisateur_id as chauffeur_user_id,
                             u.prenom as chauffeur_prenom, u.nom as chauffeur_nom,
                             u.telephone as chauffeur_telephone,
                             v.marque as vehicule_marque, v.modele as vehicule_modele,
                             v.immatriculation as vehicule_immatriculation,
                             v.type_vehicule, v.climatisation, v.wifi, v.prises_electriques
                      FROM reservations r
                      INNER JOIN trajets t ON r.trajet_id = t.id
                      LEFT JOIN chauffeurs c ON t.chauffeur_id = c.id
                      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
                      LEFT JOIN vehicules v ON t.vehicule_id = v.id
                      WHERE r.id = :id";
            
            // Pour les non-admins, vérifier que la réservation leur appartient
            if ($user['role'] !== 'admin') {
                $query .= " AND r.utilisateur_id = :user_id";
                $params = [':id' => $id, ':user_id' => $user['id']];
            } else {
                $params = [':id' => $id];
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            
            if ($stmt->rowCount() === 0) {
                ResponseHandler::sendError("Réservation non trouvée", 404);
            }
            
            $reservation = $stmt->fetch();
            
            // Ajouter les informations de timeline
            $reservation['timeline'] = $this->getReservationTimeline($id);
            
            ResponseHandler::sendSuccess($reservation, "Réservation récupérée avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération réservation: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération de la réservation", 500);
        }
    }
    
    public function createReservation() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Validation des données
            $errors = $this->validator->validate($data, [
                'trajet_id' => 'required|integer',
                'nombre_passagers' => 'required|integer|min:1'
            ]);
            
            if (!empty($errors)) {
                ResponseHandler::sendValidationError($errors);
            }
            
            // Vérifier la disponibilité du trajet
            $trajet = $this->getTrajetDetails($data['trajet_id']);
            if (!$trajet) {
                ResponseHandler::sendError("Trajet non trouvé", 404);
            }
            
            if ($trajet['statut'] !== 'actif') {
                ResponseHandler::sendError("Ce trajet n'est pas disponible", 400);
            }
            
            if ($trajet['places_disponibles'] < $data['nombre_passagers']) {
                ResponseHandler::sendError("Nombre de places insuffisant. Places disponibles: " . $trajet['places_disponibles'], 400);
            }
            
            // Calculer le prix total
            $prixTotal = $trajet['prix'] * $data['nombre_passagers'];
            
            // Générer un code de réservation unique
            $codeReservation = $this->generateReservationCode();
            
            // Créer la réservation
            $query = "INSERT INTO reservations (code_reservation, trajet_id, utilisateur_id, 
                                              nombre_passagers, prix_total, moyen_paiement, statut) 
                     VALUES (:code, :trajet_id, :user_id, :passagers, :prix_total, :paiement, 'en_attente')";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':code', $codeReservation);
            $stmt->bindParam(':trajet_id', $data['trajet_id']);
            $stmt->bindParam(':user_id', $user['id']);
            $stmt->bindParam(':passagers', $data['nombre_passagers']);
            $stmt->bindParam(':prix_total', $prixTotal);
            $stmt->bindParam(':paiement', $data['moyen_paiement']);
            
            if ($stmt->execute()) {
                $reservationId = $this->conn->lastInsertId();
                
                // Mettre à jour les places disponibles
                $this->updatePlacesDisponibles($data['trajet_id'], $data['nombre_passagers']);
                
                // Log d'activité
                $this->logActivity($user['id'], 'creation_reservation', 
                    "Nouvelle réservation #$codeReservation pour {$data['nombre_passagers']} passager(s)");
                
                // Créer une notification
                $this->createNotification($user['id'], 
                    "Réservation créée", 
                    "Votre réservation #$codeReservation a été créée avec succès. Statut: En attente",
                    'info',
                    "/reservations/suivi.html?id=$reservationId");
                
                ResponseHandler::sendSuccess([
                    'reservation_id' => $reservationId,
                    'code_reservation' => $codeReservation,
                    'prix_total' => $prixTotal
                ], "Réservation créée avec succès", 201);
            } else {
                ResponseHandler::sendError("Erreur lors de la création de la réservation", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur création réservation: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la création de la réservation", 500);
        }
    }
    
    public function updateReservation($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Vérifier que l'utilisateur peut modifier cette réservation
            if (!$this->canUserModifyReservation($user['id'], $id, $user['role'])) {
                ResponseHandler::sendError("Accès non autorisé à cette réservation", 403);
            }
            
            // Construire la requête dynamiquement
            $updates = [];
            $params = [':id' => $id];
            
            if (isset($data['statut'])) {
                $updates[] = "statut = :statut";
                $params[':statut'] = $data['statut'];
                
                // Mettre à jour la date de confirmation si le statut devient "confirmé"
                if ($data['statut'] === 'confirme') {
                    $updates[] = "date_confirmation = NOW()";
                }
                
                // Mettre à jour la date de paiement si le statut devient "payé"
                if ($data['statut'] === 'paye') {
                    $updates[] = "date_paiement = NOW()";
                }
            }
            
            if (isset($data['moyen_paiement'])) {
                $updates[] = "moyen_paiement = :paiement";
                $params[':paiement'] = $data['moyen_paiement'];
            }
            
            if (isset($data['notes'])) {
                $updates[] = "notes = :notes";
                $params[':notes'] = $data['notes'];
            }
            
            if (empty($updates)) {
                ResponseHandler::sendError("Aucune donnée à mettre à jour", 400);
            }
            
            $query = "UPDATE reservations SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
            if ($stmt->execute($params)) {
                // Log d'activité
                $this->logActivity($user['id'], 'mise_a_jour_reservation', 
                    "Réservation #$id mise à jour. Nouveau statut: " . ($data['statut'] ?? 'non modifié'));
                
                ResponseHandler::sendSuccess(null, "Réservation mise à jour avec succès");
            } else {
                ResponseHandler::sendError("Erreur lors de la mise à jour de la réservation", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur mise à jour réservation: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la mise à jour de la réservation", 500);
        }
    }
    
    public function cancelReservation($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->authenticate();
            
            // Vérifier que l'utilisateur peut annuler cette réservation
            if (!$this->canUserModifyReservation($user['id'], $id, $user['role'])) {
                ResponseHandler::sendError("Accès non autorisé à cette réservation", 403);
            }
            
            // Récupérer les détails de la réservation
            $reservation = $this->getReservationDetails($id);
            if (!$reservation) {
                ResponseHandler::sendError("Réservation non trouvée", 404);
            }
            
            // Vérifier si l'annulation est possible
            if (!$this->canCancelReservation($reservation)) {
                ResponseHandler::sendError("Cette réservation ne peut pas être annulée", 400);
            }
            
            // Annuler la réservation
            $query = "UPDATE reservations SET statut = 'annule' WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                // Libérer les places
                $this->updatePlacesDisponibles($reservation['trajet_id'], -$reservation['nombre_passagers']);
                
                // Log d'activité
                $this->logActivity($user['id'], 'annulation_reservation', 
                    "Réservation #{$reservation['code_reservation']} annulée");
                
                // Créer une notification
                $this->createNotification($user['id'], 
                    "Réservation annulée", 
                    "Votre réservation #{$reservation['code_reservation']} a été annulée",
                    'warning',
                    "/reservations/historique.html");
                
                ResponseHandler::sendSuccess(null, "Réservation annulée avec succès");
            } else {
                ResponseHandler::sendError("Erreur lors de l'annulation de la réservation", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur annulation réservation: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de l'annulation de la réservation", 500);
        }
    }
    
    private function getTrajetDetails($trajetId) {
        $query = "SELECT * FROM trajets WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $trajetId);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    private function getReservationDetails($reservationId) {
        $query = "SELECT * FROM reservations WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $reservationId);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    private function updatePlacesDisponibles($trajetId, $nombrePassagers) {
        $query = "UPDATE trajets SET places_disponibles = places_disponibles - :passagers WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':passagers', $nombrePassagers);
        $stmt->bindParam(':id', $trajetId);
        $stmt->execute();
    }
    
    private function generateReservationCode() {
        return 'RES' . date('Ymd') . strtoupper(bin2hex(random_bytes(3)));
    }
    
    private function canUserModifyReservation($userId, $reservationId, $userRole) {
        if ($userRole === 'admin') {
            return true;
        }
        
        $query = "SELECT id FROM reservations WHERE id = :id AND utilisateur_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $reservationId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
    
    private function canCancelReservation($reservation) {
        // Ne peut pas annuler une réservation déjà annulée ou terminée
        if (in_array($reservation['statut'], ['annule', 'complete'])) {
            return false;
        }
        
        // Vérifier la date du trajet (ne pas annuler moins de 2h avant le départ)
        $trajet = $this->getTrajetDetails($reservation['trajet_id']);
        $departDateTime = $trajet['date_depart'] . ' ' . $trajet['heure_depart'];
        $now = new DateTime();
        $depart = new DateTime($departDateTime);
        
        $interval = $now->diff($depart);
        $hoursBeforeDeparture = $interval->h + ($interval->days * 24);
        
        return $hoursBeforeDeparture >= 2;
    }
    
    private function getReservationTimeline($reservationId) {
        $timeline = [];
        
        // Récupérer la réservation
        $query = "SELECT * FROM reservations WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $reservationId);
        $stmt->execute();
        $reservation = $stmt->fetch();
        
        // Événement: Création
        $timeline[] = [
            'status' => 'completed',
            'icon' => '📝',
            'title' => 'Réservation créée',
            'description' => 'Votre réservation a été enregistrée',
            'time' => $reservation['date_reservation']
        ];
        
        // Événement: Confirmation
        if ($reservation['date_confirmation']) {
            $timeline[] = [
                'status' => 'completed',
                'icon' => '✅',
                'title' => 'Réservation confirmée',
                'description' => 'Votre réservation a été confirmée',
                'time' => $reservation['date_confirmation']
            ];
        }
        
        // Événement: Paiement
        if ($reservation['date_paiement']) {
            $timeline[] = [
                'status' => 'completed',
                'icon' => '💳',
                'title' => 'Paiement effectué',
                'description' => 'Le paiement a été traité',
                'time' => $reservation['date_paiement']
            ];
        }
        
        // Événements futurs selon le statut
        if (in_array($reservation['statut'], ['confirme', 'paye'])) {
            $timeline[] = [
                'status' => 'pending',
                'icon' => '🚌',
                'title' => 'Trajet en cours',
                'description' => 'Le trajet va bientôt commencer',
                'time' => null
            ];
        }
        
        if ($reservation['statut'] === 'complete') {
            $timeline[] = [
                'status' => 'completed',
                'icon' => '🎯',
                'title' => 'Trajet terminé',
                'description' => 'Vous êtes arrivé à destination',
                'time' => null
            ];
        }
        
        return $timeline;
    }
    
    private function createNotification($userId, $titre, $message, $type, $lien = null) {
        try {
            $query = "INSERT INTO notifications (utilisateur_id, titre, message, type, lien) 
                     VALUES (:user_id, :titre, :message, :type, :lien)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':titre', $titre);
            $stmt->bindParam(':message', $message);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':lien', $lien);
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erreur création notification: " . $e->getMessage());
        }
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