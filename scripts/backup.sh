#!/bin/bash

# Script de sauvegarde de la base de données MiabeTrans

set -e

# Configuration
BACKUP_DIR="./backups"
DB_NAME="miabetrans"
DB_USER="root"
DB_PASS=""
RETENTION_DAYS=7

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${DB_NAME}_backup_$timestamp.sql"
    
    log "Création de la sauvegarde: $backup_file"
    
    # Créer le répertoire de sauvegarde s'il n'existe pas
    mkdir -p $BACKUP_DIR
    
    # Sauvegarde MySQL
    if mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $backup_file; then
        log "✓ Sauvegarde créée avec succès"
        
        # Compresser la sauvegarde
        gzip $backup_file
        log "✓ Sauvegarde compressée: ${backup_file}.gz"
        
        echo "${backup_file}.gz"
    else
        error "Échec de la sauvegarde de la base de données"
    fi
}

clean_old_backups() {
    log "Nettoyage des anciennes sauvegardes (plus de $RETENTION_DAYS jours)..."
    
    find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    log "✓ Nettoyage terminé"
}

list_backups() {
    log "Liste des sauvegardes disponibles:"
    ls -la $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "Aucune sauvegarde trouvée"
}

restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "Veuillez spécifier le fichier de sauvegarde à restaurer"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Fichier de sauvegarde non trouvé: $backup_file"
    fi
    
    log "Restauration depuis: $backup_file"
    
    # Décompresser si nécessaire
    if [[ $backup_file == *.gz ]]; then
        log "Décompression de la sauvegarde..."
        gunzip -c $backup_file > "${backup_file%.gz}"
        backup_file="${backup_file%.gz}"
    fi
    
    # Restauration
    if mysql -u $DB_USER -p$DB_PASS $DB_NAME < $backup_file; then
        log "✓ Restauration terminée avec succès"
    else
        error "Échec de la restauration"
    fi
    
    # Nettoyer le fichier décompressé temporaire
    if [[ $1 == *.gz ]]; then
        rm $backup_file
    fi
}

main() {
    case "${1:-create}" in
        "create")
            create_backup
            clean_old_backups
            ;;
        "list")
            list_backups
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "clean")
            clean_old_backups
            ;;
        *)
            echo "Usage: $0 {create|list|restore|clean}"
            echo "  create - Créer une nouvelle sauvegarde"
            echo "  list   - Lister les sauvegardes disponibles"
            echo "  restore <file> - Restaurer depuis un fichier"
            echo "  clean  - Nettoyer les anciennes sauvegardes"
            exit 1
            ;;
    esac
}

main "$@"