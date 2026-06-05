<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/mailer.php';

setCorsHeaders();
requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];
$pdo    = getDB();

// ===================== GET - Liste horaires + disponibilités =====================
if ($method === 'GET') {
    $resource = $_GET['resource'] ?? 'horaires';

    // Tous les horaires planifiés
    if ($resource === 'horaires') {
        $stmt = $pdo->query('
            SELECT h.id_horaire, h.date_depart, h.statut,
                   vd.nom_ville AS ville_depart,
                   va.nom_ville AS ville_arrivee,
                   t.id_trajet, t.prix, t.distance_km,
                   b.id_bus, b.numero_bus, b.capacite,
                   u.id_utilisateur AS chauffeur_id,
                   u.prenom AS chauffeur_prenom,
                   u.nom    AS chauffeur_nom,
                   (SELECT COUNT(*) FROM reservations r
                    WHERE r.id_horaire = h.id_horaire
                    AND r.statut_reservation = "confirmée") AS places_reservees
            FROM horaires h
            JOIN trajets t   ON t.id_trajet  = h.id_trajet
            JOIN villes vd   ON vd.id_ville  = t.id_ville_depart
            JOIN villes va   ON va.id_ville  = t.id_ville_arrivee
            JOIN bus b       ON b.id_bus     = h.id_bus
            LEFT JOIN utilisateurs u ON u.id_utilisateur = b.chauffeur_id
            WHERE h.deleted_at IS NULL
            ORDER BY h.date_depart DESC
        ');
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['chauffeur_nom_complet'] = trim(($row['chauffeur_prenom']??'') . ' ' . ($row['chauffeur_nom']??''));
            $row['places_disponibles']    = max(0, $row['capacite'] - $row['places_reservees']);
        }
        sendSuccess($rows);
    }

    // Bus disponibles avec statut d'occupation en temps réel
    if ($resource === 'bus_disponibles') {
        $dateDepart = $_GET['date_depart'] ?? null;

        $stmt = $pdo->query('
            SELECT b.id_bus, b.numero_bus, b.capacite, b.statut,
                   u.id_utilisateur AS chauffeur_id,
                   u.prenom AS chauffeur_prenom,
                   u.nom    AS chauffeur_nom
            FROM bus b
            LEFT JOIN utilisateurs u ON u.id_utilisateur = b.chauffeur_id
            WHERE b.deleted_at IS NULL AND b.statut = "actif"
            ORDER BY b.numero_bus
        ');
        $buses = $stmt->fetchAll();

        foreach ($buses as &$bus) {
            $bus['chauffeur_nom_complet'] = trim(($bus['chauffeur_prenom']??'') . ' ' . ($bus['chauffeur_nom']??''));

            // Vérifier si ce bus est occupé sur un trajet en cours ou proche
            if ($dateDepart) {
                $stmt2 = $pdo->prepare('
                    SELECT h.id_horaire, h.date_depart, h.statut,
                           vd.nom_ville AS ville_depart,
                           va.nom_ville AS ville_arrivee
                    FROM horaires h
                    JOIN trajets t ON t.id_trajet = h.id_trajet
                    JOIN villes vd ON vd.id_ville = t.id_ville_depart
                    JOIN villes va ON va.id_ville = t.id_ville_arrivee
                    WHERE h.id_bus = ?
                    AND h.deleted_at IS NULL
                    AND h.statut IN ("prévu","en_cours")
                    AND ABS(TIMESTAMPDIFF(HOUR, h.date_depart, ?)) < 6
                ');
                $stmt2->execute([$bus['id_bus'], $dateDepart]);
                $conflict = $stmt2->fetch();
                $bus['occupe']          = !!$conflict;
                $bus['conflit_horaire'] = $conflict ?: null;
            } else {
                $bus['occupe'] = false;
                $bus['conflit_horaire'] = null;
            }
        }
        sendSuccess($buses);
    }

    // Chauffeurs disponibles avec statut d'occupation
    if ($resource === 'chauffeurs_disponibles') {
        $dateDepart = $_GET['date_depart'] ?? null;

        $stmt = $pdo->query('
            SELECT u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
                   u.photo_profil
            FROM utilisateurs u
            JOIN roles r ON r.id_role = u.id_role
            WHERE r.libelle_role = "Chauffeur" AND u.deleted_at IS NULL
            ORDER BY u.nom
        ');
        $chauffeurs = $stmt->fetchAll();

        foreach ($chauffeurs as &$ch) {
            $ch['nom_complet'] = trim($ch['prenom'] . ' ' . $ch['nom']);

            if ($dateDepart) {
                // Vérifier si ce chauffeur est assigné à un trajet proche
                $stmt2 = $pdo->prepare('
                    SELECT h.id_horaire, h.date_depart, h.statut,
                           vd.nom_ville AS ville_depart,
                           va.nom_ville AS ville_arrivee,
                           b.numero_bus
                    FROM horaires h
                    JOIN bus b     ON b.id_bus = h.id_bus
                    JOIN trajets t ON t.id_trajet = h.id_trajet
                    JOIN villes vd ON vd.id_ville = t.id_ville_depart
                    JOIN villes va ON va.id_ville = t.id_ville_arrivee
                    WHERE b.chauffeur_id = ?
                    AND h.deleted_at IS NULL
                    AND h.statut IN ("prévu","en_cours")
                    AND ABS(TIMESTAMPDIFF(HOUR, h.date_depart, ?)) < 6
                ');
                $stmt2->execute([$ch['id_utilisateur'], $dateDepart]);
                $conflict = $stmt2->fetch();
                $ch['occupe']           = !!$conflict;
                $ch['conflit_horaire']  = $conflict ?: null;
            } else {
                $ch['occupe'] = false;
                $ch['conflit_horaire'] = null;
            }
        }
        sendSuccess($chauffeurs);
    }

    // Bus actuellement assigné à un chauffeur
    if ($resource === 'bus_chauffeur') {
        $chauffeurId = $_GET['chauffeur_id'] ?? null;
        if (!$chauffeurId) sendError('ID chauffeur manquant.', 400);
        $stmt = $pdo->prepare('SELECT id_bus, numero_bus, capacite, statut FROM bus WHERE chauffeur_id = ? AND deleted_at IS NULL');
        $stmt->execute([$chauffeurId]);
        sendSuccess($stmt->fetchAll());
    }
}

// ===================== POST - Créer assignation =====================
if ($method === 'POST') {
    $data = getBody();
    validateRequired($data, ['id_trajet', 'id_bus', 'date_depart']);

    $idTrajet  = (int)$data['id_trajet'];
    $idBus     = (int)$data['id_bus'];
    $dateDepart = $data['date_depart'];

    // Vérifier conflit bus (même créneau ±3h)
    $stmt = $pdo->prepare('
        SELECT h.id_horaire, h.date_depart,
               vd.nom_ville AS dep, va.nom_ville AS arr
        FROM horaires h
        JOIN trajets t ON t.id_trajet = h.id_trajet
        JOIN villes vd ON vd.id_ville = t.id_ville_depart
        JOIN villes va ON va.id_ville = t.id_ville_arrivee
        WHERE h.id_bus = ?
        AND h.deleted_at IS NULL
        AND h.statut IN ("prévu","en_cours")
        AND ABS(TIMESTAMPDIFF(HOUR, h.date_depart, ?)) < 3
    ');
    $stmt->execute([$idBus, $dateDepart]);
    $conflitBus = $stmt->fetch();

    // Vérifier conflit chauffeur
    $stmtChauf = $pdo->prepare('SELECT chauffeur_id FROM bus WHERE id_bus = ?');
    $stmtChauf->execute([$idBus]);
    $busRow = $stmtChauf->fetch();
    $conflitChauffeur = null;

    if ($busRow && $busRow['chauffeur_id']) {
        $stmt2 = $pdo->prepare('
            SELECT h.id_horaire, h.date_depart,
                   vd.nom_ville AS dep, va.nom_ville AS arr,
                   b.numero_bus
            FROM horaires h
            JOIN bus b     ON b.id_bus = h.id_bus
            JOIN trajets t ON t.id_trajet = h.id_trajet
            JOIN villes vd ON vd.id_ville = t.id_ville_depart
            JOIN villes va ON va.id_ville = t.id_ville_arrivee
            WHERE b.chauffeur_id = ?
            AND h.deleted_at IS NULL
            AND h.statut IN ("prévu","en_cours")
            AND ABS(TIMESTAMPDIFF(HOUR, h.date_depart, ?)) < 3
        ');
        $stmt2->execute([$busRow['chauffeur_id'], $dateDepart]);
        $conflitChauffeur = $stmt2->fetch();
    }

    // Si force = true, on ignore les conflits (admin confirme quand même)
    $force = (bool)($data['force'] ?? false);

    if (!$force && ($conflitBus || $conflitChauffeur)) {
        $alertes = [];
        if ($conflitBus) {
            $alertes[] = [
                'type'    => 'bus',
                'message' => "Ce bus est déjà assigné au trajet {$conflitBus['dep']} → {$conflitBus['arr']} le " .
                             date('d/m/Y à H:i', strtotime($conflitBus['date_depart'])),
            ];
        }
        if ($conflitChauffeur) {
            $stmtNom = $pdo->prepare('SELECT prenom, nom FROM utilisateurs WHERE id_utilisateur = ?');
            $stmtNom->execute([$busRow['chauffeur_id']]);
            $chauffeurInfo = $stmtNom->fetch();
            $nomChauf = trim(($chauffeurInfo['prenom']??'') . ' ' . ($chauffeurInfo['nom']??''));
            $alertes[] = [
                'type'    => 'chauffeur',
                'message' => "Le chauffeur {$nomChauf} est déjà en trajet ({$conflitChauffeur['dep']} → {$conflitChauffeur['arr']}, bus {$conflitChauffeur['numero_bus']}) le " .
                             date('d/m/Y à H:i', strtotime($conflitChauffeur['date_depart'])),
            ];
        }
        http_response_code(409);
        echo json_encode([
            'success'  => false,
            'conflict' => true,
            'alertes'  => $alertes,
            'message'  => 'Conflit détecté. Confirmez pour forcer l\'assignation.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Créer l'horaire
    $stmt = $pdo->prepare('INSERT INTO horaires (id_trajet, id_bus, date_depart, statut) VALUES (?,?,?,"prévu")');
    $stmt->execute([$idTrajet, $idBus, $dateDepart]);
    $newId = $pdo->lastInsertId();

    // Notifier le chauffeur (notification interne + email)
    if ($busRow && $busRow['chauffeur_id']) {
        $stmtInfo = $pdo->prepare('
            SELECT vd.nom_ville AS dep, va.nom_ville AS arr, t.distance_km,
                   b.numero_bus
            FROM trajets t
            JOIN villes vd ON vd.id_ville = t.id_ville_depart
            JOIN villes va ON va.id_ville = t.id_ville_arrivee
            JOIN bus b     ON b.id_bus = ?
            WHERE t.id_trajet = ?
        ');
        $stmtInfo->execute([$idBus, $idTrajet]);
        $info = $stmtInfo->fetch();

        if ($info) {
            // Notification interne
            $pdo->prepare('INSERT INTO notifications (id_utilisateur, contenu) VALUES (?,?)')
                ->execute([$busRow['chauffeur_id'],
                    "Nouveau trajet assigne : {$info['dep']} -> {$info['arr']} le " .
                    date('d/m/Y a H:i', strtotime($dateDepart))
                ]);

            // Email au chauffeur
            $stmtChaufInfo = $pdo->prepare('SELECT email, nom, prenom FROM utilisateurs WHERE id_utilisateur=?');
            $stmtChaufInfo->execute([$busRow['chauffeur_id']]);
            $chaufInfo = $stmtChaufInfo->fetch();
            if ($chaufInfo && !empty($chaufInfo['email'])) {
                sendAssignationChauffeurEmail(
                    $chaufInfo['email'],
                    trim(($chaufInfo['prenom']??'') . ' ' . ($chaufInfo['nom']??'')),
                    [
                        'ville_depart'  => $info['dep'],
                        'ville_arrivee' => $info['arr'],
                        'date_depart'   => $dateDepart,
                        'numero_bus'    => $info['numero_bus'],
                        'distance_km'   => $info['distance_km'],
                    ]
                );
            }
        }
    }

    sendSuccess(['id_horaire' => (int)$newId], 'Horaire créé avec succès.', 201);
}

// ===================== PUT - Modifier statut =====================
if ($method === 'PUT') {
    $id   = (int)($_GET['id'] ?? 0);
    $data = getBody();
    if (!$id) sendError('ID manquant.', 400);

    $fields = []; $params = [];
    if (isset($data['statut']))      { $fields[]='statut=?';      $params[]=$data['statut']; }
    if (isset($data['date_depart'])) { $fields[]='date_depart=?'; $params[]=$data['date_depart']; }
    if (isset($data['id_bus']))      { $fields[]='id_bus=?';      $params[]=$data['id_bus']; }
    if (empty($fields)) sendError('Rien à modifier.', 400);

    $params[] = $id;
    $pdo->prepare('UPDATE horaires SET '.implode(',',$fields).' WHERE id_horaire=?')->execute($params);
    sendSuccess([], 'Horaire mis à jour.');
}

// ===================== DELETE =====================
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('ID manquant.', 400);
    $pdo->prepare('UPDATE horaires SET deleted_at = NOW() WHERE id_horaire = ?')->execute([$id]);
    sendSuccess([], 'Horaire supprimé.');
}

sendError('Requête invalide.', 400);
