// src/components/Manual.tsx
//
// Manual de uso — "¿Cómo se juega?".
//
// Por qué existe: feedback de usuario con TDAH — "el juego no tiene
// manual o explicación de uso y eso me desespera". Justo. La biblia tone
// del juego es "no felicita, observa", pero eso vive DENTRO. Afuera, el
// usuario nuevo necesita claridad: qué hace ADE, cómo se juega, qué
// significa cada pantalla, qué aporta.
//
// Diseño ADHD-friendly:
//   - Secciones cortas con headers claros
//   - Lenguaje directo (WCAG 3.1.5 grado 6-8)
//   - Sin biblia tone acá — el manual es metadocumento, no narrativa
//   - Espaciado generoso, scroll vertical limpio
//   - Sin recompensas ni gamificación — es solo info
//
// Accesible desde Home (botón "?") y desde Ajustes.

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles, Layers, Book, BarChart3, Wind, Lock } from 'lucide-react';

interface ManualProps {
  onBack: () => void;
}

const Manual: React.FC<ManualProps> = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen-safe pb-safe pt-safe flex flex-col bg-ade-beige text-ade-dark"
    >
      {/* Header */}
      <header className="flex items-center gap-4 p-6">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
          style={{
            background: 'rgba(26, 35, 50, 0.05)',
            border: '1px solid rgba(26, 35, 50, 0.1)',
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-black tracking-tight">¿Cómo se juega?</h2>
      </header>

      {/* Contenido — secciones cortas, lenguaje directo */}
      <main className="flex-1 px-6 pb-12 flex flex-col gap-6 overflow-y-auto">

        {/* QUÉ ES ADE */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(255, 214, 0, 0.10)',
            border: '1px solid rgba(255, 214, 0, 0.35)',
          }}
        >
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-ade-dark/50 mb-2">
            Qué es
          </p>
          <p className="text-base leading-relaxed">
            ADE es un juego de <strong>30 segundos</strong>. Ade es el gato.
            Cada partida genera datos sobre cómo piensas. Con el tiempo,
            esos datos forman un mapa de tu modo mental.
          </p>
          <p className="text-sm leading-relaxed text-ade-dark/70 mt-2 italic">
            No entrena el cerebro. No promete productividad. Es un espejo,
            no una herramienta.
          </p>
        </section>

        {/* CÓMO JUGAR */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: '#FFD600' }} />
            <h3 className="text-sm font-black uppercase tracking-widest">Cómo jugar</h3>
          </div>
          <ol className="flex flex-col gap-2 text-sm leading-relaxed pl-1">
            <li>
              <strong>1.</strong> Tocas <em>Cazar ahora</em>.
            </li>
            <li>
              <strong>2.</strong> Aparecen chispas con palabras (Caos, Brillo,
              Deseo, etc.). Tócalas para capturarlas.
            </li>
            <li>
              <strong>3.</strong> Capturas seguidas suben tu combo. A los 3
              entras en <strong>FLOW</strong> (puntos x2).
            </li>
            <li>
              <strong>4.</strong> A las 5 capturas del mismo tipo, Ade abre
              una <strong>fusión</strong>: te muestra una frase combinando
              las chispas.
            </li>
            <li>
              <strong>5.</strong> Al final de los 30 segundos, Ade te lee.
            </li>
          </ol>
          <p className="text-xs italic text-ade-dark/55 mt-1">
            Si quieres más tiempo: Ajustes → Sesión extendida (60s).
          </p>
        </section>

        {/* LOS MODOS */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: '#B088FF' }} />
            <h3 className="text-sm font-black uppercase tracking-widest">Los modos</h3>
          </div>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            Los modos cambian el vocabulario de las chispas para que la
            sesión hable de lo que tú tienes en la cabeza.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            <ModoLine label="Creatividad" desc="Caos, Brillo, Eco. Para pensar sin filtros." />
            <ModoLine label="Negocio" desc="Pivot, Métrica, Insight. Para producto y trabajo." />
            <ModoLine label="Ansiedad" desc="Respirar, Soltar, Pausa. Tono más suave. Suma botón Respiro." />
            <ModoLine label="Decisiones" desc="Sí, No, Costo, Riesgo. Cuando estás atascado entre opciones." />
            <ModoLine label="Random" desc="Mezcla de todo." />
          </div>
        </section>

        {/* BITÁCORA */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4" style={{ color: '#40C4FF' }} />
            <h3 className="text-sm font-black uppercase tracking-widest">Bitácora</h3>
          </div>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            Cuando capturas algo que te resonó (típicamente al fusionar),
            Ade te pregunta si quieres guardarlo como idea. Lo escribes
            en una línea. Eso queda en la Bitácora.
          </p>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            La Bitácora se ve desde Home → Bitácora. Tiene radar de qué
            tipo de chispa capturas más, tus ideas guardadas, y se puede
            exportar a Markdown o PDF.
          </p>
        </section>

        {/* PERFIL */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: '#FF9F1C' }} />
            <h3 className="text-sm font-black uppercase tracking-widest">Tu perfil</h3>
          </div>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            Después de algunas partidas, Ade detecta tu <em>tipo creativo</em>
            (el modo que más capturas). Lo ves desde Home → corona arriba
            o desde la Bitácora.
          </p>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            También muestra Focus Score: tu mejor sesión de la semana,
            promedio, y cuántos días jugaste en los últimos 30. Sirve para
            ver tu propio progreso — no se compara con nadie más.
          </p>
        </section>

        {/* RESPIRO */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4" style={{ color: '#7B5CE0' }} />
            <h3 className="text-sm font-black uppercase tracking-widest">Respiro (opcional)</h3>
          </div>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            Solo aparece cuando eliges modo Ansiedad. Es un mini-modo de
            30 segundos: 3 ciclos de respiración (5s inhalar, 5s soltar).
            No tiene puntaje. Sirve para bajar revoluciones antes de
            cazar — o en vez de cazar, si hoy no te da.
          </p>
        </section>

        {/* RACHA */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-black uppercase tracking-widest">Racha y freeze day</h3>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            La racha cuenta días que jugaste seguidos. Pero si saltas 1 día
            <strong> no se rompe</strong> — hay un freeze day automático.
            Solo con 3 días sin entrar, vuelve a 1.
          </p>
          <p className="text-sm leading-relaxed text-ade-dark/75">
            Tampoco hay drama si la pierdes. Tu Bitácora, tus ideas, tu
            perfil — todo sigue ahí. Solo la racha vuelve a cero.
          </p>
        </section>

        {/* PRIVACIDAD */}
        <section
          className="rounded-2xl p-5 flex items-start gap-3"
          style={{
            background: 'rgba(64, 196, 255, 0.08)',
            border: '1px solid rgba(64, 196, 255, 0.25)',
          }}
        >
          <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#40C4FF' }} />
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-ade-dark/50">
              Privacidad
            </p>
            <p className="text-sm leading-relaxed text-ade-dark/75">
              Todo lo que capturas vive solo en este dispositivo. ADE no
              envía nada a ningún servidor, no pide cuenta, no usa cookies
              de tracking. Borra el navegador y desaparece todo.
            </p>
          </div>
        </section>

        {/* QUÉ APORTA */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(26, 35, 50, 0.03)',
            border: '1px solid rgba(26, 35, 50, 0.08)',
          }}
        >
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-ade-dark/50 mb-2">
            ¿Para qué sirve?
          </p>
          <p className="text-sm leading-relaxed">
            ADE es útil cuando <strong>no sabes qué piensas</strong>. La
            sesión de 30 segundos te saca de la página en blanco.
            Las chispas capturadas muestran tu sesgo (qué buscas,
            qué evitas). Las fusiones te tiran combinaciones que no se
            te habrían ocurrido.
          </p>
          <p className="text-sm leading-relaxed mt-2">
            <strong>No es útil</strong> si esperas que algo se haga por ti,
            si esperas un diagnóstico, o si necesitas un tratamiento.
            Para eso hay profesionales.
          </p>
        </section>

      </main>
    </motion.div>
  );
};

// Línea de descripción de modo — uniforme, scannable.
const ModoLine: React.FC<{ label: string; desc: string }> = ({ label, desc }) => (
  <div className="flex flex-col gap-0.5 py-1.5 border-b border-ade-dark/8 last:border-0">
    <p className="text-xs font-black uppercase tracking-widest">{label}</p>
    <p className="text-sm text-ade-dark/70 leading-snug">{desc}</p>
  </div>
);

export default Manual;
