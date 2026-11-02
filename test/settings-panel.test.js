'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm');
const settings=require('../lib/settings-panel'),i18n=require('../lib/i18n');
function fixture(){
 let listener,dispose,change,count=0,removed=0;const posts=[],commands=[],updates=[],config={language:'auto',toolsLocation:'activitybar'};
 const view={webview:{postMessage:s=>posts.push(structuredClone(s)),onDidReceiveMessage:fn=>{listener=fn;return {dispose(){removed++;}};}},reveal(){},onDidDispose:fn=>{dispose=fn;},dispose(){dispose?.();}};
 const vscode={ViewColumn:{Active:1},ConfigurationTarget:{Global:1},workspace:{isTrusted:true,getConfiguration:()=>({get:(key,fallback)=>config[key]??fallback,async update(key,value,target){updates.push({key,value,target});config[key]=value;change?.({affectsConfiguration:name=>name==='desktile'||name==='desktile.'+key});}}),onDidChangeConfiguration:fn=>{change=fn;return {dispose(){removed++;}};}},window:{createWebviewPanel(){count++;return view;}},commands:{async executeCommand(...args){commands.push(args);}}};
 const options=()=>({sdk:path.resolve(__dirname,'../sdk-bundle')});
 return {view,vscode,config,commands,updates,posts,options,open:extra=>settings.open(vscode,{subscriptions:[]},options,extra),send:m=>listener(m),last:()=>posts.at(-1),get count(){return count;},get removed(){return removed;},dispose(){view.dispose();i18n.configure('en');}};
}
test('settings delegates SDK and language to their existing picker and preference commands',async()=>{
 const f=fixture();try{assert.equal(f.open(),f.open());assert.equal(f.count,1);await f.send({action:'ready'});assert.equal(f.last().sdkVersion,'1.0');assert.equal(f.last().location,'activitybar');
 await f.send({action:'sdk'});await f.send({action:'language',value:'zh-cn'});
 assert.deepEqual(f.commands,[['desktile.sdk'],['desktile.language','zh-cn']]);assert.equal(f.last().busy,false);
 }finally{f.dispose();}assert.equal(f.removed,2);
});
test('location changes persist globally and focus the selected native tree; invalid messages leave preferences intact',async()=>{
 const f=fixture();try{f.open();await f.send({action:'ready'});for(const value of ['explorer','activitybar']){await f.send({action:'location',value});assert.equal(f.last().location,value);}
 assert.deepEqual(f.updates,[{key:'toolsLocation',value:'explorer',target:1},{key:'toolsLocation',value:'activitybar',target:1}]);assert.deepEqual(f.commands,[['desktile.explorer.focus'],['desktile.project.focus']]);
 for(const m of [{action:'location',value:'both'},{action:'language',value:'invalid'},{action:'unknown'},null])await f.send(m);assert.equal(f.updates.length,2);assert.equal(f.commands.length,2);
 await f.vscode.workspace.getConfiguration().update('toolsLocation','explorer',1);assert.equal(f.last().location,'explorer');
 }finally{f.dispose();}
});
test('busy work,errors,trust checks and disposal preserve a usable settings page',async()=>{
 const f=fixture();try{f.open();await f.send({action:'ready'});let resolve;f.vscode.commands.executeCommand=()=>new Promise(r=>{resolve=r;});const work=f.send({action:'sdk'});assert.equal(f.last().busy,true);await f.send({action:'location',value:'explorer'});assert.equal(f.updates.length,0);resolve();await work;
 f.vscode.commands.executeCommand=async()=>{throw Error('Connection failed');};await f.send({action:'sdk'});assert.equal(f.last().error,'Connection failed');assert.equal(f.last().busy,false);
 f.vscode.workspace.isTrusted=false;await f.send({action:'location',value:'explorer'});assert.match(f.last().error,/Trust/);assert.equal(f.updates.length,0);
 const count=f.posts.length;f.dispose();await f.send({action:'ready'});assert.equal(f.posts.length,count);
 }finally{f.dispose();}
});
test('settings is fully localized and uses the shared square controls with valid CSP scripts',()=>{
 for(const language of ['en','zh-cn']){i18n.configure(language);const html=settings.html('test');for(const text of ['Settings','Check environment','Check for updates','Interface language','About','Toolbox location'])assert.ok(html.includes(i18n.t(text)),text);
 new vm.Script(html.match(/<script nonce="test">([\s\S]*?)<\/script>/)[1]);assert.ok(!html.includes(String.fromCharCode(183)));assert.ok(!html.includes('Execution details'));assert.ok(html.includes('button.dt-select-option[aria-selected=true]'));
 }i18n.configure('en');
});
test('environment command reuses Settings with inline checks,compiler recovery,retry and cancellation',async()=>{
 const core=require('../lib/core'),workflow=require('../lib/workflow-panel'),original=core.doctor,f=fixture();let checks=0,retries=0;
 core.doctor=async()=>{checks++;return {sdk:'C:/SDK',python:'Python 3.10',node:process.version,compiler:null,serial:true,imageResources:{png:true,svg:true},interactivePreview:true};};
 try{
  f.open();await f.send({action:'ready'});assert.equal(workflow.open(f.vscode,{subscriptions:[]},'environment',f.options,{retry:async()=>{retries++;return true;}}),f.view);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(f.count,1);assert.equal(checks,1);assert.ok(f.posts.some(p=>p.tab==='environment'));assert.equal(f.posts.findLast(p=>p.environment)?.environment.rows.length,8);
  await f.send({action:'environment',operation:'retry'});assert.equal(retries,1);assert.equal(f.posts.findLast(p=>p.environment).environment.retry,false);
  core.doctor=async o=>new Promise((_resolve,reject)=>o.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));
  const job=f.send({action:'environment',operation:'doctor'});await new Promise(resolve=>setImmediate(resolve));await f.send({action:'environment',operation:'cancel'});await job;
  assert.equal(f.posts.findLast(p=>p.environment).environment.message,'Operation cancelled.');assert.equal(f.last().busy,false);
 }finally{core.doctor=original;f.dispose();}
});
test('update results,errors,cancellation and release actions stay inside the same Settings editor',async()=>{
 const updates=require('../lib/updates'),original=updates.check,f=fixture(),opened=[];
 const installed={version:'1.0.0',sdk:'1.0',toolRevision:1},release={version:'1.0.1',sdk:'1.0',toolRevision:2,url:'https://github.com/Caner-HK/DeskTile-DevKit/releases/tag/v1.0.1',download:'https://github.com/Caner-HK/DeskTile-DevKit/releases/download/v1.0.1/tool.vsix'};
 f.vscode.Uri={parse:value=>value};f.vscode.env={openExternal:async url=>opened.push(url)};
 try{
  f.open();await f.send({action:'ready'});
  for(const status of ['available','current','no-releases','incompatible']){
   updates.check=async options=>{assert.equal(options.installed.sdk,'1.0');assert.ok(options.signal);return {status,installed,release,otherSdk:{sdk:'1.1'}};};
   await f.send({action:'updates'});assert.equal(f.last().updates.busy,false);assert.ok(f.last().updates.message);assert.equal(f.count,1);assert.deepEqual(f.commands,[]);
   if(status==='available'){await f.send({action:'update-open',value:'download'});await f.send({action:'update-open',value:'notes'});assert.deepEqual(opened,[release.download,release.url]);}
  }
  updates.check=async()=>{throw Error('Could not connect to GitHub. Check your network and try again.');};await f.send({action:'updates'});assert.equal(f.last().updates.error,true);assert.equal(f.last().error,'');await f.send({action:'update-open',value:'releases'});assert.equal(opened.at(-1),'https://github.com/Caner-HK/DeskTile-DevKit/releases');
  let signal;updates.check=async options=>{signal=options.signal;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(Error('cancel'),{code:'CANCELLED'})),{once:true}));};
  const job=f.send({action:'updates'});assert.equal(f.last().updates.busy,true);await f.send({action:'updates'});await f.send({action:'update-cancel'});await job;assert.equal(signal.aborted,true);assert.equal(f.last().updates.message,'Operation cancelled.');assert.deepEqual(f.last().updates.actions,[]);
  const next=f.send({action:'updates'});f.dispose();await next;assert.equal(signal.aborted,true);
 }finally{updates.check=original;f.dispose();}
});
test('update command selects Updates and starts checking after the webview is ready',async()=>{
 const updates=require('../lib/updates'),original=updates.check,f=fixture();let count=0;
 updates.check=async()=>{count++;return {status:'no-releases',installed:{sdk:'1.0'}};};
 try{f.open({tab:'updates',checkUpdates:true});assert.equal(count,0);await f.send({action:'ready'});assert.equal(count,1);assert.ok(f.posts.some(post=>post.tab==='updates'));assert.match(f.last().updates.message,/No stable/);f.open({tab:'updates',checkUpdates:true});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.count,1);assert.equal(count,2);}finally{updates.check=original;f.dispose();}
});
