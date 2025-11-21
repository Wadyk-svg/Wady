import { User, LeaderboardEntry } from '../types';

const USERS_KEY = 'neon_snake_users';
const CURRENT_USER_KEY = 'neon_snake_current_user';
const LEADERBOARD_KEY = 'neon_snake_leaderboard';

export const StorageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateLeaderboard: (nickname: string, score: number) => {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    let leaderboard: LeaderboardEntry[] = data ? JSON.parse(data) : [];
    
    leaderboard.push({
      nickname,
      score,
      date: new Date().toISOString()
    });

    // Sort by score desc and keep top 50
    leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 50);
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  },

  getLeaderboard: (): LeaderboardEntry[] => {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  }
};