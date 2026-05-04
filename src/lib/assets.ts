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

export const ASSETS = {
  adeIdle:      '/assets/ade/character/ade-idle.png',
  adeCurious:   '/assets/ade/character/ade-curious.png',
  adeScan:      '/assets/ade/character/ade-scan.png',
  adeHunt:      '/assets/ade/character/ade-hunt.png',
  adeFuse:      '/assets/ade/character/ade-fuse.png',
  adeInterpret: '/assets/ade/character/ade-interpret.png',
  adeArchive:   '/assets/ade/character/ade-archive.png',
  adeOffended:  '/assets/ade/character/ade-offended.png',
} as const;

/** Tipo de las 8 URLs canónicas de Ade. */
export type AdePoseUrl = (typeof ASSETS)[keyof typeof ASSETS];
