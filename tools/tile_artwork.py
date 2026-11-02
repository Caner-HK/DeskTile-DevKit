"""Convert designer source previews and final native tile artwork."""
from pathlib import Path
import argparse, base64, io, json, struct
from PIL import Image
from icon_asset import load, encode

def opaque(image):
    raw=encode(image,'custom')
    if image.getchannel('A').getextrema()!=(255,255):return raw
    pixels=raw[12+(image.width*image.height+7)//8:]
    header=struct.pack('<4sHHB3x',b'DTI1',*image.size,0)
    words=struct.unpack('<'+'H'*(len(pixels)//2),pixels)
    runs=bytearray();i=0
    while i<len(words):
        end=i+1
        while end<len(words) and words[end]==words[i] and end-i<65535:end+=1
        runs+=struct.pack('<HH',end-i,words[i]);i=end
    return header+pixels if len(pixels)<=len(runs) else struct.pack('<4sHHB3x',b'DTI1',*image.size,1)+runs

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['sources','encode']);parser.add_argument('config',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
    config=json.loads(args.config.read_text(encoding='utf-8'));args.output.mkdir(parents=True,exist_ok=True)
    if args.action=='sources':
        for key,source in config.items():
            if not all(c in 'abcdef0123456789-' for c in key):raise ValueError('Invalid image identity')
            load(Path(source),svg_limit=2048).save(args.output/(key+'.png'))
    else:
        for record in config:
            relative=Path(record['file']);destination=(args.output/relative).resolve()
            if not destination.is_relative_to(args.output.resolve()) or relative.suffix!='.dti':raise ValueError('Invalid artwork path')
            image=Image.open(io.BytesIO(base64.b64decode(record['png'],validate=True)))
            if image.size!=(record['width'],record['height']) or max(image.size)>344:raise ValueError('Canvas dimensions changed')
            image=image.convert('RGBA')
            destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(encode(image,'system') if record['mode']=='system' else opaque(image))
    print(args.output)
if __name__=='__main__':main()
