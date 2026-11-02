"""Build the deterministic DeskTile App Package v1 container."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
from pathlib import Path, PurePosixPath
from locale_catalog import validate_catalog
from tile_icon_resources import validate_variants

MAGIC = b"DTAPP001"
HEADER = struct.Struct("<8sHHHHIIII")
ENTRY = struct.Struct("<HBBIII32s")
PACKAGE_ID = re.compile(r"^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$")
MAX_FILES = 512
MAX_PATH = 160
MAX_PACKAGE = 64 * 1024 * 1024


def fail(message: str) -> None:
    raise SystemExit(f"dtapp: {message}")


def safe_path(value: str) -> bool:
    if not value or value.startswith(("/", "\\")) or "\\" in value or any(ord(c) < 32 for c in value):
        return False
    return all(part not in ("", ".", "..") for part in value.split("/"))


def require_path(root: Path, value: object, label: str) -> str:
    if not isinstance(value, str) or not safe_path(value) or len(value.encode('utf-8')) > 127:
        fail(f"invalid {label} path")
    if not (root / Path(*PurePosixPath(value).parts)).is_file():
        fail(f"missing {label}: {value}")
    return value


def validate_manifest(root: Path, manifest: dict) -> None:
    required = {"manifest_version", "id", "name", "version", "version_code", "runtime", "entry", "sdk", "icons", "tile", "permissions", "metadata"}
    if set(manifest)!=required or isinstance(manifest.get("manifest_version"), bool) or manifest.get("manifest_version") != 1:
        fail("manifest fields do not match version 1")
    if 'metadata' in manifest:
        metadata=manifest['metadata']
        author=metadata.get('author') if isinstance(metadata,dict) else None
        if not isinstance(metadata,dict) or set(metadata)!={'author'} or not isinstance(author,str) or not author or len(author.encode('utf-8'))>63 or any(ord(c)<32 or ord(c)==127 for c in author):fail('metadata.author must be a 1..63 byte author name without control characters')
    package_id = manifest.get("id")
    if not isinstance(package_id, str) or len(package_id) > 96 or not PACKAGE_ID.fullmatch(package_id):
        fail("invalid package id")
    name=manifest.get('name')
    if isinstance(name,dict):
        if not name or any(not isinstance(key,str) or not isinstance(value,str) or not value or len(value.encode('utf-8'))>63 or any(ord(c)<32 or ord(c)==127 for c in value) for key,value in name.items()):
            fail('localized names require nonempty valid UTF-8 strings')
        name=name.get('zh-CN',name.get('zh-HK',name.get('en-US',name.get('en'))))
    if not isinstance(name,str) or not name or len(name.encode('utf-8'))>63:
        fail('name must contain a 1..63 byte string or a zh-CN/zh-HK/en-US/en localized name')
    version=manifest.get('version')
    if not isinstance(version,str) or not version or len(version.encode('utf-8'))>63 or any(ord(c)<32 or ord(c)==127 for c in version):fail('version must be a 1..63 byte display label without control characters')
    code=manifest.get('version_code')
    if isinstance(code,bool) or not isinstance(code,int) or not 1<=code<=0xffffffff:fail('version_code must be an integer in 1..4294967295')
    sdk=manifest.get('sdk')
    def api_version(value):
        if not isinstance(value,str) or not re.fullmatch(r'[0-9]+\.[0-9]+',value):fail('invalid SDK version')
        parts=tuple(map(int,value.split('.')))
        if any(v>255 for v in parts):fail('SDK version exceeds 255')
        return parts
    if not isinstance(sdk,dict) or set(sdk)!={'minimum','target'}:fail('invalid SDK fields')
    if api_version(sdk['minimum'])>api_version(sdk['target']):fail('minimum SDK exceeds target')
    tile=manifest.get('tile')
    if not isinstance(tile,dict) or not {'default_size','supported_sizes'}<=set(tile) or set(tile)-{'default_size','supported_sizes','names','transition_color','appearance_transition_colors','full_image','show_title'}:fail('invalid tile fields')
    if 'show_title' in tile:
        titles=tile['show_title']
        if not isinstance(titles,dict) or not titles or set(titles)-{'2x2','4x2','4x4'} or any(not isinstance(value,bool) for value in titles.values()):fail('tile.show_title requires per-size boolean values')
    def tile_color(value):
        if not isinstance(value,str) or not re.fullmatch(r'#[0-9A-Fa-f]{6}',value):fail('tile transition colors must be #RRGGBB')
    if 'full_image' in tile and not isinstance(tile['full_image'],bool):fail('tile.full_image must be a boolean')
    if tile.get('full_image') and not manifest.get('icons',{}).get('tile_variants'):fail('complete tile artwork requires tile_variants')
    if 'transition_color' in tile:tile_color(tile['transition_color'])
    sizes=tile['supported_sizes']
    if not isinstance(sizes,list) or not sizes or any(s not in ('1x1','2x2','4x2','4x4') for s in sizes) or len(set(sizes))!=len(sizes) or tile['default_size'] not in sizes:fail('invalid tile sizes')
    if 'names' in tile:
        names=tile['names']
        if not isinstance(names,dict) or not names or set(names)-{'1x1','2x2','4x2','4x4'}:fail('invalid tile.names sizes')
        for value in names.values():
            if isinstance(value,dict):
                if not value or set(value)-{'zh-CN','zh-HK','en','en-US'}:fail('invalid tile.names locales')
                values=value.values()
            else:values=[value]
            if any(not isinstance(label,str) or not label or len(label.encode('utf-8'))>63 or any(ord(c)<32 or ord(c)==127 for c in label) for label in values):fail('tile names must be 1..63 UTF-8 bytes without control characters')
    permissions=manifest.get('permissions')
    known={entry['id'] for entry in json.loads((Path(__file__).resolve().parents[1]/'sdk/contract/permissions.json').read_text(encoding='utf-8'))['permissions'] if not entry.get('implicit')}
    if not isinstance(permissions,list) or len(permissions)>16 or any(not isinstance(p,str) or p not in known for p in permissions) or len(set(permissions))!=len(permissions):fail('invalid permissions')
    runtime = manifest.get("runtime")
    entry = manifest.get("entry")
    if not isinstance(entry, dict):
        fail("entry must be an object")
    if runtime == "javascript":
        if set(entry)!={'document','script'}:fail('invalid JavaScript entry fields')
        require_path(root, entry.get("document"), "document entry")
        require_path(root, entry.get("script"), "script entry")
    elif runtime == "native-module":
        if set(entry)!={'module'}:fail('invalid Native entry fields')
        require_path(root, entry.get("module"), "Native entry")
    elif runtime == "native-builtin":
        if set(entry)!={'symbol'}:fail('invalid built-in entry fields')
        if not isinstance(entry.get("symbol"), str) or not entry["symbol"]:
            fail("Native built-in entry symbol is missing")
    else:
        fail("unsupported runtime")
    icons = manifest.get("icons")
    if not isinstance(icons, dict) or not {'application','tile'}<=set(icons) or not set(icons)<={'application','tile','splash','tile_variants','appearances','notification'}:
        fail("icons must be an object")
    require_path(root, icons.get("application"), "application icon")
    require_path(root, icons.get("tile"), "tile icon")
    if 'splash' in icons:require_path(root,icons['splash'],'splash icon')
    if 'notification' in icons:
        from notification_icon import validate_notification_icon
        notification=icons['notification']
        if not isinstance(notification,dict):fail('icons.notification must be an object')
        require_path(root,notification.get('path'),'notification icon')
        try:validate_notification_icon(root,notification)
        except (ValueError,OSError) as error:fail(f'invalid notification icon: {error}')
    if 'tile_variants' in icons:
        if not isinstance(icons['tile_variants'],bool):fail('icons.tile_variants must be a boolean')
        if icons['tile_variants']:
            try:validate_variants(root,icons['tile'],tile.get('full_image',False))
            except (ValueError,OSError) as error:fail(f'invalid tile icon variants: {error}')
    if 'appearances' in icons:
        appearances=icons['appearances']
        if not isinstance(appearances,dict) or set(appearances) not in ({'default','choices'},{'default','from_resources'}):fail('invalid icon appearances')
        resource_choices=appearances.get('from_resources') is True
        if 'from_resources' in appearances and not resource_choices:fail('from_resources must be true')
        choices=sorted(p.name for p in (root/Path(icons['application']).parent).iterdir() if p.is_dir() and (p/Path(icons['application']).name).is_file()) if resource_choices else appearances['choices']
        if not isinstance(choices,list) or not 1<=len(choices)<=(256 if resource_choices else 16) or any(not isinstance(x,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,16}',x) for x in choices):fail('invalid icon appearance IDs')
        if len(set(choices))!=len(choices) or appearances['default'] not in choices:fail('invalid default or duplicate icon appearance')
        for choice in choices:
            for field in ('application','tile'):
                base=Path(icons[field]);variant=(base.parent/choice/base.name).as_posix()
                if len(variant.encode('utf-8'))>127:fail('icon appearance path too long')
                require_path(root,variant,'icon appearance')
                if field=='tile' and icons.get('tile_variants'):
                    try:validate_variants(root,variant,tile.get('full_image',False))
                    except (ValueError,OSError) as error:fail(f'invalid appearance tile sizes: {error}')
    if 'appearance_transition_colors' in tile:
        colors=tile['appearance_transition_colors'];choices=icons.get('appearances',{}).get('choices',[])
        if not isinstance(colors,dict) or not colors or set(colors)-set(choices):fail('transition colors must reference declared icon appearances')
        for value in colors.values():tile_color(value)
    try:validate_catalog(root)
    except (ValueError,OSError,UnicodeError) as error:fail(f'invalid application-language resources: {error}')


def build(source: Path, output: Path, development: bool, signing_key: Path | None) -> None:
    if development == bool(signing_key):
        fail("choose exactly one of --development or --signing-key")
    manifest_path = source / "manifest.json"
    if not manifest_path.is_file():
        fail("manifest.json is missing")
    if manifest_path.stat().st_size > 16 * 1024:
        fail("manifest.json exceeds 16 KiB")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        fail(f"invalid manifest JSON: {error}")
    if not isinstance(manifest, dict):
        fail("manifest root must be an object")
    validate_manifest(source, manifest)

    files: list[tuple[str, bytes]] = []
    for path in source.rglob("*"):
        if path.relative_to(source).parts[0] == 'icon-design':
            continue
        if path.is_symlink():fail(f'symbolic link in package source: {path.name}')
        if not path.is_file() or path == output:
            continue
        relative = path.relative_to(source).as_posix()
        encoded = relative.encode("utf-8")
        if not safe_path(relative) or len(encoded) > MAX_PATH:
            fail(f"invalid package path: {relative}")
        files.append((relative, path.read_bytes()))
    files.sort(key=lambda item: item[0].encode("utf-8"))
    if not files or len(files) > MAX_FILES:
        fail("file count is outside the package limit")

    table = bytearray()
    payload = bytearray()
    for relative, content in files:
        path_bytes = relative.encode("utf-8")
        table += ENTRY.pack(len(path_bytes), 0, 0, len(payload), len(content), len(content),
                            hashlib.sha256(content).digest())
        table += path_bytes
        payload += content
    flags = 0 if development else 1
    signature_size = 0 if development else 64
    header = HEADER.pack(MAGIC, 1, flags, len(files), 0, len(table), len(payload), signature_size, 0)
    signed_content = header + table + payload
    signature = b""
    if signing_key:
        try:
            from cryptography.hazmat.primitives import hashes, serialization
            from cryptography.hazmat.primitives.asymmetric import ec, utils
            key = serialization.load_pem_private_key(signing_key.read_bytes(), password=None)
        except (OSError, ValueError, TypeError) as error:
            fail(f"cannot load signing key: {error}")
        if not isinstance(key, ec.EllipticCurvePrivateKey) or not isinstance(key.curve, ec.SECP256R1):
            fail("signing key must be ECDSA P-256")
        digest = hashlib.sha256(signed_content).digest()
        der = key.sign(digest, ec.ECDSA(utils.Prehashed(hashes.SHA256())))
        r, s = utils.decode_dss_signature(der)
        signature = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    package = signed_content + signature
    if len(package) > MAX_PACKAGE:
        fail("package exceeds 64 MiB")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(package)
    trust = "development unsigned" if development else "ECDSA P-256 signed"
    print(f"dtapp: {manifest['id']} {manifest['version']}, {len(files)} files, {len(package)} bytes, {trust}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--development", action="store_true")
    parser.add_argument("--signing-key", type=Path)
    arguments = parser.parse_args()
    key = arguments.signing_key.resolve() if arguments.signing_key else None
    build(arguments.source.resolve(), arguments.output.resolve(), arguments.development, key)


if __name__ == "__main__":
    main()
