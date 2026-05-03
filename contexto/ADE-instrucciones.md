# Proyecto ADE

Estás trabajando en ADE, un juego creativo centrado en un gato llamado Ade que captura chispas flotantes para generar ideas.

## Lectura obligatoria antes de tocar lógica

**Antes de cualquier cambio que afecte el comportamiento de Ade, las frases que dice, los puntajes, los combos, el shape de las chispas, la Bitácora o el sistema de stats — leer `contexto/ADE-alma.md`.**

Ese documento define la naturaleza real del producto: ADE no es un juego casual con mascota; es un compañero creativo con inteligencia viva, disfrazado de juego. Cualquier feature de lógica debe respetar esa intención.

## Lectura obligatoria antes de tocar visuales o copy de Ade

**Antes de cualquier cambio que afecte la imagen, expresiones, animaciones, frases, tono o representación de Ade en cualquier pantalla — leer `contexto/ADE-biblia-visual.md`.**

Ese documento es la identidad canónica del personaje: rasgos, anatomía, paleta, expresiones permitidas, prohibiciones visuales absolutas, frases oficiales, y cómo debe usarse en cada pantalla de la app. NO redibujar a Ade desde cero, NO reinterpretar — usar el asset maestro y solo variar poses/expresiones dentro de los límites de la biblia. Las frases oficiales son cortas y memorables; cualquier nueva debe respetar ese tono.

## Reglas

- **NUNCA modificar el diseño visual existente.** No tocar tipografías, colores, espaciados, ilustraciones, ni el orden visual de los elementos en pantalla.
- **Solo agregar lógica, texto y comportamiento.** Bugs, defensas, handlers de botones, persistencia, micro-interacciones, copy.
- **Cada mejora va en un archivo separado en `/outputs/`.** Nombre: `mejora-01.<ext>`, `mejora-02.<ext>`, etc. La extensión depende del archivo destino (`.tsx`, `.ts`, `.css`, `.html`).
- **Los archivos deben estar listos para implementar directamente.** Sin "TODO", sin pseudocódigo, sin placeholders. Quien reciba el archivo debe poder hacer copy-paste y commit sin pensar.
- **Cada archivo lleva un comentario inicial en español** explicando: qué hace, en qué archivo del proyecto va, y si reemplaza algo o se agrega.
- **Persistencia con `localStorage`.** No se introducen otros mecanismos (cookies, IndexedDB, backend) sin pedir permiso explícito.
- **Comentar el código en español.** Comentarios concisos, no narrativos.

## Stack del proyecto

- React 19 + TypeScript + Vite 8
- Tailwind 3.4 con tokens custom: `ade-beige`, `ade-dark`, `ade-gold`, `ade-accent`
- framer-motion para animaciones, lucide-react para íconos
- Estado de juego en componentes; persistencia en `lib/storage.ts`

## Estructura de la carpeta

```
E:\Gatos\
├── contexto/         ← este folder; se carga como contexto de sesión Cowork
├── mejoras/          ← prompts y especificaciones de mejoras pendientes
├── outputs/          ← Claude entrega aquí los archivos listos
├── codigo/           ← README apuntando al proyecto (vive en la raíz por compatibilidad Vite)
└── (raíz: src/, public/, package.json, vite.config.ts, etc.)
```

## Qué NO hacer

- No correr `npm install` de paquetes nuevos sin justificación.
- No crear nuevos componentes si la mejora se puede inyectar en uno existente.
- No tocar `node_modules`, `dist/`, ni archivos de build.
- No reescribir `lib/storage.ts` entero por cambios menores; usar parches puntuales.
