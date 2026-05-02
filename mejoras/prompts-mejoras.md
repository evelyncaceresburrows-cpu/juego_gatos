# 6 mejoras priorizadas — ADE

Cada mejora se entrega como un archivo independiente en `outputs/` con el nombre `mejora-NN.<ext>`. La extensión depende del archivo destino, no es siempre `.js`.

Reglas vinculantes para todas las mejoras (heredadas de `contexto/ADE-instrucciones.md`):

- No tocar el diseño visual existente.
- Comentario en español al inicio del archivo: qué hace, dónde va, si reemplaza o se agrega.
- Listo para implementar sin modificaciones.

---

## Mejora 01 — `hide-scrollbar` utility

**Archivo destino:** `src/index.css` (agregar al `@layer utilities` o como bloque al final).

**Problema:** Journal.tsx aplica la clase `hide-scrollbar` a la fila de filtros (`recientes / mejores / locas / útiles`) pero la utilidad no existe. En Firefox y Safari móvil aparece la scrollbar horizontal y rompe la sensación premium.

**Especificación:**
- Definir una utilidad `.hide-scrollbar` que funcione en Webkit (`::-webkit-scrollbar`), Firefox (`scrollbar-width: none`) y IE/Edge legacy (`-ms-overflow-style: none`).
- Mantener `overflow-x: auto` funcional, solo ocultar la barra.

**Salida esperada:** `outputs/mejora-01.css`

---

## Mejora 02 — Sacar `score` de las deps del timer

**Archivo destino:** `src/components/Game.tsx`, dentro del `useEffect` que arma `setInterval` para el countdown y `spawnSpark` (alrededor de la línea 127, dependiendo del estado).

**Problema:** El array `[score, onEnd, spawnSpark, showEureka]` incluye `score`. Cada captura cambia score → React desmonta y rearma ambos intervals. El reloj puede saltar fracciones bajo carga y se generan timers nuevos cada hit.

**Especificación:**
- Reescribir solo el bloque `useEffect` afectado.
- Usar `setTimeLeft(prev => ...)` (ya está) y mover la llamada a `onEnd(score)` a un ref o usar functional access via state setter.
- Resultado: el `useEffect` debe depender únicamente de `[showEureka, spawnSpark]` (y `onEnd` si la regla del lint lo exige; en ese caso pasarlo memoizado o documentar).

**Salida esperada:** `outputs/mejora-02.tsx` con el snippet completo del `useEffect` listo para reemplazar.

---

## Mejora 03 — Defensas en `lib/storage.ts`

**Archivo destino:** `src/lib/storage.ts`, funciones `getIdeas()` y `getStats()`.

**Problema:** `JSON.parse(localStorage.getItem(KEY))` sin try/catch. Si el storage está corrupto (hot-reload agresivo, devtools, otra pestaña), la app crashea al abrir Bitácora.

**Especificación:**
- Wrap defensivo: try/catch alrededor del parse.
- En caso de error: log a consola con prefijo `[ADE storage]`, retornar el default (array vacío para ideas, RadarStats inicial para stats), y limpiar la key corrupta para que la próxima sesión arranque limpia.
- No cambiar las firmas públicas.

**Salida esperada:** `outputs/mejora-03.ts` con las dos funciones reescritas, listas para reemplazar.

---

## Mejora 04 — Metadata de `index.html`

**Archivo destino:** `index.html` (raíz del proyecto, no `src/`).

**Problema:** `<title>gatos</title>`, `lang="en"`, sin `<meta name="description">`. Daña pestañas, SEO y compartibilidad.

**Especificación:**
- `lang="es"`.
- `<title>ADE — El gato que caza ideas</title>`.
- Agregar `<meta name="description" content="Un juego creativo donde Ade caza chispas de ideas y construye tu bitácora de pensamiento lateral.">`.
- Agregar `<meta name="theme-color" content="#F5EFE6">` para chrome móvil.
- No tocar el `<script type="module">` ni el favicon.

**Salida esperada:** `outputs/mejora-04.html` con el archivo completo listo para reemplazar.

---

## Mejora 05 — Handlers placeholder en botones decorativos

**Archivos destino:** `src/components/Home.tsx` (botón AJUSTES) y `src/components/Journal.tsx` (nav inferior: Juego, Bitácora, Mapa, Perfil).

**Problema:** Botones sin `onClick`. Tap = nada. Frustración silenciosa.

**Especificación:**
- En cada botón sin handler real, agregar un `onClick` que dispare un `console.info('[ADE] {nombre} aún no disponible')` y muestre un toast efímero opcional (si se puede sin librería extra, usando solo state local + un div que aparezca 2 segundos con `bg-ade-dark/90 text-white px-4 py-2 rounded-xl fixed bottom-24 left-1/2 -translate-x-1/2 z-[200]`).
- En Journal.tsx, el botón "Juego" sí debe llamar `onBack()` (ya lo hace, no tocar).
- No agregar dependencias nuevas.

**Salida esperada:** `outputs/mejora-05.tsx` con dos snippets claramente separados (uno para Home, uno para Journal), cada uno con su comentario indicando qué reemplazar.

---

## Mejora 06 — Tipo correcto de `useRef` para timeout

**Archivo destino:** `src/components/Game.tsx`, declaración `adeTimeout` (alrededor de la línea 110).

**Problema:** `useRef<NodeJS.Timeout>()` usa el tipo de Node en código de browser. Compila por `@types/node` instalado, pero es contaminación conceptual y rompe si alguien quita la dep.

**Especificación:**
- Reemplazar por `useRef<ReturnType<typeof setTimeout> | null>(null)`.
- Adaptar los puntos donde se asigna y se limpia para que respeten el `| null`.

**Salida esperada:** `outputs/mejora-06.tsx` con el snippet del ref + los dos puntos de uso (asignación y `clearTimeout`).

---

## Orden de ejecución sugerido

1. **04** (1 min, riesgo cero, gana SEO).
2. **01** (2 min, fix visible en mobile).
3. **03** (5 min, blinda producción).
4. **06** (5 min, limpia tipos).
5. **02** (10 min, requiere cuidado con el lint de hooks).
6. **05** (15 min, decisión de UX para el toast).
