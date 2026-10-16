import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { puntosAcopioService } from '../services/api';

interface PuntoAcopio {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  litros: number;
}

// Datos de muestra para cuando no hay conexión al backend
const DATOS_MUESTRA: PuntoAcopio[] = [
  { id: '1', nombre: 'Eco-Estación Centro', direccion: 'Av. Principal 100', tipo: 'escuela', litros: 45 },
  { id: '2', nombre: 'Punto Verde Mercado', direccion: 'Mercado Municipal, Local 5', tipo: 'mercado', litros: 120 },
  { id: '3', nombre: 'Acopio Colonia Norte', direccion: 'Calle Roble 55', tipo: 'vecinal', litros: 33 },
];

export default function MapaScreen() {
  const [puntos, setPuntos] = useState<PuntoAcopio[]>(DATOS_MUESTRA);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarPuntos();
  }, []);

  const cargarPuntos = async () => {
    setCargando(true);
    try {
      const resp = await puntosAcopioService.getAll();
      if (resp.data.data.length > 0) setPuntos(resp.data.data);
    } catch {
      // Usar datos de muestra si el backend no responde
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>📍 Puntos de Acopio</Text>
        <Text style={styles.subtitulo}>Lleva tu aceite a cualquiera de estos puntos</Text>
      </View>

      {/* Aquí irá el mapa cuando esté configurado react-native-maps */}
      <View style={styles.mapaPlaceholder}>
        <Text style={styles.mapaTexto}>🗺️ Mapa en esta sección</Text>
        <Text style={styles.mapaSubtexto}>(requiere configuración de react-native-maps)</Text>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#2E7D32" />
      ) : (
        <FlatList
          data={puntos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.puntoCard}>
              <View style={styles.puntoIcon}>
                <Text style={styles.puntoEmoji}>
                  {item.tipo === 'escuela' ? '🏫' : item.tipo === 'mercado' ? '🏪' : '🏘️'}
                </Text>
              </View>
              <View style={styles.puntoInfo}>
                <Text style={styles.puntoNombre}>{item.nombre}</Text>
                <Text style={styles.puntoDireccion}>{item.direccion}</Text>
                <Text style={styles.puntoLitros}>{item.litros}L recolectados</Text>
              </View>
              <Text style={styles.puntoArrow}>›</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { padding: 16, paddingBottom: 0 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32' },
  subtitulo: { fontSize: 13, color: '#666', marginTop: 4 },
  mapaPlaceholder: {
    margin: 16,
    height: 160,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A5D6A7',
    borderStyle: 'dashed',
  },
  mapaTexto: { fontSize: 18, color: '#2E7D32' },
  mapaSubtexto: { fontSize: 12, color: '#888', marginTop: 4 },
  puntoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    alignItems: 'center',
  },
  puntoIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  puntoEmoji: { fontSize: 22 },
  puntoInfo: { flex: 1, marginLeft: 12 },
  puntoNombre: { fontSize: 15, fontWeight: '600', color: '#333' },
  puntoDireccion: { fontSize: 12, color: '#777', marginTop: 2 },
  puntoLitros: { fontSize: 12, color: '#2E7D32', marginTop: 4, fontWeight: '500' },
  puntoArrow: { fontSize: 22, color: '#ccc' },
});
