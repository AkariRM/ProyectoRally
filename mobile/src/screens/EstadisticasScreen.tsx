import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { reportesService } from '../services/api';
import { useApp } from '../context/AppContext';

interface Stats {
  totalReportes: number;
  totalLitrosAceite: number;
  aguaSalvadaLitros: number;
}

export default function EstadisticasScreen() {
  const { litrosTotales, puntosUsuario } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    setCargando(true);
    try {
      const resp = await reportesService.getStats();
      setStats(resp.data.stats);
    } catch {
      // Usar datos locales si no hay conexión
    } finally {
      setCargando(false);
    }
  };

  const aguaLocal = litrosTotales * 40000;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>📊 Estadísticas</Text>
      <Text style={styles.subtitulo}>El impacto colectivo de nuestra comunidad</Text>

      <Text style={styles.seccion}>Mi contribución</Text>
      <View style={styles.tarjetasRow}>
        <View style={[styles.tarjeta, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.tarjetaNum}>{litrosTotales.toFixed(1)}</Text>
          <Text style={styles.tarjetaLabel}>Litros entregados</Text>
        </View>
        <View style={[styles.tarjeta, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.tarjetaNum}>{(aguaLocal / 1000).toFixed(0)}k</Text>
          <Text style={styles.tarjetaLabel}>Litros agua salvados</Text>
        </View>
        <View style={[styles.tarjeta, { backgroundColor: '#FFF8E1' }]}>
          <Text style={styles.tarjetaNum}>{puntosUsuario}</Text>
          <Text style={styles.tarjetaLabel}>Puntos ganados</Text>
        </View>
      </View>

      <Text style={styles.seccion}>Comunidad</Text>
      {cargando ? (
        <ActivityIndicator size="large" color="#2E7D32" />
      ) : stats ? (
        <View>
          <View style={styles.comunidadCard}>
            <Text style={styles.comunidadEmoji}>🫙</Text>
            <View>
              <Text style={styles.comunidadNum}>{stats.totalLitrosAceite}L</Text>
              <Text style={styles.comunidadLabel}>de aceite recolectado</Text>
            </View>
          </View>
          <View style={styles.comunidadCard}>
            <Text style={styles.comunidadEmoji}>💧</Text>
            <View>
              <Text style={styles.comunidadNum}>{(stats.aguaSalvadaLitros / 1000000).toFixed(2)}M</Text>
              <Text style={styles.comunidadLabel}>litros de agua protegidos</Text>
            </View>
          </View>
          <View style={styles.comunidadCard}>
            <Text style={styles.comunidadEmoji}>📋</Text>
            <View>
              <Text style={styles.comunidadNum}>{stats.totalReportes}</Text>
              <Text style={styles.comunidadLabel}>entregas registradas</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.sinConexion}>
          <Text style={styles.sinConexionTexto}>⚠️ Sin datos del servidor. Mostrando datos locales.</Text>
        </View>
      )}

      <View style={styles.datoCard}>
        <Text style={styles.datoTitulo}>¿Sabías que…?</Text>
        <Text style={styles.datoTexto}>
          El aceite doméstico puede convertirse en <Text style={styles.datoBold}>biodiésel</Text> o{' '}
          <Text style={styles.datoBold}>jabón</Text>, reduciendo la contaminación y generando
          productos de uso cotidiano.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginTop: 10 },
  subtitulo: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 20 },
  seccion: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  tarjetasRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tarjeta: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  tarjetaNum: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  tarjetaLabel: { fontSize: 10, color: '#555', marginTop: 4, textAlign: 'center' },
  comunidadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    gap: 14,
  },
  comunidadEmoji: { fontSize: 30 },
  comunidadNum: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  comunidadLabel: { fontSize: 12, color: '#777' },
  sinConexion: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 16 },
  sinConexionTexto: { color: '#E65100', fontSize: 13 },
  datoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8, elevation: 2 },
  datoTitulo: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 6 },
  datoTexto: { fontSize: 13, color: '#555', lineHeight: 20 },
  datoBold: { fontWeight: 'bold', color: '#2E7D32' },
});
