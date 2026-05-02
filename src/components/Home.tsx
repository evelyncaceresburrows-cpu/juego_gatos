import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Crown, Book, Settings } from 'lucide-react';
import adeIdle from '../assets/ade/characters/ade-idle.png';
import { getFraseAde } from '../systems/adeProfile';

interface HomeProps {
  onStart: () => void;
  onJournal: () => void;
  // Acceso directo a la pantalla Perfil desde el botón de corona.
  onPerfil?: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart, onJournal, onPerfil }) => {
  // Mejora 05 — toast efímero para botones aún no implementados.
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    console.info('[ADE]', msg);
    setTimeout(() => setToast(null), 2000);
  };

  // Cable a adeProfile: leemos la frase de Ade para este momento UNA
  // sola vez al montar. Si en futuras visitas el perfil cambió, la
  // próxima vez que se monte Home se recalcula.
  const [fraseInicio] = useState<string>(() => getFraseAde('inicio'));

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-between py-14 px-6 overflow-hidden"
      style={{
        // Fondo crema cálido + gradiente vertical sutil para profundidad.
        // Capa base sólida + spotlight diagonal muy leve.
        background:
          'radial-gradient(ellipse at 50% 35%, #FBF1D8 0%, #F5ECD7 55%, #EDE2C8 100%)',
      }}
    >
      {/* ── Decoración de fondo — capas múltiples para sensación viva ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Glows ambient ya existentes — se mantienen por consistencia */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-ade-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-ade-accent/5 rounded-full blur-[100px]" />

        {/* Spotlight central detrás del cat — refuerza el halo y centra el ojo */}
        <div
          className="absolute"
          style={{
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%',
            height: '50%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(255, 200, 80, 0.10) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Grid pattern (igual que antes pero un punto más visible) */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#1A2332_1px,transparent_1px)] [background-size:22px_22px]" />

        {/* Sparkle dots — partículas mínimas que dan vida al fondo */}
        {[
          { top: '15%', left: '12%', delay: 0, size: 3 },
          { top: '28%', left: '88%', delay: 0.6, size: 2 },
          { top: '62%', left: '8%', delay: 1.2, size: 4 },
          { top: '70%', left: '92%', delay: 0.3, size: 2 },
          { top: '45%', left: '15%', delay: 1.8, size: 3 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: dot.top,
              left: dot.left,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              background: '#F5C400',
              boxShadow: '0 0 8px rgba(245, 196, 0, 0.6)',
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              delay: dot.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ── Botón corona — refinado con sombra y entrada suave ── */}
      {onPerfil && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onPerfil}
          aria-label="Abrir perfil creativo"
          className="absolute z-30 flex items-center justify-center"
          style={{
            top: '20px',
            right: '20px',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(245, 196, 0, 0.25)',
            boxShadow:
              '0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 4px 12px rgba(0, 0, 0, 0.06), 0 0 16px rgba(245, 196, 0, 0.15)',
          }}
        >
          <Crown className="w-5 h-5" style={{ color: '#F5C400', fill: '#FFD600' }} />
        </motion.button>
      )}

      {/* ── Brand Header — más sólido, mejor jerarquía ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-ade-gold fill-ade-gold" />
          <span className="text-[10px] font-black tracking-[0.45em] text-ade-dark/45 uppercase">
            Project ADE
          </span>
          <Sparkles className="w-4 h-4 text-ade-gold fill-ade-gold" />
        </div>

        {/* Título más sólido: depth shadow + ambient golden glow + tracking ajustado */}
        <h1
          className="ade-title text-7xl"
          style={{
            textShadow:
              '0 2px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(245, 196, 0, 0.18)',
            letterSpacing: '-0.045em',
          }}
        >
          ADE
        </h1>

        {/* Pill con borde y sombra interna sutil */}
        <p
          className="mt-5 text-ade-accent font-bold tracking-[0.28em] text-[11px] uppercase px-4 py-2 rounded-full inline-block"
          style={{
            background: 'rgba(255, 112, 67, 0.08)',
            border: '1px solid rgba(255, 112, 67, 0.18)',
            boxShadow: '0 1px 0 rgba(255, 255, 255, 0.4) inset',
          }}
        >
          El gato que caza ideas
        </p>
      </motion.div>

      {/* ── Cat sprite con halo doble + glow pulse ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', damping: 14, stiffness: 110 }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          {/* Halo dorado base (fixed) */}
          <div
            aria-hidden="true"
            className="pointer-events-none"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'rgba(255, 190, 60, 0.32)',
              filter: 'blur(60px)',
              zIndex: 0,
            }}
          />

          {/* Halo secundario con pulse — agrega vida al brillo del cat */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255, 214, 0, 0.16) 0%, transparent 65%)',
              filter: 'blur(40px)',
              zIndex: 0,
            }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Sombra de piso debajo del gato — más rica */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2"
            style={{
              width: '55%',
              height: '14px',
              background:
                'radial-gradient(ellipse, rgba(26, 35, 50, 0.18) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />

          <img
            src={adeIdle}
            alt="Ade"
            className="w-full h-auto max-h-[44vh] object-contain relative z-10"
            style={{
              filter:
                'drop-shadow(0 16px 24px rgba(0, 0, 0, 0.12)) drop-shadow(0 4px 8px rgba(245, 196, 0, 0.18))',
            }}
          />

          {/* ── Globo de texto rediseñado — más elegante ── */}
          {fraseInicio && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.92 }}
              animate={{
                opacity: 1,
                y: [0, -3, 0],
                scale: 1,
              }}
              transition={{
                opacity: { delay: 0.7, duration: 0.5 },
                scale: { delay: 0.7, type: 'spring', damping: 16, stiffness: 200 },
                y: {
                  delay: 1.2,
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="absolute z-20 max-w-[240px]"
              style={{
                top: '8%',
                right: '0',
                transform: 'translate(40%, 0)',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(12px)',
                color: '#1A2332',
                borderRadius: '18px 18px 18px 4px',
                padding: '12px 16px',
                fontSize: '13px',
                fontStyle: 'italic',
                fontWeight: 500,
                lineHeight: '1.45',
                border: '1px solid rgba(245, 196, 0, 0.35)',
                boxShadow:
                  '0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 4px 12px rgba(0, 0, 0, 0.08), 0 12px 28px rgba(0, 0, 0, 0.06), 0 0 24px rgba(245, 196, 0, 0.12)',
              }}
            >
              {fraseInicio}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* ── Call to Action — JUGAR es la prioridad máxima ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xs flex flex-col items-center gap-3"
      >
        {/* JUGAR — botón premium de máxima prioridad.
            Multi-layer shadow: highlight inner top + bottom inner + 3D depth +
            ambient golden glow + grounding + gradient vertical sutil.
            Hover: scale + brightness + glow más intenso.
            Tap: simula un press físico (translateY + scale + shadow reduce). */}
        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97, y: 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="w-full py-4 text-lg rounded-full font-black uppercase tracking-wider flex items-center justify-center gap-2.5 relative overflow-hidden group"
          style={{
            background:
              'linear-gradient(180deg, #FFE042 0%, #FFD600 50%, #F5C600 100%)',
            color: '#1A1A1A',
            boxShadow: [
              '0 1px 0 rgba(255, 255, 255, 0.55) inset',
              '0 -2px 0 rgba(0, 0, 0, 0.06) inset',
              '0 6px 0 rgba(150, 110, 0, 0.18)',
              '0 12px 32px rgba(255, 214, 0, 0.42)',
              '0 4px 14px rgba(0, 0, 0, 0.18)',
            ].join(', '),
          }}
        >
          <Play className="w-5 h-5 relative z-10" style={{ fill: '#0A0A0A' }} />
          <span className="relative z-10">JUGAR</span>

          {/* Shine sweep al hover — luz que pasa por el botón */}
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                'linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
              transform: 'translateX(-100%)',
              animation: 'shine-sweep 1.2s ease-in-out infinite',
            }}
          />
        </motion.button>

        {/* Bloques secundarios — ahora con íconos y micro-sombras */}
        <div className="flex w-full gap-2.5">
          <motion.button
            onClick={onJournal}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="flex-1 py-3 text-ade-dark font-black tracking-widest text-[11px] uppercase rounded-2xl flex items-center justify-center gap-1.5"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(26, 35, 50, 0.08)',
              boxShadow:
                '0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 2px 6px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Book className="w-3.5 h-3.5" />
            <span>Bitácora</span>
          </motion.button>

          <motion.button
            onClick={() => showToast('Ajustes… Ade lo está pensando.')}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="flex-1 py-3 text-ade-dark font-black tracking-widest text-[11px] uppercase rounded-2xl flex items-center justify-center gap-1.5"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(26, 35, 50, 0.08)',
              boxShadow:
                '0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 2px 6px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Toast — refinado con tipografía y borde más coherente */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl text-[11px] font-bold tracking-widest uppercase z-[200]"
          style={{
            background: 'rgba(26, 35, 50, 0.92)',
            color: '#FFFFFF',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 196, 0, 0.2)',
            boxShadow:
              '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 16px rgba(245, 196, 0, 0.1)',
          }}
        >
          {toast}
        </motion.div>
      )}

      {/* Keyframes inline para el shine sweep del botón JUGAR */}
      <style>{`
        @keyframes shine-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Home;
