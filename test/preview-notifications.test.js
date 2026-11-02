'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const kit=path.resolve(__dirname,'..'),exe=path.join(kit,'renderer/interactive.exe');
const available=process.platform==='win32'&&fs.existsSync(exe);
const core=require('../lib/core'),{buildNativePreview}=require('../lib/native-preview');
function execute(root,steps){const file=path.join(root,'scenario.json');fs.writeFileSync(file,JSON.stringify(steps));const r=spawnSync(exe,[root,path.join(kit,'renderer/ui-fonts.pack'),'en-US','light',file],{encoding:'utf8',timeout:20000,windowsHide:true});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);}
test('QuickJS notifications use queue, permission, update, cancellation and click callbacks',{skip:!available},()=>{
 const parent=path.join(kit,'build/notification-tests');fs.mkdirSync(parent,{recursive:true});const root=fs.mkdtempSync(path.join(parent,'app-'));
 try{
  fs.cpSync(path.join(kit,'sdk-bundle/examples/timer-js'),root,{recursive:true,filter:p=>!p.includes(path.sep+'.desktile')});
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.id='com.example.notificationtest';manifest.name={'en-US':'Calendar'};manifest.permissions=['notifications'];fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));
  fs.writeFileSync(path.join(root,'src/main.js'),`
let records=[],completions=0;const h=DeskTile.byId;
function persist(){DeskTile.storageWrite('results',DeskTile.utf8Encode(JSON.stringify({records,completions})).buffer);}
function post(id,title){return DeskTile.postNotification({id,title,body:'Weekly meeting',data:id,eventTime:DeskTile.wallClockSeconds()+600});}
records.push({kind:'denied',value:post('denied','Meeting')});persist();DeskTile.requestPermission(5,'Notification preview test');
function onPermissionResult(id,p,state){if(state!==1)return;records.push({kind:'first',value:post('one','Meeting reminder')},{kind:'second',value:post('two','Next meeting')});persist();}
function onRequestComplete(id,result,payload){if(result!==0)throw Error('Completion '+result);completions++;persist();}
function onNotification(value){records.push({kind:'click',id:value.id,data:value.data});persist();}
function onEvent(event,target){if(event!==0)return;if(target===h('one'))records.push({kind:'update',value:DeskTile.updateNotification({id:'two',title:'Updated reminder',data:'new'})});if(target===h('five'))records.push({kind:'cancel',value:DeskTile.cancelNotification('two')});if(target===h('fifteen')){for(let i=0;i<9;i++)records.push({kind:'capacity',index:i,value:post('q'+i,'Queued '+i)});records.push({kind:'missing',value:DeskTile.cancelNotification('missing')});}persist();}
DeskTile.present(h('page'));
`);
  const save=name=>({action:'save',path:path.join(root,name)});
  execute(root,[{action:'permission',allow:1},{action:'wait',ms:350},save('first'),{action:'tap',x:200,y:60},{action:'wait',ms:60},save('leaving'),{action:'wait',ms:450},save('second'),{action:'tap',x:100,y:334},{action:'wait',ms:100},save('updated'),{action:'tap',x:300,y:334},{action:'wait',ms:240},save('cancelled'),{action:'tap',x:500,y:334},{action:'wait',ms:350},save('queued'),{action:'down',x:250,y:60},{action:'move',x:250,y:5},{action:'up',x:250,y:5},{action:'wait',ms:450},save('dismissed')]);
  const result=JSON.parse(fs.readFileSync(path.join(root,'.desktile/preview-data/com.example.notificationtest/private',Buffer.from('results').toString('hex'))));
  const by=kind=>result.records.filter(r=>r.kind===kind);
  assert.equal(by('denied')[0].value,-1);assert.ok(by('first')[0].value>0);assert.ok(by('second')[0].value>0);
  assert.deepEqual(by('click'),[{kind:'click',id:'one',data:'one'}]);assert.ok(by('update')[0].value>0);assert.ok(by('cancel')[0].value>0);
  assert.equal(by('capacity').filter(r=>r.value>0).length,8);assert.ok(by('capacity')[8].value<0);assert.ok(by('missing')[0].value<0);assert.equal(result.completions,12);
  const pixels=name=>fs.readFileSync(path.join(root,name+'.rgb565'));
  for(const name of ['first','second','updated','queued','dismissed']){assert.equal(pixels(name).readUInt16LE(0),0xfcc0,name+' banner background');fs.copyFileSync(path.join(root,name+'.rgb565'),path.join(parent,name+'.rgb565'));}
  assert.notDeepEqual(pixels('first').subarray(32*1600,88*1600),pixels('second').subarray(32*1600,88*1600));
  assert.notDeepEqual(pixels('second').subarray(32*1600,88*1600),pixels('updated').subarray(32*1600,88*1600));
  assert.notEqual(pixels('cancelled').readUInt16LE(0),0xfcc0);
  fs.writeFileSync(path.join(parent,'result.json'),JSON.stringify(result,null,2));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('Native notification ABI receives a click after the App Menu suspends the banner',{skip:!available},async()=>{
 const parent=path.join(kit,'build/notification-tests');const root=fs.mkdtempSync(path.join(parent,'native-'));
 try{
  fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({manifest_version:1,id:'com.example.nativenotification',name:'Notification',version:'1.0.0',version_code:1,runtime:'native-module',entry:{module:'app.elf'},sdk:{minimum:'1.0',target:'1.0'},permissions:['notifications']}));
  fs.writeFileSync(path.join(root,'src/main.cpp'),`
#include <desktile/sdk.h>
#include <cstring>
static const dt_host_api_v1 *api;static dt_app_context owner;
static dt_result lifecycle(void*,dt_lifecycle_event event){if(event!=DT_LIFECYCLE_ENTER)return DT_OK;dt_handle page=0;dt_request_id request=0;api->ui_create(owner,DT_COMPONENT_PAGE,&page);api->ui_present(owner,page);return api->permission_request(owner,DT_PERMISSION_NOTIFICATIONS,"Notification preview test",&request);}
static dt_result event(void*,uint16_t event,dt_bytes bytes){
 if(event==DT_EVENT_PERMISSION_RESULT){const char*json=R"({"id":"native","title":"Reminder","body":"Native callback","data":"detail"})";dt_request_id id=0;return api->notification_post(owner,{reinterpret_cast<const uint8_t*>(json),strlen(json)},&id);}
 if(event==DT_EVENT_NOTIFICATION){const auto&value=*reinterpret_cast<const dt_notification_event_v1*>(bytes.data);if(strcmp(value.id,"native")||strcmp(value.data,"detail"))return DT_ERR_INVALID_ARGUMENT;return api->storage_write(owner,"clicked",{reinterpret_cast<const uint8_t*>(value.data),strlen(value.data)});}return DT_OK;
}
static void destroy(void*){}
extern "C" __declspec(dllexport) dt_result dt_app_entry(const dt_host_api_v1 *host,dt_app_context context,dt_app_instance_v1 *out){api=host;owner=context;*out={DT_SDK_ABI_VERSION,nullptr,lifecycle,event,destroy};return DT_OK;}
`);
  await buildNativePreview(root,core.sdkRoot(),core.run);
  execute(root,[{action:'permission',allow:1},{action:'wait',ms:350},{action:'tool',id:205},{action:'wait',ms:5500},{action:'save',path:path.join(root,'menu')},{action:'tool',id:205},{action:'wait',ms:550},{action:'save',path:path.join(root,'resumed')},{action:'tap',x:180,y:60},{action:'wait',ms:250},{action:'save',path:path.join(root,'dismissed')}]);
  assert.notEqual(fs.readFileSync(path.join(root,'menu.rgb565')).readUInt16LE(0),0xfcc0);
  assert.equal(fs.readFileSync(path.join(root,'resumed.rgb565')).readUInt16LE(0),0xfcc0);
  assert.notEqual(fs.readFileSync(path.join(root,'dismissed.rgb565')).readUInt16LE(0),0xfcc0);
  assert.equal(fs.readFileSync(path.join(root,'.desktile/preview-data/com.example.nativenotification/private',Buffer.from('clicked').toString('hex')),'utf8'),'detail');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
