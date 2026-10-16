import { useState } from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, type ColorValue } from 'react-native';
import { ANCHO_ESCRITORIO, colores } from '@/components/ui';

type Icono = React.ComponentProps<typeof FontAwesome>['name'];
type PropsBarra = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const icono = (name: Icono) => ({ color }: { color: ColorValue }) => <FontAwesome size={20} name={name} color={color as string} />;

// Barra lateral para escritorio: angosta, y se colapsa a solo íconos
function BarraLateral({ state, descriptors, emitter, navigateToTab }: PropsBarra) {
  const [colapsada, setColapsada] = useState(false);
  return (
    <View style={[styles.barra, { width: colapsada ? 56 : 150 }]}>
      <TouchableOpacity
        style={styles.alternar}
        onPress={() => setColapsada(!colapsada)}
        accessibilityRole="button"
        accessibilityLabel={colapsada ? 'Expandir menú' : 'Colapsar menú'}
      >
        <FontAwesome name={colapsada ? 'angle-double-right' : 'angle-double-left'} size={18} color={colores.textoSuave} />
      </TouchableOpacity>
      {state.routes.map((route, i) => {
        const { options } = descriptors[route.key];
        const activa = state.index === i;
        const color = activa ? colores.verde : '#9E9E9E';
        const titulo = options.title ?? route.name;
        const abrir = () => {
          const evento = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!activa && !evento.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <TouchableOpacity
            key={route.key}
            onPress={abrir}
            style={[styles.item, activa && styles.itemActivo, colapsada && styles.itemColapsado]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={titulo}
          >
            <View style={styles.itemIcono}>{options.tabBarIcon?.({ focused: activa, color, size: 20 })}</View>
            {!colapsada ? <Text style={[styles.itemTexto, { color }]} numberOfLines={1}>{titulo}</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  // Celular: pestañas abajo · Escritorio: barra lateral a la izquierda
  const escritorio = useWindowDimensions().width >= ANCHO_ESCRITORIO;
  return (
    <Tabs
      // El botón atrás regresa a la pestaña visitada antes (no siempre a Inicio)
      backBehavior="history"
      tabBar={escritorio ? props => <BarraLateral {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.verde,
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarPosition: escritorio ? 'left' : 'bottom',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icono('home') }} />
      <Tabs.Screen name="acopio" options={{ title: 'Acopio', tabBarIcon: icono('map-marker') }} />
      <Tabs.Screen name="reforestar" options={{ title: 'Reforestar', tabBarIcon: icono('tree') }} />
      <Tabs.Screen name="laboratorio" options={{ title: 'Laboratorio', tabBarIcon: icono('flask') }} />
      <Tabs.Screen name="impacto" options={{ title: 'Impacto', tabBarIcon: icono('bar-chart') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barra: { backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#eee', paddingTop: 10, paddingHorizontal: 8, gap: 4 },
  alternar: { alignSelf: 'flex-end', padding: 8, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10 },
  itemActivo: { backgroundColor: colores.verdeClaro },
  itemColapsado: { justifyContent: 'center', paddingHorizontal: 0 },
  itemIcono: { width: 22, alignItems: 'center' },
  itemTexto: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
