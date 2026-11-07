<?php
// config/helpers.php

require_once __DIR__ . '/env.php';

function setCorsHeaders() {
    // Origines autorisées, séparées par des virgules.
    // Ex. : CORS_ORIGINS=https://primero0777.github.io,http://localhost:5173
    // (une origine = protocole + domaine, sans le chemin /miabetrans)
    $allowed = array_filter(array_map('trim', explode(',', env('CORS_ORIGINS', 'http://localhost:5173'))));
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin !== '' && in_array(rtrim($origin, '/'), array_map(fn($o) => rtrim($o, '/'), $allowed), true)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json; charset=UTF-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function sendJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sendSuccess($data = [], $message = 'Succès', $code = 200) {
    sendJson([
        'success' => true,
        'message' => $message,
        'data'    => $data
    ], $code);
}

function sendError($message = 'Erreur', $code = 400) {
    sendJson([
        'success' => false,
        'message' => $message
    ], $code);
}

function getBody() {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?? [];
}

/**
 * Racine publique du serveur PHP (là où se trouvent /backend et /uploads).
 * Local : http://localhost/miabetrans — En ligne : https://xxx.onrender.com
 * PUBLIC_URL permet de la forcer si la détection automatique se trompe.
 */
function siteBaseUrl() {
    $url = env('PUBLIC_URL');
    if ($url) return rtrim($url, '/');

    // Derrière le proxy de Render, le HTTPS est signalé par X-Forwarded-Proto
    $scheme = $_SERVER['HTTP_X_FORWARDED_PROTO']
        ?? ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $prefix = preg_replace('#/backend/.*$#', '', $_SERVER['SCRIPT_NAME'] ?? '');
    return $scheme . '://' . $host . $prefix;
}

function sanitize($value) {
    return htmlspecialchars(strip_tags(trim($value)));
}

function validateRequired(array $data, array $fields) {
    foreach ($fields as $field) {
        if (empty($data[$field])) {
            sendError("Le champ '$field' est requis.", 422);
        }
    }
}
