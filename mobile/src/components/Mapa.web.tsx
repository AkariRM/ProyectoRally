import { useMemo } from 'react';
import { View } from 'react-native';
import { agruparPorConfirmar, type PuntoMapa, type ZonaMapa } from './mapaUtil';

// Versión web: react-native-maps no funciona en navegador, así que se dibuja un mapa
// MapLibre (OpenFreeMap, sin clave) dentro de un iframe, con los mismos pines y zonas.
// El botón 3D inclina la vista y activa el relieve del terreno (cerros) y los edificios.

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
function circulo(lat: number, lng: number, radioM: number, n = 64) {
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

function html(puntos: PuntoMapa[], zonas: ZonaMapa[]) {
  const zonasGeo = {
    type: 'FeatureCollection',
    features: zonas
      .filter(z => !z.porConfirmar)
      .map(z => ({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circulo(z.lat, z.lng, z.radioM)] },
        properties: {
          color: z.color ?? (z.activa ? '#2E7D32' : '#8D6E63'),
          popup: z.titulo ? `<b>${escapar(z.titulo)}</b>` : '',
        },
      })),
  };
  const puntosGeo = {
    type: 'FeatureCollection',
    features: [
      ...puntos.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: {
          color: COLORES[p.color ?? ''] ?? p.color ?? COLORES.orange,
          etiqueta: '',
          popup: `<b>${escapar(p.titulo)}</b>${p.descripcion ? `<br>${escapar(p.descripcion)}` : ''}`,
        },
      })),
      // Zonas con ubicación provisional: un pin gris "?" por punto
      ...agruparPorConfirmar(zonas).map(g => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
        properties: {
          color: COLORES.gray,
          etiqueta: '?',
          popup: `<b>${g.nombres.length} zona(s) por ubicar</b><br>${g.nombres.map(escapar).join('<br>')}<br><i>Edítalas con "Usar mi ubicación"</i>`,
        },
      })),
    ],
  };
  // JSON dentro de <script>: se evita que un "</script>" en los datos cierre la etiqueta
  const datos = JSON.stringify({ zonas: zonasGeo, puntos: puntosGeo }).replace(/</g, '\\u003c');

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<style>
  html,body,#m{margin:0;height:100%;font-family:sans-serif}
  #b3d{position:absolute;top:10px;right:50px;z-index:2;background:#fff;border:0;border-radius:6px;
       padding:7px 11px;font-weight:700;color:#2E7D32;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:pointer}
  .maplibregl-popup-content{font-size:13px}
</style>
</head><body><div id="m"></div><button id="b3d">3D</button>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
var d = ${datos};
var mapa = new maplibregl.Map({
  container: 'm',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [-102.72, 20.02],
  zoom: 12,
  maxPitch: 75,
  attributionControl: { compact: true }
});
mapa.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

mapa.on('load', function () {
  // Relieve: elevación pública (terrarium) para ver los cerros en 3D
  mapa.addSource('dem', {
    type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 14,
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']
  });
  mapa.addLayer({ id: 'sombras', type: 'hillshade', source: 'dem', paint: { 'hillshade-exaggeration': 0.25 } }, 'building-3d');

  mapa.addSource('zonas', { type: 'geojson', data: d.zonas });
  mapa.addLayer({ id: 'zonas-relleno', type: 'fill', source: 'zonas', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.22 } });
  mapa.addLayer({ id: 'zonas-borde', type: 'line', source: 'zonas', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } });

  mapa.addSource('puntos', { type: 'geojson', data: d.puntos });
  mapa.addLayer({ id: 'puntos', type: 'circle', source: 'puntos', paint: {
    'circle-radius': 9, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2
  } });
  mapa.addLayer({ id: 'puntos-etiqueta', type: 'symbol', source: 'puntos', layout: {
    'text-field': ['get', 'etiqueta'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true
  }, paint: { 'text-color': '#fff' } });

  function popup(capa) {
    mapa.on('click', capa, function (e) {
      var p = e.features[0].properties.popup;
      if (p) new maplibregl.Popup({ offset: 8 }).setLngLat(e.lngLat).setHTML(p).addTo(mapa);
    });
    mapa.on('mouseenter', capa, function () { mapa.getCanvas().style.cursor = 'pointer'; });
    mapa.on('mouseleave', capa, function () { mapa.getCanvas().style.cursor = ''; });
  }
  popup('puntos');
  popup('zonas-relleno');

  // Encuadrar todo lo dibujado
  var limites = new maplibregl.LngLatBounds();
  d.zonas.features.forEach(function (f) { f.geometry.coordinates[0].forEach(function (c) { limites.extend(c); }); });
  d.puntos.features.forEach(function (f) { limites.extend(f.geometry.coordinates); });
  if (!limites.isEmpty()) mapa.fitBounds(limites, { padding: 40, maxZoom: 15, duration: 0 });
});

// 2D ↔ 3D: inclinación, giro y relieve del terreno
var tresD = false;
document.getElementById('b3d').onclick = function () {
  tresD = !tresD;
  this.textContent = tresD ? '2D' : '3D';
  if (tresD) {
    mapa.setTerrain({ source: 'dem', exaggeration: 1.6 });
    mapa.easeTo({ pitch: 65, bearing: -25, duration: 900 });
  } else {
    mapa.setTerrain(null);
    mapa.easeTo({ pitch: 0, bearing: 0, duration: 900 });
  }
};
</script></body></html>`;
}

export default function Mapa({ puntos = [], zonas = [], alto = 220 }: { puntos?: PuntoMapa[]; zonas?: ZonaMapa[]; alto?: number }) {
  const doc = useMemo(() => html(puntos, zonas), [puntos, zonas]);
  return (
    <View style={{ marginBottom: 12 }}>
      <iframe title="Mapa" srcDoc={doc} style={{ width: '100%', height: alto, border: 0, borderRadius: 12 }} />
    </View>
  );
}
