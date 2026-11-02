'use strict';
const fs=require('node:fs'),path=require('node:path'),core=require('./core');
const families={'system:misans':0,'system:cabin':2,'system:noto':3,'system:serif':4},sizes=[16,20,22,32,48],cache=new Map();
const key=(font,size)=>font+'@'+size,ascii=Array.from({length:95},(_,i)=>String.fromCharCode(i+32)).join('')+'…';
async function glyphs(directory,requests,options={}){
 if(!Array.isArray(requests)||requests.length>32)throw new core.DevKitError('FONT_OPTIONS','Invalid system font request.');
 let count=0;const missing=[],result={};
 for(const request of requests){
  if(!Object.hasOwn(families,request.font)||!sizes.includes(request.size)||typeof request.chars!=='string')throw new core.DevKitError('FONT_OPTIONS','Invalid system font request.');
  const chars=[...new Set([...request.chars].filter(c=>c.codePointAt(0)>=32))];if(chars.length>4096||(count+=chars.length)>16384)throw new core.DevKitError('FONT_OPTIONS','Too many requested characters.');
  const id=key(request.font,request.size);if(!cache.has(id))cache.set(id,new Map());const known=cache.get(id),needed=chars.filter(c=>!known.has(c.codePointAt(0)));
  if(needed.length)missing.push({key:id,family:families[request.font],size:request.size,chars:needed.join('')});
  result[id]=chars.map(c=>known.get(c.codePointAt(0))).filter(Boolean);
 }
 if(missing.length){
  const parent=path.join(directory,'.desktile/assets');fs.mkdirSync(parent,{recursive:true});const draft=fs.mkdtempSync(path.join(parent,'system-fonts-'));
  try{const input=path.join(draft,'request.json'),output=path.join(draft,'glyphs.json');fs.writeFileSync(input,JSON.stringify(missing));await core.run(path.join(core.ROOT,'renderer/preview.exe'),['--glyphs',input,path.join(core.ROOT,'renderer/ui-fonts.pack'),output],options);
   for(const [id,values] of Object.entries(JSON.parse(fs.readFileSync(output)))){const known=cache.get(id);if(!known||!Array.isArray(values))throw new core.DevKitError('FONT_DATA','Invalid native glyph response.');for(const value of values)known.set(value.cp,value);}
  }finally{fs.rmSync(draft,{recursive:true,force:true});}
  for(const request of requests){const id=key(request.font,request.size);result[id]=[...new Set([...request.chars])].map(c=>cache.get(id).get(c.codePointAt(0))).filter(Boolean);}
 }
 return result;
}
function initial(state){
 const requests=new Map();const add=(font,size,text)=>{if(!families.hasOwnProperty(font))return;const id=key(font,size),value=requests.get(id)||{font,size,chars:ascii};value.chars+='\n'+text;requests.set(id,value);};
 add('system:misans',20,'');add('system:misans',32,'');
 for(const documents of Object.values(state.documents))for(const [slot,doc] of Object.entries(documents))for(const layer of doc.layers)if(['text','title'].includes(layer.type)){
  const font=layer.font||'Segoe UI';let text=typeof layer.text==='string'?layer.text:Object.values(layer.text||{}).join('');if(layer.type==='title')text+=Object.values(state.names).join('')+Object.values(state.tileNames[slot.slice(5)]||{}).join('');add(font,layer.size,text);
 }
 return [...requests.values()];
}
module.exports={glyphs,initial,families,sizes,key};

