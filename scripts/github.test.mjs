import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {createApi} from '../worker/api.js';
const origin='https://tecnico.github.io';const env={ALLOWED_ORIGINS:origin,API_ACCESS_KEY:'test-only',POWER_AUTOMATE_URL:'https://example.test'};
const req=(pathname,method='GET',token=null,o=origin)=>new Request('https://api.example.test'+pathname,{method,headers:{Origin:o,...(token?{Authorization:'Bearer '+token}:{})},...(method==='POST'?{body:'{}'}:{})});
test('GitHub Pages usa rutas relativas en repositorios y catálogo independiente',async()=>{
 const html=await fs.readFile('docs/index.html','utf8'),app=await fs.readFile('docs/app.js','utf8');
 assert.match(html,/href="\.\/style.css"/);assert.match(html,/src="\.\/app.js"/);assert.match(app,/from '\.\/config.js'/);assert.match(app,/fetch\('\.\/catalog.json'\)/);
 const base='https://tecnico.github.io/mi-repo/';for(const f of ['style.css','app.js','config.js','catalog.json'])assert.equal(new URL('./'+f,base).pathname,'/mi-repo/'+f);
 assert.doesNotMatch(app,/fetch\('\/api\//);
});
test('Preflight CORS solo permite orígenes configurados',async()=>{
 const api=createApi(()=>Response.json({ok:true}));const r=await api(req('/api/registro','OPTIONS'),env);assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
 assert.equal((await api(req('/api/registro','OPTIONS',null,'https://otro.test'),env)).status,403);
});
test('API exige clave y no la propaga a Power Automate',async()=>{
 let calls=0;const api=createApi(r=>{calls++;assert.equal(r.headers.get('Authorization'),null);assert.equal(r.headers.get('Origin'),null);return Response.json({ok:true});});
 assert.equal((await api(req('/api/registro','POST'),env)).status,401);
 assert.equal((await api(req('/api/registro','POST','incorrecta'),env)).status,401);
 const response=await api(req('/api/registro','POST','test-only'),env);assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(calls,1);
});
test('Conexión pendiente cuando falta un secreto',async()=>{
 const api=createApi(()=>Response.json({ok:true}));assert.equal((await (await api(req('/api/status'),{...env,API_ACCESS_KEY:''})).json()).configured,false);
 assert.equal((await api(req('/api/registro','POST','test-only'),{...env,API_ACCESS_KEY:''})).status,503);
});
