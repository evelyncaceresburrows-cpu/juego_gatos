// src/components/Respiro.tsx
//
// Mini-modo "respiro" — 30 segundos de respiración guiada.
//
// Investigación TDAH §6: HRV biofeedback tiene la mejor relación
// costo-evidencia (Tinello 2021, k=16, 56% positivos en función
// ejecutiva). Respiración pausada ~6 rpm (Laborde 2022) muestra mejoras
// agudas en Stroop, operation span y WCST tras UNA sola sesión 3×5 min.
//
// Aquí vamos más cortos: 30s, 3 ciclos de ~10s (5s inhalar + 5s exhalar).
// Sin cámara, sin PPG, sin claims clínicos. Solo prep cognitivo opcional
// antes de cazar. Disponible solo desde modo Ansiedad.
//
// Pattern visual: orbe que crece de 80 → 220px en 5s, hold breve, cae a
// 80px en 5s. Texto guía cambia: "Inhala" → "Suelta".

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface RespiroProps {
  onClose: () => void;
}

type Fase = 'inhalar' | 'soltar';

const CICLOS = 3;
const SEGUNDOS_FASE = 5;
const TOTAL_SEGUNDOS = CICLOS * SEGUNDOS_FASE * 2; // 30s

const Respiro: React.FC<RespiroProps> = ({ onClose }) => {
  const [tiempoRestante, setTiempoRestante] = useState(TOTAL_SEGUNDOS);
  const [fase, setFase] = useState<Fase>('inhalar');
  const [completado, setCompletado] = useState(false);

  useEffect(() => {
    if (tiempoRestante <= 0) {
      setCompletado(true);
      return;
    }
    const id = setTimeout(() => {
      setTiempoRestante(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [tiempoRestante]);

  useEffect(() => {
    // Alternar fase cada 5 segundos.
    const elapsed = TOTAL_SEGUNDOS - tiempoRestante;
    const enFase = elapsed % (SEGUNDOS_FASE * 2);
    setFase(enFase < SEGUNDOS_FASE ? 'inhalar' : 'soltar');
  }, [tiempoRestante]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 50% 50%, #1a2a3a 0%, #0c1620 100%)',
      }}
    >
      {/* X close */}
      <button
        onClick={onClose}
        aria-label="Cerrar respiro"
        className="absolute top-5 right-5 z-30 w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
        }}
      >
        <X className="w-5 h-5 text-white/70" />
      </button>

      {!completado ? (
        <>
          {/* Orbe respirando */}
          <motion.div
            className="rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(176, 136, 255, 0.8) 0%, rgba(64, 196, 255, 0.4) 70%, rgba(64, 196, 255, 0.05) 100%)',
              boxShadow: '0 0 60px rgba(176, 136, 255, 0.35)',
            }}
            animate={{
              width: fase === 'inhalar' ? 220 : 80,
              height: fase === 'inhalar' ? 220 : 80,
            }}
            transition={{
              duration: SEGUNDOS_FASE,
              ease: 'easeInOut',
            }}
          />

          {/* Guía de texto */}
          <AnimatePresence mode="wait">
            <motion.p
              key={fase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="mt-12 text-3xl font-black italic uppercase tracking-[0.2em] text-white"
            >
              {fase === 'inhalar' ? 'Inhala' : 'Suelta'}
            </motion.p>
          </AnimatePresence>

          {/* Contador discreto */}
          <p className="mt-4 text-xs font-mono text-white/40">
            {tiempoRestante}s
          </p>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6 px-8"
        >
          <div
            className="w-32 h-32 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(176, 136, 255, 0.6) 0%, rgba(64, 196, 255, 0.2) 70%, transparent 100%)',
              boxShadow: '0 0 80px rgba(176, 136, 255, 0.25)',
            }}
          />
          <p className="text-2xl font-black italic text-white text-center">
            Listo. Vuelve cuando quieras.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-4 min-h-[44px] rounded-full font-black uppercase tracking-wider text-sm active:scale-[0.97] transition-transform"
            style={{
              background:
                'linear-gradient(180deg, #FFE042 0%, #FFD600 50%, #F5C600 100%)',
              color: '#1A1A1A',
              boxShadow:
                '0 4px 0 rgba(150, 110, 0, 0.18), 0 8px 18px rgba(255, 214, 0, 0.35)',
            }}
          >
            Volver
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Respiro;
