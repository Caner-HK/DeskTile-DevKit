'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),core=require('./core');
const {commonCss}=require('./panel-ui'),{selectScript}=require('./select-control'),{t,getLanguage}=require('./i18n');
const pkg=require('../package.json');
const environmentView=require('./environment-view');
const updates=require('./updates');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active;
function html(nonce){
 const label=s=>escape(t(s));
 return `<!doctype html><html lang="${getLanguage()==='zh-cn'?'zh-CN':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
${commonCss}
${environmentView.css}
main{max-width:900px;padding:24px}.rows{display:grid;gap:20px}.field{display:grid;grid-template-columns:150px minmax(0,1fr);gap:20px;align-items:center}label,.field-name{font-weight:600}input,select{width:100%;min-width:0}.input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.action-row{display:flex;justify-content:flex-end}.select-row{max-width:360px;width:100%}dl{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px 20px;margin:0}dt{color:var(--vscode-descriptionForeground,#9d9d9d)}dd{margin:0;overflow-wrap:anywhere}#error{margin:20px 0 0;color:var(--vscode-errorForeground,#f48771);white-space:pre-wrap;overflow-wrap:anywhere}[hidden]{display:none!important}@media(max-width:550px){.field{grid-template-columns:1fr;gap:8px}.select-row{max-width:none}dl{grid-template-columns:110px minmax(0,1fr);gap:12px}}
.setting-content{max-width:640px}.setting-content h2{margin:0 0 12px;font-size:14px;font-weight:600}.setting-description{margin:0 0 16px;color:var(--vscode-descriptionForeground,#9d9d9d);line-height:1.6}.setting-content dl{grid-template-columns:120px minmax(0,1fr);gap:8px 20px;margin:0 0 16px}
#update-result{margin-top:16px}#update-status{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}#update-status.error{color:var(--vscode-errorForeground,#f48771)}#update-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#update-actions:empty{display:none}#update-progress{display:block;width:100%;height:4px;margin-top:12px;accent-color:var(--vscode-progressBar-background,#0078d4)}
.tabs{display:flex;gap:20px;padding:8px 24px 0;border-bottom:1px solid var(--vscode-panel-border,#444);overflow-x:auto;flex-wrap:nowrap}.tabs button{height:26px;background:transparent;border:0;border-bottom:2px solid transparent;font:inherit;padding:0 0 6px;color:var(--vscode-descriptionForeground,#999);flex:0 0 auto}.tabs button[aria-selected=true]{color:var(--vscode-foreground,#ccc);border-bottom-color:var(--vscode-focusBorder,#0078d4)}
</style></head><body><header><h1>${label('Settings')}</h1></header><div class="tabs" role="tablist" aria-label="${label('Settings')}">
<button id="tab-sdk" role="tab" aria-selected="true" aria-controls="panel-sdk" tabindex="0">SDK</button>
<button id="tab-environment" role="tab" aria-selected="false" aria-controls="panel-environment" tabindex="-1">${label('Development environment')}</button>
<button id="tab-updates" role="tab" aria-selected="false" aria-controls="panel-updates" tabindex="-1">${label('Updates')}</button>
<button id="tab-interface" role="tab" aria-selected="false" aria-controls="panel-interface" tabindex="-1">${label('Interface')}</button>
<button id="tab-about" role="tab" aria-selected="false" aria-controls="panel-about" tabindex="-1">${label('About')}</button>
</div><main>
<section id="panel-sdk" role="tabpanel" aria-labelledby="tab-sdk"><div class="rows">
<div class="field"><label for="sdk-path">SDK</label><div class="input-row"><input id="sdk-path" readonly><button type="button" id="sdk">${label('Select SDK…')}</button></div></div>
</div></section>
<section id="panel-environment" role="tabpanel" aria-labelledby="tab-environment" hidden>
${environmentView.markup()}
</section>
<section id="panel-updates" role="tabpanel" aria-labelledby="tab-updates" hidden>
<div class="setting-content"><h2>DeskTile DevKit</h2><dl><dt>${label('Current version')}</dt><dd>${escape(pkg.version)}</dd><dt>SDK</dt><dd id="update-sdk-version"></dd><dt>${label('Tool revision')}</dt><dd>${escape(pkg.desktileSdk.toolRevision)}</dd></dl><p class="setting-description">${label('Check GitHub for a DevKit release compatible with the selected SDK.')}</p><div class="check-toolbar"><button type="button" class="primary" id="updates">${label('Check for updates')}</button><button type="button" id="update-cancel" hidden>${label('Cancel')}</button></div><div id="update-result" hidden><p id="update-status" role="status" aria-live="polite"></p><progress id="update-progress" hidden></progress><div id="update-actions"></div></div></div>
</section>
<section id="panel-interface" role="tabpanel" aria-labelledby="tab-interface" hidden><div class="rows">
<div class="field"><label for="language">${label('Interface language')}</label><div class="select-row"><select id="language"><option value="auto">${label('Follow VS Code')}</option><option value="zh-cn">简体中文</option><option value="en">English</option></select></div></div>
<div class="field"><label for="location">${label('Toolbox location')}</label><div class="select-row"><select id="location"><option value="activitybar">${label('Activity Bar')}</option><option value="explorer">${label('Explorer')}</option></select></div></div>
</div></section>
<section id="panel-about" role="tabpanel" aria-labelledby="tab-about" hidden><dl><dt>${label('Product')}</dt><dd>DeskTile DevKit</dd><dt>${label('Version')}</dt><dd>${escape(pkg.version)}</dd><dt>SDK</dt><dd id="sdk-version"></dd><dt>${label('Tool revision')}</dt><dd>${escape(pkg.desktileSdk.toolRevision)}</dd><dt>${label('Publisher')}</dt><dd id="publisher">Caner HK</dd><dt>${label('License')}</dt><dd>${escape(pkg.license)}</dd></dl></section>
<p id="error" role="alert" hidden></p></main><script nonce="${nonce}">${selectScript}
const api=acquireVsCodeApi(),by=id=>document.getElementById(id);
let settingsBusy=false;
${environmentView.script}
const tabs=['sdk','environment','updates','interface','about'];
function selectTab(key,focus=false){if(!tabs.includes(key))key='sdk';window.desktileSelects.close();for(const name of tabs){const tab=by('tab-'+name),selected=name===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;by('panel-'+name).hidden=!selected;}api.setState?.({tab:key});if(focus){by('tab-'+key).focus();by('tab-'+key).scrollIntoView({block:'nearest',inline:'nearest'});}}
for(const [index,key] of tabs.entries()){const tab=by('tab-'+key);tab.onclick=()=>selectTab(key);tab.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowLeft'?-1:1)+tabs.length)%tabs.length;selectTab(tabs[next],true);};}
selectTab(api.getState?.()?.tab);
for(const action of ['sdk','updates'])by(action).onclick=()=>api.postMessage({action});
by('update-cancel').onclick=()=>api.postMessage({action:'update-cancel'});
function drawUpdates(state){
 by('update-result').hidden=!state.message;by('update-status').textContent=state.message;by('update-status').classList.toggle('error',!!state.error);by('update-progress').hidden=!state.busy;by('update-cancel').hidden=!state.busy;by('update-cancel').disabled=false;
 by('update-actions').replaceChildren();for(const action of state.actions){const button=document.createElement('button');button.type='button';button.textContent=action.label;button.disabled=settingsBusy;button.onclick=()=>api.postMessage({action:'update-open',value:action.id});by('update-actions').append(button);}
}
for(const action of ['language','location'])by(action).onchange=()=>api.postMessage({action,value:by(action).value});
window.addEventListener('message',event=>{const state=event.data;if(state.environment){environmentState=state.environment;drawEnvironment();return;}if(state.tab){selectTab(state.tab);return;}settingsBusy=state.busy;by('sdk-path').value=state.sdk;by('sdk-path').title=state.sdk;for(const id of ['sdk-version','update-sdk-version'])by(id).textContent=state.sdkVersion;for(const id of ['language','location'])by(id).value=state[id];for(const control of document.querySelectorAll('button:not([role=tab]):not([data-environment]),select'))control.disabled=state.busy;drawEnvironment();drawUpdates(state.updates);by('error').hidden=!state.error;by('error').textContent=state.error||'';window.desktileSelects.refresh();});
api.postMessage({action:'ready'});
</script></body></html>`;
}
function open(vscode,context,options,extra={}){
 if(active){active.show(extra);return active.panel;}
 const panel=vscode.window.createWebviewPanel('desktile.settings',t('DeskTile DevKit Settings'),vscode.ViewColumn.Active,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[]});
 let disposed=false,busy=false,error='',ready=false,pendingTab=extra.tab,pendingCheck=extra.check,environmentBusy=false,pendingUpdate=extra.checkUpdates,updateController,updateResult,updateError='',updateCancelled=false;
 function updateSnapshot(){const view=updateResult?updates.describe(updateResult):{message:'',actions:[]};return {busy:!!updateController,error:!!updateError,message:updateController?t('Checking for DeskTile updates'):updateError||(updateCancelled?t('Operation cancelled.'):view.message),actions:updateController||updateCancelled?[]:updateError?[{id:'releases',label:t('Open releases')}]:view.actions.map(({id,label})=>({id,label}))};}
 const environment=require('./workflow-panel').createController(vscode,'environment',options,extra,state=>{environmentBusy=state.busy;if(!disposed&&ready){panel.webview.postMessage({environment:state});post();}});
 function snapshot(){const config=vscode.workspace.getConfiguration('desktile');let sdk=config.get('sdkPath','')||path.join(core.ROOT,'sdk-bundle'),sdkVersion='';try{sdk=core.sdkRoot(options());sdkVersion=JSON.parse(fs.readFileSync(path.join(sdk,'delivery-manifest.json'),'utf8')).sdk;}catch(e){sdkVersion=t('Unavailable');}return {sdk,sdkVersion,language:config.get('language','auto'),location:config.get('toolsLocation','activitybar'),busy,error};}
 const post=()=>{if(!disposed&&ready)panel.webview.postMessage({...snapshot(),busy:busy||environmentBusy||!!updateController,updates:updateSnapshot()});};
 async function checkUpdates(){
  if(disposed||busy||environmentBusy||updateController)return;
  if(!vscode.workspace.isTrusted){error=t('Trust this workspace to use development tools.');post();return;}
  const current=new AbortController();updateController=current;updateResult=undefined;updateError='';updateCancelled=false;error='';post();
  try{const sdk=JSON.parse(fs.readFileSync(path.join(core.sdkRoot(options()),'delivery-manifest.json'),'utf8')).sdk;updateResult=await updates.check({signal:current.signal,installed:{version:pkg.version,toolRevision:pkg.desktileSdk.toolRevision,sdk}});}
  catch(e){if(current.signal.aborted||core.isCancellation(e))updateCancelled=true;else{updateError=t(e.message||String(e));options().log?.(String(e.message||e)+'\n');}}
  finally{if(updateController===current)updateController=undefined;post();}
 }
 const render=()=>{ready=false;panel.title=t('DeskTile DevKit Settings');panel.webview.html=html(crypto.randomBytes(16).toString('hex'));};
 const show=changes=>{environment.show(changes);panel.reveal();if(changes.tab){pendingTab=changes.tab;if(ready){panel.webview.postMessage({tab:pendingTab});pendingTab=undefined;}}if(changes.check&&!updateController){if(ready)void environment.receive({action:'doctor'});else pendingCheck=true;}if(changes.checkUpdates){if(ready)void checkUpdates();else pendingUpdate=true;}};
 active={panel,show};
 async function receive(message){
  if(disposed||!message||typeof message!=='object')return;
  if(message.action==='ready'){ready=true;post();environment.post();if(pendingTab){panel.webview.postMessage({tab:pendingTab});pendingTab=undefined;}if(pendingCheck){pendingCheck=false;await environment.receive({action:'doctor'});}if(pendingUpdate){pendingUpdate=false;await checkUpdates();}return;}
  if(message.action==='update-cancel'){updateController?.abort();return;}
  if(updateController)return;
  if(message.action==='updates')return checkUpdates();
  if(message.action==='environment'){
   if(busy)return;
   if(['doctor','sdk','python','compiler','toolchain-actions','dependencies-serial','dependencies-png','dependencies-svg','retry','cancel'].includes(message.operation))return environment.receive({action:message.operation});
   return;
  }
  if(environmentBusy)return;
  if(busy)return;
  if(!vscode.workspace.isTrusted){error=t('Trust this workspace to use development tools.');post();return;}
  const {action,value}=message;
  if(action==='update-open'){
   const link=updateResult?updates.describe(updateResult).actions.find(item=>item.id===value)?.url:updateError&&value==='releases'?'https://github.com/Caner-HK/DeskTile-DevKit/releases':undefined;
   if(link)await vscode.env.openExternal(vscode.Uri.parse(link));return;
  }
  if(!['sdk','language','location'].includes(action))return;
  if(action==='language'&&!['auto','zh-cn','en'].includes(value))return;
  if(action==='location'&&!['activitybar','explorer'].includes(value))return;
  busy=true;error='';post();
  try{
   if(action==='location'){
    await vscode.workspace.getConfiguration('desktile').update('toolsLocation',value,vscode.ConfigurationTarget.Global);
    await vscode.commands.executeCommand(value==='explorer'?'desktile.explorer.focus':'desktile.project.focus');
   }else await vscode.commands.executeCommand('desktile.'+action,...(action==='language'?[value]:[]));
  }catch(e){error=t(e.message||String(e));}finally{busy=false;post();}
 }
 render();
 const messages=panel.webview.onDidReceiveMessage(receive);
 const changes=vscode.workspace.onDidChangeConfiguration(event=>{if(event.affectsConfiguration('desktile.sdkPath')){updateController?.abort();updateResult=undefined;updateError='';updateCancelled=false;}if(event.affectsConfiguration('desktile.language'))render();else if(event.affectsConfiguration('desktile'))post();});
 panel.onDidDispose(()=>{disposed=true;updateController?.abort();environment.dispose();messages.dispose();changes.dispose();if(active?.panel===panel)active=undefined;});
 context.subscriptions.push(panel);return panel;
}
module.exports={open,html};
