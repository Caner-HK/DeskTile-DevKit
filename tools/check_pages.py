"""Validate emitted HTML links/resources beneath a GitHub Pages project base."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value:
                self.links.append(value)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('--base', default='/')
    args = parser.parse_args()
    root = args.directory.resolve()
    assert args.base.startswith('/') and args.base.endswith('/')
    checked = 0
    errors = []
    for page in root.rglob('*.html'):
        links = Links()
        links.feed(page.read_text(encoding='utf-8'))
        for link in links.links:
            url = urlsplit(link)
            if url.scheme or url.netloc or not url.path:
                continue
            path = unquote(url.path)
            if path.startswith('/'):
                if not path.startswith(args.base):
                    errors.append(f'{page.relative_to(root)}: missing base: {path}')
                    continue
                target = root / path[len(args.base):]
            else:
                target = page.parent / path
            target = target.resolve()
            if not target.is_relative_to(root):
                errors.append(f'{page.relative_to(root)}: escaping path: {path}')
            elif not (target.is_file() or (target / 'index.html').is_file()):
                errors.append(f'{page.relative_to(root)}: missing file: {path}')
            checked += 1
    assert (root / 'index.html').is_file() and (root / 'en/index.html').is_file()
    if errors:
        raise SystemExit('\n'.join(errors[:40]) + f'\n{len(errors)} errors')
    print(f'Checked {checked} local URLs with base {args.base}')


if __name__ == '__main__':
    main()
