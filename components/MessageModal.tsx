
import React from 'react';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { SystemMessage } from '../types';

interface MessageModalProps {
  message: SystemMessage;
  onClose: () => void;
  onMarkRead: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({ message, onClose, onMarkRead }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-neon-purple/30 w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(188,19,254,0.3)] animate-in zoom-in-95 duration-300 flex flex-col">
        
        {/* Header con estilo Neon */}
        <div className="relative p-6 bg-gradient-to-br from-purple-900/40 to-slate-900">
           <div className="absolute top-4 right-4">
              <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition"><X className="w-5 h-5"/></button>
           </div>
           <div className="w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center mb-4 border border-neon-purple/50 shadow-lg">
              <Bell className="w-6 h-6 text-neon-purple animate-pulse" />
           </div>
           <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{message.title}</h3>
           <p className="text-[10px] text-neon-purple font-bold uppercase tracking-widest mt-1">Mensaje del Sistema • {message.createdAt}</p>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-900 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {message.body}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-black/40 border-t border-white/5">
          <button 
            onClick={onMarkRead}
            className="w-full bg-neon-purple hover:bg-purple-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(188,19,254,0.2)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
