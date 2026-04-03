#!/bin/bash

# Script de déploiement MiabeTrans
# Usage: ./scripts/deploy.sh [environment]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="miabetrans"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DATABASE_DIR="database"
DEPLOY_USER="miabetrans"
DEPLOY_HOST="votre-serveur.com"
DEPLOY_PATH="/var/www/miabetrans"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

check_requirements() {
    log "Vérification des prérequis..."
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        error "Git n'est pas installé"
    fi
    
    # Vérifier SSH
    if ! command -v ssh &> /dev/null; then
        error "SSH n'est pas installé"
    fi
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -f "README.md" ] || [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
        error "Veuillez exécuter ce script depuis la racine du projet"
    fi
    
    log "✓ Tous les prérequis sont satisfaits"
}

build_frontend() {
    log "Construction du frontend..."
    
    cd $FRONTEND_DIR
    
    # Vérifier si Node.js est installé
    if ! command -v npm &> /dev/null; then
        warn "npm n'est pas installé, skip de la construction du frontend"
        cd ..
        return
    fi
    
    # Installer les dépendances
    log "Installation des dépendances frontend..."
    npm install
    
    # Build de production
    log "Build de production..."
    npm run build
    
    cd ..
    log "✓ Frontend construit avec succès"
}

prepare_deployment() {
    log "Préparation du déploiement..."
    
    # Créer un répertoire temporaire
    TEMP_DIR=$(mktemp -d)
    DEPLOY_DIR="$TEMP_DIR/$PROJECT_NAME"
    
    # Copier les fichiers nécessaires
    mkdir -p $DEPLOY_DIR
    
    # Backend
    cp -r $BACKEND_DIR $DEPLOY_DIR/
    cp -r $DATABASE_DIR $DEPLOY_DIR/
    
    # Frontend construit
    if [ -d "$FRONTEND_DIR/dist" ]; then
        cp -r $FRONTEND_DIR/dist $DEPLOY_DIR/frontend-dist
    else
        cp -r $FRONTEND_DIR $DEPLOY_DIR/frontend-dist
    fi
    
    # Fichiers de configuration
    cp package.json $DEPLOY_DIR/
    cp README.md $DEPLOY_DIR/
    cp .env.example $DEPLOY_DIR/
    
    # Exclure les fichiers de développement
    rm -rf $DEPLOY_DIR/$BACKEND_DIR/vendor
    rm -rf $DEPLOY_DIR/$BACKEND_DIR/composer.lock
    find $DEPLOY_DIR -name "*.log" -delete
    find $DEPLOY_DIR -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
    
    echo $DEPLOY_DIR
}

deploy_to_server() {
    local deploy_dir=$1
    
    log "Déploiement sur le serveur..."
    
    # Créer l'archive
    local archive_name="$PROJECT_NAME-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf $archive_name -C $(dirname $deploy_dir) $(basename $deploy_dir)
    
    # Transférer sur le serveur
    log "Transfert de l'archive..."
    scp $archive_name $DEPLOY_USER@$DEPLOY_HOST:/tmp/
    
    # Déployer sur le serveur
    log "Extraction et déploiement..."
    ssh $DEPLOY_USER@$DEPLOY_HOST "
        set -e
        cd /tmp
        tar -xzf $archive_name
        sudo rm -rf $DEPLOY_PATH
        sudo mv $PROJECT_NAME $DEPLOY_PATH
        sudo chown -R www-data:www-data $DEPLOY_PATH
        sudo chmod -R 755 $DEPLOY_PATH
        rm $archive_name
        
        # Configuration de l'environnement
        if [ -f '$DEPLOY_PATH/.env.example' ]; then
            if [ ! -f '$DEPLOY_PATH/.env' ]; then
                sudo cp '$DEPLOY_PATH/.env.example' '$DEPLOY_PATH/.env'
                warn 'Fichier .env créé, veuillez le configurer'
            fi
        fi
        
        # Redémarrage des services
        sudo systemctl reload apache2
        log '✓ Déploiement terminé sur le serveur'
    "
    
    # Nettoyer l'archive locale
    rm $archive_name
    rm -rf $deploy_dir
    
    log "✓ Déploiement terminé avec succès"
}

setup_database() {
    log "Configuration de la base de données..."
    
    ssh $DEPLOY_USER@$DEPLOY_HOST "
        set -e
        cd $DEPLOY_PATH
        
        if [ -f '$DATABASE_DIR/miabetrans.sql' ]; then
            # Vérifier si MySQL/MariaDB est installé
            if command -v mysql &> /dev/null; then
                # Importer la base de données (à adapter selon votre configuration)
                warn 'Import de la base de données - À configurer manuellement'
                # mysql -u username -p database_name < $DATABASE_DIR/miabetrans.sql
            else
                warn 'MySQL/MariaDB non détecté, skip de l import de la base'
            fi
        else
            warn 'Fichier SQL non trouvé'
        fi
    "
}

main() {
    log "Début du déploiement MiabeTrans en environnement $ENVIRONMENT"
    
    check_requirements
    build_frontend
    local deploy_dir=$(prepare_deployment)
    deploy_to_server $deploy_dir
    setup_database
    
    log "🎉 Déploiement terminé avec succès!"
    log "📱 Application disponible sur: https://$DEPLOY_HOST"
    log "🔧 Backend API: https://$DEPLOY_HOST/backend/api"
}

# Exécution principale
main "$@"