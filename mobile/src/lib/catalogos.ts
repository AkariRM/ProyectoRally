import { api } from './api';
import { useData } from './useData';
import type { ItemCatalogo, Rol } from './types';

// Tipos de material, aditivos, tratamientos y pruebas vienen del servidor (editables por admin)
export function useCatalogos() {
  return useData(api.catalogos);
}

// { id: nombre } para los selectores
export const nombresDe = (items: ItemCatalogo[] = []) => Object.fromEntries(items.map(i => [i.id, i.nombre]));

export const ROLES: Rol[] = ['admin', 'municipio', 'brigadista', 'voluntario'];

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: '⭐ Administrador',
  municipio: '🏛️ Municipio / Limpia',
  brigadista: '🧑‍🚒 Brigadista',
  voluntario: '🙋 Voluntario',
};

export const DESCRIPCION_ROL: Record<Rol, string> = {
  admin: 'Puede todo: puntos, zonas, áreas, catálogos, usuarios',
  municipio: 'Gestiona zonas y jornadas de poda; exporta datos',
  brigadista: 'Gestiona áreas y jornadas de reforestación; exporta datos',
  voluntario: 'Registra entregas, solicitudes, dispersiones y se inscribe a jornadas',
};
