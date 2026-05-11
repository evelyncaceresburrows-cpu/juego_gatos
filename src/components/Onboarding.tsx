// src/components/Onboarding.tsx
//
// Onboarding mínimo para el usuario nuevo (auditoría §3.3).
// Tres pantallas con swipe horizontal + skip. Aparece SOLO en la primera
// visita (sesiones === 0 y sin flag de onboarding_done). El skip persiste
// en localStorage, así que el usuario nunca lo vuelve a ver.
//
// Mensajes (tono biblia — no felicita, observa):
//   1. "Toca las chispas." — orbe pulsante con dedo simulado
//   2. "Junta cinco. Ade abre una fusión." — dos orbes uniéndose
//   3. "Ade te lee al final." — cat interpret pose
//
// Decisión editorial: ningún texto explica POR QUÉ. Solo el qué.
// La interpretación viene jugando.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASSETS } from '../lib/assets';

interface OnboardingProps {
  onComplete: () => void;
}

interface Step {
  copy: string;
  render: () => React.ReactNode;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      copy: 'Toca las chispas.',
      render: () => (
        <div className="relative w-48 h-48 flex items-center justify-center">
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '64px',
              height: '64px',
              background: '#FFD740',
              boxShadow: '0 0 24px rgba(255, 215, 64, 0.6)',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute"
            style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(26,35,50,0.85)' }}
            animate={{ x: [-30, 0, -30], y: [30, 0, 30], opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      ),
    },
    {
      copy: 'Junta cinco. Ade abre una fusión.',
      render: () => (
        <div className="relative w-56 h-48 flex items-center justify-center gap-2">
          <motion.div
            className="rounded-full"
            style={{ width: '52px', height: '52px', background: '#B088FF', boxShadow: '0 0 18px #B088FF66' }}
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="text-2xl font-black"
            style={{ color: '#FFD600' }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            +
          </motion.div>
          <motion.div
            className="rounded-full"
            style={{ width: '52px', height: '52px', background: '#40C4FF', boxShadow: '0 0 18px #40C4FF66' }}
            animate={{ x: [0, -10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      ),
    },
    {
      copy: 'Ade te lee al final.',
      render: () => (
        <motion.img
          src={ASSETS.adeInterpret}
          alt="Ade interpretando"
          className="w-44 max-w-full"
          initial={{ scale: 0.95, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const advance = () => {
    if (isLast) onComplete();
    else setStep(s => s + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[400] flex flex-col items-center justify-center px-8"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, #FBF1D8 0%, #F5ECD7 60%, #EDE2C8 100%)',
      }}
    >
      {/* Skip arriba derecha */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 min-h-[44px] min-w-[44px] px-3 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.4em] text-ade-dark/45 hover:text-ade-dark/75 transition-colors"
      >
        Saltar
      </button>

      {/* Contenido central */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center gap-8"
          >
            {steps[step].render()}
            <p className="text-2xl font-black italic text-center leading-snug text-ade-dark">
              {steps[step].copy}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores + CTA */}
      <div className="flex flex-col items-center gap-6 pb-12 w-full max-w-[280px]">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? '24px' : '8px',
                height: '8px',
                background:
                  i === step ? '#FFD600' : 'rgba(26, 35, 50, 0.2)',
              }}
            />
          ))}
        </div>
        <button
          onClick={advance}
          className="w-full py-4 rounded-full font-black uppercase tracking-wider text-base active:scale-[0.97] transition-transform"
          style={{
            background:
              'linear-gradient(180deg, #FFE042 0%, #FFD600 50%, #F5C600 100%)',
            color: '#1A1A1A',
            boxShadow:
              '0 6px 0 rgba(150, 110, 0, 0.18), 0 12px 24px rgba(255, 214, 0, 0.4)',
          }}
        >
          {isLast ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </motion.div>
  );
};

export default Onboarding;
