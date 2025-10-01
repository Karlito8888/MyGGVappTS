# Implementation Plan

- [x] 1. Consolidation des Selectors et Utilitaires
  - [x] Fusionner src/lib/fieldSelectors.ts avec src/hooks/utils/selectors.ts
  - [x] Supprimer les selectors legacy dupliqués
  - [x] Tester que tous les selectors fonctionnent correctement
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Migration et Simplification de useAuth
  - [x] 2.1 Créer src/hooks/entities/useAuth.ts
    - Migrer le code depuis src/hooks/refactored/useAuthRefactored.ts
    - Simplifier l'API en gardant la compatibilité
    - Intégrer la gestion des profiles directement
    - _Requirements: 1.2, 2.1, 4.2_

  - [x] 2.2 Simplifier AuthProvider.tsx
    - Remplacer l'implémentation par le nouveau useAuth
    - Supprimer la logique dupliquée
    - Maintenir la compatibilité avec les composants existants
    - _Requirements: 1.2, 5.2_

  - [x] 2.3 Tester la migration auth
    - Créer des tests de compatibilité API
    - Vérifier que tous les composants fonctionnent
    - Tester les flows d'authentification
    - _Requirements: 6.2, 6.3_

- [x] 3. Nettoyage et Réorganisation des Exports
  - [x] 3.1 Simplifier src/hooks/index.ts
    - Réorganiser les exports par catégorie logique
    - Supprimer les références aux hooks legacy
    - Créer des exports groupés pour faciliter l'usage
    - _Requirements: 1.2, 3.1, 3.3_

  - [x] 3.2 Créer le dossier entities/
    - Créer la structure src/hooks/entities/
    - Préparer les fichiers pour les migrations suivantes
    - Mettre à jour les imports dans index.ts
    - _Requirements: 3.1, 3.2_

- [x] 4. Migration des Hooks Profiles
  - [x] 4.1 Créer src/hooks/entities/useProfiles.ts
    - Migrer depuis src/hooks/refactored/useProfilesRefactored.ts
    - Intégrer les query functions depuis src/lib/queryFunctions.ts
    - Simplifier l'API en gardant toutes les fonctionnalités
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 4.2 Tester la migration profiles
    - Créer des tests unitaires pour le nouveau hook
    - Vérifier la compatibilité avec les composants existants
    - Tester les opérations CRUD sur les profiles
    - _Requirements: 6.1, 6.2_

- [x] 5. Migration des Hooks Services
  - [x] 5.1 Créer src/hooks/entities/useServices.ts
    - Migrer depuis src/hooks/refactored/useServicesRefactored.ts
    - Intégrer les query functions correspondantes
    - Consolider avec useServiceCategories si pertinent
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 5.2 Tester la migration services
    - Créer des tests pour les opérations services
    - Vérifier l'intégration avec les catégories
    - Tester les mutations et invalidations
    - _Requirements: 6.1, 6.2_

- [x] 6. Migration des Hooks Businesses
  - [x] 6.1 Créer src/hooks/entities/useBusinesses.ts
    - Migrer depuis src/hooks/refactored/useBusinessesRefactored.ts
    - Consolider les hooks inside/outside en un seul
    - Intégrer les query functions correspondantes
    - Simplifier l'API pour les deux types de business
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 6.2 Tester la migration businesses
    - Créer des tests pour les deux types de business
    - Vérifier les opérations CRUD
    - Tester les requêtes par utilisateur
    - _Requirements: 6.1, 6.2_

- [x] 7. Migration des Hooks Messaging
  - [x] 7.1 Créer src/hooks/entities/useMessaging.ts
    - Migrer depuis src/hooks/refactored/useMessagingRefactored.ts
    - Intégrer les fonctions depuis src/hooks/legacy/useMessagesHeaders.ts
    - Consolider chats, messages et headers en une API cohérente
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 7.2 Tester la migration messaging
    - Créer des tests pour les conversations
    - Tester les messages en temps réel
    - Vérifier les notifications et cleanup
    - _Requirements: 6.1, 6.2_

- [x] 8. Migration des Hooks Locations
  - [x] 8.1 Créer src/hooks/entities/useLocations.ts
    - Migrer depuis src/hooks/refactored/useLocationsRefactored.ts
    - Intégrer la géolocalisation et les associations
    - Consolider les requests d'association
    - _Requirements: 1.1, 2.1, 4.1_

  - [x] 8.2 Tester la migration locations
    - Créer des tests pour la géolocalisation
    - Tester les associations de lieux
    - Vérifier les requêtes nearby
    - _Requirements: 6.1, 6.2_

- [x] 9. Migration des Hooks Presence
  - [x] 9.1 Créer src/hooks/entities/usePresence.ts
    - Migrer depuis src/hooks/refactored/usePresenceRefactored.ts
    - Optimiser pour les updates temps réel
    - Intégrer avec le système de cache
    - _Requirements: 1.1, 2.1, 4.2_

  - [x] 9.2 Tester la migration presence
    - Créer des tests pour la présence temps réel
    - Tester les updates optimistes
    - Vérifier la gestion des connexions
    - _Requirements: 6.1, 6.2_

- [x] 10. Migration du Hook Marketplace
   - [x] 10.1 Créer src/hooks/entities/useMarketplace.ts
     - Migrer depuis src/hooks/legacy/useMarketplace.ts
     - Moderniser avec le système générique CRUD
     - Intégrer les query functions marketplace
     - _Requirements: 1.1, 2.1, 4.1_

   - [x] 10.2 Tester la migration marketplace
     - Créer des tests pour les listings
     - Tester les opérations CRUD
     - Vérifier les requêtes par utilisateur
     - _Requirements: 6.1, 6.2_

 - [x] 11. Nettoyage Final et Suppression du Code Legacy
   - [x] 11.1 Supprimer les dossiers obsolètes
     - Supprimer src/hooks/legacy/ entièrement
     - Supprimer src/hooks/refactored/ entièrement
     - Supprimer src/hooks/configs/ entièrement
     - Supprimer src/hooks/specialized/ (vide)
     - _Requirements: 5.1, 5.3_

   - [x] 11.2 Nettoyer les fichiers lib/
     - Supprimer src/lib/queryFunctions.ts (intégré dans entities)
     - Fusionner src/lib/fieldSelectors.ts avec utils/selectors.ts
     - Vérifier que tous les imports sont mis à jour
     - _Requirements: 2.2, 5.1_

   - [x] 11.3 Simplifier useUserData.ts
     - Refactoriser pour utiliser les nouveaux hooks entities
     - Supprimer les références aux hooks legacy
     - Optimiser les requêtes groupées
     - _Requirements: 1.1, 4.1_

- [x] 12. Optimisation Finale et Documentation
  - [x] 12.1 Optimiser QueryClientProvider.tsx
    - Simplifier la configuration avec les nouveaux hooks
    - Optimiser les imports et la taille du bundle
    - Vérifier les performances de cache
    - _Requirements: 4.1, 4.2, 5.1_

  - [x] 12.2 Tests d'intégration complets
    - Créer des tests end-to-end pour tous les hooks
    - Vérifier les performances et la taille du bundle
    - Tester la compatibilité avec tous les composants
    - _Requirements: 6.1, 6.2, 6.3_

   - [x] 12.3 Mise à jour de la documentation
     - Documenter la nouvelle architecture dans README
     - Créer un guide de migration pour les développeurs
     - Mettre à jour les exemples d'usage
     - _Requirements: 6.3_