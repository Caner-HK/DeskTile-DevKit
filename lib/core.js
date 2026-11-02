'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
class DevKitError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}
function sdkRoot(options = {}) {
  const root = path.resolve(options.sdk || process.env.DESKTILE_SDK || path.join(ROOT, 'sdk-bundle'));
  for (const name of ['sdk/include/desktile/sdk.h', 'tools/build_dtapp.py', 'examples/scaffold-js/manifest.json']) {
    if (!fs.existsSync(path.join(root, name))) throw new DevKitError('SDK_MISSING', `SDK 1.0 is incomplete: ${root}. Select a complete SDK with --sdk or DESKTILE_SDK.`);
  }
  if (!fs.existsSync(path.join(root, 'delivery-manifest.json'))) throw new DevKitError('SDK_MISSING', 'SDK delivery manifest is missing.');
  const manifest = read(path.join(root, 'delivery-manifest.json'));
  if (manifest.sdk !== '1.0') throw new DevKitError('SDK_VERSION', 'This DevKit requires SDK 1.0.');
  return root;
}
function run(exe, args, options = {}) {
  if(options.signal?.aborted)return Promise.reject(new DevKitError('CANCELLED','Operation cancelled.'));
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { cwd: options.cwd, shell: false, detached:process.platform!=='win32', windowsVerbatimArguments: options.windowsVerbatimArguments ?? false, windowsHide: options.windowsHide ?? true, env: { ...process.env, ...options.env, PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1' } });
    let output = '',cancelled=false,closed=false,startError,termination=Promise.resolve();
    const cancel=()=>{
      if(closed||cancelled)return;cancelled=true;
      if(!child.pid)return;
      if(process.platform==='win32')termination=new Promise(done=>{
        const stop=spawn(path.join(process.env.SystemRoot||'C:/Windows','System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
        stop.once('error',()=>{child.kill();done();});stop.once('close',code=>{if(code)child.kill();done();});
      });
      else {try{process.kill(-child.pid,'SIGTERM');}catch{child.kill();}}
    };
    options.signal?.addEventListener('abort',cancel,{once:true});
    if(options.signal?.aborted)cancel();
    for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { output = (output + b.toString()).slice(-200000); options.log?.(b.toString()); });
    child.once('error',e=>{startError=e;});
    child.once('close',async code=>{
      closed=true;options.signal?.removeEventListener('abort',cancel);await termination;
      if(cancelled)return reject(new DevKitError('CANCELLED','Operation cancelled.'));
      if(startError)return reject(new DevKitError('PROCESS_START',`${exe}: ${startError.message}`));
      code===0?resolve(output):reject(new DevKitError('PROCESS_FAILED',`${exe} exited ${code}\n${output}`));
    });
  });
}
function isCancellation(error){return error?.code==='CANCELLED'||error?.code==='ABORT_ERR'||error?.name==='AbortError';}
function project(directory) {
  const root = path.resolve(directory);
  const m = read(path.join(root, 'manifest.json'));
  if (!['javascript', 'native-module'].includes(m.runtime)) throw new DevKitError('RUNTIME', 'Supported project types: javascript and native-module.');
  if (!/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/.test(m.id || '')) throw new DevKitError('PACKAGE_ID', 'Invalid application id.');
  if (m.sdk?.target !== '1.0') throw new DevKitError('SDK_VERSION', 'Application SDK target must be 1.0.');
  if (fs.existsSync(path.join(root, 'desktile.json'))) {
    const config = read(path.join(root, 'desktile.json'));
    if (config.sdk !== '1.0' || config.target !== (m.runtime === 'javascript' ? 'portable' : 'esp32s3')) throw new DevKitError('PROJECT_TARGET', 'desktile.json SDK or target does not match this application.');
  }
  return { root, manifest: m };
}
async function doctor(options = {}) {
  const sdk = sdkRoot(options);
  const python = options.python || process.env.DESKTILE_PYTHON || 'python';
  const version = await run(python, ['--version'], options);
  const parts = /Python (\d+)\.(\d+)/.exec(version);
  if (!parts || +parts[1] < 3 || (+parts[1] === 3 && +parts[2] < 10)) throw new DevKitError('PYTHON_VERSION', 'Python 3.10 or newer is required.');
  let compilerInfo=null,compilerIssue=null;
  try{compilerInfo=await require('./toolchain').find(run,options,ROOT);}catch(e){if(options.signal?.aborted)throw e;compilerIssue=e.message;}
  const compilerVersion=compilerInfo?.version||null;
  let serial = false;
  try { await run(python, ['-c', 'import serial'], { ...options, log: undefined }); serial = true; } catch(e) { if (options.signal?.aborted) throw e; }
  const imageResources={png:false,svg:false};
  for(const [kind,imports] of [['png','from PIL import Image'],['svg','from PIL import Image; import cairosvg']]){
    try{await run(python,['-c',imports],{...options,log:undefined});imageResources[kind]=true;}catch(e){if(options.signal?.aborted)throw e;}
  }
  return { sdk, sdkVersion: read(path.join(sdk,'delivery-manifest.json')).sdk, toolVersion:require('../package.json').version, toolRevision:require('../package.json').desktileSdk.toolRevision, supportedSdks:require('../package.json').desktileSdk.supported, python: version.trim(), compiler: compilerVersion, compilerPath:compilerInfo?.path||null,compilerIssue,node:process.version,serial,imageResources,markupPreview:fs.existsSync(path.join(ROOT,'renderer','preview.exe')),interactivePreview:process.platform==='win32'&&fs.existsSync(path.join(ROOT,'renderer','interactive.exe')) };
}
async function create(destination, options = {}) {
  if (!options.id || !options.name) throw new DevKitError('ARGUMENT', 'Specify --id and --name.');
  if (!['javascript', 'native'].includes(options.kind || 'javascript')) throw new DevKitError('ARGUMENT', 'Use --kind javascript or native.');
  if (!/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/.test(options.id) || options.id.length > 96) throw new DevKitError('PACKAGE_ID', 'Use a reverse-domain application id.');
  if (!options.name.trim() || Buffer.byteLength(options.name) > 63 || /[\x00-\x1f\x7f]/.test(options.name)) throw new DevKitError('APP_NAME', 'Application name must be 1–63 UTF-8 bytes.');
  if (!options.author || Buffer.byteLength(options.author)>63 || /[\x00-\x1f\x7f]/.test(options.author)) throw new DevKitError('AUTHOR', 'Specify --author (1–63 UTF-8 bytes).');
  const sdk = sdkRoot(options), target = path.resolve(destination);
  if (fs.existsSync(target)) throw new DevKitError('EXISTS', `Destination already exists: ${target}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = fs.mkdtempSync(path.join(path.dirname(target), '.desktile-new-'));
  try {
    fs.cpSync(path.join(sdk, 'examples', options.kind === 'native' ? 'scaffold-native' : 'scaffold-js'), temp, { recursive: true });
    const m = read(path.join(temp, 'manifest.json'));
    m.id = options.id; m.name = { 'zh-CN': options.name, 'zh-HK': options.name, en: options.name }; m.version = '1.0.0'; m.version_code = 1;
    m.metadata = { author: options.author };
    fs.writeFileSync(path.join(temp, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
    for (const f of fs.readdirSync(path.join(temp, 'locales'))) {
      if (!f.endsWith('.json')) continue;
      const p = path.join(temp, 'locales', f), locale = read(p); if (!Object.hasOwn(locale,'title')) continue; locale.title = options.name;
      fs.writeFileSync(p, JSON.stringify(locale, null, 2) + '\n');
    }
    fs.mkdirSync(path.join(temp, '.desktile'), { recursive: true });
    fs.cpSync(path.join(sdk, 'sdk/javascript'), path.join(temp, '.desktile/types'), { recursive: true });
    fs.writeFileSync(path.join(temp, 'jsconfig.json'), JSON.stringify({ compilerOptions: { checkJs: true, strict: false, target: 'ES2020', lib: ['ES2020'] }, include: ['src/**/*.js', '.desktile/types/**/*.d.ts'] }, null, 2));
    if (options.kind !== 'native') {
      const main=path.join(temp,'src/main.js');
      const content=fs.readFileSync(main,'utf8').replace('var ui = DeskTile.require("ui/components.js");','var ui = /** @type {typeof import("../.desktile/types/components")} */ (DeskTile.require("ui/components.js"));');
      fs.writeFileSync(main,content);
    }
    if (options.kind === 'native') {
      fs.mkdirSync(path.join(temp, '.vscode'), { recursive: true });
      fs.writeFileSync(path.join(temp, '.vscode', 'c_cpp_properties.json'), JSON.stringify({ configurations: [{ name: 'DeskTile ESP32-S3', includePath: ['${workspaceFolder}/src', path.join(sdk, 'sdk/include')], cppStandard: 'c++17', compilerPath: options.compiler || process.env.DESKTILE_COMPILER || '' }], version: 4 }, null, 2));
    }
    fs.writeFileSync(path.join(temp, 'desktile.json'), JSON.stringify({ sdk: '1.0', target: options.kind === 'native' ? 'esp32s3' : 'portable' }, null, 2));
    fs.writeFileSync(path.join(temp, '.gitignore'), '.desktile/\ndist/\n');
    fs.renameSync(temp, target);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  return { project: target, sdk: '1.0', id: options.id };
}
function copyProject(source, target, excluded) {
  fs.cpSync(source, target, { recursive: true, filter: p => {
    const rel = path.relative(source, p), parts = rel.split(path.sep);
    if (p === excluded) return false;
      if (parts[0] === 'icon-design' || parts.some(x => ['.git', '.vscode', '.desktile', 'dist', 'node_modules'].includes(x))) return false;
    if (['desktile.json', 'jsconfig.json', '.gitignore'].includes(rel)) return false;
    if (fs.lstatSync(p).isSymbolicLink()) throw new DevKitError('SYMLINK', `Symbolic link in application: ${rel}`);
    return true;
  } });
}
async function build(directory, options = {}) {
  const p = project(directory), sdk = sdkRoot(options);
  const out = path.resolve(options.output || path.join(p.root, 'dist', p.manifest.id + '.dtapp'));
  if (options.signingKey && isWithin(p.root, path.resolve(options.signingKey))) throw new DevKitError('SIGNING_KEY_LOCATION', 'Keep the signing key outside the application directory.');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'desktile-build-'));
  try {
    const source = path.join(temp, 'source'); copyProject(p.root, source, out);
    const native = p.manifest.runtime === 'native-module';
    const args = [path.join(sdk, 'tools', native ? 'build_native_app.py' : 'build_dtapp.py'), source, path.join(temp, 'application.dtapp')];
    if (options.signingKey) args.push('--signing-key', path.resolve(options.signingKey)); else args.push('--development');
    if(native){const compiler=await require('./toolchain').find(run,options,ROOT);args.push('--compiler',compiler.path);}
    await run(options.python || process.env.DESKTILE_PYTHON || 'python', args, options);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const staged = out + '.' + crypto.randomUUID() + '.tmp';
    try { fs.copyFileSync(path.join(temp, 'application.dtapp'), staged); fs.renameSync(staged, out); }
    finally { fs.rmSync(staged, { force: true }); }
    const data = fs.readFileSync(out);
    return { package: out, bytes: data.length, sdk: '1.0', signing: options.signingKey ? 'signed' : 'development', sha256: crypto.createHash('sha256').update(data).digest('hex') };
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
function inspect(filename) {
  const b = fs.readFileSync(filename);
  const fail = msg => { throw new DevKitError('PACKAGE_INVALID', msg); };
  if (b.length < 32 || b.length > 64 * 1024 * 1024 || b.subarray(0,8).toString() !== 'DTAPP001' || b.readUInt16LE(8) !== 1) fail('Invalid package header');
  const flags=b.readUInt16LE(10), count=b.readUInt16LE(12), table=b.readUInt32LE(16), payload=b.readUInt32LE(20), signature=b.readUInt32LE(24), start=32+table;
  if (count<1 || count>512 || b.readUInt16LE(14) || b.readUInt32LE(28) || ![0,1].includes(flags) || signature!==(flags?64:0) || start+payload+signature!==b.length) fail('Invalid package bounds');
  let cursor=32, previousEnd=0; const entries=new Map();
  for(let i=0;i<count;i++) {
    if(cursor+48>start) fail('Truncated entry');
    const n=b.readUInt16LE(cursor), offset=b.readUInt32LE(cursor+4), stored=b.readUInt32LE(cursor+8), original=b.readUInt32LE(cursor+12), digest=b.subarray(cursor+16,cursor+48);
    if(b[cursor+2] || b[cursor+3] || stored!==original || offset!==previousEnd || offset+stored>payload || cursor+48+n>start) fail('Invalid entry bounds');
    const name=b.subarray(cursor+48,cursor+48+n).toString('utf8');
    if(!name || /[\\\x00-\x1f]/.test(name) || name.split('/').some(x=>!x||x==='.'||x==='..') || name.includes(':') || entries.has(name)) fail('Invalid entry path');
    const data=b.subarray(start+offset,start+offset+stored);
    if(!crypto.createHash('sha256').update(data).digest().equals(digest)) fail(`Integrity mismatch: ${name}`);
    entries.set(name,data);previousEnd=offset+stored;cursor+=48+n;
  }
  if(cursor!==start || previousEnd!==payload || !entries.has('manifest.json')) fail('Invalid package table');
  let manifest;try{manifest=JSON.parse(entries.get('manifest.json').toString('utf8'));}catch{fail('Invalid manifest');}
  if (!/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/.test(manifest.id || '') || manifest.sdk?.target !== '1.0' || !['javascript','native-module'].includes(manifest.runtime)) fail('Invalid application identity or SDK target');
  for(const name of Object.values(manifest.entry||{})) if(!entries.has(name)) fail(`Missing entry: ${name}`);
  for(const icon of Object.values(manifest.icons||{})) { const name=typeof icon==='string'?icon:icon.path; if(name&&!entries.has(name)) fail(`Missing icon: ${name}`); }
  return { package:path.resolve(filename),manifest,files:[...entries.keys()],bytes:b.length,integrity:'verified',signature:flags?'present; trust verification is performed by the device':'unsigned development' };
}
async function deploy(filename, volume, options={}) {
  const result=inspect(filename), root=path.resolve(volume);
  if(!fs.existsSync(path.join(root,'desktile'))) throw new DevKitError('SD_LAYOUT','Select an SD root containing the desktile directory.');
  const directory=path.join(root,'desktile/user/Packages');fs.mkdirSync(directory,{recursive:true});
  const actualRoot=fs.realpathSync(root),actualDirectory=fs.realpathSync(directory);
  if(!isWithin(actualRoot,actualDirectory))throw new DevKitError('SD_LAYOUT','Installer directory points outside the selected SD root.');
  const name=result.manifest.id;
  if(!/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/.test(name)) throw new DevKitError('PACKAGE_ID','Invalid application id.');
  const target=path.join(directory,name+'.dtapp');
  if(fs.existsSync(target)&&!options.replace) throw new DevKitError('EXISTS','Package already exists. Use --replace to replace this installer.');
  const temp=target+'.'+crypto.randomUUID()+'.tmp';
  try { fs.copyFileSync(filename,temp);inspect(temp);fs.renameSync(temp,target); } finally { fs.rmSync(temp,{force:true}); }
  return { destination:target,next:'Open Settings > Apps > Install apps on the device to install this package.' };
}
async function preview(directory, options={}) {
  const p=project(directory), renderer=path.join(ROOT,'renderer','preview.exe');
  if(p.manifest.runtime==='native-module'&&!options.page)throw new DevKitError('PREVIEW_PAGE','Native applications need an explicit HTML sample for markup preview. Verify Native-generated UI on the device.');
  if(process.platform!=='win32'||!fs.existsSync(renderer))throw new DevKitError('PREVIEW_PLATFORM','Markup preview requires the Windows x64 DevKit renderer.');
  const page=path.resolve(p.root,options.page||p.manifest.entry.ui||p.manifest.entry.document||'src/index.html');
  if(!isWithin(p.root,page))throw new DevKitError('PREVIEW_PATH','Select a markup file inside the application.');
  const output=path.resolve(options.output||path.join(p.root,'.desktile/preview'));
  fs.mkdirSync(output,{recursive:true});
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'desktile-preview-'));
  try {
    await run(renderer,[page,p.root,path.join(ROOT,'renderer/ui-fonts.pack'),temp],options);
    const {rgb565ToPng}=require('./png');
    for(const theme of ['light','dark']) fs.writeFileSync(path.join(output,theme+'.png'),rgb565ToPng(fs.readFileSync(path.join(temp,theme+'.rgb565')),800,480));
    return { light:path.join(output,'light.png'),dark:path.join(output,'dark.png'),kind:'Native markup rendering; JavaScript and device services execute on the device.' };
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
}
async function interactivePreview(directory,options={}) {
  if(options.page||options.output)throw new DevKitError('PREVIEW_OPTIONS','Use desktile screenshot for --page or --output. Interactive preview runs the application entry point.');
  const p=project(directory),renderer=path.join(ROOT,'renderer/interactive.exe');
  if(process.platform!=='win32'||!fs.existsSync(renderer))throw new DevKitError('PREVIEW_HOST','Install the Windows x64 DevKit with the interactive preview host.');
  const locale=options.locale||'auto',theme=options.theme||'auto';
  if(!['auto','zh-CN','zh-HK','en-US'].includes(locale))throw new DevKitError('PREVIEW_LOCALE','Choose zh-CN, zh-HK or en-US.');
  if(!['auto','light','dark'].includes(theme))throw new DevKitError('PREVIEW_THEME','Choose light or dark.');
  if(p.manifest.runtime==='native-module') {
    options.log?.('Building Native application for local preview.\n');
    await require('./native-preview').buildNativePreview(p.root,sdkRoot(options),run,options);
  }
  options.log?.('Starting local interactive application. Close its window to end the session.\n');
  const environment={...options.env};if(options.uiTheme)environment.DESKTILE_PREVIEW_UI_THEME=options.uiTheme;if(options.uiLanguage)environment.DESKTILE_PREVIEW_UI_LANGUAGE=options.uiLanguage;
  await run(renderer,[p.root,path.join(ROOT,'renderer/ui-fonts.pack'),locale,theme],{...options,env:environment,windowsHide:false});
  return {project:p.root,kind:'interactive',storage:path.join(p.root,'.desktile/preview-data')};
}
module.exports={ROOT,DevKitError,sdkRoot,doctor,create,build,inspect,deploy,preview,interactivePreview,run,project,isWithin,isCancellation};
