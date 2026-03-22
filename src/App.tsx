import React, { useState, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { GameOver } from './components/GameOver';

type Screen = 'login' | 'lobby' | 'game' | 'gameover';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('login');
  const [username, setUsername] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [skins, setSkins] = useState<Record<string, string>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleLogin = (user: string) => {
    setUsername(user);
    setScreen('lobby');
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

  const handleExit = () => {
    setScreen('login');
    setUsername('');
  };

  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'lobby' && (
        <Lobby username={username} onGameStart={handleGameStart} onLogout={handleExit} />
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
          onRematch={handleRematch}
          onExit={handleExit}
        />
      )}
    </>
  );
};

export default App;
