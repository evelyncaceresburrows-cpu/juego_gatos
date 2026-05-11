import { useState, useCallback } from 'react';
import Home from './components/Home';
import Game from './components/Game';
import Journal from './components/Journal';
import Perfil from './components/Perfil';
import Mapa from './components/Mapa';
import GameOver from './components/GameOver';
import Ajustes from './components/Ajustes';
import Onboarding from './components/Onboarding';
import {
  getModoActual,
  setModoActual,
  type ModoJuegoId,
} from './systems/modos';
import type { MetricasSesion } from './systems/lectura';

type Screen = 'home' | 'game' | 'journal' | 'perfil' | 'mapa' | 'gameover' | 'ajustes';

const ONBOARDING_KEY = 'ade_onboarding_done';

function shouldShowOnboarding(): boolean {
  try {
    if (localStorage.getItem(ONBOARDING_KEY) === '1') return false;
    const raw = localStorage.getItem('ade-profile');
    if (!raw) return true;
    const p = JSON.parse(raw);
    return !p.sesiones || p.sesiones < 1;
  } catch {
    return true;
  }
}

function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch { /* noop */ }
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  // Onboarding visible solo en primera visita (auditoría §3.3). Skip
  // persiste en localStorage para no volver a aparecer.
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => shouldShowOnboarding());
  const [lastScore, setLastScore] = useState(0);
  // Métricas crudas de la última sesión cerrada. GameOver las usa para
  // generar las 3 observaciones (Lectura). Null hasta que termine la
  // primera partida del session.
  const [lastMetricas, setLastMetricas] = useState<MetricasSesion | null>(null);
  // Origen desde el que se abrió Perfil — para que el back vuelva
  // donde el usuario estaba (Home o Journal).
  const [perfilOrigen, setPerfilOrigen] = useState<'home' | 'journal'>('home');
  // Mismo patrón para Mapa: hoy solo se entra desde Journal, pero
  // dejamos el estado por si después se agrega acceso directo.
  const [mapaOrigen, setMapaOrigen] = useState<'home' | 'journal'>('journal');
  // Fase 3.1 — Modo de juego activo. Se inicializa desde localStorage
  // (default 'creatividad') y se persiste al cambiar.
  const [modo, setModo] = useState<ModoJuegoId>(() => getModoActual());

  const handleModoChange = useCallback((m: ModoJuegoId) => {
    setModo(m);
    setModoActual(m);
  }, []);

  const handleGameEnd = useCallback((score: number, metricas: MetricasSesion) => {
    setLastScore(score);
    setLastMetricas(metricas);
    // Pasamos por GameOver primero ("ADE detectó algo...") en vez de
    // saltar directo a Bitácora. El usuario decide si guarda, juega
    // otra o comparte.
    setCurrentScreen('gameover');
  }, []);

  // Acciones desde la pantalla GameOver.
  const handleShare = useCallback(() => {
    const text = `Acabo de capturar ${lastScore} chispas en ADE — el gato que caza ideas.`;
    const url = 'https://juego-gatos.vercel.app';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'ADE', text, url }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${url}`);
    }
  }, [lastScore]);

  return (
    <div className="mx-auto max-w-[430px] w-full min-h-screen-safe bg-ade-beige text-ade-dark overflow-x-hidden font-sans relative">
      {showOnboarding && (
        <Onboarding
          onComplete={() => {
            markOnboardingDone();
            setShowOnboarding(false);
          }}
        />
      )}
      {currentScreen === 'home' && (
        <Home
          onStart={() => setCurrentScreen('game')}
          onJournal={() => {
            // Reset: si entran a Bitácora manualmente (no por fin de
            // partida), no debe mostrarse el banner de "lectura final".
            setLastScore(0);
            setCurrentScreen('journal');
          }}
          onPerfil={() => {
            setPerfilOrigen('home');
            setCurrentScreen('perfil');
          }}
          onAjustes={() => setCurrentScreen('ajustes')}
          modo={modo}
          onModoChange={handleModoChange}
        />
      )}
      {currentScreen === 'ajustes' && (
        <Ajustes onBack={() => setCurrentScreen('home')} />
      )}
      {currentScreen === 'game' && (
        <Game
          onEnd={handleGameEnd}
          modo={modo}
        />
      )}
      {currentScreen === 'journal' && (
        <Journal
          onBack={() => setCurrentScreen('home')}
          onPerfil={() => {
            setPerfilOrigen('journal');
            setCurrentScreen('perfil');
          }}
          onMapa={() => {
            setMapaOrigen('journal');
            setCurrentScreen('mapa');
          }}
          justFinishedScore={lastScore}
        />
      )}
      {currentScreen === 'perfil' && (
        <Perfil onBack={() => setCurrentScreen(perfilOrigen)} />
      )}
      {currentScreen === 'mapa' && (
        <Mapa onBack={() => setCurrentScreen(mapaOrigen)} />
      )}
      {currentScreen === 'gameover' && (
        <GameOver
          score={lastScore}
          metricas={lastMetricas}
          onSave={() => setCurrentScreen('journal')}
          onAnother={() => setCurrentScreen('game')}
          onShare={handleShare}
          onHome={() => {
            setLastScore(0);
            setLastMetricas(null);
            setCurrentScreen('home');
          }}
        />
      )}
    </div>
  );
}
