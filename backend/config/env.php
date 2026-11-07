<?php
// config/env.php — lecture de la configuration
//
// Ordre de priorité :
//   1. variables d'environnement du serveur (Render, Docker…)
//   2. fichier backend/.env (développement local avec WampServer)
//   3. valeur par défaut passée à env()

function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        // Retirer les guillemets éventuels : KEY="valeur"
        if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && substr($value, -1) === $value[0]) {
            $value = substr($value, 1, -1);
        }
        // Une variable déjà définie par le serveur n'est jamais écrasée
        if (getenv($key) === false && !isset($_ENV[$key])) {
            $_ENV[$key] = $value;
        }
    }
}

function env(string $key, $default = null) {
    $value = getenv($key);
    if ($value !== false && $value !== '') return $value;
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return $_ENV[$key];
    return $default;
}

function isProduction(): bool {
    return env('APP_ENV', 'development') === 'production';
}

loadEnv(__DIR__ . '/../.env');

// Heure de Lomé (UTC+0), identique en local et sur le serveur
date_default_timezone_set(env('APP_TIMEZONE', 'Africa/Lome'));
