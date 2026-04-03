<?php
// ================================
// Fichier : backend/api/index.php
// Objectif : centraliser toutes les routes API MiabeTrans
// ================================

require_once './config/database.php';

// === Autoriser le CORS (communication frontend/backend) ===
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// === Détection de la route demandée ===
$request = $_SERVER['REQUEST_URI'];

// === Routage basique ===
switch (true) {
    case strpos($request, '/api/trajets') !== false:
        require_once './routes/trajets.php';
        break;

    case strpos($request, '/api/reservations') !== false:
        require_once './routes/reservations.php';
        break;

    case strpos($request, '/api/utilisateurs') !== false:
        require_once './routes/utilisateurs.php';
        break;

    case strpos($request, '/api/chauffeurs') !== false:
        require_once './routes/chauffeurs.php';
        break;

    case strpos($request, '/api/notifications') !== false:
        require_once './routes/notifications.php';
        break;

    default:
        echo json_encode([
            "message" => "Bienvenue sur l’API MiabeTrans 🚍",
            "routes_disponibles" => [
                "/api/trajets",
                "/api/reservations",
                "/api/utilisateurs",
                "/api/chauffeurs",
                "/api/notifications"
            ]
        ]);
}
?>
