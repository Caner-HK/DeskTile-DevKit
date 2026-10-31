'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const core=require('../lib/core');
test('path containment accepts a drive root and rejects siblings and other volumes',()=>{
 const volume=path.parse(process.cwd()).root;
 assert.equal(core.isWithin(volume,path.join(volume,'desktile/user/Packages')),true);
 assert.equal(core.isWithin(path.join(volume,'App'),path.join(volume,'Application/key.pem')),false);
 assert.equal(core.isWithin(volume,volume),false);
 if(process.platform==='win32'){
  assert.equal(core.isWithin('E:\\','E:\\desktile\\user\\Packages'),true);
  assert.equal(core.isWithin('E:\\','F:\\desktile\\user\\Packages'),false);
  assert.equal(core.isWithin('E:\\APP','e:\\app\\secret.pem'),true);
 }
});
test('independent application: create, build, inspect, corrupt, deploy, rebuild',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'DeskTile independent 中文 '));
 try{
  const app=path.join(root,'my app');
  await core.create(app,{id:'com.example.independent',name:'测试应用',author:'Test developer'});
  await assert.rejects(core.create(app,{id:'com.example.independent',name:'test',author:'Test developer'}),{code:'EXISTS'});
  const result=await core.build(app);const first=fs.readFileSync(result.package);
  const info=core.inspect(result.package);assert.equal(info.manifest.id,'com.example.independent');
  assert.ok(!info.files.some(x=>x.includes('.desktile')||x.startsWith('dist/')||x==='jsconfig.json'));
  const second=await core.build(app);assert.deepEqual(fs.readFileSync(second.package),first);
  const custom=await core.build(app,{output:path.join(app,'custom.dtapp')});
  const customAgain=await core.build(app,{output:custom.package});assert.deepEqual(fs.readFileSync(customAgain.package),first);
  fs.rmSync(custom.package);
  await assert.rejects(core.build(app,{signingKey:path.join(app,'secret.pem')}),{code:'SIGNING_KEY_LOCATION'});
  const corrupt=path.join(root,'corrupt.dtapp');const bytes=Buffer.from(first);bytes[bytes.length-1]^=1;fs.writeFileSync(corrupt,bytes);
  assert.throws(()=>core.inspect(corrupt),{code:'PACKAGE_INVALID'});
  const sd=path.join(root,'sd');fs.mkdirSync(path.join(sd,'desktile'),{recursive:true});
  const installed=await core.deploy(result.package,sd);assert.deepEqual(fs.readFileSync(installed.destination),first);
  await assert.rejects(core.deploy(result.package,sd),{code:'EXISTS'});
  await core.deploy(result.package,sd,{replace:true});
  await assert.rejects(core.deploy(result.package,root),{code:'SD_LAYOUT'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('reject invalid projects and incomplete SDKs',async()=>{
 assert.throws(()=>core.sdkRoot({sdk:os.tmpdir()}),{code:'SDK_MISSING'});
 await assert.rejects(core.create('unused',{id:'../escape',name:'test'}),{code:'PACKAGE_ID'});
 await assert.rejects(core.create('unused',{id:'com.example.app',name:'\n'}),{code:'APP_NAME'});
});
test('cancel subprocess work',async()=>{
 const c=new AbortController();const p=core.run(process.execPath,['-e','setTimeout(()=>{},10000)'],{signal:c.signal});c.abort();
 await assert.rejects(p,{code:'CANCELLED'});
});
test('SDK target and Native preview checks',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'devkit-target-'));
 try{
  const app=path.join(root,'native');await core.create(app,{kind:'native',id:'com.example.native',name:'Native',author:'Test'});
  await assert.rejects(core.preview(app),{code:'PREVIEW_PAGE'});
  fs.writeFileSync(path.join(app,'desktile.json'),JSON.stringify({sdk:'1.0',target:'esp32p4'}));
  assert.throws(()=>core.project(app),{code:'PROJECT_TARGET'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('native markup renderer produces two valid PNGs from a Unicode path',async()=>{
 if(!fs.existsSync(path.join(core.ROOT,'renderer/preview.exe')))return;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'devkit 预览 '));
 try{
  const app=path.join(root,'project');await core.create(app,{id:'com.example.preview',name:'Preview',author:'Test'});
  const frames=await core.preview(app);
  for(const p of [frames.light,frames.dark]){const b=fs.readFileSync(p);assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),800);assert.equal(b.readUInt32BE(20),480);}
  assert.notDeepEqual(fs.readFileSync(frames.light),fs.readFileSync(frames.dark));
  await assert.rejects(core.preview(app,{page:'../outside.html'}),{code:'PREVIEW_PATH'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
