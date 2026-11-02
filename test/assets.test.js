'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const core=require('../lib/core'),assets=require('../lib/assets');
test('image conversion preserves dimensions, decodes every DTI format and packages custom resources',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-images-'));
 const header=(kind,w=3,h=1)=>{const b=Buffer.alloc(12);b.write('DTI1');b.writeUInt16LE(w,4);b.writeUInt16LE(h,6);b[8]=kind;return b;};
 const words=(...values)=>{const b=Buffer.alloc(values.length*2);values.forEach((v,i)=>b.writeUInt16LE(v,i*2));return b;};
 try{
  const app=path.join(root,'app');await core.create(app,{id:'com.example.images',name:'Images',author:'Test'});
  const source=path.join(root,'original.dti');
  for(const [kind,payload] of [[0,words(0xf800,0xf800,0x001f)],[1,words(2,0xf800,1,0x001f)],[2,Buffer.concat([Buffer.from([0xe0]),words(0xf800,0xf800,0x001f)])]]){
   fs.writeFileSync(source,Buffer.concat([header(kind),payload]));
   const result=await assets.convertImage(app,source,{output:`assets/format${kind}.dti`});
   assert.equal(result.width,3);assert.equal(result.height,1);
   assert.deepEqual(fs.readFileSync(result.output),Buffer.concat([header(2),Buffer.from([0xe0]),words(0xf800,0xf800,0x001f)]));
   assert.ok(fs.statSync(result.light).size>0);
  }
  fs.writeFileSync(source,Buffer.concat([header(1,344,344),words(65535,0x1234,344*344-65535,0x1234)]));
  const long=await assets.convertImage(app,source,{output:'assets/long-run.dti'});assert.deepEqual([long.width,long.height],[344,344]);
  fs.writeFileSync(source,Buffer.concat([header(3),Buffer.from([0,127,255])]));
  const alpha=await assets.convertImage(app,source,{output:'assets/mask.dti',mode:'system'});
  assert.deepEqual(fs.readFileSync(alpha.output),fs.readFileSync(source));
  const svg=path.join(root,'wide.svg');fs.writeFileSync(svg,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path fill="#0088ff" d="M0 0h200v100H0z"/></svg>');
  const original=await assets.convertImage(app,svg,{output:'assets/original.dti'});assert.deepEqual([original.width,original.height],[200,100]);
  const small=await assets.convertImage(app,svg,{output:'assets/small.dti',width:80,height:80});assert.deepEqual([small.width,small.height],[80,40]);
  const png=await assets.convertImage(app,original.light,{output:'assets/from-png.dti'});assert.deepEqual([png.width,png.height],[200,100]);
  await assert.rejects(assets.convertImage(app,svg,{output:'assets/small.dti'}),{code:'ASSET_EXISTS'});
  await assets.convertImage(app,svg,{output:'assets/small.dti',width:40,replace:true});
  await assert.rejects(assets.convertImage(app,svg,{output:'../escape.dti'}),{code:'ASSET_OUTPUT'});
  for(const payload of [words(4,0xf800),words(0,0xf800),words(2,0xf800),words(2)]){
   fs.writeFileSync(source,Buffer.concat([header(1),payload]));await assert.rejects(assets.convertImage(app,source,{output:'assets/broken.dti'}));assert.equal(fs.existsSync(path.join(app,'assets/broken.dti')),false);
  }
  const built=await core.build(app),info=core.inspect(built.package);assert.ok(info.files.includes('assets/small.dti'));assert.ok(info.files.includes('assets/mask.dti'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('panel saves independent coloured tile sizes, reloads editable sources and builds them',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-panel-'));
 try{
  const app=path.join(root,'app');await core.create(app,{id:'com.example.panel',name:'Panel test',author:'Test'});
  const state=assets.editor(app),before=fs.readFileSync(path.join(app,'manifest.json'),'utf8');
  let i=0;for(const slot of assets.slots){const source=path.join(root,slot+'.svg');fs.writeFileSync(source,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="${i++}" width="60" height="100" fill="#ff0000"/></svg>`);state.items[slot]={source:assets.importSource(app,source),mode:slot==='application'?'system':'custom',padding:0};}
  const draft=await assets.prepareEditor(state);assert.equal(fs.readFileSync(path.join(app,'manifest.json'),'utf8'),before);
  for(const [key,size] of [['tile-1x1',40],['tile-2x2',64],['tile-4x2',80],['tile-4x4',128]]){const b=fs.readFileSync(path.join(draft.output,key+'.dti'));assert.equal(b[8],2);assert.equal(b.readUInt16LE(4),size);assert.equal(b.length,12+size*size*2+Math.ceil(size*size/8));}
  assets.applyEditor(draft);assert.deepEqual(assets.editor(app).items,draft.items);
  const built=await core.build(app),info=core.inspect(built.package);assert.equal(info.manifest.icons.tile_variants,true);
  for(const size of ['1x1','2x2','4x2','4x4'])assert.ok(info.files.includes(info.manifest.icons.tile.replace('.dti','-'+size+'.dti')));
  const again=await assets.prepareEditor(assets.editor(app));for(const slot of assets.slots)assert.deepEqual(fs.readFileSync(path.join(again.output,slot+'.dti')),fs.readFileSync(path.join(draft.output,slot+'.dti')));
  fs.appendFileSync(path.join(app,'manifest.json'),' ');assert.throws(()=>assets.applyEditor(again),{code:'ASSET_CONFLICT'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('SVG and PNG icons: preview, native sizes, colour modes, manifest and installable package',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-assets-'));
 try{
  const app=path.join(root,'app');await core.create(app,{id:'com.example.assets',name:'Asset test',author:'Test'});
  const source=path.join(root,'wide.svg');fs.writeFileSync(source,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path fill="#ff0000" d="M0 0h100v100H0z"/><path fill="#0000ff" d="M100 0h100v100H100z"/></svg>');
  const manifestBefore=fs.readFileSync(path.join(app,'manifest.json'),'utf8');
  const draft=await assets.prepare(app,source,{purpose:'tile',mode:'system',padding:8});
  assert.equal(fs.readFileSync(path.join(app,'manifest.json'),'utf8'),manifestBefore);
  for(const [name,size] of [['tile',96],['tile-1x1',40],['tile-2x2',64],['tile-4x2',80],['tile-4x4',128]]){
   const b=fs.readFileSync(path.join(draft.output,name+'.dti'));assert.equal(b.toString('ascii',0,4),'DTI1');assert.equal(b.readUInt16LE(4),size);assert.equal(b.readUInt16LE(6),size);assert.equal(b[8],3);assert.equal(b.length,12+size*size);
   const nonempty=[];for(let y=0;y<size;y++)if(b.subarray(12+y*size,12+(y+1)*size).some(x=>x))nonempty.push(y);
   assert.ok(nonempty.length<size*0.6,'wide source keeps its aspect ratio');
  }
  assets.apply(draft);
  const colored=await assets.prepare(app,source,{purpose:'notification',mode:'custom',padding:0});assets.apply(colored);
  const data=fs.readFileSync(path.join(colored.output,'notification.dti'));assert.equal(data[8],2);assert.equal(data.readUInt16LE(12+128+2*(16*32+8)),0xf800);assert.equal(data.readUInt16LE(12+128+2*(16*32+24)),0x001f);
  const png=await assets.prepare(app,colored.light,{purpose:'application',mode:'custom'});assets.apply(png);
  const built=await core.build(app),info=core.inspect(built.package);assert.equal(info.manifest.icons.notification.mode,'custom');assert.equal(info.manifest.icons.tile_variants,true);
  assert.ok(info.files.includes(info.manifest.icons.notification.path));
  fs.writeFileSync(source,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><image href="file:///private.png"/></svg>');
  await assert.rejects(assets.prepare(app,source,{purpose:'tile',mode:'custom'}));
  const manifest=JSON.parse(fs.readFileSync(path.join(app,'manifest.json')));manifest.icons.appearances={default:'one',choices:['one']};fs.writeFileSync(path.join(app,'manifest.json'),JSON.stringify(manifest));
  await assert.rejects(assets.prepare(app,source,{purpose:'tile',mode:'system'}),{code:'ASSET_APPEARANCES'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
