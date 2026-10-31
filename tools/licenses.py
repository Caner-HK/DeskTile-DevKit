"""Collect actual documentation dependency notices into the local distribution."""
from pathlib import Path
import json, re, shutil

ROOT = Path(__file__).resolve().parents[1]

def main():
    records = []
    modules = ROOT / 'docs/node_modules'
    for manifest in sorted(modules.rglob('package.json')):
        parent = manifest.parent
        # Only installed package roots, excluding examples and nested fixture manifests.
        if parent.parent != modules and parent.parent.name != 'node_modules' and not (parent.parent.name.startswith('@') and parent.parent.parent.name == 'node_modules'):
            continue
        data = json.loads(manifest.read_text(encoding='utf-8-sig'))
        name, version = data.get('name'), data.get('version')
        if not name or not version:
            continue
        target = ROOT / 'licenses/dependencies' / re.sub(r'[^a-zA-Z0-9_.-]', '_', name + '-' + version)
        files = []
        for source in sorted(parent.iterdir()):
            if source.is_file() and re.match(r'(?i)^(licen[cs]e|copying|notice)(\b|[._-])', source.name):
                target.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target / source.name)
                files.append((target / source.name).relative_to(ROOT).as_posix())
        records.append(dict(name=name, version=version, license=data.get('license', data.get('licenses', 'not declared')), notices=files))
    if not records:
        raise SystemExit('Documentation dependencies are missing')
    (ROOT / 'licenses/dependencies.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Dependency license records:', len(records), 'notice files:', sum(len(x['notices']) for x in records))

if __name__ == '__main__':
    main()
