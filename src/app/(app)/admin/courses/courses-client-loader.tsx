
'use client';

import { CoursesDataTable } from './courses-data-table';

/**
 * Este componente ahora es mucho más simple. Se renderiza directamente 
 * porque se confía en que el componente superior (ClientGate) ya ha 
 * esperado a que el entorno del cliente esté listo.
 */
export default function CoursesClientLoader() {
  return <CoursesDataTable />;
}
