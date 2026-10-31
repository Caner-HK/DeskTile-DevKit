'use strict';
const fs=require('node:fs'),path=require('node:path'),core=require('./core');
async function prepare(directory,source,options={}){
 const app=core.project(directory),sdk=core.sdkRoot(options);
 if(options.purpose!=='notification'&&app.manifest.icons?.appearances)throw new core.DevKitError('ASSET_APPEARANCES','This project has multiple icon appearances. Edit their existing resource paths separately.');
 if(!['application','tile','notification'].includes(options.purpose)||!['system','custom'].includes(options.mode))throw new core.DevKitError('ASSET_OPTIONS','Choose application, tile or notification and system or custom.');
 if(!['.png','.svg'].includes(path.extname(source).toLowerCase()))throw new core.DevKitError('ASSET_SOURCE','Choose a PNG or SVG image.');
 const padding=options.padding??8;if(!Number.isInteger(padding)||padding<0||padding>30)throw new core.DevKitError('ASSET_PADDING','Padding must be 0–30 percent.');
 const parent=path.join(app.root,'.desktile/assets');fs.mkdirSync(parent,{recursive:true});const output=fs.mkdtempSync(path.join(parent,'draft-'));
 try{await core.run(options.python||process.env.DESKTILE_PYTHON||'python',[path.join(sdk,'tools/icon_asset.py'),path.resolve(source),output,'--purpose',options.purpose,'--mode',options.mode,'--padding',String(padding)],options);}catch(e){fs.rmSync(output,{recursive:true,force:true});throw e;}
 return {directory:app.root,output,purpose:options.purpose,mode:options.mode,light:path.join(output,options.purpose+'-light.png'),dark:path.join(output,options.purpose+'-dark.png')};
}
function apply(draft){
 const app=core.project(draft.directory);
 if(draft.purpose!=='notification'&&app.manifest.icons?.appearances)throw new core.DevKitError('ASSET_APPEARANCES','This project has multiple icon appearances. Edit their existing resource paths separately.');
 if(!core.isWithin(path.join(app.root,'.desktile/assets'),draft.output))throw new core.DevKitError('ASSET_DRAFT','Invalid draft location.');
 const record=JSON.parse(fs.readFileSync(path.join(draft.output,'assets.json'),'utf8'));
 if(record.purpose!==draft.purpose||record.mode!==draft.mode)throw new core.DevKitError('ASSET_DRAFT','Draft options changed.');
 for(const f of record.files){if(!/^(application|notification|tile(?:-(?:1x1|2x2|4x2|4x4))?)\.dti$/.test(f.file))throw new core.DevKitError('ASSET_DRAFT','Invalid resource filename.');fs.accessSync(path.join(draft.output,f.file));}
 const dir=path.join(app.root,'assets');fs.mkdirSync(dir,{recursive:true});const dest=fs.mkdtempSync(path.join(dir,'icon-'));const relative=path.relative(app.root,dest).split(path.sep).join('/');
 const manifest=app.manifest;manifest.icons={...manifest.icons};
 for(const f of record.files)fs.copyFileSync(path.join(draft.output,f.file),path.join(dest,f.file));
 const resource=relative+'/'+draft.purpose+'.dti';
 if(draft.purpose==='notification')manifest.icons.notification={path:resource,mode:draft.mode};
 else{manifest.icons[draft.purpose]=resource;if(draft.purpose==='tile')manifest.icons.tile_variants=draft.mode==='system';}
 const temp=path.join(app.root,'manifest.json.tmp');fs.writeFileSync(temp,JSON.stringify(manifest,null,2)+'\n');fs.renameSync(temp,path.join(app.root,'manifest.json'));
 return {resource,files:record.files.map(f=>relative+'/'+f.file),manifest:path.join(app.root,'manifest.json')};
}
const crypto=require('node:crypto');
const slots=['application','notification','tile','tile-1x1','tile-2x2','tile-4x2','tile-4x4'];
const signature=root=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'manifest.json'))).digest('hex');
function editor(directory){
 const app=core.project(directory),stamp=signature(app.root),saved=path.join(app.root,'.desktile/icon-project.json');
 if(app.manifest.icons?.appearances)throw new core.DevKitError('ASSET_APPEARANCES','This project has multiple icon appearances. Edit their existing resource paths separately.');
 if(fs.existsSync(saved)){
  const data=JSON.parse(fs.readFileSync(saved,'utf8'));
  if(data.signature===stamp&&Object.values(data.items).every(x=>core.isWithin(app.root,x.source)&&fs.existsSync(x.source)))return {directory:app.root,signature:stamp,items:data.items};
 }
 const icons=app.manifest.icons||{},items={};
 for(const key of slots){
  const resource=key==='notification'?icons.notification?.path:key.startsWith('tile-')?(icons.tile_variants?icons.tile?.replace(/\.dti$/,key.slice(4)+'.dti'):icons.tile):icons[key];
  if(!resource)continue;
  const source=path.resolve(app.root,resource);if(!core.isWithin(app.root,source))throw new core.DevKitError('ASSET_SOURCE','Icon path is outside the project.');
  const bytes=fs.readFileSync(source);items[key]={source,mode:bytes[8]===3?'system':'custom',padding:0};
 }
 return {directory:app.root,signature:stamp,items};
}
function importSource(directory,source){
 const app=core.project(directory),ext=path.extname(source).toLowerCase();
 if(!['.png','.svg'].includes(ext))throw new core.DevKitError('ASSET_SOURCE','Choose a PNG or SVG image.');
 const dest=path.join(app.root,'.desktile/icon-sources');fs.mkdirSync(dest,{recursive:true});
 const target=path.join(dest,crypto.randomUUID()+ext);fs.copyFileSync(source,target);return target;
}
async function prepareEditor(state,options={}){
 const app=core.project(state.directory),sdk=core.sdkRoot(options),items=structuredClone(state.items);
 for(const [key,item] of Object.entries(items)){
  if(!slots.includes(key)||!core.isWithin(app.root,item.source)||!['.png','.svg','.dti'].includes(path.extname(item.source).toLowerCase())||!['system','custom'].includes(item.mode)||!Number.isInteger(item.padding)||item.padding<0||item.padding>30)throw new core.DevKitError('ASSET_OPTIONS','Invalid icon settings.');
 }
 if(!items.application||!items.tile)throw new core.DevKitError('ASSET_SOURCE','Choose an application icon and a default tile icon.');
 for(const key of slots.filter(k=>k.startsWith('tile-')))items[key]??={...items.tile};
 const parent=path.join(app.root,'.desktile/assets');fs.mkdirSync(parent,{recursive:true});const output=fs.mkdtempSync(path.join(parent,'editor-'));
 const config=path.join(output,'config.json');fs.writeFileSync(config,JSON.stringify(items));
 try{await core.run(options.python||process.env.DESKTILE_PYTHON||'python',[path.join(sdk,'tools/icon_asset.py'),items.application.source,output,'--config',config],options);}catch(e){fs.rmSync(output,{recursive:true,force:true});throw e;}
 return {...state,items,output};
}
function applyEditor(draft){
 const app=core.project(draft.directory);
 if(signature(app.root)!==draft.signature)throw new core.DevKitError('ASSET_CONFLICT','The manifest changed. Reopen the icon editor before saving.');
 if(!core.isWithin(path.join(app.root,'.desktile/assets'),draft.output))throw new core.DevKitError('ASSET_DRAFT','Invalid draft location.');
 const record=JSON.parse(fs.readFileSync(path.join(draft.output,'assets.json'),'utf8'));
 for(const f of record.files){if(!slots.includes(f.file.replace(/\.dti$/,''))||!f.file.endsWith('.dti'))throw new core.DevKitError('ASSET_DRAFT','Invalid resource filename.');fs.accessSync(path.join(draft.output,f.file));}
 const dir=path.join(app.root,'assets');fs.mkdirSync(dir,{recursive:true});const dest=fs.mkdtempSync(path.join(dir,'icons-')),relative=path.relative(app.root,dest).split(path.sep).join('/');
 for(const f of record.files)fs.copyFileSync(path.join(draft.output,f.file),path.join(dest,f.file));
 const manifest=app.manifest;manifest.icons={...manifest.icons,application:relative+'/application.dti',tile:relative+'/tile.dti',tile_variants:true};
 if(draft.items.notification)manifest.icons.notification={path:relative+'/notification.dti',mode:draft.items.notification.mode};
 const temp=path.join(app.root,'manifest.json.tmp');fs.writeFileSync(temp,JSON.stringify(manifest,null,2)+'\n');fs.renameSync(temp,path.join(app.root,'manifest.json'));
 const stamp=signature(app.root);fs.writeFileSync(path.join(app.root,'.desktile/icon-project.json'),JSON.stringify({signature:stamp,items:draft.items},null,2));
 return {signature:stamp,manifest:path.join(app.root,'manifest.json')};
}
async function convertImage(directory,source,options={}){
 const app=core.project(directory),sdk=core.sdkRoot(options),mode=options.mode||'custom';
 if(!['.png','.jpg','.jpeg','.webp','.svg','.dti'].includes(path.extname(source).toLowerCase()))throw new core.DevKitError('ASSET_SOURCE','Choose PNG, JPEG, WebP, SVG or DTI.');
 if(!['system','custom'].includes(mode))throw new core.DevKitError('ASSET_OPTIONS','Choose system or custom colour mode.');
 if(!options.output)throw new core.DevKitError('ASSET_OUTPUT','Specify --output assets/image.dti.');
 const output=path.resolve(app.root,options.output),assetRoot=path.join(app.root,'assets');
 if(!core.isWithin(assetRoot,output)||path.extname(output).toLowerCase()!=='.dti')throw new core.DevKitError('ASSET_OUTPUT','Output must be a .dti file inside the project assets directory.');
 if(path.resolve(source)===output)throw new core.DevKitError('ASSET_OUTPUT','Choose an output path different from the source.');
 for(let dir=path.dirname(output);core.isWithin(app.root,dir);dir=path.dirname(dir))if(fs.existsSync(dir)&&fs.lstatSync(dir).isSymbolicLink())throw new core.DevKitError('ASSET_OUTPUT','Output directory must be inside the project without symbolic links.');
 if(fs.existsSync(output)&&!options.replace)throw new core.DevKitError('ASSET_EXISTS','Output exists. Use --replace to replace this resource.');
 const args=[];for(const key of ['width','height'])if(options[key]!==undefined){const v=Number(options[key]);if(!Number.isInteger(v)||v<1||v>4096)throw new core.DevKitError('ASSET_SIZE','Dimensions must be 1–4096 pixels.');args.push('--'+key,String(v));}
 const parent=path.join(app.root,'.desktile/assets');fs.mkdirSync(parent,{recursive:true});const draft=fs.mkdtempSync(path.join(parent,'image-'));
 try{
  await core.run(options.python||process.env.DESKTILE_PYTHON||'python',[path.join(sdk,'tools/image_asset.py'),path.resolve(source),draft,'--mode',mode,...args],options);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  if(options.replace){const pending=output+'.'+crypto.randomUUID()+'.tmp';try{fs.copyFileSync(path.join(draft,'image.dti'),pending,fs.constants.COPYFILE_EXCL);fs.renameSync(pending,output);}finally{fs.rmSync(pending,{force:true});}}
  else fs.copyFileSync(path.join(draft,'image.dti'),output,fs.constants.COPYFILE_EXCL);
  return {...JSON.parse(fs.readFileSync(path.join(draft,'image.json'),'utf8')),resource:path.relative(app.root,output).split(path.sep).join('/'),output,light:path.join(draft,'light.png'),dark:path.join(draft,'dark.png')};
 }catch(e){fs.rmSync(draft,{recursive:true,force:true});throw e;}
}
module.exports={prepare,apply,editor,importSource,prepareEditor,applyEditor,convertImage,slots};
