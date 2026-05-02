# Carpeta `codigo/`

Esta carpeta es un placeholder de organización. **El código real del proyecto Vite vive en la raíz** de `E:\Gatos`, no aquí.

## Por qué

Mover el proyecto Vite a una subcarpeta requiere ajustar:
- `package.json` (paths de scripts)
- `vite.config.ts` (root)
- `tsconfig.json` y `tsconfig.app.json` (includes)
- Reubicar `node_modules/` (50+ MB)
- Reiniciar el dev server

Hacerlo solo por estética de carpeta no compensa el riesgo. Cowork lee la carpeta seleccionada completa, así que la organización lógica se logra con `contexto/`, `mejoras/`, `outputs/` sin necesidad de mover el código.

## Dónde está cada cosa

```
E:\Gatos\
├── src/
│   ├── App.tsx                  ← entry de pantallas
│   ├── main.tsx                 ← bootstrap React
│   ├── index.css                ← Tailwind + estilos custom
│   ├── components/
│   │   ├── Home.tsx
│   │   ├── Game.tsx
│   │   └── Journal.tsx
│   ├── lib/
│   │   └── storage.ts           ← persistencia localStorage
│   └── assets/
│       └── ade/characters/
│           ├── ade-idle.png
│           ├── ade-hunt.png
│           ├── ade-eureka.png
│           └── ade-offended.png
├── public/                      ← favicon, icons.svg
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── index.html                   ← entry point HTML
```

## Cómo correr

```bash
cd E:\Gatos
npm run dev
# abre http://localhost:5173
```
