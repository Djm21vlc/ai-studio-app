
import React from 'react';
import { X, Sparkles, ArrowLeftRight, User as UserIcon, Trophy, Zap, ShieldCheck } from 'lucide-react';
import { Sticker, User, Collection } from '../types';
import { storageService } from '../services/storageService';

interface Opportunity {
  sticker: Sticker;
  owners: string[]; // Nombres de usuarios que lo tienen repe
}

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTrade: () => void;
  currentUser: User;
  allStickers: Sticker[];
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({ isOpen, onClose, onOpenTrade, currentUser, allStickers }) => {
  if (!isOpen) return null;

  // Calculamos las oportunidades en caliente
  const myCollection = storageService.getCollection(currentUser.id);
  const otherUsers = storageService.getAllUsers().filter(u => u.id !== currentUser.id && u.isAuthorized);
  
  const opportunities: Opportunity[] = [];
  
  // 1. Identificar mis faltas
  const myMissing = allStickers.filter(s => !myCollection[s.id]);

  // 2. Ver quién las tiene repetidas
  myMissing.forEach(sticker => {
    const owners: string[] = [];
    otherUsers.forEach(u => {
      const uColl = storageService.getCollection(u.id);
      if ((uColl[sticker.id] || 0) > 1) {
        owners.push(u.username);
      }
    });

    if (owners.length > 0) {
      opportunities.push({ sticker, owners });
    }
  });

  if (opportunities.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-neon-blue/30 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.2)] animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
        
        {/* Header con destellos */}
        <div className="p-8 pb-4 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-neon-blue/20 rounded-full blur-[40px] -z-10"></div>
          <div className="inline-flex p-4 bg-neon-blue/10 rounded-3xl mb-4 border border-neon-blue/20">
            <Sparkles className="w-8 h-8 text-neon-blue animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
            ¡Oportunidades de <span className="text-neon-blue">Cambio</span>!
          </h3>
          <p className="text-slate-400 text-sm mt-2 font-medium">Hemos encontrado cromos que te faltan en las manos de otros usuarios.</p>
        </div>

        {/* Lista de Oportunidades */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {opportunities.map((opp, idx) => (
            <div 
              key={opp.sticker.id} 
              className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-16 bg-black rounded-lg border border-white/10 overflow-hidden relative shrink-0">
                  <div className="absolute top-0 left-0 bg-neon-blue text-black text-[9px] font-black px-1 rounded-br">#{opp.sticker.displayNumber}</div>
                  {opp.sticker.imageUrl ? (
                    <img src={opp.sticker.imageUrl} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Trophy className="w-5 h-5 text-slate-700" /></div>
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm leading-tight">{opp.sticker.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{opp.sticker.team}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex -space-x-2">
                      {opp.owners.slice(0, 3).map((owner, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-neon-blue">
                          {owner.substring(0, 1).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {opp.owners.length === 1 
                        ? `${opp.owners[0]} lo tiene repe` 
                        : `${opp.owners[0]} y ${opp.owners.length - 1} más lo tienen`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="p-8 bg-slate-800/30 border-t border-white/5 space-y-3">
          <button 
            onClick={() => { onOpenTrade(); onClose(); }}
            className="w-full bg-neon-blue hover:bg-cyan-300 text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm italic"
          >
            <ArrowLeftRight className="w-5 h-5" />
            Ir a la Zona de Cambios
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2 text-slate-500 hover:text-white text-xs font-bold transition-colors uppercase tracking-widest"
          >
            Ahora no, gracias
          </button>
        </div>
      </div>
    </div>
  );
};
