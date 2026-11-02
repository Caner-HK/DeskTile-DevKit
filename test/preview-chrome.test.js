'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const core=require('../lib/core'),kit=path.resolve(__dirname,'..'),exe=path.join(kit,'renderer/interactive.exe');
test('preview chrome supports light/dark and Chinese/English independently of application state, with persistent preferences',{skip:!fs.existsSync(exe)},async()=>{
 const fixtures=path.join(kit,'build/preview-chrome-tests');fs.mkdirSync(fixtures,{recursive:true});const root=fs.mkdtempSync(path.join(fixtures,'case-')),app=path.join(root,'app'),config=path.join(root,'preferences');
 try{
  await core.create(app,{id:'com.example.previewchrome',name:'Preview',author:'Test'});
  const run=(steps,theme='dark',language='zh-cn')=>{const file=path.join(root,'scenario.json');fs.writeFileSync(file,JSON.stringify(steps));const result=spawnSync(exe,[app,path.join(kit,'renderer/ui-fonts.pack'),'en-US','light',file],{encoding:'utf8',windowsHide:true,timeout:15000,env:{...process.env,DESKTILE_PREVIEW_CONFIG_DIR:config,DESKTILE_PREVIEW_UI_THEME:theme,DESKTILE_PREVIEW_UI_LANGUAGE:language}});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);};
  const evidence=path.join(kit,'build/interactive-evidence');fs.mkdirSync(evidence,{recursive:true});const dark=path.join(evidence,'preview-chrome-dark-zh.bmp'),light=path.join(evidence,'preview-chrome-light-en.bmp');
  run([{action:'save',path:path.join(root,'before')},{action:'chrome',path:dark},{action:'host-ui',theme:'light',language:'en'},{action:'chrome',path:light},{action:'save',path:path.join(root,'after')},{action:'host-ui',theme:'dark',language:'zh-CN'},{action:'save-preferences'}]);
  const darkInfo=JSON.parse(fs.readFileSync(dark+'.json')),lightInfo=JSON.parse(fs.readFileSync(light+'.json'));
  assert.equal(darkInfo.uiTheme,'dark');assert.equal(darkInfo.uiLanguage,'zh-CN');assert.ok(darkInfo.controls.some(c=>c.label==='设置'));
  assert.equal(lightInfo.uiTheme,'light');assert.equal(lightInfo.uiLanguage,'en');assert.ok(lightInfo.controls.some(c=>c.label==='Settings'));
  for(const info of [darkInfo,lightInfo])assert.equal(info.toolbarHeightAt533,38,'All toolbar actions fit one row at 800 physical pixels and 150 percent DPI');
  for(const info of [darkInfo,lightInfo])for(const control of info.controls){assert.equal(control.height,26);assert.ok(control.width>26);}
  const pixel=file=>{const b=fs.readFileSync(file);return [...b.subarray(b.readUInt32LE(10),b.readUInt32LE(10)+3)];};
  assert.deepEqual(pixel(dark),[31,31,31]);assert.deepEqual(pixel(light),[255,255,255]);
  assert.deepEqual(fs.readFileSync(path.join(root,'before.rgb565')).subarray(32*1600),fs.readFileSync(path.join(root,'after.rgb565')).subarray(32*1600),'Host appearance must preserve the application framebuffer');
  const stored=JSON.parse(fs.readFileSync(path.join(config,'settings.json')));assert.equal(stored.uiTheme,'dark');assert.equal(stored.uiLanguage,'zh-CN');assert.equal(stored.locale,'en-US');assert.equal(stored.dark,false);
  const reopened=path.join(root,'reopened.bmp');run([{action:'chrome',path:reopened}],'light','en');const restored=JSON.parse(fs.readFileSync(reopened+'.json'));assert.equal(restored.uiTheme,'dark');assert.equal(restored.uiLanguage,'zh-CN');

  for(const [theme,language] of [['dark','zh-CN'],['light','en']]){
   const captures=[100,150,200].map(dpi=>({action:'select-evidence',dpi,path:path.join(evidence,'selects-'+theme+'-'+language+'-'+dpi+'.bmp')}));
   run([{action:'host-ui',theme,language},...captures]);
   for(const capture of captures){const info=JSON.parse(fs.readFileSync(capture.path+'.json'));assert.equal(info.controls.length,9);const bitmap=fs.readFileSync(capture.path),width=bitmap.readInt32LE(18),pixel=bitmap.readUInt32LE(10)+(Math.round(63*info.scale)*width+Math.round(20*info.scale))*4;assert.deepEqual([...bitmap.subarray(pixel,pixel+3)],[212,120,0],'Native selection must use primary blue');const fieldPixel=bitmap.readUInt32LE(10)+(Math.round(20*info.scale)*width+Math.round(20*info.scale))*4;assert.deepEqual([...bitmap.subarray(fieldPixel,fieldPixel+3)],theme==='dark'?[31,31,31]:[255,255,255],'Toolbar selects must keep the bar background');for(const control of info.controls){assert.equal(control.popupWidth,control.fieldWidth);for(const option of control.options)assert.ok(option.width<=control.available,capture.path+': '+option.text+' is clipped');}
    assert.deepEqual(info.controls.find(c=>c.id===201).options.map(o=>o.text),language==='en'?['Light theme','Dark theme']:['浅色主题','深色主题']);
    assert.deepEqual(info.controls.find(c=>c.id===204).options.map(o=>o.text),['60 FPS','30 FPS','15 FPS']);
   }
  }


  for(const [theme,language] of [['dark','zh-CN'],['light','en']])for(const dpi of [100,150,200]){
   const checkbox=path.join(evidence,'checkbox-'+theme+'-'+language+'-'+dpi+'.bmp'),scale=dpi/100;run([{action:'host-ui',theme,language},{action:'checkbox-evidence',path:checkbox,dpi}]);const checkboxes=JSON.parse(fs.readFileSync(checkbox+'.json'));assert.equal(checkboxes.length,2);for(const control of checkboxes){assert.equal(control.sourceHidden,true);assert.equal(control.controlType,50002);assert.deepEqual(control.states,[0,1,0]);}
   const bitmap=fs.readFileSync(checkbox),width=bitmap.readInt32LE(18),offset=bitmap.readUInt32LE(10),stride=Math.trunc(36*scale),height=Math.trunc(26*scale),background=theme==='dark'?[31,31,31]:[255,255,255],pixel=(x,y)=>[...bitmap.subarray(offset+(y*width+x)*4,offset+(y*width+x)*4+3)];
   for(let row=0;row<6;row++)for(let y=0;y<height;y++)for(let x=0;x<3;x++)assert.deepEqual(pixel(x,row*stride+y),background,'Native checkbox leaked into the custom rendering');
   for(let control=0;control<2;control++){
    let minX=width,maxX=-1,minY=height,maxY=-1;
    for(let y=0;y<height;y++)for(let x=0;x<Math.round(22*scale);x++)if(pixel(x,control*3*stride+y).some((v,i)=>v!==pixel(x,(control*3+1)*stride+y)[i])){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    assert.ok(maxX>=minX,'Checked state must draw a visible checkmark');
    const boxLeft=Math.round(4*scale),size=Math.round(14*scale),boxTop=Math.trunc((height-size)/2),centerX=boxLeft+(size-1)/2,centerY=boxTop+(size-1)/2;
    assert.ok(Math.abs((minX+maxX)/2-centerX)<=0.5,checkbox+': mark must be horizontally centered');
    assert.ok(Math.abs((minY+maxY)/2-centerY)<=0.5,checkbox+': mark must be vertically centered');
   }
  }

 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
