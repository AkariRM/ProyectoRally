import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapaML, type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CENTRO_INICIAL, type Coordenada } from './mapaHtml';
import type { PropsMapaElegir } from './MapaElegir';

// Círculo como anillo GeoJSON [lng, lat]
function circulo(lat: number, lng: number, radioM: number, n = 64): [number, number][] {
  const R = 6378137;
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return [
      lng + ((radioM * Math.sin(a)) / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI),
      lat + ((radioM * Math.cos(a)) / R) * (180 / Math.PI),
    ];
  });
}

// Versión web del mapa para elegir un lugar: se hace clic en el mapa o se arrastra el pin;
// en modo dibujar cada clic agrega un vértice de la zona.
export default function MapaElegir({ valor, onElegir, alto = 240, modo = 'punto', radioM, poligono, onVertice }: PropsMapaElegir) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaML | null>(null);
  const pin = useRef<Marker | null>(null);
  const ultimoDelMapa = useRef<Coordenada | null>(null);
  const [listo, setListo] = useState(false);
  // Últimos valores para los manejadores de eventos del mapa (se crean una sola vez)
  const props = useRef({ onElegir, onVertice, modo });
  props.current = { onElegir, onVertice, modo };

  const elegir = (c: Coordenada) => {
    ultimoDelMapa.current = c;
    props.current.onElegir(c);
  };

  const mover = (c: Coordenada, centrar: boolean) => {
    const m = mapa.current;
    if (!m) return;
    if (!pin.current) {
      pin.current = new maplibregl.Marker({ color: '#2E7D32', draggable: true }).setLngLat([c.lng, c.lat]).addTo(m);
      pin.current.on('dragend', () => {
        const p = pin.current!.getLngLat();
        elegir({ lat: p.lat, lng: p.lng });
      });
    } else pin.current.setLngLat([c.lng, c.lat]);
    if (centrar) m.flyTo({ center: [c.lng, c.lat], zoom: Math.max(m.getZoom(), 16) });
  };

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!contenedor.current) return;
    const inicio = poligono?.length ? { lat: poligono[0][0], lng: poligono[0][1] } : valor;
    const m = new maplibregl.Map({
      container: contenedor.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [(inicio ?? CENTRO_INICIAL).lng, (inicio ?? CENTRO_INICIAL).lat],
      zoom: inicio ? 16 : 12,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.getCanvas().style.cursor = 'crosshair';
    m.on('load', () => {
      m.addSource('dibujo', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'dibujo-relleno', type: 'fill', source: 'dibujo', filter: ['==', '$type', 'Polygon'],
        paint: { 'fill-color': '#2E7D32', 'fill-opacity': 0.2 } });
      m.addLayer({ id: 'dibujo-borde', type: 'line', source: 'dibujo', filter: ['!=', '$type', 'Point'],
        paint: { 'line-color': '#2E7D32', 'line-width': 2.5, 'line-dasharray': [2, 1] } });
      m.addLayer({ id: 'dibujo-vertices', type: 'circle', source: 'dibujo', filter: ['==', '$type', 'Point'],
        paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-color': '#2E7D32', 'circle-stroke-width': 2.5 } });
      if (poligono && poligono.length >= 2) {
        const b = new maplibregl.LngLatBounds();
        poligono.forEach(p => b.extend([p[1], p[0]]));
        m.fitBounds(b, { padding: 40, maxZoom: 17, duration: 0 });
      }
      setListo(true);
    });
    m.on('click', e => {
      const c = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      if (props.current.modo === 'dibujar') return props.current.onVertice?.(c);
      mover(c, false);
      elegir(c);
    });
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      pin.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pin: solo en modo punto; si cambió desde la app (ej. GPS) se centra el mapa
  useEffect(() => {
    if (modo === 'dibujar' || !valor) {
      pin.current?.remove();
      pin.current = null;
      return;
    }
    const u = ultimoDelMapa.current;
    mover(valor, !(u && u.lat === valor.lat && u.lng === valor.lng));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor?.lat, valor?.lng, modo]);

  // Círculo de vista previa (modo punto) o polígono con sus vértices (modo dibujar)
  useEffect(() => {
    const fuente = mapa.current?.getSource('dibujo') as GeoJSONSource | undefined;
    if (!listo || !fuente) return;
    const f: GeoJSON.Feature[] = [];
    if (modo === 'dibujar') {
      const v = (poligono ?? []).map(([lat, lng]) => [lng, lat]);
      if (v.length >= 3) f.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...v, v[0]]] }, properties: {} });
      else if (v.length === 2) f.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: v }, properties: {} });
      v.forEach(c => f.push({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} }));
    } else if (valor && radioM) {
      f.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [circulo(valor.lat, valor.lng, radioM)] }, properties: {} });
    }
    fuente.setData({ type: 'FeatureCollection', features: f });
  }, [listo, modo, poligono, valor, radioM]);

  return <div ref={contenedor} style={{ width: '100%', height: alto, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }} />;
}
