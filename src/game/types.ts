export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  body: Position[];
  direction: Direction;
  alive: boolean;
  score: number;
}

export interface Skin {
  id: string;
  name: string;
  head: string;
  body: string;
  glow: string;
  trail: string;
}

export interface GameState {
  snakes: Record<string, Snake>;
  food: Position;
  gridSize: number;
  cellCount: number;
  running: boolean;
  winner: string | null;
}

export interface PlayerInfo {
  username: string;
  skin: string;
  ready: boolean;
}

export const USERS: Record<string, string> = {
  mario: 'mario25',
  lilian: 'lily25',
};
