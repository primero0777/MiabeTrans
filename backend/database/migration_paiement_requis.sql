/*-- ============================================================
-- MIGRATION : Paiement requis avant validation réservation
-- À exécuter dans phpMyAdmin sur miabetrans_db
-- ============================================================
USE miabetrans_db;

-- 1. Ajouter les colonnes manquantes dans reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(30) DEFAULT NULL AFTER statut_reservation,
  ADD COLUMN IF NOT EXISTS reference_paiement VARCHAR(100) DEFAULT NULL AFTER mode_paiement,
  ADD COLUMN IF NOT EXISTS statut_paiement ENUM('non_paye','en_attente','paye') NOT NULL DEFAULT 'non_paye' AFTER reference_paiement,
  ADD COLUMN IF NOT EXISTS expire_le DATETIME DEFAULT NULL AFTER statut_paiement;

-- 2. Index pour nettoyer les réservations expirées
CREATE INDEX IF NOT EXISTS idx_expire_le ON reservations(expire_le);
CREATE INDEX IF NOT EXISTS idx_statut_paiement ON reservations(statut_paiement);

-- 3. Mettre les anciennes réservations confirmées comme payées
UPDATE reservations SET statut_paiement = 'paye' WHERE statut_reservation = 'confirmée';

SELECT 'Migration paiement requis terminée !' AS message;*/

-- ============================================================
-- MIGRATION : Paiement requis avant validation réservation
-- Compatible phpMyAdmin / MySQL (WAMP, XAMPP)
-- ============================================================

USE miabetrans_db;

-- 1. Ajouter les colonnes (sans IF NOT EXISTS)

ALTER TABLE reservations ADD COLUMN mode_paiement VARCHAR(30) DEFAULT NULL;
ALTER TABLE reservations ADD COLUMN reference_paiement VARCHAR(100) DEFAULT NULL;
ALTER TABLE reservations ADD COLUMN statut_paiement ENUM('non_paye','en_attente','paye') NOT NULL DEFAULT 'non_paye';
ALTER TABLE reservations ADD COLUMN expire_le DATETIME DEFAULT NULL;

-- 2. Ajouter les index (sans IF NOT EXISTS)

CREATE INDEX idx_expire_le ON reservations(expire_le);
CREATE INDEX idx_statut_paiement ON reservations(statut_paiement);

-- 3. Mettre à jour les anciennes réservations

UPDATE reservations 
SET statut_paiement = 'paye' 
WHERE statut_reservation = 'confirmée';

-- 4. Message final

SELECT 'Migration paiement requis terminée !' AS message;
