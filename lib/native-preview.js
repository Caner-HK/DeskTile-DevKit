'use strict';
const fs=require('node:fs'),path=require('node:path');

// Build a host module from the application's sources; device ELF files stay separate.
async function buildNativePreview(root,sdk,run,options={}) {
  const locator=path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft Visual Studio/Installer/vswhere.exe');
  if(!fs.existsSync(locator))throw new Error('Native preview requires Visual Studio Build Tools with Desktop development with C++.');
  const installation=(await run(locator,['-latest','-products','*','-requires','Microsoft.VisualStudio.Component.VC.Tools.x86.x64','-property','installationPath'],{...options,log:undefined})).trim();
  if(!installation)throw new Error('Install the Desktop development with C++ workload in Visual Studio Build Tools to preview Native applications.');
  const setup=path.join(installation,'Common7/Tools/VsDevCmd.bat');
  if(/["%\r\n&|<>^]/.test(setup))throw new Error('Unsupported Visual Studio installation path.');
  const environment=await run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`"call "${setup}" -arch=x64 -host_arch=x64 >nul && set"`],{...options,log:undefined,windowsVerbatimArguments:true});
  const env={VSLANG:'1033'};for(const line of environment.split(/\r?\n/)){const equals=line.indexOf('=');if(equals>0)env[line.slice(0,equals)]=line.slice(equals+1);}
  const output=path.join(root,'.desktile/preview-native');fs.mkdirSync(output,{recursive:true});
  const sources=[],sourceRoot=fs.mkdtempSync(path.join(output,'source-'));
  try {
  function stage(directory,relative='') {
    for(const item of fs.readdirSync(directory,{withFileTypes:true})) {
      if(item.isSymbolicLink())throw new Error('Native preview source directories must contain regular files.');
      const rel=path.join(relative,item.name),source=path.join(directory,item.name),target=path.join(sourceRoot,rel);
      if(item.isDirectory()){stage(source,rel);continue;}
      fs.mkdirSync(path.dirname(target),{recursive:true});
      if(/\.(c|cpp|h|hpp)$/.test(item.name)) {
        // Translate only the entry export spelling used by the device templates.
        const text=fs.readFileSync(source,'utf8').replace(/__attribute__\s*\(\(\s*visibility\s*\(\s*"default"\s*\)\s*\)\)/g,'__declspec(dllexport)');
        fs.writeFileSync(target,text);
      }else fs.copyFileSync(source,target);
      if(/\.(c|cpp)$/.test(item.name))sources.push(target);
    }
  }
  stage(path.join(root,'src'));
  if(!sources.length)throw new Error('Native preview requires C or C++ source files in src.');
  const quote=value=>'"'+value.replace(/"/g,'')+'"';
  const dll=path.join(output,'app.dll'),candidate=path.join(output,'app-next.dll');
  const args=['/nologo','/utf-8','/std:c++17','/EHsc','/O2','/MT','/LD','/D_CRT_SECURE_NO_WARNINGS','/I'+quote(path.join(sdk,'sdk/include')),'/I'+quote(sourceRoot)];
  // Compile separately so equal filenames in different directories keep distinct objects.
  const objects=[];
  for(let i=0;i<sources.length;i++) {
    const object=path.join(output,`source-${i}.obj`),response=path.join(output,`source-${i}.rsp`);
    fs.writeFileSync(response,'\uFEFF'+[...args,'/c',quote(sources[i]),'/Fo'+quote(object)].join('\r\n'),'utf16le');
    await run('cl.exe',['@'+response],{...options,cwd:output,env});objects.push(object);
  }
  const response=path.join(output,'link.rsp');
  fs.writeFileSync(response,'\uFEFF'+['/nologo','/DLL','/EXPORT:dt_app_entry','/OUT:'+quote(candidate),...objects.map(quote)].join('\r\n'),'utf16le');
  await run('link.exe',['@'+response],{...options,cwd:output,env});
  fs.renameSync(candidate,dll);
  return dll;
  } finally {fs.rmSync(sourceRoot,{recursive:true,force:true});}
}
module.exports={buildNativePreview};
