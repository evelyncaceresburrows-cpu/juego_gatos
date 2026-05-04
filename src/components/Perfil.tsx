// src/components/Perfil.tsx
//
// Pantalla de Perfil creativo — alimentada por src/systems/adeProfile.ts.
// Cumple con contexto/ADE-alma.md:
//   - Las chispas son modos mentales (8 canónicos), no items.
//   - El "tipo creativo" es una lectura del comportamiento, no una etiqueta plana.
//   - Las frases salen del perfil real; si está vacío, no se inventa nada.
//
// Estilo: fondo #111, texto blanco, acentos #FFD600. Consistente con
// el HUD del juego.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles, Lock, Check } from 'lucide-react';
import {
  getTipoDominante,
  getPerfilCompleto,
  getFraseAde,
  TIPOS_CREATIVOS,
  type TipoChispa,
} from '../systems/adeProfile';
import { getEstadoUnlocks } from '../systems/streaks';

interface PerfilProps {
  onBack: () => void;
}

// TIPOS_CREATIVOS ahora vive en src/systems/adeProfile.ts (single source
// of truth). Importado arriba.

const ORDEN_MODOS: TipoChispa[] = [
  'caos', 'eco', 'deseo', 'ritual', 'brillo', 'ruido', 'secreto', 'error',
];

const Perfil: React.FC<PerfilProps> = ({ onBack }) => {
  // Snapshot al mount: una sola lectura del perfil para que la pantalla
  // sea estable durante la sesión.
  const [perfil] = useState(() => getPerfilCompleto());
  const [dominante] = useState(() => getTipoDominante());
  const [fraseAde] = useState(() => getFraseAde('inicio'));
  // Fase 3.2 — estado de unlocks (logrados vs pendientes).
  const [unlocks] = useState(() => getEstadoUnlocks());

  const total = ORDEN_MODOS.reduce((s, m) => s + (perfil.capturas[m] || 0), 0);
  const tipoCreativo = dominante
    ? TIPOS_CREATIVOS[dominante as TipoChispa]
    : null;

  const perfilVacio = total === 0;

  return (
    <div
      className="min-h-screen flex flex-col text-white overflow-hidden"
      style={{ background: '#111111' }}
    >
      {/* Header */}
      <header className="flex items-center gap-4 p-6">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform active:scale-90"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-black tracking-tight">Perfil creativo</h2>
      </header>

      {/* Estado vacío: aún no hay capturas */}
      {perfilVacio && (
        <main className="flex-1 flex items-center justify-center px-8 text-center">
          <p className="text-white/60 text-base max-w-xs italic">
            Juega tu primera partida para descubrir tu perfil.
          </p>
        </main>
      )}

      {/* Contenido normal */}
      {!perfilVacio && (
        <main className="flex-1 px-6 pb-8 flex flex-col gap-7 overflow-y-auto">

          {/* 1. TIPO CREATIVO (prominente) */}
          {tipoCreativo && (
            <section className="text-center mt-2">
              <p
                className="text-[10px] font-black tracking-[0.4em] uppercase mb-3"
                style={{ color: '#FFD600' }}
              >
                Tipo creativo
              </p>
              <h1
                className="text-3xl md:text-4xl font-black tracking-tight mb-2"
                style={{ color: '#FFD600' }}
              >
                {tipoCreativo.nombre}
              </h1>
              <p className="text-white/70 text-base max-w-md mx-auto leading-snug">
                {tipoCreativo.descripcion}
              </p>
            </section>
          )}

          {/* 2. GRÁFICO DE CHISPAS (barras) */}
          <section
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-4 text-white/40">
              Chispas capturadas
            </p>
            <div className="flex flex-col gap-2.5">
              {ORDEN_MODOS.map((modo) => {
                const n = perfil.capturas[modo] || 0;
                const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                return (
                  <div key={modo} className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-widest text-white/80 w-20">
                      {modo}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full"
                        style={{ background: '#FFD600' }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-white/60 w-12 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. ÚLTIMA LECTURA DE ADE — fondo oscuro, texto amarillo, borde sutil */}
          {fraseAde && (
            <section
              className="rounded-2xl p-5 flex items-start gap-3"
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,214,0,0.25)',
              }}
            >
              <Sparkles
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: '#FFD600', fill: '#FFD600' }}
              />
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-[10px] font-black tracking-[0.3em] uppercase"
                  style={{ color: '#FFD600' }}
                >
                  Ade dice
                </span>
                <p
                  className="italic text-sm leading-snug"
                  style={{ color: '#FFD600' }}
                >
                  {fraseAde}
                </p>
              </div>
            </section>
          )}

          {/* 4. DESBLOQUEOS — Fase 3.2.
              Lista de los 4 unlocks. Logrados con check + fondo dorado
              tenue; pendientes con candado + fondo neutro.
              Tono biblia: nada de "¡Conseguiste!" — solo el dato. */}
          <section
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-4 text-white/40">
              Desbloqueos
            </p>
            <div className="flex flex-col gap-2.5">
              {unlocks.map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background: u.logrado
                      ? 'rgba(255, 214, 0, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: u.logrado
                      ? '1px solid rgba(255, 214, 0, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: u.logrado
                        ? 'rgba(255, 214, 0, 0.25)'
                        : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {u.logrado ? (
                      <Check
                        className="w-3.5 h-3.5"
                        style={{ color: '#FFD600' }}
                      />
                    ) : (
                      <Lock className="w-3 h-3 text-white/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-black uppercase tracking-wide"
                      style={{
                        color: u.logrado ? '#FFD600' : 'rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      {u.nombre}
                    </p>
                    <p
                      className="text-[11px] italic mt-0.5 leading-tight"
                      style={{
                        color: u.logrado
                          ? 'rgba(255, 214, 0, 0.7)'
                          : 'rgba(255, 255, 255, 0.35)',
                      }}
                    >
                      {u.descripcion}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-black tracking-widest flex-shrink-0"
                    style={{
                      color: u.logrado ? '#FFD600' : 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    D{u.diaRequerido}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. STATS SIMPLES (footer) */}
          <section className="grid grid-cols-3 gap-3 mt-auto pt-2">
            <StatCard label="Sesiones" value={perfil.sesiones} />
            <StatCard label="Ideas" value={perfil.ideasGuardadas} />
            <StatCard label="Racha" value={perfil.racha} />
          </section>
        </main>
      )}
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span className="text-2xl font-black" style={{ color: '#FFD600' }}>
        {value}
      </span>
      <span className="text-[10px] font-black tracking-[0.2em] uppercase mt-1 text-white/40">
        {label}
      </span>
    </div>
  );
}

export default Perfil;
