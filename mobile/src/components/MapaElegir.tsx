import { ComponentRef, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { htmlMapa, type Coordenada, type EstadoElegir } from './mapaHtml';
import { ORIGEN_MAPA } from './Mapa';

export type PropsMapaElegir = {
  valor: Coordenada | null;
  onElegir: (c: Coordenada) => void;
  alto?: number;
  modo?: 'punto' | 'dibujar'; // dibujar: cada toque agrega un vértice (onVertice)
  radioM?: number; // círculo de vista previa alrededor del pin
  poligono?: [number, number][];
  onVertice?: (c: Coordenada) => void;
};

// Versión celular del mapa para elegir un lugar: se toca el mapa o se arrastra el pin;
// en modo dibujar se marcan los vértices de la zona.
export default function MapaElegir({ valor, onElegir, alto = 240, modo = 'punto', radioM, poligono, onVertice }: PropsMapaElegir) {
  const web = useRef<ComponentRef<typeof WebView>>(null);
  const ultimoDelMapa = useRef<Coordenada | null>(null);
  const estado: EstadoElegir = { valor, modo, radioM, poligono };
  // El HTML se arma una sola vez con el estado inicial; después se actualiza con actualizar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => htmlMapa({ tipo: 'elegir', ...estado }), []);

  // Manda el estado nuevo al mapa; centra si el pin cambió desde la app (ej. GPS)
  const clave = JSON.stringify(estado);
  useEffect(() => {
    const u = ultimoDelMapa.current;
    const centrar = !!valor && !(u && u.lat === valor.lat && u.lng === valor.lng);
    web.current?.injectJavaScript(`window.actualizar && window.actualizar(${clave}, ${centrar}); true;`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

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
            const c = { lat: d.lat, lng: d.lng };
            if (d.tipo === 'elegido') {
              ultimoDelMapa.current = c;
              onElegir(c);
            } else if (d.tipo === 'vertice') onVertice?.(c);
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
