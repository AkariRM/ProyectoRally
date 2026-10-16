import { useState } from 'react';
import Areas from '@/components/reforestar/Areas';
import Dispersiones from '@/components/reforestar/Dispersiones';
import Jornadas from '@/components/reforestar/Jornadas';
import { Opciones, Pantalla } from '@/components/ui';

const VISTAS = ['areas', 'jornadas', 'dispersiones'] as const;
type Vista = (typeof VISTAS)[number];

const NOMBRES: Record<Vista, string> = {
  areas: '🔥 Áreas a reforestar',
  jornadas: '🤝 Jornadas',
  dispersiones: '🌱 Dispersiones',
};

export default function Reforestar() {
  const [vista, setVista] = useState<Vista>('areas');
  return (
    <Pantalla titulo="Reforestación" subtitulo="Cerros quemados, jornadas comunitarias y seguimiento de las píldoras">
      <Opciones etiqueta="" opciones={VISTAS} nombres={NOMBRES} valor={vista} onChange={setVista} />
      {vista === 'areas' ? <Areas /> : null}
      {vista === 'jornadas' ? <Jornadas /> : null}
      {vista === 'dispersiones' ? <Dispersiones /> : null}
    </Pantalla>
  );
}
