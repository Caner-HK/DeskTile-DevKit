'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {html}=require('../lib/device-panel');
test('device panel keeps consecutive render samples across status messages and bounds history',()=>{
 const elements=new Map(),handlers={},sent=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',getBoundingClientRect:()=>({width:700,height:130}),getContext:()=>new Proxy({},{get:()=>()=>{}})});return elements.get(id);};
 const context=vm.createContext({document:{getElementById:element,body:{}},window:{addEventListener:(id,fn)=>handlers[id]=fn},acquireVsCodeApi:()=>({postMessage:m=>sent.push(m)}),devicePixelRatio:1,getComputedStyle:()=>({color:'#ddd'}),ResizeObserver:class{observe(){}}});
 vm.runInContext(html('test').match(/<script nonce="test">([\s\S]*?)<\/script>/)[1],context);
 const emit=data=>handlers.message({data});
 for(let i=0;i<130;i++){
  emit({type:'state',running:true,port:'COM4',message:'Receiving device samples'});
  emit({type:'metrics',ms:1000*i,render_us:10000*i,psram_free:1048576,internal_free:65536,scroll_bytes:0,dialog_bytes:0});
 }
 assert.equal(element('render').textContent,'10.0 ms/s');assert.equal(vm.runInContext('samples.length',context),120);
 element('stop').onclick();assert.equal(sent.at(-1).type,'stop');
 emit({type:'state',running:false,port:'COM4',message:'Stopped'});emit({type:'state',running:true,port:'COM4',message:'Connecting'});
 emit({type:'metrics',ms:140000,render_us:0,psram_free:1048576,internal_free:65536,scroll_bytes:0,dialog_bytes:0});
 assert.equal(element('render').textContent,'0.0 ms/s');
 element('clear').onclick();assert.equal(vm.runInContext('samples.length',context),0);
});
