"""Stage SDK 1.0 source dependencies into the DevKit distribution."""
from pathlib import Path
import hashlib,json,shutil,re,struct,subprocess,sys,zipfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parent
DEST=ROOT/'sdk-bundle'

def copy(source,target):
    target.parent.mkdir(parents=True,exist_ok=True)
    if source.is_dir():shutil.copytree(source,target,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
    else:shutil.copyfile(source,target)

def main():
    if DEST.resolve().parent!=ROOT.resolve() or DEST.name!='sdk-bundle':raise SystemExit('Invalid staging directory')
    if DEST.exists():shutil.rmtree(DEST)
    copy(REPO/'tools/sdk-scaffold',DEST/'examples/scaffold-js')
    copy(REPO/'samples/native-scaffold',DEST/'examples/scaffold-native')
    copy(REPO/'sdk',DEST/'sdk')
    copy(ROOT/'LICENSE',DEST/'LICENSE')
    copy(ROOT/'NOTICE',DEST/'NOTICE')
    copy(ROOT/'tools/icon_asset.py',DEST/'tools/icon_asset.py')
    copy(ROOT/'tools/image_asset.py',DEST/'tools/image_asset.py')
    for name in ['build_dtapp.py','build_native_app.py','locale_catalog.py','tile_icon_resources.py','notification_icon.py','build_dti.py']:
        copy(REPO/'tools'/name,DEST/'tools'/name)
    for p in (REPO/'sdk/javascript').glob('*.js'):
        copy(p,DEST/'examples/scaffold-js/ui'/p.name)
    copy(REPO/'assets/ui-icons/source',DEST/'resources/icons/source')
    copy(REPO/'assets/ui-icons/LICENSE',DEST/'resources/icons/LICENSE')
    copy(REPO/'assets/ui-icons/LICENSE-MATERIAL-SYMBOLS',DEST/'resources/icons/LICENSE-MATERIAL-SYMBOLS')
    copy(REPO/'assets/ui-icons/MATERIAL-SYMBOLS.md',DEST/'resources/icons/MATERIAL-SYMBOLS.md')
    icons=(REPO/'src/graphics/UiIcons.h').read_text(encoding='utf-8')
    names=[v.strip() for v in re.search(r'enum class Id : uint8_t \{ (.*?) \};',icons).group(1).split(',')]
    side=int(re.search(r'kSize = (\d+)',icons).group(1))
    dti=DEST/'resources/icons/dti';dti.mkdir(parents=True,exist_ok=True)
    for name in names:
        image=Image.open(REPO/'assets/ui-icons/generated-sharp'/f'{name.lower()}-{side}.png').convert('RGBA')
        (dti/(name+'.dti')).write_bytes(struct.pack('<4sHHB3x',b'DTI1',side,side,3)+image.getchannel('A').tobytes())
    (DEST/'resources/icons/catalog.json').write_text(json.dumps([{'id':i,'name':n} for i,n in enumerate(names)],indent=2))
    for name in ('scaffold-js','scaffold-native'):
        copy(ROOT/'LICENSE',DEST/'examples'/name/'LICENSE')
        copy(ROOT/'NOTICE',DEST/'examples'/name/'NOTICE')
        assets=DEST/'examples'/name/'assets';assets.mkdir(exist_ok=True)
        for icon in ('application','tile'):copy(dti/'DeskTile.dti',assets/(icon+'.dti'))
    # Publish the actual application sources and their complete package resources.
    sys.path.insert(0,str(REPO/'tools'))
    from build_sample_apps import stage_sample
    downloads=ROOT/'docs/.vuepress/public/downloads';downloads.mkdir(parents=True,exist_ok=True)
    for name,icon in [('notes-js','notes'),('timer-js','timer'),('native-todo','taskcomplete')]:
        target=DEST/'examples'/name
        stage_sample(REPO/'samples'/name,target,icon)
        copy(REPO/'assets/ui-icons/LICENSE',target/'licenses/icons-MIT.txt')
        copy(REPO/'assets/ui-icons/LICENSE-MATERIAL-SYMBOLS',target/'licenses/icons-Apache-2.0.txt')
        copy(REPO/'assets/ui-icons/MATERIAL-SYMBOLS.md',target/'licenses/MATERIAL-SYMBOLS.md')
        (target/'NOTICE').write_text('DeskTile '+name+' example\nCopyright 2026 Caner\n\nApplication source is licensed under Apache-2.0.\nIcon resources retain their original licenses; see licenses/.\n',encoding='utf-8')
        kind='native' if name=='native-todo' else 'javascript'
        (target/'desktile.json').write_text(json.dumps({'sdk':'1.0','target':'esp32s3' if kind=='native' else 'portable'}),encoding='utf-8')
        guide={'notes-js':'notes','timer-js':'timer','native-todo':'todo'}[name]
        command='desktile build .'+(' --compiler "PATH/TO/xtensa-esp32s3-elf-g++.exe"' if kind=='native' else '')
        (target/'README.md').write_text(f'# {name}\n\nDeskTile SDK 1.0 / {kind}\n\n```sh\n{command}\n```\n\nThe package is written to dist/. Copy it to the SD user Packages directory and install it on the device.\n\nThis is the original application package ID. Change manifest.json id before installing your own derivative alongside the original application.\n\nRun `desktile docs` and open Examples / {guide}.\n\nLicense: Apache-2.0. Icon notices: licenses/.\n',encoding='utf-8')
        with zipfile.ZipFile(downloads/(name+'.zip'),'w',zipfile.ZIP_DEFLATED) as archive:
            for p in sorted(target.rglob('*')):
                if p.is_file():archive.write(p,name+'/'+p.relative_to(target).as_posix())
    # Preserve the system mark's vector geometry; only theme foreground differs.
    public=ROOT/'docs/.vuepress/public';public.mkdir(parents=True,exist_ok=True)
    mark=(REPO/'assets/ui-icons/source/desktile.svg').read_text(encoding='utf-8')
    theme_styles=ROOT/'docs/node_modules/@vuepress/theme-default/dist/client/styles'
    for source,destination in [('vars.scss','logo.svg'),('vars-dark.scss','logo-dark.svg')]:
        theme=(theme_styles/source).read_text(encoding='utf-8')
        title_color=re.search(r'--vp-c-text:\s*([^;]+);',theme)
        if not title_color:raise SystemExit('Documentation title colour is missing: '+source)
        (public/destination).write_text(mark.replace('<svg ',f'<svg fill="{title_color.group(1)}" ',1),encoding='utf-8')
    (ROOT/'assets').mkdir(exist_ok=True)
    import cairosvg
    cairosvg.svg2png(bytestring=mark.replace('<svg ','<svg fill="#ff9900" ',1).encode(),output_width=128,output_height=128,write_to=str(ROOT/'assets/logo.png'))
    copy(ROOT/'assets/logo.png',public/'favicon.png')
    manifest={'product':'DeskTile SDK','sdk':'1.0','devkit':json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['version'],'files':[]}
    for p in sorted(DEST.rglob('*')):
        if p.is_file() and p.name!='delivery-manifest.json':
            manifest['files'].append({'path':p.relative_to(DEST).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    (DEST/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print('SDK 1.0 staged:',len(manifest['files']),'files')

if __name__=='__main__':main()
