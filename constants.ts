import { Achievement, Skin, User } from './types';

export const GRID_SIZE = 20;
export const GAME_SPEED_START = 120;

export const SKINS: Skin[] = [
  {
    id: 'classic',
    name: 'Classic Green',
    color: '#39ff14',
    price: 0,
    description: 'Класичний неоновий стиль.',
    gradient: ['#39ff14', '#184f0d']
  },
  {
    id: 'plasma',
    name: 'Plasma Pink',
    color: '#ff00ff',
    price: 50,
    description: 'Гаряча плазма.',
    gradient: ['#ff00ff', '#800080']
  },
  {
    id: 'cyber',
    name: 'Cyber Blue',
    color: '#00ffff',
    price: 100,
    description: 'Холодний кібер-лід.',
    gradient: ['#00ffff', '#008b8b']
  },
  {
    id: 'gold',
    name: 'Luxury Gold',
    color: '#ffd700',
    price: 500,
    description: 'Для еліти.',
    gradient: ['#ffd700', '#b8860b']
  },
  {
    id: 'void',
    name: 'Void Walker',
    color: '#9400d3',
    price: 1000,
    description: 'Темна матерія.',
    gradient: ['#9400d3', '#4b0082']
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'beginner',
    title: 'Новачок',
    description: 'Наберіть 10 очок',
    condition: (user, score) => score >= 10,
    reward: 10
  },
  {
    id: 'pro',
    title: 'Професіонал',
    description: 'Наберіть 50 очок',
    condition: (user, score) => score >= 50,
    reward: 50
  },
  {
    id: 'master',
    title: 'Легенда',
    description: 'Наберіть 100 очок',
    condition: (user, score) => score >= 100,
    reward: 200
  },
  {
    id: 'rich',
    title: 'Багатій',
    description: 'Зберіть 500 монет',
    condition: (user) => user.coins >= 500,
    reward: 100
  },
  {
    id: 'addict',
    title: 'Залежний',
    description: 'Зіграйте 20 ігор',
    condition: (user) => user.gamesPlayed >= 20,
    reward: 100
  }
];