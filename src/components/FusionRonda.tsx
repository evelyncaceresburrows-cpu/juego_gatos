// src/components/FusionRonda.tsx
//
// Ronda 2 del juego — drag-to-fuse simplificado a tap-to-fuse para
// mobile-first. El jugador acaba de capturar 5 chispas; aquí Ade le
// pide destilarlas: tocá dos para fusionarlas y obtener el insight.
//
// Cumple alma sec.3 (feedback como lectura) + biblia sec.10 (frases
// cortas) + decisión Camino C híbrido del usuario.
//
// Flujo:
//  1. Mostrar las 5 chispas como orbes coloreados con su modo.
//  2. Usuario toca una → se selecciona (highlight + scale).
//  3. Usuario toca una segunda → se dispara la fusión.
//  4. Aparece el insight (matriz fusiones.ts) + textarea para que el
//     usuario añada su propia idea inspirada por la conexión.
//  5. Guardar idea (registra en perfil + storage) o saltar.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bookmark } from 'lucide-react';
import type { TipoChispa } from '../systems/adeProfile';
import { getFusion, esTipoCanonico, type FusionContext } from '../systems/fusiones';

interface FusionRondaProps {
  // Las últimas 5 chispas capturadas en la ronda 1, en uppercase
  // (CAOS, ECO, etc.) — convertimos a lowercase para mapear al sistema.
  chispas: string[];
  // Callback cuando el usuario guarda. Recibe el texto de la idea +
  // los 2 modos fusionados + el insight original.
  onSave: (params: {
    text: string;
    insight: string;
    modoA: TipoChispa;
    modoB: TipoChispa;
  }) => void;
  // Callback cuando el usuario cierra sin guardar (o termina la fusión).
  onClose: () => void;
  // Paso 5/6 — contexto opcional para modular el insight de la matriz.
  // Sin ctx, getFusion devuelve la frase pura (backward compat). Con ctx,
  // la frase se tiñe por velocidad/modo/racha. El padre (Game.tsx) lo
  // construye al montar la ronda.
  context?: FusionContext;
}

// Mismo mapping que Game.tsx — color por modo (4 paletas para 8 modos).
const MODO_COLOR: Record<string, string> = {
  brillo: '#FFD740',
  deseo: '#FFD740',
  eco: '#40C4FF',
  ritual: '#40C4FF',
  secreto: '#69F0AE',
  ruido: '#69F0AE',
  caos: '#B088FF',
  error: '#B088FF',
};

const FusionRonda: React.FC<FusionRondaProps> = ({ chispas, onSave, onClose, context }) => {
  // Filtramos a chispas canónicas (defensa contra legacy).
  const chispasNorm: TipoChispa[] = chispas
    .map(c => c.toLowerCase())
    .filter(esTipoCanonico);

  // Estado: índices de las dos chispas seleccionadas.
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [ideaText, setIdeaText] = useState('');

  const dosSeleccionadas = seleccion.length === 2;
  const modoA = dosSeleccionadas ? chispasNorm[seleccion[0]] : null;
  const modoB = dosSeleccionadas ? chispasNorm[seleccion[1]] : null;
  // Paso 5/6 — pasamos el contexto al getFusion. Si el padre no lo
  // mandó, getFusion devuelve la frase pura de la matriz canónica.
  const insight =
    dosSeleccionadas && modoA && modoB ? getFusion(modoA, modoB, context) : '';

  const toggleSeleccion = (idx: number) => {
    if (dosSeleccionadas) return; // bloquea más selecciones
    setSeleccion(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const reiniciarSeleccion = () => {
    setSeleccion([]);
    setIdeaText('');
  };

  const handleGuardar = () => {
    if (!modoA || !modoB) return;
    onSave({
      text: ideaText.trim() || insight,
      insight,
      modoA,
      modoB,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0f0f1f 70%, #0a0a14 100%)',
      }}
    >
      {/* Header con close */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles
            className="w-3.5 h-3.5"
            style={{ color: '#FFD600', fill: '#FFD600' }}
          />
          <p
            className="text-[10px] font-black tracking-[0.4em] uppercase"
            style={{ color: '#FFD600' }}
          >
            Ade vio suficiente
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Cuerpo */}
      <div className="flex-1 px-6 pb-6 flex flex-col">
        <AnimatePresence mode="wait">
          {!dosSeleccionadas ? (
            // ─── Estado: seleccionando 2 chispas ───
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center flex-1 gap-8"
            >
              <p className="text-white/85 text-lg italic text-center font-medium leading-snug max-w-[260px]">
                Toca dos. Júntalas.
              </p>

              {/* Grid de las 5 chispas */}
              <div className="flex flex-wrap items-center justify-center gap-4 max-w-[300px]">
                {chispasNorm.map((modo, i) => {
                  const seleccionada = seleccion.includes(i);
                  return (
                    <motion.button
                      key={i}
                      onClick={() => toggleSeleccion(i)}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1.5 transition-all"
                      style={{
                        opacity: seleccion.length === 1 && !seleccionada ? 0.5 : 1,
                      }}
                    >
                      <motion.div
                        animate={{
                          scale: seleccionada ? 1.18 : 1,
                          boxShadow: seleccionada
                            ? `0 0 24px ${MODO_COLOR[modo]}, 0 0 48px ${MODO_COLOR[modo]}80`
                            : `0 0 12px ${MODO_COLOR[modo]}66`,
                        }}
                        transition={{ type: 'spring', damping: 14, stiffness: 240 }}
                        className="rounded-full"
                        style={{
                          width: '52px',
                          height: '52px',
                          background: MODO_COLOR[modo],
                          border: seleccionada
                            ? '2px solid #FFD600'
                            : '2px solid transparent',
                        }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                        {modo}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-white/40 text-xs uppercase tracking-widest">
                {seleccion.length} / 2 elegidas
              </p>
            </motion.div>
          ) : (
            // ─── Estado: fusión completada ───
            <motion.div
              key="fusion"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col flex-1 items-center justify-center gap-6"
            >
              {/* Visual de los dos modos fusionados */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{
                      background: MODO_COLOR[modoA!],
                      boxShadow: `0 0 20px ${MODO_COLOR[modoA!]}80`,
                    }}
                  />
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/80">
                    {modoA}
                  </span>
                </div>
                <Sparkles
                  className="w-5 h-5"
                  style={{ color: '#FFD600', fill: '#FFD600' }}
                />
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{
                      background: MODO_COLOR[modoB!],
                      boxShadow: `0 0 20px ${MODO_COLOR[modoB!]}80`,
                    }}
                  />
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/80">
                    {modoB}
                  </span>
                </div>
              </div>

              {/* Insight de la matriz */}
              <motion.p
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 14 }}
                className="text-2xl font-bold italic text-center max-w-[300px] leading-snug px-4"
                style={{ color: '#FFD600' }}
              >
                {insight}
              </motion.p>

              {/* Textarea para que el usuario añada su idea */}
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-[320px] flex flex-col gap-3"
              >
                <textarea
                  value={ideaText}
                  onChange={e => setIdeaText(e.target.value)}
                  placeholder="Tu idea (opcional)…"
                  rows={3}
                  className="w-full p-3 rounded-2xl text-sm resize-none outline-none transition-colors"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                  }}
                />
                <p className="text-[10px] text-white/40 italic text-center">
                  Si no escribís nada, guardamos el insight tal cual.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer con acciones */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-2.5 mt-4"
        >
          {dosSeleccionadas ? (
            <>
              <button
                onClick={handleGuardar}
                className="w-full py-3.5 rounded-full font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{
                  background:
                    'linear-gradient(180deg, #FFE042 0%, #FFD600 50%, #F5C600 100%)',
                  color: '#1A1A1A',
                  boxShadow:
                    '0 6px 0 rgba(150, 110, 0, 0.18), 0 12px 32px rgba(255, 214, 0, 0.4), 0 4px 14px rgba(0, 0, 0, 0.18)',
                }}
              >
                <Bookmark className="w-4 h-4" style={{ fill: '#0A0A0A' }} />
                Guardar idea
              </button>
              <div className="flex gap-2.5">
                <button
                  onClick={reiniciarSeleccion}
                  className="flex-1 py-3 rounded-2xl font-black tracking-widest text-[11px] uppercase text-white/80 transition-all active:scale-95"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  Otra fusión
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-black tracking-widest text-[11px] uppercase text-white/60 transition-all active:scale-95"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Saltar
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 text-[11px] font-bold tracking-widest uppercase text-white/50 transition-colors hover:text-white/80"
            >
              Saltar esta fusión
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FusionRonda;
