#!/bin/sh
set -e
# Render fournit le port d'écoute dans $PORT (10000 par défaut)
PORT="${PORT:-10000}"
sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf
exec docker-php-entrypoint "$@"
