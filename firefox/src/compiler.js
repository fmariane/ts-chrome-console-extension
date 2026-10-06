import ts from 'typescript';
export function compile(source) {
  const ast = ts.createSourceFile('snippet.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (ast.statements.some(s => ts.isImportDeclaration(s) || ts.isExportDeclaration(s) || ts.isExportAssignment(s) || s.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) || /\bimport\s*\(/.test(source)) {
    throw new Error('Module imports and exports are not supported. Use page globals or paste self-contained code.');
  }
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    reportDiagnostics: true,
    transformers: { before: [context => root => {
      const statements = [...root.statements];
      const last = statements.at(-1);
      if (last && ts.isExpressionStatement(last)) statements[statements.length - 1] = context.factory.createReturnStatement(last.expression);
      return context.factory.updateSourceFile(root, statements);
    }] }
  });
  const errors = result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error) || [];
  if (errors.length) throw new Error(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
  return result.outputText;
}
// Runs inside the inspected page; this function must be self-contained.
export function pageRunner(key, execute, selected) {
  const logs = [];
  function show(value, depth = 0, seen = new WeakSet()) {
    try {
      if (value === undefined) return 'undefined';
      if (value === null) return 'null';
      if (typeof value === 'string') return value;
      if (typeof value === 'bigint') return value + 'n';
      if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']';
      if (typeof value !== 'object') return String(value);
      if (value instanceof Error) return value.stack || String(value);
      if (value instanceof Element) return value.outerHTML.slice(0, 3000);
      if (seen.has(value)) return '[Circular]';
      if (depth >= 3) return Object.prototype.toString.call(value);
      seen.add(value);
      if (Array.isArray(value)) return '[' + value.slice(0, 50).map(v => show(v, depth + 1, seen)).join(', ') + (value.length > 50 ? ', …' : '') + ']';
      return '{ ' + Object.keys(value).slice(0, 50).map(k => k + ': ' + show(value[k], depth + 1, seen)).join(', ') + ' }';
    } catch { return '[Uninspectable value]'; }
  }
  const state = { done: false, logs, result: null, error: null };
  Object.defineProperty(window, key, { value: state, configurable: true });
  const proxy = new Proxy(console, { get(target, prop) {
    if (['log', 'info', 'warn', 'error', 'debug', 'table'].includes(prop)) {
      return (...args) => { if (logs.length < 500) logs.push({ level: prop, text: args.map(v => show(v)).join(' ') }); };
    }
    const value = target[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  Promise.resolve().then(() => execute(proxy, selected)).then(value => {
    state.result = show(value); state.done = true;
  }, error => { state.error = show(error); state.done = true; });
  return true;
}
export function executionSource(source, key) {
  return `(${pageRunner.toString()})(${JSON.stringify(key)}, async function(console, $0) {\n${compile(source)}\n}, typeof $0 === 'undefined' ? undefined : $0)`;
}
