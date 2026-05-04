# ADE — Informe completo

**Fecha:** mayo 2026 · **Versión:** Fase 3 cerrada + Caos como personalidad
**Live:** https://juego-gatos.vercel.app
**Repo:** github.com/evelyncaceresburrows-cpu/juego_gatos

---

## 1. Qué es ADE

ADE es un juego que cabe en treinta segundos. Un gato — Ade, gato oriental shorthair color crema con manchas — te ayuda a pensar. No es un quiz, no es un coach motivacional, no felicita. Captura "chispas" (palabras-conceptos) que aparecen en pantalla; cuando juntas cinco, Ade abre una ronda de fusión donde combinas dos para destilar un insight. Lo guardas o lo dejas ir. La sesión termina y Ade te lee: tres frases que NO son random, son lectura del comportamiento real que acabas de mostrar.

La filosofía está en `contexto/ADE-alma.md`: Ade es una entidad observadora. No celebra, no premia, no aprueba. Las métricas existen porque revelan algo del jugador, no porque suben dopamina. Si una frase no dice nada concreto sobre cómo jugaste, no aparece. Si la métrica solo decora, se elimina.

El nombre viene del latín *adeo* — "ir hacia". Es lo que hace el gato cuando caza una idea.

---

## 2. Stack técnico

Frontend puro, sin backend.

- **React 19** con TypeScript estricto
- **Vite 8** (rolldown) como bundler
- **Tailwind 3.4** con utilities custom para safe-area y dvh
- **framer-motion** para todas las animaciones (sin CSS @keyframes excepto el shine sweep del CTA)
- **lucide-react** para iconos
- **localStorage** como única capa de persistencia (cuatro keys, ver §9)
- **GitHub + Vercel CLI** para deploy manual con token

El bundle pesa ~393KB JS / ~24KB CSS comprimidos a gzip ~122KB / ~5KB. Los cuatro sprites del gato pesan ~9.8MB sumados (PNG sin optimizar 1536×1024).

No hay framework de routing, ni Redux/Zustand, ni librería de testing. Es deliberadamente simple: cada componente vive solo, el state global lo aporta `App.tsx` y la persistencia es localStorage directo. La complejidad se concentra en cinco "sistemas" puros bajo `src/systems/`.

---

## 3. Arquitectura de archivos

```
src/
  App.tsx                  Router de pantalla (6 estados)
  main.tsx                 Entry point Vite
  index.css                Globales + utilities mobile-safe
  components/
    Home.tsx               Landing con cat + selector de modo + CTA
    Game.tsx               Loop de captura 30s
    GameOver.tsx           "Ade detectó algo"
    FusionRonda.tsx        Ronda 2 — fusionar 2 chispas
    Journal.tsx            Bitácora + Creative Radar + export
    Mapa.tsx               Grid de ideas + timeline
    Perfil.tsx             Tipo creativo + Desbloqueos
  systems/
    adeProfile.ts          Perfil + getFraseAde (corazón)
    modos.ts               5 modos jugables + frases por contexto
    fusiones.ts            36 insights canónicos
    streaks.ts             Unlocks D3/D7/D14/D30
    animo.ts               8 humores de Ade
  lib/
    storage.ts             Helpers legacy ade_ideas + ade_stats
  assets/
    ade/characters/        4 sprites PNG full-body
contexto/
  ADE-alma.md              Filosofía
  ADE-biblia-visual.md     Identidad visual + voz
  ADE-instrucciones.md     Índice
```

`App.tsx` mantiene un único `currentScreen` y rutea entre Home, Game, GameOver, Journal, Mapa, Perfil. La navegación es state-driven, sin router. El árbol JSX es plano y predecible.

---

## 4. Sistemas de juego — cinco capas

### 4.1 Captura (Game.tsx)

Treinta segundos. Cada 1200ms × spawnFactor (varía con el humor de Ade) aparece una chispa: orbe coloreado con label arriba, posición aleatoria dentro del 70% × 45% del canvas. El jugador toca para capturar; si toca el fondo, cuenta como miss y resetea el combo.

Cada captura suma puntaje (10 + combo×2), incrementa el combo, registra el TipoChispa en el perfil, y dispara feedback inmediato: burst de ocho partículas radiando desde el click, anillo expansivo, número flotante "+N" subiendo, y pulse del HUD de Chispas. Cada captura se siente.

Combo en 3 dispara FLOW MODE: overlay dorado a pantalla completa con texto "FLOW", Ade en pose eureka. Cada cinco capturas (combo % 5 == 0) abre FusionRonda.

### 4.2 Fusión (FusionRonda.tsx)

Las cinco últimas chispas se muestran como orbes coloreados. El jugador toca dos. La fusión se calcula con `getFusion(modoA, modoB)` que consulta una matriz de 28 pares premium escritos a mano + 8 auto-pares (cuando el jugador elige la misma chispa dos veces). El resultado es una frase corta tipo "El caos también resuena" o "Doble Ritual. La forma te sostiene".

Aparece un textarea opcional: si el jugador escribe algo, eso se guarda como idea; si no escribe, se guarda el insight literal. Cada idea grabada incluye spark dominante, vibe (color group), puntaje y categoría (locas/mejores/útiles, derivada determinísticamente del modo dominante).

### 4.3 Perfil (adeProfile.ts)

El sistema central. Mantiene en localStorage un `AdeProfile` con:

- `capturas`: contador por cada uno de los 8 TipoChispa canónicos
- `velocidad`: ring buffer de 200 deltas en ms entre capturas
- `sesiones` + `ideasGuardadas` + `racha` + `ultimaSesion`
- `historial`: ring buffer de 20 últimos tipos (para detectar "tres del mismo")
- `sesionesHistorial`: 30 últimas sesiones con capturas + ideas por día

`getFraseAde(contexto)` lee este perfil y devuelve una frase data-driven. Para cada contexto (`'inicio'`, `'captura'`, `'fin'`, `'idea'`) hay una cascada de triggers de comportamiento: tres del mismo tipo, vel anormal, dom dominante, racha alta, ideas vs capturas. Si ningún trigger fuerte aplica, intenta una frase del modo actual (40-55% de probabilidad). Si tampoco, cae al genérico canónico.

La regla es estricta: si la frase no se dispara por algo real del perfil, no se muestra. Cero relleno.

### 4.4 Retención (streaks.ts)

Cuatro umbrales acumulativos:

- **D3** *Más voz de Ade* — desbloquea más frases de captura
- **D7** *Una semana*
- **D14** *Frase secreta* — pool de cuatro frases más íntimas que `getFraseAde('inicio')` puede devolver con 33% de probabilidad
- **D30** *Mes con Ade*

Una vez logrado un unlock, queda. Si el jugador rompe la racha, los logrados no se pierden. Hay tracking separado de "ya celebrado" para que el overlay festivo aparezca exactamente una vez por umbral.

La racha actual (no acumulativa) sigue siendo visible en Home como banner cuando es ≥ 2, junto al próximo umbral pendiente.

### 4.5 Personalidad (animo.ts)

Decisión editorial: "Caos no debe ser un botón, debe ser una personalidad jugable". Generalizamos a los 8 modos. Cada uno produce un humor distinto en Ade cuando es el dominante del perfil.

Los humores son: filoso (caos), amplio (eco), ansioso (deseo), sereno (ritual), encendido (brillo), distraído (ruido), atento (secreto), torcido (error), neutro (perfil sub-umbral). Cada humor modula:

- **parpadeoMs** — cada cuánto pestañea Ade en idle (3.8s a 7.8s)
- **spawnFactor** — multiplicador del intervalo de spawn (0.85× a 1.15×)
- **adjetivo** — palabra corta visible bajo "Modo · X" en HUD
- **tono** — hint para el voice de Ade (futuro)

El umbral para que el humor "salga" del estado neutro: ≥ 8 capturas totales y dominante con ≥ 18% de las capturas. Sin esto, perfiles dispersos no generarían un humor caprichoso.

El jugador no elige el humor. Lo gana jugando. Y cuando lo gana, el feel del juego cambia: filoso es chispas más densas y rápidas con Ade pestañeando casi nervioso; sereno es spawns espaciados y respiración lenta. El sistema convierte cada modo mental en una identidad jugable.

---

## 5. Identidad visual

### Paleta

| Color | Hex | Uso |
|---|---|---|
| ade-beige | #FBF1D8 | Fondo Home + Bitácora — papel cálido |
| ade-dark | #1A2332 | Texto principal |
| ade-gold | #FFD600 | Accent dorado, CTA, métricas vivas |
| ade-accent | #FF7043 | Naranja warm para pills |

Fuera del column del juego, body es #111. En desktop esto enmarca la columna como pantalla de teléfono.

### Vibes — color por TipoChispa

Cuatro paletas para los ocho modos canónicos, asignadas por afinidad temática:

- **Oro #FFD740** → brillo, deseo (luz y querer)
- **Azul #40C4FF** → eco, ritual (resonancia y forma)
- **Verde #69F0AE** → secreto, ruido (profundidad y distracción)
- **Morado #B088FF** → caos, error (disrupción y giro)

Cada chispa siempre tiene su color. No hay aleatoriedad cromática. El color enseña qué tipo de pensamiento estás capturando.

### Tipografía

- **Inter** — pesos 300/400/600/800 — UI
- **Outfit** — pesos 400/700 — H1/H2/H3 + título "ADE"

Tracking apretado en headers (`-0.045em` en el título) y abierto en metadata (`tracking-[0.4em] uppercase` en labels tipo "MODO · CREATIVIDAD").

### Sprites del gato

Cuatro poses full-body, todas en aspect 1.5:1 (1536×1024 PNG):

- **idle** — gato sentado, neutro, mirada al frente
- **hunt** — cuerpo agachado, listo para saltar (animación pounce 0.55s)
- **eureka** — pata levantada, bombilla con destellos (animación 3 saltitos 0.85s)
- **offended** — cuerpo inclinado, tilt -3° (animación slump 0.45s)

Las cuatro fueron generadas a mano y reemplazaron versiones anteriores que estaban cropped al torso. La biblia visual es estricta: "Ade jamás se mueve torpemente. Su animación es siempre suave y elegante".

### Animaciones de Ade

En **Home** (siempre idle), tres capas anidadas con períodos no-múltiplos para que la combinación se sienta orgánica:

- Yawn (estiramiento) cada 13s
- Look around (rotate sutil) cada 10s
- Blink (opacity dip 120ms) cada 6.5s
- Plus el float (y eje) del wrapper externo cada 5s

En **Game**, las animaciones se especializan por estado y el parpadeo idle usa el `parpadeoMs` del humor actual. La respiración del wrapper (y + scale 1.02) sigue el mismo principio: vivo sin ser molesto.

### Feedback de captura

Cuando capturas una chispa se dispara simultáneamente:

1. Burst de 8 partículas del color del spark, radiando 42px, fade en 0.6s
2. Anillo expansivo del mismo color, 14px → 63px, fade en 0.55s
3. Número flotante "+12" subiendo 36px en 0.85s con curva de opacidad
4. Pulse del HUD: el número de Chispas escala 1.28→1 con flash dorado→blanco en 0.32s
5. Ade entra brevemente en estado hunt (1s)
6. Si era la captura 3 del combo, FLOW banner full-screen
7. Si era la 5 del ciclo, mensaje "Ya vi suficiente. Júntalas." y luego FusionRonda

Cada decisión del jugador produce consecuencia visible inmediata. Ninguna captura es muda.

---

## 6. Interfaz por pantalla

### Home

Brand header con sparkles + "Project ADE" en tracking ancho + título "ADE" gigante con shadow dorado + pill "El gato que caza ideas" + tagline funcional ("Conecta palabras. Descubre ideas. Juega 30 segundos."). El cat sprite full body con halo dorado doble (estático + pulse) y sombra de piso. Globo de texto con frase de Ade leída del perfil, posicionado arriba de la cabeza para no taparla.

Bajo el cat, en orden: chip de racha (visible solo cuando ≥ 2) con icono Flame y línea "Día N · Vuelves" + chip pequeño del próximo unlock. Modo selector con 5 pills (Creatividad/Negocio/Ansiedad/Decisiones/Random), el activo en dorado, y tagline italic del modo activo abajo.

CTA primario "Cazar ahora" en dorado con multi-layer shadow + shine sweep al hover. Dos secundarios en glass card: Bitácora y Ajustes. Crown top-right que abre Perfil.

Al cruzar un umbral de unlock por primera vez, overlay festivo pantalla completa con backdrop blur, card crema con borde dorado, "Desbloqueaste / Día N / Nombre / Descripción / Seguimos". Una sola vez por unlock.

### Game

Chip "Modo · X" arriba centrado con adjetivo del humor de Ade abajo en italic muy tenue. HUD principal en card negro con borde sutil: a la izquierda timer con icono dorado, a la derecha contador de Chispas con pulse en cada captura. Combo bar dorado abajo con icono Zap y label "x3" / "Flow x3" / "Flow x5" / "Flow x10".

Canvas central con sparks coloreados según TipoChispa, cada uno con label arriba en uppercase tracking ancho. El cat sprite vive en el bottom-left, animándose por estado. Speech bubble al lado de la cabeza cuando Ade tiene algo que decir.

Botón Pause arriba a la derecha (placeholder) y ChevronLeft a la izquierda que cierra la sesión.

Fondo gradient nocturno deep blue → púrpura → marrón cálido. Luna cálida difusa en posición fija top-right (180×180, blur 40px).

### GameOver

Fondo radial dark con sparkles ambient flotantes. Título "Ade detectó algo" entre dos sparkles dorados. Tres frases en stack vertical, primera en dorado (frase fuerte), segunda y tercera en blanco. Score grande dorado con label "Chispas" arriba en tracking ancho.

Botón primario "Guardar idea" dorado con bookmark icon. Dos secundarios en row: "Otra ronda" + "Compartir" (web share API + clipboard fallback). Link tertiary "Volver al inicio" al pie y X close arriba a la izquierda.

### FusionRonda

Overlay dark sobre el Game con header "Ade vio suficiente" + X close. Estado inicial: cinco orbes coloreados con su modo arriba, en grid responsive. El usuario toca uno, se selecciona (highlight + scale 1.18 + glow), toca el segundo → fusión dispara.

Estado de fusión: dos orbes side by side con sparkle en medio, insight grande en italic dorado, textarea opcional para idea propia (empty placeholder "Tu idea (opcional)…"). Botones: Guardar idea primario + Otra fusión + Saltar.

### Journal (Bitácora)

Header "Bitácora & Creative Radar" + cat avatar circular que abre Perfil. Card del Creative Radar pentagrama con cinco ejes (vuelo/salto/mirada/eco/pulso, legacy del proyecto inicial pre-canon) + iconos de export Markdown y print. La forma del radar se calcula del perfil real.

Sección "Ideas capturadas" con tabs Recientes / Mejores / Locas (filtrado por type). Cada idea es una card blanca con borde sutil: badge de chispa con su color de vibe, fecha + hora, texto en bold, footer con tags Chispa: X y Vibe: Y, puntos en sparkle dorado. Click en una idea expande detalle.

Footer nav fijo abajo con cuatro tabs: Juego, Bitácora (active), Mapa, Perfil — diseñado como tab bar de iOS, acorde a la metáfora de "pantalla de teléfono".

### Mapa

Header con back. "Mapa de ideas" — grid 4×2 de los 8 modos, cada celda muestra el modo + cantidad de ideas + "X IDEA(S)" o "Sin explorar" en gris. Color de borde según vibe del modo, intensidad según cuántas ideas tiene.

"Mapa de progreso" — timeline cronológico de las últimas 30 sesiones. Cada sesión es una fila con fecha, total de chispas, total de ideas, y badge del tipo dominante (color del vibe). Permite ver evolución real, no agregados.

### Perfil

Header con back + título "Perfil creativo". Sección "Tipo creativo" — el dominante del perfil mapea a uno de ocho identidades canónicas: Mente Caótica, Resonante, Intuitivo Puro, Estructurador, Buscador de Brillo, Distracción Útil, Pensador Profundo, Aprendiz del Giro. Nombre dorado grande + descripción italic.

Sección "Chispas capturadas" — card oscura con barras de progreso por modo, cada una con su % del total. Sección "Ade dice" — la frase que Ade tiene en este momento sobre vos.

Sección **Desbloqueos** — los 4 unlocks como filas con icono check (logrado, fondo dorado tenue) o lock (pendiente, fondo neutro), nombre, descripción italic, y day badge a la derecha (D3/D7/D14/D30).

Stats footer en grid 3×1 — Sesiones / Ideas / Racha — con números dorados grandes.

---

## 7. Principios de diseño

### Tono — biblia visual sec.10

Frases cortas, memorables, enigmáticas. Sin felicitación. Sin "¡Bien hecho!". Ade observa, no aprueba. Ejemplos canónicos:

- "Tres CAOS. Insistes." (no "¡Genio creativo!")
- "Caos guardado. Suéltalo." (no "¡Idea brillante guardada!")
- "Sin reglas. Sin freno." (no "Pensamiento out-of-the-box")
- "Catorce días. Algo se asienta." (no "¡Felicitaciones por tu racha!")

### Mobile-first

Column max-w-430 centrada, body bg #111 enmarca el column como pantalla de teléfono. Triple fallback de altura (vh / svh / dvh) para que iPhone Safari no recorte el bottom. Safe-area padding (`env(safe-area-inset-bottom)` con piso 16px) para respetar notch + home indicator.

### Feedback como lectura

Cada métrica revela algo del jugador, no felicita. "RITUAL 20%" es más sincero que "Modo Estructurador desbloqueado". El radar es espejo del comportamiento, no recompensa.

### Identidad jugada, no elegida

Los tipos creativos no son badges que se compran. Emergen del perfil. Si jugaste mucho Caos, eres Mente Caótica. Si jugaste mucho Ritual, eres Estructurador. La identidad se gana, no se setea.

### Caos como personalidad

Decisión específica del usuario: los modos no son cosméticos. Cada modo dominante cambia el feel del juego. Filoso es spawns rápidos con Ade pestañeando nervioso; sereno es spawns espaciados con respiración lenta. El humor vive en el HUD, en el spawn rate, y en el ritmo del parpadeo.

### Ninguna decisión es cosmética

Cambiar de modo de juego cambia: vocabulario visible, tono de Ade, color del feel. Capturar una chispa cambia: combo, score, profile, humor futuro. Saltar una fusión cambia: la idea se pierde, perfil registra el patrón. Cada decisión deja huella.

---

## 8. Localización

Español neutro chileno (es-CL). Sin voseo rioplatense. Las formas verbales pasaron de "vos" a "tú/usted" neutras chilenas:

| Voseo (eliminado) | Chileno neutro (actual) |
|---|---|
| volvés | vuelves |
| querés | quieres |
| podés | puedes |
| sos | eres |
| tenés | tienes |
| vení | ven |
| decí | di / dice |
| mirá | mira |
| soltá | suelta |
| respirá | respira |
| decidí | decide |
| tocá | toca |
| apuntá | apunta |
| llevala | llévala |
| probala / medila | pruébala / mídela |
| reconstruila | reconstrúyela |

Imperativos pronominales clíticos en su forma chilena correcta (júntalas, suéltala, dilo, hazlo). Vocabulario neutro: "aquí" en vez de "acá" cuando aplica, "a ti" en vez de "a vos".

---

## 9. Persistencia

Todo en localStorage del browser. Sin backend, sin cuenta, sin login.

| Key | Tipo | Contenido |
|---|---|---|
| `ade-profile` | `AdeProfile` | capturas, velocidad, racha, sesiones, ideasGuardadas, ultimaSesion, historial, sesionesHistorial |
| `ade_ideas` | `Idea[]` | lista de ideas guardadas con id, fecha, texto, spark, vibe, score, type |
| `ade_stats` | `RadarStats` | radar legacy: vuelo/salto/mirada/eco/pulso |
| `ade_modo_actual` | `ModoJuegoId` | "creatividad" / "negocio" / "ansiedad" / "decisiones" / "random" |
| `ade_unlocks_logrados` | `string[]` | ids acumulativos: frases_extra, racha_semana, frase_secreta, mes_completo |
| `ade_unlocks_celebrados` | `string[]` | ids ya con toast (para no repetir celebración) |

Lectura defensiva: cada parser tiene `try/catch` y reset a defaults si encuentra schema corrupto. Backward-compat: campos nuevos como `sesionesHistorial` se inicializan vacío en perfiles viejos.

---

## 10. Build & deploy

- **Repo:** github.com/evelyncaceresburrows-cpu/juego_gatos
- **Branch:** main
- **Deploy:** manual via Vercel CLI (`npx vercel --prod --yes --token X`)
- **URL:** https://juego-gatos.vercel.app
- **CI auto-deploy:** desactivado (GitHub App de Vercel sin autorizar). Cada commit requiere CLI manual.

Build size:
- HTML 0.65 KB
- CSS 24 KB / gzip 5 KB
- JS 397 KB / gzip 123 KB
- 4 sprites PNG ~9.8 MB (sin optimizar)

Tiempo de build: ~2s en local, ~9s en Vercel (incluye install + build + deploy).

---

## 11. Estado actual

Fase 3 cerrada (modos + retención + tono variable + micro-animaciones), más localización chilena, más Ade con personalidad jugable, más feedback inmediato en captura. La aplicación pasa auditoría: cero errores de consola, cero 404s, persistencia funcionando, todas las pantallas responsive con safe-area, cuatro pantallas con flujo de back/exit explícito.

107 tareas completadas en el tracker. Próximas direcciones posibles: tutorial inicial para usuarios nuevos, sonido sutil al capturar, modo accesibilidad (`prefers-reduced-motion`), compartir mejorado con imagen del fin de partida.

---

## 12. Propuestas de mejora

Cada propuesta lleva una etiqueta de impacto (alto / medio / bajo) y esfuerzo (chico / mediano / grande). Ordenadas por valor por hora estimado.

### 12.1 Diseño visual

**Refactor del Creative Radar a 8 ejes canónicos** *(alto / mediano)*. Hoy el radar de Bitácora usa categorías legacy (vuelo/salto/mirada/eco/pulso) que no matchean los 8 TipoChispa del perfil. Hay un mapping forzado en `lib/storage.ts` (vibe → eje) que es indirección innecesaria. Reemplazar el pentagrama por un octágono con los 8 modos como ejes, alimentado directo del perfil. El usuario vería su perfil real, no una abstracción. Borra `RadarStats` y `recordCapture` de storage.ts.

**Optimización de sprites** *(alto / chico)*. Los cuatro PNG pesan ~9.8MB sumados. Convertir a WebP da reducción típica de 60-70%. `<picture>` con fallback PNG mantiene compat. Bonus: tipografía `loading="eager"` en idle, lazy en hunt/eureka/offended (solo se cargan cuando cambian de estado).

**Halo dorado más vivo en Home** *(medio / chico)*. Hoy hay halo estático + halo con pulse. Agregar un tercer halo con rotación lenta (15s) o un gradient conic que rota daría densidad sin distraer. Mismo principio biblia: vivo, no molesto.

**Background parallax sutil en Game** *(medio / chico)*. El gradient nocturno y la luna hoy son estáticos. Mover la luna 8-12px en respuesta al cursor (desktop) o tilt del dispositivo (mobile, `DeviceOrientationEvent`) le da profundidad sin tocar gameplay.

**Color trail en sparks** *(medio / mediano)*. Cuando el spark spawn, ya no es "instantáneo": un trail de partículas del color del modo que viaja desde fuera del canvas hasta la posición final, fade-in del orbe. El jugador ve VENIR la chispa, no la encuentra ahí. Tono biblia: las ideas se acercan, no aparecen.

**Ade con sombra reactiva** *(bajo / chico)*. La sombra de piso del cat hoy es estática. Cuando Ade está hunt, encogerla; cuando eureka, agrandarla momentáneamente. Detalle small pero refuerza que el cat es físico.

### 12.2 Interfaz

**Tab "Útiles" en Bitácora** *(alto / chico)*. El sistema MODO_TO_TYPE genera 3 categorías de idea (locas / mejores / útiles) pero la UI solo muestra tabs para Recientes / Mejores / Locas. Las útiles existen en localStorage pero son invisibles. Agregar el tab "Útiles" cierra esa inconsistencia silenciosa.

**Carousel horizontal del modo selector** *(medio / chico)*. En mobile 360px, las 5 pills entran apretadas y partidas en 2 filas. Convertir a row con `overflow-x-auto snap-x` da scrolleo horizontal con snap a cada modo. Bonus: el modo activo siempre vuelve al centro al ser seleccionado.

**Pantalla de Ajustes real** *(alto / mediano)*. El botón "Ajustes" en Home muestra hoy un toast "Pronto" — deuda visible. Una pantalla mínima debería tener: toggle motion (`prefers-reduced-motion`), toggle sonido (cuando exista), reset de perfil con confirm, idioma (es-CL fijo por ahora pero declararlo), versión de la app, link al repo.

**Pause real durante el juego** *(alto / chico)*. El icono Pause en HUD es placeholder. Implementación: state `isPaused`, freeze del timer + stop de spawn interval + overlay semi-translúcido con "Pausa · Toca para continuar". Permite atender una notificación sin perder la racha. UX standard pero ausente.

**Typing effect en speech bubble de Ade** *(bajo / chico)*. La frase de Ade aparece de golpe. Animar carácter por carácter con 25ms de delay le daría el ritmo de "Ade está pensando" en vez de "Ade ya pensó". Solo en frases de inicio/fin que tienen más impacto, no en captura (que vuelan).

**Sound design** *(alto / mediano)*. Hoy el juego es mudo. Tres sonidos cubrirían lo crítico: tick suave de spawn (oneshot 80ms), pop+chime al capturar (variando pitch por TipoChispa), bell sostenido al cruzar combo 3 (FLOW). Web Audio API directo, sin librerías. Toggle en Ajustes para silenciar.

**Haptic feedback en mobile** *(medio / chico)*. `navigator.vibrate(15)` en cada captura. Otro patrón cortito (30ms x2) cuando entra a FLOW. Dispositivos sin vibrate ignoran silenciosamente.

**Mostrar visualmente que la auto-fusión es válida** *(bajo / chico)*. En FusionRonda el jugador puede tocar la misma chispa dos veces para obtener un "Doble X" — pero la UI no insinúa que esto es una opción. Una micro-pista al hacer tap sostenido sobre una chispa: "Toca otra vez para fusionar consigo misma".

**Confirmación al guardar idea** *(bajo / chico)*. Hoy el "Guardar idea" cierra el modal silenciosamente. Un mini toast tipo "Guardada en Bitácora ↗" con tap-to-jump al Journal cierra el loop visualmente.

### 12.3 Navegabilidad

**Tab bar global** *(alto / mediano)*. Hoy solo Bitácora tiene tab bar inferior con cuatro destinos. Las demás pantallas usan ChevronLeft + back. Inconsistencia mental: el usuario aprende dos modelos. Promover el tab bar a la app entera (excepto durante Game y FusionRonda donde el foco es jugar) cuesta una refactorización modesta y unifica.

**Acceso directo Home desde toda pantalla** *(medio / chico)*. Hoy para volver a Home desde Mapa hay que ir Mapa → Bitácora → Home. Agregar un Home icon en el header de Mapa/Perfil/Journal — o un botón "Inicio" en el tab bar — corta esa cadena. Implementado en GameOver con la X y el link, falta replicar.

**Cross-link Mapa ↔ Perfil** *(medio / chico)*. Hoy ambas pantallas viven separadas. Desde Perfil no se puede ir a Mapa, hay que retroceder a Bitácora. Agregar links cruzados en el footer de cada una ("Ver mapa de ideas →" en Perfil; "Ver mi perfil creativo →" en Mapa).

**Deep linking con URL hashes** *(medio / mediano)*. Hoy la URL es siempre `/`. Estado de pantalla podría reflejarse en `#/perfil`, `#/bitacora`, `#/mapa`. Permite compartir links directos y restaurar la sesión post-refresh en la misma pantalla. React Router no necesario; un `useEffect` en App.tsx que escuche `hashchange` alcanza.

**Reducir CTAs en GameOver** *(medio / chico)*. Hoy hay cuatro acciones: Guardar idea (primario), Otra ronda + Compartir (secundarios), Volver al inicio (link). Sospecha: demasiada decisión en un momento donde el jugador quiere cerrar. Promover Guardar idea aún más (o convertir en gesture: swipe up to save) y mover Otra ronda + Compartir al fondo más sutiles.

**Onboarding mínimo para nuevos usuarios** *(alto / mediano)*. Si `sesiones === 0`, en vez de Home directo, mostrar tres screens en swipe: "Captura chispas tocando" (con un spark animado y un dedo simulado), "Junta dos para destilar idea", "Ade te lee". Skip persistente. Una sola vez. Cierra el gap de "¿qué se hace acá?".

**Modo "veterano" para flujos rápidos** *(bajo / chico)*. Si el jugador ya tiene racha ≥ 7, ofrecer atajos: doble-tap en CTA arranca con el último modo, X en GameOver salta a Otra ronda directo. Reconoce que el usuario veterano ya conoce la pantalla.

**Breadcrumb de navegación en Mapa** *(bajo / chico)*. Cuando entras a Mapa desde Bitácora, no hay clue de cómo volver. Una mini etiqueta "← Bitácora" en el header acompañando el ChevronLeft cierra esa duda.

### 12.4 Bonus — accesibilidad y performance

**Soporte `prefers-reduced-motion`** *(alto / chico)*. Detectar `window.matchMedia('(prefers-reduced-motion: reduce)').matches` y desactivar floats, yawn, blink, burst de captura, parallax. Mantener feedback funcional (HUD pulse) pero quitar lo decorativo. Cubre usuarios con sensibilidad vestibular. Single source en `useReducedMotion` hook.

**Auditoría de contrast ratios** *(medio / chico)*. Algunos textos tipo `text-white/30` (adjetivo del humor en HUD) podrían no pasar WCAG AA 4.5:1. Tool: axe DevTools o Lighthouse. Subir a /55 donde haga falta.

**Touch targets ≥ 44×44** *(medio / chico)*. Algunos pills del modo selector y los iconos de export de Bitácora son < 44px. Padding implícito a través de hit-area expandida (`::before` invisible) sin tocar el visual.

**Code splitting por pantalla** *(bajo / mediano)*. Hoy todo el bundle se carga al inicio. `React.lazy()` en App.tsx para Game/Journal/Mapa/Perfil/GameOver/FusionRonda. Home queda en el bundle inicial; el resto se carga al navegar. Reduce tiempo de first paint.

**PWA mínimo** *(medio / mediano)*. Manifest + service worker básico permite "Add to Home Screen" en iOS/Android, ícono con la cara de Ade, splash screen, y juego offline. Vite plugin `vite-plugin-pwa` lo automatiza.

**Telemetría anónima opcional** *(bajo / mediano)*. Plausible/Umami tipo evento al final de cada sesión: cuál modo, cuánto duró, cuántas ideas. Anónimo, opt-in. Daría visibilidad de qué modos se usan, qué umbrales de unlock se cruzan, qué frases de Ade resuenan.

### 12.5 Top 5 priorizados

Si tuviera que elegir cinco para hacer ahora, ordenados por impacto/esfuerzo:

1. **Tab "Útiles" en Bitácora** — corrige inconsistencia, una hora de trabajo
2. **Pantalla de Ajustes real** — elimina deuda visible, da control al usuario
3. **Pause real en Game** — UX standard ausente, una hora
4. **Refactor Creative Radar a 8 ejes** — alinea con canon, mejora honestidad del espejo
5. **Onboarding mínimo para nuevos usuarios** — cierra el "¿qué hago?" inicial

---

*Documento generado mayo 2026, post auditoría visual completa.*
