export interface Idea {
  id: number;
  date: string;
  text: string;
  spark: string;
  vibe: string;
  score: number;
  type: 'locas' | 'mejores' | 'útiles' | 'recientes';
}

export interface RadarStats {
  vuelo: number;
  salto: number;
  mirada: number;
  eco: number;
  pulso: number;
}

const IDEAS_KEY = 'ade_ideas';
const STATS_KEY = 'ade_stats';

export const getIdeas = (): Idea[] => {
  try {
    const saved = localStorage.getItem(IDEAS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[ADE storage] ade_ideas corrupto, reseteando:', err);
    localStorage.removeItem(IDEAS_KEY);
    return [];
  }
};

export const saveIdeaToStorage = (idea: Idea) => {
  const current = getIdeas();
  const updated = [idea, ...current];
  localStorage.setItem(IDEAS_KEY, JSON.stringify(updated));
  updateStatsForIdea(idea);
};

export const getStats = (): RadarStats => {
  const fallback: RadarStats = { vuelo: 30, salto: 20, mirada: 25, eco: 35, pulso: 15 };

  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (!saved) return fallback;

    const parsed = JSON.parse(saved);

    const isValid =
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.vuelo === 'number' &&
      typeof parsed.salto === 'number' &&
      typeof parsed.mirada === 'number' &&
      typeof parsed.eco === 'number' &&
      typeof parsed.pulso === 'number';

    if (!isValid) throw new Error('forma inválida');
    return parsed as RadarStats;
  } catch (err) {
    console.warn('[ADE storage] ade_stats corrupto, reseteando:', err);
    localStorage.removeItem(STATS_KEY);
    return fallback;
  }
};

const updateStatsForIdea = (idea: Idea) => {
  const stats = getStats();
  
  switch(idea.vibe) {
    case 'Oro': stats.mirada = Math.min(100, stats.mirada + 8); break;
    case 'Azul': stats.vuelo = Math.min(100, stats.vuelo + 8); break;
    case 'Verde': stats.eco = Math.min(100, stats.eco + 8); break;
    case 'Morado': stats.salto = Math.min(100, stats.salto + 8); break;
    default: stats.pulso = Math.min(100, stats.pulso + 5); break;
  }
  
  if (idea.score > 20) {
      stats.pulso = Math.min(100, stats.pulso + 5);
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

// Helper genérico para descargar cualquier blob como archivo.
// Journal lo usa para exportar Bitácora en Markdown enriquecido.
export const downloadFile = (
    filename: string,
    content: string,
    mimeType: string = 'text/plain;charset=utf-8'
) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Versión simple — mantenida por compatibilidad. Journal.tsx ahora usa
// una versión enriquecida que incluye perfil + radar + lectura de Ade.
export const downloadJournal = () => {
    const ideas = getIdeas();
    let content = "# Mi Bitácora Creativa ADE\n\n";
    ideas.forEach(i => {
        content += `## ${i.date}\n`;
        content += `- **Idea:** ${i.text}\n`;
        content += `- **Chispa:** ${i.spark} | **Vibe:** ${i.vibe} | **Puntos:** ${i.score}\n\n`;
    });
    downloadFile('bitacora_ade.md', content, 'text/markdown;charset=utf-8');
};
