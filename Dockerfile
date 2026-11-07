# ─────────────────────────────────────────────────────────────
# MiabeTrans — API PHP pour Render (offre gratuite)
# Reproduit l'arborescence locale de WampServer :
#   /var/www/html/backend/api/...   → https://<service>.onrender.com/backend/api/...
#   /var/www/html/uploads/...       → https://<service>.onrender.com/uploads/...
# ─────────────────────────────────────────────────────────────
FROM php:8.2-apache

# Extension MySQL pour PDO (cURL est déjà inclus, utilisé pour Brevo)
RUN docker-php-ext-install pdo_mysql \
 && a2enmod headers rewrite

# Réglages PHP de production
COPY docker/php.ini /usr/local/etc/php/conf.d/miabetrans.ini
# Règles Apache : fichiers sensibles inaccessibles depuis le web
COPY docker/apache-miabetrans.conf /etc/apache2/conf-enabled/miabetrans.conf
# Démarrage : Apache écoute sur le port imposé par Render ($PORT)
COPY docker/entrypoint.sh /usr/local/bin/miabetrans-entrypoint
RUN chmod +x /usr/local/bin/miabetrans-entrypoint

COPY docker/health.php /var/www/html/index.php
COPY backend/ /var/www/html/backend/

RUN mkdir -p /var/www/html/uploads/chauffeurs /var/www/html/uploads/voice-messages \
 && chown -R www-data:www-data /var/www/html/uploads

ENV APP_ENV=production
EXPOSE 10000
ENTRYPOINT ["miabetrans-entrypoint"]
CMD ["apache2-foreground"]
