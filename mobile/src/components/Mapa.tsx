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
  color?: string; // color hex, ej. '#C62828' (reemplaza al de activa)
  titulo?: string;
}

// '#C62828' + 0.25 → 'rgba(198,40,40,0.25)'
export function conAlfa(hex: string, alfa: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
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
    <MapView
      style={[styles.mapa, { height: alto }]}
      initialRegion={REGION_INICIAL}
      // Sin los botones de Android que abren la app de Google Maps
      toolbarEnabled={false}
    >
      {zonas.map(z => {
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
