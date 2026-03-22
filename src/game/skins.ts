import { Skin } from './types';

export const SKINS: Skin[] = [
  {
    id: 'neon-blue',
    name: 'Neon Blue',
    head: '#3b82f6',
    body: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.4)',
    trail: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'fire',
    name: 'Fire',
    head: '#f97316',
    body: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.4)',
    trail: 'rgba(249, 115, 22, 0.15)',
  },
  {
    id: 'ice',
    name: 'Ice',
    head: '#06b6d4',
    body: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.4)',
    trail: 'rgba(6, 182, 212, 0.15)',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    head: '#10b981',
    body: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)',
    trail: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'gold',
    name: 'Gold',
    head: '#eab308',
    body: '#ca8a04',
    glow: 'rgba(234, 179, 8, 0.4)',
    trail: 'rgba(234, 179, 8, 0.15)',
  },
  {
    id: 'rose',
    name: 'Rose',
    head: '#f43f5e',
    body: '#e11d48',
    glow: 'rgba(244, 63, 94, 0.4)',
    trail: 'rgba(244, 63, 94, 0.15)',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    head: '#a1a1aa',
    body: '#71717a',
    glow: 'rgba(161, 161, 170, 0.3)',
    trail: 'rgba(161, 161, 170, 0.1)',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    head: '#a855f7',
    body: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.4)',
    trail: 'rgba(168, 85, 247, 0.15)',
  },
];

export function getSkin(id: string): Skin {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}
