import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Crown } from 'lucide-react';
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
      className="relative min-h-screen flex flex-col items-center justify-between py-16 px-6 overflow-hidden"
      style={{
        // Fondo crema cálido especificado por diseño.
        background: '#F5ECD7',
      }}
    >
      {/* Decoración sutil del fondo (intacta de la versión clara original).
          La luna y el gradiente nocturno se removieron por revert. */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-ade-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-ade-accent/5 rounded-full blur-[100px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#1A2332_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      {/* Botón corona — acceso directo a Perfil. Posicionado fuera del
          flow para no mover ningún elemento existente. */}
      {onPerfil && (
        <button
          onClick={onPerfil}
          aria-label="Abrir perfil creativo"
          className="absolute z-30 flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
          style={{
            top: '24px',
            right: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Crown className="w-5 h-5" style={{ color: '#FFD600' }} />
        </button>
      )}

      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
           <Sparkles className="w-5 h-5 text-ade-gold fill-ade-gold" />
           <span className="text-[10px] font-black tracking-[0.4em] text-ade-dark/40 uppercase">
             Project ADE
           </span>
        </div>
        {/* text-7xl fijo: el column es siempre 430px máx (responsive
            mobile-first), las breakpoints md:/lg: causaban overflow en
            desktop al evaluarse contra el viewport, no contra el column. */}
        <h1 className="ade-title text-7xl">ADE</h1>
        <p className="mt-4 text-ade-accent font-bold tracking-[0.25em] text-xs uppercase bg-ade-accent/10 px-4 py-1.5 rounded-full inline-block">
          El gato que caza ideas
        </p>
      </motion.div>

      {/* Main Character Sprite — Asset 1536×1024 (full body). max-w-md (448)
          permite que Ade se vea completo sin desbordar el layout. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* Halo dorado difuso detrás de Ade — spec de diseño.
              280×280, rgba(255,190,60,0.30), blur(55px), centrado, z-index 0. */}
          <div
            aria-hidden="true"
            className="pointer-events-none"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'rgba(255, 190, 60, 0.30)',
              filter: 'blur(55px)',
              zIndex: 0,
            }}
          />
          {/* Shadow underneath */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-4 bg-ade-dark/10 rounded-[100%] blur-xl" />
          {/* max-h-[44vh] como red de seguridad para viewports cortos. */}
          <img
            src={adeIdle}
            alt="Ade"
            className="w-full h-auto max-h-[44vh] object-contain relative z-10"
            style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.1))' }}
          />

          {/* Burbuja de speech con la lectura de Ade — alimentada por
              getFraseAde('inicio'). Si fraseInicio está vacía, no se
              renderiza. La entrada visual la hereda del wrapper padre
              (motion.div spring) para no fragmentar la animación. */}
          {fraseInicio && (
            <div
              className="absolute z-20 max-w-[240px] bg-white text-ade-dark rounded-2xl rounded-bl-none px-4 py-2.5 text-sm font-medium shadow-md border border-ade-dark/5"
              style={{
                top: '8%',
                right: '0',
                transform: 'translate(40%, 0)',
              }}
            >
              {fraseInicio}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Call to Action */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xs flex flex-col items-center gap-3"
      >
        {/* Ajuste 3 — pill, #FFD600, texto negro bold, sombra sutil. Override
            inline a .btn-ade sin tocar CSS global. */}
        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 text-lg rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: '#FFD600',
            color: '#000000',
            boxShadow:
              '0 4px 14px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.10)',
          }}
        >
          <Play className="w-5 h-5" style={{ fill: '#000000' }} />
          <span>JUGAR</span>
        </motion.button>

        <div className="flex w-full gap-3">
          <motion.button
            onClick={onJournal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 bg-white/50 backdrop-blur-md text-ade-dark font-black tracking-widest text-xs uppercase rounded-2xl border-2 border-ade-dark/10 flex items-center justify-center gap-2"
          >
            BITÁCORA
          </motion.button>
          
          <motion.button
            onClick={() => showToast('Ajustes… Ade lo está pensando.')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 bg-white/50 backdrop-blur-md text-ade-dark font-black tracking-widest text-xs uppercase rounded-2xl border-2 border-ade-dark/10 flex items-center justify-center gap-2"
          >
            AJUSTES
          </motion.button>
        </div>
      </motion.div>

      {/* Mejora 05 — toast efímero */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-ade-dark/90 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase z-[200] shadow-lg backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Home;
