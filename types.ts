
export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  isAuthorized?: boolean;
  role?: 'admin' | 'user' | 'coleccionista';
}

export type StickerRarity = 'BASE' | 'ESPECIAL' | 'TOP';

export interface Sticker {
  id: string; 
  number: number; 
  displayNumber: string; 
  name: string;   
  team: string;   
  category: string; 
  position: 'POR' | 'DEF' | 'MED' | 'DEL' | 'ESC'; 
  imageUrl?: string; 
  isSpecial: boolean; 
}

export interface Team {
  name: string;
  logoUrl?: string;
}

export interface CollectionItem {
  stickerId: string;
  count: number;
}

export interface Collection {
  [stickerId: string]: number;
}

export type ViewState = 'AUTH' | 'DASHBOARD';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

// --- MENSAJERÍA ---
export interface SystemMessage {
  id: string;
  senderId: string;
  receiverId: string; // ID usuario o 'ALL'
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

// --- INTERCAMBIOS ---

export type TradeStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CADUCADA' | 'COMPLETADA' | 'CANCELADA';
export type TradeFinalStatus = 'OK' | 'ME_HE_NEGADO' | 'NO_VINO' | '';

export interface Trade {
  id: string; // id_cambio
  senderId: string; // id_usuario_1
  receiverId: string; // id_usuario_2
  offeredStickerId: string; // id_cromo_1 (puede ser CSV "id1,id2")
  requestedStickerId: string; // id_cromo_2 (puede ser CSV "id3,id4")
  createdAt: string; // fecha_inicio
  updatedAt: string; // fecha_final
  status: TradeStatus; // estado
  
  senderFinalStatus: TradeFinalStatus; // final_1
  receiverFinalStatus: TradeFinalStatus; // final_2
  
  senderComment: string; // text_usuario_1
  receiverComment: string; // text_usuario_2
}

export interface TradeExpanded extends Trade {
  sender?: User;
  receiver?: User;
  offeredStickers: Sticker[];   // Array de cromos ofrecidos
  requestedStickers: Sticker[]; // Array de cromos solicitados
}
