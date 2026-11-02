"""Build a DevKit-only font pack; never modify device or application resources."""
from pathlib import Path
import hashlib, json, re

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent/'DeskTile_System'

def prepare(out):
    source = (REPO/'src/graphics/UiNativeGlyphs.h').read_text(encoding='utf-8')
    original = (REPO/'assets/fonts/ui-fonts.pack').read_bytes()
    assert original[:8] == b'DTUIF002' and hashlib.sha256(original[40:]).digest() == original[8:40]
    count = int(re.search(r'externalCodepointCount=(\d+)', source)[1])
    offset = int(re.search(r'externalCodepointsOffset=(\d+)', source)[1])
    pack = bytearray(40) + original[offset:offset+count*4]
    lines = source[:source.index('inline constexpr uint8_t digest')].splitlines()
    records = {}
    for match in re.finditer(r'inline constexpr Font font(\w+)\{([^}]+)\};', source):
        records.setdefault(match[1], match[2].split(','))
    inventory = []

    def append(name, size, glyph_count, glyphs, index, pixels, family):
        table = len(pack) if index else 0
        pack.extend(index)
        start = len(pack)
        pack.extend(pixels)
        digest = hashlib.sha256(pixels).digest()
        lines.append(f'inline constexpr uint8_t digest{name}[32]={{'+','.join(map(str,digest))+'};')
        pointer = 'nullptr'
        if glyphs:
            pointer = 'glyphs'+name
            lines.append(f'inline constexpr Glyph {pointer}[]={{'+glyphs+'};')
        lines.append(f'inline constexpr Font font{name}{{{size},{glyph_count},{pointer},nullptr,{table},{start},{len(pixels)},digest{name}}};')
        inventory.append(dict(name=name, family=family, size=size, glyphs=glyph_count,
                              tableOffset=table, offset=start, bytes=len(pixels), sha256=digest.hex()))

    for name, fields in records.items():
        if name.startswith(('hk','gds')):
            continue
        size, glyph_count = map(int, fields[:2])
        start, length = map(int, fields[5:7])
        extended = name.startswith('systemextended')
        index = original[int(fields[4]):int(fields[4])+glyph_count*20] if extended else b''
        glyphs = '' if extended else re.search(r'inline constexpr Glyph glyphs'+name+r'\[\] = \{\n(.*?)\n\};',source,re.S)[1]
        family = next(v for k,v in [('system','MiSans'),('gds','Transport Sans'),('cabin','Cabin'),('noto','Noto Sans'),('serif','Source Serif 4')] if name.startswith(k))
        append(name,size,glyph_count,glyphs,index,original[start:start+length],family)

    pack[:40] = b'DTUIF002'+hashlib.sha256(pack[40:]).digest()
    tail = source[source.index('inline constexpr uint32_t maximumGlyphBytes='):]
    # The traditional flag belongs to the internal PIDS face, not zh-HK locale.
    # Generic SDK components use system glyphs for every locale.
    tail = re.sub(r'fonthk(16|20|22|32|48)',r'fontsystem\1',tail)
    tail = re.sub(r'fontgds(16|20|22|32|48)',r'fontsystem\1',tail)
    lines += [f'inline constexpr uint32_t packBytes={len(pack)};',
              'inline constexpr uint8_t packHeader[40]={'+','.join(map(str,pack[:40]))+'};',tail]
    (out/'src/graphics/UiNativeGlyphs.h').write_text('\n'.join(lines),encoding='utf-8')
    (out/'ui-fonts.pack').write_bytes(pack)
    (out/'font-inventory.json').write_text(json.dumps(dict(fonts=inventory,
        excluded=['GDS Transport','Myriad Pro','DFLiSongHK','Transport Medium','PIDS application typefaces'],
        sourceFamilies={}),indent=2),encoding='utf-8')
    # PIDS-specific Canvas methods are internal app code, outside the SDK renderer.
    canvas_path = out/'src/graphics/Canvas.cpp'
    canvas = canvas_path.read_text(encoding='utf-8')
    for include in ('MtrPidsTypeface.h','MtrPidsPaxTypeface.h','../../MtrPidsHostFontCache.h'):
        canvas = canvas.replace('#include "'+include+'"','')
    start = canvas.index('namespace {\nmtrpids_typeface::Face')
    end = canvas.index('uint16_t *Canvas::pixels()',start)
    clear_start = canvas.index('void Canvas::clearMarqueeCache()',start)
    clear_end = canvas.index('\n}',clear_start)+2
    canvas = canvas[:start]+canvas[clear_start:clear_end]+'\n\n'+canvas[end:]
    start = canvas.index('void Canvas::drawMtrPidsGlyph(')
    end = canvas.index('\n}  // namespace desktile',start)
    canvas = canvas[:start]+canvas[end:]
    assert 'mtrpids_typeface' not in canvas
    canvas_path.write_text(canvas,encoding='utf-8')
    print('DevKit font pack:', len(pack), 'bytes;', len(inventory), 'faces; app fonts excluded')
