import React from 'react';
import { getSavedSkin } from '../game/stats';
import { getSkin } from '../game/skins';

interface Props {
  username: string;
  onSelect: (mode: 'single' | 'multi') => void;
  onLogout: () => void;
}

export const ModeSelect: React.FC<Props> = ({ username, onSelect, onLogout }) => {
  const skin = getSkin(getSavedSkin(username) || 'neon-blue');

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <h1 style={styles.title}>SNAKE</h1>
            <div style={styles.divider} />
            <span style={styles.subtitle}>25|OCHO</span>
          </div>

          <button onClick={onLogout} style={styles.userBadge}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: skin.head, boxShadow: `0 0 6px ${skin.glow}` }} />
            {username}
            <span style={{ color: '#3f3f46', fontSize: 11 }}>Logout</span>
          </button>
        </div>

        <div style={styles.modes}>
          <button onClick={() => onSelect('single')} style={styles.modeCard}>
            <div style={styles.modeIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>
            <span style={styles.modeName}>Single Player</span>
            <span style={styles.modeDesc}>Play solo, beat your high score</span>
          </button>

          <button onClick={() => onSelect('multi')} style={styles.modeCard}>
            <div style={styles.modeIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="3" />
                <circle cx="17" cy="7" r="3" />
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M17 11a4 4 0 0 1 4 4v2" />
              </svg>
            </div>
            <span style={styles.modeName}>Multiplayer</span>
            <span style={styles.modeDesc}>Challenge a friend in real-time</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 24,
    background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.06) 0%, transparent 60%)',
  },
  content: {
    display: 'flex', flexDirection: 'column', gap: 48, width: '100%',
    maxWidth: 360, animation: 'fadeIn 0.4s ease-out',
  },
  header: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
  },
  logoSection: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  title: {
    fontSize: 56, fontWeight: 900, letterSpacing: '-0.04em', color: '#e4e4e7', lineHeight: 1,
  },
  divider: {
    width: 48, height: 2, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: 1,
  },
  subtitle: {
    fontSize: 14, fontWeight: 500, color: '#71717a', letterSpacing: '0.2em',
  },
  userBadge: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
    background: '#111113', borderRadius: 20, fontSize: 13, fontWeight: 500,
    color: '#a1a1aa', border: '1px solid #27272a',
  },
  modes: {
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  modeCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    padding: '24px 20px', background: '#111113', border: '1px solid #27272a',
    borderRadius: 16, transition: 'all 0.2s',
  },
  modeIcon: {
    width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#18181b', borderRadius: 14, border: '1px solid #27272a',
  },
  modeName: {
    fontSize: 18, fontWeight: 700, color: '#e4e4e7', letterSpacing: '-0.01em',
  },
  modeDesc: {
    fontSize: 13, fontWeight: 400, color: '#71717a',
  },
};
