'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const core=require('../lib/core'),editor=require('../lib/asset-panel');
test('icon panel handles per-size editing, preview, save, reopen and package build',{skip:!process.env.DESKTILE_BROWSER_TESTS},async()=>{
 const {chromium}=require('playwright');
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-panel-ui-')),root=path.join(base,'app');let browser,dispose;
 try{
  await core.create(root,{id:'com.example.icons',name:'My application',author:'Test'});
  const source=path.join(base,'red.svg');fs.writeFileSync(source,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#ff0000" d="M0 0h100v100H0z"/></svg>');
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1200,height:920}});let html,receive;
  const panel={webview:{set html(v){html=v;},postMessage:state=>page.evaluate(s=>window.dispatchEvent(new MessageEvent('message',{data:s})),state),onDidReceiveMessage:fn=>{receive=fn;}},onDidDispose:fn=>{dispose=fn;},reveal(){}};
  const mock={ViewColumn:{Active:1},window:{createWebviewPanel:()=>panel,showOpenDialog:async()=>[{fsPath:source}]}};
  editor.open(mock,{subscriptions:[]},root,()=>({}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.exposeFunction('hostMessage',m=>receive(m));await page.evaluate(()=>{window.acquireVsCodeApi=()=>({postMessage:m=>window.hostMessage(m)});});await page.setContent(html);
  await page.getByRole('status').filter({hasText:'Saved to project'}).waitFor();
  await page.getByRole('button',{name:'Small tile (1 × 1)',exact:true}).click();await page.getByRole('button',{name:'Choose image…'}).click();await page.getByRole('status').filter({hasText:'Unsaved changes'}).waitFor();
  await page.getByLabel('Colours',{exact:true}).selectOption('custom');await page.getByRole('status').filter({hasText:'Unsaved changes'}).waitFor();
  await page.getByLabel('Space around image (%)').fill('12');await page.getByLabel('Space around image (%)').press('Tab');await page.getByRole('status').filter({hasText:'Unsaved changes'}).waitFor();
  assert.equal(await page.locator('.small img').getAttribute('class'),'custom');assert.notEqual(await page.locator('.small img').getAttribute('src'),await page.locator('.medium img').getAttribute('src'));
  const small=await page.locator('.small').boundingBox(),large=await page.locator('.large').boundingBox();assert.equal(small.width,80);assert.equal(large.width,344);
  const out=path.resolve(__dirname,'../build/asset-panel-evidence');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'panel.png'),fullPage:true});
  await page.getByLabel('Preview theme').selectOption('dark');assert.ok((await page.locator('#desktop').getAttribute('class')).includes('dark'));await page.screenshot({path:path.join(out,'panel-dark.png'),fullPage:true});
  await page.getByRole('button',{name:'Save to project',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved. Build application'}).waitFor();
  const state=require('../lib/assets').editor(root);assert.equal(state.items['tile-1x1'].mode,'custom');assert.equal(state.items['tile-1x1'].padding,12);
  const built=await core.build(root);assert.equal(core.inspect(built.package).manifest.icons.tile_variants,true);assert.deepEqual(errors,[]);
 }finally{dispose?.();await browser?.close();fs.rmSync(base,{recursive:true,force:true});}
});
