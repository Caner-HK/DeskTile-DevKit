'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('./core'),assets=require('./assets'),{t}=require('./i18n'),{commonCss}=require('./panel-ui'),{selectScript}=require('./select-control');
const panels=new Map(),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(nonce){
 const l=s=>escape(t(s));
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
${commonCss}
main{display:grid;grid-template-columns:minmax(280px,380px) minmax(280px,1fr);gap:32px;padding:24px;max-width:1280px}form{display:grid;gap:18px;align-content:start}.field label{display:block;margin-bottom:6px;font-weight:600}input,select{height:26px;width:100%;min-width:0}.input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.actions,.preview-head{display:flex;gap:8px;align-items:center}.preview-head{justify-content:space-between;margin-bottom:12px}.preview-head h2{font-size:14px;margin:0}.preview-head .dt-select{width:100px}.previews{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;min-width:0}figcaption{margin-bottom:6px}.surface{height:220px;display:flex;justify-content:center;align-items:center;overflow:auto}.light{background:#f7f7f7}.dark{background:#111}.surface img{display:block;max-width:100%;height:auto}#dimensions{color:var(--vscode-descriptionForeground,#999)}.usage{margin-top:24px}.usage-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.usage-head label{font-weight:600}textarea{width:100%;min-height:90px;resize:vertical;border:1px solid var(--vscode-input-border,#454545);border-radius:0;padding:8px;background:var(--vscode-input-background,#313131);color:var(--vscode-input-foreground,#ccc);font:13px var(--vscode-editor-font-family,monospace)}footer{padding:12px 24px;color:var(--vscode-descriptionForeground,#999)}footer.error{color:var(--vscode-errorForeground,#f88)}[hidden]{display:none!important}@media(max-width:760px){main{grid-template-columns:1fr;gap:24px}}@media(max-width:420px){.previews{grid-template-columns:1fr}}

.tabs{display:flex;gap:20px;padding:8px 24px 0;border-bottom:1px solid var(--vscode-panel-border,#444)}.tabs button{height:26px;background:transparent;border:0;border-bottom:2px solid transparent;font:inherit;padding:0 0 6px;color:var(--vscode-descriptionForeground,#999)}.tabs button[aria-selected=true]{color:var(--vscode-foreground,#ccc);border-bottom-color:var(--vscode-focusBorder,#0078d4)}
</style></head><body><header><h1>${l('Import resources')}</h1></header><div class="tabs" role="tablist" aria-label="${l('Resource type')}"><button id="tab-icon" role="tab" aria-selected="true" aria-controls="import-content" tabindex="0">${l('Import icon')}</button><button id="tab-image" role="tab" aria-selected="false" aria-controls="import-content" tabindex="-1">${l('Import image')}</button></div><main id="import-content" role="tabpanel" aria-labelledby="tab-icon"><form id="icon-form">
<div class="field"><label for="source">${l('Source image')}</label><div class="input-row"><input id="source" readonly placeholder="${l('Choose an SVG, PNG or other image…')}"><button type="button" id="choose">${l('Browse…')}</button></div></div>
<div class="field"><label for="output">${l('Resource path')}</label><input id="output" value="assets/icon.dti" spellcheck="false" required></div>
<div class="pair"><div class="field"><label for="width">${l('Maximum width')}</label><input id="width" type="number" min="1" max="4096" value="40" required></div><div class="field"><label for="height">${l('Maximum height')}</label><input id="height" type="number" min="1" max="4096" value="40" required></div></div>
<div class="actions"><button type="submit" class="primary" id="save" disabled>${l('Save to project')}</button><button type="button" id="preview">${l('Preview')}</button><button type="button" id="cancel" hidden>${l('Cancel')}</button></div>
</form><section><div class="preview-head"><h2>${l('Preview')}</h2><select id="zoom" aria-label="${l('Zoom')}"><option value="1">100%</option><option value="2">200%</option><option value="4">400%</option></select></div><div class="previews"><figure><figcaption>${l('Light')}</figcaption><div class="surface light"><img id="light" alt="${l('Light')}" hidden></div></figure><figure><figcaption>${l('Dark')}</figcaption><div class="surface dark"><img id="dark" alt="${l('Dark')}" hidden></div></figure></div><p id="dimensions"></p><div class="usage" id="usage" hidden><div class="usage-head"><label for="markup">${l('Image markup')}</label><button id="copy" disabled>${l('Copy')}</button></div><textarea id="markup" readonly spellcheck="false"></textarea></div></section></main><footer id="status" role="status" hidden></footer>
<script nonce="${nonce}">${selectScript}
const api=acquireVsCodeApi(),by=id=>document.getElementById(id);let state={busy:false,kind:'icon',values:{output:'assets/icon.dti',width:40,height:40}},stale=true;
const values=()=>Object.fromEntries(['output','width','height'].map(id=>[id,by(id).value]));
function zoom(){for(const id of ['light','dark'])by(id).style.width=(state.preview?.width||40)*Number(by('zoom').value)+'px';}
function invalid(){stale=true;by('save').disabled=state.busy||!state.source;by('copy').disabled=true;by('usage').hidden=true;for(const id of ['light','dark'])by(id).hidden=true;by('dimensions').textContent='';by('status').hidden=true;}
for(const id of ['output','width','height'])for(const type of ['input','change'])by(id).addEventListener(type,invalid);
function send(action){api.postMessage({action,kind:state.kind,values:values()});}
for(const kind of ['icon','image']){const tab=by('tab-'+kind);tab.onclick=()=>api.postMessage({action:'tab',kind,values:values()});tab.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?'icon':e.key==='End'?'image':kind==='icon'?'image':'icon';by('tab-'+target).click();by('tab-'+target).focus();}};}
by('zoom').onchange=zoom;by('choose').onclick=()=>send('choose');
by('icon-form').onsubmit=e=>{e.preventDefault();send('save');};
by('preview').onclick=()=>{if(by('icon-form').reportValidity())send('preview');};
by('copy').onclick=()=>api.postMessage({action:'copy'});by('cancel').onclick=()=>api.postMessage({action:'cancel'});
window.addEventListener('message',e=>{state=e.data;for(const kind of ['icon','image']){by('tab-'+kind).setAttribute('aria-selected',String(state.kind===kind));by('tab-'+kind).tabIndex=state.kind===kind?0:-1;by('tab-'+kind).disabled=state.busy;}by('import-content').setAttribute('aria-labelledby','tab-'+state.kind);for(const id of ['width','height']){by(id).required=state.kind==='icon';by(id).placeholder=state.kind==='image'?${JSON.stringify(t('Original size'))}:'';}by('source').value=state.source||'';for(const id of ['output','width','height'])by(id).value=state.values[id]??'';for(const node of document.querySelectorAll('form input,form select,form button'))node.disabled=state.busy;by('preview').disabled=state.busy||!state.source;stale=!state.preview;by('save').disabled=state.busy||!state.source;by('cancel').hidden=!state.busy;by('cancel').disabled=false;by('status').hidden=!(state.error||state.message);by('status').textContent=state.error||state.message||'';by('status').className=state.error?'error':'';by('usage').hidden=stale;by('copy').disabled=state.busy||!state.saved;by('markup').value=state.markup||'';for(const id of ['light','dark']){by(id).hidden=stale;if(state.preview)by(id).src=state.preview[id];}by('dimensions').textContent=state.preview?state.preview.width+' × '+state.preview.height+' px':'';zoom();window.desktileSelects.refresh();});
api.postMessage({action:'ready'});
</script></body></html>`;
}
function open(vscode,context,directory,options){
 const root=core.project(directory).root;if(panels.has(root)){panels.get(root).reveal();return panels.get(root);}
 const panel=vscode.window.createWebviewPanel('desktile.interfaceIcons',t('Import resources'),vscode.ViewColumn.Active,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[]});panels.set(root,panel);
 const records=Object.fromEntries(['icon','image'].map(kind=>[kind,{state:{kind,source:'',values:{output:'assets/'+(kind==='icon'?'icon':'image')+'.dti',width:kind==='icon'?40:'',height:kind==='icon'?40:''},busy:false,error:'',message:'',preview:null,markup:'',saved:false},draft:null,key:''}]));
 let active='icon',current=records.icon,state=current.state,disposed=false,picking=false,controller;
 const post=()=>{if(!disposed)panel.webview.postMessage(structuredClone(state));};
 const discard=(record=current)=>{if(record.draft){fs.rmSync(record.draft.draft,{recursive:true,force:true});record.draft=null;}record.state.preview=null;record.state.saved=false;record.state.markup='';record.key='';};
 const normalize=v=>({output:typeof v?.output==='string'?v.output.trim():'',...Object.fromEntries(['width','height'].map(key=>[key,active==='image'&&(v?.[key]===''||v?.[key]===undefined)?'':Number(v?.[key])]))});
 const fingerprint=v=>JSON.stringify([state.source,v]);
 const messages={ASSET_OUTPUT:'Output must be a .dti file inside the project assets directory.',ASSET_SOURCE:'Choose PNG, JPEG, WebP, SVG or DTI.',ASSET_SIZE:'Dimensions must be 1–4096 pixels.'};
 async function prepare(signal){
  discard();const dimensions=Object.fromEntries(Object.entries(state.values).filter(([key,value])=>key==='output'||value!==''));
  const next=await assets.convertImage(root,state.source,{...options(),...dimensions,mode:active==='icon'?'system':'custom',draftOnly:true,signal});
  if(disposed||signal.aborted){fs.rmSync(next.draft,{recursive:true,force:true});return false;}
  current.draft=next;current.key=fingerprint(state.values);state.preview={width:next.width,height:next.height,...Object.fromEntries(['light','dark'].map(theme=>[theme,'data:image/png;base64,'+fs.readFileSync(next[theme]).toString('base64')]))};
  state.markup='<dt-image resource="'+escape(next.resource)+'" width="'+next.width+'" height="'+next.height+'"/>';return true;
 }
 async function receive(m){
  if(disposed||!m||typeof m!=='object')return;
  if(!vscode.workspace.isTrusted){state.error=t('Trust this workspace to use development tools.');post();return;}
  if(m.action==='ready'){post();return;}if(m.action==='cancel'){controller?.abort();return;}if(state.busy||picking)return;
  if(m.action==='tab'){
   if(!records[m.kind]||m.kind===active)return;
   if(m.values){state.values=normalize(m.values);if(current.key!==fingerprint(state.values))discard();}
   active=m.kind;current=records[active];state=current.state;post();return;
  }
  if(m.kind&&m.kind!==active)return;
  if(m.action==='copy'){if(state.saved)await vscode.env.clipboard.writeText(state.markup);return;}
  if(m.action==='choose'){
   picking=true;try{const choice=await vscode.window.showOpenDialog({canSelectMany:false,filters:{[t(active==='icon'?'Icon images':'Image files')]:['svg','png','jpg','jpeg','webp','dti']},openLabel:t('Use image')});if(choice&&!disposed){discard();state.source=choice[0].fsPath;state.values=normalize(m.values||state.values);state.values.output='assets/'+path.basename(state.source,path.extname(state.source)).replace(/[^A-Za-z0-9_-]/g,'_')+'.dti';state.error='';state.message='';post();}}finally{picking=false;}return;
  }
  if(!['preview','save'].includes(m.action))return;state.values=normalize(m.values);state.error='';state.message='';
  if(!state.source){state.error=t('Choose an SVG, PNG or other image…');post();return;}
  const job=new AbortController();controller=job;state.busy=true;post();
  try{
   if(m.action==='preview'||!current.draft||current.key!==fingerprint(state.values)){if(!await prepare(job.signal))return;}
   if(m.action==='save'){
    let replace=false;const draft=current.draft;
    if(fs.existsSync(draft.output)){picking=true;try{replace=await vscode.window.showWarningMessage(t(active==='icon'?'Replace the existing icon resource?':'Replace the existing image resource?'),{modal:true},t('Replace'))===t('Replace');}finally{picking=false;}if(!replace||disposed||job.signal.aborted)return;}
    assets.saveImage(draft,{replace});state.saved=true;state.message=t(active==='icon'?'Icon resource saved.':'Image resource saved.');
   }
  }catch(error){if(!core.isCancellation(error)){options().log?.((error.stack||error.message)+'\n');state.error=t(messages[error.code]||'Image conversion failed. See the DeskTile output for details.');}else state.message=t('Operation cancelled.');}
  finally{controller=null;state.busy=false;post();}
 }
 panel.webview.html=html(crypto.randomBytes(16).toString('hex'));
 panel.webview.onDidReceiveMessage(m=>receive(m).catch(error=>{state.error=t(error.message);state.busy=false;post();}));
 panel.onDidDispose(()=>{disposed=true;controller?.abort();for(const record of Object.values(records))discard(record);panels.delete(root);});context.subscriptions.push(panel);return panel;
}
module.exports={open,html};

