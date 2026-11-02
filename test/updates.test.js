'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),updates=require('../lib/updates'),i18n=require('../lib/i18n');
const repo='https://github.com/Caner-HK/DeskTile-DevKit',installed={version:'1.0.0',toolRevision:1,sdk:'1.0'};
function release(v,extra={}){const url=repo+'/releases/download/v'+v;return {tag_name:'v'+v,html_url:repo+'/releases/tag/v'+v,draft:false,prerelease:false,assets:[{name:'artifacts.json',state:'uploaded',browser_download_url:url+'/artifacts.json'},{name:'desktile-devkit-'+v+'-win32-x64.vsix',state:'uploaded',browser_download_url:url+'/desktile-devkit-'+v+'-win32-x64.vsix'}],...extra};}
function transport(releases,metadata){return async url=>new Response(JSON.stringify(url.includes('/releases?')?releases:metadata[url.match(/download\/v([^/]+)/)?.[1]]),{status:200});}
function manifest(version,sdk='1.0',revision=2){return {version,sdk,toolRevision:revision,supportedSdks:[sdk]};}
test('stable semantic versions compare numerically and unsafe release links are rejected',()=>{
 assert.ok(updates.compare('1.0.10','1.0.2')>0);assert.equal(updates.compare('1.0.0','1.0.0'),0);for(const v of ['1.0','01.0.0','1.0.0-beta','1.0.0+test','999999999999999999999.0.0'])assert.equal(updates.version(v),null);
 for(const u of ['http://github.com/Caner-HK/DeskTile-DevKit/releases/tag/v1','https://github.com.evil.test/Caner-HK/DeskTile-DevKit/releases/tag/v1',repo+'/releases/tag/v1?redirect=evil','https://user@github.com/Caner-HK/DeskTile-DevKit/releases/tag/v1'])assert.equal(updates.releaseUrl(u),false);
});
test('checks stable releases with actual SDK metadata and skips a newer incompatible SDK series',async()=>{
 const result=await updates.check({installed,fetch:transport([release('1.1.0'),release('1.0.2'),release('1.0.9',{prerelease:true}),release('1.0.8',{draft:true})],{'1.1.0':manifest('1.1.0','1.1',1),'1.0.2':manifest('1.0.2')})});
 assert.equal(result.status,'available');assert.equal(result.release.version,'1.0.2');assert.equal(result.release.toolRevision,2);assert.ok(result.release.download.endsWith('.vsix'));
 const current=await updates.check({installed,fetch:transport([release('1.0.0')],{'1.0.0':manifest('1.0.0','1.0',1)})});assert.equal(current.status,'current');
});
test('empty,other-SDK,missing metadata and missing installers have distinct results',async()=>{
 assert.equal((await updates.check({installed,fetch:transport([],{})})).status,'no-releases');
 assert.equal((await updates.check({installed,fetch:transport([release('1.1.0')],{'1.1.0':manifest('1.1.0','1.1',1)})})).status,'incompatible');
 for(const data of [{...manifest('1.0.1'),version:'9.0.0'},{...manifest('1.0.1'),supportedSdks:[]},{...manifest('1.0.1'),toolRevision:0}])await assert.rejects(updates.check({installed,fetch:transport([release('1.0.1')],{'1.0.1':data})}),{code:'UPDATE_METADATA'});
 const r=release('1.0.1');r.assets.pop();await assert.rejects(updates.check({installed,fetch:transport([r],{'1.0.1':manifest('1.0.1')})}),{code:'UPDATE_METADATA'});
});
test('rate limits,offline,timeout and cancellation preserve useful error classification',async()=>{
 await assert.rejects(updates.check({installed,fetch:async()=>new Response('{}',{status:429})}),{code:'UPDATE_RATE_LIMIT'});
 await assert.rejects(updates.check({installed,fetch:async()=>{throw Error('offline');}}),{code:'UPDATE_NETWORK'});
 await assert.rejects(updates.check({installed,timeoutMs:5,fetch:async(_u,o)=>{await new Promise(r=>setTimeout(r,20));if(o.signal.aborted)throw Error('aborted');return new Response('[]');}}),{code:'UPDATE_TIMEOUT'});
 const c=new AbortController();c.abort();await assert.rejects(updates.check({installed,signal:c.signal,fetch:async()=>{throw Error('aborted');}}),{code:'CANCELLED'});
});
test('native update prompts localize and only open the selected release or installer',async()=>{
 for(const language of ['en','zh-cn']){i18n.configure(language);const result=await updates.check({installed,fetch:transport([release('1.0.1')],{'1.0.1':manifest('1.0.1')})}),opened=[];let prompt;
 const vscode={Uri:{parse:u=>u},env:{openExternal:async u=>opened.push(u)},window:{showInformationMessage:async(message,...actions)=>{prompt={message,actions};return actions[0];}}};
 await updates.present(vscode,result);assert.equal(opened[0],result.release.download);assert.equal(prompt.actions[0],i18n.t('Download VSIX'));assert.ok(prompt.message.includes('1.0.1'));
 vscode.window.showInformationMessage=async()=>undefined;await updates.present(vscode,result);assert.equal(opened.length,1);
 }i18n.configure('en');
});

