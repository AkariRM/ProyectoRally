import { StyleSheet, Text, View } from 'react-native';
import { colores, Seccion, Tarjeta } from '@/components/ui';

// Composición química de Ficus benjamina (documento de la problemática). Solo consulta.

type FilaTabla = [string, string, string];

const HOJA: FilaTabla[] = [
  ['α-Celulosa', '38.1 – 39.0 %', 'Rigidez y resistencia a la tensión de la pared celular'],
  ['Hemicelulosa', '30.5 %', 'Matriz amorfa (xilanos, glucomananos) que liga celulosa y lignina'],
  ['Lignina (Klason)', '23.4 %', 'Polímero fenólico: impermeabilidad y protección contra patógenos'],
  ['Extractivos (ceras, lípidos, pigmentos)', '2.9 %', 'Fracción lipídica y resinosa'],
  ['Cenizas (minerales)', '4.5 %', 'Sales de K, Ca y depósitos de sílice / oxalato de calcio'],
];

const RAMA: FilaTabla[] = [
  ['Celulosa (α-celulosa)', '47.67 % (40.4 – 48.0)', 'Mayor que en hoja: resistencia mecánica de la rama'],
  ['Hemicelulosa', '22.89 %', 'Puente entre microfibrillas de celulosa y lignina'],
  ['Lignina (Klason)', '18.10 – 23.50 %', 'Hidrofóbica: resistencia a la compresión'],
  ['Extractivos (resinas, látex, lípidos)', '3.50 – 6.00 %', 'Fracción lipofílica del látex y resinas de la corteza'],
  ['Cenizas (minerales)', '2.50 – 4.00 %', 'Silicatos y sales de Ca / K del peridermis'],
];

const LIPIDOS: FilaTabla[] = [
  ['Triterpenos y esteroides', '35 – 50 %', 'Lupeol, α/β-amirina, friedelina: defensa química'],
  ['Fitosteroles', '15 – 25 %', 'β-sitosterol, estigmasterol, campesterol'],
  ['Suberina y ácidos grasos', '10 – 20 %', 'Evitan la pérdida de agua en la corteza'],
  ['Poliisoprenoides', '5 – 12 %', 'cis-1,4-poliisopreno (caucho natural) del látex'],
  ['Ceramidas y amidas', 'trazas', 'Benjaminamida, característica de F. benjamina'],
];

function Tabla({ titulo, nota, filas }: { titulo: string; nota: string; filas: FilaTabla[] }) {
  return (
    <Tarjeta>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.nota}>{nota}</Text>
      {filas.map(([comp, valor, funcion]) => (
        <View key={comp} style={styles.fila}>
          <View style={styles.encabezado}>
            <Text style={styles.componente}>{comp}</Text>
            <Text style={styles.valor}>{valor}</Text>
          </View>
          <Text style={styles.funcion}>{funcion}</Text>
        </View>
      ))}
    </Tarjeta>
  );
}

export default function Referencia() {
  return (
    <>
      <Seccion>Composición de Ficus benjamina</Seccion>
      <Tabla titulo="🍃 Hoja / fibra cruda" nota="% en base seca" filas={HOJA} />
      <Tabla titulo="🪵 Tallo y ramas" nota="% en peso seco (método Kushner-Hoffer / TAPPI)" filas={RAMA} />
      <Tabla titulo="🧴 Fracción lipofílica de ramas y corteza" nota="% de la fracción lipofílica / insaponificable (GC-MS)" filas={LIPIDOS} />

      <Seccion>Cómo actúa en la píldora</Seccion>
      <Tarjeta>
        <Text style={styles.punto}>🛡️ <Text style={styles.negrita}>Estructura:</Text> las hojas coriáceas trituradas forman una malla interna que evita que la esfera se agriete al sol y protege la semilla de roedores y aves.</Text>
        <Text style={styles.punto}>💧 <Text style={styles.negrita}>Retención hídrica:</Text> la cutícula cerosa y el tejido fibroso atrapan la humedad de las primeras lluvias o el rocío.</Text>
        <Text style={styles.punto}>🌱 <Text style={styles.negrita}>Descomposición controlada:</Text> al germinar la semilla, la fibra se degrada lentamente y alimenta la microflora del suelo.</Text>
      </Tarjeta>

      <Seccion>Fuentes</Seccion>
      <Tarjeta>
        <Text style={styles.fuente}>Ramesh, M., et al. (2023–2025). Characterization of Ficus benjamina L. stem and aerial root fibers for composite applications. Journal of Natural Fibers / Biomass Conversion and Biorefinery.</Text>
        <Text style={styles.fuente}>Obi Reddy, K., Uma Maheswari, C., et al. (2012, 2016). Extraction and characterization of cellulose from pretreated Ficus leaf fibers. J. Biobased Materials and Bioenergy 6(1); J. Natural Fibers 13(1).</Text>
        <Text style={styles.fuente}>Salem, M. Z. M., et al. (2013). Chemical composition and biological activities of extracts of Ficus benjamina.</Text>
      </Tarjeta>
    </>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 15, fontWeight: '700', color: colores.texto },
  nota: { fontSize: 11, color: colores.textoSuave, marginBottom: 8 },
  fila: { borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 6 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  componente: { fontSize: 13, fontWeight: '600', color: colores.texto, flex: 1 },
  valor: { fontSize: 13, fontWeight: '700', color: colores.verde },
  funcion: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  punto: { fontSize: 13, color: colores.texto, marginBottom: 8, lineHeight: 19 },
  negrita: { fontWeight: '700' },
  fuente: { fontSize: 12, color: colores.textoSuave, marginBottom: 6 },
});
