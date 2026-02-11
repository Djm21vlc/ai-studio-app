
import React from 'react';
import { X, Trophy, Zap, Star, Shield } from 'lucide-react';
import { Sticker } from '../types';

interface StickerZoomModalProps {
  sticker: Sticker;
  onClose: () => void;
}

export const StickerZoomModal: React.FC<StickerZoomModalProps> = ({ sticker, onClose }) => {
  // Detectar si es un estadio por nombre o categoría (insensible a mayúsculas/minúsculas)
  const isStadium = sticker.category.toLowerCase().includes('estadio') || sticker.name.toLowerCase().includes('estadio');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        // Si es estadio, rotamos 90 grados. 
        // Agregamos scale-[0.85] en móviles para que quepa en el ancho de la pantalla al estar tumbada.
        className={`relative max-w-sm w-full aspect-[2.4/3.4] animate-in zoom-in-95 duration-300 transition-transform ${isStadium ? 'rotate-90 scale-[0.85] sm:scale-100' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className={`w-full h-full rounded-[2rem] border-2 overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.3)] bg-slate-900 flex flex-col ${sticker.isSpecial ? 'border-neon-purple' : 'border-neon-blue'}`}>
          {sticker.imageUrl ? (
            <img 
              src={sticker.imageUrl} 
              alt={sticker.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-800 to-slate-950">
              <Shield className="w-24 h-24 text-white/10 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Imagen no disponible</p>
            </div>
          )}

          {/* Overlay Info */}
          <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-neon-blue font-black text-2xl mb-1 drop-shadow-md">#{sticker.displayNumber}</p>
                <h3 className="text-white font-black text-3xl leading-tight drop-shadow-lg uppercase italic italic-tracking-tighter">
                  {sticker.name}
                </h3>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 text-sm">
                  {sticker.team}
                </p>
              </div>
              {sticker.isSpecial && (
                <div className="bg-neon-purple p-3 rounded-2xl shadow-[0_0_20px_rgba(188,19,254,0.6)]">
                   <Star className="w-6 h-6 text-white" fill="white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
