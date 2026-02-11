
import React, { useState, useEffect, useMemo } from 'react';
import { User, Sticker, Collection } from '../types';
import { storageService } from '../services/storageService';
import { dataService } from '../services/dataService';
import { Layers, ArrowRight, Loader2, UserPlus, Users, User as UserIcon, X, Clock, Lock, KeyRound, Shield, AlertTriangle, Download, ArrowLeftRight, LogIn, Mail, Sparkles, Trophy, Megaphone } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  isInstallable: boolean;
  onInstall: () => void;
}

interface LeaderboardEntry {
    username: string;
    score: number;
    avatar: string;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, isInstallable, onInstall }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'PENDING_APPROVAL'>('LOGIN');
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  
  // Data States for Leaderboard & News
  const [loginNews, setLoginNews] = useState('');
  const [topPercent, setTopPercent] = useState<LeaderboardEntry[]>([]);
  const [topRepeats, setTopRepeats] = useState<LeaderboardEntry[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<'PERCENT' | 'REPEATS'>('PERCENT');

  useEffect(() => {
    const initAuth = async () => {
      setSyncing(true);
      setConnectionError(false);
      try {
        const { stickers, loginMessage } = await dataService.fetchCatalog();
        
        // 1. Set News
        if (loginMessage) {
            setLoginNews(loginMessage);
            localStorage.setItem('adrenalyn26_login_msg', loginMessage);
        } else {
            setLoginNews(localStorage.getItem('adrenalyn26_login_msg') || '¡Bienvenido a la colección!');
        }

        // 2. Calculate Leaderboards
        const allUsers = storageService.getAllUsers();
        const totalStickers = stickers.length || 1; // avoid division by zero

        const percentStats: LeaderboardEntry[] = [];
        const repeatStats: LeaderboardEntry[] = [];

        allUsers.forEach(u => {
            if (!u.isAuthorized) return;
            const coll = storageService.getCollection(u.id);
            const owned = Object.keys(coll).length;
            const percentage = Math.round((owned / totalStickers) * 100);
            
            const repeats = Object.values(coll).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);

            percentStats.push({ username: u.username, score: percentage, avatar: u.username.substring(0,2).toUpperCase() });
            repeatStats.push({ username: u.username, score: repeats, avatar: u.username.substring(0,2).toUpperCase() });
        });

        setTopPercent(percentStats.sort((a,b) => b.score - a.score).slice(0, 3));
        setTopRepeats(repeatStats.sort((a,b) => b.score - a.score).slice(0, 3));

        const lastUser = storageService.getLastUser();
        if (lastUser) setUsername(lastUser);

      } catch (err) {
        setConnectionError(true);
      } finally {
        setSyncing(false);
      }
    };
    initAuth();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        if (!username || !email) throw new Error("Todos los campos son obligatorios");
        await storageService.register(username, email);
        setView('PENDING_APPROVAL');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        if (!username || !password) throw new Error("Rellena todos los campos");
        const user = await storageService.login(username, password);
        onLogin(user);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  if (view === 'PENDING_APPROVAL') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617]">
        <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
            <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Solicitud Enviada</h2>
          <p className="text-slate-400 mb-8 leading-relaxed text-sm">Tu cuenta ha sido registrada pero debe ser aprobada por el administrador antes de poder entrar.</p>
          <button onClick={() => setView('LOGIN')} className="w-full bg-white text-black font-black py-4 rounded-2xl transition shadow-lg uppercase tracking-widest text-sm italic">Entendido</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#020617]">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px] -z-10"></div>
      
      {isInstallable && (
        <button onClick={onInstall} className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-bold text-[10px] uppercase border border-white/20 animate-pulse z-20 hover:bg-blue-500 transition">
          <Download className="w-3.5 h-3.5" /> Instalar App
        </button>
      )}

      <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
         <h2 className="text-6xl font-black text-white tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(0,243,255,0.4)] italic">CROMO<span className="text-neon-blue">CHÉ</span></h2>
         <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Gestor de Colecciones v.26</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl items-start">
          
          {/* LOGIN FORM */}
          <div className="w-full md:flex-1 bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative order-2 md:order-1">
            {syncing && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-[2.5rem] z-10 flex items-center justify-center flex-col gap-3">
                <Loader2 className="w-10 h-10 text-neon-blue animate-spin" />
                <span className="text-[10px] font-bold text-neon-blue uppercase tracking-widest animate-pulse">Sincronizando...</span>
              </div>
            )}

            {view === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-500">
                <div className="mb-8 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Acceso Coleccionista</h3>
                  {storageService.getLastUser() && (
                    <p className="text-neon-blue text-[10px] font-black uppercase tracking-widest animate-pulse">¡Bienvenido de nuevo!</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="Usuario" 
                      className="w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Contraseña" 
                      className="w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-[11px] font-bold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-neon-blue hover:bg-cyan-300 text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-sm italic"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <LogIn className="w-5 h-5" />}
                  {loading ? 'Entrando...' : 'Entrar al Álbum'}
                </button>

                <div className="pt-4 text-center">
                  <button 
                    type="button" 
                    onClick={() => { setView('REGISTER'); setError(null); }}
                    className="text-slate-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors"
                  >
                    ¿No tienes cuenta? <span className="text-neon-blue">Regístrate</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-500">
                <div className="mb-8 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Nueva Cuenta</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Únete a la comunidad</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="Nombre de Usuario" 
                      className="w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="Correo Electrónico" 
                      className="w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                    />
                  </div>
                </div>

                {error && <p className="text-red-400 text-[11px] font-bold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-white hover:bg-slate-200 text-black font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-sm italic"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <UserPlus className="w-5 h-5" />}
                  {loading ? 'Registrando...' : 'Solicitar Registro'}
                </button>

                <div className="pt-4 text-center">
                  <button 
                    type="button" 
                    onClick={() => { setView('LOGIN'); setError(null); }}
                    className="text-slate-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors"
                  >
                    Volver al <span className="text-neon-blue">Inicio de Sesión</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* NEWS & LEADERBOARD COLUMN */}
          <div className="w-full md:w-80 flex flex-col gap-4 order-1 md:order-2">
              
              {/* NEWS BOX */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-neon-pink/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(255,0,85,0.1)] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-neon-pink shadow-[0_0_10px_#ff0055]"></div>
                  <div className="flex items-center gap-2 mb-3">
                      <Megaphone className="w-5 h-5 text-neon-pink animate-pulse" />
                      <h4 className="text-white font-bold text-sm uppercase tracking-wide">Novedades</h4>
                  </div>
                  <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                      {loginNews || "Cargando novedades..."}
                  </div>
              </div>

              {/* LEADERBOARD */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex flex-col">
                  <div className="flex border-b border-white/5">
                      <button 
                        onClick={() => setLeaderboardTab('PERCENT')} 
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${leaderboardTab === 'PERCENT' ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'}`}
                      >
                        Top Colección
                      </button>
                      <button 
                        onClick={() => setLeaderboardTab('REPEATS')} 
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${leaderboardTab === 'REPEATS' ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'}`}
                      >
                        Top Repetidos
                      </button>
                  </div>
                  
                  <div className="p-4 space-y-3">
                      {(leaderboardTab === 'PERCENT' ? topPercent : topRepeats).map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black border-2 border-slate-900 shadow-lg shrink-0 ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700'}`}>
                                  {idx + 1}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                  {entry.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-white truncate">{entry.username}</div>
                              </div>
                              <div className={`text-xs font-black ${leaderboardTab === 'PERCENT' ? 'text-neon-blue' : 'text-neon-purple'}`}>
                                  {entry.score}{leaderboardTab === 'PERCENT' ? '%' : ''}
                              </div>
                          </div>
                      ))}
                      {topPercent.length === 0 && <div className="text-center text-[10px] text-slate-500 py-4">Sin datos aún</div>}
                  </div>
              </div>
          </div>
      </div>
      
      {connectionError && <p className="mt-8 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Error de sincronización con la nube</p>}
    </div>
  );
};
