'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),os=require('node:os'),fs=require('node:fs'),path=require('node:path');
const {folderError}=require('../lib/project-location');
test('new project names stay inside the chosen directory and protect existing entries',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-location-'));
 try{
  for(const name of ['', '..', '../outside','a/b','a\\b','CON','con.txt','LPT1','trailing.',' leading','a:b'])assert.ok(folderError(root,name),name);
  assert.equal(folderError(root,'My Timer'),undefined);assert.equal(folderError(root,'計時器'),undefined);
  fs.mkdirSync(path.join(root,'Existing'));assert.ok(folderError(root,'Existing'));
  fs.writeFileSync(path.join(root,'file'),'keep');assert.ok(folderError(root,'file'));assert.equal(fs.readFileSync(path.join(root,'file'),'utf8'),'keep');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
