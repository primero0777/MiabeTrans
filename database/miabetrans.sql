-- ================================
-- Base de données
-- ================================
CREATE DATABASE IF NOT EXISTS miabetrans_db;
USE miabetrans_db;

-- ================================
-- Table : roles
-- ================================
CREATE TABLE IF NOT EXISTS roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (nom_role) VALUES
('client'), ('chauffeur'), ('admin');

-- ================================
-- Table : agences
-- ================================
CREATE TABLE IF NOT EXISTS agences (
    id_agence INT AUTO_INCREMENT PRIMARY KEY,
    nom_agence VARCHAR(100) NOT NULL,
    adresse VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(150)
);

INSERT INTO agences (nom_agence, adresse, telephone, email) VALUES
('MiaBeTrans Lomé', 'Rue de la Gare, Lomé', '22890000001', 'contact@miabetrans.tg'),
('Agence Sokodé', 'Carrefour Centrale, Sokodé', '22890000002', 'sokode@miabetrans.tg');

-- ================================
-- Table : utilisateurs
-- ================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    id_role INT NOT NULL,
    id_agence INT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    telephone VARCHAR(20) UNIQUE,
    email VARCHAR(150) UNIQUE,
    mot_de_passe TEXT NOT NULL,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES roles(id_role),
    FOREIGN KEY (id_agence) REFERENCES agences(id_agence)
);

-- ================================
-- Table : villes
-- ================================
CREATE TABLE IF NOT EXISTS villes (
    id_ville INT AUTO_INCREMENT PRIMARY KEY,
    nom_ville VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO villes (nom_ville) VALUES
('Lomé'), ('Sokodé'), ('Kara'), ('Aného'), ('Dapaong');

-- ================================
-- Table : bus
-- ================================
CREATE TABLE IF NOT EXISTS bus (
    id_bus INT AUTO_INCREMENT PRIMARY KEY,
    matricule VARCHAR(20) UNIQUE NOT NULL,
    nombre_places INT NOT NULL,
    chauffeur_id INT,
    type_bus ENUM('mini', 'classique', 'VIP') DEFAULT 'classique',
    statut ENUM('actif', 'inactif') DEFAULT 'actif',
    FOREIGN KEY (chauffeur_id) REFERENCES utilisateurs(id_utilisateur)
);

-- ================================
-- Table : trajets
-- ================================
CREATE TABLE IF NOT EXISTS trajets (
    id_trajet INT AUTO_INCREMENT PRIMARY KEY,
    id_ville_depart INT NOT NULL,
    id_ville_arrivee INT NOT NULL,
    distance_km INT,
    duree_estimee TIME,
    prix DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_ville_depart) REFERENCES villes(id_ville),
    FOREIGN KEY (id_ville_arrivee) REFERENCES villes(id_ville)
);

-- ================================
-- Table : horaires
-- ================================
CREATE TABLE IF NOT EXISTS horaires (
    id_horaire INT AUTO_INCREMENT PRIMARY KEY,
    id_trajet INT NOT NULL,
    id_bus INT NOT NULL,
    date_depart DATE,
    heure_depart TIME NOT NULL,
    heure_arrivee TIME,
    statut ENUM('prévu', 'en cours', 'terminé', 'annulé') DEFAULT 'prévu',
    FOREIGN KEY (id_trajet) REFERENCES trajets(id_trajet),
    FOREIGN KEY (id_bus) REFERENCES bus(id_bus)
);

-- ================================
-- Table : reservations
-- ================================
CREATE TABLE IF NOT EXISTS reservations (
    id_reservation INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT,
    id_horaire INT NOT NULL,
    nombre_places INT DEFAULT 1,
    date_reservation DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('confirmée', 'en attente', 'annulée') DEFAULT 'en attente',
    invite_nom VARCHAR(100),
    invite_telephone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
    FOREIGN KEY (id_horaire) REFERENCES horaires(id_horaire)
);

-- ================================
-- Table : paiements
-- ================================
CREATE TABLE IF NOT EXISTS paiements (
    id_paiement INT AUTO_INCREMENT PRIMARY KEY,
    id_reservation INT,
    montant DECIMAL(10,2) NOT NULL,
    mode_paiement ENUM('TMoney', 'Flooz', 'espèces', 'mobile money') DEFAULT 'espèces',
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('réussi', 'échec', 'en attente') DEFAULT 'en attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_reservation) REFERENCES reservations(id_reservation)
);

-- ================================
-- Table : notifications
-- ================================
CREATE TABLE IF NOT EXISTS notifications (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT,
    titre VARCHAR(150),
    message TEXT NOT NULL,
    type ENUM('info', 'reservation', 'paiement') DEFAULT 'info',
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

-- ================================
-- Table : evaluations
-- ================================
CREATE TABLE IF NOT EXISTS evaluations (
    id_evaluation INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT,
    id_horaire INT,
    note INT CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    date_evaluation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur),
    FOREIGN KEY (id_horaire) REFERENCES horaires(id_horaire)
);

-- ================================
-- Insertions : utilisateurs
-- ================================
INSERT INTO utilisateurs (id_role, id_agence, nom, prenom, email, mot_de_passe, telephone) VALUES
(1, 1, 'Kossi', 'Mensah', 'kossi.mensah@gmail.com', SHA2('password123', 256), '90234567'),
(1, 1, 'Afi', 'Dossou', 'afi.dossou@yahoo.com', SHA2('motdepasse456', 256), '90123456'),
(3, NULL, 'Kodjo', 'Tchalim', 'kodjo.tchalim@gmail.com', SHA2('adminpass', 256), '90000001'),
(2, 2, 'Nana', 'Abalo', 'nana.abalo@gmail.com', SHA2('chauffeur789', 256), '90987654');

-- ================================
-- Insertions : bus
-- ================================
INSERT INTO bus (matricule, nombre_places, chauffeur_id) VALUES
('TG-001-BUS', 45, 4),
('TG-002-BUS', 50, NULL),
('TG-003-BUS', 40, NULL);

-- ================================
-- Insertions : trajets
-- ================================
INSERT INTO trajets (id_ville_depart, id_ville_arrivee, prix) VALUES
(1, 2, 5000),
(1, 3, 7000),
(2, 3, 4500),
(1, 4, 3000),
(3, 5, 8000);

-- ================================
-- Insertions : horaires
-- ================================
INSERT INTO horaires (id_trajet, id_bus, heure_depart, heure_arrivee) VALUES
(1, 1, '07:00:00', '11:00:00'),
(1, 2, '14:00:00', '18:00:00'),
(2, 3, '08:00:00', '14:00:00'),
(4, 1, '12:00:00', '14:00:00'),
(5, 3, '09:00:00', '15:00:00');

-- ================================
-- Insertions : réservations
-- ================================
-- Avec compte
INSERT INTO reservations (id_utilisateur, id_horaire, nombre_places, statut)
VALUES
(1, 1, 1, 'confirmée'),
(2, 3, 1, 'confirmée');

-- Sans compte
INSERT INTO reservations (id_horaire, nombre_places, invite_nom, invite_telephone, statut)
VALUES
(4, 2, 'Kokou Akouété', '90221133', 'en attente');

-- ================================
-- Insertions : paiements
-- ================================
INSERT INTO paiements (id_reservation, montant, date_paiement, mode_paiement, statut) VALUES
(1, 5000, '2024-12-14', 'mobile money', 'réussi'),
(2, 7000, '2024-12-14', 'espèces', 'réussi');

-- ================================
-- Insertions : notifications
-- ================================
INSERT INTO notifications (id_utilisateur, message, lu, type) VALUES
(1, 'Votre réservation pour Lomé à Sokodé est confirmée.', FALSE, 'reservation'),
(2, 'Nouveau trajet Lomé → Kara disponible.', FALSE, 'info'),
(4, 'Vous avez un nouveau planning de bus assigné.', TRUE, 'info');

-- ================================
-- Insertions : évaluations
-- ================================
INSERT INTO evaluations (id_utilisateur, id_horaire, note, commentaire) VALUES
(1, 1, 4, 'Le bus était confortable et à l\'heure.'),
(2, 3, 3, 'Le trajet était un peu long, mais correct.');
