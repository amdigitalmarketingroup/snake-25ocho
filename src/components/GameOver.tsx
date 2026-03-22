import React, { useEffect, useRef } from 'react';
import { getSkin } from '../game/skins';
import { recordMatch, getHeadToHead } from '../game/stats';

interface Props {
  username: string;
  winner: string | null;
  scores: Record<string, number>;
  skins: Record<string, string>;
  players: string[];
  onRematch: () => void;
  onExit: () => void;
}

export const GameOver: React.FC<Props> = ({ username, winner, scores, skins, players, onRematch, onExit }) => {
  const isDraw = winner === 'draw';
  const isWinner = winner === username;
  const recordedRef = useRef(false);

  // Record match once
  useEffect(() => {
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordMatch(players, scores, winner);
    }
  }, []);

  const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const otherName = players.find((p) => p !== username) || '';
  const h2h = getHeadToHead(username, otherName);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div style={styles.content}>
        <div style={{ animation: 'scaleIn 0.5s ease-out' }}>
          <h1 style={styles.title}>
            {isDraw ? 'DRAW' : isWinner ? 'YOU WIN' : 'YOU LOSE'}
          </h1>
          <div
            style={{
              ...styles.titleBar,
              background: isDraw
                ? '#71717a'
                : isWinner
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, #ef4444, #dc2626)',
            }}
          />
        </div>

        {/* Match scores */}
        <div style={styles.scoreBoard}>
          {sortedPlayers.map(([name, score], i) => {
            const skin = getSkin(skins[name] || 'neon-blue');
            return (
              <div
                key={name}
                style={{
                  ...styles.scoreRow,
                  animation: `fadeIn 0.4s ease-out ${i * 0.15}s both`,
                }}
              >
                <div style={styles.scoreLeft}>
                  <span style={{ ...styles.rank, color: i === 0 ? '#eab308' : '#52525b' }}>
                    {i === 0 ? '#1' : '#2'}
                  </span>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: skin.head,
                      boxShadow: `0 0 8px ${skin.glow}`,
                    }}
                  />
                  <span style={styles.playerName}>{name}</span>
                  {name === username && (
                    <span style={styles.youBadge}>YOU</span>
                  )}
                </div>
                <span style={styles.playerScore}>{score}</span>
              </div>
            );
          })}
        </div>

        {/* Head to head record */}
        <div style={styles.h2hCard}>
          <div style={styles.h2hTitle}>ALL TIME</div>
          <div style={styles.h2hRow}>
            <span style={{ ...styles.h2hNum, color: getSkin(skins[username] || 'neon-blue').head }}>
              {h2h.p1Wins}
            </span>
            <span style={styles.h2hDash}>-</span>
            <span style={{ ...styles.h2hNum, color: '#71717a' }}>{h2h.draws}</span>
            <span style={styles.h2hDash}>-</span>
            <span style={{ ...styles.h2hNum, color: getSkin(skins[otherName] || 'neon-blue').head }}>
              {h2h.p2Wins}
            </span>
          </div>
          <div style={styles.h2hNames}>
            <span style={styles.h2hName}>{username}</span>
            <span style={{ ...styles.h2hName, color: '#3f3f46' }}>draws</span>
            <span style={styles.h2hName}>{otherName}</span>
          </div>
          <div style={styles.h2hPoints}>
            <span style={styles.h2hPts}>{h2h.p1TotalPoints} pts total</span>
            <span style={styles.h2hPts}>{h2h.p2TotalPoints} pts total</span>
          </div>
        </div>

        <div style={styles.buttons}>
          <button onClick={onRematch} style={styles.rematchBtn}>
            Rematch
          </button>
          <button onClick={onExit} style={styles.exitBtn}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    overflow: 'auto',
    background: 'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.06) 0%, transparent 60%)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 40,
    fontWeight: 900,
    color: '#e4e4e7',
    letterSpacing: '-0.03em',
    textAlign: 'center' as const,
  },
  titleBar: {
    width: 60,
    height: 3,
    borderRadius: 2,
    margin: '12px auto 0',
  },
  scoreBoard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: '#111113',
    border: '1px solid #27272a',
    borderRadius: 12,
  },
  scoreLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  rank: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'JetBrains Mono, monospace',
    minWidth: 24,
  },
  playerName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e4e4e7',
    textTransform: 'capitalize' as const,
  },
  youBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: '#3b82f6',
    padding: '2px 6px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 4,
    letterSpacing: '0.1em',
  },
  playerScore: {
    fontSize: 24,
    fontWeight: 800,
    color: '#e4e4e7',
    fontFamily: 'JetBrains Mono, monospace',
  },
  h2hCard: {
    width: '100%',
    padding: '14px 16px',
    background: '#111113',
    border: '1px solid #27272a',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  h2hTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#52525b',
    letterSpacing: '0.15em',
  },
  h2hRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  h2hNum: {
    fontSize: 24,
    fontWeight: 800,
    fontFamily: 'JetBrains Mono, monospace',
  },
  h2hDash: {
    fontSize: 16,
    color: '#3f3f46',
    fontWeight: 400,
  },
  h2hNames: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0 8px',
  },
  h2hName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'capitalize' as const,
  },
  h2hPoints: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '6px 8px 0',
    borderTop: '1px solid #1e1e21',
  },
  h2hPts: {
    fontSize: 11,
    fontWeight: 500,
    color: '#52525b',
    fontFamily: 'JetBrains Mono, monospace',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  rematchBtn: {
    width: '100%',
    padding: 16,
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  exitBtn: {
    width: '100%',
    padding: 14,
    background: 'transparent',
    border: '1px solid #27272a',
    borderRadius: 12,
    color: '#71717a',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
};
