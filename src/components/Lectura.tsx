// src/components/Lectura.tsx
//
// Bloque de "lectura" que reemplaza las 3 frases sueltas del GameOver.
// Cada observación tiene un rol claro: velocidad, patrón o acción.
// Esa estructura (etiqueta + frase) hace que el usuario entienda QUÉ
// dimensión de su comportamiento se está leyendo.
//
// Filosofía (informe §12, decisión editorial sobre lectura final):
//   - 3 observaciones, una por dimensión, en orden fijo
//   - Cada frase referencia un dato verificable de la sesión
//   - No celebra. No felicita. Observa.
//
// Las frases se generan en `src/systems/lectura.ts` (Paso 3) a partir
// de las métricas de la sesión + el perfil acumulado. Este componente
// solo las renderiza con el formato canónico.
//
// Estructura visual de cada item:
//   ┌──────────────────────────────┐
//   │  ●  V E L O C I D A D        │  ← etiqueta dorada tenue
//   │                              │
//   │   Rápido. Atento.            │  ← frase italic blanca
//   └──────────────────────────────┘
//
// Las 3 observaciones aparecen en sucesión con stagger (0.35s entre
// cada una) para que el usuario las lea en el orden correcto, no de
// golpe.

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Repeat, Bookmark } from 'lucide-react';

export type DimensionLectura = 'velocidad' | 'patron' | 'accion';

export interface Observacion {
  /** Qué dimensión del comportamiento observa esta frase. */
  dimension: DimensionLectura;
  /** El texto que se muestra. Generado en lectura.ts a partir de datos. */
  frase: string;
}

interface Props {
  /** Siempre 3 observaciones, una por dimensión, en orden:
   *  velocidad → patrón → acción. */
  observaciones: Observacion[];
}

// Iconos pequeños para cada dimensión. lucide-react matching:
//   Activity → velocidad (línea de pulso)
//   Repeat   → patrón (loop)
//   Bookmark → acción (guardar / dejar marca)
const ICONO: Record<DimensionLectura, React.ReactNode> = {
  velocidad: <Activity className="w-3 h-3" />,
  patron: <Repeat className="w-3 h-3" />,
  accion: <Bookmark className="w-3 h-3" />,
};

const ETIQUETA: Record<DimensionLectura, string> = {
  velocidad: 'Velocidad',
  patron: 'Patrón',
  accion: 'Acción',
};

const Lectura: React.FC<Props> = ({ observaciones }) => (
  <div className="flex flex-col gap-6 max-w-[300px] w-full items-center">
    {observaciones.map((obs, i) => (
      <motion.div
        key={obs.dimension}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.4 + i * 0.35,
          type: 'spring',
          damping: 16,
          stiffness: 140,
        }}
        className="flex flex-col gap-1.5 items-center"
      >
        {/* Etiqueta de dimensión — pequeña, dorada tenue, biblia tone:
            susurra qué se está leyendo. */}
        <div
          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em]"
          style={{ color: 'rgba(255, 214, 0, 0.55)' }}
        >
          {ICONO[obs.dimension]}
          <span>{ETIQUETA[obs.dimension]}</span>
        </div>

        {/* Frase — peso visual principal. Italic, blanca, leading-snug. */}
        <p
          className="text-lg italic font-bold text-center leading-snug"
          style={{ color: '#FFFFFF' }}
        >
          {obs.frase}
        </p>
      </motion.div>
    ))}
  </div>
);

export default Lectura;
