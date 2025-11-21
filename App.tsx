import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, User, Direction, Coordinate, Skin } from './types';
import { SKINS, ACHIEVEMENTS, GRID_SIZE, GAME_SPEED_START } from './constants';
import { StorageService } from './services/storageService';
import { generateGameOverComment } from './services/geminiService';
import { Button } from './components/Button';
import { Input } from './components/Input';

// --- SUB-COMPONENTS (Defined here for single-file structure as requested, but logically separate) ---

// 1. AUTH SCREEN
const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = StorageService.getUsers();

    if (isLogin) {
      const user = users.find(u => u.email === email && u.passwordHash === password);
      if (user) {
        onLogin(user);
      } else {
        setError('Невірний email або пароль');
      }
    } else {
      if (users.find(u => u.email === email)) {
        setError('Цей email вже зареєстрований');
        return;
      }
      if (!nickname || !email || !password) {
        setError('Заповніть усі поля');
        return;
      }
      const newUser: User = {
        email,
        passwordHash: password,
        nickname,
        highScore: 0,
        coins: 0,
        unlockedSkins: ['classic'],
        selectedSkin: 'classic',
        achievements: [],
        gamesPlayed: 0
      };
      StorageService.saveUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md p-8 bg-black/60 border border-neon-purple shadow-[0_0_50px_rgba(188,19,254,0.3)] rounded-lg">
        <h1 className="text-4xl font-display text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-blue animate-pulse-slow">
          NEON SNAKE
        </h1>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <Input label="Нікнейм" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="CyberSnake99" />
          )}
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="neo@matrix.com" />
          <Input label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          
          {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-900/20 p-2 border border-red-500/50 rounded">{error}</p>}
          
          <Button fullWidth type="submit" className="mb-4">
            {isLogin ? 'Увійти' : 'Реєстрація'}
          </Button>
          
          <div className="text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)} 
              className="text-gray-400 hover:text-white text-sm underline decoration-neon-blue decoration-2 underline-offset-4"
            >
              {isLogin ? 'Створити акаунт' : 'Вже є акаунт?'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. MAIN MENU
const MainMenu: React.FC<{ 
  user: User, 
  onNavigate: (state: GameState) => void,
  onLogout: () => void 
}> = ({ user, onNavigate, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neon-dark relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-neon-green rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-neon-purple rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 text-center space-y-8 p-8 max-w-lg w-full">
        <div className="mb-8">
          <h2 className="text-6xl font-display text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SNAKE</h2>
          <p className="text-neon-blue text-xl mt-2 font-light tracking-[0.5em]">EVOLUTION</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-6 rounded border border-white/10 mb-8 flex justify-between items-center">
          <div className="text-left">
            <p className="text-gray-400 text-xs uppercase">Гравець</p>
            <p className="text-xl font-bold text-white">{user.nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs uppercase">Монети</p>
            <p className="text-xl font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]">🪙 {user.coins}</p>
          </div>
        </div>

        <div className="grid gap-4">
          <Button onClick={() => onNavigate(GameState.PLAYING)} className="text-xl py-4">Грати</Button>
          <Button variant="secondary" onClick={() => onNavigate(GameState.SKINS)}>Магазин Скінів</Button>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={() => onNavigate(GameState.LEADERBOARD)}>Рекорди</Button>
            <Button variant="secondary" onClick={() => onNavigate(GameState.ACHIEVEMENTS)}>Досягнення</Button>
          </div>
          <Button variant="danger" onClick={onLogout} className="mt-4">Вийти</Button>
        </div>
      </div>
    </div>
  );
};

// 3. GAME COMPONENT
const Game: React.FC<{ user: User, onGameOver: (score: number) => void, onBack: () => void }> = ({ user, onGameOver, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<Coordinate[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Coordinate>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [isPaused, setIsPaused] = useState(false);
  
  // Helper to get current skin
  const currentSkin = SKINS.find(s => s.id === user.selectedSkin) || SKINS[0];

  // Game Loop Ref
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef<Direction>(Direction.UP); // Ref to prevent rapid key press bug

  const generateFood = useCallback((currentSnake: Coordinate[]) => {
    let newFood;
    let isColliding;
    do {
      newFood = {
        x: Math.floor(Math.random() * (canvasRef.current?.width || 400) / GRID_SIZE),
        y: Math.floor(Math.random() * (canvasRef.current?.height || 400) / GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      isColliding = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    } while (isColliding);
    return newFood;
  }, []);

  const endGame = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    onGameOver(score);
  }, [onGameOver, score]);

  const moveSnake = useCallback(() => {
    if (isPaused) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      
      switch (directionRef.current) {
        case Direction.UP: head.y -= 1; break;
        case Direction.DOWN: head.y += 1; break;
        case Direction.LEFT: head.x -= 1; break;
        case Direction.RIGHT: head.x += 1; break;
      }

      // Check Wall Collision
      const cols = (canvasRef.current?.width || 400) / GRID_SIZE;
      const rows = (canvasRef.current?.height || 400) / GRID_SIZE;

      if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        endGame();
        return prevSnake;
      }

      // Check Self Collision
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check Food
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        setFood(generateFood(newSnake));
        // Don't pop tail -> grow
      } else {
        newSnake.pop(); // Remove tail -> move
      }

      return newSnake;
    });
  }, [food, generateFood, endGame, isPaused]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (directionRef.current !== Direction.DOWN) directionRef.current = Direction.UP; break;
        case 'ArrowDown': if (directionRef.current !== Direction.UP) directionRef.current = Direction.DOWN; break;
        case 'ArrowLeft': if (directionRef.current !== Direction.RIGHT) directionRef.current = Direction.LEFT; break;
        case 'ArrowRight': if (directionRef.current !== Direction.LEFT) directionRef.current = Direction.RIGHT; break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game Loop
  useEffect(() => {
    const speed = Math.max(50, GAME_SPEED_START - (score * 2));
    gameLoopRef.current = setInterval(moveSnake, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, score]);

  // Rendering
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Grid (Subtle)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvasRef.current.width; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasRef.current.height); ctx.stroke();
    }
    for (let i = 0; i <= canvasRef.current.height; i += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasRef.current.width, i); ctx.stroke();
    }

    // Draw Snake
    snake.forEach((segment, index) => {
      // Gradient for body
      const gradient = ctx.createLinearGradient(
        segment.x * GRID_SIZE, segment.y * GRID_SIZE, 
        (segment.x + 1) * GRID_SIZE, (segment.y + 1) * GRID_SIZE
      );
      gradient.addColorStop(0, currentSkin.gradient[0]);
      gradient.addColorStop(1, currentSkin.gradient[1]);
      
      ctx.fillStyle = gradient;

      // Glow effect for head
      if (index === 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = currentSkin.color;
      } else {
        ctx.shadowBlur = 0;
      }

      // Round corners
      const r = GRID_SIZE / 2 - 2;
      const x = segment.x * GRID_SIZE + 1;
      const y = segment.y * GRID_SIZE + 1;
      const w = GRID_SIZE - 2;
      const h = GRID_SIZE - 2;

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, index === 0 ? [5, 5, 5, 5] : [2, 2, 2, 2]);
      ctx.fill();
    });

    // Draw Food (Pulse)
    const time = Date.now() / 200;
    const pulse = Math.sin(time) * 2;
    
    ctx.shadowBlur = 15 + pulse * 2;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0044';
    
    const fx = food.x * GRID_SIZE + GRID_SIZE/2;
    const fy = food.y * GRID_SIZE + GRID_SIZE/2;
    
    ctx.beginPath();
    ctx.arc(fx, fy, (GRID_SIZE/2 - 3) + (pulse/2), 0, Math.PI * 2);
    ctx.fill();

    // Reset Shadow
    ctx.shadowBlur = 0;

  }, [snake, food, currentSkin]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[800px] flex justify-between items-center mb-4 font-display">
        <div className="text-2xl text-white">Score: <span className="text-neon-green">{score}</span></div>
        <Button variant="secondary" onClick={onBack} className="text-sm py-1 px-4">Меню</Button>
      </div>
      
      <div className="relative border-4 border-gray-800 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="block bg-[#0a0a0a] max-w-full"
        />
        {isPaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <h2 className="text-4xl font-display text-white animate-pulse">PAUSED</h2>
          </div>
        )}
      </div>
      <p className="text-gray-500 mt-4 text-sm font-mono">Використовуйте стрілки для руху. Пробіл для паузи.</p>
    </div>
  );
};

// 4. LEADERBOARD COMPONENT
const Leaderboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    setRecords(StorageService.getLeaderboard());
  }, []);

  return (
    <div className="min-h-screen bg-neon-dark p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-display text-neon-blue">Таблиця Рекордів</h2>
          <Button onClick={onBack}>Назад</Button>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden backdrop-blur-md">
          <table className="w-full text-left">
            <thead className="bg-black/50 text-neon-green font-display uppercase text-sm">
              <tr>
                <th className="p-4">Ранг</th>
                <th className="p-4">Гравець</th>
                <th className="p-4">Рахунок</th>
                <th className="p-4 text-right">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Ще немає рекордів. Стань першим!</td></tr>
              ) : (
                records.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-gray-400">#{idx + 1}</td>
                    <td className="p-4 font-bold text-white">{rec.nickname}</td>
                    <td className="p-4 text-neon-purple font-bold text-xl">{rec.score}</td>
                    <td className="p-4 text-right text-gray-500 text-xs">{new Date(rec.date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 5. SKINS SHOP COMPONENT
const SkinsShop: React.FC<{ user: User, onUpdateUser: (u: User) => void, onBack: () => void }> = ({ user, onUpdateUser, onBack }) => {
  const handleBuy = (skinId: string, price: number) => {
    if (user.coins >= price && !user.unlockedSkins.includes(skinId)) {
      const updatedUser = {
        ...user,
        coins: user.coins - price,
        unlockedSkins: [...user.unlockedSkins, skinId]
      };
      StorageService.saveUser(updatedUser);
      onUpdateUser(updatedUser);
    }
  };

  const handleSelect = (skinId: string) => {
    if (user.unlockedSkins.includes(skinId)) {
      const updatedUser = { ...user, selectedSkin: skinId };
      StorageService.saveUser(updatedUser);
      onUpdateUser(updatedUser);
    }
  };

  return (
    <div className="min-h-screen bg-neon-dark p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-display text-neon-pink">Магазин Скінів</h2>
          <div className="flex items-center gap-4">
            <div className="text-yellow-400 font-bold text-xl bg-black/50 px-4 py-2 rounded border border-yellow-500/30">
              🪙 {user.coins}
            </div>
            <Button onClick={onBack}>Назад</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKINS.map(skin => {
            const isUnlocked = user.unlockedSkins.includes(skin.id);
            const isSelected = user.selectedSkin === skin.id;

            return (
              <div key={skin.id} className={`relative p-6 rounded-lg border-2 transition-all duration-300 overflow-hidden group
                ${isSelected ? 'border-neon-green bg-neon-green/5 shadow-[0_0_20px_rgba(57,255,20,0.2)]' : 'border-gray-700 bg-black/40 hover:border-gray-500'}
              `}>
                <div className="h-24 mb-4 rounded flex items-center justify-center bg-black/50 border border-white/5 relative">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-6 h-6 rounded-sm shadow-lg" style={{ 
                        background: `linear-gradient(135deg, ${skin.gradient[0]}, ${skin.gradient[1]})`,
                        opacity: 1 - (i * 0.2)
                      }}></div>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{skin.name}</h3>
                <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{skin.description}</p>

                {isUnlocked ? (
                  <Button 
                    fullWidth 
                    variant={isSelected ? 'primary' : 'secondary'}
                    onClick={() => handleSelect(skin.id)}
                    disabled={isSelected}
                  >
                    {isSelected ? 'Вибрано' : 'Вибрати'}
                  </Button>
                ) : (
                  <Button 
                    fullWidth 
                    variant="danger"
                    onClick={() => handleBuy(skin.id, skin.price)}
                    disabled={user.coins < skin.price}
                  >
                    Купити {skin.price} 🪙
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 6. ACHIEVEMENTS COMPONENT
const AchievementsScreen: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  return (
    <div className="min-h-screen bg-neon-dark p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-display text-white">Досягнення</h2>
          <Button onClick={onBack}>Назад</Button>
        </div>

        <div className="space-y-4">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = user.achievements.includes(ach.id);
            return (
              <div key={ach.id} className={`p-4 rounded-lg border flex justify-between items-center transition-all
                ${isUnlocked 
                  ? 'bg-neon-green/10 border-neon-green shadow-[0_0_10px_rgba(57,255,20,0.1)]' 
                  : 'bg-white/5 border-gray-800 opacity-60 grayscale'
                }
              `}>
                <div>
                  <h3 className={`font-bold text-lg ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>{ach.title}</h3>
                  <p className="text-sm text-gray-400">{ach.description}</p>
                </div>
                <div className="text-right">
                  <span className="block text-xs uppercase tracking-widest text-gray-500">Нагорода</span>
                  <span className="text-yellow-400 font-bold">+{ach.reward} 🪙</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 7. GAME OVER MODAL
const GameOverModal: React.FC<{ 
  score: number, 
  comment: string, 
  coinsEarned: number,
  onRetry: () => void, 
  onMenu: () => void 
}> = ({ score, comment, coinsEarned, onRetry, onMenu }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-[#0f0f0f] border-2 border-red-600 p-8 rounded-lg max-w-md w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.4)] transform animate-in fade-in zoom-in duration-300">
        <h2 className="text-5xl font-display text-red-600 mb-2 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">GAME OVER</h2>
        
        <div className="py-6">
          <div className="text-gray-400 text-sm uppercase tracking-widest mb-1">Рахунок</div>
          <div className="text-6xl font-bold text-white mb-4">{score}</div>
          
          <div className="text-yellow-400 font-bold mb-6 flex justify-center items-center gap-2">
            <span>+{coinsEarned}</span> <span>🪙 отримано</span>
          </div>

          <div className="bg-white/5 p-4 rounded border border-white/10 mb-6">
            <p className="text-gray-300 italic">"{comment}"</p>
            <p className="text-xs text-gray-500 text-right mt-2">- AI Snake God</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={onRetry}>Знову</Button>
          <Button variant="secondary" onClick={onMenu}>Меню</Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.AUTH);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastGameScore, setLastGameScore] = useState(0);
  const [lastGameComment, setLastGameComment] = useState('');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on load
  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setGameState(GameState.MENU);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    StorageService.saveUser(user);
    setGameState(GameState.MENU);
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setGameState(GameState.AUTH);
  };

  const handleGameOver = async (score: number) => {
    if (!currentUser) return;

    // Calculate coins (1 point = 1 coin, just for example)
    const coins = score;
    
    // Check Achievements
    let newCoins = coins;
    const newAchievements: string[] = [];
    
    ACHIEVEMENTS.forEach(ach => {
      if (!currentUser.achievements.includes(ach.id) && ach.condition(currentUser, score)) {
        newAchievements.push(ach.id);
        newCoins += ach.reward;
      }
    });

    // Update User Stats
    const updatedUser: User = {
      ...currentUser,
      coins: currentUser.coins + newCoins,
      highScore: Math.max(currentUser.highScore, score),
      gamesPlayed: currentUser.gamesPlayed + 1,
      achievements: [...currentUser.achievements, ...newAchievements]
    };

    StorageService.saveUser(updatedUser);
    StorageService.updateLeaderboard(updatedUser.nickname, Math.max(updatedUser.highScore, score));
    setCurrentUser(updatedUser);

    // Get AI Comment
    const comment = await generateGameOverComment(score, currentUser.nickname);
    
    setLastGameScore(score);
    setCoinsEarned(newCoins);
    setLastGameComment(comment);
    setGameState(GameState.GAME_OVER);
  };

  if (isLoading) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="text-white selection:bg-neon-green selection:text-black">
      {gameState === GameState.AUTH && (
        <AuthScreen onLogin={handleLogin} />
      )}

      {gameState === GameState.MENU && currentUser && (
        <MainMenu 
          user={currentUser} 
          onNavigate={setGameState} 
          onLogout={handleLogout} 
        />
      )}

      {gameState === GameState.PLAYING && currentUser && (
        <Game 
          user={currentUser}
          onGameOver={handleGameOver}
          onBack={() => setGameState(GameState.MENU)}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverModal 
          score={lastGameScore} 
          comment={lastGameComment}
          coinsEarned={coinsEarned}
          onRetry={() => setGameState(GameState.PLAYING)} 
          onMenu={() => setGameState(GameState.MENU)} 
        />
      )}

      {gameState === GameState.LEADERBOARD && (
        <Leaderboard onBack={() => setGameState(GameState.MENU)} />
      )}

      {gameState === GameState.SKINS && currentUser && (
        <SkinsShop 
          user={currentUser} 
          onUpdateUser={setCurrentUser} 
          onBack={() => setGameState(GameState.MENU)} 
        />
      )}

      {gameState === GameState.ACHIEVEMENTS && currentUser && (
        <AchievementsScreen 
          user={currentUser} 
          onBack={() => setGameState(GameState.MENU)} 
        />
      )}
    </div>
  );
};

export default App;