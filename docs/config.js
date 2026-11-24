export const CONFIG = {
  // Pega aquí directamente la URL que te genera Power Automate (Cuando se recibe una solicitud HTTP)
  powerAutomateUrl: 'https://default1c0051dd45964b1a9849d060735057.69.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/13/workflows/3ee4e252a1f045139848bb62d020f170/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-uAbXesA-QJFulrqqpLG1C3EOdbCI77L2RcKSZ8kXAc',

  // Opciones del formulario
  retiro: { etiqueta: '¿La SED tiene retiro?', opciones: ['Sí', 'No'] },
  clasificacion: { etiqueta: 'Clasificación de SED', opciones: ['A', 'B', 'C'] },
  fotos: { minimo: 1, maximo: 10, maxBytes: 10 * 1024 * 1024, tipos: ['image/jpeg', 'image/png'] },
  zonaHoraria: 'America/Lima',
  logoUrl: './logo_luz_del_sur.png'
};

export function fechaLima(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: CONFIG.zonaHoraria, year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(now).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

export function validar(p, catalog) {
  const errors = {};
  if (!Object.hasOwn(catalog, p.sed)) errors.sed = 'Selecciona una SED válida.';
  if (!catalog[p.sed] || p.alimentador !== catalog[p.sed]) errors.alimentador = 'No existe un alimentador válido para esta SED.';
  if (!p.responsable?.trim()) errors.responsable = 'Ingresa el nombre y apellido del responsable.';
  if (!Array.isArray(p.rejillasIntervenidas) || !p.rejillasIntervenidas.length || p.rejillasIntervenidas.some(v => !['Superior','Inferior'].includes(v))) errors.rejillas = 'Selecciona al menos una rejilla.';
  if (!CONFIG.retiro.opciones.includes(p.retiro)) errors.retiro = 'Selecciona una opción.';
  if (!CONFIG.clasificacion.opciones.includes(p.clasificacion)) errors.clasificacion = 'Selecciona una opción.';
  if (!Array.isArray(p.fotos) || p.fotos.length < CONFIG.fotos.minimo || p.fotos.length > CONFIG.fotos.maximo) errors.fotos = 'Adjunta entre 1 y 10 fotos.';
  return errors;
}
