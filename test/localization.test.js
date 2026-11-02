'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const i18n=require('../lib/i18n');
test('language resolution, interpolation and fallback',()=>{
 assert.equal(i18n.resolve('auto','zh-tw'),'zh-cn');
 assert.equal(i18n.resolve('en','zh-cn'),'en');
 i18n.configure('zh-cn');assert.equal(i18n.t('Installing on {0}','COM4'),'正在安装到 COM4');
 assert.equal(i18n.t('unknown'),'unknown');i18n.configure('en');assert.equal(i18n.t('Start'),'Start');
});
test('both panels render translated controls and valid scripts',()=>{
 for(const language of ['en','zh-cn']){
  i18n.configure(language);
  for(const name of ['asset-panel','device-panel','workflow-panel']){
   const html=require('../lib/'+name).html('test',name==='workflow-panel'?'package':undefined);
   const expected={'asset-panel':['Save to project','保存到项目'],'device-panel':['Free memory','可用内存'],'workflow-panel':['Package inspection','检查安装包']};
   assert.ok(html.includes(expected[name][language==='en'?0:1]));
   new vm.Script(html.match(/<script nonce="test">([\s\S]*?)<\/script>/)[1]);
   assert.ok(!html.includes(String.fromCharCode(183)));
  }
 }
 i18n.configure('en');
});
test('workflow pages use distinct task titles without inner navigation or version branding',()=>{
 for(const language of ['en','zh-cn']){i18n.configure(language);for(const mode of ['environment','package','install']){
  const html=require('../lib/workflow-panel').html('test',mode);
  assert.ok(!html.includes('<nav'));assert.ok(!html.includes('id="versions"'));assert.ok(!html.includes('data-mode='));
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  new vm.Script(html.match(/<script nonce="test">([\s\S]*?)<\/script>/)[1]);
 }}i18n.configure('en');
});
test('all contributed strings resolve in English and Chinese',()=>{
 const root=path.resolve(__dirname,'..'),pkg=require('../package.json');
 const keys=[...JSON.stringify(pkg).matchAll(/%([\w.]+)%/g)].map(m=>m[1]);
 for(const file of ['package.nls.json','package.nls.zh-cn.json']){
  const translations=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  for(const key of keys)assert.ok(translations[key],file+': '+key);
  assert.ok(pkg.files.includes(file));
 }
 assert.equal(pkg.contributes.configuration.properties['desktile.language'].default,'auto');
});
