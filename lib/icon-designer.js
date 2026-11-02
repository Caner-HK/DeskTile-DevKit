'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),core=require('./core'),{t}=require('./i18n');
const sizes={application:[96,96],notification:[32,32],tile:[96,96],'tile-1x1':[80,80],'tile-2x2':[168,168],'tile-4x2':[344,168],'tile-4x4':[344,344]};
const titleOffset=10,tileSides={'tile-1x1':40,'tile-2x2':64,'tile-4x2':80,'tile-4x4':128};
const presets=Object.fromEntries(Object.entries(tileSides).map(([key,side])=>{const [w,h]=sizes[key],small=key==='tile-1x1';return [key,{icon:{x:(w-side)/2,y:(h-side)/2-(small?0:titleOffset),w:side,h:side},title:small?null:{x:16,y:h-44,w:w-32,h:36,size:32}}];}));
const locales=['zh-CN','zh-HK','en'],stamp=root=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'manifest.json'))).digest('hex');
function sourcePath(root,relative){
 const resolved=path.resolve(root,relative);
 if(!core.isWithin(root,resolved)||!core.isWithin(fs.realpathSync(root),fs.realpathSync(resolved)))throw new core.DevKitError('ASSET_SOURCE','Image must belong to this project.');
 return resolved;
}
function textMap(value,fallback=''){if(typeof value==='string')return Object.fromEntries(locales.map(key=>[key,value]));return Object.fromEntries(locales.map(key=>[key,(key==='en'?(value?.['en-US']??value?.en):value?.[key])??fallback]));}
function appearanceChoices(app){
 const declared=app.manifest.icons.appearances;if(!declared)return ['default'];
 if(!declared.from_resources)return declared.choices;
 const base=path.dirname(app.manifest.icons.application),tile=path.basename(app.manifest.icons.tile),tileBase=path.dirname(app.manifest.icons.tile);
 return fs.readdirSync(path.join(app.root,base),{withFileTypes:true}).filter(entry=>entry.isDirectory()&&/^[A-Za-z0-9_-]{1,16}$/.test(entry.name)&&fs.existsSync(path.join(app.root,base,entry.name,path.basename(app.manifest.icons.application)))&&fs.existsSync(path.join(app.root,tileBase,entry.name,tile))).map(entry=>entry.name).sort();
}
function metadata(manifest){return {names:textMap(manifest.name,typeof manifest.name==='string'?manifest.name:manifest.name['zh-CN']||manifest.name['zh-HK']||manifest.name['en-US']||manifest.name.en||''),tileNames:Object.fromEntries(['1x1','2x2','4x2','4x4'].map(key=>[key,textMap(manifest.tile.names?.[key])])),tileTitles:Object.fromEntries(['1x1','2x2','4x2','4x4'].map(key=>[key,key!=='1x1'&&manifest.tile.show_title?.[key]!==false]))};}
function binding(app){const icons=app.manifest.icons;return JSON.stringify([icons.application,icons.tile,[icons.notification?.path,icons.notification?.mode],Boolean(icons.tile_variants),Boolean(app.manifest.tile.full_image),appearanceChoices(app)]);}
function load(directory){
 const app=core.project(directory),signature=stamp(app.root),file=path.join(app.root,'icon-design/project.json'),manifest=app.manifest;
 if(fs.existsSync(file)){const saved=JSON.parse(fs.readFileSync(file));if(saved.version===2&&(saved.signature===signature||saved.binding===binding(app))){for(const relative of Object.values(saved.sources))sourcePath(app.root,relative);const state={...saved,tileMode:saved.tileMode||(manifest.tile.full_image?'custom':'system'),directory:app.root,signature,selected:manifest.icons.appearances?.default||'default',...metadata(manifest)};validate(state);return state;}}
 let legacy={};const legacyFile=path.join(app.root,'.desktile/icon-project.json');if(fs.existsSync(legacyFile)){try{const saved=JSON.parse(fs.readFileSync(legacyFile));if(saved.signature===signature)legacy=saved.items||{};}catch{}}
 const appearances=appearanceChoices(app),selected=manifest.icons.appearances?.default||'default',sources={},documents={};
 const add=relative=>{const id=crypto.createHash('sha256').update(relative).digest('hex').slice(0,16);sourcePath(app.root,relative);sources[id]=relative;return id;};
 for(const appearance of appearances){
  const docs=documents[appearance]={};
  for(const [slot,[w,h]] of Object.entries(sizes)){
   let resource=slot==='notification'?manifest.icons.notification?.path:slot.startsWith('tile-')?(manifest.icons.tile_variants?manifest.icons.tile.replace(/\.dti$/,slot.slice(4)+'.dti'):manifest.icons.tile):manifest.icons[slot];
   if(resource&&manifest.icons.appearances&&slot!=='notification')resource=path.posix.join(path.posix.dirname(resource),appearance,path.posix.basename(resource));
   const side=slot==='tile-1x1'?40:slot==='tile-2x2'?64:slot==='tile-4x2'?80:slot==='tile-4x4'?128:w;
   const tile=slot.startsWith('tile-'),layers=[];
   const original=!manifest.icons.appearances?legacy[slot]:null;if(original){resource=path.relative(app.root,original.source).split(path.sep).join('/');sourcePath(app.root,resource);}
   if(resource&&fs.existsSync(path.join(app.root,resource))){const full=tile&&manifest.tile.full_image,edge=original?side*(1-2*original.padding/100):side;layers.push({id:crypto.randomUUID(),name:path.basename(resource),type:'image',source:add(resource),x:full?0:(w-edge)/2,y:full?0:(h-edge)/2-(slot==='tile-1x1'?0:tile?10:0),w:full?w:edge,h:full?h:edge,rotation:0,fit:original?'contain':'stretch',mode:original?.mode||(fs.readFileSync(path.join(app.root,resource))[8]===3?'system':'custom'),color:tile?'#ffffff':'#1f1f1f'});}
   if(tile&&!manifest.icons.tile_variants&&!manifest.tile.full_image){layers.splice(0,layers.length,{id:crypto.randomUUID(),name:t('Default tile icon'),type:'symbol',x:(w-side)/2,y:(h-side)/2-(slot==='tile-1x1'?0:10),w:side,h:side,rotation:0,color:'#ffffff'});}
   if(tile&&slot!=='tile-1x1'&&!manifest.tile.full_image)layers.push({id:crypto.randomUUID(),name:t('Title'),type:'title',x:16,y:h-44,w:w-32,h:36,size:32,font:'system:misans',ellipsis:true,color:'#ffffff',align:'left',rotation:0});
   docs[slot]={w,h,...(tile?{layout:manifest.tile.full_image?'custom':'system'}:{}),background:tile?'#ff9900':'transparent',mode:tile?'custom':layers[0]?.mode||'system',layers};
  }
 }
 return {version:2,tileMode:manifest.tile.full_image?'custom':'system',directory:app.root,signature,sources,appearances,selected,documents,...metadata(manifest)};
}
function importImage(state,file){
 const ext=path.extname(file).toLowerCase();if(!['.png','.svg','.jpg','.jpeg','.webp','.dti'].includes(ext))throw new core.DevKitError('ASSET_SOURCE','Choose PNG, SVG, JPEG, WebP or DTI.');
 if(fs.statSync(file).size>16*1024*1024)throw new core.DevKitError('ASSET_SOURCE','Image exceeds 16 MiB.');
 const id=crypto.randomUUID(),relative='icon-design/sources/'+id+ext,destination=path.join(state.directory,relative);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(file,destination);state.sources[id]=relative;return {id,name:path.basename(file)};
}
async function previews(state,options={}){
 const root=core.project(state.directory).root,parent=path.join(root,'.desktile/assets');fs.mkdirSync(parent,{recursive:true});const out=fs.mkdtempSync(path.join(parent,'design-preview-'));
 try{const config=path.join(out,'sources.json');fs.writeFileSync(config,JSON.stringify(Object.fromEntries(Object.entries(state.sources).map(([id,relative])=>[id,sourcePath(root,relative)]))));
 await core.run(options.python||process.env.DESKTILE_PYTHON||'python',[path.join(core.ROOT,'sdk-bundle/tools/tile_artwork.py'),'sources',config,out],options);
 return Object.fromEntries(Object.keys(state.sources).map(id=>[id,'data:image/png;base64,'+fs.readFileSync(path.join(out,id+'.png')).toString('base64')]));
 }finally{fs.rmSync(out,{recursive:true,force:true});}
}
function validate(state){
 const app=core.project(state.directory);if(stamp(app.root)!==state.signature)throw new core.DevKitError('ASSET_CONFLICT','The manifest changed. Reopen the icon editor before saving.');
 if(!['system','custom'].includes(state.tileMode))throw new core.DevKitError('ASSET_OPTIONS','Invalid tile drawing mode.');
 for(const [id,relative] of Object.entries(state.sources)){if(!/^[a-f0-9-]{16,36}$/.test(id))throw new core.DevKitError('ASSET_SOURCE','Invalid image identity.');sourcePath(app.root,relative);}
 for(const value of Object.values(state.names))if(typeof value!=='string'||!value.trim()||Buffer.byteLength(value)>63||/[\x00-\x1f\x7f]/.test(value))throw new core.DevKitError('APP_NAME','Application names must be 1–63 UTF-8 bytes.');
 for(const names of Object.values(state.tileNames))for(const value of Object.values(names))if(typeof value!=='string'||Buffer.byteLength(value)>63||/[\x00-\x1f\x7f]/.test(value))throw new core.DevKitError('APP_NAME','Tile names must be at most 63 UTF-8 bytes.');
 const expected=appearanceChoices(app);if(JSON.stringify(state.appearances)!==JSON.stringify(expected)||!expected.includes(state.selected))throw new core.DevKitError('ASSET_OPTIONS','Invalid icon appearances.');
 if(state.tileTitles!==undefined&&(!state.tileTitles||Object.keys(state.tileTitles).some(key=>!['1x1','2x2','4x2','4x4'].includes(key))||Object.values(state.tileTitles).some(value=>typeof value!=='boolean')||state.tileTitles['1x1']===true))throw new core.DevKitError('ASSET_OPTIONS','Invalid tile title visibility.');
 for(const appearance of expected)for(const [key,[w,h]] of Object.entries(sizes)){
  const doc=state.documents[appearance]?.[key];if(!doc||doc.w!==w||doc.h!==h||!Array.isArray(doc.layers)||doc.layers.length>64||!['system','custom'].includes(doc.mode)||!(/^(transparent|#[0-9a-fA-F]{6})$/.test(doc.background)))throw new core.DevKitError('ASSET_OPTIONS','Invalid canvas.');
  if(key.startsWith('tile-')&&doc.layout!==undefined&&!['system','custom'].includes(doc.layout))throw new core.DevKitError('ASSET_OPTIONS','Invalid tile layout.');
  for(const layer of doc.layers){if(!['image','symbol','text','title','rectangle'].includes(layer.type)||!['x','y','w','h'].every(k=>Number.isFinite(layer[k])&&Math.abs(layer[k])<=4096)||layer.w<=0||layer.h<=0||!/^#[0-9a-fA-F]{6}$/.test(layer.color)||!Number.isFinite(layer.rotation||0)||Math.abs(layer.rotation||0)>360)throw new core.DevKitError('ASSET_OPTIONS','Invalid layer geometry.');
   if(layer.ellipsis!==undefined&&typeof layer.ellipsis!=='boolean')throw new core.DevKitError('ASSET_OPTIONS','Invalid text fitting.');
   if(layer.type==='symbol'&&!key.startsWith('tile-'))throw new core.DevKitError('ASSET_OPTIONS','Default icon instances belong to tile canvases.');
   if(layer.type==='image'&&!state.sources[layer.source])throw new core.DevKitError('ASSET_SOURCE','Unknown source image.');
   if(['text','title'].includes(layer.type)&&(!Number.isFinite(layer.size)||layer.size<6||layer.size>256))throw new core.DevKitError('ASSET_OPTIONS','Invalid text size.');
   if(layer.font!==undefined&&(typeof layer.font!=='string'||!layer.font.trim()||Buffer.byteLength(layer.font)>128||/[\x00-\x1f\x7f]/.test(layer.font)))throw new core.DevKitError('ASSET_OPTIONS','Invalid font family.');
   if(layer.font?.startsWith('system:')&&(!Object.hasOwn(require('./system-fonts').families,layer.font)||!require('./system-fonts').sizes.includes(layer.size)))throw new core.DevKitError('ASSET_OPTIONS','Invalid system font or native size.');
  }
 }
 return app;
}
async function save(state,renders,options={}){
 const app=validate(state),parent=path.join(app.root,'.desktile/assets');fs.mkdirSync(parent,{recursive:true});const draft=fs.mkdtempSync(path.join(parent,'design-export-'));
 const records=[],backups=new Map(),oldSources={...state.sources},manifestPath=path.join(app.root,'manifest.json'),previous=fs.readFileSync(manifestPath);
 let manifestWritten=false;
 const declared=app.manifest.icons,originalPaths=Boolean(declared.appearances?.from_resources&&declared.application!==declared.tile);
 const priorDirectory=path.posix.dirname(declared.application),reuse=!originalPaths&&/^assets\/design-[A-Za-z0-9_-]+$/.test(priorDirectory)&&path.posix.dirname(declared.tile)===priorDirectory;
 const destination=originalPaths?app.root:reuse?path.join(app.root,priorDirectory):fs.mkdtempSync(path.join(app.root,'assets/design-'));
 const relative=path.relative(app.root,destination).split(path.sep).join('/');
 const basePath=slot=>originalPaths?(slot==='application'?declared.application:slot==='notification'?(declared.notification?.path||path.posix.join(path.posix.dirname(declared.application),'notification.dti')):declared.tile.replace(/\.dti$/,slot.slice(4)+'.dti')):path.posix.join(relative,slot+'.dti');
 const targetPath=(slot,appearance,locale='zh-CN',base=false)=>{let target=basePath(slot);if(!base&&declared.appearances)target=path.posix.join(path.posix.dirname(target),appearance,path.posix.basename(target));if(slot.startsWith('tile-')&&locale!=='zh-CN')target=target.replace(/\.dti$/,'-'+locale+'.dti');return target;};
 const write=(target,bytes)=>{const file=path.resolve(app.root,target);if(!core.isWithin(app.root,file))throw new core.DevKitError('ASSET_SOURCE','Invalid output path.');for(let at=path.dirname(file);core.isWithin(app.root,at);at=path.dirname(at))if(fs.existsSync(at)&&fs.lstatSync(at).isSymbolicLink())throw new core.DevKitError('ASSET_SOURCE','Invalid output directory.');if(!backups.has(file))backups.set(file,fs.existsSync(file)?fs.readFileSync(file):null);if(bytes===null){fs.rmSync(file,{force:true});return;}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',bytes);fs.renameSync(file+'.tmp',file);};
 try{
  for(const [index,appearance] of state.appearances.entries())for(const slot of Object.keys(sizes)){
   if(slot==='notification'&&appearance!==state.selected)continue;
   const managed=slot.startsWith('tile-')&&state.tileMode==='system';
   for(const locale of slot.startsWith('tile-')&&!managed?locales:['zh-CN']){
    const key=appearance+'/'+slot+'/'+locale,data=renders[key];if(typeof data!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data)||data.length>2*1024*1024)throw new core.DevKitError('ASSET_DRAFT','Missing or oversized canvas export.');
    if(locale!=='zh-CN'&&data===renders[appearance+'/'+slot+'/zh-CN'])continue;
    const file=index+'-'+slot+'-'+locale+'.dti',dimensions=managed?[tileSides[slot],tileSides[slot]]:sizes[slot];records.push({key,file,slot,appearance,locale,target:targetPath(slot,appearance,locale),png:data.slice(data.indexOf(',')+1),width:dimensions[0],height:dimensions[1],mode:managed?state.documents[appearance].tile.mode:slot.startsWith('tile-')?'custom':state.documents[appearance][slot].mode});
   }
  }
  const config=path.join(draft,'renders.json');fs.writeFileSync(config,JSON.stringify(records));await core.run(options.python||process.env.DESKTILE_PYTHON||'python',[path.join(core.ROOT,'sdk-bundle/tools/tile_artwork.py'),'encode',config,draft],options);
  validate(state);
  for(const [id,source] of Object.entries(state.sources))if(!source.startsWith('icon-design/')){const next='icon-design/sources/'+id+path.extname(source);fs.mkdirSync(path.dirname(path.join(app.root,next)),{recursive:true});fs.copyFileSync(sourcePath(app.root,source),path.join(app.root,next));state.sources[id]=next;}
  const targets=new Set();for(const record of records){const bytes=fs.readFileSync(path.join(draft,record.file));write(record.target,bytes);targets.add(record.target);if(declared.appearances&&record.appearance===state.selected){const base=targetPath(record.slot,record.appearance,record.locale,true);write(base,bytes);targets.add(base);}}
  for(const appearance of state.appearances)for(const slot of Object.keys(sizes).filter(key=>key.startsWith('tile-')))for(const locale of ['zh-HK','en']){const target=targetPath(slot,appearance,locale);if(!targets.has(target))write(target,null);if(appearance===state.selected&&declared.appearances){const base=targetPath(slot,appearance,locale,true);if(!targets.has(base))write(base,null);}}
  validate(state);const manifest=app.manifest;manifest.name={...(typeof manifest.name==='object'?manifest.name:{}),...state.names};if('en-US' in manifest.name)manifest.name['en-US']=state.names.en;
  manifest.tile={...manifest.tile};if(state.tileMode==='custom'){manifest.tile.full_image=true;delete manifest.tile.transition_color;delete manifest.tile.appearance_transition_colors;}else delete manifest.tile.full_image;
  const titleVisibility=Object.fromEntries(['2x2','4x2','4x4'].filter(key=>state.tileTitles?.[key]===false).map(key=>[key,false]));if(Object.keys(titleVisibility).length)manifest.tile.show_title=titleVisibility;else delete manifest.tile.show_title;
  const names={};for(const [key,map] of Object.entries(state.tileNames)){const values={...(typeof manifest.tile.names?.[key]==='object'?manifest.tile.names[key]:{})};for(const [locale,value] of Object.entries(map)){if(value)values[locale]=value;else delete values[locale];}if('en-US' in values){if(map.en)values['en-US']=map.en;else delete values['en-US'];}if(Object.keys(values).length)names[key]=values;}if(Object.keys(names).length)manifest.tile.names=names;else delete manifest.tile.names;
  manifest.icons={...manifest.icons,application:basePath('application'),tile:basePath('tile'),tile_variants:true};if(state.documents[state.selected].notification.layers.length||state.documents[state.selected].notification.background!=='transparent')manifest.icons.notification={path:basePath('notification'),mode:state.documents[state.selected].notification.mode};else delete manifest.icons.notification;
  fs.writeFileSync(manifestPath+'.tmp',JSON.stringify(manifest,null,2)+'\n');fs.renameSync(manifestPath+'.tmp',manifestPath);manifestWritten=true;
  state.signature=stamp(app.root);state.binding=binding(app);const persisted={...state};delete persisted.directory;const project=path.join(app.root,'icon-design/project.json');fs.mkdirSync(path.dirname(project),{recursive:true});fs.writeFileSync(project+'.tmp',JSON.stringify(persisted,null,2)+'\n');fs.renameSync(project+'.tmp',project);
  return {signature:state.signature,manifest:manifestPath};
 }catch(error){for(const [file,bytes] of backups){if(bytes===null)fs.rmSync(file,{force:true});else fs.writeFileSync(file,bytes);}if(manifestWritten)fs.writeFileSync(manifestPath,previous);state.sources=oldSources;state.signature=stamp(app.root);throw error;
 }finally{fs.rmSync(draft,{recursive:true,force:true});}
}
module.exports={load,importImage,previews,save,validate,sizes,locales,presets};
