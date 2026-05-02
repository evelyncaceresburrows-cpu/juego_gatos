# ADE — Informe completo de estado

**Fecha:** 1 de mayo de 2026
**Alcance revisado:** `App.tsx`, `main.tsx`, `index.html`, `index.css`, `tailwind.config.js`, `src/components/Home.tsx`, `src/components/Game.tsx`, `src/components/Journal.tsx`, `src/lib/storage.ts`, assets en `src/assets/ade/characters/`.
**Estado del dev server:** corriendo en `http://localhost:5173`, HTTP 200, sin errores en consola.

## Resumen ejecutivo

El proyecto está mucho más avanzado de lo que aparenta el primer commit. Home, Game y Journal funcionan end-to-end, los PNGs reales de Ade renderizan, el sistema de combo y vibes está cableado al storage, el Creative Radar lee de localStorage y se actualiza al guardar ideas. Lo que falta es endurecimiento: cuatro bugs visibles, dos riesgos de mediano plazo, y un puñado de detalles de pulido. Ningún hallazgo requiere refactor estructural.

## Decisiones ya tomadas en esta sesión

**Eliminados por código muerto:**
- `src/components/CaptureModal.tsx`
- `src/types/game.ts` (y su carpeta `types/`)

Razón: ambos archivos eran un draft de iteración anterior, huérfanos (cero imports), con tres bugs (color fantasma `ade-yellow`, path de imagen inexistente `/assets/ade/ade_eureka.png`, tipos incompatibles con `lib/storage.ts`). Game.tsx ya construyó su propio modal Eureka inline conectado al scoring real, así que no había nada que rescatar. Si en el futuro se quiere clasificación manual por concepto de energía, mejor diseñarla contra la mecánica viva.

## Hallazgos pendientes

### Bugs (rompen funcionalidad)

**1. `hide-scrollbar` no existe.**
Journal.tsx línea 139 aplica `className="...hide-scrollbar"` a la fila de filtros. La utilidad no está definida ni en `index.css` ni en `tailwind.config.js`. En Firefox y Safari móvil aparece la scrollbar horizontal. Fix: añadir tres líneas a `index.css`.

**2. Botones decorativos sin handler.**
Home.tsx tiene un botón "AJUSTES" sin `onClick`. Journal.tsx tiene tres íconos en la nav inferior ("Mapa", "Perfil" y un cuarto sin acción). Si el usuario los toca, no pasa nada. Es frustración silenciosa.

### Riesgos (no rompen ahora pero pinchan después)

**3. Memory churn en el timer de Game.tsx.**
El `useEffect` que arma `setInterval` para el countdown y para `spawnSpark` lleva `score` en su array de dependencias (línea ~127). Cada captura desmonta y rearma ambos intervals. Funciona, pero el reloj puede saltar fracciones de segundo bajo carga. `setTimeLeft(prev => ...)` ya usa updater functional, así que basta con quitar `score` del array.

**4. `localStorage` sin defensas.**
`lib/storage.ts` usa `JSON.parse(localStorage.getItem(...))` sin try/catch. Si alguien tiene `ade_ideas` o `ade_stats` corrupto (cosa que pasa con hot-reloads agresivos en dev, o con el usuario tocando devtools), la app crashea al abrir Bitácora. Wrap defensivo de seis líneas.

### Pulido

**5. Metadata de `index.html` desalineada.**
`<title>gatos</title>` y `lang="en"`. Debería ser `"ADE — El gato que caza ideas"` y `lang="es"`. Sin esto, el favicon en pestañas y el SEO básico no comunican nada.

**6. `useRef<NodeJS.Timeout>()` en Game.tsx.**
Tipo de runtime de Node usado en código de browser. Compila porque `@types/node` está instalado, pero conceptualmente sucio. Reemplazar por `useRef<ReturnType<typeof setTimeout> | null>(null)`.

## Lo que NO es bug

- El "ADE" gris en el screenshot del Home no es bug. `text-ade-dark` es `#1A2332`, navy profundo, que sobre beige se lee como oscuro suave. Es la decisión visual del diseño.
- La home no tiene Ade en estado "curious" porque el asset `ade-curious.png` no existe en `src/assets/ade/characters/` (solo idle, hunt, eureka, offended). Si se quiere agregar, es trabajo de diseño, no de código.

## Métricas del codebase

- **Líneas TSX:** ~750 (4 componentes + storage + types eliminados)
- **Componentes activos:** 4 (`App`, `Home`, `Game`, `Journal`)
- **Assets PNG de Ade en uso:** 4 (idle, hunt, eureka, offended)
- **Cobertura de tests:** 0% (ningún test existe; no se pidió añadir)
