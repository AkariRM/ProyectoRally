import { Alert, Platform } from 'react-native';

// Alert.alert no hace nada en navegador; en web se usa window.alert.
export function alerta(titulo: string, mensaje?: string) {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
  } else {
    Alert.alert(titulo, mensaje);
  }
}

// Pide confirmación (ej. antes de eliminar). Devuelve true si el usuario acepta.
export function confirmar(titulo: string, mensaje: string, textoAceptar = 'Eliminar'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  return new Promise(resolve =>
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: textoAceptar, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}
