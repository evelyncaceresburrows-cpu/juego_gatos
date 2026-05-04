// src/components/IndicadorAcumulacion.tsx
//
// Indicador del camino hacia la fusión. Reemplaza al "CHISPAS: N" del
// HUD: en lugar de un número que sube, un anillo dorado de 5 arcos que
// se cierra alrededor del cat. Cada captura enciende un arco. Cuando los
// 5 están encendidos, el anillo está completo y se dispara FusionRonda.
//
// Filosofía (informe §12, decisión editorial):
//   - Cero números en pantalla durante el juego (excepto timer)
//   - El progreso se SIENTE, no se cuenta
//   - Ade no premia ("¡llegaste a 5!") — el anillo solo refleja un hecho
//
// Implementación:
//   - SVG con viewBox centrado en (0,0), radio 64.
//   - 5 arcos como <circle> con stroke-dasharray que define un arco de
//     ~85% de su porción (deja gap visible entre arcos).
//   - El arco "encendido" tiene opacity 0.85 + drop-shadow dorado.
//   - El arco "apagado" tiene opacity 0 (no se renderiza visualmente).
//   - Transición suave 0.35s al pasar de off → on, así cada captura
//     siente "se cierra el círculo" sin que parezca progreso de carga.
//
// Uso esperado:
//   <div className="cat-wrapper relative">
//     <IndicadorAcumulacion path={fusionPath} />
//     <img src={adeIdle} ... />
//   </div>
// El SVG usa absolute inset-0, así se superpone exacto sobre el cat
// asumiendo que su contenedor es relative + size adecuado.

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  /** Cuántos arcos están encendidos. Rango válido: 0..5. */
  path: number;
}

const TOTAL_ARCOS = 5;

const IndicadorAcumulacion: React.FC<Props> = ({ path }) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  // Cada arco ocupa una quinta parte del círculo. Dejamos un 15% de gap
  // entre arcos para que el ojo lea 5 unidades, no un anillo continuo.
  const arcLength = (circumference / TOTAL_ARCOS) * 0.85;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      viewBox="-80 -80 160 160"
      style={{
        width: '100%',
        height: '100%',
        // El SVG rota -90° para que el primer arco arranque en las 12hs.
        // Sin esto los arcos quedan corridos hacia las 3hs por el default
        // de stroke-dasharray.
        transform: 'rotate(-90deg)',
      }}
    >
      {/* Anillo base — siempre visible muy tenue, ancla visual del recorrido. */}
      <circle
        r={radius}
        cx={0}
        cy={0}
        fill="none"
        stroke="rgba(255, 214, 0, 0.06)"
        strokeWidth={2}
      />

      {/* 5 arcos. Cada uno se posiciona con strokeDashoffset y solo se
          enciende cuando i < path. */}
      {Array.from({ length: TOTAL_ARCOS }).map((_, i) => {
        const isOn = i < path;
        // Offset negativo desplaza el arco a su posición en el círculo.
        const offset = -(i / TOTAL_ARCOS) * circumference;

        return (
          <motion.circle
            key={i}
            r={radius}
            cx={0}
            cy={0}
            fill="none"
            stroke="#FFD600"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            initial={false}
            animate={{
              opacity: isOn ? 0.85 : 0,
              filter: isOn
                ? 'drop-shadow(0 0 6px rgba(255, 214, 0, 0.8))'
                : 'drop-shadow(0 0 0px rgba(255, 214, 0, 0))',
            }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        );
      })}
    </svg>
  );
};

export default IndicadorAcumulacion;
