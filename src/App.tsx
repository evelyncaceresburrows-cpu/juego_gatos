import { useState, useCallback } from 'react';
import Home from './components/Home';
import Game from './components/Game';
import Journal from './components/Journal';
import Perfil from './components/Perfil';
import Mapa from './components/Mapa';
import GameOver from './components/GameOver';
import {
  getModoActual,
  setModoActual,
  type ModoJuegoId,
} from './systems/modos';

type Screen = 'home' | 'game' | 'journal' | 'perfil' | 'mapa' | 'gameover';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [lastScore, setLastScore] = useState(0);
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

  const handleGameEnd = useCallback((score: number) => {
    setLastScore(score);
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
    <div className="mx-auto max-w-[430px] w-full min-h-screen min-h-[100dvh] bg-ade-beige text-ade-dark overflow-x-hidden font-sans relative">
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
          modo={modo}
          onModoChange={handleModoChange}
        />
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
          onSave={() => setCurrentScreen('journal')}
          onAnother={() => setCurrentScreen('game')}
          onShare={handleShare}
          onHome={() => {
            setLastScore(0);
            setCurrentScreen('home');
          }}
        />
      )}
    </div>
  );
}
