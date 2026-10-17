import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { obtenerUbicacion } from '@/lib/gps';
import MapaElegir from '@/components/MapaElegir';
import type { Coordenada } from '@/components/mapaHtml';
import { Boton, colores } from '@/components/ui';

// Elegir un lugar: tocando el mapa, arrastrando el pin o con la ubicación actual (GPS)
export default function SelectorUbicacion({ etiqueta = 'Ubicación', valor, onChange, motivo, alto }: {
  etiqueta?: string;
  valor: Coordenada | null;
  onChange: (c: Coordenada) => void;
  motivo: string; // para el mensaje del permiso de GPS
  alto?: number;
}) {
  const [buscando, setBuscando] = useState(false);

  const usarGps = async () => {
    setBuscando(true);
    const c = await obtenerUbicacion(motivo);
    if (c) onChange(c);
    setBuscando(false);
  };

  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <MapaElegir valor={valor} onElegir={onChange} alto={alto} />
      <Text style={styles.ayuda}>
        {valor
          ? `📍 ${valor.lat.toFixed(5)}, ${valor.lng.toFixed(5)} · toca otro lugar o arrastra el pin para cambiarlo`
          : 'Toca el mapa para marcar el lugar, o usa tu ubicación actual.'}
      </Text>
      <Boton texto="📍 Usar mi ubicación actual" onPress={usarGps} cargando={buscando} secundario />
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { marginBottom: 10 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: 6 },
  ayuda: { fontSize: 12, color: colores.textoSuave, marginBottom: 2 },
});
