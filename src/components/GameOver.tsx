// src/components/GameOver.tsx
//
// Pantalla intermedia entre fin de partida y Bitácora.
// "ADE DETECTÓ ALGO..." — protagoniza una lectura estructurada de 3
// observaciones (Velocidad / Patrón / Acción) que vienen de los datos
// crudos de la sesión que acaba de cerrar (MetricasSesion → generarLectura).
//
// Decisiones editoriales (informe §12 + paso 7 del plan):
//   1. SIN bloque grande de "CHISPAS · NN" en el centro. El score interno
//      sigue vivo (se usa en compartir, vive en localStorage), pero ya
//      no protagoniza. Filosofía: ADE no premia con números.
//   2. PRIMARIO ahora es "Otra ronda" — el motor de engagement honesto.
//      "Guardar idea" se convirtió en "Ver bitácora" (más sincero: la
//      idea ya se guardó en FusionRonda; este botón solo navega).
//   3. La lectura no compite con CTAs. Aparece primero, los botones
//      entran al final del stagger.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, RotateCcw, Share2, Sparkles, X } from 'lucide-react';
import Lectura, { type Observacion } from './Lectura';
import {
  generarLectura,
  type MetricasSesion,
} from '../systems/lectura';

interface GameOverProps {
  /** Score interno de la sesión (no se renderiza, solo se pasa a share). */
  score: number;
  /**
   * Métricas crudas de la sesión recién cerrada. Si llegan null/undefined
   * (caso raro y defensivo), generarLectura igual produce 3 observaciones
   * sensatas a partir de un objeto vacío.
   */
  metricas?: MetricasSesion | null;
  /** Navegar a Bitácora ("Ver bitácora"). */
  onSave: () => void;
  /** Volver a empezar el juego ("Otra ronda"). PRIMARIO. */
  onAnother: () => void;
  /** Compartir el resultado vía Web Share API + clipboard fallback. */
  onShare: () => void;
  /** Volver a Home — link tertiary al pie + X arriba a la izq. */
  onHome?: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
  metricas,
  onSave,
  onAnother,
  onShare,
  onHome,
}) => {
  // Las 3 observaciones se calculan UNA vez al montar — la pantalla es
  // estable mientras el usuario decide qué hacer. Si metricas no llegó
  // (caso defensivo), partimos de un objeto vacío y dejamos que
  // generarLectura emita sus frases para sesión vacía.
  const [observaciones] = useState<Observacion[]>(() =>
    generarLectura(
      metricas ?? {
        capturasPorTipo: {},
        velocidades: [],
        saltadasFusion: 0,
        guardadas: 0,
        inicio: Date.now(),
      },
    ),
  );

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
      {/* X close — esquina sup. izquierda. Sale al inicio sin
          interactuar con la lectura. */}
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

      {/* Sparkles ambient — atmósfera, no decoración. */}
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

      {/* Contenido central — protagoniza la Lectura. SIN score grande. */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10 relative z-10">
        {/* Título "Ade detectó algo" */}
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

        {/* La lectura. 3 observaciones estructuradas, una por dimensión. */}
        <Lectura observaciones={observaciones} />
      </div>

      {/* CTAs — Otra ronda PRIMARIO; Ver bitácora + Compartir SECUNDARIOS;
          Volver al inicio TERTIARY. La lectura ya entró antes (último
          stagger ~1.45s), los botones entran al final (delay 1.9s). */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.4 }}
        className="flex flex-col gap-3 px-6 pb-10 relative z-10"
      >
        {/* Otra ronda — PRIMARIO. Es la decisión más alineada con la
            filosofía: si Ade leyó algo de tu comportamiento, la mejor
            respuesta es jugar otra y dejar que el espejo se afine. */}
        <button
          onClick={onAnother}
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
          <RotateCcw className="w-5 h-5" />
          <span>Otra ronda</span>
        </button>

        {/* Ver bitácora + Compartir — SECUNDARIOS lado a lado.
            "Ver bitácora" reemplaza al engañoso "Guardar idea": la idea
            ya se guardó en FusionRonda, este botón solo navega. */}
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="flex-1 py-3 rounded-2xl font-black tracking-widest text-[11px] uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-white/15"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Book className="w-3.5 h-3.5" />
            <span>Ver bitácora</span>
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
