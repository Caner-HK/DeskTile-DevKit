'use strict';
// Executed by the VS Code extension test host, not by node --test.
async function run(){
 const vscode=require('vscode'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const ext=vscode.extensions.getExtension('caner.desktile-devkit');assert.ok(ext,'Extension is discoverable');await ext.activate();assert.ok(ext.isActive);
 const commands=await vscode.commands.getCommands(true);
 for(const id of ['create','doctor','build','check','deploy','docs','sdk','preview','screenshot','assets','monitor','run'])assert.ok(commands.includes('desktile.'+id),id);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'devkit-extension-'));
 try{
  const manifest=path.join(root,'manifest.json');fs.writeFileSync(manifest,JSON.stringify({sdk:{target:'9.0'},runtime:'wrong'}));
  const doc=await vscode.workspace.openTextDocument(manifest);await vscode.window.showTextDocument(doc);
  await new Promise(resolve=>setTimeout(resolve,500));
  const issues=vscode.languages.getDiagnostics(doc.uri);assert.ok(issues.some(d=>d.message.includes('1.0')));assert.ok(issues.some(d=>d.message.includes('runtime')||d.message.includes('native-module')));
  const html=await vscode.workspace.openTextDocument({language:'html',content:'<'});await vscode.window.showTextDocument(html);
  const completions=await vscode.commands.executeCommand('vscode.executeCompletionItemProvider',html.uri,new vscode.Position(0,1),'<');
  assert.ok(completions.items.some(i=>i.label==='dt-button'));
  for(const label of ['dt-scroll','dt-canvas'])assert.ok(completions.items.some(i=>i.label===label));
  for(const label of ['dt-scroll-view','dt-canvas-view'])assert.ok(!completions.items.some(i=>i.label===label));
  console.log('Extension host: activation, 12 commands, diagnostics and component completion passed.');
 }finally{await vscode.commands.executeCommand('workbench.action.closeAllEditors');fs.rmSync(root,{recursive:true,force:true});}
}
module.exports={run};
