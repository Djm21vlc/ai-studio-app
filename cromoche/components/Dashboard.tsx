
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Collection, Sticker, Trade, Team, SystemMessage } from '../types';
import { StickerItem } from './StickerItem';
import { storageService } from '../services/storageService';
import { dataService } from '../services/dataService';
import { Search, Settings, Loader2, ArrowLeftRight, ChevronDown, Layers, Sparkles, ChevronLeft, Trophy, Grid, Zap, Gem, Shield, Users, Lock } from 'lucide-react';
import { AIChat } from './AIChat';
import { SettingsModal } from './SettingsModal';
import { TradeHub } from './TradeHub';
import { StickerZoomModal } from './StickerZoomModal';
import { OpportunityModal } from './OpportunityModal';
import { MessageModal } from './MessageModal';
import { TEAM_COLORS, TEAM_LOGOS } from '../constants';

const TeamShield = ({ teamName, dynamicLogos, logoFromSheet }: { teamName: string, dynamicLogos: Record<string, string>, logoFromSheet?: string }) => {
  const lowerName = teamName.toLowerCase().trim();
  let logoUrl = logoFromSheet || '';
  if (!logoUrl) {
    for (const [key, url] of Object.entries(dynamicLogos)) {
        if (lowerName.includes(key) || key.includes(lowerName)) { logoUrl = url; break; }
    }
  }
  if (!logoUrl) {
      for (const [key, url] of Object.entries(TEAM_LOGOS)) {
        if (lowerName.includes(key)) { logoUrl = url; break; }
      }
  }
  let colors = TEAM_COLORS['default'];
  for (const [key, value] of Object.entries(TEAM_COLORS)) {
    if (lowerName.includes(key)) { colors = value; break; }
  }
  if (logoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 transition-transform group-hover:scale-110 relative z-10">
        <img src={logoUrl} alt={teamName} className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300" />
      </div>
    );
  }
  return (
    <div className="w-full h-full relative flex items-center justify-center drop-shadow-lg group-hover:scale-110 transition-transform z-10">
       <Shield className="w-3/4 h-3/4" style={{ fill: colors.primary, color: colors.secondary }} />
       <span className="absolute text-[12px] font-black text-white mix-blend-difference uppercase tracking-tighter">{teamName.substring(0,3)}</span>
    </div>
  );
};

const CircularProgress = React.memo(({ percentage, color, size = 'sm' }: { percentage: number; color: string, size?: 'sm' | 'lg' }) => {
    const radius = size === 'sm' ? 14 : 32;
    const stroke = size === 'sm' ? 3 : 6;
    const center = size === 'sm' ? 18 : 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
        <div className={`relative flex items-center justify-center ${size === 'sm' ? 'w-9 h-9' : 'w-20 h-20'} z-20`}>
            <svg className={`transform -rotate-90 ${size === 'sm' ? 'w-9 h-9' : 'w-20 h-20'}`}>
                <circle className="text-white/10" strokeWidth={stroke} stroke="currentColor" fill="transparent" r={radius} cx={center} cy={center} />
                <circle className="transition-all duration-1000 ease-out" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke={color} fill="transparent" r={radius} cx={center} cy={center} />
            </svg>
            <span className={`absolute font-black text-white ${size === 'sm' ? 'text-[8px]' : 'text-sm'}`}>{Math.round(percentage)}%</span>
        </div>
    );
});

const getCategoryTheme = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('oro') || n.includes('gold') || n.includes('balón') || n.includes('invencible')) {
    return { bg: 'bg-gradient-to-br from-amber-950 via-black to-slate-950', border: 'border-amber-500/40 group-hover:border-amber-400', text: 'text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700', shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]', glow: 'bg-amber-500/15', hex: '#f59e0b' };
  }
  if (n.includes('kriptonita') || n.includes('energy') || n.includes('energía') || n.includes('mitos') || n.includes('fuerza')) {
    return { bg: 'bg-gradient-to-br from-emerald-950 via-black to-slate-950', border: 'border-emerald-400/40 group-hover:border-emerald-300', text: 'text-transparent bg-clip-text bg-gradient-to-b from-emerald-100 via-emerald-400 to-emerald-700', shadow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]', glow: 'bg-emerald-500/15', hex: '#10b981' };
  }
  if (n.includes('diamante') || n.includes('diamond') || n.includes('blindados')) {
    return { bg: 'bg-gradient-to-br from-cyan-950 via-black to-slate-950', border: 'border-cyan-400/40 group-hover:border-cyan-300', text: 'text-transparent bg-clip-text bg-gradient-to-b from-cyan-100 via-cyan-400 to-blue-700', shadow: 'shadow-[0_0_40_rgba(34,211,238,0.2)]', glow: 'bg-cyan-500/15', hex: '#22d3ee' };
  }
  if (n.includes('imparables') || n.includes('fuego') || n.includes('red') || n.includes('diabólicos') || n.includes('volcánico')) {
    return { bg: 'bg-gradient-to-br from-red-950 via-black to-slate-950', border: 'border-red-500/40 group-hover:border-red-400', text: 'text-transparent bg-clip-text bg-gradient-to-b from-red-100 via-red-400 to-red-800', shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.2)]', glow: 'bg-red-500/15', hex: '#ef4444' };
  }
  if (n.includes('super') || n.includes('crack') || n.includes('master') || n.includes('premium')) {
    return { bg: 'bg-gradient-to-br from-violet-950 via-black to-slate-950', border: 'border-violet-500/40 group-hover:border-violet-400', text: 'text-transparent bg-clip-text bg-gradient-to-b from-violet-100 via-violet-400 to-purple-800', shadow: 'shadow-[0_0_40px_rgba(139,92,246,0.2)]', glow: 'bg-violet-500/15', hex: '#8b5cf6' };
  }
  return { bg: 'bg-gradient-to-br from-blue-950 via-black to-slate-950', border: 'border-blue-500/40 group-hover:border-blue-400', text: 'text-transparent bg-clip-text bg-gradient-to-b from-blue-100 via-blue-400 to-indigo-700', shadow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]', glow: 'bg-blue-500/10', hex: '#3b82f6' };
};

// Helper function to get team primary color outside the component
const getTeamPrimaryColor = (teamName: string) => {
    const lowerName = teamName.toLowerCase();
    for (const [key, value] of Object.entries(TEAM_COLORS)) {
        if (lowerName.includes(key)) return value.primary;
    }
    return '#334155'; // default slate-700
};

interface CategoryCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  total: number;
  owned: number;
  gradient: string;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, subtitle, icon, total, owned, gradient, onClick }) => {
  const percentage = total > 0 ? Math.round((owned / total) * 100) : 0;
  return (
    <button onClick={onClick} className={`relative p-6 rounded-3xl overflow-hidden text-left w-full group transition-all duration-300 hover:scale-[1.02] shadow-xl border border-white/10 ${gradient}`}>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
           <div className="p-3 bg-black/20 backdrop-blur-xl rounded-2xl text-white shadow-inner border border-white/10">{icon}</div>
           <div className="text-right"><span className="block text-4xl font-black text-white tracking-tighter drop-shadow-lg">{percentage}%</span></div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-0.5">{title}</h3>
          <p className="text-white/70 text-[10px] font-medium mb-4 uppercase tracking-widest">{subtitle}</p>
          <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
            <div className="h-full rounded-full bg-white transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
          </div>
          <div className="mt-3 text-[10px] text-white/50 font-bold uppercase tracking-wider flex justify-between">
            <span>{owned} adquiridos</span>
            <span>{total} total</span>
          </div>
        </div>
      </div>
    </button>
  );
};

interface DashboardProps {
  user: User;
  onLogout: () => void;
  isInstallable: boolean;
  onInstall: () => void;
}

type DashboardView = 'HOME' | 'BASICS' | 'SPECIALS';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, isInstallable, onInstall }) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [collection, setCollection] = useState<Collection>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [teamsData, setTeamsData] = useState<Team[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('HOME');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [dynamicLogos, setDynamicLogos] = useState<Record<string, string>>({});
  const [zoomedSticker, setZoomedSticker] = useState<Sticker | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [globalRepeats, setGlobalRepeats] = useState(0);
  
  // Messaging
  const [pendingMessages, setPendingMessages] = useState<SystemMessage[]>([]);
  const [activeMessage, setActiveMessage] = useState<SystemMessage | null>(null);

  const canTrade = user.role === 'admin' || user.role === 'coleccionista';

  const loadData = async (background = false) => {
    if (!background && stickers.length === 0) setInitialLoading(true);
    if (background) setIsRefreshing(true);
    try {
      const { stickers: catalog, trades: tradeData, teams: fetchedTeams, messages } = await dataService.fetchCatalog(background);
      setStickers(catalog);
      setTrades(tradeData);
      setTeamsData(fetchedTeams);
      setCollection(storageService.getCollection(user.id));
      
      const allUsers = storageService.getAllUsers();
      setTotalUsers(allUsers.length);
      
      const repeats = allUsers.reduce((acc, u) => {
        const coll = storageService.getCollection(u.id);
        return acc + Object.values(coll).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);
      }, 0);
      setGlobalRepeats(repeats);

      // --- MESSAGE FILTERING LOGIC ---
      const myMessages = messages.filter(m => {
          if (m.read) return false;
          if (m.receiverId === 'ALL') {
              // For broadcast messages, we check localStorage
              const readBroadcasts = JSON.parse(localStorage.getItem('adrenalyn26_read_broadcasts') || '[]');
              return !readBroadcasts.includes(m.id);
          }
          return m.receiverId === user.id;
      });
      setPendingMessages(myMessages);
      if (myMessages.length > 0 && !activeMessage) {
          setActiveMessage(myMessages[0]);
      }
      
      if (!background) {
        dataService.fetchTeamLogos().then(logos => setDynamicLogos(logos));
        if (canTrade) {
            setTimeout(() => setShowOpportunities(true), 1500);
        }
      }
      setLoadError(null);
    } catch (error: any) {
      if (!background) setLoadError("Fallo de Conexión: " + error.message);
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { 
      loadData(false); 
      const interval = setInterval(() => { loadData(true); }, 30000);
      return () => clearInterval(interval);
  }, [user.id]);

  const handleUpdateCount = useCallback((stickerId: string, delta: number) => {
    const newColl = storageService.updateStickerCount(user.id, stickerId, delta);
    setCollection(newColl);
  }, [user.id]);

  const handleBack = () => {
    if (selectedTeam) { setSelectedTeam(null); return; }
    if (selectedCategory) { setSelectedCategory(null); return; }
    setCurrentView('HOME');
  };

  const handleMarkMessageRead = async () => {
      if (!activeMessage) return;
      
      if (activeMessage.receiverId === 'ALL') {
          // Local mark as read for broadcasts
          const readBroadcasts = JSON.parse(localStorage.getItem('adrenalyn26_read_broadcasts') || '[]');
          readBroadcasts.push(activeMessage.id);
          localStorage.setItem('adrenalyn26_read_broadcasts', JSON.stringify(readBroadcasts));
      } else {
          // Server mark as read for direct messages
          await dataService.markMessageAsRead(activeMessage.id);
      }

      // Close modal and verify if there are more
      setActiveMessage(null);
      const remaining = pendingMessages.filter(m => m.id !== activeMessage.id);
      setPendingMessages(remaining);
      if (remaining.length > 0) {
          setTimeout(() => setActiveMessage(remaining[0]), 300);
      }
  };

  const pendingIncomingTrades = useMemo(() => {
    return trades.filter(t => String(t.receiverId).trim().toLowerCase() === String(user.id).trim().toLowerCase() && t.status === 'PENDIENTE').length;
  }, [trades, user.id]);

  const { processedGroups, globalStats, teamGridStats, specialGridStats } = useMemo(() => {
    const basicsAll = stickers.filter(s => !s.isSpecial);
    const specialsAll = stickers.filter(s => s.isSpecial);
    
    const stats = {
      basics: { total: basicsAll.length, owned: basicsAll.filter(s => collection[s.id] > 0).length },
      specials: { total: specialsAll.length, owned: specialsAll.filter(s => collection[s.id] > 0).length }
    };

    const teamStats: Record<string, { total: number, owned: number, name: string, logoUrl?: string, minNumber: number }> = {};
    basicsAll.forEach(s => {
       const tName = s.team;
       if (!teamStats[tName]) {
           const teamInfo = teamsData.find(t => t.name.toLowerCase() === tName.toLowerCase());
           teamStats[tName] = { total: 0, owned: 0, name: tName, logoUrl: teamInfo?.logoUrl, minNumber: s.number };
       }
       teamStats[tName].total++;
       if (collection[s.id] > 0) teamStats[tName].owned++;
       if (s.number < teamStats[tName].minNumber) teamStats[tName].minNumber = s.number;
    });
    const gridStats = Object.values(teamStats).sort((a,b) => a.minNumber - b.minNumber);

    const specialCatStats: Record<string, { total: number, owned: number, name: string, minNumber: number }> = {};
    specialsAll.forEach(s => {
        const catName = s.category || 'Especiales';
        if (!specialCatStats[catName]) {
            specialCatStats[catName] = { total: 0, owned: 0, name: catName, minNumber: s.number };
        }
        specialCatStats[catName].total++;
        if (collection[s.id] > 0) specialCatStats[catName].owned++;
        if (s.number < specialCatStats[catName].minNumber) specialCatStats[catName].minNumber = s.number;
    });
    const specialGrid = Object.values(specialCatStats).sort((a,b) => a.minNumber - b.minNumber);

    let filtered = stickers;
    if (currentView === 'BASICS') {
        filtered = filtered.filter(s => !s.isSpecial);
        if (selectedTeam) filtered = filtered.filter(s => s.team === selectedTeam);
    } else if (currentView === 'SPECIALS') {
        filtered = filtered.filter(s => s.isSpecial);
        if (selectedCategory) filtered = filtered.filter(s => (s.category || 'Especiales') === selectedCategory);
    }

    const groups: Record<string, Sticker[]> = {};
    filtered.forEach(s => {
      let groupKey = currentView === 'SPECIALS' ? s.category || 'Especiales' : s.team;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(s);
    });

    const result = Object.keys(groups).map(key => ({ 
        title: key, 
        items: groups[key].sort((a, b) => a.number - b.number),
        minNumber: Math.min(...groups[key].map(it => it.number))
    })).sort((a,b) => a.minNumber - b.minNumber);

    return { processedGroups: result, globalStats: stats, teamGridStats: gridStats, specialGridStats: specialGrid };
  }, [stickers, collection, currentView, selectedTeam, selectedCategory, teamsData]);

  return (
    <div className="min-h-screen flex flex-col text-slate-200">
      <header className="fixed top-0 w-full z-40 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentView !== 'HOME' ? (
              <button onClick={handleBack} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition"><ChevronLeft className="w-5 h-5" /></button>
            ) : (
              <div className="bg-slate-900 p-2.5 rounded-xl text-neon-blue border border-neon-blue/30"><Grid className="w-6 h-6" /></div>
            )}
            <h1 className="text-xl font-black italic uppercase italic-tracking-tighter">CROMO<span className="text-neon-blue">CHÉ</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 mr-4">
               <div className="text-right">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Comunidad</p>
                  <p className="text-sm font-bold text-white flex items-center justify-end gap-1.5"><Users className="w-3.5 h-3.5 text-neon-blue"/> {totalUsers}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Repetidos</p>
                  <p className="text-sm font-bold text-white flex items-center justify-end gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5 text-neon-purple"/> {globalRepeats}</p>
               </div>
            </div>

            {canTrade ? (
              <>
                <button onClick={() => setShowOpportunities(true)} className="p-3 rounded-full bg-slate-800 border border-white/10 text-neon-blue hover:bg-neon-blue/10 transition" title="Ver Novedades">
                    <Sparkles className="w-5 h-5" />
                </button>

                <button onClick={() => setShowTrade(true)} className="relative p-3 rounded-full bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-lg">
                    <ArrowLeftRight className="w-6 h-6" />
                    {pendingIncomingTrades > 0 && <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-neon-pink text-white text-[10px] font-bold rounded-full border-2 border-black flex items-center justify-center animate-bounce">{pendingIncomingTrades}</span>}
                </button>
              </>
            ) : (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl border border-white/5 text-slate-500" title="Acceso restringido a Coleccionistas">
                    <Lock className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">User</span>
                </div>
            )}
            
            <button onClick={() => setShowSettings(true)} className="p-2.5 text-slate-400 hover:text-white rounded-full transition"><Settings className="w-5 h-5" /></button>

            <button onClick={onLogout} className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-sm font-bold hover:bg-red-500 transition-colors">{user.username.substring(0,2).toUpperCase()}</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 mt-24">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 text-neon-blue animate-spin mb-4" />
            <p className="font-bold text-xs uppercase tracking-widest text-neon-blue">Sincronizando...</p>
          </div>
        ) : (
          <>
            {currentView === 'HOME' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                     <CategoryCard title="Base Deck" subtitle="Equipos LaLiga" icon={<Layers className="w-8 h-8" />} total={globalStats.basics.total} owned={globalStats.basics.owned} gradient="bg-gradient-to-br from-blue-900 via-slate-900 to-black" onClick={() => setCurrentView('BASICS')} />
                     <CategoryCard title="Holo Deck" subtitle="Series Especiales" icon={<Sparkles className="w-8 h-8" />} total={globalStats.specials.total} owned={globalStats.specials.owned} gradient="bg-gradient-to-br from-purple-900 via-slate-900 to-black" onClick={() => setCurrentView('SPECIALS')} />
                  </div>
                  {!canTrade && (
                      <div className="mt-8 p-4 bg-slate-900/50 border border-white/5 rounded-2xl max-w-md mx-auto flex items-center gap-4 text-slate-400">
                          <Lock className="w-5 h-5 text-amber-500/50" />
                          <p className="text-[11px] font-medium leading-relaxed italic">Las funciones de intercambio están reservadas para usuarios con rol <span className="text-neon-blue">Coleccionista</span>. En breves podremos hacerlo.</p>
                      </div>
                  )}
               </div>
            )}
            
            {currentView === 'BASICS' && !selectedTeam && (
               <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 animate-in fade-in">
                  {teamGridStats.map((team) => {
                      const primaryColor = getTeamPrimaryColor(team.name);
                      return (
                          <button key={team.name} onClick={() => setSelectedTeam(team.name)} className="relative aspect-square bg-slate-900/40 rounded-3xl border border-white/5 hover:border-white/40 transition-all flex flex-col items-center justify-center overflow-hidden group hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                             
                             {/* 1. Intense Background Radial Gradient (Hover only) - Mix Blend for neon effect */}
                             <div 
                                className="absolute inset-0 opacity-0 group-hover:opacity-80 transition-opacity duration-700 blur-xl mix-blend-screen"
                                style={{ background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)` }}
                             />
                             
                             {/* 2. Permanent Ambient Glow (Stronger) */}
                             <div 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 opacity-30 blur-2xl group-hover:opacity-50 group-hover:blur-3xl transition-all duration-700"
                                style={{ backgroundColor: primaryColor }}
                             />

                             {/* 3. Central "Spark" (Destello Blanco) */}
                             <div 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                             />

                             <div className="w-3/4 h-3/4 p-2 relative z-10"><TeamShield teamName={team.name} dynamicLogos={dynamicLogos} logoFromSheet={team.logoUrl} /></div>
                             <div className="absolute top-2 right-2 z-20"><CircularProgress percentage={(team.owned/team.total)*100} color="#00f3ff" size="sm" /></div>
                          </button>
                      );
                  })}
               </div>
            )}

            {currentView === 'SPECIALS' && !selectedCategory && (
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in pb-20">
                    {specialGridStats.map((cat) => {
                      const theme = getCategoryTheme(cat.name);
                      const words = cat.name.split(' ');
                      const percentage = Math.round((cat.owned / cat.total) * 100);
                      const maxWordLength = Math.max(...words.map(w => w.length));
                      
                      // LOGIC UPDATED: More granular sizing to prevent overflow
                      let fontSize = 'text-3xl sm:text-4xl';
                      if (maxWordLength > 11) fontSize = 'text-lg sm:text-xl'; // Very long
                      else if (maxWordLength > 8) fontSize = 'text-xl sm:text-2xl'; // Medium long
                      else if (maxWordLength > 6) fontSize = 'text-2xl sm:text-3xl'; // Normal
                      
                      return (
                        <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`relative aspect-square rounded-[2.5rem] border-2 transition-all group flex flex-col items-center justify-center overflow-hidden hover:scale-[1.05] ${theme.bg} ${theme.border} ${theme.shadow}`}>
                           <div className={`absolute w-4/5 h-4/5 rounded-full blur-[50px] opacity-60 ${theme.glow}`}></div>
                           <div className="relative z-10 p-5 text-center w-full">
                               <span className={`block font-black uppercase tracking-tighter italic leading-[0.8] ${theme.text} ${fontSize}`}>
                                {words.map((word, i) => (<span key={i} className="block">{word}</span>))}
                               </span>
                           </div>
                           <div className="absolute bottom-0 left-0 w-full h-8 bg-black/40 backdrop-blur-md flex items-center justify-center border-t border-white/5">
                              <div className="absolute top-0 left-0 h-full bg-white/10 transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: `${theme.hex}20` }}></div>
                              <span className="relative z-10 text-[10px] font-black text-white uppercase tracking-[0.2em]">{percentage}% <span className="opacity-40 ml-1">Completado</span></span>
                              <div className="absolute top-0 left-0 h-[1px] bg-white transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: theme.hex }}></div>
                           </div>
                        </button>
                      );
                    })}
                </div>
            )}

            {((currentView === 'SPECIALS' && selectedCategory) || (currentView === 'BASICS' && selectedTeam)) && (
              <div className="animate-in fade-in pb-20">
                 {processedGroups.map((group) => {
                    const theme = currentView === 'SPECIALS' ? getCategoryTheme(group.title) : { text: 'text-white', hex: '#00f3ff' };
                    return (
                      <div key={group.title} className="mb-10">
                          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-900/60 rounded-2xl border border-white/5 shadow-xl">
                            <div className="w-12 h-12 shrink-0"><TeamShield teamName={group.title} dynamicLogos={dynamicLogos} logoFromSheet={teamsData.find(t=>t.name.toLowerCase()===group.title.toLowerCase())?.logoUrl} /></div>
                            <div>
                              <h2 className={`text-xl font-black italic uppercase ${theme.text}`}>{group.title}</h2>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{group.items.filter(s => collection[s.id]>0).length} / {group.items.length} Cromos</p>
                            </div>
                            <div className="ml-auto"><CircularProgress percentage={(group.items.filter(s => collection[s.id]>0).length/group.items.length)*100} color={theme.hex} /></div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                            {group.items.map(sticker => (
                              <StickerItem key={sticker.id} sticker={sticker} count={collection[sticker.id] || 0} onUpdate={handleUpdateCount} currentUserRole={user.role} onZoom={setZoomedSticker} />
                            ))}
                          </div>
                      </div>
                    );
                 })}
              </div>
            )}
          </>
        )}
      </main>

      {zoomedSticker && <StickerZoomModal sticker={zoomedSticker} onClose={() => setZoomedSticker(null)} />}
      <OpportunityModal isOpen={showOpportunities} onClose={() => setShowOpportunities(false)} onOpenTrade={() => setShowTrade(true)} currentUser={user} allStickers={stickers} />
      {activeMessage && <MessageModal message={activeMessage} onClose={() => setActiveMessage(null)} onMarkRead={handleMarkMessageRead} />}
      <AIChat collection={collection} allStickers={stickers} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onSync={() => loadData(true)} />
      {showTrade && <TradeHub currentUser={user} catalog={stickers} onClose={() => { setShowTrade(false); loadData(true); }} trades={trades} />}
    </div>
  );
};
