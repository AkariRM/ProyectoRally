import { ComponentRef, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { htmlMapa, type Coordenada } from './mapaHtml';
import { ORIGEN_MAPA } from './Mapa';

// Versión celular del mapa para elegir un lugar: se toca el mapa o se arrastra el pin
export default function MapaElegir({ valor, onElegir, alto = 240 }: {
  valor: Coordenada | null; onElegir: (c: Coordenada) => void; alto?: number;
}) {
  const web = useRef<ComponentRef<typeof WebView>>(null);
  const ultimoDelMapa = useRef<Coordenada | null>(null);
  // El HTML se arma una sola vez con el valor inicial; después el pin se mueve con mover()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => htmlMapa({ tipo: 'elegir', valor }), []);

  // Si el valor cambió desde la app (ej. GPS), mueve el pin y centra el mapa
  useEffect(() => {
    if (!valor) return;
    const u = ultimoDelMapa.current;
    if (u && u.lat === valor.lat && u.lng === valor.lng) return;
    web.current?.injectJavaScript(`window.mover && window.mover(${valor.lat}, ${valor.lng}, true); true;`);
  }, [valor]);

  return (
    <View style={[styles.contenedor, { height: alto }]}>
      <WebView
        ref={web}
        source={{ html, baseUrl: ORIGEN_MAPA }}
        originWhitelist={['*']}
        style={styles.web}
        nestedScrollEnabled
        onMessage={(e: WebViewMessageEvent) => {
          try {
            const d = JSON.parse(e.nativeEvent.data);
            if (d.tipo === 'elegido') {
              ultimoDelMapa.current = { lat: d.lat, lng: d.lng };
              onElegir({ lat: d.lat, lng: d.lng });
            }
          } catch {
            // mensaje que no es del mapa
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  web: { flex: 1, backgroundColor: '#e8eef0' },
});
