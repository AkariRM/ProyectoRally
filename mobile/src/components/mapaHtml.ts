import { agruparPorConfirmar, type PuntoMapa, type ZonaMapa } from './mapaUtil';

// Página HTML con un mapa MapLibre (OpenFreeMap, sin clave) para el WebView del celular.
// Así la APK no depende de Google Maps ni de su clave de API.
// - 'ver': puntos y zonas, con botón 3D.
// - 'elegir': un pin que se pone tocando el mapa (o arrastrándolo); avisa con postMessage.
//   En modo 'dibujar' cada toque agrega un vértice del polígono de la zona.

export type Coordenada = { lat: number; lng: number };

// Estado del mapa para elegir: pin (con círculo de vista previa) o polígono dibujado ([lat, lng])
export type EstadoElegir = { valor: Coordenada | null; modo: 'punto' | 'dibujar'; radioM?: number; poligono?: [number, number][] };

export const CENTRO_INICIAL: Coordenada = { lat: 20.02, lng: -102.72 }; // entre Jiquilpan y Sahuayo

const COLORES: Record<string, string> = {
  orange: '#EF6C00', green: '#2E7D32', red: '#C62828', yellow: '#F9A825', gray: '#757575',
};

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Datos que el mapa pinta en modo 'ver'
function datosVer(puntos: PuntoMapa[], zonas: ZonaMapa[]) {
  return {
    zonas: zonas.filter(z => !z.porConfirmar).map(z => ({
      lat: z.lat, lng: z.lng, radioM: z.radioM,
      // Anillo [lng, lat] del polígono dibujado; si no hay, se dibuja el círculo
      anillo: z.poligono && z.poligono.length >= 3 ? [...z.poligono, z.poligono[0]].map(([la, ln]) => [ln, la]) : null,
      color: z.color ?? (z.activa ? '#2E7D32' : '#8D6E63'),
      popup: z.titulo ? `<b>${escapar(z.titulo)}</b>` : '',
    })),
    puntos: [
      ...puntos.map(p => ({
        lat: p.lat, lng: p.lng, etiqueta: '',
        color: COLORES[p.color ?? ''] ?? p.color ?? COLORES.orange,
        popup: `<b>${escapar(p.titulo)}</b>${p.descripcion ? `<br>${escapar(p.descripcion)}` : ''}`,
      })),
      ...agruparPorConfirmar(zonas).map(g => ({
        lat: g.lat, lng: g.lng, etiqueta: '?', color: COLORES.gray,
        popup: `<b>${g.nombres.length} zona(s) por ubicar</b><br>${g.nombres.map(escapar).join('<br>')}`,
      })),
    ],
  };
}

export function htmlMapa(
  modo: { tipo: 'ver'; puntos: PuntoMapa[]; zonas: ZonaMapa[] } | ({ tipo: 'elegir' } & EstadoElegir),
): string {
  const config = modo.tipo === 'ver' ? { tipo: 'ver', ...datosVer(modo.puntos, modo.zonas) } : modo;
  const inicio = modo.tipo === 'elegir' ? (modo.poligono?.length ? { lat: modo.poligono[0][0], lng: modo.poligono[0][1] } : modo.valor) : null;

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  html,body,#m{margin:0;height:100%;width:100%}
  #b3d{position:absolute;top:10px;right:50px;z-index:2;background:#fff;border:0;border-radius:6px;padding:7px 11px;
       font:700 14px sans-serif;color:#2E7D32;box-shadow:0 1px 4px rgba(0,0,0,.3)}
  #b3d:disabled{opacity:.5}
</style></head><body><div id="m"></div>
${modo.tipo === 'ver' ? '<button id="b3d" disabled>3D</button>' : ''}
<script>
var C = ${JSON.stringify(config)};
var avisar = function (d) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(d)); };
var I = ${JSON.stringify(inicio)};
var mapa = new maplibregl.Map({
  container: 'm', style: 'https://tiles.openfreemap.org/styles/liberty',
  center: I ? [I.lng, I.lat] : [${CENTRO_INICIAL.lng}, ${CENTRO_INICIAL.lat}], zoom: I ? 16 : 12,
  maxPitch: 75, attributionControl: { compact: true },
});
mapa.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

function circulo(lat, lng, r) {
  var R = 6378137, a = [];
  for (var i = 0; i <= 64; i++) {
    var t = 2 * Math.PI * i / 64;
    a.push([lng + (r * Math.sin(t) / (R * Math.cos(lat * Math.PI / 180))) * 180 / Math.PI, lat + (r * Math.cos(t) / R) * 180 / Math.PI]);
  }
  return a;
}

if (C.tipo === 'elegir') {
  var pin = null, listo = false;
  // Pone (o mueve) el pin; también lo llama la app cuando usa el GPS
  window.mover = function (lat, lng, centrar) {
    if (!pin) {
      pin = new maplibregl.Marker({ color: '#2E7D32', draggable: true }).setLngLat([lng, lat]).addTo(mapa);
      pin.on('dragend', function () { var p = pin.getLngLat(); avisar({ tipo: 'elegido', lat: p.lat, lng: p.lng }); });
    } else pin.setLngLat([lng, lat]);
    if (centrar) mapa.flyTo({ center: [lng, lat], zoom: Math.max(mapa.getZoom(), 16) });
  };
  // Dibuja el círculo de vista previa (modo punto) o el polígono con sus vértices (modo dibujar)
  function pintar() {
    if (!listo) return;
    var f = [];
    if (C.modo === 'dibujar') {
      var v = (C.poligono || []).map(function (p) { return [p[1], p[0]]; });
      if (v.length >= 3) f.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [v.concat([v[0]])] }, properties: {} });
      else if (v.length === 2) f.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: v }, properties: {} });
      v.forEach(function (c, i) { f.push({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: { n: String(i + 1) } }); });
    } else if (C.valor && C.radioM) {
      f.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [circulo(C.valor.lat, C.valor.lng, C.radioM)] }, properties: {} });
    }
    mapa.getSource('dibujo').setData({ type: 'FeatureCollection', features: f });
    if (C.modo === 'dibujar' && pin) { pin.remove(); pin = null; }
    if (C.modo === 'punto' && C.valor) window.mover(C.valor.lat, C.valor.lng, false);
  }
  // La app manda el estado nuevo (vértices, radio, modo, pin)
  window.actualizar = function (estado, centrar) {
    C.modo = estado.modo; C.radioM = estado.radioM; C.poligono = estado.poligono; C.valor = estado.valor;
    if (centrar && C.valor) mapa.flyTo({ center: [C.valor.lng, C.valor.lat], zoom: Math.max(mapa.getZoom(), 16) });
    pintar();
  };
  mapa.on('load', function () {
    mapa.addSource('dibujo', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    mapa.addLayer({ id: 'dibujo-relleno', type: 'fill', source: 'dibujo', filter: ['==', '$type', 'Polygon'],
      paint: { 'fill-color': '#2E7D32', 'fill-opacity': 0.2 } });
    mapa.addLayer({ id: 'dibujo-borde', type: 'line', source: 'dibujo', filter: ['!=', '$type', 'Point'],
      paint: { 'line-color': '#2E7D32', 'line-width': 2.5, 'line-dasharray': [2, 1] } });
    mapa.addLayer({ id: 'dibujo-vertices', type: 'circle', source: 'dibujo', filter: ['==', '$type', 'Point'],
      paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-color': '#2E7D32', 'circle-stroke-width': 2.5 } });
    listo = true;
    pintar();
    if (C.modo === 'dibujar' && C.poligono && C.poligono.length >= 2) {
      var b = new maplibregl.LngLatBounds();
      C.poligono.forEach(function (p) { b.extend([p[1], p[0]]); });
      mapa.fitBounds(b, { padding: 40, maxZoom: 17, duration: 0 });
    }
  });
  if (C.modo === 'punto' && C.valor) window.mover(C.valor.lat, C.valor.lng, false);
  mapa.on('click', function (e) {
    if (C.modo === 'dibujar') return avisar({ tipo: 'vertice', lat: e.lngLat.lat, lng: e.lngLat.lng });
    window.mover(e.lngLat.lat, e.lngLat.lng, false);
    avisar({ tipo: 'elegido', lat: e.lngLat.lat, lng: e.lngLat.lng });
  });
} else {
  mapa.on('load', function () {
    mapa.addSource('dem', { type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 14,
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'] });
    mapa.addSource('zonas', { type: 'geojson', data: { type: 'FeatureCollection', features: C.zonas.map(function (z) {
      return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [z.anillo || circulo(z.lat, z.lng, z.radioM)] }, properties: z };
    }) } });
    mapa.addLayer({ id: 'zonas-relleno', type: 'fill', source: 'zonas', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.22 } });
    mapa.addLayer({ id: 'zonas-borde', type: 'line', source: 'zonas', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } });
    mapa.addSource('puntos', { type: 'geojson', data: { type: 'FeatureCollection', features: C.puntos.map(function (p) {
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, properties: p };
    }) } });
    mapa.addLayer({ id: 'puntos', type: 'circle', source: 'puntos',
      paint: { 'circle-radius': 9, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    mapa.addLayer({ id: 'puntos-etiqueta', type: 'symbol', source: 'puntos',
      layout: { 'text-field': ['get', 'etiqueta'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true },
      paint: { 'text-color': '#fff' } });
    ['puntos', 'zonas-relleno'].forEach(function (capa) {
      mapa.on('click', capa, function (e) {
        var html = e.features[0].properties.popup;
        if (html) new maplibregl.Popup({ offset: 8 }).setLngLat(e.lngLat).setHTML(html).addTo(mapa);
      });
    });
    var limites = new maplibregl.LngLatBounds();
    C.zonas.forEach(function (z) { (z.anillo || circulo(z.lat, z.lng, z.radioM)).forEach(function (c) { limites.extend(c); }); });
    C.puntos.forEach(function (p) { limites.extend([p.lng, p.lat]); });
    if (!limites.isEmpty()) mapa.fitBounds(limites, { padding: 40, maxZoom: 15, duration: 0 });
    var b = document.getElementById('b3d'), tresD = false;
    b.disabled = false;
    b.onclick = function () {
      tresD = !tresD;
      mapa.setTerrain(tresD ? { source: 'dem', exaggeration: 1.6 } : null);
      mapa.easeTo({ pitch: tresD ? 65 : 0, bearing: tresD ? -25 : 0, duration: 900 });
      b.textContent = tresD ? '2D' : '3D';
    };
  });
}
</script></body></html>`;
}
