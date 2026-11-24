import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
const base=path.resolve('docs');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  // También simula la ruta de un repositorio de GitHub Pages.
  if(pathname.startsWith('/normalizacion-rejilla/'))pathname=pathname.slice('/normalizacion-rejilla'.length);
  if(pathname==='/normalizacion-rejilla'){res.writeHead(302,{Location:'/normalizacion-rejilla/'});res.end();return;}
  const target=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));
  if(!target.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  const body=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
}catch{res.writeHead(404);res.end('No encontrado');}});
server.listen(4174,'127.0.0.1',()=>console.log('Vista previa: http://localhost:4174/normalizacion-rejilla/'));
