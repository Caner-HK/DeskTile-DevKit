"""Check rendered VuePress links against the canonical reading order."""
from pathlib import Path
from html.parser import HTMLParser
import json
import sys
import zipfile
import tarfile

ROOT = Path(__file__).resolve().parents[1]

def route(link):
    if link.endswith('/index.md'):
        return link[:-8]
    if link.endswith('.md'):
        return link[:-3] + '.html'
    return link

def leaves(nodes):
    for node in nodes:
        if node.get('children'):
            yield from leaves(node['children'])
        else:
            yield node['text'], route(node['link'])

class PageLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_nav = False
        self.links = []
        self.current = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'nav' and attrs.get('aria-label') == 'page navigation':
            self.in_nav = True
        if tag == 'a' and self.in_nav:
            self.current = [attrs.get('href'), '']
    def handle_data(self, text):
        if self.current is not None:
            self.current[1] += text
    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.links.append(self.current)
            self.current = None
        if tag == 'nav':
            self.in_nav = False

def main():
    order = list(leaves(json.loads((ROOT/'docs/navigation.json').read_text(encoding='utf-8'))))
    assert len({url for _, url in order}) == len(order), 'Duplicate routes'
    for i, (title, url) in enumerate(order):
        path = ROOT/'site'/url.lstrip('/')
        if url.endswith('/'):
            path = path/'index.html'
        parser = PageLinks()
        parser.feed(path.read_text(encoding='utf-8'))
        expected = ([order[i-1]] if i else []) + ([order[i+1]] if i+1 < len(order) else [])
        assert [link[0] for link in parser.links] == [item[1] for item in expected], (title, parser.links, expected)
        assert all(label in link[1] for link, (label, _) in zip(parser.links, expected)), title
    print(f'Rendered navigation verified: {len(order)} pages, {2*(len(order)-1)} directed links; labels and endpoints match.')
    if '--artifacts' in sys.argv:
        names = ['notes-js', 'timer-js', 'native-todo']
        required = ['assets/logo.png', 'site/logo.svg', 'site/logo-dark.svg']
        required += [f'sdk-bundle/examples/{name}/LICENSE' for name in names]
        required += [f'site/downloads/{name}.zip' for name in names]
        with zipfile.ZipFile(ROOT/'dist/desktile-devkit-1.0.0-win32-x64.vsix') as vsix, tarfile.open(ROOT/'dist/desktile-devkit-1.0.0.tgz') as npm, zipfile.ZipFile(ROOT/'dist/DeskTile-DevKit-1.0.0-windows-x64.zip') as portable:
            containers = [(set(vsix.namelist()), 'extension/'), (set(npm.getnames()), 'package/'), (set(portable.namelist()), 'DeskTile-DevKit-1.0.0-windows-x64/')]
            for files, prefix in containers:
                for name in required:
                    assert prefix+name in files, prefix+name
        for name in names:
            with zipfile.ZipFile(ROOT/f'site/downloads/{name}.zip') as archive:
                license_text = archive.read(name+'/LICENSE').decode()
                assert 'Apache License' in license_text and 'Version 2.0, January 2004' in license_text
                assert archive.read(name+'/manifest.json') == (ROOT/f'sdk-bundle/examples/{name}/manifest.json').read_bytes()
                for entry in archive.namelist():
                    relative = entry.removeprefix(name+'/')
                    assert archive.read(entry) == (ROOT/'sdk-bundle/examples'/name/relative).read_bytes(), entry
        print('All 3 distributions include logos and licensed examples. Download archives match the bundled sources byte for byte.')

if __name__ == '__main__':
    main()
