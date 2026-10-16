// Tipos y utilidades compartidas por Mapa.tsx (celular) y Mapa.web.tsx (navegador)

export interface PuntoMapa {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
  descripcion?: string;
  color?: string;
}

export interface ZonaMapa {
  id: string;
  lat: number;
  lng: number;
  radioM: number;
  activa?: boolean; // resaltada (ej. el usuario recibe avisos de ella)
  color?: string; // color hex, ej. '#C62828' (reemplaza al de activa)
  titulo?: string;
  porConfirmar?: boolean; // ubicación provisional: no se dibuja el círculo, va en un pin "?"
}

// Zonas por confirmar agrupadas por punto (varias pueden compartir la coordenada provisional)
export function agruparPorConfirmar(zonas: ZonaMapa[]) {
  const grupos: Record<string, { lat: number; lng: number; nombres: string[] }> = {};
  for (const z of zonas.filter(z => z.porConfirmar)) {
    const clave = `${z.lat.toFixed(4)},${z.lng.toFixed(4)}`;
    (grupos[clave] = grupos[clave] || { lat: z.lat, lng: z.lng, nombres: [] }).nombres.push(z.titulo ?? 'Zona');
  }
  return Object.entries(grupos).map(([id, g]) => ({ id, ...g }));
}

// '#C62828' + 0.25 → 'rgba(198,40,40,0.25)'
export function conAlfa(hex: string, alfa: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}
