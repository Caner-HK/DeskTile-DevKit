'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const panel=require('../lib/interface-icon-panel'),core=require('../lib/core'),assets=require('../lib/assets'),i18n=require('../lib/i18n');
async function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-interface-icons-')),app=path.join(root,'app'),views=[],dialogs=[],answers=[],clipboard=[];
 await core.create(app,{id:'com.example.interfaceicons',name:'Interface icons',author:'Test'});
 const vscode={ViewColumn:{Active:1},workspace:{isTrusted:true},env:{clipboard:{async writeText(value){clipboard.push(value);}}},window:{
  createWebviewPanel(type,title){const posts=[];let listener,close;const view={type,title,posts,webview:{postMessage:m=>posts.push(structuredClone(m)),onDidReceiveMessage:fn=>listener=fn},onDidDispose:fn=>close=fn,reveal(){},dispose(){close?.();},send:m=>listener(m)};views.push(view);return view;},
  async showOpenDialog(){return dialogs.shift();},async showWarningMessage(){return answers.shift();}
 }};
 const view=panel.open(vscode,{subscriptions:[]},app,()=>({python:process.env.DESKTILE_PYTHON||'python'}));
 const values={output:'assets/symbol.dti',width:40,height:40};
 return {root,app,vscode,views,view,dialogs,answers,clipboard,values,last:()=>view.posts.at(-1),send:m=>view.send(m),async choose(file){dialogs.push([{fsPath:file}]);await view.send({action:'choose',values});values.output=view.posts.at(-1).values.output;},close(){for(const view of views)view.dispose();fs.rmSync(root,{recursive:true,force:true});i18n.configure('en');}};
}
test('interface icon form is distinct, localized and uses valid shared square controls',()=>{
 assert.ok(!panel.html('test').includes('id="mode"'));
 assert.ok(!panel.html('test').includes('Keep image colours'));
 for(const language of ['en','zh-cn']){i18n.configure(language);const html=panel.html('test');assert.ok(html.includes(i18n.t('Import resources')));assert.ok(html.includes('id="source"'));assert.ok(html.includes('id="output"'));assert.ok(!html.includes('tile-layout'));assert.ok(!html.includes('<nav'));assert.ok(!html.includes(String.fromCharCode(183)));new vm.Script(html.match(/<script nonce="test">([\s\S]*?)<\/script>/)[1]);}i18n.configure('en');
});
test('real interface SVG/PNG preview and save preserve application identity, package assets and draft lifetime',async()=>{
 const f=await fixture();try{
  const original=fs.readFileSync(path.join(f.app,'manifest.json')),svg=path.join(f.root,'external-symbol.svg');
  fs.writeFileSync(svg,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><circle cx="50" cy="50" r="40" fill="#0088ff"/></svg>');
  await f.choose(svg);await f.send({action:'preview',values:f.values});assert.equal(f.last().error,'');assert.deepEqual([f.last().preview.width,f.last().preview.height],[40,20]);assert.match(f.last().preview.light,/^data:image\/png;base64,/);assert.ok(!fs.existsSync(path.join(f.app,f.values.output)));assert.deepEqual(fs.readFileSync(path.join(f.app,'manifest.json')),original);
  const png=path.join(f.root,'external.png');await core.run(process.env.DESKTILE_PYTHON||'python',['-c','from PIL import Image; import sys; im=Image.new("RGBA",(40,20),(0,0,0,0)); im.paste((0,136,255,255),(10,5,30,15)); im.save(sys.argv[1])',png]);
  await f.send({action:'save',values:f.values});assert.equal(f.last().saved,true);assert.equal(fs.readFileSync(path.join(f.app,f.values.output))[8],3);await f.send({action:'copy'});assert.equal(f.clipboard[0],'<dt-image resource="assets/external-symbol.dti" width="40" height="20"/>');
  await f.choose(png);f.values.mode='custom';await f.send({action:'preview',values:f.values});await f.send({action:'save',values:f.values});assert.equal(f.last().error,'');assert.equal(fs.readFileSync(path.join(f.app,f.values.output))[8],3);assert.ok(fs.readFileSync(path.join(f.app,f.values.output)).subarray(12).includes(0));assert.equal(f.last().values.mode,undefined);assert.deepEqual(fs.readFileSync(path.join(f.app,'manifest.json')),original);
  const built=await core.build(f.app),info=core.inspect(built.package);assert.ok(info.files.includes('assets/external-symbol.dti'));assert.ok(info.files.includes('assets/external.dti'));assert.deepEqual(info.manifest.icons,JSON.parse(original).icons);
  const again=panel.open(f.vscode,{subscriptions:[]},f.app,()=>({}));assert.equal(again,f.view);
  const identity=require('../lib/asset-panel').open(f.vscode,{subscriptions:[]},f.app,()=>({}));assert.notEqual(identity,f.view);assert.equal(identity.type,'desktile.icons');assert.equal(f.view.type,'desktile.interfaceIcons');
  f.view.dispose();assert.equal(fs.readdirSync(path.join(f.app,'.desktile/assets')).filter(name=>name.startsWith('image-')).length,0);
 }finally{f.close();}
});
test('path validation, stale previews and overwrite cancellation protect existing resources',async()=>{
 const f=await fixture();try{
  const svg=path.join(f.root,'symbol.svg');fs.writeFileSync(svg,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>');await f.choose(svg);
  for(const output of ['../escape.dti','assets/../../escape.dti']){await f.send({action:'preview',values:{...f.values,output}});assert.ok(f.last().error);assert.ok(!fs.existsSync(path.join(f.root,'escape.dti')));}
  await f.send({action:'preview',values:f.values});await f.send({action:'save',values:{...f.values,width:20}});assert.equal(f.last().error,'');assert.equal(f.last().saved,true);assert.equal(fs.readFileSync(path.join(f.app,f.values.output)).readUInt16LE(4),20);
  await f.send({action:'preview',values:f.values});f.answers.push(i18n.t('Replace'));await f.send({action:'save',values:f.values});const target=path.join(f.app,f.values.output),before=fs.readFileSync(target);
  f.values.width=20;await f.send({action:'preview',values:f.values});f.answers.push(undefined);await f.send({action:'save',values:f.values});assert.deepEqual(fs.readFileSync(target),before);
  f.answers.push(i18n.t('Replace'));await f.send({action:'save',values:f.values});assert.equal(fs.readFileSync(target).readUInt16LE(4),20);
  const source=f.last().source;f.dialogs.push(undefined);await f.send({action:'choose',values:f.values});assert.equal(f.last().source,source);
  f.vscode.workspace.isTrusted=false;await f.send({action:'preview',values:f.values});assert.match(f.last().error,/Trust/);
 }finally{f.close();}
});
test('closing conversion cancels work quietly and preserves final project files',async()=>{
 const f=await fixture(),original=assets.convertImage;
 try{
  const file=path.join(f.root,'image.png');fs.writeFileSync(file,'fixture');await f.choose(file);let started;
  const ready=new Promise(resolve=>started=resolve);assets.convertImage=async(_root,_file,o)=>{started();return new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(new core.DevKitError('CANCELLED','Cancelled')),{once:true}));};
  const pending=f.send({action:'preview',values:f.values});await ready;f.view.dispose();await pending;assert.ok(!fs.existsSync(path.join(f.app,f.values.output)));assert.ok(!f.last().error);
 }finally{assets.convertImage=original;f.close();}
});

test('icon and image tabs save directly with independent drafts, dimensions, colour semantics and package files',async()=>{
 const f=await fixture();try{
  const svg=path.join(f.root,'symbol.svg'),original=fs.readFileSync(path.join(f.app,'manifest.json'));fs.writeFileSync(svg,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><path fill="#ff0000" d="M0 0h60v60H0z"/><path fill="#0000ff" d="M60 0h60v60H60z"/></svg>');
  await f.choose(svg);await f.send({action:'save',values:f.values});assert.equal(f.last().saved,true);const iconState=structuredClone(f.last()),icon=fs.readFileSync(path.join(f.app,f.values.output));assert.equal(icon[8],3);assert.equal(icon.readUInt16LE(4),40);
  await f.send({action:'tab',kind:'image',values:f.values});assert.equal(f.last().kind,'image');assert.equal(f.last().source,'');assert.equal(f.last().values.width,'');
  const imageValues={output:'assets/photo.dti',width:'',height:''};f.dialogs.push([{fsPath:svg}]);await f.send({action:'choose',kind:'image',values:imageValues});await f.send({action:'save',kind:'image',values:{...imageValues,mode:'system'}});assert.equal(f.last().error,'');assert.equal(f.last().saved,true);
  const image=fs.readFileSync(path.join(f.app,imageValues.output));assert.equal(image[8],2);assert.equal(image.readUInt16LE(4),120);assert.equal(image.readUInt16LE(6),60);const maskBytes=Math.ceil(120*60/8);assert.equal(image.readUInt16LE(12+maskBytes),0xf800);assert.equal(image.readUInt16LE(12+maskBytes+60*2),0x001f);
  const imageState=structuredClone(f.last());await f.send({action:'tab',kind:'icon',values:imageValues});assert.deepEqual(f.last(),iconState);
  await f.send({action:'tab',kind:'image',values:{...f.values,width:32}});assert.deepEqual(f.last(),imageState);
  await f.send({action:'tab',kind:'icon',values:imageValues});assert.equal(f.last().values.width,32);assert.equal(f.last().preview,null);
  f.answers.push(i18n.t('Replace'));await f.send({action:'save',kind:'icon',values:f.last().values});assert.equal(f.last().saved,true);assert.equal(fs.readFileSync(path.join(f.app,f.values.output)).readUInt16LE(4),32);
  await f.send({action:'save',kind:'image',values:{output:'assets/wrong-tab.dti',width:2,height:2}});assert.ok(!fs.existsSync(path.join(f.app,'assets/wrong-tab.dti')));
  assert.deepEqual(fs.readFileSync(path.join(f.app,'manifest.json')),original);const built=await core.build(f.app),info=core.inspect(built.package);assert.ok(info.files.includes(imageValues.output));assert.ok(info.files.includes(f.values.output));
  f.view.dispose();assert.equal(fs.readdirSync(path.join(f.app,'.desktile/assets')).filter(name=>name.startsWith('image-')).length,0);
 }finally{f.close();}
});

async function browser(file,profile){
 const {spawn}=require('node:child_process'),chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
 const child=spawn(chrome,['--headless','--disable-gpu','--no-sandbox','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1280,900','file:///'+file.replace(/\\/g,'/')],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 const endpoint=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Chrome did not start')),10000);child.stderr.on('data',data=>{text+=data;const match=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});child.once('error',reject);});
 const pages=await(await fetch('http://127.0.0.1:'+new URL(endpoint).port+'/json/list')).json(),ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl),pending=new Map();let sequence=0;
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception.description);return r.result.value;};
 await call('Page.enable');await call('Page.navigate',{url:'file:///'+file.replace(/\\/g,'/')});
 await evaluate('new Promise((resolve,reject)=>{let n=0;const ready=()=>document.getElementById("markup")&&window.desktileSelects?resolve(true):n++>200?reject(Error("Page did not initialize")):setTimeout(ready,25);ready();})');
 return {call,evaluate,async close(){const exited=new Promise(resolve=>child.once('exit',resolve));await call('Browser.close').catch(()=>{});await exited;ws.close();}};
}
test('real webview uses shared controls, readable dropdowns, preview invalidation and responsive light/dark layouts',{skip:!fs.existsSync(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'),timeout:60000},async()=>{
 const f=await fixture(),output=path.resolve(__dirname,'../build/interface-icon-visual');fs.mkdirSync(output,{recursive:true});let host;
 try{
  const source=path.join(f.root,'arrow.svg');fs.writeFileSync(source,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path fill="#0078d4" d="M4 17h22l-8-8 4-4 17 15-17 15-4-4 8-8H4z"/></svg>');await f.choose(source);await f.send({action:'preview',values:f.values});await f.send({action:'save',values:f.values});const state=f.last();
  const picture=path.join(f.root,'picture.svg');fs.writeFileSync(picture,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><path fill="#0078d4" d="M0 0h160v180H0z"/><path fill="#ff9900" d="M160 0h160v180H160z"/><circle cx="160" cy="90" r="50" fill="#ffffff"/></svg>');
  await f.send({action:'tab',kind:'image',values:f.values});const imageValues={output:'assets/picture.dti',width:'',height:''};f.dialogs.push([{fsPath:picture}]);await f.send({action:'choose',kind:'image',values:imageValues});await f.send({action:'save',kind:'image',values:imageValues});const imageState=f.last();
  for(const [language,theme] of [['en','dark'],['zh-cn','light']]){
   i18n.configure(language);state.message=i18n.t('Icon resource saved.');imageState.message=i18n.t('Image resource saved.');let html=panel.html('visual');
   if(theme==='light')html=html.replace('</head>','<style nonce="visual">body{--vscode-editor-background:#fff;--vscode-foreground:#333;--vscode-input-background:#fff;--vscode-input-foreground:#333;--vscode-input-border:#cecece;--vscode-dropdown-background:#fff;--vscode-dropdown-foreground:#333;--vscode-dropdown-border:#cecece;--vscode-button-secondaryBackground:#e5e5e5;--vscode-button-secondaryForeground:#333;--vscode-descriptionForeground:#666;--vscode-panel-border:#ddd}</style></head>');
   html=html.replace('<script nonce="visual">','<script nonce="visual">window.packets=[];window.states='+JSON.stringify({icon:state,image:imageState})+';window.acquireVsCodeApi=()=>({postMessage(m){packets.push(m);if(m.action==="ready"||m.action==="tab")setTimeout(()=>window.dispatchEvent(new MessageEvent("message",{data:states[m.action==="ready"?"icon":m.kind]})),0);}});</script><script nonce="visual">');
   const file=path.join(f.root,language+'.html');fs.writeFileSync(file,html);host=await browser(file,path.join(f.root,'chrome-'+language));
   await host.evaluate('new Promise(resolve=>{const ready=()=>document.getElementById("markup").value?resolve(true):setTimeout(ready,20);ready();})');
   assert.equal(await host.evaluate('getComputedStyle(document.body).fontSize'),'13px');
   assert.ok((await host.evaluate('Array.from(document.querySelectorAll("input,button")).filter(e=>!e.hidden&&e.getBoundingClientRect().height).map(e=>e.getBoundingClientRect().height)')).every(n=>n===26));
   assert.equal(await host.evaluate('document.querySelectorAll("select:not([hidden])").length'),0);
   assert.equal(await host.evaluate('document.getElementById("light").naturalWidth'),40);
   assert.deepEqual(await host.evaluate('[document.getElementById("save").classList.contains("primary"),document.getElementById("preview").classList.contains("primary")]'),[true,false]);
   assert.equal(await host.evaluate('getComputedStyle(document.getElementById("save")).backgroundColor'),'rgb(0, 120, 212)');
   assert.deepEqual(await host.evaluate('Array.from(document.querySelectorAll(".actions button")).map(e=>e.id)'),['save','preview','cancel']);
   assert.equal(await host.evaluate('document.getElementById("save").getBoundingClientRect().left<document.getElementById("preview").getBoundingClientRect().left'),true);
   await host.evaluate('document.getElementById("height").focus()');await host.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await host.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await host.evaluate('document.activeElement.id'),'save');await host.evaluate('document.activeElement.blur()');
   await host.call('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(output,language+'-'+theme+'.png'),Buffer.from(r.data,'base64')));
   await host.evaluate('document.getElementById("zoom").parentElement.querySelector("button").click()');
   const options=await host.evaluate('Array.from(document.querySelectorAll(".dt-select-option")).map(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth,selected:e.getAttribute("aria-selected"),bg:getComputedStyle(e).backgroundColor}))');
   assert.equal(options.length,3);assert.ok(options.every(o=>o.width>=o.scroll&&!o.text.includes("✓")));assert.equal(options[0].bg,'rgb(0, 120, 212)');
   await host.call('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(output,language+'-dropdown.png'),Buffer.from(r.data,'base64')));
   await host.evaluate('desktileSelects.close();document.getElementById("tab-icon").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight"}));new Promise(resolve=>setTimeout(resolve,60))');
   assert.deepEqual(await host.evaluate('[document.activeElement.id,document.getElementById("tab-image").getAttribute("aria-selected"),document.getElementById("width").required,document.getElementById("width").value,document.getElementById("light").naturalWidth]'),['tab-image','true',false,'',320]);
   assert.equal(await host.evaluate('document.getElementById("width").placeholder'),i18n.t('Original size'));
   await host.call('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(output,language+'-image-'+theme+'.png'),Buffer.from(r.data,'base64')));
   await host.evaluate('document.getElementById("tab-image").dispatchEvent(new KeyboardEvent("keydown",{key:"Home"}));new Promise(resolve=>setTimeout(resolve,60));document.getElementById("zoom").parentElement.querySelector("button").click()');
   await host.evaluate('document.querySelectorAll(".dt-select-option")[1].click();document.getElementById("width").value=32;document.getElementById("width").dispatchEvent(new Event("input"))');
   assert.deepEqual(await host.evaluate('[document.getElementById("save").disabled,document.getElementById("copy").disabled,document.getElementById("light").hidden]'),[false,true,true]);
   await host.evaluate('document.getElementById("preview").click()');assert.equal((await host.evaluate('packets.at(-1)')).values.width,'32');
   await host.evaluate('document.getElementById("save").click()');assert.deepEqual(await host.evaluate('({action:packets.at(-1).action,kind:packets.at(-1).kind,width:packets.at(-1).values.width})'),{action:'save',kind:'icon',width:'32'});
   await host.call('Emulation.setDeviceMetricsOverride',{width:650,height:900,deviceScaleFactor:1,mobile:false});
   assert.equal(await host.evaluate('document.documentElement.scrollWidth<=650'),true);
   await host.evaluate('window.dispatchEvent(new MessageEvent("message",{data:'+JSON.stringify(state)+'}))');
   await host.call('Page.captureScreenshot',{format:'png'}).then(r=>fs.writeFileSync(path.join(output,language+'-narrow.png'),Buffer.from(r.data,'base64')));
   await host.close();host=null;
  }
 }finally{if(host)await host.close();f.close();}
});


