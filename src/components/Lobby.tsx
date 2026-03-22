import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SkinSelector } from './SkinSelector';
import { PlayerInfo } from '../game/types';
import { getSkin } from '../game/skins';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Props {
  username: string;
  onGameStart: (players: string[], skins: Record<string, string>) => void;
  onLogout: () => void;
}

export const Lobby: React.FC<Props> = ({ username, onGameStart, onLogout }) => {
  const [selectedSkin, setSelectedSkin] = useState('neon-blue');
  const [ready, setReady] = useState(false);
  const [players, setPlayers] = useState<Record<string, PlayerInfo>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel('snake-lobby', {
      config: { presence: { key: username } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PlayerInfo>();
        const playerMap: Record<string, PlayerInfo> = {};
        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            playerMap[key] = presences[0] as unknown as PlayerInfo;
          }
        });
        setPlayers(playerMap);
      })
      .on('broadcast', { event: 'game-start' }, ({ payload }) => {
        onGameStart(payload.players, payload.skins);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            username,
            skin: selectedSkin,
            ready: false,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [username]);

  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.track({
        username,
        skin: selectedSkin,
        ready,
      });
    }
  }, [selectedSkin, ready, username]);

  useEffect(() => {
    const allPlayers = Object.values(players);
    if (allPlayers.length === 2 && allPlayers.every((p) => p.ready)) {
      const sorted = Object.keys(players).sort();
      // First player alphabetically triggers game start
      if (sorted[0] === username) {
        const skins: Record<string, string> = {};
        Object.entries(players).forEach(([k, v]) => {
          skins[k] = v.skin;
        });
        channelRef.current?.send({
          type: 'broadcast',
          event: 'game-start',
          payload: { players: sorted, skins },
        });
        onGameStart(sorted, skins);
      }
    }
  }, [players, username, onGameStart]);

  const otherPlayer = Object.entries(players).find(([k]) => k !== username);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes breathe { 0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.3); } 50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); } }
      `}</style>

      <div style={styles.header}>
        <h2 style={styles.title}>Choose Your Skin</h2>
        <button onClick={onLogout} style={styles.userBadge}>
          <div style={{ ...styles.dot, background: '#22c55e' }} />
          {username}
          <span style={{ color: '#3f3f46', fontSize: 11 }}>Exit</span>
        </button>
      </div>

      <SkinSelector selectedSkin={selectedSkin} onSelect={setSelectedSkin} />

      <div style={styles.statusSection}>
        <div style={styles.playersRow}>
          <div style={styles.playerCard}>
            <div
              style={{
                ...styles.playerDot,
                background: getSkin(selectedSkin).head,
                boxShadow: `0 0 10px ${getSkin(selectedSkin).glow}`,
              }}
            />
            <span style={styles.playerName}>{username}</span>
            {ready && <span style={styles.readyBadge}>READY</span>}
          </div>

          <div style={styles.vs}>VS</div>

          <div style={styles.playerCard}>
            {otherPlayer ? (
              <>
                <div
                  style={{
                    ...styles.playerDot,
                    background: getSkin(otherPlayer[1].skin).head,
                    boxShadow: `0 0 10px ${getSkin(otherPlayer[1].skin).glow}`,
                  }}
                />
                <span style={styles.playerName}>{otherPlayer[0]}</span>
                {otherPlayer[1].ready && (
                  <span style={styles.readyBadge}>READY</span>
                )}
              </>
            ) : (
              <>
                <div style={{ ...styles.playerDot, background: '#3f3f46' }} />
                <span style={{ ...styles.playerName, color: '#3f3f46', animation: 'pulse 2s infinite' }}>
                  Waiting...
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setReady(!ready)}
          style={{
            ...styles.readyButton,
            background: ready
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            animation: ready ? 'breathe 2s infinite' : 'none',
          }}
        >
          {ready ? 'READY' : 'TAP WHEN READY'}
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '48px 20px 32px',
    gap: 24,
    overflow: 'auto',
    animation: 'fadeIn 0.4s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#e4e4e7',
    letterSpacing: '-0.02em',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: '#111113',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    color: '#a1a1aa',
    border: '1px solid #27272a',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 'auto',
  },
  playersRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '16px',
    background: '#111113',
    borderRadius: 16,
    border: '1px solid #27272a',
  },
  playerCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  playerDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  playerName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
    textTransform: 'capitalize' as const,
  },
  readyBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: '#22c55e',
    letterSpacing: '0.1em',
  },
  vs: {
    fontSize: 12,
    fontWeight: 800,
    color: '#3f3f46',
    letterSpacing: '0.1em',
  },
  readyButton: {
    width: '100%',
    padding: '18px',
    borderRadius: 14,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
};
