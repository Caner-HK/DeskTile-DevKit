"""Assemble installable DevKit artifacts from a tested SDK and documentation build."""
from pathlib import Path
import argparse,hashlib,json,shutil,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--vsce',required=True,help='Official @vscode/vsce JavaScript entry')
    parser.add_argument('--npm-cli',default=str(Path(shutil.which('node')).parent/'node_modules/npm/bin/npm-cli.js'),help='npm-cli.js path')
    args=parser.parse_args()
    for name in ('site/index.html','renderer/preview.exe','renderer/interactive.exe','renderer/ui-fonts.pack','renderer/font-inventory.json','sdk-bundle/delivery-manifest.json','LICENSE','NOTICE','THIRD-PARTY-NOTICES.md','licenses/dependencies.json'):
        if not (ROOT/name).is_file():raise SystemExit('Missing distribution input: '+name)
    dist=ROOT/'dist';dist.mkdir(exist_ok=True)
    package=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))
    version=package['version']
    sdk=json.loads((ROOT/'sdk-bundle/delivery-manifest.json').read_text(encoding='utf-8'))['sdk']
    if sdk not in package['desktileSdk']['supported']:raise SystemExit('Bundled SDK is not supported by this tool release')
    portable=dist/f'DeskTile-DevKit-{version}-windows-x64'
    if portable.resolve().parent!=dist.resolve():raise SystemExit('Invalid output path')
    if portable.exists():shutil.rmtree(portable)
    portable.mkdir()
    for name in package['files']+['package.json']:
        source=ROOT/name;dest=portable/name
        if source.is_dir():shutil.copytree(source,dest)
        else:shutil.copyfile(source,dest)
    shutil.copytree(ROOT/'docs',portable/'documentation',ignore=shutil.ignore_patterns('node_modules','.temp','.cache','dist'))
    # Documentation sources live under documentation in the portable product.
    doc=portable/'documentation/package.json';config=json.loads(doc.read_text(encoding='utf-8'))
    config['scripts']['build']='vuepress build . --dest ../site'
    doc.write_text(json.dumps(config,indent=2),encoding='utf-8')
    report={'product':'DeskTile DevKit','version':version,'toolRevision':package['desktileSdk']['toolRevision'],'sdk':sdk,'supportedSdks':package['desktileSdk']['supported'],'platform':'windows-x64','releaseStatus':'release','publicReleasePending':[],'excludedFonts':['GDS Transport','Myriad Pro','DFLiSongHK'],'files':[]}
    for f in sorted(portable.rglob('*')):
        if f.is_file():report['files'].append({'path':f.relative_to(portable).as_posix(),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
    (portable/'delivery-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    vsix=dist/f'desktile-devkit-{version}-win32-x64.vsix'
    subprocess.run(['node',args.vsce,'package','--no-dependencies','--allow-missing-repository','--target','win32-x64','--out',str(vsix)],cwd=ROOT,check=True)
    with zipfile.ZipFile(vsix) as z:
        for name in ('lib/assets.js','lib/native-preview.js','lib/core.js','lib/workflow-panel.js','lib/toolchain.js','sdk-bundle/tools/icon_asset.py','renderer/interactive.exe','site/tools/index.html','site/tools/assets.html','site/tools/serial.html'):
            if z.read('extension/'+name)!=(ROOT/name).read_bytes():raise SystemExit('Stale VSIX entry: '+name)
    subprocess.run(['node',args.npm_cli,'pack','--pack-destination',str(dist),'--json'],cwd=ROOT,check=True)
    archive=dist/(portable.name+'.zip')
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for f in sorted(portable.rglob('*')):
            if f.is_file():z.write(f,portable.name+'/'+f.relative_to(portable).as_posix())
    artifacts=[]
    for f in (vsix,dist/f'desktile-devkit-{version}.tgz',archive):
        artifacts.append({'file':f.name,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
    (dist/'artifacts.json').write_text(json.dumps({'version':version,'toolRevision':package['desktileSdk']['toolRevision'],'sdk':sdk,'supportedSdks':package['desktileSdk']['supported'],'releaseStatus':report['releaseStatus'],'publicReleasePending':report['publicReleasePending'],'artifacts':artifacts},indent=2),encoding='utf-8')
    print(json.dumps(artifacts,indent=2))

if __name__=='__main__':main()
