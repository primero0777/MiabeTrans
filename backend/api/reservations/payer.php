<?php
// api/reservations/payer.php
// Étape 3 : le client saisit la référence → validation → reçu généré + email

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/mailer.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$authUser = getAuthUser();
$data     = getBody();
$pdo      = getDB();

$idResa    = (int)($data['id_reservation'] ?? 0);
$reference = trim(sanitize($data['reference_paiement'] ?? ''));

if (!$idResa)    sendError('ID réservation manquant.', 400);
if (!$reference) sendError('Référence de paiement manquante.', 422);

// Charger la réservation
$stmt = $pdo->prepare('
    SELECT r.*,
           u.nom AS client_nom, u.prenom AS client_prenom,
           u.email AS client_email, u.telephone AS client_telephone,
           h.date_depart,
           t.prix, t.distance_km,
           vd.nom_ville AS ville_depart,
           va.nom_ville AS ville_arrivee,
           b.numero_bus, b.capacite,
           CONCAT(uc.prenom," ",uc.nom) AS chauffeur_nom
    FROM reservations r
    JOIN utilisateurs u  ON u.id_utilisateur = r.id_utilisateur
    JOIN horaires h      ON h.id_horaire = r.id_horaire
    JOIN trajets t       ON t.id_trajet  = h.id_trajet
    JOIN villes vd       ON vd.id_ville  = t.id_ville_depart
    JOIN villes va       ON va.id_ville  = t.id_ville_arrivee
    JOIN bus b           ON b.id_bus     = h.id_bus
    LEFT JOIN utilisateurs uc ON uc.id_utilisateur = b.chauffeur_id
    WHERE r.id_reservation = ? AND r.id_utilisateur = ?
');
$stmt->execute([$idResa, $authUser['id']]);
$resa = $stmt->fetch();

if (!$resa)                                    sendError('Réservation introuvable.', 404);
if ($resa['statut_reservation'] === 'confirmée') sendError('Réservation déjà confirmée.', 409);
if ($resa['statut_reservation'] === 'annulée')   sendError('Réservation annulée.', 409);

// Vérifier expiration
if ($resa['expire_le'] && strtotime($resa['expire_le']) < time()) {
    $pdo->prepare('UPDATE reservations SET statut_reservation="annulée" WHERE id_reservation=?')
        ->execute([$idResa]);
    sendError('Délai expiré. La réservation a été annulée. Recommencez.', 410);
}

// Vérifier que la référence correspond à celle envoyée par email
$refEnBase = $resa['reference_paiement'] ?? '';
if (strtoupper(trim($reference)) !== strtoupper(trim($refEnBase))) {
    sendError('Référence incorrecte. Vérifiez l\'email reçu et réessayez.', 422);
}

// ── Confirmer la réservation ────────────────────────────────
$pdo->prepare('
    UPDATE reservations
    SET statut_reservation = "confirmée",
        statut_paiement    = "paye",
        statut_validation  = "validé",
        expire_le          = NULL
    WHERE id_reservation = ?
')->execute([$idResa]);

// Enregistrer dans la table paiements
$pdo->prepare('
    INSERT INTO paiements (id_reservation, montant, mode_paiement, date_paiement)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE date_paiement = NOW(), montant = VALUES(montant)
')->execute([$idResa, $resa['prix'], $resa['mode_paiement']]);

// Notification interne client
$numero = $resa['numero_recu'] ?? 'MT-' . str_pad($idResa, 6, '0', STR_PAD_LEFT);
$pdo->prepare('INSERT INTO notifications (id_utilisateur, contenu) VALUES (?,?)')
    ->execute([$resa['id_utilisateur'],
        "Votre réservation {$numero} est confirmée ! Bon voyage."
    ]);

// ── Envoyer le reçu complet par email ──────────────────────
$nomClient = htmlspecialchars(trim(($resa['client_prenom']??'') . ' ' . ($resa['client_nom']??'')));
$trajet    = htmlspecialchars($resa['ville_depart'] . ' → ' . $resa['ville_arrivee']);
$prix      = number_format((float)$resa['prix'], 0, '.', ' ') . ' FCFA';
$dateDepart = date('l d F Y à H\hi', strtotime($resa['date_depart']));

$content = "
<p style='color:#374151;font-size:15px;line-height:1.7;'>Bonjour <strong>{$nomClient}</strong>,</p>
<p style='color:#374151;font-size:15px;'>
    Votre paiement a été validé et votre réservation est
    <strong style='color:#10B981;'>confirmée</strong> !
</p>

<!-- Ticket visuel -->
<div style='border:2px solid #10B981;border-radius:12px;overflow:hidden;margin:20px 0;'>
    <!-- Header ticket -->
    <div style='background:#0D2B1F;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;'>
        <div>
            <div style='color:#fff;font-size:18px;font-weight:700;'>MiabeTrans</div>
            <div style='color:rgba(255,255,255,0.55);font-size:11px;'>Billet de transport</div>
        </div>
        <div style='text-align:right;'>
            <div style='color:#F4A100;font-family:monospace;font-size:14px;font-weight:700;'>" . htmlspecialchars($numero) . "</div>
            <div style='color:rgba(255,255,255,0.55);font-size:11px;'>N° de réservation</div>
        </div>
    </div>
    <!-- Route -->
    <div style='background:#F0FDF4;padding:20px 24px;text-align:center;border-bottom:2px dashed #A7F3D0;'>
        <div style='font-size:20px;font-weight:800;color:#0D2B1F;'>
            " . htmlspecialchars($resa['ville_depart']) . "
            &nbsp;🚌&nbsp;
            " . htmlspecialchars($resa['ville_arrivee']) . "
        </div>
        <div style='color:#6B7280;font-size:13px;margin-top:6px;'>{$resa['distance_km']} km</div>
    </div>
    <!-- Infos -->
    <div style='padding:16px 24px;background:#fff;'>
        <table width='100%' style='border-collapse:collapse;font-size:13px;'>
            <tr>
                <td style='padding:6px 0;color:#6B7280;'>Date de départ</td>
                <td style='padding:6px 0;font-weight:600;text-align:right;'>{$dateDepart}</td>
            </tr>
            <tr>
                <td style='padding:6px 0;color:#6B7280;'>Bus</td>
                <td style='padding:6px 0;font-weight:600;text-align:right;font-family:monospace;'>" . htmlspecialchars($resa['numero_bus']) . "</td>
            </tr>
            <tr>
                <td style='padding:6px 0;color:#6B7280;'>Mode de paiement</td>
                <td style='padding:6px 0;font-weight:600;text-align:right;'>" . htmlspecialchars($resa['mode_paiement']) . "</td>
            </tr>
            <tr>
                <td style='padding:6px 0;color:#6B7280;'>Référence</td>
                <td style='padding:6px 0;font-family:monospace;text-align:right;'>" . htmlspecialchars($reference) . "</td>
            </tr>
        </table>
    </div>
    <!-- Total -->
    <div style='background:#0D2B1F;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;'>
        <span style='color:#fff;font-weight:600;'>MONTANT PAYÉ</span>
        <span style='color:#F4A100;font-size:18px;font-weight:800;'>{$prix}</span>
    </div>
</div>

<div style='background:#FEF3C7;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400E;'>
    <strong>Rappel :</strong> Présentez-vous <strong>30 minutes avant le départ</strong>
    avec ce reçu ou votre numéro de réservation.<br>
    Assistance : <strong>+228 90 00 00 01</strong>
</div>
";

$urlRecu = "http://localhost:5173/confirmation/{$idResa}";
$html    = emailTemplate('Réservation confirmée — Votre reçu', $content, 'Voir et télécharger le reçu', $urlRecu);
$subj    = "[MiabeTrans] Reçu de réservation {$numero} — {$trajet}";
$sent    = sendEmail($resa['client_email'], $nomClient, $subj, $html);

sendSuccess([
    'id_reservation'   => $idResa,
    'statut'           => 'confirmée',
    'numero_recu'      => $numero,
    'email_sent'       => $sent,
], 'Paiement validé ! Votre réservation est confirmée. Votre reçu a été envoyé par email.');
