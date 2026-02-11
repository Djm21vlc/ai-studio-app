
import React from 'react';
import { X, Share, PlusSquare, Download, Chrome, Smartphone, Monitor, Info, AlertTriangle, ExternalLink } from 'lucide-react';

interface PWAInstallGuideProps {
  status: {
    sw: boolean;
    isStandalone: boolean;
    isInAppBrowser: boolean;
    platform: string;
  };
  onClose: () => void;
}

export const PWAInstallGuide: React.FC<PWAInstallGuideProps> = ({ status, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-blue/10 rounded-xl">
              <Download className="w-5 h-5 text-neon-blue" />
            </div>
            <h3 className="font-bold text-white text-lg">Instalar CROMO-CHÉ</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition"><X className="w-5 h-5"/></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {status.isInAppBrowser ? (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div className="text-sm">
                <p className="text-amber-200 font-bold mb-1">Navegador no compatible</p>
                <p className="text-amber-200/70 leading-relaxed">
                  Estás viendo esto desde una aplicación (WhatsApp, Instagram...). Para poder instalar, pulsa en los tres puntos y selecciona <strong>"Abrir en el navegador"</strong> o <strong>"Abrir en Chrome/Safari"</strong>.
                </p>
              </div>
            </div>
          ) : null}

          {status.platform === 'ios' && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">Apple no permite la instalación automática. Sigue estos pasos en Safari:</p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">1</div>
                  <div className="text-sm">
                    <p className="text-white font-bold mb-1 flex items-center gap-2">
                      Pulsa "Compartir" <Share className="w-4 h-4 text-blue-400" />
                    </p>
                    <p className="text-slate-400">Está en la barra inferior de tu navegador Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">2</div>
                  <div className="text-sm">
                    <p className="text-white font-bold mb-1 flex items-center gap-2">
                      "Añadir a pantalla de inicio" <PlusSquare className="w-4 h-4 text-blue-400" />
                    </p>
                    <p className="text-slate-400">Baja un poco en el menú que ha aparecido hasta encontrar esta opción.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status.platform === 'android' && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">En Android puedes instalarla directamente desde Chrome:</p>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-neon-blue rounded-lg flex items-center justify-center text-black font-bold shrink-0">1</div>
                  <div className="text-sm">
                    <p className="text-white font-bold mb-1">Pulsa los 3 puntos ⋮</p>
                    <p className="text-slate-400">Arriba a la derecha en la barra de Chrome.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 bg-neon-blue rounded-lg flex items-center justify-center text-black font-bold shrink-0">2</div>
                  <div className="text-sm">
                    <p className="text-white font-bold mb-1">"Instalar aplicación"</p>
                    <p className="text-slate-400">Si no aparece, busca "Añadir a pantalla de inicio".</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status.platform === 'desktop' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Monitor className="w-6 h-6 text-neon-blue shrink-0" />
                <div className="text-sm">
                  <p className="text-white font-bold mb-1 text-base">Instalar en Ordenador</p>
                  <p className="text-slate-400">Busca el icono de "Instalar" <Monitor className="inline w-4 h-4 mx-1" /> en la barra de direcciones de Chrome o Edge (a la derecha de la URL).</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
             <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4">
                <Info className="w-5 h-5 text-slate-500 shrink-0" />
                <div className="text-[10px] text-slate-500 leading-tight">
                  <p className="font-bold mb-1 uppercase tracking-wider">¿Por qué instalar?</p>
                  <p>Las Web Apps instaladas cargan más rápido, ocupan menos espacio y funcionan sin las barras del navegador, como una app nativa.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-slate-800/30">
          <button 
            onClick={onClose}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-slate-200 transition active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
