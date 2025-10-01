# Design Document

## Overview

Cette refactorisation vise à transformer l'architecture actuelle des hooks d'un système hybride legacy/refactored vers une architecture unifiée, moderne et performante. Le design se base sur les meilleures pratiques TanStack Query v5 et élimine la complexité inutile tout en préservant toutes les fonctionnalités existantes.

## Architecture

### Structure Cible Finale

```
src/
├── hooks/
│   ├── core/                    # Hooks génériques réutilisables
│   │   ├── useGenericCRUD.ts   # ✅ Conservé - excellent design
│   │   ├── useGenericQuery.ts  # ✅ Conservé - excellent design  
│   │   ├── useMutationHooks.ts # ✅ Conservé
│   │   └── useOptimistic.ts    # ✅ Conservé
│   ├── entities/               # Hooks spécifiques par entité
│   │   ├── useAuth.ts          # Migré depuis useAuthRefactored
│   │   ├── useBusinesses.ts    # Migré depuis useBusinessesRefactored
│   │   ├── useServices.ts      # Migré depuis useServicesRefactored
│   │   ├── useMessaging.ts     # Migré depuis useMessagingRefactored
│   │   ├── useProfiles.ts      # Migré depuis useProfilesRefactored
│   │   ├── useLocations.ts     # Migré depuis useLocationsRefactored
│   │   ├── usePresence.ts      # Migré depuis usePresenceRefactored
│   │   └── useMarketplace.ts   # Migré depuis legacy
│   ├── utils/                  # Utilitaires partagés
│   │   ├── queryKeys.ts        # ✅ Conservé - bien conçu
│   │   ├── queryConfig.ts      # ✅ Conservé - bien conçu
│   │   ├── errorHandling.ts    # ✅ Conservé
│   │   └── selectors.ts        # ✅ Conservé
│   ├── utility/                # Hooks utilitaires
│   │   ├── useMinLoadingTime.ts
│   │   ├── useDraggable.ts
│   │   ├── useFieldSelection.ts
│   │   ├── useDataPrioritization.ts
│   │   ├── useCacheIntegration.ts
│   │   ├── useOnboarding.ts
│   │   └── useUserData.ts      # ⚠️ À simplifier
│   └── index.ts                # Exports organisés et simplifiés
├── lib/
│   ├── supabase.ts             # ✅ Conservé
│   ├── queryFunctions.ts       # ⚠️ À intégrer dans entities/
│   ├── fieldSelectors.ts       # ⚠️ À consolider avec utils/selectors.ts
│   ├── dataPrioritization.ts   # ✅ Conservé
│   └── queryCacheIntegration.ts # ✅ Conservé
└── providers/
    ├── QueryClientProvider.tsx # ✅ Conservé - bien optimisé
    └── AuthProvider.tsx        # ⚠️ À simplifier avec nouveau useAuth
```

### Dossiers à Supprimer

```
src/hooks/
├── legacy/                     # 🗑️ SUPPRIMER ENTIÈREMENT
├── refactored/                 # 🗑️ SUPPRIMER après migration
├── configs/                    # 🗑️ SUPPRIMER - intégrer dans entities/
└── specialized/                # 🗑️ SUPPRIMER - vide
```

## Components and Interfaces

### 1. Hooks Core (Conservés)

Les hooks core sont excellents et seront conservés tels quels :
- `useGenericCRUD.ts` - Architecture solide pour CRUD
- `useGenericQuery.ts` - Wrapper intelligent pour TanStack Query
- `useMutationHooks.ts` - Mutations standardisées
- `useOptimistic.ts` - Updates optimistes

### 2. Hooks Entities (Nouveaux)

Chaque entité aura un hook unifié qui remplace les versions legacy et refactored :

```typescript
// Exemple: src/hooks/entities/useAuth.ts
export interface UseAuthResult {
  user: Profile | null;
  authUser: User | null;
  loading: boolean;
  error: AppError | null;
  signInWithGoogle: () => void;
  signInWithFacebook: () => void;
  signOut: () => void;
  isSigningIn: boolean;
  isSigningOut: boolean;
}

export function useAuth(): UseAuthResult;
export function useProfileManagement(): ProfileManagementResult;
```

### 3. Migration des Query Functions

Les fonctions dans `src/lib/queryFunctions.ts` seront intégrées directement dans les hooks entities correspondants pour réduire la complexité et améliorer la colocation.

### 4. Consolidation des Selectors

Les selectors seront consolidés :
- `src/lib/fieldSelectors.ts` → `src/hooks/utils/selectors.ts`
- Suppression des selectors legacy dupliqués
- Conservation uniquement des selectors optimisés

## Data Models

### Configuration Entities

```typescript
// Nouvelle approche: configuration inline dans chaque hook entity
const authConfig = {
  queryKeys: new EntityQueryKeys("auth"),
  cacheConfig: CacheConfigManager.getConfig("auth"),
  errorConfig: { retry: 3, retryDelay: 1000 }
};
```

### Types Consolidés

```typescript
// Types principaux conservés depuis database.ts
export type { 
  Profile, 
  Service, 
  BusinessInside, 
  BusinessOutside,
  MarketplaceListing,
  MessagesHeader 
} from "../types/database";
```

## Error Handling

Le système d'error handling actuel est excellent et sera conservé :
- `ErrorHandler` class avec gestion des erreurs Supabase
- Messages d'erreur user-friendly
- Retry logic configuré par entité
- Gestion des erreurs RLS spécifiques

## Testing Strategy

### 1. Tests de Migration

```typescript
// Tests pour vérifier la compatibilité API
describe('Hook Migration Compatibility', () => {
  it('should maintain same API as legacy hooks', () => {
    // Test que les nouveaux hooks ont la même interface
  });
  
  it('should return same data structure', () => {
    // Test que les données retournées sont identiques
  });
});
```

### 2. Tests de Performance

```typescript
// Tests pour vérifier les améliorations de performance
describe('Performance Improvements', () => {
  it('should reduce bundle size', () => {
    // Mesurer la réduction du bundle
  });
  
  it('should improve cache efficiency', () => {
    // Tester l'efficacité du cache
  });
});
```

### 3. Tests d'Intégration

```typescript
// Tests pour vérifier que tout fonctionne ensemble
describe('Integration Tests', () => {
  it('should work with existing components', () => {
    // Test avec les composants existants
  });
});
```

## Plan de Migration par Priorité

### Priorité 1 (CRITIQUE) - Fondations
1. **Consolidation des Selectors** - Fusionner fieldSelectors.ts avec selectors.ts
2. **Migration useAuth** - Remplacer AuthProvider et useAuthRefactored
3. **Nettoyage des exports** - Simplifier src/hooks/index.ts

### Priorité 2 (HAUTE) - Entités Principales  
4. **Migration useProfiles** - Consolider les hooks profiles
5. **Migration useServices** - Consolider les hooks services
6. **Migration useBusinesses** - Consolider les hooks businesses

### Priorité 3 (MOYENNE) - Entités Secondaires
7. **Migration useMessaging** - Consolider les hooks messaging
8. **Migration useLocations** - Consolider les hooks locations
9. **Migration usePresence** - Consolider les hooks presence

### Priorité 4 (BASSE) - Nettoyage Final
10. **Migration useMarketplace** - Migrer depuis legacy
11. **Suppression des dossiers legacy/refactored** - Nettoyage final
12. **Optimisation du QueryClientProvider** - Simplifications finales

## Avantages de cette Architecture

### Performance
- **Réduction bundle** : ~30-40% de réduction estimée
- **Cache optimisé** : Moins de doublons, meilleure gestion mémoire
- **Lazy loading** : Imports plus précis

### Maintenabilité  
- **DRY** : Une seule implémentation par fonctionnalité
- **KISS** : Structure simple et prévisible
- **Colocation** : Code lié regroupé

### Developer Experience
- **API unifiée** : Même pattern pour tous les hooks
- **TypeScript** : Meilleur support des types
- **Documentation** : Plus facile à documenter et comprendre

## Risques et Mitigation

### Risque 1: Régressions pendant la migration
**Mitigation**: Migration progressive avec tests de compatibilité

### Risque 2: Breaking changes pour les composants existants  
**Mitigation**: Maintenir la compatibilité API pendant la transition

### Risque 3: Perte de fonctionnalités spécialisées
**Mitigation**: Audit complet des fonctionnalités avant suppression