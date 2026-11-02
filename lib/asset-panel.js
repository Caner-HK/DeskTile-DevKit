'use strict';
const {selectScript}=require('./select-control'),{commonCss}=require('./panel-ui'),designer=require('./icon-designer'),systemFonts=require('./system-fonts');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),core=require('./core'),{t}=require('./i18n'),panels=new Map();
const slotLabels={application:'Application icon',notification:'Notification icon',tile:'Default tile icon','tile-1x1':'Small tile (1 × 1)','tile-2x2':'Medium tile (2 × 2)','tile-4x2':'Wide tile (4 × 2)','tile-4x4':'Large tile (4 × 4)'};
function client(){
 const api=acquireVsCodeApi(),$=id=>document.getElementById(id),clone=value=>JSON.parse(JSON.stringify(value));
 let model=null,images={},cache={},slot='application',appearance='default',locale='zh-CN',selected=null,busy=true,dirty=false,undo=[],redo=[],gesture=null;
 const doc=()=>model.documents[appearance][slot],layer=()=>doc().layers.find(item=>item.id===selected);
 const managed=()=>slot.startsWith('tile-')&&model.tileMode==='system';
 function systemDocument(key){const preset=presets[key],[w,h]=dimensions[key],titled=Boolean(preset.title)&&(model.tileMode!=='system'||model.tileTitles?.[key.slice(5)]!==false),layers=[{type:'symbol',...preset.icon,y:titled?preset.icon.y:(h-preset.icon.h)/2,rotation:0,color:'#ffffff'}];if(titled)layers.push({type:'title',...preset.title,font:'system:misans',ellipsis:true,color:'#ffffff',align:'left'});return {w,h,background:'#ff9900',mode:'custom',layers};}
 const snapshot=()=>JSON.stringify(model),history=before=>{if(before!==snapshot()){undo.push(before);if(undo.length>128)undo.shift();redo=[];dirty=true;}};
 const visual=()=>JSON.stringify({background:doc().background,layers:doc().layers.map(({id,name,...value})=>value)});
 const change=(fn,preset=false)=>{if(!model||busy)return;const before=snapshot(),prior=visual();fn();if(!preset&&slot.startsWith('tile-')&&doc().layout==='system'&&visual()!==prior)doc().layout='custom';history(before);fontFailure=null;draw();};
 function image(id){if(!cache[id]){const value=new Image();value.src=images[id];value.onload=()=>drawCanvas();cache[id]=value;}return cache[id];}
 function label(item,key,lang){if(item.type==='title')return model.tileNames[key.slice(5)]?.[lang]||model.names[lang]||model.names['zh-CN'];return typeof item.text==='string'?item.text:item.text?.[lang]||'';}
 const fontData={},fontQueue=new Map(),glyphImages=new Map(),fontSizes=[16,20,22,32,48];let fontWaiting=false,fontTimer=null,fontFailure=null,fontWaiters=[];
 const fontKey=item=>item.font?.startsWith('system:')?item.font+'@'+item.size:null;
 function mergeFonts(values){for(const [key,glyphs] of Object.entries(values||{})){fontData[key]??={};for(const glyph of glyphs)fontData[key][glyph.cp]=glyph;}glyphImages.clear();}
 function needFont(item,text){
  const key=fontKey(item);if(!key)return null;const known=fontData[key]||{},chars=[...new Set([...text].filter(c=>c.codePointAt(0)>=32))].filter(c=>!known[c.codePointAt(0)]);
  if(chars.length&&!fontFailure){let request=fontQueue.get(key);if(!request){request={font:item.font,size:item.size,chars:new Set()};fontQueue.set(key,request);}for(const c of chars)request.chars.add(c);$('save').disabled=true;if(!fontTimer&&!fontWaiting)fontTimer=setTimeout(flushFonts,30);}
  return known;
 }
 function flushFonts(){if(fontWaiting)return;if(fontTimer){clearTimeout(fontTimer);fontTimer=null;}if(!fontQueue.size)return;const requests=[...fontQueue.values()].map(value=>({...value,chars:[...value.chars].join('')}));fontQueue.clear();fontWaiting=true;api.postMessage({type:'fonts',requests});}
 async function fontsReady(){
  fontFailure=null;
  for(const documents of Object.values(model.documents))for(const [key,value] of Object.entries(documents))for(const item of value.layers)if(['text','title'].includes(item.type))for(const lang of ['zh-CN','zh-HK','en'])needFont(item,label(item,key,lang)+(item.ellipsis?'…':''));
  while(fontWaiting||fontTimer||fontQueue.size){if(!fontWaiting)flushFonts();await new Promise(resolve=>fontWaiters.push(resolve));if(fontFailure)throw fontFailure;}
 }
 function glyphImage(item,glyph,color){
  if(glyph.missing||!glyph.width||!glyph.height)return null;const key=fontKey(item)+':'+glyph.cp+':'+color;if(glyphImages.has(key))return glyphImages.get(key);
  const canvas=documentCreateCanvas(glyph.width,glyph.height),ctx=canvas.getContext('2d'),frame=ctx.createImageData(glyph.width,glyph.height),rgb=[1,3,5].map(at=>parseInt(color.slice(at,at+2),16));
  for(let index=0;index<glyph.width*glyph.height;index++){frame.data[index*4]=rgb[0];frame.data[index*4+1]=rgb[1];frame.data[index*4+2]=rgb[2];frame.data[index*4+3]=parseInt(glyph.pixels[index],16)*17;}ctx.putImageData(frame,0,0);if(glyphImages.size>=512)glyphImages.clear();glyphImages.set(key,canvas);return canvas;
 }
 function paintSystemText(ctx,item,key,lang,color){
  const text=label(item,key,lang),glyphs=needFont(item,text+(item.ellipsis?'…':'')),lines=[];if(item.ellipsis){let chars=[...text],width=chars.reduce((sum,char)=>sum+(glyphs[char.codePointAt(0)]?.advance||item.size),0);if(width>item.w){const ellipsis=glyphs[8230],advance=ellipsis?.advance||item.size;while(chars.length&&width+advance>item.w)width-=glyphs[chars.pop().codePointAt(0)]?.advance||item.size;chars.push('…');width+=advance;}lines.push({line:chars.map(char=>glyphs[char.codePointAt(0)]),width});}else for(const paragraph of text.split('\n')){let line=[],width=0;for(const char of paragraph){const glyph=glyphs[char.codePointAt(0)],advance=glyph?.advance||item.size;if(line.length&&width+advance>item.w){lines.push({line,width});line=[];width=0;}line.push(glyph);width+=advance;}lines.push({line,width});}
  ctx.save();ctx.beginPath();ctx.rect(0,0,item.w,item.h);ctx.clip();const top=item.type==='title'?Math.max(0,(item.h-item.size)/2):0;
  lines.forEach(({line,width},index)=>{let x=item.align==='center'?(item.w-width)/2:item.align==='right'?item.w-width:0;const y=top+index*(item.size+8);for(const glyph of line){if(glyph){const bitmap=glyphImage(item,glyph,color);if(bitmap)ctx.drawImage(bitmap,Math.round(x+glyph.left),Math.round(y+glyph.top));}x+=glyph?.advance||item.size;}});ctx.restore();
 }
 function paint(ctx,document,key,lang,group,forced=null){
  ctx.save();ctx.beginPath();ctx.rect(0,0,document.w,document.h);ctx.clip();
  if(document.background!=='transparent'){ctx.fillStyle=forced||document.background;ctx.fillRect(0,0,document.w,document.h);}
  for(const item of document.layers){
   ctx.save();ctx.translate(item.x+item.w/2,item.y+item.h/2);ctx.rotate((item.rotation||0)*Math.PI/180);ctx.translate(-item.w/2,-item.h/2);
   if(item.type==='symbol'){
    const master=model.documents[group].tile;ctx.scale(item.w/master.w,item.h/master.h);paint(ctx,master,'tile',lang,group,forced||(master.mode==='system'?item.color:null));
   }else if(item.type==='image'){
    const source=image(item.source);if(source.complete&&source.naturalWidth){
     let drawable=source;
     if(forced||item.mode==='system'){const mask=documentCreateCanvas(source.naturalWidth,source.naturalHeight),ink=mask.getContext('2d');ink.drawImage(source,0,0);ink.globalCompositeOperation='source-in';ink.fillStyle=forced||item.color;ink.fillRect(0,0,mask.width,mask.height);drawable=mask;}
     if(item.fit==='contain'){const scale=Math.min(item.w/source.naturalWidth,item.h/source.naturalHeight),w=source.naturalWidth*scale,h=source.naturalHeight*scale;ctx.drawImage(drawable,(item.w-w)/2,(item.h-h)/2,w,h);}
     else ctx.drawImage(drawable,0,0,item.w,item.h);
    }
   }else if(item.type==='rectangle'){ctx.fillStyle=forced||item.color;ctx.fillRect(0,0,item.w,item.h);}
   else if(fontKey(item)){paintSystemText(ctx,item,key,lang,forced||item.color);}
   else{
    ctx.beginPath();ctx.rect(0,0,item.w,item.h);ctx.clip();ctx.fillStyle=forced||item.color;ctx.font=item.size+'px '+JSON.stringify(item.font||'Segoe UI')+',"Microsoft YaHei",sans-serif';ctx.textBaseline='top';ctx.textAlign=item.align||'left';
    const words=label(item,key,lang),lines=[];for(const paragraph of words.split('\n')){let line='';for(const character of paragraph){if(line&&ctx.measureText(line+character).width>item.w){lines.push(line);line=character;}else line+=character;}lines.push(line);}
    const x=ctx.textAlign==='center'?item.w/2:ctx.textAlign==='right'?item.w:0;lines.forEach((line,index)=>ctx.fillText(line,x,index*item.size*1.2));
   }
   ctx.restore();
  }
  ctx.restore();
 }
 function render(canvas,document,key,lang,overlay=false,group=appearance,displayScale=1,exporting=true){
  canvas.width=Math.round(document.w*displayScale);canvas.height=Math.round(document.h*displayScale);const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.scale(canvas.width/document.w,canvas.height/document.h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';paint(ctx,document,key,lang,group);
  if(document.mode==='system'&&!key.startsWith('tile-')){ctx.globalCompositeOperation='source-in';ctx.fillStyle=$('theme').value==='dark'?'#ffffff':'#1f1f1f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';}
  else if(exporting){const frame=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=frame.data;for(let at=0;at<pixels.length;at+=4){pixels[at]=Math.floor((pixels[at]>>3)*255/31);pixels[at+1]=Math.floor((pixels[at+1]>>2)*255/63);pixels[at+2]=Math.floor((pixels[at+2]>>3)*255/31);pixels[at+3]=pixels[at+3]>=128?255:0;}ctx.putImageData(frame,0,0);}
  if(overlay&&layer()){const item=layer(),scale=canvas.getBoundingClientRect().width/document.w||1;ctx.save();ctx.translate(item.x+item.w/2,item.y+item.h/2);ctx.rotate((item.rotation||0)*Math.PI/180);ctx.strokeStyle='#0078d4';ctx.lineWidth=1/scale;ctx.strokeRect(-item.w/2,-item.h/2,item.w,item.h);ctx.fillStyle='#0078d4';const side=6/scale;ctx.fillRect(item.w/2-side/2,item.h/2-side/2,side,side);ctx.restore();}
 }
 function documentCreateCanvas(w,h){const value=document.createElement('canvas');value.width=w;value.height=h;return value;}
 function drawCanvas(){if(!model)return;const canvas=$('canvas'),zoom=Number($('zoom').value),document=managed()?systemDocument(slot):doc();canvas.style.width=document.w*zoom+'px';const scale=canvas.getBoundingClientRect().width/document.w*(window.devicePixelRatio||1);render(canvas,document,slot,locale,!managed(),appearance,scale,false);$('dimensions').textContent=document.w+' × '+document.h;}
 function props(){
  if(!model)return;const item=layer();$('app-name').value=model.names[locale]||'';$('tile-name-row').hidden=!slot.startsWith('tile-');$('tile-name').value=model.tileNames[slot.slice(5)]?.[locale]||'';
  $('title-setting').hidden=!managed()||slot==='tile-1x1';$('show-title').value=model.tileTitles?.[slot.slice(5)]===false?'false':'true';
  $('mode').value=doc().mode;$('mode-row').hidden=slot.startsWith('tile-');$('background-row').hidden=doc().mode==='system'&&!slot.startsWith('tile-');$('background').value=doc().background==='transparent'?'#ffffff':doc().background;$('transparent').setAttribute('aria-pressed',String(doc().background==='transparent'));
  $('layout-row').hidden=!slot.startsWith('tile');$('tile-layout').value=model.tileMode;$('mode-description').textContent=model.tileMode==='system'?ui.system:ui.custom;$('managed-tools').hidden=!managed();$('edit-default-icon').hidden=!managed();$('composition-tools').hidden=managed();$('layers').hidden=managed();$('background-row').hidden=managed()||(doc().mode==='system'&&!slot.startsWith('tile-'));$('transparent').hidden=$('background-row').hidden;$('reset-layout').hidden=!slot.startsWith('tile-')||managed();$('add-symbol').hidden=!slot.startsWith('tile-');$('layer-props').hidden=managed()||!item;$('text-row').hidden=!item||!['text','title'].includes(item.type);$('image-mode-row').hidden=item?.type!=='image';$('content-row').hidden=item?.type!=='text';$('ink-row').hidden=!item||(item.type==='image'&&item.mode==='custom')||(item.type==='symbol'&&model.documents[appearance].tile.mode==='custom')||(doc().mode==='system'&&!slot.startsWith('tile-'));
  if(item){$('layer-name').value=item.name||'';for(const key of ['x','y','w','h','rotation'])$(key).value=Math.round((item[key]||0)*10)/10;$('ink').value=item.color;$('font-size').value=item.size||32;const native=Boolean(fontKey(item));$('font-family').value=native?item.font:'custom';$('custom-font-row').hidden=native;$('custom-font').value=native?'':item.font||'Segoe UI';$('custom-size-row').hidden=native;$('system-size-row').hidden=!native;$('system-size').value=item.size||32;const glyphs=fontData[fontKey(item)]||{};$('font-note').hidden=!native||![...label(item,slot,locale)].some(c=>glyphs[c.codePointAt(0)]?.missing);$('align').value=item.align||'left';$('image-mode').value=item.mode||'custom';$('content').value=typeof item.text==='string'?item.text:item.text?.[locale]||'';}
  for(const id of ['delete','forward','backward'])$(id).disabled=!item||busy;
  window.desktileSelects.refresh();
 }
 function draw(){
  $('save').disabled=busy||!dirty||fontWaiting||Boolean(fontTimer)||Boolean(fontQueue.size);$('undo').disabled=busy||!undo.length;$('redo').disabled=busy||!redo.length;$('workspace').inert=busy;
  if(!model)return;
  $('appearance-row').hidden=model.appearances.length===1;$('appearance').replaceChildren(...model.appearances.map(value=>new Option(value,value)));$('appearance').value=appearance;
  for(const button of $('slots').children){button.setAttribute('aria-pressed',String(button.dataset.slot===slot));button.tabIndex=button.dataset.slot===slot?0:-1;}
  $('layers').replaceChildren(...doc().layers.slice().reverse().map(item=>{const button=document.createElement('button');button.textContent=item.name||item.type;button.setAttribute('aria-pressed',String(item.id===selected));button.onclick=()=>{selected=item.id;draw();};return button;}));
  $('heading').textContent=labels[slot];props();drawCanvas();
 }
 for(const [key,title] of Object.entries(labels)){const button=document.createElement('button');button.textContent=title;button.dataset.slot=key;button.onclick=()=>{slot=key;selected=null;draw();};$('slots').append(button);}
 $('appearance').onchange=()=>{appearance=$('appearance').value;selected=null;draw();};$('locale').onchange=()=>{locale=$('locale').value;props();drawCanvas();};$('theme').onchange=()=>{$('stage').classList.toggle('light',$('theme').value==='light');drawCanvas();};$('zoom').onchange=drawCanvas;
 for(const [id,update] of [['app-name',value=>model.names[locale]=value],['tile-name',value=>model.tileNames[slot.slice(5)][locale]=value],['background',value=>doc().background=value],['mode',value=>doc().mode=value]])$(id).onchange=()=>change(()=>update($(id).value));
 $('tile-layout').onchange=()=>change(()=>{model.tileMode=$('tile-layout').value;selected=null;},true);
 $('reset-layout').onclick=()=>change(()=>{const value=systemDocument(slot);value.layers=value.layers.map(item=>({...item,id:crypto.randomUUID(),name:item.type==='symbol'?labels.tile:ui.title}));Object.assign(doc(),value,{layout:'system'});selected=null;},true);
 $('show-title').onchange=()=>change(()=>{model.tileTitles??={};model.tileTitles[slot.slice(5)]=$('show-title').value==='true';},true);
 $('edit-default-icon').onclick=()=>{$('slots').querySelector('[data-slot="tile"]').click();};
 $('transparent').onclick=()=>change(()=>doc().background=doc().background==='transparent'?'#ffffff':'transparent');
 for(const key of ['x','y','w','h','rotation'])$(key).onchange=()=>change(()=>{const item=layer();if(item){const value=Number($(key).value);if(Number.isFinite(value)&&(!['w','h'].includes(key)||value>0))item[key]=value;}});
 for(const [id,key] of [['layer-name','name'],['ink','color'],['font-size','size'],['custom-font','font'],['align','align'],['image-mode','mode']])$(id).onchange=()=>change(()=>{const item=layer();if(item)item[key]=id==='font-size'?Number($(id).value):$(id).value;});
 $('font-family').onchange=()=>change(()=>{const item=layer();if(item){item.font=$('font-family').value==='custom'?'Segoe UI':$('font-family').value;if(fontKey(item)&&!fontSizes.includes(item.size))item.size=fontSizes.reduce((best,size)=>Math.abs(size-item.size)<Math.abs(best-item.size)?size:best,32);}});$('system-size').onchange=()=>change(()=>{const item=layer();if(item)item.size=Number($('system-size').value);});
 $('content').onchange=()=>change(()=>{const item=layer();if(item){if(typeof item.text==='string')item.text=Object.fromEntries(['zh-CN','zh-HK','en'].map(key=>[key,item.text]));item.text??={};item.text[locale]=$('content').value;}});
 function add(type){change(()=>{const item={id:crypto.randomUUID(),name:ui[type],type,x:16,y:16,w:Math.max(24,doc().w-32),h:type==='rectangle'?Math.max(24,doc().h-32):48,color:'#ffffff',rotation:0};if(type==='symbol'){item.w=Math.min(doc().w,96);item.h=item.w;item.x=(doc().w-item.w)/2;item.y=(doc().h-item.h)/2;}if(type==='text'||type==='title'){item.text={'zh-CN':ui.text,'zh-HK':ui.text,en:ui.text};item.size=type==='title'?32:20;item.font='system:misans';item.align='left';}doc().layers.push(item);selected=item.id;});}
 $('add-symbol').onclick=()=>{if(slot.startsWith('tile-'))add('symbol');};$('add-text').onclick=()=>add('text');$('add-title').onclick=()=>add('title');$('add-rectangle').onclick=()=>add('rectangle');
 $('add-image').onclick=()=>{if(model&&!busy)api.postMessage({type:'choose',model});};
 $('delete').onclick=()=>change(()=>{doc().layers=doc().layers.filter(item=>item.id!==selected);selected=null;});
 for(const [id,delta] of [['forward',1],['backward',-1]])$(id).onclick=()=>change(()=>{const layers=doc().layers,index=layers.findIndex(item=>item.id===selected),next=index+delta;if(index>=0&&next>=0&&next<layers.length)[layers[index],layers[next]]=[layers[next],layers[index]];});
 $('undo').onclick=()=>{if(undo.length){redo.push(snapshot());model=JSON.parse(undo.pop());selected=null;dirty=true;draw();}};$('redo').onclick=()=>{if(redo.length){undo.push(snapshot());model=JSON.parse(redo.pop());selected=null;dirty=true;draw();}};
 const point=event=>{const r=$('canvas').getBoundingClientRect();return {x:(event.clientX-r.left)*doc().w/r.width,y:(event.clientY-r.top)*doc().h/r.height};};
 const local=(item,p)=>{const a=-(item.rotation||0)*Math.PI/180,x=p.x-item.x-item.w/2,y=p.y-item.y-item.h/2;return {x:x*Math.cos(a)-y*Math.sin(a)+item.w/2,y:x*Math.sin(a)+y*Math.cos(a)+item.h/2};};
 $('canvas').onpointerdown=event=>{
  if(!model||busy||managed())return;const p=point(event),active=layer(),at=active?local(active,p):null,tolerance=9*doc().w/$('canvas').getBoundingClientRect().width;
  const resize=at&&Math.abs(at.x-active.w)<tolerance&&Math.abs(at.y-active.h)<tolerance;
  const hit=resize?active:doc().layers.slice().reverse().find(item=>{const q=local(item,p);return q.x>=0&&q.y>=0&&q.x<=item.w&&q.y<=item.h;});
  selected=hit?.id||null;if(hit){gesture={before:snapshot(),start:p,item:clone(hit),resize};$('canvas').setPointerCapture(event.pointerId);} $('canvas').focus();draw();
 };
 $('canvas').onpointermove=event=>{if(!gesture)return;if(slot.startsWith('tile-'))doc().layout='custom';const p=point(event),item=layer();if(gesture.resize){const q=local(gesture.item,p);item.w=Math.max(1,q.x);item.h=['image','symbol'].includes(gesture.item.type)&&!event.shiftKey?item.w*gesture.item.h/gesture.item.w:Math.max(1,q.y);const a=(gesture.item.rotation||0)*Math.PI/180,dw=item.w-gesture.item.w,dh=item.h-gesture.item.h;item.x=gesture.item.x+(Math.cos(a)-1)*dw/2-Math.sin(a)*dh/2;item.y=gesture.item.y+Math.sin(a)*dw/2+(Math.cos(a)-1)*dh/2;}else{item.x=gesture.item.x+p.x-gesture.start.x;item.y=gesture.item.y+p.y-gesture.start.y;}props();drawCanvas();};
 $('canvas').onpointerup=()=>{if(gesture){history(gesture.before);gesture=null;draw();}};$('canvas').onpointercancel=()=>{if(gesture){model=JSON.parse(gesture.before);gesture=null;draw();}};
 $('canvas').onkeydown=event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();$(event.shiftKey?'redo':'undo').click();return;}if(event.key==='Delete'){event.preventDefault();$('delete').click();}const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(moves[event.key]){event.preventDefault();change(()=>{const item=layer();if(item){const step=event.shiftKey?10:1;item.x+=moves[event.key][0]*step;item.y+=moves[event.key][1]*step;}});}};
 $('save').onclick=async()=>{if(!model||busy)return;busy=true;draw();$('status').textContent=ui.saving;try{
  await Promise.all(Object.keys(images).map(async id=>{const value=image(id);if(!value.complete)await value.decode();}));
  await fontsReady();const renders={};for(const group of model.appearances)for(const [key,value] of Object.entries(model.documents[group])){const system=key.startsWith('tile-')&&model.tileMode==='system';for(const lang of key.startsWith('tile-')&&!system?['zh-CN','zh-HK','en']:['zh-CN']){const side=presets[key]?.icon.w,document=system?{w:side,h:side,mode:model.documents[group].tile.mode,background:'transparent',layers:[{type:'symbol',x:0,y:0,w:side,h:side,rotation:0,color:'#ffffff'}]}:value,canvas=documentCreateCanvas(document.w,document.h);render(canvas,document,system?'tile':key,lang,false,group);renders[group+'/'+key+'/'+lang]=canvas.toDataURL('image/png');}}
  api.postMessage({type:'save',model,renders});
 }catch(error){busy=false;$('status').textContent=error.message;draw();}};
 window.addEventListener('message',event=>{
  const message=event.data;if(message.fontError){fontWaiting=false;fontQueue.clear();fontFailure=Error(message.error);$('status').textContent=message.error;$('status').className='error';for(const resolve of fontWaiters.splice(0))resolve();return;}
  if(message.fonts&&!message.model){mergeFonts(message.fonts);fontWaiting=false;draw();for(const resolve of fontWaiters.splice(0))resolve();return;}
  if(message.fonts)mergeFonts(message.fonts);if(message.error){busy=false;$('status').textContent=message.error;$('status').className='error';draw();return;}if(!message.model)return;
  const before=model?snapshot():null;model=message.model;images=message.images||images;cache={};appearance=model.appearances.includes(appearance)?appearance:model.selected;locale=$('locale').value;busy=false;
  if(message.imported){const info=message.imported,source=image(info.id);const addImage=()=>{const scale=Math.min(doc().w*.75/source.naturalWidth,doc().h*.75/source.naturalHeight),w=source.naturalWidth*scale,h=source.naturalHeight*scale;const item={id:crypto.randomUUID(),type:'image',name:info.name,source:info.id,x:(doc().w-w)/2,y:(doc().h-h)/2,w,h,rotation:0,mode:'custom',color:'#ffffff'};doc().layers.push(item);if(slot.startsWith('tile-'))doc().layout='custom';selected=item.id;if(before)history(before);draw();};if(source.complete&&source.naturalWidth)addImage();else source.onload=addImage;
  }else if(message.saved){dirty=false;undo=[];redo=[];}
  else if(!before){dirty=false;}
  $('status').className='';$('status').textContent=message.message||'';draw();
 });
 window.iconDesigner={get model(){return model;},get slot(){return slot;},get selected(){return selected;},render,draw,fontsReady};
 draw();api.postMessage({type:'ready'});
 window.addEventListener('resize',drawCanvas);
}
function html(nonce){
 const words=Object.fromEntries(['Image','Text','Title','Rectangle','Default tile icon','Saving…'].map(value=>[value,t(value)]));
 const field=(id,title,type='text',extra='')=>'<label for="'+id+'">'+t(title)+'</label><input id="'+id+'" type="'+type+'" '+extra+'>';
 return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><meta name="viewport" content="width=device-width,initial-scale=1"><style nonce="${nonce}">
html{scrollbar-gutter:stable}body{font:13px var(--vscode-font-family,'Segoe UI',sans-serif)}${commonCss}
.title-setting .dt-select-trigger{height:26px}
main{display:grid;grid-template-columns:170px 264px minmax(300px,1fr);min-height:650px}nav#slots{border-right:1px solid var(--vscode-panel-border,#444)}.inspector{max-height:calc(100vh - 112px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--vscode-scrollbarSlider-background,#7778) transparent;padding:16px 20px;border-right:1px solid var(--vscode-panel-border,#444)}label{display:block;margin:12px 0 5px}input,select,textarea{width:100%}textarea{resize:vertical;min-height:64px;border:1px solid var(--vscode-input-border,#454545);border-radius:0;background:var(--vscode-input-background,#313131);color:inherit;font:inherit;padding:6px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}.stage-pane{padding:16px 20px;min-width:0}.stage-head,.tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.stage-head{margin-bottom:12px}.stage-head h2{flex:1;margin:0;font-size:14px}.stage-head .dt-select{width:110px}.tools{padding-bottom:12px}.stage{padding:24px;min-height:440px;overflow:auto;background:#111;display:flex;align-items:center;justify-content:center}.stage.light{background:#f7f7f7}canvas{display:block;max-width:100%;height:auto;touch-action:none;outline:1px solid var(--vscode-panel-border,#454545)}canvas:focus-visible{outline:1px solid var(--vscode-focusBorder,#0078d4)}#layers{margin:12px 0;border-top:1px solid var(--vscode-panel-border,#444);border-bottom:1px solid var(--vscode-panel-border,#444)}#layers button{display:block;width:100%;height:28px;text-align:left;border:0;background:transparent;overflow:hidden;text-overflow:ellipsis}#layers button[aria-pressed=true]{background:var(--vscode-list-activeSelectionBackground,#094771);color:var(--vscode-list-activeSelectionForeground,#fff)}footer{padding:12px 24px;border-top:1px solid var(--vscode-panel-border,#444);min-height:44px}.error{color:var(--vscode-errorForeground,#f88)}[hidden]{display:none!important}#transparent{margin-top:8px}#transparent[aria-pressed=true]{border-color:var(--vscode-focusBorder,#0078d4)}@media(max-width:1050px){main{grid-template-columns:160px 250px minmax(240px,1fr)}}@media(max-width:800px){main{grid-template-columns:160px 1fr}.stage-pane{grid-column:1 / 3;border-top:1px solid var(--vscode-panel-border,#444)}}@media(max-width:500px){main{display:block}.inspector{border-right:0}.stage-pane{padding:16px}}
</style></head><body><header><h1>${t('Application icons and tiles')}</h1><button id="undo" disabled>${t('Undo')}</button><button id="redo" disabled>${t('Redo')}</button><button id="save" class="primary" disabled>${t('Save to project')}</button></header><main id="workspace"><nav id="slots" aria-label="${t('Icon purpose')}"></nav><section class="inspector">
<div id="appearance-row"><label for="appearance">${t('Icon appearance')}</label><select id="appearance"></select></div>
<label for="locale">${t('System language')}</label><select id="locale"><option value="zh-CN">简体中文</option><option value="zh-HK">繁體中文</option><option value="en">English</option></select>
${field('app-name','Application name')}<div id="tile-name-row">${field('tile-name','Tile name','text','placeholder="'+t('Use application name')+'"')}</div>
<div id="title-setting" class="title-setting" hidden><label for="show-title">${t('Tile title')}</label><select id="show-title"><option value="true">${t('Show title')}</option><option value="false">${t('Hide title')}</option></select></div>
<div id="mode-row"><label for="mode">${t('Colours')}</label><select id="mode"><option value="system">${t('Use system colours')}</option><option value="custom">${t('Keep image colours')}</option></select></div>
<div id="layout-row" hidden><label for="tile-layout">${t('Tile drawing')}</label><select id="tile-layout"><option value="system">${t('System managed')}</option><option value="custom">${t('Custom drawing')}</option></select><p id="mode-description"></p></div><div id="background-row">${field('background','Background','color')}</div><button id="transparent" aria-pressed="false">${t('Transparent')}</button>
<div id="layers" aria-label="${t('Layers')}"></div><div id="layer-props" hidden>
${field('layer-name','Layer name')}<div class="pair"><div>${field('x','X','number','step="1"')}</div><div>${field('y','Y','number','step="1"')}</div><div>${field('w','Width','number','min="1" step="1"')}</div><div>${field('h','Height','number','min="1" step="1"')}</div></div>
${field('rotation','Rotation','number','min="-360" max="360"')}<div id="ink-row">${field('ink','Colour','color')}</div>
<div id="image-mode-row"><label for="image-mode">${t('Colours')}</label><select id="image-mode"><option value="custom">${t('Keep image colours')}</option><option value="system">${t('Use system colours')}</option></select></div>
<div id="text-row"><label for="font-family">${t('Font family')}</label><select id="font-family"><option value="system:misans">${t('MiSans (system default)')}</option><option value="system:cabin">Cabin</option><option value="system:noto">Noto Sans</option><option value="system:serif">Source Serif 4</option><option value="custom">${t('Installed font…')}</option></select><div id="custom-font-row" hidden>${field('custom-font','Installed font name')}</div><div id="system-size-row"><label for="system-size">${t('Text size')}</label><select id="system-size">${[16,20,22,32,48].map(size=>'<option value="'+size+'">'+size+' px</option>').join('')}</select></div><div id="custom-size-row" hidden>${field('font-size','Text size','number','min="6" max="256"')}</div><p id="font-note" hidden>${t('Some characters are unavailable in this system font.')}</p><label for="align">${t('Alignment')}</label><select id="align"><option value="left">${t('Left')}</option><option value="center">${t('Centre')}</option><option value="right">${t('Right')}</option></select></div>
<div id="content-row"><label for="content">${t('Text')}</label><textarea id="content"></textarea></div>
</div></section><section class="stage-pane"><div class="stage-head"><h2 id="heading">${t('Application icon')}</h2><select id="theme" aria-label="${t('Preview theme')}"><option value="light">${t('Light')}</option><option value="dark">${t('Dark')}</option></select><select id="zoom" aria-label="${t('Zoom')}"><option value="1" selected>100%</option><option value="2">200%</option><option value="4">400%</option></select></div>
<div class="tools" id="managed-tools" hidden><button id="edit-default-icon" hidden>${t('Edit tile icon')}</button></div><div class="tools" id="composition-tools"><button id="add-image">${t('Add image…')}</button><button id="add-symbol" hidden>${t('Add default icon')}</button><button id="add-text">${t('Add text')}</button><button id="add-title">${t('Add title')}</button><button id="add-rectangle">${t('Add rectangle')}</button><button id="reset-layout" hidden>${t('Use standard arrangement')}</button><button id="backward" disabled>${t('Send backward')}</button><button id="forward" disabled>${t('Bring forward')}</button><button id="delete" disabled>${t('Delete')}</button></div>
<div id="stage" class="stage light"><canvas id="canvas" tabindex="0" aria-label="${t('Composition canvas')}"></canvas></div><p id="dimensions"></p></section></main><footer id="status" role="status">${t('Loading icons…')}</footer>
<script nonce="${nonce}">${selectScript}
const presets=${JSON.stringify(designer.presets)},dimensions=${JSON.stringify(designer.sizes)};const labels=${JSON.stringify(Object.fromEntries(Object.entries(slotLabels).map(([key,value])=>[key,t(value)])))},ui=${JSON.stringify({text:words.Text,title:words.Title,rectangle:words.Rectangle,symbol:words['Default tile icon'],saving:words['Saving…'],system:t('The system draws the icon and name in every tile size.'),custom:t('Design the complete tile, including its background and title.')})};
(${client.toString()})();
</script></body></html>`;
}
function open(vscode,context,directory,options){
 const root=core.project(directory).root;if(panels.has(root)){panels.get(root).reveal();return panels.get(root);}
 let state=designer.load(root),images={},busy=false,disposed=false;const controller=new AbortController();
 const panel=vscode.window.createWebviewPanel('desktile.icons',t('Application icons and tiles'),vscode.ViewColumn.Active,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[]});panels.set(root,panel);panel.webview.html=html(crypto.randomBytes(16).toString('hex'));
 const send=data=>{if(!disposed)panel.webview.postMessage({model:state,images,...data});};
 const receive=model=>({...model,directory:root,signature:state.signature,sources:state.sources});
 panel.webview.onDidReceiveMessage(async message=>{if(disposed)return;if(message.type==='fonts'){try{const fonts=await systemFonts.glyphs(root,message.requests,{...options(),signal:controller.signal});if(!disposed)panel.webview.postMessage({fonts});}catch(error){if(!core.isCancellation(error)){options().log?.((error.stack||error.message)+'\n');if(!disposed)panel.webview.postMessage({fontError:true,error:t('System font preview failed. See the DeskTile output for details.')});}}return;}if(busy)return;busy=true;try{
  if(message.type==='ready'){const settings={...options(),signal:controller.signal},results=await Promise.allSettled([designer.previews(state,settings),systemFonts.glyphs(root,systemFonts.initial(state),settings)]);for(const result of results)if(result.status==='rejected')throw result.reason;images=results[0].value;send({fonts:results[1].value});}
  else if(message.type==='choose'){const model=receive(message.model);designer.validate(model);const choice=await vscode.window.showOpenDialog({canSelectMany:false,filters:{[t('Icon images')]:['png','svg','jpg','jpeg','webp','dti']},openLabel:t('Use image')});if(!choice||disposed){send({model});return;}const imported=designer.importImage(model,choice[0].fsPath);state=model;images=await designer.previews(state,{...options(),signal:controller.signal});send({imported});}
  else if(message.type==='save'){const model=receive(message.model);await designer.save(model,message.renders,{...options(),signal:controller.signal});state=model;send({saved:true,message:t('Saved. Build application to create the installer.')});}
 }catch(error){if(!disposed){const messages={ASSET_SOURCE:'The image could not be loaded. Choose an image inside this project.',ASSET_CONFLICT:'The manifest changed. Reopen the icon editor before saving.',APP_NAME:'Check the application and tile names. Names support up to 63 UTF-8 bytes.',ASSET_OPTIONS:'Check the canvas and layer values.',ASSET_DRAFT:'The canvas export is incomplete. Try saving again.',PROCESS_FAILED:'Image conversion failed. See the DeskTile output for details.'};send({error:t(messages[error.code]||'The artwork could not be saved. See the DeskTile output for details.')});}}finally{busy=false;}});
 panel.onDidDispose(()=>{disposed=true;controller.abort();panels.delete(root);});context.subscriptions.push(panel);return panel;
}
module.exports={open,html};
