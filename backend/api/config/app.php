<?php
// Configuration de l'application MiabeTrans
class AppConfig {
    // Environnement (development, production)
    const ENVIRONMENT = 'development';
    
    // Configuration de la base de données
    const DB_CONFIG = [
        'development' => [
            'host' => 'localhost',
            'dbname' => 'miabetrans_db',
            'username' => 'root',
            'password' => ''
        ],
        'production' => [
            'host' => 'localhost',
            'dbname' => 'miabetrans_db',
            'username' => 'miabetrans_user',
            'password' => 'secure_password'
        ]
    ];
    
    // Configuration de l'application
    const APP_NAME = 'MiabeTrans';
    const APP_VERSION = '1.0.0';
    const APP_URL = 'http://localhost:3000';
    const API_URL = 'http://localhost/miabetrans/backend/api';
    
    // Configuration des emails
    const SMTP_CONFIG = [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'noreply@miabetrans.tg',
        'password' => 'email_password',
        'from_email' => 'noreply@miabetrans.tg',
        'from_name' => 'MiabeTrans'
    ];
    
    // Configuration des paiements
    const PAYMENT_CONFIG = [
        'flooz_merchant_code' => 'YOUR_MERCHANT_CODE',
        'tmoney_merchant_code' => 'YOUR_MERCHANT_CODE',
        'default_currency' => 'XOF'
    ];
    
    // Configuration de sécurité
    const SECURITY_CONFIG = [
        'jwt_secret' => 'your_jwt_secret_key_here',
        'jwt_expire' => 86400, // 24 heures en secondes
        'bcrypt_cost' => 12,
        'cors_origins' => ['http://localhost:3000', 'https://miabetrans.tg']
    ];
    
    // Configuration des notifications
    const NOTIFICATION_CONFIG = [
        'sms_enabled' => false,
        'email_enabled' => true,
        'push_enabled' => false,
        'default_language' => 'fr'
    ];
    
    public static function getDbConfig() {
        return self::DB_CONFIG[self::ENVIRONMENT];
    }
    
    public static function isDevelopment() {
        return self::ENVIRONMENT === 'development';
    }
    
    public static function isProduction() {
        return self::ENVIRONMENT === 'production';
    }
}

// Fonctions utilitaires
function logMessage($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    
    if (AppConfig::isDevelopment()) {
        error_log($logEntry);
    } else {
        // En production, écrire dans un fichier de log
        file_put_contents(__DIR__ . '/../logs/app.log', $logEntry, FILE_APPEND | LOCK_EX);
    }
}

function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validatePhone($phone) {
    return preg_match('/^(\+228|00228)?[0-9]{8}$/', $phone) === 1;
}

function generateReference($prefix = 'REF') {
    return $prefix . date('Ymd') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
}

function formatPrice($price) {
    return number_format($price, 2, ',', ' ') . ' FCFA';
}

function getCurrentDateTime() {
    return date('Y-m-d H:i:s');
}
?>