
import { Sticker } from './types';

// Nombre de la hoja en Google Sheets (Tab)
export const SHEET_NAME = 'app'; 

export const STORAGE_USER_KEY = 'adrenalyn26_current_user';
export const STORAGE_USERS_INDEX = 'adrenalyn26_users_index';
export const STORAGE_COLLECTION_PREFIX = 'adrenalyn26_data_';

export const MOCK_STICKERS: Sticker[] = [];

// ==========================================================================================
// ESCUDOS DE EQUIPOS (URLs)
// ==========================================================================================
export const TEAM_LOGOS: Record<string, string> = {
  'alavés': 'https://upload.wikimedia.org/wikipedia/en/2/2e/Deportivo_Alaves_logo.svg',
  'alaves': 'https://upload.wikimedia.org/wikipedia/en/2/2e/Deportivo_Alaves_logo.svg',
  'athletic': 'https://upload.wikimedia.org/wikipedia/en/9/98/Club_Athletic_Bilbao_logo.svg',
  'atlético': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'atletico': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'betis': 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg',
  'celta': 'https://upload.wikimedia.org/wikipedia/en/1/12/RC_Celta_de_Vigo_logo.svg',
  'espanyol': 'https://upload.wikimedia.org/wikipedia/en/d/d6/Rcd_espanyol_logo.svg',
  'getafe': 'https://upload.wikimedia.org/wikipedia/en/4/4c/Getafe_CF.svg',
  'girona': 'https://upload.wikimedia.org/wikipedia/en/9/90/For_Girona_FC.svg',
  'palmas': 'https://upload.wikimedia.org/wikipedia/en/b/b0/UD_Las_Palmas_logo.svg',
  'leganés': 'https://upload.wikimedia.org/wikipedia/en/0/02/CD_Leganes.svg',
  'leganes': 'https://upload.wikimedia.org/wikipedia/en/0/02/CD_Leganes.svg',
  'mallorca': 'https://upload.wikimedia.org/wikipedia/en/e/e0/RCD_Mallorca_logo.svg',
  'osasuna': 'https://upload.wikimedia.org/wikipedia/en/d/db/Osasuna_logo.svg',
  'rayo': 'https://upload.wikimedia.org/wikipedia/en/1/17/Rayo_Vallecano_logo.svg',
  'madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'sociedad': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
  'sevilla': 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
  'valencia': 'https://upload.wikimedia.org/wikipedia/en/c/ce/Val_logo.svg',
  'valladolid': 'https://upload.wikimedia.org/wikipedia/en/6/6e/Real_Valladolid_Logo.svg',
  'villarreal': 'https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg'
};

// ==========================================================================================
// COLORES DE EQUIPOS (Para cuando no hay imagen)
// ==========================================================================================
export const TEAM_COLORS: Record<string, { primary: string; secondary: string; text: string }> = {
  // LaLiga EA Sports Colors
  'alavés': { primary: '#005BBB', secondary: '#FFFFFF', text: 'white' }, // Deportivo Alavés
  'alaves': { primary: '#005BBB', secondary: '#FFFFFF', text: 'white' },
  'athletic': { primary: '#EE2523', secondary: '#FFFFFF', text: 'white' }, // Athletic Club
  'atlético': { primary: '#CB3524', secondary: '#171796', text: 'white' }, // Atlético de Madrid
  'atletico': { primary: '#CB3524', secondary: '#171796', text: 'white' },
  'barcelona': { primary: '#004D98', secondary: '#A50044', text: 'white' }, // FC Barcelona
  'betis': { primary: '#0BB363', secondary: '#FFFFFF', text: 'white' }, // Real Betis
  'celta': { primary: '#87CEEB', secondary: '#FFFFFF', text: 'black' }, // RC Celta
  'espanyol': { primary: '#007FC8', secondary: '#FFFFFF', text: 'white' }, // RCD Espanyol
  'getafe': { primary: '#00519E', secondary: '#00519E', text: 'white' }, // Getafe CF
  'girona': { primary: '#D11C21', secondary: '#FFFFFF', text: 'white' }, // Girona FC
  'palmas': { primary: '#FECD00', secondary: '#0072CE', text: 'black' }, // UD Las Palmas
  'leganés': { primary: '#005BBB', secondary: '#FFFFFF', text: 'white' }, // CD Leganés
  'leganes': { primary: '#005BBB', secondary: '#FFFFFF', text: 'white' },
  'mallorca': { primary: '#E20613', secondary: '#000000', text: 'white' }, // RCD Mallorca
  'osasuna': { primary: '#DA291C', secondary: '#0A1E40', text: 'white' }, // CA Osasuna
  'rayo': { primary: '#FFFFFF', secondary: '#CE1126', text: 'black' }, // Rayo Vallecano
  'madrid': { primary: '#FFFFFF', secondary: '#FEBE10', text: 'black' }, // Real Madrid
  'sociedad': { primary: '#0067B1', secondary: '#FFFFFF', text: 'white' }, // Real Sociedad
  'sevilla': { primary: '#FFFFFF', secondary: '#D4001F', text: 'black' }, // Sevilla FC
  'valencia': { primary: '#FFFFFF', secondary: '#000000', text: 'black' }, // Valencia CF
  'valladolid': { primary: '#5E278E', secondary: '#FFFFFF', text: 'white' }, // Real Valladolid
  'villarreal': { primary: '#FBE106', secondary: '#00519E', text: 'black' }, // Villarreal CF
  // Fallback
  'default': { primary: '#334155', secondary: '#94a3b8', text: 'white' }
};
