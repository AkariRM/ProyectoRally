import * as Location from 'expo-location';
import { alerta } from '@/lib/alerta';

// Pide permiso y devuelve la ubicación actual, o null si no se pudo.
export async function obtenerUbicacion(motivo: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alerta('Permiso denegado', `Activa la ubicación para ${motivo}.`);
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (e) {
    alerta('Error de GPS', (e as Error).message);
    return null;
  }
}
