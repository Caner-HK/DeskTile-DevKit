'use strict';
const {selectScript}=require('./select-control');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),core=require('./core');
const {commonCss}=require('./panel-ui'),{t}=require('./i18n'),{folderError}=require('./project-location');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active;
function html(nonce){
const label=s=>escape(t(s));
return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
${commonCss}
main{max-width:740px;padding:24px}form{display:grid;gap:20px}.field{display:grid;grid-template-columns:150px minmax(0,1fr);gap:20px;align-items:center}label{font-weight:600}input,select{height:26px;width:100%;min-width:0}.input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.actions{padding-top:4px;display:flex;gap:8px}#status{margin:0;white-space:pre-wrap;color:var(--vscode-descriptionForeground,#9d9d9d)}#status.error{color:var(--vscode-errorForeground,#f48771)}input[aria-invalid=true]{border-color:var(--vscode-inputValidation-errorBorder,#be1100)}[hidden]{display:none!important}@media(max-width:550px){.field{grid-template-columns:1fr;gap:8px}}
</style></head><body><header><h1>${label('Create application')}</h1></header><main><form id="create-form">
<div class="field"><label for="kind">${label('Application type')}</label><select id="kind"><option value="javascript">JavaScript</option><option value="native">Native C++</option></select></div>
<div class="field"><label for="name">${label('Application name')}</label><input id="name" required maxlength="63" autocomplete="off"></div>
<div class="field"><label for="id">${label('Application package id')}</label><input id="id" required maxlength="96" value="com.example.myapp" autocomplete="off" spellcheck="false"></div>
<div class="field"><label for="author">${label('Application author')}</label><input id="author" required maxlength="63" autocomplete="off"></div>
<div class="field"><label for="parent">${label('Parent directory')}</label><div class="input-row"><input id="parent" readonly placeholder="${label('Choose a parent directory…')}"><button type="button" id="browse">${label('Browse…')}</button></div></div>
<div class="field"><label for="folder">${label('New project folder name')}</label><input id="folder" required maxlength="100" value="myapp" autocomplete="off" spellcheck="false"></div>
<div class="field"><label for="destination">${label('Project location')}</label><input id="destination" readonly></div>
<div class="actions"><button class="primary" type="submit">${label('Create application')}</button></div><p id="status" role="status" aria-live="polite" hidden></p>
</form></main><script nonce="${nonce}">${selectScript}

const api=acquireVsCodeApi(),by=id=>document.getElementById(id);let state={parent:'',separator:'/',busy:false};
function destination(){by('destination').value=state.parent?state.parent.replace(/[\\\\/]+$/,'')+state.separator+by('folder').value:'';}
for(const id of ['kind','name','id','author','folder'])by(id).addEventListener('input',()=>{by(id).removeAttribute('aria-invalid');by('status').hidden=true;destination();});
by('browse').onclick=()=>api.postMessage({action:'browse'});
by('create-form').onsubmit=e=>{e.preventDefault();if(state.busy)return;api.postMessage({action:'create',values:Object.fromEntries(['kind','name','id','author','folder'].map(id=>[id,by(id).value]))});};
window.addEventListener('message',e=>{state=e.data;by('parent').value=state.parent;destination();for(const el of document.querySelectorAll('input:not([readonly]),select,button'))el.disabled=state.busy;by('status').hidden=!(state.error||state.message);by('status').textContent=state.error||state.message||'';by('status').classList.toggle('error',!!state.error);for(const id of ['name','id','author','folder','parent'])by(id).removeAttribute('aria-invalid');if(state.errorField){by(state.errorField).setAttribute('aria-invalid','true');by(state.errorField).focus();}});
api.postMessage({action:'ready'});
</script></body></html>`;
}
function open(vscode,context,options){
if(active){active.reveal();return active;}
const panel=vscode.window.createWebviewPanel('desktile.create',t('Create application'),vscode.ViewColumn.Active,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[]});active=panel;
let disposed=false,picking=false;
const state={parent:'',separator:path.sep,busy:false,message:'',error:'',errorField:''};
const post=()=>{if(!disposed)panel.webview.postMessage({...state});};
const fail=(message,field='')=>{state.error=t(message);state.errorField=field;post();};
async function receive(m){
if(disposed||!m||typeof m!=='object')return;
if(!vscode.workspace.isTrusted)return fail('Trust this workspace to use development tools.');
if(m.action==='ready'){post();return;}
if(state.busy||picking)return;
if(m.action==='browse'){
picking=true;try{const picked=await vscode.window.showOpenDialog({title:t('Choose where to create the project folder'),canSelectFiles:false,canSelectFolders:true,canSelectMany:false,openLabel:t('Use This Location')});if(picked&&!disposed){state.parent=picked[0].fsPath;state.error='';state.errorField='';state.message='';post();}}finally{picking=false;}return;
}
if(m.action!=='create')return;
state.error='';state.errorField='';state.message='';
const data=m.values||{},values=Object.fromEntries(['kind','name','id','author','folder'].map(k=>[k,typeof data[k]==='string'?(k==='folder'?data[k]:data[k].trim()):'']));
if(!state.parent||!fs.existsSync(state.parent)||!fs.statSync(state.parent).isDirectory())return fail('Choose a parent directory…','parent');
const folderIssue=folderError(state.parent,values.folder);if(folderIssue)return fail(folderIssue,'folder');
state.busy=true;state.message=t('Creating DeskTile application');post();
let result;
try{
result=await core.create(path.join(state.parent,values.folder),{...options(),kind:values.kind,id:values.id,name:values.name,author:values.author});
state.message=t('Project created.');options().log?.(t('Creating project: {0}',result.project)+'\n');
}catch(error){
const field={APP_NAME:'name',PACKAGE_ID:'id',AUTHOR:'author'}[error.code]||'';
state.error=t(error.code==='AUTHOR'?'Author must be 1–63 UTF-8 bytes.':error.message);state.errorField=field;state.message='';
}finally{state.busy=false;post();}
if(result&&!disposed){try{await vscode.commands.executeCommand('vscode.openFolder',vscode.Uri.file(result.project),true);}catch(error){state.error=t('Project created. Open it from {0}',result.project);options().log?.(error.message+'\n');post();}}
}
panel.webview.html=html(crypto.randomBytes(16).toString('hex'));
panel.webview.onDidReceiveMessage(m=>receive(m).catch(error=>fail(error.message)));
panel.onDidDispose(()=>{disposed=true;if(active===panel)active=undefined;});context.subscriptions.push(panel);return panel;
}
module.exports={open,html};
