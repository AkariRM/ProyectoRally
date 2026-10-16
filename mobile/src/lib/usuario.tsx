import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Usuario } from './types';

const KEY = 'usuario';

interface UsuarioState {
  usuario: Usuario | null;
  guardar: (u: Usuario) => Promise<void>;
  salir: () => Promise<void>;
}

const UsuarioContext = createContext<UsuarioState | undefined>(undefined);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(json => json && setUsuario(JSON.parse(json)))
      .catch(() => {});
  }, []);

  const guardar = async (u: Usuario) => {
    setUsuario(u);
    await AsyncStorage.setItem(KEY, JSON.stringify(u)).catch(() => {});
  };

  const salir = async () => {
    setUsuario(null);
    await AsyncStorage.removeItem(KEY).catch(() => {});
  };

  return <UsuarioContext.Provider value={{ usuario, guardar, salir }}>{children}</UsuarioContext.Provider>;
}

export function useUsuario(): UsuarioState {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  return ctx;
}
