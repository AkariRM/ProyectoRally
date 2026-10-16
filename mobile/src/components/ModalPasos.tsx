import { ComponentRef, ReactNode, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform,
  Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { colores } from '@/components/ui';
import { alerta } from '@/lib/alerta';

export type Paso = {
  titulo: string;
  contenido: ReactNode;
  // Si tiene texto, no deja avanzar y lo muestra como aviso
  falta?: string | null;
};

// Modal para registrar datos en pasos, como diapositivas: se avanza deslizando
// hacia los lados o con "Siguiente", con puntos que indican en qué paso vas.
export default function ModalPasos({
  titulo, pasos, onCerrar, onFinal, textoFinal = 'Guardar', cargando, color = colores.verde,
}: {
  titulo: string;
  pasos: Paso[];
  onCerrar: () => void;
  onFinal: () => void;
  textoFinal?: string;
  cargando?: boolean;
  color?: string;
}) {
  const [ancho, setAncho] = useState(0);
  const [paso, setPaso] = useState(0);
  const carrusel = useRef<ComponentRef<typeof ScrollView>>(null);
  const ultimo = paso === pasos.length - 1;

  const mover = (i: number) => {
    setPaso(i);
    carrusel.current?.scrollTo({ x: i * ancho, animated: true });
  };

  // No deja pasar adelante si a un paso anterior le falta algo
  const ir = (i: number) => {
    const pendiente = pasos.slice(0, i).findIndex(p => p.falta);
    if (pendiente >= 0) {
      mover(pendiente);
      return alerta('Falta dato', pasos[pendiente].falta!);
    }
    mover(i);
  };

  const alDeslizar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!ancho) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / ancho);
    if (i !== paso && i >= 0 && i < pasos.length) setPaso(i);
  };

  // Al soltar el deslizamiento, valida igual que el botón "Siguiente"
  const alSoltar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!ancho) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / ancho);
    if (pasos.slice(0, i).some(p => p.falta)) ir(i);
  };

  const finalizar = () => {
    const pendiente = pasos.findIndex(p => p.falta);
    if (pendiente >= 0) {
      mover(pendiente);
      return alerta('Falta dato', pasos[pendiente].falta!);
    }
    onFinal();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View style={styles.hoja}>
          <View style={styles.cabecera}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.titulo, { color }]}>{titulo}</Text>
              {pasos.length > 1 ? (
                <Text style={styles.pasoTexto}>Paso {paso + 1} de {pasos.length} · {pasos[paso].titulo}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onCerrar} hitSlop={12} accessibilityLabel="Cerrar">
              <Text style={styles.cerrar}>✕</Text>
            </TouchableOpacity>
          </View>

          {pasos.length > 1 ? (
            <View style={styles.puntos}>
              {pasos.map((p, i) => (
                <TouchableOpacity key={p.titulo} onPress={() => ir(i)} hitSlop={6} accessibilityLabel={`Ir al paso ${i + 1}`}>
                  <View style={[styles.punto, i === paso && [styles.puntoActivo, { backgroundColor: color }], i < paso && { backgroundColor: color, opacity: 0.4 }]} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.cuerpo} onLayout={e => setAncho(e.nativeEvent.layout.width)}>
            {ancho ? (
              <ScrollView
                ref={carrusel}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={alDeslizar}
                onMomentumScrollEnd={alSoltar}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
              >
                {pasos.map(p => (
                  <ScrollView
                    key={p.titulo}
                    style={{ width: ancho }}
                    contentContainerStyle={styles.diapositiva}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {p.contenido}
                  </ScrollView>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.pie}>
            {paso > 0 ? (
              <TouchableOpacity style={[styles.boton, styles.botonAtras, { borderColor: color }]} onPress={() => ir(paso - 1)}>
                <Text style={[styles.botonTexto, { color }]}>‹ Atrás</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.boton, { backgroundColor: color }, cargando && { opacity: 0.6 }]}
              onPress={ultimo ? finalizar : () => ir(paso + 1)}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.botonTexto, { color: '#fff' }]}>{ultimo ? textoFinal : 'Siguiente ›'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', alignItems: 'center' },
  hoja: {
    width: '100%', maxWidth: 560, height: '85%', backgroundColor: colores.fondo,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden',
  },
  cabecera: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 },
  titulo: { fontSize: 19, fontWeight: 'bold' },
  pasoTexto: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
  cerrar: { fontSize: 20, color: colores.textoSuave, paddingLeft: 12 },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.borde },
  puntoActivo: { width: 22 },
  cuerpo: { flex: 1 },
  diapositiva: { padding: 18, paddingBottom: 30 },
  pie: { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: '#e6e6e6', backgroundColor: '#fff' },
  boton: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  botonAtras: { flex: 0, paddingHorizontal: 18, borderWidth: 1, backgroundColor: '#fff' },
  botonTexto: { fontSize: 16, fontWeight: '700' },
});
