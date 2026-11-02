'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const kit=path.resolve(__dirname,'..'),exe=path.join(kit,'renderer/interactive.exe');
test('preview file service uses production paths, permissions, atomic replacement and directory operations',{skip:process.platform!=='win32'||!fs.existsSync(exe)},()=>{
 const parent=path.join(kit,'build/file-tests');fs.mkdirSync(parent,{recursive:true});const root=fs.mkdtempSync(path.join(parent,'app-'));
 try{
  fs.cpSync(path.join(kit,'sdk-bundle/examples/timer-js'),root,{recursive:true,filter:p=>!p.includes(path.sep+'.desktile')});
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));manifest.id='com.example.filetest';manifest.permissions=['user-files.read','user-files.write'];fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest));
  const sha=crypto.createHash('sha256').update('original').digest('hex');
  const requests=[
   ['denied','files.list',{scope:'user',path:''}],
   ['mkdir','files.mkdir',{path:'notes'}],
   ['write','files.write',{path:'notes/a.txt',text:'Hello',create_only:true}],
   ['read','files.read',{path:'notes/a.txt',maximum_bytes:3}],
   ['tail','files.read',{path:'notes/a.txt',offset:'3'}],
   ['stat','files.stat',{path:'notes/a.txt'}],
   ['list','files.list',{path:'notes',limit:1}],
   ['rename','files.rename',{path:'notes/a.txt',name:'b.txt'}],
   ['move','files.move',{path:'notes/b.txt',target:'c.txt'}],
   ['traversal','files.read',{path:'../outside.txt'}],
   ['empty-delete','files.delete',{path:'notes'}],
   ['delete','files.delete',{path:'c.txt'}],
   ['missing','files.read',{path:'c.txt'}],
   ['user-write','files.write',{scope:'user',path:'shared.txt',text:'original',create_only:true}],
   ['overwrite-guard','files.write',{scope:'user',path:'shared.txt',text:'changed'}],
   ['digest-conflict','files.write',{scope:'user',path:'shared.txt',text:'changed',expected_sha256:'0'.repeat(64)}],
   ['digest-write','files.write',{scope:'user',path:'shared.txt',text:'changed',expected_sha256:sha}],
   ['user-read','files.read',{scope:'user',path:'shared.txt'}],
   ['user-list','files.list',{scope:'user',path:''}],
   ['user-delete','files.delete',{scope:'user',path:'shared.txt'}]
  ];
  fs.writeFileSync(path.join(root,'src/main.js'),`
let jobs=${JSON.stringify(requests)},at=0,results=[],pending='';
function save(){DeskTile.storageWrite('results',DeskTile.utf8Encode(JSON.stringify(results)).buffer);}
function next(){if(at===jobs.length){save();return;}if(at===13){DeskTile.requestPermission(2,'Read user files');return;}run();}
function run(){const [name,operation,args]=jobs[at++];pending=name;let id=DeskTile.platformRequest(JSON.stringify(Object.assign({schema:1,operation},args)));if(id<=0){results.push({name,result:id});save();next();}}
function onRequestComplete(id,result,payload){results.push({name:pending,result,value:result===0?JSON.parse(DeskTile.utf8Decode(payload)):null});save();next();}
function onPermissionResult(id,permission,state){if(state!==1)throw Error('Permission');if(permission===2)DeskTile.requestPermission(3,'Write user files');else run();}
DeskTile.present(DeskTile.byId('page'));next();
`);
  const scenario=path.join(root,'scenario.json');fs.writeFileSync(scenario,JSON.stringify([{action:'wait',ms:1200},{action:'permission',allow:1},{action:'permission',allow:1},{action:'wait',ms:1200}]));
  const r=spawnSync(exe,[root,path.join(kit,'renderer/ui-fonts.pack'),'en-US','light',scenario],{encoding:'utf8',timeout:15000,windowsHide:true});const trace=path.join(root,'.desktile/preview-data/com.example.filetest/private',Buffer.from('results').toString('hex'));assert.equal(r.status,0,r.stdout+'\n'+r.stderr+'\n'+(fs.existsSync(trace)?fs.readFileSync(trace,'utf8'):''));
  const results=JSON.parse(fs.readFileSync(path.join(root,'.desktile/preview-data/com.example.filetest/private',Buffer.from('results').toString('hex'))));assert.equal(results.length,requests.length,JSON.stringify(results));
  const failed=new Set(['denied','traversal','missing','overwrite-guard','digest-conflict']);for(const row of results){if(failed.has(row.name))assert.ok(row.result<0,JSON.stringify(row));else assert.equal(row.result,0,JSON.stringify(row));}
  const by=name=>results.find(r=>r.name===name).value;assert.equal(Buffer.from(by('read').data_base64,'base64').toString(),'Hel');assert.equal(by('read').eof,false);assert.equal(Buffer.from(by('tail').data_base64,'base64').toString(),'lo');assert.equal(by('stat').bytes,'5');assert.equal(by('list').entries[0].name,'a.txt');assert.equal(Buffer.from(by('user-read').data_base64,'base64').toString(),'changed');assert.equal(by('user-list').entries[0].name,'shared.txt');
  fs.writeFileSync(path.join(parent,'result.json'),JSON.stringify(results,null,2));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
