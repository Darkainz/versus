# ADR 009 : séparation des environnements et des clés

- **Statut** : accepté
- **Date** : étape 4
- **Référence** : `docs/PLAN.md`, §7.4–7.5

## Contexte

Le catalogue passe à Supabase tandis que les previews Vercel, les tests et la production doivent
rester isolés. Les clés côté navigateur ne doivent autoriser que les accès publics déjà limités
par les grants et RLS.

## Décision

| Environnement | Application               | Base                                          |
| ------------- | ------------------------- | --------------------------------------------- |
| Local         | Next.js local             | Supabase local via Docker                     |
| Preview       | Vercel Preview            | `versus-dev`                                  |
| Production    | Vercel Production         | `versus`                                      |
| CI            | Build et tests Playwright | Supabase local réinitialisé à chaque workflow |

Le navigateur reçoit uniquement `NEXT_PUBLIC_SUPABASE_URL` et
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La clé `SUPABASE_SECRET_KEY` reste serveur et n’est pas
requise pour la lecture du catalogue. `REVALIDATE_SECRET` protège le Route Handler de
revalidation ; il n’est jamais transmis au navigateur. Les clés historiques `anon` et
`service_role` ne sont pas utilisées.

Les ports de Supabase local sont décalés dans `supabase/config.toml` pour éviter la plage réservée
par Windows rencontrée pendant l’initialisation. Les valeurs sont communes aux développeurs et à
la CI ; aucune clé ni donnée de production n’est stockée dans le dépôt.

## Conséquences

- Les migrations sont appliquées et testées sur la base de développement avant la production.
- La CI démarre une base vierge, applique seeds et migrations, exécute pgTAP, puis vérifie la
  régénération des types.
- Les fichiers `.env*.local` restent ignorés par Git ; `.env.example` ne contient que des valeurs
  vides et des noms de variables.
