import type { Brand, DeviceKind } from "@/lib/brand-themes";
import type { CategorySlug, CompareGroup, ProductDetail, ProductSpecs } from "@/lib/catalog/types";

type Candidate = {
  name: string;
  brand: Brand;
  category: CategorySlug;
  year: number;
  price: number;
  features: string;
  source: string;
  specs?: Omit<Partial<ProductSpecs>, "specs_note">;
};

const candidates: readonly Candidate[] = [
  {
    name: "iPhone 16 Pro",
    brand: "apple",
    category: "smartphones",
    year: 2024,
    price: 850000,
    features:
      "Puce A18 Pro, Camera Control, appareil photo ultra grand-angle 48 Mpx et téléobjectif 5x.",
    source:
      "https://www.apple.com/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/",
    specs: { chip: "A18 Pro", main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 16 Pro Max",
    brand: "apple",
    category: "smartphones",
    year: 2024,
    price: 970000,
    features:
      "Puce A18 Pro, Camera Control, appareil photo ultra grand-angle 48 Mpx et téléobjectif 5x.",
    source:
      "https://www.apple.com/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/",
    specs: { chip: "A18 Pro", main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 16",
    brand: "apple",
    category: "smartphones",
    year: 2024,
    price: 660000,
    features: "Puce A18, Camera Control et appareil photo Fusion 48 Mpx.",
    source: "https://www.apple.com/newsroom/2024/09/apple-introduces-iphone-16-and-iphone-16-plus/",
    specs: { chip: "A18", main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 16 Plus",
    brand: "apple",
    category: "smartphones",
    year: 2024,
    price: 770000,
    features: "Puce A18, Camera Control et appareil photo Fusion 48 Mpx.",
    source: "https://www.apple.com/newsroom/2024/09/apple-introduces-iphone-16-and-iphone-16-plus/",
    specs: { chip: "A18", main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 15 Pro",
    brand: "apple",
    category: "smartphones",
    year: 2023,
    price: 740000,
    features: "Châssis en titane, bouton Action personnalisable et puce A17 Pro.",
    source:
      "https://www.apple.com/newsroom/2023/09/apple-unveils-iphone-15-pro-and-iphone-15-pro-max/",
    specs: { chip: "A17 Pro", has_5g: true },
  },
  {
    name: "iPhone 15 Pro Max",
    brand: "apple",
    category: "smartphones",
    year: 2023,
    price: 860000,
    features: "Châssis en titane, bouton Action personnalisable et puce A17 Pro.",
    source:
      "https://www.apple.com/newsroom/2023/09/apple-unveils-iphone-15-pro-and-iphone-15-pro-max/",
    specs: { chip: "A17 Pro", has_5g: true },
  },
  {
    name: "iPhone 15",
    brand: "apple",
    category: "smartphones",
    year: 2023,
    price: 600000,
    features: "Dynamic Island, appareil photo principal 48 Mpx et USB-C.",
    source: "https://www.apple.com/newsroom/2023/09/apple-debuts-iphone-15-and-iphone-15-plus/",
    specs: { main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 15 Plus",
    brand: "apple",
    category: "smartphones",
    year: 2023,
    price: 710000,
    features: "Dynamic Island, appareil photo principal 48 Mpx et USB-C.",
    source: "https://www.apple.com/newsroom/2023/09/apple-debuts-iphone-15-and-iphone-15-plus/",
    specs: { main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 14 Pro",
    brand: "apple",
    category: "smartphones",
    year: 2022,
    price: 700000,
    features: "Dynamic Island, écran toujours activé et appareil photo principal 48 Mpx.",
    source:
      "https://www.apple.com/newsroom/2022/09/apple-debuts-iphone-14-pro-and-iphone-14-pro-max/",
    specs: { main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 14 Pro Max",
    brand: "apple",
    category: "smartphones",
    year: 2022,
    price: 820000,
    features: "Dynamic Island, écran toujours activé et appareil photo principal 48 Mpx.",
    source:
      "https://www.apple.com/newsroom/2022/09/apple-debuts-iphone-14-pro-and-iphone-14-pro-max/",
    specs: { main_camera_mp: 48, has_5g: true },
  },
  {
    name: "iPhone 14",
    brand: "apple",
    category: "smartphones",
    year: 2022,
    price: 560000,
    features: "Détection des accidents, SOS d’urgence par satellite et puce A15 Bionic.",
    source: "https://www.apple.com/newsroom/2022/09/apple-introduces-iphone-14-and-iphone-14-plus/",
    specs: { chip: "A15 Bionic", has_5g: true },
  },
  {
    name: "iPhone 14 Plus",
    brand: "apple",
    category: "smartphones",
    year: 2022,
    price: 670000,
    features: "Détection des accidents, SOS d’urgence par satellite et puce A15 Bionic.",
    source: "https://www.apple.com/newsroom/2022/09/apple-introduces-iphone-14-and-iphone-14-plus/",
    specs: { chip: "A15 Bionic", has_5g: true },
  },
  {
    name: "iPhone 13 Pro",
    brand: "apple",
    category: "smartphones",
    year: 2021,
    price: 630000,
    features:
      "Écran ProMotion adaptatif jusqu’à 120 Hz, puce A15 Bionic et système photo à trois objectifs.",
    source:
      "https://www.apple.com/newsroom/2021/09/apple-unveils-iphone-13-pro-and-iphone-13-pro-max-more-pro-than-ever-before/",
    specs: { chip: "A15 Bionic", refresh_hz: 120, has_5g: true },
  },
  {
    name: "iPhone 13 Pro Max",
    brand: "apple",
    category: "smartphones",
    year: 2021,
    price: 740000,
    features:
      "Écran ProMotion adaptatif jusqu’à 120 Hz, puce A15 Bionic et système photo à trois objectifs.",
    source:
      "https://www.apple.com/newsroom/2021/09/apple-unveils-iphone-13-pro-and-iphone-13-pro-max-more-pro-than-ever-before/",
    specs: { chip: "A15 Bionic", refresh_hz: 120, has_5g: true },
  },
  {
    name: "iPhone 13",
    brand: "apple",
    category: "smartphones",
    year: 2021,
    price: 470000,
    features: "Mode Cinématique, double appareil photo et puce A15 Bionic.",
    source: "https://www.apple.com/newsroom/2021/09/apple-introduces-iphone-13-and-iphone-13-mini/",
    specs: { chip: "A15 Bionic", has_5g: true },
  },
  {
    name: "iPhone 13 mini",
    brand: "apple",
    category: "smartphones",
    year: 2021,
    price: 420000,
    features: "Mode Cinématique, double appareil photo et puce A15 Bionic.",
    source: "https://www.apple.com/newsroom/2021/09/apple-introduces-iphone-13-and-iphone-13-mini/",
    specs: { chip: "A15 Bionic", has_5g: true },
  },
  {
    name: "iPhone 12 Pro",
    brand: "apple",
    category: "smartphones",
    year: 2020,
    price: 500000,
    features: "Connectivité 5G, puce A14 Bionic et scanner LiDAR.",
    source:
      "https://www.apple.com/newsroom/2020/10/apple-introduces-iphone-12-pro-and-iphone-12-pro-max-with-5g/",
    specs: { chip: "A14 Bionic", has_5g: true },
  },
  {
    name: "iPhone 12 Pro Max",
    brand: "apple",
    category: "smartphones",
    year: 2020,
    price: 590000,
    features: "Connectivité 5G, puce A14 Bionic et scanner LiDAR.",
    source:
      "https://www.apple.com/newsroom/2020/10/apple-introduces-iphone-12-pro-and-iphone-12-pro-max-with-5g/",
    specs: { chip: "A14 Bionic", has_5g: true },
  },
  {
    name: "AirPods 4",
    brand: "apple",
    category: "ecouteurs",
    year: 2024,
    price: 100000,
    features: "Conception ouverte, puce H2 et audio spatial personnalisé.",
    source:
      "https://www.apple.com/newsroom/2024/09/apple-introduces-airpods-4-and-a-hearing-health-experience-with-airpods-pro-2/",
  },
  {
    name: "AirPods 4 avec réduction active du bruit",
    brand: "apple",
    category: "ecouteurs",
    year: 2024,
    price: 145000,
    features: "Réduction active du bruit et mode Transparence dans un format ouvert.",
    source:
      "https://www.apple.com/newsroom/2024/09/apple-introduces-airpods-4-and-a-hearing-health-experience-with-airpods-pro-2/",
    specs: { has_anc: true },
  },
  {
    name: "AirPods Pro (2e génération)",
    brand: "apple",
    category: "ecouteurs",
    year: 2022,
    price: 180000,
    features:
      "Puce H2, réduction active du bruit améliorée, mode Transparence et audio spatial personnalisé.",
    source:
      "https://www.apple.com/newsroom/2022/09/apple-announces-the-next-generation-of-airpods-pro/",
    specs: { has_anc: true },
  },
  {
    name: "Apple Watch Ultra 2",
    brand: "apple",
    category: "montres",
    year: 2023,
    price: 540000,
    features:
      "Puce S9 SiP, geste Double Tap, Siri sur l’appareil et jusqu’à 36 heures d’autonomie.",
    source: "https://www.apple.com/newsroom/2023/09/apple-unveils-apple-watch-ultra-2/",
    specs: { chip: "S9 SiP", autonomy_hours: 36 },
  },
  {
    name: "Galaxy S25",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 800000,
    features:
      "Snapdragon 8 Elite for Galaxy, appareil photo principal 50 Mpx et résistance à l’eau IP68.",
    source: "https://www.samsung.com/us/smartphones/galaxy-s25/",
    specs: {
      chip: "Snapdragon 8 Elite for Galaxy",
      main_camera_mp: 50,
      ip_rating: "IP68",
      has_5g: true,
    },
  },
  {
    name: "Galaxy S25+",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 960000,
    features: "Écran 6,7 pouces, batterie 4 900 mAh et résistance à l’eau IP68.",
    source: "https://www.samsung.com/us/smartphones/galaxy-s25/",
    specs: { screen_size_in: 6.7, battery_mah: 4900, ip_rating: "IP68", has_5g: true },
  },
  {
    name: "Galaxy S25 Ultra",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 1200000,
    features: "Appareil photo principal 200 Mpx, châssis en titane et S Pen intégré.",
    source: "https://www.samsung.com/us/smartphones/galaxy-s25-ultra/",
    specs: { main_camera_mp: 200, ip_rating: "IP68", has_5g: true },
  },
  {
    name: "Galaxy S25 Edge",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 1050000,
    features: "Châssis en titane de 5,8 mm et 163 g, appareil photo principal 200 Mpx.",
    source: "https://www.samsung.com/us/smartphones/galaxy-s25-edge/",
    specs: { main_camera_mp: 200, has_5g: true },
  },
  {
    name: "Galaxy S26+",
    brand: "samsung",
    category: "smartphones",
    year: 2026,
    price: 1020000,
    features:
      "Châssis de 7,3 mm et 190 g, appareil photo principal 50 Mpx et jusqu’à 31 heures de lecture vidéo.",
    source: "https://www.samsung.com/us/smartphones/galaxy-s26/",
    specs: { main_camera_mp: 50, autonomy_hours: 31, has_5g: true },
  },
  {
    name: "Galaxy S26 FE",
    brand: "samsung",
    category: "smartphones",
    year: 2026,
    price: 720000,
    features: "Écran FHD+ 6,7 pouces à 120 Hz, batterie 4 900 mAh et certification IP68.",
    source: "https://www.samsung.com/us/smartphones/galaxy-s26-fe/",
    specs: {
      screen_size_in: 6.7,
      refresh_hz: 120,
      battery_mah: 4900,
      ip_rating: "IP68",
      has_5g: true,
    },
  },
  {
    name: "Galaxy Z Fold8 Ultra",
    brand: "samsung",
    category: "smartphones",
    year: 2026,
    price: 1900000,
    features:
      "Épaisseur de 4,1 mm ouvert, poids de 215 g, batterie 5 000 mAh et Snapdragon 8 Elite Gen 5 for Galaxy.",
    source: "https://www.samsung.com/us/smartphones/galaxy-z-fold8-ultra/",
    specs: { chip: "Snapdragon 8 Elite Gen 5 for Galaxy", battery_mah: 5000, has_5g: true },
  },
  {
    name: "Galaxy Z Fold7",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 1800000,
    features: "Appareil photo principal 200 Mpx, format pliable fin et léger, batterie 4 400 mAh.",
    source: "https://www.samsung.com/us/smartphones/galaxy-z-fold7/",
    specs: { main_camera_mp: 200, battery_mah: 4400, has_5g: true },
  },
  {
    name: "Galaxy Z Flip7",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 1050000,
    features: "Écran FlexWindow de 4,1 pouces, appareil photo 50 Mpx et batterie 4 300 mAh.",
    source: "https://www.samsung.com/us/smartphones/galaxy-z-flip7/",
    specs: { screen_size_in: 4.1, main_camera_mp: 50, battery_mah: 4300, has_5g: true },
  },
  {
    name: "Galaxy Z Flip7 FE",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 850000,
    features:
      "Appareils photo arrière grand-angle 50 Mpx et ultra grand-angle 12 Mpx, conception pliable Flex.",
    source: "https://www.samsung.com/us/smartphones/galaxy-z-flip7-fe/",
    specs: { main_camera_mp: 50, has_5g: true },
  },
  {
    name: "Galaxy S23 FE",
    brand: "samsung",
    category: "smartphones",
    year: 2023,
    price: 550000,
    features:
      "Appareil photo 50 Mpx, écran Dynamic AMOLED 2X adaptatif 120 Hz et certification IP68.",
    source: "https://www.samsung.com/us/smartphones/galaxy-s23-fe/",
    specs: { main_camera_mp: 50, refresh_hz: 120, ip_rating: "IP68", has_5g: true },
  },
  {
    name: "Galaxy A56 5G",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 500000,
    features: "Écran Super AMOLED FHD+ 6,7 pouces, appareil photo 50 Mpx et protection IP67.",
    source: "https://www.samsung.com/us/smartphones/galaxy-a56-5g/",
    specs: {
      screen_size_in: 6.7,
      screen_tech: "Super AMOLED",
      main_camera_mp: 50,
      ip_rating: "IP67",
      has_5g: true,
    },
  },
  {
    name: "Galaxy A36 5G",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 420000,
    features: "Écran Super AMOLED FHD+ 6,7 pouces à 120 Hz et batterie 5 000 mAh.",
    source: "https://www.samsung.com/us/smartphones/galaxy-a36-5g/",
    specs: {
      screen_size_in: 6.7,
      screen_tech: "Super AMOLED",
      refresh_hz: 120,
      battery_mah: 5000,
      has_5g: true,
    },
  },
  {
    name: "Galaxy A37 5G",
    brand: "samsung",
    category: "smartphones",
    year: 2026,
    price: 460000,
    features:
      "Appareils photo arrière grand-angle 50 Mpx, ultra grand-angle 8 Mpx et macro 5 Mpx, certification IP68.",
    source: "https://www.samsung.com/us/smartphones/galaxy-a37-5g/",
    specs: { main_camera_mp: 50, ip_rating: "IP68", has_5g: true },
  },
  {
    name: "Galaxy A27 5G",
    brand: "samsung",
    category: "smartphones",
    year: 2026,
    price: 350000,
    features:
      "Écran Super AMOLED FHD+ 6,7 pouces, Snapdragon 6 Gen 3 et appareil photo arrière 50 Mpx.",
    source: "https://www.samsung.com/us/smartphones/galaxy-a27-5g/",
    specs: {
      screen_size_in: 6.7,
      screen_tech: "Super AMOLED",
      chip: "Snapdragon 6 Gen 3",
      main_camera_mp: 50,
      has_5g: true,
    },
  },
  {
    name: "Galaxy A17 5G",
    brand: "samsung",
    category: "smartphones",
    year: 2025,
    price: 280000,
    features:
      "Écran Super AMOLED FHD+ 6,7 pouces, protection IP54 et stabilisation optique de l’image.",
    source: "https://www.samsung.com/us/smartphones/galaxy-a17-5g/",
    specs: { screen_size_in: 6.7, screen_tech: "Super AMOLED", ip_rating: "IP54", has_5g: true },
  },
  {
    name: "Galaxy Watch8",
    brand: "samsung",
    category: "montres",
    year: 2025,
    price: 420000,
    features: "Boîtier Cushion, bracelets Dynamic Lug, coaching du sommeil et Running Coach.",
    source: "https://www.samsung.com/us/watches/galaxy-watch8/",
  },
  {
    name: "Galaxy Watch8 Classic",
    brand: "samsung",
    category: "montres",
    year: 2025,
    price: 530000,
    features: "Lunette rotative, Quick Button et système de bracelets Dynamic Lug.",
    source: "https://www.samsung.com/us/watches/galaxy-watch8-classic/",
  },
  {
    name: "Galaxy Watch7",
    brand: "samsung",
    category: "montres",
    year: 2024,
    price: 330000,
    features:
      "Processeur gravé en 3 nm, détection de l’apnée du sommeil et Energy Score Galaxy AI.",
    source: "https://www.samsung.com/us/watches/galaxy-watch7/",
  },
  {
    name: "Galaxy Watch Ultra",
    brand: "samsung",
    category: "montres",
    year: 2024,
    price: 650000,
    features:
      "Boîtier en titane, GPS double fréquence et mode économie d’énergie annoncé jusqu’à 100 heures.",
    source: "https://www.samsung.com/us/watches/galaxy-watch-ultra/",
    specs: { autonomy_hours: 100 },
  },
  {
    name: "Galaxy Buds3 FE",
    brand: "samsung",
    category: "ecouteurs",
    year: 2025,
    price: 135000,
    features: "Haut-parleurs de 11 mm, réduction active du bruit et audio 360.",
    source: "https://www.samsung.com/us/mobile-audio/galaxy-buds3-fe/",
    specs: { has_anc: true },
  },
  {
    name: "Xiaomi 15",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 720000,
    features: "Optique Leica Summilux, Snapdragon 8 Elite et écran AMOLED 1–120 Hz.",
    source: "https://www.mi.com/global/product/xiaomi-15/",
    specs: { chip: "Snapdragon 8 Elite", screen_tech: "AMOLED", refresh_hz: 120, has_5g: true },
  },
  {
    name: "Xiaomi 15 Ultra",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 1050000,
    features: "Capteur principal Leica 1 pouce, téléobjectif 200 Mpx et Snapdragon 8 Elite.",
    source: "https://www.mi.com/global/product/xiaomi-15-ultra/",
    specs: { chip: "Snapdragon 8 Elite", main_camera_mp: 200, has_5g: true },
  },
  {
    name: "Xiaomi 14 Ultra",
    brand: "xiaomi",
    category: "smartphones",
    year: 2024,
    price: 990000,
    features:
      "Appareil photo principal Leica 1 pouce à ouverture variable, périscope 120 mm et écran AMOLED 1–120 Hz.",
    source: "https://www.mi.com/global/product/xiaomi-14-ultra/",
    specs: { screen_tech: "AMOLED", refresh_hz: 120, has_5g: true },
  },
  {
    name: "Xiaomi 14",
    brand: "xiaomi",
    category: "smartphones",
    year: 2024,
    price: 700000,
    features: "Optique Leica Summilux, téléobjectif flottant 75 mm et Snapdragon 8 Gen 3.",
    source: "https://www.mi.com/global/product/xiaomi-14/",
    specs: { chip: "Snapdragon 8 Gen 3", has_5g: true },
  },
  {
    name: "Xiaomi 14T Pro",
    brand: "xiaomi",
    category: "smartphones",
    year: 2024,
    price: 720000,
    features: "Optique Leica, Dimensity 9300+ et charge HyperCharge 120 W filaire / 50 W sans fil.",
    source: "https://www.mi.com/global/product/xiaomi-14t-pro/",
    specs: { chip: "Dimensity 9300+", charging_w: 120, has_5g: true },
  },
  {
    name: "Xiaomi 14T",
    brand: "xiaomi",
    category: "smartphones",
    year: 2024,
    price: 570000,
    features: "Optique Leica Summilux, écran 144 Hz, batterie 5 000 mAh et charge 67 W.",
    source: "https://www.mi.com/global/product/xiaomi-14t/",
    specs: { refresh_hz: 144, battery_mah: 5000, charging_w: 67, has_5g: true },
  },
  {
    name: "Redmi Note 14 Pro+ 5G",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 450000,
    features: "Appareil photo principal 200 Mpx avec OIS, Snapdragon 7s Gen 3 et charge 120 W.",
    source: "https://www.mi.com/global/product/redmi-note-14-pro-plus-5g/",
    specs: { chip: "Snapdragon 7s Gen 3", main_camera_mp: 200, charging_w: 120, has_5g: true },
  },
  {
    name: "Redmi Note 14 Pro 5G",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 380000,
    features:
      "Appareil photo principal 200 Mpx avec OIS, Dimensity 7300-Ultra et écran 1,5K à 120 Hz.",
    source: "https://www.mi.com/global/product/redmi-note-14-pro-5g/",
    specs: { chip: "Dimensity 7300-Ultra", main_camera_mp: 200, refresh_hz: 120, has_5g: true },
  },
  {
    name: "Redmi Note 14 5G",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 260000,
    features: "Appareil photo principal 108 Mpx avec OIS, Dimensity 7025-Ultra et écran 120 Hz.",
    source: "https://www.mi.com/global/product/redmi-note-14-5g/",
    specs: { chip: "Dimensity 7025-Ultra", main_camera_mp: 108, refresh_hz: 120, has_5g: true },
  },
  {
    name: "POCO F7 Ultra",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 650000,
    features:
      "Snapdragon 8 Elite, charge 120 W filaire / 50 W sans fil et écran AMOLED 2K à 120 Hz.",
    source: "https://www.mi.com/global/product/poco-f7-ultra/",
    specs: {
      chip: "Snapdragon 8 Elite",
      screen_tech: "AMOLED",
      refresh_hz: 120,
      charging_w: 120,
      has_5g: true,
    },
  },
  {
    name: "POCO F7 Pro",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 520000,
    features: "Snapdragon 8 Gen 3, batterie 6 000 mAh, charge 90 W et écran AMOLED 2K à 120 Hz.",
    source: "https://www.mi.com/global/product/poco-f7-pro/",
    specs: {
      chip: "Snapdragon 8 Gen 3",
      battery_mah: 6000,
      charging_w: 90,
      refresh_hz: 120,
      has_5g: true,
    },
  },
  {
    name: "POCO X7 Pro",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 390000,
    features:
      "Dimensity 8400-Ultra, batterie 6 000 mAh avec charge 90 W et écran AMOLED 1,5K à 120 Hz.",
    source: "https://www.mi.com/global/product/poco-x7-pro/",
    specs: {
      chip: "Dimensity 8400-Ultra",
      battery_mah: 6000,
      charging_w: 90,
      refresh_hz: 120,
      has_5g: true,
    },
  },
  {
    name: "POCO X7",
    brand: "xiaomi",
    category: "smartphones",
    year: 2025,
    price: 280000,
    features:
      "Dimensity 7300-Ultra, écran AMOLED incurvé 1,5K à 120 Hz et appareil photo principal 50 Mpx avec OIS.",
    source: "https://www.mi.com/global/product/poco-x7/",
    specs: { chip: "Dimensity 7300-Ultra", main_camera_mp: 50, refresh_hz: 120, has_5g: true },
  },
  {
    name: "Xiaomi Buds 5",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2024,
    price: 115000,
    features:
      "AptX Lossless et Hi-Res Audio, transducteur dynamique à double aimant de 11 mm, trois micros pour les appels.",
    source: "https://www.mi.com/global/product/xiaomi-buds-5/",
  },
  {
    name: "Xiaomi Buds 5 Pro",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2025,
    price: 180000,
    features:
      "Triple transducteur coaxial à double amplificateur, aptX Lossless et réduction active du bruit jusqu’à 55 dB.",
    source: "https://www.mi.com/global/product/xiaomi-buds-5-pro/",
    specs: { has_anc: true },
  },
  {
    name: "Redmi Buds 6 Pro",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2024,
    price: 95000,
    features:
      "Hi-Res Audio avec LDAC, réduction active du bruit jusqu’à 55 dB et audio dimensionnel avec suivi de tête.",
    source: "https://www.mi.com/global/product/redmi-buds-6-pro/",
    specs: { has_anc: true },
  },
  {
    name: "Redmi Buds 6",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2024,
    price: 65000,
    features:
      "Architecture acoustique à deux transducteurs, réduction active du bruit jusqu’à 49 dB et jusqu’à 42 h avec l’étui.",
    source: "https://www.mi.com/global/product/redmi-buds-6/",
    specs: { has_anc: true, autonomy_hours: 42 },
  },
  {
    name: "Redmi Buds 6 Play",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2024,
    price: 30000,
    features:
      "Transducteur dynamique de 10 mm, jusqu’à 36 h avec l’étui et réduction du bruit par IA pour les appels.",
    source: "https://www.mi.com/global/product/redmi-buds-6-play/",
    specs: { autonomy_hours: 36 },
  },
  {
    name: "Redmi Buds 5 Pro",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2023,
    price: 80000,
    features:
      "Hi-Res Audio Wireless avec LDAC, réduction active du bruit jusqu’à 52 dB et jusqu’à 38 h avec l’étui.",
    source: "https://www.mi.com/global/product/redmi-buds-5-pro/",
    specs: { has_anc: true, autonomy_hours: 38 },
  },
  {
    name: "Redmi Buds 5",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2023,
    price: 55000,
    features:
      "Transducteur dynamique de 12,4 mm, réduction active du bruit jusqu’à 46 dB et jusqu’à 40 h avec l’étui.",
    source: "https://www.mi.com/global/product/redmi-buds-5/",
    specs: { has_anc: true, autonomy_hours: 40 },
  },
  {
    name: "Xiaomi OpenWear Stereo",
    brand: "xiaomi",
    category: "ecouteurs",
    year: 2024,
    price: 145000,
    features:
      "Conception ouverte, audio Hi-Res, transducteur dynamique 17 × 12 mm et jusqu’à 38,5 h avec l’étui.",
    source: "https://www.mi.com/global/product/xiaomi-openwear-stereo/",
    specs: { autonomy_hours: 38.5 },
  },
  {
    name: "Xiaomi Watch S4",
    brand: "xiaomi",
    category: "montres",
    year: 2024,
    price: 190000,
    features:
      "Écran AMOLED de 1,43 pouce, plus de 150 modes sportifs et autonomie annoncée jusqu’à 15 jours.",
    source: "https://www.mi.com/global/product/xiaomi-watch-s4/",
    specs: { screen_size_in: 1.43, screen_tech: "AMOLED", autonomy_hours: 360 },
  },
  {
    name: "Xiaomi Watch 2",
    brand: "xiaomi",
    category: "montres",
    year: 2024,
    price: 220000,
    features: "Wear OS, plateforme Snapdragon W5+ Gen 1, GNSS L1+L5 et stockage 32 Go.",
    source: "https://www.mi.com/global/product/xiaomi-watch-2/",
    specs: { chip: "Snapdragon W5+ Gen 1" },
  },
  {
    name: "Redmi Watch 5",
    brand: "xiaomi",
    category: "montres",
    year: 2024,
    price: 115000,
    features:
      "Écran AMOLED de 2,07 pouces, GNSS intégré à cinq systèmes et autonomie annoncée jusqu’à 24 jours.",
    source: "https://www.mi.com/global/product/redmi-watch-5/",
    specs: { screen_size_in: 2.07, screen_tech: "AMOLED", autonomy_hours: 576 },
  },
  {
    name: "Redmi Watch 5 Lite",
    brand: "xiaomi",
    category: "montres",
    year: 2024,
    price: 75000,
    features:
      "Écran AMOLED de 1,96 pouce, GNSS à cinq systèmes, appels Bluetooth et jusqu’à 18 jours d’autonomie.",
    source: "https://www.mi.com/global/product/redmi-watch-5-lite/",
    specs: { screen_size_in: 1.96, screen_tech: "AMOLED", autonomy_hours: 432 },
  },
  {
    name: "Redmi Watch 5 Active",
    brand: "xiaomi",
    category: "montres",
    year: 2024,
    price: 55000,
    features:
      "Écran LCD de 2 pouces, appels Bluetooth, résistance 5 ATM et plus de 140 modes d’entraînement.",
    source: "https://www.mi.com/global/product/redmi-watch-5-active/",
    specs: { screen_size_in: 2, screen_tech: "LCD", ip_rating: "5 ATM" },
  },
  {
    name: "Xiaomi Smart Band 9 Pro",
    brand: "xiaomi",
    category: "bracelets",
    year: 2024,
    price: 95000,
    features:
      "Écran de 1,74 pouce, GNSS intégré, plus de 150 modes sportifs et jusqu’à 21 jours d’autonomie.",
    source: "https://www.mi.com/global/product/xiaomi-smart-band-9-pro/",
    specs: { screen_size_in: 1.74, autonomy_hours: 504 },
  },
  {
    name: "Xiaomi Smart Band 9",
    brand: "xiaomi",
    category: "bracelets",
    year: 2024,
    price: 55000,
    features:
      "Plus de 150 modes sportifs, suivi du sommeil et autonomie annoncée jusqu’à 21 jours.",
    source: "https://www.mi.com/global/product/xiaomi-smart-band-9/",
    specs: { autonomy_hours: 504 },
  },
  {
    name: "Xiaomi Smart Band 8 Pro",
    brand: "xiaomi",
    category: "bracelets",
    year: 2024,
    price: 80000,
    features:
      "Écran AMOLED de 1,74 pouce, GNSS intégré, plus de 150 modes sportifs et résistance 5 ATM.",
    source: "https://www.mi.com/global/product/xiaomi-smart-band-8-pro/",
    specs: { screen_size_in: 1.74, screen_tech: "AMOLED", ip_rating: "5 ATM" },
  },
  {
    name: "Xiaomi Watch S3",
    brand: "xiaomi",
    category: "montres",
    year: 2023,
    price: 170000,
    features:
      "Écran AMOLED de 1,43 pouce, lunette interchangeable, GNSS double bande L1+L5 et plus de 150 modes sportifs.",
    source: "https://www.mi.com/global/product/xiaomi-watch-s3/",
    specs: { screen_size_in: 1.43, screen_tech: "AMOLED" },
  },
];

const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, " plus ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const productCode = (name: string) => {
  const normalized = slugify(name).replaceAll("-", "");
  if (normalized.length <= 12) return normalized;
  return slugify(name)
    .split("-")
    .map((part, index, parts) => {
      if (/\d/.test(part)) return part;
      if (index === parts.length - 1 && part.length <= 4) return part;
      return part[0];
    })
    .join("");
};

const categoryDetails: Record<
  CategorySlug,
  { compare_group: CompareGroup; visual_kind: DeviceKind }
> = {
  smartphones: { compare_group: "phones", visual_kind: "phone" },
  ecouteurs: { compare_group: "audio", visual_kind: "buds" },
  montres: { compare_group: "wearables", visual_kind: "watch" },
  bracelets: { compare_group: "wearables", visual_kind: "band" },
};

const brandNames: Record<Brand, string> = {
  apple: "Apple",
  samsung: "Samsung",
  xiaomi: "Xiaomi",
};

export const additionalProducts: readonly ProductDetail[] = candidates.map((candidate, index) => {
  const slug = slugify(candidate.name);
  const code = productCode(candidate.name);
  const brandName = brandNames[candidate.brand];
  const releaseDate = `${candidate.year}-01-01`;
  const specs: ProductSpecs = {
    ...candidate.specs,
    specs_note:
      "Caractéristiques issues de la fiche officielle ; prix indicatif estimé pour ce projet pédagogique.",
  };
  const category = categoryDetails[candidate.category];
  const visualKind: DeviceKind =
    candidate.category === "montres" &&
    (candidate.brand === "samsung" ||
      ["Xiaomi Watch S4", "Xiaomi Watch 2", "Xiaomi Watch S3"].includes(candidate.name))
      ? "round"
      : category.visual_kind;

  return {
    id: `00000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`,
    code,
    slug,
    name: candidate.name,
    tagline: candidate.features,
    description: `Modèle ${candidate.year}. ${candidate.features}`,
    brand_slug: candidate.brand,
    brand_name: brandName,
    category_slug: candidate.category,
    compare_group: category.compare_group,
    visual_kind: visualKind,
    release_date: releaseDate,
    new_until: addDays(releaseDate, 90),
    warranty_months: 12,
    compat:
      candidate.brand === "apple" && candidate.category === "smartphones"
        ? ["ios"]
        : candidate.category === "ecouteurs"
          ? ["ios", "android"]
          : candidate.brand === "apple"
            ? ["ios"]
            : ["android", "ios"],
    min_price_fcfa: candidate.price,
    max_price_fcfa: candidate.price,
    in_stock: true,
    image_src: null,
    image_width: null,
    image_height: null,
    image_alt: null,
    variants: [
      {
        sku: `${code.toUpperCase()}-DEM`,
        color_name: "Coloris indicatif",
        color_slug: "indicatif",
        color_hex: null,
        storage_gb: null,
        size_mm: null,
        price_fcfa: candidate.price,
        stock: 18,
        low_stock_threshold: 3,
        is_default: true,
        is_active: true,
        position: 0,
      },
    ],
    specs,
  };
});

export const additionalProductSources = candidates.map((candidate) => ({
  code: productCode(candidate.name),
  name: candidate.name,
  brand: candidate.brand,
  url: candidate.source,
}));
