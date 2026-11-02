'use strict';
// Executed by the VS Code extension test host, not by node --test.
async function run(){
 const vscode=require('vscode'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const ext=vscode.extensions.getExtension('caner.desktile-devkit');assert.ok(ext,'Extension is discoverable');await ext.activate();assert.ok(ext.isActive);
 const commands=await vscode.commands.getCommands(true);
 assert.ok(commands.includes('workbench.view.extension.desktile'),'Activity Bar entry is registered');
 const location=vscode.workspace.getConfiguration('desktile').get('toolsLocation');
 if(process.env.DESKTILE_EXPECT_LOCATION)assert.equal(location,process.env.DESKTILE_EXPECT_LOCATION,'Saved location survives a window restart');
 await vscode.commands.executeCommand(location==='explorer'?'desktile.explorer.focus':'desktile.project.focus');
 if(process.env.DESKTILE_UI_CDP_PORT)await captureActivityBar(vscode,fs,path);
  for(const id of ['create','doctor','build','check','deploy','docs','sdk','preview','screenshot','assets','monitor','run','updates','settings'])assert.ok(commands.includes('desktile.'+id),id);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'devkit-extension-'));
 try{
  const manifest=path.join(root,'manifest.json');fs.writeFileSync(manifest,JSON.stringify({sdk:{target:'9.0'},runtime:'wrong'}));
  const doc=await vscode.workspace.openTextDocument(manifest);await vscode.window.showTextDocument(doc);
  await new Promise(resolve=>setTimeout(resolve,500));
  const issues=vscode.languages.getDiagnostics(doc.uri);assert.ok(issues.some(d=>d.message.includes('1.0')));assert.ok(issues.some(d=>d.message.includes('runtime')||d.message.includes('native-module')));
  const html=await vscode.workspace.openTextDocument({language:'html',content:'<'});await vscode.window.showTextDocument(html);
  const completions=await vscode.commands.executeCommand('vscode.executeCompletionItemProvider',html.uri,new vscode.Position(0,1),'<');
  assert.ok(completions.items.some(i=>i.label==='dt-button'));
  for(const label of ['dt-scroll','dt-canvas'])assert.ok(completions.items.some(i=>i.label===label));
  for(const label of ['dt-scroll-view','dt-canvas-view'])assert.ok(!completions.items.some(i=>i.label===label));
  for(const [language,content,expected] of [['html','<dt-checkbox checked="','true'],['html','<dt-button button-style="','9'],['javascript','DeskTile.storage','storageWrite'],['javascript','DeskTile.require("ui/','ui/components.js'],['cpp','#include <desktile/','desktile/sdk.h']]){
   const document=await vscode.workspace.openTextDocument({language,content});await vscode.window.showTextDocument(document);
   const list=await vscode.commands.executeCommand('vscode.executeCompletionItemProvider',document.uri,document.positionAt(content.length));assert.ok(list.items.some(i=>(typeof i.label==='string'?i.label:i.label.label)===expected),language+' '+expected);
  }
  console.log('Extension host: commands, diagnostics and real HTML/JavaScript/Native completion passed.');
 }finally{await vscode.commands.executeCommand('workbench.action.closeAllEditors');fs.rmSync(root,{recursive:true,force:true});}
}
module.exports={run};

async function captureActivityBar(vscode,fs,path){
 const pages=await(await fetch('http://127.0.0.1:'+process.env.DESKTILE_UI_CDP_PORT+'/json/list')).json();
 const page=pages.find(item=>item.type==='page'&&item.url.includes('workbench'));
 if(!page)throw new Error('Native workbench debugging target is missing');
 const socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const pending=new Map();socket.onmessage=event=>{const message=JSON.parse(event.data);if(pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}};
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const current=++id;pending.set(current,{resolve,reject});socket.send(JSON.stringify({id:current,method,params,sessionId}));});
 try{
  const evidence={emptyWindow:!vscode.workspace.workspaceFolders,themes:[]};
  const config=vscode.workspace.getConfiguration('desktile');
  const waitLocation=async value=>{for(let i=0;i<40;i++){if(vscode.workspace.getConfiguration('desktile').get('toolsLocation')===value)return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Location did not change to '+value);};
  evidence.savedLocation=config.get('toolsLocation');
  await config.update('toolsLocation','activitybar',vscode.ConfigurationTarget.Global);
  await vscode.commands.executeCommand('desktile.project.focus');
  for(const [theme,name] of [['Default Dark Modern','dark'],['Default Light Modern','light']]){
   await vscode.workspace.getConfiguration('workbench').update('colorTheme',theme,vscode.ConfigurationTarget.Global);
   await new Promise(resolve=>setTimeout(resolve,1200));
   const result=await send('Runtime.evaluate',{expression:`(()=>{const icon=[...document.querySelectorAll('.activitybar .action-label')].find(e=>(e.getAttribute('aria-label')||e.closest('[aria-label]')?.getAttribute('aria-label')||'').startsWith('DeskTile DevKit'));if(!icon)throw new Error('DeskTile Activity Bar icon is missing');const rect=icon.getBoundingClientRect(),style=getComputedStyle(icon),tree=[...document.querySelectorAll('.monaco-list-row')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent.trim());return {width:rect.width,height:rect.height,mask:style.maskImage,labels:tree,theme:document.body.className};})()`,returnByValue:true});
   if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
   const state=result.result.value;if(!state.width||!state.height)throw new Error('Activity Bar icon is hidden');
   if(!state.labels.some(label=>/Create application|创建应用/.test(label)))throw new Error('Tool list is missing');
   evidence.themes.push({name,...state});
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../build/activitybar-'+name+'.png'),Buffer.from(shot.data,'base64'));
   await vscode.commands.executeCommand('desktile.settings');
   let expectedTab='sdk';
   for(const language of ['en','zh-cn']){
    await config.update('language',language,vscode.ConfigurationTarget.Global);await new Promise(resolve=>setTimeout(resolve,800));
    const settingsShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../build/settings-'+name+'-'+language+'.png'),Buffer.from(settingsShot.data,'base64'));
    const targets=await send('Target.getTargets'),target=targets.targetInfos.find(target=>target.type==='iframe'&&target.url.includes('extensionId=caner.desktile-devkit'));
    if(!target)throw new Error('Settings webview target is missing');
    const attached=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true});
    const dom=async source=>{const result=await send('Runtime.evaluate',{expression:`(()=>{let d=document;for(let i=0;i<4&&!d.querySelector('h1');i++){const frame=d.querySelector('iframe');if(!frame)break;d=frame.contentDocument||d;}const style=e=>d.defaultView.getComputedStyle(e);${source}})()`,returnByValue:true,awaitPromise:true},attached.sessionId);if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
    const restored=await dom(`return d.querySelector('[role=tab][aria-selected=true]').id;`);
    if(restored!=='tab-'+expectedTab)throw new Error('Selected settings tab after language change: '+JSON.stringify({name,language,expectedTab,restored}));
    for(const key of ['sdk','environment','updates','interface','about']){
     const tab=await dom(`d.querySelector('#tab-${key}').click();return {selected:[...d.querySelectorAll('[role=tab][aria-selected=true]')].map(e=>e.id),panels:[...d.querySelectorAll('[role=tabpanel]')].filter(e=>!e.hidden).map(e=>e.id),publisher:d.querySelector('#publisher').textContent,clipped:[...d.querySelectorAll('[role=tab]')].some(e=>e.scrollWidth>e.clientWidth)};`);
     if(tab.selected.join()!=='tab-'+key||tab.panels.join()!=='panel-'+key||tab.publisher!=='Caner HK'||tab.clipped)throw new Error('Invalid settings tab: '+JSON.stringify(tab));
     await dom(`return new Promise(resolve=>d.defaultView.requestAnimationFrame(()=>d.defaultView.requestAnimationFrame(resolve)));`);
     if(key==='environment'||key==='updates'){
      const backend=require(key==='environment'?'../lib/core':'../lib/updates'),method=key==='environment'?'doctor':'check',original=backend[method];let aborted=false;
      const checkId=key==='environment'?'env-check':'updates',cancelId=key==='environment'?'env-cancel':'update-cancel',statusId=key==='environment'?'env-status':'update-status';
      backend[method]=async options=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(Object.assign(Error('Operation cancelled.'),{code:'CANCELLED'}));},{once:true}));
      try{
       await dom(`d.querySelector('#${checkId}').click();`);
       let visible=false;for(let attempt=0;attempt<80;attempt++){visible=await dom(`const cancel=d.querySelector('#${cancelId}');return !cancel.hidden&&!cancel.disabled;`);if(visible)break;await new Promise(resolve=>setTimeout(resolve,50));}
       if(!visible)throw new Error(key+' cancel is not visible/enabled');
       const buttons=await dom(`const check=d.querySelector('#${checkId}'),cancel=d.querySelector('#${cancelId}'),a=check.getBoundingClientRect(),b=cancel.getBoundingClientRect();return {gap:b.left-a.right,dy:b.top-a.top,checkHeight:a.height,cancelHeight:b.height,sameRow:check.parentElement===cancel.parentElement,checkDisabled:check.disabled,cancelDisabled:cancel.disabled};`);
       if(buttons.gap!==8||buttons.dy!==0||buttons.checkHeight!==26||buttons.cancelHeight!==26||!buttons.sameRow||!buttons.checkDisabled||buttons.cancelDisabled)throw new Error(key+' check/cancel layout: '+JSON.stringify(buttons));
       await dom(`return new Promise(resolve=>d.defaultView.requestAnimationFrame(()=>d.defaultView.requestAnimationFrame(resolve)));`);
       const busyShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../build/settings-busy-'+key+'-'+name+'-'+language+'.png'),Buffer.from(busyShot.data,'base64'));
       await dom(`d.querySelector('#${cancelId}').click();`);
       for(let attempt=0;attempt<80;attempt++){if(await dom(`return d.querySelector('#${cancelId}').hidden;`))break;await new Promise(resolve=>setTimeout(resolve,50));}
       const cancelled=await dom(`return {hidden:d.querySelector('#${cancelId}').hidden,message:d.querySelector('#${statusId}').textContent};`);
       if(!aborted||!cancelled.hidden||!/cancelled|已取消/.test(cancelled.message))throw new Error(key+' cancel did not abort normally: '+JSON.stringify(cancelled));
       (evidence.cancellation||=[]).push({key,name,language,...buttons,...cancelled});
      }finally{backend[method]=original;}
     }
     if(key==='environment'){
      await dom(`d.querySelector('#env-check').click();`);
      let rows=0;for(let attempt=0;attempt<200;attempt++){rows=await dom(`return d.querySelectorAll('.env-check').length===8&&d.querySelector('#env-progress').hidden?8:0;`);if(rows===8)break;await new Promise(resolve=>setTimeout(resolve,100));}
      if(rows!==8)throw new Error('Inline environment check did not complete');
      await vscode.commands.executeCommand('desktile.doctor');await new Promise(resolve=>setTimeout(resolve,500));
      for(let attempt=0;attempt<200;attempt++){if(await dom(`return d.querySelector('#env-progress').hidden;`))break;await new Promise(resolve=>setTimeout(resolve,100));}
      const duplicates=vscode.window.tabGroups.all.flatMap(group=>group.tabs).filter(tab=>tab.input instanceof vscode.TabInputWebview&&/desktile\.(settings|environment)$/.test(tab.input.viewType));
      if(duplicates.length!==1)throw new Error('Environment opened another editor');
      const layout=await dom(`return {width:d.documentElement.clientWidth,scroll:d.documentElement.scrollWidth,rows:[...d.querySelectorAll('.env-check')].map(e=>({height:e.getBoundingClientRect().height,action:e.lastElementChild.getBoundingClientRect().right,row:e.getBoundingClientRect().right})),buttons:[...d.querySelectorAll('#panel-environment button')].filter(e=>e.getBoundingClientRect().height>0).map(e=>e.getBoundingClientRect().height)};`);
      if(layout.scroll>layout.width||layout.buttons.some(height=>height!==26)||layout.rows.some(row=>row.action>row.row+.1))throw new Error('Inline environment layout failed: '+JSON.stringify(layout));
      (evidence.environment||=[]).push({name,language,...layout});await dom(`return new Promise(resolve=>d.defaultView.requestAnimationFrame(()=>d.defaultView.requestAnimationFrame(resolve)));`);
     }
     if(key==='updates'){
      await vscode.commands.executeCommand('desktile.updates');
      let update;for(let attempt=0;attempt<250;attempt++){update=await dom(`return {busy:!d.querySelector('#update-progress').hidden,message:d.querySelector('#update-status').textContent,tab:d.querySelector('[role=tab][aria-selected=true]').id};`);if(!update.busy&&update.message)break;await new Promise(resolve=>setTimeout(resolve,100));}
      if(update.busy||!update.message||update.tab!=='tab-updates')throw new Error('Update check did not finish inline: '+JSON.stringify(update));
      if(vscode.window.tabGroups.all.flatMap(group=>group.tabs).filter(tab=>tab.input instanceof vscode.TabInputWebview&&/desktile.(settings|environment)$/.test(tab.input.viewType)).length!==1)throw new Error('Update command opened another editor');
      (evidence.updates||=[]).push({name,language,...update});
      await dom(`return new Promise(resolve=>d.defaultView.requestAnimationFrame(()=>d.defaultView.requestAnimationFrame(resolve)));`);
      const layout=await dom(`const panel=d.querySelector('[role=tabpanel]:not([hidden])'),heading=panel.querySelector('h2'),description=panel.querySelector('p'),button=panel.querySelector('button');return {headingX:heading.getBoundingClientRect().x,descriptionX:description.getBoundingClientRect().x,buttonX:button.getBoundingClientRect().x,gap:button.getBoundingClientRect().top-description.getBoundingClientRect().bottom,height:button.getBoundingClientRect().height};`);
      if(Math.abs(layout.headingX-layout.buttonX)>.1||Math.abs(layout.descriptionX-layout.buttonX)>.1||Math.abs(layout.gap-16)>.2||layout.height!==26)throw new Error('Disconnected settings action: '+JSON.stringify(layout));
     }
     const tabShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../build/settings-tab-'+key+'-'+name+'-'+language+'.png'),Buffer.from(tabShot.data,'base64'));
    }
    const keyboard=await dom(`const sequence=[];for(const [id,key] of [['sdk','End'],['about','Home'],['sdk','ArrowLeft'],['about','ArrowRight']]){d.querySelector('#tab-'+id).dispatchEvent(new d.defaultView.KeyboardEvent('keydown',{key,bubbles:true}));sequence.push(d.querySelector('[role=tab][aria-selected=true]').id);}return sequence;`);
    if(keyboard.join()!=='tab-about,tab-sdk,tab-about,tab-sdk')throw new Error('Tab keyboard navigation failed');
    await dom(`d.querySelector('#tab-interface').click();`);expectedTab='interface';
    const metrics=await dom(`const trigger=d.querySelector('#location').parentElement.querySelector('button');trigger.click();const popup=d.querySelector('.dt-select-popup'),selected=popup.querySelector('[aria-selected=true]');return {title:d.querySelector('h1').textContent,width:d.documentElement.clientWidth,scrollWidth:d.documentElement.scrollWidth,font:style(d.body).fontFamily,fontSize:style(d.body).fontSize,controlHeight:trigger.getBoundingClientRect().height,popupWidth:popup.getBoundingClientRect().width,triggerWidth:trigger.getBoundingClientRect().width,radius:style(popup).borderRadius,selection:style(selected).backgroundColor,blue:style(d.body).getPropertyValue('--vscode-button-background').trim(),labels:[...popup.children].map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth})),nativeSelects:[...d.querySelectorAll('select')].filter(e=>style(e).display!=='none').length};`);
    if(metrics.fontSize!=='13px'||metrics.controlHeight!==26||metrics.radius!=='0px'||metrics.nativeSelects||metrics.labels.some(row=>row.clipped)||Math.abs(metrics.popupWidth-metrics.triggerWidth)>.1||metrics.scrollWidth>metrics.width)throw new Error('Settings layout failed: '+JSON.stringify(metrics));
    (evidence.settings||=[]).push({name,language,...metrics});
    const menuShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../build/settings-'+name+'-'+language+'-menu.png'),Buffer.from(menuShot.data,'base64'));
    await dom(`d.querySelector('.dt-select-option[data-index="1"]').click();`);await new Promise(resolve=>setTimeout(resolve,350));
    await waitLocation('explorer');
    await dom(`d.querySelector('#location').parentElement.querySelector('button').click();d.querySelector('.dt-select-option[data-index="0"]').click();`);await new Promise(resolve=>setTimeout(resolve,350));
    await waitLocation('activitybar');
    if(name==='dark'&&language==='en'){
     await dom(`d.querySelector('#tab-sdk').click();`);expectedTab='sdk';
     await vscode.commands.executeCommand('workbench.action.closeAuxiliaryBar');await vscode.commands.executeCommand('workbench.action.closeSidebar');await new Promise(resolve=>setTimeout(resolve,350));
     evidence.wide=await dom(`return {width:d.documentElement.clientWidth,scrollWidth:d.documentElement.scrollWidth,labelX:d.querySelector('label').getBoundingClientRect().x,controlX:d.querySelector('#sdk-path').getBoundingClientRect().x,heights:[...d.querySelectorAll('#sdk,#doctor,#updates,.dt-select-trigger')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.getBoundingClientRect().height)};`);
     const wideShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../build/settings-wide.png'),Buffer.from(wideShot.data,'base64'));
     await vscode.commands.executeCommand('workbench.action.focusAuxiliaryBar');await vscode.commands.executeCommand('desktile.project.focus');
    }
   }
   await config.update('language','en',vscode.ConfigurationTarget.Global);
   await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  }
  await config.update('toolsLocation','explorer',vscode.ConfigurationTarget.Global);
  await vscode.commands.executeCommand('desktile.explorer.focus');await new Promise(resolve=>setTimeout(resolve,500));
  const explorer=await send('Runtime.evaluate',{expression:`(()=>({iconVisible:[...document.querySelectorAll('.activitybar .action-label')].some(e=>(e.getAttribute('aria-label')||e.closest('[aria-label]')?.getAttribute('aria-label')||'').startsWith('DeskTile DevKit')&&e.getBoundingClientRect().width>0),labels:[...document.querySelectorAll('.monaco-list-row')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent.trim())}))()`,returnByValue:true});
  evidence.explorer=explorer.result.value;
  if(evidence.explorer.iconVisible||!evidence.explorer.labels.includes('Create application'))throw new Error('Explorer placement is incorrect: '+JSON.stringify(evidence.explorer));
  const explorerShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../build/settings-explorer.png'),Buffer.from(explorerShot.data,'base64'));
  const finalLocation=process.env.DESKTILE_LEAVE_LOCATION||'activitybar';
  await config.update('toolsLocation',finalLocation,vscode.ConfigurationTarget.Global);await vscode.commands.executeCommand(finalLocation==='explorer'?'desktile.explorer.focus':'desktile.project.focus');
  await waitLocation(finalLocation);
  fs.writeFileSync(path.join(__dirname,'../build/activitybar-evidence.json'),JSON.stringify(evidence,null,2));
  console.log('Activity Bar: native dark/light screenshots and tool list verified; empty window:',evidence.emptyWindow);
 }finally{socket.close();}
}
