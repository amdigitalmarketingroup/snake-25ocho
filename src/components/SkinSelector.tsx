import React from 'react';
import { SKINS } from '../game/skins';

interface Props {
  selectedSkin: string;
  onSelect: (skinId: string) => void;
}

export const SkinSelector: React.FC<Props> = ({ selectedSkin, onSelect }) => {
  return (
    <div style={styles.grid}>
      {SKINS.map((skin) => {
        const isActive = selectedSkin === skin.id;
        return (
          <button
            key={skin.id}
            onClick={() => onSelect(skin.id)}
            style={{
              ...styles.skinCard,
              borderColor: isActive ? skin.head : '#27272a',
              boxShadow: isActive ? `0 0 20px ${skin.glow}` : 'none',
            }}
          >
            <div style={styles.preview}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: i === 0 ? 18 : 14,
                    height: i === 0 ? 18 : 14,
                    borderRadius: i === 0 ? 5 : 3,
                    background: i === 0 ? skin.head : skin.body,
                    opacity: 1 - i * 0.15,
                    boxShadow: i === 0 ? `0 0 8px ${skin.glow}` : 'none',
                  }}
                />
              ))}
            </div>
            <span
              style={{
                ...styles.skinName,
                color: isActive ? skin.head : '#71717a',
              }}
            >
              {skin.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    width: '100%',
  },
  skinCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '16px 12px',
    background: '#111113',
    border: '1px solid #27272a',
    borderRadius: 14,
    transition: 'all 0.2s ease',
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  skinName: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
};
