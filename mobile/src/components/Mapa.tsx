import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { htmlMapa } from './mapaHtml';
import type { PuntoMapa, ZonaMapa } from './mapaUtil';

export type { PuntoMapa, ZonaMapa };

// Versión celular: el mismo mapa MapLibre de la web dentro de un WebView
// (Google Maps en la APK necesitaría una clave de API; OpenFreeMap no).
// El botón 3D inclina la vista y activa el relieve del terreno.
export const ORIGEN_MAPA = 'https://bioredmex.netlify.app/'; // origen válido para pedir los tiles

export default function Mapa({ puntos = [], zonas = [], alto = 220 }: { puntos?: PuntoMapa[]; zonas?: ZonaMapa[]; alto?: number }) {
  const clave = JSON.stringify({ puntos, zonas });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => htmlMapa({ tipo: 'ver', puntos, zonas }), [clave]);

  return (
    <View style={[styles.contenedor, { height: alto }]}>
      <WebView
        source={{ html, baseUrl: ORIGEN_MAPA }}
        originWhitelist={['*']}
        style={styles.web}
        nestedScrollEnabled
        setBuiltInZoomControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  web: { flex: 1, backgroundColor: '#e8eef0' },
});
