import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, LayoutGrid, Map as MapIcon, User, Sparkles, ChevronRight, Download, Printer } from 'lucide-react';
import adeOffended from '../assets/ade/characters/ade-offended.png';
import { getIdeas, downloadFile } from '../lib/storage';
import type { Idea, RadarStats } from '../lib/storage';
import {
  getFraseAde,
  getPerfilCompleto,
  getTipoDominante,
  TIPOS_CREATIVOS,
  type TipoChispa,
} from '../systems/adeProfile';

// Mapping modo → color del badge (alma sec.4 — Bitácora como espejo
// mental, cada modo con su firma cromática). Si idea.spark.toLowerCase()
// no está en este map (ideas legacy con sparks viejos como "Sombra"
// o "Mapa"), no se renderiza badge.
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

// Color de texto contrastado: oscuro sobre bgs claros, claro sobre oscuros.
const MODO_BADGE_FG: Record<string, string> = {
  caos:    '#000', eco:     '#000', deseo:   '#000',
  ritual:  '#000', brillo:  '#000',
  ruido:   '#fff', secreto: '#fff', error:   '#fff',
};

interface JournalProps {
  onBack: () => void;
  // Navegación a la pantalla de Perfil creativo desde la nav inferior.
  onPerfil?: () => void;
  // Navegación a la pantalla Mapa desde la nav inferior.
  onMapa?: () => void;
  // Si > 0, el usuario llegó a Bitácora terminando una partida; mostramos
  // banner con la lectura final de Ade. Si === 0, navegación manual.
  justFinishedScore?: number;
}

const Journal: React.FC<JournalProps> = ({ onBack, onPerfil, onMapa, justFinishedScore = 0 }) => {
  const [filter, setFilter] = useState<'recientes' | 'mejores' | 'locas' | 'útiles'>('recientes');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [radarStats, setRadarStats] = useState<RadarStats>({ vuelo: 20, salto: 20, mirada: 20, eco: 20, pulso: 20 });

  // Cable a adeProfile: si llegamos terminando partida, computamos la
  // lectura final una sola vez al montar. Si entramos por la vía manual
  // (BITÁCORA desde Home), justFinishedScore === 0 y no hay banner.
  const [fraseFin] = useState<string>(() =>
    justFinishedScore > 0 ? getFraseAde('fin') : ''
  );

  // Mejora 05 — toast efímero para botones de la nav inferior aún no implementados.
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    console.info('[ADE]', msg);
    setTimeout(() => setToast(null), 2000);
  };

  // ─── Exports de Bitácora — alma sec.4 (Bitácora como espejo mental) ───
  // Ambos formatos incluyen perfil + stats + distribución + lectura de
  // Ade + lista de ideas. No son listas planas: son un retrato.

  const ORDEN_EXPORT: TipoChispa[] = [
    'caos', 'eco', 'deseo', 'ritual', 'brillo', 'ruido', 'secreto', 'error',
  ];

  const construirSnapshot = () => {
    const perfil = getPerfilCompleto();
    const dom = getTipoDominante();
    const tipo = dom ? TIPOS_CREATIVOS[dom as TipoChispa] : null;
    const total = ORDEN_EXPORT.reduce((s, m) => s + (perfil.capturas[m] || 0), 0);
    const dist = ORDEN_EXPORT.map(m => {
      const n = perfil.capturas[m] || 0;
      const pct = total > 0 ? Math.round((n / total) * 100) : 0;
      return { modo: m, n, pct };
    });
    const lectura = getFraseAde('inicio');
    return { perfil, tipo, total, dist, lectura };
  };

  const exportarBitacoraMD = () => {
    const { perfil, tipo, total, dist, lectura } = construirSnapshot();
    let md = '# Bitácora ADE\n';
    md += '\n> El espejo más honesto que tendrás.\n';
    md += '> No te dice lo que eres. Te muestra cómo piensas cuando crees que solo estás jugando.\n\n';

    md += '## Perfil creativo\n\n';
    if (tipo) md += `**${tipo.nombre}** — ${tipo.descripcion}\n\n`;
    else md += '_Aún sin perfil. Juega tu primera partida._\n\n';

    md += '## Stats\n\n';
    md += `- Sesiones jugadas: ${perfil.sesiones}\n`;
    md += `- Ideas guardadas: ${perfil.ideasGuardadas}\n`;
    md += `- Racha actual: ${perfil.racha} día${perfil.racha !== 1 ? 's' : ''}\n`;
    md += `- Total chispas capturadas: ${total}\n\n`;

    md += '## Distribución de chispas\n\n';
    dist.forEach(d => {
      const bar = '█'.repeat(Math.round(d.pct / 5)).padEnd(20, '░');
      md += `- **${d.modo.toUpperCase().padEnd(8)}** ${bar} ${d.pct}%  (${d.n})\n`;
    });
    md += '\n';

    md += '## Lectura de Ade\n\n';
    md += `> ${lectura}\n\n`;

    md += '## Ideas capturadas\n\n';
    if (ideas.length === 0) {
      md += '_Aún no hay ideas guardadas._\n';
    } else {
      ideas.forEach(i => {
        md += `### ${i.date}\n`;
        md += `**${i.text}**\n\n`;
        md += `- Chispa: ${i.spark} · Vibe: ${i.vibe} · Puntos: ${i.score}\n\n`;
      });
    }

    md += '\n---\n_Generado por ADE · ' + new Date().toLocaleString('es-ES') + '_\n';
    downloadFile('bitacora_ade.md', md, 'text/markdown;charset=utf-8');
  };

  const exportarBitacoraPDF = () => {
    const { perfil, tipo, total, dist, lectura } = construirSnapshot();

    const distHtml = dist.map(d => `
      <div class="dist-row">
        <span class="dist-modo">${d.modo.toUpperCase()}</span>
        <span class="dist-bar"><span style="width:${d.pct}%"></span></span>
        <span class="dist-pct">${d.pct}%</span>
      </div>
    `).join('');

    const ideasHtml = ideas.length === 0
      ? '<p class="empty"><em>Aún no hay ideas guardadas.</em></p>'
      : ideas.map(i => `
            <div class="idea">
              <div class="idea-meta">
                <span class="idea-spark">${i.spark || ''}</span>
                <span class="idea-date">${i.date} · ${i.score}pts</span>
              </div>
              <div class="idea-text">${escapeHtml(i.text)}</div>
            </div>
          `).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Bitácora ADE</title>
<style>
  @page { margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1A2332; line-height: 1.55; max-width: 760px; margin: 0 auto; padding: 32px; }
  h1 { font-size: 36px; font-weight: 900; letter-spacing: -0.03em; margin: 0 0 6px; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.28em; color: #888; margin: 36px 0 14px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; font-family: -apple-system, sans-serif; }
  .lead { color: #666; font-style: italic; margin: 0 0 32px; font-size: 14px; }
  .tipo { font-size: 24px; color: #f5c400; font-weight: 900; margin: 0 0 4px; letter-spacing: -0.01em; }
  .tipo-desc { color: #555; font-size: 14px; margin: 0; }
  .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f3f3; font-size: 14px; }
  .stat strong { font-family: -apple-system, sans-serif; }
  .dist-row { display: flex; align-items: center; gap: 12px; padding: 4px 0; font-family: -apple-system, sans-serif; font-size: 12px; }
  .dist-modo { width: 80px; font-weight: 900; letter-spacing: 0.15em; color: #1A2332; }
  .dist-bar { flex: 1; height: 6px; background: #f0f0f0; border-radius: 999px; overflow: hidden; }
  .dist-bar > span { display: block; height: 100%; background: #FFD600; }
  .dist-pct { width: 40px; text-align: right; font-family: monospace; color: #666; }
  .ade-says { background: #1A2332; color: #FFD600; font-style: italic; padding: 18px 22px; border-radius: 14px; margin: 16px 0 0; font-size: 14px; }
  .ade-says::before { content: '✦  '; }
  .idea { padding: 14px 16px; border: 1px solid #eee; border-radius: 10px; margin-bottom: 10px; page-break-inside: avoid; }
  .idea-meta { display: flex; justify-content: space-between; font-size: 10px; color: #999; margin-bottom: 6px; font-family: -apple-system, sans-serif; letter-spacing: 0.12em; text-transform: uppercase; }
  .idea-spark { color: #f5c400; font-weight: 900; }
  .idea-text { font-size: 15px; font-weight: 600; color: #1A2332; line-height: 1.4; }
  .empty { color: #999; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; font-family: -apple-system, sans-serif; }
  @media print {
    body { padding: 0; }
    h1 { page-break-after: avoid; }
    h2 { page-break-after: avoid; }
  }
</style>
</head>
<body>
  <h1>Bitácora ADE</h1>
  <p class="lead">El espejo más honesto que tendrás.</p>

  <h2>Perfil creativo</h2>
  ${tipo ? `
    <p class="tipo">${tipo.nombre}</p>
    <p class="tipo-desc">${tipo.descripcion}</p>
  ` : '<p class="empty"><em>Aún sin perfil. Juega tu primera partida.</em></p>'}

  <h2>Stats</h2>
  <div class="stat"><span>Sesiones jugadas</span><strong>${perfil.sesiones}</strong></div>
  <div class="stat"><span>Ideas guardadas</span><strong>${perfil.ideasGuardadas}</strong></div>
  <div class="stat"><span>Racha actual</span><strong>${perfil.racha} día${perfil.racha !== 1 ? 's' : ''}</strong></div>
  <div class="stat"><span>Total chispas</span><strong>${total}</strong></div>

  <h2>Distribución de chispas</h2>
  ${distHtml}

  <h2>Lectura de Ade</h2>
  <div class="ade-says">${escapeHtml(lectura)}</div>

  <h2>Ideas capturadas</h2>
  ${ideasHtml}

  <div class="footer">Generado por ADE · ${new Date().toLocaleString('es-ES')}</div>

  <script>
    // Disparamos print al cargar; el usuario elige "Guardar como PDF".
    window.addEventListener('load', () => setTimeout(() => window.print(), 400));
  </script>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
      console.warn('[ADE export] no se pudo abrir ventana de impresión');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // Helper local para escapar HTML en el contenido del usuario.
  function escapeHtml(s: string): string {
    return (s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c] as string));
  }

  useEffect(() => {
    setIdeas(getIdeas());

    // Radar alimentado por el perfil real de adeProfile.ts (alma sec.4 —
    // Bitácora como espejo mental). Cada eje agrega los modos cuyo
    // significado le corresponde:
    //   VUELO  ← BRILLO            (originalidad / chispa creativa)
    //   SALTO  ← CAOS + ERROR      (disrupción + giro inesperado)
    //   MIRADA ← SECRETO + DESEO   (profundidad + intuición)
    //   ECO    ← ECO               (resonancia / impacto)
    //   PULSO  ← RITUAL + RUIDO    (constancia + distracción productiva)
    // Cada captura aporta 10 puntos al eje correspondiente, capeado en 100.
    const perfil = getPerfilCompleto();
    const c = perfil.capturas;
    setRadarStats({
      vuelo: Math.min(100, c.brillo * 10),
      salto: Math.min(100, (c.caos + c.error) * 10),
      mirada: Math.min(100, (c.secreto + c.deseo) * 10),
      eco: Math.min(100, c.eco * 10),
      pulso: Math.min(100, (c.ritual + c.ruido) * 10),
    });
  }, []);

  // Radar data
  const stats = [
    { label: 'VUELO', value: radarStats.vuelo },
    { label: 'SALTO', value: radarStats.salto },
    { label: 'MIRADA', value: radarStats.mirada },
    { label: 'ECO', value: radarStats.eco },
    { label: 'PULSO', value: radarStats.pulso },
  ];

  // SVG Radar generator
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const angleStep = (Math.PI * 2) / stats.length;

  const points = stats.map((stat, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + (radius * (stat.value / 100)) * Math.cos(angle);
    const y = center + (radius * (stat.value / 100)) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridPoints = [1.0, 0.75, 0.5, 0.25].map(scale => {
    return stats.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + (radius * scale) * Math.cos(angle);
      const y = center + (radius * scale) * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  const filteredIdeas = filter === 'recientes' ? ideas : ideas.filter(i => i.type === filter);

  return (
    <div className="min-h-screen-safe pb-safe bg-ade-beige flex flex-col p-6 space-y-8 overflow-y-auto">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter text-ade-dark">
          Bitácora & <br /> Creative Radar
        </h2>
        <div className="w-12 h-12 bg-ade-gold rounded-full border-4 border-white shadow-md overflow-hidden">
          <img src={adeOffended} alt="Ade" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Banner de "lectura final" — solo cuando llega de partida.
          Frase computada de getFraseAde('fin') al montar. */}
      {fraseFin && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-ade-dark text-white rounded-2xl p-5 flex items-start gap-3 shadow-lg"
        >
          <Sparkles className="w-5 h-5 text-ade-gold fill-ade-gold flex-shrink-0 mt-0.5" />
          <p className="italic text-sm leading-snug">{fraseFin}</p>
        </motion.div>
      )}

      {/* CREATIVE RADAR (REAL SVG) */}
      <section className="glass-card p-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
        <div className="w-full flex justify-between items-center mb-4 relative z-10">
          <h3 className="text-xs font-black tracking-[0.2em] text-ade-dark/40 uppercase">
            Creative Radar
          </h3>
          <div className="flex items-center gap-1.5">
            {/* MD enriquecido — perfil + stats + distribución + ideas */}
            <button
              onClick={exportarBitacoraMD}
              title="Descargar como Markdown"
              className="bg-white/50 p-2 rounded-xl text-ade-dark/50 hover:text-ade-dark hover:bg-white transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
            {/* PDF print-ready — abre ventana imprimible, usuario guarda como PDF */}
            <button
              onClick={exportarBitacoraPDF}
              title="Imprimir o guardar como PDF"
              className="bg-white/50 p-2 rounded-xl text-ade-dark/50 hover:text-ade-dark hover:bg-white transition-all"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative w-full aspect-square flex items-center justify-center">
          <svg width={size} height={size} className="overflow-visible">
            {/* Grid */}
            {gridPoints.map((points, i) => (
              <polygon 
                key={i} 
                points={points} 
                fill="none" 
                stroke="rgba(26, 35, 50, 0.1)" 
                strokeWidth="1" 
              />
            ))}
            {/* Axis */}
            {stats.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              return (
                <line 
                  key={i} 
                  x1={center} y1={center} x2={x} y2={y} 
                  stroke="rgba(26, 35, 50, 0.1)" 
                  strokeWidth="1" 
                />
              );
            })}
            {/* Data Shape */}
            <motion.polygon
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              points={points}
              fill="#FFC83D"
              stroke="#FF7043"
              strokeWidth="2"
            />
            {/* Labels */}
            {stats.map((stat, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const x = center + (radius + 25) * Math.cos(angle);
              const y = center + (radius + 20) * Math.sin(angle);
              return (
                <text
                  key={i}
                  x={x} y={y}
                  textAnchor="middle"
                  className="text-[10px] font-black fill-ade-dark/60 tracking-wider"
                >
                  {stat.label}
                </text>
              );
            })}
          </svg>
        </div>
      </section>

      {/* CAPTURED IDEAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black tracking-[0.2em] text-ade-dark/40 uppercase">
            Ideas Capturadas
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {['recientes', 'mejores', 'locas', 'útiles'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-ade-dark text-white shadow-md' : 'bg-white/50 text-ade-dark/50 hover:bg-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredIdeas.map((idea) => (
              <motion.div 
                key={idea.id}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-ade-dark/5 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge nuevo: tipo de chispa que originó la idea con
                        su color del modo. Solo se renderiza si idea.spark
                        cae en MODO_BADGE (protección para sparks legacy). */}
                    {idea.spark && MODO_BADGE[idea.spark.toLowerCase()] && (
                      <span
                        className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          background: MODO_BADGE[idea.spark.toLowerCase()],
                          color: MODO_BADGE_FG[idea.spark.toLowerCase()],
                        }}
                      >
                        {idea.spark}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-ade-dark/30 uppercase tracking-widest">
                      {idea.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-ade-beige px-2 py-1 rounded-md">
                    <Sparkles className="w-3 h-3 text-ade-gold" />
                    <span className="text-[10px] font-black text-ade-gold">{idea.score}pts</span>
                  </div>
                </div>
                <p className="font-bold text-ade-dark text-sm mb-4 leading-tight">{idea.text}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold bg-ade-dark/5 px-2 py-1 rounded text-ade-dark/60">Chispa: {idea.spark}</span>
                    <span className="text-[10px] font-bold bg-ade-dark/5 px-2 py-1 rounded text-ade-dark/60">Vibe: {idea.vibe}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ade-dark/20" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredIdeas.length === 0 && (
            <div className="text-center py-8 opacity-50">
              <p className="text-sm font-bold">No hay ideas en esta categoría aún.</p>
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM NAV (Reference to Journal View) */}
      {/* nav cambiada de fixed → absolute: se ancla al column del juego
          (App root tiene relative + max-w 430px) en lugar de extenderse
          a todo el viewport en desktop. */}
      <nav className="absolute bottom-0 left-0 w-full bg-ade-beige/90 backdrop-blur-xl border-t border-ade-dark/5 p-4 px-8 flex justify-between items-center z-50">
        <button onClick={onBack} className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold">Juego</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-ade-accent">
          <Book className="w-6 h-6" />
          <span className="text-[10px] font-bold">Bitácora</span>
        </button>
        <button
          onClick={() => {
            if (onMapa) onMapa();
            else showToast('Mapa. Pronto.');
          }}
          className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"
        >
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">Mapa</span>
        </button>
        <button
          onClick={() => {
            if (onPerfil) onPerfil();
            else showToast('Perfil. Pronto.');
          }}
          className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity"
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </nav>

      {/* Mejora 05 — toast efímero */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ade-dark/90 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase z-[200] shadow-lg backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Journal;
