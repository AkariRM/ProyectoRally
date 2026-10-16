import { useState } from 'react';
import Biomasa from '@/components/acopio/Biomasa';
import Puntos from '@/components/acopio/Puntos';
import Solicitudes from '@/components/acopio/Solicitudes';
import Zonas from '@/components/acopio/Zonas';
import { Opciones, Pantalla } from '@/components/ui';

const VISTAS = ['zonas', 'solicitudes', 'puntos', 'biomasa'] as const;
type Vista = (typeof VISTAS)[number];

const NOMBRES: Record<Vista, string> = {
  zonas: '✂️ Zonas de poda',
  solicitudes: '🏠 Solicitudes',
  puntos: '📍 Puntos',
  biomasa: '🌿 Biomasa',
};

export default function Acopio() {
  const [vista, setVista] = useState<Vista>('zonas');
  return (
    <Pantalla titulo="Acopio de biomasa" subtitulo="Dónde y cuándo se poda, quién recolecta y cuánto ficus tenemos">
      <Opciones etiqueta="" opciones={VISTAS} nombres={NOMBRES} valor={vista} onChange={setVista} />
      {vista === 'zonas' ? <Zonas /> : null}
      {vista === 'solicitudes' ? <Solicitudes /> : null}
      {vista === 'puntos' ? <Puntos /> : null}
      {vista === 'biomasa' ? <Biomasa /> : null}
    </Pantalla>
  );
}
