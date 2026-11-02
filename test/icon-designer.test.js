'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawn}=require('node:child_process');
const systemFonts=require('../lib/system-fonts');
const core=require('../lib/core'),designer=require('../lib/icon-designer'),i18n=require('../lib/i18n'),kit=path.resolve(__dirname,'..'),chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
async function browser(file,profile){
 const child=spawn(chrome,['--headless','--disable-gpu','--no-sandbox','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1280,1000','file:///'+file.replace(/\\/g,'/')],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 const endpoint=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Chrome did not start')),10000);child.stderr.on('data',data=>{text+=data;const match=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});child.once('error',reject);});
 const port=new URL(endpoint).port,pages=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(),page=pages.find(item=>item.type==='page');const ws=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();let sequence=0;
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});ws.onmessage=event=>{const message=JSON.parse(event.data),entry=pending.get(message.id);if(entry){pending.delete(message.id);message.error?entry.reject(Error(message.error.message)):entry.resolve(message.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const loaded=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Editor page did not load')),10000);const listener=event=>{if(JSON.parse(event.data).method==='Page.loadEventFired'){clearTimeout(timer);ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});
 await call('Page.enable');await call('Page.navigate',{url:'file:///'+file.replace(/\\/g,'/')});await loaded;
 const evaluate=async expression=>{const value=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(value.exceptionDetails)throw Error(value.exceptionDetails.exception.description);return value.result.value;};
 return {call,evaluate,async close(){const exited=new Promise(resolve=>child.once('exit',resolve));await call('Browser.close').catch(()=>{});await exited;ws.close();}};
}

async function fontFixture(model){
 const requests=systemFonts.initial(model),chars='系统字體 English 中文预览';
 for(const font of Object.keys(systemFonts.families))for(const size of [20,32]){const found=requests.find(value=>value.font===font&&value.size===size);if(found)found.chars+=chars;else requests.push({font,size,chars:systemFonts.initial(model)[0].chars+chars});}
 return systemFonts.glyphs(model.directory,requests);
}

for(const language of ['en','zh-cn'])test('visual icon designer drags complete tile artwork, edits names/layers, saves portable sources and builds localized native canvases - '+language,{skip:!fs.existsSync(chrome),timeout:60000},async()=>{
 i18n.configure(language);const output=path.join(kit,'build/icon-designer-tests');fs.mkdirSync(output,{recursive:true});const root=fs.mkdtempSync(path.join(output,'case-')),app=path.join(root,'app');let host;
 try{
  await core.create(app,{id:'com.example.iconeditor',name:'Editor app',author:'Test'});
  const manifestFile=path.join(app,'manifest.json'),originalManifest=JSON.parse(fs.readFileSync(manifestFile));originalManifest.name.fr='Nom';originalManifest.name['en-US']='English priority';fs.writeFileSync(manifestFile,JSON.stringify(originalManifest));
  const model=designer.load(app);assert.equal(model.names.en,'English priority');const originalIcon=designer.importImage(model,path.join(kit,'sdk-bundle/resources/icons/source/material-task-complete.svg'));model.documents.default.tile.layers=[{id:'original-icon',type:'image',name:'TaskComplete',source:originalIcon.id,x:0,y:0,w:96,h:96,rotation:0,mode:'system',color:'#ffffff',fit:'contain'}];for(const lang of designer.locales)model.names[lang]='ToDo';const images=await designer.previews(model),fonts=await fontFixture(model),fixture={model,images,fonts};
  let html=require('../lib/asset-panel').html('test');
  if(language==='zh-cn')html=html.replace('</head>','<style nonce="test">body{--vscode-editor-background:#fff;--vscode-foreground:#333;--vscode-input-background:#fff;--vscode-input-foreground:#333;--vscode-input-border:#cecece;--vscode-dropdown-background:#fff;--vscode-dropdown-foreground:#333;--vscode-dropdown-border:#cecece;--vscode-button-secondaryBackground:#e5e5e5;--vscode-button-secondaryForeground:#333;--vscode-sideBar-background:#f8f8f8;--vscode-panel-border:#ddd}</style></head>');
  html=html.replace('<script nonce="test">','<script nonce="test">window.acquireVsCodeApi=()=>({postMessage(message){if(message.type==="ready")setTimeout(()=>window.dispatchEvent(new MessageEvent("message",{data:'+JSON.stringify(fixture)+'})),0);else if(message.type==="fonts")window.fontRequests=message;else window.savedPacket=message;}});</script><script nonce="test">');
  const file=path.join(root,'editor.html');fs.writeFileSync(file,html);host=await browser(file,path.join(root,'chrome'));
  await host.evaluate('new Promise((resolve,reject)=>{let tries=0;const ready=()=>{if(window.iconDesigner?.model&&document.querySelectorAll(".dt-select-trigger").length===document.querySelectorAll("select").length)resolve(true);else if(tries++>150)reject(Error("Editor did not initialize"));else setTimeout(ready,30);};ready();})');
  const inherited=await host.evaluate('(()=>{const d=iconDesigner.model.documents.default,original=structuredClone(d.tile),out={};d.tile.mode="custom";d.tile.background="#ff0000";d.tile.layers=[];for(const key of ["tile-1x1","tile-2x2","tile-4x2","tile-4x4"]){const c=document.createElement("canvas"),layer=d[key].layers[0];if(layer.type!=="symbol")throw Error("Missing default icon instance");iconDesigner.render(c,d[key],key,"en");out[key]=Array.from(c.getContext("2d").getImageData(Math.floor(layer.x+layer.w/2),Math.floor(layer.y+layer.h/2),1,1).data);}d.tile=original;return out;})()');for(const pixel of Object.values(inherited))assert.deepEqual(pixel,[255,0,0,255]);
  await host.evaluate('document.querySelector(\'[data-slot="tile-2x2"]\').click()');
  assert.equal(await host.evaluate('iconDesigner.model.tileMode'),'system');
  assert.deepEqual(await host.evaluate('["composition-tools","layers","background-row","transparent","layer-props"].map(id=>document.getElementById(id).hidden)'),[true,true,true,true,true]);
  assert.equal(await host.evaluate('document.getElementById("zoom").value'),'1');
  await host.call('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1.5,mobile:false});await host.evaluate('iconDesigner.draw()');
  assert.deepEqual(await host.evaluate('(()=>{const c=document.getElementById("canvas");return [c.width,c.height,c.getBoundingClientRect().width]})()'),[252,252,168]);
  const readonly=await host.evaluate('JSON.stringify(iconDesigner.model.documents)');
  const centre=await host.evaluate('(()=>{const r=document.getElementById("canvas").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await host.call('Input.dispatchMouseEvent',{type:'mousePressed',...centre,button:'left',clickCount:1});await host.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:centre.x+20,y:centre.y+20,buttons:1});await host.call('Input.dispatchMouseEvent',{type:'mouseReleased',x:centre.x+20,y:centre.y+20,button:'left',clickCount:1});
  assert.equal(await host.evaluate('JSON.stringify(iconDesigner.model.documents)'),readonly);assert.equal(await host.evaluate('iconDesigner.selected'),null);
  await host.call('Page.captureScreenshot',{format:'png'}).then(data=>fs.writeFileSync(path.join(output,'system-managed-'+language+'-hidpi.png'),Buffer.from(data.data,'base64')));
  for(const [key,preset] of Object.entries(designer.presets)){
   await host.evaluate('document.querySelector(\'[data-slot="'+key+'"]\').click()');const [w,h]=designer.sizes[key];
   const probe=async()=>host.evaluate('(()=>{const p=CanvasRenderingContext2D.prototype,original=p.drawImage,draws=[];p.drawImage=function(...args){if(this.canvas.id==="canvas"){const m=this.getTransform();draws.push([m.e,m.f]);}return original.apply(this,args);};try{iconDesigner.draw();const c=document.getElementById("canvas"),scale=c.width/'+w+';return draws.map(p=>p.map(n=>n/scale));}finally{p.drawImage=original;}})()');
   const shown=await probe();assert.ok(shown.length);assert.ok(Math.abs(shown[0][1]-preset.icon.y)<0.01);
   if(key!=='tile-1x1'){await host.evaluate('document.getElementById("show-title").value="false";document.getElementById("show-title").dispatchEvent(new Event("change"))');assert.equal(await host.evaluate('document.getElementById("tile-layout").value'),'system');}
   const hidden=await probe();assert.ok(Math.abs(hidden[0][0]-(w-preset.icon.w)/2)<0.01);assert.ok(Math.abs(hidden[0][1]-(h-preset.icon.h)/2)<0.01);
   await host.call('Page.captureScreenshot',{format:'png'}).then(data=>fs.writeFileSync(path.join(output,'no-title-'+key+'-'+language+'.png'),Buffer.from(data.data,'base64')));
  }
  await host.evaluate('document.querySelector(\'[data-slot="tile-2x2"]\').click()');
  await host.evaluate('document.getElementById("app-name").value="Managed app";document.getElementById("app-name").dispatchEvent(new Event("change"));document.getElementById("save").click();new Promise(resolve=>{const ready=()=>window.savedPacket?.type==="save"?resolve(true):setTimeout(ready,25);ready();})');
  const managed=await host.evaluate('savedPacket');await designer.save(managed.model,managed.renders);const managedManifest=JSON.parse(fs.readFileSync(manifestFile));assert.equal(Boolean(managedManifest.tile.full_image),false);
  for(const [key,preset] of Object.entries(designer.presets)){const resource=managedManifest.icons.tile.replace(/\.dti$/,key.slice(4)+'.dti'),data=fs.readFileSync(path.join(app,resource));assert.equal(data.readUInt16LE(4),preset.icon.w);assert.equal(data.readUInt16LE(6),preset.icon.h);assert.equal(data[8],3,'System-coloured icons retain alpha rather than a baked background');assert.ok(!fs.existsSync(path.join(app,resource.replace(/\.dti$/,'-en.dti'))));}
  assert.equal(designer.load(app).tileMode,'system');assert.deepEqual(designer.load(app).tileTitles,{'1x1':false,'2x2':false,'4x2':false,'4x4':false});const managedPackage=await core.build(app);assert.equal(Boolean(core.inspect(managedPackage.package).manifest.tile.full_image),false);assert.deepEqual(core.inspect(managedPackage.package).manifest.tile.show_title,{'2x2':false,'4x2':false,'4x4':false});
  await host.evaluate('window.dispatchEvent(new MessageEvent("message",{data:'+JSON.stringify({model:managed.model,saved:true})+'}));document.getElementById("edit-default-icon").click()');assert.equal(await host.evaluate('iconDesigner.slot'),'tile');
  await host.call('Emulation.clearDeviceMetricsOverride');await host.evaluate('iconDesigner.draw()');
  await host.evaluate('document.querySelector(\'[data-slot="tile-4x2"]\').click(); new Promise(resolve=>setTimeout(resolve,150))');
  await host.evaluate('document.getElementById("tile-layout").value="custom";document.getElementById("tile-layout").dispatchEvent(new Event("change"))');
  await host.evaluate('document.getElementById("add-text").click();document.getElementById("content").value="系统字體 English";document.getElementById("content").dispatchEvent(new Event("change"));document.getElementById("system-size").value="32";document.getElementById("system-size").dispatchEvent(new Event("change"));');
  await host.evaluate('document.getElementById("content").value="系统字體 English 驗";document.getElementById("content").dispatchEvent(new Event("change"));new Promise(resolve=>setTimeout(resolve,80))');
  const requested=await host.evaluate('window.fontRequests');assert.equal(requested.type,'fonts');const extra=await systemFonts.glyphs(app,requested.requests);
  await host.evaluate('window.dispatchEvent(new MessageEvent("message",{data:'+JSON.stringify({fonts:extra})+'}));iconDesigner.fontsReady()');
  assert.ok((await host.evaluate('iconDesigner.model.documents.default["tile-4x2"].layers.at(-1).text["zh-CN"]')).includes('驗'),'A font response must preserve unsaved text');
  await host.evaluate('document.getElementById("content").value="系统字體 English";document.getElementById("content").dispatchEvent(new Event("change"))');
  const fontSamples=[];
  for(const font of Object.keys(systemFonts.families)){
   await host.evaluate('document.getElementById("font-family").value='+JSON.stringify(font)+';document.getElementById("font-family").dispatchEvent(new Event("change"));iconDesigner.fontsReady()');
   assert.equal((await host.evaluate('iconDesigner.model.documents.default["tile-4x2"].layers.at(-1)')).font,font);fontSamples.push(await host.evaluate('document.getElementById("canvas").toDataURL()'));
   await host.evaluate('document.getElementById("font-family").parentElement.querySelector(".dt-select-trigger").scrollIntoView({block:"center"})');
   await host.call('Page.captureScreenshot',{format:'png'}).then(data=>fs.writeFileSync(path.join(output,'font-'+font.slice(7)+'-'+language+'.png'),Buffer.from(data.data,'base64')));
  }
  await host.evaluate('document.getElementById("font-family").parentElement.querySelector(".dt-select-trigger").click()');await host.call('Page.captureScreenshot',{format:'png'}).then(data=>fs.writeFileSync(path.join(output,'font-menu-'+language+'.png'),Buffer.from(data.data,'base64')));await host.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await host.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
  assert.ok(new Set(fontSamples).size>=3,'Native Latin font families must visibly change the artwork');await host.evaluate('document.getElementById("delete").click()');
  assert.equal(await host.evaluate('document.getElementById("tile-layout").value'),'custom');
  const retained=await host.evaluate('JSON.stringify(iconDesigner.model.documents)');await host.evaluate('for(const mode of ["system","custom"]){document.getElementById("tile-layout").value=mode;document.getElementById("tile-layout").dispatchEvent(new Event("change"));}');assert.equal(await host.evaluate('JSON.stringify(iconDesigner.model.documents)'),retained,'Changing drawing ownership preserves custom compositions');
  for(const key of Object.keys(designer.presets)){
   await host.evaluate('document.querySelector(\'[data-slot="'+key+'"]\').click();document.getElementById("reset-layout").click()');
   const composition=await host.evaluate('iconDesigner.model.documents.default['+JSON.stringify(key)+']'),preset=designer.presets[key];assert.equal(composition.layout,'system');assert.deepEqual(Object.fromEntries(['x','y','w','h'].map(name=>[name,composition.layers[0][name]])),preset.icon);assert.equal(composition.layers.filter(item=>item.type==='title').length,preset.title?1:0);
   const png=await host.evaluate('(()=>{const canvas=document.createElement("canvas");iconDesigner.render(canvas,iconDesigner.model.documents.default['+JSON.stringify(key)+'],'+JSON.stringify(key)+',"zh-CN");return canvas.toDataURL();})()');fs.writeFileSync(path.join(output,'preset-'+key.slice(5)+'-'+language+'.png'),Buffer.from(png.split(',')[1],'base64'));
  }
  await host.evaluate('document.querySelector(\'[data-slot="tile-4x2"]\').click()');
  const before=await host.evaluate('iconDesigner.model.documents.default["tile-4x2"].layers[0]');
  const at=await host.evaluate('(()=>{const c=document.getElementById("canvas"),r=c.getBoundingClientRect(),l=iconDesigner.model.documents.default["tile-4x2"].layers[0];return {x:r.left+(l.x+l.w/2)*r.width/c.width,y:r.top+(l.y+l.h/2)*r.height/c.height,scale:r.width/c.width};})()');
  await host.call('Input.dispatchMouseEvent',{type:'mousePressed',x:at.x,y:at.y,button:'left',clickCount:1});
  await host.call('Input.dispatchMouseEvent',{type:'mouseMoved',x:at.x+24*at.scale,y:at.y-12*at.scale,button:'left',buttons:1});
  await host.call('Input.dispatchMouseEvent',{type:'mouseReleased',x:at.x+24*at.scale,y:at.y-12*at.scale,button:'left',clickCount:1});
  await host.call('Page.captureScreenshot',{format:'png'}).then(data=>fs.writeFileSync(path.join(output,'designer-drag.png'),Buffer.from(data.data,'base64')));
  const moved=await host.evaluate('iconDesigner.model.documents.default["tile-4x2"].layers[0]');assert.ok(Math.abs(moved.x-before.x-24)<1,JSON.stringify({at,before,moved,selected:await host.evaluate('iconDesigner.selected')}));assert.ok(Math.abs(moved.y-before.y+12)<1);
  await host.evaluate('document.getElementById("undo").click()');assert.equal((await host.evaluate('iconDesigner.model.documents.default["tile-4x2"].layers[0]')).x,before.x);assert.equal(await host.evaluate('iconDesigner.model.documents.default["tile-4x2"].layout'),'system');
  await host.evaluate('document.getElementById("redo").click()');
  await host.evaluate('document.getElementById("add-rectangle").click();for(const [id,value] of [["x",8],["y",8],["w",40],["h",30],["ink","#0088ff"],["layer-name","Blue block"]]){const field=document.getElementById(id);field.value=value;field.dispatchEvent(new Event("change"));}');
  for(const locale of designer.locales)await host.evaluate('document.getElementById("locale").value='+JSON.stringify(locale)+';document.getElementById("locale").dispatchEvent(new Event("change"));document.getElementById("app-name").value='+JSON.stringify('Custom '+locale)+';document.getElementById("app-name").dispatchEvent(new Event("change"));document.getElementById("tile-name").value='+JSON.stringify('Wide '+locale)+';document.getElementById("tile-name").dispatchEvent(new Event("change"));');
  await host.evaluate('document.getElementById("save").click();new Promise(resolve=>{const ready=()=>window.savedPacket?.type==="save"?resolve(true):setTimeout(ready,25);ready();})');
  const packet=await host.evaluate('window.savedPacket');assert.equal(packet.type,'save');assert.equal(packet.model.documents.default['tile-4x2'].layers.at(-1).name,'Blue block');
  const saved=await designer.save(packet.model,packet.renders),restored=designer.load(app);assert.equal(restored.signature,saved.signature);assert.deepEqual(restored.documents,packet.model.documents);assert.equal(restored.names.en,'Custom en');assert.equal(restored.tileNames['4x2'].en,'Wide en');
  const manifest=JSON.parse(fs.readFileSync(path.join(app,'manifest.json')));assert.equal(manifest.tile.full_image,true);assert.equal(manifest.version,'1.0.0');assert.equal(manifest.version_code,1);assert.equal(manifest.name.fr,'Nom');assert.equal(manifest.name['en-US'],'Custom en');
  const runOriginal=core.run;try{core.run=async(...args)=>{const result=await runOriginal(...args);const current=JSON.parse(fs.readFileSync(path.join(app,'manifest.json')));current.metadata.author='Concurrent author';fs.writeFileSync(path.join(app,'manifest.json'),JSON.stringify(current));return result;};await assert.rejects(designer.save(structuredClone(restored),packet.renders),{code:'ASSET_CONFLICT'});}finally{core.run=runOriginal;}assert.equal(JSON.parse(fs.readFileSync(path.join(app,'manifest.json'))).metadata.author,'Concurrent author','A rejected save must preserve a concurrent external manifest edit');
  const paths={...manifest.icons};manifest.metadata.author='Updated author';fs.writeFileSync(path.join(app,'manifest.json'),JSON.stringify(manifest));const resumed=designer.load(app);assert.deepEqual(resumed.documents,restored.documents,'Manifest metadata changes must preserve editable layers and fonts');await designer.save(resumed,packet.renders);assert.equal(JSON.parse(fs.readFileSync(path.join(app,'manifest.json'))).metadata.author,'Updated author');assert.deepEqual(JSON.parse(fs.readFileSync(path.join(app,'manifest.json'))).icons,paths,'Repeated save must reuse generated paths');
  for(const [key,[width,height]] of Object.entries(designer.sizes).filter(([key])=>key.startsWith('tile-')))for(const locale of designer.locales){const target=manifest.icons.tile.replace(/\.dti$/,key.slice(4)+(locale==='zh-CN'?'':'-'+locale)+'.dti'),bytes=fs.readFileSync(path.join(app,fs.existsSync(path.join(app,target))?target:manifest.icons.tile.replace(/\.dti$/,key.slice(4)+'.dti')));assert.equal(bytes.readUInt16LE(4),width);assert.equal(bytes.readUInt16LE(6),height);}
  const built=await core.build(app),info=core.inspect(built.package);assert.equal(info.manifest.tile.full_image,true);assert.ok(info.files.some(name=>name.endsWith('tile-4x2-en.dti')));assert.ok(!info.files.some(name=>name.startsWith('icon-design/')));
  const artwork=manifest.icons.tile.replace(/\.dti$/,'-4x2.dti'),markup=path.join(app,'artwork-preview.html'),expected=path.join(root,'expected.png');fs.writeFileSync(expected,Buffer.from(packet.renders['default/tile-4x2/zh-CN'].split(',')[1],'base64'));
  const page=scale=>'<dt-page width="800" height="448" padding="0"><dt-column width="800" height="448" padding="0" gap="0" alignment="0"><dt-image resource="'+artwork+'" width="'+344*scale+'" height="'+168*scale+'" flex-grow="0"/></dt-column></dt-page>';
  const compare='from PIL import Image; import sys; scale=int(sys.argv[3]); expected=Image.open(sys.argv[1]).convert("RGB").resize((344*scale,168*scale),Image.Resampling.NEAREST); actual=Image.open(sys.argv[2]).convert("RGB").crop((0,32,344*scale,32+168*scale)); quant=lambda im:[(r>>3,g>>2,b>>3) for r,g,b in im.getdata()]; print(sum(a!=b for a,b in zip(quant(expected),quant(actual))))';
  for(const scale of [1,2]){
   fs.writeFileSync(markup,page(scale));const native=await core.preview(app,{page:markup,output:path.join(root,'native-preview-'+scale)}),differences=await core.run(process.env.DESKTILE_PYTHON||'python',['-c',compare,expected,native.light,String(scale)]);assert.equal(Number(differences.trim()),0,'The complete native '+scale+'x RGB565 image must match the artwork without stretched bounds or striped RLE rows');
   fs.copyFileSync(native.light,path.join(output,'native-artwork-'+language+(scale===1?'':'-2x')+'.png'));
  }
  await host.evaluate('window.dispatchEvent(new MessageEvent("message",{data:'+JSON.stringify({model:restored,saved:true,message:i18n.t('Saved to project')})+'}));new Promise(resolve=>setTimeout(resolve,100))');
  await host.call('Page.captureScreenshot',{format:'png'}).then(data=>fs.writeFileSync(path.join(output,'designer-'+language+'.png'),Buffer.from(data.data,'base64')));
  await host.close();host=null;
 }finally{await host?.close();fs.rmSync(root,{recursive:true,force:true});i18n.configure('en');}
});

test('designer preserves original imported sources and rejects stale saves, outside sources and invalid dimensions',async()=>{
 fs.mkdirSync(path.join(kit,'build/icon-designer-tests'),{recursive:true});const root=fs.mkdtempSync(path.join(kit,'build/icon-designer-tests/validation-')),app=path.join(root,'app');try{
  await core.create(app,{id:'com.example.iconvalidation',name:'Validation',author:'Test'});const model=designer.load(app),source=path.join(root,'original.svg'),svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path fill="#f00" d="M0 0h200v100H0z"/></svg>';fs.writeFileSync(source,svg);const added=designer.importImage(model,source);assert.equal(fs.readFileSync(path.join(app,model.sources[added.id]),'utf8'),svg);
  const images=await designer.previews(model);assert.match(images[added.id],/^data:image\/png;base64,/);
  const bad=structuredClone(model);bad.sources[added.id]='../original.svg';assert.throws(()=>designer.validate(bad),{code:'ASSET_SOURCE'});
  model.documents.default.application.layers[0].w=-1;assert.throws(()=>designer.validate(model),{code:'ASSET_OPTIONS'});model.documents.default.application.layers[0].w=96;
  fs.appendFileSync(path.join(app,'manifest.json'),' ');assert.throws(()=>designer.validate(model),{code:'ASSET_CONFLICT'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('editor saves all43 resource-derived complete appearances without retaining duplicate package assets',{skip:!fs.existsSync(chrome),timeout:60000},async()=>{
 const output=path.join(kit,'build/icon-designer-tests');fs.mkdirSync(output,{recursive:true});const root=fs.mkdtempSync(path.join(output,'appearances-')),app=path.join(root,'app');let host;
 try{
  await core.create(app,{id:'com.example.multidesign',name:'Appearances',author:'Test'});
  const manifest=JSON.parse(fs.readFileSync(path.join(app,'manifest.json')));manifest.icons.appearances={default:'P00',from_resources:true};manifest.icons.tile_variants=true;manifest.tile.full_image=true;
  const dti=(w,h,color)=>{const header=Buffer.alloc(12);header.write('DTI1');header.writeUInt16LE(w,4);header.writeUInt16LE(h,6);header[8]=1;const runs=[];let left=w*h;while(left){const size=Math.min(left,65535),pair=Buffer.alloc(4);pair.writeUInt16LE(size);pair.writeUInt16LE(color,2);runs.push(pair);left-=size;}return Buffer.concat([header,...runs]);};
  for(let index=0;index<43;index++){
   const id='P'+String(index).padStart(2,'0'),color=0xf800+index;
   for(const [slot,[w,h]] of Object.entries(designer.sizes).filter(([key])=>key!=='notification')){
    const base=slot.startsWith('tile-')?manifest.icons.tile.replace(/\\.dti$/,slot.slice(4)+'.dti'):manifest.icons[slot],file=path.join(app,path.dirname(base),id,path.basename(base));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,dti(w,h,color));if(index===0)fs.writeFileSync(path.join(app,base),dti(w,h,color));
   }
  }
  fs.writeFileSync(path.join(app,'manifest.json'),JSON.stringify(manifest));const model=designer.load(app),images=await designer.previews(model),fonts=await fontFixture(model);assert.equal(model.appearances.length,43);
  let html=require('../lib/asset-panel').html('test');html=html.replace('<script nonce="test">','<script nonce="test">window.acquireVsCodeApi=()=>({postMessage(message){if(message.type==="ready")setTimeout(()=>window.dispatchEvent(new MessageEvent("message",{data:'+JSON.stringify({model,images,fonts})+'})),0);else window.savedPacket=message;}});</script><script nonce="test">');const file=path.join(root,'editor.html');fs.writeFileSync(file,html);host=await browser(file,path.join(root,'chrome'));
  await host.evaluate('new Promise(resolve=>{const ready=()=>iconDesigner.model?resolve(true):setTimeout(ready,25);ready();})');
  await host.evaluate('document.getElementById("app-name").value="Edited";document.getElementById("app-name").dispatchEvent(new Event("change"));document.getElementById("save").click();new Promise(resolve=>{const ready=()=>window.savedPacket?.type==="save"?resolve(true):setTimeout(ready,25);ready();})');
  const packet=await host.evaluate('savedPacket');await designer.save(packet.model,packet.renders);let restored=designer.load(app);assert.ok(Object.values(restored.sources).every(file=>file.startsWith('icon-design/sources/')));
  await designer.save(restored,packet.renders);const updated=JSON.parse(fs.readFileSync(path.join(app,'manifest.json')));assert.equal(updated.icons.application,manifest.icons.application);assert.equal(updated.icons.tile,manifest.icons.tile);
  const built=await core.build(app),info=core.inspect(built.package);assert.ok(info.files.length<320,info.files.length+' package entries');assert.ok(!info.files.some(file=>file.startsWith('icon-design/')));assert.equal(info.manifest.icons.appearances.from_resources,true);
  const direct=path.join(root,'direct.dtapp');await core.run(process.env.DESKTILE_PYTHON||'python',[path.join(kit,'sdk-bundle/tools/build_dtapp.py'),app,direct,'--development']);assert.ok(!core.inspect(direct).files.some(file=>file.startsWith('icon-design/')),'The direct SDK builder must also exclude editable artwork sources');
  await host.close();host=null;
 }finally{await host?.close();fs.rmSync(root,{recursive:true,force:true});}
});

