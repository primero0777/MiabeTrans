/*-- ============================================================
-- MIGRATION : Vérification email par OTP à l'inscription
-- + colonnes carte bancaire pour simulation paiement
-- À exécuter dans phpMyAdmin sur miabetrans_db
-- ============================================================

USE miabetrans_db;

-- 1. Table de vérification OTP (inscription + autres usages futurs)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id         INT(11) NOT NULL AUTO_INCREMENT,
    email      VARCHAR(100) NOT NULL,
    otp_code   VARCHAR(8)   NOT NULL,
    type       ENUM('inscription','reset_mdp','autre') NOT NULL DEFAULT 'inscription',
    used       TINYINT(1)   NOT NULL DEFAULT 0,
    attempts   TINYINT(1)   NOT NULL DEFAULT 0,
    expires_at DATETIME     NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email_type (email, type),
    INDEX idx_otp (otp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Colonne email_verifie dans utilisateurs
ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS email_verifie TINYINT(1) NOT NULL DEFAULT 0
    AFTER telephone;

-- 3. Les comptes existants sont considérés vérifiés
UPDATE utilisateurs SET email_verifie = 1 WHERE deleted_at IS NULL;

-- 4. Vérification
SELECT 'Migration OTP OK' AS message;
SELECT COUNT(*) AS nb_utilisateurs_verifies FROM utilisateurs WHERE email_verifie = 1;
*/


-- ============================================================
-- MIGRATION : Vérification email par OTP à l'inscription
-- + colonnes carte bancaire pour simulation paiement
-- ============================================================

USE miabetrans_db;

-- 1. Table de vérification OTP
CREATE TABLE IF NOT EXISTS otp_verifications (
    id         INT(11) NOT NULL AUTO_INCREMENT,
    email      VARCHAR(100) NOT NULL,
    otp_code   VARCHAR(8)   NOT NULL,
    type       ENUM('inscription','reset_mdp','autre') NOT NULL DEFAULT 'inscription',
    used       TINYINT(1)   NOT NULL DEFAULT 0,
    attempts   TINYINT(1)   NOT NULL DEFAULT 0,
    expires_at DATETIME     NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email_type (email, type),
    INDEX idx_otp (otp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Ajouter email_verifie (CORRIGÉ)
ALTER TABLE utilisateurs
    ADD COLUMN email_verifie TINYINT(1) NOT NULL DEFAULT 0
    AFTER telephone;

-- 3. Les comptes existants sont considérés vérifiés
UPDATE utilisateurs 
SET email_verifie = 1 
WHERE deleted_at IS NULL;

-- 4. Vérification
SELECT 'Migration OTP OK' AS message;
SELECT COUNT(*) AS nb_utilisateurs_verifies 
FROM utilisateurs 
WHERE email_verifie = 1;