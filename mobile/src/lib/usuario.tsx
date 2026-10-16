import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setToken } from './api';
import type { Rol, Sesion, Usuario } from './types';

const KEY = 'sesion';

interface UsuarioState {
  usuario: Usuario | null;
  esAdmin: boolean;
  puede: (...roles: Rol[]) => boolean; // admin siempre puede
  cargando: boolean; // recuperando la sesión guardada al abrir la app
  iniciar: (s: Sesion) => Promise<void>;
  salir: () => Promise<void>;
}

const UsuarioContext = createContext<UsuarioState | undefined>(undefined);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Recupera la sesión guardada y confirma con el servidor (por si cambió el rol)
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(KEY);
        if (!json) return;
        const sesion: Sesion = JSON.parse(json);
        setToken(sesion.token);
        setUsuario(sesion.usuario);
        const actual = await api.yo();
        setUsuario(actual);
      } catch (e) {
        // Token vencido o inválido → cerrar sesión; sin conexión → conservarla
        if (!(e as Error).message.startsWith('No hay conexión')) {
          setToken(null);
          setUsuario(null);
          await AsyncStorage.removeItem(KEY).catch(() => {});
        }
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const iniciar = async (s: Sesion) => {
    setToken(s.token);
    setUsuario(s.usuario);
    await AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
  };

  const salir = async () => {
    setToken(null);
    setUsuario(null);
    await AsyncStorage.removeItem(KEY).catch(() => {});
  };

  return (
    <UsuarioContext.Provider value={{
      usuario,
      esAdmin: usuario?.rol === 'admin',
      puede: (...roles: Rol[]) => !!usuario && (usuario.rol === 'admin' || roles.includes(usuario.rol)),
      cargando,
      iniciar,
      salir,
    }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario(): UsuarioState {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  return ctx;
}
