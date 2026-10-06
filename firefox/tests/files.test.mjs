import test from 'node:test';
import assert from 'node:assert/strict';
import {fileName, uniqueName, hasContent} from '../src/files.js';
test('import name collisions never overwrite a tab',()=>{
  assert.equal(uniqueName('same.ts',['same.ts','same (2).ts']),'same (3).ts');
  assert.equal(uniqueName('fresh.ts',['same.ts']),'fresh.ts');
});
test('download names are safe basenames with a TypeScript extension',()=>{
  assert.equal(fileName('../../example.ts'),'example.ts');
  assert.equal(fileName('C:\\folder\\example.ts'),'example.ts');
  assert.equal(fileName('name?'),'name_.ts');
  assert.equal(fileName(''),'untitled.ts');
});
test('close warning considers inactive files and blank sessions',()=>{
  const mock=text=>({model:{getValue:()=>text}});
  assert.equal(hasContent([mock(''),mock('const n = 1')]),true);
  assert.equal(hasContent([mock('')]),false);
  assert.equal(hasContent([]),false);
});
