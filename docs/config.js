export const CONFIG = {
  // CONEXIÓN: URL pública del intermediario, nunca la URL firmada de Power Automate.
  // Ejemplo: https://normalizacion-api.tu-subdominio.workers.dev
  apiBaseUrl: '',
  // EDITAR AQUÍ: OPCIONES DE RETIRO
  retiro: { etiqueta: 'Retiro', opciones: ['Sí', 'No'] },
  // EDITAR AQUÍ: NOMBRE Y OPCIONES DE CLASIFICACIÓN
  clasificacion: { etiqueta: 'Clasificación', opciones: ['A', 'B', 'C'] },
  // EDITAR AQUÍ: LÍMITES DE FOTOS
  fotos: { minimo: 1, maximo: 10, maxBytes: 10 * 1024 * 1024, tipos: ['image/jpeg', 'image/png'] },
  zonaHoraria: 'America/Lima',
  // Guardar la imagen en docs/assets/logo.png y usar './assets/logo.png'.
  logoUrl: ''
};
export function fechaLima(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: CONFIG.zonaHoraria, year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(now).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function validar(p, catalog) {
  const errors = {};
  if (!Object.hasOwn(catalog,p.sed)) errors.sed = 'Selecciona una SED válida.';
  if (!catalog[p.sed] || p.alimentador !== catalog[p.sed]) errors.alimentador='No existe un alimentador válido para esta SED.';
  if (!p.responsable?.trim()) errors.responsable='Ingresa el nombre y apellido del responsable.';
  if (!Array.isArray(p.rejillasIntervenidas) || !p.rejillasIntervenidas.length || p.rejillasIntervenidas.some(v=>!['Superior','Inferior'].includes(v))) errors.rejillas='Selecciona al menos una rejilla.';
  if (!CONFIG.retiro.opciones.includes(p.retiro)) errors.retiro='Selecciona una opción.';
  if (!CONFIG.clasificacion.opciones.includes(p.clasificacion)) errors.clasificacion='Selecciona una opción.';
  if (!Array.isArray(p.evidencias) || p.evidencias.length<CONFIG.fotos.minimo || p.evidencias.length>CONFIG.fotos.maximo) errors.fotos='Adjunta entre 1 y 10 fotos.';
  else if(p.evidencias.some(f=>!CONFIG.fotos.tipos.includes(f.tipoContenido)||!Number.isInteger(f.tamano)||f.tamano<1||f.tamano>CONFIG.fotos.maxBytes)) errors.fotos='Cada foto debe ser JPEG o PNG y pesar como máximo 10 MB.';
  return errors;
}
