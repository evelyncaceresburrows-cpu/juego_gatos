import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Pause, ChevronLeft } from 'lucide-react';
import adeEureka from '../assets/ade/characters/ade-eureka.png';
import adeHunt from '../assets/ade/characters/ade-hunt.png';
import adeIdle from '../assets/ade/characters/ade-idle.png';
import adeOffended from '../assets/ade/characters/ade-offended.png';
import { saveIdeaToStorage } from '../lib/storage';
import {
  registrarCaptura,
  registrarIdeaGuardada,
  getFraseAde,
  type TipoChispa,
} from '../systems/adeProfile';
import {
  getPalabrasParaModo,
  MODOS,
  type ModoJuegoId,
} from '../systems/modos';
import FusionRonda from './FusionRonda';

interface GameProps {
  onEnd: (score: number) => void;
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
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(1);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [adeState, setAdeState] = useState<'idle' | 'hunt' | 'eureka' | 'offended'>('idle');
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

  // Buffer de las últimas 5 chispas capturadas — alimenta la ronda 2
  // (FusionRonda). Se reinicia tras cada fusión.
  const [recentChispas, setRecentChispas] = useState<string[]>([]);
  const [showFusion, setShowFusion] = useState(false);

  const triggerAdeState = (
    state: 'idle' | 'hunt' | 'eureka' | 'offended',
    duration: number = 2000
  ) => {
    setAdeState(state);

    // Cancelamos cualquier timeout previo y dejamos el ref limpio.
    if (adeTimeout.current) {
      clearTimeout(adeTimeout.current);
      adeTimeout.current = null;
    }

    // Eureka es estado pegajoso (lo cierra el modal); para los demás,
    // volvemos a 'idle' después de `duration` ms.
    if (state !== 'eureka') {
      adeTimeout.current = setTimeout(() => {
        setAdeState('idle');
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

    setSparks(prev => [...prev, newSpark]);
  }, [showFusion, palabras]);

  useEffect(() => {
    if (showFusion) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Leemos el score más reciente sin meterlo en deps:
          onEnd(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const sparkInterval = setInterval(spawnSpark, 1200);

    return () => {
      clearInterval(timer);
      clearInterval(sparkInterval);
    };
    // 'score' YA NO va en este array; lo leemos por ref.
    // 'onEnd' es seguro porque está memoizado en App.tsx (PARCHE 0).
  }, [onEnd, spawnSpark, showFusion]);

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

    // Buffer ronda 2: empujamos el TIPO canónico, no el label visible.
    // FusionRonda hace toLowerCase + esTipoCanonico para defensa, así
    // que pasarle el tipo directo evita que palabras tipo "PIVOT" o
    // "RESPIRO" sean filtradas por no matchear ninguno de los 8.
    setRecentChispas(prev => [...prev, spark.tipo].slice(-5));

    const newCombo = combo + 1;
    setCombo(newCombo);
    setScore(prev => prev + 10 + (newCombo * 2));

    // FLOW MODE: al cruzar de 2 a 3 capturas seguidas, dispara overlay
    // dorado + pose eureka de Ade. Ahora seguro porque ade-eureka.png
    // es full-body (gato sentado con pata levantada y bombilla — sprite
    // canónico, alma sec.3 + biblia sec.7 — alegría sin caricatura).
    if (newCombo === 3) {
      setFlowActive(true);
      triggerAdeState('eureka', 1800);
      setTimeout(() => setFlowActive(false), 1800);
    }

    if (newCombo % 5 === 0) {
      // Camino C híbrido: tras 5 capturas, Ade dice una línea breve y
      // se abre la Ronda 2 (FusionRonda). Reemplaza el viejo Eureka modal.
      mostrarFraseDeAde('Ya vi suficiente. Júntalas.');
      setTimeout(() => {
        setShowFusion(true);
        triggerAdeState('eureka');
      }, 1100);
    } else {
      // Antes: random 30% chance + frase genérica del array.
      // Ahora: siempre intentamos leer del perfil. Si el perfil aún no
      // tiene señal suficiente, getFraseAde puede devolver '' y la
      // burbuja simplemente no aparece — preferible al ruido.
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
    switch (adeState) {
      case 'hunt': return adeHunt;
      case 'eureka': return adeEureka;
      case 'offended': return adeOffended;
      default: return adeIdle;
    }
  };

  // Handler de cierre de FusionRonda — usuario decidió saltar.
  const closeFusion = () => {
    setShowFusion(false);
    setRecentChispas([]);  // reinicia buffer para la próxima ronda
    triggerAdeState('idle');
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
    setScore(prev => prev + pointsEarned);
    closeFusion();
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
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <span
          className="text-[9px] font-black uppercase tracking-[0.4em]"
          style={{ color: 'rgba(255, 255, 255, 0.45)' }}
        >
          Modo · {modoLabel}
        </span>
      </div>

      {/* PROFESSIONAL HUD */}
      <header className="relative z-20 flex flex-col p-6 pt-10 gap-6 pointer-events-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => onEnd(score)} className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-transform">
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

              <div className="w-px h-8 bg-white/10 mx-2" />

              <div className="flex flex-col items-end">
                {/* Puntaje renombrado a CHISPAS (alma sec.5 — métricas con
                    significado emocional, no genéricas). */}
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Chispas</span>
                <span className="text-2xl font-black leading-none text-white">{score.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
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

        {/* Character — Animaciones expresivas por estado.
            Cada estado tiene un keyframe + transición pensada para
            transmitir el "alma" del momento (alma sec.1: Ade es entidad viva).
              idle     → respiración + flotación lenta (3.6s loop)
              hunt     → salto rápido tipo pounce, mantiene scale arriba
              eureka   → 3 saltitos celebración + scale variable
              offended → slump leve hacia abajo + tilt -3° */}
        <motion.div
          animate={
            adeState === 'idle' ? {
              y: [0, -12, 0],
              scale: [1, 1.02, 1],
              rotate: 0,
            } : adeState === 'hunt' ? {
              y: [-40, -32, -38, -32],
              scale: [1.18, 1.12, 1.15, 1.12],
              rotate: 0,
            } : adeState === 'eureka' ? {
              y: [0, -22, -6, -16, -8],
              scale: [1, 1.15, 1.05, 1.12, 1.08],
              rotate: 0,
            } : adeState === 'offended' ? {
              y: 6,
              scale: 0.96,
              rotate: -3,
            } : { y: 0, scale: 1, rotate: 0 }
          }
          transition={
            adeState === 'idle' ? {
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
            } : adeState === 'hunt' ? {
              duration: 0.55,
              ease: 'easeOut',
            } : adeState === 'eureka' ? {
              duration: 0.85,
              ease: 'easeInOut',
            } : adeState === 'offended' ? {
              duration: 0.45,
              ease: 'easeOut',
            } : { duration: 0.3 }
          }
          className="absolute bottom-4 left-4 md:left-12 w-56 md:w-72 aspect-[1.5/1] pointer-events-none z-30"
        >
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
            animate={adeState === 'idle'
              ? { opacity: [1, 1, 0.82, 1, 1, 1, 1, 0.82, 1, 1] }
              : { opacity: 1 }
            }
            transition={adeState === 'idle'
              ? {
                  duration: 5.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.3, 0.32, 0.35, 0.5, 0.7, 0.86, 0.88, 0.9, 1],
                }
              : { duration: 0.2 }
            }
          />
          
          {/* Burbuja de Ade — entrada tipo pop con leve overshoot, salida
              suave. Sale desde la cabeza del gato (top-right) hacia arriba.
              AnimatePresence permite que el exit se anime al desmontar. */}
          <AnimatePresence>
            {adePhrase && (
              <motion.div
                key="ade-phrase-bubble"
                initial={{ opacity: 0, y: 8, scale: 0.85, transformOrigin: 'bottom left' }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="absolute -top-12 -right-24 bg-white text-ade-dark px-4 py-2 rounded-2xl rounded-bl-none text-xs font-bold shadow-xl border border-white/20 max-w-[150px]"
              >
                {adePhrase}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

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
            {/* Texto FLOW */}
            <motion.span
              initial={{ scale: 0.7, y: 10 }}
              animate={{ scale: [1, 1.08, 1], y: 0 }}
              transition={{
                scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: 0.4, type: 'spring', damping: 12 },
              }}
              className="font-black uppercase select-none"
              style={{
                color: '#FFD600',
                fontSize: '56px',
                letterSpacing: '0.4em',
                textShadow:
                  '0 0 30px rgba(255, 214, 0, 0.9), 0 0 60px rgba(255, 214, 0, 0.5)',
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
