import { Skin } from './types';

export interface SkinFull extends Skin {
  shape: 'square' | 'round' | 'diamond' | 'pill' | 'triangle' | 'hexagon' | 'star' | 'cross';
}

export const SKINS: SkinFull[] = [
  {
    id: 'neon-blue',
    name: 'Neon',
    head: '#3b82f6',
    body: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.4)',
    trail: 'rgba(59, 130, 246, 0.15)',
    shape: 'square',
  },
  {
    id: 'fire',
    name: 'Fire',
    head: '#f97316',
    body: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.4)',
    trail: 'rgba(249, 115, 22, 0.15)',
    shape: 'diamond',
  },
  {
    id: 'ice',
    name: 'Ice',
    head: '#06b6d4',
    body: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.4)',
    trail: 'rgba(6, 182, 212, 0.15)',
    shape: 'round',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    head: '#10b981',
    body: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)',
    trail: 'rgba(16, 185, 129, 0.15)',
    shape: 'hexagon',
  },
  {
    id: 'gold',
    name: 'Gold',
    head: '#eab308',
    body: '#ca8a04',
    glow: 'rgba(234, 179, 8, 0.4)',
    trail: 'rgba(234, 179, 8, 0.15)',
    shape: 'star',
  },
  {
    id: 'rose',
    name: 'Rose',
    head: '#f43f5e',
    body: '#e11d48',
    glow: 'rgba(244, 63, 94, 0.4)',
    trail: 'rgba(244, 63, 94, 0.15)',
    shape: 'pill',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    head: '#a1a1aa',
    body: '#71717a',
    glow: 'rgba(161, 161, 170, 0.3)',
    trail: 'rgba(161, 161, 170, 0.1)',
    shape: 'cross',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    head: '#a855f7',
    body: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.4)',
    trail: 'rgba(168, 85, 247, 0.15)',
    shape: 'triangle',
  },
];

export function getSkin(id: string): SkinFull {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 1;

  ctx.fillStyle = color;
  ctx.beginPath();

  switch (shape) {
    case 'round':
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'diamond':
      ctx.moveTo(cx, y + 1);
      ctx.lineTo(x + size - 1, cy);
      ctx.lineTo(cx, y + size - 1);
      ctx.lineTo(x + 1, cy);
      ctx.closePath();
      ctx.fill();
      break;

    case 'pill':
      ctx.roundRect(x + 2, y + 1, size - 4, size - 2, size / 2);
      ctx.fill();
      break;

    case 'triangle':
      ctx.moveTo(cx, y + 2);
      ctx.lineTo(x + size - 2, y + size - 2);
      ctx.lineTo(x + 2, y + size - 2);
      ctx.closePath();
      ctx.fill();
      break;

    case 'hexagon': {
      const a = r * 0.9;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + a * Math.cos(angle);
        const py = cy + a * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'star': {
      const outer = r * 0.9;
      const inner = r * 0.4;
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        ctx.lineTo(cx + outer * Math.cos(outerAngle), cy + outer * Math.sin(outerAngle));
        ctx.lineTo(cx + inner * Math.cos(innerAngle), cy + inner * Math.sin(innerAngle));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'cross': {
      const t = size * 0.3;
      ctx.fillRect(cx - t / 2, y + 2, t, size - 4);
      ctx.fillRect(x + 2, cy - t / 2, size - 4, t);
      break;
    }

    case 'square':
    default:
      ctx.roundRect(x + 1, y + 1, size - 2, size - 2, 3);
      ctx.fill();
      break;
  }
}
