import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { api, BASE_URL } from '@/lib/api';
import { useData } from '@/lib/useData';
import MenuUsuario from '@/components/MenuUsuario';
import { ANCHO_ESCRITORIO, Aviso, Boton, colores, Dato, Pantalla, Seccion, Tarjeta } from '@/components/ui';

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
  const { data: stats, error } = useData(api.stats);
  // Celular: 2 datos por fila y todo en una columna · Escritorio: cuadrícula más ancha
  const escritorio = useWindowDimensions().width >= ANCHO_ESCRITORIO;

  const datos = [
    { valor: `${stats?.kgPodaRecibida ?? 0} kg`, etiqueta: 'Poda de ficus recolectada', color: colores.tierraClaro },
    { valor: stats?.pildorasProducidas ?? 0, etiqueta: 'Píldoras producidas', color: colores.ambarClaro },
    { valor: stats?.pildoras ?? 0, etiqueta: 'Píldoras dispersadas', color: colores.verdeClaro },
    { valor: stats?.vivas ?? 0, etiqueta: 'Plántulas vivas', color: colores.azulClaro },
    { valor: stats?.jornadasProximas ?? 0, etiqueta: 'Jornadas de poda próximas', color: colores.tierraClaro },
    { valor: stats?.solicitudesPendientes ?? 0, etiqueta: 'Solicitudes por recoger', color: colores.rojoClaro },
    { valor: `${stats?.biomasa.triturada ?? 0} kg`, etiqueta: 'Ficus triturado listo', color: colores.ambarClaro },
  ];

  return (
    <Pantalla
      sinAtras
      titulo="Avance del proyecto 🌱"
      subtitulo="Reforestación con poda de Ficus benjamina · Jiquilpan y Sahuayo"
      derecha={<MenuUsuario />}
    >
      <Aviso
        tipo="info"
        texto="El problema: grandes volúmenes de biomasa vegetal urbana se tratan como desecho. Bio Red la convierte en píldoras bióticas para reforestar la Ciénega de Chapala sin riego artificial."
      />
      {error ? <Aviso texto={`${error}
Servidor: ${BASE_URL}`} /> : null}

      <Seccion>Biomasa y producción</Seccion>
      <View style={styles.cuadricula}>
        {datos.map(d => (
          <View key={d.etiqueta} style={[styles.celda, { flexBasis: escritorio ? '22%' : '45%' }]}>
            <Dato valor={d.valor} etiqueta={d.etiqueta} color={d.color} />
          </View>
        ))}
      </View>

      <Seccion>¿Qué quieres hacer?</Seccion>
      <View style={escritorio ? styles.filaAcciones : undefined}>
        <View style={escritorio ? styles.accion : undefined}>
          <Boton texto="✂️  Ver jornadas de poda y recolectar" color={colores.tierra} onPress={() => router.navigate('/acopio')} />
        </View>
        <View style={escritorio ? styles.accion : undefined}>
          <Boton texto="🌱  Reforestación: áreas, jornadas y dispersiones" onPress={() => router.navigate('/reforestar')} />
        </View>
        <View style={escritorio ? styles.accion : undefined}>
          <Boton texto="🧪  Registrar lote o ensayo" color={colores.azul} onPress={() => router.navigate('/laboratorio')} />
        </View>
      </View>

      <Seccion>¿Cómo funciona?</Seccion>
      <View style={styles.cuadricula}>
        {PASOS.map((p, i) => (
          <View key={i} style={[styles.celda, { flexBasis: escritorio ? '30%' : '100%' }]}>
            <Tarjeta style={[styles.paso, escritorio && { flex: 1 }]}>
              <Text style={styles.pasoNumero}>{i + 1}</Text>
              <Text style={styles.pasoEmoji}>{p.emoji}</Text>
              <Text style={styles.pasoTexto}>{p.texto}</Text>
            </Tarjeta>
          </View>
        ))}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  celda: { flexGrow: 1, display: 'flex' },
  filaAcciones: { flexDirection: 'row', gap: 10 },
  accion: { flex: 1 },
  paso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  pasoNumero: { fontSize: 12, fontWeight: '700', color: colores.verde, alignSelf: 'flex-start' },
  pasoEmoji: { fontSize: 24 },
  pasoTexto: { flex: 1, fontSize: 14, color: colores.texto, lineHeight: 20 },
});
