// Adaptador del intermediario para GitHub Pages. Solo atiende la API.
// Los secretos se configuran en Cloudflare; nunca en docs/ ni en GitHub.
export function createApi(handler){
  return async (request,env={})=>{
    const origin=request.headers.get('Origin');
    const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
    const url=new URL(request.url);
    if(!['/api/status','/api/registro'].includes(url.pathname))return new Response('No encontrado',{status:404});
    if(!origin||!allowed.includes(origin))return Response.json({error:'Origen no autorizado.'},{status:403});
    const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Vary':'Origin','Cache-Control':'no-store'};
    const reply=(data,status)=>Response.json(data,{status,headers:cors});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(url.pathname==='/api/status'){
      if(request.method!=='GET')return reply({error:'Método no permitido.'},405);
      return reply({configured:Boolean(env.POWER_AUTOMATE_URL&&env.API_ACCESS_KEY&&allowed.length)},200);
    }
    if(request.method!=='POST')return reply({error:'Método no permitido.'},405);
    if(!env.API_ACCESS_KEY)return reply({error:'La clave del servicio aún no está configurada.'},503);
    const supplied=request.headers.get('Authorization')||'';
    // Comparar resúmenes de longitud fija, sin devolver ni registrar la clave.
    const digest=async v=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
    const a=await digest(supplied),b=await digest('Bearer '+env.API_ACCESS_KEY);
    let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];
    if(difference)return reply({error:'Clave de conexión incorrecta.'},401);
    const headers=new Headers(request.headers);headers.delete('Origin');headers.delete('Authorization');
    const response=await handler(new Request(request,{headers}),env);
    const outputHeaders=new Headers(response.headers);for(const [k,v] of Object.entries(cors))outputHeaders.set(k,v);
    return new Response(response.body,{status:response.status,headers:outputHeaders});
  };
}
