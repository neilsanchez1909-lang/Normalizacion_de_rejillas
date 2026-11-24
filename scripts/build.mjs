import fs from 'node:fs/promises';
const config=(await fs.readFile('docs/config.js','utf8')).replaceAll('export ','');
const handler=(await fs.readFile('worker/handler.js','utf8')).replace(/^import .*;\r?\n/,'').replace('export function','function');
const adapter=(await fs.readFile('worker/api.js','utf8')).replace('export function','function');
await fs.mkdir('dist/server',{recursive:true});await fs.writeFile('dist/server/index.js',config+'\n'+handler+'\n'+adapter+'\nconst catalog='+await fs.readFile('docs/catalog.json','utf8')+';\nexport default {fetch:createApi(createHandler({},catalog))};\n');
console.log('Intermediario generado: dist/server/index.js. GitHub Pages sirve docs/ directamente, sin compilación.');
