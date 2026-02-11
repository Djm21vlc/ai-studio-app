
import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle2, Lock, Unlock, ShieldAlert, UserCog, Link as LinkIcon, Eye, EyeOff, Users, AlertCircle, KeyRound, Loader2, BadgeCheck, Star, Image, FolderDown, Activity, Crown, Shield, UserPlus, Trash2, Smartphone, Monitor, Info, RefreshCw, Send, Mail, Megaphone } from 'lucide-react';
import { dataService } from '../services/dataService';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSync }) => {
  const currentUser = storageService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isLoggedIn = !!currentUser;

  const [activeTab, setActiveTab] = useState<'data' | 'account' | 'users' | 'messages' | 'debug'>(isLoggedIn && !isAdmin ? 'account' : 'data');
  const [url, setUrl] = useState(dataService.getApiUrl());
  const [loginNews, setLoginNews] = useState(localStorage.getItem('adrenalyn26_login_msg') || '');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [newsStatus, setNewsStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isUrlLocked, setIsUrlLocked] = useState(true);
  const [unlockPass, setUnlockPass] = useState('');
  const [showUnlockInput, setShowUnlockInput] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [pingMessage, setPingMessage] = useState('');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Admin changing other user's password
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [passChangeStatus, setPassChangeStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  // User changing own password
  const [userOldPass, setUserOldPass] = useState('');
  const [userNewPass, setUserNewPass] = useState('');
  const [userConfirmPass, setUserConfirmPass] = useState('');
  const [userPassStatus, setUserPassStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [userPassMsg, setUserPassMsg] = useState('');

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '1234', role: 'user' as User['role'] });
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [createError, setCreateError] = useState('');

  // Messaging State
  const [selectedMsgUsers, setSelectedMsgUsers] = useState<string[]>([]);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(dataService.getApiUrl());
      setLoginNews(localStorage.getItem('adrenalyn26_login_msg') || '');
      setShowUnlockInput(false);
      setIsUrlLocked(true);
      // Reset user pass form
      setUserOldPass('');
      setUserNewPass('');
      setUserConfirmPass('');
      setUserPassStatus('idle');
      setUserPassMsg('');
      
      if (isLoggedIn && !isAdmin) setActiveTab('account');
      else setActiveTab('data');
    }
  }, [isOpen, isLoggedIn, isAdmin]);

  const handleUpdateNews = async () => {
      setNewsStatus('loading');
      try {
          await dataService.adminUpdateLoginMessage(loginNews);
          localStorage.setItem('adrenalyn26_login_msg', loginNews);
          setNewsStatus('success');
          setTimeout(() => setNewsStatus('idle'), 2000);
      } catch(e) {
          alert("Error actualizando noticias");
          setNewsStatus('idle');
      }
  };

  const loadUsers = async () => {
      setLoadingUsers(true);
      try { 
        await dataService.fetchCatalog(true); 
        setAllUsers(storageService.getAllUsers()); 
      } catch(e) {
        console.error(e);
      } finally { 
        setLoadingUsers(false); 
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if(!window.confirm("¿Seguro que quieres eliminar este usuario? Se borrará su colección.")) return;
      setLoadingUsers(true);
      try {
          await storageService.adminDeleteUser(userId);
          setAllUsers(prev => prev.filter(u => u.id !== userId));
      } catch(e) {
          alert("Error al eliminar usuario");
          loadUsers();
      } finally {
          setLoadingUsers(false);
      }
  };

  const handleToggleAuth = async (user: User) => {
      const newStatus = !user.isAuthorized;
      try {
          await dataService.adminCreateUser({ ...user, isAuthorized: newStatus, action: 'admin_update_user', targetUserId: user.id } as any);
          setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAuthorized: newStatus } : u));
      } catch(e) { alert("Error actualizando"); }
  };

  const handleChangeRole = async (user: User, newRole: User['role']) => {
      try {
          await dataService.adminCreateUser({ ...user, role: newRole, action: 'admin_update_user', targetUserId: user.id } as any);
          setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      } catch(e) { alert("Error al cambiar rol"); }
  };

  const handleAdminChangePassword = async () => {
     if (!passwordChangeUser || !newAdminPass) return;
     setPassChangeStatus('loading');
     try {
         await storageService.changePassword(passwordChangeUser.id, newAdminPass);
         setPassChangeStatus('success');
         setAllUsers(prev => prev.map(u => u.id === passwordChangeUser.id ? { ...u, password: newAdminPass } : u));
         setTimeout(() => {
             setPasswordChangeUser(null);
             setNewAdminPass('');
             setPassChangeStatus('idle');
         }, 1500);
     } catch (e) {
         alert("Error cambiando contraseña");
         setPassChangeStatus('idle');
     }
  };

  const handleUserChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;

      setUserPassStatus('loading');
      setUserPassMsg('');

      if (userOldPass !== currentUser.password) {
          setUserPassStatus('error');
          setUserPassMsg('La contraseña actual no es correcta.');
          return;
      }
      if (userNewPass.length < 4) {
          setUserPassStatus('error');
          setUserPassMsg('La nueva contraseña es demasiado corta.');
          return;
      }
      if (userNewPass !== userConfirmPass) {
          setUserPassStatus('error');
          setUserPassMsg('Las contraseñas nuevas no coinciden.');
          return;
      }

      try {
          await storageService.changePassword(currentUser.id, userNewPass);
          setUserPassStatus('success');
          setUserPassMsg('Contraseña actualizada correctamente.');
          setUserOldPass('');
          setUserNewPass('');
          setUserConfirmPass('');
          setTimeout(() => {
              setUserPassStatus('idle');
              setUserPassMsg('');
          }, 3000);
      } catch (err) {
          setUserPassStatus('error');
          setUserPassMsg('Error al conectar con el servidor.');
      }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus('loading');
    setCreateError('');
    try {
        await storageService.adminCreateUser(newUser);
        setCreateStatus('success');
        setNewUser({ username: '', email: '', password: '1234', role: 'user' });
        setIsCreatingUser(false);
        loadUsers();
    } catch (err: any) {
        setCreateStatus('error');
        setCreateError(err.message || "Error creando usuario");
    }
  };

  const handleSendMessage = async () => {
     if (selectedMsgUsers.length === 0 || !msgTitle || !msgBody) return;
     setSendingMsg(true);
     try {
        await dataService.sendMessage(currentUser?.id || 'admin', selectedMsgUsers, msgTitle, msgBody);
        alert("Mensaje enviado correctamente");
        setMsgTitle('');
        setMsgBody('');
        setSelectedMsgUsers([]);
     } catch(e) {
        alert("Error al enviar mensaje");
     } finally {
        setSendingMsg(false);
     }
  };

  const toggleMsgUser = (id: string) => {
      if (id === 'ALL') {
          if (selectedMsgUsers.includes('ALL')) setSelectedMsgUsers([]);
          else setSelectedMsgUsers(['ALL']);
      } else {
          if (selectedMsgUsers.includes('ALL')) setSelectedMsgUsers([id]);
          else {
              if (selectedMsgUsers.includes(id)) setSelectedMsgUsers(prev => prev.filter(x => x !== id));
              else setSelectedMsgUsers(prev => [...prev, id]);
          }
      }
  };

  const handleTestConnection = async () => {
      setPingStatus('loading');
      try {
          const res = await dataService.ping();
          setPingStatus(res.status === 'ok' ? 'ok' : 'fail');
          setPingMessage(res.message || 'Error desconocido.');
      } catch (e: any) { setPingStatus('fail'); setPingMessage(e.message); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-lg">Configuración</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50 shrink-0 overflow-x-auto">
           {(!isLoggedIn || isAdmin) && <button onClick={() => setActiveTab('data')} className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'data' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent'}`}>Sistema</button>}
           {isLoggedIn && <button onClick={() => setActiveTab('account')} className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'account' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent'}`}>Cuenta</button>}
           {isAdmin && <button onClick={() => { setActiveTab('users'); loadUsers(); }} className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'users' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent'}`}>Usuarios</button>}
           {isAdmin && <button onClick={() => { setActiveTab('messages'); loadUsers(); }} className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'messages' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent'}`}>Mensajería</button>}
           <button onClick={() => setActiveTab('debug')} className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'debug' ? 'text-blue-600 border-blue-600 bg-white' : 'text-slate-500 border-transparent'}`}>PWA Status</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in">
                <div>
                    <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2"><LinkIcon className="w-4 h-4 text-blue-500"/> URL API</h5>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Script Google</label>
                        <button onClick={() => isUrlLocked ? setShowUnlockInput(true) : setIsUrlLocked(true)} className="text-[10px] font-bold text-blue-600 hover:underline">{isUrlLocked ? 'Editar' : 'Bloquear'}</button>
                    </div>
                    {showUnlockInput && isUrlLocked ? (
                        <div className="flex gap-2 mb-2">
                            <input type="password" placeholder="Pass: admin" className="flex-1 px-3 py-2 border rounded-lg text-sm" value={unlockPass} onChange={e => setUnlockPass(e.target.value)} />
                            <button onClick={() => { if(unlockPass==='admin'||unlockPass==='admin123'){setIsUrlLocked(false);setShowUnlockInput(false);} }} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-bold">OK</button>
                        </div>
                    ) : (
                        <input type={isUrlLocked ? "password" : "text"} value={url} disabled={isUrlLocked} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none text-xs font-mono" />
                    )}
                    {!isUrlLocked && <button onClick={async () => { setStatus('loading'); try { if(isAdmin) await dataService.adminUpdateSystemUrl(url); else dataService.setApiUrl(url); setStatus('success'); setTimeout(onSync, 1000); } catch(e) { setStatus('error'); } }} className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Guardar</button>}
                </div>

                {isAdmin && (
                    <div>
                        <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2"><Megaphone className="w-4 h-4 text-neon-pink"/> Novedades de Inicio</h5>
                        <textarea 
                            value={loginNews} 
                            onChange={e => setLoginNews(e.target.value)} 
                            className="w-full p-3 border rounded-xl text-xs h-24 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none resize-none"
                            placeholder="Escribe el mensaje que aparecerá en el Login..."
                        />
                        <button 
                            onClick={handleUpdateNews} 
                            disabled={newsStatus === 'loading'}
                            className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                        >
                            {newsStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                            {newsStatus === 'success' ? 'Actualizado' : 'Actualizar Noticias'}
                        </button>
                    </div>
                )}

                <div>
                    <h5 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2"><Activity className="w-4 h-4 text-green-500"/> Diagnóstico</h5>
                    <button onClick={handleTestConnection} className="w-full py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200">Verificar Conexión</button>
                    {pingStatus !== 'idle' && <p className={`mt-2 text-xs p-2 rounded border ${pingStatus==='ok'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{pingMessage}</p>}
                </div>
            </div>
          )}

          {/* ... Rest of existing tabs (messages, users, debug, account) ... */}
          {activeTab === 'messages' && isAdmin && (
              <div className="space-y-4 animate-in fade-in h-full flex flex-col">
                  {/* ... Existing message code ... */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-2">
                      Envía notificaciones emergentes a los usuarios. Aparecerán al abrir la app.
                  </div>
                  
                  <div className="flex-1 overflow-y-auto border rounded-xl p-2 bg-slate-50 max-h-40">
                      <div className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer border-b border-slate-100" onClick={() => toggleMsgUser('ALL')}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMsgUsers.includes('ALL') ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                              {selectedMsgUsers.includes('ALL') && <CheckCircle2 className="w-3 h-3 text-white"/>}
                          </div>
                          <span className="text-xs font-bold uppercase text-slate-700">Todos los usuarios</span>
                      </div>
                      {allUsers.filter(u => u.id !== currentUser?.id).map(u => (
                          <div key={u.id} className={`flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer ${selectedMsgUsers.includes('ALL') ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => toggleMsgUser(u.id)}>
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMsgUsers.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                {selectedMsgUsers.includes(u.id) && <CheckCircle2 className="w-3 h-3 text-white"/>}
                             </div>
                             <span className="text-xs text-slate-600">{u.username}</span>
                          </div>
                      ))}
                  </div>

                  <input 
                    type="text" 
                    placeholder="Título del mensaje" 
                    className="w-full p-3 border rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                    value={msgTitle}
                    onChange={e => setMsgTitle(e.target.value)}
                  />
                  
                  <textarea 
                    placeholder="Cuerpo del mensaje..." 
                    className="w-full p-3 border rounded-xl text-sm outline-none focus:border-blue-500 h-24 resize-none"
                    value={msgBody}
                    onChange={e => setMsgBody(e.target.value)}
                  />

                  <button 
                    onClick={handleSendMessage}
                    disabled={sendingMsg || selectedMsgUsers.length === 0 || !msgTitle || !msgBody}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                    Enviar Notificación
                  </button>
              </div>
          )}

          {activeTab === 'users' && isAdmin && (
              <div className="space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-center">
                      <h5 className="text-sm font-bold text-slate-800">Gestión de Usuarios ({allUsers.length})</h5>
                      <div className="flex gap-2">
                        <button onClick={loadUsers} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200"><RefreshCw className={`w-4 h-4 ${loadingUsers?'animate-spin':''}`} /></button>
                        <button onClick={() => setIsCreatingUser(!isCreatingUser)} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"><UserPlus className="w-4 h-4" /></button>
                      </div>
                  </div>

                  {isCreatingUser && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in slide-in-from-top-2">
                          <h6 className="text-xs font-bold text-slate-700 mb-3 uppercase">Nuevo Usuario</h6>
                          <form onSubmit={handleCreateUser} className="space-y-3">
                              <input required type="text" placeholder="Usuario" className="w-full p-2 text-sm border rounded" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                              <input required type="email" placeholder="Email" className="w-full p-2 text-sm border rounded" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                              <div className="flex gap-2">
                                  <input required type="text" placeholder="Pass" className="w-1/2 p-2 text-sm border rounded" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                  <select className="w-1/2 p-2 text-sm border rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                                      <option value="user">Usuario</option>
                                      <option value="coleccionista">Coleccionista</option>
                                      <option value="admin">Admin</option>
                                  </select>
                              </div>
                              {createError && <p className="text-xs text-red-500">{createError}</p>}
                              <div className="flex justify-end gap-2">
                                  <button type="button" onClick={() => setIsCreatingUser(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancelar</button>
                                  <button type="submit" disabled={createStatus === 'loading'} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-1">{createStatus==='loading' && <Loader2 className="w-3 h-3 animate-spin" />} Crear</button>
                              </div>
                          </form>
                      </div>
                  )}

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {allUsers.map(u => (
                          <div key={u.id} className="p-3 border rounded-xl flex flex-col gap-3 bg-white hover:shadow-sm transition group">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.isAuthorized ? 'bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-amber-500'}`}>
                                        {u.username.substring(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                            {u.username} 
                                            {u.role === 'admin' && <Crown className="w-3 h-3 text-amber-500"/>}
                                            {u.role === 'coleccionista' && <Star className="w-3 h-3 text-neon-blue fill-neon-blue"/>}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => { setPasswordChangeUser(u); setNewAdminPass(''); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition" title="Cambiar Contraseña">
                                        <KeyRound className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleToggleAuth(u)} className={`p-1.5 rounded transition ${u.isAuthorized ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`} title={u.isAuthorized ? "Desautorizar" : "Autorizar"}>
                                        {u.isAuthorized ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                             </div>
                             <div className="flex gap-1">
                                {['user', 'coleccionista', 'admin'].map((r) => (
                                    <button 
                                        key={r} 
                                        onClick={() => handleChangeRole(u, r as any)}
                                        className={`flex-1 text-[9px] font-bold uppercase py-1 rounded-md border transition-all ${u.role === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                             </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'debug' && (
              <div className="space-y-6 animate-in fade-in">
                  <h5 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-500" /> Estado de la App
                  </h5>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-xs font-bold text-slate-700">Service Worker (Offline)</div>
                          <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${'serviceWorker' in navigator ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {'serviceWorker' in navigator ? 'ACTIVO' : 'INACTIVO'}
                          </div>
                      </div>
                  </div>
              </div>
          )}
          
          {activeTab === 'account' && currentUser && (
              <div className="space-y-6 animate-in fade-in pb-10">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">{currentUser.username.substring(0,2).toUpperCase()}</div>
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                            {currentUser.username}
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">{currentUser.role}</span>
                        </p>
                        <p className="text-xs text-slate-500">{currentUser.email}</p>
                      </div>
                  </div>
                  {!isAdmin && currentUser.role === 'user' && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-800">
                              <p className="font-bold mb-1">Acceso Coleccionista</p>
                              <p>Actualmente tienes un rol básico. Para acceder al mercado de intercambios, un administrador debe ascender tu cuenta a rol "Coleccionista".</p>
                          </div>
                      </div>
                  )}

                  {/* Formulario cambio de contraseña */}
                  <div className="border-t pt-4">
                      <h5 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-slate-500" /> Cambiar Contraseña
                      </h5>
                      <form onSubmit={handleUserChangePassword} className="space-y-3">
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Contraseña Actual</label>
                              <input 
                                  type="password" 
                                  value={userOldPass} 
                                  onChange={e => setUserOldPass(e.target.value)} 
                                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
                                  placeholder="******"
                                  required
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Nueva Contraseña</label>
                              <input 
                                  type="password" 
                                  value={userNewPass} 
                                  onChange={e => setUserNewPass(e.target.value)} 
                                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
                                  placeholder="Mínimo 4 caracteres"
                                  required
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Confirmar Nueva</label>
                              <input 
                                  type="password" 
                                  value={userConfirmPass} 
                                  onChange={e => setUserConfirmPass(e.target.value)} 
                                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white outline-none transition ${userConfirmPass && userNewPass !== userConfirmPass ? 'border-red-500' : 'focus:border-blue-500'}`}
                                  placeholder="Repite la nueva contraseña"
                                  required
                              />
                          </div>
                          
                          {userPassMsg && (
                              <div className={`text-xs p-2 rounded ${userPassStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                  {userPassMsg}
                              </div>
                          )}

                          <button 
                              type="submit" 
                              disabled={userPassStatus === 'loading' || !userOldPass || !userNewPass || !userConfirmPass}
                              className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 mt-2"
                          >
                              {userPassStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                              Actualizar Contraseña
                          </button>
                      </form>
                  </div>
              </div>
          )}
        </div>
      </div>

      {passwordChangeUser && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xs animate-in zoom-in-95">
                <h4 className="font-bold text-slate-800 mb-1">Cambiar Contraseña</h4>
                <p className="text-xs text-slate-500 mb-4">Para: <span className="font-bold text-blue-600">{passwordChangeUser.username}</span></p>
                <input 
                    type="text" 
                    autoFocus
                    placeholder="Nueva contraseña" 
                    className="w-full p-2 border rounded-lg text-sm mb-4"
                    value={newAdminPass}
                    onChange={e => setNewAdminPass(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setPasswordChangeUser(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancelar</button>
                    <button 
                        onClick={handleAdminChangePassword}
                        disabled={passChangeStatus === 'loading' || !newAdminPass} 
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-2"
                    >
                        {passChangeStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                        {passChangeStatus === 'success' ? 'Guardado' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
