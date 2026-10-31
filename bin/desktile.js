#!/usr/bin/env node
'use strict';
const core=require('../lib/core');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const metadata=require('../package.json');
const VERSION=`DeskTile DevKit ${metadata.version} (SDK ${metadata.desktileSdk.default}, Tools ${metadata.desktileSdk.toolRevision})`;
const HELP=`${VERSION}
  desktile doctor [--sdk directory] [--python executable]
  desktile new directory --id com.example.app --name "My app" --author "Author" [--kind javascript|native]
  desktile build [directory] [--output file.dtapp] [--compiler executable] [--signing-key file]
  desktile check file.dtapp
  desktile preview [directory] [--locale zh-HK|zh-CN|en-US] [--theme light|dark]
  desktile screenshot [directory] [--page src/index.html] [--output directory]
  desktile icon [directory] --source image.png --purpose application|tile|notification --mode system|custom [--padding 8] [--apply]
  desktile image [directory] --source picture.png --output assets/picture.dti [--width 320] [--height 240] [--mode custom|system] [--replace]
  desktile deploy file.dtapp --sd directory [--replace]
  desktile docs [--port 8800]
  desktile devices
  desktile monitor --port COM4 [--log-file serial.log]
  desktile run [directory] --port COM4
  desktile install file.dtapp --port COM4
  desktile profile --port COM4 [--seconds 60]
  desktile push local-file /Downloads/remote-file --host device-ip [--port 2121] [--user desktile]
  desktile pull /Downloads/remote-file local-file --host device-ip [--port 2121] [--user desktile]
  Add --json for machine-readable results. SDK selection: --sdk or DESKTILE_SDK.
`;
async function main(argv){
 const command=argv.shift(),o={},pos=[];
 const values=new Set(['sdk','python','id','name','author','kind','output','compiler','signing-key','sd','port','seconds','page','log-file','locale','theme','source','purpose','mode','padding','width','height','host','user']);
 for(let i=0;i<argv.length;i++){const a=argv[i];if(!a.startsWith('--')){pos.push(a);continue;}const k=a.slice(2);if(['json','replace','apply'].includes(k))o[k]=true;else if(values.has(k)&&argv[i+1]&&!argv[i+1].startsWith('--'))o[k.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=argv[++i];else throw new core.DevKitError('ARGUMENT',`Unknown or incomplete option: ${a}`);}
 o.log=s=>process.stderr.write(s);const controller=new AbortController();o.signal=controller.signal;process.once('SIGINT',()=>controller.abort());
 let result;
 if(command==='--version'){process.stdout.write(VERSION+'\n');return;}
 if(!command||['help','--help'].includes(command)){process.stdout.write(HELP);return;}
 if(pos.length>(['push','pull'].includes(command)?2:1))throw new core.DevKitError('ARGUMENT','Unexpected positional argument.');
 if(['push','pull'].includes(command))result=await require('../lib/file-transfer').transfer(command,pos[0],pos[1],o);
 else if(command==='doctor')result=await core.doctor(o);
 else if(command==='new'&&pos[0])result=await core.create(pos[0],o);
 else if(command==='build')result=await core.build(pos[0]||'.',o);
 else if(command==='preview')result=await core.interactivePreview(pos[0]||'.',o);
 else if(command==='screenshot')result=await core.preview(pos[0]||'.',o);
 else if(command==='icon'){if(!o.source)throw new core.DevKitError('ARGUMENT','Specify --source image.png or image.svg.');const assets=require('../lib/assets');result=await assets.prepare(pos[0]||'.',o.source,{...o,padding:o.padding===undefined?8:Number(o.padding)});if(o.apply)result=assets.apply(result);}
 else if(command==='devices')result=await require('../lib/device').devices(o);
 else if(command==='image'){if(!o.source)throw new core.DevKitError('ARGUMENT','Specify --source image.png.');result=await require('../lib/assets').convertImage(pos[0]||'.',o.source,o);}
 else if(command==='monitor')result=await require('../lib/device').monitor(o);
 else if(command==='run')result=await require('../lib/device').launch(pos[0]||'.',o);
 else if(command==='install'&&pos[0])result=await require('../lib/device').install(pos[0],o);
 else if(command==='profile')result=await require('../lib/device').profile(o);
 else if(command==='check'&&pos[0])result=core.inspect(pos[0]);
 else if(command==='deploy'&&pos[0]&&o.sd)result=await core.deploy(pos[0],o.sd,o);
 else if(command==='docs'){
  const root=path.join(core.ROOT,'site'),port=Number(o.port||8800);
  if(!Number.isInteger(port)||port<1024||port>65535)throw new core.DevKitError('PORT','Port must be 1024–65535.');
  if(!fs.existsSync(path.join(root,'index.html')))throw new core.DevKitError('DOCS_MISSING','Install the DevKit documentation bundle.');
  const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).on('error',()=>res.destroy()).pipe(res);}catch{res.writeHead(404).end('Not found');}});
  server.on('error',e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});server.listen(port,'127.0.0.1',()=>process.stdout.write(`http://127.0.0.1:${port}/\n`));controller.signal.addEventListener('abort',()=>server.close());return;
 }else throw new core.DevKitError('ARGUMENT',HELP);
 process.stdout.write(JSON.stringify({ok:true,result},null,o.json?0:2)+'\n');
}
main(process.argv.slice(2)).catch(e=>{process.stderr.write(JSON.stringify({ok:false,error:{code:e.code||'FAILED',message:e.message}})+'\n');process.exitCode=e.code==='CANCELLED'?130:1;});
