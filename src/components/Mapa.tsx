// src/components/Mapa.tsx
//
// Pantalla Mapa — territorio creativo del usuario alimentado por
// adeProfile.ts + storage.ts. Cumple ADE-alma.md sec.4 (Bitácora /
// Mapa como espejo mental, no decoración).
//
// Estructura:
//   A. Mapa de ideas — grid 8 modos con conteo de ideas guardadas
//   B. Mapa de progreso — timeline últimas 5 sesiones (proxy via ideas)
//   C. Territorios — 5 hitos por desbloquear (10 capturas c/u)
//
// Estilo: fondo #111, blanco, acentos #FFD600. Consistente con Perfil.tsx.

import React, { useState } from 'react';
import { ChevronLeft, Lock, Sparkles } from 'lucide-react';
import { getPerfilCompleto, type TipoChispa } from '../systems/adeProfile';
import { getIdeas } from '../lib/storage';
import type { Idea } from '../lib/storage';

interface MapaProps {
  onBack: () => void;
}

// Mismo mapping que Journal.tsx — consistencia cromática inter-pantalla.
const MODO_BADGE: Record<string, string> = {
  caos:    '#FF6B35',
  eco:     '#4ECDC4',
  deseo:   '#C77DFF',
  ritual:  '#FFD600',
  brillo:  '#FF9F1C',
  ruido:   '#6B6B6B',
  secreto: '#7B2FBE',
  error:   '#FF4444',
};

const ORDEN_MODOS: TipoChispa[] = [
  'caos', 'eco', 'deseo', 'ritual', 'brillo', 'ruido', 'secreto', 'error',
];

// Solo 5 modos tienen territorio (per spec del usuario).
const TERRITORIOS: TipoChispa[] = ['caos', 'eco', 'deseo', 'ritual', 'brillo'];
const META_CAPTURAS = 10;

const Mapa: React.FC<MapaProps> = ({ onBack }) => {
  const [perfil] = useState(() => getPerfilCompleto());
  const [ideas] = useState<Idea[]>(() => getIdeas());

  // ─── Sección A: ideas por modo ───────────────────────────────
  const ideasPorModo: Record<string, number> = {};
  ideas.forEach(i => {
    if (!i.spark) return;
    const k = i.spark.toLowerCase();
    if (ORDEN_MODOS.includes(k as TipoChispa)) {
      ideasPorModo[k] = (ideasPorModo[k] || 0) + 1;
    }
  });

  // ─── Sección B: timeline real desde perfil.sesionesHistorial ───
  // Cada entrada es una sesión (día único) con capturas por modo y
  // cuántas ideas se guardaron ese día. Tomamos las últimas 5,
  // ordenadas más reciente primero.
  const sesionesTimeline = React.useMemo(() => {
    const hist = perfil.sesionesHistorial || [];
    return hist
      .slice(-5)
      .reverse()
      .map(s => {
        const totalCapturas = ORDEN_MODOS.reduce((sum, m) => sum + (s.capturas[m] || 0), 0);
        // Modo dominante de esa sesión (max captura).
        let max = 0;
        let dominante = '';
        for (const m of ORDEN_MODOS) {
          const n = s.capturas[m] || 0;
          if (n > max) { max = n; dominante = m; }
        }
        return {
          fecha: s.fecha,
          capturas: totalCapturas,
          ideas: s.ideasGuardadas,
          dominante,
        };
      });
  }, [perfil]);

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
        <h2 className="text-xl font-black tracking-tight">Mapa</h2>
      </header>

      <main className="flex-1 px-6 pb-8 flex flex-col gap-8 overflow-y-auto">

        {/* ═══ SECCIÓN A — MAPA DE IDEAS ═══ */}
        <section>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-4 text-white/40">
            Mapa de ideas
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ORDEN_MODOS.map(modo => {
              const count = ideasPorModo[modo] || 0;
              const activa = count >= 1;
              return (
                <div
                  key={modo}
                  className="rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all"
                  style={{
                    background: activa
                      ? `${MODO_BADGE[modo]}22`
                      : 'rgba(255,255,255,0.03)',
                    border: activa
                      ? `1px solid ${MODO_BADGE[modo]}66`
                      : '1px solid rgba(255,255,255,0.08)',
                    opacity: activa ? 1 : 0.3,
                    boxShadow: activa ? `0 0 24px ${MODO_BADGE[modo]}33` : 'none',
                    minHeight: '96px',
                  }}
                >
                  <span
                    className="text-xs font-black uppercase tracking-widest"
                    style={{ color: activa ? MODO_BADGE[modo] : '#fff' }}
                  >
                    {modo}
                  </span>
                  {activa ? (
                    <>
                      <span className="text-2xl font-black mt-1">{count}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                        idea{count !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-bold mt-2 italic text-white/60">
                      Sin explorar
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ SECCIÓN B — MAPA DE PROGRESO ═══ */}
        <section>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-4 text-white/40">
            Mapa de progreso
          </p>
          {perfil.sesiones < 2 ? (
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="italic text-white/60 text-sm">
                Tu historia empieza ahora.
              </p>
            </div>
          ) : sesionesTimeline.length === 0 ? (
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="italic text-white/60 text-sm">
                Aún no hay datos por sesión. La próxima vez que juegues
                empezamos a registrar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sesionesTimeline.map((s, i) => (
                <div
                  key={`${s.fecha}-${i}`}
                  className="rounded-2xl p-4 flex items-center justify-between"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-widest uppercase text-white/80">
                      {s.fecha}
                    </span>
                    <span className="text-[10px] font-bold text-white/40 mt-0.5">
                      {s.capturas} chispa{s.capturas !== 1 ? 's' : ''}
                      {s.ideas > 0 && (
                        <> · {s.ideas} idea{s.ideas !== 1 ? 's' : ''}</>
                      )}
                    </span>
                  </div>
                  {s.dominante && (
                    <span
                      className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{
                        background: MODO_BADGE[s.dominante] || '#6B6B6B',
                        color: ['ruido', 'secreto', 'error'].includes(s.dominante) ? '#fff' : '#000',
                      }}
                    >
                      {s.dominante}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ SECCIÓN C — TERRITORIOS ═══ */}
        <section>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-4 text-white/40">
            Territorios
          </p>
          <div className="flex flex-col gap-2.5">
            {TERRITORIOS.map(modo => {
              const capturas = perfil.capturas[modo] || 0;
              const desbloqueado = capturas >= META_CAPTURAS;
              return (
                <div
                  key={modo}
                  className="rounded-2xl p-4 flex items-center justify-between gap-3"
                  style={{
                    background: desbloqueado
                      ? `${MODO_BADGE[modo]}1A`
                      : 'rgba(255,255,255,0.03)',
                    border: desbloqueado
                      ? `1px solid ${MODO_BADGE[modo]}66`
                      : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {desbloqueado ? (
                      <Sparkles
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: MODO_BADGE[modo], fill: MODO_BADGE[modo] }}
                      />
                    ) : (
                      <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                    )}
                    <span
                      className="font-black uppercase tracking-widest text-sm"
                      style={{
                        color: desbloqueado ? MODO_BADGE[modo] : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      Territorio {modo}
                    </span>
                  </div>
                  {desbloqueado ? (
                    <span
                      className="text-[11px] italic flex-shrink-0"
                      style={{ color: MODO_BADGE[modo] }}
                    >
                      ¡Territorio conquistado!
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-white/50 flex-shrink-0">
                      {capturas}/{META_CAPTURAS}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Mapa;
