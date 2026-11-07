<?php
/**
 * Prépare un export phpMyAdmin de miabetrans_db pour l'import sur Aiven MySQL.
 *
 * Usage (depuis le dossier du projet, avec le PHP de WampServer) :
 *   php scripts/preparer-export-aiven.php miabetrans_db.sql miabetrans_aiven.sql
 *
 * Ce que fait le script :
 *   - retire les clauses DEFINER=`root`@`localhost` (refusées chez Aiven :
 *     le compte avnadmin n'a pas le droit de créer des objets au nom de root)
 *   - retire SQL SECURITY DEFINER des vues
 *   - ajoute en tête la création de la base et le USE si absents
 */

if ($argc < 3) {
    fwrite(STDERR, "Usage : php preparer-export-aiven.php <export.sql> <sortie.sql> [nom_base]\n");
    exit(1);
}

[$_, $in, $out] = $argv;
$dbName = $argv[3] ?? 'miabetrans_db';

if (!is_file($in)) {
    fwrite(STDERR, "Fichier introuvable : $in\n");
    exit(1);
}

$sql = file_get_contents($in);
$avant = strlen($sql);

// 1. DEFINER=`user`@`host` (avec ou sans backticks/guillemets)
$sql = preg_replace('/\s*DEFINER\s*=\s*(`[^`]*`|\'[^\']*\'|[^\s@]+)@(`[^`]*`|\'[^\']*\'|[^\s*]+)/i', '', $sql, -1, $nbDefiner);

// 2. Variantes commentées des dumps : /*!50013 DEFINER=... SQL SECURITY DEFINER */
$sql = preg_replace('/\/\*!50013\s*SQL SECURITY DEFINER\s*\*\//i', '', $sql);
$sql = preg_replace('/SQL SECURITY DEFINER/i', 'SQL SECURITY INVOKER', $sql);

// 3. Base de données cible
if (!preg_match('/^\s*USE\s+/mi', $sql)) {
    $entete = "CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n"
            . "USE `$dbName`;\n\n";
    $sql = $entete . $sql;
}

file_put_contents($out, $sql);

echo "Export prêt pour Aiven : $out\n";
echo "  Clauses DEFINER retirées : $nbDefiner\n";
echo "  Taille : " . round($avant / 1024, 1) . " Ko -> " . round(strlen($sql) / 1024, 1) . " Ko\n";
