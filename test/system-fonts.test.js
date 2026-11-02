'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),fonts=require('../lib/system-fonts'),designer=require('../lib/icon-designer');
const base=path.resolve(__dirname,'../build/system-font-tests');fs.mkdirSync(base,{recursive:true});
test('native system fonts expose real glyph coverage, sizes and CJK fallback',async()=>{
 const root=fs.mkdtempSync(path.join(base,'glyphs-'));
 try{
  const requests=Object.keys(fonts.families).flatMap(font=>fonts.sizes.map(size=>({font,size,chars:'A中驗🙂'}))),data=await fonts.glyphs(root,requests),hash=value=>crypto.createHash('sha256').update(value||'').digest('hex');
  for(const size of fonts.sizes){
   const chinese=[],latin=[];for(const font of Object.keys(fonts.families)){const glyphs=data[fonts.key(font,size)],at=cp=>glyphs.find(value=>value.cp===cp),a=at(65),c=at('中'.codePointAt(0)),extended=at('驗'.codePointAt(0));assert.equal(c.advance,size);assert.ok(c.width>0&&c.height>0);assert.ok(!extended.missing);assert.equal(c.pixels.length,Math.ceil(c.width*c.height/2)*2);assert.equal(at('🙂'.codePointAt(0)).missing,true);chinese.push(hash(c.pixels));latin.push(hash(a.pixels));}
   assert.equal(new Set(chinese).size,1,'Native Chinese fallback must stay the same across western font choices');assert.ok(new Set(latin).size>=3,'Native western glyph masks must change with the family');
  }
  assert.deepEqual(await fonts.glyphs(root,requests),data,'Cached glyphs retain exact native metrics and pixels');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('font requests validate native choices and cancellation releases temporary files',async()=>{
 const root=fs.mkdtempSync(path.join(base,'errors-'));
 try{
  for(const request of [{font:'system:misans',size:24,chars:'A'},{font:'system:unknown',size:32,chars:'A'},{font:'__proto__',size:32,chars:'A'}])await assert.rejects(fonts.glyphs(root,[request]),{code:'FONT_OPTIONS'});
  const abort=new AbortController();abort.abort();await assert.rejects(fonts.glyphs(root,[{font:'system:serif',size:48,chars:'Z'}],{signal:abort.signal}),error=>error.code==='CANCELLED');
  const directory=path.join(root,'.desktile/assets');assert.ok(!fs.existsSync(directory)||!fs.readdirSync(directory).some(name=>name.startsWith('system-fonts-')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('system tile presets match desktop icon placement and title geometry',()=>{
 assert.deepEqual(designer.presets['tile-1x1'],{icon:{x:20,y:20,w:40,h:40},title:null});
 assert.deepEqual(designer.presets['tile-2x2'],{icon:{x:52,y:42,w:64,h:64},title:{x:16,y:124,w:136,h:36,size:32}});
 assert.deepEqual(designer.presets['tile-4x2'],{icon:{x:132,y:34,w:80,h:80},title:{x:16,y:124,w:312,h:36,size:32}});
 assert.deepEqual(designer.presets['tile-4x4'],{icon:{x:108,y:98,w:128,h:128},title:{x:16,y:300,w:312,h:36,size:32}});
});
test('closing an editor cancels native font loading without an error banner or abort stack',async()=>{
 const core=require('../lib/core'),root=fs.mkdtempSync(path.join(base,'panel-')),app=path.join(root,'app'),messages=[],logs=[];let receive,dispose;
 try{
  await core.create(app,{id:'com.example.fontcancel',name:'Fonts',author:'Test'});
  const panel={webview:{html:'',postMessage(value){messages.push(value);},onDidReceiveMessage(callback){receive=callback;}},onDidDispose(callback){dispose=callback;},reveal(){}};
  require('../lib/asset-panel').open({window:{createWebviewPanel(){return panel;}},ViewColumn:{Active:1}},{subscriptions:[]},app,()=>({log:value=>logs.push(value)}));
  const pending=receive({type:'fonts',requests:[{font:'system:cabin',size:48,chars:'新'}]});dispose();await pending;
  assert.equal(messages.length,0);assert.doesNotMatch(logs.join(''),/aborted|CANCELLED|Error:/i);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

