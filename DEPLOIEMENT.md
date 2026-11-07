# Mise en ligne gratuite de MiabeTrans

| Partie | Service gratuit | Adresse obtenue |
| --- | --- | --- |
| Frontend React | GitHub Pages | `https://primero0777.github.io/miabetrans/` |
| API PHP | Render (Docker) | `https://miabetrans-api.onrender.com/backend/api` |
| Base MySQL | Aiven (MySQL free) | `mysql-xxxx.aivencloud.com:PORT` |
| Emails | Brevo (API HTTP) | — |

Ordre conseillé : **0 → 1 → 2 → 3 → 4 → 5**.

---

## 0. Sécurité (avant tout)

1. Révoquer l'ancien mot de passe d'application Gmail qui était écrit dans
   `backend/config/mailer.php` : <https://myaccount.google.com/apppasswords>.
2. Plus aucun secret n'est dans le code. En local, ils vont dans `backend/.env`
   (ignoré par Git) ; en ligne, dans les variables d'environnement de Render.

**En local (WampServer)**, créer `backend/.env` à partir de `backend/.env.example`
et y mettre au minimum `JWT_SECRET`, `SMTP_USER`, `SMTP_PASS` (nouveau mot de
passe d'application) et `MAIL_FROM`.

---

## 1. Base de données — Aiven

1. Créer un compte sur <https://aiven.io>, puis **Create service → MySQL → Free plan**.
2. Dans l'onglet **Overview** du service, noter : *Host*, *Port*, *User* (`avnadmin`),
   *Password*, et télécharger le **CA certificate** (`ca.pem`).
3. Exporter la base locale : phpMyAdmin → `miabetrans_db` → **Exporter** → *Rapide*, format SQL
   → fichier `miabetrans_db.sql`.
   (Exporter la base réelle plutôt que `backend/database/miabetrans.sql`, qui n'est plus à jour.)
4. Nettoyer l'export pour Aiven (retire les `DEFINER=root@localhost` refusés là-bas) :

   ```bat
   php scripts\preparer-export-aiven.php miabetrans_db.sql miabetrans_aiven.sql
   ```

5. Importer avec le client MySQL fourni par WampServer (adapter la version du dossier) :

   ```bat
   "C:\wamp64\bin\mysql\mysql8.x.x\bin\mysql.exe" -h HOST -P PORT -u avnadmin -p --ssl-mode=REQUIRED < miabetrans_aiven.sql
   ```

   Garder le nom de base **`miabetrans_db`** : le trigger `gen_numero_recu` y fait référence.

> **Erreur 1419 sur le trigger** (`binary logging is enabled`) : supprimer le bloc
> `CREATE TRIGGER gen_numero_recu … END` du fichier et relancer l'import.
> Le PHP génère déjà un numéro `MT-000123` quand `numero_recu` est vide.

---

## 2. Emails — Brevo

1. Créer un compte sur <https://www.brevo.com>.
2. **Senders, Domains & Dedicated IPs → Senders** : ajouter et valider l'adresse
   expéditrice (ex. ton Gmail) → ce sera `MAIL_FROM`.
3. **SMTP & API → API Keys → Generate** → ce sera `BREVO_API_KEY`.

---

## 3. API PHP — Render

1. Créer un compte sur <https://render.com> (connexion avec GitHub).
2. **New → Blueprint** → choisir le dépôt `primero0777/miabetrans`
   (Render lit `render.yaml` et crée le service `miabetrans-api`, offre *Free*).
3. Renseigner les variables demandées :

   | Variable | Valeur |
   | --- | --- |
   | `CORS_ORIGINS` | `https://primero0777.github.io` (sans `/miabetrans`) |
   | `FRONTEND_URL` | `https://primero0777.github.io/miabetrans` |
   | `DB_HOST` / `DB_PORT` | Host et Port Aiven |
   | `DB_USER` / `DB_PASS` | `avnadmin` et son mot de passe |
   | `DB_SSL_CA` | contenu **complet** de `ca.pem` (de `-----BEGIN` à `END-----`) |
   | `BREVO_API_KEY` | clé Brevo |
   | `MAIL_FROM` | adresse validée dans Brevo |

   `JWT_SECRET` est généré automatiquement par Render.

4. Après le déploiement, ouvrir `https://miabetrans-api.onrender.com/` :
   la page doit afficher `{"service":"MiabeTrans API","status":"ok",...}`.

> Offre gratuite : le service s'endort après ~15 min sans visite ; la première
> requête prend alors 30 à 60 s. Les photos envoyées (chauffeurs, messages vocaux)
> sont effacées à chaque redéploiement : le disque de l'offre gratuite n'est pas permanent.

---

## 4. Frontend — GitHub Pages

1. Dépôt GitHub → **Settings → Pages → Source : GitHub Actions**.
2. **Settings → Secrets and variables → Actions → onglet Variables → New variable** :
   `VITE_API_URL` = `https://miabetrans-api.onrender.com/backend/api`
3. Pousser sur `main` : le workflow `.github/workflows/deploy-frontend.yml` compile
   et publie le site (onglet **Actions** pour suivre).

Build manuel possible : créer `frontend/.env.production` (voir `frontend/.env.example`),
puis `npm run build` ; le dossier `frontend/dist` contient le site (avec `404.html`
pour que les routes `/admin`, `/login`… survivent à un rafraîchissement).

---

## 5. Vérifications finales

- [ ] Page d'accueil et recherche de trajets s'affichent
- [ ] Connexion admin, puis rafraîchir la page sur `/admin` (pas de 404)
- [ ] Inscription : le code OTP arrive par email
- [ ] Réservation + paiement : l'email de reçu arrive, le lien ouvre bien le site
- [ ] Mot de passe oublié : le lien de réinitialisation fonctionne
- [ ] Ajout d'une photo de chauffeur dans l'admin

En cas d'erreur côté API : Render → service → **Logs** (les erreurs PHP y apparaissent).
