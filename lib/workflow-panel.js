'use strict';
const crypto=require('node:crypto'),core=require('./core'),device=require('./device'),toolchain=require('./toolchain');
const {t,getLanguage}=require('./i18n');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(nonce){
 const label=s=>escape(t(s)),words=JSON.stringify(Object.fromEntries(['Package inspection','Device installation'].map(k=>[k,t(k)]))).replace(/</g,'\\u003c');
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
*{box-sizing:border-box}body{margin:0;color:var(--vscode-foreground,#ddd);background:var(--vscode-editor-background,#202020);font:13px var(--vscode-font-family,'Segoe UI',sans-serif)}button,input,select{font:inherit;color:inherit}button{cursor:pointer;border:1px solid transparent;background:var(--vscode-button-secondaryBackground,#383838);padding:7px 12px;min-height:32px}button:hover{background:var(--vscode-button-secondaryHoverBackground,#454545)}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:1px solid var(--vscode-focusBorder,#007acc);outline-offset:2px}button:disabled{opacity:.5;cursor:default}.primary{background:var(--vscode-button-background,#007acc);color:var(--vscode-button-foreground,#fff)}.primary:hover{background:var(--vscode-button-hoverBackground,#006bb3)}header{padding:16px 20px;border-bottom:1px solid var(--vscode-panel-border,#444);display:flex;align-items:center;gap:16px;flex-wrap:wrap}h1{font-size:18px;font-weight:600;margin:0;flex:1}.versions{color:var(--vscode-descriptionForeground,#aaa)}nav{display:flex;gap:4px;padding:8px 20px;border-bottom:1px solid var(--vscode-panel-border,#444);flex-wrap:wrap}nav button{background:transparent;border-bottom:2px solid transparent}nav button[aria-selected=true]{color:var(--vscode-tab-activeForeground,#fff);border-bottom-color:var(--vscode-focusBorder,#007acc)}main{max-width:1000px;padding:24px 20px}h2{font-size:15px;margin:0 0 16px}.actions,.file-row,.port-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0 20px}input,select{padding:7px;border:1px solid var(--vscode-input-border,#555);background:var(--vscode-input-background,#353535);color:var(--vscode-input-foreground,#fff);min-height:32px}input{flex:1;min-width:180px}select{min-width:180px;max-width:100%}label{display:block;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-bottom:20px}td{padding:14px 8px;border-bottom:1px solid var(--vscode-panel-border,#444);vertical-align:top}td:first-child{width:180px;padding-left:0}td:last-child{width:120px;text-align:right}td:nth-child(2){overflow-wrap:anywhere;color:var(--vscode-descriptionForeground,#aaa)}dl{display:grid;grid-template-columns:160px minmax(0,1fr);margin:20px 0}dt,dd{padding:10px 0;border-bottom:1px solid var(--vscode-panel-border,#444);margin:0;overflow-wrap:anywhere}dt{color:var(--vscode-descriptionForeground,#aaa)}#status{line-height:1.6;white-space:pre-wrap}#status.error{color:var(--vscode-errorForeground,#f88)}progress{width:100%;height:8px;accent-color:var(--vscode-progressBar-background,#007acc)}pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6;max-height:300px;overflow:auto;font-family:var(--vscode-editor-font-family,monospace)}details{margin-top:24px}summary{cursor:pointer;padding:8px 0}.hint{line-height:1.6;color:var(--vscode-descriptionForeground,#aaa)}[hidden]{display:none!important}@media(max-width:600px){dl{grid-template-columns:110px minmax(0,1fr)}td:first-child{width:100px}td:last-child{width:80px}.actions button{flex-grow:1}}
</style></head><body><header><h1>${label('Development tools')}</h1><span id="versions" class="versions"></span></header><nav aria-label="${label('Development tools')}"><button data-mode="environment">${label('Environment')}</button><button data-mode="package">${label('Package inspection')}</button><button data-mode="install">${label('Device installation')}</button></nav><main>
<section id="environment"><h2>${label('Environment')}</h2><table aria-label="${label('Environment')}"><tbody id="checks"></tbody></table><div class="actions"><button data-action="doctor" class="primary">${label('Check again')}</button><button data-action="python">${label('Choose Python…')}</button><button data-action="compiler">${label('Choose compiler…')}</button><button data-action="find">${label('Find toolchain…')}</button><button data-action="guide">${label('Install toolchain')}</button><button data-action="dependencies">${label('Install Python dependencies')}</button><button data-action="sdk">${label('Select SDK…')}</button><button id="retry" data-action="retry">${label('Retry build')}</button></div></section>
<section id="package"><h2 id="package-heading">${label('Package inspection')}</h2><label for="file">${label('Application package')}</label><div class="file-row"><input id="file" readonly><button data-action="choose">${label('Choose package…')}</button></div><p id="empty" class="hint">${label('Choose a .dtapp package to inspect or install.')}</p><dl id="summary"></dl><details id="files-detail"><summary>${label('Files')}</summary><pre id="files"></pre></details><section id="installation"><label for="port">${label('Serial port')}</label><div class="port-row"><select id="port"></select><button data-action="ports">${label('Refresh ports')}</button><button id="install" data-action="install" class="primary">${label('Install')}</button></div><p class="hint">${label('Enable USB debugging input and output on the device. Release other programs using this serial port.')}</p></section></section>
<p id="status" role="status" aria-live="polite"></p><progress id="progress" max="100" hidden></progress><div class="actions"><button id="cancel" data-action="cancel" hidden>${label('Cancel')}</button></div><details><summary>${label('Details')}</summary><pre id="details"></pre></details></main><script nonce="${nonce}">
const api=acquireVsCodeApi(),words=${words},$=id=>document.getElementById(id);let state={mode:'environment',busy:false,ports:[],rows:[],summary:[]};
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>api.postMessage({action:b.dataset.action,port:$('port').value});for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>api.postMessage({action:'mode',mode:b.dataset.mode});
function draw(){const env=state.mode==='environment';$('environment').hidden=!env;$('package').hidden=env;$('installation').hidden=state.mode!=='install';$('package-heading').textContent=words[state.mode==='install'?'Device installation':'Package inspection'];$('versions').textContent=state.versions||'';$('file').value=state.file||'';$('status').textContent=state.error||state.message||'';$('status').classList.toggle('error',!!state.error);$('details').textContent=state.details||'';$('cancel').hidden=!state.busy;$('retry').hidden=!state.retry;$('progress').hidden=!state.busy;if(state.percent==null)$('progress').removeAttribute('value');else $('progress').value=state.percent;
 for(const b of document.querySelectorAll('[data-action]'))if(b.dataset.action!=='cancel')b.disabled=state.busy;for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-selected',String(b.dataset.mode===state.mode));
 $('checks').replaceChildren();for(const row of state.rows||[]){const tr=document.createElement('tr');for(const value of [row.name,row.value,row.status]){const td=document.createElement('td');td.textContent=value;tr.append(td)}$('checks').append(tr)}
 $('summary').replaceChildren();for(const [name,value] of state.summary||[]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('summary').append(dt,dd)}$('empty').hidden=!!state.file;$('files-detail').hidden=!state.file;$('files').textContent=(state.files||[]).join('\\n');
 const selected=$('port').value;$('port').replaceChildren();for(const item of state.ports||[]){const option=document.createElement('option');option.value=item.port;option.textContent=item.port+(item.description?' — '+item.description:'');$('port').append(option)}if((state.ports||[]).some(p=>p.port===selected))$('port').value=selected;$('port').disabled=state.busy;$('install').disabled=state.busy||!state.file||!state.ports?.length;}
window.addEventListener('message',e=>{state=e.data;draw()});draw();api.postMessage({action:'ready'});
</script></body></html>`;
}
function environmentRows(result){
 const row=(name,value,available,missing='Missing')=>({name:t(name),value:String(value||''),status:t(available?'Available':missing)});
 return [row('SDK directory',result.sdk,true),row('Python',result.python,true),row('Node.js runtime',result.node,true),row('Native compiler',result.compilerPath?result.compilerPath+'\n'+result.compiler:t(result.compilerIssue||''),!!result.compiler,'Required for Native builds'),row('Serial support','pyserial',result.serial),row('PNG conversion','Pillow',result.imageResources.png),row('SVG conversion','CairoSVG',result.imageResources.svg),row('Interactive preview','Windows x64',result.interactivePreview)];
}
function packageSummary(info){
 const m=info.manifest,name=typeof m.name==='string'?m.name:m.name?.[getLanguage()==='zh-cn'?'zh-CN':'en']||m.name?.['en-US']||m.name?.en||Object.values(m.name||{})[0]||m.id;
 return [['Name',name],['Package ID',m.id],['Version',m.version+' ('+m.version_code+')'],['Runtime',m.runtime],['SDK target',m.sdk?.target],['Size',t('{0} bytes',info.bytes.toLocaleString())],['Integrity',t('Verified')],['Signature',t(info.signature)],['Permissions',JSON.stringify(m.permissions||[])],['Files',String(info.files.length)]].map(([k,v])=>[t(k),String(v??'')]);
}
let active;
function open(vscode,context,mode,options,extra={}){
 if(active){active.show(mode,extra);return active.panel;}
 const panel=vscode.window.createWebviewPanel('desktile.workflows',t('Development tools'),vscode.ViewColumn.Active,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[]});
 const state={mode,busy:false,ports:[],rows:[],summary:[],files:[],file:'',details:'',message:t('Ready'),error:'',retry:!!extra.retry};let controller,disposed=false,dialogPending=false,retry=extra.retry;
 const post=()=>{if(!disposed){const metadata=require('../package.json');state.versions='SDK '+(state.sdkVersion||metadata.desktileSdk.default)+' / '+t('Tools')+' '+metadata.desktileSdk.toolRevision;panel.webview.postMessage({...state});}};
 const errorText=e=>String(e.message||e).split('\n').map(line=>t(line)).join('\n');
 const setError=e=>{state.error=errorText(e);post();};
 async function dialog(picker){if(dialogPending||disposed)return;dialogPending=true;try{return await picker();}finally{dialogPending=false;}}
 const log=chunk=>{state.details=(state.details+chunk).slice(-20000);options().log?.(chunk);post();};
 async function run(message,fn){if(controller||disposed)return;controller=new AbortController();const current=controller;state.busy=true;state.phase='';state.percent=null;state.error='';state.details='';state.message=t(message);post();try{await fn({...options(),signal:current.signal,log});}catch(e){if(current.signal.aborted)state.message=t(['installing','verifying','confirmation-required'].includes(state.phase)?'Monitoring stopped. An installation already started on the device may continue.':'Operation cancelled.');else state.error=errorText(e);}finally{if(controller===current)controller=undefined;state.busy=false;post();}}
 async function doctor(o){const result=await core.doctor(o);state.rows=environmentRows(result);state.sdkVersion=result.sdkVersion;state.message=t('Environment check completed.');}
 async function ports(o){state.ports=await device.devices(o);state.message=t(state.ports.length?'Serial ports refreshed.':'No serial ports found.');}
 async function action(m){
  if(!m||typeof m!=='object')return;
  if(!vscode.workspace.isTrusted){state.error=t('Trust this workspace to use development tools.');post();return;}
  if(m.action==='cancel'){controller?.abort();return;}
  if(m.action==='mode'&&['environment','package','install'].includes(m.mode)){state.mode=m.mode;post();if(m.mode==='install'&&!state.ports.length)await run('Reading serial ports…',ports);return;}
  if(m.action==='ready'){post();if(state.mode==='environment')await run('Checking environment…',doctor);else if(state.mode==='install')await run('Reading serial ports…',ports);return;}
  if(state.busy||dialogPending||disposed)return;
  if(m.action==='doctor')return run('Checking environment…',doctor);
  if(m.action==='ports')return run('Reading serial ports…',ports);
  if(m.action==='guide')return vscode.env.openExternal(vscode.Uri.parse(toolchain.GUIDE));
  if(m.action==='sdk'){await vscode.commands.executeCommand('desktile.sdk');return run('Checking environment…',doctor);}
  if(m.action==='retry'&&retry)return run('Building DeskTile application',async o=>{const result=await retry(o);if(result){state.retry=false;state.message=t('Application package built.');}});
  if(m.action==='choose'){
   const picked=await dialog(()=>vscode.window.showOpenDialog({canSelectMany:false,filters:{'DeskTile':['dtapp']}}));if(!picked)return;
   return run('Checking package…',async()=>{state.file='';state.summary=[];state.files=[];const info=core.inspect(picked[0].fsPath);state.file=picked[0].fsPath;state.summary=packageSummary(info);state.files=info.files;state.message=t('Package verified.');});
  }
  if(m.action==='python'){
   const picked=await dialog(()=>vscode.window.showOpenDialog({canSelectMany:false,title:t('Select Python interpreter')}));if(!picked)return;
   return run('Checking environment…',async o=>{await doctor({...o,python:picked[0].fsPath});await vscode.workspace.getConfiguration('desktile').update('pythonPath',picked[0].fsPath,vscode.ConfigurationTarget.Global);});
  }
  if(m.action==='compiler'||m.action==='find'){
   const picked=await dialog(()=>vscode.window.showOpenDialog({canSelectMany:false,canSelectFiles:m.action==='compiler',canSelectFolders:m.action==='find',title:t(m.action==='compiler'?'Select ESP32-S3 compiler':'Select the toolchain installation directory')}));if(!picked)return;
   return run('Checking environment…',async o=>{
    let file=picked[0].fsPath;
    if(m.action==='find'){
     const candidates=toolchain.discover({toolchainRoots:[file],toolchainRootsOnly:true},core.ROOT,{...process.env,DESKTILE_COMPILER:''}).candidates;
     if(!candidates.length)throw Error(t('No ESP32-S3 compiler found in this directory.'));
     if(candidates.length===1)file=candidates[0];else{const item=await vscode.window.showQuickPick(candidates.map(p=>({label:p})),{title:t('Select ESP32-S3 compiler')});if(!item)return;file=item.label;}
    }
    const compiler=await toolchain.validate(file,core.run,o);await vscode.workspace.getConfiguration('desktile').update('compilerPath',compiler.path,vscode.ConfigurationTarget.Global);await doctor({...o,compiler:compiler.path});state.message=t('Compiler configured.');
   });
  }
  if(m.action==='dependencies')return run('Installing Python dependencies…',async o=>{await core.run(o.python||process.env.DESKTILE_PYTHON||'python',['-m','pip','install','pyserial','Pillow','CairoSVG'],o);await doctor(o);state.message=t('Python dependencies installed.');});
  if(m.action==='install'){
   if(!state.file||!state.ports.some(p=>p.port===m.port))throw Error(t('Select a package and serial port first.'));
   return run('Transferring package…',async o=>{
    state.phase='upload';const result=await device.install(state.file,{...o,port:m.port,onSample:sample=>{
     if(sample.type==='upload'){state.percent=sample.percent;state.message=t('Transferring package…')+' '+sample.percent+'%';}
     else if(sample.status){state.phase=sample.status;state.percent=sample.status==='installing'?sample.progress:null;state.message=t(({'verifying':'Verifying on device…','confirmation-required':'Confirm Native installation on the device.','installing':'Installing on device…'})[sample.status]||sample.status);}
     post();
    }});if(!['complete','already-installed'].includes(result?.status))throw Error(t('The device did not report a completed installation.'));state.message=t(result.status==='already-installed'?'This version is already installed.':'Application installed.');
   });
  }
 }
 panel.webview.html=html(crypto.randomBytes(16).toString('hex'));
 panel.webview.onDidReceiveMessage(m=>Promise.resolve().then(()=>action(m)).catch(setError));
 active={panel,show(next,changes){if(['environment','package','install'].includes(next))state.mode=next;if(changes.retry){retry=changes.retry;state.retry=true;}if(changes.message)state.error=t(changes.message);panel.reveal();post();}};
 if(extra.message)state.error=t(extra.message);
 panel.onDidDispose(()=>{disposed=true;controller?.abort();active=undefined;});context.subscriptions.push(panel);return panel;
}
module.exports={open,html,environmentRows,packageSummary};
