import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWindowDimensions, type ColorValue } from 'react-native';
import { ANCHO_ESCRITORIO, colores } from '@/components/ui';

type Icono = React.ComponentProps<typeof FontAwesome>['name'];

const icono = (name: Icono) => ({ color }: { color: ColorValue }) => <FontAwesome size={22} name={name} color={color as string} />;

export default function TabsLayout() {
  // Celular: pestañas abajo · Escritorio: barra lateral a la izquierda
  const escritorio = useWindowDimensions().width >= ANCHO_ESCRITORIO;
  return (
    <Tabs
      // El botón atrás regresa a la pestaña visitada antes (no siempre a Inicio)
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.verde,
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarPosition: escritorio ? 'left' : 'bottom',
        tabBarLabelPosition: escritorio ? 'beside-icon' : 'below-icon',
        tabBarStyle: escritorio ? { width: 200, paddingTop: 24, backgroundColor: '#fff' } : undefined,
        tabBarItemStyle: escritorio ? { justifyContent: 'flex-start', paddingHorizontal: 16, maxHeight: 52 } : undefined,
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
