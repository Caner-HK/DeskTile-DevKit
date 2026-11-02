"""Build the current DevKit: VSIX, CLI package and portable VuePress bundle."""
from pathlib import Path
import argparse
import os
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vsce', required=True, help='Path to @vscode/vsce JavaScript entry')
    parser.add_argument('--npm-cli', help='Path to npm-cli.js')
    parser.add_argument('--compiler', help='Also build the bundled Native ToDo example with this compiler')
    parser.add_argument('--refresh-documentation', action='store_true',
                        help='Accepted for existing callers; every export refreshes the SDK and documentation')
    args = parser.parse_args()
    node = shutil.which('node')
    if not node:
        parser.error('Node.js 20 or newer is required')
    npm = Path(args.npm_cli) if args.npm_cli else Path(node).parent / 'node_modules/npm/bin/npm-cli.js'
    if not npm.is_file():
        parser.error('npm-cli.js was not found; specify --npm-cli')
    if not Path(args.vsce).is_file():
        parser.error('--vsce must point to the installed @vscode/vsce JavaScript entry')
    env = dict(os.environ, PYTHONUTF8='1')

    def run(argv, cwd=ROOT):
        subprocess.run([str(value) for value in argv], cwd=cwd, env=env, check=True)

    run([sys.executable, KIT / 'tools/stage.py'])
    run([sys.executable, KIT / 'tools/docs.py'])
    run([node, npm, 'run', 'build'], KIT / 'docs')
    run([sys.executable, KIT / 'tools/docs.py', '--check'])
    if args.compiler:
        run([node, KIT / 'bin/desktile.js', 'build', KIT / 'sdk-bundle/examples/native-todo',
             '--compiler', args.compiler, '--output', KIT / 'build/native-todo.dtapp'])
    run([sys.executable, KIT / 'tools/package.py', '--vsce', args.vsce, '--npm-cli', npm])
    print('DeskTile DevKit artifacts:', KIT / 'dist/artifacts.json')


if __name__ == '__main__':
    main()
