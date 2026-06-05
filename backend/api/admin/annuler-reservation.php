<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/mailer.php';

setCorsHeaders();
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$data   = getBody();
$id     = (int)($data['id_reservation'] ?? 0);
$raison = sanitize($data['raison'] ?? '');

if (!$id)     sendError('ID réservation manquant.', 400);
if (!$raison) sendError('La raison est obligatoire.', 422);

$pdo  = getDB();
$stmt = $pdo->prepare('
    SELECT r.id_reservation, r.numero_recu, r.statut_reservation,
           u.nom AS client_nom, u.prenom AS client_prenom,
           u.email AS client_email, u.telephone AS client_telephone,
           h.date_depart,
           vd.nom_ville AS ville_depart, va.nom_ville AS ville_arrivee,
           t.prix, b.numero_bus
    FROM reservations r
    JOIN utilisateurs u ON u.id_utilisateur = r.id_utilisateur
    JOIN horaires h     ON h.id_horaire = r.id_horaire
    JOIN trajets t      ON t.id_trajet = h.id_trajet
    JOIN villes vd      ON vd.id_ville = t.id_ville_depart
    JOIN villes va      ON va.id_ville = t.id_ville_arrivee
    JOIN bus b          ON b.id_bus = h.id_bus
    WHERE r.id_reservation = ?
');
$stmt->execute([$id]);
$resa = $stmt->fetch();

if (!$resa)                              sendError('Réservation introuvable.', 404);
if ($resa['statut_reservation'] === 'annulée') sendError('Déjà annulée.', 409);

// Annuler
$pdo->prepare('UPDATE reservations SET statut_reservation = "annulée" WHERE id_reservation = ?')
    ->execute([$id]);

// Notification interne
$pdo->prepare('INSERT INTO notifications (id_utilisateur, contenu) SELECT id_utilisateur, ? FROM reservations WHERE id_reservation = ?')
    ->execute(["Votre réservation #{$resa['numero_recu']} a été annulée. Motif : {$raison}", $id]);

// Envoyer email d'annulation
$emailSent = sendAnnulationEmail($resa, $raison);

// Lien WhatsApp pré-rempli
$numero  = preg_replace('/[^0-9]/', '', $resa['client_telephone'] ?? '');
$waMsg   = "Bonjour {$resa['client_prenom']} {$resa['client_nom']}, votre réservation {$resa['numero_recu']} ({$resa['ville_depart']} → {$resa['ville_arrivee']}) a été annulée. Motif : {$raison}. Contactez-nous pour plus d'infos : +22890000001";
$waLink  = $numero ? 'https://wa.me/' . $numero . '?text=' . urlencode($waMsg) : null;

sendSuccess([
    'email_sent' => $emailSent,
    'whatsapp_link' => $waLink,
    'client_telephone' => $resa['client_telephone'],
], 'Réservation annulée et client notifié.');
