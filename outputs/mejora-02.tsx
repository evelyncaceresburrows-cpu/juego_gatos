// Mejora 02 — sacar 'score' del array de dependencias del timer
// Destinos:
//   1) src/App.tsx (PARCHE 0)
//   2) src/components/Game.tsx (PARCHES A y B)
// Acción: aplicar los tres parches en orden.
//
// Qué hace:
//   Hoy, el useEffect de Game.tsx que arma el countdown y el spawner de
//   chispas declara [score, onEnd, spawnSpark, showEureka] como deps.
//   Cada captura cambia 'score' → React desmonta y rearma ambos
//   setInterval. Eso genera churn de timers y puede hacer que el reloj
//   salte fracciones bajo carga.
//
//   Sacamos 'score' del array y leemos el valor más reciente vía un ref
//   (scoreRef). El useEffect ahora solo se monta una vez por ciclo de
//   pausa (cuando entra/sale el modal Eureka).
//
//   IMPORTANTE: para que sacar 'score' del array NO genere otro problema,
//   también memoizamos 'onEnd' en App.tsx con useCallback. Hoy no hay
//   loop porque App no re-renderiza durante el juego, pero la memoización
//   es defensiva: cualquier estado nuevo en App que cambie durante el
//   juego dispararía el bucle. El PARCHE 0 lo cierra de antemano.
//
// No toca diseño visual.

// =================================================================
// PARCHE 0 — src/App.tsx
// -----------------------------------------------------------------
// PASO 0.1 — Asegurate que useCallback esté en el import de React:
//   Cambiá:   import { useState } from 'react';
//   Por:      import { useState, useCallback } from 'react';
//
// PASO 0.2 — REEMPLAZÁ la función handleGameEnd existente por:
// =================================================================

const handleGameEnd = useCallback((score: number) => {
  setLastScore(score);
  setCurrentScreen('journal');
}, []);

// (Las deps van vacías: setLastScore y setCurrentScreen son setters de
// useState, que React garantiza estables entre renders.)


// =================================================================
// PARCHE A — src/components/Game.tsx
// -----------------------------------------------------------------
// Agregá ESTAS DOS LÍNEAS justo después de los useState existentes
// (cerca del bloque `const [score, setScore] = useState(0); ...`):
// =================================================================

const scoreRef = useRef(score);
useEffect(() => { scoreRef.current = score; }, [score]);


// =================================================================
// PARCHE B — src/components/Game.tsx
// -----------------------------------------------------------------
// REEMPLAZÁ el useEffect del timer (el que tiene `if (showEureka) return;`
// y monta `setInterval` para countdown y spawn) por este bloque:
// =================================================================

useEffect(() => {
  if (showEureka) return;

  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(timer);
        // Leemos el score más reciente sin meterlo en deps:
        onEnd(scoreRef.current);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  const sparkInterval = setInterval(spawnSpark, 1200);

  return () => {
    clearInterval(timer);
    clearInterval(sparkInterval);
  };
  // 'score' YA NO va en este array; lo leemos por ref arriba.
  // 'onEnd' es seguro porque el PARCHE 0 lo memoiza en App.tsx.
}, [onEnd, spawnSpark, showEureka]);
