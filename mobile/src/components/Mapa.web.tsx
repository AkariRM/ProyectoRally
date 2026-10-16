import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PuntoMapa, ZonaMapa } from './Mapa';

// Versión web: react-native-maps no funciona en navegador, así que se muestra
// un mapa de OpenStreetMap de la región y la lista de lugares con enlace a Google Maps.

// Región aproximada entre Jiquilpan y Sahuayo
const BBOX = '-102.78,19.96,-102.66,20.08';

export default function Mapa({ puntos = [], zonas = [], alto = 220 }: { puntos?: PuntoMapa[]; zonas?: ZonaMapa[]; alto?: number }) {
  const lugares = [
    ...zonas.map(z => ({ id: z.id, lat: z.lat, lng: z.lng, titulo: `Zona (${z.radioM} m)` })),
    ...puntos.map(p => ({ id: p.id, lat: p.lat, lng: p.lng, titulo: p.titulo })),
  ];
  return (
    <View style={styles.contenedor}>
      <iframe
        title="Mapa"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik`}
        style={{ width: '100%', height: alto, border: 0, borderRadius: 12 }}
      />
      {lugares.length ? (
        <View style={styles.lista}>
          {lugares.map(l => (
            <TouchableOpacity key={l.id} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`)}>
              <Text style={styles.lugar}>📍 {l.titulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 12 },
  lista: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  lugar: { fontSize: 12, color: '#1565C0' },
});
