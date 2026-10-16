import { Linking, StyleSheet, Text, View } from 'react-native';
import { api, urlExportar } from '@/lib/api';
import { useData } from '@/lib/useData';
import { useUsuario } from '@/lib/usuario';
import { Aviso, Barra, BotonChico, colores, Dato, Fila, Pantalla, Seccion, Tarjeta } from '@/components/ui';

// Recursos exportables: los que tienen ubicación también salen en GeoJSON (QGIS)
const EXPORTABLES: { recurso: string; nombre: string; geo: boolean }[] = [
  { recurso: 'areas-reforestacion', nombre: 'Áreas a reforestar', geo: true },
  { recurso: 'dispersiones', nombre: 'Dispersiones', geo: true },
  { recurso: 'zonas-poda', nombre: 'Zonas de poda', geo: true },
  { recurso: 'puntos-acopio', nombre: 'Puntos de acopio', geo: true },
  { recurso: 'solicitudes', nombre: 'Solicitudes', geo: true },
  { recurso: 'entregas-poda', nombre: 'Entregas de poda', geo: false },
  { recurso: 'jornadas-poda', nombre: 'Jornadas de poda', geo: false },
  { recurso: 'jornadas-reforestacion', nombre: 'Jornadas de reforestación', geo: false },
  { recurso: 'seguimientos', nombre: 'Seguimientos', geo: false },
  { recurso: 'lotes', nombre: 'Lotes', geo: false },
  { recurso: 'ensayos', nombre: 'Ensayos de laboratorio', geo: false },
  { recurso: 'procesos-biomasa', nombre: 'Secado y triturado', geo: false },
];

const tasa = (t: number | null) => (t !== null ? ` · ${t}/100 germinan` : '');

export default function Impacto() {
  const { puede } = useUsuario();
  const { data: s, error } = useData(api.stats);

  const maxEspecie = Math.max(0, ...(s?.porEspecie ?? []).map(e => e.pildoras));
  const maxArea = Math.max(0, ...(s?.porArea ?? []).map(a => a.pildoras));
  const porTipo = Object.entries(s?.biomasa.recibidaPorTipo ?? {});
  const maxTipo = Math.max(0, ...porTipo.map(([, kg]) => kg));

  return (
    <Pantalla titulo="Impacto 📊" subtitulo="Resultados de toda la comunidad">
      {error ? <Aviso texto={error} /> : null}

      <Seccion>Biomasa recuperada</Seccion>
      <Fila>
        <Dato valor={`${s?.kgPodaRecibida ?? 0} kg`} etiqueta="Poda que no se quemó ni fue al tiradero" color={colores.tierraClaro} />
        <Dato valor={s?.lotes ?? 0} etiqueta="Lotes" color={colores.ambarClaro} />
        <Dato valor={s?.pildorasProducidas ?? 0} etiqueta="Píldoras hechas" color={colores.ambarClaro} />
      </Fila>
      {porTipo.length ? (
        <Tarjeta>
          {porTipo.map(([tipo, kg]) => <Barra key={tipo} etiqueta={tipo} valor={kg} max={maxTipo} sufijo=" kg" />)}
        </Tarjeta>
      ) : null}

      <Seccion>Reforestación</Seccion>
      <Fila>
        <Dato valor={s?.reforestacion.areas ?? 0} etiqueta="Áreas a reforestar" color={colores.rojoClaro} />
        <Dato valor={`${s?.reforestacion.hectareas ?? 0} ha`} etiqueta="Superficie" color={colores.rojoClaro} />
        <Dato valor={s?.reforestacion.jornadasRealizadas ?? 0} etiqueta="Jornadas realizadas" color={colores.azulClaro} />
      </Fila>
      <Fila>
        <Dato valor={s?.reforestacion.participantes ?? 0} etiqueta="Personas participando" color={colores.azulClaro} />
        <Dato valor={s?.pildoras ?? 0} etiqueta="Píldoras dispersadas" />
        <Dato valor={s?.dispersiones ?? 0} etiqueta="Sitios" />
      </Fila>
      <Fila>
        <Dato valor={s?.germinadas ?? 0} etiqueta="Plántulas germinadas" />
        <Dato valor={s?.vivas ?? 0} etiqueta="Plántulas vivas" />
        <Dato
          valor={s?.alturaPromedioCm !== null && s?.alturaPromedioCm !== undefined ? `${s.alturaPromedioCm} cm` : '–'}
          etiqueta="Altura promedio"
          color={colores.verdeClaro}
        />
      </Fila>
      <Fila>
        <Dato
          valor={s?.tasaGerminacion === null || s?.tasaGerminacion === undefined ? '–' : `${s.tasaGerminacion}`}
          etiqueta="Plántulas por cada 100 píldoras"
          color={colores.azulClaro}
        />
      </Fila>

      {s?.porArea.length ? <Seccion>Por área (píldoras dispersadas)</Seccion> : null}
      {s?.porArea.length ? (
        <Tarjeta>
          {s.porArea.map(a => (
            <Barra
              key={a.areaId}
              etiqueta={`${a.area}${tasa(a.tasaGerminacion)}${a.alturaPromedioCm !== null ? ` · ${a.alturaPromedioCm} cm` : ''}`}
              valor={a.pildoras}
              max={maxArea}
            />
          ))}
        </Tarjeta>
      ) : null}

      {s?.porEspecie.length ? <Seccion>Por especie (píldoras dispersadas)</Seccion> : null}
      {s?.porEspecie.length ? (
        <Tarjeta>
          {s.porEspecie.map(e => (
            <Barra key={e.especieId} etiqueta={`${e.especie}${tasa(e.tasaGerminacion)}`} valor={e.pildoras} max={maxEspecie} />
          ))}
        </Tarjeta>
      ) : null}

      {puede('municipio', 'brigadista') ? (
        <>
          <Seccion>Exportar datos</Seccion>
          <Aviso
            tipo="info"
            texto="GeoJSON se abre en QGIS (Capa → Añadir capa vectorial). CSV se abre en Excel o Google Sheets para el análisis estadístico."
          />
          {EXPORTABLES.map(x => (
            <View key={x.recurso} style={styles.exportar}>
              <Text style={styles.exportarNombre}>{x.nombre}</Text>
              <View style={styles.acciones}>
                <BotonChico texto="CSV" color={colores.verde} onPress={() => Linking.openURL(urlExportar(x.recurso, 'csv'))} />
                {x.geo ? (
                  <BotonChico texto="GeoJSON" color={colores.azul} onPress={() => Linking.openURL(urlExportar(x.recurso, 'geojson'))} />
                ) : null}
              </View>
            </View>
          ))}
        </>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  exportar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 6 },
  exportarNombre: { fontSize: 14, color: colores.texto, flex: 1, marginTop: 8 },
  acciones: { flexDirection: 'row' },
});
