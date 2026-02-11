
import { User, Collection, Sticker } from '../types';
import { STORAGE_USER_KEY, STORAGE_COLLECTION_PREFIX, STORAGE_USERS_INDEX } from '../constants';
import { dataService } from './dataService';

const STORAGE_LAST_USER_KEY = 'adrenalyn26_last_user_name';

interface UserDirectory {
  [key: string]: User; 
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let pendingChanges: Record<string, number> = {};
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e) => {
    if (Object.keys(pendingChanges).length > 0) {
      e.preventDefault();
      e.returnValue = ''; 
      flushChanges(storageService.getCurrentUser()?.id || ''); 
    }
  });
}

const flushChanges = async (userId: string) => {
  if (!userId || Object.keys(pendingChanges).length === 0) return;
  if (isSyncing) {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => flushChanges(userId), 2000);
      return;
  }
  isSyncing = true;
  const batchToSave = { ...pendingChanges };
  const itemsToSave = Object.entries(batchToSave).map(([stickerId, count]) => ({
    stickerId,
    count
  }));
  try {
    await dataService.syncCollection(userId, itemsToSave);
    Object.keys(batchToSave).forEach(key => { delete pendingChanges[key]; });
  } catch (err) {
    console.error('Error sincronizando...', err);
  } finally {
      isSyncing = false;
      if (Object.keys(pendingChanges).length > 0) {
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => flushChanges(userId), 2000);
      }
  }
};

export const storageService = {
  getUsersDirectory: (): UserDirectory => {
    const data = localStorage.getItem(STORAGE_USERS_INDEX);
    return data ? JSON.parse(data) : {};
  },

  saveUserToDirectory: (user: User) => {
    const directory = storageService.getUsersDirectory();
    directory[user.username.toLowerCase().trim()] = user;
    localStorage.setItem(STORAGE_USERS_INDEX, JSON.stringify(directory));
  },

  setLastUser: (username: string) => {
    localStorage.setItem(STORAGE_LAST_USER_KEY, username);
  },

  getLastUser: (): string => {
    return localStorage.getItem(STORAGE_LAST_USER_KEY) || '';
  },

  register: async (username: string, email: string): Promise<User | null> => {
    await delay(500);
    await dataService.registerUser(username, email);
    return null;
  },

  adminCreateUser: async (user: Partial<User>): Promise<User> => {
    const result = await dataService.adminCreateUser(user);
    const newId = result.userId || 'temp_' + Date.now();
    const newUser: User = {
        id: newId,
        username: user.username || '',
        email: user.email || '',
        password: user.password || '',
        isAuthorized: true,
        role: user.role
    };
    storageService.saveUserToDirectory(newUser);
    return newUser;
  },

  adminDeleteUser: async (userId: string) => {
    await dataService.adminDeleteUser(userId);
    const directory = storageService.getUsersDirectory();
    let keyToDelete = null;
    Object.keys(directory).forEach(key => {
        if (directory[key].id === userId) keyToDelete = key;
    });
    if (keyToDelete) {
        delete directory[keyToDelete];
        localStorage.setItem(STORAGE_USERS_INDEX, JSON.stringify(directory));
    }
  },

  login: async (usernameInput: string, passwordInput: string): Promise<User> => {
    await delay(500);
    
    if (usernameInput.toLowerCase().trim() === 'admin' && passwordInput === 'admin123') {
        const adminUser: User = {
            id: 'admin-master',
            username: 'admin',
            email: 'admin@adrenalyn.com',
            role: 'admin',
            isAuthorized: true,
            password: 'admin123' 
        };
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(adminUser));
        storageService.setLastUser(adminUser.username);
        return adminUser;
    }

    try {
      await dataService.fetchCatalog();
    } catch (e) {
      console.warn("Modo offline");
    }

    const directory = storageService.getUsersDirectory();
    const user = directory[usernameInput.toLowerCase().trim()];
    
    if (!user) throw new Error('Usuario no encontrado.');
    if (!user.isAuthorized) throw new Error('Cuenta pendiente de aprobación.');

    const storedPass = user.password || "";
    if (storedPass !== passwordInput) throw new Error('Contraseña incorrecta.');

    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    storageService.setLastUser(user.username);
    
    const collKey = `${STORAGE_COLLECTION_PREFIX}${user.id}`;
    if (!localStorage.getItem(collKey)) {
        localStorage.setItem(collKey, JSON.stringify({}));
    }
    return user;
  },

  changePassword: async (userId: string, newPass: string) => {
    await dataService.updateUserPassword(userId, newPass);
    const directory = storageService.getUsersDirectory();
    const userKey = Object.keys(directory).find(k => directory[k].id === userId);
    if (userKey) {
        directory[userKey].password = newPass;
        localStorage.setItem(STORAGE_USERS_INDEX, JSON.stringify(directory));
    }
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.password = newPass;
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
    }
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  logout: () => {
    const user = storageService.getCurrentUser();
    if (user) flushChanges(user.id);
    localStorage.removeItem(STORAGE_USER_KEY);
  },

  getAllUsers: (): User[] => {
    const directory = storageService.getUsersDirectory();
    return Object.values(directory);
  },

  importExternalData: (users: User[], collections: Record<string, Collection>) => {
    const newDirectory: UserDirectory = {};
    users.forEach(u => {
      const key = u.username.toLowerCase().trim();
      newDirectory[key] = u;
    });
    localStorage.setItem(STORAGE_USERS_INDEX, JSON.stringify(newDirectory));

    const currentUser = storageService.getCurrentUser();
    Object.entries(collections).forEach(([userId, remoteCollection]) => {
      if (currentUser && currentUser.id === userId) {
          const localKey = `${STORAGE_COLLECTION_PREFIX}${userId}`;
          const mergedCollection = { ...remoteCollection };
          Object.keys(pendingChanges).forEach(stickerId => {
              const pendingVal = pendingChanges[stickerId];
              if (pendingVal > 0) mergedCollection[stickerId] = pendingVal;
              else delete mergedCollection[stickerId];
          });
          localStorage.setItem(localKey, JSON.stringify(mergedCollection));
      } else {
         localStorage.setItem(`${STORAGE_COLLECTION_PREFIX}${userId}`, JSON.stringify(remoteCollection));
      }
    });
  },

  getCollection: (userId: string): Collection => {
    const data = localStorage.getItem(`${STORAGE_COLLECTION_PREFIX}${userId}`);
    return data ? JSON.parse(data) : {};
  },

  updateStickerCount: (userId: string, stickerId: string, delta: number): Collection => {
    const currentCollection = storageService.getCollection(userId);
    const currentCount = currentCollection[stickerId] || 0;
    const newCount = Math.max(0, currentCount + delta);
    const updatedCollection = { ...currentCollection, [stickerId]: newCount };
    if (newCount === 0) delete updatedCollection[stickerId];
    localStorage.setItem(`${STORAGE_COLLECTION_PREFIX}${userId}`, JSON.stringify(updatedCollection));
    pendingChanges[stickerId] = newCount;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => flushChanges(userId), 3000);
    return updatedCollection;
  },

  getPendingChangesCount: () => Object.keys(pendingChanges).length
};
