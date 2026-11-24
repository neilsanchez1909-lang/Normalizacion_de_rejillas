import { CONFIG, fechaLima, validar } from './config.js';
const $ = id => document.getElementById(id);

let catalog = {}, photos = [], busy = false, photoBusy = false, dialogAction = null;
const ids = ['sed', 'alimentador', 'responsable', 'rejillas', 'retiro', 'candadoElectronico', 'clasificacion', 'fotos'];
const iso = () => fechaLima();

function date() {
  $('fecha').value = iso().split('-').reverse().join('/');
}

function message(text, success = false) {
  $('message').hidden = false;
  $('message').textContent = text;
  $('message').className = success ? 'success' : '';
  $('message').focus();
}

function options(key) {
  const c = CONFIG[key];
  if (!c || !$(key)) return;
  if ($(key + '-label')) {
    $(key + '-label').replaceChildren(document.createTextNode(c.etiqueta + ' '));
    const b = document.createElement('b');
    b.textContent = '*';
    $(key + '-label').append(b);
  }
  $(key).replaceChildren();
  $(key).add(new Option('Selecciona una opción', ''));
  c.opciones.forEach(v => {
    if (typeof v === 'object') {
      $(key).add(new Option(v.descripcion, v.valor));
    } else {
      $(key).add(new Option(v, v));
    }
  });
}

options('retiro');
options('candadoElectronico');
options('clasificacion');
date();
setInterval(date, 30000);

if (CONFIG.logoUrl) {
  const img = new Image();
  img.src = CONFIG.logoUrl;
  img.alt = 'Logo';
  img.style.maxHeight = '52px';
  img.style.objectFit = 'contain';
  $('brand').replaceChildren(img);
}

function errors(values = {}) {
  ids.forEach(id => {
    $(id + '-error').textContent = values[id] || '';
    const el = $(id);
    if (el) el.setAttribute('aria-invalid', String(Boolean(values[id])));
  });
}

function render() {
  $('previews').replaceChildren();
  photos.forEach((p, i) => {
    const f = document.createElement('figure');
    f.className = 'photo';
    const img = new Image();
    img.src = p.url;
    img.alt = 'Evidencia ' + (i + 1);
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = '×';
    b.setAttribute('aria-label', 'Eliminar foto ' + (i + 1));
    b.disabled = busy;
    b.onclick = () => {
      if (busy) return;
      URL.revokeObjectURL(p.url);
      photos.splice(i, 1);
      render();
    };
    const cap = document.createElement('figcaption');
    cap.textContent = p.file.name;
    f.append(img, b, cap);
    $('previews').append(f);
  });
  $('counter').textContent = `${photos.length} / ${CONFIG.fotos.maximo} fotos`;
}

async function add(files) {
  if (busy || photoBusy) return;
  photoBusy = true;
  const rejected = [];
  try {
    for (const file of files) {
      if (photos.length >= CONFIG.fotos.maximo) {
        rejected.push('Máximo 10 fotos.');
        break;
      }
      if (!CONFIG.fotos.tipos.includes(file.type)) {
        rejected.push(`${file.name}: solo JPEG o PNG.`);
        continue;
      }
      if (!file.size || file.size > CONFIG.fotos.maxBytes) {
        rejected.push(`${file.name}: debe pesar entre 1 byte y 10 MB.`);
        continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
      } catch {
        URL.revokeObjectURL(url);
        rejected.push(`${file.name}: imagen dañada o no válida.`);
        continue;
      }
      photos.push({ file, url, nombre: file.name });
    }
    render();
    $('photo-message').textContent = rejected.join(' ');
  } finally {
    photoBusy = false;
    $('files').value = '';
    $('camera').value = '';
  }
}

$('upload').onclick = () => $('files').click();
$('take').onclick = () => $('camera').click();
['files', 'camera'].forEach(id => $(id).onchange = e => add([...e.target.files]));

$('drop').ondragover = e => {
  e.preventDefault();
  if (!busy) $('drop').classList.add('drag');
};
$('drop').ondragleave = () => $('drop').classList.remove('drag');
$('drop').ondrop = e => {
  e.preventDefault();
  $('drop').classList.remove('drag');
  add([...e.dataTransfer.files]);
};

function reset() {
  photos.forEach(p => URL.revokeObjectURL(p.url));
  photos = [];
  $('form').reset();
  date();
  errors();
  $('photo-message').textContent = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDialog(action, p) {
  dialogAction = action;
  $('access-field').hidden = true;
  $('summary').replaceChildren();
  $('dialog-title').textContent = action === 'clear' ? '¿Deseas limpiar el formulario?' : '¿Estás seguro de registrar esta normalización de rejilla?';
  $('dialog-description').textContent = action === 'clear' ? 'Se eliminarán los datos y fotos ingresados.' : 'Confirma que la información y las evidencias son correctas.';
  $('cancel').textContent = action === 'clear' ? 'Cancelar' : 'No, volver';
  $('yes').textContent = action === 'clear' ? 'Sí, limpiar' : 'Sí, registrar';
  
  if (p) {
    const clasifDesc = (CONFIG.clasificacion.opciones.find(o => o.valor === p.clasificacion) || {}).descripcion || p.clasificacion;
    Object.entries({
      'SED': p.sed,
      'Alimentador': p.alimentador,
      'Fecha': $('fecha').value,
      'Responsable': p.responsable,
      'Rejillas': p.rejillasIntervenidas.join(', '),
      [CONFIG.retiro.etiqueta]: p.retiro,
      [CONFIG.candadoElectronico.etiqueta]: p.candadoElectronico,
      [CONFIG.clasificacion.etiqueta]: clasifDesc,
      'Fotos': photos.length
    }).forEach(([k, v]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v;
      $('summary').append(dt, dd);
    });
  }
  $('confirm').showModal();
  $('cancel').focus();
}

$('cancel').onclick = () => $('confirm').close();
$('clear').onclick = () => {
  if (busy) return;
  if ($('sed').value || $('responsable').value || $('retiro').value || $('clasificacion').value || photos.length || document.querySelector('[name=rejilla]:checked')) {
    showDialog('clear');
  } else {
    reset();
  }
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error(`Error al leer archivo ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function data() {
  return {
    sed: $('sed').value.trim().toUpperCase(),
    alimentador: $('alimentador').value,
    fechaIntervencion: iso(),
    responsable: $('responsable').value.trim(),
    rejillasIntervenidas: [...document.querySelectorAll('[name=rejilla]:checked')].map(x => x.value),
    retiro: $('retiro').value,
    candadoElectronico: $('candadoElectronico').value,
    clasificacion: $('clasificacion').value,
    observacion: $('observacion') ? $('observacion').value.trim() : '',
    fotos: photos.map(x => x.file)
  };
}

// Cargar catálogo de subestaciones
try {
  const response = await fetch('./catalog.json');
  if (!response.ok) throw Error();
  catalog = await response.json();
} catch {
  message('No se pudo cargar el catálogo de SED. Recarga la página.');
}

// Autocompletado y menú desplegable para SED
const sedInput = $('sed');
const sedDropdown = $('sed-dropdown');

function filterSed(query = '') {
  const q = query.trim().toUpperCase();
  const keys = Object.keys(catalog);
  const matches = q ? keys.filter(k => k.includes(q)) : keys;
  sedDropdown.replaceChildren();

  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'combobox-empty';
    empty.textContent = 'No se encontraron resultados';
    sedDropdown.append(empty);
  } else {
    // Mostrar hasta 60 resultados para fluidez
    matches.slice(0, 60).forEach(key => {
      const item = document.createElement('div');
      item.className = 'combobox-item';
      item.textContent = key;
      item.onmousedown = (e) => {
        e.preventDefault();
        selectSed(key);
      };
      sedDropdown.append(item);
    });
  }
  sedDropdown.hidden = false;
}

function selectSed(sed) {
  sedInput.value = sed;
  $('alimentador').value = catalog[sed] || '';
  $('sed-error').textContent = sed === '01214S' ? 'Esta SED tiene dos alimentadores: VM30 y VM35.' : '';
  sedDropdown.hidden = true;
}

if (sedInput && sedDropdown) {
  sedInput.addEventListener('focus', () => filterSed(sedInput.value));
  sedInput.addEventListener('click', () => filterSed(sedInput.value));
  sedInput.addEventListener('input', () => {
    const val = sedInput.value.trim().toUpperCase();
    $('alimentador').value = catalog[val] || '';
    $('sed-error').textContent = val === '01214S' ? 'Esta SED tiene dos alimentadores: VM30 y VM35.' : '';
    filterSed(val);
  });
  sedInput.addEventListener('blur', () => {
    setTimeout(() => { sedDropdown.hidden = true; }, 250);
  });
}

$('form').onsubmit = e => {
  if (busy) return;
  if (photoBusy) {
    message('Espera a que terminen de cargarse las fotos.');
    return;
  }
  date();
  const p = data();
  const v = validar(p, catalog);
  errors(v);
  if (Object.keys(v).length) {
    const id = Object.keys(v)[0];
    (id === 'rejillas' ? document.querySelector('[name=rejilla]') : id === 'fotos' ? $('upload') : $(id)).focus();
    return;
  }
  showDialog('register', p);
};

$('yes').onclick = async () => {
  if (busy) return;
  $('confirm').close();
  if (dialogAction === 'clear') {
    reset();
    $('message').hidden = true;
    return;
  }

  if (!CONFIG.powerAutomateUrl) {
    message('La URL de Power Automate aún no está configurada en config.js');
    return;
  }

  busy = true;
  $('fields').disabled = true;
  $('register').textContent = 'Procesando evidencias…';

  try {
    const rawData = data();
    
    // Convertir fotos a Base64 para Power Automate
    const fotosPayload = [];
    for (let i = 0; i < photos.length; i++) {
      $('register').textContent = `Preparando foto ${i + 1} de ${photos.length}…`;
      const base64 = await fileToBase64(photos[i].file);
      fotosPayload.push({
        nombre: photos[i].file.name,
        contenidoBytes: base64
      });
    }

    const payload = {
      sed: rawData.sed,
      alimentador: rawData.alimentador,
      fechaIntervencion: rawData.fechaIntervencion,
      responsable: rawData.responsable,
      rejillasIntervenidas: rawData.rejillasIntervenidas,
      retiro: rawData.retiro,
      candadoElectronico: rawData.candadoElectronico,
      clasificacion: rawData.clasificacion,
      observacion: rawData.observacion,
      fotos: fotosPayload
    };

    $('register').textContent = 'Guardando en SharePoint…';
    
    const response = await fetch(CONFIG.powerAutomateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió con código ${response.status}`);
    }

    reset();
    message('¡Intervención registrada y guardada con éxito en SharePoint!', true);
  } catch (err) {
    message(`Error al registrar: ${err.message}. Verifica tu conexión o el flujo.`);
  } finally {
    busy = false;
    $('fields').disabled = false;
    $('register').textContent = 'Registrar';
  }
};

window.addEventListener('beforeunload', e => {
  if (photos.length || $('sed').value || $('responsable').value || busy) {
    e.preventDefault();
    e.returnValue = '';
  }
});


