<?php
// config/mailer.php — Service email via Gmail SMTP (PHPMailer)

$phpmailerPath = __DIR__ . '/../lib/PHPMailer/src/';
if (file_exists($phpmailerPath . 'PHPMailer.php')) {
    require_once $phpmailerPath . 'PHPMailer.php';
    require_once $phpmailerPath . 'SMTP.php';
    require_once $phpmailerPath . 'Exception.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ── CONFIGURATION (à personnaliser) ──────────────────────
define('SMTP_HOST',      'smtp.gmail.com');
define('SMTP_PORT',      587);
define('SMTP_USER',      'ephraimnato17@gmail.com');   // <- Votre Gmail
define('SMTP_PASS',      'kctd slyw gjun otqc');      // <- Mot de passe d'application Google
define('SMTP_FROM',      'ephraimnato17@gmail.com');
define('SMTP_FROM_NAME', 'MiabeTrans');
define('APP_URL',        'http://localhost:5173');
define('WHATSAPP_NUM',   '22890000001');

/**
 * Envoyer un email HTML
 */
function sendEmail(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool {
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        error_log("PHPMailer non installé — email non envoyé à $toEmail");
        return false;
    }
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addAddress($toEmail, $toName);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags(str_replace(['<br>','<br/>','</p>','</li>'], "\n", $htmlBody));
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Erreur email vers $toEmail : " . $e->getMessage());
        return false;
    }
}

/**
 * Template HTML de base
 */
function emailTemplate(string $title, string $content, string $btnText = '', string $btnUrl = ''): string {
    $btn = $btnText ? "
    <div style='text-align:center;margin:28px 0;'>
        <a href='{$btnUrl}' style='background:#1B4332;color:#fff;padding:13px 30px;border-radius:8px;
           text-decoration:none;font-weight:600;font-size:15px;display:inline-block;'>
            {$btnText}
        </a>
    </div>" : '';

    return "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'></head>
    <body style='margin:0;padding:0;background:#F3F4F6;font-family:Arial,sans-serif;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='padding:32px 0;'>
    <tr><td align='center'>
    <table width='580' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);'>
      <tr><td style='background:#0D2B1F;padding:24px 36px;'>
        <span style='color:#fff;font-size:20px;font-weight:bold;'>MiabeTrans</span>
        <span style='color:#F4A100;font-size:20px;'> &bull;</span>
        <span style='color:rgba(255,255,255,0.6);font-size:13px;margin-left:8px;'>Transport Interurbain &mdash; Lom&eacute;, Togo</span>
      </td></tr>
      <tr><td style='padding:32px 36px;'>
        <h1 style='margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;'>{$title}</h1>
        {$content}
        {$btn}
      </td></tr>
      <tr><td style='background:#F9FAFB;padding:18px 36px;border-top:1px solid #E5E7EB;text-align:center;'>
        <p style='margin:0;font-size:11px;color:#9CA3AF;'>
          &copy; " . date('Y') . " MiabeTrans &mdash; Lom&eacute;, Togo &nbsp;|&nbsp;
          +228 90 00 00 01 &nbsp;|&nbsp; contact@miabetrans.tg
        </p>
      </td></tr>
    </table>
    </td></tr></table>
    </body></html>";
}

// ── EMAILS SPÉCIFIQUES ───────────────────────────────────

/**
 * Email de confirmation de réservation au CLIENT
 */
function sendReservationConfirmationEmail(array $recu): bool {
    $nom    = htmlspecialchars(trim(($recu['client_prenom']??'') . ' ' . ($recu['client_nom']??'')));
    $numero = htmlspecialchars($recu['numero_recu'] ?? 'MT-' . str_pad($recu['id_reservation'], 6, '0', STR_PAD_LEFT));
    $trajet = htmlspecialchars(($recu['ville_depart']??'') . ' vers ' . ($recu['ville_arrivee']??''));
    $date   = !empty($recu['date_depart']) ? date('l d F Y a H:i', strtotime($recu['date_depart'])) : '-';
    $prix   = number_format((float)($recu['prix']??0), 0, '.', ' ') . ' FCFA';
    $bus    = htmlspecialchars($recu['numero_bus'] ?? '-');
    $url    = APP_URL . '/confirmation/' . ($recu['id_reservation'] ?? '');

    $content = "
    <p style='color:#374151;font-size:15px;line-height:1.7;'>Bonjour <strong>{$nom}</strong>,</p>
    <p style='color:#374151;font-size:15px;line-height:1.7;'>
        Votre r&eacute;servation a &eacute;t&eacute; <strong style='color:#10B981;'>confirm&eacute;e avec succ&egrave;s</strong> !
    </p>
    <table width='100%' style='background:#F0FDF4;border:1px solid #6EE7B7;border-radius:10px;
        padding:20px;border-collapse:collapse;margin:16px 0;'>
      <tr><td style='padding:6px 16px;color:#6B7280;font-size:13px;'>N&deg; de r&eacute;servation</td>
          <td style='padding:6px 16px;font-weight:700;color:#065F46;font-size:15px;
              font-family:monospace;'>{$numero}</td></tr>
      <tr><td style='padding:6px 16px;color:#6B7280;font-size:13px;'>Trajet</td>
          <td style='padding:6px 16px;font-weight:600;color:#111827;font-size:13px;'>{$trajet}</td></tr>
      <tr><td style='padding:6px 16px;color:#6B7280;font-size:13px;'>Date de d&eacute;part</td>
          <td style='padding:6px 16px;font-weight:600;color:#111827;font-size:13px;'>{$date}</td></tr>
      <tr><td style='padding:6px 16px;color:#6B7280;font-size:13px;'>Bus</td>
          <td style='padding:6px 16px;font-weight:600;color:#111827;font-family:monospace;font-size:13px;'>{$bus}</td></tr>
      <tr><td style='padding:6px 16px;color:#6B7280;font-size:13px;'>Prix</td>
          <td style='padding:6px 16px;font-weight:700;color:#1B4332;font-size:16px;'>{$prix}</td></tr>
    </table>
    <div style='background:#FEF3C7;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400E;'>
        <strong>Instructions :</strong><br>
        &bull; Pr&eacute;sentez-vous 30 minutes avant le d&eacute;part<br>
        &bull; Munissez-vous de ce r&eacute;c&eacute;piss&eacute; ou de votre num&eacute;ro de r&eacute;servation<br>
        &bull; Contact : <strong>+228 90 00 00 01</strong>
    </div>";

    $html = emailTemplate('Reservation confirmee !', $content, 'Voir mon recu', $url);
    $subj = "[MiabeTrans] Reservation {$numero} confirmee";
    return sendEmail($recu['client_email'], $nom, $subj, $html);
}

/**
 * Email d'annulation au CLIENT avec raison
 */
function sendAnnulationEmail(array $recu, string $raison): bool {
    $nom    = htmlspecialchars(trim(($recu['client_prenom']??'') . ' ' . ($recu['client_nom']??'')));
    $numero = htmlspecialchars($recu['numero_recu'] ?? 'MT-' . str_pad($recu['id_reservation'], 6, '0', STR_PAD_LEFT));
    $trajet = htmlspecialchars(($recu['ville_depart']??'') . ' vers ' . ($recu['ville_arrivee']??''));
    $raison = htmlspecialchars($raison);

    $content = "
    <p style='color:#374151;font-size:15px;line-height:1.7;'>Bonjour <strong>{$nom}</strong>,</p>
    <p style='color:#374151;font-size:15px;'>
        Votre r&eacute;servation <strong>{$numero}</strong> ({$trajet}) a &eacute;t&eacute;
        <strong style='color:#EF4444;'>annul&eacute;e</strong>.
    </p>
    <div style='background:#FEE2E2;border:1px solid #FCA5A5;border-radius:10px;padding:18px;margin:18px 0;'>
        <p style='margin:0 0 6px;font-size:13px;font-weight:700;color:#991B1B;'>Motif de l&rsquo;annulation :</p>
        <p style='margin:0;font-size:14px;color:#7F1D1D;'>{$raison}</p>
    </div>
    <p style='color:#374151;font-size:14px;'>
        Pour toute question ou nouvelle r&eacute;servation, contactez-nous au
        <strong>+228 90 00 00 01</strong> ou &agrave; <strong>contact@miabetrans.tg</strong>.
    </p>";

    $html = emailTemplate('Reservation annulee', $content, 'Rechercher un autre trajet', APP_URL . '/search');
    $subj = "[MiabeTrans] Reservation {$numero} annulee";
    return sendEmail($recu['client_email'], $nom, $subj, $html);
}

/**
 * Email au CHAUFFEUR lors d'une assignation de trajet
 */
function sendAssignationChauffeurEmail(string $emailChauffeur, string $nomChauffeur, array $trajetInfo): bool {
    $nom    = htmlspecialchars($nomChauffeur);
    $trajet = htmlspecialchars(($trajetInfo['ville_depart']??'') . ' vers ' . ($trajetInfo['ville_arrivee']??''));
    $date   = !empty($trajetInfo['date_depart']) ? date('l d F Y a H:i', strtotime($trajetInfo['date_depart'])) : '-';
    $bus    = htmlspecialchars($trajetInfo['numero_bus'] ?? '-');
    $dist   = htmlspecialchars($trajetInfo['distance_km'] ?? '-');

    $content = "
    <p style='color:#374151;font-size:15px;line-height:1.7;'>Bonjour <strong>{$nom}</strong>,</p>
    <p style='color:#374151;font-size:15px;'>
        Un nouveau trajet vous a &eacute;t&eacute; assign&eacute;. Voici les d&eacute;tails :
    </p>
    <table width='100%' style='background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;
        padding:20px;border-collapse:collapse;margin:16px 0;'>
      <tr><td style='padding:7px 16px;color:#6B7280;font-size:13px;'>Trajet</td>
          <td style='padding:7px 16px;font-weight:700;color:#1E3A5F;font-size:15px;'>{$trajet}</td></tr>
      <tr><td style='padding:7px 16px;color:#6B7280;font-size:13px;'>Date de d&eacute;part</td>
          <td style='padding:7px 16px;font-weight:600;color:#111827;font-size:13px;'>{$date}</td></tr>
      <tr><td style='padding:7px 16px;color:#6B7280;font-size:13px;'>V&eacute;hicule assign&eacute;</td>
          <td style='padding:7px 16px;font-weight:600;font-family:monospace;color:#111827;font-size:14px;'>{$bus}</td></tr>
      <tr><td style='padding:7px 16px;color:#6B7280;font-size:13px;'>Distance</td>
          <td style='padding:7px 16px;font-weight:600;color:#111827;font-size:13px;'>{$dist} km</td></tr>
    </table>
    <div style='background:#FEF3C7;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400E;'>
        Pr&eacute;sentez-vous &agrave; l&rsquo;agence 45 minutes avant le d&eacute;part.<br>
        Contact dispatch : <strong>+228 90 00 00 01</strong>
    </div>";

    $html = emailTemplate('Nouveau trajet assigne', $content, 'Voir mes trajets', APP_URL . '/chauffeur');
    $subj = "[MiabeTrans] Nouveau trajet : {$trajet}";
    return sendEmail($emailChauffeur, $nom, $subj, $html);
}

/**
 * Email reset mot de passe
 */
function sendResetPasswordEmail(string $email, string $prenom, string $nom, string $token): bool {
    $name     = htmlspecialchars(trim($prenom . ' ' . $nom));
    $resetUrl = APP_URL . '/reset-password?token=' . $token;

    $content = "
    <p style='color:#374151;font-size:15px;line-height:1.7;'>Bonjour <strong>{$name}</strong>,</p>
    <p style='color:#374151;font-size:15px;'>
        Vous avez demand&eacute; la r&eacute;initialisation de votre mot de passe MiabeTrans.
    </p>
    <div style='background:#FEF3C7;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400E;margin:16px 0;'>
        Ce lien est valable <strong>1 heure</strong> seulement.<br>
        Si vous n&rsquo;avez pas fait cette demande, ignorez cet email.
    </div>";

    $html = emailTemplate('Reinitialisation du mot de passe', $content, 'Reinitialiser mon mot de passe', $resetUrl);
    return sendEmail($email, $name, '[MiabeTrans] Reinitialisation de votre mot de passe', $html);
}

/**
 * Lien WhatsApp pré-rempli
 */
function whatsappLink(string $message): string {
    return 'https://wa.me/' . preg_replace('/[^0-9]/', '', WHATSAPP_NUM) . '?text=' . urlencode($message);
}
