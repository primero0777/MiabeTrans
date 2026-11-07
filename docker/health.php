<?php
// Page d'accueil du serveur API (sert aussi de contrôle de santé pour Render)
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'service' => 'MiabeTrans API',
    'status'  => 'ok',
    'api'     => '/backend/api',
], JSON_UNESCAPED_UNICODE);
