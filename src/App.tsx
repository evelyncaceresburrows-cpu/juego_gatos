import { useState, useCallback } from 'react';
import Home from './components/Home';
import Game from './components/Game';
import Journal from './components/Journal';
import Perfil from './components/Perfil';
import Mapa from './components/Mapa';

type Screen = 'home' | 'game' | 'journal' | 'perfil' | 'mapa';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [lastScore, setLastScore] = useState(0);
  // Origen desde el que se abrió Perfil — para que el back vuelva
  // donde el usuario estaba (Home o Journal).
  const [perfilOrigen, setPerfilOrigen] = useState<'home' | 'journal'>('home');
  // Mismo patrón para Mapa: hoy solo se entra desde Journal, pero
  // dejamos el estado por si después se agrega acceso directo.
  const [mapaOrigen, setMapaOrigen] = useState<'home' | 'journal'>('journal');

  const handleGameEnd = useCallback((score: number) => {
    setLastScore(score);
    setCurrentScreen('journal');
  }, []);

  return (
    <div className="min-h-screen bg-ade-beige text-ade-dark overflow-hidden font-sans">
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
        />
      )}
      {currentScreen === 'game' && (
        <Game 
          onEnd={handleGameEnd}
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
    </div>
  );
}
