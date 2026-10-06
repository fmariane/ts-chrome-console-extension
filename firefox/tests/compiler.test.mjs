import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {compile, executionSource} from '../src/compiler.js';
async function execute(source) {
  const context = vm.createContext({window:{}, console, Element:class Element{}, setTimeout});
  vm.runInContext(executionSource(source, 'test'), context);
  for (let i=0; i<50 && !context.window.test.done; i++) await new Promise(r=>setTimeout(r,5));
  return context.window.test;
}
test('erases types and returns the final expression', async()=>{
  const r=await execute('const value: number = 21; value * 2');
  assert.equal(r.result,'42'); assert.equal(r.error,null);
});
test('supports await and captures console output', async()=>{
  const r=await execute('await new Promise<void>(r => setTimeout(r, 5)); console.log("hello", 4); "done"');
  assert.equal(r.result,'done'); assert.equal(r.logs[0].text,'hello 4');
});
test('reports runtime errors', async()=>{
  const r=await execute('throw new Error("broken")'); assert.match(r.error,/broken/);
});
test('handles circular objects and bigint', async()=>{
  const r=await execute('const a: any = { n: 2n }; a.self = a; a');
  assert.match(r.result,/2n/); assert.match(r.result,/Circular/);
});
test('rejects module code and syntax errors', ()=>{
  assert.throws(()=>compile('import x from "x"'),/Module/);
  assert.throws(()=>compile('const = ;'));
});
test('declarations stay local to a snippet', async()=>{
  const c=vm.createContext({window:{},console,Element:class Element{}});
  vm.runInContext(executionSource('const privateValue: number = 1; privateValue','one'),c);
  await new Promise(r=>setTimeout(r,0));
  assert.equal(vm.runInContext('typeof privateValue',c),'undefined');
});
test('TypeScript detects assignment mismatch and offers spelling fix', ()=>{
  const file='/snippet.ts';
  const source='const person = { username: "Ada" }; person.usernme; const age: number = "36";';
  const options={strict:true,target:ts.ScriptTarget.ES2022};
  const base=ts.createCompilerHost(options);
  const host={
    getCompilationSettings:()=>options, getScriptFileNames:()=>[file], getScriptVersion:()=> '1',
    getScriptSnapshot:p=>{const s=p===file?source:ts.sys.readFile(p);return s===undefined?undefined:ts.ScriptSnapshot.fromString(s);},
    getCurrentDirectory:()=> '/', getDefaultLibFileName:o=>ts.getDefaultLibFilePath(o),
    fileExists:p=>p===file||base.fileExists(p), readFile:p=>p===file?source:base.readFile(p)
  };
  const service=ts.createLanguageService(host);
  const diagnostics=service.getSemanticDiagnostics(file);
  assert.ok(diagnostics.some(d=>d.code===2322));
  const typo=diagnostics.find(d=>d.code===2551); assert.ok(typo);
  assert.ok(service.getCodeFixesAtPosition(file,typo.start,typo.start+typo.length,[typo.code],{},{}).length>0);
});
