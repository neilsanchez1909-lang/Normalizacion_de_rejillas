import { CONFIG, validar, fechaLima } from '../docs/config.js';
// EDITAR AQUÍ: CATÁLOGO SED Y ALIMENTADOR — docs/catalog.json
export function createHandler(assets,catalog){
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
 return async function fetchHandler(request,env={}){
  const url=new URL(request.url);
  if(url.pathname==='/api/status')return json({configured:Boolean(env.POWER_AUTOMATE_URL)});
  if(url.pathname==='/api/registro'){
   if(request.method!=='POST')return json({error:'Método no permitido.'},405);
   if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'Origen no permitido.'},403);
   // CONFIGURAR AQUÍ: CONEXIÓN CON POWER AUTOMATE — secreto POWER_AUTOMATE_URL
   if(!env.POWER_AUTOMATE_URL)return json({error:'Conexión con Power Automate pendiente de configurar.'},503);
   if(Number(request.headers.get('content-length'))>15*1024*1024)return json({error:'Solicitud demasiado grande.'},413);
   try{
    const text=await request.text();if(text.length>15*1024*1024)return json({error:'Solicitud demasiado grande.'},413);
    const p=JSON.parse(text);if(!/^[0-9a-f-]{36}$/i.test(p.idSolicitud||''))return json({error:'Identificador inválido.'},400);
    if(p.accion==='iniciar'){
     const errors=validar(p,catalog);if(Object.keys(errors).length)return json({error:Object.values(errors).join(' ')},400);
     if(!/^\d{4}-\d{2}-\d{2}$/.test(p.fechaIntervencion))return json({error:'Fecha no válida.'},400);
     // En un nuevo registro el flujo valida la fecha con America/Lima. Los reintentos conservan la fecha original.
    }else if(p.accion==='foto'){
     const f=p.evidencia;if(!Number.isInteger(p.indice)||p.indice<0||p.indice>=CONFIG.fotos.maximo||!f||!CONFIG.fotos.tipos.includes(f.tipoContenido)||!Number.isInteger(f.tamano)||f.tamano<1||f.tamano>CONFIG.fotos.maxBytes||!/^[a-zA-Z0-9-]+\.(jpg|png)$/.test(f.nombre)||typeof f.contenidoBase64!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(f.contenidoBase64))return json({error:'Evidencia no válida.'},400);
     const raw=atob(f.contenidoBase64);if(raw.length!==f.tamano)return json({error:'Tamaño de imagen incorrecto.'},400);
     if(f.tipoContenido==='image/jpeg'&&!(raw.charCodeAt(0)===255&&raw.charCodeAt(1)===216&&raw.charCodeAt(2)===255)||f.tipoContenido==='image/png'&&!raw.startsWith('\x89PNG\r\n\x1a\n'))return json({error:'El contenido no corresponde a una imagen permitida.'},400);
    }else if(p.accion==='finalizar'){
     if(!Number.isInteger(p.totalEvidencias)||p.totalEvidencias<1||p.totalEvidencias>10)return json({error:'Cantidad de fotos inválida.'},400);
    }else return json({error:'Acción no válida.'},400);
    const target=new URL(env.POWER_AUTOMATE_URL);if(target.protocol!=='https:')return json({error:'La conexión debe utilizar HTTPS.'},500);
    const headers={'Content-Type':'application/json'};
    // Para OAuth configurar un token vigente en el servidor; no se renueva automáticamente.
    if(env.POWER_AUTOMATE_BEARER_TOKEN)headers.Authorization='Bearer '+env.POWER_AUTOMATE_BEARER_TOKEN;
    const response=await fetch(target,{method:'POST',headers,body:JSON.stringify(p),redirect:'error',signal:AbortSignal.timeout(110000)});
    if(!response.ok)return json({error:'Power Automate no confirmó la operación. Reintenta con el mismo registro.'},502);
    const result=await response.json();if(result.ok!==true||result.idSolicitud!==p.idSolicitud)return json({error:'Respuesta de confirmación inválida.'},502);
    if(p.accion==='finalizar'&&(!result.idRegistro||result.evidenciasGuardadas!==p.totalEvidencias))return json({error:'Falta confirmar el registro o sus fotos.'},502);
    return json({ok:true,idSolicitud:result.idSolicitud,idRegistro:result.idRegistro,evidenciasGuardadas:result.evidenciasGuardadas});
   }catch{return json({error:'No se pudo confirmar el envío. Conserva el formulario y reintenta.'},502);}
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Método no permitido',{status:405});
  const asset=assets[url.pathname==='/'?'/index.html':url.pathname];if(!asset)return new Response('No encontrado',{status:404});
  return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'"}});
 };
}
