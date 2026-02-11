
import React, { useState, useEffect, useRef } from 'react';
import { Sticker } from '../types';
import { Plus, Minus, Check, Trophy, Zap, Star, Shield, ImageOff, Pencil, Save, X, Search, AlertTriangle, Upload, CloudUpload, Loader2, Maximize2 } from 'lucide-react';
import { TEAM_COLORS } from '../constants';
import { dataService } from '../services/dataService';

interface StickerItemProps {
  sticker: Sticker;
  count: number;
  onUpdate: (id: string, delta: number) => void;
  currentUserRole?: 'admin' | 'user' | 'coleccionista';
  onZoom?: (sticker: Sticker) => void;
}

const getCategoryStyles = (category: string, isOwned: boolean) => {
  const cat = category.toLowerCase();
  
  if (!isOwned) return { 
    border: 'border-slate-800 bg-slate-900/40', 
    badge: 'bg-slate-800 text-slate-400', 
    glow: '',
    text: 'text-slate-500',
    overlay: 'grayscale opacity-60'
  };

  if (cat.includes('balón de oro') || cat.includes('gold')) {
    return { 
      border: 'border-amber-500 bg-gradient-to-br from-amber-900/50 to-black', 
      badge: 'bg-amber-500 text-black', 
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
      text: 'text-amber-400',
      overlay: ''
    };
  }
  if (cat.includes('energy') || cat.includes('energía')) {
    return { 
      border: 'border-lime-400 bg-gradient-to-br from-lime-900/50 to-black', 
      badge: 'bg-lime-400 text-black', 
      glow: 'shadow-[0_0_20px_rgba(163,230,53,0.4)]',
      text: 'text-lime-400',
      overlay: ''
    };
  }
  if (cat.includes('diamante') || cat.includes('diamond')) {
    return { 
      border: 'border-cyan-400 bg-gradient-to-br from-cyan-900/50 to-black', 
      badge: 'bg-cyan-400 text-black', 
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]',
      text: 'text-cyan-400',
      overlay: ''
    };
  }
  if (cat.includes('super') || cat.includes('crack') || cat.includes('top')) {
    return { 
      border: 'border-violet-500 bg-gradient-to-br from-violet-900/50 to-black', 
      badge: 'bg-violet-500 text-white', 
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
      text: 'text-violet-300',
      overlay: ''
    };
  }
  
  return { 
    border: 'border-slate-600 bg-slate-800', 
    badge: 'bg-white text-black', 
    glow: 'shadow-lg hover:shadow-slate-700/50',
    text: 'text-white',
    overlay: ''
  };
};

const getTeamColor = (teamName: string) => {
  const lowerName = teamName.toLowerCase();
  for (const [key, value] of Object.entries(TEAM_COLORS)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  return TEAM_COLORS['default'];
};

const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('balón')) return <Trophy className="w-3 h-3" />;
    if (cat.includes('energy')) return <Zap className="w-3 h-3" />;
    if (cat.includes('super')) return <Star className="w-3 h-3" />;
    return null;
};

export const StickerItem = React.memo<StickerItemProps>(({ sticker, count, onUpdate, currentUserRole, onZoom }) => {
  const [imgError, setImgError] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState(sticker.imageUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [linkWarning, setLinkWarning] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwned = count > 0;
  const isRepeated = count > 1;
  const styles = getCategoryStyles(sticker.category, isOwned);
  const teamColors = getTeamColor(sticker.team);

  const displayImage = tempImage || sticker.imageUrl;

  const isBasicOwned = isOwned && !sticker.isSpecial;
  const dynamicContainerStyle = isBasicOwned ? {
      borderColor: teamColors.primary,
      boxShadow: `0 0 12px ${teamColors.primary}80`,
      backgroundColor: `${teamColors.primary}10`
  } : {};

  useEffect(() => {
    setImgError(false);
  }, [displayImage]);

  useEffect(() => {
    if (!isEditing) return;
    const url = imageUrlInput.toLowerCase().trim();
    if (url.includes('postimg') || url.includes('imgur')) {
        const hasExtension = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
        if (!hasExtension) {
            setLinkWarning("¡Ojo! Copia el 'Enlace Directo' (debe terminar en .jpg/.png)");
            return;
        }
    }
    setLinkWarning(null);
  }, [imageUrlInput, isEditing]);

  const handleSaveImage = async (urlToSave?: string) => {
     const targetUrl = urlToSave || imageUrlInput;
     if (!targetUrl.trim()) return;
     
     setIsSaving(true);
     try {
        await dataService.updateStickerImage(sticker.id, targetUrl);
        setTempImage(targetUrl); 
        setIsEditing(false);
        setImgError(false);
     } catch (e) {
        alert("Error al guardar imagen");
     } finally {
        setIsSaving(false);
     }
  };
  
  const handleSearchImage = () => {
      const query = `Adrenalyn 2026 ${sticker.name} ${sticker.team}`;
      window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
          alert("La imagen es demasiado grande. Máximo 5MB.");
          return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              setTempImage(ev.target.result as string);
              setImgError(false);
          }
      };
      reader.readAsDataURL(file);
      setIsUploading(true);
      try {
          const result = await dataService.uploadImage(file);
          if (result.success && result.url) {
              setImageUrlInput(result.url);
              await dataService.updateStickerImage(sticker.id, result.url);
          }
      } catch (err: any) {
          console.error(err);
          alert("Error al subir imagen");
          setTempImage(null); 
      } finally {
          setIsUploading(false);
          setIsEditing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleClickCard = () => {
    if (onZoom && !isEditing) {
      onZoom(sticker);
    }
  };

  return (
    <div className="flex flex-col items-center group relative perspective-1000">
      <div 
        style={dynamicContainerStyle} 
        onClick={handleClickCard}
        className={`relative w-full aspect-[2.4/3.4] rounded-xl border-[1px] overflow-hidden transition-all duration-500 ease-out cursor-pointer ${styles.border} ${styles.glow} ${styles.overlay} ${isOwned ? 'hover:scale-[1.05] hover:-translate-y-2 hover:z-10 transform-gpu' : 'hover:opacity-80'}`}
      >
        {isOwned && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" style={{backgroundSize: '200% 200%'}}></div>}
        
        {/* Zoom Icon Hint */}
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/40 backdrop-blur rounded-lg text-white">
           <Maximize2 className="w-3 h-3" />
        </div>

        {displayImage && !imgError ? (
          <img key={displayImage} src={displayImage} alt={sticker.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center" style={{ background: `linear-gradient(135deg, ${teamColors.primary}CC 0%, ${teamColors.secondary}CC 100%)` }}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-40"></div>
             <div className="bg-black/30 p-3 rounded-full backdrop-blur-md border border-white/20 shadow-xl mb-2 relative z-10"><Shield className="w-8 h-8 drop-shadow-md text-white" /></div>
             {imgError && <span className="text-[9px] text-white/80 bg-red-500/50 px-1 rounded z-10">Error Img</span>}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/80 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-start z-20">
          <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded border border-white/10 shadow-lg">{sticker.displayNumber || sticker.number}</div>
          {/* Ocultamos la etiqueta de categoría si es un estadio, para que parezca un básico limpio */}
          {sticker.category.toLowerCase() !== 'básicos' && !sticker.category.toLowerCase().includes('estadio') && (
             <div className={`${styles.badge} text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 shadow-lg tracking-wider border border-white/10`}>{getCategoryIcon(sticker.category)}{sticker.category.substring(0, 3)}</div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full p-3 text-center z-20">
          <h4 className="text-white font-bold text-xs leading-tight drop-shadow-md line-clamp-2 mb-1 tracking-tight">{sticker.name}</h4>
          <div className="inline-block px-2 py-0.5 rounded bg-white/10 backdrop-blur-sm border border-white/5"><p className="text-[8px] text-white/90 font-bold tracking-widest uppercase">{sticker.team}</p></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-1 z-30">
          {isRepeated && <span className="bg-neon-pink text-white text-xs font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(255,0,85,0.6)] border border-white/20 animate-pulse">x{count}</span>}
          {!isRepeated && isOwned && <div className="bg-neon-blue/80 backdrop-blur text-black p-2 rounded-full shadow-[0_0_15px_rgba(0,243,255,0.5)] border border-white/30 scale-0 animate-in zoom-in duration-300 fill-mode-forwards"><Check className="w-5 h-5" strokeWidth={4} /></div>}
        </div>
        {isEditing && (
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 z-40 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
              {isUploading ? (
                  <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 text-neon-blue animate-spin" /><span className="text-[10px] text-neon-blue font-bold animate-pulse">Subiendo...</span></div>
              ) : (
                  <>
                    <input type="text" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="Pega URL o sube ->" className="w-full text-[10px] p-2 rounded mb-1 bg-slate-800 text-white border border-slate-600 focus:border-neon-blue outline-none" autoFocus />
                    {linkWarning && <div className="flex items-center gap-1 text-[8px] text-amber-400 font-bold mb-2 bg-amber-900/30 p-1 rounded border border-amber-500/30 w-full"><AlertTriangle className="w-3 h-3 shrink-0" />{linkWarning}</div>}
                    <div className="flex gap-2 mt-1 w-full justify-center">
                        <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-white" title="Cancelar"><X className="w-4 h-4" /></button>
                        <div className="relative">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-500 font-bold text-xs flex items-center gap-1" title="Subir Imagen"><CloudUpload className="w-4 h-4" /></button>
                        </div>
                        <button onClick={handleSearchImage} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold text-xs flex items-center gap-1" title="Buscar en Google"><Search className="w-4 h-4" /></button>
                        <button onClick={() => handleSaveImage()} className="p-1.5 bg-neon-blue text-black rounded hover:bg-cyan-400 font-bold text-xs flex items-center gap-1" title="Guardar">{isSaving ? "..." : <Save className="w-4 h-4" />}</button>
                    </div>
                  </>
              )}
           </div>
        )}
      </div>
      {currentUserRole === 'admin' && !isEditing && (
         <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
          className="absolute top-2 right-8 z-30 p-1.5 bg-black/50 hover:bg-black/80 backdrop-blur text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10" title="Editar Imagen"
         >
          <Pencil className="w-3 h-3" />
         </button>
      )}
      <div className="flex items-center justify-center gap-2 mt-2 w-full">
        <button onClick={() => onUpdate(sticker.id, -1)} disabled={count === 0} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 ${count === 0 ? 'bg-slate-900/50 text-slate-700 border border-slate-800 cursor-not-allowed' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-red-500/50 hover:text-red-500 shadow-sm'}`}><Minus className="w-4 h-4" /></button>
        <span className={`text-sm font-bold w-6 text-center ${isOwned ? 'text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]' : 'text-slate-600'}`}>{count}</span>
        <button onClick={() => onUpdate(sticker.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-white border border-slate-700 hover:border-neon-blue/50 hover:text-neon-blue hover:shadow-[0_0_10px_rgba(0,243,255,0.2)] active:scale-95 transition-all"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
});
