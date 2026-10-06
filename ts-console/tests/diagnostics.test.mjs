import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('diagnostics track startup and remove closed sessions without storage',()=>{
 let connect,query,update,disconnect;
 const chrome={runtime:{onConnect:{addListener(f){connect=f;}},onMessage:{addListener(f){query=f;}}}};
 vm.runInNewContext(readFileSync(new URL('../src/diagnostics-worker.js',import.meta.url),'utf8'),{chrome});
 const port={name:'ts-console-diagnostics',onMessage:{addListener(f){update=f;}},onDisconnect:{addListener(f){disconnect=f;}}};
 connect(port);update({status:'TypeScript panel registered.'});
 query({type:'ts-console-status'},null,r=>assert.equal(r.sessions[0],'TypeScript panel registered.'));
 disconnect();query({type:'ts-console-status'},null,r=>assert.equal(r.sessions.length,0));
});
