
import React, { useState, useEffect } from 'react';
import { User, ViewState } from './types';
import { storageService } from './services/storageService';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { WelcomeModal } from './components/WelcomeModal';
import { PWAInstallGuide } from './components/PWAInstallGuide';

const RULES_VERSION_KEY = 'adrenalyn26_rules_accepted_v1';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('AUTH');
  const [initializing, setInitializing] = useState(true);
  
  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [pwaStatus, setPwaStatus] = useState({
    sw: false,
    isStandalone: false,
    isInAppBrowser: false,
    platform: 'unknown'
  });

  const [showRules, setShowRules] = useState(() => {
    return !localStorage.getItem(RULES_VERSION_KEY);
  });

  useEffect(() => {
    // 1. Check Session
    const storedUser = storageService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setView('DASHBOARD');
    }

    // 2. Detección de Plataforma y Estado
    const ua = navigator.userAgent;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);
    
    // Detectar si estamos en un navegador interno (WhatsApp, FB, etc)
    const isInApp = /FBAN|FBAV|Instagram|Twitter|WhatsApp/.test(ua);

    setIsAppInstalled(isStandalone);
    setPwaStatus({
      sw: 'serviceWorker' in navigator,
      isStandalone,
      isInAppBrowser: isInApp,
      platform: isIos ? 'ios' : isAndroid ? 'android' : 'desktop'
    });

    // 3. Capturar evento de instalación (Solo Chrome/Android/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); 
      setDeferredPrompt(e);
      console.log("Evento PWA capturado");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    setInitializing(false);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallRequest = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      // Si no hay prompt automático (iOS o navegador que ya lo procesó), mostramos la guía manual
      setShowInstallGuide(true);
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setView('DASHBOARD');
    if (!localStorage.getItem(RULES_VERSION_KEY)) setShowRules(true);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setView('AUTH');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {view === 'AUTH' && (
        <Auth 
          onLogin={handleLogin} 
          isInstallable={!isAppInstalled} 
          onInstall={handleInstallRequest} 
        />
      )}
      {view === 'DASHBOARD' && user && (
        <>
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            isInstallable={!isAppInstalled} 
            onInstall={handleInstallRequest} 
          />
          {showRules && <WelcomeModal onAccept={() => { localStorage.setItem(RULES_VERSION_KEY, 'true'); setShowRules(false); }} />}
        </>
      )}
      
      {showInstallGuide && (
        <PWAInstallGuide 
          status={pwaStatus} 
          onClose={() => setShowInstallGuide(false)} 
        />
      )}
    </>
  );
};

export default App;
