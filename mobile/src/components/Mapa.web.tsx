import { useMemo } from 'react';
import { View } from 'react-native';
import type { PuntoMapa, ZonaMapa } from './Mapa';

// Versión web: react-native-maps no funciona en navegador, así que se dibuja
// un mapa Leaflet (OpenStreetMap) dentro de un iframe, con los mismos pines y zonas.
// Tocar un pin muestra su información sin salir de la app.

const COLORES: Record<string, string> = {
  orange: '#EF6C00',
  green: '#2E7D32',
  red: '#C62828',
  yellow: '#F9A825',
  gray: '#9E9E9E',
};

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function html(puntos: PuntoMapa[], zonas: ZonaMapa[]) {
  const datos = {
    puntos: puntos.map(p => ({
      lat: p.lat,
      lng: p.lng,
      color: COLORES[p.color ?? ''] ?? p.color ?? COLORES.orange,
      popup: `<b>${escapar(p.titulo)}</b>${p.descripcion ? `<br>${escapar(p.descripcion)}` : ''}`,
    })),
    zonas: zonas.map(z => ({ lat: z.lat, lng: z.lng, radio: z.radioM, activa: !!z.activa })),
  };
  // JSON dentro de <script>: se evita que un "</script>" en los datos cierre la etiqueta
  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#m{margin:0;height:100%;font-family:sans-serif}</style>
</head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var d = ${json};
var mapa = L.map('m').setView([20.02, -102.72], 12);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(mapa);
var capas = [];
d.zonas.forEach(function (z) {
  var c = z.activa ? '#2E7D32' : '#8D6E63';
  capas.push(L.circle([z.lat, z.lng], { radius: z.radio, color: c, fillColor: c, fillOpacity: 0.2, weight: 2 }).addTo(mapa));
});
d.puntos.forEach(function (p) {
  capas.push(L.circleMarker([p.lat, p.lng], { radius: 9, color: '#fff', weight: 2, fillColor: p.color, fillOpacity: 1 })
    .bindPopup(p.popup).addTo(mapa));
});
if (capas.length) mapa.fitBounds(L.featureGroup(capas).getBounds().pad(0.2), { maxZoom: 15 });
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
