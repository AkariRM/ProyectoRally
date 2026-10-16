import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { api, BASE_URL } from '@/lib/api';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import { NOMBRE_ROL } from '@/lib/catalogos';
import { Aviso, Boton, colores, Dato, Fila, Pantalla, Seccion, Tarjeta } from '@/components/ui';

// Proceso artesanal del documento de la problemática
const PASOS = [
  { emoji: '✂️', texto: 'Se recolectan hojas secas, ramillas tiernas y ramas de la poda urbana de Ficus benjamina (camellones, plazas, traspatios) y pasto.' },
  { emoji: '☀️', texto: 'Se secan al sol. Hojas y ramillas se trituran a escamas de 2–3 mm; las ramas se convierten en biochar (pirólisis > 450 °C) y el pasto en harina.' },
  { emoji: '⚖️', texto: 'Se pesa la mezcla según la fórmula (biochar, harina, compost y pasta aglutinante) con un inóculo local de micorrizas o bacterias.' },
  { emoji: '🌰', texto: 'Al centro va una semilla nativa resistente (mezquite, huizache, agave silvestre) y se forman esferas de 2–3 cm.' },
  { emoji: '🌥️', texto: 'Las esferas se secan a la sombra.' },
  { emoji: '🌱', texto: 'Se dispersan en zonas áridas, laderas erosionadas y bordes degradados de la Ciénega de Chapala, sin riego, y se da seguimiento a la germinación.' },
];

export default function Inicio() {
  const { usuario, esAdmin, salir } = useUsuario();
  const { data: stats, error } = useData(api.stats);

  return (
    <Pantalla sinAtras titulo="Avance del proyecto 🌱" subtitulo="Reforestación con poda de Ficus benjamina · Jiquilpan y Sahuayo">
      <Aviso
        tipo="info"
        texto="El problema: grandes volúmenes de biomasa vegetal urbana se tratan como desecho. Bio Red la convierte en píldoras bióticas para reforestar la Ciénega de Chapala sin riego artificial."
      />
      {error ? <Aviso texto={`${error}\nServidor: ${BASE_URL}`} /> : null}

      {usuario ? (
        <Tarjeta style={styles.saludo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saludoTexto}>Hola, {usuario.email.split('@')[0]}</Text>
            <Text style={styles.saludoCarrera}>{NOMBRE_ROL[usuario.rol] ?? usuario.rol} · {usuario.email}</Text>
          </View>
          <TouchableOpacity onPress={salir}>
            <Text style={{ color: colores.textoSuave }}>Salir</Text>
          </TouchableOpacity>
        </Tarjeta>
      ) : null}
      {esAdmin ? (
        <>
          <Boton texto="⚙️  Administrar usuarios" color={colores.texto} secundario onPress={() => router.push('/admin')} />
          <Boton texto="📚  Catálogos (especies, tratamientos, pruebas…)" color={colores.texto} secundario onPress={() => router.push('/catalogos')} />
        </>
      ) : null}

      <Seccion>Biomasa y producción</Seccion>
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
      <Boton texto="🌱  Reforestación: áreas, jornadas y dispersiones" onPress={() => router.navigate('/reforestar')} />
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
  saludo: { flexDirection: 'row', alignItems: 'center' },
  saludoTexto: { fontSize: 17, fontWeight: '700', color: colores.texto },
  saludoCarrera: { fontSize: 13, color: colores.verde, marginTop: 2 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pasoEmoji: { fontSize: 24 },
  pasoTexto: { flex: 1, fontSize: 14, color: colores.texto, lineHeight: 20 },
});
