import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapaML, type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CENTRO_INICIAL, type Coordenada } from './mapaHtml';

// Versión web del mapa para elegir un lugar: se hace clic en el mapa o se arrastra el pin
export default function MapaElegir({ valor, onElegir, alto = 240 }: {
  valor: Coordenada | null; onElegir: (c: Coordenada) => void; alto?: number;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaML | null>(null);
  const pin = useRef<Marker | null>(null);
  const ultimoDelMapa = useRef<Coordenada | null>(null);
  const alElegir = useRef(onElegir);
  alElegir.current = onElegir;

  const elegir = (c: Coordenada) => {
    ultimoDelMapa.current = c;
    alElegir.current(c);
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
    const inicio = valor ?? CENTRO_INICIAL;
    const m = new maplibregl.Map({
      container: contenedor.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [inicio.lng, inicio.lat],
      zoom: valor ? 16 : 12,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.getCanvas().style.cursor = 'crosshair';
    m.on('click', e => {
      const c = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      mover(c, false);
      elegir(c);
    });
    mapa.current = m;
    if (valor) mover(valor, false);
    return () => {
      m.remove();
      mapa.current = null;
      pin.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el valor cambió desde la app (ej. GPS), mueve el pin y centra el mapa
  useEffect(() => {
    if (!valor) return;
    const u = ultimoDelMapa.current;
    if (u && u.lat === valor.lat && u.lng === valor.lng) return;
    mover(valor, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return <div ref={contenedor} style={{ width: '100%', height: alto, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }} />;
}
