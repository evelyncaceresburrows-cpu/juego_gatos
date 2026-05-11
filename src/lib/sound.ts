// src/lib/sound.ts
//
// Web Audio API mínima — tres sounds para los momentos clave del juego.
// Sin librerías, sin assets de audio. Generamos los tonos en runtime con
// osciladores y envelopes.
//
// Sonidos:
//   capture()  pop corto al capturar una chispa (~80ms)
//   flow()     chime ascendente al cruzar combo 3 (~200ms)
//   fusion()   bell sostenido al abrir FusionRonda (~400ms)
//
// Mute persiste en localStorage `ade_sound_muted`. Default: false.
// La primera interacción del usuario "desbloquea" el AudioContext —
// browsers modernos requieren user gesture antes de reproducir audio.

const KEY_MUTED = 'ade_sound_muted';

let ctx: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Llamar en el primer click del usuario para habilitar audio. */
export function unlockAudio(): void {
  if (unlocked) return;
  const c = getContext();
  if (!c) return;
  // Crear un buffer silencioso de 1 muestra y reproducirlo —
  // técnica estándar para "resume" del context tras user gesture.
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const source = c.createBufferSource();
    source.buffer = buf;
    source.connect(c.destination);
    source.start(0);
    if (c.state === 'suspended') c.resume();
    unlocked = true;
  } catch {
    /* no-op */
  }
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(KEY_MUTED) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(KEY_MUTED, muted ? '1' : '0');
  } catch {
    /* ignorar */
  }
}

// Helper interno: tono con envelope ADSR simplificado.
function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain: number = 0.18,
): void {
  if (isMuted()) return;
  const c = getContext();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.value = 0;
    osc.connect(env);
    env.connect(c.destination);
    const now = c.currentTime;
    // ADSR: attack 8ms → peak → decay 30ms → release el resto
    env.gain.linearRampToValueAtTime(gain, now + 0.008);
    env.gain.linearRampToValueAtTime(gain * 0.7, now + 0.04);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch {
    /* no-op */
  }
}

// Haptic helper — vibrate API solo está disponible en mobile. En desktop
// no hace nada. No requiere user gesture como audio.
function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* no-op */
  }
}

/** Pop corto al capturar una chispa. Audio + haptic. */
export function capture(): void {
  playTone(880, 0.08, 'sine', 0.14);
  playTone(1320, 0.06, 'triangle', 0.06);
  vibrate(15);
}

/** Chime ascendente al cruzar combo 3 (FLOW). Audio + haptic doble. */
export function flow(): void {
  playTone(660, 0.12, 'sine', 0.16);
  setTimeout(() => playTone(880, 0.12, 'sine', 0.16), 80);
  setTimeout(() => playTone(1100, 0.18, 'sine', 0.14), 160);
  vibrate([30, 40, 30]);
}

/** Bell sostenido al abrir FusionRonda. Audio + haptic largo. */
export function fusion(): void {
  playTone(523, 0.4, 'sine', 0.18);
  playTone(659, 0.35, 'sine', 0.12);
  playTone(783, 0.3, 'sine', 0.08);
  vibrate(60);
}
