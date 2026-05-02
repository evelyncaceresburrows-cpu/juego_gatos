import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Pause, ChevronLeft, Target } from 'lucide-react';
import adeEureka from '../assets/ade/characters/ade-eureka.png';
import adeHunt from '../assets/ade/characters/ade-hunt.png';
import adeIdle from '../assets/ade/characters/ade-idle.png';
import adeOffended from '../assets/ade/characters/ade-offended.png';
import { saveIdeaToStorage } from '../lib/storage';
import {
  registrarCaptura,
  registrarIdeaGuardada,
  getFraseAde,
} from '../systems/adeProfile';

interface GameProps {
  onEnd: (score: number) => void;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
}

// Reducido a los 8 modos mentales del alma (ADE-alma.md sección 2).
// 'Sombra' / 'Mapa' / 'Juego' / 'Pulso' se quitaron porque no son
// modos canónicos y registrarCaptura los hubiera ignorado.
const SPARK_WORDS = ['CAOS', 'ECO', 'DESEO', 'RITUAL', 'BRILLO', 'RUIDO', 'SECRETO', 'ERROR'];

const SPARK_COLORS = [
  { type: 'Oro', color: '#FFD740' },
  { type: 'Azul', color: '#40C4FF' },
  { type: 'Verde', color: '#69F0AE' },
  { type: 'Morado', color: '#B088FF' },
];

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

// Prompts del modal Eureka, ahora modo-específicos. Cada modo tiene
// 2 invitaciones distintas para que "Otra Chispa" alterne sin salir del
// territorio mental que disparó la captura. Cumple ADE-alma sec.2:
// las chispas son conceptos, no items intercambiables.
const PROMPTS_POR_MODO: Record<string, string[]> = {
  caos: [
    '¿Qué regla vas a romper para que esto exista?',
    '¿Y si dejas que lo desorganizado gane?',
  ],
  eco: [
    '¿Para quién resuena? ¿Por qué ahora?',
    '¿Qué se va a propagar de esto?',
  ],
  deseo: [
    '¿Qué querías realmente? Dilo sin filtro.',
    '¿Qué sientes que falta? Nómbralo.',
  ],
  ritual: [
    '¿Qué patrón estás repitiendo? Dale forma.',
    '¿Cómo se vuelve esto un hábito?',
  ],
  brillo: [
    '¿Qué de esto NO existe todavía en el mundo?',
    '¿Qué tiene esto que no tiene nadie más?',
  ],
  ruido: [
    '¿Qué hay debajo de la distracción?',
    '¿Qué señal estás filtrando?',
  ],
  secreto: [
    '¿Qué no le has dicho a nadie? Empieza por eso.',
    '¿Qué te guardas que ya es hora de soltar?',
  ],
  error: [
    '¿Cuál es el giro inesperado que viste?',
    '¿Qué se rompió y qué descubriste con eso?',
  ],
};

function promptsParaModo(modo: string): string[] {
  return PROMPTS_POR_MODO[modo.toLowerCase()] ?? PROMPTS_POR_MODO.caos;
}

const Game: React.FC<GameProps> = ({ onEnd }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(1);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [adeState, setAdeState] = useState<'idle' | 'hunt' | 'eureka' | 'offended'>('idle');
  const [adePhrase, setAdePhrase] = useState('');
  
  // Eureka Modal
  const [showEureka, setShowEureka] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [ideaText, setIdeaText] = useState('');
  const [currentSparkType, setCurrentSparkType] = useState<{word: string, colorType: string} | null>(null);

  const adeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mejora 02 — scoreRef permite leer el score más reciente sin meterlo
  // en deps del useEffect del timer (evita churn de intervals por captura).
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Cable a adeProfile: timestamp de la captura anterior, para calcular
  // delta y alimentar perfil.velocidad (ms entre capturas).
  // En la primera captura, el delta es desde el mount del componente.
  const lastCaptureTimeRef = useRef<number>(Date.now());

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
    if (showEureka) return; // Don't spawn while in Eureka modal

    const word = SPARK_WORDS[Math.floor(Math.random() * SPARK_WORDS.length)];
    // Color fijo por modo: cada chispa siempre tiene el mismo color que
    // su modo (alma sec.2 — chispas son conceptos, no items random).
    const color = MODO_COLOR[word.toLowerCase()] ?? '#FFD740';

    const newSpark: Spark = {
      id: Date.now(),
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 45,
      size: 50 + Math.random() * 30,
      label: word,
      color: color,
    };

    setSparks(prev => [...prev, newSpark]);
  }, [showEureka]);

  useEffect(() => {
    if (showEureka) return;

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
  }, [onEnd, spawnSpark, showEureka]);

  const openEureka = () => {
    setShowEureka(true);
    triggerAdeState('eureka');
    // Prompt específico del modo de la chispa que disparó este Eureka.
    const modo = (currentSparkType?.word || 'caos').toLowerCase();
    const prompts = promptsParaModo(modo);
    setCurrentQuestion(prompts[0]);
  };

  const handleSparkClick = (sparkId: number) => {
    if (showEureka) return;

    const spark = sparks.find(s => s.id === sparkId);
    if (!spark) return;
    triggerAdeState('hunt', 1000);

    // CABLE A adeProfile: registramos la captura con su delta de tiempo
    // desde la captura anterior. La primera captura mide tiempo desde
    // el mount del componente. registrarCaptura ignora silenciosamente
    // tipos no canónicos, pero SPARK_WORDS ya está restringido a los 8.
    const ahora = Date.now();
    const deltaMs = ahora - lastCaptureTimeRef.current;
    lastCaptureTimeRef.current = ahora;
    registrarCaptura(spark.label.toLowerCase(), deltaMs);

    const newCombo = combo + 1;
    setCombo(newCombo);
    setScore(prev => prev + 10 + (newCombo * 2));

    if (newCombo % 5 === 0) {
      setCurrentSparkType({
        word: spark.label,
        colorType: SPARK_COLORS.find(c => c.color === spark.color)?.type || 'Oro'
      });
      setTimeout(() => openEureka(), 800);
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
    if (showEureka) return;
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

  const saveIdea = () => {
    // Lectura del modo de la chispa que disparó este Eureka. Si por
    // legacy currentSparkType no es uno de los 8 canónicos, fallback a
    // 'locas' (el bucket más permisivo). Las capturas nuevas siempre caen
    // en alguno de los 8 porque SPARK_WORDS está restringido.
    const sparkKey = (currentSparkType?.word || '').toLowerCase();
    const ideaType: 'locas' | 'mejores' | 'útiles' =
      MODO_TO_TYPE[sparkKey] ?? 'locas';

    const pointsEarned = 25 + (combo * 5);
    
    saveIdeaToStorage({
      id: Date.now(),
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      text: ideaText,
      spark: currentSparkType?.word || 'Caos',
      vibe: currentSparkType?.colorType || 'Oro',
      score: pointsEarned,
      type: ideaType
    });

    // Cable a adeProfile: marca que el usuario guardó una idea para
    // que ideasGuardadas se incremente y las frases que dependen de
    // ese campo (ej: "Juegas bien. Pero no guardas nada.") puedan
    // disparar correctamente.
    registrarIdeaGuardada();

    setScore(prev => prev + pointsEarned);
    closeEureka();

    // Lectura de Ade tras guardar la idea (alma sec.3 — feedback como
    // lectura, no como felicitación). La frase se elige según el modo
    // de la chispa que disparó este Eureka (último en historial).
    mostrarFraseDeAde(getFraseAde('idea'));
  };

  const closeEureka = () => {
    setShowEureka(false);
    setIdeaText('');
    triggerAdeState('idle');
  };

  return (
    <div
      className="relative min-h-screen text-white overflow-hidden select-none"
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
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Puntaje</span>
                {/* Puntaje en blanco bold (era ade-gold). */}
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
          <img
            src={getAdeImage()}
            alt="Ade"
            className="w-full h-full object-contain"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
              objectPosition: 'bottom',
            }}
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

      {/* Eureka Modal Overlay */}
      <AnimatePresence>
        {showEureka && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-ade-dark/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-ade-beige text-ade-dark w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden pointer-events-auto"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-ade-gold/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-ade-gold rounded-full border-4 border-white shadow-inner flex items-center justify-center overflow-hidden">
                    <img src={adeEureka} alt="Ade Eureka" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-black text-ade-accent text-xs tracking-widest uppercase">Ade detectó algo...</h3>
                    <p className="font-bold text-lg leading-tight mt-1">{currentQuestion}</p>
                  </div>
                </div>
                
                <textarea 
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="Escribe tu idea aquí..."
                  className="w-full bg-white/50 border-2 border-ade-dark/10 rounded-xl p-4 min-h-[120px] resize-none focus:outline-none focus:border-ade-accent transition-colors text-sm font-medium"
                />
                
                <div className="flex flex-col gap-2 mt-2">
                  <button onClick={saveIdea} disabled={!ideaText.trim()} className="w-full py-4 bg-ade-dark text-white rounded-xl font-black tracking-widest text-xs uppercase hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none">
                    Guardar Idea (+25pts)
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Cicla entre los 2 prompts del mismo modo en lugar
                        // de saltar a otra chispa cualquiera.
                        const modo = (currentSparkType?.word || 'caos').toLowerCase();
                        const prompts = promptsParaModo(modo);
                        const idx = prompts.findIndex(p => p === currentQuestion);
                        const next = prompts[(idx + 1) % prompts.length];
                        setCurrentQuestion(next);
                      }}
                      className="flex-1 py-3 bg-white border-2 border-ade-dark/10 text-ade-dark rounded-xl font-bold tracking-widest text-xs uppercase hover:bg-gray-50 active:scale-[0.98] transition-all"
                    >
                      Otra Chispa
                    </button>
                    <button onClick={closeEureka} className="flex-1 py-3 bg-transparent text-ade-dark/50 rounded-xl font-bold tracking-widest text-xs uppercase hover:text-ade-dark active:scale-[0.98] transition-all">
                      Saltar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
