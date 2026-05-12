// src/systems/modos.ts
//
// Fase 3.1 — Modos de juego.
//
// Las 8 chispas canónicas (caos, eco, deseo, ritual, brillo, ruido,
// secreto, error) son la psicología interna que se mide en el perfil
// y se fusiona en la ronda 2. Pero esos NOMBRES son demasiado abstractos
// para algunos contextos: alguien que viene a usar Ade para pensar el
// negocio quiere ver "PIVOT", no "CAOS".
//
// Solución: cada modo de juego define su propio vocabulario (las palabras
// que aparecen como chispas) pero cada palabra está tagged con su
// TipoChispa canónica. Así el perfil sigue midiendo lo mismo bajo capó,
// pero la superficie habla el idioma del usuario.
//
// 5 modos en V1:
//   • Creatividad → vocabulario original (CAOS, ECO, BRILLO, …) — default
//   • Negocio     → PIVOT, MÉTRICA, TRACTION, FRICCIÓN…
//   • Ansiedad    → RESPIRO, PRESENTE, SOLTAR, AHORA… (tono más suave)
//   • Decisiones  → SÍ, NO, COSTO, RIESGO, INTUICIÓN…
//   • Random      → mezcla los 4 pools
//
// Persistencia: el último modo elegido vive en localStorage para
// recuperarse al volver. Default: creatividad.

import type { TipoChispa } from './adeProfile';

export interface PalabraModo {
  // La palabra que se muestra en pantalla (uppercase, ya formateada).
  word: string;
  // Tipo canónico al que mapea para el perfil + las fusiones.
  tipo: TipoChispa;
}

export type ModoJuegoId =
  | 'creatividad'
  | 'negocio'
  | 'ansiedad'
  | 'decisiones'
  | 'random';

export interface ModoJuego {
  id: ModoJuegoId;
  label: string;
  // Tagline corto (biblia tone) que aparece debajo del nombre en el
  // selector de Home. Sin promesa, sin felicitación.
  tagline: string;
  palabras: PalabraModo[];
}

// ─── Pools ────────────────────────────────────────────────────────────

// Default. Las 8 canónicas tal cual (alma sec.2).
const PALABRAS_CREATIVIDAD: PalabraModo[] = [
  { word: 'CAOS',    tipo: 'caos'    },
  { word: 'ECO',     tipo: 'eco'     },
  { word: 'DESEO',   tipo: 'deseo'   },
  { word: 'RITUAL',  tipo: 'ritual'  },
  { word: 'BRILLO',  tipo: 'brillo'  },
  { word: 'RUIDO',   tipo: 'ruido'   },
  { word: 'SECRETO', tipo: 'secreto' },
  { word: 'ERROR',   tipo: 'error'   },
];

// Vocabulario startup/producto. Cada uno tiene una correspondencia
// natural con la psicología de Ade (no son arbitrarios).
const PALABRAS_NEGOCIO: PalabraModo[] = [
  { word: 'PIVOT',     tipo: 'caos'    }, // ruptura intencional
  { word: 'MÉTRICA',   tipo: 'eco'     }, // lo que se repite y se ve
  { word: 'ESCALAR',   tipo: 'deseo'   }, // el querer crecer
  { word: 'PROCESO',   tipo: 'ritual'  }, // forma que sostiene
  { word: 'TRACTION',  tipo: 'brillo'  }, // primera luz que llega
  { word: 'FRICCIÓN',  tipo: 'ruido'   }, // lo que distorsiona
  { word: 'INSIGHT',   tipo: 'secreto' }, // lo que estaba oculto
  { word: 'CHURN',     tipo: 'error'   }, // lo que se rompe
];

// Tono más suave. Vocabulario para pensar el cuerpo y el momento.
// Aún así son chispas canónicas adentro: cada práctica mapea a un modo.
const PALABRAS_ANSIEDAD: PalabraModo[] = [
  { word: 'SOLTAR',   tipo: 'caos'    }, // dejar caer
  { word: 'PRESENTE', tipo: 'eco'     }, // lo que vibra ahora
  { word: 'CUERPO',   tipo: 'deseo'   }, // lo que el cuerpo pide
  { word: 'RESPIRO',  tipo: 'ritual'  }, // forma mínima que sostiene
  { word: 'AHORA',    tipo: 'brillo'  }, // luz puntual
  { word: 'PAUSA',    tipo: 'ruido'   }, // bajar volumen
  { word: 'MIRAR',    tipo: 'secreto' }, // ver sin decir
  { word: 'TROPIEZO', tipo: 'error'   }, // lo que enseñó
];

// Para cuando el usuario está atascado entre dos opciones.
const PALABRAS_DECISIONES: PalabraModo[] = [
  { word: 'RIESGO',     tipo: 'caos'    },
  { word: 'DATO',       tipo: 'eco'     },
  { word: 'SÍ',         tipo: 'deseo'   },
  { word: 'NO',         tipo: 'ritual'  },
  { word: 'OPCIÓN',     tipo: 'brillo'  },
  { word: 'PRESIÓN',    tipo: 'ruido'   },
  { word: 'INTUICIÓN',  tipo: 'secreto' },
  { word: 'COSTO',      tipo: 'error'   },
];

export const MODOS: Record<ModoJuegoId, ModoJuego> = {
  creatividad: {
    id: 'creatividad',
    label: 'Creatividad',
    tagline: 'Caos. Eco. Brillo.',
    palabras: PALABRAS_CREATIVIDAD,
  },
  negocio: {
    id: 'negocio',
    label: 'Negocio',
    tagline: 'Pivot. Insight. Churn.',
    palabras: PALABRAS_NEGOCIO,
  },
  ansiedad: {
    id: 'ansiedad',
    label: 'Ansiedad',
    tagline: 'Respira. Mira. Suelta.',
    palabras: PALABRAS_ANSIEDAD,
  },
  decisiones: {
    id: 'decisiones',
    label: 'Decisiones',
    tagline: 'Sí. No. Por qué.',
    palabras: PALABRAS_DECISIONES,
  },
  random: {
    id: 'random',
    label: 'Random',
    tagline: 'Lo que venga.',
    palabras: [], // resuelto al vuelo en getPalabrasParaModo
  },
};

// Lista ordenada para iterar (selector de UI).
export const MODOS_LIST: ModoJuego[] = [
  MODOS.creatividad,
  MODOS.negocio,
  MODOS.ansiedad,
  MODOS.decisiones,
  MODOS.random,
];

/**
 * Devuelve el pool de palabras a usar en el juego para un modo dado.
 * Para 'random' mezcla los 4 pools temáticos (excluye sí mismo).
 */
export function getPalabrasParaModo(modo: ModoJuegoId): PalabraModo[] {
  if (modo === 'random') {
    return [
      ...PALABRAS_CREATIVIDAD,
      ...PALABRAS_NEGOCIO,
      ...PALABRAS_ANSIEDAD,
      ...PALABRAS_DECISIONES,
    ];
  }
  return MODOS[modo].palabras;
}

// ─── Frases por modo (Fase 3.3) ──────────────────────────────────────
//
// Cada modo tiene un pool propio de frases por contexto. getFraseAde
// (en adeProfile.ts) las usa como capa intermedia entre los triggers de
// comportamiento (más fuertes) y el fallback genérico (más débil).
// Resultado: los modos se SIENTEN distintos, no solo se ven.
//
// Reglas de tono (biblia sec.10):
//   • Negocio   → afilada, métrica, sin adornos
//   • Ansiedad  → suave, presente, sostén
//   • Decisiones→ seca, binaria, decisiva
//   • Creatividad → caótica, ruptura, juego
//   • Random    → vacío (cae a default según el spark capturado)

export type Contexto = 'inicio' | 'captura' | 'fin' | 'idea';

export interface FrasesPorContexto {
  inicio?: string[];
  captura?: string[];
  fin?: string[];
  idea?: string[];
}

export const FRASES_POR_MODO: Record<ModoJuegoId, FrasesPorContexto> = {
  creatividad: {
    inicio: [
      'Empezamos. Sin filtros.',
      'Ven a romper algo.',
      'Suelta la mano.',
    ],
    captura: [
      'Brillo bruto.',
      'Eso pinta.',
      'Sigue ahí.',
      'Otra. Sin pensar.',
    ],
    fin: [
      'Cerraste con caos.',
      'Hoy salió rara.',
      'Algo se movió.',
    ],
    idea: [
      'Ahí hay algo.',
      'Nueva. Suelta.',
      'No la limpies.',
    ],
  },
  negocio: {
    inicio: [
      'Otra vez. Muéstrame el patrón.',
      'Veamos qué tracción junta.',
      'Entra. Mediremos.',
      'Sin hipótesis no hay data.',
    ],
    captura: [
      'Métrica capturada.',
      'Eso sí escala.',
      'Punto de fricción.',
      'Hay churn ahí.',
      'Insight bruto.',
    ],
    fin: [
      'Sesión cerrada. Insight pendiente.',
      'Pivot detectado.',
      'Falta validación.',
      'Mediste. Bien.',
    ],
    idea: [
      'Idea con tracción.',
      'Pruébala. Mídela.',
      'Eso vale algo.',
      'Llévala a alguien.',
    ],
  },
  ansiedad: {
    // Tono suave en español neutro. Sin voseo, sin chilenismos.
    // Ver contexto/PREFERENCIAS-USUARIO.md (regla rectora).
    inicio: [
      'Respira. Aquí estoy.',
      'Sin apuro hoy.',
      'Vuelves. Bien.',
      'Ya estás.',
      'Despacio.',
    ],
    captura: [
      'Bien. Una más.',
      'Lo viste.',
      'Tranquilo.',
      'Ahí está.',
      'Sin presión.',
      'Eso.',
    ],
    fin: [
      'Cerramos suave.',
      'Bastó por hoy.',
      'Vuelve cuando quieras.',
      'Lo hiciste.',
      'Suficiente.',
    ],
    idea: [
      'Suéltala.',
      'Ya está afuera.',
      'Eso pesaba.',
      'Respira. Anotaste.',
      'Ahora pesa menos.',
    ],
  },
  decisiones: {
    inicio: [
      'Decidamos.',
      'Una cosa o la otra.',
      'Sin más vueltas.',
      'Treinta segundos. Decide.',
    ],
    captura: [
      'Apunta esa.',
      'Costo o riesgo.',
      'La intuición habló.',
      'Dato fresco.',
      'Otra opción menos.',
    ],
    fin: [
      'Tienes con qué decidir.',
      'Si no decides, decide otro.',
      'Salió un mapa.',
      'Hora de elegir.',
    ],
    idea: [
      'Esa es la decisión.',
      'No la pierdas.',
      'Acto.',
      'Decidiste algo.',
    ],
  },
  random: {
    // Random no tiene voz propia — hereda la del spark capturado.
    // Vacío intencional: getFraseAde cae en el default cuando este
    // pool no tiene frases para el contexto.
  },
};

/**
 * Devuelve una frase aleatoria del pool del modo para un contexto, o
 * cadena vacía si el pool está vacío. El llamador decide si usarla
 * (probabilidad) o caer en su fallback propio.
 */
export function getFraseModo(modo: ModoJuegoId, contexto: Contexto): string {
  const pool = FRASES_POR_MODO[modo]?.[contexto];
  if (!pool || pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Persistencia ─────────────────────────────────────────────────────

const STORAGE_KEY = 'ade_modo_actual';

export function getModoActual(): ModoJuegoId {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ModoJuegoId | null;
    if (v && MODOS[v]) return v;
  } catch {
    /* localStorage no disponible — caemos a default */
  }
  return 'creatividad';
}

export function setModoActual(m: ModoJuegoId): void {
  try {
    localStorage.setItem(STORAGE_KEY, m);
  } catch {
    /* ignorar — el estado en memoria del componente alcanza para la sesión */
  }
}
