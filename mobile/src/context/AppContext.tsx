import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  litrosTotales: number;
  puntosUsuario: number;
  agregarLitros: (litros: number) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [litrosTotales, setLitrosTotales] = useState(0);
  const [puntosUsuario, setPuntosUsuario] = useState(0);

  const agregarLitros = (litros: number) => {
    setLitrosTotales(prev => prev + litros);
    setPuntosUsuario(prev => prev + litros * 10); // 10 puntos por litro
  };

  return (
    <AppContext.Provider value={{ litrosTotales, puntosUsuario, agregarLitros }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
