import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/devtools.js',import.meta.url),'utf8');
function boot(chrome){const status={textContent:''};const errors=[];vm.runInNewContext(source,{chrome,document:{getElementById:()=>status},window:{addEventListener(){}},console:{info(){},error(...args){errors.push(args);}}});return {status,errors};}
test('startup registers a panel using the legacy-compatible callback',()=>{
 let shown;
 const result=boot({runtime:{},devtools:{panels:{create(title,icon,page,callback){assert.equal(title,'TypeScript');assert.equal(page,'panel.html');callback({onShown:{addListener(fn){shown=fn;}}});}}}});
 assert.match(result.status.textContent,/registered/);shown();assert.match(result.status.textContent,/visible/);
});
test('startup exposes synchronous registration failures',()=>{
 const result=boot({devtools:{panels:{create(){throw Error('registration failed');}}}});
 assert.match(result.status.textContent,/registration failed/);assert.equal(result.errors.length,1);
});
test('startup handles missing DevTools context',()=>{
 assert.match(boot(undefined).status.textContent,/API is unavailable/);
});
