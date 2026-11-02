'use strict';
const {selectScript}=require('./select-control');
const {commonCss}=require('./panel-ui');
const crypto=require('node:crypto'),core=require('./core'),device=require('./device'),toolchain=require('./toolchain');
const {t,getLanguage}=require('./i18n');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(nonce,mode='environment'){
 const title={environment:'Check environment',package:'Package inspection',install:'Device installation'}[mode];
 if(!title)throw Error('Unknown workflow page');
 const label=s=>escape(t(s));
 const controls=mode==='environment'?`<div class="toolbar"><button data-action="doctor" class="primary">${label('Check again')}</button><button id="retry" data-action="retry" hidden>${label('Retry build')}</button></div><div id="checks" class="checks" aria-label="${label('Environment')}"></div>`:
 `<div class="field"><label for="file">${label('Application package')}</label><div class="input-row"><input id="file" readonly placeholder="${label('Choose a .dtapp package to inspect or install.')}"><button data-action="choose" class="${mode==='package'?'primary':''}">${label('Choose package…')}</button></div></div>`+
 (mode==='install'?`<div class="field"><label for="port">${label('Serial port')}</label><div class="input-row"><select id="port"></select><button data-action="ports">${label('Refresh ports')}</button></div><p class="description">${label('Enable USB debugging input and output on the device. Release other programs using this serial port.')}</p></div><div class="toolbar"><button id="install" class="primary" data-action="install" disabled>${label('Install')}</button></div>`:'')+
 (mode==='install'?`<details id="package-info" hidden><summary>${label('Package information')}</summary><dl id="summary"></dl></details>`:`<dl id="summary" hidden></dl>`)+
 `<details id="files-detail" hidden><summary>${label('Files')}</summary><pre id="files"></pre></details>`;
 return `<!doctype html><html lang="${getLanguage()==='zh-cn'?'zh-CN':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
*{box-sizing:border-box}body{margin:0;color:var(--vscode-foreground,#ccc);background:var(--vscode-editor-background,#1f1f1f);font:13px var(--vscode-font-family,'Segoe UI',sans-serif);line-height:1.5}button,input,select{font:inherit;color:inherit;height:26px;min-height:26px;border:1px solid var(--vscode-input-border,transparent);border-radius:0}button{padding:0 8px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;font-size:12px;line-height:16px;cursor:pointer;color:var(--vscode-button-secondaryForeground,#ccc);background:var(--vscode-button-secondaryBackground,#313131);border-color:var(--vscode-button-secondaryBorder,var(--vscode-button-border,transparent))}button:hover{background:var(--vscode-button-secondaryHoverBackground,#454545)}button:disabled{opacity:.5;cursor:default}.primary{background:var(--vscode-button-background,#0078d4);color:var(--vscode-button-foreground,#fff);border-color:var(--vscode-button-border,transparent)}.primary:hover{background:var(--vscode-button-hoverBackground,#026ec1)}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:1px solid var(--vscode-focusBorder,#0078d4);outline-offset:2px}input,select{width:100%;min-width:0;padding:0 6px;background:var(--vscode-input-background,#313131);color:var(--vscode-input-foreground,#ccc)}input[readonly]{cursor:text}header{padding:20px 24px 16px;border-bottom:1px solid var(--vscode-panel-border,#444)}h1{font-size:18px;font-weight:600;line-height:1.4;margin:0}main{padding:20px 24px;max-width:1000px}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:20px}.field{margin-bottom:20px}label{display:block;margin:0 0 8px;font-weight:600}.input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.description{margin:8px 0 0;color:var(--vscode-descriptionForeground,#9d9d9d);line-height:1.6}.check{display:grid;grid-template-columns:140px minmax(0,1fr) 70px 164px;align-items:center;gap:20px;padding:16px 0;border-bottom:1px solid var(--vscode-panel-border,#444)}.check-name{font-weight:600}.check-name,.check-value,.check-state{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.check-state{color:var(--vscode-descriptionForeground,#9d9d9d)}.check-actions{display:flex;gap:8px;flex-wrap:nowrap;justify-content:flex-end}.check-actions button{min-width:0;overflow:hidden;text-overflow:ellipsis}.check-actions button:not(.more){display:block}.check-actions .more{width:26px;flex:0 0 26px}.checks+.result{border-top:0;margin-top:0;padding-top:16px}dl{display:grid;grid-template-columns:150px minmax(0,1fr);margin:20px 0 0}dt,dd{padding:12px 0;border-bottom:1px solid var(--vscode-panel-border,#444);margin:0;overflow-wrap:anywhere}dt{color:var(--vscode-descriptionForeground,#9d9d9d)}dd{padding-left:20px}details{margin-top:20px}summary{cursor:pointer;padding:4px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;max-height:300px;overflow:auto;font-family:var(--vscode-editor-font-family,monospace);font-size:12px}.result{border-top:1px solid var(--vscode-panel-border,#444);margin-top:24px;padding-top:16px}.result-line{display:flex;gap:16px;align-items:flex-start;justify-content:space-between}#status{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}#status.error{color:var(--vscode-errorForeground,#f48771)}progress{display:block;width:100%;height:4px;margin-top:12px;accent-color:var(--vscode-progressBar-background,#0078d4)}[hidden]{display:none!important}@media(max-width:600px){header{padding:20px}main{padding:20px}.check{grid-template-columns:100px minmax(0,1fr) 48px 140px;gap:12px}dl{grid-template-columns:110px minmax(0,1fr)}dd{padding-left:12px}}@media(max-width:420px){.check{grid-template-columns:72px minmax(0,1fr) 40px 114px;gap:8px}}
${commonCss}
</style></head><body><header><h1>${label(title)}</h1></header><main>${controls}<section id="result" class="result" hidden><div class="result-line"><p id="status" role="status" aria-live="polite"></p><button id="cancel" data-action="cancel" hidden>${label('Cancel')}</button></div><progress id="progress" max="100" hidden></progress></section></main><script nonce="${nonce}">${selectScript}

const api=acquireVsCodeApi(),$=id=>document.getElementById(id);let state={busy:false,rows:[],summary:[],ports:[]},previousRows='',previousSummary='',previousPorts='';
document.addEventListener('click',e=>{const button=e.target.closest('button[data-action]');if(button&&!button.disabled)api.postMessage({action:button.dataset.action,port:$('port')?.value});});
function draw(){
 for(const b of document.querySelectorAll('button[data-action]'))b.disabled=state.busy&&b.dataset.action!=='cancel';
 if($('retry'))$('retry').hidden=!state.retry;
 if($('file'))$('file').value=state.file||'';
 if($('package-info'))$('package-info').hidden=!state.file;
 if($('summary')){$('summary').hidden=!state.file;const key=JSON.stringify(state.summary||[]);if(key!==previousSummary){previousSummary=key;$('summary').replaceChildren();for(const [name,value] of state.summary||[]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('summary').append(dt,dd);}}}
 if($('files-detail')){$('files-detail').hidden=!state.file;$('files').textContent=(state.files||[]).join('\\n');}
 if($('checks')){const key=JSON.stringify(state.rows||[]);if(key!==previousRows){previousRows=key;$('checks').replaceChildren();for(const row of state.rows||[]){const item=document.createElement('div'),name=document.createElement('div'),value=document.createElement('div'),status=document.createElement('span'),actions=document.createElement('div');item.className='check';name.className='check-name';name.textContent=name.title=row.name;value.className='check-value';value.title=row.value;value.textContent=row.value.replace(/\\n/g,' ');status.className='check-state';status.textContent=status.title=row.status;actions.className='check-actions';for(const action of row.actions||[]){const b=document.createElement('button');b.dataset.action=action.id;b.textContent=action.label;b.title=action.title||action.label;b.setAttribute('aria-label',b.title);if(action.id==='toolchain-actions')b.className='more';b.disabled=state.busy;actions.append(b);}item.append(name,value,status,actions);$('checks').append(item);}}}
 if($('port')){const key=JSON.stringify(state.ports||[]);if(key!==previousPorts){previousPorts=key;const selected=$('port').value;$('port').replaceChildren();for(const item of state.ports||[]){const option=document.createElement('option');option.value=item.port;option.textContent=item.port+(item.description?' — '+item.description:'');$('port').append(option);}if((state.ports||[]).some(p=>p.port===selected))$('port').value=selected;}$('port').disabled=state.busy||!state.ports?.length;$('install').disabled=state.busy||!state.file||!state.ports?.length;}
 $('result').hidden=!(state.busy||state.error||state.message );$('status').textContent=state.error||state.message||'';$('status').classList.toggle('error',!!state.error);$('cancel').hidden=!state.busy;$('progress').hidden=!state.busy;if(state.percent==null)$('progress').removeAttribute('value');else $('progress').value=state.percent;
}
window.addEventListener('message',e=>{state=e.data;draw()});draw();api.postMessage({action:'ready'});
</script></body></html>`;
}
function environmentRows(result){
 const action=(id,label)=>({id,label:t(label)});
 const row=(name,value,available,actions=[],missing='Missing')=>({name:t(name),value:String(value||''),status:t(available?'Available':missing),actions});
 return [
  row('SDK directory',result.sdk,true,[action('sdk','Select SDK…')]),
  row('Python',result.python,true,[action('python','Choose Python…')]),
  row('Node.js runtime',result.node,true),
  row('Native compiler',result.compilerPath?result.compilerPath+'\n'+result.compiler:t(result.compilerIssue||''),!!result.compiler,result.compiler?[action('compiler','Choose compiler…')]:[action('compiler','Choose compiler…'),{id:'toolchain-actions',label:'…',title:t('More actions')}]),
  row('Serial support','pyserial',result.serial,result.serial?[]:[action('dependencies-serial','Install dependency')]),
  row('PNG conversion','Pillow',result.imageResources.png,result.imageResources.png?[]:[action('dependencies-png','Install dependency')]),
  row('SVG conversion','CairoSVG',result.imageResources.svg,result.imageResources.svg?[]:[action('dependencies-svg','Install dependency')]),
  row('Interactive preview','Windows x64',result.interactivePreview)
 ];
}
function packageSummary(info){
 const m=info.manifest,name=typeof m.name==='string'?m.name:m.name?.[getLanguage()==='zh-cn'?'zh-CN':'en']||m.name?.['en-US']||m.name?.en||Object.values(m.name||{})[0]||m.id;
 return [['Name',name],['Package ID',m.id],['Version',m.version+' ('+m.version_code+')'],['Runtime',m.runtime],['SDK target',m.sdk?.target],['Size',t('{0} bytes',info.bytes.toLocaleString())],['Integrity',t('Verified')],['Signature',t(info.signature)],['Permissions',JSON.stringify(m.permissions||[])],['Files',String(info.files.length)]].map(([k,v])=>[t(k),String(v??'')]);
}
const panels=new Map(),titles={environment:'Check environment',package:'Package inspection',install:'Device installation'};
function open(vscode,context,mode,options,extra={}){
 if(!titles[mode])throw Error('Unknown workflow page');
 if(mode==='environment')return require('./settings-panel').open(vscode,context,options,{...extra,tab:'environment',check:true});
 const existing=panels.get(mode);if(existing){existing.show(extra);return existing.panel;}
 const panel=vscode.window.createWebviewPanel('desktile.'+mode,t(titles[mode]),vscode.ViewColumn.Active,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[]});
 const workflow=createController(vscode,mode,options,extra,state=>panel.webview.postMessage(state));
 panel.webview.html=html(crypto.randomBytes(16).toString('hex'),mode);
 panel.webview.onDidReceiveMessage(workflow.receive);
 const entry={panel,show(changes){workflow.show(changes);panel.reveal();}};panels.set(mode,entry);
 panel.onDidDispose(()=>{workflow.dispose();if(panels.get(mode)===entry)panels.delete(mode);});context.subscriptions.push(panel);return panel;
}
function createController(vscode,mode,options,extra={},publish){
 const state={mode,busy:false,ports:[],rows:[],summary:[],files:[],file:'',message:'',error:'',retry:!!extra.retry};let controller,disposed=false,dialogPending=false,retry=extra.retry;
 const post=()=>{if(!disposed)publish({...state});};
 const errorText=e=>String(e.message||e).split('\n').map(line=>t(line)).join('\n');
 const setError=e=>{if(core.isCancellation(e)){state.error='';state.message=t('Operation cancelled.');}else state.error=errorText(e);post();};
 async function dialog(picker){if(dialogPending||disposed)return;dialogPending=true;try{return await picker();}finally{dialogPending=false;}}
 const log=chunk=>options().log?.(chunk);
 async function run(message,fn){if(controller||disposed)return;controller=new AbortController();const current=controller;state.busy=true;state.phase='';state.percent=null;state.error='';state.message=t(message);post();try{await fn({...options(),signal:current.signal,log});}catch(e){if(current.signal.aborted||core.isCancellation(e))state.message=t(['installing','verifying','confirmation-required'].includes(state.phase)?'Monitoring stopped. An installation already started on the device may continue.':'Operation cancelled.');else state.error=errorText(e);}finally{if(controller===current)controller=undefined;state.busy=false;post();}}
 async function doctor(o){
  state.rows=[{name:t('SDK directory'),value:o.sdk||require('node:path').join(core.ROOT,'sdk-bundle'),status:t('Not checked'),actions:[{id:'sdk',label:t('Select SDK…')}]},{name:'Python',value:o.python||process.env.DESKTILE_PYTHON||'python',status:t('Not checked'),actions:[{id:'python',label:t('Choose Python…')}]}];
  try{const result=await core.doctor(o);state.rows=environmentRows(result);state.sdkVersion=result.sdkVersion;state.message=t('Environment check completed.');}
  catch(e){if(!core.isCancellation(e)&&!o.signal?.aborted)state.rows[String(e.code||'').startsWith('SDK')?0:1].status=t('Unavailable');throw e;}
 }
 async function ports(o){state.ports=await device.devices(o);state.message=t(state.ports.length?'Serial ports refreshed.':'No serial ports found.');}
 async function action(m){
  if(!m||typeof m!=='object')return;
  if(!vscode.workspace.isTrusted){state.error=t('Trust this workspace to use development tools.');post();return;}
  if(m.action==='cancel'){controller?.abort();return;}
  if(m.action==='ready'){post();if(state.mode==='environment')await run('Checking environment…',doctor);else if(state.mode==='install')await run('Reading serial ports…',ports);return;}
  if(state.busy||dialogPending||disposed)return;
  if(m.action==='doctor')return run('Checking environment…',doctor);
  if(m.action==='ports')return run('Reading serial ports…',ports);
  if(m.action==='toolchain-actions'){const picked=await dialog(()=>vscode.window.showQuickPick([{label:t('Find toolchain…'),action:'find'},{label:t('Toolchain setup guide'),action:'guide'}],{placeHolder:t('More actions')}));if(picked)return action({action:picked.action});return;}
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
  const dependencies={'dependencies':['pyserial','Pillow','CairoSVG'],'dependencies-serial':['pyserial'],'dependencies-png':['Pillow'],'dependencies-svg':['CairoSVG']};
  if(dependencies[m.action])return run('Installing Python dependencies…',async o=>{await core.run(o.python||process.env.DESKTILE_PYTHON||'python',['-m','pip','install',...dependencies[m.action]],o);await doctor(o);state.message=t('Python dependencies installed.');});
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
 if(extra.message)state.error=t(extra.message);
 return {post,receive:m=>Promise.resolve().then(()=>action(m)).catch(setError),show(changes){if(changes.retry){retry=changes.retry;state.retry=true;}if(changes.message)state.error=errorText(changes.message);post();},dispose(){disposed=true;controller?.abort();}};
}
module.exports={open,html,environmentRows,packageSummary,createController};
