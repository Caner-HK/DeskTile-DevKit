'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const core=require('../lib/core');
test('already cancelled operations never start; actual failures keep their error classification',async()=>{
 const c=new AbortController();c.abort();
 await assert.rejects(core.run(process.execPath,['-e','throw Error("must not run")'],{signal:c.signal}),e=>e.code==='CANCELLED'&&e.message==='Operation cancelled.');
 await assert.rejects(core.run(process.execPath,['-e','process.stderr.write("compiler failed");process.exit(7)']),e=>e.code==='PROCESS_FAILED'&&/exited 7/.test(e.message)&&/compiler failed/.test(e.message));
 await assert.rejects(core.run(path.join(__dirname,'missing-executable'),[]),{code:'PROCESS_START'});
});
test('repeated cancellation waits for the child process tree to exit',async()=>{
 for(let attempt=0;attempt<3;attempt++){
  const c=new AbortController();let ready,pids;const started=new Promise(r=>{ready=r;});
  const code='const child=require("node:child_process").spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});console.log(JSON.stringify([process.pid,child.pid]));setInterval(()=>{},1000);';
  let output='';const run=core.run(process.execPath,['-e',code],{signal:c.signal,log:s=>{output+=s;if(output.includes('\n')){pids=JSON.parse(output.trim());ready();}}});
  const stopped=assert.rejects(run,e=>e.code==='CANCELLED'&&e.message==='Operation cancelled.');
  await started;c.abort();await stopped;
  for(const pid of pids)assert.throws(()=>process.kill(pid,0),e=>e.code==='ESRCH','Process '+pid+' must be gone before cancellation settles');
 }
});
test('abort listeners are released after a completed operation',async()=>{
 const c=new AbortController();assert.equal(await core.run(process.execPath,['-e','process.stdout.write("complete")'],{signal:c.signal}),'complete');c.abort();
 assert.equal(await core.run(process.execPath,['-e','process.stdout.write("next")']),'next');
});
test('VS Code notification cancellation is a normal result while real build failures show errors',async()=>{
 const commands=new Map(),errors=[],logs=[];let onCancel,started;const began=new Promise(r=>{started=r;}),disposable={dispose(){}};
 const vscode={EventEmitter:class{event=()=>({dispose(){}});fire(){}dispose(){}},env:{language:'en'},workspace:{isTrusted:true,workspaceFolders:[{uri:{fsPath:__dirname}}],textDocuments:[],getConfiguration:()=>({get:(_key,fallback)=>fallback}),onDidChangeConfiguration:()=>disposable,onDidOpenTextDocument:()=>disposable,onDidChangeTextDocument:()=>disposable,onDidCloseTextDocument:()=>disposable},window:{createOutputChannel:()=>({append:s=>logs.push(s),appendLine:s=>logs.push(s),show:()=>logs.push('OUTPUT_OPENED'),dispose(){}}),withProgress:(_o,fn)=>fn({}, {onCancellationRequested:fn=>{onCancel=fn;return disposable;}}),showErrorMessage:s=>errors.push(s),showInformationMessage:async()=>undefined,registerTreeDataProvider:()=>disposable},languages:{createDiagnosticCollection:()=>disposable,registerCompletionItemProvider:()=>disposable},commands:{registerCommand:(id,fn)=>{commands.set(id,fn);return disposable;}},tasks:{registerTaskProvider:()=>disposable},ProgressLocation:{Notification:1}};
 const file=path.resolve(__dirname,'../lib/extension.js'),module={exports:{}},requireFrom=createRequire(file);
 new vm.Script('(function(require,module,exports){'+fs.readFileSync(file,'utf8')+'\n})',{filename:file}).runInThisContext()(id=>id==='vscode'?vscode:requireFrom(id),module,module.exports);
 const old=core.build,context={subscriptions:[]};
 try{
  module.exports.activate(context);
  core.build=async(_root,o)=>{const running=core.run(process.execPath,['-e','setInterval(()=>{},1000)'],o);started();return running;};
  const pending=commands.get('desktile.build')();await began;onCancel();await pending;
  assert.deepEqual(errors,[]);assert.ok(logs.includes('Operation cancelled.'));assert.ok(!logs.some(s=>/AbortError|operation was aborted|ChildProcess/.test(s)));assert.ok(!logs.includes('OUTPUT_OPENED'));
  core.build=async()=>{throw new core.DevKitError('PROCESS_FAILED','Real compiler failure');};await commands.get('desktile.build')();assert.deepEqual(errors,['Real compiler failure']);
 }finally{core.build=old;for(const entry of context.subscriptions)entry.dispose?.();}
});
