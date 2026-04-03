<?php
class ResponseHandler {
    public function sendSuccess($data = null, $message = 'Succès') {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data
        ];
        
        echo json_encode($response);
        exit();
    }
    
    public function sendError($message = 'Erreur', $code = 400, $details = null) {
        http_response_code($code);
        
        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => $code
        ];
        
        if($details !== null) {
            $response['details'] = $details;
        }
        
        echo json_encode($response);
        exit();
    }
    
    public function sendValidationError($errors) {
        $this->sendError('Erreur de validation', 422, $errors);
    }
    
    public function sendNotFound($message = 'Ressource non trouvée') {
        $this->sendError($message, 404);
    }
    
    public function sendUnauthorized($message = 'Non autorisé') {
        $this->sendError($message, 401);
    }
    
    public function sendForbidden($message = 'Accès refusé') {
        $this->sendError($message, 403);
    }
}
?>