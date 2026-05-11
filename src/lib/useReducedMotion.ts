// src/lib/useReducedMotion.ts
//
// Hook que devuelve `true` cuando el usuario tiene
// `prefers-reduced-motion: reduce` activado en su sistema operativo, o
// cuando ha forzado el toggle de "reducir movimiento" desde Ajustes.
//
// Auditoría §12: sin esto, usuarios con sensibilidad vestibular tienen
// mala experiencia con todas las animaciones florecidas.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ade_reduced_motion';

function getStoredOverride(): boolean | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
    return null;
  } catch {
    return null;
  }
}

export function setReducedMotionOverride(value: boolean | null): void {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* ignorar */
  }
  // Notificamos a cualquier hook activo vía custom event.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ade-reduced-motion-change'));
  }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const override = getStoredOverride();
    if (override !== null) return override;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mq.matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const override = getStoredOverride();
      setReduced(override !== null ? override : mq.matches);
    };
    mq.addEventListener('change', update);
    window.addEventListener('ade-reduced-motion-change', update);
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('ade-reduced-motion-change', update);
    };
  }, []);

  return reduced;
}
