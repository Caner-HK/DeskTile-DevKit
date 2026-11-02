'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),core=require('../lib/core');
const kit=path.resolve(__dirname,'..'),exe=path.join(kit,'renderer/interactive.exe');
test('preview runs public SDK icon selection, resolves resources, persists 43 choices and resets',{skip:!fs.existsSync(exe),timeout:30000},async()=>{
 const base=path.join(kit,'build/icon-preview-tests');fs.mkdirSync(base,{recursive:true});const root=fs.mkdtempSync(path.join(base,'case-')),app=path.join(root,'app');
 try{
  await core.create(app,{id:'com.example.iconpreview',name:'Icon preview',author:'Test'});const manifest=JSON.parse(fs.readFileSync(path.join(app,'manifest.json')));manifest.icons.appearances={default:'P00',from_resources:true};fs.writeFileSync(path.join(app,'manifest.json'),JSON.stringify(manifest));
  for(let i=0;i<43;i++){
   const id='P'+String(i).padStart(2,'0'),data=Buffer.alloc(12+96*96*2);data.write('DTI1');data.writeUInt16LE(96,4);data.writeUInt16LE(96,6);for(let at=12;at<data.length;at+=2)data.writeUInt16LE(0xf800+i,at);
   const directory=path.join(app,'assets',id);fs.mkdirSync(directory);fs.writeFileSync(path.join(directory,'application.dti'),data);fs.writeFileSync(path.join(directory,'tile.dti'),data);
  }
  const run=steps=>{const scenario=path.join(root,'scenario.json');fs.writeFileSync(scenario,JSON.stringify(steps));const result=spawnSync(exe,[app,path.join(kit,'renderer/ui-fonts.pack'),'en-US','light',scenario],{encoding:'utf8',windowsHide:true,timeout:15000,env:{...process.env,DESKTILE_PREVIEW_CONFIG_DIR:path.join(root,'preferences')}});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);};
  const output=i=>path.join(root,'receipt-'+i+'.json');
  run(Array.from({length:43},(_,i)=>({action:'icon-appearance',value:'P'+String(i).padStart(2,'0'),resource:'assets/application.dti',output:output(i),ms:0})));
  for(let i=0;i<43;i++){const receipt=JSON.parse(fs.readFileSync(output(i)));assert.equal(receipt.id,'P'+String(i).padStart(2,'0'));assert.equal(receipt.pixel,0xf800+i);assert.equal(receipt.paintPixel,receipt.pixel,'Rendered icon cache must follow the selected SDK appearance');}
  run([{action:'icon-appearance',resource:'assets/application.dti',output:output('persist')},{action:'icon-appearance',value:'../escape',result:-3,output:output('invalid')},{action:'icon-appearance',value:'missing',result:-8,output:output('missing')},{action:'icon-appearance',value:'',resource:'assets/application.dti',output:output('reset')}]);
  assert.equal(JSON.parse(fs.readFileSync(output('persist'))).id,'P42');assert.equal(JSON.parse(fs.readFileSync(output('invalid'))).id,'P42');assert.equal(JSON.parse(fs.readFileSync(output('missing'))).id,'P42');assert.equal(JSON.parse(fs.readFileSync(output('reset'))).id,'P00');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
