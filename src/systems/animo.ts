// src/systems/animo.ts
//
// Estados de ánimo de Ade.
//
// Decisión de diseño (usuario): "Caos" no es un botón. Es una
// personalidad jugable. Generalizamos: cada uno de los 8 modos canónicos
// produce un humor distinto en Ade cuando es el dominante del perfil.
// El jugador no elige el humor; lo gana por cómo juega. Ade reacciona.
//
// Cada humor tiene 4 dimensiones:
//   • parpadeoMs   — cada cuánto blinkea (en idle de Game/Home)
//   • spawnFactor  — multiplicador del intervalo de spawn (1 = base 1200ms,
//                    <1 = más rápido, >1 = más lento)
//   • adjetivo     — palabra corta que aparece bajo "Modo · X" en HUD
//                    (susurra el ánimo, no lo grita)
//   • tono         — pista para getFraseAde si quiere modular (futuro)
//
// El ánimo se calcula en runtime desde el perfil. Sin perfil → 'neutro'.

import { getPerfilCompleto, type TipoChispa } from './adeProfile';

export type AnimoAde =
  | 'filoso'      // dominante caos — sarcástico, rápido, cortante
  | 'amplio'     // dominante eco — frases que repiten, ritmo regular
  | 'ansioso'   // dominante deseo — saltitos, ritmo nervioso
  | 'sereno'    // dominante ritual — respiración lenta, frases largas
  | 'encendido' // dominante brillo — más eureka, más flow
  | 'distraido' // dominante ruido — mira lateral, frases dispersas
  | 'atento'    // dominante secreto — menos frases, mira fijo
  | 'torcido'   // dominante error — postura inclinada, auto-irónico
  | 'neutro';   // sin dominante claro o perfil vacío

export interface HumorProfile {
  parpadeoMs: number;       // intervalo aproximado entre blinks
  spawnFactor: number;       // multiplicador del spawn interval
  adjetivo: string;          // se muestra bajo "Modo · X"
  tono: string;              // hint para Ade voice
}

// Tabla de humores. Los valores se eligieron para que el cambio se SIENTA
// pero no rompa la jugabilidad.
export const HUMOR: Record<AnimoAde, HumorProfile> = {
  filoso:    { parpadeoMs: 4200, spawnFactor: 0.85, adjetivo: 'filoso',     tono: 'cortante' },
  amplio:    { parpadeoMs: 6000, spawnFactor: 1.05, adjetivo: 'amplio',     tono: 'rítmico' },
  ansioso:   { parpadeoMs: 3800, spawnFactor: 0.90, adjetivo: 'ansioso',    tono: 'inquieto' },
  sereno:    { parpadeoMs: 7200, spawnFactor: 1.15, adjetivo: 'sereno',     tono: 'pausado' },
  encendido: { parpadeoMs: 5000, spawnFactor: 0.95, adjetivo: 'encendido',  tono: 'brillante' },
  distraido: { parpadeoMs: 4500, spawnFactor: 1.00, adjetivo: 'distraído',  tono: 'disperso' },
  atento:    { parpadeoMs: 7800, spawnFactor: 1.10, adjetivo: 'atento',     tono: 'agudo' },
  torcido:   { parpadeoMs: 5300, spawnFactor: 1.00, adjetivo: 'torcido',    tono: 'irónico' },
  neutro:    { parpadeoMs: 5300, spawnFactor: 1.00, adjetivo: '',           tono: 'neutro' },
};

// Mapping TipoChispa → AnimoAde dominante.
const TIPO_A_ANIMO: Record<TipoChispa, AnimoAde> = {
  caos:    'filoso',
  eco:     'amplio',
  deseo:   'ansioso',
  ritual:  'sereno',
  brillo:  'encendido',
  ruido:   'distraido',
  secreto: 'atento',
  error:   'torcido',
};

/**
 * Devuelve el ánimo actual de Ade leyendo el perfil. Si no hay perfil
 * o no hay un dominante claro (sub-umbral), devuelve 'neutro'.
 *
 * Umbral: el dominante necesita >= 18% de las capturas totales para
 * "ganarle" al neutro. Sin esto, perfiles dispersos forzarían ánimos
 * en base a diferencias mínimas y el sistema se sentiría caprichoso.
 */
export function getAnimoActual(): AnimoAde {
  const p = getPerfilCompleto();
  const tipos: TipoChispa[] = [
    'caos', 'eco', 'deseo', 'ritual', 'brillo', 'ruido', 'secreto', 'error',
  ];
  const total = tipos.reduce((s, t) => s + (p.capturas[t] || 0), 0);
  if (total < 8) return 'neutro'; // muy poco data — todavía no leemos a Ade
  let max = 0;
  let dom: TipoChispa | null = null;
  for (const t of tipos) {
    const n = p.capturas[t] || 0;
    if (n > max) {
      max = n;
      dom = t;
    }
  }
  if (!dom) return 'neutro';
  const ratio = max / total;
  if (ratio < 0.18) return 'neutro';
  return TIPO_A_ANIMO[dom];
}

/** Helper: devuelve el HumorProfile completo para el ánimo dado. */
export function getHumorProfile(animo: AnimoAde): HumorProfile {
  return HUMOR[animo];
}
