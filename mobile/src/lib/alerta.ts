import { Alert, Platform } from 'react-native';

// Alert.alert no hace nada en navegador; en web se usa window.alert.
export function alerta(titulo: string, mensaje?: string) {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
  } else {
    Alert.alert(titulo, mensaje);
  }
}
