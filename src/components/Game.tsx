import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Pause, ChevronLeft } from 'lucide-react';
// Sistema cognitivo de Ade — paths string desde public/.
// Cada pose representa una función mental distinta. Ver src/lib/assets.ts.
import { ASSETS } from '../lib/assets';
import { saveIdeaToStorage } from '../lib/storage';
import {
  registrarCaptura,
  registrarIdeaGuardada,
  getFraseAde,
  getPerfilCompleto,
  type TipoChispa,
} from '../systems/adeProfile';
import type { FusionContext } from '../systems/fusiones';
import {
  getPalabrasParaModo,
  MODOS,
  type ModoJuegoId,
} from '../systems/modos';
import { getAnimoActual, getHumorProfile } from '../systems/animo';
import type { MetricasSesion } from '../systems/lectura';
import * as sound from '../lib/sound';
import { useReducedMotion } from '../lib/useReducedMotion';
import FusionRonda from './FusionRonda';
import IndicadorAcumulacion from './IndicadorAcumulacion';

// Burst de partículas que aparece en el punto de captura. Cada uno
// es un punto que radia hacia afuera y se desvanece. 8 puntos por burst.
interface BurstParticle {
  id: number;
  x: number;          // % del canvas
  y: number;
  color: string;
  pts: number;        // puntos ganados (para el float +N)
}

interface GameProps {
  // onEnd ahora pasa también las métricas de la sesión para que GameOver
  // genere la lectura estructurada (3 observaciones data-driven).
  onEnd: (score: number, metricas: MetricasSesion) => void;
  // Fase 3.1 — Modo de juego activo. Define qué pool de palabras se
  // muestra y mapea cada palabra a un TipoChispa canónico bajo capó.
  // Default 'creatividad' para no romper callers viejos.
  modo?: ModoJuegoId;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  // word = lo que se dibuja (puede ser PIVOT, RESPIRO, CAOS…).
  // tipo = la chispa canónica (caos, eco, deseo, ritual, brillo, ruido,
  //         secreto, error). El perfil y la fusión usan tipo, no word.
  label: string;
  tipo: TipoChispa;
  color: string;
  size: number;
}

// SPARK_WORDS (legacy) reemplazado por modos.ts en Fase 3.1.
// Cada modo de juego define su propio pool de palabras (PalabraModo[]).
// El array se obtiene con getPalabrasParaModo(modo) dentro del componente,
// que recibe `modo` como prop. La psicología canónica (8 TipoChispa)
// vive ahora en .tipo de cada PalabraModo.

// SPARK_COLORS eliminado en Fase 2 — el viejo currentSparkType ya no
// existe y el mapping vibe ahora vive en VIBE_DE_MODO abajo.

// Mapping fijo modo → color. Cada chispa tiene siempre el mismo color
// según su modo, en lugar de uno random por aparición. Pares elegidos
// por afinidad temática:
//   Oro    (warm)    → BRILLO + DESEO   (luz y deseo)
//   Azul   (clean)   → ECO + RITUAL     (resonancia y estructura)
//   Verde  (organic) → SECRETO + RUIDO  (profundidad oculta y distracción)
//   Morado (mystic)  → CAOS + ERROR     (disrupción y giro inesperado)
const MODO_COLOR: Record<string, string> = {
  brillo:  '#FFD740',
  deseo:   '#FFD740',
  eco:     '#40C4FF',
  ritual:  '#40C4FF',
  secreto: '#69F0AE',
  ruido:   '#69F0AE',
  caos:    '#B088FF',
  error:   '#B088FF',
};

// Mapping modo → categoría del filtro de Bitácora (locas / mejores / útiles).
// Cumple ADE-alma sec.3: las categorías son lectura del comportamiento, no
// azar. La categoría a la que cae una idea revela qué tipo de pensamiento
// la disparó.
//   locas:   caos / error / ruido     (ruptura, giro, distracción)
//   mejores: deseo / brillo           (intuición, originalidad)
//   útiles:  ritual / eco / secreto   (estructura, impacto, profundidad)
const MODO_TO_TYPE: Record<string, 'locas' | 'mejores' | 'útiles'> = {
  caos:    'locas',
  error:   'locas',
  ruido:   'locas',
  deseo:   'mejores',
  brillo:  'mejores',
  ritual:  'útiles',
  eco:     'útiles',
  secreto: 'útiles',
};

// ADE_PHRASES eliminado — el alma prohíbe explícitamente frases
// genéricas tipo "Hoy andai brillante", "Aceptable", "Combo creativo".
// Las frases ahora vienen de getFraseAde('captura') que las deriva del
// perfil real del usuario.

// PROMPTS_POR_MODO eliminado en Fase 2 — los insights de fusión vienen
// ahora de src/systems/fusiones.ts (matriz de 28 combos canónicos).
// Camino C híbrido: tras 5 capturas se abre FusionRonda en lugar del
// viejo Eureka modal con prompt + textarea.

// Mapping vibe (color group) por modo — mantiene compatibilidad con
// storage.ts que sigue usando vibe para alimentar RadarStats legacy.
const VIBE_DE_MODO: Record<string, string> = {
  brillo: 'Oro',
  deseo: 'Oro',
  eco: 'Azul',
  ritual: 'Azul',
  secreto: 'Verde',
  ruido: 'Verde',
  caos: 'Morado',
  error: 'Morado',
};

const Game: React.FC<GameProps> = ({ onEnd, modo = 'creatividad' }) => {
  // Pool de palabras para este modo. useMemo: solo se recalcula si el
  // modo cambia. En la práctica el modo es estable durante una partida
  // (se elige en Home antes de entrar), pero el memo defiende el caso.
  const palabras = useMemo(() => getPalabrasParaModo(modo), [modo]);
  const modoLabel = MODOS[modo].label;

  const [score, setScore] = useState(0);
  // Duración de sesión leída de localStorage. Investigación TDAH §1
  // (Mawjee 2015): micro-sesiones validadas; algunos usuarios en flow
  // quieren más. Default 30s (canónico ADE). Extendida 60s opcional via
  // Ajustes. localStorage key: ade_sesion_duracion ('30' | '60').
  const sesionDuracion = (() => {
    try {
      const v = localStorage.getItem('ade_sesion_duracion');
      return v === '60' ? 60 : 30;
    } catch {
      return 30;
    }
  })();
  const [timeLeft, setTimeLeft] = useState(sesionDuracion);
  const [combo, setCombo] = useState(1);
  const [sparks, setSparks] = useState<Spark[]>([]);
  // Estado cognitivo de Ade — base del gameplay es 'scan' (anticipación,
  // detección). 'idle' NO se usa dentro del juego activo (ese es el
  // estado de Home). 'fuse' reemplaza a 'eureka' (acto de combinar dos
  // ideas). 'interpret' es defensivo — la lectura final vive en GameOver,
  // no en este componente, así que no se dispara desde acá hoy.
  const [adeState, setAdeState] = useState<'scan' | 'hunt' | 'fuse' | 'interpret' | 'offended'>('scan');
  const [adePhrase, setAdePhrase] = useState('');
  
  // Eureka Modal eliminado — reemplazado por FusionRonda (Fase 2).
  // showFusion + recentChispas (declarados más abajo) cubren su rol.

  const adeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mejora 02 — scoreRef permite leer el score más reciente sin meterlo
  // en deps del useEffect del timer (evita churn de intervals por captura).
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Cable a adeProfile: timestamp de la captura anterior, para calcular
  // delta y alimentar perfil.velocidad (ms entre capturas).
  // En la primera captura, el delta es desde el mount del componente.
  const lastCaptureTimeRef = useRef<number>(Date.now());

  // FLOW MODE — cuando combo cruza de 2 a 3, dispara overlay dorado +
  // pose de eureka temporal de Ade (alma sec.3 + biblia sec.7 — alegría).
  const [flowActive, setFlowActive] = useState(false);

  // PAUSE — auditoría §8.2: el botón Pause era placeholder. Ahora freeza
  // el timer y el spawn. Tap en el overlay reanuda. ESC también reanuda.
  const [isPaused, setIsPaused] = useState(false);

  // prefers-reduced-motion — desactiva el parpadeo del cat en idle y la
  // burst de partículas decorativa. Lo funcional (HUD pulse, FLOW banner,
  // anillo, transición de estados) se mantiene.
  const reducedMotion = useReducedMotion();

  // Buffer de las últimas 5 chispas capturadas — alimenta la ronda 2
  // (FusionRonda). Se reinicia tras cada fusión.
  const [recentChispas, setRecentChispas] = useState<string[]>([]);
  const [showFusion, setShowFusion] = useState(false);

  // Bursts de captura — feedback inmediato. Cada captura pushea un burst
  // con coords del spark + color + pts ganados. Se auto-limpian a los
  // ~900ms para que el array no crezca indefinidamente.
  const [bursts, setBursts] = useState<BurstParticle[]>([]);

  // Ánimo de Ade leído del perfil al mount. Se mantiene estable durante
  // la partida — Ade no cambia de humor en medio de la sesión, eso se
  // sentiría caprichoso. Cada partida nueva lee el ánimo más actual.
  const [animo] = useState(() => getAnimoActual());
  const humor = getHumorProfile(animo);

  // Camino hacia la fusión (0..5). Reemplaza al chequeo `combo % 5 === 0`
  // como trigger. Filosofía: la acumulación es lineal — un miss NO te
  // castiga el camino (a diferencia del combo). Solo se reinicia cuando
  // se cierra una FusionRonda.
  const [fusionPath, setFusionPath] = useState(0);

  // Métricas crudas de esta sesión para alimentar la lectura final.
  // Vive en ref (no state) porque ningún render depende de ellas — solo
  // se leen al cerrar el juego. Evita re-renders innecesarios por captura.
  const sesionMetricsRef = useRef<MetricasSesion>({
    capturasPorTipo: {},
    velocidades: [],
    saltadasFusion: 0,
    guardadas: 0,
    inicio: Date.now(),
  });

  const triggerAdeState = (
    state: 'scan' | 'hunt' | 'fuse' | 'interpret' | 'offended',
    duration: number = 2000
  ) => {
    setAdeState(state);

    // Cancelamos cualquier timeout previo y dejamos el ref limpio.
    if (adeTimeout.current) {
      clearTimeout(adeTimeout.current);
      adeTimeout.current = null;
    }

    // 'fuse' es estado pegajoso (lo cierra el modal de FusionRonda).
    // Para los demás, volvemos a 'scan' (la base del gameplay activo)
    // después de `duration` ms.
    if (state !== 'fuse') {
      adeTimeout.current = setTimeout(() => {
        setAdeState('scan');
        adeTimeout.current = null;
      }, duration);
    }
  };

  // Muestra una frase derivada del perfil del usuario.
  // Si la frase está vacía (caso edge), no se muestra burbuja.
  const mostrarFraseDeAde = (frase: string) => {
    if (!frase) return;
    setAdePhrase(frase);
    setTimeout(() => setAdePhrase(''), 4000);
  };

  const spawnSpark = useCallback(() => {
    if (showFusion) return; // Don't spawn while in fusion ronda

    // Pickeamos una PalabraModo del pool del modo activo. La palabra
    // visible (.word) puede ser PIVOT, RESPIRO, etc. El tipo canónico
    // (.tipo) es siempre uno de los 8 — sirve para color, perfil, fusión.
    const palabra = palabras[Math.floor(Math.random() * palabras.length)];
    const color = MODO_COLOR[palabra.tipo] ?? '#FFD740';

    const newSpark: Spark = {
      id: Date.now(),
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 45,
      size: 50 + Math.random() * 30,
      label: palabra.word,
      tipo: palabra.tipo,
      color: color,
    };

    // Límite de 6 sparks simultáneos (auditoría §3.5). El check vive en
    // el functional setState para no agregar `sparks` a las deps del
    // useCallback — eso recrearía el callback en cada captura y
    // reiniciaría el setInterval del useEffect.
    setSparks(prev => (prev.length >= 6 ? prev : [...prev, newSpark]));
  }, [showFusion, palabras]);

  useEffect(() => {
    if (showFusion || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Leemos el score más reciente sin meterlo en deps + las
          // métricas crudas de la sesión (lectura.ts las convierte
          // en 3 observaciones).
          onEnd(scoreRef.current, sesionMetricsRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawn rate ajustado por el ánimo de Ade. filoso/ansioso → más rápido,
    // sereno/atento → más lento. Base 1200ms × spawnFactor.
    const sparkInterval = setInterval(
      spawnSpark,
      Math.round(1200 * humor.spawnFactor)
    );

    return () => {
      clearInterval(timer);
      clearInterval(sparkInterval);
    };
    // 'score' YA NO va en este array; lo leemos por ref.
    // 'onEnd' es seguro porque está memoizado en App.tsx (PARCHE 0).
  }, [onEnd, spawnSpark, showFusion, humor.spawnFactor, isPaused]);

  const handleSparkClick = (sparkId: number) => {
    if (showFusion) return;

    const spark = sparks.find(s => s.id === sparkId);
    if (!spark) return;
    triggerAdeState('hunt', 1000);

    // CABLE A adeProfile: registramos la captura con su delta de tiempo
    // desde la captura anterior. spark.tipo ya es canónico (lowercase
    // entre los 8) gracias al sistema modos.ts — no más toLowerCase.
    const ahora = Date.now();
    const deltaMs = ahora - lastCaptureTimeRef.current;
    lastCaptureTimeRef.current = ahora;
    registrarCaptura(spark.tipo, deltaMs);

    // Métricas crudas para la lectura final del GameOver.
    const m = sesionMetricsRef.current;
    m.capturasPorTipo[spark.tipo] = (m.capturasPorTipo[spark.tipo] || 0) + 1;
    m.velocidades.push(deltaMs);

    // Buffer ronda 2: empujamos el TIPO canónico, no el label visible.
    // FusionRonda hace toLowerCase + esTipoCanonico para defensa, así
    // que pasarle el tipo directo evita que palabras tipo "PIVOT" o
    // "RESPIRO" sean filtradas por no matchear ninguno de los 8.
    setRecentChispas(prev => [...prev, spark.tipo].slice(-5));

    const newCombo = combo + 1;
    setCombo(newCombo);
    const ptsGanados = 10 + (newCombo * 2);
    setScore(prev => prev + ptsGanados);

    // Sonido de captura — auditoría §5.2: faltaba peso multi-sensorial.
    sound.capture();

    // Burst de partículas en el punto del spark — feedback inmediato
    // (decisión usuario: "el caos no es un botón"). Cada captura SIENTE.
    // Auto-cleanup a los 900ms para que el array no crezca.
    const burstId = ahora + Math.floor(Math.random() * 1000);
    setBursts(prev => [
      ...prev,
      {
        id: burstId,
        x: spark.x,
        y: spark.y,
        color: spark.color,
        pts: ptsGanados,
      },
    ]);
    setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== burstId));
    }, 900);

    // FLOW MODE: al cruzar de 2 a 3 capturas seguidas, dispara overlay
    // dorado + pose eureka de Ade. Ahora seguro porque ade-eureka.png
    // es full-body (gato sentado con pata levantada y bombilla — sprite
    // canónico, alma sec.3 + biblia sec.7 — alegría sin caricatura).
    if (newCombo === 3) {
      setFlowActive(true);
      // FLOW MODE — usamos 'fuse' aquí (el "estado activo de creación").
      // Aunque la fusión real abre con FusionRonda, el FLOW es el
      // momento en que las ideas empiezan a combinarse mentalmente.
      triggerAdeState('fuse', 1800);
      sound.flow();
      setTimeout(() => setFlowActive(false), 1800);
    }

    // Fusión por anillo: cada captura suma un arco al IndicadorAcumulacion.
    // Cuando los 5 arcos están encendidos, abrimos FusionRonda. NO se
    // muestra texto ("Ya vi suficiente") — el cierre visual del anillo
    // dorado es la única señal. El usuario aprende el ritmo.
    // Filosofía (informe §12): cero números, cero frases redundantes.
    // El miss NO resetea fusionPath — la acumulación es lineal.
    const newPath = fusionPath + 1;
    setFusionPath(newPath);

    if (newPath >= 5) {
      // Anillo cerrado — Ade pasa a 'fuse', el modal de FusionRonda
      // se monta 1.1s después con la pose ya establecida.
      triggerAdeState('fuse', 1100);
      sound.fusion();
      setTimeout(() => {
        setShowFusion(true);
      }, 1100);
    } else {
      // Frase de captura — sigue derivada del perfil. Si no hay señal
      // suficiente, getFraseAde devuelve '' y la burbuja no aparece.
      mostrarFraseDeAde(getFraseAde('captura'));
    }

    setSparks(prev => prev.filter(s => s.id !== sparkId));
  };

  const handleMiss = () => {
    if (showFusion) return;
    setCombo(1);
    triggerAdeState('offended', 2000);
  };

  const getAdeImage = () => {
    // Map del estado cognitivo al asset correspondiente. Default es
    // 'scan' (la base del gameplay activo), no 'idle' (que es de Home).
    switch (adeState) {
      case 'hunt':      return ASSETS.adeHunt;
      case 'fuse':      return ASSETS.adeFuse;
      case 'interpret': return ASSETS.adeInterpret;
      case 'offended':  return ASSETS.adeOffended;
      default:          return ASSETS.adeScan;
    }
  };

  // Construye el FusionContext con la velocidad promedio de la sesión,
  // el modo activo y la racha del perfil. La función se llama solo cuando
  // FusionRonda se va a renderizar (showFusion === true), así que no es
  // costosa: el reduce sobre `velocidades` es trivial (< 200 entradas) y
  // getPerfilCompleto lee localStorage una sola vez por monte.
  const buildFusionContext = (): FusionContext => {
    const v = sesionMetricsRef.current.velocidades;
    const velocidadPromedio = v.length
      ? v.reduce((s, x) => s + x, 0) / v.length
      : 0;
    return {
      velocidadPromedio,
      modo,
      racha: getPerfilCompleto().racha || 0,
    };
  };

  // Handler de cierre de FusionRonda. El parámetro `guardada` distingue
  // entre el cierre tras un Save (no cuenta como skip) y un cierre por
  // X / "Saltar" / tap-out (cuenta como saltadasFusion para la lectura).
  // Default false — FusionRonda llama a este sin args desde el botón
  // "Saltar" / X, así que el default cubre ese caso.
  const closeFusion = (guardada: boolean = false) => {
    if (!guardada) {
      sesionMetricsRef.current.saltadasFusion += 1;
    }
    setShowFusion(false);
    setRecentChispas([]);  // reinicia buffer para la próxima ronda
    setFusionPath(0);      // anillo vuelve a vacío para el próximo ciclo
    triggerAdeState('scan');
  };

  // Handler de guardar idea desde FusionRonda. Recibe el insight de la
  // matriz + el texto del usuario (puede ser vacío) + los 2 modos.
  // Persiste como idea con spark = modoA dominante (alma sec.5).
  const handleFusionSave = ({
    text,
    insight,
    modoA,
  }: {
    text: string;
    insight: string;
    modoA: string;
    modoB: string;
  }) => {
    const ideaType: 'locas' | 'mejores' | 'útiles' =
      MODO_TO_TYPE[modoA] ?? 'locas';
    const pointsEarned = 25 + (combo * 5);

    saveIdeaToStorage({
      id: Date.now(),
      date: new Date().toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }),
      text: text.trim() || insight,  // si el usuario no escribió, guardamos el insight
      spark: modoA.toUpperCase(),
      vibe: VIBE_DE_MODO[modoA] ?? 'Oro',
      score: pointsEarned,
      type: ideaType,
    });

    registrarIdeaGuardada();
    sesionMetricsRef.current.guardadas += 1;
    setScore(prev => prev + pointsEarned);
    closeFusion(true); // marca como guardada — no incrementa saltadasFusion
    mostrarFraseDeAde(getFraseAde('idea'));
  };

  return (
    <div
      className="relative min-h-screen-safe pb-safe pt-safe text-white overflow-hidden select-none"
      style={{
        // Fondo nocturno: deep blue arriba → púrpura medio → marrón cálido
        // abajo. Stops más densos para que la transición sea perceptible y
        // no se lea como navy plano.
        background:
          'linear-gradient(180deg, #0a0a1f 0%, #1d1530 35%, #3a2230 65%, #4a2a15 100%)',
      }}
      onClick={(e) => {
        // If clicked background and not hitting a spark, count as miss
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'main') {
          handleMiss();
        }
      }}
    >
      {/* Luna cálida difusa — spec actualizada: top 8%, right 8%, 180×180,
          rgba(255,220,100,0.20), blur 40px, z-index 0. Todo el contenido
          (HUD z-20, main z-10, Ade z-30) queda por encima de este fondo. */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%',
            right: '8%',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(255, 220, 100, 0.20)',
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />
      </div>

      {/* Modo activo — chip discreto. Tipografía mínima en blanco/40,
          uppercase, tracking ancho. Biblia: el contexto se susurra,
          no se grita. */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
        <span
          className="text-[9px] font-black uppercase tracking-[0.4em]"
          style={{ color: 'rgba(255, 255, 255, 0.45)' }}
        >
          Modo · {modoLabel}
        </span>
        {/* Adjetivo del ánimo — susurra el humor de Ade. Solo visible
            cuando el perfil tiene un dominante claro (sin esto, sería
            ruido para usuarios nuevos). Tono biblia: se nota o no se nota. */}
        {humor.adjetivo && (
          <span
            className="text-[10px] italic mt-0.5 tracking-wide"
            style={{ color: 'rgba(255, 255, 255, 0.62)' }}
          >
            {humor.adjetivo}
          </span>
        )}
      </div>

      {/* PROFESSIONAL HUD */}
      <header className="relative z-20 flex flex-col p-6 pt-10 gap-6 pointer-events-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => onEnd(score, sesionMetricsRef.current)} className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 px-4">
            {/* HUD container — spec: bg #111111, radius 16px, padding 8px 16px,
                border 1px rgba(255,255,255,0.1). */}
            <div
              className="flex items-center justify-between"
              style={{
                background: '#111111',
                borderRadius: '16px',
                padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ade-gold/20 rounded-xl flex items-center justify-center border border-ade-gold/30">
                  <Timer className="w-5 h-5 text-ade-gold" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tiempo</span>
                  {/* Timer en blanco. */}
                  <span className="text-xl font-black font-mono leading-none text-white">{timeLeft}s</span>
                </div>
              </div>

              {/* CHISPAS: NN eliminado — decisión editorial (informe §12).
                  El score interno se mantiene (pasa a GameOver vía onEnd)
                  pero ya no se muestra durante el juego. La acumulación
                  hacia la fusión se ve en el anillo dorado del cat, no
                  en un counter numérico. Filosofía: ADE no premia,
                  observa. */}
            </div>
          </div>

          <button
            onClick={() => setIsPaused(true)}
            aria-label="Pausar juego"
            className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
          >
            <Pause className="w-6 h-6" />
          </button>
        </div>

        {/* Combo Bar — Combo en amarillo #FFD600 bold (spec). */}
        <div className="flex items-center gap-3 px-2">
           <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full"
                style={{
                  background: '#FFD600',
                  boxShadow: '0 0 10px rgba(255, 214, 0, 0.5)',
                }}
                animate={{ width: `${Math.min((combo / 10) * 100, 100)}%` }}
              />
           </div>
           <div className="flex items-center gap-1.5 min-w-[80px]">
              <Zap
                className="w-4 h-4"
                style={{
                  color: combo > 1 ? '#FFD600' : 'rgba(255,255,255,0.2)',
                  fill: combo > 1 ? '#FFD600' : 'transparent',
                }}
              />
              <span
                className="text-sm font-black"
                style={{ color: combo > 1 ? '#FFD600' : 'rgba(255,255,255,0.2)' }}
              >
                {combo >= 10 ? 'Flow x10' : combo >= 5 ? 'Flow x5' : combo >= 3 ? 'Flow x3' : `x${combo}`}
              </span>
           </div>
        </div>
      </header>

      {/* GAMEPLAY CANVAS */}
      <main className="relative z-10 flex-1 h-[60vh] overflow-visible pointer-events-auto">
        {/* ── Bursts de captura — feedback inmediato.
            Cada captura genera un burst que renderiza en el punto del
            spark: 8 partículas radiando + número flotante con los pts.
            pointer-events-none para que no bloquee otros sparks. */}
        <AnimatePresence>
          {bursts.map(burst => (
            <div
              key={burst.id}
              className="absolute pointer-events-none z-20"
              style={{
                left: `${burst.x}%`,
                top: `${burst.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Partículas radiando — 8 puntos en círculo */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                const angle = (i / 8) * Math.PI * 2;
                const dx = Math.cos(angle) * 42;
                const dy = Math.sin(angle) * 42;
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: '6px',
                      height: '6px',
                      background: burst.color,
                      boxShadow: `0 0 8px ${burst.color}`,
                      left: '50%',
                      top: '50%',
                      marginLeft: '-3px',
                      marginTop: '-3px',
                    }}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: dx, y: dy, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                );
              })}
              {/* Anillo expansivo central — pulse de eco */}
              <motion.div
                className="absolute rounded-full border-2"
                style={{
                  borderColor: burst.color,
                  left: '50%',
                  top: '50%',
                  width: '14px',
                  height: '14px',
                  marginLeft: '-7px',
                  marginTop: '-7px',
                }}
                initial={{ scale: 0.5, opacity: 0.85 }}
                animate={{ scale: 4.5, opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
              {/* +pts flotante — texto subiendo + fade */}
              <motion.span
                className="absolute font-black text-base"
                style={{
                  color: burst.color,
                  textShadow: '0 2px 6px rgba(0,0,0,0.55)',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap',
                }}
                initial={{ y: 0, opacity: 0, scale: 0.7 }}
                animate={{ y: -36, opacity: [0, 1, 1, 0], scale: 1.05 }}
                transition={{ duration: 0.85, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
              >
                +{burst.pts}
              </motion.span>
            </div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {sparks.map(spark => (
            <motion.div
              key={spark.id}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute cursor-pointer flex flex-col items-center justify-center"
              style={{ left: `${spark.x}%`, top: `${spark.y}%`, width: spark.size, height: spark.size }}
              onClick={(e) => {
                e.stopPropagation();
                handleSparkClick(spark.id);
              }}
            >
              {/* Orb */}
              <div
                className="absolute inset-0 rounded-full blur-md opacity-60 animate-pulse"
                style={{ backgroundColor: spark.color }}
              />
              <div
                className="absolute inset-[20%] rounded-full shadow-[0_0_15px_white]"
                style={{ backgroundColor: spark.color }}
              />
              {/* Ajuste 2 — Label ENCIMA del orbe (no dentro). Tamaño y
                  animación del orbe sin cambios; solo se reposiciona el span. */}
              <span
                className="absolute font-black uppercase text-white drop-shadow-md pointer-events-none"
                style={{
                  bottom: '100%',
                  marginBottom: '6px',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 6px rgba(0,0,0,0.55)',
                }}
              >
                {spark.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Character — Animaciones expresivas por estado cognitivo.
            Cada estado tiene un keyframe + transición pensada para
            transmitir el "alma" del momento (alma sec.1: Ade es entidad viva).
              scan      → respiración + flotación lenta (3.6s loop) — la base
              hunt      → salto rápido tipo pounce, mantiene scale arriba
              fuse      → 3 saltitos celebración + scale variable (era eureka)
              interpret → respiración suspendida, scale 1, no flotación
              offended  → slump leve hacia abajo + tilt -3° */}
        <motion.div
          animate={
            adeState === 'scan' ? {
              y: [0, -12, 0],
              scale: [1, 1.02, 1],
              rotate: 0,
            } : adeState === 'hunt' ? {
              y: [-40, -32, -38, -32],
              scale: [1.18, 1.12, 1.15, 1.12],
              rotate: 0,
            } : adeState === 'fuse' ? {
              y: [0, -22, -6, -16, -8],
              scale: [1, 1.15, 1.05, 1.12, 1.08],
              rotate: 0,
            } : adeState === 'interpret' ? {
              y: 0,
              scale: 1,
              rotate: 0,
            } : adeState === 'offended' ? {
              y: 6,
              scale: 0.96,
              rotate: -3,
            } : { y: 0, scale: 1, rotate: 0 }
          }
          transition={
            adeState === 'scan' ? {
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
            } : adeState === 'hunt' ? {
              duration: 0.55,
              ease: 'easeOut',
            } : adeState === 'fuse' ? {
              duration: 0.85,
              ease: 'easeInOut',
            } : adeState === 'interpret' ? {
              duration: 0.5,
              ease: 'easeOut',
            } : adeState === 'offended' ? {
              duration: 0.45,
              ease: 'easeOut',
            } : { duration: 0.3 }
          }
          className="absolute bottom-4 left-4 md:left-12 w-44 md:w-64 max-w-full aspect-[1.5/1] pointer-events-none z-30"
        >
          {/* Indicador de acumulación — anillo dorado de 5 arcos que
              rodea al cat. Cada captura enciende un arco; los 5 cerrados
              disparan FusionRonda. Sin números visibles.
              Posicionado en un cuadrado centrado dentro del wrapper
              (que es 1.5:1) — width 65% del wrapper preserva proporción
              circular. */}
          <div
            className="absolute pointer-events-none z-0"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '65%',
              aspectRatio: '1 / 1',
            }}
          >
            <IndicadorAcumulacion path={fusionPath} />
          </div>

          {/* Fase 3.4 — parpadeo sutil solo en idle. Las otras poses
              son transiciones cortas (0.5-0.85s); blink se cortaría.
              Wrapper ya hace la "respiración" (y + scale en idle), así
              que la img solo añade un opacity dip de ~120ms cada 5.3s. */}
          <motion.img
            src={getAdeImage()}
            alt="Ade"
            className="w-full h-full object-contain"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
              objectPosition: 'bottom',
            }}
            animate={adeState === 'scan' && !reducedMotion
              ? { opacity: [1, 1, 0.82, 1, 1, 1, 1, 0.82, 1, 1] }
              : { opacity: 1 }
            }
            transition={adeState === 'scan' && !reducedMotion
              ? {
                  // duración del ciclo de parpadeo viene del ánimo de
                  // Ade. filoso/ansioso → más rápido, sereno/atento →
                  // más lento. Convertimos ms → s para framer.
                  duration: humor.parpadeoMs / 1000,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.3, 0.32, 0.35, 0.5, 0.7, 0.86, 0.88, 0.9, 1],
                }
              : { duration: 0.2 }
            }
          />
          
          {/* Burbuja de Ade — auditoría §3.6: ahora posicionada sobre el cat
              (no flotando lejos) con cola SVG que apunta a su cabeza.
              transformOrigin bottom asegura que el pop animation salga
              desde el lado correcto. */}
          <AnimatePresence>
            {adePhrase && (
              <motion.div
                key="ade-phrase-bubble"
                initial={{ opacity: 0, y: 8, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                style={{ transformOrigin: 'bottom center' }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white text-ade-dark px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border border-white/20 max-w-[180px] whitespace-normal text-center"
              >
                {adePhrase}
                {/* Cola del bubble — apunta a la cabeza del cat justo debajo. */}
                <svg
                  className="absolute left-1/2 -translate-x-1/2 -bottom-2 pointer-events-none"
                  width="14"
                  height="9"
                  viewBox="0 0 14 9"
                  aria-hidden="true"
                >
                  <path d="M0 0 L14 0 L7 9 Z" fill="white" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Overlay de Pausa — bloquea timer + spawn + sparks. Tap o ESC reanuda.
          Auditoría §8.2: el botón Pause era placeholder. Ahora freeza la sesión. */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPaused(false)}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
            style={{ background: 'rgba(10, 10, 20, 0.78)', backdropFilter: 'blur(8px)' }}
          >
            <Pause className="w-16 h-16 mb-4" style={{ color: '#FFD600' }} />
            <p className="text-2xl font-black tracking-wider uppercase text-white mb-2">Pausa</p>
            <p className="text-sm italic text-white/60">Toca para continuar.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOW MODE banner — pulse dorado central + Ade en pose eureka */}
      <AnimatePresence>
        {flowActive && (
          <motion.div
            key="flow-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            {/* Glow background pulsante */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255, 214, 0, 0.22) 0%, rgba(255, 214, 0, 0.08) 40%, transparent 70%)',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Texto FLOW — auditoría §5.3: era 56px y dominaba la pantalla
                en un juego contemplativo. Bajado a 28px y posicionado arriba
                para que no compita con sparks/cat. Sigue comunicando el
                estado de FLOW pero como pista, no como evento dominante. */}
            <motion.span
              initial={{ scale: 0.8, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              className="font-black uppercase select-none absolute top-32"
              style={{
                color: '#FFD600',
                fontSize: '28px',
                letterSpacing: '0.5em',
                textShadow:
                  '0 0 16px rgba(255, 214, 0, 0.7), 0 0 32px rgba(255, 214, 0, 0.35)',
              }}
            >
              FLOW
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FusionRonda — Ronda 2 (Camino C). Reemplaza el viejo Eureka modal.
          Se abre tras 5 capturas; el usuario tapea 2 chispas para fusionar
          y obtiene el insight de la matriz fusiones.ts. */}
      <AnimatePresence>
        {showFusion && (
          <FusionRonda
            chispas={recentChispas}
            onSave={handleFusionSave}
            onClose={closeFusion}
            context={buildFusionContext()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
