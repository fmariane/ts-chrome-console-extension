import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateInPage } from '../src/firefox-api.js';
test('unwraps Firefox promise results, including falsy values', async () => {
  for (const value of [false, 0, null, undefined, { done: true }]) {
    assert.equal(await evaluateInPage({ eval: async code => { assert.equal(code, 'expression'); return [value, undefined]; } }, 'expression'), value);
  }
});
test('surfaces Firefox evaluation exceptions and API errors', async () => {
  for (const error of [{isException:true,value:'snippet failed'}, {isError:true,code:'E_PROTOCOL'}]) {
    await assert.rejects(evaluateInPage({eval:async()=>[undefined,error]}, 'x'), {message:error.value||error.code});
  }
  await assert.rejects(evaluateInPage({eval:async()=>{throw Error('restricted page');}}, 'x'), /restricted page/);
});
test('explains missing DevTools context', async () => {
  await assert.rejects(evaluateInPage(undefined, 'x'), /Firefox Developer Tools/);
});
