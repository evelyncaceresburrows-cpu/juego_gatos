// src/systems/streaks.ts
//
// Fase 3.2 — Retención + streaks.
//
// Filosofía Ade (alma sec.3): los unlocks NO son recompensas tipo "ganaste
// puntos". Son señales de que la relación con Ade se profundiza. Una vez
// logrado, un unlock queda para siempre — aunque el usuario rompa la
// racha, lo logrado se mantiene. La racha actual sirve para el banner de
// "vuelves" y para mostrar el próximo umbral; los logrados se acumulan en
// un set persistente independiente.
//
// V1 — 4 umbrales:
//   D3   frases_extra    Más voz de Ade
//   D7   racha_semana    Una semana
//   D14  frase_secreta   Frase secreta (pool especial en Home)
//   D30  mes_completo    Mes con Ade
//
// El estado se guarda en dos keys:
//   ade_unlocks_logrados   string[]  — ids ya alcanzados (acumulativo)
//   ade_unlocks_celebrados string[]  — ids ya mostrados al usuario
//                                      (para no repetir el toast)

export interface UnlockDef {
  diaRequerido: number;
  id: string;
  nombre: string;        // título corto que ve el usuario
  descripcion: string;   // biblia tone, una sola línea
}

export const UNLOCKS: UnlockDef[] = [
  {
    // Auditoría §3.6 — primer reconocimiento. Llegaste, jugaste. Ade lo
    // anota. Sin felicitación: solo registro.
    diaRequerido: 1,
    id: 'primer_dia',
    nombre: 'Primera cacería',
    descripcion: 'Día uno. Llegaste.',
  },
  {
    diaRequerido: 3,
    id: 'frases_extra',
    nombre: 'Más voz de Ade',
    descripcion: 'Tres días. Algo se asienta.',
  },
  {
    diaRequerido: 7,
    id: 'racha_semana',
    nombre: 'Una semana',
    descripcion: 'Siete días. Vuelves.',
  },
  {
    diaRequerido: 14,
    id: 'frase_secreta',
    nombre: 'Frase secreta',
    descripcion: 'Catorce días. Ade tiene algo que solo te dice a ti.',
  },
  {
    diaRequerido: 30,
    id: 'mes_completo',
    nombre: 'Mes con Ade',
    descripcion: 'Mes completo. Ya somos algo.',
  },
];

// ─── Frases secretas ──────────────────────────────────────────────────
//
// Pool especial que getFraseAde('inicio') puede usar cuando el usuario
// desbloqueó 'frase_secreta'. Son frases más íntimas, biblia tone:
// reconocen que la relación tiene tiempo encima.

export const FRASES_SECRETAS_INICIO: string[] = [
  'Vuelves. Pero algo cambia cada vez.',
  'Sé cómo piensas. Lo veo.',
  'Ya no eres turista.',
  'Hay un patrón. Ya lo viste.',
];

// ─── Persistencia ─────────────────────────────────────────────────────

const KEY_LOGRADOS = 'ade_unlocks_logrados';
const KEY_CELEBRADOS = 'ade_unlocks_celebrados';

function leerSet(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(s => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function guardarSet(key: string, vals: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(vals));
  } catch {
    /* ignorar — persistencia best-effort */
  }
}

// ─── API pública ──────────────────────────────────────────────────────

/** IDs de unlocks que el usuario alcanzó alguna vez. */
export function getUnlocksLogrados(): string[] {
  return leerSet(KEY_LOGRADOS);
}

/** IDs de unlocks ya celebrados al usuario (toast mostrado). */
export function getUnlocksCelebrados(): string[] {
  return leerSet(KEY_CELEBRADOS);
}

/** Marca como celebrado para no repetir el toast en el próximo render. */
export function marcarCelebrado(id: string): void {
  const c = getUnlocksCelebrados();
  if (!c.includes(id)) {
    c.push(id);
    guardarSet(KEY_CELEBRADOS, c);
  }
}

/** ¿El usuario alcanzó este unlock alguna vez? */
export function isUnlocked(id: string): boolean {
  return getUnlocksLogrados().includes(id);
}

/**
 * Mira la racha actual contra UNLOCKS. Cualquier unlock cuya racha
 * supere el umbral y aún no esté en logrados se agrega y se devuelve.
 *
 * Llamar cada vez que se entra a Home (o tras una sesión que pudo
 * incrementar la racha). Los nuevos retornados disparan la celebración.
 */
export function checkUnlocksNuevos(rachaActual: number): UnlockDef[] {
  const logrados = getUnlocksLogrados();
  const recien = UNLOCKS.filter(
    u => rachaActual >= u.diaRequerido && !logrados.includes(u.id)
  );
  if (recien.length > 0) {
    const updated = [...logrados, ...recien.map(u => u.id)];
    guardarSet(KEY_LOGRADOS, updated);
  }
  return recien;
}

/**
 * Próximo unlock pendiente respecto a la racha actual. Útil para el
 * chip "Día 7 → Una semana" en Home.
 */
export function getProximoUnlock(rachaActual: number): UnlockDef | null {
  const pendientes = UNLOCKS
    .filter(u => u.diaRequerido > rachaActual)
    .sort((a, b) => a.diaRequerido - b.diaRequerido);
  return pendientes[0] ?? null;
}

/**
 * Devuelve un overview del estado de unlocks para Perfil.
 * Cada item viene tagged con `logrado: boolean` para que la UI pinte
 * los desbloqueados vs los pendientes.
 */
export interface UnlockEstado extends UnlockDef {
  logrado: boolean;
}

export function getEstadoUnlocks(): UnlockEstado[] {
  const logrados = new Set(getUnlocksLogrados());
  return UNLOCKS.map(u => ({ ...u, logrado: logrados.has(u.id) }));
}
