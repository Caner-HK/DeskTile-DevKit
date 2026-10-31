'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const kit=path.resolve(__dirname,'..'),exe=path.join(kit,'renderer/interactive.exe');
test('preview preferences persist across processes, explicit CLI locale wins, corrupt file uses defaults',{skip:process.platform!=='win32'},()=>{
 const root=fs.mkdtempSync(path.join(kit,'build/preferences-')),config=path.join(root,'settings');
 const project=path.join(kit,'sdk-bundle/examples/notes-js');
 function run(locale,theme,steps){const scenario=path.join(root,'scenario.json');fs.writeFileSync(scenario,JSON.stringify(steps));const r=spawnSync(exe,[project,path.join(kit,'renderer/ui-fonts.pack'),locale,theme,scenario],{encoding:'utf8',timeout:30000,windowsHide:true,env:{...process.env,DESKTILE_PREVIEW_CONFIG_DIR:config}});assert.equal(r.status,0,r.stdout+r.stderr);}
 run('en-US','dark',[{action:'language',value:'zh-CN'},{action:'status',battery:42,wifi:4,charging:1},{action:'font',value:2},{action:'save-preferences'}]);
 const filename=path.join(config,'settings.json');let saved=JSON.parse(fs.readFileSync(filename));assert.equal(saved.locale,'zh-CN');assert.equal(saved.battery,42);assert.equal(saved.font,2);assert.equal(saved.dark,true);
 run('auto','auto',[{action:'save-preferences'}]);assert.deepEqual(JSON.parse(fs.readFileSync(filename)),saved);
 run('en-US','light',[{action:'save-preferences'}]);saved=JSON.parse(fs.readFileSync(filename));assert.equal(saved.locale,'en-US');assert.equal(saved.dark,false);assert.equal(saved.battery,42);
 fs.writeFileSync(filename,'{invalid');run('auto','auto',[{action:'save-preferences'}]);saved=JSON.parse(fs.readFileSync(filename));assert.equal(saved.locale,'zh-HK');assert.equal(saved.zoom,1);assert.equal(saved.fit,false);assert.equal(saved.battery,78);
 fs.writeFileSync(filename,JSON.stringify({version:1,locale:'xx',zoom:99,font:1,battery:900,wifi:-1,fps:7}));run('auto','auto',[{action:'save-preferences'}]);saved=JSON.parse(fs.readFileSync(filename));assert.equal(saved.font,0);assert.equal(saved.fps,60);assert.equal(saved.battery,78);assert.equal(saved.zoom,1);
 assert.deepEqual(fs.readdirSync(config),['settings.json']);
});
