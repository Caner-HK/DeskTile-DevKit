'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const NAME='xtensa-esp32s3-elf-g++',GUIDE='https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/get-started/windows-setup.html';
function executable(value,env=process.env){
 if(!value||typeof value!=='string'||/[\r\n\0]/.test(value))return null;
 const suffixes=process.platform==='win32'?['','.exe']:[''];
 const paths=path.isAbsolute(value)||value.includes('/')||value.includes('\\')?[value]:String(env.PATH||env.Path||'').split(path.delimiter).filter(Boolean).map(p=>path.join(p,value));
 for(const p of paths)for(const suffix of suffixes){try{if(fs.statSync(p+suffix).isFile())return path.resolve(p+suffix);}catch{}}
 return null;
}
function scan(root,results,depth=0,budget={left:1500}){
 if(depth>5||budget.left--<=0)return;
 let entries;try{entries=fs.readdirSync(root,{withFileTypes:true});}catch{return;}
 for(const entry of entries){
  const full=path.join(root,entry.name);
  if(entry.isFile()&&entry.name.toLowerCase().replace(/\.exe$/,'')===NAME)results.add(full);
 }
 // Restrict traversal to directories and skip symlinks and dependency/cache trees.
 for(const entry of entries.filter(e=>e.isDirectory()&&!e.isSymbolicLink()&&!['node_modules','.git','python_env','dist','build'].includes(e.name)).sort((a,b)=>b.name.localeCompare(a.name,undefined,{numeric:true}))){
  scan(path.join(root,entry.name),results,depth+1,budget);
 }
}
function discover(options={},base=path.resolve(__dirname,'..'),env=process.env){
 const explicit=options.compiler||env.DESKTILE_COMPILER;
 if(explicit)return {explicit:true,candidates:[executable(explicit,env)||explicit]};
 const found=new Set(),fromPath=executable(NAME,env);if(fromPath&&!options.toolchainRootsOnly)found.add(fromPath);
 const home=env.USERPROFILE||env.HOME||os.homedir();
 const roots=(options.toolchainRootsOnly?options.toolchainRoots||[]:[env.IDF_TOOLS_PATH,path.join(home,'.espressif','tools'),env.IDF_PATH&&path.join(env.IDF_PATH,'..','tools'),process.platform==='win32'&&path.join(env.SystemDrive||'C:','Espressif','tools'),path.join(base,'..','.tools','idf-tools','tools'),...(options.toolchainRoots||[])]).filter(Boolean);
 const budget={left:1500};for(const root of new Set(roots.map(p=>path.resolve(p))))scan(root,found,0,budget);
 return {explicit:false,candidates:[...found]};
}
async function validate(file,run,options={}){
 const resolved=executable(file);
 if(!resolved)throw Object.assign(new Error('The selected ESP32-S3 compiler file does not exist.'),{code:'COMPILER_INVALID'});
 if(path.basename(resolved).toLowerCase().replace(/\.exe$/,'')!==NAME)throw Object.assign(new Error('Select xtensa-esp32s3-elf-g++ from the toolchain bin directory.'),{code:'COMPILER_INVALID'});
 const strip=path.join(path.dirname(resolved),path.basename(resolved).replace('g++','strip'));if(!fs.existsSync(strip))throw Object.assign(new Error('The toolchain is incomplete: its matching strip executable is missing.'),{code:'COMPILER_INVALID'});
 const probe={...options,log:undefined};
 let version,target;
 try{version=(await run(resolved,['--version'],probe)).trim().split(/\r?\n/)[0];target=(await run(resolved,['-dumpmachine'],probe)).trim();}
 catch(e){if(options.signal?.aborted)throw e;throw Object.assign(new Error('The selected ESP32-S3 compiler could not run.\n'+e.message),{code:'COMPILER_INVALID'});}
 if(!target.startsWith('xtensa-'))throw Object.assign(new Error('This compiler does not target Xtensa.'),{code:'COMPILER_INVALID'});
 return {path:resolved,version,target};
}
async function find(run,options={},base){
 const discovered=discover(options,base);let problem;
 for(const candidate of discovered.candidates){
  try{return await validate(candidate,run,options);}catch(e){if(options.signal?.aborted)throw e;problem=e;if(discovered.explicit)throw e;}
 }
 throw Object.assign(new Error(problem?'Installed ESP32-S3 toolchains could not run. Select a working compiler in Check environment.':'ESP32-S3 toolchain was not found. Open Check environment to find an installation, select a compiler or install the Espressif tools.'),{code:'COMPILER_MISSING'});
}
module.exports={NAME,GUIDE,executable,discover,validate,find};
