'use strict';
const {t}=require('./i18n');
function markup(){
 const escape=s=>String(t(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<div class="check-toolbar"><button type="button" class="primary" id="env-check" data-environment="doctor">${escape('Check environment')}</button><button type="button" id="env-cancel" data-environment="cancel" hidden>${escape('Cancel')}</button><button type="button" id="env-retry" data-environment="retry" hidden>${escape('Retry build')}</button></div><div id="env-checks" aria-label="${escape('Environment')}"></div><div id="env-result" hidden><div class="env-result-line"><p id="env-status" role="status" aria-live="polite"></p></div><progress id="env-progress" hidden></progress></div>`;
}
const css=`
.check-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.check-toolbar+#env-checks{margin-top:12px}
.env-check{display:grid;grid-template-columns:140px minmax(0,1fr) 70px 180px;gap:16px;align-items:center;padding:16px 0;border-bottom:1px solid var(--vscode-panel-border,#444)}
.env-name{font-weight:600}.env-name,.env-value,.env-state{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.env-state{color:var(--vscode-descriptionForeground,#9d9d9d)}
.env-actions{display:flex;gap:8px;justify-content:flex-end}.env-actions button{min-width:0;overflow:hidden;text-overflow:ellipsis}.env-actions .more{width:26px;flex:0 0 26px}
#env-result{padding-top:16px}.env-result-line{display:flex;gap:16px;align-items:flex-start;justify-content:space-between}
#env-status{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}#env-status.error{color:var(--vscode-errorForeground,#f48771)}
#env-progress{display:block;width:100%;height:4px;margin-top:12px;accent-color:var(--vscode-progressBar-background,#0078d4)}
@media(max-width:650px){.env-check{grid-template-columns:125px minmax(0,1fr) 70px 164px;gap:8px}}
@media(max-width:450px){.env-check{grid-template-columns:72px minmax(0,1fr) 40px 114px;gap:8px}}
`;
const script=`
let environmentState={busy:false,rows:[]},environmentKey='';
function drawEnvironment(){
 const state=environmentState,by=id=>document.getElementById('env-'+id),key=JSON.stringify(state.rows||[]);
 if(key!==environmentKey){environmentKey=key;by('checks').replaceChildren();for(const row of state.rows||[]){
  const item=document.createElement('div');item.className='env-check';
  for(const [name,text] of [['name',row.name],['value',row.value],['state',row.status]]){const cell=document.createElement('div');cell.className='env-'+name;cell.textContent=String(text||'').replace(/\\n/g,' ');cell.title=text;item.append(cell);}
  const actions=document.createElement('div');actions.className='env-actions';
  for(const action of row.actions||[]){const button=document.createElement('button');button.type='button';button.dataset.environment=action.id;button.textContent=action.label;button.title=action.title||action.label;button.setAttribute('aria-label',button.title);if(action.id==='toolchain-actions')button.className='more';actions.append(button);}
  item.append(actions);by('checks').append(item);
 }}
 for(const button of document.querySelectorAll('[data-environment]'))button.disabled=(state.busy||settingsBusy)&&button.dataset.environment!=='cancel';
 by('retry').hidden=!state.retry;by('result').hidden=!(state.busy||state.error||state.message);by('status').textContent=state.error||state.message||'';by('status').classList.toggle('error',!!state.error);by('cancel').hidden=!state.busy;by('progress').hidden=!state.busy;
}
document.addEventListener('click',event=>{const button=event.target.closest('button[data-environment]');if(button&&!button.disabled)api.postMessage({action:'environment',operation:button.dataset.environment});});
`;
module.exports={markup,css,script};

