# ADR 006 : site non indexable, données structurées limitées, en-têtes de sécurité

- **Statut** : accepté
- **Date** : étape 9 (recette finale)
- **Référence** : `docs/PLAN.md`, étape 9 et §1.2

## Contexte

VERSUS est une boutique **fictive** (projet pédagogique) : aucune vente réelle, prix indicatifs,
visuels appartenant aux marques. Un moteur de recherche ne doit ni l'indexer comme un vrai
commerce, ni afficher ses prix comme une offre. Le code citait déjà cette décision
(`src/app/layout.tsx`, `src/app/robots.ts`) sans qu'elle soit écrite.

## Décision

### Indexation

- Tout est interdit aux robots tant que `ALLOW_INDEXING` ne vaut pas exactement `"true"` :
  `robots.txt` répond `Disallow: /` et chaque page porte `noindex, nofollow`.
- `sitemap.xml` existe quand même (pages publiques, marques, catégories et fiches produit ; jamais
  le panier, la commande, le suivi, le compte ni la recherche), pour le jour où l'indexation serait
  autorisée. `robots.txt` ne le cite pas tant que le site est fictif.
- Aucune URL canonique n'est publiée : sans indexation, elle n'apporte rien.

### Données structurées (JSON-LD)

- Publiées : `Organization` (accueil) et `BreadcrumbList` (fiches produit, pages marque et
  catégorie, via le composant `Breadcrumb`).
- **Jamais** `Product` ni `Offer` : ils feraient passer des prix fictifs pour des offres réelles
  (résultats enrichis, comparateurs de prix). Un test e2e l'interdit (`e2e/seo.spec.ts`).
- Le contenu est échappé (`<`, U+2028, U+2029) avant d'entrer dans la balise `<script>`.

### En-têtes de sécurité (`next.config.ts`)

`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (caméra, micro, géolocalisation, paiement, USB et cohortes publicitaires
refusés), `X-Frame-Options: DENY` et une CSP **minimale** :
`frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`.

**Compromis assumé : pas de `script-src` strict.** L'App Router injecte des scripts inline ; un
nonce par requête obligerait à rendre toutes les pages dynamiques, ce qui ruinerait le prérendu et
les performances (budget JS et LCP). Les trois directives retenues bloquent déjà l'intégration dans
un cadre, le détournement de `<base>` et l'envoi de formulaires vers un autre domaine.

### Exploitation

- `/api/health` : sonde publique (`public.ping()`), 200 ou 503, jamais mise en cache, sans détail.
- Tâche quotidienne Vercel `/api/cron/keepalive` (`vercel.json`), protégée par `CRON_SECRET`
  (au moins 32 caractères ; 503 sans secret, 401 avec un mauvais) : elle interroge la base pour que
  le projet Supabase gratuit ne soit pas mis en pause pour inactivité.

## Conséquences

- Passer le site en indexable demande de changer `ALLOW_INDEXING`, d'ajouter le plan du site à
  `robots.ts` et de revoir ce document ; les prix resteraient hors JSON-LD.
- Durcir la CSP (`script-src` avec nonce) est possible plus tard, au prix de pages dynamiques.
