# ADR 004 : caractéristiques produit en colonnes typées

- **Statut** : accepté
- **Date** : étape 4
- **Référence** : `docs/PLAN.md`, §5.4

## Contexte

La fiche produit et le comparateur partagent un ensemble connu de caractéristiques. Un modèle
entité-attribut-valeur permettrait d’ajouter des champs librement, mais rendrait la validation,
les requêtes et le typage plus difficiles à expliquer et à contrôler.

## Décision

Les spécifications sont conservées dans `product_specs`, une table 1–1 avec `products`, avec une
colonne typée par caractéristique (`screen_size_in`, `refresh_hz`, `chip`, `battery_mah`,
`autonomy_hours`, `charging_w`, `main_camera_mp`, `weight_g`, `ip_rating`, `has_5g` et `has_anc`).
Les valeurs absentes restent `NULL`. Les lignes du comparateur restent centralisées par famille
dans `src/lib/compare/rows.ts`.

Le prix minimal et la disponibilité sont calculés depuis `product_variants`. La garantie est
portée par `products.warranty_months` ; aucun de ces champs dérivés n’est dupliqué dans
`product_specs`.

## Conséquences

- Le schéma, les types TypeScript générés et les contrôles d’entrée rendent les champs explicites.
- L’ajout d’une nouvelle caractéristique nécessite une migration et une mise à jour des types et
  composants consommateurs.
- Le format reste simple à filtrer et à utiliser dans les tableaux de comparaison.
