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

// Helper: produce key normalizada para que [a, b] === [b, a].
function pairKey(a: TipoChispa, b: TipoChispa): string {
  return [a, b].sort().join('+');
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
  'caos+secreto': 'Lo que escondés es lo que rompe.',
  'caos+error':   'Sin reglas. Sin freno.',

  // ── eco × * (sin caos, ya cubierto) ──
  'deseo+eco':    'Lo que querés ya está sonando.',
  'eco+ritual':   'Repetilo y será verdad.',
  'brillo+eco':   'Idea nueva, voz vieja.',
  'eco+ruido':    'Mucha gente. Bajá el volumen.',
  'eco+secreto':  'Lo no dicho también ecoa.',
  'eco+error':    'Aprende mostrando.',                       // user

  // ── deseo × * ──
  'deseo+ritual': 'Quererlo no basta. Hacelo.',
  'brillo+deseo': 'Lo que más brilla es lo que querés.',
  'deseo+ruido':  'Querer sin saber qué.',
  'deseo+secreto':'Decilo o muere contigo.',
  'deseo+error':  'Querer mal. A veces ahí está.',

  // ── ritual × * ──
  'brillo+ritual':'Lo constante también ilumina.',            // user
  'ritual+ruido': 'Forma rota. Reconstruila distinta.',
  'ritual+secreto':'Lo que repetís dice lo que callás.',
  'error+ritual': 'Romper el patrón es el patrón.',

  // ── brillo × * ──
  'brillo+ruido': 'Mucha luz. Filtrala.',
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
  caos:    'Doble Caos. Insistís en romper.',
  eco:     'Doble Eco. Lo que decís se repite.',
  deseo:   'Doble Deseo. Lo querés mucho.',
  ritual:  'Doble Ritual. La forma te sostiene.',
  brillo:  'Doble Brillo. Buscás lo nuevo dos veces.',
  ruido:   'Doble Ruido. Hay algo bajo.',
  secreto: 'Doble Secreto. Lo guardás profundo.',
  error:   'Doble Error. Sigue mostrándote algo.',
};

/**
 * Devuelve el insight de fusionar dos modos. Si los dos modos son el
 * mismo, devuelve el auto-fusion. Si la pareja no existe en el mapa
 * (caso legacy / tipo desconocido), cae a una plantilla genérica que
 * mantiene el tono Ade.
 */
export function getFusion(a: TipoChispa, b: TipoChispa): string {
  if (a === b) {
    return AUTO_FUSIONES[a] ?? `Doble ${a.toUpperCase()}.`;
  }
  const key = pairKey(a, b);
  if (FUSIONES_PREMIUM[key]) return FUSIONES_PREMIUM[key];
  // Plantilla fallback — solo se dispara si los modos no son canónicos.
  return `${a.toUpperCase()} + ${b.toUpperCase()}. Algo dice.`;
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
