# Régression visuelle de l'accueil

`e2e/visuel.spec.ts` compare l'accueil pleine page à une référence, à 1440 × 900 et 390 × 844 px
(§4.6 et §7.1 du plan) :

- mouvement réduit (aucun défilement automatique, première diapositive) et
  `animations: "disabled"` ;
- `VS_TODAY=2026-11-12`, fixé par `playwright.config.ts` (badges « Nouveau » stables) ;
- polices chargées (`document.fonts.ready`) et images décodées ; le test des 30 visuels de la
  boutique force leur chargement (`loading="eager"`) puis attend `networkidle`, afin de vérifier
  aussi les images sous la ligne de flottaison ;
- seuil : **0,5 % de pixels différents au plus** (`maxDiffPixelRatio: 0.005`), pour absorber
  l'anticrénelage du texte et des images redimensionnées d'une exécution à l'autre.

## Références par plateforme

Le rendu des polices diffère entre Windows, macOS et Linux. Playwright suffixe donc chaque
référence par la plateforme :

- `e2e/visuel.spec.ts-snapshots/accueil-1440-chromium-win32.png`
- `e2e/visuel.spec.ts-snapshots/accueil-390-chromium-win32.png`

Les références Windows ont été prises le 17 novembre 2026, à la fin de l'étape 3, puis régénérées
le même jour au lot 1 de la refonte (`--update-snapshots=changed`) : visuels recadrés avec une marge
homogène, prix réalignés (iPhone 18 Pro « À partir de 970 000 FCFA ») et nom « Galaxy Buds4 ». La
composition de l'accueil n'a pas changé. Elles l'ont été de nouveau au lot 2 (fondations du design) : gris pierre, boutons
toujours verts, surtitres en casse normale, trois arrondis, espacement de section de 64 / 96 px et
gouttière mobile de 16 px ; puis, après revue du lot 2, titres de tuile sur `--text-tile`
(700, −0,025 em), marques et surtitres en casse normale, pastels Apple et Xiaomi des tuiles
alignés sur les thèmes de marque, « Dès » retiré des cartes à prix unique. Différences vérifiées sur une planche référence / nouveau : la
structure de l'accueil est inchangée. **Une plateforme
sans référence est ignorée** (test marqué `skipped`, avec le chemin attendu dans l'annotation) au
lieu d'échouer : la CI Linux reste verte tant que ses références n'existent pas.

Le 23 novembre 2026, après inspection des captures actuelles, les deux références Windows ont été
actualisées : l'ancienne hauteur (5 303 px à 1440 px, 6 949 px à 390 px) ne comprenait pas la
section « Besoin d'aide pour choisir ? » et les actions désormais livrées dans le comparateur.
Le nouveau rendu (5 999 px et 8 138 px) a été vérifié avant mise à jour ; ces différences
représentent les fonctionnalités livrées, pas une régression de mise en page.

## Générer les références Linux (CI)

Les références Linux doivent venir du même environnement que la CI (`ubuntu-latest`, Chromium de
Playwright 1.65.0). Deux possibilités :

1. **Image Docker officielle de Playwright** (même version), depuis la racine du dépôt ; le volume
   anonyme `/work/node_modules` évite d'écraser les modules installés sur la machine hôte :

   ```bash
   docker run --rm -v "$PWD":/work -v /work/node_modules -w /work mcr.microsoft.com/playwright:v1.65.0-noble \
     bash -c "npm ci && VS_TODAY=2026-11-12 npx playwright test e2e/visuel.spec.ts --update-snapshots=missing"
   ```

2. **Dans la CI** : ajouter temporairement au job e2e une étape
   `npx playwright test e2e/visuel.spec.ts --update-snapshots=missing` suivie d'un
   `actions/upload-artifact` du dossier `e2e/visuel.spec.ts-snapshots/`, puis récupérer les
   fichiers `*-chromium-linux.png` de l'artefact.

Vérifier les images obtenues, puis les committer. Le test les compare dès lors à chaque exécution.

## Mettre à jour une référence

Après un changement visuel voulu (et validé), régénérer les références de sa plateforme :

```bash
npx playwright test e2e/visuel.spec.ts --update-snapshots=changed
```

puis les faire relire avec le diff du commit.

## Historique des régénérations

- **2026-11-23** : références `win32` (`accueil-1440`, `accueil-390`) régénérées. Comparaison visuelle
  de l'ancienne et de la nouvelle image : la mise en page est identique ; ne changent que les
  données du catalogue étendu (compteurs des pastilles « Parcourir » 60 / 19 / 18 / 6, lien
  « Tout le catalogue (103) », résumés des trois marques 32 / 31 / 40 produits, visuels de repli
  SVG pour les produits Samsung et Xiaomi sans photo) et la disparition du badge de développement
  de Next.js qui figurait par erreur dans l'ancienne référence. Les références Linux (CI) restent
  à régénérer comme décrit plus haut.
