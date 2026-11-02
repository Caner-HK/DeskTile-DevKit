'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),support=require('../lib/language-support'),core=require('../lib/core');
const sdk=core.sdkRoot({}),root=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-completion-'));
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
function suggest(text,language='html',selected=sdk){return support.suggestions(text,text.length,{sdk:selected,project:root,language});}
test('HTML completes real tags,typed attributes and valid values without duplicate properties',()=>{
 const tags=suggest('<dt-');assert.ok(tags.some(i=>i.label==='dt-scroll'));assert.ok(tags.some(i=>i.label==='dt-canvas'));assert.ok(!tags.some(i=>i.label==='dt-scroll-view'));
 assert.deepEqual(suggest('<dt-bu').map(i=>i.label),['dt-button']);
 const attrs=suggest('<dt-button width="120" ');assert.ok(attrs.some(i=>i.label==='button-style'));assert.ok(!attrs.some(i=>i.label==='width'));assert.ok(!attrs.some(i=>i.label==='date-time-config'));
 assert.deepEqual(suggest('<dt-checkbox checked="').map(i=>i.label),['true','false']);
 assert.deepEqual(suggest('<dt-row alignment="').map(i=>i.label),['0','1','2','3']);
 assert.deepEqual(suggest('<dt-text '+"text='中文 > text' fo").map(i=>i.label).sort(),['font-size','font-weight','foreground','foreground-role'].sort());
 assert.ok(suggest('<dt-button button-style="').some(i=>i.label==='9'&&i.detail==='DT_BUTTON_CANCEL'));
 assert.deepEqual(suggest('<!-- <dt-'),[]);assert.deepEqual(suggest('<button '),[]);assert.deepEqual(suggest('<dt-text text="ordinary'),[]);
});
test('resources and Native headers use real project/SDK files and bounded valid system IDs',()=>{
 fs.mkdirSync(path.join(root,'assets'),{recursive:true});fs.writeFileSync(path.join(root,'assets/icon.dti'),'fixture');
 const list=suggest('<dt-image resource="assets/');assert.equal(list[0].label,'assets/icon.dti');assert.equal(list[0].start,'<dt-image resource="'.length);
 const icons=suggest('<dt-icon icon="');assert.ok(icons.some(i=>i.label==='28'&&i.detail==='Folder'));assert.ok(!icons.some(i=>Number(i.label)>120));
 const headers=suggest('#include <desktile/','cpp');assert.ok(headers.some(i=>i.label==='desktile/sdk.h'));assert.ok(headers.every(i=>i.kind==='File'));assert.deepEqual(suggest('#include <vector','cpp'),[]);
});
test('JavaScript globals,module exports and module paths come from actual SDK declarations',()=>{
 assert.ok(suggest('DeskTile.','javascript').some(i=>i.label==='resourceRead'));assert.ok(suggest('DeskTile.sto','javascript').some(i=>i.label==='storageWrite'));
 assert.ok(suggest('var ui=DeskTile.require("ui/components.js");\nui.','javascript').some(i=>i.label==='listRow'&&i.detail.includes('ListRowOptions')));
 assert.ok(suggest('var ui=/** @type {typeof import("../.desktile/types/components")} */ (DeskTile.require("ui/components.js"));\nui.createSc','javascript').some(i=>i.label==='createScaffold'));
 assert.ok(suggest('DeskTile.require("ui/','javascript').some(i=>i.label==='ui/scaffold.js'));
 assert.ok(suggest('DeskTile.icons.','javascript').some(i=>i.label==='select'));
 assert.deepEqual(suggest('// DeskTile.','javascript'),[]);assert.deepEqual(suggest('"DeskTile.','javascript'),[]);assert.deepEqual(suggest('unrelated.','javascript'),[]);
});
test('selected SDK controls the completion contract and provider emits correct insertion ranges',()=>{
 const alternate=path.join(root,'alternate');fs.mkdirSync(path.join(alternate,'sdk/contract'),{recursive:true});fs.cpSync(path.join(sdk,'sdk/javascript'),path.join(alternate,'sdk/javascript'),{recursive:true});
 fs.writeFileSync(path.join(alternate,'sdk/contract/desktile-api.json'),JSON.stringify({components:['button'],properties:[{id:'text',value:'utf8'}]}));
 for(const file of ['sdk/include/desktile/sdk.h','tools/build_dtapp.py','examples/scaffold-js/manifest.json']){fs.mkdirSync(path.dirname(path.join(alternate,file)),{recursive:true});fs.writeFileSync(path.join(alternate,file),'');}fs.writeFileSync(path.join(alternate,'delivery-manifest.json'),JSON.stringify({sdk:'1.0'}));
 assert.deepEqual(suggest('<dt-','html',alternate).map(i=>i.label),['dt-button']);assert.deepEqual(suggest('<dt-button ','html',alternate).map(i=>i.label),['id','text']);
 let provider;const disposables=[],vscode={CompletionItem:class{constructor(label,kind){this.label=label;this.kind=kind;}},CompletionItemKind:{Class:1,Property:2,Value:3,Function:4,File:5,Module:6},SnippetString:class{constructor(value){this.value=value;}},Range:class{constructor(start,end){this.start=start;this.end=end;}},languages:{registerCompletionItemProvider(_selector,p){provider=p;return {dispose(){}};}}};
 support.register(vscode,{subscriptions:disposables},()=>({sdk:alternate}));const text='<dt-bu',doc={languageId:'html',getText:()=>text,offsetAt:p=>p.character,positionAt:n=>({line:0,character:n})},position={line:0,character:text.length};
 const items=provider.provideCompletionItems(doc,position,{});assert.equal(items[0].label,'dt-button');assert.equal(items[0].range.start.character,1);assert.ok(items[0].insertText.value.startsWith('dt-button'));assert.deepEqual(provider.provideCompletionItems(doc,position,{isCancellationRequested:true}),[]);
});

