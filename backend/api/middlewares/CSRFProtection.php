<?php
require_once __DIR__ . '/../utils/responseHandler.php';

class CSRFProtection {
    private $tokenName = 'miabetrans_csrf_token';
    private $tokenLength = 32;
    
    public function __construct() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    public function generateToken() {
        if (empty($_SESSION[$this->tokenName])) {
            $_SESSION[$this->tokenName] = bin2hex(random_bytes($this->tokenLength));
        }
        
        return $_SESSION[$this->tokenName];
    }
    
    public function validateToken($token) {
        if (empty($_SESSION[$this->tokenName]) || empty($token)) {
            return false;
        }
        
        return hash_equals($_SESSION[$this->tokenName], $token);
    }
    
    public function validateRequest() {
        // Ne valider que pour les méthodes non-GET
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            return true;
        }
        
        $token = $this->getTokenFromRequest();
        
        if (!$this->validateToken($token)) {
            ResponseHandler::sendError("Token CSRF invalide", 403);
            return false;
        }
        
        // Régénérer le token après utilisation
        $this->generateToken();
        
        return true;
    }
    
    public function getTokenFromRequest() {
        // Chercher le token dans les headers d'abord
        $headers = apache_request_headers();
        if (isset($headers['X-CSRF-Token'])) {
            return $headers['X-CSRF-Token'];
        }
        
        // Puis dans le body JSON
        if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['csrf_token'])) {
                return $input['csrf_token'];
            }
        }
        
        // Enfin dans les données POST
        if (isset($_POST['csrf_token'])) {
            return $_POST['csrf_token'];
        }
        
        return null;
    }
    
    public function getTokenForForm() {
        return $this->generateToken();
    }
    
    public function addTokenToResponse($response) {
        if (is_array($response)) {
            $response['csrf_token'] = $this->generateToken();
        }
        return $response;
    }
}
?>  