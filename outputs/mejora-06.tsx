// Mejora 06 — tipo correcto del ref para timeouts en navegador
// Destino: src/components/Game.tsx
// Acción: aplicar los dos parches en orden.
//
// Qué hace:
//   Hoy, Game.tsx declara `const adeTimeout = useRef<NodeJS.Timeout>();`.
//   El tipo `NodeJS.Timeout` viene del runtime de Node, no del browser.
//   Compila solo porque @types/node está instalado como devDependency;
//   si alguien la quita pensando que no se usa, el archivo deja de
//   compilar.
//
//   La forma correcta y portátil es `ReturnType<typeof setTimeout>`,
//   que en navegador es `number` y en Node es `Timeout`. El ref también
//   gana un default `null` para que el lint y la lectura sean limpias.
//
// No toca diseño visual.

// =================================================================
// PARCHE 1 — REEMPLAZÁ la línea actual:
//   const adeTimeout = useRef<NodeJS.Timeout>();
// por:
// =================================================================

const adeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

// =================================================================
// PARCHE 2 — REEMPLAZÁ la función triggerAdeState completa por esta
// versión, que limpia el ref a null cuando deja de estar en uso:
// =================================================================

const triggerAdeState = (
  state: 'idle' | 'hunt' | 'eureka' | 'offended',
  duration: number = 2000
) => {
  setAdeState(state);

  // Cancelamos cualquier timeout previo y dejamos el ref limpio.
  if (adeTimeout.current) {
    clearTimeout(adeTimeout.current);
    adeTimeout.current = null;
  }

  // Eureka es estado pegajoso (lo cierra el modal); para los demás,
  // volvemos a 'idle' después de `duration` ms.
  if (state !== 'eureka') {
    adeTimeout.current = setTimeout(() => {
      setAdeState('idle');
      adeTimeout.current = null;
    }, duration);
  }
};
