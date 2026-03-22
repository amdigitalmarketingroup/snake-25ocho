import React, { useRef, useEffect } from 'react';
import { SKINS, drawShape } from '../game/skins';

interface Props {
  selectedSkin: string;
  onSelect: (skinId: string) => void;
}

const SkinPreview: React.FC<{ skinId: string }> = ({ skinId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 100, 30);

    // Draw 4 segments with the shape
    for (let i = 0; i < 4; i++) {
      const size = i === 0 ? 20 : 16;
      const x = i * 22 + (i === 0 ? 0 : 2);
      const y = 15 - size / 2;

      if (i === 0) {
        ctx.shadowColor = skin.glow;
        ctx.shadowBlur = 8;
      }

      ctx.globalAlpha = 1 - i * 0.2;
      drawShape(ctx, skin.shape, x, y, size, i === 0 ? skin.head : skin.body);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }, [skinId, skin]);

  return <canvas ref={canvasRef} width={100} height={30} style={{ width: 100, height: 30 }} />;
};

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
            <SkinPreview skinId={skin.id} />
            <div style={styles.nameRow}>
              <span style={styles.shapeBadge}>{skin.shape}</span>
              <span
                style={{
                  ...styles.skinName,
                  color: isActive ? skin.head : '#71717a',
                }}
              >
                {skin.name}
              </span>
            </div>
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
    gap: 8,
    padding: '14px 12px 10px',
    background: '#111113',
    border: '1px solid #27272a',
    borderRadius: 14,
    transition: 'all 0.2s ease',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  shapeBadge: {
    fontSize: 9,
    fontWeight: 600,
    color: '#52525b',
    padding: '1px 5px',
    background: '#1c1c1e',
    borderRadius: 4,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    fontFamily: 'JetBrains Mono, monospace',
  },
  skinName: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
};
