<?php
class Helpers {
    
    // Formater un prix
    public static function formatPrice($price, $currency = 'FCFA') {
        return number_format($price, 0, ',', ' ') . ' ' . $currency;
    }
    
    // Formater une date
    public static function formatDate($dateString, $format = 'd/m/Y') {
        $date = new DateTime($dateString);
        return $date->format($format);
    }
    
    // Formater une date et heure
    public static function formatDateTime($dateString, $format = 'd/m/Y H:i') {
        $date = new DateTime($dateString);
        return $date->format($format);
    }
    
    // Calculer la durée entre deux dates
    public static function calculateDuration($start, $end) {
        $start = new DateTime($start);
        $end = new DateTime($end);
        $interval = $start->diff($end);
        
        $parts = [];
        if ($interval->h > 0) {
            $parts[] = $interval->h . 'h';
        }
        if ($interval->i > 0) {
            $parts[] = $interval->i . 'min';
        }
        
        return implode(' ', $parts) ?: '0min';
    }
    
    // Générer un code aléatoire
    public static function generateRandomCode($length = 8, $prefix = '') {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $code = '';
        
        for ($i = 0; $i < $length; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        return $prefix . $code;
    }
    
    // Valider un email
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    // Valider un numéro de téléphone (format Togo)
    public static function isValidPhone($phone) {
        return preg_match('/^(\+228|00228)?[0-9]{8}$/', $phone);
    }
    
    // Nettoyer une chaîne de caractères
    public static function sanitize($string) {
        return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
    }
    
    // Limiter le texte
    public static function limitText($text, $limit = 100, $suffix = '...') {
        if (mb_strlen($text) <= $limit) {
            return $text;
        }
        
        return mb_substr($text, 0, $limit) . $suffix;
    }
    
    // Convertir en slug
    public static function slugify($text) {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        
        return $text ?: 'n-a';
    }
    
    // Obtenir l'IP du client
    public static function getClientIP() {
        $ip = '';
        
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        }
        
        return $ip;
    }
    
    // Logger une activité
    public static function logActivity($message, $level = 'INFO') {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
        
        $logFile = __DIR__ . '/../../logs/app.log';
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    // Envoyer un email
    public static function sendEmail($to, $subject, $message, $headers = '') {
        if (empty($headers)) {
            $headers = 'From: no-reply@miabetrans.tg' . "\r\n" .
                      'Reply-To: no-reply@miabetrans.tg' . "\r\n" .
                      'X-Mailer: PHP/' . phpversion() . "\r\n" .
                      'Content-type: text/html; charset=utf-8';
        }
        
        return mail($to, $subject, $message, $headers);
    }
    
    // Uploader un fichier
    public static function uploadFile($file, $allowedTypes = [], $maxSize = 2097152) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'error' => 'Erreur lors de l\'upload'];
        }
        
        // Vérifier la taille
        if ($file['size'] > $maxSize) {
            return ['success' => false, 'error' => 'Fichier trop volumineux'];
        }
        
        // Vérifier le type
        $fileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!empty($allowedTypes) && !in_array($fileType, $allowedTypes)) {
            return ['success' => false, 'error' => 'Type de fichier non autorisé'];
        }
        
        // Générer un nom unique
        $fileName = uniqid() . '.' . $fileType;
        $uploadPath = __DIR__ . '/../../uploads/' . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            return [
                'success' => true,
                'file_name' => $fileName,
                'file_path' => '/uploads/' . $fileName,
                'original_name' => $file['name']
            ];
        }
        
        return ['success' => false, 'error' => 'Erreur lors du déplacement du fichier'];
    }
    
    // Générer un QR code (simulation)
    public static function generateQRCode($data) {
        // En production, utiliser une librairie comme endroid/qr-code
        $qrData = base64_encode($data);
        return "data:image/png;base64,{$qrData}"; // Simulation
    }
    
    // Calculer la distance entre deux villes (simulation)
    public static function calculateDistance($ville1, $ville2) {
        $distances = [
            'Lomé-Kpalimé' => 120,
            'Lomé-Sokodé' => 350,
            'Lomé-Kara' => 420,
            'Kpalimé-Sokodé' => 230,
            'Kpalimé-Kara' => 300,
            'Sokodé-Kara' => 150
        ];
        
        $key1 = "{$ville1}-{$ville2}";
        $key2 = "{$ville2}-{$ville1}";
        
        return $distances[$key1] ?? $distances[$key2] ?? 100;
    }
}
?>