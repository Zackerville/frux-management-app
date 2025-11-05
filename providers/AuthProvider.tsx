// providers/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

let RNAsync: any;
try {
  RNAsync = require('@react-native-async-storage/async-storage').default;
} catch {}

const storage = {
  async get(key: string) {
    return Platform.OS === 'web' ? localStorage.getItem(key) : RNAsync?.getItem(key);
  },
  async set(key: string, val: string) {
    return Platform.OS === 'web' ? localStorage.setItem(key, val) : RNAsync?.setItem(key, val);
  },
  async remove(keys: string[]) {
    if (Platform.OS === 'web') {
      keys.forEach(k => localStorage.removeItem(k));
      return;
    }
    return RNAsync?.multiRemove(keys);
  },
};

type User = { role: 'staff' | 'admin' } | null;
type Ctx = {
  user: User;
  hydrated: boolean;
  signInAsStaff: () => Promise<void>;
  signInAsAdmin: () => Promise<void>;
  logout: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const role = await storage.get('role');
      if (role === 'staff' || role === 'admin') setUser({ role: role as any });
      setHydrated(true);
    })();
  }, []);

  const signInAsStaff = async () => {
    await storage.set('role', 'staff');
    setUser({ role: 'staff' });
    router.replace('/staff');
  };

  const signInAsAdmin = async () => {
    await storage.set('role', 'admin');
    setUser({ role: 'admin' });
    router.replace('/admin');
  };

const logout = async () => {
  if (Platform.OS === 'web') 
  {
    localStorage.removeItem('role');
    localStorage.removeItem('token');
  } 
  else await AsyncStorage.multiRemove(['role', 'token']);
  setUser(null);

  router.replace('/auth/login');

  if (Platform.OS === 'web') {
    window.setTimeout(() => { window.location.href = '/'; }, 0);
  }
};

  return (
    <AuthCtx.Provider value={{ user, hydrated, signInAsStaff, signInAsAdmin, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
