"""Convert a developer's PNG to DTI1 alpha-mask or RGB565 icon."""
from pathlib import Path
import argparse, struct

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path);parser.add_argument('output',type=Path)
    parser.add_argument('--size',type=int,default=96)
    parser.add_argument('--color',action='store_true',help='Keep colors instead of theme-colored alpha mask')
    args=parser.parse_args()
    if not 1<=args.size<=512:parser.error('size must be 1..512')
    try:from PIL import Image
    except ImportError:parser.error('install Pillow: python -m pip install Pillow')
    im=Image.open(args.source).convert('RGBA');im.thumbnail((args.size,args.size),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(args.size,args.size));canvas.alpha_composite(im,((args.size-im.width)//2,(args.size-im.height)//2))
    if args.color:
        opaque=Image.new('RGBA',canvas.size,(255,255,255,255));opaque.alpha_composite(canvas)
        payload=b''.join(struct.pack('<H',((r>>3)<<11)|((g>>2)<<5)|(b>>3)) for r,g,b,a in opaque.getdata())
        kind=0
    else:payload=bytes(a for r,g,b,a in canvas.getdata());kind=3
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_bytes(struct.pack('<4sHHB3x',b'DTI1',args.size,args.size,kind)+payload)
    print(args.output)

if __name__=='__main__':main()
