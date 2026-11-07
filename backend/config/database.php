<?php
// config/database.php

require_once __DIR__ . '/env.php';

function getDB() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $host = env('DB_HOST', 'localhost');
    $port = env('DB_PORT', '3306');
    $name = env('DB_NAME', 'miabetrans_db');
    $user = env('DB_USER', 'root');
    $pass = env('DB_PASS', '');

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // Connexion chiffrée (obligatoire chez Aiven).
    // DB_SSL_CA : contenu du certificat ca.pem fourni par Aiven (texte complet).
    $caPem = env('DB_SSL_CA');
    if ($caPem) {
        $caPem  = str_replace('\n', "\n", $caPem); // accepte aussi le PEM collé sur une ligne
        $caFile = sys_get_temp_dir() . '/miabetrans-db-ca.pem';
        if (!file_exists($caFile) || file_get_contents($caFile) !== $caPem) {
            file_put_contents($caFile, $caPem);
        }
        $options[PDO::MYSQL_ATTR_SSL_CA] = $caFile;
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
    }

    try {
        $pdo = new PDO(
            "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4",
            $user,
            $pass,
            $options
        );
        // Lomé est en UTC+0 : on aligne MySQL sur PHP pour les délais d'expiration
        $pdo->exec("SET time_zone = '+00:00'");
        return $pdo;
    } catch (PDOException $e) {
        error_log('Connexion BDD impossible : ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur de connexion à la base de données.'
        ]);
        exit;
    }
}
