import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { agruparPorConfirmar, conAlfa, type PuntoMapa, type ZonaMapa } from './mapaUtil';

export type { PuntoMapa, ZonaMapa };

// Centro aproximado entre Jiquilpan y Sahuayo
const REGION_INICIAL = {
  latitude: 20.02,
  longitude: -102.72,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function Mapa({ puntos = [], zonas = [], alto = 220 }: { puntos?: PuntoMapa[]; zonas?: ZonaMapa[]; alto?: number }) {
  const mapa = useRef<MapView>(null);
  const [tresD, setTresD] = useState(false);

  // Inclina la cámara: con el mapa inclinado Google/Apple Maps muestran edificios en 3D
  const alternar3D = async () => {
    const camara = await mapa.current?.getCamera();
    if (!camara) return;
    const activar = !tresD;
    mapa.current?.animateCamera(
      { ...camara, pitch: activar ? 60 : 0, heading: activar ? 20 : 0, zoom: activar ? Math.max(camara.zoom ?? 14, 15) : camara.zoom },
      { duration: 700 },
    );
    setTresD(activar);
  };

  return (
    <View style={[styles.contenedor, { height: alto }]}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={REGION_INICIAL}
        // Sin los botones de Android que abren la app de Google Maps
        toolbarEnabled={false}
        pitchEnabled
        showsBuildings
      >
        {zonas.filter(z => !z.porConfirmar).map(z => {
          const color = z.color ?? (z.activa ? '#2E7D32' : '#8D6E63');
          return (
            <Circle
              key={z.id}
              center={{ latitude: z.lat, longitude: z.lng }}
              radius={z.radioM}
              strokeColor={conAlfa(color, 0.9)}
              fillColor={conAlfa(color, 0.22)}
              strokeWidth={2}
            />
          );
        })}
        {agruparPorConfirmar(zonas).map(g => (
          <Marker
            key={`por-confirmar-${g.id}`}
            coordinate={{ latitude: g.lat, longitude: g.lng }}
            title={`${g.nombres.length} zona(s) por ubicar`}
            description={g.nombres.join(', ')}
            pinColor="gray"
          />
        ))}
        {puntos.map(p => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.titulo}
            description={p.descripcion}
            pinColor={p.color}
          />
        ))}
      </MapView>
      <TouchableOpacity style={styles.boton3d} onPress={alternar3D} accessibilityLabel="Vista 3D">
        <Text style={styles.boton3dTexto}>{tresD ? '2D' : '3D'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  boton3d: {
    position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 10, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  boton3dTexto: { fontWeight: '700', color: '#2E7D32' },
});
