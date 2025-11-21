export enum GameState {
  AUTH = 'AUTH',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD',
  SKINS = 'SKINS',
  ACHIEVEMENTS = 'ACHIEVEMENTS'
}

export interface User {
  email: string;
  nickname: string;
  passwordHash: string; // Simulating security
  highScore: number;
  coins: number;
  unlockedSkins: string[];
  selectedSkin: string;
  achievements: string[];
  gamesPlayed: number;
}

export interface Skin {
  id: string;
  name: string;
  color: string;
  price: number;
  description: string;
  gradient: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: (user: User, currentScore: number) => boolean;
  reward: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  date: string;
}