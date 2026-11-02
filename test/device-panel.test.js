'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {html}=require('../lib/device-panel');
test('device panel renders the selected port before its ready handshake',()=>{
 assert.ok(html('test','COM4').split('</header>')[0].includes('id="status"'));assert.ok(!html('test','COM4').split('<main>')[1].includes('id="status"'));
 assert.match(html('test','COM4'),/<span id="port">COM4<\/span>/);
 assert.match(html('test','<port>'),/&lt;port&gt;/);
});
test('device panel keeps consecutive render samples across status messages and bounds history',()=>{
 const elements=new Map(),handlers={},sent=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',getBoundingClientRect:()=>({width:700,height:130}),getContext:()=>new Proxy({},{get:()=>()=>{}})});return elements.get(id);};
 const context=vm.createContext({document:{getElementById:element,body:{}},window:{addEventListener:(id,fn)=>handlers[id]=fn},acquireVsCodeApi:()=>({postMessage:m=>sent.push(m)}),devicePixelRatio:1,getComputedStyle:()=>({color:'#ddd'}),ResizeObserver:class{observe(){}}});
 vm.runInContext(html('test').match(/<script nonce="test">([\s\S]*?)<\/script>/)[1],context);
 const emit=data=>handlers.message({data});
 emit({type:'state',port:'COM4',running:false,message:'Ready'});assert.equal(element('port').textContent,'COM4');
 for(let i=0;i<130;i++){
  emit({type:'state',running:true,port:'COM4',message:'Receiving device samples'});
  emit({type:'metrics',ms:1000*i,render_us:10000*i,psram_free:1048576,internal_free:65536,scroll_bytes:0,dialog_bytes:0});
 }
 assert.equal(element('render').textContent,'10.0 ms/s');assert.equal(vm.runInContext('samples.length',context),120);
 element('stop').onclick();assert.equal(sent.at(-1).type,'stop');
 emit({type:'state',running:false,port:'COM4',message:'Stopped'});emit({type:'state',running:true,port:'COM4',message:'Connecting'});
 emit({type:'metrics',ms:140000,render_us:0,psram_free:1048576,internal_free:65536,scroll_bytes:0,dialog_bytes:0});
 assert.equal(element('render').textContent,'0.0 ms/s');
 emit({type:'state',running:false,message:'Stopped'});assert.equal(element('port').textContent,'COM4');
 element('clear').onclick();assert.equal(element('port').textContent,'COM4');assert.equal(vm.runInContext('samples.length',context),0);
});
