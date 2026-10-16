import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

export default function HomeScreen({ navigation }: any) {
  const { litrosTotales, puntosUsuario } = useApp();
  const aguaSalvada = litrosTotales * 40000;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.titulo}>ProyectoRally 🌿</Text>
        <Text style={styles.subtitulo}>Reutilización de Aceite Doméstico</Text>
      </View>

      {/* Tarjetas de estadísticas */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statNum}>{litrosTotales.toFixed(1)}L</Text>
          <Text style={styles.statLabel}>Aceite recolectado</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statNum}>{(aguaSalvada / 1000).toFixed(0)}kL</Text>
          <Text style={styles.statLabel}>Agua salvada</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF8E1' }]}>
          <Text style={styles.statNum}>{puntosUsuario}</Text>
          <Text style={styles.statLabel}>Mis puntos</Text>
        </View>
      </View>

      {/* Acciones rápidas */}
      <Text style={styles.seccionTitulo}>¿Qué quieres hacer?</Text>

      <TouchableOpacity
        style={[styles.accion, { backgroundColor: '#2E7D32' }]}
        onPress={() => navigation.navigate('Mapa')}
      >
        <Text style={styles.accionTexto}>📍 Ver puntos de acopio cercanos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.accion, { backgroundColor: '#1565C0' }]}
        onPress={() => navigation.navigate('Reportar')}
      >
        <Text style={styles.accionTexto}>📦 Reportar entrega de aceite</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.accion, { backgroundColor: '#E65100' }]}
        onPress={() => navigation.navigate('Estadísticas')}
      >
        <Text style={styles.accionTexto}>📊 Ver impacto de la comunidad</Text>
      </TouchableOpacity>

      {/* Dato curioso */}
      <View style={styles.datoCard}>
        <Text style={styles.datoEmoji}>💧</Text>
        <Text style={styles.datoTexto}>
          1 litro de aceite contamina{' '}
          <Text style={styles.datoBold}>40,000 litros de agua.</Text>{' '}
          ¡Tu aportación importa!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16 },
  header: { marginBottom: 20, marginTop: 10 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#2E7D32' },
  subtitulo: { fontSize: 14, color: '#666', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 10, color: '#555', marginTop: 4, textAlign: 'center' },
  seccionTitulo: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  accion: { borderRadius: 12, padding: 16, marginBottom: 10 },
  accionTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  datoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    elevation: 2,
    alignItems: 'center',
    gap: 10,
  },
  datoEmoji: { fontSize: 28 },
  datoTexto: { flex: 1, fontSize: 13, color: '#444', lineHeight: 20 },
  datoBold: { fontWeight: 'bold', color: '#1565C0' },
});
