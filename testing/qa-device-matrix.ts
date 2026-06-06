export type QaDeviceGroup =
  | "desktop"
  | "tablet"
  | "large-tablet"
  | "mobile"
  | "foldable";

export type QaDeviceOrientation = "landscape" | "portrait";

export type QaDevice = {
  slug: string;
  name: string;
  group: QaDeviceGroup;
  width: number;
  height: number;
  orientation: QaDeviceOrientation;
  hasTouch: boolean;
  isMobile: boolean;
};

export const QA_DEVICE_MATRIX = [
  {
    slug: "desktop-1280x720",
    name: "Desktop 1280x720",
    group: "desktop",
    width: 1280,
    height: 720,
    orientation: "landscape",
    hasTouch: false,
    isMobile: false,
  },
  {
    slug: "desktop-1366x768",
    name: "Desktop 1366x768",
    group: "desktop",
    width: 1366,
    height: 768,
    orientation: "landscape",
    hasTouch: false,
    isMobile: false,
  },
  {
    slug: "desktop-1440x900",
    name: "Desktop 1440x900",
    group: "desktop",
    width: 1440,
    height: 900,
    orientation: "landscape",
    hasTouch: false,
    isMobile: false,
  },
  {
    slug: "desktop-1920x1080",
    name: "Desktop 1920x1080",
    group: "desktop",
    width: 1920,
    height: 1080,
    orientation: "landscape",
    hasTouch: false,
    isMobile: false,
  },
  {
    slug: "ipad-mini-portrait",
    name: "iPad Mini Portrait",
    group: "tablet",
    width: 768,
    height: 1024,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "ipad-mini-landscape",
    name: "iPad Mini Landscape",
    group: "tablet",
    width: 1024,
    height: 768,
    orientation: "landscape",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "ipad-air-pro-11-portrait",
    name: "iPad Air / Pro 11 Portrait",
    group: "tablet",
    width: 834,
    height: 1194,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "ipad-air-pro-11-landscape",
    name: "iPad Air / Pro 11 Landscape",
    group: "tablet",
    width: 1194,
    height: 834,
    orientation: "landscape",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "ipad-pro-12-9-portrait",
    name: "iPad Pro 12.9 Portrait",
    group: "large-tablet",
    width: 1024,
    height: 1366,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "ipad-pro-12-9-landscape",
    name: "iPad Pro 12.9 Landscape",
    group: "large-tablet",
    width: 1366,
    height: 1024,
    orientation: "landscape",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "android-tablet-portrait",
    name: "Android Tablet Portrait",
    group: "large-tablet",
    width: 800,
    height: 1280,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "android-tablet-landscape",
    name: "Android Tablet Landscape",
    group: "large-tablet",
    width: 1280,
    height: 800,
    orientation: "landscape",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "iphone-se",
    name: "iPhone SE",
    group: "mobile",
    width: 375,
    height: 667,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "iphone-15",
    name: "iPhone 15",
    group: "mobile",
    width: 393,
    height: 852,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    group: "mobile",
    width: 430,
    height: 932,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "pixel-8",
    name: "Pixel 8",
    group: "mobile",
    width: 412,
    height: 915,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "galaxy-fold-closed",
    name: "Galaxy Fold Closed",
    group: "foldable",
    width: 344,
    height: 882,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "galaxy-fold-open-portrait",
    name: "Galaxy Fold Open Portrait",
    group: "foldable",
    width: 673,
    height: 841,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "galaxy-fold-open-landscape",
    name: "Galaxy Fold Open Landscape",
    group: "foldable",
    width: 841,
    height: 673,
    orientation: "landscape",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "pixel-fold-portrait",
    name: "Pixel Fold Portrait",
    group: "foldable",
    width: 485,
    height: 998,
    orientation: "portrait",
    hasTouch: true,
    isMobile: true,
  },
  {
    slug: "pixel-fold-landscape",
    name: "Pixel Fold Landscape",
    group: "foldable",
    width: 998,
    height: 485,
    orientation: "landscape",
    hasTouch: true,
    isMobile: true,
  },
] as const satisfies readonly QaDevice[];

export const QA_DEVICE_GROUPS: QaDeviceGroup[] = [
  "desktop",
  "tablet",
  "large-tablet",
  "mobile",
  "foldable",
];

export function getQaDevicesByGroup(group: QaDeviceGroup) {
  return QA_DEVICE_MATRIX.filter((device) => device.group === group);
}
