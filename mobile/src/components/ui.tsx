import React, { ReactNode } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TextInputProps,
  TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';

export const colores = {
  verde: '#2E7D32',
  verdeClaro: '#E8F5E9',
  tierra: '#8D6E63',
  tierraClaro: '#EFEBE9',
  azul: '#1565C0',
  azulClaro: '#E3F2FD',
  ambar: '#F9A825',
  ambarClaro: '#FFF8E1',
  rojo: '#C62828',
  rojoClaro: '#FFEBEE',
  fondo: '#F7F7F5',
  texto: '#263238',
  textoSuave: '#607D8B',
  borde: '#DDDDDD',
};

// Regresa a la pantalla anterior; si no hay historial, al dashboard
function BotonAtras() {
  const navigation = useNavigation();
  const regresar = () => (navigation.canGoBack() ? navigation.goBack() : router.replace('/'));
  return (
    <TouchableOpacity onPress={regresar} style={styles.atras} hitSlop={10} accessibilityRole="button" accessibilityLabel="Regresar">
      <Text style={styles.atrasTexto}>‹ Atrás</Text>
    </TouchableOpacity>
  );
}

export function Pantalla({ titulo, subtitulo, children, sinAtras }: {
  titulo: string; subtitulo?: string; children: ReactNode; sinAtras?: boolean;
}) {
  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        {!sinAtras ? <BotonAtras /> : null}
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Seccion({ children }: { children: ReactNode }) {
  return <Text style={styles.seccion}>{children}</Text>;
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.tarjeta, style]}>{children}</View>;
}

export function Dato({ valor, etiqueta, color = colores.verdeClaro }: { valor: string | number; etiqueta: string; color?: string }) {
  return (
    <View style={[styles.dato, { backgroundColor: color }]}>
      <Text style={styles.datoValor}>{valor}</Text>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

export function Fila({ children }: { children: ReactNode }) {
  return <View style={styles.fila}>{children}</View>;
}

export function Boton({
  texto, onPress, cargando, color = colores.verde, secundario,
}: { texto: string; onPress: () => void; cargando?: boolean; color?: string; secundario?: boolean }) {
  return (
    <TouchableOpacity
      style={[
        styles.boton,
        secundario ? { backgroundColor: '#fff', borderWidth: 1, borderColor: color } : { backgroundColor: color },
        cargando && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={cargando}
    >
      {cargando ? (
        <ActivityIndicator color={secundario ? color : '#fff'} />
      ) : (
        <Text style={[styles.botonTexto, secundario && { color }]}>{texto}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Campo({ etiqueta, ayuda, ...props }: TextInputProps & { etiqueta: string; ayuda?: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor="#999"
        {...props}
        style={[styles.input, props.multiline && { minHeight: 70, textAlignVertical: 'top' }]}
      />
      {ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

export function Opciones<T extends string>({
  etiqueta, opciones, valor, onChange, nombres,
}: {
  etiqueta: string;
  opciones: readonly T[];
  valor: T | null;
  onChange: (v: T) => void;
  nombres?: Partial<Record<T, string>>;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={styles.chips}>
        {opciones.map(op => (
          <TouchableOpacity
            key={op}
            onPress={() => onChange(op)}
            style={[styles.chip, valor === op && styles.chipActivo]}
          >
            <Text style={[styles.chipTexto, valor === op && styles.chipTextoActivo]}>{nombres?.[op] ?? op}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function OpcionesMultiples<T extends string | number>({
  etiqueta, opciones, valores, onChange, nombres,
}: {
  etiqueta: string;
  opciones: readonly T[];
  valores: T[];
  onChange: (v: T[]) => void;
  nombres?: Partial<Record<T, string>>;
}) {
  const alternar = (op: T) =>
    onChange(valores.includes(op) ? valores.filter(v => v !== op) : [...valores, op]);
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={styles.chips}>
        {opciones.map(op => {
          const activo = valores.includes(op);
          return (
            <TouchableOpacity key={String(op)} onPress={() => alternar(op)} style={[styles.chip, activo && styles.chipActivo]}>
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{nombres?.[op] ?? String(op)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function BotonChico({ texto, onPress, color = colores.verde, relleno }: { texto: string; onPress: () => void; color?: string; relleno?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.botonChico, { borderColor: color }, relleno && { backgroundColor: color }]}
    >
      <Text style={[styles.botonChicoTexto, { color: relleno ? '#fff' : color }]}>{texto}</Text>
    </TouchableOpacity>
  );
}

export function Aviso({ texto, tipo = 'error' }: { texto: string; tipo?: 'error' | 'ok' | 'info' }) {
  const estilo = {
    error: { backgroundColor: colores.rojoClaro, color: colores.rojo },
    ok: { backgroundColor: colores.verdeClaro, color: colores.verde },
    info: { backgroundColor: colores.azulClaro, color: colores.azul },
  }[tipo];
  return (
    <View style={[styles.aviso, { backgroundColor: estilo.backgroundColor }]}>
      <Text style={{ color: estilo.color, fontSize: 13 }}>{texto}</Text>
    </View>
  );
}

export function Barra({ etiqueta, valor, max, sufijo = '' }: { etiqueta: string; valor: number; max: number; sufijo?: string }) {
  const pct = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.barraFila}>
        <Text style={styles.barraEtiqueta}>{etiqueta}</Text>
        <Text style={styles.barraValor}>{valor}{sufijo}</Text>
      </View>
      <View style={styles.barraFondo}>
        <View style={[styles.barraRelleno, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

export const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// "2026-10-20" → "Mar 20 oct"
export const fechaCorta = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS_SEMANA[dt.getDay()]} ${d} ${dt.toLocaleDateString('es-MX', { month: 'short' })}`;
};

// Date → "2026-10-20" (hora local)
export const aYyyyMmDd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: 16, paddingBottom: 40 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: colores.verde, marginTop: 4 },
  atras: { alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 12, marginBottom: 2 },
  atrasTexto: { fontSize: 16, color: colores.verde, fontWeight: '600' },
  subtitulo: { fontSize: 13, color: colores.textoSuave, marginTop: 4, marginBottom: 16 },
  seccion: { fontSize: 16, fontWeight: '700', color: colores.texto, marginTop: 16, marginBottom: 10 },
  tarjeta: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  fila: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dato: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  datoValor: { fontSize: 20, fontWeight: 'bold', color: colores.texto },
  datoEtiqueta: { fontSize: 11, color: '#555', marginTop: 4, textAlign: 'center' },
  boton: { borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 6, marginBottom: 6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  campo: { marginBottom: 14 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginBottom: 6 },
  ayuda: { fontSize: 12, color: colores.textoSuave, marginTop: 4 },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: colores.borde, padding: 12, fontSize: 16, color: colores.texto },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: colores.borde, backgroundColor: '#fff' },
  chipActivo: { backgroundColor: colores.verde, borderColor: colores.verde },
  chipTexto: { color: '#555', fontSize: 13 },
  chipTextoActivo: { color: '#fff', fontWeight: '600' },
  aviso: { borderRadius: 10, padding: 12, marginBottom: 12 },
  botonChico: { borderWidth: 1, borderRadius: 18, paddingVertical: 7, paddingHorizontal: 12, marginRight: 8, marginTop: 8 },
  botonChicoTexto: { fontSize: 13, fontWeight: '600' },
  barraFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barraEtiqueta: { fontSize: 13, color: colores.texto, flex: 1 },
  barraValor: { fontSize: 13, fontWeight: '700', color: colores.texto },
  barraFondo: { height: 10, backgroundColor: '#ECEFF1', borderRadius: 5, overflow: 'hidden' },
  barraRelleno: { height: 10, backgroundColor: colores.verde, borderRadius: 5 },
});
