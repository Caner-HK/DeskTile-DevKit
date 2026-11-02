"""Native-size shell tile icon resources; generated PNG inputs retain SVG identity."""
from pathlib import Path
import struct

SIZES = {'1x1': 40, '2x2': 64, '4x2': 80, '4x4': 128}
ROOT = Path(__file__).resolve().parents[1]


def variant_path(base: str, size: str) -> str:
    if size not in SIZES or not base.endswith('.dti') or len(base.encode('utf-8')) > 123:
        raise ValueError('Tile variants require a .dti path of at most 123 UTF-8 bytes')
    return base[:-4] + '-' + size + '.dti'


def write_variants(stage: Path, base: str, icon: str) -> None:
    from PIL import Image
    for size, side in SIZES.items():
        source = ROOT / 'assets/ui-icons/generated-sharp' / f'{icon.lower()}-{side}.png'
        with Image.open(source) as image:
            if image.size != (side, side):
                raise ValueError(f'Native tile icon dimensions mismatch: {source}')
            mask = image.convert('RGBA').getchannel('A').tobytes()
        destination = stage / variant_path(base, size)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(struct.pack('<4sHHB3x', b'DTI1', side, side, 3) + mask)


def validate_variants(root: Path, base: str, full_image: bool = False) -> None:
    canvases={'1x1':(80,80),'2x2':(168,168),'4x2':(344,168),'4x4':(344,344)}
    for size, side in SIZES.items():
        standard=variant_path(base,size)
        for locale in ('','-zh-HK','-en') if full_image else ('',):
            path=root/(standard[:-4]+locale+'.dti')
            if locale and not path.exists():continue
            data=path.read_bytes()
            if len(data)<12:raise ValueError(f'{path.name} has an incomplete DTI header')
            magic,w,h,kind=struct.unpack('<4sHHB3x',data[:12]);width,height=canvases[size] if full_image else (side,side);n=width*height
            expected=12+n if kind==3 else 12+(n+7)//8+n*2 if kind==2 else 12+n*2 if kind==0 else -1
            if kind==1:
                if (len(data)-12)%4:raise ValueError('Incomplete artwork RLE pair')
                pixels=0
                for count,color in struct.iter_unpack('<HH',data[12:]):
                    if not count or pixels+count>n:raise ValueError('Invalid artwork RLE run')
                    pixels+=count
                if pixels!=n:raise ValueError('Incomplete artwork pixels')
                expected=len(data)
            if (magic,w,h)!=(b'DTI1',width,height) or len(data)!=expected:
                raise ValueError(f'{path.name} must be a native {width}x{height} DTI image')
