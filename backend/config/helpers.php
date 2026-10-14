<?php
// config/helpers.php

function setCorsHeaders() {
    $allowedOrigin = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
    header("Access-Control-Allow-Origin: $allowedOrigin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=UTF-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
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

function siteBaseUrl() {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
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
