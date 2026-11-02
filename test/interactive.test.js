'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const kit=path.resolve(__dirname,'..'),exe=path.join(kit,'renderer/interactive.exe');
const available=process.platform==='win32'&&fs.existsSync(exe);
const {buildNativePreview}=require('../lib/native-preview'),core=require('../lib/core');
function sandbox(sample){const fixtures=path.join(kit,'build/interactive-fixtures');fs.mkdirSync(fixtures,{recursive:true});const root=fs.mkdtempSync(path.join(fixtures,'app-'));fs.cpSync(path.join(kit,'sdk-bundle/examples',sample),root,{recursive:true,filter:p=>!p.includes(path.sep+'.desktile')&&!p.includes(path.sep+'dist')});return root;}
function run(root,steps,locale='en-US',theme='light'){const f=path.join(root,'scenario.json');fs.writeFileSync(f,JSON.stringify(steps));const r=spawnSync(exe,[root,path.join(kit,'renderer/ui-fonts.pack'),locale,theme,f],{encoding:'utf8',timeout:60000,windowsHide:true});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);}
function snapshot(root,name){return {action:'save',path:path.join(root,name)};}
function rows(root,name){return JSON.parse(fs.readFileSync(path.join(root,name+'.json'),'utf8'));}
function point(row){assert.ok(row,'Expected component in actual layout');return {action:'tap',x:row.x+Math.floor(row.width/2),y:row.y+Math.floor(row.height/2)};}

test('JS and Native templates switch system languages live and animate Large text',{skip:!available},async()=>{
 for(const kind of ['javascript','native']){
  const parent=fs.mkdtempSync(path.join(kit,'build/language-test-')),root=path.join(parent,'app');
  try{
   await core.create(root,{kind,id:'com.example.languages',name:'Reading',author:'DeskTile'});
   if(kind==='native')await buildNativePreview(root,core.sdkRoot(),core.run);
   run(root,[snapshot(root,'english'),{action:'language',value:'zh-CN'},snapshot(root,'simplified'),{action:'language',value:'zh-HK'},snapshot(root,'traditional'),{action:'language',value:'en-US'},snapshot(root,'english-again'),{action:'tap',x:44,y:66},{action:'wait',ms:400},snapshot(root,'nav')]);
   for(const [name,slogan] of [['english','Small Tile. Big Style.'],['simplified','小小桌面，大有可能。'],['traditional','諗得到，玩得到。'],['english-again','Small Tile. Big Style.']])assert.ok(rows(root,name).some(r=>r.text===slogan),kind+' '+name);
   const settings=rows(root,'nav').find(r=>r.text==='Settings');
   const visit=[{action:'tap',x:44,y:66},{action:'wait',ms:400},point(settings),{action:'wait',ms:220}];
   run(root,[...visit,snapshot(root,'off'),{action:'tap',x:720,y:142,ms:1},snapshot(root,'starting'),{action:'wait',ms:180},snapshot(root,'on'),{action:'language',value:'zh-HK'},snapshot(root,'translated-setting')]);
   const region=name=>{const data=fs.readFileSync(path.join(root,name+'.rgb565'));return Buffer.concat(Array.from({length:56},(_,y)=>data.subarray((114+y)*1600+664*2,(114+y)*1600+776*2)));};
   assert.notDeepEqual(region('off'),region('on'),'Toggle must visibly reflect the persisted setting');
   assert.notDeepEqual(region('starting'),region('on'),'Toggle must advance after its first presented frame');
   assert.ok(rows(root,'translated-setting').some(r=>r.text==='大字體'));
   run(root,[snapshot(root,'reopened'),...visit,{action:'tap',x:720,y:142},{action:'wait',ms:180},snapshot(root,'off-again')]);
   const article=r=>r.find(x=>x.text?.startsWith('Keep your favourite'));
   assert.ok(article(rows(root,'reopened')).height>article(rows(root,'english')).height);
   assert.deepEqual(region('off'),region('off-again'));
   const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});for(const n of ['english','simplified','traditional','off','on'])fs.copyFileSync(path.join(root,n+'.rgb565'),path.join(out,'language-'+kind+'-'+n+'.rgb565'));
  }finally{fs.rmSync(parent,{recursive:true,force:true});}
 }
});

test('Native C++ template receives pointer events, switches pages and persists settings',{skip:!available},async()=>{
 const parent=fs.mkdtempSync(path.join(kit,'build/native-test-')),root=path.join(parent,'Application with spaces');
 try{
  await core.create(root,{kind:'native',id:'com.example.nativepreview',name:'Native preview',author:'DeskTile'});
  const source=fs.readFileSync(path.join(root,'src/main.cpp'));
  await buildNativePreview(root,core.sdkRoot(),core.run);
  assert.deepEqual(fs.readFileSync(path.join(root,'src/main.cpp')),source,'Desktop compilation must preserve application sources');
  run(root,[snapshot(root,'home'),{action:'tap',x:44,y:66},{action:'wait',ms:400},snapshot(root,'navigation')]);
  const settings=rows(root,'navigation').find(x=>x.text==='Settings');assert.ok(settings);
  run(root,[{action:'tap',x:44,y:66},{action:'wait',ms:400},point(settings),{action:'wait',ms:200},snapshot(root,'settings')]);
  assert.ok(rows(root,'settings').some(x=>x.text==='Large text'));
  const toggle=rows(root,'settings').find(x=>x.width===112&&x.height===56);assert.ok(toggle);
  run(root,[{action:'tap',x:44,y:66},{action:'wait',ms:400},point(settings),{action:'wait',ms:200},point(toggle)]);
  run(root,[snapshot(root,'reopened'),{action:'theme',value:'dark'},snapshot(root,'dark')]);
  const article=r=>r.find(x=>x.text?.startsWith('Keep your favourite'));
  assert.ok(article(rows(root,'reopened')).height>article(rows(root,'home')).height,'Native setting should survive process restart');
  assert.deepEqual(rows(root,'reopened'),rows(root,'dark'));
  const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});for(const n of ['home','navigation','settings','reopened','dark'])fs.copyFileSync(path.join(root,n+'.rgb565'),path.join(out,'native-'+n+'.rgb565'));
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});

test('JS and Native Nav animate all three states and restore content',{skip:!available},async()=>{
 for(const kind of ['javascript','native']){
  const parent=fs.mkdtempSync(path.join(kit,'build/nav-test-')),root=path.join(parent,'app');
  try{
   await core.create(root,{kind,id:'com.example.navpreview',name:'Navigation',author:'DeskTile'});
   const file=path.join(root,'src',kind==='native'?'main.cpp':'main.js');let source=fs.readFileSync(file,'utf8');
   source=kind==='native'?source.replace('ScaffoldOptions options;','ScaffoldOptions options;options.navigation.dismissed=NavigationMode::Icons;'):source.replace('bottomCount:1','bottomCount:1,navigation:{dismissed:"icons"}');fs.writeFileSync(file,source);
   if(kind==='native')await buildNativePreview(root,core.sdkRoot(),core.run);
   const tap={action:'tap',x:44,y:66,ms:1};
   run(root,[snapshot(root,'hidden'),tap,{action:'wait',ms:48},snapshot(root,'opening'),{action:'wait',ms:400},snapshot(root,'labels'),tap,{action:'wait',ms:48},snapshot(root,'folding'),{action:'wait',ms:220},snapshot(root,'icons'),tap,{action:'wait',ms:220},snapshot(root,'closed')]);
   const panel=name=>rows(root,name).find(r=>r.x===0&&r.y===104&&r.height===376&&r.width>0&&r.width<=320);
   assert.ok(panel('opening').width>0&&panel('opening').width<320);assert.equal(panel('labels').width,320);assert.ok(panel('folding').width>96&&panel('folding').width<320);assert.equal(panel('icons').width,96);assert.equal(panel('closed'),undefined);
   const pixels=n=>fs.readFileSync(path.join(root,n+'.rgb565'));assert.deepEqual(pixels('closed').subarray(104*1600),pixels('hidden').subarray(104*1600));
   const settings=rows(root,'labels').find(r=>r.text==='Settings');assert.ok(settings);
   run(root,[tap,{action:'wait',ms:400},point(settings),{action:'wait',ms:220},snapshot(root,'selected')]);assert.ok(rows(root,'selected').some(r=>r.text==='Large text'));
   const cycles=[];for(let i=0;i<40;i++)cycles.push(tap,{action:'wait',ms:400},tap,{action:'wait',ms:190},tap,{action:'wait',ms:190});run(root,[snapshot(root,'stress-base'),...cycles,snapshot(root,'stress-end')]);assert.deepEqual(pixels('stress-base').subarray(104*1600),pixels('stress-end').subarray(104*1600));
   const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});for(const name of ['hidden','opening','labels','folding','icons','closed'])for(const suffix of ['.rgb565','.json'])fs.copyFileSync(path.join(root,name+suffix),path.join(out,'nav-'+kind+'-'+name+suffix));
  }finally{fs.rmSync(parent,{recursive:true,force:true});}
 }
});

test('App Menu uses intermediate sliding frames, preserves left content and restores after closing',{skip:!available},()=>{
 const root=sandbox('timer-js');try{
  run(root,[snapshot(root,'base'),{action:'tool',id:205,ms:16},snapshot(root,'entering'),{action:'wait',ms:300},snapshot(root,'open'),{action:'tap',x:600,y:378},snapshot(root,'leaving'),{action:'wait',ms:220},snapshot(root,'closed')]);
  const pixels=n=>fs.readFileSync(path.join(root,n+'.rgb565'));const base=pixels('base'),open=pixels('open');
  assert.notDeepEqual(pixels('entering'),open);assert.notDeepEqual(pixels('leaving'),open);assert.notDeepEqual(pixels('leaving'),pixels('closed'));
  for(let y=32;y<480;y++)assert.deepEqual(open.subarray(y*1600,y*1600+440*2),base.subarray(y*1600,y*1600+440*2),'Menu must preserve content outside its panel');
  assert.deepEqual(pixels('closed').subarray(32*1600),base.subarray(32*1600));
  const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});for(const n of ['base','entering','open','leaving','closed'])fs.copyFileSync(path.join(root,n+'.rgb565'),path.join(out,'app-menu-'+n+'.rgb565'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('desktop animation presentation follows the selected frame rate',{skip:!available},()=>{
 const root=sandbox('timer-js');try{
  const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});
  for(const rate of [60,30,15]){
   const file=path.join(out,'menu-cadence-'+rate+'.json');
   const result=spawnSync(exe,[root,path.join(kit,'renderer/ui-fonts.pack'),'en-US','light','--frame-probe',file,String(rate)],{encoding:'utf8',timeout:15000,windowsHide:true});
   assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
   const frames=JSON.parse(fs.readFileSync(file));
   const gaps=frames.slice(1).map((time,i)=>time-frames[i]).filter(gap=>gap<120).sort((a,b)=>a-b);
   assert.ok(frames.length>rate*.8,rate+' FPS needs intermediate presented frames');
   assert.ok(gaps.length>5);
   const median=gaps[gaps.length>>1],expected=1000/rate;
   assert.ok(median>expected*.7&&median<expected*1.35,rate+' FPS median '+median);
  }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('flat toolbar uses system font and exports actual GDI controls with full labels',{skip:!available},()=>{
 const root=sandbox('timer-js'),out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});
 try{run(root,[{action:'chrome',path:path.join(out,'toolbar.bmp')},{action:'tool',id:202},{action:'tool',id:203},{action:'chrome',path:path.join(out,'toolbar-selected.bmp')}]);const a=fs.readFileSync(path.join(out,'toolbar.bmp')),b=fs.readFileSync(path.join(out,'toolbar-selected.bmp'));assert.equal(a.toString('ascii',0,2),'BM');assert.notDeepEqual(a,b);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('Timer recent durations render through QuickJS and persist start-only ordering',{skip:!available},()=>{
 const root=sandbox('timer-js');
 try{
  const data=path.join(root,'.desktile/preview-data/hk.caner.desktile.timer/private');fs.mkdirSync(data,{recursive:true});
  const state=Buffer.alloc(44);state.writeUInt32LE(3);state.writeUInt32LE(90000,4);state.writeUInt32LE(90000,8);
  [359999000,59000,120000].forEach((v,i)=>state.writeUInt32LE(v,32+4*i));
  const file=path.join(data,Buffer.from('timer-v1').toString('hex'));fs.writeFileSync(file,state);
  const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});
  for(const [locale,labels] of [['en-US',['99:59:59','59 seconds','2 minutes']],['zh-CN',['99:59:59','59 秒','2 分钟']],['zh-HK',['99:59:59','59 秒','2 分鐘']]]){
   run(root,[snapshot(root,'recent')],locale);const rendered=rows(root,'recent');
   for(const label of labels){const row=rendered.find(r=>r.text===label);assert.ok(row,label);assert.equal(row.width,176);assert.equal(row.height,52);}
   fs.copyFileSync(path.join(root,'recent.rgb565'),path.join(out,'timer-recents-'+locale+'.rgb565'));
  }
  run(root,[snapshot(root,'before-start')], 'en-US');
  run(root,[point(rows(root,'before-start').find(r=>r.text==='Start')),{action:'wait',ms:100}], 'en-US');
  const saved=fs.readFileSync(file);assert.equal(saved.readUInt32LE(0),3);assert.deepEqual([0,1,2].map(i=>saved.readUInt32LE(32+i*4)),[90000,359999000,59000]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('actual Timer JS responds to pointer input, runs time, opens picker and persists its setting',{skip:!available},()=>{
 const root=sandbox('timer-js');try{
  run(root,[snapshot(root,'home')]);const home=rows(root,'home');assert.ok(home.some(x=>x.text==='05:00'));
  const buttons=home.filter(x=>x.height===52&&x.width===176);assert.equal(buttons.length,4);
  run(root,[point(buttons[0]),snapshot(root,'one')]);assert.ok(rows(root,'one').some(x=>x.text==='01:00'));
  run(root,[snapshot(root,'reopened')]);assert.ok(rows(root,'reopened').some(x=>x.text==='01:00'),JSON.stringify(rows(root,'reopened').filter(x=>x.text)));
  run(root,[point(buttons[3]),snapshot(root,'picker')]);assert.notDeepEqual(rows(root,'picker'),home);
  const start=home.find(x=>x.text==='Start');run(root,[point(start),snapshot(root,'running'),{action:'wait',ms:1200},snapshot(root,'later')]);
  assert.notDeepEqual(fs.readFileSync(path.join(root,'running.rgb565')),fs.readFileSync(path.join(root,'later.rgb565')));
  const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});for(const n of ['home','picker','running','later'])fs.copyFileSync(path.join(root,n+'.rgb565'),path.join(out,'timer-'+n+'.rgb565'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('actual Notes JS accepts text through SDK completion and saves it across process restarts',{skip:!available},()=>{
 const root=sandbox('notes-js');try{
  run(root,[{action:'tap',x:736,y:416},{action:'tap',x:180,y:180},{action:'text',text:'Local preview\nWritten through the real application.'},snapshot(root,'edited')]);
  const edited=rows(root,'edited');assert.ok(edited.some(x=>x.text?.includes('Written through')));
  // Return invokes the app own save/discard dialog, then use the actual Save component.
  run(root,[{action:'tap',x:736,y:416},{action:'tap',x:180,y:180},{action:'text',text:'Local preview\nWritten through the real application.'},{action:'back'},snapshot(root,'confirm')]);
  const save=rows(root,'confirm').find(x=>x.text==='Save');assert.ok(save);
  run(root,[{action:'tap',x:736,y:416},{action:'tap',x:180,y:180},{action:'text',text:'Local preview\nWritten through the real application.'},{action:'back'},point(save),snapshot(root,'saved')]);
  run(root,[snapshot(root,'reopened')]);assert.ok(rows(root,'reopened').some(x=>x.text==='Local preview'),JSON.stringify(rows(root,'reopened').filter(x=>x.text)));
  const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});for(const n of ['edited','confirm','saved','reopened'])fs.copyFileSync(path.join(root,n+'.rgb565'),path.join(out,'notes-'+n+'.rgb565'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('theme and layout overlays update the running application without moving its components',{skip:!available},()=>{
 const root=sandbox('timer-js');try{
  run(root,[snapshot(root,'light'),{action:'theme',value:'dark'},snapshot(root,'dark'),{action:'bounds',value:1},snapshot(root,'bounds')],'zh-HK');
  assert.deepEqual(rows(root,'light'),rows(root,'dark'));
  assert.deepEqual(rows(root,'dark'),rows(root,'bounds'));
  assert.notDeepEqual(fs.readFileSync(path.join(root,'light.rgb565')),fs.readFileSync(path.join(root,'dark.rgb565')));
  assert.notDeepEqual(fs.readFileSync(path.join(root,'dark.rgb565')),fs.readFileSync(path.join(root,'bounds.rgb565')));
  const out=path.join(kit,'build/interactive-evidence');fs.mkdirSync(out,{recursive:true});for(const n of ['light','dark','bounds'])fs.copyFileSync(path.join(root,n+'.rgb565'),path.join(out,'timer-'+n+'.rgb565'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
