
import { Sticker, User, Collection, Trade, TradeStatus, TradeFinalStatus, Team, SystemMessage } from '../types';
import { storageService } from './storageService';

const STORAGE_API_URL_KEY = 'adrenalyn26_api_url_v3'; 
const STORAGE_CATALOG_CACHE_KEY = 'adrenalyn26_catalog_cache_v10';
const STORAGE_LOGOS_CACHE_KEY = 'adrenalyn26_team_logos_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000; 

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxv55S3H2nCkM2SyL16VIvdXqi90_TfueLrudZanoKWG2J-Lo_ezna_dCzTVk6NXVgNrg/exec';
const TEAM_LOGOS_FOLDER_ID = '1u1fNdomCGiGonPYIw4VxmQPW-llSDsmv';

interface RawData {
  cromos: any[];
  especiales: any[]; 
  usuarios: any[];
  coleccion_usuarios: any[];
  cambios?: any[];
  equipos?: any[];
  mensajes?: any[];
  config?: any[]; // Array from backend config sheet
  systemConfig?: {
      active_api_url?: string;
  };
  [key: string]: any;
}

export const dataService = {
  getApiUrl: (): string => {
    const stored = localStorage.getItem(STORAGE_API_URL_KEY);
    if (stored && stored.includes('script.google.com/macros')) {
      return stored.trim();
    }
    return DEFAULT_API_URL;
  },

  setApiUrl: (url: string) => {
    localStorage.setItem(STORAGE_API_URL_KEY, url.trim());
  },

  adminUpdateSystemUrl: async (newUrl: string): Promise<void> => {
     const cleanUrl = newUrl.trim();
     dataService.setApiUrl(cleanUrl);
     try {
         const payload = JSON.stringify({ action: 'admin_set_config', key: 'active_api_url', value: cleanUrl });
         await fetch(cleanUrl, { 
             method: 'POST', 
             mode: 'no-cors', 
             headers: { 'Content-Type': 'text/plain' }, 
             body: payload 
         });
     } catch(e) {
         console.error("Error guardando config en nube", e);
     }
  },

  // Update News Message
  adminUpdateLoginMessage: async (message: string): Promise<void> => {
      const url = dataService.getApiUrl();
      const payload = JSON.stringify({ action: 'update_login_news', message });
      await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: payload });
  },

  ping: async (): Promise<{ status: string, message: string }> => {
     const url = dataService.getApiUrl();
     try {
         const response = await fetch(`${url}?action=ping`);
         if (!response.ok) throw new Error("Error HTTP " + response.status);
         return await response.json();
     } catch (e: any) {
         throw new Error(e.message || "Error de conexión.");
     }
  },

  fetchTeamLogos: async (): Promise<Record<string, string>> => {
      const cached = localStorage.getItem(STORAGE_LOGOS_CACHE_KEY);
      if (cached) {
          try {
              const parsed = JSON.parse(cached);
              if (Date.now() - parsed.timestamp < CACHE_DURATION * 3) return parsed.data;
          } catch(e) {}
      }
      const url = dataService.getApiUrl();
      const payload = JSON.stringify({ action: 'get_folder_files', folderId: TEAM_LOGOS_FOLDER_ID });
      try {
          const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload });
          const data = await response.json();
          if (data.status === 'success' && data.files) {
              localStorage.setItem(STORAGE_LOGOS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: data.files }));
              return data.files;
          }
      } catch(e) {}
      return {};
  },

  registerUser: async (username: string, email: string): Promise<{ success: boolean; message: string }> => {
    const url = dataService.getApiUrl();
    const payload = JSON.stringify({ action: 'register', username, email });
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload });
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message || 'Error en el registro');
    return { success: true, message: 'Solicitud enviada.' };
  },

  adminCreateUser: async (user: Partial<User>): Promise<{ success: boolean; userId?: string }> => {
    const url = dataService.getApiUrl();
    const payload = JSON.stringify({ action: 'admin_create_user', ...user });
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload });
    const data = await response.json();
    return { success: data.status === 'success', userId: data.userId };
  },

  adminDeleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const url = dataService.getApiUrl();
    const payload = JSON.stringify({ action: 'admin_delete_user', targetUserId: userId });
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload });
    const data = await response.json();
    return { success: data.status === 'success' };
  },

  // --- MESSAGING METHODS ---
  sendMessage: async (senderId: string, recipients: string[], title: string, body: string): Promise<{ success: boolean }> => {
    const url = dataService.getApiUrl();
    const payload = JSON.stringify({ action: 'send_message', senderId, recipients, title, body });
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: payload });
    const data = await response.json();
    return { success: data.status === 'success' };
  },

  markMessageAsRead: async (messageId: string): Promise<void> => {
    const url = dataService.getApiUrl();
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'mark_message_read', messageId }) });
  },

  updateUserPassword: async (userId: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const url = dataService.getApiUrl();
    const payload = JSON.stringify({ action: 'change_password', userId, password: newPassword });
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: payload });
    return { success: true, message: 'Actualizada.' };
  },

  syncCollection: async (userId: string, items: any[]): Promise<void> => {
    const url = dataService.getApiUrl();
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'update_collection', userId, items }) });
  },

  updateStickerImage: async (stickerId: string, imageUrl: string): Promise<{ success: boolean; message: string }> => {
    const url = dataService.getApiUrl();
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'update_sticker_image', stickerId, imageUrl }) });
    return { success: true, message: 'OK' };
  },

  uploadImage: async (file: File): Promise<{ success: boolean; url?: string; message: string }> => {
    const url = dataService.getApiUrl();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
                const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'upload_image', base64: base64Data, mimeType: file.type, filename: file.name }) });
                const data = await response.json();
                if (data.status === 'success' && data.fileId) {
                    resolve({ success: true, url: `https://drive.google.com/thumbnail?sz=w1000&id=${data.fileId}`, message: 'OK' });
                } else reject(new Error(data.message));
            } catch (error) { reject(error); }
        };
        reader.onerror = reject;
    });
  },

  createTrade: async (trade: { senderId: string, receiverId: string, offeredStickerIds: string[], requestedStickerIds: string[], senderComment: string }) => {
    const url = dataService.getApiUrl();
    const payload = {
        action: 'trade_create',
        senderId: trade.senderId,
        receiverId: trade.receiverId,
        offeredStickerId: trade.offeredStickerIds.join(','), // Convert array to CSV string
        requestedStickerId: trade.requestedStickerIds.join(','), // Convert array to CSV string
        senderComment: trade.senderComment
    };
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
  },

  updateTradeStatus: async (tradeId: string, status: string, userId: string, subAction?: string, finalStatus?: string, comment?: string) => {
    const url = dataService.getApiUrl();
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'trade_update', tradeId, status, userId, subAction, finalStatus, comment }) });
  },

  processCatalogData: (data: RawData): { stickers: Sticker[], trades: Trade[], teams: Team[], messages: SystemMessage[], loginMessage?: string } => {
    // Config parsing from 'config' sheet
    let loginMessage = '';
    if (data.config) {
        data.config.forEach((row: any) => {
            if (row.key === 'active_api_url') {
                const cloudUrl = row.value;
                const currentUrl = dataService.getApiUrl();
                if (cloudUrl && cloudUrl.includes('script.google.com') && cloudUrl.trim() !== currentUrl.trim()) {
                    localStorage.setItem(STORAGE_API_URL_KEY, cloudUrl.trim());
                }
            }
            if (row.key === 'login_message') {
                loginMessage = row.value;
            }
        });
    }

    // Procesar Usuarios
    const rawUsuarios = data.usuarios || [];
    if (rawUsuarios.length > 0) {
      const parsedUsers: User[] = [];
      const parsedCollections: Record<string, Collection> = {};
      
      rawUsuarios.forEach((u: any) => {
        const id = String(getVal(u, ['idusuario', 'id_usuario', 'userid', 'uuid', 'id']) || '');
        const name = String(getVal(u, ['nombre', 'usuario', 'username', 'name', 'user']) || '');
        const authRaw = getVal(u, ['autorizado', 'activo', 'authorized', 'active', 'auth']);
        
        if (id && name) {
          parsedUsers.push({ 
            id, 
            username: name, 
            email: String(getVal(u, ['email', 'correo', 'mail']) || ''), 
            password: String(getVal(u, ['pass', 'password', 'clave']) || ''), 
            isAuthorized: String(authRaw).toUpperCase() === 'TRUE', 
            role: String(getVal(u, ['rol', 'role']) || 'user').toLowerCase() as any
          });
          parsedCollections[id] = {};
        }
      });

      data.coleccion_usuarios?.forEach((row: any) => {
        const uid = String(getVal(row, ['idusuario', 'id_usuario', 'userid', 'usuario']));
        const sid = String(getVal(row, ['idcromo', 'id_cromo', 'stickerid', 'numerofinal']));
        const qty = Number(getVal(row, ['cantidad', 'count']) || 0);
        if (uid && sid && parsedCollections[uid] && qty > 0) parsedCollections[uid][sid] = qty;
      });
      
      storageService.importExternalData(parsedUsers, parsedCollections);
    }

    // Procesar Cromos
    const stickers = (data.cromos || []).map((row: any, i: number): Sticker => {
      const realId = String(getVal(row, ['numerofinal', 'numero_final', 'numero', 'idcromo', 'id_cromo', 'id']) || `ukn-${i}`).trim();
      let sortNum = parseFloat(realId) || 0;
      if (realId.toLowerCase().includes('b')) sortNum += 0.5;
      
      const cat = String(getVal(row, ['categoria', 'cat']) || 'Básicos');
      const normCat = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      // CAMBIO AQUÍ: Si incluye 'estadio', no es especial.
      return {
        id: realId, 
        number: sortNum,
        displayNumber: realId, 
        name: String(getVal(row, ['nombre', 'jugador', 'name']) || 'Desconocido'),
        team: String(getVal(row, ['equipo', 'team']) || 'Varios'),
        category: cat,
        position: 'MED',
        imageUrl: processImageUrl(getVal(row, ['imagenurl', 'imagen', 'foto', 'img', 'url'])),
        isSpecial: !normCat.includes('basic') && !normCat.includes('base') && !normCat.includes('estadio')
      };
    });

    // Procesar Equipos
    const teams: Team[] = (data.equipos || []).map((row: any) => ({
        name: String(getVal(row, ['nombreequipo', 'nombre_equipo', 'equipo', 'team', 'name']) || '').trim(),
        logoUrl: processImageUrl(getVal(row, ['clublogo', 'club_logo', 'imagen', 'logo', 'url']))
    })).filter(t => t.name);

    // Procesar Cambios
    const trades: Trade[] = (data.cambios || []).map((row: any) => ({
       id: String(row.id || ''), 
       senderId: String(row.sender || row.senderid || ''), 
       receiverId: String(row.receiver || row.receiverid || ''),
       offeredStickerId: String(row.offer || row.offeredstickerid || ''), // Keep as string (possibly CSV)
       requestedStickerId: String(row.request || row.requestedstickerid || ''), // Keep as string (possibly CSV)
       status: (row.status || 'PENDIENTE') as TradeStatus, 
       createdAt: row.created || row.createdat, 
       updatedAt: row.updated || row.updatedat,
       senderFinalStatus: (row.s_final || row.senderfinalstatus) as TradeFinalStatus, 
       receiverFinalStatus: (row.r_final || row.receiverfinalstatus) as TradeFinalStatus,
       senderComment: row.s_msg || row.sendercomment, 
       receiverComment: row.r_msg || row.receivercomment
    })).filter(t => t.id);

    // Procesar Mensajes
    const messages: SystemMessage[] = (data.mensajes || []).map((row: any) => ({
      id: String(row.id || ''),
      senderId: String(row.sender_id || row.senderid || ''),
      receiverId: String(row.receiver_id || row.receiverid || ''),
      title: String(row.title || row.titulo || ''),
      body: String(row.body || row.cuerpo || row.mensaje || ''),
      createdAt: String(row.created_at || row.fecha || ''),
      read: String(row.read || row.leido || '').toUpperCase() === 'TRUE'
    })).filter((m: any) => m.id);

    return { stickers, trades, teams, messages, loginMessage };
  },

  fetchCatalog: async (forceRefresh = false): Promise<{ stickers: Sticker[], trades: Trade[], teams: Team[], messages: SystemMessage[], loginMessage?: string }> => {
    const url = dataService.getApiUrl();
    
    if (!forceRefresh) {
        const cached = localStorage.getItem(STORAGE_CATALOG_CACHE_KEY);
        if (cached) {
            try {
                const p = JSON.parse(cached);
                if (Date.now() - p.timestamp < CACHE_DURATION && p.data?.cromos?.length) {
                    return dataService.processCatalogData(p.data);
                }
            } catch(e) {}
        }
    }
    
    try {
      const response = await fetch(`${url}?_t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      localStorage.setItem(STORAGE_CATALOG_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      return dataService.processCatalogData(data);
    } catch (error: any) {
      console.warn("Fallo fetch, intentando usar caché offline:", error);
      const cached = localStorage.getItem(STORAGE_CATALOG_CACHE_KEY);
      if (cached) return dataService.processCatalogData(JSON.parse(cached).data);
      throw error; 
    }
  }
};

function getVal(o: any, k: string[]) {
  if (!o) return undefined;
  for(const x of k) {
    if(o[x] !== undefined && o[x] !== null && o[x] !== "") return o[x];
  }
  return undefined;
}

function processImageUrl(url: any): string | undefined {
  if (!url) return undefined;
  let str = String(url).trim();
  if (!str.includes('drive.google.com') && !str.includes('googleusercontent.com')) return str;
  let id = '';
  const m1 = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) id = m1[1];
  else { 
    const m2 = str.match(/[?&]id=([a-zA-Z0-9_-]+)/); 
    if (m2) id = m2[1]; 
  }
  return id ? `https://drive.google.com/thumbnail?sz=w1000&id=${id}` : str;
}
