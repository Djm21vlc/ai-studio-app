import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ScrollText, ArrowDown, CheckCircle2 } from 'lucide-react';

interface WelcomeModalProps {
  onAccept: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onAccept }) => {
  const [canAccept, setCanAccept] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    // Permitimos un margen de error de 5px
    if (scrollHeight - scrollTop - clientHeight < 5) {
      setCanAccept(true);
    }
  };

  // Comprobar si el contenido es pequeño y no necesita scroll
  useEffect(() => {
    if (contentRef.current) {
      if (contentRef.current.scrollHeight <= contentRef.current.clientHeight) {
        setCanAccept(true);
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center gap-4 border-b border-slate-700 shrink-0">
          <div className="bg-white/10 p-3 rounded-full backdrop-blur-md">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Bienvenido a CROMOCHÉ</h2>
            <p className="text-slate-400 text-sm">Normas de la Comunidad y Uso</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          onScroll={checkScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative"
        >
          <div className="prose prose-sm max-w-none text-slate-700">
            <p className="font-medium text-lg text-slate-900 mb-4">
              Por favor, lee atentamente las siguientes normas para continuar:
            </p>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex gap-3">
                <span className="font-bold text-blue-600 text-lg">1.</span>
                <p>Esta app es gratuita, no buscamos un beneficio económico, buscamos un equilibrio entre modernidad tecnológica y tradición. Esta app está diseñada para llevar el control de tu colección de cromos, concretamente "ADRENALYN". Úsala bien.</p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-blue-600 text-lg">2.</span>
                <p>Añade los cromos, y verás como los porcentajes van aumentando hasta conseguir el tan preciado logro.</p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-blue-600 text-lg">3.</span>
                <p>Las zonas de cambios se autorizarán o se denegarán según el uso que le des a esta app. Crear contenido falso, o con otras intenciones, serán motivo para que no sigas en esta app.</p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-blue-600 text-lg">4.</span>
                <p>Recuerda, cuando hagas un cambio es porque vas a intentar ir a cambiar el cromo. Si tu intención es cambiarlo otro domingo, házselo saber en el mensaje. Si el cambio ha sido con tu colega del cole, acepta el cambio y coméntalo en la zona habilitada.</p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-blue-600 text-lg">5.</span>
                <p>Queremos una app sana, bastante mal está el mundo como para contaminar una tradición, que aunque no sea exclusiva de niños, son los que más la disfrutan.</p>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-red-600 text-lg">6.</span>
                <p className="font-bold text-slate-800">Todos los mensajes se quedan registrados. Cualquier mensaje que no sea acorde a esto será eliminado. Y CUALQUIER INDICIO DE DELITO SERÁ DENUNCIADO, COLABORANDO EN TODO MOMENTO CON LAS AUTORIDADES COMPETENTES.</p>
              </div>
            </div>
            
            <p className="text-center text-slate-500 italic mt-4 text-xs">
              Al aceptar, confirmas que has leído y entendido las normas de la comunidad.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex flex-col gap-3">
          {!canAccept && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 font-bold animate-pulse">
              <ArrowDown className="w-4 h-4" />
              Desplaza hasta el final para aceptar
            </div>
          )}
          
          <button 
            onClick={onAccept}
            disabled={!canAccept}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
              ${canAccept 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-600/30 cursor-pointer' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
          >
            {canAccept ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                He leído y acepto las normas
              </>
            ) : (
              <>
                <ScrollText className="w-5 h-5" />
                Lee las normas primero
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};