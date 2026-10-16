import { Text } from 'react-native';
import { api } from '@/lib/api';
import { useData } from '@/lib/useData';
import { Aviso, Barra, colores, Dato, Fila, Pantalla, Seccion, Tarjeta } from '@/components/ui';

export default function Impacto() {
  const { data: s, error } = useData(api.stats);

  const maxEspecie = Math.max(0, ...(s?.porEspecie ?? []).map(e => e.pildoras));
  const maxZona = Math.max(0, ...(s?.porZona ?? []).map(z => z.pildoras));

  return (
    <Pantalla titulo="Impacto 📊" subtitulo="Resultados de toda la comunidad">
      {error ? <Aviso texto={error} /> : null}

      <Seccion>Materia prima y producción</Seccion>
      <Fila>
        <Dato valor={`${s?.kgPodaRecibida ?? 0} kg`} etiqueta="Poda de ficus aprovechada" color={colores.tierraClaro} />
        <Dato valor={s?.lotes ?? 0} etiqueta="Lotes" color={colores.ambarClaro} />
        <Dato valor={s?.pildorasProducidas ?? 0} etiqueta="Píldoras hechas" color={colores.ambarClaro} />
      </Fila>

      <Seccion>Campo</Seccion>
      <Fila>
        <Dato valor={s?.pildoras ?? 0} etiqueta="Píldoras dispersadas" />
        <Dato valor={s?.dispersiones ?? 0} etiqueta="Sitios" />
        <Dato valor={s?.voluntarios ?? 0} etiqueta="Voluntarios" color={colores.azulClaro} />
      </Fila>
      <Fila>
        <Dato valor={s?.germinadas ?? 0} etiqueta="Plántulas germinadas" />
        <Dato valor={s?.vivas ?? 0} etiqueta="Plántulas vivas" />
        <Dato
          valor={s?.tasaGerminacion === null || s?.tasaGerminacion === undefined ? '–' : `${s.tasaGerminacion}`}
          etiqueta="Plántulas por cada 100 píldoras"
          color={colores.azulClaro}
        />
      </Fila>

      {s?.porEspecie.length ? <Seccion>Por especie (píldoras dispersadas)</Seccion> : null}
      {s?.porEspecie.length ? (
        <Tarjeta>
          {s.porEspecie.map(e => (
            <Barra key={e.especieId} etiqueta={`${e.especie}${e.tasaGerminacion !== null ? ` · ${e.tasaGerminacion}/100 germinan` : ''}`} valor={e.pildoras} max={maxEspecie} />
          ))}
        </Tarjeta>
      ) : null}

      {s?.porZona.length ? <Seccion>Por zona (píldoras dispersadas)</Seccion> : null}
      {s?.porZona.length ? (
        <Tarjeta>
          {s.porZona.map(z => (
            <Barra key={z.zona} etiqueta={`${z.zona}${z.tasaGerminacion !== null ? ` · ${z.tasaGerminacion}/100 germinan` : ''}`} valor={z.pildoras} max={maxZona} />
          ))}
        </Tarjeta>
      ) : null}

      {s && !s.dispersiones ? (
        <Text style={{ color: colores.textoSuave, marginTop: 12 }}>Aún no hay dispersiones registradas.</Text>
      ) : null}
    </Pantalla>
  );
}
