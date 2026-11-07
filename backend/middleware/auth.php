<?php
// middleware/auth.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';

// ---------- Secret JWT ----------
function jwtSecret(): string {
    $secret = env('JWT_SECRET');
    if (!$secret || $secret === 'change_me_with_a_long_random_string') {
        if (isProduction()) {
            // En ligne, un secret absent ou par défaut permettrait de forger des jetons admin
            error_log('JWT_SECRET manquant ou par défaut en production');
            sendError('Configuration serveur incomplète.', 500);
        }
        return 'dev-secret-local-uniquement';
    }
    return $secret;
}

// ---------- Génération JWT ----------
function generateJWT($payload) {
    $secret = jwtSecret();
    $expiration = intval(env('JWT_EXPIRATION', 86400));

    $header = base64UrlEncode(json_encode([
        'alg' => 'HS256',
        'typ' => 'JWT'
    ]));

    $payload['iat'] = time();
    $payload['exp'] = time() + $expiration;

    $payloadEncoded = base64UrlEncode(json_encode($payload));
    $signature = base64UrlEncode(
        hash_hmac('sha256', "$header.$payloadEncoded", $secret, true)
    );

    return "$header.$payloadEncoded.$signature";
}

// ---------- Vérification JWT ----------
function verifyJWT($token) {
    $secret = jwtSecret();
    $parts = explode('.', $token);

    if (count($parts) !== 3) return false;

    [$header, $payload, $signature] = $parts;

    $expectedSignature = base64UrlEncode(
        hash_hmac('sha256', "$header.$payload", $secret, true)
    );

    if (!hash_equals($expectedSignature, $signature)) return false;

    $decoded = json_decode(base64UrlDecode($payload), true);

    if (!$decoded || $decoded['exp'] < time()) return false;

    return $decoded;
}

// ---------- Récupérer l'utilisateur connecté ----------
function getAuthUser() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization']
        ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        sendError('Token manquant ou invalide.', 401);
    }

    $token = substr($authHeader, 7);
    $decoded = verifyJWT($token);

    if (!$decoded) {
        sendError('Token expiré ou invalide.', 401);
    }

    return $decoded;
}

// ---------- Vérifier le rôle admin ----------
function requireAdmin() {
    $user = getAuthUser();
    if ($user['role'] !== 'Administrateur') {
        sendError('Accès refusé. Droits administrateur requis.', 403);
    }
    return $user;
}

// ---------- Vérifier le rôle chauffeur ou admin ----------
function requireChauffeurOrAdmin() {
    $user = getAuthUser();
    if (!in_array($user['role'], ['Administrateur', 'Chauffeur'])) {
        sendError('Accès refusé.', 403);
    }
    return $user;
}

// ---------- Helpers base64 URL safe ----------
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 4 - strlen($data) % 4));
}
