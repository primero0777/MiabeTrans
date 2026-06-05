# CAHIER DES CHARGES — MIABETRANS

**Plateforme de réservation de trajets interurbains au Togo**

---

| | |
|---|---|
| **Projet** | MiabeTrans |
| **Type** | Application web SPA + API REST |
| **Version document** | 2.0 |
| **Date** | 2026-05-01 |
| **Auteur** | Ephraïm NATO |
| **Statut** | Document de référence |

---

## SOMMAIRE

1. [Présentation générale du projet](#1-présentation-générale-du-projet)
2. [Contexte & Étude de l'existant](#2-contexte--étude-de-lexistant)
3. [Objectifs & Enjeux](#3-objectifs--enjeux)
4. [Périmètre du projet](#4-périmètre-du-projet)
5. [Acteurs, rôles & personas](#5-acteurs-rôles--personas)
6. [Parcours utilisateurs](#6-parcours-utilisateurs)
7. [Exigences fonctionnelles détaillées](#7-exigences-fonctionnelles-détaillées)
8. [Exigences non fonctionnelles](#8-exigences-non-fonctionnelles)
9. [Règles de gestion](#9-règles-de-gestion)
10. [Architecture technique](#10-architecture-technique)
11. [Modèle conceptuel de données](#11-modèle-conceptuel-de-données)
12. [Spécifications API détaillées](#12-spécifications-api-détaillées)
13. [Description écran par écran](#13-description-écran-par-écran)
14. [Charte graphique & UX](#14-charte-graphique--ux)
15. [Sécurité & conformité](#15-sécurité--conformité)
16. [Intégrations externes](#16-intégrations-externes)
17. [Performance & scalabilité](#17-performance--scalabilité)
18. [Plan de tests](#18-plan-de-tests)
19. [Stratégie de déploiement](#19-stratégie-de-déploiement)
20. [Maintenance & support](#20-maintenance--support)
21. [Matrice des risques](#21-matrice-des-risques)
22. [Planning & lotissement](#22-planning--lotissement)
23. [Budget estimatif](#23-budget-estimatif)
24. [Livrables attendus](#24-livrables-attendus)
25. [Critères d'acceptation](#25-critères-dacceptation)
26. [Évolutions futures (V2 / V3)](#26-évolutions-futures-v2--v3)
27. [Contraintes légales & RGPD](#27-contraintes-légales--rgpd)
28. [Annexes](#28-annexes)
29. [Glossaire](#29-glossaire)
30. [Validation & signatures](#30-validation--signatures)

---

## 1. PRÉSENTATION GÉNÉRALE DU PROJET

### 1.1. Identité du projet

**MiabeTrans** est une plateforme web full-stack destinée à digitaliser la réservation de trajets en bus interurbains au Togo. Le nom *Miabe* (en éwé : « venez » / « bienvenue ») reflète une volonté d'accessibilité et d'accueil au cœur du service.

### 1.2. Vision

Devenir la **référence numérique du transport interurbain au Togo**, puis dans la sous-région ouest-africaine, en offrant aux voyageurs une expérience de réservation simple, sécurisée et 100% mobile, et aux opérateurs un outil de gestion centralisé de leur activité.

### 1.3. Mission

- **Pour les voyageurs** : permettre la réservation et le paiement d'un trajet en moins de 2 minutes, depuis n'importe où.
- **Pour les opérateurs** : digitaliser la gestion de la flotte, des chauffeurs, des horaires et des paiements.
- **Pour l'écosystème** : produire de la donnée structurée sur la mobilité interurbaine togolaise.

### 1.4. Valeurs de marque

| Valeur | Traduction concrète |
|---|---|
| **Simplicité** | Parcours de réservation en 4 clics maximum |
| **Confiance** | Reçu numérique, référence unique, traçabilité complète |
| **Proximité** | Interface en français, support WhatsApp, paiement mobile money local |
| **Modernité** | Stack web 2025 (React 19, API REST, JWT) |

---

## 2. CONTEXTE & ÉTUDE DE L'EXISTANT

### 2.1. Contexte sectoriel

Le transport interurbain au Togo est dominé par des compagnies privées dont la commercialisation est presque exclusivement physique : achat de tickets en gare, file d'attente, espèces. Le taux de pénétration mobile (~85%) et l'usage massif des solutions de mobile money (Mixx By Yas, Flooz) créent un terrain favorable à la digitalisation.

### 2.2. Problèmes adressés

| Problème | Impact actuel | Solution MiabeTrans |
|---|---|---|
| Files d'attente en gare | Perte de temps des voyageurs | Réservation en ligne 24/7 |
| Indisponibilité visible des places | Voyageurs revenant bredouilles | Affichage temps réel des places |
| Doubles assignations bus / chauffeur | Conflits opérationnels en gare | Détection automatique ±3h |
| Pas de reçu standardisé | Aucune preuve d'achat fiable | Reçu PDF + référence MT-XXXXXX-AAAA |
| Communication chauffeurs ↔ direction | Coups de fil manuels | Notifications email automatiques |

### 2.3. Étude rapide de la concurrence

| Acteur | Couverture | Réservation en ligne | Paiement mobile | Multi-opérateurs |
|---|---|---|---|---|
| Compagnies traditionnelles (gares) | ✅ Forte | ❌ | ❌ | ❌ |
| Solutions panafricaines (ex. agrégateurs régionaux) | ⚠️ Partielle Togo | ✅ | ✅ | ✅ |
| **MiabeTrans** | 🎯 Togo en V1, Afrique de l'Ouest en V3 | ✅ | 🚧 (simulé en V1) | ❌ V1 / 🎯 V2 |

### 2.4. Analyse SWOT

| Forces | Faiblesses |
|---|---|
| Stack moderne et maintenable (React 19, REST API, JWT) | Paiement uniquement simulé en V1 |
| Détection automatique des conflits d'assignation | Dépendance à un compte SMTP Gmail personnel |
| Couverture des 10 principales villes du Togo | Pas encore de version mobile native |
| Notifications email transactionnelles complètes | Pas de rate limiting / monitoring en V1 |

| Opportunités | Menaces |
|---|---|
| Croissance du e-commerce et du mobile money au Togo | Concurrence d'agrégateurs régionaux établis |
| Possibilité d'agréger plusieurs compagnies | Réticence d'opérateurs traditionnels |
| Extension vers UEMOA (Bénin, Burkina, Côte d'Ivoire) | Réglementation transports en évolution |
| Données mobilité monétisables (B2B, État) | Risque de fraude sur paiement simulé si exposé en l'état |

---

## 3. OBJECTIFS & ENJEUX

### 3.1. Objectifs SMART

| Code | Objectif | Indicateur | Cible | Échéance |
|---|---|---|---|---|
| OBJ-01 | Réduire le temps de réservation | Temps moyen | < 2 min | V1 |
| OBJ-02 | Atteindre la disponibilité 24/7 | Taux d'uptime | ≥ 99% | V1 + 3 mois |
| OBJ-03 | Garantir la traçabilité des paiements | % réservations avec reçu | 100% | V1 |
| OBJ-04 | Supprimer les conflits d'assignation involontaires | Conflits non détectés | 0 | V1 |
| OBJ-05 | Convertir en clients enregistrés | Conversion visiteur → inscrit | ≥ 25% | V1 + 6 mois |
| OBJ-06 | Atteindre 1 000 réservations/mois | Volume | 1 000 | V1 + 12 mois |

### 3.2. Enjeux

- **Économique** : ouvrir un canal de vente complémentaire pour les opérateurs.
- **Opérationnel** : fiabiliser les assignations et l'information voyageur.
- **Stratégique** : poser la première brique d'une plateforme de mobilité régionale.
- **Image** : positionner le Togo comme territoire d'innovation en transport.

---

## 4. PÉRIMÈTRE DU PROJET

### 4.1. Inclus en V1

- Site web responsive (desktop / tablette / mobile).
- Espace public : accueil, recherche, détail trajet, FAQ, contact, à propos.
- Espace authentifié : réservation, paiement (simulé), historique, profil.
- Espace administrateur : CRUD villes / trajets / bus / chauffeurs / utilisateurs, assignation horaires, dashboard, gestion des réservations.
- Espace chauffeur : trajets affectés et passagers attendus.
- Notifications email transactionnelles (PHPMailer SMTP).
- Authentification JWT + OTP par email.

### 4.2. Exclus de la V1

- Application mobile native iOS / Android.
- Intégration des passerelles de paiement réelles.
- Géolocalisation temps réel des bus.
- Système d'avis / notation publique.
- Multi-langue.
- Marketplace multi-opérateurs.
- Rappels SMS automatiques.
- Programme de fidélité.

### 4.3. Hors périmètre permanent

- Vente de billets pour d'autres modes (avion, train, taxi).
- Assurance voyage intégrée.
- Logistique colis / fret.

---

## 5. ACTEURS, RÔLES & PERSONAS

### 5.1. Matrice des rôles applicatifs

| Rôle | Code BDD | Authentifié | Description | Périmètre |
|---|---|---|---|---|
| Visiteur | — | Non | Internaute non inscrit | Recherche, consultation, inscription |
| Client | `id_role = 2` (défaut) | Oui | Voyageur enregistré | Réservation, paiement, historique, profil |
| Chauffeur | `id_role = 3` | Oui | Conducteur affecté à un bus | Consultation trajets et passagers |
| Administrateur | `id_role = 1` | Oui | Gestionnaire plateforme | Tout |

### 5.2. Persona — Kossi, le voyageur étudiant

> 22 ans, étudiant à Lomé, originaire de Kara. Voyage 1 fois/mois pour rentrer en famille.
>
> - **Smartphone Android entrée de gamme**, connexion 4G intermittente.
> - **Paie avec Mixx By Yas**, jamais en carte bancaire.
> - **Frustrations** : files d'attente du vendredi soir, ne sait jamais s'il restera des places.
> - **Attentes** : interface mobile rapide, paiement mobile money simple, reçu sur WhatsApp.

### 5.3. Persona — Ama, l'entrepreneure

> 35 ans, dirige une boutique à Lomé, voyage régulièrement à Kpalimé pour son approvisionnement.
>
> - **Smartphone milieu de gamme**, à l'aise avec les apps.
> - **Paie indifféremment** par mobile money ou carte bancaire.
> - **Frustrations** : pas de visibilité sur les horaires à l'avance.
> - **Attentes** : pouvoir réserver la veille, recevoir une confirmation par email, télécharger un reçu pour sa comptabilité.

### 5.4. Persona — Kofi, le chauffeur

> 42 ans, chauffeur depuis 15 ans, basé à la gare routière.
>
> - **Smartphone basique**, peu à l'aise avec les applications complexes.
> - **Frustrations** : être prévenu en dernière minute d'un trajet.
> - **Attentes** : voir clairement ses trajets de la semaine et la liste de ses passagers.

### 5.5. Persona — Madame Adjo, l'administratrice

> 38 ans, responsable d'exploitation chez l'opérateur partenaire.
>
> - **Travaille sur ordinateur** la majeure partie du temps.
> - **Frustrations** : tableaux Excel multiples, doubles affectations, suivi manuel des paiements.
> - **Attentes** : un outil unique pour gérer flotte, chauffeurs, horaires et voir les revenus du mois.

---

## 6. PARCOURS UTILISATEURS

### 6.1. Parcours voyageur — Réserver un trajet

```
[Accueil] → [Recherche : Lomé → Kara, 15 mai]
   → [Liste horaires + places restantes]
   → [Détail horaire]
   → [Connexion ou Inscription si non authentifié]
       └─ Inscription : email → OTP 6 chiffres → mot de passe
   → [Sélection mode de paiement]
   → [Création réservation : statut "en_attente", expire dans 30 min]
   → [Email avec référence à composer]
   → [Saisie de la référence sur la plateforme]
   → [Validation paiement → statut "confirmée"]
   → [Reçu PDF téléchargeable + email confirmation]
```

**Points de friction identifiés à minimiser :**
- Délai entre création de la réservation et paiement effectif.
- Reconnexion mobile/desktop pour saisir la référence.
- Lecture/saisie correcte de la référence depuis l'email.

### 6.2. Parcours administrateur — Créer un nouvel horaire

```
[Login admin] → [Dashboard] → [Assignations]
   → [Sélection trajet : Lomé → Kara]
   → [Sélection bus disponible (filtre auto)]
   → [Date/heure de départ]
   → Vérification automatique de conflits (±3h)
       ├─ Aucun conflit : création immédiate
       └─ Conflit détecté : alerte + option "Forcer"
   → [Notification email automatique au chauffeur]
   → [Horaire visible côté public]
```

### 6.3. Parcours chauffeur — Préparer son trajet

```
[Email "Vous avez un nouveau trajet"]
   → [Login chauffeur]
   → [Liste de mes trajets]
   → [Sélection horaire]
   → [Vue passagers réservés (nom, téléphone, statut paiement)]
   → [Préparation du voyage]
```

### 6.4. Parcours mot de passe oublié

```
[Login] → [Mot de passe oublié ?]
   → [Saisie email]
   → [Email avec lien de reset (token 64 chars, 1h)]
   → [Page reset : nouveau mot de passe]
   → [Confirmation + redirection login]
```

---

## 7. EXIGENCES FONCTIONNELLES DÉTAILLÉES

> Convention de notation des priorités :
> **MUST** = indispensable V1 · **SHOULD** = important · **COULD** = bonus · **WON'T** = hors scope V1.

### 7.1. Module Authentification

| Réf | Exigence | Priorité |
|---|---|---|
| AUTH-01 | Inscription par email avec vérification OTP (6 chiffres, 10 min, 5 tentatives max) | MUST |
| AUTH-02 | Connexion email + mot de passe → JWT HS256, 24h | MUST |
| AUTH-03 | Hachage bcrypt des mots de passe (cost ≥ 10) | MUST |
| AUTH-04 | Mot de passe oublié → lien de reset (token 64 chars, 1h, usage unique) | MUST |
| AUTH-05 | Modification du profil : nom, prénom, email, téléphone, mot de passe | MUST |
| AUTH-06 | Vérification de l'ancien mot de passe avant modification du nouveau | MUST |
| AUTH-07 | Déconnexion automatique sur 401 | MUST |
| AUTH-08 | Soft delete des comptes (`deleted_at`) | SHOULD |
| AUTH-09 | Re-envoi d'OTP avec cooldown 60s | SHOULD |
| AUTH-10 | Authentification à 2 facteurs persistante | COULD |
| AUTH-11 | Connexion via Google / Apple | WON'T (V1) |

### 7.2. Module Catalogue & Recherche

| Réf | Exigence | Priorité |
|---|---|---|
| SRCH-01 | Recherche d'horaires par ville de départ, ville d'arrivée et date | MUST |
| SRCH-02 | Affichage en temps réel des places restantes par horaire | MUST |
| SRCH-03 | Affichage prix, distance, bus, chauffeur | MUST |
| SRCH-04 | Page détail horaire complète | MUST |
| SRCH-05 | Pages institutionnelles (Accueil, À propos, FAQ, Contact) | MUST |
| SRCH-06 | Filtres avancés : tranche horaire, fourchette prix, places minimum | SHOULD |
| SRCH-07 | Tri (prix asc/desc, heure départ, places restantes) | SHOULD |
| SRCH-08 | Pagination ou scroll infini sur résultats | SHOULD |
| SRCH-09 | Suggestions « Trajets populaires » sur l'accueil | COULD |

### 7.3. Module Réservation

| Réf | Exigence | Priorité |
|---|---|---|
| RES-01 | Création réservation au statut `en_attente` avec mode de paiement | MUST |
| RES-02 | Numéro de reçu auto au format `MT-XXXXXX-AAAA` (trigger BDD) | MUST |
| RES-03 | Délai d'expiration selon le mode (30 / 20 / 45 min) | MUST |
| RES-04 | Simulation paiement → génération référence + email | MUST |
| RES-05 | Validation paiement par saisie de la référence | MUST |
| RES-06 | Email de confirmation | MUST |
| RES-07 | Téléchargement du reçu en PDF | MUST |
| RES-08 | Annulation par le client (sous conditions de délai) | MUST |
| RES-09 | Annulation par admin avec raison + email client | MUST |
| RES-10 | Historique des réservations du client | MUST |
| RES-11 | Affichage du compte à rebours d'expiration | SHOULD |
| RES-12 | Réservation multi-passagers (1 paiement, n places) | SHOULD |
| RES-13 | Choix du siège | COULD |
| RES-14 | Programme de fidélité | WON'T (V1) |

### 7.4. Module Administration

| Réf | Exigence | Priorité |
|---|---|---|
| ADM-01 | CRUD villes | MUST |
| ADM-02 | CRUD trajets | MUST |
| ADM-03 | CRUD bus (numéro, capacité, statut, chauffeur affecté) | MUST |
| ADM-04 | Création de comptes chauffeurs + upload photo profil & CNI | MUST |
| ADM-05 | Liste, modification de rôle et désactivation des utilisateurs | MUST |
| ADM-06 | Création d'un horaire (trajet × bus × date) | MUST |
| ADM-07 | Détection des conflits ±3h, option de forçage | MUST |
| ADM-08 | Notification email automatique au chauffeur sur assignation | MUST |
| ADM-09 | Modification du statut d'un horaire | MUST |
| ADM-10 | Vue consolidée de toutes les réservations | MUST |
| ADM-11 | Tableau de bord KPIs (revenus, volumes, statuts) | MUST |
| ADM-12 | Centre de notifications avec lu/non lu | SHOULD |
| ADM-13 | Validation manuelle d'un paiement (cas cash en gare) | SHOULD |
| ADM-14 | Export CSV/Excel des réservations et revenus | SHOULD |
| ADM-15 | Logs d'audit (qui a fait quoi, quand) | COULD |

### 7.5. Module Chauffeur

| Réf | Exigence | Priorité |
|---|---|---|
| CHF-01 | Liste des trajets affectés au bus du chauffeur | MUST |
| CHF-02 | Liste des passagers par horaire (nom, téléphone, statut paiement) | MUST |
| CHF-03 | Modification de son profil personnel | MUST |
| CHF-04 | Marquer un trajet comme « démarré » / « terminé » | SHOULD |
| CHF-05 | Confirmer la présence d'un passager (check-in) | SHOULD |

### 7.6. Module Notifications

| Réf | Exigence | Priorité |
|---|---|---|
| NOT-01 | Email transactionnel à chaque événement clé (8 templates) | MUST |
| NOT-02 | Trace des envois en base (`notifications_envoi`) | MUST |
| NOT-03 | Lien WhatsApp pré-rempli depuis page contact | MUST |
| NOT-04 | Rappel automatique J-1 et H-1 par email | SHOULD |
| NOT-05 | Notifications push web (PWA) | COULD |
| NOT-06 | SMS via passerelle locale | COULD |

---

## 8. EXIGENCES NON FONCTIONNELLES

### 8.1. Performance

| Réf | Exigence | Cible |
|---|---|---|
| PERF-01 | Temps de chargement initial du front | < 3 s sur 4G |
| PERF-02 | Temps de réponse API standard | P95 < 500 ms |
| PERF-03 | Recherche d'horaires sur 1 000 entrées | < 1 s |
| PERF-04 | Lazy loading des routes React | Activé |
| PERF-05 | Pagination listes admin > 50 entrées | À implémenter |

### 8.2. Disponibilité & robustesse

| Réf | Exigence |
|---|---|
| DIS-01 | Sauvegarde quotidienne automatique de la base |
| DIS-02 | Soft delete sur les entités sensibles |
| DIS-03 | Logs serveur centralisés (à implémenter) |
| DIS-04 | Plan de reprise d'activité (RPO 24h, RTO 4h) |

### 8.3. Compatibilité

| Réf | Exigence |
|---|---|
| COM-01 | Navigateurs : Chrome, Firefox, Edge, Safari (2 dernières versions) |
| COM-02 | Responsive : breakpoints 360 / 768 / 1024 / 1440 px |
| COM-03 | OS serveur : Linux préférablement (Ubuntu 22.04 LTS) ou Windows Server |

### 8.4. Accessibilité

| Réf | Exigence |
|---|---|
| ACC-01 | Contrastes WCAG AA minimum |
| ACC-02 | Libellés explicites sur tous les formulaires |
| ACC-03 | Navigation clavier complète |
| ACC-04 | Attributs ARIA sur composants dynamiques |

### 8.5. Maintenabilité

| Réf | Exigence |
|---|---|
| MAI-01 | Séparation claire backend / frontend |
| MAI-02 | Conventions : `snake_case` BDD, `camelCase` JS, `PascalCase` composants React |
| MAI-03 | Variables sensibles dans `.env` (jamais en dur) |
| MAI-04 | Documentation API au format OpenAPI (à produire) |

### 8.6. Évolutivité

| Réf | Exigence |
|---|---|
| EVO-01 | Architecture stateless (JWT, pas de session serveur) → scale horizontal possible |
| EVO-02 | Schéma BDD ouvert au multi-opérateurs (à anticiper) |
| EVO-03 | Front prêt pour PWA / mobile (réutilisation API) |

---

## 9. RÈGLES DE GESTION

| Réf | Règle |
|---|---|
| RG-01 | Une réservation ne peut concerner qu'un horaire dont la date de départ est strictement future. |
| RG-02 | Le nombre cumulé de réservations confirmées + en_attente non expirées sur un horaire ≤ capacité du bus. |
| RG-03 | Une réservation `en_attente` non payée à `expire_le` est automatiquement basculée `annulée`. |
| RG-04 | La référence de paiement est générée serveur, jamais saisie librement. |
| RG-05 | Un bus ne peut avoir deux horaires distants de moins de 3h. Idem pour son chauffeur. |
| RG-06 | L'admin peut forcer l'assignation conflictuelle via `force=true`, traçabilité conservée. |
| RG-07 | Un client peut annuler tant que `statut_paiement ≠ paye` ou que le départ est à plus de 12h. |
| RG-08 | Toute suppression d'entité métier (ville, trajet, bus, horaire) est logique (`deleted_at`). |
| RG-09 | Tout événement majeur (réservation, paiement, annulation, assignation) déclenche un email. |
| RG-10 | Un utilisateur soft-deleted ne peut plus se connecter. |
| RG-11 | L'email est unique parmi les comptes actifs (non soft-deleted). |
| RG-12 | Le numéro de bus est unique parmi les bus actifs. |
| RG-13 | Le numéro de reçu suit strictement le format `MT-XXXXXX-AAAA` (généré par trigger). |
| RG-14 | Un chauffeur ne peut être assigné qu'à un seul bus actif simultanément. |
| RG-15 | Un OTP utilisé ou expiré est marqué `used = 1` et ne peut être réutilisé. |
| RG-16 | Un token de reset utilisé ne peut servir une seconde fois. |
| RG-17 | Le délai d'expiration d'une réservation dépend strictement du mode de paiement (table de référence). |
| RG-18 | Les uploads de fichiers acceptent uniquement JPG, PNG, WebP, ≤ 5 Mo. |
| RG-19 | Seul un administrateur peut créer un compte chauffeur. |
| RG-20 | Le rôle `Client` est attribué par défaut à toute inscription publique. |

---

## 10. ARCHITECTURE TECHNIQUE

### 10.1. Vue d'ensemble

```
                ┌──────────────────────────┐
                │   Navigateur (React SPA) │
                │   Vite + React Router    │
                │   Axios + JWT localStorage│
                └────────────┬─────────────┘
                             │  HTTPS (REST JSON)
                             ▼
                ┌──────────────────────────┐
                │  Apache + PHP (REST API) │
                │  Middleware JWT + rôles  │
                └────────────┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌───────────┐ ┌──────────────┐
      │ MySQL 5.7+   │ │ PHPMailer │ │ /uploads/    │
      │ miabetrans_db│ │ SMTP Gmail│ │ chauffeurs/  │
      └──────────────┘ └───────────┘ └──────────────┘
```

### 10.2. Stack technologique

| Couche | Technologie | Version |
|---|---|---|
| Front-end framework | React | 19.2.4 |
| Build tool | Vite | 8.0.1 |
| Routage | React Router DOM | 7.14.0 |
| HTTP client | Axios | 1.14.0 |
| Linting | ESLint | 9.39.4 |
| Back-end | PHP | ≥ 7.4 |
| Serveur web | Apache | 2.4 |
| Base de données | MySQL | ≥ 5.7 |
| Email | PHPMailer | embarqué |
| Authentification | JWT custom HS256 | — |
| Encodage | UTF-8 / utf8mb4 | — |

### 10.3. Pattern d'architecture

- **REST stateless** : chaque requête porte son JWT.
- **SPA** : tout est rendu côté client après chargement initial.
- **Routage API par domaine** : `/api/<domaine>/<action>.php` ou `?resource=`.
- **Middleware** centralisé pour authentification et contrôle de rôle.
- **Séparation environnement** via `.env`.

### 10.4. Arborescence cible

```
MiabeTrans/
├── backend/
│   ├── api/
│   │   ├── auth/                # login, register, OTP, reset, profile
│   │   ├── trajets/             # recherche, CRUD
│   │   ├── horaires/            # liste publique, détail
│   │   ├── reservations/        # CRUD, simuler-paiement, payer, recu
│   │   ├── admin/               # gestion globale, assignation
│   │   ├── chauffeur/           # mes-trajets
│   │   └── upload/              # photos profil & CNI
│   ├── config/                  # database, helpers, mailer
│   ├── middleware/              # auth.php (JWT, rôles)
│   ├── database/                # SQL + migrations
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/               # Home, Search, Booking, Admin, etc.
│   │   ├── components/          # Layout, UI
│   │   ├── context/             # AuthContext
│   │   ├── services/            # api.js
│   │   └── styles/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── uploads/
│   └── chauffeurs/
└── CAHIER_DES_CHARGES.md
```

### 10.5. Flux d'authentification

```
1. POST /auth/login {email, mot_de_passe}
2. Serveur : vérifie hash bcrypt
3. Serveur : génère JWT (id_utilisateur, id_role, iat, exp)
4. Réponse : { token, user }
5. Client : stocke token en localStorage
6. Axios interceptor : ajoute Authorization: Bearer <token>
7. Middleware backend : vérifie signature + expiration
8. Si 401 : déconnexion automatique côté client
```

### 10.6. Flux de réservation et paiement

```
1. Client → POST /reservations { id_horaire, mode_paiement }
2. Serveur : crée réservation (statut "en_attente", expire_le calculé)
3. Serveur : trigger BDD génère numero_recu MT-XXXXXX-AAAA
4. Réponse : { id_reservation, numero_recu, expire_le }
5. Client → POST /reservations/simuler-paiement { id_reservation, ... }
6. Serveur : génère reference_paiement, envoie email
7. Email reçu → client saisit la référence
8. Client → POST /reservations/payer { id_reservation, reference_paiement }
9. Serveur : vérifie référence, marque "paye" et "confirmée"
10. Serveur : envoie email confirmation + reçu
```

---

## 11. MODÈLE CONCEPTUEL DE DONNÉES

### 11.1. Diagramme relationnel (description)

```
roles ─< utilisateurs ─< reservations >─ horaires >─ trajets >─ villes (×2)
                              │              │
                              │              └─< bus >─ utilisateurs (chauffeur)
                              │
                              └─< paiements
                              └─< evaluations
                              └─< notifications_envoi

utilisateurs ─< notifications
utilisateurs ─< otp_verifications
utilisateurs ─< password_resets (par email)
```

### 11.2. Tables détaillées

#### `roles`
| Champ | Type | Contraintes |
|---|---|---|
| id_role | INT(11) | PK, AUTO_INCREMENT |
| libelle_role | VARCHAR(50) | UNIQUE, NOT NULL |

Données : `Administrateur`, `Client`, `Chauffeur`.

#### `utilisateurs`
| Champ | Type | Contraintes |
|---|---|---|
| id_utilisateur | INT(11) | PK, AUTO_INCREMENT |
| nom | VARCHAR(100) | NOT NULL |
| prenom | VARCHAR(100) | NOT NULL DEFAULT '' |
| email | VARCHAR(100) | UNIQUE, NOT NULL |
| telephone | VARCHAR(20) | — |
| photo_profil | VARCHAR(255) | — |
| photo_cni | VARCHAR(255) | — |
| email_verifie | TINYINT(1) | NOT NULL DEFAULT 0 |
| mot_de_passe | VARCHAR(255) | bcrypt |
| id_role | INT(11) | FK → roles, DEFAULT 2 |
| date_creation | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| deleted_at | DATETIME | nullable |

#### `villes`
| Champ | Type | Contraintes |
|---|---|---|
| id_ville | INT(11) | PK, AUTO_INCREMENT |
| nom_ville | VARCHAR(100) | UNIQUE, NOT NULL |

Villes initiales : Lomé, Kpalimé, Atakpamé, Sokodé, Kara, Dapaong, Tsévié, Notsé, Badou, Mango.

#### `bus`
| Champ | Type | Contraintes |
|---|---|---|
| id_bus | INT(11) | PK |
| numero_bus | VARCHAR(20) | UNIQUE, NOT NULL |
| chauffeur_id | INT(11) | FK → utilisateurs, nullable |
| capacite | INT(4) | DEFAULT 30 |
| statut | ENUM | `actif`, `en_maintenance`, `indisponible` |
| deleted_at | DATETIME | nullable |

#### `trajets`
| Champ | Type | Contraintes |
|---|---|---|
| id_trajet | INT(11) | PK |
| id_ville_depart | INT(11) | FK → villes |
| id_ville_arrivee | INT(11) | FK → villes |
| distance_km | DECIMAL(10,2) | DEFAULT 0 |
| prix | DECIMAL(10,2) | DEFAULT 0 (FCFA) |
| deleted_at | DATETIME | nullable |

#### `horaires`
| Champ | Type | Contraintes |
|---|---|---|
| id_horaire | INT(11) | PK |
| id_trajet | INT(11) | FK → trajets |
| id_bus | INT(11) | FK → bus |
| date_depart | DATETIME | NOT NULL |
| statut | ENUM | `prévu`, `en_cours`, `terminé`, `annulé` |
| deleted_at | DATETIME | nullable |

#### `reservations`
| Champ | Type | Contraintes |
|---|---|---|
| id_reservation | INT(11) | PK |
| id_utilisateur | INT(11) | FK → utilisateurs |
| id_horaire | INT(11) | FK → horaires |
| date_reservation | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| statut_reservation | ENUM | `en_attente`, `confirmée`, `annulée` |
| numero_recu | VARCHAR(20) | UNIQUE, format `MT-XXXXXX-AAAA` |
| mode_paiement | VARCHAR(30) | Mixx By Yas, Flooz, Carte Bancaire, Cash |
| reference_paiement | VARCHAR(100) | générée par simulation |
| statut_paiement | ENUM | `non_paye`, `en_attente`, `paye` |
| expire_le | DATETIME | dépend du mode |

#### `paiements`
| Champ | Type | Contraintes |
|---|---|---|
| id_paiement | INT(11) | PK |
| id_reservation | INT(11) | FK → reservations |
| montant | DECIMAL(10,2) | NOT NULL |
| mode_paiement | ENUM | `TMoney`, `Flooz`, `Cash`, `MobileMoney` |
| date_paiement | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### `notifications`
| Champ | Type | Contraintes |
|---|---|---|
| id_notification | INT(11) | PK |
| id_utilisateur | INT(11) | FK |
| contenu | VARCHAR(255) | NOT NULL |
| lu | TINYINT(1) | DEFAULT 0 |
| date_notification | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### `evaluations`
| Champ | Type | Contraintes |
|---|---|---|
| id_evaluation | INT(11) | PK |
| id_utilisateur | INT(11) | FK |
| id_horaire | INT(11) | FK |
| note | TINYINT(1) | 1-5 |
| commentaire | VARCHAR(255) | — |
| date_evaluation | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### `otp_verifications`
| Champ | Type | Contraintes |
|---|---|---|
| id | INT(11) | PK |
| email | VARCHAR(100) | NOT NULL |
| otp_code | VARCHAR(8) | NOT NULL |
| type | ENUM | `inscription`, `reset_mdp`, `autre` |
| used | TINYINT(1) | DEFAULT 0 |
| attempts | TINYINT(1) | DEFAULT 0 (max 5) |
| expires_at | DATETIME | +10 min |
| created_at | DATETIME | DEFAULT NOW |

#### `password_resets`
| Champ | Type | Contraintes |
|---|---|---|
| id | INT(11) | PK |
| email | VARCHAR(100) | NOT NULL |
| token | VARCHAR(64) | UNIQUE |
| expires_at | DATETIME | +1h |
| used | TINYINT(1) | DEFAULT 0 |
| created_at | DATETIME | DEFAULT NOW |

#### `notifications_envoi`
| Champ | Type | Contraintes |
|---|---|---|
| id | INT(11) | PK |
| id_reservation | INT(11) | FK nullable |
| id_utilisateur | INT(11) | FK |
| type_envoi | ENUM | `email`, `whatsapp`, `sms` |
| sujet | VARCHAR(255) | — |
| contenu | TEXT | — |
| statut | ENUM | `envoyé`, `échec`, `en_attente` |
| created_at | DATETIME | DEFAULT NOW |

### 11.3. Vues SQL

- **`vue_horaires_details`** : agrège trajet, ville départ/arrivée, places libres, bus, chauffeur. Utilisée par les pages de recherche et le détail horaire.

### 11.4. Triggers

- **Auto-génération `numero_recu`** au format `MT-XXXXXX-AAAA` à l'insertion d'une réservation.

### 11.5. Index recommandés

| Table | Colonne(s) |
|---|---|
| `utilisateurs` | `email`, `id_role` |
| `bus` | `numero_bus`, `chauffeur_id` |
| `trajets` | `id_ville_depart`, `id_ville_arrivee` |
| `horaires` | `date_depart`, `id_bus` |
| `reservations` | `id_utilisateur`, `id_horaire`, `numero_recu`, `expire_le` |
| `otp_verifications` | `email`, `expires_at` |
| `password_resets` | `token` |

---

## 12. SPÉCIFICATIONS API DÉTAILLÉES

### 12.1. Conventions

- **Base URL (dev)** : `http://localhost/miabetrans/backend/api`
- **Base URL (prod)** : `https://api.miabetrans.tg`
- **Format** : JSON UTF-8.
- **Authentification** : header `Authorization: Bearer <jwt>`.
- **Codes** : 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 500 Server Error.

### 12.2. Endpoints — Authentification

#### POST `/auth/login.php`
**Requête**
```json
{ "email": "kossi@example.com", "mot_de_passe": "MotDePasse123" }
```
**Réponse 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id_utilisateur": 4,
    "nom": "Mensah",
    "prenom": "Kossi",
    "email": "kossi@example.com",
    "id_role": 2
  }
}
```
**Erreurs** : 401 si identifiants incorrects, 403 si compte désactivé.

#### POST `/auth/register.php`
**Requête**
```json
{
  "nom": "Mensah",
  "prenom": "Kossi",
  "email": "kossi@example.com",
  "telephone": "+22890123456",
  "mot_de_passe": "MotDePasse123",
  "otp_verifie": true
}
```
**Réponse 201** : utilisateur créé + token.

#### POST `/auth/send-otp.php`
**Requête** : `{ "email": "...", "type": "inscription" }`
**Effet** : envoi d'un email avec OTP 6 chiffres, validité 10 min.

#### POST `/auth/verify-otp.php`
**Requête** : `{ "email": "...", "otp_code": "482931", "type": "inscription" }`
**Réponse 200** : `{ "valide": true }`
**Erreur 422** si code invalide ou expiré.

#### POST `/auth/forgot-password.php`
Envoie un email avec un lien `https://app.miabetrans.tg/reset-password?token=...`.

#### POST `/auth/reset-password.php`
**Requête** : `{ "token": "...", "mot_de_passe": "NouveauMdp123" }`

#### GET `/auth/me.php` *(authentifié)*
Retourne le profil courant.

#### PUT `/auth/update-profile.php` *(authentifié)*
Met à jour profil ; pour changer le mot de passe, fournir `ancien_mdp` + `nouveau_mdp`.

### 12.3. Endpoints — Catalogue

#### GET `/trajets/index.php`
**Query** : `depart`, `arrivee`, `date` (optionnels).
**Réponse** : liste des trajets correspondants (détail prix, distance, horaires, places restantes).

#### GET `/trajets/crud.php?id=X` *(admin)*
Détail d'un trajet.

#### POST `/trajets/crud.php` *(admin)*
**Requête** : `{ id_ville_depart, id_ville_arrivee, distance_km, prix }`

#### PUT `/trajets/crud.php?id=X` *(admin)* — modification
#### DELETE `/trajets/crud.php?id=X` *(admin)* — soft delete

#### GET `/horaires/index.php`
Liste des horaires futurs avec places restantes.

#### GET `/horaires/detail.php?id=X`
Détail complet d'un horaire.

### 12.4. Endpoints — Réservations

#### GET `/reservations/index.php` *(authentifié)*
- Client : ses réservations.
- Admin : toutes les réservations.

#### POST `/reservations/index.php` *(client)*
**Requête** : `{ "id_horaire": 12, "mode_paiement": "Mixx By Yas" }`
**Réponse 201** : `{ id_reservation, numero_recu, expire_le }`

#### DELETE `/reservations/index.php?id=X` *(client)*
Annulation client.

#### GET `/reservations/recu.php?id=X` *(authentifié)*
Détail complet pour génération du reçu.

#### POST `/reservations/simuler-paiement.php` *(client)*
**Requête** :
```json
{
  "id_reservation": 17,
  "numero_carte": "4242...",
  "expiration_mois": "12",
  "expiration_annee": "2027",
  "cvv": "123",
  "nom_porteur": "KOSSI MENSAH"
}
```
**Effet** : génération `reference_paiement` + envoi email.

#### POST `/reservations/payer.php` *(client)*
**Requête** : `{ "id_reservation": 17, "reference_paiement": "REF-XXXX" }`
**Effet** : statut → `paye` + `confirmée`, email confirmation.

### 12.5. Endpoints — Administration

| Méthode | Endpoint | Ressource(s) |
|---|---|---|
| GET / POST / PUT / DELETE | `/admin/index.php?resource=…` | `bus`, `villes`, `utilisateurs`, `chauffeurs`, `roles`, `notifications`, `stats` |
| PUT | `/admin/update-user.php?id=X` | Modification d'un utilisateur |
| POST | `/admin/annuler-reservation.php` | `{ id_reservation, raison }` |
| GET / POST / PUT / DELETE | `/admin/assignation.php` | Horaires + détection conflits (paramètre `force`) |

#### GET `/admin/index.php?resource=stats`
**Réponse**
```json
{
  "utilisateurs": 124,
  "chauffeurs": 8,
  "trajets": 10,
  "bus": 12,
  "reservations_total": 357,
  "reservations_en_attente": 14,
  "reservations_confirmees": 312,
  "reservations_annulees": 31,
  "revenus_total": 1250000,
  "revenus_mois": 215000
}
```

### 12.6. Endpoints — Chauffeur & Upload

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/chauffeur/mes-trajets.php` | Liste des trajets du bus du chauffeur |
| POST | `/upload/index.php?type=photo|cni&chauffeur_id=X` | Upload multipart, max 5 Mo |

### 12.7. Format d'erreur uniforme

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le champ email est requis.",
    "details": { "field": "email" }
  }
}
```

---

## 13. DESCRIPTION ÉCRAN PAR ÉCRAN

### 13.1. Accueil (`/`)
- Hero avec slogan + barre de recherche (départ, arrivée, date, bouton « Rechercher »).
- Section « Trajets populaires » (4 cards).
- Section « Pourquoi MiabeTrans » (3 arguments : rapidité, sécurité, mobile money).
- Footer.

### 13.2. Recherche (`/search`)
- Filtres en haut (édition de la recherche).
- Liste de cards horaires : ville → ville, heure de départ, prix, places restantes, bouton « Réserver ».
- État vide : message + suggestion d'élargir la recherche.

### 13.3. Détail trajet (`/trajets/:id`)
- Récap complet : horaire, bus, chauffeur, distance, prix.
- CTA « Réserver maintenant » → redirige vers connexion si non authentifié.

### 13.4. Inscription (`/register`)
- Étape 1 : nom, prénom, email, téléphone, mot de passe.
- Étape 2 : OTP envoyé par email (champ 6 chiffres + bouton « Renvoyer »).
- Étape 3 : succès → redirection login.

### 13.5. Connexion (`/login`)
- Email + mot de passe, lien « Mot de passe oublié ».

### 13.6. Mot de passe oublié (`/forgot-password`) et Reset (`/reset-password`)
- Formulaire email → email envoyé.
- Page reset : nouveau mot de passe + confirmation.

### 13.7. Réservation (`/booking/:id`)
- Récap horaire à gauche.
- Choix du mode de paiement à droite (radio : Mixx By Yas, Flooz, Carte, Cash).
- Bouton « Confirmer » → création réservation `en_attente`.
- Affichage du compte à rebours d'expiration.

### 13.8. Confirmation (`/confirmation/:id`)
- Numéro de reçu, statut, détails du trajet.
- Bouton « Télécharger le reçu PDF ».
- Bouton « Aller à mon historique ».

### 13.9. Compte (`/account`)
- Édition des informations personnelles + changement mot de passe (avec ancien).

### 13.10. Historique (`/history`)
- Liste des réservations triées par date desc.
- Filtres : statut.
- Action : voir reçu, annuler (si éligible).

### 13.11. Pages institutionnelles
- `/about`, `/faq`, `/contact` : contenu statique + formulaire/lien WhatsApp.

### 13.12. Admin — Dashboard (`/admin`)
- Cards KPIs (utilisateurs, chauffeurs, bus, trajets, revenus mois, total).
- Graphiques : réservations par statut, revenus par mois.

### 13.13. Admin — Trajets, Bus, Villes, Chauffeurs, Utilisateurs
- Tableau paginé.
- Bouton « Ajouter ».
- Actions par ligne : éditer, supprimer.

### 13.14. Admin — Assignations (`/admin/assignations`)
- Sélection trajet → date/heure → bus disponible (filtré).
- Alerte conflit : modale avec détails et option « Forcer ».
- Liste des horaires existants modifiables.

### 13.15. Admin — Réservations (`/admin/reservations`)
- Tableau filtrable (statut, date, mode paiement).
- Action : voir reçu, annuler avec raison.

### 13.16. Chauffeur — Dashboard (`/chauffeur`)
- Liste des trajets affectés.
- Détail : passagers (nom, téléphone, statut paiement).

### 13.17. 404 (`/*`)
- Page d'erreur sympathique avec retour accueil.

---

## 14. CHARTE GRAPHIQUE & UX

### 14.1. Identité visuelle

| Élément | Valeur |
|---|---|
| Couleur primaire | Bleu route `#1E40AF` |
| Couleur secondaire | Orange chaleur `#F97316` |
| Couleur succès | Vert `#16A34A` |
| Couleur erreur | Rouge `#DC2626` |
| Couleur fond | `#F9FAFB` |
| Texte principal | `#111827` |
| Texte secondaire | `#6B7280` |

### 14.2. Typographie

- **Titres** : Inter / Poppins, 600-700.
- **Texte courant** : Inter / system-ui, 400-500.
- **Tailles** : 32 / 24 / 18 / 16 / 14 / 12 px.

### 14.3. Composants UI réutilisables

- Boutons : primaire, secondaire, danger, ghost (3 tailles).
- Cards : trajet, KPI, formulaire.
- Inputs : texte, email, password (avec œil), date, select.
- Modales : confirmation, formulaire, alerte conflit.
- Toasts : succès, erreur, info.
- Tableaux : avec tri, pagination, recherche.
- Navbar : responsive avec menu mobile.
- Footer : liens utiles + contact.

### 14.4. Principes UX

- **3 clics maximum** pour atteindre la réservation depuis l'accueil.
- **Feedback immédiat** sur toute action (loader, toast).
- **Accessibilité clavier** complète.
- **Messages d'erreur explicites** (jamais « erreur 500 » brut).
- **Mobile-first**.

---

## 15. SÉCURITÉ & CONFORMITÉ

### 15.1. Mesures actuelles

| Réf | Mesure |
|---|---|
| SEC-01 | JWT HS256, expiration 24h |
| SEC-02 | Hachage bcrypt des mots de passe |
| SEC-03 | Prepared statements PDO partout |
| SEC-04 | Sanitisation systématique des entrées |
| SEC-05 | Validation MIME-type et taille des uploads |
| SEC-06 | OTP 6 chiffres / 10 min / 5 tentatives |
| SEC-07 | Token reset 64 chars / 1h / usage unique |
| SEC-08 | CORS restreint à l'origine front |
| SEC-09 | Vérification de rôle systématique |
| SEC-10 | Soft delete pour audit |

### 15.2. À renforcer (V1+)

| Réf | Mesure |
|---|---|
| SEC-11 | Rate limiting sur login, OTP, forgot-password |
| SEC-12 | Headers de sécurité : CSP, X-Frame-Options, X-Content-Type-Options, HSTS |
| SEC-13 | HTTPS obligatoire en production |
| SEC-14 | Rotation des secrets (`JWT_SECRET`, SMTP) |
| SEC-15 | Logs d'audit complets (qui / quoi / quand) |
| SEC-16 | Détection de comportements anormaux (bruteforce, scraping) |
| SEC-17 | Tests d'intrusion avant mise en production |
| SEC-18 | Politique de mots de passe (≥ 8 caractères, majuscule, chiffre, spécial) |

### 15.3. Conformité

- **RGPD** (si exposition européenne) : voir section 27.
- **Politique de confidentialité** et **CGU** à publier avant lancement.
- **Cookies** : politique stricte, consentement explicite si analytics.

---

## 16. INTÉGRATIONS EXTERNES

| Intégration | Statut V1 | Description | Évolution |
|---|---|---|---|
| **SMTP Gmail (PHPMailer)** | ✅ Opérationnel | Tous les emails transactionnels | Migrer vers SMTP pro (SendGrid, Brevo) |
| **WhatsApp (lien `wa.me`)** | ✅ | Lien pré-rempli pour le support | Intégrer WhatsApp Business API |
| **Mixx By Yas (Togocel)** | ❌ Simulé | Référence générée serveur | API officielle V2 |
| **Flooz (Moov Africa)** | ❌ Simulé | Idem | API officielle V2 |
| **Carte bancaire** | ❌ Simulé | Idem | Stripe / CinetPay / PayDunya V2 |
| **Cash en gare** | ✅ Manuel | Référence à présenter à la caisse | — |
| **SMS** | ❌ | — | Twilio / passerelle locale V2 |
| **Analytics** | ❌ | — | Plausible / Matomo (RGPD-friendly) V2 |

---

## 17. PERFORMANCE & SCALABILITÉ

### 17.1. Optimisations actuelles

- Lazy loading des routes (`React.lazy` + `Suspense`).
- Vue SQL pour agréger les données complexes.
- Index sur clés étrangères et champs de recherche.
- Sanitisation au niveau base.

### 17.2. À mettre en place

- **Cache** Redis sur horaires et trajets (TTL 5 min).
- **Pagination** sur toutes les listes admin.
- **Compression Gzip / Brotli** côté Apache.
- **CDN** pour les assets statiques (images, CSS, JS).
- **Workers / cron** pour les tâches asynchrones (rappels, expiration).
- **Monitoring** : Sentry (erreurs), Plausible (audience), UptimeRobot (uptime).

### 17.3. Scalabilité horizontale

L'API étant stateless (JWT, aucune session serveur), elle peut être scalée horizontalement derrière un load balancer. La base MySQL devra évoluer vers une réplication maître-esclave puis un sharding par région à long terme.

---

## 18. PLAN DE TESTS

### 18.1. Stratégie

| Niveau | Outil(s) | Couverture cible |
|---|---|---|
| Tests unitaires backend | PHPUnit | ≥ 70% |
| Tests unitaires frontend | Vitest / Jest + Testing Library | ≥ 60% |
| Tests d'intégration API | Postman / Newman | 100% endpoints |
| Tests E2E | Playwright / Cypress | Parcours critiques |
| Tests de charge | k6 / JMeter | 1 000 utilisateurs simultanés |

### 18.2. Scénarios critiques

| ID | Scénario | Résultat attendu |
|---|---|---|
| TST-01 | Inscription complète + OTP | Compte créé, JWT retourné |
| TST-02 | Connexion avec mauvais mot de passe | 401 |
| TST-03 | Réservation jusqu'à confirmation paiement | Statut `confirmée`, email envoyé, reçu PDF disponible |
| TST-04 | Réservation expirée non payée | Auto-passage à `annulée` |
| TST-05 | Annulation client puis admin | Email envoyé dans les deux cas |
| TST-06 | Création horaire avec conflit bus | Refus avec détails du conflit |
| TST-07 | Création horaire avec `force=true` | Acceptation, log d'audit |
| TST-08 | Upload fichier > 5 Mo | Refus avec message clair |
| TST-09 | Upload PDF (mauvais type) | Refus |
| TST-10 | Tentative accès admin avec rôle client | 403 |
| TST-11 | Réservation alors que places = 0 | Refus |
| TST-12 | Recherche sans résultats | Message « aucun horaire trouvé » |
| TST-13 | Reset mot de passe expiré | 422 |
| TST-14 | OTP utilisé deux fois | Refus à la 2ᵉ |
| TST-15 | Réservation par utilisateur soft-deleted | Impossible (login bloqué en amont) |

### 18.3. Critères de sortie tests

- 0 bug critique ou bloquant ouvert.
- ≤ 5 bugs majeurs ouverts (avec contournement).
- Couverture de code conforme aux cibles.
- Tous les scénarios critiques en succès.

---

## 19. STRATÉGIE DE DÉPLOIEMENT

### 19.1. Environnements

| Env | URL | Branche | Données |
|---|---|---|---|
| Développement | `http://localhost:5173` | `dev` | Jeu de test |
| Recette | `https://staging.miabetrans.tg` | `staging` | Anonymisée |
| Production | `https://app.miabetrans.tg` | `main` | Réelles |

### 19.2. Pré-requis serveur production

- Linux Ubuntu 22.04 LTS (recommandé) ou Windows Server.
- Apache 2.4 + mod_rewrite + SSL (Let's Encrypt).
- PHP ≥ 8.0 (recommandé) avec extensions `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd`.
- MySQL ≥ 5.7 / MariaDB 10.5+.
- Stockage `/uploads` writable (chmod 755 + propriétaire `www-data`).
- Certificat SSL valide.
- Compte SMTP professionnel.

### 19.3. Procédure de déploiement

1. Build front : `cd frontend && npm install && npm run build`.
2. Copier `frontend/dist` → racine web ou sous-domaine `app.`.
3. Copier `backend` → sous-domaine `api.` (ou racine `/api`).
4. Importer `database/miabetrans.sql` puis migrations OTP et paiement.
5. Configurer `.env` production (DB, JWT_SECRET fort, SMTP).
6. Vérifier permissions `/uploads/chauffeurs`.
7. Tester un scénario complet en production.
8. Activer monitoring (UptimeRobot / Sentry).

### 19.4. Stratégie de rollback

- Sauvegarde BDD avant chaque déploiement.
- Versionnement `git` avec tags par release.
- Possibilité de redéploiement rapide (< 15 min) sur la version précédente.

---

## 20. MAINTENANCE & SUPPORT

### 20.1. Niveaux de service (SLA proposés)

| Sévérité | Description | Temps de prise en charge | Temps de résolution |
|---|---|---|---|
| Critique | Site inaccessible / paiement bloqué | < 1h | < 4h |
| Majeur | Fonctionnalité majeure HS | < 4h | < 24h |
| Mineur | Bug non bloquant | < 1 jour ouvré | < 5 jours ouvrés |
| Évolution | Demande de nouveauté | < 5 jours ouvrés | Selon planning |

### 20.2. Maintenance préventive

- Mises à jour mensuelles (sécurité PHP, npm).
- Vérification des sauvegardes hebdomadaire.
- Revue des logs hebdomadaire.
- Audit de sécurité semestriel.

### 20.3. Maintenance évolutive

- Sprints de 2 semaines.
- Réunion de cadrage mensuelle.
- Roadmap publique partagée avec le client.

### 20.4. Support utilisateur

- WhatsApp Business + email `support@miabetrans.tg`.
- FAQ enrichie en continu.
- Délai de réponse cible : < 4h ouvrés.

---

## 21. MATRICE DES RISQUES

| ID | Risque | Probabilité | Impact | Criticité | Mitigation |
|---|---|---|---|---|---|
| RIS-01 | Compte SMTP Gmail bloqué | Moyenne | Élevé | 🔴 | Migrer vers SendGrid/Brevo, monitorer le taux de bounce |
| RIS-02 | Secret JWT compromis | Faible | Critique | 🔴 | Stocker hors dépôt, rotation trimestrielle |
| RIS-03 | Paiement simulé exploité (faux paiements) | Élevée | Critique | 🔴 | Désactiver simulation en prod, intégrer paiement réel |
| RIS-04 | Bruteforce sur login | Élevée | Élevé | 🔴 | Rate limiting + captcha après 5 tentatives |
| RIS-05 | Pic de trafic non absorbé | Moyenne | Élevé | 🟠 | Cache + CDN, scale horizontal |
| RIS-06 | Perte de données | Faible | Critique | 🔴 | Sauvegardes quotidiennes hors site |
| RIS-07 | Indisponibilité Apache/MySQL | Faible | Élevé | 🟠 | Monitoring + plan de reprise documenté |
| RIS-08 | Adoption faible des chauffeurs | Moyenne | Moyen | 🟡 | Formation, onboarding simple, support dédié |
| RIS-09 | Conflit avec opérateur partenaire | Moyenne | Élevé | 🟠 | Contrat clair, gouvernance définie |
| RIS-10 | Évolution réglementaire transports | Faible | Moyen | 🟡 | Veille juridique semestrielle |
| RIS-11 | Faille XSS / SQLi détectée | Moyenne | Critique | 🔴 | Audit annuel + bug bounty |
| RIS-12 | Dépendance npm vulnérable | Élevée | Moyen | 🟠 | `npm audit` mensuel + Dependabot |

---

## 22. PLANNING & LOTISSEMENT

### 22.1. Lots V1 (déjà livrés)

| Lot | Contenu | Statut |
|---|---|---|
| L1 | Schéma BDD + migrations | ✅ Livré |
| L2 | Authentification + OTP | ✅ Livré |
| L3 | Catalogue + recherche | ✅ Livré |
| L4 | Réservation + simulation paiement | ✅ Livré |
| L5 | Espace administrateur | ✅ Livré |
| L6 | Espace chauffeur | ✅ Livré |
| L7 | Notifications email | ✅ Livré |
| L8 | Pages institutionnelles | ✅ Livré |

### 22.2. Lots V1+ (renforcement avant production)

| Lot | Contenu | Effort estimé |
|---|---|---|
| L9 | Rate limiting + headers sécurité | 2 j |
| L10 | Validation manuelle paiement (admin) | 1 j |
| L11 | Pagination listes admin | 2 j |
| L12 | Export CSV/Excel | 2 j |
| L13 | Tests automatisés (PHPUnit + Vitest) | 5 j |
| L14 | Documentation OpenAPI | 2 j |
| L15 | Configuration HTTPS + monitoring | 2 j |
| **Total V1+** | | **16 j** |

### 22.3. Lots V2 (extension)

| Lot | Contenu | Effort estimé |
|---|---|---|
| L16 | Intégration paiement réel (Mixx By Yas, Flooz) | 10 j |
| L17 | Intégration carte bancaire (CinetPay/PayDunya) | 5 j |
| L18 | Module évaluations (notes + commentaires) | 3 j |
| L19 | Rappels automatiques cron (J-1 / H-1) | 3 j |
| L20 | QR code sur reçu | 1 j |
| L21 | Filtres avancés de recherche | 2 j |
| L22 | Multi-langue (FR/EN) | 5 j |
| L23 | PWA + notifications push | 5 j |
| **Total V2** | | **34 j** |

### 22.4. Lots V3 (long terme)

| Lot | Contenu |
|---|---|
| L24 | App mobile native (React Native ou Flutter) |
| L25 | Multi-opérateurs |
| L26 | Programme de fidélité |
| L27 | Géolocalisation temps réel |
| L28 | Extension UEMOA (Bénin, Burkina, Côte d'Ivoire) |

### 22.5. Diagramme de Gantt simplifié

```
Mois 1    | L9 L10 L11 L12 L13 L14 L15
Mois 2-3  | L16 L17 (paiement réel) + tests pilote
Mois 4    | L18 L19 L20 L21
Mois 5    | L22 L23 + audit sécurité
Mois 6+   | V3
```

---

## 23. BUDGET ESTIMATIF

### 23.1. Coût de développement (V1+ et V2)

| Lot | Effort (j) | TJM (FCFA) | Coût (FCFA) |
|---|---|---|---|
| V1+ (16 j) | 16 | 50 000 | 800 000 |
| V2 (34 j) | 34 | 50 000 | 1 700 000 |
| **Total dev** | **50 j** | | **2 500 000 FCFA** |

> *TJM moyen développeur fullstack indépendant Togo. À ajuster selon prestataire.*

### 23.2. Coûts récurrents annuels

| Poste | Estimation annuelle (FCFA) |
|---|---|
| Hébergement VPS (4 vCPU, 8 Go RAM) | 240 000 |
| Nom de domaine `.tg` | 30 000 |
| Certificat SSL (Let's Encrypt) | 0 |
| SMTP professionnel (Brevo / SendGrid) | 60 000 |
| Monitoring (UptimeRobot, Sentry free) | 0 |
| Sauvegardes externes (S3 / Backblaze) | 60 000 |
| Frais passerelle paiement (commissions) | Variable (1-3% du CA) |
| **Total infra fixe** | **390 000 FCFA / an** |

### 23.3. Coûts de maintenance

- **Forfait mensuel** recommandé : 8h / mois → 200 000 FCFA / mois.
- Inclut : monitoring, mises à jour, support utilisateur, petites évolutions.

### 23.4. Modèle de revenu suggéré

| Modèle | Description | Estimation |
|---|---|---|
| Commission par réservation | 5-8% du prix du billet | 50-80 FCFA / billet |
| Abonnement opérateur | Forfait mensuel par opérateur | 25 000 FCFA / mois |
| Mise en avant horaires | Boost payant | À définir |

---

## 24. LIVRABLES ATTENDUS

### 24.1. Livrables techniques

- Code source complet versionné Git.
- Schéma SQL + scripts de migration.
- Documentation API (OpenAPI/Swagger).
- Documentation technique (architecture, déploiement).
- Documentation utilisateur (admin, chauffeur, voyageur).
- Jeu de tests automatisés.
- Fichier `.env.example`.

### 24.2. Livrables fonctionnels

- Site web déployé en production.
- Comptes admin initialisés.
- Données de référence chargées (villes, trajets, bus, chauffeurs).
- Templates email validés.
- Reçus PDF testés.

### 24.3. Livrables documentaires

- Présent cahier des charges.
- Procès-verbaux de recette.
- Manuel administrateur.
- Manuel chauffeur.
- FAQ voyageur.
- Politique de confidentialité, CGU, mentions légales.

---

## 25. CRITÈRES D'ACCEPTATION

La V1 est validée si :

1. ✅ Un visiteur peut s'inscrire, vérifier son email par OTP, se connecter, rechercher un trajet, réserver, simuler un paiement, valider et télécharger son reçu — sans erreur.
2. ✅ Un chauffeur peut consulter ses trajets affectés et la liste de ses passagers.
3. ✅ Un administrateur peut gérer villes, trajets, bus, chauffeurs et créer des horaires sans pouvoir provoquer de double assignation involontaire.
4. ✅ Tous les emails transactionnels sont effectivement envoyés.
5. ✅ Aucune route protégée n'est accessible sans JWT valide et rôle adéquat.
6. ✅ Le schéma SQL et les migrations s'exécutent sans erreur sur une base vierge.
7. ✅ La couverture de tests automatisés atteint les cibles définies.
8. ✅ L'audit de sécurité ne révèle aucune vulnérabilité critique.
9. ✅ Les pages se chargent en moins de 3 s sur 4G.
10. ✅ Les documents légaux (CGU, confidentialité) sont publiés.

---

## 26. ÉVOLUTIONS FUTURES (V2 / V3)

### 26.1. V2 — Production-ready (mois 1-5)

- Intégration des paiements réels.
- Module d'évaluation post-trajet.
- Rappels automatiques.
- Export et reporting avancé.
- Multi-langue.
- PWA + notifications push.
- Validation manuelle des paiements cash par l'admin.

### 26.2. V3 — Plateforme régionale (mois 6+)

- App mobile native.
- Multi-opérateurs (chaque transporteur a son back-office).
- Programme de fidélité.
- Géolocalisation temps réel des bus.
- Extension à l'UEMOA.
- API publique pour partenaires (agrégateurs, État).
- Analytics avancées (data mobilité).

---

## 27. CONTRAINTES LÉGALES & RGPD

### 27.1. Données personnelles collectées

| Donnée | Finalité | Base légale | Durée de conservation |
|---|---|---|---|
| Nom, prénom | Identification | Exécution du contrat | Compte actif + 3 ans |
| Email | Authentification, communication | Exécution du contrat | Compte actif + 3 ans |
| Téléphone | Contact, support | Intérêt légitime | Compte actif + 3 ans |
| Mot de passe (haché) | Authentification | Exécution du contrat | Compte actif |
| Photo profil et CNI (chauffeurs) | Identification professionnelle | Obligation contractuelle | Durée du contrat + 5 ans |
| Historique réservations | Service rendu, comptabilité | Exécution du contrat + obligation légale | 10 ans (comptable) |
| Logs de connexion | Sécurité | Intérêt légitime | 1 an |

### 27.2. Droits des utilisateurs

- Droit d'accès, de rectification, d'effacement.
- Droit à la portabilité.
- Droit d'opposition.
- Procédure : demande à `dpo@miabetrans.tg`, traitement < 30 jours.

### 27.3. Documents à publier

- Politique de confidentialité.
- Conditions Générales d'Utilisation.
- Conditions Générales de Vente.
- Mentions légales.
- Politique de cookies.

### 27.4. Contraintes locales (Togo)

- Conformité à la **loi n°2019-014 relative à la protection des données à caractère personnel** au Togo.
- Déclaration éventuelle auprès de l'**Instance de Protection des Données Personnelles (IPDCP)**.

---

## 28. ANNEXES

### 28.1. Configuration `.env` type

```dotenv
# Base de données
DB_HOST=localhost
DB_NAME=miabetrans_db
DB_USER=miabetrans_user
DB_PASS=

# JWT
JWT_SECRET=
JWT_EXPIRATION=86400

# Application
APP_ENV=production
APP_URL=https://api.miabetrans.tg

# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=MiabeTrans

# Externe
WHATSAPP_NUM=
```

### 28.2. Scripts SQL fournis

- `backend/database/miabetrans.sql` — schéma initial complet.
- `backend/database/migration_otp.sql` — table OTP + champ `email_verifie`.
- `backend/database/migration_paiement_requis.sql` — colonnes paiement enrichies.

### 28.3. Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@miabetrans.tg` | `Admin@123` |
| Client | `komi.mensah@gmail.com` | (à initialiser) |
| Client | `ama.dzifa@gmail.com` | (à initialiser) |
| Chauffeur | `kofi.chauffeur@miabetrans.tg` | (à initialiser) |
| Chauffeur | `yao.chauffeur@miabetrans.tg` | (à initialiser) |

### 28.4. Référentiel des modes de paiement

| Mode | Délai d'expiration | Process |
|---|---|---|
| Mixx By Yas | 30 min | `*144#` Togocel + référence MiabeTrans |
| Flooz | 30 min | `*155#` Moov + référence MiabeTrans |
| Carte Bancaire | 20 min | Saisie en ligne (simulée V1) |
| Cash | 45 min | Référence à présenter à la caisse |

### 28.5. Templates email (8)

1. Confirmation d'inscription (OTP).
2. Réinitialisation de mot de passe.
3. Confirmation de réservation.
4. Annulation de réservation (par client).
5. Annulation de réservation (par admin, avec raison).
6. Simulation de paiement (référence à utiliser).
7. Confirmation de paiement.
8. Notification d'assignation chauffeur.

### 28.6. Liste des trajets pré-configurés

| Départ | Arrivée | Distance (km) | Prix (FCFA) |
|---|---|---|---|
| Lomé | Kpalimé | 120 | 2 500 |
| Lomé | Atakpamé | 165 | 3 500 |
| Lomé | Sokodé | 340 | 5 500 |
| Lomé | Kara | 420 | 7 000 |
| Lomé | Dapaong | 634 | 9 000 |
| (et leurs trajets retours bidirectionnels) | | | |

---

## 29. GLOSSAIRE

| Terme | Définition |
|---|---|
| **API** | Application Programming Interface — interface de programmation. |
| **Bcrypt** | Algorithme de hachage de mots de passe résistant. |
| **Bus** | Véhicule effectuant un trajet, avec une capacité fixe. |
| **CDN** | Content Delivery Network — réseau de distribution de contenu. |
| **Chauffeur** | Conducteur affecté à un bus, possédant un compte plateforme. |
| **CRUD** | Create / Read / Update / Delete — opérations de base sur une donnée. |
| **CORS** | Cross-Origin Resource Sharing — politique d'accès cross-domain. |
| **CSP** | Content Security Policy — en-tête HTTP de sécurité. |
| **FCFA** | Franc CFA (XOF), monnaie de l'UEMOA. |
| **Flooz** | Service mobile money de Moov Africa Togo. |
| **HSTS** | HTTP Strict Transport Security — force HTTPS. |
| **Horaire** | Instance d'un trajet à une date/heure donnée, attaché à un bus. |
| **JWT** | JSON Web Token — jeton d'authentification signé. |
| **Mixx By Yas** | Service mobile money de Togocel (anciennement T-Money). |
| **OTP** | One-Time Password — code à usage unique. |
| **PWA** | Progressive Web App — application web installable. |
| **REST** | REpresentational State Transfer — style d'architecture d'API. |
| **RGPD** | Règlement Général sur la Protection des Données (UE). |
| **Soft delete** | Suppression logique (ligne marquée `deleted_at`, conservée). |
| **SPA** | Single Page Application — application web mono-page. |
| **SLA** | Service Level Agreement — niveau de service contractuel. |
| **TJM** | Taux Journalier Moyen — facturation à la journée. |
| **Trajet** | Itinéraire (ville départ → ville arrivée) avec un prix. |
| **UEMOA** | Union Économique et Monétaire Ouest-Africaine. |

---

## 30. VALIDATION & SIGNATURES

| Rôle | Nom | Date | Signature |
|---|---|---|---|
| Maîtrise d'ouvrage (client) | | | |
| Maîtrise d'œuvre (développeur) | Ephraïm NATO | 2026-05-01 | |
| Responsable technique | | | |
| Responsable qualité | | | |

---

**Document de référence — Toute modification fait l'objet d'un avenant numéroté et signé.**

*Fin du cahier des charges — version 2.0 — 2026-05-01.*
