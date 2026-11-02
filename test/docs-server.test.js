'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),net=require('node:net'),http=require('node:http'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm'),{once}=require('node:events'),{createRequire}=require('node:module');
const {DocumentationServer}=require('../lib/docs-server'),i18n=require('../lib/i18n'),root=path.resolve(__dirname,'..');
async function freePort(){const listener=net.createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise(r=>listener.close(r));return port;}
async function checkFree(port){const listener=net.createServer();await new Promise((resolve,reject)=>{listener.once('error',reject);listener.listen(port,'127.0.0.1',resolve);});await new Promise(r=>listener.close(r));}
async function request(url){return new Promise((resolve,reject)=>{http.get(url,{agent:false},response=>{let body='';response.on('data',data=>body+=data);response.on('end',()=>resolve({status:response.statusCode,body}));}).on('error',reject);});}

test('documentation service shares concurrent opens, releases its actual port and restarts',async()=>{
 i18n.configure('en');const port=await freePort(),states=[],server=new DocumentationServer({root,port,onChange:()=>states.push(server.running)});
 try{
  const first=server.start(),second=server.start();assert.equal(first,second);const url=await first,pid=server.child.pid;
  const page=await request(url);assert.equal(page.status,200);assert.match(page.body,/<html/i);assert.equal(server.running,true);
  assert.equal(await server.stop(),true);assert.equal(server.running,false);assert.throws(()=>process.kill(pid,0),error=>error.code==='ESRCH');await checkFree(port);
  assert.equal(await server.stop(),false);await server.start();assert.equal((await request(url)).status,200);assert.notEqual(server.child.pid,pid);await server.stop();assert.deepEqual(states,[true,false,true,false]);
 }finally{await server.stop();}
});

test('stopping a starting documentation process is normal cancellation and a new open can follow',async()=>{
 const port=await freePort(),server=new DocumentationServer({root,port});
 try{const pending=assert.rejects(server.start(),error=>error.code==='CANCELLED');await server.stop();await pending;assert.equal(server.running,false);await checkFree(port);await server.start();assert.equal(server.running,true);}finally{await server.stop();}
});

test('documentation failure preserves an existing listener and startup timeout releases the owned child',async()=>{
 i18n.configure('en');const existing=net.createServer(socket=>socket.end());existing.listen(0,'127.0.0.1');await once(existing,'listening');const port=existing.address().port,logs=[],server=new DocumentationServer({root,port,log:s=>logs.push(s)});
 try{await assert.rejects(server.start(),/Documentation server exited/);assert.equal(server.running,false);assert.equal(existing.listening,true);assert.match(logs.join(''),/EADDRINUSE/);}finally{await server.stop();await new Promise(r=>existing.close(r));}
 const timeout=new DocumentationServer({root,port:await freePort(),startupMs:1});
 try{await assert.rejects(timeout.start(),/did not start/);assert.equal(timeout.running,false);await checkFree(timeout.port);}finally{await timeout.stop();}
});

test('extension disposal terminates its owned documentation service',async()=>{
 const server=new DocumentationServer({root,port:await freePort()});try{await server.start();const pid=server.child.pid,closed=once(server.child,'close');server.dispose();await closed;assert.equal(server.running,false);assert.throws(()=>process.kill(pid,0),error=>error.code==='ESRCH');await checkFree(server.port);}finally{await server.stop();}
});

test('localized documentation stop command appears after Documentation only while its service is active',async()=>{
 for(const language of ['en','zh-cn']){
  const commands=new Map(),errors=[],opened=[],events=[],disposable={dispose(){}};let tree,service;
  class Emitter{event=listener=>{events.push(listener);return disposable;};fire(){for(const listener of events)listener();}dispose(){events.length=0;}}
  class FakeServer{constructor(options){this.options=options;this.running=false;service=this;}async start(){this.running=true;this.options.onChange();return 'http://127.0.0.1:8800/';}async stop(){const active=this.running;this.running=false;this.options.onChange();return active;}dispose(){this.stop();}}
  const vscode={EventEmitter:Emitter,TreeItem:class{constructor(label){this.label=label;}},ThemeIcon:class{constructor(id){this.id=id;}},Uri:{parse:value=>value},env:{language,openExternal:async uri=>opened.push(uri)},workspace:{isTrusted:true,workspaceFolders:[],textDocuments:[],getConfiguration:()=>({get:(_key,fallback)=>fallback}),onDidChangeConfiguration:()=>disposable,onDidOpenTextDocument:()=>disposable,onDidChangeTextDocument:()=>disposable,onDidCloseTextDocument:()=>disposable},window:{createOutputChannel:()=>({append(){},appendLine(){},show(){},dispose(){}}),showErrorMessage:message=>errors.push(message),registerTreeDataProvider:(_id,provider)=>{tree=provider;return disposable;}},languages:{createDiagnosticCollection:()=>disposable,registerCompletionItemProvider:()=>disposable},commands:{registerCommand:(id,fn)=>{commands.set(id,fn);return disposable;}},tasks:{registerTaskProvider:()=>disposable}};
  const file=path.join(root,'lib/extension.js'),module={exports:{}},requireFrom=createRequire(file),context={subscriptions:[]};
  new vm.Script('(function(require,module,exports){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file}).runInThisContext()(id=>id==='vscode'?vscode:id==='./docs-server'?{DocumentationServer:FakeServer}:requireFrom(id),module,module.exports);
  try{
   module.exports.activate(context);let updates=0;tree.onDidChangeTreeData(()=>updates++);
   assert.ok(!tree.getChildren().some(item=>item.command.command==='desktile.docsStop'));
   await commands.get('desktile.docs')();assert.equal(service.running,true);const rows=tree.getChildren(),index=rows.findIndex(item=>item.command.command==='desktile.docs');
   assert.equal(rows[index+1].command.command,'desktile.docsStop');assert.equal(rows[index+1].label,language==='en'?'Stop documentation server':'停止文档服务');assert.equal(rows[index+1].iconPath.id,'debug-stop');assert.equal(opened[0],'http://127.0.0.1:8800/'+(language==='en'?'en/':''));
   await commands.get('desktile.docsStop')();assert.equal(service.running,false);assert.ok(!tree.getChildren().some(item=>item.command.command==='desktile.docsStop'));assert.equal(updates,2);assert.deepEqual(errors,[]);
  }finally{for(const entry of context.subscriptions)entry.dispose?.();}
 }
 i18n.configure('en');
});
