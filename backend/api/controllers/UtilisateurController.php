<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/responseHandler.php';
require_once __DIR__ . '/../utils/validator.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';

class UtilisateurController {
    private $db;
    private $conn;
    private $validator;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->validator = new Validator();
    }
    
    public function getUtilisateurs() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $offset = ($page - 1) * $limit;
            
            // Construire la requête avec filtres
            $query = "SELECT id, prenom, nom, email, telephone, role, ville, 
                             date_inscription, statut, email_verifie
                      FROM utilisateurs WHERE 1=1";
            $countQuery = "SELECT COUNT(*) FROM utilisateurs WHERE 1=1";
            $params = [];
            
            // Filtres
            if (isset($_GET['role'])) {
                $query .= " AND role = :role";
                $countQuery .= " AND role = :role";
                $params[':role'] = $_GET['role'];
            }
            
            if (isset($_GET['statut'])) {
                $query .= " AND statut = :statut";
                $countQuery .= " AND statut = :statut";
                $params[':statut'] = $_GET['statut'];
            }
            
            if (isset($_GET['ville'])) {
                $query .= " AND ville = :ville";
                $countQuery .= " AND ville = :ville";
                $params[':ville'] = $_GET['ville'];
            }
            
            if (isset($_GET['search'])) {
                $search = "%{$_GET['search']}%";
                $query .= " AND (prenom LIKE :search OR nom LIKE :search OR email LIKE :search)";
                $countQuery .= " AND (prenom LIKE :search OR nom LIKE :search OR email LIKE :search)";
                $params[':search'] = $search;
            }
            
            // Compter le total
            $countStmt = $this->conn->prepare($countQuery);
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();
            
            // Ajouter le tri et la pagination
            $query .= " ORDER BY date_inscription DESC LIMIT :limit OFFSET :offset";
            $params[':limit'] = $limit;
            $params[':offset'] = $offset;
            
            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                if ($key === ':limit' || $key === ':offset') {
                    $stmt->bindValue($key, $value, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue($key, $value);
                }
            }
            $stmt->execute();
            
            $utilisateurs = $stmt->fetchAll();
            
            ResponseHandler::sendSuccess([
                'utilisateurs' => $utilisateurs,
                'pagination' => [
                    'page' => intval($page),
                    'limit' => intval($limit),
                    'total' => intval($total),
                    'pages' => ceil($total / $limit)
                ]
            ], "Utilisateurs récupérés avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération utilisateurs: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération des utilisateurs", 500);
        }
    }
    
    public function getUtilisateur($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            $query = "SELECT id, prenom, nom, email, telephone, role, ville, adresse,
                             date_naissance, date_inscription, statut, email_verifie
                      FROM utilisateurs WHERE id = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                ResponseHandler::sendError("Utilisateur non trouvé", 404);
            }
            
            $utilisateur = $stmt->fetch();
            
            // Ajouter les statistiques si demandé
            if (isset($_GET['with_stats']) && $_GET['with_stats'] === 'true') {
                $utilisateur['statistiques'] = $this->getUserStats($id);
            }
            
            ResponseHandler::sendSuccess($utilisateur, "Utilisateur récupéré avec succès");
            
        } catch (PDOException $e) {
            error_log("Erreur récupération utilisateur: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la récupération de l'utilisateur", 500);
        }
    }
    
    public function createUtilisateur() {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Validation des données
            $errors = $this->validator->validate($data, [
                'prenom' => 'required|min:2|max:100',
                'nom' => 'required|min:2|max:100',
                'email' => 'required|email|unique:utilisateurs,email',
                'telephone' => 'required|min:8|max:20',
                'password' => 'required|min:6',
                'role' => 'required|in:client,chauffeur,admin'
            ]);
            
            if (!empty($errors)) {
                ResponseHandler::sendValidationError($errors);
            }
            
            // Hasher le mot de passe
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $query = "INSERT INTO utilisateurs (prenom, nom, email, telephone, password, role, ville, adresse, statut) 
                     VALUES (:prenom, :nom, :email, :telephone, :password, :role, :ville, :adresse, :statut)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':prenom', $data['prenom']);
            $stmt->bindParam(':nom', $data['nom']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':telephone', $data['telephone']);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':role', $data['role']);
            $stmt->bindParam(':ville', $data['ville']);
            $stmt->bindParam(':adresse', $data['adresse']);
            $stmt->bindParam(':statut', $data['statut'] ?? 'actif');
            
            if ($stmt->execute()) {
                $userId = $this->conn->lastInsertId();
                
                // Si c'est un chauffeur, créer l'entrée dans la table chauffeurs
                if ($data['role'] === 'chauffeur') {
                    $this->createChauffeur($userId, $data);
                }
                
                // Log d'activité
                $this->logActivity($user['id'], 'creation_utilisateur', 
                    "Nouvel utilisateur créé: {$data['prenom']} {$data['nom']} ({$data['role']})");
                
                ResponseHandler::sendSuccess(['user_id' => $userId], "Utilisateur créé avec succès", 201);
            } else {
                ResponseHandler::sendError("Erreur lors de la création de l'utilisateur", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur création utilisateur: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la création de l'utilisateur", 500);
        }
    }
    
    public function updateUtilisateur($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Vérifier que l'utilisateur existe
            if (!$this->userExists($id)) {
                ResponseHandler::sendError("Utilisateur non trouvé", 404);
            }
            
            // Construire la requête dynamiquement
            $updates = [];
            $params = [':id' => $id];
            
            $allowedFields = ['prenom', 'nom', 'telephone', 'ville', 'adresse', 'statut', 'role'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }
            
            if (empty($updates)) {
                ResponseHandler::sendError("Aucune donnée à mettre à jour", 400);
            }
            
            $query = "UPDATE utilisateurs SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
            if ($stmt->execute($params)) {
                // Log d'activité
                $this->logActivity($user['id'], 'mise_a_jour_utilisateur', 
                    "Utilisateur #$id mis à jour");
                
                ResponseHandler::sendSuccess(null, "Utilisateur mis à jour avec succès");
            } else {
                ResponseHandler::sendError("Erreur lors de la mise à jour de l'utilisateur", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur mise à jour utilisateur: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la mise à jour de l'utilisateur", 500);
        }
    }
    
    public function deleteUtilisateur($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            // Empêcher la suppression de soi-même
            if ($id == $user['id']) {
                ResponseHandler::sendError("Vous ne pouvez pas supprimer votre propre compte", 400);
            }
            
            $query = "DELETE FROM utilisateurs WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                // Log d'activité
                $this->logActivity($user['id'], 'suppression_utilisateur', 
                    "Utilisateur #$id supprimé");
                
                ResponseHandler::sendSuccess(null, "Utilisateur supprimé avec succès");
            } else {
                ResponseHandler::sendError("Erreur lors de la suppression de l'utilisateur", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur suppression utilisateur: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors de la suppression de l'utilisateur", 500);
        }
    }
    
    public function changeStatut($id) {
        try {
            $auth = new AuthMiddleware();
            $user = $auth->requireAdmin();
            
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['statut']) || !in_array($data['statut'], ['actif', 'inactif', 'suspendu'])) {
                ResponseHandler::sendError("Statut invalide", 400);
            }
            
            $query = "UPDATE utilisateurs SET statut = :statut WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':statut', $data['statut']);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                // Log d'activité
                $this->logActivity($user['id'], 'changement_statut_utilisateur', 
                    "Statut utilisateur #$id changé en: {$data['statut']}");
                
                ResponseHandler::sendSuccess(null, "Statut utilisateur modifié avec succès");
            } else {
                ResponseHandler::sendError("Erreur lors du changement de statut", 500);
            }
            
        } catch (PDOException $e) {
            error_log("Erreur changement statut: " . $e->getMessage());
            ResponseHandler::sendError("Erreur lors du changement de statut", 500);
        }
    }
    
    private function createChauffeur($userId, $data) {
        try {
            $query = "INSERT INTO chauffeurs (utilisateur_id, numero_permis, type_permis, date_expiration_permis, annees_experience) 
                     VALUES (:user_id, :numero_permis, :type_permis, :date_expiration, :experience)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':numero_permis', $data['numero_permis'] ?? '');
            $stmt->bindParam(':type_permis', $data['type_permis'] ?? 'B');
            $stmt->bindParam(':date_expiration', $data['date_expiration_permis'] ?? null);
            $stmt->bindParam(':experience', $data['annees_experience'] ?? 0);
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erreur création chauffeur: " . $e->getMessage());
        }
    }
    
    private function userExists($id) {
        $query = "SELECT id FROM utilisateurs WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
    
    private function getUserStats($userId) {
        $stats = [
            'reservations_total' => 0,
            'reservations_actives' => 0,
            'depenses_total' => 0
        ];
        
        try {
            // Réservations totales
            $query = "SELECT COUNT(*) as total FROM reservations WHERE utilisateur_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $stats['reservations_total'] = intval($stmt->fetchColumn());
            
            // Réservations actives
            $query = "SELECT COUNT(*) as total FROM reservations 
                     WHERE utilisateur_id = :user_id AND statut IN ('en_attente', 'confirme', 'paye')";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $stats['reservations_actives'] = intval($stmt->fetchColumn());
            
            // Dépenses totales
            $query = "SELECT SUM(prix_total) as total FROM reservations 
                     WHERE utilisateur_id = :user_id AND statut IN ('paye', 'complete')";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $stats['depenses_total'] = floatval($stmt->fetchColumn() ?? 0);
            
        } catch (PDOException $e) {
            error_log("Erreur stats utilisateur: " . $e->getMessage());
        }
        
        return $stats;
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