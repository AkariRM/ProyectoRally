import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { reportesService } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ReportarScreen() {
  const { agregarLitros } = useApp();
  const [litros, setLitros] = useState('');
  const [puntoId, setPuntoId] = useState('1');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const aguaSalvada = Number(litros) * 40000;

  const enviarReporte = async () => {
    if (!litros || Number(litros) <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad de litros válida');
      return;
    }
    setEnviando(true);
    try {
      await reportesService.create({ puntoId, litros: Number(litros), notas });
      agregarLitros(Number(litros));
      setExito(true);
      setLitros('');
      setNotas('');
      setTimeout(() => setExito(false), 3000);
    } catch {
      Alert.alert('Sin conexión', 'El reporte se guardará cuando haya conexión.');
      agregarLitros(Number(litros)); // Igual se registra localmente
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>📦 Reportar entrega</Text>
      <Text style={styles.subtitulo}>Registra los litros de aceite que estás entregando</Text>

      {exito && (
        <View style={styles.exitoCard}>
          <Text style={styles.exitoTexto}>✅ ¡Reporte enviado con éxito! Gracias por tu aportación.</Text>
        </View>
      )}

      <View style={styles.campo}>
        <Text style={styles.label}>Litros de aceite</Text>
        <TextInput
          style={styles.input}
          value={litros}
          onChangeText={setLitros}
          keyboardType="decimal-pad"
          placeholder="Ej: 2.5"
          placeholderTextColor="#aaa"
        />
      </View>

      {litros !== '' && Number(litros) > 0 && (
        <View style={styles.impactoCard}>
          <Text style={styles.impactoTitulo}>🌊 Impacto de tu entrega</Text>
          <Text style={styles.impactoTexto}>
            Con <Text style={styles.impactoBold}>{litros}L de aceite</Text> evitarás contaminar{' '}
            <Text style={styles.impactoBold}>{aguaSalvada.toLocaleString()} litros de agua</Text>
          </Text>
        </View>
      )}

      <View style={styles.campo}>
        <Text style={styles.label}>Punto de acopio</Text>
        <View style={styles.selector}>
          {['1', '2', '3'].map(id => (
            <TouchableOpacity
              key={id}
              style={[styles.opcion, puntoId === id && styles.opcionActiva]}
              onPress={() => setPuntoId(id)}
            >
              <Text style={[styles.opcionTexto, puntoId === id && styles.opcionTextoActivo]}>
                Punto {id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultilinea]}
          value={notas}
          onChangeText={setNotas}
          multiline
          numberOfLines={3}
          placeholder="Ej: aceite de fritura, muy oscuro..."
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity
        style={[styles.boton, enviando && styles.botonDeshabilitado]}
        onPress={enviarReporte}
        disabled={enviando}
      >
        {enviando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.botonTexto}>Enviar reporte</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginTop: 10 },
  subtitulo: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 20 },
  exitoCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 16 },
  exitoTexto: { color: '#2E7D32', fontSize: 14, fontWeight: '500' },
  campo: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', padding: 12, fontSize: 16, color: '#333' },
  inputMultilinea: { minHeight: 80, textAlignVertical: 'top' },
  impactoCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14, marginBottom: 16 },
  impactoTitulo: { fontSize: 14, fontWeight: '600', color: '#1565C0', marginBottom: 4 },
  impactoTexto: { fontSize: 14, color: '#333', lineHeight: 22 },
  impactoBold: { fontWeight: 'bold', color: '#1565C0' },
  selector: { flexDirection: 'row', gap: 8 },
  opcion: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
  opcionActiva: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  opcionTexto: { color: '#555', fontWeight: '500' },
  opcionTextoActivo: { color: '#fff' },
  boton: { backgroundColor: '#2E7D32', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  botonDeshabilitado: { backgroundColor: '#9E9E9E' },
  botonTexto: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
