// src/components/Ajustes.tsx
//
// Pantalla de Ajustes — auditoría §8.1 + §12: el botón "Ajustes" mostraba
// solo un toast "Pronto" durante meses; deuda visible. Esta pantalla
// resuelve eso con tres controles concretos:
//
//   1. Sonido (mute toggle)
//   2. Reducir movimiento (override del prefers-reduced-motion)
//   3. Borrar mi perfil (con confirmación)
//
// Más: versión + link al repo + email de feedback. Todo en cream sobre
// la columna del juego, consistente con Home.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Volume2, VolumeX, Activity, Trash2, ExternalLink, Clock } from 'lucide-react';
import { isMuted, setMuted } from '../lib/sound';
import { setReducedMotionOverride, useReducedMotion } from '../lib/useReducedMotion';

interface AjustesProps {
  onBack: () => void;
  onManual?: () => void;
}

const VERSION = '0.4.1';
const REPO_URL = 'https://github.com/evelyncaceresburrows-cpu/juego_gatos';

const Ajustes: React.FC<AjustesProps> = ({ onBack, onManual }) => {
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  const reducedMotion = useReducedMotion();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  // Sesión extendida — investigación TDAH §1 (Mawjee 2015 valida
  // micro-sesiones cortas; usuarios en flow piden más). Default 30s,
  // opcional 60s. Persiste en localStorage.
  const [extendedSesion, setExtendedSesion] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ade_sesion_duracion') === '60';
    } catch {
      return false;
    }
  });

  const toggleExtendedSesion = () => {
    const next = !extendedSesion;
    setExtendedSesion(next);
    try {
      localStorage.setItem('ade_sesion_duracion', next ? '60' : '30');
    } catch {
      /* ignorar */
    }
  };

  const toggleMuted = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const toggleReducedMotion = () => {
    // El override desactiva la lectura del media query del sistema y
    // fuerza el valor opuesto al actual. Para volver al default del
    // sistema, el usuario tendría que borrar localStorage manualmente
    // (caso edge; lo dejamos así por simplicidad).
    setReducedMotionOverride(!reducedMotion);
  };

  const reset = () => {
    try {
      const keys = [
        'ade-profile',
        'ade_ideas',
        'ade_stats',
        'ade_modo_actual',
        'ade_unlocks_logrados',
        'ade_unlocks_celebrados',
        'ade_sound_muted',
        'ade_reduced_motion',
        'ade_onboarding_done',
        'ade_sesion_duracion',
      ];
      keys.forEach(k => localStorage.removeItem(k));
      setResetDone(true);
      setConfirmReset(false);
      setTimeout(() => setResetDone(false), 2500);
    } catch {
      /* ignorar — best-effort */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen-safe pb-safe pt-safe flex flex-col bg-ade-beige text-ade-dark"
    >
      {/* Header */}
      <header className="flex items-center gap-4 p-6">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
          style={{
            background: 'rgba(26, 35, 50, 0.05)',
            border: '1px solid rgba(26, 35, 50, 0.1)',
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-black tracking-tight">Ajustes</h2>
      </header>

      <div className="flex-1 px-6 flex flex-col gap-4">
        {/* MANUAL — atajo a "¿Cómo se juega?". Solo si el caller lo cableó. */}
        {onManual && (
          <button
            onClick={onManual}
            className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.99]"
            style={{
              background: 'rgba(255, 214, 0, 0.10)',
              border: '1px solid rgba(255, 214, 0, 0.30)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255, 214, 0, 0.25)' }}
            >
              <span className="text-lg font-black" style={{ color: '#8A6A00' }}>?</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black uppercase tracking-wide">¿Cómo se juega?</p>
              <p className="text-[11px] italic text-ade-dark/55 mt-0.5">
                Manual completo de ADE
              </p>
            </div>
            <ChevronLeft className="w-5 h-5 text-ade-dark/30 rotate-180" />
          </button>
        )}

        {/* SONIDO */}
        <button
          onClick={toggleMuted}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.99]"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(26, 35, 50, 0.08)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: muted ? 'rgba(26,35,50,0.06)' : 'rgba(255, 214, 0, 0.18)' }}
          >
            {muted ? (
              <VolumeX className="w-5 h-5 text-ade-dark/45" />
            ) : (
              <Volume2 className="w-5 h-5" style={{ color: '#F5C400' }} />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-black uppercase tracking-wide">Sonido</p>
            <p className="text-[11px] italic text-ade-dark/55 mt-0.5">
              {muted ? 'Silenciado' : 'Activo — capture, flow, fusión'}
            </p>
          </div>
          <Toggle on={!muted} />
        </button>

        {/* REDUCIR MOVIMIENTO */}
        <button
          onClick={toggleReducedMotion}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.99]"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(26, 35, 50, 0.08)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: reducedMotion
                ? 'rgba(26,35,50,0.06)'
                : 'rgba(255, 112, 67, 0.15)',
            }}
          >
            <Activity
              className="w-5 h-5"
              style={{ color: reducedMotion ? 'rgba(26,35,50,0.45)' : '#FF7043' }}
            />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-black uppercase tracking-wide">Reducir movimiento</p>
            <p className="text-[11px] italic text-ade-dark/55 mt-0.5">
              {reducedMotion
                ? 'Animaciones decorativas desactivadas'
                : 'Animaciones completas'}
            </p>
          </div>
          <Toggle on={reducedMotion} />
        </button>

        {/* SESIÓN EXTENDIDA — investigación TDAH §1: Mawjee 2015 valida
            sesiones cortas, pero algunos usuarios en flow piden más.
            Default 30s, opcional 60s. La sesión corta sigue siendo el
            value-prop canónico — solo abrimos la puerta. */}
        <button
          onClick={toggleExtendedSesion}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.99]"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(26, 35, 50, 0.08)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: extendedSesion
                ? 'rgba(176, 136, 255, 0.18)'
                : 'rgba(26,35,50,0.06)',
            }}
          >
            <Clock
              className="w-5 h-5"
              style={{ color: extendedSesion ? '#B088FF' : 'rgba(26,35,50,0.45)' }}
            />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-black uppercase tracking-wide">Sesión extendida</p>
            <p className="text-[11px] italic text-ade-dark/55 mt-0.5">
              {extendedSesion ? '60 segundos por ronda' : '30 segundos (default)'}
            </p>
          </div>
          <Toggle on={extendedSesion} />
        </button>

        {/* RESET PERFIL */}
        <div
          className="flex flex-col gap-3 p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(26, 35, 50, 0.08)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(220, 60, 60, 0.12)' }}
            >
              <Trash2 className="w-5 h-5" style={{ color: '#DC3C3C' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase tracking-wide">Borrar mi perfil</p>
              <p className="text-[11px] italic text-ade-dark/55 mt-0.5">
                Capturas, ideas, racha y desbloqueos. No se puede deshacer.
              </p>
            </div>
          </div>

          {!confirmReset && !resetDone && (
            <button
              onClick={() => setConfirmReset(true)}
              className="self-start px-4 py-2 min-h-[44px] rounded-full text-[11px] font-black uppercase tracking-widest"
              style={{
                background: 'rgba(220, 60, 60, 0.08)',
                color: '#DC3C3C',
                border: '1px solid rgba(220, 60, 60, 0.25)',
              }}
            >
              Borrar todo
            </button>
          )}

          {confirmReset && (
            <div className="flex gap-2 self-stretch">
              <button
                onClick={reset}
                className="flex-1 py-2 min-h-[44px] rounded-full text-[11px] font-black uppercase tracking-widest"
                style={{ background: '#DC3C3C', color: '#FFFFFF' }}
              >
                Sí, borrar
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 min-h-[44px] rounded-full text-[11px] font-black uppercase tracking-widest"
                style={{
                  background: 'transparent',
                  color: 'rgba(26,35,50,0.5)',
                  border: '1px solid rgba(26,35,50,0.15)',
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          {resetDone && (
            <p className="text-[11px] italic text-ade-dark/55">
              Perfil borrado. Vuelve a Home para empezar de cero.
            </p>
          )}
        </div>

        {/* PRIVACIDAD — Ley 21.719 + investigación TDAH (privacy by design).
            ADE no envía datos a servidor. Todo vive en localStorage del
            dispositivo. Diferenciador real vs. Inflow/Headspace cloud-first. */}
        <div
          className="flex items-start gap-4 p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(26, 35, 50, 0.08)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(64, 196, 255, 0.12)' }}
          >
            <span className="text-base">🔒</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-black uppercase tracking-wide">Privacidad</p>
            <p className="text-[11px] italic text-ade-dark/65 mt-1 leading-relaxed">
              Todo lo que captures vive solo en este dispositivo. ADE no
              envía nada a ningún servidor, no pide cuenta, no usa cookies
              de tracking. Borrá el navegador y desaparece todo.
            </p>
          </div>
        </div>

        {/* SI NECESITÁS MÁS — escalado humano. La investigación clínica
            (Westwood JAMA 2025, prevalencia ansiedad ≈50% en TDAH adulto)
            obliga a tener salida explícita hacia profesional. Discreto,
            sin alarmar — solo visible si lo buscás. Líneas chilenas. */}
        <div
          className="flex items-start gap-4 p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(26, 35, 50, 0.08)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(176, 136, 255, 0.12)' }}
          >
            <span className="text-base">💬</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-black uppercase tracking-wide">Si necesitas más</p>
            <p className="text-[11px] italic text-ade-dark/65 mt-1 leading-relaxed">
              ADE es un juego. Si estás pasando algo difícil, hay personas que escuchan. Estos números son de Chile:
            </p>
            <div className="mt-2 flex flex-col gap-1 text-[11px]">
              <a
                href="tel:6003607777"
                className="font-bold text-ade-dark/80 hover:text-ade-dark transition-colors"
              >
                Salud Responde · 600 360 7777
              </a>
              <a
                href="tel:1515"
                className="font-bold text-ade-dark/80 hover:text-ade-dark transition-colors"
              >
                Línea Libre · 1515
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — versión + repo */}
      <footer className="px-6 pb-8 flex flex-col items-center gap-2 mt-auto">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black tracking-[0.3em] uppercase text-ade-dark/35 flex items-center gap-1.5 hover:text-ade-dark/65 transition-colors"
        >
          Código en GitHub
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <p className="text-[10px] font-mono text-ade-dark/30">v{VERSION}</p>
      </footer>
    </motion.div>
  );
};

// Toggle visual reutilizable.
function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className="w-10 h-6 rounded-full relative flex-shrink-0 transition-colors"
      style={{
        background: on ? '#FFD600' : 'rgba(26, 35, 50, 0.15)',
      }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
        style={{
          left: on ? 'calc(100% - 22px)' : '2px',
        }}
      />
    </div>
  );
}

export default Ajustes;
