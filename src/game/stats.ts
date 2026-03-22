export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  totalPoints: number;
  matchHistory: MatchRecord[];
}

export interface MatchRecord {
  date: string;
  players: string[];
  scores: Record<string, number>;
  winner: string | null;
}

const STATS_KEY = 'snake-25ocho-stats';

function loadAllStats(): Record<string, PlayerStats> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllStats(stats: Record<string, PlayerStats>) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function getDefault(): PlayerStats {
  return { wins: 0, losses: 0, draws: 0, totalPoints: 0, matchHistory: [] };
}

export function getPlayerStats(username: string): PlayerStats {
  const all = loadAllStats();
  return all[username] || getDefault();
}

export function recordMatch(
  players: string[],
  scores: Record<string, number>,
  winner: string | null,
) {
  const all = loadAllStats();
  const record: MatchRecord = {
    date: new Date().toISOString(),
    players,
    scores,
    winner,
  };

  for (const player of players) {
    if (!all[player]) all[player] = getDefault();
    const s = all[player];

    s.totalPoints += scores[player] || 0;
    s.matchHistory.push(record);
    // Keep last 50 matches
    if (s.matchHistory.length > 50) s.matchHistory.shift();

    if (winner === 'draw') {
      s.draws++;
    } else if (winner === player) {
      s.wins++;
    } else {
      s.losses++;
    }
  }

  saveAllStats(all);
}

export function getHeadToHead(player1: string, player2: string): {
  p1Wins: number;
  p2Wins: number;
  draws: number;
  p1TotalPoints: number;
  p2TotalPoints: number;
} {
  const all = loadAllStats();
  const s1 = all[player1];
  if (!s1) return { p1Wins: 0, p2Wins: 0, draws: 0, p1TotalPoints: 0, p2TotalPoints: 0 };

  let p1Wins = 0, p2Wins = 0, draws = 0, p1Total = 0, p2Total = 0;

  for (const match of s1.matchHistory) {
    if (match.players.includes(player1) && match.players.includes(player2)) {
      p1Total += match.scores[player1] || 0;
      p2Total += match.scores[player2] || 0;
      if (match.winner === 'draw') draws++;
      else if (match.winner === player1) p1Wins++;
      else if (match.winner === player2) p2Wins++;
    }
  }

  return { p1Wins, p2Wins, draws, p1TotalPoints: p1Total, p2TotalPoints: p2Total };
}

const SKIN_KEY = 'snake-25ocho-skin';

export function getSavedSkin(username: string): string | null {
  try {
    const raw = localStorage.getItem(`${SKIN_KEY}-${username}`);
    return raw || null;
  } catch {
    return null;
  }
}

export function saveSkin(username: string, skinId: string) {
  localStorage.setItem(`${SKIN_KEY}-${username}`, skinId);
}
