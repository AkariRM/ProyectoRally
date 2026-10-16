import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

export default function PerfilScreen() {
  const { litrosTotales, puntosUsuario } = useApp();

  const nivel = puntosUsuario >= 500 ? 'Guardián del Agua 🏆' :
                puntosUsuario >= 200 ? 'Ecoactivista ⭐' :
                puntosUsuario >= 50  ? 'Colaborador 🌱' : 'Nuevo miembro 🌿';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>🧑</Text>
        </View>
        <Text style={styles.nombre}>Mi perfil</Text>
        <Text style={styles.nivel}>{nivel}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{litrosTotales.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Litros entregados</Text>
        </View>
        <View style={styles.divisor} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{puntosUsuario}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
        <View style={styles.divisor} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{(litrosTotales * 40000 / 1000).toFixed(0)}k</Text>
          <Text style={styles.statLabel}>Litros agua</Text>
        </View>
      </View>

      <Text style={styles.seccion}>Insignias</Text>
      <View style={styles.insigniasRow}>
        {[
          { emoji: '🌿', nombre: 'Primera entrega', conseguido: litrosTotales > 0 },
          { emoji: '💧', nombre: '10 litros', conseguido: litrosTotales >= 10 },
          { emoji: '🌊', nombre: '50 litros', conseguido: litrosTotales >= 50 },
          { emoji: '🏆', nombre: '100 litros', conseguido: litrosTotales >= 100 },
        ].map(insignia => (
          <View key={insignia.nombre} style={[styles.insignia, !insignia.conseguido && styles.insigniaLocked]}>
            <Text style={styles.insigniaEmoji}>{insignia.emoji}</Text>
            <Text style={styles.insigniaNombre}>{insignia.nombre}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.botonSecundario}>
        <Text style={styles.botonSecundarioTexto}>⚙️ Configuración</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  content: { padding: 16 },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontSize: 40 },
  nombre: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10 },
  nivel: { fontSize: 14, color: '#2E7D32', marginTop: 4 },
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 11, color: '#777', marginTop: 4, textAlign: 'center' },
  divisor: { width: 1, backgroundColor: '#eee' },
  seccion: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  insigniasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  insignia: { width: '46%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2 },
  insigniaLocked: { opacity: 0.4 },
  insigniaEmoji: { fontSize: 28 },
  insigniaNombre: { fontSize: 12, color: '#555', marginTop: 6, textAlign: 'center' },
  botonSecundario: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  botonSecundarioTexto: { color: '#555', fontSize: 15 },
});
