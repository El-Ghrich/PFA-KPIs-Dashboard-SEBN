# HCM-S CIM3 KPI Reporting Dashboard 

<div align="center">

![Status](https://img.shields.io/badge/status-development-yellow)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![License](https://img.shields.io/badge/license-MIT-purple)

**Modern KPI Reporting System for SEBN-MA Industrial Project**

</div>

---

## 📖 Contexte du Projet

Ce projet a été développé dans le cadre d'un **Projet de Fin d'Année (PFA)** pour l'entreprise **SEBN-MA**. Il vise à moderniser le système de reporting des KPI (Output, Scrap, OEE, Downtime) pour le projet HCM-S CIM3.

L'objectif principal est d'effectuer une transition d'un outil interne basé sur des macros Excel vers une application Web sécurisée, automatisée et découplée, facilitant la centralisation des données, l'analyse temporelle et la visualisation.

### 🎯 Objectifs Stratégiques

- **Centralisation** des données de production
- **Automatisation** du processus de reporting
- **Sécurisation** des accès et des données
- **Visualisation** interactive et temps réel
- **Traçabilité** des événements et preuves

---

## ✨ Fonctionnalités Principales

### 📈 Suivi des KPI
- Visualisation dynamique des métriques clés:
  - **Output** - Production réelle
  - **Scrap** - Taux de rebut
  - **OEE** - Overall Equipment Effectiveness
  - **Downtime** - Temps d'arrêt
- Filtrage temporel avancé (jour, semaine, mois, personnalisé)
- Graphiques interactifs et exportables

### 📝 Gestion des Faits Marquants (Highlights)
- Journalisation des événements qualitatifs liés à la production
- Catégorisation des événements (maintenance, qualité, organisation)
- Historique complet avec horodatage

### 📎 Stockage de Preuves (Object Storage)
- Upload sécurisé de documents (PDF, Images)
- Association directe aux KPI et faits marquants
- Intégration avec **MinIO** (compatible S3)

### 🔐 Sécurité JWT
- Système d'authentification robuste
- Gestion des rôles:
  - **Admin**: Accès complet
  - **Viewer**: Consultation uniquement
- Tokens d'accès et de rafraîchissement

### 🤖 Ingestion Automatisée (Phase 2)
- API prête à recevoir des payloads JSON
- Intégration directe depuis la macro Excel
- Alimentation autonome de la base de données

---

## 🛠️ Stack Technique

### Backend
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **Python** | 3.11+ | Langage principal |
| **FastAPI** | 0.100+ | Framework Web |
| **SQLAlchemy** | 2.0+ | ORM |
| **Pydantic** | 2.0+ | Validation des données |
| **Alembic** | - | Migrations DB |
| **pytest** | - | Tests unitaires |
| **uv** | - | Gestionnaire de paquets |

### Frontend
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **React.js** | 18.x | Framework UI |
| **Vite** | 4.x | Build tool |
| **Tailwind CSS** | 3.x | Styling |
| **React Query** | - | Gestion d'état |
| **Chart.js** | - | Visualisation |

### Infrastructure
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **PostgreSQL** | 15+ | Base de données |
| **MinIO** | Latest | Object storage |
| **Docker** | 24+ | Conteneurisation |
| **Docker Compose** | 2.x | Orchestration |

---

## 📂 Architecture du Projet

Le projet suit une architecture **Monorepo** contenant le Frontend et le Backend.

### Architecture Globale
kpi-dashboard-sebn/
├── Backend/ # Application Serveur (FastAPI)
├── Frontend/ # Application Client (React)
├── docker-compose.yml # Configuration des conteneurs
├── .gitignore
└── README.md



### 🧠 Architecture Backend (Domain-Driven Design)

Le backend utilise une architecture modulaire séparant les routes (API) de la logique métier (Domains), optimisée pour FastAPI.



### 🎨 Architecture Frontend


---

## 🗄️ Modèle de Données

### Schéma en Étoile (Star Schema)
[Diagramme MLD](./assets/MLD.png)



---

## 🚀 Installation & Lancement

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Étape 1 : Cloner le dépôt

```bash
git clone https://github.com/El-Ghrich/PFA-KPIs-Dashboard-SEBN.git
```

### Étape 2 : Configuration du Backend
```bash
cd Backend

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec les identifiants de base de données et MinIO
```

### Étape 3 : Lancer les services

```bash
# Construire et lancer tous les services
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

<!-- ## 🔐 Sécurité
### Bonnes Pratiques Implémentées
✅ JWT Authentication avec tokens d'accès et de rafraîchissement

✅ Hachage des mots de passe avec bcrypt (passlib)

✅ CORS configuré pour la communication frontend/backend

✅ Validation des entrées avec Pydantic

✅ Protection contre les attaques (SQL injection, XSS, CSRF)

✅ Variables d'environnement pour les secrets

✅ Logging des actions utilisateur

✅ Rate Limiting (en Phase 3)

Rôles et Permissions
Rôle	Permissions
Admin	Lecture, écriture, suppression, gestion utilisateurs
Viewer	Lecture uniquement

📚 Documentation
Documentation FastAPI

Documentation React

Documentation uv

Documentation PostgreSQL

Documentation MinIO

📄 License
Ce projet est développé dans le cadre du Projet de Fin d'Année (PFA) 2026 pour SEBN-MA et ENSA Tanger.

<div align="center">
Développé avec ❤️ par l'équipe PFA - ENSA Tanger 2026

Report an Issue · Request Feature · View Documentation

</div> ``` -->