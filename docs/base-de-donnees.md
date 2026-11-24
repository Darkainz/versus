# Base de données Supabase

## Initialisation locale

Docker Desktop doit être actif. Depuis la racine du projet :

```powershell
npm run db:start
npm run db:reset
npm run db:test
npm run db:types
```

`db:reset` applique les migrations et charge les seeds du catalogue et de l’accueil. Les seeds
sont générés depuis `src/data/catalog.ts` avec `npm run db:seed:gen`. Les ports Supabase locaux
sont configurés dans `supabase/config.toml` ; ils sont décalés car Windows réserve la plage qui
contient les ports Supabase par défaut.

## Modèle du catalogue

- `brands` et `categories` référencent les produits et fixent leur ordre d’affichage.
- `products` contient les informations éditoriales et la compatibilité.
- `product_variants` porte les SKU, prix, attributs et stock.
- `product_images` porte les visuels par couleur, leur texte alternatif et leurs crédits.
- `product_specs` contient une ligne typée par produit.
- `home_slots`, `delivery_zones` et `shop_settings` portent respectivement la sélection d’accueil,
  les tarifs indicatifs et les réglages futurs.

La vue `catalog_products` calcule le prix minimal et la disponibilité depuis les variantes. Elle
utilise `security_invoker = true`, de sorte que les règles RLS des tables sous-jacentes restent
applicables. Les prix et le stock ne sont pas dupliqués dans les fiches produit.

## RLS et privilèges

RLS est activée sur toutes les tables publiques. La migration initiale retire les privilèges par
défaut aux rôles `anon` et `authenticated`, révoque l’exposition automatique des tables et
n’accorde que les opérations nécessaires, table par table. Les politiques publiques ne révèlent
que les produits actifs ; les écritures sont réservées à l’administrateur. Le rôle `anon` dispose
uniquement de `SELECT` sur la vue `catalog_products`, et ne peut pas modifier directement le stock.

### Droits par défaut de Supabase

Ne pas supposer qu’une table ou une fonction nouvellement créée est inaccessible parce que RLS est
activée : les privilèges SQL et RLS sont deux couches distinctes. Les migrations fixent les droits
par défaut des nouveaux objets, retirent l’exécution publique implicite des fonctions et ajoutent
des grants explicites lorsqu’un accès est requis. Une politique RLS ne remplace jamais un `REVOKE`
ou un `GRANT`.

Les fonctions `security definer` fixent leur `search_path`. Les fonctions exposées sont contrôlées
par liste blanche dans `00_security_baseline.test.sql`. Les suites pgTAP vérifient également la
visibilité des produits inactifs, l’interdiction d’écriture anonyme et les contraintes d’activation.

## Types, accès et cache

`src/lib/database.types.ts` est généré par `npm run db:types` depuis la base locale. La CI le
régénère et échoue si le fichier commité n’est pas à jour. Le repository Supabase convertit les
lignes SQL vers les types du catalogue ; les fonctions `getCatalog`, `getProduct` et `getHome`
mettent en cache les lectures publiques. Le stock de la fiche produit reste une lecture dynamique,
sans cache.

Les données de livraison sont indicatives. Le site est un projet pédagogique : aucune vente ni
expédition réelle n’est effectuée.
