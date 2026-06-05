<?php
require_once __DIR__ . '/../utils/responseHandler.php';
require_once __DIR__ . '/AuthMiddleware.php';

class RoleMiddleware {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    public function requireRole($requiredRole) {
        $user = $this->auth->authenticate();
        
        if ($user['role'] !== $requiredRole && $user['role'] !== 'admin') {
            ResponseHandler::sendError("Accès non autorisé. Rôle requis: " . $requiredRole, 403);
        }
        
        return $user;
    }
    
    public function requireAnyRole($allowedRoles) {
        if (!is_array($allowedRoles)) {
            $allowedRoles = [$allowedRoles];
        }
        
        $user = $this->auth->authenticate();
        
        if (!in_array($user['role'], $allowedRoles) && $user['role'] !== 'admin') {
            ResponseHandler::sendError("Accès non autorisé. Rôles autorisés: " . implode(', ', $allowedRoles), 403);
        }
        
        return $user;
    }
    
    public function requireAdmin() {
        return $this->requireRole('admin');
    }
    
    public function requireChauffeurOrAdmin() {
        return $this->requireAnyRole(['chauffeur', 'admin']);
    }
    
    public function requireClientOrAdmin() {
        return $this->requireAnyRole(['client', 'admin']);
    }
    
    public function canAccessUserData($requestedUserId) {
        $user = $this->auth->authenticate();
        
        // Les admins peuvent accéder à toutes les données
        if ($user['role'] === 'admin') {
            return true;
        }
        
        // Les utilisateurs ne peuvent accéder qu'à leurs propres données
        return $user['id'] == $requestedUserId;
    }
    
    public function canManageResource($resourceOwnerId) {
        $user = $this->auth->authenticate();
        
        // Les admins peuvent tout gérer
        if ($user['role'] === 'admin') {
            return true;
        }
        
        // Les propriétaires peuvent gérer leurs ressources
        return $user['id'] == $resourceOwnerId;
    }
    
    public function getAccessLevel() {
        $user = $this->auth->authenticate();
        
        switch ($user['role']) {
            case 'admin':
                return 'full';
            case 'chauffeur':
                return 'chauffeur';
            case 'client':
                return 'client';
            default:
                return 'none';
        }
    }
    
    public function validatePermission($permission, $resource = null) {
        $user = $this->auth->authenticate();
        
        $permissions = $this->getUserPermissions($user);
        
        if (!in_array($permission, $permissions)) {
            ResponseHandler::sendError("Permission insuffisante: " . $permission, 403);
        }
        
        // Validation supplémentaire basée sur la ressource
        if ($resource && !$this->canAccessResource($user, $resource, $permission)) {
            ResponseHandler::sendError("Accès non autorisé à la ressource", 403);
        }
        
        return true;
    }
    
    private function getUserPermissions($user) {
        $basePermissions = ['view_profile', 'edit_profile'];
        
        switch ($user['role']) {
            case 'admin':
                return array_merge($basePermissions, [
                    'manage_users', 'manage_trajets', 'manage_reservations', 
                    'manage_chauffeurs', 'view_reports', 'manage_system'
                ]);
                
            case 'chauffeur':
                return array_merge($basePermissions, [
                    'view_assigned_trajets', 'update_trajet_status', 'report_issues',
                    'view_chauffeur_stats'
                ]);
                
            case 'client':
                return array_merge($basePermissions, [
                    'create_reservations', 'view_own_reservations', 'cancel_reservations',
                    'rate_trips'
                ]);
                
            default:
                return $basePermissions;
        }
    }
    
    private function canAccessResource($user, $resource, $permission) {
        // Implémentation spécifique selon le type de ressource
        switch ($permission) {
            case 'view_own_reservations':
                return isset($resource['utilisateur_id']) && $resource['utilisateur_id'] == $user['id'];
                
            case 'update_trajet_status':
                return isset($resource['chauffeur_id']) && $this->isChauffeurAssigned($user, $resource['chauffeur_id']);
                
            default:
                return true;
        }
    }
    
    private function isChauffeurAssigned($user, $chauffeurId) {
        // Vérifier si l'utilisateur est le chauffeur assigné
        $query = "SELECT id FROM chauffeurs WHERE id = :chauffeur_id AND utilisateur_id = :user_id";
        $stmt = $this->auth->conn->prepare($query);
        $stmt->bindParam(':chauffeur_id', $chauffeurId);
        $stmt->bindParam(':user_id', $user['id']);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
}
?>