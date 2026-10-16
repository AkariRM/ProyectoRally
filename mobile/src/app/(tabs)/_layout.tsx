import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ColorValue } from 'react-native';
import { colores } from '@/components/ui';

type Icono = React.ComponentProps<typeof FontAwesome>['name'];

const icono = (name: Icono) => ({ color }: { color: ColorValue }) => <FontAwesome size={22} name={name} color={color as string} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.verde,
        tabBarInactiveTintColor: '#9E9E9E',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icono('home') }} />
      <Tabs.Screen name="acopio" options={{ title: 'Acopio', tabBarIcon: icono('map-marker') }} />
      <Tabs.Screen name="dispersar" options={{ title: 'Dispersar', tabBarIcon: icono('leaf') }} />
      <Tabs.Screen name="laboratorio" options={{ title: 'Laboratorio', tabBarIcon: icono('flask') }} />
      <Tabs.Screen name="impacto" options={{ title: 'Impacto', tabBarIcon: icono('bar-chart') }} />
    </Tabs>
  );
}
