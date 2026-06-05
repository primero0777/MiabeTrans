<?php
// api/admin/index.php
// Gère : bus, villes, utilisateurs, stats selon le paramètre ?resource=

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
requireAdmin();

$pdo      = getDB();
$method   = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? '';
$id       = $_GET['id'] ?? null;

// ===================== BUS =====================
if ($resource === 'bus') {
    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT b.id_bus, b.numero_bus, b.capacite, b.statut,
                   u.nom AS chauffeur
            FROM bus b
            LEFT JOIN utilisateurs u ON u.id_utilisateur = b.chauffeur_id
            WHERE b.deleted_at IS NULL
            ORDER BY b.id_bus ASC
        ');
        sendSuccess($stmt->fetchAll());
    }
    if ($method === 'POST') {
        $data = getBody();
        validateRequired($data, ['numero_bus', 'capacite']);
        $stmt = $pdo->prepare('
            INSERT INTO bus (numero_bus, chauffeur_id, capacite, statut)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([
            sanitize($data['numero_bus']),
            $data['chauffeur_id'] ?? null,
            (int)$data['capacite'],
            $data['statut'] ?? 'actif'
        ]);
        sendSuccess(['id_bus' => (int)$pdo->lastInsertId()], 'Bus ajouté.', 201);
    }
    if ($method === 'PUT' && $id) {
        $data = getBody();
        $stmt = $pdo->prepare('
            UPDATE bus SET numero_bus=?, chauffeur_id=?, capacite=?, statut=?
            WHERE id_bus=? AND deleted_at IS NULL
        ');
        $stmt->execute([
            sanitize($data['numero_bus']),
            $data['chauffeur_id'] ?? null,
            (int)$data['capacite'],
            $data['statut'] ?? 'actif',
            $id
        ]);
        sendSuccess([], 'Bus mis à jour.');
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare('UPDATE bus SET deleted_at=NOW() WHERE id_bus=?')->execute([$id]);
        sendSuccess([], 'Bus supprimé.');
    }
}

// ===================== VILLES =====================
if ($resource === 'villes') {
    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM villes ORDER BY nom_ville ASC');
        sendSuccess($stmt->fetchAll());
    }
    if ($method === 'POST') {
        $data = getBody();
        validateRequired($data, ['nom_ville']);
        $stmt = $pdo->prepare('INSERT INTO villes (nom_ville) VALUES (?)');
        $stmt->execute([sanitize($data['nom_ville'])]);
        sendSuccess(['id_ville' => (int)$pdo->lastInsertId()], 'Ville ajoutée.', 201);
    }
    if ($method === 'PUT' && $id) {
        $data = getBody();
        $stmt = $pdo->prepare('UPDATE villes SET nom_ville=? WHERE id_ville=?');
        $stmt->execute([sanitize($data['nom_ville']), $id]);
        sendSuccess([], 'Ville mise à jour.');
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare('DELETE FROM villes WHERE id_ville=?')->execute([$id]);
        sendSuccess([], 'Ville supprimée.');
    }
}

// ===================== UTILISATEURS =====================
if ($resource === 'utilisateurs') {
    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT u.id_utilisateur, u.nom, u.email, u.telephone,
                   u.date_creation, r.libelle_role
            FROM utilisateurs u
            JOIN roles r ON r.id_role = u.id_role
            WHERE u.deleted_at IS NULL
            ORDER BY u.date_creation DESC
        ');
        sendSuccess($stmt->fetchAll());
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare('UPDATE utilisateurs SET deleted_at=NOW() WHERE id_utilisateur=?')->execute([$id]);
        sendSuccess([], 'Utilisateur désactivé.');
    }
}

// ===================== CHAUFFEURS =====================
if ($resource === 'chauffeurs') {
    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT u.id_utilisateur, u.nom, u.email, u.telephone,
                   u.photo_profil, u.photo_cni
            FROM utilisateurs u
            JOIN roles r ON r.id_role = u.id_role
            WHERE r.libelle_role = "Chauffeur" AND u.deleted_at IS NULL
            ORDER BY u.nom ASC
        ');
        $rows = $stmt->fetchAll();
        $base = 'http://localhost/miabetrans/uploads/chauffeurs/';
        foreach ($rows as &$row) {
            $row['photo_profil_url'] = $row['photo_profil'] ? $base . $row['photo_profil'] : null;
            $row['photo_cni_url']    = $row['photo_cni']    ? $base . $row['photo_cni']    : null;
        }
        sendSuccess($rows);
    }
    if ($method === 'POST') {
        $data = getBody();
        validateRequired($data, ['nom', 'email', 'mot_de_passe']);
        $hash = password_hash($data['mot_de_passe'], PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('
            INSERT INTO utilisateurs (nom, email, telephone, mot_de_passe, id_role)
            VALUES (?, ?, ?, ?, 3)
        ');
        $stmt->execute([
            sanitize($data['nom']),
            sanitize($data['email']),
            sanitize($data['telephone'] ?? ''),
            $hash
        ]);
        sendSuccess(['id' => (int)$pdo->lastInsertId()], 'Chauffeur créé.', 201);
    }
    if ($method === 'DELETE' && $id) {
        $pdo->prepare('UPDATE utilisateurs SET deleted_at=NOW() WHERE id_utilisateur=?')->execute([$id]);
        sendSuccess([], 'Chauffeur désactivé.');
    }
}

// ===================== STATISTIQUES =====================
if ($resource === 'stats') {
    $stats = [];

    $stats['total_utilisateurs'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM utilisateurs WHERE deleted_at IS NULL AND id_role = 2'
    )->fetchColumn();

    $stats['total_chauffeurs'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM utilisateurs WHERE deleted_at IS NULL AND id_role = 3'
    )->fetchColumn();

    $stats['total_trajets'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM trajets WHERE deleted_at IS NULL'
    )->fetchColumn();

    $stats['total_bus'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM bus WHERE deleted_at IS NULL'
    )->fetchColumn();

    $stats['total_reservations'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM reservations'
    )->fetchColumn();

    $stats['reservations_confirmees'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM reservations WHERE statut_reservation = "confirmée"'
    )->fetchColumn();

    $stats['reservations_annulees'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM reservations WHERE statut_reservation = "annulée"'
    )->fetchColumn();

    // Revenus = somme des paiements liés à des réservations confirmées
    $stats['revenus_total'] = (float)$pdo->query(
        'SELECT COALESCE(SUM(p.montant), 0)
         FROM paiements p
         JOIN reservations r ON r.id_reservation = p.id_reservation
         WHERE r.statut_reservation = "confirmée"'
    )->fetchColumn();

    // Stats supplémentaires pour le dashboard
    $stats['reservations_en_attente'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM reservations WHERE statut_reservation = "en_attente"'
    )->fetchColumn();

    $stats['reservations_ce_mois'] = (int)$pdo->query(
        'SELECT COUNT(*) FROM reservations
         WHERE statut_reservation = "confirmée"
           AND MONTH(date_reservation) = MONTH(NOW())
           AND YEAR(date_reservation) = YEAR(NOW())'
    )->fetchColumn();

    $stats['revenus_ce_mois'] = (float)$pdo->query(
        'SELECT COALESCE(SUM(p.montant), 0)
         FROM paiements p
         JOIN reservations r ON r.id_reservation = p.id_reservation
         WHERE r.statut_reservation = "confirmée"
           AND MONTH(p.date_paiement) = MONTH(NOW())
           AND YEAR(p.date_paiement) = YEAR(NOW())'
    )->fetchColumn();

    sendSuccess($stats);
}

// ===================== REQUETES CLIENTS =====================
if ($resource === 'notifications') {
    if ($method === 'GET') {
        $stmt = $pdo->query('
            SELECT n.id_notification, n.contenu, n.lu, n.date_notification,
                   u.nom AS utilisateur, u.email
            FROM notifications n
            JOIN utilisateurs u ON u.id_utilisateur = n.id_utilisateur
            ORDER BY n.date_notification DESC
        ');
        sendSuccess($stmt->fetchAll());
    }
    if ($method === 'PUT' && $id) {
        $pdo->prepare('UPDATE notifications SET lu=1 WHERE id_notification=?')->execute([$id]);
        sendSuccess([], 'Notification marquée comme lue.');
    }
}

// ===================== ROLES =====================
if ($resource === 'roles') {
    $stmt = $pdo->query('SELECT id_role, libelle_role FROM roles ORDER BY id_role');
    sendSuccess($stmt->fetchAll());
}

sendError('Ressource inconnue.', 404);
