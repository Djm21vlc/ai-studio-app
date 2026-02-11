
import React, { useMemo, useState, useEffect } from 'react';
import { User, Sticker, Trade, TradeExpanded, TradeFinalStatus } from '../types';
import { storageService } from '../services/storageService';
import { dataService } from '../services/dataService';
import { ArrowLeftRight, User as UserIcon, CheckCircle, Gift, History, Clock, XCircle, AlertCircle, Handshake, ShieldCheck, X, ChevronRight, Search, Loader2, Send, RefreshCw, HeartHandshake, Sparkles, Layers, MessageSquare, Calendar, AlertTriangle, Filter, Plus, Minus } from 'lucide-react';

interface TradeHubProps {
  currentUser: User;
  catalog: Sticker[];
  trades: Trade[];
  onClose: () => void;
}

type TradeTab = 'NEW_TRADE' | 'ACTIVE' | 'HISTORY';

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
};

export const TradeHub: React.FC<TradeHubProps> = ({ currentUser, catalog, trades: allTrades, onClose }) => {
  const [activeTab, setActiveTab] = useState<TradeTab>('NEW_TRADE');
  const [loading, setLoading] = useState(false);
  
  // --- NEW TRADE STATE ---
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select User, 2: Select Receive (From User), 3: Select Offer (My Repeats)
  
  const [selectedTargetUser, setSelectedTargetUser] = useState<User | null>(null);
  const [selectedReceiveStickers, setSelectedReceiveStickers] = useState<Sticker[]>([]);
  const [selectedOfferStickers, setSelectedOfferStickers] = useState<Sticker[]>([]);
  const [tradeComment, setTradeComment] = useState('');
  
  // Status Management State
  const [actionTradeId, setActionTradeId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'FINALIZE' | 'CANCEL' | 'REJECT' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [finalStatus, setFinalStatus] = useState<TradeFinalStatus>('OK');

  // Refresh users on mount to ensure we have latest data
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setUsers(storageService.getAllUsers());
  }, []);
  
  // Transform raw trades into Expanded objects with arrays of stickers
  const expandedTrades = useMemo(() => {
    const uid = String(currentUser.id).trim().toLowerCase();
    
    return allTrades
      .filter(t => {
        const sid = String(t.senderId).trim().toLowerCase();
        const rid = String(t.receiverId).trim().toLowerCase();
        return sid === uid || rid === uid;
      })
      .map(t => {
        const sender = users.find(u => String(u.id).toLowerCase() === String(t.senderId).toLowerCase());
        const receiver = users.find(u => String(u.id).toLowerCase() === String(t.receiverId).toLowerCase());
        
        // Parsing Comma Separated IDs
        const offIds = t.offeredStickerId.split(',').map(s => s.trim()).filter(Boolean);
        const reqIds = t.requestedStickerId.split(',').map(s => s.trim()).filter(Boolean);

        const offeredStickers = offIds.map(id => catalog.find(s => s.id === id)).filter((s): s is Sticker => !!s);
        const requestedStickers = reqIds.map(id => catalog.find(s => s.id === id)).filter((s): s is Sticker => !!s);

        return { ...t, sender, receiver, offeredStickers, requestedStickers } as TradeExpanded;
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [allTrades, users, catalog, currentUser.id]);

  const activeTrades = expandedTrades.filter(t => t.status === 'PENDIENTE' || t.status === 'ACEPTADA');
  const historyTrades = expandedTrades.filter(t => ['COMPLETADA', 'CANCELADA', 'RECHAZADA', 'CADUCADA'].includes(t.status));
  
  const incomingPendingCount = activeTrades.filter(t => 
    String(t.receiverId).trim().toLowerCase() === String(currentUser.id).trim().toLowerCase() && 
    t.status === 'PENDIENTE'
  ).length;

  // --- LOGIC FOR STEP 1: FIND TARGET USERS ---
  const usersWithMatch = useMemo(() => {
    const myColl = storageService.getCollection(currentUser.id);
    const myMissingIds = new Set(catalog.map(s => s.id).filter(id => !myColl[id]));
    
    const results: { user: User, matchCount: number, availableStickers: Sticker[] }[] = [];

    users.forEach(u => {
        if (u.id === currentUser.id) return;
        const uColl = storageService.getCollection(u.id);
        const uAvailable: Sticker[] = [];

        Object.keys(uColl).forEach(sid => {
            if (uColl[sid] > 1 && myMissingIds.has(sid)) {
                const s = catalog.find(x => x.id === sid);
                if (s) uAvailable.push(s);
            }
        });

        if (uAvailable.length > 0) {
            results.push({ user: u, matchCount: uAvailable.length, availableStickers: uAvailable });
        }
    });

    return results.sort((a,b) => b.matchCount - a.matchCount);
  }, [users, catalog, currentUser]);

  // --- LOGIC FOR STEP 3: MY REPEATED STICKERS ---
  
  // Calculate locked stickers to avoid offering same copy in multiple trades (simple logic: 1 active trade = 1 copy locked)
  const lockedStickersMap = useMemo(() => {
     const map: Record<string, number> = {};
     activeTrades.forEach(t => {
        if (String(t.senderId).toLowerCase() === String(currentUser.id).toLowerCase()) {
            t.offeredStickers.forEach(s => {
                map[s.id] = (map[s.id] || 0) + 1;
            });
        }
     });
     return map;
  }, [activeTrades, currentUser.id]);

  const myRepeatedStickers = useMemo(() => {
    const myColl = storageService.getCollection(currentUser.id);
    return catalog.filter(s => {
        const totalOwned = myColl[s.id] || 0;
        if (totalOwned <= 1) return false;
        const lockedCount = lockedStickersMap[s.id] || 0;
        const availableToTrade = (totalOwned - 1) - lockedCount;
        return availableToTrade > 0;
    });
  }, [currentUser, catalog, lockedStickersMap]);

  // --- ACTIONS ---

  const toggleReceiveSticker = (s: Sticker) => {
      if (selectedReceiveStickers.find(x => x.id === s.id)) {
          setSelectedReceiveStickers(prev => prev.filter(x => x.id !== s.id));
      } else {
          setSelectedReceiveStickers(prev => [...prev, s]);
      }
  };

  const toggleOfferSticker = (s: Sticker) => {
      if (selectedOfferStickers.find(x => x.id === s.id)) {
          setSelectedOfferStickers(prev => prev.filter(x => x.id !== s.id));
      } else {
          setSelectedOfferStickers(prev => [...prev, s]);
      }
  };

  const handleSendProposal = async () => {
    if (!selectedTargetUser || selectedOfferStickers.length === 0 || selectedReceiveStickers.length === 0) return;
    
    setLoading(true);
    try {
      await dataService.createTrade({
        senderId: currentUser.id,
        receiverId: selectedTargetUser.id,
        offeredStickerIds: selectedOfferStickers.map(s => s.id),
        requestedStickerIds: selectedReceiveStickers.map(s => s.id),
        senderComment: tradeComment
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error al crear propuesta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async () => {
     if (!actionTradeId || !actionType) return;
     if ((actionType === 'CANCEL' || actionType === 'REJECT') && !actionReason.trim()) return;

     setLoading(true);
     try {
       await dataService.updateTradeStatus(
           actionTradeId, 
           actionType === 'FINALIZE' ? 'ACEPTADA' : (actionType === 'CANCEL' ? 'CANCELADA' : 'RECHAZADA'), 
           currentUser.id, 
           actionType === 'FINALIZE' ? 'finalize' : undefined, 
           actionType === 'FINALIZE' ? finalStatus : undefined, 
           actionReason
       );
       onClose();
     } catch(e) {
       alert("Error actualizando");
     } finally {
       setLoading(false);
     }
  };

  const handleSimpleStatusUpdate = async (tradeId: string, status: string) => {
    setLoading(true);
    try {
      await dataService.updateTradeStatus(tradeId, status, currentUser.id);
      onClose();
    } catch(e) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Helper to render a group of stickers (pile)
  const renderStickerPile = (stickers: Sticker[], label: string) => {
      if (stickers.length === 0) return <div className="text-slate-500 text-xs">Sin cromos</div>;
      
      const main = stickers[0];
      const count = stickers.length;

      return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-28 sm:w-24 sm:h-32 group-hover:scale-105 transition-transform duration-300">
                {/* Back cards for stack effect */}
                {count > 1 && <div className="absolute top-0 left-2 w-full h-full bg-slate-800 rounded-lg border border-white/10 rotate-6 z-0"></div>}
                {count > 2 && <div className="absolute top-0 -left-2 w-full h-full bg-slate-800 rounded-lg border border-white/10 -rotate-6 z-0"></div>}
                
                {/* Main Card */}
                <div className="relative w-full h-full bg-black rounded-lg border border-white/20 shadow-xl overflow-hidden z-10">
                    <div className="absolute top-1 left-1 z-10 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur border border-white/10">
                        #{main.displayNumber}
                    </div>
                    {main.imageUrl ? (
                        <img src={main.imageUrl} className="w-full h-full object-cover opacity-90" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-[9px]">Sin Img</div>
                    )}
                    {count > 1 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 backdrop-blur-[1px]">
                            <span className="text-xl font-black text-white drop-shadow-lg">+{count - 1}</span>
                        </div>
                    )}
                </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{label}</span>
            <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm font-bold text-white leading-tight px-1 text-center line-clamp-1">{main.name}</span>
                {count > 1 && <span className="text-[10px] text-slate-400 italic">y {count - 1} más...</span>}
            </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#020617]/95 backdrop-blur-xl overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#020617]/80 backdrop-blur-lg z-20 py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative group">
               <div className="absolute inset-0 bg-neon-purple blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
               <div className="bg-slate-900 border border-neon-purple/30 p-2 rounded-xl text-neon-purple relative">
                 <ArrowLeftRight className="w-6 h-6" />
               </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Zona de Cambios</h2>
              <p className="text-slate-400 text-xs sm:text-sm font-mono tracking-wider">MERCADO CENTRAL P2P</p>
            </div>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 border border-white/10 text-slate-300 font-bold rounded-lg hover:bg-slate-800 hover:text-white transition">
            Volver
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 w-full sm:w-fit overflow-x-auto">
            <button onClick={() => setActiveTab('NEW_TRADE')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition uppercase tracking-wide ${activeTab === 'NEW_TRADE' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>Nuevo Cambio</button>
            <button onClick={() => setActiveTab('ACTIVE')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'ACTIVE' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.4)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                Activos 
                {incomingPendingCount > 0 && <span className="bg-neon-pink text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-lg">{incomingPendingCount}</span>}
                {incomingPendingCount === 0 && activeTrades.length > 0 && <span className="bg-black/30 border border-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeTrades.length}</span>}
            </button>
            <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition uppercase tracking-wide flex items-center justify-center gap-2 ${activeTab === 'HISTORY' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                Historial
            </button>
        </div>

        {/* --- NEW TRADE WIZARD --- */}
        {activeTab === 'NEW_TRADE' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 pb-24">
                {/* Steps Indicator */}
                <div className="flex items-center gap-2 sm:gap-4 mb-6 text-xs sm:text-sm font-bold text-slate-500 overflow-x-auto pb-2">
                   <div className={`flex items-center gap-2 shrink-0 ${step === 1 ? 'text-neon-blue' : ''}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${step === 1 ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'border-slate-700 bg-slate-800'}`}>1</span>
                      ELEGIR USUARIO
                   </div>
                   <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
                   <div className={`flex items-center gap-2 shrink-0 ${step === 2 ? 'text-neon-blue' : ''}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${step === 2 ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'border-slate-700 bg-slate-800'}`}>2</span>
                      RECIBIR
                   </div>
                   <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
                   <div className={`flex items-center gap-2 shrink-0 ${step === 3 ? 'text-neon-blue' : ''}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${step === 3 ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'border-slate-700 bg-slate-800'}`}>3</span>
                      TU OFERTA
                   </div>
                </div>

                {/* STEP 1: SELECT USER */}
                {step === 1 && (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-neon-blue"/> ¿Con quién quieres cambiar?</h3>
                        <p className="text-xs text-slate-400 mb-6">Estos usuarios tienen cromos que te faltan y están repetidos para ellos.</p>
                        
                        {usersWithMatch.length === 0 ? (
                             <div className="p-8 bg-slate-900/50 rounded-2xl text-center border border-white/5">
                                 <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                 <p className="text-slate-400">Nadie tiene cromos repetidos que te falten.</p>
                             </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {usersWithMatch.map((match) => (
                                    <button 
                                        key={match.user.id} 
                                        onClick={() => { setSelectedTargetUser(match.user); setStep(2); setSelectedReceiveStickers([]); setSelectedOfferStickers([]); }}
                                        className="p-4 bg-slate-900/60 hover:bg-slate-800 border border-white/10 hover:border-neon-blue/50 rounded-xl flex items-center justify-between group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10">{match.user.username.substring(0,2).toUpperCase()}</div>
                                            <div className="text-left">
                                                <div className="font-bold text-white group-hover:text-neon-blue transition">{match.user.username}</div>
                                                <div className="text-[10px] text-slate-500">Último acceso reciente</div>
                                            </div>
                                        </div>
                                        <div className="bg-neon-blue/10 text-neon-blue px-2 py-1 rounded-lg text-xs font-bold border border-neon-blue/20">
                                            {match.matchCount} coincidencias
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: SELECT WHAT TO RECEIVE */}
                {step === 2 && selectedTargetUser && (
                    <div className="animate-in fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-neon-blue"/> Elige qué recibir de {selectedTargetUser.username}</h3>
                            <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white">Cambiar usuario</button>
                        </div>
                        
                        {/* Selected summary */}
                        {selectedReceiveStickers.length > 0 && (
                            <div className="mb-4 p-2 bg-neon-blue/10 border border-neon-blue/30 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-bold text-neon-blue px-2">{selectedReceiveStickers.length} cromos seleccionados</span>
                                <button onClick={() => setStep(3)} className="px-4 py-1.5 bg-neon-blue text-black text-xs font-bold rounded-lg hover:bg-cyan-300">Continuar →</button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {usersWithMatch.find(u => u.user.id === selectedTargetUser.id)?.availableStickers.map(sticker => {
                                const isSelected = !!selectedReceiveStickers.find(s => s.id === sticker.id);
                                return (
                                    <button 
                                        key={sticker.id}
                                        onClick={() => toggleReceiveSticker(sticker)}
                                        className={`relative aspect-[2.4/3.4] rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-neon-blue scale-95 opacity-100 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                    >
                                        <img src={sticker.imageUrl} className="w-full h-full object-cover" />
                                        <div className="absolute top-0 left-0 bg-black/70 text-white text-[10px] px-1 font-bold">#{sticker.displayNumber}</div>
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-neon-blue/30 flex items-center justify-center backdrop-blur-[1px]">
                                                <CheckCircle className="w-8 h-8 text-white drop-shadow-md" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 3: SELECT WHAT TO OFFER */}
                {step === 3 && (
                     <div className="animate-in fade-in pb-20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Gift className="w-5 h-5 text-neon-purple"/> Tu oferta (Tus Repetidos)</h3>
                            <button onClick={() => setStep(2)} className="text-xs text-slate-400 hover:text-white">Volver atrás</button>
                        </div>
                        
                        <div className="mb-6">
                            <input 
                                type="text" 
                                placeholder="Mensaje opcional para el cambio..." 
                                className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:border-neon-purple outline-none"
                                value={tradeComment}
                                onChange={(e) => setTradeComment(e.target.value)}
                            />
                        </div>

                        {myRepeatedStickers.length === 0 ? (
                            <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-xl text-center">
                                <p className="text-red-300 text-sm">No tienes cromos repetidos disponibles para cambiar.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {myRepeatedStickers.map(sticker => {
                                    const isSelected = !!selectedOfferStickers.find(s => s.id === sticker.id);
                                    return (
                                        <button 
                                            key={sticker.id}
                                            onClick={() => toggleOfferSticker(sticker)}
                                            className={`relative aspect-[2.4/3.4] rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-neon-purple scale-95 opacity-100 shadow-[0_0_15px_rgba(188,19,254,0.3)]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                        >
                                            <img src={sticker.imageUrl} className="w-full h-full object-cover" />
                                            <div className="absolute top-0 left-0 bg-black/70 text-white text-[10px] px-1 font-bold">#{sticker.displayNumber}</div>
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-neon-purple/30 flex items-center justify-center backdrop-blur-[1px]">
                                                    <CheckCircle className="w-8 h-8 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Floating Action Button */}
                        <div className="fixed bottom-0 left-0 w-full p-4 bg-[#020617]/80 backdrop-blur-lg border-t border-white/10 z-50 flex justify-center">
                            <button 
                                onClick={handleSendProposal}
                                disabled={selectedOfferStickers.length === 0 || selectedReceiveStickers.length === 0 || loading}
                                className="max-w-md w-full bg-neon-blue hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2 transition-all uppercase tracking-wide text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                                Confirmar Propuesta ({selectedReceiveStickers.length} x {selectedOfferStickers.length})
                            </button>
                        </div>
                     </div>
                )}
             </div>
        )}

        {/* --- TAB: ACTIVOS --- */}
        {activeTab === 'ACTIVE' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 pb-10">
                {activeTrades.length === 0 && <p className="text-center text-slate-500 py-10">No tienes intercambios activos.</p>}
                
                {activeTrades.map(trade => {
                    const isIncoming = String(trade.receiverId).trim().toLowerCase() === String(currentUser.id).trim().toLowerCase();
                    const otherUser = isIncoming ? trade.sender : trade.receiver;
                    
                    // Arrays
                    const myStickers = isIncoming ? trade.requestedStickers : trade.offeredStickers; 
                    const otherStickers = isIncoming ? trade.offeredStickers : trade.requestedStickers; 
                    
                    const myFinalStatus = isIncoming ? trade.receiverFinalStatus : trade.senderFinalStatus;
                    const otherFinalStatus = isIncoming ? trade.senderFinalStatus : trade.receiverFinalStatus;
                    const status = trade.status.trim().toUpperCase();

                    return (
                        <div key={trade.id} className="bg-slate-900/60 border border-white/10 rounded-2xl shadow-lg relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-1 h-full ${status === 'ACEPTADA' ? 'bg-neon-green shadow-[0_0_10px_#4ade80]' : 'bg-neon-blue shadow-[0_0_10px_#00f3ff]'}`}></div>
                            <div className="p-5 pl-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                                    <div>
                                        <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            {isIncoming ? "Oferta de:" : "Enviada a:"}
                                            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg flex items-center gap-2 text-neon-blue">
                                                <UserIcon className="w-3.5 h-3.5"/> 
                                                {otherUser?.username || 'Usuario'}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 font-mono">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDate(trade.createdAt)}</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-lg ${status === 'ACEPTADA' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-blue-500/20 text-blue-400 border-blue-500/50'}`}>
                                        {status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-6 mb-6 bg-black/20 p-4 rounded-xl border border-white/5 relative">
                                    {/* Connector Line */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>

                                    <div className="flex-1 flex justify-center z-10">
                                        {renderStickerPile(myStickers, "Tú das")}
                                    </div>

                                    <div className="z-10 bg-slate-800 rounded-full p-2 border border-white/10 shadow-lg">
                                        <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                                    </div>

                                    <div className="flex-1 flex justify-center z-10">
                                        {renderStickerPile(otherStickers, "Recibes")}
                                    </div>
                                </div>
                                
                                {(trade.senderComment || trade.receiverComment) && (
                                   <div className="bg-white/5 p-3 rounded-lg mb-4 border border-white/5">
                                      <p className="text-xs text-slate-400 italic text-center">
                                        "{isIncoming ? trade.senderComment : trade.receiverComment || 'Sin comentarios'}"
                                      </p>
                                   </div>
                                )}

                                <div>
                                    {status === 'PENDIENTE' && isIncoming && (
                                        <div className="flex gap-3">
                                            <button onClick={() => handleSimpleStatusUpdate(trade.id, 'ACEPTADA')} className="flex-1 bg-neon-blue hover:bg-cyan-300 text-black py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all active:scale-95">Aceptar Cambio</button>
                                            <button 
                                                onClick={() => { setActionTradeId(trade.id); setActionType('REJECT'); setActionReason(''); }} 
                                                className="flex-1 bg-transparent border border-white/20 text-slate-300 py-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-white/5 transition-colors uppercase"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )}

                                    {status === 'PENDIENTE' && !isIncoming && (
                                        <button 
                                            onClick={() => { setActionTradeId(trade.id); setActionType('CANCEL'); setActionReason(''); }} 
                                            className="w-full bg-slate-800 text-slate-400 py-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-700 hover:text-white transition-colors border border-white/5 hover:border-white/10 uppercase tracking-wide"
                                        >
                                            Cancelar Solicitud
                                        </button>
                                    )}

                                    {status === 'ACEPTADA' && (
                                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-wider"><Clock className="w-3 h-3"/> Confirmación</p>
                                                <div className="flex gap-2 text-[10px]">
                                                    <span className={`px-2 py-1 rounded border ${myFinalStatus === 'OK' ? "bg-green-500/20 border-green-500/50 text-green-400 font-bold" : "bg-black/30 border-white/10 text-slate-500"}`}>Tú: {myFinalStatus || '...'}</span>
                                                    <span className={`px-2 py-1 rounded border ${otherFinalStatus === 'OK' ? "bg-green-500/20 border-green-500/50 text-green-400 font-bold" : "bg-black/30 border-white/10 text-slate-500"}`}>{otherUser?.username}: {otherFinalStatus || '...'}</span>
                                                </div>
                                            </div>

                                            {!myFinalStatus ? (
                                                <button 
                                                    onClick={() => { setActionTradeId(trade.id); setActionType('FINALIZE'); setFinalStatus('OK'); }}
                                                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] mb-3 flex items-center justify-center gap-2 uppercase tracking-wide"
                                                >
                                                    <Handshake className="w-5 h-5"/>
                                                    Confirmar Intercambio
                                                </button>
                                            ) : (
                                                <div className="text-center text-xs sm:text-sm text-green-400 font-bold bg-green-500/10 p-3 rounded-xl mb-3 border border-green-500/30 flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-5 h-5"/>
                                                    Ya has confirmado ({myFinalStatus})
                                                </div>
                                            )}

                                            {!myFinalStatus && (
                                                <button 
                                                    onClick={() => { setActionTradeId(trade.id); setActionType('FINALIZE'); setFinalStatus('NO_VINO'); }}
                                                    className="w-full py-2 text-slate-500 text-[10px] hover:text-red-400 font-medium hover:underline uppercase tracking-wide"
                                                >
                                                    Reportar problema / No se presentó
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- TAB: HISTORIAL --- */}
        {activeTab === 'HISTORY' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 pb-10">
                 {historyTrades.length === 0 && <p className="text-center text-slate-500 py-10">No hay historial.</p>}
                 {historyTrades.map(trade => {
                     let rejectReason = '';
                     let isReported = false;
                     let culpritName = '';
                     
                     const failedSender = trade.senderFinalStatus === 'NO_VINO' || trade.senderFinalStatus === 'ME_HE_NEGADO';
                     const failedReceiver = trade.receiverFinalStatus === 'NO_VINO' || trade.receiverFinalStatus === 'ME_HE_NEGADO';

                     if (failedSender || failedReceiver) {
                        isReported = true;
                        let reasonType = '';
                        let comment = '';
                        if (failedSender) {
                            culpritName = trade.sender?.username || 'Usuario';
                            reasonType = trade.senderFinalStatus;
                            comment = trade.senderComment;
                        } else {
                            culpritName = trade.receiver?.username || 'Usuario';
                            reasonType = trade.receiverFinalStatus;
                            comment = trade.receiverComment;
                        }
                        let txtReason = reasonType === 'NO_VINO' ? 'Reportó que no te presentaste' : 'Se negó al intercambio';
                        rejectReason = `${txtReason}. ${comment ? `"${comment}"` : ''}`;
                     } else {
                        if (trade.status === 'RECHAZADA' && trade.receiverComment) rejectReason = trade.receiverComment;
                        if (trade.status === 'CANCELADA') rejectReason = trade.receiverComment || trade.senderComment;
                     }

                     const isFailure = trade.status === 'CANCELADA' || trade.status === 'RECHAZADA' || isReported;

                     return (
                         <div key={trade.id} className={`p-4 rounded-xl border flex flex-col gap-2 transition shadow-sm ${isFailure ? 'bg-red-950/20 border-red-900/50 relative overflow-hidden' : 'bg-slate-900/40 border-white/5 opacity-80 hover:opacity-100'}`}>
                             <div className="flex justify-between items-start mt-1">
                                 <div className="flex items-center gap-4 w-full">
                                     <div className={`p-2 rounded-full shrink-0 ${trade.status === 'COMPLETADA' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                                         {trade.status === 'COMPLETADA' ? <ShieldCheck className="w-5 h-5" /> : (isReported ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />)}
                                     </div>
                                     <div className="w-full">
                                         <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Estado: <span className={isFailure ? 'text-red-400' : 'text-slate-400'}>{trade.status}</span></p>
                                            <span className="text-[10px] text-slate-600 font-mono">{formatDate(trade.createdAt)}</span>
                                         </div>
                                         <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <span className="font-bold">{trade.offeredStickers.length} cromos</span> 
                                            <span className="text-slate-600">⇄</span> 
                                            <span className="font-bold">{trade.requestedStickers.length} cromos</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             {rejectReason && (
                                 <div className={`p-3 rounded-lg text-xs flex items-start gap-2 mt-2 ${isFailure ? 'bg-red-900/20 border border-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                                    <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${isFailure ? 'text-red-500' : 'text-slate-500'}`} />
                                    <div>
                                        <p className="font-bold mb-0.5 uppercase tracking-wider text-[10px]">Motivo del cierre:</p>
                                        <p className="italic opacity-80">"{rejectReason}"</p>
                                    </div>
                                 </div>
                             )}
                         </div>
                     );
                 })}
            </div>
        )}

        {/* Action Modal */}
        {actionTradeId && actionType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <h3 className="font-bold text-lg mb-4 text-white">
                        {actionType === 'FINALIZE' && 'Finalizar Intercambio'}
                        {actionType === 'CANCEL' && 'Cancelar Solicitud'}
                        {actionType === 'REJECT' && 'Rechazar Propuesta'}
                    </h3>
                    
                    {actionType === 'FINALIZE' && (
                        <div className="flex flex-col gap-2 mb-4">
                            <button onClick={() => setFinalStatus('OK')} className={`p-3 rounded-lg border text-sm font-bold text-left transition-all ${finalStatus === 'OK' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>OK - Todo correcto</button>
                            <button onClick={() => setFinalStatus('ME_HE_NEGADO')} className={`p-3 rounded-lg border text-sm font-bold text-left transition-all ${finalStatus === 'ME_HE_NEGADO' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>Me he negado</button>
                            <button onClick={() => setFinalStatus('NO_VINO')} className={`p-3 rounded-lg border text-sm font-bold text-left transition-all ${finalStatus === 'NO_VINO' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>Se ha negado / No vino</button>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                            {(actionType === 'CANCEL' || actionType === 'REJECT') ? 'Motivo (Obligatorio):' : 'Comentario opcional:'}
                        </label>
                        <textarea 
                            className={`w-full border rounded-xl p-3 text-sm bg-black/40 outline-none focus:ring-1 transition-all text-white placeholder-slate-600 ${(actionType === 'CANCEL' || actionType === 'REJECT') && !actionReason.trim() ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-neon-blue focus:ring-neon-blue'}`}
                            placeholder={(actionType === 'CANCEL' || actionType === 'REJECT') ? "Explica brevemente la razón..." : "Comentario..."}
                            value={actionReason}
                            onChange={e => setActionReason(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => { setActionTradeId(null); setActionType(null); setActionReason(''); }} className="flex-1 py-3 text-slate-400 font-bold text-sm hover:text-white hover:bg-white/5 rounded-xl transition border border-transparent">Volver</button>
                        <button 
                            onClick={handleActionSubmit}
                            disabled={loading || ((actionType === 'CANCEL' || actionType === 'REJECT') && !actionReason.trim())}
                            className="flex-1 py-3 bg-neon-blue disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-bold text-sm hover:bg-cyan-300 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Global Loading Overlay */}
        {loading && !actionTradeId && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
               <div className="bg-[#0f172a] p-6 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-neon-blue" />
                  <p className="text-white font-bold text-sm uppercase tracking-widest animate-pulse">Procesando...</p>
               </div>
           </div>
        )}
      </div>
    </div>
  );
};
