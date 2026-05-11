// src/systems/lectura.ts
//
// Generador de la lectura final del GameOver. Toma las métricas crudas
// de la sesión que acaba de cerrar + el perfil acumulado del jugador y
// devuelve EXACTAMENTE 3 observaciones, una por dimensión:
//
//   1. Velocidad — cómo fue el ritmo de captura en esta sesión
//   2. Patrón    — qué tipos dominaron / cuáles se evitaron
//   3. Acción    — qué se hizo con lo capturado (guardar, saltar, salir)
//
// REGLA DURA (alma sec.3 + biblia sec.10):
// Cada frase se dispara por un dato verificable. Si ningún trigger
// fuerte aplica, hay un fallback que sigue siendo data-driven (referencia
// a "sin chispas", "sin dominante", etc. — habla del vacío específico,
// no del vacío genérico). Nunca relleno motivacional.
//
// El componente <Lectura> (src/components/Lectura.tsx) renderiza el
// resultado. Este módulo es función pura y sin side effects: no toca
// localStorage ni dispara animaciones. Solo computa.

import {
  getPerfilCompleto,
  type TipoChispa,
} from './adeProfile';
import type { Observacion } from '../components/Lectura';

const TIPOS: TipoChispa[] = [
  'caos', 'eco', 'deseo', 'ritual', 'brillo', 'ruido', 'secreto', 'error',
];

export interface MetricasSesion {
  /** Cuántas veces se capturó cada tipo en ESTA sesión (no acumulado). */
  capturasPorTipo: Partial<Record<TipoChispa, number>>;
  /** Deltas en ms entre capturas consecutivas de la sesión. */
  velocidades: number[];
  /** Cuántas FusionRondas se cerraron sin guardar idea. */
  saltadasFusion: number;
  /** Cuántas ideas el usuario guardó en esta sesión. */
  guardadas: number;
  /** Timestamp de inicio de la sesión, por si se necesita duración. */
  inicio: number;
}

/**
 * Devuelve siempre exactamente 3 observaciones, en orden:
 * velocidad → patrón → acción.
 */
export function generarLectura(m: MetricasSesion): Observacion[] {
  return [
    leerVelocidad(m),
    leerPatron(m),
    leerAccion(m),
  ];
}

// ─── Velocidad ────────────────────────────────────────────────────────
//
// El delta promedio entre capturas habla del estado mental:
//   < 700ms   → reacción pura, sin pensamiento (rápido feo)
//   < 1100ms  → atención focalizada (rápido bueno)
//   1100-1700 → ritmo parejo
//   1700-2400 → pausa entre captura y captura (mediste)
//   > 2400ms  → algo te frenaba

function leerVelocidad(m: MetricasSesion): Observacion {
  const total = totalCapturas(m);

  if (total === 0) {
    return { dimension: 'velocidad', frase: 'No tocaste. Está bien también.' };
  }

  const velProm = m.velocidades.length
    ? m.velocidades.reduce((s, v) => s + v, 0) / m.velocidades.length
    : 0;

  if (velProm < 700) {
    return { dimension: 'velocidad', frase: 'Reaccionaste. No pensaste.' };
  }
  if (velProm < 1100) {
    return { dimension: 'velocidad', frase: 'Rápido. Atento.' };
  }
  if (velProm > 2400) {
    return { dimension: 'velocidad', frase: 'Lento. Algo te pesaba.' };
  }
  if (velProm > 1700) {
    return { dimension: 'velocidad', frase: 'Pausado. Mediste cada chispa.' };
  }
  return { dimension: 'velocidad', frase: 'Ritmo parejo. Sin urgencia.' };
}

// ─── Patrón ───────────────────────────────────────────────────────────
//
// Lectura del DISTRIBUTION de tipos en esta sesión. Importa más el
// dominante de la sesión que el del perfil acumulado: estamos leyendo
// LO QUE ACABA DE PASAR.
//
// Triggers de prioridad descendente:
//   1. Sin capturas    → vacío específico
//   2. Dominante > 50% → monocromía mental
//   3. Caos evitado    → buscaste forma
//   4. Ritual evitado  → soltaste estructura
//   5. Cubriste los 8  → mirada amplia
//   6. Hay dominante   → "X dominó. Mira por qué."
//   7. Fallback        → "Sin dominante claro. Aún se forma."

function leerPatron(m: MetricasSesion): Observacion {
  const total = totalCapturas(m);
  if (total === 0) {
    return { dimension: 'patron', frase: 'Sin chispas. Sin patrón.' };
  }

  // Tipo dominante de la sesión.
  let dominante: TipoChispa | undefined;
  let maxCount = 0;
  for (const t of TIPOS) {
    const n = m.capturasPorTipo[t] || 0;
    if (n > maxCount) {
      maxCount = n;
      dominante = t;
    }
  }

  const evitados = TIPOS.filter(t => !m.capturasPorTipo[t]);

  if (dominante && maxCount / total >= 0.5) {
    return {
      dimension: 'patron',
      frase: `Sesión de ${dominante.toUpperCase()}. Una sola frecuencia.`,
    };
  }
  if (evitados.includes('caos') && total > 6) {
    return { dimension: 'patron', frase: 'Sin Caos. Buscaste forma.' };
  }
  if (evitados.includes('ritual') && total > 6) {
    return { dimension: 'patron', frase: 'Sin Ritual. Soltaste estructura.' };
  }
  if (evitados.length === 0 && total > 5) {
    return { dimension: 'patron', frase: 'Tocaste los ocho. Mirada amplia.' };
  }
  if (dominante) {
    return {
      dimension: 'patron',
      frase: `${dominante.toUpperCase()} dominó. Mira por qué.`,
    };
  }
  return { dimension: 'patron', frase: 'Sin dominante claro. Aún se forma.' };
}

// ─── Acción ───────────────────────────────────────────────────────────
//
// La métrica más reveladora del comportamiento real: ¿el usuario
// CONVIRTIÓ algo de lo que vio? Capturar es fácil; guardar implica
// decisión.
//
// Triggers:
//   - 0 guardadas + capturó algo  → "Pena."
//   - 0 guardadas + 0 capturas    → "Sin acto."
//   - Saltó fusiones sin guardar  → "Vio. Saltó. No guardó."
//   - 1 guardada                  → "Suficiente."
//   - >= 2 guardadas              → "Productivo."
//   - Racha alta                  → reconoce la insistencia
//   - Fallback                    → "Algo queda."

function leerAccion(m: MetricasSesion): Observacion {
  const total = totalCapturas(m);
  const perfil = getPerfilCompleto();

  if (m.guardadas === 0 && total === 0) {
    return { dimension: 'accion', frase: 'Vino y se fue. Sin acto.' };
  }
  if (m.guardadas === 0 && total > 0) {
    // Pluralización condicional (auditoría §7.2: "1 chispas" era bug).
    // Para primera sesión, suavizar el "Pena." a algo más invitante.
    const palabraChispa = total === 1 ? 'chispa' : 'chispas';
    const esPrimeraSesion = perfil.sesiones <= 1;
    if (esPrimeraSesion) {
      return {
        dimension: 'accion',
        frase: `${total} ${palabraChispa}. Ninguna guardada. Probemos otra.`,
      };
    }
    return {
      dimension: 'accion',
      frase: `${total} ${palabraChispa}. Cero guardadas. Pena.`,
    };
  }
  if (m.saltadasFusion > 0 && m.guardadas === 0) {
    return { dimension: 'accion', frase: 'Vio. Saltó. No guardó.' };
  }
  if (m.guardadas === 1) {
    return { dimension: 'accion', frase: 'Una idea afuera. Suficiente.' };
  }
  if (m.guardadas >= 2) {
    const palabraIdea = m.guardadas === 1 ? 'idea' : 'ideas';
    return {
      dimension: 'accion',
      frase: `${m.guardadas} ${palabraIdea}. Productivo.`,
    };
  }
  // m.guardadas === 0 ya fue cubierto arriba. Aquí solo cae si el
  // tracking de guardadas fue raro (defensivo).
  if (perfil.racha >= 7) {
    return { dimension: 'accion', frase: `Día ${perfil.racha}. Sigues.` };
  }
  return { dimension: 'accion', frase: 'Pasaste por aquí. Algo queda.' };
}

// ─── Internos ─────────────────────────────────────────────────────────

function totalCapturas(m: MetricasSesion): number {
  return TIPOS.reduce((s, t) => s + (m.capturasPorTipo[t] || 0), 0);
}
