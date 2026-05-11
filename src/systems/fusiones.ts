// src/systems/fusiones.ts
//
// Sistema de fusiones — Camino C híbrido (decisión del usuario).
// Cuando el jugador captura 5 chispas, Ade abre la "ronda 2": destilar
// dos chispas en una idea. Cada pareja produce un insight canónico,
// corto, memorable.
//
// Las 8 chispas canónicas (alma sec.2) generan 28 pares posibles + 8
// auto-pares. Cada combinación está escrita a mano en tono biblia
// (sec.10): no rellena, observa.
//
// Si una combinación NO está en el mapa (caso edge: tipo legacy o pair
// no soportado), se cae a una plantilla genérica que aún respeta el
// tono. Pero las 8 + 28 cubren TODO el universo canónico.

import type { TipoChispa } from './adeProfile';
import type { ModoJuegoId } from './modos';

// Helper: produce key normalizada para que [a, b] === [b, a].
function pairKey(a: TipoChispa, b: TipoChispa): string {
  return [a, b].sort().join('+');
}

// ─── Contexto opcional para modulación ──────────────────────────────
//
// La matriz canónica (FUSIONES_PREMIUM + AUTO_FUSIONES) sigue siendo
// el ancla — es el insight "puro" del par. Pero la frase final puede
// teñirse por el contexto de la sesión: si fuiste muy rápido, si el
// modo de juego es Ansiedad, si llevás racha alta. Esto evita que el
// mismo par siempre lea idéntico, sin caer en aleatoriedad.
//
// Modulación es lineal (un solo prefijo o sufijo, no compuesto). Orden
// de prioridad descendente: velocidad → modo → racha.

export interface FusionContext {
  /** Velocidad promedio de captura en la sesión, en ms. */
  velocidadPromedio: number;
  /** Modo de juego activo cuando se hace la fusión. */
  modo: ModoJuegoId;
  /** Racha actual del jugador (en días). */
  racha: number;
}

// 28 fusiones premium curadas. Tono Ade: corta, observa, no felicita.
// 4 son del user spec (marcadas), las otras 24 las escribí en su voz.
const FUSIONES_PREMIUM: Record<string, string> = {
  // ── caos × * ──
  'caos+eco':     'El caos también resuena.',
  'caos+deseo':   'Empieza imperfecto.',                      // user
  'caos+ritual':  'El orden te ata. El caos te libera.',
  'caos+brillo':  'Lo nuevo viene del desorden.',
  'caos+ruido':   'Demasiado. Pero ahí estaba.',
  'caos+secreto': 'Lo que escondes es lo que rompe.',
  'caos+error':   'Sin reglas. Sin freno.',

  // ── eco × * (sin caos, ya cubierto) ──
  'deseo+eco':    'Lo que querés ya está sonando.',
  'eco+ritual':   'Repítelo y será verdad.',
  'brillo+eco':   'Idea nueva, voz vieja.',
  'eco+ruido':    'Mucha gente. Bajá el volumen.',
  'eco+secreto':  'Lo no dicho también ecoa.',
  'eco+error':    'Aprende mostrando.',                       // user

  // ── deseo × * ──
  'deseo+ritual': 'Quererlo no basta. Hazlo.',
  'brillo+deseo': 'Lo que más brilla es lo que querés.',
  'deseo+ruido':  'Querer sin saber qué.',
  'deseo+secreto':'Dilo o muere contigo.',
  'deseo+error':  'Querer mal. A veces ahí está.',

  // ── ritual × * ──
  'brillo+ritual':'Lo constante también ilumina.',            // user
  'ritual+ruido': 'Forma rota. Reconstrúyela distinta.',
  'ritual+secreto':'Lo que repites dice lo que callas.',
  'error+ritual': 'Romper el patrón es el patrón.',

  // ── brillo × * ──
  'brillo+ruido': 'Mucha luz. Fíltrala.',
  'brillo+secreto':'Ya quiere salir.',                        // user
  'brillo+error': 'Los mejores giros son los no planeados.',

  // ── ruido × * ──
  'ruido+secreto':'Lo importante se cuela entre lo que no es.',
  'error+ruido':  'El ruido tiene una pista.',

  // ── secreto × error ──
  'error+secreto':'Lo que no salió bien también te enseñó.',
};

// Auto-pares (X + X) — el jugador eligió la misma chispa dos veces.
// Es un patrón en sí mismo: insistencia. Tono biblia.
const AUTO_FUSIONES: Record<TipoChispa, string> = {
  caos:    'Doble Caos. Insistes en romper.',
  eco:     'Doble Eco. Lo que dices se repite.',
  deseo:   'Doble Deseo. Lo querés mucho.',
  ritual:  'Doble Ritual. La forma te sostiene.',
  brillo:  'Doble Brillo. Buscás lo nuevo dos veces.',
  ruido:   'Doble Ruido. Hay algo bajo.',
  secreto: 'Doble Secreto. Lo guardas profundo.',
  error:   'Doble Error. Sigue mostrándote algo.',
};

/**
 * Devuelve el insight de fusionar dos modos. Si los dos modos son el
 * mismo, devuelve el auto-fusion. Si la pareja no existe en el mapa
 * (caso legacy / tipo desconocido), cae a una plantilla genérica que
 * mantiene el tono Ade.
 *
 * Si se pasa `ctx`, la frase canónica se modula por velocidad/modo/racha
 * antes de devolverse. Sin ctx, devuelve la frase pura (backward compat).
 */
export function getFusion(
  a: TipoChispa,
  b: TipoChispa,
  ctx?: FusionContext
): string {
  return getFusionWithModifier(a, b, ctx).frase;
}

/**
 * Variante extendida — devuelve frase + etiqueta del modificador que
 * se aplicó (o null si no se modificó). Auditoría §4.3: el usuario no
 * sabía por qué la frase cambiaba; ahora FusionRonda puede mostrar
 * "↳ Velocidad alta" para hacer explícita la sofisticación.
 */
export interface FusionResult {
  frase: string;
  modificador: string | null;
}

export function getFusionWithModifier(
  a: TipoChispa,
  b: TipoChispa,
  ctx?: FusionContext
): FusionResult {
  // 1. Resolver el insight base de la matriz canónica.
  let base: string;
  if (a === b) {
    base = AUTO_FUSIONES[a] ?? `Doble ${a.toUpperCase()}.`;
  } else {
    const key = pairKey(a, b);
    base = FUSIONES_PREMIUM[key] ?? `${a.toUpperCase()} + ${b.toUpperCase()}. Algo dice.`;
  }

  // 2. Sin contexto → frase pura.
  if (!ctx) return { frase: base, modificador: null };

  // 3. Modulación lineal — un solo prefijo o sufijo, no compuesto.
  // Prioridad: velocidad > modo > racha.
  if (ctx.velocidadPromedio > 0 && ctx.velocidadPromedio < 700) {
    return {
      frase: `Demasiado rápido para entenderlo. ${base}`,
      modificador: 'Velocidad alta',
    };
  }
  if (ctx.modo === 'ansiedad') {
    return {
      frase: `${base} Respira con eso.`,
      modificador: 'Modo Ansiedad',
    };
  }
  if (ctx.modo === 'decisiones' && a !== b) {
    return {
      frase: `${base} Decide cuál.`,
      modificador: 'Modo Decisiones',
    };
  }
  if (ctx.racha >= 14) {
    return {
      frase: `${base} Otra vez.`,
      modificador: 'Racha de dos semanas',
    };
  }
  return { frase: base, modificador: null };
}

/**
 * Verifica que un string sea un TipoChispa canónico válido. Útil para
 * defenderse de sparks legacy que vivan en localStorage de versiones
 * anteriores ("Sombra", "Mapa", etc.).
 */
const TIPOS_VALIDOS: TipoChispa[] = [
  'caos', 'eco', 'deseo', 'ritual', 'brillo', 'ruido', 'secreto', 'error',
];

export function esTipoCanonico(s: string): s is TipoChispa {
  return TIPOS_VALIDOS.includes(s as TipoChispa);
}
