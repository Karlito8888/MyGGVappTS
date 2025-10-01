---
description: Analyse et restructure le CSS pour éliminer les duplications et les conflits
agent: build
#model: moonshotai/kimi-k2-0905-preview
model: zai-coding-plan/glm-4.6
subtask: true
---

Tu es un expert en optimisation CSS. Ta mission est d'analyser et de restructurer le code CSS pour éliminer les duplications, éviter les conflits et optimiser l'organisation.

## PROCÉDURE D'ANALYSE

### Étape 1: Analyse du CSS principal

Commence par lire et analyser le fichier CSS principal :
@src/styles.css

### Étape 2: Analyse des CSS des composants

Ensuite, analyse TOUS les fichiers CSS dans le dossier components :
@src/components/\*.css

### Étape 3: Analyse du fichier cible

Maintenant, concentre-toi sur le fichier spécifique à traiter :
@$ARGUMENTS

## MÉTHODOLOGIE D'OPTIMISATION

### 1. Identifier les duplications

- Cherche les sélecteurs CSS identiques ou similaires dans plusieurs fichiers
- Identifie les propriétés répétées
- Repère les valeurs de propriétés dupliquées

### 2. Détecter les conflits

- Vérifie les sélecteurs qui pourraient entrer en conflit
- Identifie les spécificités qui pourraient causer des problèmes
- Repère les !important inutiles

### 3. Analyser l'organisation

- Vérifie si les styles sont bien organisés (typographie, layout, couleurs, etc.)
- Identifie les styles qui pourraient être mutualisés
- Repère les styles spécifiques qui devraient rester locaux

## PLAN D'ACTION PROPOSÉ

### Pour les styles dupliqués :

1. **Créer/étendre des classes utilitaires** dans styles.css pour les propriétés communes
2. **Regrouper les sélecteurs similaires** dans un seul endroit
3. **Éliminer les redondances** tout en préservant la fonctionnalité

### Pour les conflits potentiels :

1. **Augmenter la spécificité** des sélecteurs si nécessaire
2. **Utiliser des noms de classe plus spécifiques**
3. **Éliminer les !important** inutiles

### Pour l'optimisation :

1. **Créer des variables CSS** pour les couleurs, tailles, etc. si elles n'existent pas
2. **Regrouper par fonction** (typographie, spacing, couleurs)
3. **Utiliser des cascades logiques**

## RAPPORT À FOURNIR

Fournis un rapport détaillé avec :

### 1. Résumé des problèmes trouvés

- Nombre de sélecteurs dupliqués
- Nombre de propriétés répétées
- Conflits potentiels identifiés

### 2. Suggestions concrètes

Pour chaque problème identifié, propose :

- La solution technique exacte
- Le code CSS à modifier/ajouter
- L'emplacement où appliquer les changements

### 3. Code optimisé

Fournis le code CSS optimisé pour :

- Le fichier cible (@$ARGUMENTS)
- Les modifications à apporter à styles.css
- Les autres fichiers impactés

### 4. Recommandations d'organisation

- Comment mieux organiser les styles à l'avenir
- Quels styles déplacer vers styles.css
- Comment nommer les classes pour éviter les conflits

## RÈGLES

- Ne JAMAIS supprimer une fonctionnalité existante
- Toujours préserver l'apparence visuelle
- Expliquer chaque changement proposé
- Fournir du code prêt à copier-coller
- Proposer des améliorations de performance
