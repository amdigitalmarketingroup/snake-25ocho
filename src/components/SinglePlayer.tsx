import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Direction, Position, Snake } from '../game/types';
import { CELL_COUNT, getTickMs, spawnFood, isOpposite, moveSnake } from '../game/engine';
import { getSkin, drawShape } from '../game/skins';
import { recordSinglePlayer, getSinglePlayerStats, getSinglePlayerLeaderboard } from '../game/stats';

interface Props {
  username: string;
  skinId: string;
  onExit: () => void;
}

export const SinglePlayer: React.FC<Props> = ({ username, skinId, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Snake>({
    body: [
      { x: Math.floor(CELL_COUNT / 2), y: Math.floor(CELL_COUNT / 2) },
      { x: Math.floor(CELL_COUNT / 2) - 1, y: Math.floor(CELL_COUNT / 2) },
      { x: Math.floor(CELL_COUNT / 2) - 2, y: Math.floor(CELL_COUNT / 2) },
    ],
    direction: 'RIGHT',
    alive: true,
    score: 0,
  });
  const foodRef = useRef<Position>(spawnFood({ player: snakeRef.current }));
  const directionQueueRef = useRef<Direction[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastDirRef = useRef<Direction | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const prevBodyRef = useRef<Position[]>([...snakeRef.current.body]);
  const tickProgressRef = useRef(0);
  const gameOverRef = useRef(false);

  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const getCanvasSize = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxSize = Math.min(vw - 24, vh - 180);
    return Math.floor(maxSize / CELL_COUNT) * CELL_COUNT;
  }, []);

  const [canvasSize, setCanvasSize] = useState(getCanvasSize);

  useEffect(() => {
    const handle = () => setCanvasSize(getCanvasSize());
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [getCanvasSize]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Game loop
  useEffect(() => {
    if (countdown > 0) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp;

      const currentTickMs = getTickMs(snakeRef.current.score);
      const elapsed = timestamp - lastTickRef.current;
      tickProgressRef.current = Math.min(1, elapsed / currentTickMs);

      if (elapsed >= currentTickMs) {
        lastTickRef.current = timestamp;
        tickProgressRef.current = 0;

        const snake = snakeRef.current;
        if (!snake.alive) {
          if (!gameOverRef.current) {
            gameOverRef.current = true;
            recordSinglePlayer(username, snake.score);
            setGameOver(true);
          }
          draw(0);
          return;
        }

        // Apply direction
        if (directionQueueRef.current.length > 0) {
          const nextDir = directionQueueRef.current.shift()!;
          if (!isOpposite(snake.direction, nextDir)) {
            snakeRef.current = { ...snake, direction: nextDir };
          }
        }

        prevBodyRef.current = [...snakeRef.current.body];
        const result = moveSnake(snakeRef.current, foodRef.current);
        snakeRef.current = result.snake;
        setScore(result.snake.score);

        if (result.ate) {
          foodRef.current = spawnFood({ player: result.snake });
        }

        if (!result.snake.alive && !gameOverRef.current) {
          gameOverRef.current = true;
          recordSinglePlayer(username, result.snake.score);
          setGameOver(true);
        }
      }

      draw(tickProgressRef.current);
      if (!gameOverRef.current) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [countdown, username]);

  const draw = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const snake = snakeRef.current;
    const food = foodRef.current;
    const skin = getSkin(skinId);
    const cellSize = canvasSize / CELL_COUNT;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Grid
    ctx.strokeStyle = '#151517';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasSize, i * cellSize);
      ctx.stroke();
    }

    // Food
    const foodX = food.x * cellSize + cellSize / 2;
    const foodY = food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize * 0.35;
    const foodPulse = 1 + Math.sin(Date.now() * 0.004) * 0.1;

    ctx.beginPath();
    ctx.arc(foodX, foodY, (foodRadius + 4) * foodPulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * foodPulse, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // Snake with interpolation
    const alpha = snake.alive ? 1 : 0.3;
    const eased = easeOut(progress);

    snake.body.forEach((pos, i) => {
      let drawX: number, drawY: number;
      if (prevBodyRef.current[i]) {
        drawX = (prevBodyRef.current[i].x + (pos.x - prevBodyRef.current[i].x) * eased) * cellSize;
        drawY = (prevBodyRef.current[i].y + (pos.y - prevBodyRef.current[i].y) * eased) * cellSize;
      } else {
        drawX = pos.x * cellSize;
        drawY = pos.y * cellSize;
      }

      const isHead = i === 0;
      if (isHead && snake.alive) {
        ctx.shadowColor = skin.glow;
        ctx.shadowBlur = 10;
      }

      ctx.globalAlpha = alpha * (1 - i * 0.015);
      drawShape(ctx, skin.shape, drawX, drawY, cellSize, isHead ? skin.head : skin.body);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      if (isHead && snake.alive) {
        const eyeSize = cellSize * 0.12;
        const eyeOffset = cellSize * 0.22;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        const dir = snake.direction;
        const cx = drawX + cellSize / 2;
        const cy = drawY + cellSize / 2;
        const ddx = dir === 'LEFT' ? -1 : dir === 'RIGHT' ? 1 : 0;
        const ddy = dir === 'UP' ? -1 : dir === 'DOWN' ? 1 : 0;
        ctx.beginPath();
        ctx.arc(cx + ddx * eyeOffset * 0.5 - (ddy !== 0 ? eyeOffset : 0), cy + ddy * eyeOffset * 0.5 - (ddx !== 0 ? eyeOffset : 0), eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + ddx * eyeOffset * 0.5 + (ddy !== 0 ? eyeOffset : 0), cy + ddy * eyeOffset * 0.5 + (ddx !== 0 ? eyeOffset : 0), eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }, [canvasSize, skinId]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    lastDirRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    let direction: Direction | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 6) direction = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      if (Math.abs(dy) > 6) direction = dy > 0 ? 'DOWN' : 'UP';
    }

    if (direction && direction !== lastDirRef.current) {
      lastDirRef.current = direction;
      directionQueueRef.current = [direction];
      const snake = snakeRef.current;
      if (!isOpposite(snake.direction, direction)) {
        snakeRef.current = { ...snake, direction };
      }
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    lastDirRef.current = null;
  };

  const handleRestart = () => {
    snakeRef.current = {
      body: [
        { x: Math.floor(CELL_COUNT / 2), y: Math.floor(CELL_COUNT / 2) },
        { x: Math.floor(CELL_COUNT / 2) - 1, y: Math.floor(CELL_COUNT / 2) },
        { x: Math.floor(CELL_COUNT / 2) - 2, y: Math.floor(CELL_COUNT / 2) },
      ],
      direction: 'RIGHT',
      alive: true,
      score: 0,
    };
    foodRef.current = spawnFood({ player: snakeRef.current });
    prevBodyRef.current = [...snakeRef.current.body];
    directionQueueRef.current = [];
    lastTickRef.current = 0;
    tickProgressRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setShowStats(false);
    setCountdown(3);
  };

  const skin = getSkin(skinId);
  const speedLevel = Math.min(5, Math.floor(score / 4));

  const stats = getSinglePlayerStats(username);
  const leaderboard = getSinglePlayerLeaderboard();

  if (gameOver && showStats) {
    return (
      <div style={styles.container}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={{ ...styles.statsPanel, animation: 'fadeIn 0.4s ease-out' }}>
          <h2 style={styles.statsTitle}>LEADERBOARD</h2>

          <div style={styles.leaderboard}>
            {leaderboard.map((entry, i) => (
              <div key={entry.username} style={{
                ...styles.lbRow,
                background: entry.username === username ? 'rgba(59,130,246,0.08)' : '#111113',
                borderColor: entry.username === username ? 'rgba(59,130,246,0.2)' : '#27272a',
              }}>
                <div style={styles.lbLeft}>
                  <span style={{ ...styles.lbRank, color: i === 0 ? '#eab308' : i === 1 ? '#a1a1aa' : '#52525b' }}>
                    #{i + 1}
                  </span>
                  <span style={styles.lbName}>{entry.username}</span>
                  {entry.username === username && <span style={styles.youBadge}>YOU</span>}
                </div>
                <div style={styles.lbRight}>
                  <span style={styles.lbScore}>{entry.highScore}</span>
                  <span style={styles.lbGames}>{entry.gamesPlayed} games</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.personalStats}>
            <div style={styles.pStatRow}>
              <span style={styles.pStatLabel}>Your High Score</span>
              <span style={styles.pStatValue}>{stats.highScore}</span>
            </div>
            <div style={styles.pStatRow}>
              <span style={styles.pStatLabel}>Games Played</span>
              <span style={styles.pStatValue}>{stats.gamesPlayed}</span>
            </div>
            <div style={styles.pStatRow}>
              <span style={styles.pStatLabel}>Total Points</span>
              <span style={styles.pStatValue}>{stats.totalPoints}</span>
            </div>
            <div style={styles.pStatRow}>
              <span style={styles.pStatLabel}>Avg Score</span>
              <span style={styles.pStatValue}>
                {stats.gamesPlayed > 0 ? (stats.totalPoints / stats.gamesPlayed).toFixed(1) : '0'}
              </span>
            </div>
          </div>

          <div style={styles.buttons}>
            <button onClick={handleRestart} style={styles.playBtn}>Play Again</button>
            <button onClick={onExit} style={styles.exitBtn}>Exit</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div style={styles.container}>
        <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`}</style>
        <div style={{ ...styles.gameOverPanel, animation: 'scaleIn 0.5s ease-out' }}>
          <h1 style={styles.goTitle}>GAME OVER</h1>
          <div style={styles.goBar} />
          <div style={styles.goScore}>
            <span style={styles.goScoreLabel}>SCORE</span>
            <span style={styles.goScoreNum}>{score}</span>
          </div>
          {score >= stats.highScore && score > 0 && (
            <span style={styles.newRecord}>NEW RECORD!</span>
          )}
          <div style={styles.buttons}>
            <button onClick={handleRestart} style={styles.playBtn}>Play Again</button>
            <button onClick={() => setShowStats(true)} style={styles.statsBtn}>Stats</button>
            <button onClick={onExit} style={styles.exitBtn}>Exit</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`@keyframes countPulse { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>

      <div style={styles.scoreboard}>
        <div style={styles.scoreItem}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: skin.head, boxShadow: `0 0 8px ${skin.glow}` }} />
          <span style={styles.scoreName}>{username}</span>
          <span style={{ ...styles.scoreNum, fontFamily: 'JetBrains Mono, monospace' }}>{score}</span>
        </div>
        <div style={styles.speedIndicator}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              width: 3, height: 8 + i * 3, borderRadius: 1,
              background: i <= speedLevel ? `hsl(${120 - speedLevel * 24}, 80%, 50%)` : '#27272a',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={styles.scoreItem}>
          <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'JetBrains Mono, monospace' }}>
            HI: {stats.highScore}
          </span>
        </div>
      </div>

      <div style={{ ...styles.canvasWrapper, width: canvasSize, height: canvasSize }}>
        <canvas ref={canvasRef} width={canvasSize} height={canvasSize} style={{ borderRadius: 8, border: '1px solid #27272a' }} />
        {countdown > 0 && (
          <div style={styles.overlay}>
            <span key={countdown} style={{ fontSize: 80, fontWeight: 900, color: '#e4e4e7', animation: 'countPulse 0.8s ease-out' }}>
              {countdown}
            </span>
          </div>
        )}
      </div>
      <p style={styles.hint}>Swipe to move</p>
    </div>
  );
};

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12,
    touchAction: 'none', userSelect: 'none',
  },
  scoreboard: {
    display: 'flex', gap: 16, padding: '10px 20px', background: '#111113',
    borderRadius: 14, border: '1px solid #27272a', alignItems: 'center',
  },
  scoreItem: { display: 'flex', alignItems: 'center', gap: 8 },
  scoreName: { fontSize: 13, fontWeight: 600, color: '#a1a1aa', textTransform: 'capitalize' as const },
  scoreNum: { fontSize: 18, fontWeight: 700, color: '#e4e4e7', minWidth: 24, textAlign: 'right' as const },
  speedIndicator: { display: 'flex', alignItems: 'flex-end', gap: 2, padding: '0 8px' },
  canvasWrapper: { position: 'relative' },
  overlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10, 10, 10, 0.7)', borderRadius: 8,
  },
  hint: { fontSize: 12, color: '#3f3f46', letterSpacing: '0.1em', textTransform: 'uppercase' as const },

  // Game over
  gameOverPanel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    width: '100%', maxWidth: 340, padding: '0 20px',
  },
  goTitle: { fontSize: 40, fontWeight: 900, color: '#e4e4e7', letterSpacing: '-0.03em' },
  goBar: { width: 60, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #ef4444, #dc2626)' },
  goScore: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  goScoreLabel: { fontSize: 11, fontWeight: 700, color: '#52525b', letterSpacing: '0.15em' },
  goScoreNum: { fontSize: 56, fontWeight: 900, color: '#e4e4e7', fontFamily: 'JetBrains Mono, monospace' },
  newRecord: {
    fontSize: 14, fontWeight: 700, color: '#eab308', letterSpacing: '0.1em',
    padding: '6px 16px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: 8,
  },

  // Stats
  statsPanel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    width: '100%', maxWidth: 340, padding: '0 20px', overflow: 'auto', maxHeight: '100%',
  },
  statsTitle: { fontSize: 20, fontWeight: 900, color: '#e4e4e7', letterSpacing: '-0.02em' },
  leaderboard: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6 },
  lbRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 14px', background: '#111113', border: '1px solid #27272a', borderRadius: 10,
  },
  lbLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  lbRank: { fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', minWidth: 24 },
  lbName: { fontSize: 14, fontWeight: 600, color: '#e4e4e7', textTransform: 'capitalize' as const },
  youBadge: {
    fontSize: 9, fontWeight: 700, color: '#3b82f6', padding: '2px 6px',
    background: 'rgba(59, 130, 246, 0.1)', borderRadius: 4, letterSpacing: '0.1em',
  },
  lbRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  lbScore: { fontSize: 20, fontWeight: 800, color: '#e4e4e7', fontFamily: 'JetBrains Mono, monospace' },
  lbGames: { fontSize: 10, color: '#52525b', fontFamily: 'JetBrains Mono, monospace' },

  personalStats: {
    width: '100%', padding: '12px 14px', background: '#111113',
    border: '1px solid #27272a', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8,
  },
  pStatRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pStatLabel: { fontSize: 12, fontWeight: 500, color: '#71717a' },
  pStatValue: { fontSize: 14, fontWeight: 700, color: '#e4e4e7', fontFamily: 'JetBrains Mono, monospace' },

  buttons: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%' },
  playBtn: {
    width: '100%', padding: 16, background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700,
    letterSpacing: '0.05em', textTransform: 'uppercase' as const,
  },
  statsBtn: {
    width: '100%', padding: 14, background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 12, color: '#3b82f6',
    fontSize: 14, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
  },
  exitBtn: {
    width: '100%', padding: 14, background: 'transparent', border: '1px solid #27272a',
    borderRadius: 12, color: '#71717a', fontSize: 14, fontWeight: 600,
    letterSpacing: '0.05em', textTransform: 'uppercase' as const,
  },
};
