// Mejora 03 — defensas en lectura de localStorage
// Destino: src/lib/storage.ts
// Acción: REEMPLAZAR las funciones getIdeas() y getStats() existentes.
//         Las firmas públicas no cambian; quien las consume no necesita ajustes.
//
// Qué hace:
//   Hoy, getIdeas() y getStats() llaman a JSON.parse sobre el contenido
//   crudo de localStorage. Si el storage está corrupto (por hot-reload
//   agresivo en dev, manipulación desde devtools, o una pestaña paralela
//   guardando algo distinto), JSON.parse lanza y la app crashea al
//   abrir Bitácora.
//
//   Esta versión envuelve el parse en try/catch, valida la forma del
//   objeto antes de retornarlo, loguea con prefijo [ADE storage] y limpia
//   la key dañada para que la próxima sesión arranque sana.
//
// No toca diseño visual ni el shape de los datos.

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

export const getStats = (): RadarStats => {
  // Default consistente con el original.
  const fallback: RadarStats = { vuelo: 30, salto: 20, mirada: 25, eco: 35, pulso: 15 };

  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (!saved) return fallback;

    const parsed = JSON.parse(saved);

    // Validamos forma antes de devolver: 5 números, ningún campo extraño.
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
