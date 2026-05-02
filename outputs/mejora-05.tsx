// Mejora 05 — handlers placeholder con toast efímero
// Destino: src/components/Home.tsx (botón AJUSTES) y
//          src/components/Journal.tsx (botones Mapa y Perfil de la nav inferior).
// Acción: aplicar BLOQUE A en Home.tsx y BLOQUE B en Journal.tsx.
//
// Qué hace:
//   Hoy, el botón AJUSTES de Home y los íconos Mapa/Perfil de la nav
//   inferior de Journal no tienen onClick. El usuario los toca y no
//   pasa nada — frustración silenciosa.
//
//   Esta mejora les pone un onClick que dispara console.info('[ADE] ...')
//   y muestra un toast de 2s con el mensaje "X aún no disponible". No
//   agrega dependencias externas; el toast se construye con state local
//   y un div absoluto-posicionado.
//
// No toca tipografías, colores ni layout existente. El toast usa los
// mismos tokens de marca (ade-dark, blanco, rounded-xl) y se desmonta solo.

// =================================================================
// BLOQUE A — src/components/Home.tsx
// -----------------------------------------------------------------
// PASO A.1 — Asegurate que useState esté en el import de React.
//   Si la línea actual es:        import React from 'react';
//   cambiala a:                   import React, { useState } from 'react';
//
// PASO A.2 — Dentro del componente Home, ANTES del `return`, agregá:
// =================================================================

const [toast, setToast] = useState<string | null>(null);

const showToast = (msg: string) => {
  setToast(msg);
  console.info('[ADE]', msg);
  setTimeout(() => setToast(null), 2000);
};

// =================================================================
// PASO A.3 — REEMPLAZÁ el botón AJUSTES (el motion.button sin onClick
// que está al lado de BITÁCORA dentro del flex w-full gap-3) por:
// =================================================================

<motion.button
  onClick={() => showToast('Ajustes… Ade lo está pensando.')}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="flex-1 py-3 bg-white/50 backdrop-blur-md text-ade-dark font-black tracking-widest text-xs uppercase rounded-2xl border-2 border-ade-dark/10 flex items-center justify-center gap-2"
>
  AJUSTES
</motion.button>

// =================================================================
// PASO A.4 — Justo ANTES del cierre del div raíz del componente
// (el </div> final de Home), agregá el toast:
// =================================================================

{toast && (
  <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-ade-dark/90 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase z-[200] shadow-lg backdrop-blur-md">
    {toast}
  </div>
)}


// =================================================================
// BLOQUE B — src/components/Journal.tsx
// -----------------------------------------------------------------
// PASO B.1 — Dentro del componente Journal, junto a los useState
// existentes (filter, ideas, radarStats), agregá:
// =================================================================

const [toast, setToast] = useState<string | null>(null);

const showToast = (msg: string) => {
  setToast(msg);
  console.info('[ADE]', msg);
  setTimeout(() => setToast(null), 2000);
};

// =================================================================
// PASO B.2 — Dentro del <nav> inferior, REEMPLAZÁ los dos <button>
// de Mapa y Perfil por estas versiones (el de "Juego" ya tiene onBack
// y el de "Bitácora" representa la pestaña activa, NO los toques):
// =================================================================

<button
  onClick={() => showToast('Mapa en construcción. Pronto.')}
  className="flex flex-col items-center gap-1 opacity-40 hover:opacity-60 transition-opacity"
>
  <MapIcon className="w-6 h-6" />
  <span className="text-[10px] font-bold">Mapa</span>
</button>
<button
  onClick={() => showToast('Perfil: próximamente, con estilo.')}
  className="flex flex-col items-center gap-1 opacity-40 hover:opacity-60 transition-opacity"
>
  <User className="w-6 h-6" />
  <span className="text-[10px] font-bold">Perfil</span>
</button>

// =================================================================
// PASO B.3 — Justo ANTES del cierre del div raíz del componente
// (el </div> final de Journal), agregá el toast. La altura es
// distinta a la de Home (bottom-24) para no chocar con el nav inferior:
// =================================================================

{toast && (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ade-dark/90 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase z-[200] shadow-lg backdrop-blur-md">
    {toast}
  </div>
)}
