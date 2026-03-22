import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GameState, Direction, Position } from '../game/types';
import { createInitialGameState, tick, isOpposite, CELL_COUNT, getTickMs } from '../game/engine';
import { getSkin, drawShape } from '../game/skins';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Props {
  username: string;
  players: string[];
  skins: Record<string, string>;
  onGameOver: (winner: string | null, scores: Record<string, number>) => void;
}

// Store previous positions for interpolation
interface SnakeRenderState {
  prev: Position[];
  curr: Position[];
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

  // Interpolation state
  const renderStateRef = useRef<Record<string, SnakeRenderState>>({});
  const tickProgressRef = useRef(0);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState(3);

  // Canvas sizing
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

  const getTotalScore = useCallback(() => {
    const state = gameStateRef.current;
    return Object.values(state.snakes).reduce((sum, s) => sum + s.score, 0);
  }, []);

  // Save previous positions before tick for interpolation
  const savePrevPositions = useCallback(() => {
    const state = gameStateRef.current;
    Object.entries(state.snakes).forEach(([id, snake]) => {
      if (!renderStateRef.current[id]) {
        renderStateRef.current[id] = { prev: [...snake.body], curr: [...snake.body] };
      } else {
        renderStateRef.current[id].prev = renderStateRef.current[id].curr;
        renderStateRef.current[id].curr = [...snake.body];
      }
    });
  }, []);

  // Realtime channel
  useEffect(() => {
    const channel = supabase.channel('snake-game', {
      config: { broadcast: { self: false, ack: false } },
    });

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
          savePrevPositions();
          gameStateRef.current = payload.state;
          // Update curr for interpolation
          Object.entries(payload.state.snakes).forEach(([id, snake]: [string, any]) => {
            if (!renderStateRef.current[id]) {
              renderStateRef.current[id] = { prev: [...snake.body], curr: [...snake.body] };
            } else {
              renderStateRef.current[id].curr = [...snake.body];
            }
          });
          updateScores(payload.state);
          tickProgressRef.current = 0;
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [username, isHost, savePrevPositions]);

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

  // Game loop with interpolation
  useEffect(() => {
    if (countdown > 0) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp;

      const totalScore = getTotalScore();
      const currentTickMs = getTickMs(totalScore);
      const elapsed = timestamp - lastTickRef.current;

      // Update interpolation progress
      tickProgressRef.current = Math.min(1, elapsed / currentTickMs);

      if (elapsed >= currentTickMs) {
        lastTickRef.current = timestamp;
        tickProgressRef.current = 0;
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
          savePrevPositions();
          const newState = tick(state);
          gameStateRef.current = newState;
          // Update curr for interpolation
          Object.entries(newState.snakes).forEach(([id, snake]) => {
            if (!renderStateRef.current[id]) {
              renderStateRef.current[id] = { prev: [...snake.body], curr: [...snake.body] };
            } else {
              renderStateRef.current[id].curr = [...snake.body];
            }
          });
          updateScores(newState);

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

      draw(tickProgressRef.current);
      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [countdown, isHost, username, onGameOver, getTotalScore, savePrevPositions]);

  // Draw with interpolation
  const draw = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    const cellSize = canvasSize / CELL_COUNT;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Grid lines (subtle)
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

    // Food with pulse animation
    const foodX = state.food.x * cellSize + cellSize / 2;
    const foodY = state.food.y * cellSize + cellSize / 2;
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

    // Snakes with interpolation
    Object.entries(state.snakes).forEach(([id, snake]) => {
      const skin = getSkin(skins[id] || 'neon-blue');
      const alpha = snake.alive ? 1 : 0.3;
      const rs = renderStateRef.current[id];

      snake.body.forEach((pos, i) => {
        let drawX: number, drawY: number;

        // Interpolate position for smoother movement
        if (rs && rs.prev[i] && rs.curr[i]) {
          const eased = easeOut(progress);
          drawX = (rs.prev[i].x + (rs.curr[i].x - rs.prev[i].x) * eased) * cellSize;
          drawY = (rs.prev[i].y + (rs.curr[i].y - rs.prev[i].y) * eased) * cellSize;
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

        // Eyes on head
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
          ctx.arc(
            cx + ddx * eyeOffset * 0.5 - (ddy !== 0 ? eyeOffset : 0),
            cy + ddy * eyeOffset * 0.5 - (ddx !== 0 ? eyeOffset : 0),
            eyeSize, 0, Math.PI * 2
          );
          ctx.fill();
          ctx.beginPath();
          ctx.arc(
            cx + ddx * eyeOffset * 0.5 + (ddy !== 0 ? eyeOffset : 0),
            cy + ddy * eyeOffset * 0.5 + (ddx !== 0 ? eyeOffset : 0),
            eyeSize, 0, Math.PI * 2
          );
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      });
    });
  }, [canvasSize, skins]);

  // Touch controls
  const lastDirRef = useRef<Direction | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    lastDirRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 6;

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

    if (direction && direction !== lastDirRef.current) {
      lastDirRef.current = direction;
      directionQueueRef.current = [direction];
      const state = gameStateRef.current;
      const mySnake = state.snakes[username];
      if (mySnake && !isOpposite(mySnake.direction, direction)) {
        state.snakes[username] = { ...mySnake, direction };
      }
      channelRef.current?.send({
        type: 'broadcast',
        event: 'direction',
        payload: { player: username, direction },
      });
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    lastDirRef.current = null;
  };

  const mySkin = getSkin(skins[username] || 'neon-blue');
  const opponentName = players.find((p) => p !== username) || '';
  const opponentSkin = getSkin(skins[opponentName] || 'neon-blue');

  const totalScore = (scores[username] ?? 0) + (scores[opponentName] ?? 0);
  const speedLevel = Math.min(5, Math.floor(totalScore / 4));

  return (
    <div
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
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
        <div style={styles.speedIndicator}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 8 + i * 3,
                borderRadius: 1,
                background: i <= speedLevel
                  ? `hsl(${120 - speedLevel * 24}, 80%, 50%)`
                  : '#27272a',
                transition: 'background 0.3s',
              }}
            />
          ))}
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

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '12px',
    touchAction: 'none',
    userSelect: 'none',
  },
  scoreboard: {
    display: 'flex',
    gap: 16,
    padding: '10px 20px',
    background: '#111113',
    borderRadius: 14,
    border: '1px solid #27272a',
    alignItems: 'center',
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
  speedIndicator: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    padding: '0 8px',
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
