import { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { api, BASE_URL } from '@/lib/api';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import type { Carrera } from '@/lib/types';
import { Aviso, Boton, Campo, colores, Dato, Fila, Opciones, Pantalla, Seccion, Tarjeta } from '@/components/ui';
import { alerta } from '@/lib/alerta';

const CARRERAS: Carrera[] = ['Sistemas', 'Bioquímica', 'Arquitectura', 'Voluntario'];

const PASOS = [
  { emoji: '✂️', texto: 'Se recolecta la poda de Ficus benjamina en los puntos de acopio.' },
  { emoji: '☀️', texto: 'Se seca y se tritura la hoja y la rama.' },
  { emoji: '🟤', texto: 'Se mezcla con arcilla y compost, y se envuelve una semilla nativa.' },
  { emoji: '🌥️', texto: 'Las píldoras se secan a la sombra.' },
  { emoji: '🌱', texto: 'Se dispersan en campo y se registra el seguimiento de germinación.' },
];

function Registro() {
  const { guardar } = useUsuario();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [carrera, setCarrera] = useState<Carrera | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (modo: 'registro' | 'login') => {
    setCargando(true);
    try {
      const u = modo === 'registro'
        ? await api.registrar({ nombre, email, carrera: carrera ?? undefined })
        : await api.login(email);
      await guardar(u);
    } catch (e) {
      alerta('No se pudo', (e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Tarjeta>
      <Text style={styles.registroTitulo}>Únete al proyecto</Text>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
      <Campo etiqueta="Correo" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
      <Opciones etiqueta="Carrera" opciones={CARRERAS} valor={carrera} onChange={setCarrera} />
      <Boton texto="Registrarme" onPress={() => enviar('registro')} cargando={cargando} />
      <Boton texto="Ya tengo cuenta (entrar con correo)" onPress={() => enviar('login')} secundario cargando={cargando} />
    </Tarjeta>
  );
}

export default function Inicio() {
  const { usuario, salir } = useUsuario();
  const { data: stats, error } = useData(api.stats);

  return (
    <Pantalla titulo="Píldoras Bióticas 🌱" subtitulo="Reforestación con poda de Ficus benjamina · Jiquilpan y Sahuayo">
      {error ? <Aviso texto={`${error}\nServidor: ${BASE_URL}`} /> : null}

      {usuario ? (
        <Tarjeta style={styles.saludo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saludoTexto}>Hola, {usuario.nombre}</Text>
            {usuario.carrera ? <Text style={styles.saludoCarrera}>{usuario.carrera}</Text> : null}
          </View>
          <TouchableOpacity onPress={salir}>
            <Text style={{ color: colores.textoSuave }}>Salir</Text>
          </TouchableOpacity>
        </Tarjeta>
      ) : (
        <Registro />
      )}

      <Seccion>Avance del proyecto</Seccion>
      <Fila>
        <Dato valor={`${stats?.kgPodaRecibida ?? 0} kg`} etiqueta="Poda de ficus recolectada" color={colores.tierraClaro} />
        <Dato valor={stats?.pildorasProducidas ?? 0} etiqueta="Píldoras producidas" color={colores.ambarClaro} />
      </Fila>
      <Fila>
        <Dato valor={stats?.pildoras ?? 0} etiqueta="Píldoras dispersadas" color={colores.verdeClaro} />
        <Dato valor={stats?.vivas ?? 0} etiqueta="Plántulas vivas" color={colores.azulClaro} />
      </Fila>

      <Fila>
        <Dato valor={stats?.jornadasProximas ?? 0} etiqueta="Jornadas de poda próximas" color={colores.tierraClaro} />
        <Dato valor={stats?.solicitudesPendientes ?? 0} etiqueta="Solicitudes por recoger" color={colores.rojoClaro} />
        <Dato valor={`${stats?.biomasa.triturada ?? 0} kg`} etiqueta="Ficus triturado listo" color={colores.ambarClaro} />
      </Fila>

      <Seccion>¿Qué quieres hacer?</Seccion>
      <Boton texto="✂️  Ver jornadas de poda y recolectar" color={colores.tierra} onPress={() => router.navigate('/acopio')} />
      <Boton texto="🌱  Registrar dispersión" onPress={() => router.navigate('/dispersar')} />
      <Boton texto="🧪  Registrar lote o ensayo" color={colores.azul} onPress={() => router.navigate('/laboratorio')} />

      <Seccion>¿Cómo funciona?</Seccion>
      {PASOS.map((p, i) => (
        <Tarjeta key={i} style={styles.paso}>
          <Text style={styles.pasoEmoji}>{p.emoji}</Text>
          <Text style={styles.pasoTexto}>{p.texto}</Text>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  registroTitulo: { fontSize: 17, fontWeight: '700', color: colores.texto, marginBottom: 12 },
  saludo: { flexDirection: 'row', alignItems: 'center' },
  saludoTexto: { fontSize: 17, fontWeight: '700', color: colores.texto },
  saludoCarrera: { fontSize: 13, color: colores.verde, marginTop: 2 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pasoEmoji: { fontSize: 24 },
  pasoTexto: { flex: 1, fontSize: 14, color: colores.texto, lineHeight: 20 },
});
