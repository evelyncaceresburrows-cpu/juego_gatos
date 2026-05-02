// src/systems/adeProfile.ts
//
// Sistema de perfil creativo de Ade.
// Lee y persiste en localStorage cómo juega el usuario para alimentar
// frases que sean lecturas reales, no relleno.
//
// Cumple con contexto/ADE-alma.md:
//   - Las chispas son modos mentales (CAOS, ECO, DESEO, RITUAL, BRILLO,
//     RUIDO, SECRETO, ERROR), no items para sumar puntos.
//   - Las frases NO son genéricas. Cada una se dispara por un patrón de
//     comportamiento detectado en los datos.
//   - Antes de añadir cualquier frase nueva: ¿revela algo sobre el
//     usuario, o solo rellena espacio? Si solo rellena, no va.
//
// Este sistema NO conecta con la UI todavía. Solo expone funciones
// puras + persistencia. La conexión la hará Game.tsx / Journal.tsx
// en una mejora futura.

const STORAGE_KEY = 'ade-profile';

// ───────────────────────────────────────────────────────────────────
// Tipos
// ───────────────────────────────────────────────────────────────────

export type TipoChispa =
  | 'caos'
  | 'eco'
  | 'deseo'
  | 'ritual'
  | 'brillo'
  | 'ruido'
  | 'secreto'
  | 'error';

const TIPOS: TipoChispa[] = [
  'caos', 'eco', 'deseo', 'ritual', 'brillo', 'ruido', 'secreto', 'error',
];

// Identidad creativa por modo dominante. Cada tipo es una lectura del
// comportamiento, no una etiqueta plana. Single source of truth — Perfil
// y Journal lo importan de aquí.
export interface TipoCreativo {
  nombre: string;
  descripcion: string;
}

export const TIPOS_CREATIVOS: Record<TipoChispa, TipoCreativo> = {
  caos:    { nombre: 'Mente Caótica',       descripcion: 'Te activa el desorden. Lo usas bien.' },
  eco:     { nombre: 'Resonante',           descripcion: 'Piensas en impacto antes que en idea. Sabes para quién hablas.' },
  deseo:   { nombre: 'Intuitivo Puro',      descripcion: 'Confías en el instinto. Casi siempre acierta.' },
  ritual:  { nombre: 'Estructurador',       descripcion: 'Buscas forma. Lo que tocas tiende al orden.' },
  brillo:  { nombre: 'Buscador de Brillo',  descripcion: 'No te interesa lo correcto. Te interesa lo nuevo.' },
  ruido:   { nombre: 'Distracción Útil',    descripcion: 'La idea aparece cuando dejas de buscarla.' },
  secreto: { nombre: 'Pensador Profundo',   descripcion: 'Lento, pero cuando llegas, llegas.' },
  error:   { nombre: 'Aprendiz del Giro',   descripcion: 'Empiezas torcido. A veces así es mejor.' },
};

export type Contexto = 'inicio' | 'captura' | 'fin' | 'idea';

// Una sesión = un día único jugado. Mantenemos un historial de las
// últimas N sesiones para que el Mapa muestre evolución real, no agregados.
export interface SesionEntry {
  fecha: string;        // 'YYYY-MM-DD' (día único)
  capturas: Record<TipoChispa, number>;
  ideasGuardadas: number;
}

export interface AdeProfile {
  capturas: Record<TipoChispa, number>;
  velocidad: number[];        // ms entre capturas (todas las sesiones, ring buffer 200)
  sesiones: number;           // días únicos jugados
  ideasGuardadas: number;
  ultimaSesion: string;       // ISO date completa
  racha: number;              // días consecutivos jugados
  // Extensión sobre el spec original: historial de los últimos 20 tipos
  // capturados. Necesario para detectar patrones tipo "tres del mismo
  // modo seguidos" sin reconstruirlos desde otro lado.
  historial: TipoChispa[];
  // Historial por sesión (último día = última entrada). Limitado a 30.
  // Permite que el Mapa muestre timeline real en vez de proxy desde ideas.
  sesionesHistorial: SesionEntry[];
}

function capturasVacias(): Record<TipoChispa, number> {
  return {
    caos: 0, eco: 0, deseo: 0, ritual: 0,
    brillo: 0, ruido: 0, secreto: 0, error: 0,
  };
}

const PERFIL_VACIO: AdeProfile = {
  capturas: capturasVacias(),
  velocidad: [],
  sesiones: 0,
  ideasGuardadas: 0,
  ultimaSesion: '',
  racha: 0,
  historial: [],
  sesionesHistorial: [],
};

// ───────────────────────────────────────────────────────────────────
// Persistencia (try/catch igual que lib/storage.ts post mejora-03)
// ───────────────────────────────────────────────────────────────────

function leerPerfil(): AdeProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clonarVacio();
    const parsed = JSON.parse(raw);
    if (!esPerfilValido(parsed)) throw new Error('forma inválida');
    // Backward-compat: perfiles guardados antes de agregar sesionesHistorial
    // pasan validación porque el campo es opcional en esVálido. Si falta,
    // lo inicializamos vacío para que el resto del sistema lo use sin null-checks.
    const p = parsed as AdeProfile;
    if (!Array.isArray(p.sesionesHistorial)) p.sesionesHistorial = [];
    return p;
  } catch (err) {
    console.warn('[ADE perfil] corrupto o ausente, reseteando:', err);
    localStorage.removeItem(STORAGE_KEY);
    return clonarVacio();
  }
}

function guardarPerfil(p: AdeProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch (err) {
    console.warn('[ADE perfil] no se pudo guardar:', err);
  }
}

function clonarVacio(): AdeProfile {
  return JSON.parse(JSON.stringify(PERFIL_VACIO));
}

function esPerfilValido(x: unknown): boolean {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.capturas === 'object' && p.capturas !== null &&
    Array.isArray(p.velocidad) &&
    typeof p.sesiones === 'number' &&
    typeof p.ideasGuardadas === 'number' &&
    typeof p.ultimaSesion === 'string' &&
    typeof p.racha === 'number' &&
    Array.isArray(p.historial)
  );
}

// ───────────────────────────────────────────────────────────────────
// API pública
// ───────────────────────────────────────────────────────────────────

/**
 * Registra una captura. Actualiza capturas[tipo], velocidad, historial,
 * sesiones, racha y ultimaSesion.
 *
 * @param tipo  modo mental capturado (debe ser un TipoChispa válido)
 * @param velocidadMs  tiempo en ms desde la captura anterior, o desde
 *                     el inicio de la sesión si es la primera
 */
export function registrarCaptura(tipo: string, velocidadMs: number): void {
  if (!TIPOS.includes(tipo as TipoChispa)) {
    console.warn('[ADE perfil] tipo desconocido:', tipo);
    return;
  }
  const t = tipo as TipoChispa;
  const p = leerPerfil();

  p.capturas[t] = (p.capturas[t] || 0) + 1;

  p.velocidad.push(velocidadMs);
  if (p.velocidad.length > 200) p.velocidad = p.velocidad.slice(-200);

  p.historial.push(t);
  if (p.historial.length > 20) p.historial = p.historial.slice(-20);

  // Sesiones y racha: día único = nueva sesión.
  const ahora = new Date();
  const hoyISO = ahora.toISOString().slice(0, 10);
  const ultISO = p.ultimaSesion ? p.ultimaSesion.slice(0, 10) : '';
  if (ultISO !== hoyISO) {
    const ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    const ayerISO = ayer.toISOString().slice(0, 10);
    p.racha = ultISO === ayerISO ? (p.racha || 0) + 1 : 1;
    p.sesiones = (p.sesiones || 0) + 1;
  }
  p.ultimaSesion = ahora.toISOString();

  // SesionesHistorial: asegurar que la última entrada es de HOY.
  // Esto cubre dos casos: (a) primer día de sesión, (b) perfiles
  // existentes que migraron al nuevo schema y aún no tenían la entrada
  // del día actual. Sin esta guardia, sesionesHistorial nunca se llena
  // si el usuario ya tenía ultimaSesion de hoy antes del refactor.
  const ultEntry = p.sesionesHistorial[p.sesionesHistorial.length - 1];
  if (!ultEntry || ultEntry.fecha !== hoyISO) {
    p.sesionesHistorial.push({
      fecha: hoyISO,
      capturas: capturasVacias(),
      ideasGuardadas: 0,
    });
    if (p.sesionesHistorial.length > 30) {
      p.sesionesHistorial = p.sesionesHistorial.slice(-30);
    }
  }

  // Incrementar la captura del modo en la sesión activa (último entry).
  const sesionActiva = p.sesionesHistorial[p.sesionesHistorial.length - 1];
  if (sesionActiva) {
    sesionActiva.capturas[t] = (sesionActiva.capturas[t] || 0) + 1;
  }

  guardarPerfil(p);
}

/**
 * Devuelve el modo mental dominante (mayor cantidad de capturas).
 * Si no hay capturas, devuelve cadena vacía.
 */
export function getTipoDominante(): string {
  const p = leerPerfil();
  let max = 0;
  let dominante = '';
  for (const t of TIPOS) {
    const n = p.capturas[t] || 0;
    if (n > max) {
      max = n;
      dominante = t;
    }
  }
  return dominante;
}

/**
 * Devuelve una frase de Ade adaptada al contexto y al perfil real.
 * Cada frase está disparada por un trigger del comportamiento; ninguna
 * es genérica. Si ningún trigger fuerte aplica, cae en una frase de
 * arranque que sigue siendo data-driven (basada en lo poco que sabemos).
 */
export function getFraseAde(contexto: Contexto): string {
  const p = leerPerfil();
  const total = totalCapturas(p);
  const dom = getTipoDominante();
  const velProm = p.velocidad.length
    ? p.velocidad.reduce((s, v) => s + v, 0) / p.velocidad.length
    : 0;
  const velUlt = p.velocidad[p.velocidad.length - 1] ?? 0;
  const tiposEvitados = TIPOS.filter((t) => p.capturas[t] === 0);
  const ultimoTipo: TipoChispa | '' = p.historial[p.historial.length - 1] ?? '';
  const ultimosTres = p.historial.slice(-3);
  const tresDelMismo =
    ultimosTres.length === 3 && ultimosTres.every((t) => t === ultimosTres[0])
      ? ultimosTres[0]
      : '';

  switch (contexto) {
    case 'inicio': {
      if (p.racha >= 3)
        return `Llevamos ${p.racha} días. Algo te engancha.`;
      if (p.sesiones > 1 && p.ideasGuardadas === 0)
        return 'Juegas bien. Pero no guardas nada. ¿Le tienes miedo a las ideas?';
      if (dom === 'caos' && porcentaje(p.capturas.caos, total) > 0.5)
        return 'Capturas mucho Caos. Te activa el desorden. Interesante.';
      if (dom === 'ritual' && porcentaje(p.capturas.ritual, total) > 0.5)
        return 'Vuelves al Ritual. Sigues buscando estructura.';
      if (tiposEvitados.includes('caos') && total > 8)
        return 'Evitas el Caos. Le tienes miedo al desorden.';
      if (tiposEvitados.includes('ritual') && total > 8)
        return 'Evitas el Ritual. La estructura te incomoda.';
      if (velProm > 0 && velProm < 800 && total > 5)
        return 'Vas rápido. ¿Estás pensando o solo reaccionando?';
      if (velProm > 2500 && total > 5)
        return 'Hoy vienes lento. Algo te pesa.';
      if (total > 0 && dom)
        return `Volviste a ${dom}. Veremos si insistes.`;
      return 'Primera vez. Vamos a ver cómo piensas.';
    }

    case 'captura': {
      if (tresDelMismo)
        return `Tres ${tresDelMismo.toUpperCase()} seguidos. Estás pensando en ${nombreModo(tresDelMismo)}, no en ideas.`;
      if (
        ultimoTipo &&
        total > 4 &&
        porcentaje(p.capturas[ultimoTipo as TipoChispa] ?? 0, total) > 0.6
      )
        return `Insistes en ${ultimoTipo}. Estás en bucle.`;
      if (velUlt > 0 && velUlt < 500)
        return 'Reaccionaste. No pensaste.';
      if (velUlt > 2500)
        return 'Lo dudaste. Eso es interesante.';
      if (total === 1)
        return 'Primera chispa. Veamos qué eliges después.';
      if (total === 10)
        return 'Diez chispas. Ya empieza a verse un patrón.';
      if (ultimoTipo)
        return `${nombreModo(ultimoTipo)}. Lo agarraste tú, no Ade.`;
      return '';
    }

    case 'fin': {
      const tiposUsados = TIPOS.filter((t) => p.capturas[t] > 0);
      if (tiposUsados.length === 1 && total > 3)
        return `Solo ${tiposUsados[0]} hoy. Estás en una sola frecuencia.`;
      if (p.ideasGuardadas === 0 && total > 0)
        return `Capturaste ${total} chispas. No guardaste ninguna.`;
      if (velProm > 0 && velProm < 700 && total > 8)
        return 'Velocidad alta, ideas cortas. Estás en modo survival.';
      if (p.racha >= 3)
        return `Día ${p.racha} de la racha. ¿Por qué hoy también?`;
      if (dom)
        return `${dom.toUpperCase()} dominó esta sesión. Mira por qué.`;
      return 'Sesión cerrada. Volveremos a leerte.';
    }

    case 'idea': {
      // ultimoTipo aquí es la chispa que disparó el Eureka, porque el
      // modal se abre justo después de registrar esa captura y se cierra
      // antes de la siguiente.
      switch (ultimoTipo) {
        case 'caos':    return 'Idea desde el Caos. ¿La vas a domesticar o la dejas suelta?';
        case 'ritual':  return 'Idea desde el Ritual. Ya tiene forma. Solo falta cumplirla.';
        case 'eco':     return 'Esto va a resonar. ¿En quién?';
        case 'deseo':   return 'Lo querías. Ahora dilo.';
        case 'brillo':  return 'Sí. Eso es nuevo.';
        case 'error':   return 'Empieza torcida. A veces así es mejor.';
        case 'secreto': return 'No la digas todavía. Déjala fermentar.';
        case 'ruido':   return 'Distracción útil. ¿Qué hay debajo?';
      }
      if (p.ideasGuardadas === 0)
        return 'Primera idea guardada. Todo lo demás depende de esta.';
      return 'Otra idea. ¿Sigue tu línea o cambia de eje?';
    }
  }
}

/** Devuelve el perfil completo (para Bitácora y debugging). */
export function getPerfilCompleto(): AdeProfile {
  return leerPerfil();
}

// ───────────────────────────────────────────────────────────────────
// Helper extra (extensión sobre el spec)
// ───────────────────────────────────────────────────────────────────

/**
 * Marca que el usuario guardó una idea desde el modal Eureka.
 * Sin esta función, ideasGuardadas nunca se incrementaría y varias
 * frases nunca se dispararían.
 */
export function registrarIdeaGuardada(): void {
  const p = leerPerfil();
  p.ideasGuardadas = (p.ideasGuardadas || 0) + 1;

  // Misma guardia que registrarCaptura: garantizar entrada de hoy.
  const ahora = new Date();
  const hoyISO = ahora.toISOString().slice(0, 10);
  const ultEntry = p.sesionesHistorial[p.sesionesHistorial.length - 1];
  if (!ultEntry || ultEntry.fecha !== hoyISO) {
    p.sesionesHistorial.push({
      fecha: hoyISO,
      capturas: capturasVacias(),
      ideasGuardadas: 0,
    });
    if (p.sesionesHistorial.length > 30) {
      p.sesionesHistorial = p.sesionesHistorial.slice(-30);
    }
  }

  // Incrementa idea guardada en la sesión activa para el timeline.
  const sesionActiva = p.sesionesHistorial[p.sesionesHistorial.length - 1];
  if (sesionActiva) {
    sesionActiva.ideasGuardadas = (sesionActiva.ideasGuardadas || 0) + 1;
  }

  guardarPerfil(p);
}

// ───────────────────────────────────────────────────────────────────
// Internos
// ───────────────────────────────────────────────────────────────────

function totalCapturas(p: AdeProfile): number {
  return TIPOS.reduce((s, t) => s + (p.capturas[t] || 0), 0);
}

function porcentaje(parte: number, total: number): number {
  if (!total) return 0;
  return parte / total;
}

/** Nombre del modo mental (para frases) en lugar del label técnico. */
function nombreModo(tipo: string): string {
  switch (tipo) {
    case 'caos':    return 'desorden';
    case 'eco':     return 'impacto';
    case 'deseo':   return 'intuición';
    case 'ritual':  return 'estructura';
    case 'brillo':  return 'originalidad';
    case 'ruido':   return 'distracción';
    case 'secreto': return 'profundidad';
    case 'error':   return 'aprendizaje';
    default:        return tipo;
  }
}
