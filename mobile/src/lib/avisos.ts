import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { api } from './api';
import type { Jornada, JornadaReforestacion } from './types';

// Avisos LOCALES (programados en el propio celular, sin servidor de push):
// el día anterior a las 19:00 y 1 hora antes de cada jornada de poda
// de las zonas que el usuario sigue.

const KEY_ZONAS = 'zonasConAviso';
const CANAL = 'jornadas-poda';
const MAX_AVISOS = 60; // iOS permite máximo 64 programados

// En navegador no hay notificaciones programadas
export const avisosDisponibles = Platform.OS !== 'web';

export function configurarAvisos() {
  if (!avisosDisponibles) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Jornadas de poda',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

export async function pedirPermiso(): Promise<boolean> {
  if (!avisosDisponibles) return false;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const resp = await Notifications.requestPermissionsAsync();
  return resp.granted;
}

export async function zonasConAviso(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY_ZONAS)) || '[]');
  } catch {
    return [];
  }
}

export async function guardarZonasConAviso(ids: string[]) {
  await AsyncStorage.setItem(KEY_ZONAS, JSON.stringify(ids)).catch(() => {});
}

// "2026-10-20" + "08:00" → Date en hora local
export function fechaHora(fecha: string, hora = '08:00'): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

// Vuelve a programar todos los avisos: jornadas de poda de las zonas seguidas y
// jornadas de reforestación en las que el usuario está inscrito.
export async function programarAvisos(
  jornadas: Jornada[], zonas: string[], reforestacion: JornadaReforestacion[] = [], usuarioId?: string,
): Promise<number> {
  if (!avisosDisponibles) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const inscritas = usuarioId ? reforestacion.filter(j => j.estado === 'programada' && j.inscritos.includes(usuarioId)) : [];
  if (!zonas.length && !inscritas.length) return 0;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return 0;

  const ahora = Date.now();
  const avisos: { fecha: Date; titulo: string; cuerpo: string }[] = [];

  for (const j of inscritas) {
    const inicio = fechaHora(j.fecha, j.horaInicio ?? '07:00');
    const lugar = j.puntoReunion ? ` Reunión: ${j.puntoReunion}.` : '';
    const vispera = new Date(inicio);
    vispera.setDate(vispera.getDate() - 1);
    vispera.setHours(19, 0, 0, 0);
    avisos.push({ fecha: vispera, titulo: '🌱 Mañana es la jornada de reforestación', cuerpo: `${j.titulo}, ${j.horaInicio ?? ''}.${lugar}` });
    avisos.push({ fecha: new Date(inicio.getTime() - 60 * 60 * 1000), titulo: '🌱 La reforestación empieza en 1 hora', cuerpo: `${j.titulo}.${lugar} Lleva agua y gorra.` });
  }

  for (const j of jornadas) {
    if (!zonas.includes(j.zonaId) || j.estado !== 'programada') continue;
    const inicio = fechaHora(j.fecha, j.horaInicio);
    const nombre = j.zona?.nombre ?? 'una zona';
    const horario = `${j.horaInicio ?? ''}${j.horaFin ? `–${j.horaFin}` : ''}`;

    const vispera = new Date(inicio);
    vispera.setDate(vispera.getDate() - 1);
    vispera.setHours(19, 0, 0, 0);
    avisos.push({
      fecha: vispera,
      titulo: '✂️ Mañana hay poda de ficus',
      cuerpo: `${nombre}, ${horario}. ¡Apúntate para recolectar la biomasa!`,
    });
    avisos.push({
      fecha: new Date(inicio.getTime() - 60 * 60 * 1000),
      titulo: '✂️ La poda empieza en 1 hora',
      cuerpo: `${nombre}, ${horario}. Lleva costales y báscula.`,
    });
  }

  const futuros = avisos.filter(a => a.fecha.getTime() > ahora).sort((a, b) => a.fecha.getTime() - b.fecha.getTime()).slice(0, MAX_AVISOS);

  for (const a of futuros) {
    await Notifications.scheduleNotificationAsync({
      content: { title: a.titulo, body: a.cuerpo },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.fecha, channelId: CANAL },
    });
  }
  return futuros.length;
}

// Consulta las jornadas y reprograma los avisos (se llama al cambiar zonas seguidas o inscripciones)
export async function actualizarAvisos(usuarioId?: string): Promise<number> {
  if (!avisosDisponibles) return 0;
  const [jornadas, reforestacion, zonas] = await Promise.all([
    api.jornadasProximas(), api.jornadasReforestacionProximas(), zonasConAviso(),
  ]);
  return programarAvisos(jornadas, zonas, reforestacion, usuarioId);
}
