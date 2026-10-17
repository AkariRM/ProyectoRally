import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { alerta } from '@/lib/alerta';
import { useUsuario } from '@/lib/usuario';
import { Boton, Campo, colores } from '@/components/ui';

// Pantalla de acceso: entrar o crear cuenta con correo y clave.
// Al iniciar sesión se va al dashboard (avance del proyecto).
export default function Login() {
  const { iniciar } = useUsuario();
  const [modo, setModo] = useState<'entrar' | 'registro'>('entrar');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async () => {
    if (!email.trim() || !clave) return alerta('Faltan datos', 'Escribe tu correo y tu clave.');
    if (modo === 'registro' && clave !== confirmacion) return alerta('Revisa la clave', 'Las claves no coinciden.');
    setCargando(true);
    try {
      const sesion = modo === 'registro' ? await api.registrar(email, clave) : await api.login(email, clave);
      await iniciar(sesion);
      router.replace('/');
    } catch (e) {
      alerta(modo === 'registro' ? 'No se pudo crear la cuenta' : 'No se pudo entrar', (e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  const cambiarModo = () => {
    setModo(modo === 'entrar' ? 'registro' : 'entrar');
    setConfirmacion('');
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.encabezado}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Bio Red"
            />
            <Text style={styles.subtitulo}>Píldoras bióticas con poda urbana</Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaTitulo}>{modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
            <Campo
              etiqueta="Correo"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Campo
              etiqueta="Clave"
              value={clave}
              onChangeText={setClave}
              placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : 'Tu clave'}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={modo === 'entrar' ? enviar : undefined}
            />
            {modo === 'registro' ? (
              <Campo
                etiqueta="Confirmar clave"
                value={confirmacion}
                onChangeText={setConfirmacion}
                secureTextEntry
                autoCapitalize="none"
                onSubmitEditing={enviar}
              />
            ) : null}
            <Boton texto={modo === 'entrar' ? 'Entrar' : 'Crear cuenta'} onPress={enviar} cargando={cargando} />

            <TouchableOpacity onPress={cambiarModo} style={styles.cambiar}>
              <Text style={styles.cambiarTexto}>
                {modo === 'entrar' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <Text style={styles.cambiarLink}>{modo === 'entrar' ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  encabezado: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 180, height: 265 },
  subtitulo: { fontSize: 14, color: colores.textoSuave, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  tarjeta: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  tarjetaTitulo: { fontSize: 20, fontWeight: '700', color: colores.texto, marginBottom: 16 },
  cambiar: { marginTop: 12, alignItems: 'center' },
  cambiarTexto: { fontSize: 14, color: colores.textoSuave },
  cambiarLink: { color: colores.verde, fontWeight: '700' },
});
