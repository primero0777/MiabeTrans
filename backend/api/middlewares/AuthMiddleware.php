<?php
class AuthMiddleware {
    public function authenticate() {
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            return false;
        }
        
        return true;
    }
    
    public function getUserId() {
        return $_SESSION['user_id'] ?? null;
    }
    
    public function getUserRole() {
        return $_SESSION['user_role'] ?? null;
    }
    
    public function hasRole($role) {
        return $this->getUserRole() === $role;
    }
    
    public function requireAuth() {
        if (!$this->authenticate()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Authentification requise']);
            exit();
        }
    }
    
    public function requireRole($role) {
        $this->requireAuth();
        
        if (!$this->hasRole($role)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Permissions insuffisantes']);
            exit();
        }
    }
}
?>