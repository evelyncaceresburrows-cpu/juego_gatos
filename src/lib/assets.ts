// src/lib/assets.ts
//
// Sistema visual de Ade — interfaz cognitiva.
// Cada pose mapea a una función mental distinta del flujo del juego, no
// es decoración. Los archivos viven en public/assets/ade/character/ y
// se sirven con su path literal (sin hashing de Vite) para que sean
// fáciles de referenciar desde strings y reemplazar sin rebuild.
//
// Mapping conceptual:
//   adeIdle      → reposo (Home, antes de despertar)
//   adeCurious   → curiosidad inicial (Home, al despertar a Ade)
//   adeScan      → detección / anticipación (base del gameplay)
//   adeHunt      → captura / acción (al click en chispa)
//   adeFuse      → fusión de ideas (FusionRonda)
//   adeInterpret → lectura final / interpretación (GameOver)
//   adeArchive   → bitácora / memoria (Journal con ideas)
//   adeOffended  → vacío / sin actividad (Journal sin ideas)
//
// Auditoría §3.9 — PNG → WebP. Los 8 sprites pasaron de 17 MB a 1.3 MB
// total (92% reducción). Apuntamos a .webp por defecto. Los .png siguen
// en disco como fallback histórico — todos los browsers modernos
// (Safari 14+, Chrome 32+, Firefox 65+) soportan WebP nativo.

export const ASSETS = {
  adeIdle:      '/assets/ade/character/ade-idle.webp',
  adeCurious:   '/assets/ade/character/ade-curious.webp',
  adeScan:      '/assets/ade/character/ade-scan.webp',
  adeHunt:      '/assets/ade/character/ade-hunt.webp',
  adeFuse:      '/assets/ade/character/ade-fuse.webp',
  adeInterpret: '/assets/ade/character/ade-interpret.webp',
  adeArchive:   '/assets/ade/character/ade-archive.webp',
  adeOffended:  '/assets/ade/character/ade-offended.webp',
} as const;

/** Tipo de las 8 URLs canónicas de Ade. */
export type AdePoseUrl = (typeof ASSETS)[keyof typeof ASSETS];
