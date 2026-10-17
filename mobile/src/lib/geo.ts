// Geometría sencilla para zonas dibujadas en el mapa. Polígono: lista de [lat, lng].

export type Poligono = [number, number][];

const R = 6371000; // radio de la Tierra en metros

export function distanciaM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const esPoligono = (p?: Poligono | null): p is Poligono => Array.isArray(p) && p.length >= 3;

// Centro (promedio de los vértices) y radio que cubre todo el polígono:
// se guardan para lo que sigue usando círculo (avisos, rutas, exportar sin polígono).
export function centroYRadio(poligono: Poligono) {
  const lat = poligono.reduce((t, p) => t + p[0], 0) / poligono.length;
  const lng = poligono.reduce((t, p) => t + p[1], 0) / poligono.length;
  const radioM = Math.max(10, Math.ceil(Math.max(...poligono.map(p => distanciaM({ lat, lng }, { lat: p[0], lng: p[1] })))));
  return { lat, lng, radioM };
}

// Superficie aproximada en m² (proyección local, suficiente para zonas de unos km)
export function areaM2(poligono: Poligono) {
  if (!esPoligono(poligono)) return 0;
  const lat0 = (poligono.reduce((t, p) => t + p[0], 0) / poligono.length) * (Math.PI / 180);
  const xy = poligono.map(([lat, lng]) => [lng * (Math.PI / 180) * R * Math.cos(lat0), lat * (Math.PI / 180) * R]);
  let suma = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    suma += x1 * y2 - x2 * y1;
  }
  return Math.abs(suma) / 2;
}
