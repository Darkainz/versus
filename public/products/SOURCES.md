# Sources des visuels produits

Visuels officiels des marques (visuels © leurs fabricants : Apple, Samsung, Xiaomi), copiés sur le
site pour un projet pédagogique non commercial, non indexé. Aucun logo ni police de marque. Retrait
immédiat sur simple demande. La page `/credits` reprend ce tableau (`src/data/product-visuals.ts`).

## Traitement commun (17/11/2026)

Script `sharp` exécuté hors du dépôt, sur des copies téléchargées dans un dossier temporaire dédié :

1. conversion en RGBA (les PNG à palette de mi.com sont convertis) ;
2. fond blanc retiré quand la source n'est pas détourée (`awu4`, `awse3`, `aw12`) : zones quasi blanches
   reliées aux bords ou assez grandes pour être un trou du bracelet, bord adouci ;
3. recadrage sur le produit (alpha > 8), puis marge transparente de 4 % du plus grand côté sur
   les quatre bords : produit centré, même marge relative pour les 30 fichiers ;
4. 900 px au plus de côté (jamais agrandi) ;
5. PNG à palette si l'écart reste invisible (PSNR ≥ 40 dB), sinon PNG 24 bits ; réduction par
   paliers de 100 px tant que le fichier dépasse 195 Ko.

Les neuf visuels de l'étape 3 (téléchargés le 12/11/2026) ont été retraités de la même façon.

## Apple (apple.com)

| Fichier | Produit | Source | Téléchargé le |
|---|---|---|---|
| ipd.png | iPhone Duo (blanc stellaire) | store.storeimages.cdn-apple.com — `iphone-compare-iphone-duo-202609` (page apple.com/fr/shop/buy-iphone, comparateur) | 17/11/2026 |
| ip18.png | iPhone 18 Pro (bordeaux) | store.storeimages.cdn-apple.com — `iphone-18-pro-finish-select-202609-6-3inch-burgundy` (page apple.com/fr/shop/buy-iphone/iphone-18-pro), fond gris retiré | 12/11/2026 |
| ip17.png | iPhone 17 (lavande) | store.storeimages.cdn-apple.com — `iphone-compare-iphone-17-202609` (page apple.com/fr/shop/buy-iphone/iphone-17) | 17/11/2026 |
| ip17e.png | iPhone 17e (rose pastel) | store.storeimages.cdn-apple.com — `iphone-compare-iphone-17e-202609` (page apple.com/fr/shop/buy-iphone/iphone-17e) | 17/11/2026 |
| apm2.png | AirPods Max 2 (minuit) | www.apple.com — `/v/airpods/af/images/overview/airpods_max_black__x3byrd2venmu_large_2x.png` (page apple.com/fr/airpods), version 2x du visuel retenu | 17/11/2026 |
| app3.png | AirPods Pro 3 | store.storeimages.cdn-apple.com — `airpods-pro-3-hero-select-202509` (page apple.com/fr/shop/buy-airpods/airpods-pro-3) | 17/11/2026 |
| ap5.png | AirPods 5 | store.storeimages.cdn-apple.com — `airpods-5-hero-select-202609` (page apple.com/fr/shop/buy-airpods/airpods-5) | 12/11/2026 |
| awu4.png | Apple Watch Ultra 4 (titane naturel, bracelet Océan) | store.storeimages.cdn-apple.com — `watch-compare-ultra-4-202609_GEO_FR` (page apple.com/fr/shop/buy-watch/apple-watch-ultra), fond blanc retiré | 17/11/2026 |
| aw12.png | Apple Watch Series 12 (aluminium bronze sombre, bracelet sport kaki) | store.storeimages.cdn-apple.com — `watch-compare-series-12-202609_GEO_FR` (page apple.com/fr/shop/buy-watch/apple-watch), fond blanc retiré | 17/11/2026 |
| awse3.png | Apple Watch SE 3 (lumière stellaire) | store.storeimages.cdn-apple.com — `watch-compare-se-3-202609_GEO_FR` (page apple.com/fr/shop/buy-watch/apple-watch-se), fond blanc retiré | 17/11/2026 |
| iphone16pro.png | iPhone 16 Pro (titane désert) | store.storeimages.cdn-apple.com — `iphone-16-pro-finish-select-202409-6-3inch-deserttitanium` (page apple.com/fr/shop/buy-iphone/iphone-16-pro, visuel du choix de finition 6,3 pouces) | 23/11/2026 |
| i16pmax.png | iPhone 16 Pro Max (titane désert) | store.storeimages.cdn-apple.com — `iphone-16-pro-finish-select-202409-6-9inch-deserttitanium` (page apple.com/fr/shop/buy-iphone/iphone-16-pro, visuel du choix de finition 6,9 pouces) | 23/11/2026 |
| iphone16.png | iPhone 16 (outremer) | store.storeimages.cdn-apple.com — `iphone-16-finish-select-202409-6-1inch-ultramarine` (page apple.com/fr/shop/buy-iphone/iphone-16, visuel du choix de finition 6,1 pouces) | 23/11/2026 |
| iphone16plus.png | iPhone 16 Plus (outremer) | store.storeimages.cdn-apple.com — `iphone-16-finish-select-202409-6-7inch-ultramarine` (page apple.com/fr/shop/buy-iphone/iphone-16, visuel du choix de finition 6,7 pouces) | 23/11/2026 |
| iphone15pro.png | iPhone 15 Pro (titane naturel) | store.storeimages.cdn-apple.com — `iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium` (page apple.com/fr/shop/buy-iphone/iphone-15-pro, visuel du choix de finition 6,1 pouces) | 23/11/2026 |
| i15pmax.png | iPhone 15 Pro Max (titane naturel) | store.storeimages.cdn-apple.com — `iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium` (page apple.com/fr/shop/buy-iphone/iphone-15-pro, visuel du choix de finition 6,7 pouces) | 23/11/2026 |
| iphone15.png | iPhone 15 (bleu) | store.storeimages.cdn-apple.com — `iphone-15-finish-select-202309-6-1inch-blue` (page apple.com/fr/shop/buy-iphone/iphone-15, visuel du choix de finition 6,1 pouces) | 23/11/2026 |
| iphone15plus.png | iPhone 15 Plus (bleu) | store.storeimages.cdn-apple.com — `iphone-15-finish-select-202309-6-7inch-blue` (page apple.com/fr/shop/buy-iphone/iphone-15, visuel du choix de finition 6,7 pouces) | 23/11/2026 |
| iphone14pro.png | iPhone 14 Pro (violet intense) | store.storeimages.cdn-apple.com — `iphone-14-pro-finish-select-202209-6-1inch-deeppurple` (page apple.com/fr/shop/buy-iphone/iphone-14-pro, visuel du choix de finition 6,1 pouces) | 23/11/2026 |
| i14pmax.png | iPhone 14 Pro Max (violet intense) | store.storeimages.cdn-apple.com — `iphone-14-pro-finish-select-202209-6-7inch-deeppurple` (page apple.com/fr/shop/buy-iphone/iphone-14-pro, visuel du choix de finition 6,7 pouces) | 23/11/2026 |
| iphone14.png | iPhone 14 (bleu) | store.storeimages.cdn-apple.com — `iphone-14-finish-select-202209-6-1inch-blue` (page apple.com/fr/shop/buy-iphone/iphone-14, visuel du choix de finition 6,1 pouces) | 23/11/2026 |
| iphone14plus.png | iPhone 14 Plus (bleu) | store.storeimages.cdn-apple.com — `iphone-14-finish-select-202209-6-7inch-blue` (page apple.com/fr/shop/buy-iphone/iphone-14, visuel du choix de finition 6,7 pouces) | 23/11/2026 |
| iphone13pro.png | iPhone 13 Pro (bleu alpin) | store.storeimages.cdn-apple.com — `iphone-13-pro-finish-select-202207-6-1inch-sierrablue` (page apple.com/fr/shop/buy-iphone/iphone-13-pro, visuel du choix de finition 6,1 pouces) | 23/11/2026 |
| i13pmax.png | iPhone 13 Pro Max (bleu alpin) | store.storeimages.cdn-apple.com — `iphone-13-pro-finish-select-202207-6-7inch-sierrablue` (page apple.com/fr/shop/buy-iphone/iphone-13-pro, visuel du choix de finition 6,7 pouces) | 23/11/2026 |
| iphone13.png | iPhone 13 (bleu) | store.storeimages.cdn-apple.com — `iphone-13-finish-select-202207-6-1inch-blue` (page apple.com/fr/shop/buy-iphone/iphone-13, visuel du choix de finition 6,1 pouces) | 23/11/2026 |
| iphone13mini.png | iPhone 13 mini (bleu) | store.storeimages.cdn-apple.com — `iphone-13-finish-select-202207-5-4inch-blue` (page apple.com/fr/shop/buy-iphone/iphone-13, visuel du choix de finition 5,4 pouces) | 23/11/2026 |
| airpods4.png | AirPods 4 (blanc) | store.storeimages.cdn-apple.com — `airpods-4-hero-select-202409` (page apple.com/fr/shop/buy-airpods/airpods-4) | 23/11/2026 |
| a4aradb.png | AirPods 4 avec réduction active du bruit (blanc) | store.storeimages.cdn-apple.com — `airpods-4-anc-select-202409` (page apple.com/fr/shop/buy-airpods/airpods-4, variante réduction active du bruit), fichier identique octet pour octet à airpods4.png : la source demandée pour cette variante a renvoyé le même visuel | 23/11/2026 |
| ap2eg.png | AirPods Pro (2e génération) (blanc) | store.storeimages.cdn-apple.com — `airpods-pro-2-hero-select-202409` (page apple.com/fr/shop/buy-airpods/airpods-pro-2) | 23/11/2026 |
| awu2.png | Apple Watch Ultra 2 (titane, bracelet Océan orange) | www.apple.com — `newsroom/images/2023/09/apple-unveils-apple-watch-ultra-2/article/Apple-Watch-Ultra-2-Ocean-Band-Orange-230912_inline.jpg.large_2x.jpg` (page apple.com/newsroom/2023/09/apple-unveils-apple-watch-ultra-2/) | 23/11/2026 |

## Samsung (samsung.com)

Visuels de galerie `images.samsung.com/is/image/samsung/p6pim/…`, demandés avec le préréglage
haute définition `$Q90_1368_1094_F_PNG$` (même image que le préréglage `$684_547_PNG$`, où le
produit ne faisait que 178 à 360 px de haut).

| Fichier | Produit | Source | Téléchargé le |
|---|---|---|---|
| zf8.png | Galaxy Z Fold8 (lavande) | `fr/f2607/gallery/fr-galaxy-z-fold8-f971-sm-f971blvbeub-thumb-553805006` (page samsung.com/fr/smartphones/galaxy-z-fold8/buy) | 17/11/2026 |
| s26u.png | Galaxy S26 Ultra (violet) | `fr/s2602/gallery/fr-galaxy-s26-ultra-s948-sm-s948bzvdeub-thumb-550858460` (page samsung.com/fr/smartphones/galaxy-s26-ultra/buy) | 17/11/2026 |
| zfl8.png | Galaxy Z Flip8 (rose) | `fr/f2607/gallery/fr-galaxy-zflip8-f776-sm-f776bligeub-thumb-553805932` (page samsung.com/fr/smartphones/galaxy-z-flip8/buy) | 17/11/2026 |
| s26.png | Galaxy S26 (violet) | `fr/s2602/gallery/fr-galaxy-s26-s942-sm-s942bzvgeub-thumb-550923094` (page samsung.com/fr/smartphones/galaxy-s26/buy) | 17/11/2026 |
| a57.png | Galaxy A57 5G (bleu clair) | images.samsung.com — `260320_a57_icyblue_color-section_buypage_1600x864px.png` (page samsung.com/fr/…/galaxy-a57-5g/buy), recadré sur 2 vues | 12/11/2026 |
| gb4p.png | Galaxy Buds4 Pro (noir) | `fr/s2602/gallery/fr-galaxy-buds4-r640-579870-sm-r640nzkaxef-thumb-551037965` (page samsung.com/fr/audio-sound/galaxy-buds/galaxy-buds4-pro-black-sm-r640nzkaxef) | 17/11/2026 |
| gb4.png | Galaxy Buds4 (blanc) | images.samsung.com — `be_fr/galaxy-buds4/buy/05_Color_Selection/Bach/Color_Selection_White_PC.png`, fond blanc retiré | 12/11/2026 |
| gwu2.png | Galaxy Watch Ultra2 (argent titane, bracelet sport vert) | `fr/f2607/gallery/fr-galaxy-watch-ultra2-l710-sm-l715fzsaeub-thumb-553808798` (page samsung.com/fr/watches/galaxy-watch/galaxy-watch-ultra2-titanium-silver-lte-sm-l715fzsaeub) | 17/11/2026 |
| gw9.png | Galaxy Watch9 (graphite) | images.samsung.com — `us/f2607/buypage/galaxy-watch9/designstudio/SM-L340NZK_ET-SNL34SB.png` (page samsung.com/us/watches/galaxy-watch9/buy) | 12/11/2026 |
| gf3.png | Galaxy Fit3 (gris) | `africa_fr/sm-r390nzaaxfa/gallery/africa-fr-galaxy-fit3-r390-sm-r390nzaaxfa-540082310` (page samsung.com/africa_fr/watches/galaxy-fit/galaxy-fit3-gray-bluetooth-sm-r390nzaaxfa) | 17/11/2026 |
| galaxys25.png | Galaxy S25 (bleu foncé) | `fr/2501/gallery/fr-galaxy-s25-s931-sm-s931bdbdeub-thumb-544755255` (page samsung.com/fr/smartphones/all-smartphones/) | 23/11/2026 |
| gs25plus.png | Galaxy S25+ (bleu foncé) | `ch_fr/2501/gallery/ch-fr-galaxy-s25-s936-sm-s936bdbdeue-thumb-544677968` (page samsung.com/ch_fr/smartphones/all-smartphones/) | 23/11/2026 |
| gs25u.png | Galaxy S25 Ultra (noir titane) | `fr/sm5s938bakdeuh/gallery/fr-galaxy-s25-s938-571686-sm5s938bakdeuh-thumb-550150055` (page samsung.com/fr/smartphones/all-smartphones/) | 23/11/2026 |
| gs25edge.png | Galaxy S25 Edge (bleu clair) | `fr/sm-s937blbgeub/gallery/fr-smartphones-sm-s937blbgeub-dos-et-profil-du-samsung-galaxy-s---edge-bleu-titane-thumb-547066985` (page samsung.com/fr/smartphones/all-smartphones/) | 23/11/2026 |
| gs26plus.png | Galaxy S26+ (violet) | `fr/s2602/gallery/fr-galaxy-s26-s947-sm-s947bzvdeub-thumb-550921558` (page samsung.com/fr/smartphones/galaxy-s/) | 23/11/2026 |
| galaxys26fe.png | Galaxy S26 FE (vert pistache) | `fr/sm-s741blgdeub/gallery/fr-galaxy-s26-fe-sm-s741-604715-sm-s741blgdeub-thumb-554428736` (page samsung.com/fr/smartphones/galaxy-s/galaxy-s26-fe-pistachio-128gb-sm-s741blgdeub/) | 23/11/2026 |
| gzfold8u.png | Galaxy Z Fold8 Ultra (violet foncé) | `fr/f2607/gallery/fr-galaxy-z-fold8-ultra-f976-sm-f976bzvbeub-thumb-553779911` (page samsung.com/fr/smartphones/galaxy-z-fold8-ultra/buy/) | 23/11/2026 |
| galaxyzfold7.png | Galaxy Z Fold7 (noir) | `fr/sm5f966bzkbrfr/gallery/fr-galaxy-z-fold7-f966-585727-sm5f966bzkbrfr-thumb-551791425` (page samsung.com/fr/smartphones/galaxy-z-fold7/) | 23/11/2026 |
| galaxyzflip7.png | Galaxy Z Flip7 (noir) | `fr/sm5f766bzkhrfr/gallery/fr-galaxy-zflip7-f766-585888-585888-sm5f766bzkhrfr-thumb-552771500` (page samsung.com/fr/smartphones/galaxy-z-flip7/) | 23/11/2026 |
| gzflip7fe.png | Galaxy Z Flip7 FE (noir) | `uk/f2507/gallery/uk-galaxy-z-flip7-fe-f761-sm-f761bzkgeub-thumb-547699793` (page samsung.com/uk/smartphones/all-smartphones/) | 23/11/2026 |
| galaxys23fe.png | Galaxy S23 FE (indigo) | `fr/sm-s711bzbdeub/gallery/fr-galaxy-s23-fe-s711-486691-sm-s711bzbdeub-thumb-539169981` (page samsung.com/fr/smartphones/galaxy-s23-fe/buy/) | 23/11/2026 |
| galaxya565g.png | Galaxy A56 5G (gris clair) | `uk/sm-a566bzaceub/gallery/uk-galaxy-a56-5g-sm-a566-sm-a566bzaceub-thumb-545178551` (page samsung.com/uk/smartphones/all-smartphones/) | 23/11/2026 |
| galaxya365g.png | Galaxy A36 5G (noir) | `fr/sm-a366bzkbeub/gallery/fr-galaxy-a36-5g-sm-a366-sm-a366bzkbeub-545300611` (page samsung.com/fr/smartphones/galaxy-a/galaxy-a36-5g/buy/) | 23/11/2026 |
| galaxya375g.png | Galaxy A37 5G (graphite) | `fr/sm-a376bzageub/gallery/fr-galaxy-a37-5g-sm-a376-sm-a376bzageub-thumb-551661702` (page samsung.com/fr/smartphones/galaxy-a-series/) | 23/11/2026 |
| galaxya275g.png | Galaxy A27 5G (rose pâle) | `fr/sm-a276blibeub/gallery/fr-galaxy-a27-5g-sm-a276-sm-a276blibeub-thumb-553550092` (page samsung.com/fr/smartphones/galaxy-a-series/) | 23/11/2026 |
| galaxya175g.png | Galaxy A17 5G (bleu marine) | `fr/sm-a176bzbaeub/gallery/fr-galaxy-a17-5g-sm-a176-sm-a176bzbaeub-thumb-548402847` (page samsung.com/fr/smartphones/galaxy-a-series/) | 23/11/2026 |
| galaxywatch8.png | Galaxy Watch8 (argent, bracelet sport blanc) | `fr/f2507/gallery/fr-galaxy-watch8-l320-sm-l320nzsaxef-thumb-547673377` (page samsung.com/fr/watches/all-watches/) | 23/11/2026 |
| gwatch8c.png | Galaxy Watch8 Classic 46 mm (noir) | `fr/f2507/gallery/fr-galaxy-watch8-classic-l500-sm-l500nzkaxef-thumb-547671219` (page samsung.com/fr/watches/galaxy-watch/galaxy-watch8-classic-46mm-black-bluetooth-sm-l500nzkaxef/) | 23/11/2026 |
| galaxywatch7.png | Galaxy Watch7 40 mm (crème, bracelet sport gris foncé) | `global/global-wearable-Galaxy_Watch7_Cream_40_Front_Sport_ml_dark_grey_1600x864_PC-549932318 (format png-alpha)` (page samsung.com/fr/watches/galaxy-watch7/buy/), fond blanc retiré, bord adouci, vérifié sur fond clair et foncé | 23/11/2026 |
| gwu.png | Galaxy Watch Ultra (titane, bracelet orange) | `ch_fr/2407/gallery/ch-fr-galaxy-watch-ultra-l705-sm-l705fdaaeue-thumb-542291915` (page samsung.com/ch_fr/watches/galaxy-watch-ultra/buy/) | 23/11/2026 |
| gbuds3fe.png | Galaxy Buds3 FE (gris anthracite) | `fr/sm-r420nzkaxef/gallery/fr-galaxy-buds3-fe-sm-r420nzkaxef-thumb-551009000` (page samsung.com/fr/audio-sound/all-audio-sound/) | 23/11/2026 |

## Xiaomi (mi.com)

| Fichier | Produit | Source | Téléchargé le |
|---|---|---|---|
| x17u.png | Xiaomi 17 Ultra (noir) | i05.appmifile.com — `130_item_fr/10/02/2026/ca8701fb….png` (page mi.com/fr/product/xiaomi-17-ultra) | 17/11/2026 |
| x17.png | Xiaomi 17 (noir) | i05.appmifile.com — `869_item_fr/10/02/2026/6fad1503….png` (page mi.com/fr/product/xiaomi-17) | 17/11/2026 |
| x17tp.png | Xiaomi 17T Pro (bleu) | i05.appmifile.com — `58_item_fr/20/05/2026/351dc878….png` (page mi.com/fr/product/xiaomi-17t-pro) | 17/11/2026 |
| rn15.png | Redmi Note 15 Pro+ 5G (noir et moka) | i02.appmifile.com — `200_operator_sg/19/01/2026/094fd0b7….png` (page mi.com/africa-en/product/redmi-note-15-pro-plus-5g/specs), recadré sur 2 coloris | 12/11/2026 |
| xb6.png | Xiaomi Buds 6 (violet nébuleux) | i05.appmifile.com — `426_item_fr/14/05/2026/a18be666….png` (page mi.com/fr/product/xiaomi-buds-6) | 17/11/2026 |
| rb8.png | Redmi Buds 8 (noir) | i05.appmifile.com — `159_item_fr/03/06/2026/ddc06d9e….png` (page mi.com/fr/product/redmi-buds-8) | 17/11/2026 |
| xws5.png | Xiaomi Watch S5 46 mm (noir) | i05.appmifile.com — `355_item_fr/12/05/2026/01c9bd9a….png` (page mi.com/fr/product/xiaomi-watch-s5-46mm) | 17/11/2026 |
| rw6.png | Redmi Watch 6 (noir) | i02.appmifile.com — `383_operator_sg/10/04/2026/c258c9fe….png` (page mi.com/global/product/redmi-watch-6/specs), recadré | 12/11/2026 |
| sb10p.png | Xiaomi Smart Band 10 Pro (noir) | i05.appmifile.com — `658_item_fr/19/05/2026/19b6d0a5….png` (page mi.com/fr/product/xiaomi-smart-band-10-pro) | 17/11/2026 |
| sb10.png | Xiaomi Smart Band 10 (gris) | i02.appmifile.com — `616_operator_sg/27/08/2025/29fc7b82….png` (page mi.com/africa-en/product/xiaomi-smart-band-10/specs), recadré | 12/11/2026 |
| xiaomi15.png | Xiaomi 15 (vert menthe) | i02.appmifile.com — `339_operatorx_operatorx_opx/02/03/2025/73371d9d….png` (page mi.com/global/product/xiaomi-15/specs) | 23/11/2026 |
| x15u.png | Xiaomi 15 Ultra (argent et noir) | i02.appmifile.com — `492_operatorx_operatorx_opx/02/03/2025/5667c36c….png` (page mi.com/global/product/xiaomi-15-ultra/specs) | 23/11/2026 |
| x14u.png | Xiaomi 14 Ultra (noir) | i02.appmifile.com — `91_operatorx_operatorx_opx/24/02/2024/4eafcd40….png` (page mi.com/global/product/xiaomi-14-ultra/ (og:image)) | 23/11/2026 |
| xiaomi14.png | Xiaomi 14 (vert jade) | i02.appmifile.com — `976_operatorx_operatorx_opx/23/02/2024/c4866f7b….png` (page mi.com/global/product/xiaomi-14/specs) | 23/11/2026 |
| xiaomi14tpro.png | Xiaomi 14T Pro (gris titane) | i02.appmifile.com — `675_operatorx_operatorx_opx/26/09/2024/f81bba82….png` (page mi.com/global/product/xiaomi-14t-pro/specs) | 23/11/2026 |
| xiaomi14t.png | Xiaomi 14T (bleu titane) | i02.appmifile.com — `293_operatorx_operatorx_opx/27/09/2024/d714b3e4….png` (page mi.com/global/product/xiaomi-14t/specs) | 23/11/2026 |
| rn14pp5g.png | Redmi Note 14 Pro+ 5G (or rose) | i02.appmifile.com — `212_operatorx_operatorx_opx/02/04/2025/8b179305….png` (page mi.com/global/product/redmi-note-14-pro-plus-5g/specs) | 23/11/2026 |
| rn14p5g.png | Redmi Note 14 Pro 5G (violet lavande) | i02.appmifile.com — `177_operatorx_operatorx_opx/10/01/2025/9e49d2cf….png` (page mi.com/global/product/redmi-note-14-pro-5g/specs) | 23/11/2026 |
| rn145g.png | Redmi Note 14 5G (violet lavande) | i02.appmifile.com — `613_operatorx_operatorx_opx/10/01/2025/7657db17….png` (page mi.com/global/product/redmi-note-14-5g/specs) | 23/11/2026 |
| pocof7ultra.png | POCO F7 Ultra (jaune POCO) | i02.appmifile.com — `602_operatorx_operatorx_opx/27/03/2025/7f55fcb9….png` (page mi.com/global/product/poco-f7-ultra/specs) | 23/11/2026 |
| pocof7pro.png | POCO F7 Pro (noir) | i02.appmifile.com — `200_operatorx_operatorx_opx/27/03/2025/a5665340….png` (page mi.com/global/product/poco-f7-pro/specs) | 23/11/2026 |
| pocox7pro.png | POCO X7 Pro (noir et jaune) | i02.appmifile.com — `251_operatorx_operatorx_opx/09/01/2025/d7110ed0….png` (page mi.com/global/product/poco-x7-pro/specs) | 23/11/2026 |
| pocox7.png | POCO X7 (vert menthe) | i02.appmifile.com — `570_operatorx_operatorx_opx/09/01/2025/0adbdc47….png` (page mi.com/global/product/poco-x7/specs) | 23/11/2026 |
| xiaomibuds5.png | Xiaomi Buds 5 (argent titane) | i02.appmifile.com — `468_operatorx_operatorx_opx/26/09/2024/fa1b4874….png` (page mi.com/global/product/xiaomi-buds-5/specs) | 23/11/2026 |
| xb5pro.png | Xiaomi Buds 5 Pro (argent titane) | i02.appmifile.com — `240_operatorx_operatorx_opx/02/03/2025/535cc294….png` (page mi.com/global/product/xiaomi-buds-5-pro/specs) | 23/11/2026 |
| rb6pro.png | Redmi Buds 6 Pro (violet) | i02.appmifile.com — `964_operatorx_operatorx_opx/10/01/2025/659aea3c….png` (page mi.com/global/product/redmi-buds-6-pro/specs) | 23/11/2026 |
| redmibuds6.png | Redmi Buds 6 (vert menthe) | i02.appmifile.com — `679_operatorx_operatorx_opx/10/01/2025/85b0cae1….png` (page mi.com/global/product/redmi-buds-6/specs) | 23/11/2026 |
| rb6play.png | Redmi Buds 6 Play (blanc) | i02.appmifile.com — `640_operatorx_operatorx_opx/02/09/2024/2e17e2f7….png` (page mi.com/global/product/redmi-buds-6-play/specs) | 23/11/2026 |
| rb5pro.png | Redmi Buds 5 Pro (blanc) | i02.appmifile.com — `413_operatorx_operatorx_opx/11/01/2024/c4dc8c66….png` (page mi.com/global/product/redmi-buds-5-pro/specs) | 23/11/2026 |
| redmibuds5.png | Redmi Buds 5 (blanc) | i02.appmifile.com — `735_operatorx_operatorx_opx/11/01/2024/34bf6081….png` (page mi.com/global/product/redmi-buds-5/specs) | 23/11/2026 |
| xos.png | Xiaomi OpenWear Stereo (champagne) | i02.appmifile.com — `702_operatorx_operatorx_opx/08/07/2024/ca97ce9e….png` (page mi.com/global/product/xiaomi-openwear-stereo/ (og:image)) | 23/11/2026 |
| xws4.png | Xiaomi Watch S4 (argent, bracelet noir) | i02.appmifile.com — `228_operatorx_operatorx_opx/02/03/2025/5e807873….png` (page mi.com/global/product/xiaomi-watch-s4/specs) | 23/11/2026 |
| xiaomiwatch2.png | Xiaomi Watch 2 (argent, bracelet cuir beige) | i02.appmifile.com — `43_operatorx_operatorx_opx/26/09/2024/965f51d5….png` (page mi.com/global/product/xiaomi-watch-2/specs) | 23/11/2026 |
| redmiwatch5.png | Redmi Watch 5 (violet) | i02.appmifile.com — `550_operatorx_operatorx_opx/10/01/2025/3e4be707….png` (page mi.com/global/product/redmi-watch-5/specs) | 23/11/2026 |
| rw5lite.png | Redmi Watch 5 Lite (noir) | i02.appmifile.com — `730_operatorx_operatorx_opx/30/09/2024/22c7c2b7….png` (page mi.com/global/product/redmi-watch-5-lite/specs) | 23/11/2026 |
| rw5a.png | Redmi Watch 5 Active (noir) | i02.appmifile.com — `360_operatorx_operatorx_opx/30/09/2024/76038924….png` (page mi.com/global/product/redmi-watch-5-active/specs) | 23/11/2026 |
| xsb9pro.png | Xiaomi Smart Band 9 Pro (argent, bracelet beige) | i02.appmifile.com — `690_operatorx_operatorx_opx/03/03/2025/d0c5bef2….png` (page mi.com/global/product/xiaomi-smart-band-9-pro/specs) | 23/11/2026 |
| xsb9.png | Xiaomi Smart Band 9 (blanc) | i02.appmifile.com — `828_operatorx_operatorx_opx/26/09/2024/e4477095….png` (page mi.com/global/product/xiaomi-smart-band-9/specs) | 23/11/2026 |
| xsb8pro.png | Xiaomi Smart Band 8 Pro (noir) | i02.appmifile.com — `691_operatorx_operatorx_opx/23/02/2024/af5041d6….png` (page mi.com/global/product/xiaomi-smart-band-8-pro/ (og:image)) | 23/11/2026 |
| xws3.png | Xiaomi Watch S3 (argent, bracelet gris clair) | i02.appmifile.com — `563_operatorx_operatorx_opx/18/11/2024/f8bb3a1b….png` (page mi.com/global/product/xiaomi-watch-s3/ (og:image)) | 23/11/2026 |

## Limites connues

- `ipd`, `ip17` et `ip17e` : le visuel « comparateur » d'Apple ne dépasse pas 260 × 322 px de
  produit (le serveur ne l'agrandit pas). Le visuel « finish-select » de la page d'achat est un
  gros plan, inutilisable ici. La fiche produit n'affiche donc jamais un visuel au-delà de sa
  taille intrinsèque en pixels CSS (`noUpscale` de `ProductVisual`) : sans cette limite, `ip17`
  (286 × 348) et `ip17e` (284 × 340) seraient agrandis d'environ 1,5 fois. Sur écran haute
  densité (DPR 2), le rendu reste moins net : la source manque de pixels.
- `sb10` : 129 × 339 px seulement (produit de 103 × 313 px). Dans le cadre « bracelet » de 120 px
  de large, un écran DPR 2 demande 240 px : rendu agrandi d'environ 1,9 fois, donc moins net.
- `aw12` : la tuile « comparateur » est un carré blanc opaque ; le blanc est retiré avec un bord
  adouci (fond blanc retiré, étape 2), sans liseré clair sur les fonds noirs (carte Apple, tuile
  `apple-night`).
- `gwu2` : le bracelet sport vert vient de la galerie officielle de la référence Argent titane ;
  la fiche affiche les boîtiers argent et noir titane.
