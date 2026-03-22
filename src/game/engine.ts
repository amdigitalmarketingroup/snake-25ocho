import { Direction, Position, Snake, GameState } from './types';

export const CELL_COUNT = 20;
export const TICK_MS_START = 180;  // Slow start
export const TICK_MS_MIN = 65;     // Fastest speed
export const TICK_MS_STEP = 6;     // ms faster per food eaten

/** Calculate current tick speed based on total foods eaten by both players */
export function getTickMs(totalScore: number): number {
  return Math.max(TICK_MS_MIN, TICK_MS_START - totalScore * TICK_MS_STEP);
}

export function createInitialSnake(playerIndex: number): Snake {
  const startPositions: Position[] =
    playerIndex === 0
      ? [{ x: 3, y: 10 }, { x: 2, y: 10 }, { x: 1, y: 10 }]
      : [{ x: 16, y: 10 }, { x: 17, y: 10 }, { x: 18, y: 10 }];

  return {
    body: startPositions,
    direction: playerIndex === 0 ? 'RIGHT' : 'LEFT',
    alive: true,
    score: 0,
  };
}

export function spawnFood(snakes: Record<string, Snake>): Position {
  const occupied = new Set<string>();
  Object.values(snakes).forEach((s) =>
    s.body.forEach((p) => occupied.add(`${p.x},${p.y}`))
  );

  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * CELL_COUNT),
      y: Math.floor(Math.random() * CELL_COUNT),
    };
  } while (occupied.has(`${pos.x},${pos.y}`));

  return pos;
}

export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

export function moveSnake(snake: Snake, food: Position): { snake: Snake; ate: boolean } {
  if (!snake.alive) return { snake, ate: false };

  const head = snake.body[0];
  const dir = snake.direction;

  const newHead: Position = {
    x: dir === 'LEFT' ? head.x - 1 : dir === 'RIGHT' ? head.x + 1 : head.x,
    y: dir === 'UP' ? head.y - 1 : dir === 'DOWN' ? head.y + 1 : head.y,
  };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= CELL_COUNT || newHead.y < 0 || newHead.y >= CELL_COUNT) {
    return { snake: { ...snake, alive: false }, ate: false };
  }

  // Self collision
  if (snake.body.some((p) => p.x === newHead.x && p.y === newHead.y)) {
    return { snake: { ...snake, alive: false }, ate: false };
  }

  const ate = newHead.x === food.x && newHead.y === food.y;
  const newBody = [newHead, ...snake.body];
  if (!ate) newBody.pop();

  return {
    snake: {
      ...snake,
      body: newBody,
      score: ate ? snake.score + 1 : snake.score,
    },
    ate,
  };
}

export function checkCrossCollision(snakes: Record<string, Snake>): Record<string, Snake> {
  const entries = Object.entries(snakes);
  const result = { ...snakes };

  for (let i = 0; i < entries.length; i++) {
    const [id1, s1] = entries[i];
    if (!s1.alive) continue;

    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const [, s2] = entries[j];
      const head = s1.body[0];

      if (s2.body.some((p) => p.x === head.x && p.y === head.y)) {
        result[id1] = { ...s1, alive: false };
        break;
      }
    }
  }

  return result;
}

export function createInitialGameState(players: string[]): GameState {
  const snakes: Record<string, Snake> = {};
  players.forEach((id, i) => {
    snakes[id] = createInitialSnake(i);
  });

  return {
    snakes,
    food: spawnFood(snakes),
    gridSize: CELL_COUNT,
    cellCount: CELL_COUNT,
    running: true,
    winner: null,
  };
}

export function tick(state: GameState): GameState {
  if (!state.running) return state;

  let newSnakes = { ...state.snakes };
  let newFood = state.food;
  let anyAte = false;

  // Move all snakes
  for (const id of Object.keys(newSnakes)) {
    const result = moveSnake(newSnakes[id], newFood);
    newSnakes[id] = result.snake;
    if (result.ate) anyAte = true;
  }

  // Check cross-collision
  newSnakes = checkCrossCollision(newSnakes);

  // Respawn food if eaten
  if (anyAte) {
    newFood = spawnFood(newSnakes);
  }

  // Check winner
  const alive = Object.entries(newSnakes).filter(([, s]) => s.alive);
  let winner: string | null = null;
  let running = true;

  if (alive.length <= 1 && Object.keys(newSnakes).length > 1) {
    running = false;
    winner = alive.length === 1 ? alive[0][0] : 'draw';
  }

  if (alive.length === 0) {
    running = false;
    winner = 'draw';
  }

  return {
    ...state,
    snakes: newSnakes,
    food: newFood,
    running,
    winner,
  };
}
