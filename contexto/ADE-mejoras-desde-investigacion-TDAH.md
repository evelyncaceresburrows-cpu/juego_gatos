# ADE — Mejoras derivadas del análisis "Diseñar para cerebros TDAH"

Fuente: investigación clínica + regulatoria + de producto 2020-2026 (Westwood/JAMA 2025, Elbe 2023, Ostinelli/Lancet 2025, casos Akili-Pear-Inflow-Wysa, Ley 21.719 Chile).

**Pregunta rectora:** ¿qué de esto se aplica honestamente a ADE — que es un juego de 30 segundos, no un DTx, no promete tratar TDAH?

Respuesta: bastante. ADE está accidentalmente bien posicionada en varios ejes que la investigación valida — sesiones ultra-cortas, modo ansiedad, recompensa inmediata, sin leaderboards. Pero hay 9 mejoras concretas que vale aplicar y 4 cosas que ADE ya está haciendo bien (no romper).

---

## Lo que ADE YA hace bien (no tocar)

**Sesiones cortas validadas.** Mawjee et al. (PLOS ONE 2015) demostró que sesiones de 15 min son tan eficaces como 45 min para entrenamiento cognitivo en universitarios con TDAH. ADE va más lejos: 30 segundos. La investigación valida 5-min como "micro-sesiones" — ADE está dentro de ese rango.

**Sin leaderboards públicos.** Cerca del 90% de adultos con TDAH tienen Rejection Sensitive Dysphoria (RSD). Comparación pública es contraindicada. ADE solo compara contra uno mismo (Mapa, Perfil) — correcto.

**Recompensa inmediata <500ms.** La hipótesis del déficit de dopamina + delay aversion (Sonuga-Barke) exige recompensas inmediatas y proporcionales al micro-esfuerzo. ADE: chime + vibrate + score float + particle burst al capturar. Correcto.

**Reduced motion + touch targets.** WCAG AA + animaciones desactivables. Ambos ya cableados. Correcto.

---

## Las 9 mejoras concretas (priorizadas)

### 1. Streaks acumulativos + freeze days (alta prioridad)

**Problema:** streaks consecutivos son contraindicados en TDAH. Producen perfeccionismo, "ADHD guilt spiral" tras un día perdido, y abandono de la app. Duolingo y Snapchat sobreviven porque permiten congelar.

**Estado ADE:** verificar `src/systems/streaks.ts` — la racha actual se calcula por días consecutivos. Si rompés un día, vuelve a 0.

**Acción:**
- Cambiar a tracking acumulativo ("18 de últimos 30 días") como métrica visible primaria.
- Mantener racha consecutiva interna pero NO mostrarla como métrica principal.
- Agregar 1 freeze day automático por semana (sin avisar — solo no se rompe si te saltás un día).
- Microcopy: "Vuelves" en vez de "Recuperaste tu racha".

### 2. Microcopy de retorno sin culpa (alta prioridad)

**Investigación:** "You broke your streak!" / "You missed your goal" generan abandono. Inflow se construye explícitamente alrededor de validación + understanding the why.

**Acción:** sweep en `getFraseAde('inicio')` para el caso "usuario vuelve tras N días sin entrar":

```
Si días desde última sesión >= 7:
  "Han pasado X días. ¿Empezamos con algo pequeño?"
  "Vuelves. Bien."
  "Algo cambia cada vez."

Nunca:
  "Te perdimos"
  "Volviste por fin"  
  "Rompiste tu racha"
```

Ya tenés algunas de estas — verificar coverage en `adeProfile.ts` + `modos.ts`.

### 3. Onboarding interactivo (media prioridad)

**Investigación:** demo de mecánica core ejecutada > tutorial pasivo. Inflow famoso por su onboarding de 47 pasos (drop-off masivo). Regla: máximo 5 pasos al primer "aha".

**Estado ADE:** 3 pasos con orbe animado simulando un tap. Es pasivo.

**Acción:** convertir el paso 1 ("Toca las chispas") en interactivo real — el usuario tiene que tocar el orbe para avanzar, no solo "Siguiente". Eso es el primer "aha" ejecutado, no descrito.

### 4. Disclosure de privacidad en Ajustes (alta prioridad — legal)

**Investigación:** Chile transita a Ley 21.719 el 1 de diciembre de 2026. Datos sensibles requieren consentimiento explícito. ADE solo usa localStorage (sin PII enviado a servidor), pero el usuario no lo sabe.

**Acción:** una línea en Ajustes:

> "Todo lo que captures vive solo en este dispositivo. ADE no envía nada a ningún servidor."

Eso es un diferenciador real vs. Inflow/Headspace/Calm (todos cloud-first). Convierte una limitación técnica en un activo.

### 5. Crisis safety — link discreto a Salud Responde (alta prioridad — ético)

**Investigación:** ADE tiene modo "ansiedad". Prevalencia ansiedad en TDAH adulto ≈50%; depresión mayor 18-53%. Mujeres TDAH tienen mayor riesgo de intento suicida (Hinshaw BGALS). Una app que toca este territorio debe tener escalado.

**Acción:** en Ajustes, sección discreta "Si necesitás más":

> Salud Responde: 600 360 7777
> Línea Libre: 1515

Sin alarmar, sin pop-ups. Solo disponible si lo busca.

### 6. Modo Ansiedad — más chileno + respiración guiada (media prioridad)

**Investigación:** la "grieta del español" es operativa, no aspiracional. No existe DTx en español a precio LatAm. Modismos chilenos generan rapport real ("cachái", "fome", "lata", "po"). HRV biofeedback / respiración pausada (~6 rpm) tiene la mejor relación costo-evidencia (Laborde 2022, Tinello 2021).

**Acción a corto plazo:** revisar frases del modo ansiedad para tono más chileno sin caer en parodia ("Aquí estoy" → "Estoy aquí po", "Suelta" → "Soltá nomás").

**Acción a mediano plazo:** un mini-modo "respiro" antes de cazar — 3×5 inhalaciones guiadas con orbe que crece/decrece. 30 segundos. Sin cámara, sin PPG, sin claims. Solo prep cognitivo. La evidencia respalda mejora aguda post-respiración.

### 7. Telemetría visible — "Focus Score" estilo Akili (media prioridad)

**Investigación:** Akili patentó SSME ("Sustained Selective Modulation Engagement") y lo muestra como un score visible que predice respuesta clínica (Stamatis et al. Translational Psychiatry 2024). Hace que el usuario sienta el progreso.

**Estado ADE:** ya tenés `animo.ts` con un score interno que modula spawn. No se muestra.

**Acción:** en Perfil o GameOver, agregar una métrica derivada — "Tu mejor sesión de la semana: 18 chispas en 30s". No es claim clínico, es feedback de competencia (Self-Determination Theory).

### 8. Permitir sesiones extendidas opcionales (baja prioridad)

**Investigación:** dosis convergente en RCTs = 15-25 min/sesión × 4-5 sesiones/semana × 6-8 semanas. ADE va a 30s. Quien encuentra flow lo quiere más largo.

**Acción:** en Ajustes, opción "sesión extendida" (60s o 90s) para usuarios que lo pidan. No por default — la sesión corta es el unique value prop.

### 9. Anti-claims en marketing/About (alta prioridad — legal)

**Investigación:** Lumosity pagó USD 2M de settlement a FTC por claims cognitivos sin evidencia. Akili y Pear quebraron por estructura de negocio. Wysa sobrevive porque mantiene claims acotados.

**Acción:** en cualquier copy externo (OG meta, App Store description futuro, About), prohibir verbos: "trata", "cura", "reduce TDAH", "mejora productividad", "reemplaza medicación".

Verbos OK: "juega", "captura", "observa", "te lee", "te muestra cómo pensás".

ADE ya está bastante bien acá por la biblia tone — solo formalizar como regla.

---

## Lo que NO hay que hacer (anti-patrones explícitos del informe)

1. **Far transfer claims** — "ADE mejora tu trabajo" / "ADE te hace más productivo". La evidencia 2020-2026 muestra near transfer (mejora en la tarea entrenada) pero far transfer ≈ 0.
2. **Streaks consecutivos visualmente punitivos** — "Fuego apagado", "Perdiste tu racha". Generan abandono.
3. **Leaderboards públicos** — RSD lo hace tóxico.
4. **Recompensa variable estilo Skinner en mecánicas core** — loot boxes, monedas premium aleatorias. Esta población es más vulnerable a engagement compulsivo. ADE no tiene nada de esto y debe seguir así.
5. **EEG/wearables biométricos** — costo + Ley 21.719 los hace datos sensibles, complejidad regulatoria mayor.
6. **Diagnóstico basado en ASRS o screener** — sobrediagnóstico sistemático. ADE no hace esto.

---

## Convicción de cierre

El informe tiene una frase que resume todo: **"diseñar para el peor día, no el mejor"**. La app más útil para TDAH adulto no es la que maximiza engagement cuando todo va bien, sino la que sigue siendo amable cuando el usuario falla.

ADE está accidentalmente alineada con eso (biblia tone, sin felicitar, sin shame). Las 9 mejoras de arriba son refuerzos a esa misma dirección — no un giro, una profundización.

---

## Plan de ejecución sugerido

**Batch 1 (alta prioridad, ~2-3 horas):**
- Streaks acumulativos + freeze days (#1)
- Microcopy retorno sin culpa (#2)
- Disclosure privacidad en Ajustes (#4)
- Link crisis discreto en Ajustes (#5)
- Anti-claims sweep en index.html OG meta (#9)

**Batch 2 (media prioridad, ~3-4 horas):**
- Onboarding paso 1 interactivo (#3)
- Modo ansiedad chilenismos (#6 corto plazo)
- Focus Score visible en Perfil (#7)
- Sesión extendida opcional (#8)

**Batch 3 (futuro, requiere diseño):**
- Mini-modo respiro 30s (#6 mediano plazo)
- Body doubling con Ade (Ade se queda 5 min en pantalla mientras hacés algo)
