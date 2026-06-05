-- ============================================================
-- BASE DE DONNÉES : miabetrans_db
-- Projet : MiabeTrans - Gestion transport interurbain
-- Auteur : NATO Komi Ephraïm Dieudonné
-- Date   : 2026
-- ============================================================

CREATE DATABASE IF NOT EXISTS miabetrans_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE miabetrans_db;

-- ============================================================
-- TABLE 1 : roles
-- ============================================================
CREATE TABLE roles (
  id_role       INT(11) NOT NULL AUTO_INCREMENT,
  libelle_role  VARCHAR(50) NOT NULL,
  PRIMARY KEY (id_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (libelle_role) VALUES
  ('Administrateur'),
  ('Client'),
  ('Chauffeur');

-- ============================================================
-- TABLE 2 : utilisateurs
-- ============================================================
CREATE TABLE utilisateurs (
  id_utilisateur  INT(11) NOT NULL AUTO_INCREMENT,
  nom             VARCHAR(100) NOT NULL,
  email           VARCHAR(100) NOT NULL UNIQUE,
  telephone       VARCHAR(20) DEFAULT NULL,
  mot_de_passe    VARCHAR(255) NOT NULL,
  id_role         INT(11) NOT NULL DEFAULT 2,
  date_creation   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      DATETIME DEFAULT NULL,
  PRIMARY KEY (id_utilisateur),
  CONSTRAINT fk_util_role FOREIGN KEY (id_role)
    REFERENCES roles(id_role) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mot de passe haché pour "Admin@123"
INSERT INTO utilisateurs (nom, email, telephone, mot_de_passe, id_role) VALUES
  ('Administrateur MiabeTrans', 'admin@miabetrans.tg', '+22890000001',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('Komi Mensah', 'komi.mensah@gmail.com', '+22891234567',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2),
  ('Ama Dzifa', 'ama.dzifa@gmail.com', '+22892345678',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2),
  ('Kofi Agbodjan', 'kofi.chauffeur@miabetrans.tg', '+22893456789',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
  ('Yao Tsevi', 'yao.chauffeur@miabetrans.tg', '+22894567890',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3);

-- ============================================================
-- TABLE 3 : villes
-- ============================================================
CREATE TABLE villes (
  id_ville    INT(11) NOT NULL AUTO_INCREMENT,
  nom_ville   VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (id_ville)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO villes (nom_ville) VALUES
  ('Lomé'),
  ('Kpalimé'),
  ('Atakpamé'),
  ('Sokodé'),
  ('Kara'),
  ('Dapaong'),
  ('Tsévié'),
  ('Notsé'),
  ('Badou'),
  ('Mango');

-- ============================================================
-- TABLE 4 : bus
-- ============================================================
CREATE TABLE bus (
  id_bus        INT(11) NOT NULL AUTO_INCREMENT,
  numero_bus    VARCHAR(20) NOT NULL UNIQUE,
  chauffeur_id  INT(11) DEFAULT NULL,
  capacite      INT(4) NOT NULL DEFAULT 30,
  statut        ENUM('actif','en_maintenance','indisponible') NOT NULL DEFAULT 'actif',
  deleted_at    DATETIME DEFAULT NULL,
  PRIMARY KEY (id_bus),
  CONSTRAINT fk_bus_chauffeur FOREIGN KEY (chauffeur_id)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO bus (numero_bus, chauffeur_id, capacite, statut) VALUES
  ('TG-1234-AB', 4, 30, 'actif'),
  ('TG-5678-CD', 5, 25, 'actif'),
  ('TG-9012-EF', NULL, 35, 'en_maintenance'),
  ('TG-3456-GH', 4, 30, 'actif');

-- ============================================================
-- TABLE 5 : trajets
-- ============================================================
CREATE TABLE trajets (
  id_trajet         INT(11) NOT NULL AUTO_INCREMENT,
  id_ville_depart   INT(11) NOT NULL,
  id_ville_arrivee  INT(11) NOT NULL,
  distance_km       DECIMAL(10,2) NOT NULL DEFAULT 0,
  prix              DECIMAL(10,2) NOT NULL DEFAULT 0,
  deleted_at        DATETIME DEFAULT NULL,
  PRIMARY KEY (id_trajet),
  CONSTRAINT fk_trajet_depart  FOREIGN KEY (id_ville_depart)
    REFERENCES villes(id_ville) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_trajet_arrivee FOREIGN KEY (id_ville_arrivee)
    REFERENCES villes(id_ville) ON DELETE RESTRICT ON UPDATE CASCADE,




) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO trajets (id_ville_depart, id_ville_arrivee, distance_km, prix) VALUES
  (1, 2, 120.00, 2500.00),   -- Lomé → Kpalimé
  (1, 3, 161.00, 3000.00),   -- Lomé → Atakpamé
  (1, 4, 336.00, 5500.00),   -- Lomé → Sokodé
  (1, 5, 420.00, 6500.00),   -- Lomé → Kara
  (1, 6, 634.00, 9000.00),   -- Lomé → Dapaong
  (1, 7, 35.00,  1000.00),   -- Lomé → Tsévié
  (2, 1, 120.00, 2500.00),   -- Kpalimé → Lomé
  (3, 1, 161.00, 3000.00),   -- Atakpamé → Lomé
  (4, 1, 336.00, 5500.00),   -- Sokodé → Lomé
  (5, 1, 420.00, 6500.00);   -- Kara → Lomé

-- ============================================================
-- TABLE 6 : horaires
-- ============================================================
CREATE TABLE horaires (
  id_horaire    INT(11) NOT NULL AUTO_INCREMENT,
  id_trajet     INT(11) NOT NULL,
  id_bus        INT(11) NOT NULL,
  date_depart   DATETIME NOT NULL,
  statut        ENUM('prévu','en_cours','terminé','annulé') NOT NULL DEFAULT 'prévu',
  deleted_at    DATETIME DEFAULT NULL,
  PRIMARY KEY (id_horaire),
  CONSTRAINT fk_horaire_trajet FOREIGN KEY (id_trajet)
    REFERENCES trajets(id_trajet) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_horaire_bus FOREIGN KEY (id_bus)
    REFERENCES bus(id_bus) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO horaires (id_trajet, id_bus, date_depart, statut) VALUES
  (1, 1, '2026-06-10 06:00:00', 'prévu'),
  (1, 2, '2026-06-10 10:00:00', 'prévu'),
  (2, 1, '2026-06-11 07:00:00', 'prévu'),
  (3, 2, '2026-06-11 06:30:00', 'prévu'),
  (4, 4, '2026-06-12 05:00:00', 'prévu'),
  (5, 4, '2026-06-13 04:30:00', 'prévu'),
  (6, 2, '2026-06-10 08:00:00', 'prévu'),
  (7, 1, '2026-06-14 06:00:00', 'prévu');

-- ============================================================
-- TABLE 7 : reservations
-- ============================================================
CREATE TABLE reservations (
  id_reservation    INT(11) NOT NULL AUTO_INCREMENT,
  id_utilisateur    INT(11) NOT NULL,
  id_horaire        INT(11) NOT NULL,
  date_reservation  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut_reservation ENUM('en_attente','confirmée','annulée') NOT NULL DEFAULT 'en_attente',
  PRIMARY KEY (id_reservation),
  CONSTRAINT fk_resa_user FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_resa_horaire FOREIGN KEY (id_horaire)
    REFERENCES horaires(id_horaire) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO reservations (id_utilisateur, id_horaire, statut_reservation) VALUES
  (2, 1, 'confirmée'),
  (2, 3, 'en_attente'),
  (3, 2, 'confirmée'),
  (3, 5, 'annulée');

-- ============================================================
-- TABLE 8 : paiements
-- ============================================================
CREATE TABLE paiements (
  id_paiement     INT(11) NOT NULL AUTO_INCREMENT,
  id_reservation  INT(11) NOT NULL,
  montant         DECIMAL(10,2) NOT NULL,
  mode_paiement   ENUM('TMoney','Flooz','Cash','MobileMoney') NOT NULL DEFAULT 'Cash',
  date_paiement   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_paiement),
  CONSTRAINT fk_paiement_resa FOREIGN KEY (id_reservation)
    REFERENCES reservations(id_reservation) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO paiements (id_reservation, montant, mode_paiement) VALUES
  (1, 2500.00, 'TMoney'),
  (3, 2500.00, 'Flooz');

-- ============================================================
-- TABLE 9 : notifications
-- ============================================================
CREATE TABLE notifications (
  id_notification   INT(11) NOT NULL AUTO_INCREMENT,
  id_utilisateur    INT(11) NOT NULL,
  contenu           VARCHAR(255) NOT NULL,
  lu                TINYINT(1) NOT NULL DEFAULT 0,
  date_notification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_notification),
  CONSTRAINT fk_notif_user FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO notifications (id_utilisateur, contenu, lu) VALUES
  (2, 'Votre réservation Lomé → Kpalimé du 10/06/2026 est confirmée.', 1),
  (3, 'Votre réservation Lomé → Kpalimé du 10/06/2026 est confirmée.', 0),
  (2, 'Rappel : votre départ est demain à 07h00.', 0);

-- ============================================================
-- TABLE 10 : evaluations
-- ============================================================
CREATE TABLE evaluations (
  id_evaluation   INT(11) NOT NULL AUTO_INCREMENT,
  id_utilisateur  INT(11) NOT NULL,
  id_horaire      INT(11) NOT NULL,
  note            TINYINT(1) NOT NULL DEFAULT 5,
  commentaire     VARCHAR(255) DEFAULT NULL,
  date_evaluation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_evaluation),
  CONSTRAINT fk_eval_user FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_eval_horaire FOREIGN KEY (id_horaire)
    REFERENCES horaires(id_horaire) ON DELETE CASCADE ON UPDATE CASCADE



) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO evaluations (id_utilisateur, id_horaire, note, commentaire) VALUES
  (2, 1, 5, 'Excellent service, chauffeur ponctuel et bus confortable.'),
  (3, 2, 4, 'Bon voyage, léger retard au départ.');

-- ============================================================
-- VUE utile : détail complet d'un horaire
-- ============================================================
CREATE OR REPLACE VIEW vue_horaires_details AS
SELECT
  h.id_horaire,
  h.date_depart,
  h.statut,
  vd.nom_ville  AS ville_depart,
  va.nom_ville  AS ville_arrivee,
  t.distance_km,
  t.prix,
  b.numero_bus,
  b.capacite,
  u.nom         AS chauffeur,
  (SELECT COUNT(*) FROM reservations r
   WHERE r.id_horaire = h.id_horaire
   AND r.statut_reservation = 'confirmée') AS places_reservees,
  (b.capacite - (SELECT COUNT(*) FROM reservations r
   WHERE r.id_horaire = h.id_horaire
   AND r.statut_reservation = 'confirmée')) AS places_disponibles
FROM horaires h
JOIN trajets t   ON t.id_trajet = h.id_trajet
JOIN villes vd   ON vd.id_ville = t.id_ville_depart
JOIN villes va   ON va.id_ville = t.id_ville_arrivee
JOIN bus b       ON b.id_bus = h.id_bus
LEFT JOIN utilisateurs u ON u.id_utilisateur = b.chauffeur_id
WHERE h.deleted_at IS NULL;

USE miabetrans_db;

-- Ajout photo de profil et CNI aux utilisateurs (chauffeurs)
ALTER TABLE utilisateurs
  ADD COLUMN photo_profil VARCHAR(255) DEFAULT NULL AFTER telephone,
  ADD COLUMN photo_cni    VARCHAR(255) DEFAULT NULL AFTER photo_profil;

-- Ajout numéro de reçu unique aux réservations (pour QR code)
ALTER TABLE reservations
  ADD COLUMN numero_recu VARCHAR(20) DEFAULT NULL AFTER statut_reservation;

-- Générer des numéros de reçu pour les réservations existantes
UPDATE reservations
SET numero_recu = CONCAT('MT-', LPAD(id_reservation, 6, '0'), '-', YEAR(date_reservation))
WHERE numero_recu IS NULL;

-- Trigger pour auto-générer le numéro de reçu sur chaque nouvelle réservation
DELIMITER //
CREATE TRIGGER gen_numero_recu
BEFORE INSERT ON reservations
FOR EACH ROW
BEGIN
  SET NEW.numero_recu = CONCAT('MT-', LPAD((SELECT AUTO_INCREMENT FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'miabetrans_db' AND TABLE_NAME = 'reservations'), 6, '0'), '-', YEAR(NOW()));
END //
DELIMITER ;

-- Vérification
SELECT 'Migration appliquée avec succès !' AS message;
SELECT id_utilisateur, nom, photo_profil, photo_cni FROM utilisateurs WHERE id_role = 3;
SELECT id_reservation, numero_recu FROM reservations;


USE miabetrans_db;

-- 1. Ajouter la colonne prenom après nom
ALTER TABLE utilisateurs
  ADD COLUMN prenom VARCHAR(100) NOT NULL DEFAULT '' AFTER nom;

-- 2. Copier le 2ème mot du nom dans prenom (migration données existantes)
UPDATE utilisateurs
SET prenom = TRIM(SUBSTRING(nom, LOCATE(' ', nom) + 1)),
    nom    = TRIM(SUBSTRING_INDEX(nom, ' ', 1))
WHERE LOCATE(' ', nom) > 0;

-- 3. Table pour reset mot de passe
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT(11) NOT NULL AUTO_INCREMENT,
  email      VARCHAR(100) NOT NULL,
  token      VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_token (token),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table pour logs d'envoi notifications (mail/whatsapp)
CREATE TABLE IF NOT EXISTS notifications_envoi (
  id              INT(11) NOT NULL AUTO_INCREMENT,
  id_reservation  INT(11) DEFAULT NULL,
  id_utilisateur  INT(11) NOT NULL,
  type_envoi      ENUM('email','whatsapp','sms') NOT NULL DEFAULT 'email',
  sujet           VARCHAR(255) DEFAULT NULL,
  contenu         TEXT DEFAULT NULL,
  statut          ENUM('envoyé','échec','en_attente') NOT NULL DEFAULT 'en_attente',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_envoi_user FOREIGN KEY (id_utilisateur)
    REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Vérification
SELECT id_utilisateur, nom, prenom, email FROM utilisateurs;
SELECT 'Migration réussie !' AS message;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
