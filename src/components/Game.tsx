import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GameState, Direction } from '../game/types';
import { createInitialGameState, tick, isOpposite, CELL_COUNT, TICK_MS } from '../game/engine';
import { getSkin } from '../game/skins';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Props {
  username: string;
  players: string[];
  skins: Record<string, string>;
  onGameOver: (winner: string | null, scores: Record<string, number>) => void;
}

export const Game: React.FC<Props> = ({ username, players, skins, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>(createInitialGameState(players));
  const channelRef = useRef<RealtimeChannel | null>(null);
  const directionQueueRef = useRef<Direction[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const isHost = players[0] === username;
  const gameOverSentRef = useRef(false);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState(3);

  // Canvas sizing
  const getCanvasSize = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxSize = Math.min(vw - 24, vh - 160);
    return Math.floor(maxSize / CELL_COUNT) * CELL_COUNT;
  }, []);

  const [canvasSize, setCanvasSize] = useState(getCanvasSize);

  useEffect(() => {
    const handle = () => setCanvasSize(getCanvasSize());
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [getCanvasSize]);

  // Realtime channel
  useEffect(() => {
    const channel = supabase.channel('snake-game');

    channel
      .on('broadcast', { event: 'direction' }, ({ payload }) => {
        if (payload.player !== username) {
          const state = gameStateRef.current;
          const snake = state.snakes[payload.player];
          if (snake && !isOpposite(snake.direction, payload.direction)) {
            state.snakes[payload.player] = {
              ...snake,
              direction: payload.direction,
            };
          }
        }
      })
      .on('broadcast', { event: 'state-sync' }, ({ payload }) => {
        if (!isHost) {
          gameStateRef.current = payload.state;
          updateScores(payload.state);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [username, isHost]);

  const updateScores = (state: GameState) => {
    const s: Record<string, number> = {};
    Object.entries(state.snakes).forEach(([id, snake]) => {
      s[id] = snake.score;
    });
    setScores(s);
  };

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Game loop (host-authoritative)
  useEffect(() => {
    if (countdown > 0) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp;

      if (timestamp - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = timestamp;
        const state = gameStateRef.current;

        // Apply local direction queue
        if (directionQueueRef.current.length > 0) {
          const nextDir = directionQueueRef.current.shift()!;
          const mySnake = state.snakes[username];
          if (mySnake && !isOpposite(mySnake.direction, nextDir)) {
            state.snakes[username] = { ...mySnake, direction: nextDir };
          }
        }

        if (isHost) {
          const newState = tick(state);
          gameStateRef.current = newState;
          updateScores(newState);

          // Broadcast state
          channelRef.current?.send({
            type: 'broadcast',
            event: 'state-sync',
            payload: { state: newState },
          });

          if (!newState.running && !gameOverSentRef.current) {
            gameOverSentRef.current = true;
            const scoreMap: Record<string, number> = {};
            Object.entries(newState.snakes).forEach(([id, s]) => {
              scoreMap[id] = s.score;
            });
            setTimeout(() => onGameOver(newState.winner, scoreMap), 500);
          }
        } else {
          // Non-host also checks for game over from synced state
          if (!state.running && !gameOverSentRef.current) {
            gameOverSentRef.current = true;
            const scoreMap: Record<string, number> = {};
            Object.entries(state.snakes).forEach(([id, s]) => {
              scoreMap[id] = s.score;
            });
            setTimeout(() => onGameOver(state.winner, scoreMap), 500);
          }
        }
      }

      draw();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [countdown, isHost, username, onGameOver]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    const cellSize = canvasSize / CELL_COUNT;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Grid lines
    ctx.strokeStyle = '#18181b';
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
    const foodX = state.food.x * cellSize + cellSize / 2;
    const foodY = state.food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize * 0.35;

    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // Snakes
    Object.entries(state.snakes).forEach(([id, snake]) => {
      const skin = getSkin(skins[id] || 'neon-blue');
      const alpha = snake.alive ? 1 : 0.3;

      snake.body.forEach((pos, i) => {
        const x = pos.x * cellSize;
        const y = pos.y * cellSize;
        const isHead = i === 0;
        const gap = 1;
        const radius = isHead ? 4 : 2;

        if (isHead && snake.alive) {
          ctx.shadowColor = skin.glow;
          ctx.shadowBlur = 12;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = isHead ? skin.head : skin.body;
        ctx.beginPath();
        ctx.roundRect(x + gap, y + gap, cellSize - gap * 2, cellSize - gap * 2, radius);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Eyes on head
        if (isHead && snake.alive) {
          const eyeSize = cellSize * 0.12;
          const eyeOffset = cellSize * 0.22;
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.9;

          const dir = snake.direction;
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          const dx = dir === 'LEFT' ? -1 : dir === 'RIGHT' ? 1 : 0;
          const dy = dir === 'UP' ? -1 : dir === 'DOWN' ? 1 : 0;

          ctx.beginPath();
          ctx.arc(
            cx + dx * eyeOffset * 0.5 - (dy !== 0 ? eyeOffset : 0),
            cy + dy * eyeOffset * 0.5 - (dx !== 0 ? eyeOffset : 0),
            eyeSize, 0, Math.PI * 2
          );
          ctx.fill();
          ctx.beginPath();
          ctx.arc(
            cx + dx * eyeOffset * 0.5 + (dy !== 0 ? eyeOffset : 0),
            cy + dy * eyeOffset * 0.5 + (dx !== 0 ? eyeOffset : 0),
            eyeSize, 0, Math.PI * 2
          );
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      });
    });
  }, [canvasSize, skins]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 20;

    let direction: Direction | null = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipe) {
        direction = dx > 0 ? 'RIGHT' : 'LEFT';
      }
    } else {
      if (Math.abs(dy) > minSwipe) {
        direction = dy > 0 ? 'DOWN' : 'UP';
      }
    }

    if (direction) {
      directionQueueRef.current.push(direction);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'direction',
        payload: { player: username, direction },
      });
    }

    touchStartRef.current = null;
  };

  const mySkin = getSkin(skins[username] || 'neon-blue');
  const opponentName = players.find((p) => p !== username) || '';
  const opponentSkin = getSkin(skins[opponentName] || 'neon-blue');

  return (
    <div
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes countPulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Scoreboard */}
      <div style={styles.scoreboard}>
        <div style={styles.scoreItem}>
          <div style={{ ...styles.scoreDot, background: mySkin.head, boxShadow: `0 0 8px ${mySkin.glow}` }} />
          <span style={styles.scoreName}>{username}</span>
          <span style={{ ...styles.scoreNum, fontFamily: 'JetBrains Mono, monospace' }}>{scores[username] ?? 0}</span>
        </div>
        <div style={styles.scoreItem}>
          <div style={{ ...styles.scoreDot, background: opponentSkin.head, boxShadow: `0 0 8px ${opponentSkin.glow}` }} />
          <span style={styles.scoreName}>{opponentName}</span>
          <span style={{ ...styles.scoreNum, fontFamily: 'JetBrains Mono, monospace' }}>{scores[opponentName] ?? 0}</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ ...styles.canvasWrapper, width: canvasSize, height: canvasSize }}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{ borderRadius: 8, border: '1px solid #27272a' }}
        />

        {/* Countdown overlay */}
        {countdown > 0 && (
          <div style={styles.overlay}>
            <span
              key={countdown}
              style={{
                fontSize: 80,
                fontWeight: 900,
                color: '#e4e4e7',
                animation: 'countPulse 0.8s ease-out',
              }}
            >
              {countdown}
            </span>
          </div>
        )}
      </div>

      <p style={styles.hint}>Swipe to move</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '12px',
  },
  scoreboard: {
    display: 'flex',
    gap: 24,
    padding: '10px 20px',
    background: '#111113',
    borderRadius: 14,
    border: '1px solid #27272a',
  },
  scoreItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  scoreName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#a1a1aa',
    textTransform: 'capitalize' as const,
  },
  scoreNum: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e4e4e7',
    minWidth: 24,
    textAlign: 'right' as const,
  },
  canvasWrapper: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 10, 10, 0.7)',
    borderRadius: 8,
  },
  hint: {
    fontSize: 12,
    color: '#3f3f46',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
};
