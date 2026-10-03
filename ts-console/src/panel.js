import * as monaco from 'monaco-editor';
import {executionSource} from './compiler.js';
import {fileName, uniqueName, hasContent} from './files.js';
self.MonacoEnvironment={getWorker(_,label){return new Worker(label==='typescript'||label==='javascript'?'ts.worker.js':'editor.worker.js');}};
const $=id=>document.getElementById(id);
const api=globalThis.chrome?.devtools?.inspectedWindow;
const examples={dom:'const heading = document.querySelector<HTMLHeadingElement>("h1");\n\nconsole.log("Page title:", document.title);\nheading?.textContent ?? "No heading found";',types:'interface Person {\n  name: string;\n  age: number;\n}\n\nconst person: Person = { name: "Ada", age: "36" };\n\nperson.name.toUpperCase();',async:'const delay = (ms: number): Promise<void> =>\n  new Promise(resolve => setTimeout(resolve, ms));\n\nawait delay(300);\nconsole.log("Finished waiting");\n({ title: document.title, url: location.href });'};
const defaults=monaco.languages.typescript.typescriptDefaults;
defaults.setCompilerOptions({target:monaco.languages.typescript.ScriptTarget.ES2022,module:monaco.languages.typescript.ModuleKind.ESNext,strict:true,moduleDetection:3,noEmit:true,allowNonTsExtensions:true});
defaults.setDiagnosticsOptions({noSemanticValidation:false,noSyntaxValidation:false,diagnosticCodesToIgnore:[1375,1378]});
defaults.addExtraLib('declare const $0: Element | undefined;','file:///devtools.d.ts');
monaco.editor.defineTheme('ts-console',{base:'vs-dark',inherit:true,rules:[],colors:{'editor.background':'#10141c','editorLineNumber.foreground':'#485b75','editor.selectionBackground':'#294766'}});
// Remove code persisted by version 0.1. All new models live only in memory.
try{localStorage.removeItem('ts-console.snippet');}catch{}
const editor=monaco.editor.create($('editor'),{model:null,theme:'ts-console',automaticLayout:true,minimap:{enabled:false},fontSize:13,lineHeight:21,padding:{top:16},scrollBeyondLastLine:false,lightbulb:{enabled:'on'},tabSize:2});
const files=[];let active=null;let model=null;let running=false;let ready=false;let nextId=1;let sessionId=0;
function renderTabs(){
  $('tabs').replaceChildren();
  for(const file of files){
    const item=document.createElement('div');item.className='file-tab'+(file===active?' active':'');
    const tab=document.createElement('button');tab.role='tab';tab.setAttribute('aria-selected',String(file===active));tab.textContent=file.name;tab.onclick=()=>activate(file);
    const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Close '+file.name);close.onclick=()=>askClose([file]);
    item.append(tab,close);$('tabs').append(item);
  }
  $('filename').value=active?.name??'';
}
function activate(file){if(active)active.view=editor.saveViewState();active=file;model=file.model;editor.setModel(model);if(file.view)editor.restoreViewState(file.view);renderTabs();markers();editor.focus();}
function addFile(name='untitled.ts',text=''){
  const unique=uniqueName(name,files.map(f=>f.name));
  const file={name:unique,model:monaco.editor.createModel(text,'typescript',monaco.Uri.parse(`file:///session/${nextId++}/${encodeURIComponent(unique)}`)),view:null};
  files.push(file);activate(file);return file;
}
function exportFile(file){
  const blob=new Blob([file.model.getValue()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('file-status').textContent=`Export requested for ${file.name}. Check your downloads before closing.`;
}
function removeFiles(targets){
  editor.setModel(null);active=null;model=null;
  for(const file of targets){const index=files.indexOf(file);if(index!==-1)files.splice(index,1);file.model.dispose();}
  if(files.length)activate(files[0]);else addFile();
}
function askClose(targets,session=false){
  const dialog=$('close-dialog');$('close-title').textContent=session?'Close this session?':'Close '+targets[0].name+'?';
  $('close-files').replaceChildren();
  for(const file of targets){const row=document.createElement('div');const name=document.createElement('span');name.textContent=file.name;const button=document.createElement('button');button.textContent='Export file';button.onclick=()=>exportFile(file);row.append(name,button);$('close-files').append(row);}
  $('discard').onclick=()=>{dialog.close();removeFiles(targets);if(session){sessionId++;$('output').replaceChildren();$('file-status').textContent='Session cleared. You can start a new file or close DevTools.';}};
  dialog.showModal();
}
$('cancel-close').onclick=()=>$('close-dialog').close();
$('new-file').onclick=()=>addFile();
$('export-file').onclick=()=>exportFile(active);
$('close-session').onclick=()=>askClose([...files],true);
$('filename').onchange=e=>{active.name=uniqueName(fileName(e.target.value),files.filter(f=>f!==active).map(f=>f.name));renderTabs();};
$('import-file').onclick=()=>$('file-input').click();
$('file-input').onchange=async e=>{
  const importingSession=sessionId;
  for(const file of Array.from(e.target.files)){
    if(!/\.ts$/i.test(file.name)){entry(`Cannot import ${file.name}: select a .ts file.`,'error');continue;}
    if(file.size>2*1024*1024){entry(`${file.name} exceeds the 2 MB import limit.`,'error');continue;}
    try{const text=await file.text();if(importingSession!==sessionId)break;addFile(file.name,text);}catch(error){entry(`Could not import ${file.name}: ${error.message}`,'error');}
  }
  e.target.value='';
};
window.addEventListener('beforeunload',event=>{if(hasContent(files)){event.preventDefault();event.returnValue='';}});
function entry(text,kind='log'){ $('output').querySelector('.empty')?.remove();const row=document.createElement('div');row.className='entry '+kind;row.textContent=text;$('output').append(row);while($('output').children.length>600)$('output').firstChild.remove();$('output').scrollTop=$('output').scrollHeight;}
function markers(){if(!model)return;const all=monaco.editor.getModelMarkers({resource:model.uri});$('problems').replaceChildren();for(const m of all.slice(0,8)){const b=document.createElement('button');b.className='problem';b.textContent=`${m.startLineNumber}:${m.startColumn}  ${m.message}`;b.onclick=()=>{editor.setPosition({lineNumber:m.startLineNumber,column:m.startColumn});editor.focus();editor.trigger('toolbar','editor.action.quickFix',{});};$('problems').append(b);} $('status').textContent=all.length?`${all.length} issue${all.length===1?'':'s'} · select an issue to see available fixes`:'No type errors · ready to run';}
monaco.editor.onDidChangeMarkers(markers);
addFile('snippet.ts',examples.dom);
function evaluate(code){return new Promise((resolve,reject)=>{if(!api)return reject(new Error('Open this extension from the TypeScript tab in Chrome DevTools.'));api.eval(code,(result,error)=>error?reject(new Error(error.description||error.value||'Page evaluation failed')):resolve(result));});}
async function run(){if(running||!ready)return;running=true;$('run').disabled=true;let key;const runSession=sessionId;try{
  const runModel=model;const runName=active.name;const version=runModel.getVersionId();const source=runModel.getValue();const worker=await(await monaco.languages.typescript.getTypeScriptWorker())(runModel.uri);const diagnostics=[...await worker.getSyntacticDiagnostics(runModel.uri.toString()),...await worker.getSemanticDiagnostics(runModel.uri.toString())].filter(d=>d.category===1&&![1375,1378].includes(d.code));
  if(runSession!==sessionId)return;
  if(runModel.isDisposed()||version!==runModel.getVersionId())throw new Error('Snippet changed during checking. Run again.');
  if($('block').checked&&diagnostics.length)throw new Error(`Fix ${diagnostics.length} type error(s) before running, or turn off “Block on type errors”.`);
  key='__ts_console_'+crypto.randomUUID().replaceAll('-','');const script=executionSource(source,key);entry(runName+'\n'+source,'source');await evaluate(script);const deadline=Date.now()+15000;let count=0;
  while(runSession===sessionId){const result=await evaluate(`window[${JSON.stringify(key)}]`);if(runSession!==sessionId)break;if(!result)throw new Error('The execution context changed. Run the snippet again.');for(const log of result.logs.slice(count))entry(log.text,log.level);count=result.logs.length;if(result.done){entry(result.error??result.result,result.error?'error':'result');break;}if(Date.now()>deadline)throw new Error('Stopped waiting after 15 seconds. Page execution may still be running.');await new Promise(r=>setTimeout(r,80));}
}catch(error){if(runSession===sessionId)entry(error.message,'error');}finally{if(key)try{await evaluate(`delete window[${JSON.stringify(key)}]`);}catch{}running=false;$('run').disabled=!ready;}}
$('run').onclick=run;editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,run);
$('fix').onclick=()=>{editor.focus();editor.trigger('toolbar','editor.action.quickFix',{});};$('format').onclick=()=>editor.getAction('editor.action.formatDocument').run();$('clear').onclick=()=>$('output').replaceChildren();$('examples').onchange=e=>{if(examples[e.target.value])addFile(e.target.value+'.ts',examples[e.target.value]);e.target.value='';};
if(!api)$('connection').textContent='Preview · open DevTools to execute';
monaco.languages.typescript.getTypeScriptWorker().then(factory=>factory(model.uri)).then(()=>{ready=true;$('run').disabled=false;markers();}).catch(error=>{$('status').textContent='Language service failed to start: '+error.message;});
