import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { obtenerUbicacion } from '@/lib/gps';
import { confirmar } from '@/lib/alerta';
import { areaM2, esPoligono, type Poligono } from '@/lib/geo';
import MapaElegir from '@/components/MapaElegir';
import type { Coordenada } from '@/components/mapaHtml';
import { Boton, BotonChico, colores, Opciones } from '@/components/ui';

const NOMBRES_MODO = { punto: '📍 Círculo', dibujar: '✏️ Dibujar zona' } as const;

// Ubicación de una zona o área: un círculo (centro + radio) o un polígono dibujado
// tocando el mapa vértice por vértice. También se puede caminar el borde con el GPS.
export default function SelectorZona({ centro, radioM, poligono, onCentro, onPoligono, motivo }: {
  centro: Coordenada | null;
  radioM: number;
  poligono: Poligono;
  onCentro: (c: Coordenada) => void;
  onPoligono: (p: Poligono) => void;
  motivo: string; // para el mensaje del permiso de GPS
}) {
  const [modo, setModo] = useState<'punto' | 'dibujar'>(poligono.length ? 'dibujar' : 'punto');
  const [buscando, setBuscando] = useState(false);
  const agregar = (c: Coordenada) => onPoligono([...poligono, [c.lat, c.lng]]);

  const usarGps = async () => {
    setBuscando(true);
    const c = await obtenerUbicacion(motivo);
    if (c) (modo === 'dibujar' ? agregar(c) : onCentro(c));
    setBuscando(false);
  };

  const hectareas = areaM2(poligono) / 10000;

  // Por si se equivocan: borra todo lo dibujado (pide confirmación)
  const borrarDibujo = async () => {
    if (!poligono.length) return;
    if (await confirmar('Borrar dibujo', `¿Borrar los ${poligono.length} puntos dibujados y empezar de nuevo?`, 'Borrar')) onPoligono([]);
  };

  return (
    <View style={styles.campo}>
      <Opciones etiqueta="¿Cómo marcar la zona?" opciones={['punto', 'dibujar'] as const} nombres={NOMBRES_MODO} valor={modo} onChange={setModo} />
      <MapaElegir
        valor={centro}
        onElegir={onCentro}
        modo={modo}
        radioM={radioM}
        poligono={poligono}
        onVertice={agregar}
        alto={280}
      />
      {modo === 'punto' ? (
        <Text style={styles.ayuda}>
          {centro
            ? `📍 Centro ${centro.lat.toFixed(5)}, ${centro.lng.toFixed(5)} · el círculo verde muestra el radio`
            : 'Toca el mapa para marcar el centro de la zona.'}
          {esPoligono(poligono) ? '  (Hay un polígono dibujado: se usa el polígono.)' : ''}
        </Text>
      ) : (
        <>
          <Text style={styles.ayuda}>
            {poligono.length < 3
              ? `Toca el mapa en cada esquina de la zona (${poligono.length} de mínimo 3 puntos).`
              : `${poligono.length} puntos · ≈ ${hectareas < 1 ? `${Math.round(hectareas * 10000)} m²` : `${hectareas.toFixed(2)} ha`}`}
          </Text>
          <View style={styles.acciones}>
            {poligono.length ? (
              <>
                <BotonChico texto="↶ Deshacer último punto" color={colores.textoSuave} onPress={() => onPoligono(poligono.slice(0, -1))} />
                <BotonChico texto="🗑️ Borrar todo lo dibujado" color={colores.rojo} onPress={borrarDibujo} />
              </>
            ) : null}
          </View>
        </>
      )}
      <Boton
        texto={modo === 'dibujar' ? '📍 Agregar mi ubicación como punto' : '📍 Usar mi ubicación actual'}
        onPress={usarGps}
        cargando={buscando}
        secundario
      />
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { marginBottom: 10 },
  ayuda: { fontSize: 12, color: colores.textoSuave, marginBottom: 2 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
});
