import { build } from 'esbuild';
import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await build({entryPoints:{panel:'src/panel.js','editor.worker':'node_modules/monaco-editor/esm/vs/editor/editor.worker.js','ts.worker':'node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js'},bundle:true,outdir:'dist',format:'iife',platform:'browser',target:'chrome120',loader:{'.ttf':'file'},minify:true});
for (const file of ['manifest.json','devtools.html','devtools.js','panel.html','style.css']) await copyFile(`src/${file}`,`dist/${file}`);

const licenses = await Promise.all(["typescript/LICENSE.txt", "monaco-editor/LICENSE"].map(async file => file+"\n\n"+await readFile(`node_modules/${file}`, "utf8")));
await writeFile("dist/THIRD_PARTY_LICENSES.txt", licenses.join("\n\n"));
