# Auditoría profunda — ADE
## Mirada de Senior Game Systems Designer

**Versión auditada:** producción al 4 de mayo de 2026 · https://juego-gatos.vercel.app
**Auditor:** Game Systems Design (sesión crítica, sin filtros)
**Metodología:** sesión completa como usuario nuevo (localStorage limpio), tres sesiones de juego, inspección de DOM, lectura de código fuente, revisión de consola y red, análisis de copy y de loop.

---

## 0. Resumen ejecutivo

ADE tiene una **propuesta filosófica fuerte y diferenciada** ("un gato que te lee, no te premia") y una **ejecución técnica desproporcionadamente sofisticada para el tamaño del producto** — siete sistemas separados, persistencia robusta, animaciones detalladas, micro-interacciones cuidadas. Lo construido es ambicioso y, en partes, elegante.

Lo que hoy **no funciona** es el contrato implícito que el juego firma con un usuario que llega por primera vez. **El producto asume que sabés qué hacer.** No lo asume porque sea elitista; lo asume porque nunca se construyó una capa de onboarding y porque, en la pantalla principal del juego, la única señal de progreso (el anillo dorado) es físicamente invisible. El game loop está completo y la lectura final es brillante en intención, pero los primeros 90 segundos de un usuario nuevo son un desierto de incertidumbre.

Hay además **once bugs concretos** detectables hoy, varios de ellos de copy ("1 chispas") y otros de proporción visual (sprites de 144 px que se perciben como "cabeza recortada"). No son críticos uno por uno; juntos comunican falta de pulido.

**Mi recomendación, sin endulzar:** antes de compartir el link masivamente, dos semanas de trabajo concentrado en (a) onboarding de 3 pantallas, (b) hacer visible el anillo de fusión, (c) fix de los bugs de copy y proporción, (d) límite de chispas en pantalla simultáneas. Sin estos cuatro arreglos, la tasa de retorno de un usuario nuevo va a ser baja y la propuesta filosófica nunca se va a leer porque el usuario abandona antes de llegar a una lectura final.

Puntaje global, ponderado: **6.2/10.** Es un producto con alma. Le falta artesanía en los bordes.

---

## 1. Metodología

Sesión completa el 4 de mayo, viewport 1366×633 con column max-w-430 simulando un teléfono. Limpieza total de localStorage antes de empezar. Tres partidas completas. Inspección del DOM en cada estado, captura de coordenadas, lectura de cinco archivos fuente claves (`Game.tsx`, `Home.tsx`, `Journal.tsx`, `IndicadorAcumulacion.tsx`, `lectura.ts`). Revisión de network (todos 200/304, 0 errores) y consola (sin warnings ni errores en runtime). Compararación contra cuatro productos del mismo cuadrante: *Two Dots*, *Alto's Odyssey*, *Loóna*, *Wordscapes*.

---

## 2. Premisa y posicionamiento

> "Un gato que juega contigo 30 segundos para ayudarte a pensar mejor."

La premisa es **excelente y rara en el mercado**. La narrativa de "Ade observa, no felicita" se diferencia honestamente de Lumosity (validación), Duolingo (gamificación dopaminérgica), Headspace (acompañamiento sin agencia). ADE intenta una tercera categoría: el *companion-mirror*, una entidad que devuelve lectura, no recompensa.

**Riesgo posicional severo.** La filosofía es invisible para un usuario que no leyó la biblia. Lo que un usuario ve cuando entra es un *casual capture game* genérico (orbes, palabras, timer). La diferencia conceptual no se comunica visualmente hasta el GameOver — y si el usuario abandona antes, nunca la conoce.

**Hipótesis crítica:** el producto está vendiendo profundidad sin entregar el primer momento de profundidad. La promesa "te lee" solo se cumple después de jugar una partida completa, capturar al menos cinco chispas, y leer las tres observaciones. Para un usuario nuevo, ese journey tiene tres puntos de fricción serios (ver §3).

**Recomendación de posicionamiento.** Decidir cuál es la jugada:

A. **Aceptar el riesgo** — el juego es deliberadamente exigente, no se explica, el usuario lo "descubre" y los que se quedan son la audiencia objetivo. Modelo *Hollow Knight*. Funciona si la calidad de la experiencia justifica el filtro.

B. **Cubrir la promesa con un onboarding** — primeros 60 segundos explicitan el contrato. *"En 30 segundos voy a leer cómo pensás."* Modelo *Wordscapes*. Más amigable a masas.

El producto hoy está en una zona ambigua: no es elitista a propósito y tampoco es accesible. Hay que elegir.

---

## 3. First-time UX — la falla más severa

### 3.1 Home, primer segundo

Limpio localStorage, abro https://juego-gatos.vercel.app/. El primer screenshot, tomado 3 segundos después de la navegación, muestra **el cat ausente**. PROJECT ADE, título ADE, pill "EL GATO QUE CAZA IDEAS" y el tagline visible. Donde debería estar el gato, hay cream vacío.

Razón técnica: la entrada del cat usa framer-motion con `initial={{ opacity: 0, scale: 0.85 }}` + spring damping 14 stiffness 110 + delay 0.15s. Durante los primeros ~700 ms el cat es invisible o quasi-invisible. Después aparece.

**Por qué importa.** El usuario nuevo que abre el link de WhatsApp y mira la pantalla 1-2 segundos NO ve al gato. Ve un texto y un pill. La identidad del producto (un gato) está temporalmente ausente justo cuando se forma la primera impresión. La animación de entrada es bonita en sí misma pero su delay traiciona el contrato.

**Severidad:** alta para retención inicial. **Fix:** quitar `initial.opacity: 0` del wrapper del cat o reducir el delay a 0.

### 3.2 Hay cinco modos sin explicación

Bajo el cat aparecen cinco pills: CREATIVIDAD (activo), NEGOCIO, ANSIEDAD, DECISIONES, RANDOM. Cada uno tiene un tagline italic abajo. Un usuario nuevo no sabe:

- Qué hace cada modo
- Que el modo cambia las palabras que van a aparecer en el juego
- Que el modo cambia la voz de Ade
- Si elegir uno lo "compromete" o si puede cambiar después

**No hay hover, no hay tooltip, no hay microcopy.** El selector es elegante visualmente y funcionalmente inerte para quien no leyó la documentación interna.

**Severidad:** media. Es probable que el usuario nuevo simplemente no toque los modos y use el default. Pero esto significa que toda la riqueza del sistema de modos (cuatro vocabularios distintos, 32 frases de Ade modo-específicas) **no se descubre nunca** para la mayoría.

### 3.3 No hay tutorial al entrar al juego

Tap "Cazar ahora". Aparece la pantalla de juego. **Timer arranca silencioso.** En 4 segundos veo dos chispas: RITUAL azul, CAOS morado. No hay hint que diga "toca las chispas". El cat está parado en pose scan, chico, abajo. No hay indicador de progreso visible. No hay countdown 3-2-1.

Un usuario casual que nunca jugó algo similar (Bejeweled, Two Dots, Wordscapes) está perdiendo segundos preciosos del timer mientras descifra qué hacer. La primera sesión de un usuario nuevo, en mi prueba, llegó a **1 captura en 30 segundos** — y eso porque yo sabía qué hacer y estuve trabajando con consola abierta.

**Severidad:** crítica. La partida 1 de cualquier usuario nuevo va a ser pobre, lo cual condiciona la lectura final, lo cual probablemente lo desincentiva de volver.

### 3.4 El anillo de acumulación es invisible

Mi observación más severa. El componente `IndicadorAcumulacion.tsx` dibuja un anillo SVG de 5 arcos alrededor del cat. Su rol diseñado: comunicar el progreso hacia la fusión sin números. *"Filosofía: cero números en pantalla. El progreso se siente, no se cuenta."*

En la práctica, durante el gameplay:

- El anillo base tiene `stroke="rgba(255, 214, 0, 0.06)"` — **6% de opacidad sobre un fondo gradient nocturno azul-púrpura-marrón**. Ratio de contraste estimado: < 1.5:1. **No se ve.**
- Los arcos encendidos sí se ven (opacity 0.85 + drop-shadow dorado) pero solo después de 1 captura. En la pantalla inicial, antes de capturar, el cat está rodeado de "nada".

**El indicador no cumple su rol.** El usuario nuevo no descubre que existe un anillo, no descubre que cada captura lo va llenando, no descubre que llenarlo abre algo. La fusión sucede "por sorpresa" tras 5 capturas, lo cual contradice el principio de feedback inmediato declarado en el informe técnico §12.

**Severidad:** crítica. Es el corazón del feedback diegético del juego y está roto.

**Fix:** subir el anillo base a `rgba(255, 214, 0, 0.18)` mínimo, y/o agregar un tick mark cada 72° para que se lea como "5 espacios". Considerar también un pulse sutil del anillo cuando llega a 4/5 (anticipación del trigger).

### 3.5 Caos visual mid-game

Tras 4-5 segundos de juego, la pantalla acumuló **13 orbes simultáneos** con palabras superpuestas. El spawn rate (1200ms × spawnFactor del humor) sigue spawnando aunque el canvas esté lleno. No hay límite máximo. El resultado: orbes que se tapan entre ellos, labels que se leen mal por superposición, sensación de descontrol.

Para un juego cuya filosofía es contemplativa y de observación, este caos visual es **contradictorio**. Two Dots mantiene 6×6 grid limpio. Alto's Odyssey nunca tiene más de 4 elementos jugables en pantalla. ADE permite acumulación sin techo.

**Fix:** límite de 5-6 sparks visibles. Si hay 5+, no spawnar hasta que se capture o desaparezca uno.

### 3.6 Speech bubble flotando lejos

La frase de Ade ("Lo dudaste. Interesante.") aparece en un bubble blanco que se posiciona a la derecha del cat, **lejos** de la cabeza, sobre los orbes. Visualmente parece que sale de la nada, no del personaje. La asociación visual *cat → frase* se rompe.

**Fix:** anclar la cola del bubble a la cabeza del cat con SVG path. O posicionarlo arriba-derecha del cat con una flecha clara apuntándolo.

---

## 4. Core game loop

### 4.1 La estructura es sólida

El loop está bien diseñado conceptualmente:

```
Captura → Combo → FLOW (combo 3) → Acumulación (path /5) → Fusión → Idea → GameOver → Lectura → Volver
```

Es un loop con tres niveles de feedback (immediate, mid-term, long-term) y un objetivo emergente (descubrir tu tipo creativo). Profesional.

### 4.2 Pero el ratio de profundidad está mal calibrado

Treinta segundos. Spawn cada 1.2s. Eso da máximo ~25 spawns por sesión. Para alcanzar la fusión hace falta capturar 5. **Es muy poco budget.** Un usuario que va a velocidad media — un click cada 2 segundos — captura 15 sparks en 30s, pasa por 3 fusiones, guarda 0-2 ideas.

Un usuario nuevo, lento, va a capturar 3-5, **una fusión apenas**, posiblemente cero. La sesión 1 no es representativa de cómo se siente el juego.

**Fix posible:** primer juego dura 45 segundos. O el ratio de spawn es más amistoso en `sesiones === 0`. O el path es 3 en vez de 5 para la primera fusión.

### 4.3 La modulación de fusión es invisible al usuario

El sistema de `getFusion(a, b, ctx)` modula el insight según velocidad/modo/racha. Es elegante. Pero la modulación **no se anuncia**. Si Ade dice "Demasiado rápido para entenderlo. El caos también resuena.", el usuario lee la frase entera sin saber que el prefijo viene de su velocidad de juego. Pierde el momento "ah, me está leyendo a mí específicamente".

**Fix:** después del insight, mostrar un microcopy gris "↳ Velocidad alta" o "↳ Modo Ansiedad" que evidencie el porqué de la modulación. Sin esto, la sofisticación del sistema es invisible.

### 4.4 La "lectura final" funciona — cuando llega

Las tres observaciones (Velocidad / Patrón / Acción) son el momento más fuerte del producto. La estructura categórica es legible, las frases son data-driven, el tono biblia se sostiene. **Esto es lo que hay que proteger.**

Problema: si la sesión fue pobre (1 captura, 0 ideas), las frases son secas — "1 chispas. Cero guardadas. Pena." — y dejan al usuario nuevo con sabor a regaño. La intención editorial es honesta pero la temperatura puede ser hostil para el primer encuentro.

**Fix sutil:** que la primera sesión (`sesiones === 1`) tenga frases de bienvenida ligeramente más cálidas. No felicitación; reconocimiento. *"Primera vuelta. Vamos viendo."*

---

## 5. Game feel & juicy-ness

### 5.1 El feedback de captura está bien construido

Burst de partículas, anillo expansivo, número flotante "+N", HUD pulse, Ade triggerea hunt. Es probablemente la parte más "juicy" del producto y se siente bien.

### 5.2 Falta peso físico

No hay shake del HUD ni del canvas. No hay sonido. No hay haptic. El feedback es 100% visual y, en mobile, mucho más sutil de lo necesario para sentirse satisfactorio.

**Comparación.** Tetris moderno usa screen shake en line clear. Two Dots usa screen shake + audio chime + haptic en combo. ADE tiene cero de las tres dimensiones físicas. La captura se ve pero no se *siente*.

**Fix mediano:** Web Audio API con tres sounds (capture pop, flow chime, fusion bell). `navigator.vibrate(15)` en captura. Mantener la opción de mutear en una pantalla de Ajustes que hoy es un toast "Pronto".

### 5.3 La animación de FLOW es desproporcionada

Cuando el combo cruza 3, aparece un overlay full-screen "FLOW" gigante en dorado. La intención es celebración, pero el componente visualmente compite con el HUD, los sparks, el cat. Por 1.8s la pantalla está dominada por una palabra. **Es ruidoso para un juego contemplativo.**

**Fix:** hacer el FLOW más sutil. Una pulse del color del fondo + el adjetivo "FLOW" más chico en el HUD. Menos overlay, más signal de estado.

---

## 6. Sistema de progresión y retención

### 6.1 Streaks: bien diseñado, mal comunicado

Cuatro unlocks D3/D7/D14/D30 acumulativos. La arquitectura es correcta — tracking separado de logrados vs celebrados, no se pierden con rachas rotas. El overlay festivo aparece una sola vez por umbral.

Problema: **un usuario nuevo nunca sabe que existen los unlocks** hasta que cruce el D3, que es 3 días consecutivos. Eso es una promesa diferida de retención que solo se conoce cuando ya ocurrió. **Es retención retroactiva.**

**Fix:** en Home, después de la primera sesión, mostrar un chip "Día 1 · 2 días hasta el próximo desbloqueo" con preview del unlock. Hace explícito el contrato sin spoilear el contenido. Genera expectativa.

### 6.2 Frases secretas D14: las probabilidades juegan en contra

`isUnlocked('frase_secreta') && Math.random() < 0.33` — un 33% de probabilidad por mount de Home. Con 1 visita al día, el usuario tarda ~3 visitas en encontrar la primera frase secreta. Si visita una vez al día y el unlock cubre 4 frases, le toma estadísticamente 12 días en ver las 4. **Muchísimo.**

**Fix:** subir a 0.5 mínimo, o garantizar al menos una en las primeras 2 visitas post-unlock vía un flag separado.

### 6.3 Ánimo de Ade: sistema profundo, percepción nula

El sistema `animo.ts` modula spawn rate, parpadeo, y muestra un adjetivo bajo "Modo · X". Es elegante. Pero el adjetivo está renderizado en `rgba(255,255,255,0.32)` con `text-[8px]`. Es **literalmente ilegible** salvo si miras fijo. 

Plus: el sistema requiere ≥ 8 capturas totales y dominante ≥ 18% para salir del estado neutro. Esto significa que en las primeras 2-3 sesiones el ánimo SIEMPRE es neutro y el feature está inactivo.

**Fix:** subir contraste del adjetivo a 0.55 mínimo. Hacer que el ánimo se desbloquee con un primer aviso ("Ade tomó un tono") cuando se pasa de neutro a otro humor por primera vez.

---

## 7. Voz, copy y tono

### 7.1 El tono es coherente y diferenciado

La biblia visual (sec. 10) está bien aplicada. "Tres CAOS. Insistes.", "Sin reglas. Sin freno.", "Doble Caos. Insistes en romper." Estas frases tienen identidad. Funcionan.

### 7.2 Bugs de copy concretos

- **"1 chispas. Cero guardadas. Pena."** Plural mal. Debería ser **"1 chispa"**. Aparece en GameOver y en el banner de Bitácora.
- **"Cero guardadas. Pena."** El "Pena." termina la oración con un veredicto. Para una primera sesión es duro. Diferenciar entre primera vez y sesiones avanzadas.
- **"No tocaste. Está bien también."** Para la primera sesión, esta frase puede leerse como sarcasmo pasivo. Para sesiones con racha, queda calzada. Falta segmentación.
- **"Modo · Creatividad"** vs **"Modo · Negocio"** — la palabra "Modo" en el chip se repite. La estructura sería más limpia mostrando solo "Creatividad" en grande.

### 7.3 Diccionario voseo/chileno: completo

El sweep está bien hecho. No detecté ninguna forma rioplatense colada. ✓

### 7.4 Inconsistencia tú/usted

Algunas frases mezclan ambos registros: *"Tres CAOS. Insistes."* (tú) y luego *"Veamos qué traction junta."* (impersonal/usted). No es voseo, pero el cambio de persona puede leerse como descuido.

---

## 8. UX por pantalla

### 8.1 Home

Lo bueno: jerarquía clara, CTA dominante, secundarios discretos, micro-animaciones del cat (yawn, blink, look-around) elegantes y bien espaciadas. Crown como icono de perfil es legible para algunos usuarios pero ambiguo para otros.

Problemas:

- **Tap-to-curious no se anuncia.** El usuario no sabe que tocando el cat se transforma. Es un easter egg sin pista.
- **"Project ADE"** label es legado conceptual, no aporta sentido al usuario final. Suena a etapa interna de desarrollo.
- **Ajustes** abre un toast "Pronto" — es deuda visible.

### 8.2 Game

Problemas críticos enumerados en §3 (anillo invisible, caos visual, sin tutorial). Adicionalmente:

- **Botón Pause es placeholder.** No funciona. Click no hace nada. **Es un bug funcional.**
- **El cat scan ocupa solo ~15% de la pantalla** y queda en bottom-left. Decisión rara para un juego centrado en el personaje.

### 8.3 FusionRonda

Lo bueno: instrucción "Toca dos. Júntalas." es clara. Las chispas como orbes son legibles. El cat fuse arriba refuerza el momento.

Problemas:

- **El cat fuse aparece con dos orbes (dorado + morado).** Esos orbes pueden confundirse con las chispas que el jugador tiene que tocar abajo. Doble layer de orbes en la misma pantalla — uno decorativo del personaje, uno funcional. Confusión visual.
- **El insight aparece grande y centrado, pero el textarea opcional está debajo y se ve pequeño.** Un nuevo usuario podría no notar que puede escribir su propia idea.
- **No hay diferenciación visual entre "Guardar idea" y "Saltar".** Ambos llevan iconos diminutos. El primario debería ser obvio.

### 8.4 GameOver

Lo bueno: las 3 observaciones estructuradas con etiqueta + icono + frase son la mejor pieza de UI del producto. Funciona.

Problemas:

- **El cat interpret arriba se ve chico** (w-28 md:w-36 = 112-144 px). Pierde presencia. El momento que más quiere identidad de personaje muestra al gato apenas perceptible.
- **"Otra ronda" como primario dorado** — la decisión editorial es coherente con la filosofía, pero invitar a otra ronda inmediatamente niega el momento contemplativo de la lectura. El primary CTA arrastra al usuario fuera del momento de reflexión.
- **Confusión entre "Ver bitácora" y la lectura.** El usuario puede pensar que clickea "Ver bitácora" para guardar la idea. No queda claro que ya se guardó (en FusionRonda).

### 8.5 Bitácora

Lo bueno: tab bar inferior, lista de ideas con metadata, export MD/PDF.

Problemas:

- **El cat archive/offended se ve recortado** a tamaño 144×96. Para alguien que mira rápido parece "solo la cabeza del cat" porque la silueta entera es tan chica que la cabeza es lo único que se distingue.
- **El radar Creative Radar** sigue siendo pentágono de 5 ejes legacy (VUELO/SALTO/MIRADA/ECO/PULSO) que **no matchean los 8 modos canónicos**. El radar muestra una abstracción de hace versiones, no el perfil real. **Inconsistencia conceptual**.
- **"Banner de lectura final"** en la Bitácora repite "1 chispas. Cero ideas. Pena." — la misma frase que el usuario ya leyó en GameOver. Redundancia.

### 8.6 Mapa

Funciona bien para usuarios con datos. Para usuario nuevo (post sesión 1 con 1 captura), muestra 7 modos en "Sin explorar" y 1 con conteo. **Es un mapa de vacío.** Funciona como invitación a llenar — bien — pero podría tener un microcopy "Cada modo se llena cuando capturas chispas de ese tipo."

### 8.7 Perfil

Estado vacío: *"Juega tu primera partida para descubrir tu perfil."* Funciona. Cuando hay datos, el "Tipo creativo" es la pieza más fuerte después de la Lectura.

Problema único: **la sección de Desbloqueos muestra los 4 unlocks con candado a una primera visita**. Un usuario nuevo puede leer "FRASE SECRETA · 14 días" y pensar "esto es un trial paywall". Hay que matizar el copy para que se entienda que son acumulables y gratis.

---

## 9. Bugs concretos encontrados hoy

Lista exhaustiva, replicados en sesión del 4 de mayo:

| # | Pantalla | Bug | Severidad |
|---|---|---|---|
| 1 | Home | Cat invisible durante primeros 700ms (animación entrada) | Alta |
| 2 | Game | Pause button no funcional (no maneja click) | Media |
| 3 | Game | Anillo de acumulación base ilegible (`rgba(255,214,0,0.06)`) | Alta |
| 4 | Game | Spawn sin límite — hasta 13 sparks simultáneos | Alta |
| 5 | Game | Speech bubble flota lejos del cat | Baja |
| 6 | Game | Adjetivo del ánimo en `text-[8px]` + opacity 32% — ilegible | Media |
| 7 | GameOver | "1 chispas" (singular incorrecto) | Baja |
| 8 | GameOver | "Pena." muy duro para primera sesión | Media |
| 9 | Bitácora | Banner repite la frase de GameOver | Baja |
| 10 | Bitácora | Creative Radar usa 5 ejes legacy, no los 8 canónicos | Alta (inconsistencia conceptual) |
| 11 | Todas | Cat sprites tamaño 144px se perciben recortados | Media |

Plus dos issues no-bug pero peligrosos:

- Vibrate API no implementada. Mobile feel sin haptic.
- Web Audio API no implementada. Sin sonido.

---

## 10. Arquitectura técnica & deuda

### 10.1 Lo bien hecho

- **Separation of concerns clara.** Sistemas (`adeProfile`, `modos`, `fusiones`, `streaks`, `animo`, `lectura`) son módulos puros, sin React, exportan API. Esto es exactamente como debería ser.
- **Persistencia defensiva.** Try/catch en cada parser, fallback a defaults, schema versioning implícito vía guard-clauses. Sólido.
- **Tipado fuerte.** TypeScript estricto, types canónicos como `TipoChispa`, `ModoJuegoId`, `Observacion`. Refactor amistoso.

### 10.2 Lo que preocupa

- **Game.tsx tiene 850+ líneas.** Es un god component. handleSparkClick, handleMiss, handleFusionSave, closeFusion, triggerAdeState, mostrarFraseDeAde, buildFusionContext, getAdeImage, spawnSpark, useEffect del timer, useEffect del spawn, useEffect del adeTimeout, plus JSX de HUD, canvas, sparks, bursts, lectura. **Refactor pendiente.** Sugerencia: extraer hook `useGameLoop` y componentes `<HUD>`, `<SparkCanvas>`, `<AdeCharacter>`.

- **Mezcla de fuentes de assets.** Sprites del cat en `public/assets/ade/character/` (string paths). Pero `src/assets/ade/characters/` también existe con los 4 originales. Hay duplicación. Si alguien edita uno y no el otro, hay drift silencioso.

- **El sistema legacy `lib/storage.ts`** (RadarStats con vuelo/salto/mirada/eco/pulso) **convive con `adeProfile.ts`** (8 modos canónicos). Doble fuente de verdad. El Radar de Bitácora lee del legacy, el resto del moderno. **Tech debt importante.**

- **`recordCapture` en storage.ts** se llamaba en versiones viejas pero el Game.tsx actual ya no lo llama. Sin embargo el código está vivo. Cleanup pendiente.

### 10.3 El sistema de fusiones es brillante

`fusiones.ts` con `FUSIONES_PREMIUM` (28 pares) + `AUTO_FUSIONES` (8 auto) + modulador por contexto es la pieza más elegante del backend. Es una matriz canónica curada a mano + modulación procedural. **Esto es lo que diferencia al producto.**

---

## 11. Performance

- **Bundle 401 KB JS / gzip 124 KB.** Está OK para web pero alto para mobile 3G.
- **Sprites totales ~9.8 MB sin optimizar.** Los 4 viejos siguen siendo 2.4 MB cada uno. **Esto es excesivo.** Conversión a WebP daría 70% de reducción. Lazy load de hunt/fuse/interpret/offended (solo idle/scan en bundle inicial) daría otra reducción.
- **Build time 2s, deploy a Vercel 25s.** Excelente.
- **First Contentful Paint en mobile 3G**: estimado 3-4 segundos por el peso de assets. Lighthouse score probable: 60-70 mobile.

---

## 12. Accesibilidad

- **`prefers-reduced-motion` NO se respeta.** Las animaciones florecen en todas las superficies sin opt-out. Usuarios con sensibilidad vestibular tienen mala experiencia.
- **Contrast ratios bajos** en el adjetivo del humor, en el anillo de acumulación base, y en los placeholders de empty state. Falla WCAG AA en al menos 3 puntos.
- **Sin alt-text en sparkles ambient** (correcto, son decorativos) pero **sin alt en los botones-icono** del HUD (Pause, ChevronLeft tienen icono sin label de texto, pero aria-label sí está). ✓
- **Touch targets**: los pills del modo selector son ~70×30 px — por debajo del mínimo 44×44 de Apple HIG.
- **Keyboard navigation**: no probada en profundidad pero el `:focus-visible` no está estilizado en CSS. Probablemente uso por teclado es pobre.

---

## 13. Comparables y benchmark

| Producto | Ventaja contra ADE | Lección |
|---|---|---|
| **Two Dots** | Onboarding gestual implícito | Primer nivel es tutorial sin texto |
| **Alto's Odyssey** | Audio + haptic + motion están sincronizados | Polish multi-sensorial obligatorio |
| **Loóna** | Cada sesión termina con un momento de reflexión visual largo | ADE tiene la lectura, pero la atropella con "Otra ronda" |
| **Wordscapes** | Tutorial de 3 pasos antes de la partida 1 | Es la solución probada |
| **Headspace** | Identidad visual del personaje es enorme y constante | El cat de ADE es chico durante el juego — debería ser hero |
| **Duolingo** | El streak está hyper-comunicado desde la sesión 2 | ADE tiene streaks pero invisibles hasta D3 |

**Posicionamiento competitivo realista:** ADE puede ser *Loóna pero más simple* o *Two Dots pero más reflexivo*. Para llegar ahí necesita los pulidos enumerados arriba.

---

## 14. Riesgos críticos

1. **Riesgo de abandono en sesión 1.** Si más del 60% de usuarios nuevos no completan una sesión con al menos una fusión, el producto nunca demuestra su tesis. Hoy, según mi prueba, esa probabilidad es alta.

2. **Riesgo de no entender qué es.** Sin onboarding, el "captura chispas para que el gato te lea" no se comunica. Usuarios que cierran después de mirar 10 segundos no saben que hay un producto profundo.

3. **Riesgo de aplanamiento del tono.** "1 chispas. Cero guardadas. Pena." al primer usuario es áspero. Si la primera lectura final lo regaña, no vuelve.

4. **Riesgo técnico: bundle pesado en mobile.** 9.8 MB de sprites + 400 KB JS son demasiado para 3G y para iPhone básico.

5. **Riesgo conceptual: el radar legacy.** Si un usuario lee "VUELO / SALTO / MIRADA / ECO / PULSO" en Bitácora y después lee "CAOS / RITUAL / BRILLO" en Perfil, percibe inconsistencia. Esto erosiona la confianza en el producto.

---

## 15. Plan de acción priorizado

Asumiendo que el objetivo es estar listo para compartir el link y tener retención mínima viable, organizo en tres ondas:

### P0 — Bloqueantes para compartir

| Ítem | Esfuerzo | Razón |
|---|---|---|
| Quitar `initial.opacity: 0` del cat en Home | 5 min | El primer frame del producto muestra al protagonista |
| Onboarding de 3 pantallas en `sesiones === 0` | 1 día | Sin esto, abandono masivo |
| Anillo de acumulación visible (`rgba(255,214,0,0.18)` + ticks) | 30 min | Es el feedback central, hoy invisible |
| Fix "1 chispas" → pluralización condicional | 15 min | Es un bug embarazoso |
| Botón Pause real | 1 hora | UX standard ausente |
| Límite de 6 sparks simultáneos | 30 min | Elimina el caos visual |

### P1 — Pulido antes de marketing

| Ítem | Esfuerzo | Razón |
|---|---|---|
| Refactor del Creative Radar a 8 ejes canónicos | 2 horas | Cierra la inconsistencia legacy |
| Pantalla de Ajustes funcional | 3 horas | Elimina deuda visible y agrega reduce-motion |
| Sound design mínimo (3 sounds + mute toggle) | 4 horas | El feedback físico falta |
| Cat sprites más grandes en GameOver, Bitácora, FusionRonda | 1 hora | Identidad de personaje hoy se diluye |
| Microcopy de modo en hover/tap | 1 hora | Comunica el sistema escondido |
| Optimización de sprites a WebP | 1 hora | Reduce 70% del peso |

### P2 — Profundización

| Ítem | Esfuerzo | Razón |
|---|---|---|
| Modulación visible de fusión ("↳ Velocidad alta") | 2 horas | Hace explícita la sofisticación oculta |
| Anuncio del unlock al pasar a Día 1+ | 2 horas | Comunica retroactividad del sistema |
| Haptic feedback mobile | 30 min | Polish multi-sensorial |
| Refactor `Game.tsx` en sub-componentes | 1 día | Mantenibilidad |
| Migración total a `adeProfile`, deprecar `storage.ts` legacy | 1 día | Una sola fuente de verdad |

**Esfuerzo total estimado del P0 + P1:** 2-3 días de trabajo concentrado. **Después de eso**, el producto puede compartirse con confianza.

---

## 16. Conclusión sin filtros

ADE tiene un **alma fuerte** y una **piel que todavía no la honra**. La filosofía está escrita, los sistemas están construidos, la voz es coherente. Lo que falta es la conexión entre todo eso y un usuario que no leyó la documentación interna.

La diferencia entre un producto bueno y un producto excelente no es cuánto se construyó; es cuánto se comunica al usuario en los primeros 60 segundos. Hoy, ADE comunica poco. No por falta de calidad, sino por falta de onboarding.

Mi recomendación final: dos semanas. Una para el P0 + parte del P1. Otra para iterar con 5-10 usuarios reales, ver dónde abandonan, ajustar. Después se comparte. Antes de eso, mejor no.

Es un producto que merece llegar bien. No lo apures.

---

*Auditoría cerrada el 4 de mayo de 2026 · próxima revisión sugerida tras implementación del P0.*
