# MiabeTrans - Application web interurbaine (Structure du projet)

**Projet de fin d'étude :** Étude et proposition d'une application web pour une agence de voyage interurbain — *Cas : MiabeTrans*

**Auteur :** NATO Komi EphraïM
**Encadrant :** M. AKANATE Alassani
**Établissement :** FORMATEC - Licence Professionnelle en Informatique
**Année :** 2025

---

## Description du projet
MiabeTrans est une application web destinée à gérer les trajets et les réservations pour une agence de transport interurbain. Cette arborescence contient la structure complète du projet (frontend, backend, base de données, documentation et tests) sous forme de fichiers et dossiers placeholder, prêts à être remplis lors du développement.

## Contenu du dépôt
Ce dépôt contient les éléments suivants :

- **backend/** : code serveur, API REST, contrôleurs, modèles, middlewares et utilitaires.
  - `api/routes/` : points d'entrée API (auth, trajets, réservations, chauffeurs, utilisateurs, notifications).
  - `controllers/` : logique métier (TrajetController, ReservationController, ...).
  - `models/` : représentations des entités (Trajet, Reservation, Utilisateur, Chauffeur, Notification).
  - `middlewares/` : gestion des accès, rôles et CSRF.
  - `config/` : paramètres de connexion (base de données, application).
  - `utils/` : helpers, validateurs et gestionnaire de réponses.
  - `tests/` : tests unitaires et d'intégration côté backend.
  - `logs/`, `storage/` : fichiers temporaires et uploads.

- **database/** : schéma SQL, migrations et jeux de données (seeds) pour initialiser la base MySQL.
  - `miabetrans.sql` : dump initial (placeholder).
  - `migrations/` et `seeds/` : scripts de création et population.

- **frontend/** : interface utilisateur (SPA ou pages statiques selon implémentation).
  - `public/` : index.html, favicon, manifest.
  - `assets/` : images, icônes et vidéos.
  - `components/` : composants réutilisables (Navbar, Footer, Forms, Cards, Alerts).
  - `pages/` : pages principales (Accueil, Trajets, Reservations, Utilisateurs, Admin, Chauffeurs, Aide, Erreurs).
  - `styles/` : fichiers CSS (main, dashboard, responsive).
  - `js/` : scripts frontaux (app.js, api.js, maps, notifications, etc.).
  - `package.json`, `vite.config.js` : configuration du projet frontend.

- **scripts/** : scripts d'automatisation (seed, backup, déploiement, tests).

- **documentation/** : cahier des charges, diagrammes UML, maquettes Figma, présentation de soutenance et mémoire final.
  - `Diagrammes_UML/` : Cas d'utilisation, classes, séquences, activités et déploiement.
  - `Maquettes_Figma/` : fichiers Figma pour maquettes d'écrans.
  - `Présentation_PowerPoint/` : slides de soutenance.
  - `Memoire_MiabeTrans.docx` : copie du mémoire.

- **tests/** : répertoire contenant les tests fonctionnels, de performance, de sécurité et d'accessibilité.

---

## Instructions rapides
1. Décompressez le fichier ZIP dans votre environnement de développement.
2. Implémentez le backend dans `backend/` (Laravel ou équivalent) et configurez la base de données.
3. Implémentez le frontend dans `frontend/` (React, Vue ou simple pages HTML).
4. Ajoutez les scripts de migration dans `database/migrations/` et exécutez-les pour créer les tables.
5. Remplissez `documentation/` avec vos diagrammes finaux et maquettes.
6. Utilisez `scripts/` pour automatiser les tâches (seedDatabase, backup, deploy).

---

## Contact
**Auteur :** NATO Komi EphraïM
**Établissement :** FORMATEC

# 🚌 MiabeTrans - Plateforme de Réservation de Voyages Interurbains

**Application web moderne pour la gestion et la réservation de trajets interurbains au Togo**

---

## 📋 Table des Matières

- [🎯 Aperçu](#-aperçu)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🚀 Installation](#-installation)
- [📁 Structure du Projet](#-structure-du-projet)
- [🔧 Configuration](#-configuration)
- [🎨 Design et Inspiration](#-design-et-inspiration)
- [📊 Base de Données](#-base-de-données)
- [🔐 Sécurité](#-sécurité)
- [🧪 Tests](#-tests)
- [📦 Déploiement](#-déploiement)
- [🤝 Contribution](#-contribution)
- [📄 Licence](#-licence)

---

## 🎯 Aperçu

MiabeTrans est une application web complète développée dans le cadre d'un mémoire de licence professionnelle. La plateforme permet aux utilisateurs de rechercher, réserver et gérer leurs trajets interurbains au Togo, tandis que les administrateurs et chauffeurs disposent d'interfaces dédiées pour la gestion des opérations.

### Objectifs du Projet
- ✅ Digitaliser le processus de réservation des voyages interurbains
- ✅ Améliorer l'expérience utilisateur avec une interface moderne
- ✅ Automatiser la gestion des trajets et des réservations
- ✅ Fournir des outils de gestion aux administrateurs et chauffeurs
- ✅ Garantir la sécurité et la fiabilité du système

---

## ✨ Fonctionnalités

### 👥 Pour les Voyageurs
- 🔍 **Recherche avancée** de trajets avec filtres multiples
- 🎫 **Réservation en ligne** avec sélection des places
- 👤 **Gestion de compte** avec historique des réservations
- 📱 **Interface responsive** compatible mobile/desktop
- 🔔 **Notifications** en temps réel
- 💰 **Multiples moyens de paiement** (Espèces, Flooz, T-Money)

### 🛠️ Pour les Administrateurs
- 📊 **Tableau de bord** avec statistiques en temps réel
- 🚌 **Gestion complète** des trajets, chauffeurs et véhicules
- 👥 **Administration** des utilisateurs et des rôles
- 📈 **Rapports détaillés** et analyses de performance
- 📢 **Système de notifications** et d'alertes

### 🚗 Pour les Chauffeurs
- 📋 **Vue des trajets assignés** avec détails complets
- ⚠️ **Signalement de problèmes** en temps réel
- 📱 **Interface mobile-first** optimisée
- 🔄 **Mise à jour automatique** des statuts de trajet

---

## 🏗️ Architecture

### Stack Technologique
| Couche | Technologies |
|--------|--------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Responsive Design |
| **Backend** | PHP 8+, MySQL, Architecture REST API |
| **Style** | CSS Custom Properties, Grid, Flexbox |
| **Sécurité** | JWT, Sanitization, Validation, CORS |
| **Outils** | Git, VS Code, Draw.io (UML) |

### Pattern Architectural
- **MVC (Modèle-Vue-Contrôleur)** pour une séparation claire des responsabilités
- **API RESTful** pour les communications client-serveur
- **Responsive Design** avec approche mobile-first
- **Architecture modulaire** pour une maintenance facilitée

---

## 🚀 Installation

### Prérequis
- PHP 8.0+
- MySQL 8.0+
- Apache/Nginx
- Git

### Installation Rapide

1. **Cloner le repository**
```bash
git clone https://github.com/username/miabetrans.git
cd miabetrans
