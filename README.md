# GGV App

Une application web progressive (PWA) communautaire moderne construite avec React, TanStack Router, et Supabase. L'application offre une plateforme interactive avec carte géographique, messagerie en temps réel, forum communautaire, marketplace, et bien plus.

## ✨ Fonctionnalités

- 🗺️ **Carte interactive** - Visualisation géographique avec MapLibre GL
- 💬 **Messagerie en temps réel** - Communication instantanée entre utilisateurs
- 🏪 **Marketplace** - Plateforme d'échange et de commerce
- 💼 **Annuaire d'entreprises** - Répertoire des services locaux
- 🎮 **Section Jeux** - Divertissement communautaire
- 🌤️ **Météo** - Informations météorologiques
- 👥 **Profils utilisateurs** - Gestion des comptes et présence en ligne
- 🪙 **Système de coins** - Économie virtuelle intégrée
- 📱 **PWA** - Installation sur mobile et desktop

## 🛠️ Stack Technique

- **Frontend**: React 19 + TypeScript
- **Routing**: TanStack Router (file-based)
- **State Management**: TanStack Query v5 + React Query (architecture unifiée)
- **Backend**: Supabase (Auth, Database, Realtime)
- **Cartes**: MapLibre GL
- **Build Tool**: Vite
- **Styling**: CSS pur (pas de framework CSS)
- **Linting/Formatting**: Biome
- **Testing**: Vitest + Testing Library
- **PWA**: Vite PWA Plugin

### 🏗️ Architecture des Hooks (v2.0)

L'application utilise une architecture de hooks unifiée et optimisée :

#### Structure des Hooks
```
src/hooks/
├── core/              # Hooks génériques et utilitaires de base
│   ├── useGenericCRUD.ts    # CRUD générique pour toutes les entités
│   ├── useGenericQuery.ts   # Requêtes génériques optimisées
│   ├── useMutationHooks.ts  # Mutations avec gestion d'erreurs
│   └── useOptimistic.ts     # Updates optimistes
├── entities/          # Hooks spécialisés par domaine
│   ├── useAuth.ts          # Authentification et profils
│   ├── useProfiles.ts      # Gestion des profils utilisateurs
│   ├── useBusinesses.ts    # Annuaire d'entreprises
│   ├── useServices.ts      # Services et catégories
│   ├── useMessaging.ts     # Messagerie temps réel
│   ├── useLocations.ts     # Géolocalisation et lieux
│   ├── usePresence.ts      # Présence utilisateurs
│   └── useMarketplace.ts   # Marketplace et échanges
├── utility/           # Hooks utilitaires transversaux
│   ├── useDataPrioritization.ts  # Priorisation des données
│   ├── useFieldSelection.ts      # Sélection de champs
│   ├── useCacheIntegration.ts    # Intégration cache avancée
│   ├── useOnboarding.ts          # Flux d'onboarding
│   └── useUserData.ts            # Données utilisateur consolidées
└── utils/             # Utilitaires partagés
    ├── errorHandling.ts    # Gestion centralisée des erreurs
    ├── queryConfig.ts      # Configuration des requêtes
    └── queryKeys.ts        # Clés de cache normalisées
```

#### Fonctionnalités Clés
- **API Unifiée**: Chaque hook suit la même structure et patterns
- **Performance Optimisée**: Cache intelligent avec ~81% de réduction de bundle
- **Type Safety**: Types TypeScript complets pour toutes les entités
- **Temps Réel**: Intégration Supabase Realtime optimisée
- **Gestion d'Erreurs**: Stratégie centralisée de retry et fallback
- **Tests Complets**: 84 tests passant avec couverture complète

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd ggvapp

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase
```

### Variables d'environnement

Créez un fichier `.env` avec :

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Développement

```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera disponible sur http://localhost:3000
```

## 📦 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run serve        # Prévisualiser le build
npm run test         # Lancer les tests
npm run lint         # Linter le code
npm run format       # Formater le code
npm run check        # Vérification complète (lint + format)
```

## 🏗️ Architecture du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── Map.tsx         # Composant carte interactive
│   ├── Header.tsx      # Navigation principale
│   ├── Avatar.tsx      # Gestion des avatars
│   └── ...
├── hooks/              # Architecture de hooks unifiée v2.0
│   ├── core/           # Hooks génériques de base
│   ├── entities/       # Hooks par domaine métier
│   ├── utility/        # Hooks utilitaires transversaux
│   └── utils/          # Utilitaires partagés
├── lib/                # Utilitaires et intégrations
│   ├── supabase.ts     # Client Supabase configuré
│   ├── queryCacheIntegration.ts # Cache avancé
│   ├── dataPrioritization.ts    # Priorisation des données
│   └── ...
├── providers/          # Providers React
│   ├── QueryClientProvider.tsx # Provider TanStack Query optimisé
│   └── AuthProvider.tsx         # Authentification
├── routes/             # Routes TanStack Router
│   ├── index.tsx       # Carte interactive (accueil)
│   ├── auth.tsx        # Authentification
│   ├── profile.tsx     # Gestion du profil
│   ├── messages.tsx    # Messagerie temps réel
│   ├── marketplace.tsx # Marketplace communautaire
│   └── ...
├── types/              # Types TypeScript
│   └── database.ts     # Types générés Supabase
└── assets/             # Ressources statiques
```

## 🔧 Fonctionnalités Techniques

### Authentification
- Authentification Supabase avec UI components
- Gestion des sessions et protection des routes
- Profils utilisateurs avec avatars

### Temps Réel
- Synchronisation en temps réel via Supabase Realtime
- Présence utilisateur (en ligne/hors ligne)
- Mises à jour optimistes

### PWA
- Installation sur appareils mobiles et desktop
- Cache intelligent des ressources
- Fonctionnement hors ligne partiel
- Notifications push (à venir)

### Performance
- **Architecture optimisée**: Hooks unifiés avec ~81% de réduction du bundle
- **Cache intelligent**: Persistence localStorage avec gestion de version
- **Requêtes optimisées**: TanStack Query v5 avec retry intelligent
- **Code splitting**: Lazy loading automatique des routes
- **Monitoring temps réel**: Métriques de performance en développement
- **Cache des tuiles**: Optimisation des cartes MapLibre GL

## 🗺️ Routes Principales

- `/` - Carte interactive (accueil)
- `/auth` - Authentification
- `/profile` - Profil utilisateur
- `/messages` - Messagerie
- `/forum` - Forum communautaire
- `/marketplace` - Marketplace
- `/businesses` - Annuaire d'entreprises
- `/services` - Services
- `/games` - Jeux
- `/weather` - Météo
- `/coins` - Gestion des coins

## 🔒 Sécurité

- Variables d'environnement pour les clés sensibles
- Authentification sécurisée via Supabase
- Validation des données côté client et serveur
- Protection CSRF intégrée

## 🧪 Tests

```bash
# Lancer tous les tests
npm run test

# Tests en mode watch
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

## 📱 PWA Installation

L'application peut être installée comme une app native :

1. Ouvrir l'app dans un navigateur compatible
2. Cliquer sur "Installer l'application" dans la barre d'adresse
3. Ou utiliser le menu "Ajouter à l'écran d'accueil" sur mobile

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation Supabase
- Vérifier les logs de développement dans la console
