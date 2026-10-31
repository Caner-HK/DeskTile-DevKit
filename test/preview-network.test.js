'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawn}=require('node:child_process');
const kit=path.resolve(__dirname,'..'),exe=path.join(kit,'renderer/interactive.exe');
const available=process.platform==='win32'&&fs.existsSync(exe);
const core=require('../lib/core'),{buildNativePreview}=require('../lib/native-preview');
function execute(root,steps){
  const scenario=path.join(root,'scenario.json');fs.writeFileSync(scenario,JSON.stringify(steps));
  return new Promise((resolve,reject)=>{
    const child=spawn(exe,[root,path.join(kit,'renderer/ui-fonts.pack'),'en-US','light',scenario],{windowsHide:true});
    let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
    const timer=setTimeout(()=>{child.kill();reject(Error('Preview request test timed out: '+output));},15000);
    child.on('error',reject);child.on('close',code=>{clearTimeout(timer);code===0?resolve(output):reject(Error(output));});
  });
}
test('preview network executes through QuickJS, permissions and the real completion queue',{skip:!available},async()=>{
  const requests=[];
  const server=http.createServer((req,res)=>{
    let body='';req.on('data',x=>body+=x);req.on('end',()=>{
      requests.push({url:req.url,method:req.method,body,accept:req.headers.accept});
      if(req.url==='/slow')return setTimeout(()=>res.end('slow'),600);
      if(req.url==='/timeout')return setTimeout(()=>res.end('late'),2300);
      if(req.url==='/large')return res.end('x'.repeat(32769));
      if(req.url==='/limit')return res.end('x'.repeat(32768));
      if(req.url==='/redirect'){res.writeHead(302,{Location:'/ok'});return res.end();}
      if(req.url==='/missing'){res.writeHead(404);return res.end('not found');}
      res.end(req.method==='POST'?body:'hello');
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const parent=path.join(kit,'build/network-tests');fs.mkdirSync(parent,{recursive:true});
  const root=fs.mkdtempSync(path.join(parent,'app-'));
  try{
    fs.cpSync(path.join(kit,'../samples/timer-js'),root,{recursive:true,filter:p=>!p.includes(path.sep+'.desktile')&&!p.includes(path.sep+'dist')});
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.id='com.example.networktest';manifest.permissions=['network'];fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));
    const base='http://127.0.0.1:'+server.address().port;
    fs.writeFileSync(path.join(root,'src/main.js'),`
let records=[],pending={},updates=0,index=0,stressWait=0;
const tests=[['get',{url:'${base}/ok'}],['post',{url:'${base}/post',method:'POST',body:'test body',accept:'text/plain'}],['redirect',{url:'${base}/redirect'}],['missing',{url:'${base}/missing'}],['limit',{url:'${base}/limit'}],['large',{url:'${base}/large'}],['timeout',{url:'${base}/timeout',timeout_ms:1000}]];
function persist(){let s=JSON.stringify(records),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);if(DeskTile.storageWrite('results',b.buffer)!==0)throw Error('Persist failed');}
function request(name,options){let id=DeskTile.network(JSON.stringify(options));if(id<=0)throw Error(name+': '+id);pending[id]={name,start:updates};return id;}
function next(){if(index<tests.length){let pair=tests[index++];request(pair[0],pair[1]);}else stressWait=100;}
function stress(){let ids=[];for(let i=0;i<4;i++)ids.push(request('slow'+i,{url:'${base}/slow'}));records.push({name:'capacity',result:DeskTile.network(JSON.stringify({url:'${base}/ok'}))});records.push({name:'cancel',result:DeskTile.cancelRequest(ids[0])});delete pending[ids[0]];persist();}
function update(){updates++;if(stressWait>0&&--stressWait===0)stress();}
function onPermissionResult(id,permission,state){if(state===1){records.push({name:'invalid',result:DeskTile.network(JSON.stringify({url:'${base}/ok',method:'DELETE'}))});next();}else persist();}
function onRequestComplete(id,result,payload){const p=pending[id];if(!p)throw Error('Unexpected completion '+id);delete pending[id];const view=new DataView(payload);records.push({name:p.name,result,status:view.getInt32(0,true),bytes:view.getUint32(4,true),updates:updates-p.start});persist();if(!p.name.startsWith('slow'))next();}
records.push({name:'denied',result:DeskTile.network(JSON.stringify({url:'${base}/ok'}))});persist();DeskTile.requestPermission(0,'Network preview test');
`);
    await execute(root,[{action:'permission',allow:1},{action:'wait',ms:6500}]);
    const result=JSON.parse(fs.readFileSync(path.join(root,'.desktile/preview-data/com.example.networktest/private',Buffer.from('results').toString('hex'))));
    fs.writeFileSync(path.join(parent,'result.json'),JSON.stringify({result,requests},null,2));
    const by=name=>{const row=result.find(x=>x.name===name);assert.ok(row,JSON.stringify(result));return row;};
    assert.ok(by('denied').result<0);assert.ok(by('invalid').result<0);assert.ok(by('capacity').result<0);assert.equal(by('cancel').result,0);
    for(const name of ['get','post','redirect'])assert.equal(by(name).status,200);
    assert.equal(by('post').bytes,9);assert.equal(by('missing').status,404);assert.equal(by('missing').bytes,0);
    assert.equal(by('limit').bytes,32768);assert.ok(by('large').result<0);assert.ok(by('timeout').result<0);
    assert.ok(by('slow1').updates>=10,'Application ticks must continue during IO');
    assert.equal(result.some(x=>x.name==='slow0'),false,'Cancelled request must not call back');
    assert.ok(requests.some(x=>x.url==='/post'&&x.body==='test body'&&x.accept==='text/plain'));
    fs.writeFileSync(path.join(parent,'result.json'),JSON.stringify({result,requests},null,2));
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
});

test('Native preview receives the same SDK network response ABI',{skip:!available},async()=>{
  const server=http.createServer((req,res)=>res.end('native response'));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const parent=path.join(kit,'build/network-tests');fs.mkdirSync(parent,{recursive:true});
  const root=fs.mkdtempSync(path.join(parent,'native-'));
  try{
    fs.mkdirSync(path.join(root,'src'));
    fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({manifest_version:1,id:'com.example.nativenetwork',name:'Network',version:'1.0.0',version_code:1,runtime:'native-module',entry:{module:'app.elf'},sdk:{minimum:'1.0',target:'1.0'},permissions:['network']}));
    fs.writeFileSync(path.join(root,'src/main.cpp'),`
#include <desktile/sdk.h>
#include <cstring>
static const dt_host_api_v1 *api; static dt_app_context owner;
static dt_result lifecycle(void*,dt_lifecycle_event e){
 if(e!=DT_LIFECYCLE_ENTER)return DT_OK;
 dt_handle page=0;dt_request_id request=0;
 auto result=api->ui_create(owner,DT_COMPONENT_PAGE,&page);if(result!=DT_OK)return result;
 result=api->ui_present(owner,page);if(result!=DT_OK)return result;
 return api->permission_request(owner,DT_PERMISSION_NETWORK,"Network preview test",&request);
}
static dt_result event(void*,uint16_t e,dt_bytes bytes){
 if(e==DT_EVENT_PERMISSION_RESULT){
  const char *json=R"({"url":"http://127.0.0.1:${server.address().port}/native"})";dt_request_id id=0;
  return api->network_request(owner,{reinterpret_cast<const uint8_t*>(json),strlen(json)},&id);
 }
 if(e==DT_EVENT_REQUEST_COMPLETE){
  const auto &r=*reinterpret_cast<const dt_request_complete_event*>(bytes.data);
  if(r.result!=DT_OK)return r.result;
  return api->storage_write(owner,"response",r.payload);
 }
 return DT_OK;
}
static void destroy(void*){}
extern "C" __declspec(dllexport) dt_result dt_app_entry(const dt_host_api_v1 *host,dt_app_context context,dt_app_instance_v1 *out){api=host;owner=context;*out={DT_SDK_ABI_VERSION,nullptr,lifecycle,event,destroy};return DT_OK;}
`);
    await buildNativePreview(root,core.sdkRoot(),core.run);
    await execute(root,[{action:'permission',allow:1},{action:'wait',ms:500}]);
    const bytes=fs.readFileSync(path.join(root,'.desktile/preview-data/com.example.nativenetwork/private',Buffer.from('response').toString('hex')));
    assert.equal(bytes.readInt32LE(0),200);assert.equal(bytes.readUInt32LE(4),15);assert.equal(bytes.subarray(8).toString(),'native response');
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
});
