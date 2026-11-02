'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const i18n=require('../lib/i18n'),kit=path.resolve(__dirname,'..'),chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browserChecks=function browserChecks(){
window.addEventListener('error',e=>{document.body.dataset.selectFailure=e.message;});
const run=async()=>{
const assert=(value,message)=>{if(!value)throw Error(message);},tick=()=>new Promise(r=>setTimeout(r,0));
await tick();const select=document.getElementById(fixture.select),trigger=select.parentElement.querySelector('.dt-select-trigger');
assert(trigger,'Shared select is missing');assert(select.hidden,'Native select remains visible');assert(trigger.getAttribute('role')==='combobox','Missing combobox semantics');
let changes=0;select.addEventListener('change',()=>changes++);
trigger.click();await tick();let popup=document.querySelector('.dt-select-popup');assert(popup,'Popup did not open');
const anchor=trigger.getBoundingClientRect(),bounds=popup.getBoundingClientRect();assert(Math.abs(anchor.width-bounds.width)<.1,'Popup width differs from field');assert(getComputedStyle(popup).borderRadius==='0px','Popup must be square');assert(getComputedStyle(trigger).fontSize===getComputedStyle(popup).fontSize,'Field and popup fonts differ');
const selected=select.selectedIndex;const selectedRow=popup.querySelector('[aria-selected="true"]');assert(getComputedStyle(selectedRow).backgroundColor==='rgb(0, 120, 212)','Selected row is not primary blue');assert(getComputedStyle(selectedRow).color==='rgb(255, 255, 255)','Selected row text is not white');const rows=[...popup.children];assert(rows.length===select.options.length,'Missing options');assert(rows.filter(r=>r.getAttribute('aria-selected')==='true').length===1,'Selected state is ambiguous');
for(let i=0;i<rows.length;i++){assert(rows[i].textContent===select.options[i].label,'Option label was shortened');assert(rows[i].getBoundingClientRect().height===26,'Incorrect option height');assert(rows[i].scrollWidth<=rows[i].clientWidth,'Option text is clipped: '+rows[i].textContent);assert(getComputedStyle(rows[i]).paddingLeft==='8px','Unexpected checkmark gutter');}
rows[1].click();await tick();assert(select.selectedIndex===1,'Mouse selection failed');assert(changes===1,'Change event count is wrong');assert(!document.querySelector('.dt-select-popup'),'Popup stayed open');assert(trigger.textContent===select.options[1].label,'Field did not update');
trigger.click();trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await tick();assert(select.selectedIndex===0,'Keyboard selection failed');
trigger.click();trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(select.selectedIndex===0,'Escape changed selection');assert(!document.querySelector('.dt-select-popup'),'Escape did not close');
trigger.click();document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));assert(!document.querySelector('.dt-select-popup'),'Outside pointer did not close');
select.disabled=true;await tick();assert(trigger.disabled,'Disabled state was lost');select.disabled=false;await tick();assert(!trigger.disabled,'Enabled state was lost');
const extra=document.createElement('option');extra.value='extra';extra.textContent='Extra option';select.append(extra);select.value='extra';window.desktileSelects.refresh();await tick();assert(trigger.textContent==='Extra option','Refreshed option was not selected');select.removeChild(extra);select.selectedIndex=selected;window.desktileSelects.refresh();await tick();trigger.click();await tick();popup=document.querySelector('.dt-select-popup');
document.body.dataset.selectResult=JSON.stringify({ok:true,select:fixture.select,width:popup.getBoundingClientRect().width,anchorWidth:trigger.getBoundingClientRect().width,labels:[...popup.children].map(r=>r.textContent),changes,nativeSelects:[...document.querySelectorAll('select')].filter(s=>!s.hidden).length});
};
setTimeout(()=>run().catch(error=>{document.body.dataset.selectResult=JSON.stringify({ok:false,error:error.message});}),50);
};
test('all webview dropdowns use the shared popup, preserve events and fit full text in both themes and languages',{skip:!fs.existsSync(chrome),timeout:180000},()=>{
const out=path.join(kit,'build/select-control-tests');fs.mkdirSync(out,{recursive:true});
const cases=[['create','kind'],['asset','mode'],['asset','theme'],['install','port']];
for(const language of ['en','zh-cn'])for(const theme of ['light','dark'])for(const [kind,select] of cases){
i18n.configure(language);const module=kind==='create'?require('../lib/create-panel'):kind==='asset'?require('../lib/asset-panel'):require('../lib/workflow-panel');
let html=module.html('test',kind==='install'?'install':undefined);
const fixture={select,kind,mode:'install',parent:'C:/Projects',separator:'/',busy:false,ports:[{port:'COM4',description:'DeskTile'},{port:'COM7',description:'DeskTile'}],rows:[],summary:[],files:[],file:'',items:{},images:{},name:'DeskTile',message:'',error:'',dirty:false};
const colors=theme==='dark'?'--vscode-foreground:#ccc;--vscode-editor-background:#1f1f1f;--vscode-input-background:#313131;--vscode-input-foreground:#ccc;--vscode-input-border:#454545;--vscode-dropdown-border:#454545;--vscode-list-hoverBackground:#2a2d2e;--vscode-list-inactiveSelectionBackground:#37373d':'--vscode-foreground:#333;--vscode-editor-background:#fff;--vscode-input-background:#fff;--vscode-input-foreground:#333;--vscode-input-border:#cecece;--vscode-dropdown-border:#cecece;--vscode-list-hoverBackground:#e8e8e8;--vscode-list-inactiveSelectionBackground:#e4e6f1';
html=html.replace('</head>','<style nonce="test">body{'+colors+';--vscode-font-family:Segoe UI,sans-serif}</style></head>');
const bootstrap='const fixture='+JSON.stringify(fixture)+';window.acquireVsCodeApi=()=>({postMessage(m){if(m.action==="ready"||m.type==="ready")setTimeout(()=>window.dispatchEvent(new MessageEvent("message",{data:fixture})),0);}});';
html=html.replace('<script nonce="test">','<script nonce="test">'+bootstrap+'</script><script nonce="test">');
html=html.replace('</body>','<script nonce="test">('+browserChecks.toString()+')();</script></body>');
const name=kind+'-'+select+'-'+theme+'-'+language,file=path.join(out,name+'.html');fs.writeFileSync(file,html);
const result=spawnSync(chrome,['--headless','--disable-gpu','--no-sandbox','--no-first-run','--user-data-dir='+path.join(out,'profile-'+name),'--window-size=1000,900','--virtual-time-budget=2500','--dump-dom','--screenshot='+path.join(out,name+'.png'),'file:///'+file.replace(/\\/g,'/')],{encoding:'utf8',timeout:20000});
assert.equal(result.status,0,result.stderr);const match=result.stdout.match(/data-select-result="([^"]*)"/);assert.ok(match,name+': browser test did not finish '+result.stdout.slice(-1000));const data=JSON.parse(match[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));assert.equal(data.ok,true,name+': '+data.error);assert.equal(data.nativeSelects,0,name+': native select remained');assert.equal(data.width,data.anchorWidth);console.log(name+' passed');
}
i18n.configure('en');
});
