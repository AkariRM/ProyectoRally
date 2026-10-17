import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapaML } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { agruparPorConfirmar, type PuntoMapa, type ZonaMapa } from './mapaUtil';

// Versión web: mapa MapLibre directamente en la página (OpenFreeMap, sin clave).
// El botón 3D inclina la vista y activa el relieve del terreno (cerros) y los edificios.
// (Antes iba dentro de un iframe; ahí el navegador bloqueaba la carga de los tiles.)

const ESTILO = 'https://tiles.openfreemap.org/styles/liberty';
// Elevación pública en formato terrarium para el relieve 3D
const ELEVACION = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

const COLORES: Record<string, string> = {
  orange: '#EF6C00',
  green: '#2E7D32',
  red: '#C62828',
  yellow: '#F9A825',
  gray: '#757575',
};

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Círculo como polígono GeoJSON [lng, lat]
function circulo(lat: number, lng: number, radioM: number, n = 64): [number, number][] {
  const R = 6378137;
  const anillo: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    const dLat = (radioM * Math.cos(a)) / R;
    const dLng = (radioM * Math.sin(a)) / (R * Math.cos((lat * Math.PI) / 180));
    anillo.push([lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI]);
  }
  return anillo;
}

function geojson(puntos: PuntoMapa[], zonas: ZonaMapa[]) {
  const zonasGeo: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: zonas
      .filter(z => !z.porConfirmar)
      .map(z => ({
        type: 'Feature',
        // Polígono dibujado ([lat, lng] → [lng, lat]); si no hay, el círculo
        geometry: {
          type: 'Polygon',
          coordinates: [z.poligono && z.poligono.length >= 3
            ? [...z.poligono, z.poligono[0]].map(([lat, lng]) => [lng, lat])
            : circulo(z.lat, z.lng, z.radioM)],
        },
        properties: {
          color: z.color ?? (z.activa ? '#2E7D32' : '#8D6E63'),
          popup: z.titulo ? `<b>${escapar(z.titulo)}</b>` : '',
        },
      })),
  };
  const puntosGeo: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      ...puntos.map(p => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        properties: {
          color: COLORES[p.color ?? ''] ?? p.color ?? COLORES.orange,
          etiqueta: '',
          popup: `<b>${escapar(p.titulo)}</b>${p.descripcion ? `<br>${escapar(p.descripcion)}` : ''}`,
        },
      })),
      // Zonas con ubicación provisional: un pin gris "?" por punto
      ...agruparPorConfirmar(zonas).map(g => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [g.lng, g.lat] },
        properties: {
          color: COLORES.gray,
          etiqueta: '?',
          popup: `<b>${g.nombres.length} zona(s) por ubicar</b><br>${g.nombres.map(escapar).join('<br>')}<br><i>Edítalas con "Usar mi ubicación"</i>`,
        },
      })),
    ],
  };
  return { zonasGeo, puntosGeo };
}

export default function Mapa({ puntos = [], zonas = [], alto = 220 }: { puntos?: PuntoMapa[]; zonas?: ZonaMapa[]; alto?: number }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaML | null>(null);
  const [listo, setListo] = useState(false);
  const [tresD, setTresD] = useState(false);

  // Solo cambia cuando cambian los datos (no en cada render)
  const clave = JSON.stringify({ puntos, zonas });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const datos = useMemo(() => geojson(puntos, zonas), [clave]);

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!contenedor.current) return;
    const m = new maplibregl.Map({
      container: contenedor.current,
      style: ESTILO,
      center: [-102.72, 20.02],
      zoom: 12,
      maxPitch: 75,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    m.on('error', e => console.error('[Mapa]', e.error?.message ?? e));

    m.on('load', () => {
      m.addSource('dem', { type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 14, tiles: [ELEVACION] });
      const antesDe = m.getLayer('building-3d') ? 'building-3d' : undefined;
      m.addLayer({ id: 'sombras', type: 'hillshade', source: 'dem', paint: { 'hillshade-exaggeration': 0.25 } }, antesDe);

      m.addSource('zonas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'zonas-relleno', type: 'fill', source: 'zonas', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.22 } });
      m.addLayer({ id: 'zonas-borde', type: 'line', source: 'zonas', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } });

      m.addSource('puntos', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({
        id: 'puntos', type: 'circle', source: 'puntos',
        paint: { 'circle-radius': 9, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
      });
      m.addLayer({
        id: 'puntos-etiqueta', type: 'symbol', source: 'puntos',
        layout: { 'text-field': ['get', 'etiqueta'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true },
        paint: { 'text-color': '#fff' },
      });

      for (const capa of ['puntos', 'zonas-relleno']) {
        m.on('click', capa, e => {
          const html = e.features?.[0]?.properties?.popup;
          if (html) new maplibregl.Popup({ offset: 8 }).setLngLat(e.lngLat).setHTML(html).addTo(m);
        });
        m.on('mouseenter', capa, () => { m.getCanvas().style.cursor = 'pointer'; });
        m.on('mouseleave', capa, () => { m.getCanvas().style.cursor = ''; });
      }
      setListo(true);
    });

    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      setListo(false);
    };
  }, []);

  // Pintar los datos y encuadrarlos cada vez que cambian
  useEffect(() => {
    const m = mapa.current;
    if (!listo || !m) return;
    (m.getSource('zonas') as GeoJSONSource | undefined)?.setData(datos.zonasGeo);
    (m.getSource('puntos') as GeoJSONSource | undefined)?.setData(datos.puntosGeo);
    const limites = new maplibregl.LngLatBounds();
    for (const f of datos.zonasGeo.features) {
      if (f.geometry.type === 'Polygon') f.geometry.coordinates[0].forEach(c => limites.extend(c as [number, number]));
    }
    for (const f of datos.puntosGeo.features) {
      if (f.geometry.type === 'Point') limites.extend(f.geometry.coordinates as [number, number]);
    }
    if (!limites.isEmpty()) m.fitBounds(limites, { padding: 40, maxZoom: 15, duration: 0 });
  }, [listo, datos]);

  // 2D ↔ 3D: inclinación, giro y relieve del terreno
  const alternar3D = () => {
    const m = mapa.current;
    if (!m || !listo || !m.getSource('dem')) return;
    const activar = !tresD;
    if (activar) {
      m.setTerrain({ source: 'dem', exaggeration: 1.6 });
      m.easeTo({ pitch: 65, bearing: -25, duration: 900 });
    } else {
      m.setTerrain(null);
      m.easeTo({ pitch: 0, bearing: 0, duration: 900 });
    }
    setTresD(activar);
  };

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <div ref={contenedor} style={{ width: '100%', height: alto, borderRadius: 12, overflow: 'hidden' }} />
      <button
        onClick={alternar3D}
        disabled={!listo}
        title={listo ? 'Vista 3D' : 'Cargando mapa…'}
        style={{
          position: 'absolute', top: 10, right: 50, zIndex: 2, background: '#fff', border: 0, borderRadius: 6,
          padding: '7px 11px', fontWeight: 700, color: '#2E7D32', boxShadow: '0 1px 4px rgba(0,0,0,.3)',
          cursor: listo ? 'pointer' : 'wait', opacity: listo ? 1 : 0.5,
        }}
      >
        {tresD ? '2D' : '3D'}
      </button>
    </div>
  );
}
