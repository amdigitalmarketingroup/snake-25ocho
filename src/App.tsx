import React, { useState, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ModeSelect } from './components/ModeSelect';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';
import { SinglePlayer } from './components/SinglePlayer';
import { getSavedSkin } from './game/stats';

type Screen = 'login' | 'mode' | 'lobby' | 'game' | 'gameover' | 'singleplayer';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('login');
  const [username, setUsername] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [skins, setSkins] = useState<Record<string, string>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleLogin = (user: string) => {
    setUsername(user);
    setScreen('mode');
  };

  const handleModeSelect = (mode: 'single' | 'multi') => {
    if (mode === 'single') {
      setScreen('singleplayer');
    } else {
      setScreen('lobby');
    }
  };

  const handleGameStart = useCallback((playerList: string[], skinMap: Record<string, string>) => {
    setPlayers(playerList);
    setSkins(skinMap);
    setScreen('game');
  }, []);

  const handleGameOver = useCallback((w: string | null, s: Record<string, number>) => {
    setWinner(w);
    setScores(s);
    setScreen('gameover');
  }, []);

  const handleRematch = () => {
    setScreen('lobby');
  };

  const handleBackToMode = () => {
    setScreen('mode');
  };

  const handleExit = () => {
    setScreen('login');
    setUsername('');
  };

  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'mode' && (
        <ModeSelect username={username} onSelect={handleModeSelect} onLogout={handleExit} />
      )}
      {screen === 'lobby' && (
        <Lobby username={username} onGameStart={handleGameStart} onLogout={handleBackToMode} />
      )}
      {screen === 'game' && (
        <Game
          username={username}
          players={players}
          skins={skins}
          onGameOver={handleGameOver}
        />
      )}
      {screen === 'gameover' && (
        <GameOver
          username={username}
          winner={winner}
          scores={scores}
          skins={skins}
          players={players}
          onRematch={handleRematch}
          onExit={handleBackToMode}
        />
      )}
      {screen === 'singleplayer' && (
        <SinglePlayer
          username={username}
          skinId={getSavedSkin(username) || 'neon-blue'}
          onExit={handleBackToMode}
        />
      )}
    </>
  );
};

export default App;
