import { StyleSheet } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

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
}

// Centro aproximado entre Jiquilpan y Sahuayo
const REGION_INICIAL = {
  latitude: 20.02,
  longitude: -102.72,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function Mapa({ puntos = [], zonas = [], alto = 220 }: { puntos?: PuntoMapa[]; zonas?: ZonaMapa[]; alto?: number }) {
  return (
    <MapView style={[styles.mapa, { height: alto }]} initialRegion={REGION_INICIAL}>
      {zonas.map(z => (
        <Circle
          key={z.id}
          center={{ latitude: z.lat, longitude: z.lng }}
          radius={z.radioM}
          strokeColor={z.activa ? 'rgba(46,125,50,0.9)' : 'rgba(141,110,99,0.8)'}
          fillColor={z.activa ? 'rgba(46,125,50,0.25)' : 'rgba(141,110,99,0.2)'}
          strokeWidth={2}
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
  );
}

const styles = StyleSheet.create({
  mapa: { width: '100%', borderRadius: 12, marginBottom: 12 },
});
