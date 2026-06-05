<?php
// api/auth/send-otp.php
// Envoie un code OTP à 6 chiffres à l'email fourni (pour vérification à l'inscription)

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../config/mailer.php';

setCorsHeaders();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Méthode non autorisée.', 405);

$data  = getBody();
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$type  = sanitize($data['type'] ?? 'inscription');

if (!$email) sendError('Adresse email invalide.', 422);
if (!in_array($type, ['inscription','reset_mdp','autre'])) $type = 'inscription';

$pdo = getDB();

// Pour l'inscription : vérifier que l'email n'est pas déjà pris
if ($type === 'inscription') {
    $stmt = $pdo->prepare('SELECT id_utilisateur FROM utilisateurs WHERE email = ? AND deleted_at IS NULL');
    $stmt->execute([$email]);
    if ($stmt->fetch()) sendError('Cet email est déjà utilisé.', 409);
}

// Supprimer les anciens OTP pour cet email/type
$pdo->prepare('DELETE FROM otp_verifications WHERE email = ? AND type = ?')
    ->execute([$email, $type]);

// Générer un code OTP à 6 chiffres
$otpCode   = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$expiresAt = date('Y-m-d H:i:s', time() + 600); // 10 minutes

$pdo->prepare('INSERT INTO otp_verifications (email, otp_code, type, expires_at) VALUES (?, ?, ?, ?)')
    ->execute([$email, $otpCode, $type, $expiresAt]);

// ── Email avec le code OTP ──
$content = "
<p style='color:#374151;font-size:15px;line-height:1.7;'>Bonjour,</p>
<p style='color:#374151;font-size:15px;line-height:1.7;'>
    " . ($type === 'inscription' ? "Merci de vous inscrire sur MiabeTrans !" : "Voici votre code de vérification.") . "
    <br>Entrez le code ci-dessous pour valider votre adresse email :
</p>

<!-- Code OTP mis en évidence -->
<div style='text-align:center;margin:28px 0;'>
    <div style='display:inline-block;background:#0D2B1F;border-radius:16px;padding:24px 40px;'>
        <div style='color:rgba(255,255,255,0.55);font-size:11px;text-transform:uppercase;
                    letter-spacing:3px;margin-bottom:10px;'>CODE DE VÉRIFICATION</div>
        <div style='color:#F4A100;font-family:monospace;font-size:40px;font-weight:700;
                    letter-spacing:12px;'>" . $otpCode . "</div>
        <div style='color:rgba(255,255,255,0.4);font-size:11px;margin-top:10px;'>
            Valide pendant 10 minutes
        </div>
    </div>
</div>

<div style='background:#FEF3C7;border-radius:10px;padding:14px 18px;font-size:13px;color:#92400E;'>
    <strong>Securite :</strong> Ne partagez jamais ce code.
    MiabeTrans ne vous demandera jamais votre code par téléphone ou par chat.<br>
    Si vous n'avez pas fait cette demande, ignorez cet email.
</div>
";

$titre = $type === 'inscription' ? 'Confirmez votre adresse email' : 'Votre code de vérification';
$html  = emailTemplate($titre, $content);
$subj  = "[MiabeTrans] Votre code : {$otpCode}";
$sent  = sendEmail($email, '', $subj, $html);

sendSuccess([
    'email'    => $email,
    'sent'     => $sent,
    'expires'  => $expiresAt,
], 'Code OTP envoyé. Vérifiez votre boîte email (vérifiez aussi les spams).');
