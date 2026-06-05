<?php
// simuler-paiement.php
// Génère une référence fictive + envoie par email pour TOUS les modes
// Le client doit ensuite saisir cette référence pour confirmer

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/mailer.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$authUser = getAuthUser();
$data     = getBody();
$pdo      = getDB();

$idResa = (int)($data['id_reservation'] ?? 0);
if (!$idResa) sendError('ID réservation manquant.', 400);

// Charger la réservation
$stmt = $pdo->prepare('
    SELECT r.*,
           u.nom AS client_nom, u.prenom AS client_prenom, u.email AS client_email,
           h.date_depart, t.prix, t.distance_km,
           vd.nom_ville AS ville_depart, va.nom_ville AS ville_arrivee,
           b.numero_bus, b.capacite
    FROM reservations r
    JOIN utilisateurs u ON u.id_utilisateur = r.id_utilisateur
    JOIN horaires h     ON h.id_horaire = r.id_horaire
    JOIN trajets t      ON t.id_trajet  = h.id_trajet
    JOIN villes vd      ON vd.id_ville  = t.id_ville_depart
    JOIN villes va      ON va.id_ville  = t.id_ville_arrivee
    JOIN bus b          ON b.id_bus     = h.id_bus
    WHERE r.id_reservation = ? AND r.id_utilisateur = ?
');
$stmt->execute([$idResa, $authUser['id']]);
$resa = $stmt->fetch();

if (!$resa)  sendError('Réservation introuvable.', 404);
if (in_array($resa['statut_reservation'], ['confirmée','annulée']))
    sendError('Cette réservation ne peut plus être modifiée.', 409);

// Vérifier expiration
if ($resa['expire_le'] && strtotime($resa['expire_le']) < time()) {
    $pdo->prepare('UPDATE reservations SET statut_reservation="annulée" WHERE id_reservation=?')
        ->execute([$idResa]);
    sendError('Délai expiré. Veuillez recommencer.', 410);
}

$modePaie  = $resa['mode_paiement'];
$nomClient = htmlspecialchars(trim(($resa['client_prenom']??'') . ' ' . ($resa['client_nom']??'')));
$numero    = $resa['numero_recu'] ?? 'MT-' . str_pad($idResa, 6, '0', STR_PAD_LEFT);
$trajet    = htmlspecialchars($resa['ville_depart'] . ' - ' . $resa['ville_arrivee']);
$prixStr   = number_format((float)$resa['prix'], 0, '.', ' ') . ' FCFA';
$expireMin = $resa['expire_le'] ? max(1, ceil((strtotime($resa['expire_le']) - time()) / 60)) : 30;
$dateDepart = date('d/m/Y a H\hi', strtotime($resa['date_depart']));

// ── Validation carte bancaire ─────────────────────────────
if ($modePaie === 'Carte Bancaire') {
    $numCarte   = preg_replace('/[\s\-]/', '', $data['numero_carte']    ?? '');
    $expMois    = (int)($data['expiration_mois']   ?? 0);
    $expAnnee   = (int)($data['expiration_annee']  ?? 0);
    $cvv        = trim($data['cvv']        ?? '');
    $nomPorteur = sanitize($data['nom_porteur'] ?? '');

    if (!ctype_digit($numCarte) || strlen($numCarte) < 13 || strlen($numCarte) > 19)
        sendError('Numéro de carte invalide.', 422);
    if ($expMois < 1 || $expMois > 12)
        sendError('Mois d\'expiration invalide (1-12).', 422);
    if ($expAnnee < (int)date('Y') || $expAnnee > (int)date('Y') + 20)
        sendError('Année d\'expiration invalide.', 422);
    if ($expAnnee === (int)date('Y') && $expMois < (int)date('m'))
        sendError('Cette carte est expirée.', 422);
    if (!ctype_digit($cvv) || strlen($cvv) < 3 || strlen($cvv) > 4)
        sendError('CVV invalide.', 422);
    if (empty($nomPorteur))
        sendError('Nom du porteur requis.', 422);
}

// ── Générer la référence selon le mode ───────────────────
$prefixes = [
    'Mixx By Yas'    => 'YAS',
    'Flooz'          => 'FLZ',
    'Carte Bancaire' => 'CBK',
    'Cash'           => 'CSH',
];
$prefix    = $prefixes[$modePaie] ?? 'PAY';
$rand      = strtoupper(substr(md5(uniqid((string)rand(), true)), 0, 8));
$reference = $prefix . '-' . $rand . '-' . date('dmY');
// Ex: YAS-A3F8C291-07042026

// Sauvegarder la référence en base
$pdo->prepare('UPDATE reservations SET reference_paiement = ? WHERE id_reservation = ?')
    ->execute([$reference, $idResa]);

// ── Instructions spécifiques par mode ────────────────────
$blocInstructions = '';
switch ($modePaie) {
    case 'Mixx By Yas':
        $blocInstructions = "
        <div style='background:#FFF7ED;border:1px solid #FDBA74;border-radius:10px;padding:18px;margin:16px 0;'>
            <div style='font-weight:700;color:#C2410C;font-size:14px;margin-bottom:10px;'>Comment payer avec Mixx By Yas :</div>
            <ol style='color:#7C3F00;font-size:13px;line-height:2.2;margin:0;padding-left:20px;'>
                <li>Composez <strong style='font-size:16px;color:#FF6B00;'>*144#</strong> sur votre telephone Togocom</li>
                <li>Selectionnez <strong>Paiement marchand</strong></li>
                <li>Code marchand : <strong style='font-family:monospace;font-size:16px;color:#1B4332;background:#D1FAE5;padding:2px 10px;border-radius:4px;'>MIABETRANS</strong></li>
                <li>Montant : <strong>{$prixStr}</strong></li>
                <li>Confirmez avec votre PIN secret</li>
            </ol>
        </div>";
        break;
    case 'Flooz':
        $blocInstructions = "
        <div style='background:#EFF6FF;border:1px solid #93C5FD;border-radius:10px;padding:18px;margin:16px 0;'>
            <div style='font-weight:700;color:#1D4ED8;font-size:14px;margin-bottom:10px;'>Comment payer avec Moov Money :</div>
            <ol style='color:#1E3A5F;font-size:13px;line-height:2.2;margin:0;padding-left:20px;'>
                <li>Composez <strong style='font-size:16px;color:#0070C0;'>*155#</strong> sur votre telephone Moov Africa</li>
                <li>Selectionnez <strong>Payer marchand</strong></li>
                <li>Code marchand : <strong style='font-family:monospace;font-size:16px;color:#1B4332;background:#DBEAFE;padding:2px 10px;border-radius:4px;'>MIABETRANS</strong></li>
                <li>Montant : <strong>{$prixStr}</strong></li>
                <li>Confirmez avec votre PIN secret</li>
            </ol>
        </div>";
        break;
    case 'Carte Bancaire':
        $blocInstructions = "
        <div style='background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:14px 18px;margin:16px 0;'>
            <div style='font-weight:700;color:#166534;'>Paiement par carte</div>
            <div style='color:#166534;font-size:13px;'>Votre paiement par carte bancaire a ete simule avec succes.</div>
        </div>";
        break;
    case 'Cash':
        $blocInstructions = "
        <div style='background:#EFF6FF;border:1px solid #93C5FD;border-radius:10px;padding:18px;margin:16px 0;'>
            <div style='font-weight:700;color:#1D4ED8;font-size:14px;margin-bottom:8px;'>Instructions pour le paiement en especes :</div>
            <ol style='color:#1E3A5F;font-size:13px;line-height:2;margin:0;padding-left:20px;'>
                <li>Notez votre code de reference ci-dessus</li>
                <li>Rendez-vous a l'agence MiabeTrans, Boulevard du Mono, Lome</li>
                <li>Presentez le code <strong>{$numero}</strong> au caissier</li>
                <li>Remettez <strong>{$prixStr}</strong> en especes</li>
                <li>Revenez sur l'application et entrez la reference pour valider</li>
            </ol>
        </div>";
        break;
}

// ── Email avec le code de référence ──────────────────────
$content = "
<p style='color:#374151;font-size:15px;line-height:1.7;'>Bonjour <strong>{$nomClient}</strong>,</p>
<p style='color:#374151;font-size:15px;'>
    Voici votre <strong>code de reference de paiement</strong> pour la reservation
    <strong>" . htmlspecialchars($numero) . "</strong> ({$trajet}).
</p>

<!-- Code en evidence -->
<div style='background:#0D2B1F;border-radius:14px;padding:28px;text-align:center;margin:24px 0;'>
    <div style='color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:3px;margin-bottom:10px;'>
        CODE DE REFERENCE A SAISIR
    </div>
    <div style='color:#F4A100;font-family:monospace;font-size:28px;font-weight:700;
                letter-spacing:4px;background:rgba(255,255,255,0.08);
                border-radius:10px;padding:16px 24px;display:inline-block;'>
        {$reference}
    </div>
    <div style='color:rgba(255,255,255,0.4);font-size:11px;margin-top:12px;'>
        Valide pendant {$expireMin} minutes - Ne partagez pas ce code
    </div>
</div>

<!-- Recapitulatif -->
<table width='100%' style='background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;border-collapse:collapse;margin:16px 0;'>
  <tr><td style='padding:8px 16px;color:#6B7280;font-size:13px;'>Reservation</td>
      <td style='padding:8px 16px;font-weight:700;font-family:monospace;'>" . htmlspecialchars($numero) . "</td></tr>
  <tr style='background:#fff;'><td style='padding:8px 16px;color:#6B7280;font-size:13px;'>Trajet</td>
      <td style='padding:8px 16px;font-weight:600;'>{$trajet}</td></tr>
  <tr><td style='padding:8px 16px;color:#6B7280;font-size:13px;'>Depart</td>
      <td style='padding:8px 16px;'>{$dateDepart}</td></tr>
  <tr style='background:#fff;'><td style='padding:8px 16px;color:#6B7280;font-size:13px;'>Mode</td>
      <td style='padding:8px 16px;font-weight:600;'>" . htmlspecialchars($modePaie) . "</td></tr>
  <tr><td style='padding:8px 16px;color:#6B7280;font-size:13px;'>Montant</td>
      <td style='padding:8px 16px;font-weight:700;color:#1B4332;font-size:15px;'>{$prixStr}</td></tr>
</table>

{$blocInstructions}

<div style='background:#FEF3C7;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400E;'>
    <strong>Etapes suivantes :</strong><br>
    1. Effectuez le paiement de <strong>{$prixStr}</strong>" .
    ($modePaie === 'Cash' ? ' en vous rendant en agence' : '') . "<br>
    2. Revenez sur MiabeTrans et entrez le code <strong>{$reference}</strong><br>
    3. Votre recu sera genere et envoye par email<br>
    <span style='color:#B45309;'>Vous avez <strong>{$expireMin} minutes</strong> pour valider.</span>
</div>
";

$html = emailTemplate('Code de reference - ' . $numero, $content);
$sent = sendEmail($resa['client_email'], $nomClient,
    "[MiabeTrans] Reference de paiement : {$reference}", $html);

sendSuccess([
    'id_reservation'  => $idResa,
    'reference'       => $reference,
    'mode_paiement'   => $modePaie,
    'expire_dans_min' => $expireMin,
    'email_sent'      => $sent,
    'email'           => $resa['client_email'],
], 'Code de reference envoye par email.');
