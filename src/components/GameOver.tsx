// src/components/GameOver.tsx
//
// Pantalla intermedia entre fin de partida y Bitácora.
// "ADE DETECTÓ ALGO..." — 3 frases derivadas del perfil + 3 acciones.
//
// Cumple alma sec.3 (feedback como lectura, no como felicitación) y
// biblia sec.10 (frases cortas, memorables). Las 3 frases NO son random;
// vienen del perfil real del usuario tras la sesión que acaba de cerrar.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, RotateCcw, Share2, Sparkles, X } from 'lucide-react';
import {
  getFraseAde,
  getTipoDominante,
  getPerfilCompleto,
  TIPOS_CREATIVOS,
  type TipoChispa,
} from '../systems/adeProfile';

interface GameOverProps {
  score: number;
  onSave: () => void;
  onAnother: () => void;
  onShare: () => void;
  // Opcional: si se pasa, aparece un X arriba a la izquierda + un
  // tertiary button al pie para volver al inicio sin guardar/jugar/compartir.
  onHome?: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, onSave, onAnother, onShare, onHome }) => {
  // Las 3 frases se calculan UNA vez al montar — la pantalla es estable
  // mientras el usuario decide.
  const [frases] = useState<string[]>(() => {
    const perfil = getPerfilCompleto();
    const dom = getTipoDominante();
    const tipo = dom ? TIPOS_CREATIVOS[dom as TipoChispa] : null;
    const out: string[] = [];

    // Frase 1: lectura general de cierre (getFraseAde 'fin').
    const fin = getFraseAde('fin');
    if (fin) out.push(fin);

    // Frase 2: descripción del tipo creativo dominante.
    if (tipo) out.push(tipo.descripcion);

    // Frase 3: contextual — depende de qué situación detecta.
    if (perfil.ideasGuardadas === 0 && score > 0) {
      out.push('Capturaste, no soltaste.');
    } else if (perfil.racha >= 3) {
      out.push(`Día ${perfil.racha}. Algo te llama de vuelta.`);
    } else if (perfil.sesiones === 1) {
      out.push('Primera sesión. Veamos qué sigue.');
    } else if (perfil.ideasGuardadas > 0 && perfil.ideasGuardadas <= 3) {
      out.push('Pocas ideas. Cada una pesa.');
    } else {
      out.push('Algo quiere salir.');
    }

    // Asegurar siempre 3 (fallback canon biblia).
    while (out.length < 3) out.push('Ahí estaba.');
    return out.slice(0, 3);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen-safe pb-safe pt-safe flex flex-col text-white relative"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #111111 70%, #0a0a0a 100%)',
      }}
    >
      {/* Botón cerrar/Home — esquina sup. izquierda. Permite salir
          al inicio sin guardar/jugar/compartir. Solo se muestra si
          el caller pasó onHome. */}
      {onHome && (
        <button
          onClick={onHome}
          aria-label="Volver al inicio"
          className="absolute top-5 left-5 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <X className="w-5 h-5 text-white/70" />
        </button>
      )}

      {/* Sparkles decoración ambiental */}
      {[
        { top: '12%', left: '10%', delay: 0, size: 4 },
        { top: '22%', right: '15%', delay: 0.6, size: 3 },
        { top: '60%', left: '8%', delay: 1.2, size: 3 },
        { top: '70%', right: '12%', delay: 0.3, size: 4 },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            ...s,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: '#FFD600',
            boxShadow: '0 0 10px rgba(255, 214, 0, 0.7)',
          }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Contenido central */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8 relative z-10">
        {/* Título */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <Sparkles
            className="w-3.5 h-3.5"
            style={{ color: '#FFD600', fill: '#FFD600' }}
          />
          <p
            className="text-[10px] font-black tracking-[0.4em] uppercase"
            style={{ color: '#FFD600' }}
          >
            Ade detectó algo
          </p>
          <Sparkles
            className="w-3.5 h-3.5"
            style={{ color: '#FFD600', fill: '#FFD600' }}
          />
        </motion.div>

        {/* 3 frases — primera en gold, otras blancas */}
        <div className="flex flex-col items-center gap-5 max-w-[280px] w-full">
          {frases.map((f, i) => (
            <motion.p
              key={i}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.5 + i * 0.35,
                type: 'spring',
                damping: 15,
                stiffness: 120,
              }}
              className="text-xl font-bold text-center leading-snug italic"
              style={{ color: i === 0 ? '#FFD600' : '#FFFFFF' }}
            >
              {f}
            </motion.p>
          ))}
        </div>

        {/* Score visible pero secundario */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="text-center mt-2"
        >
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/45">
            Chispas
          </p>
          <p className="text-4xl font-black mt-1" style={{ color: '#FFD600' }}>
            {score}
          </p>
        </motion.div>
      </div>

      {/* Botones — JUGAR de nuevo es el primario; otros secundarios */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.4 }}
        className="flex flex-col gap-3 px-6 pb-10 relative z-10"
      >
        {/* Guardar idea — botón primario dorado */}
        <button
          onClick={onSave}
          className="w-full py-4 rounded-full font-black uppercase tracking-wider text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97] hover:scale-[1.02]"
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
          <Bookmark className="w-5 h-5" style={{ fill: '#0A0A0A' }} />
          <span>Guardar idea</span>
        </button>

        {/* Secondary actions */}
        <div className="flex gap-3">
          <button
            onClick={onAnother}
            className="flex-1 py-3 rounded-2xl font-black tracking-widest text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-white/15"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Otra ronda</span>
          </button>
          <button
            onClick={onShare}
            className="flex-1 py-3 rounded-2xl font-black tracking-widest text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-white/15"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>
        </div>

        {/* Tertiary — link discreto al inicio. Solo si onHome existe. */}
        {onHome && (
          <button
            onClick={onHome}
            className="w-full py-2 text-[11px] font-bold tracking-widest uppercase text-white/45 transition-colors hover:text-white/80"
          >
            Volver al inicio
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GameOver;
