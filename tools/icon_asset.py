"""Prepare native DTI icons and their light/dark previews."""
from pathlib import Path
import argparse, io, json, re, struct, math
from PIL import Image

def load(path,svg_limit=512):
    if path.stat().st_size>16*1024*1024:raise ValueError('Image exceeds 16 MiB')
    if path.suffix.lower()=='.dti':
        data=path.read_bytes()
        if len(data)<12:raise ValueError('Incomplete DTI')
        magic,w,h,kind=struct.unpack('<4sHHB3x',data[:12]);n=w*h
        if magic!=b'DTI1' or not 0<n<=1024*1024:raise ValueError('Invalid DTI size')
        if kind==1:
            if len(data)%2:raise ValueError('Incomplete DTI RLE word')
            words=struct.unpack('<'+'H'*((len(data)-12)//2),data[12:]);pixels=[];offset=0
            while offset<len(words):
                header=words[offset];offset+=1;count=header&0x7fff;repeated=bool(header&0x8000)
                required=1 if repeated else count
                if not count or len(pixels)+count>n or offset+required>len(words):raise ValueError('Invalid DTI RLE run')
                pixels.extend([words[offset]]*count if repeated else words[offset:offset+count]);offset+=required
            if len(pixels)!=n:raise ValueError('Incomplete DTI RLE pixels')
            data=data[:8]+bytes(4)+struct.pack('<'+'H'*n,*pixels);kind=0
        expected=12+(n if kind==3 else 2*n+(n+7)//8 if kind==2 else 2*n if kind==0 else -12)
        if len(data)!=expected:raise ValueError('Invalid DTI pixels')
        im=Image.new('RGBA',(w,h));values=[];mask=(n+7)//8 if kind==2 else 0
        for i in range(n):
            if kind==3:values.append((255,255,255,data[12+i]));continue
            c=struct.unpack_from('<H',data,12+mask+2*i)[0]
            values.append((((c>>11)&31)*255//31,((c>>5)&63)*255//63,(c&31)*255//31,255 if kind==0 or data[12+(i>>3)]&(0x80>>(i&7)) else 0))
        im.putdata(values);return im
    if path.suffix.lower()=='.svg':
        import xml.etree.ElementTree as ET
        data=path.read_bytes();root=ET.fromstring(data)
        for e in root.iter():
            for k,v in e.attrib.items():
                if k.endswith('href') and not v.startswith('#'):raise ValueError('SVG must contain embedded vector paths')
        if re.search(rb'(?i)<!DOCTYPE|<!ENTITY|@import',data):raise ValueError('External SVG resources are unsupported')
        for url in re.findall(rb'(?i)url\(([^)]*)\)',data):
            if not url.strip().strip(b'\"\x27').startswith(b'#'):raise ValueError('External SVG resources are unsupported')
        view=root.get('viewBox','').replace(',',' ').split()
        if len(view)==4:w,h=map(float,view[2:])
        else:
            def dimension(name):
                value=root.get(name,'')
                if not re.fullmatch(r'[0-9]+(?:\.[0-9]+)?(?:px)?',value):raise ValueError('SVG requires a viewBox or pixel width and height')
                return float(value.removesuffix('px'))
            w,h=dimension('width'),dimension('height')
        if not all(math.isfinite(n) and n>0 for n in (w,h)):raise ValueError('Invalid SVG dimensions')
        if w*h>16777216:raise ValueError('Image exceeds 16 megapixels')
        scale=svg_limit/max(w,h) if svg_limit else 1
        import cairosvg
        return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=data,output_width=max(1,round(w*scale)),output_height=max(1,round(h*scale))))).convert('RGBA')
    with Image.open(path) as im:
        if im.width*im.height>16777216:raise ValueError('Image exceeds 16 megapixels')
        return im.convert('RGBA')

def encode(image,mode):
    pixels=list(image.getdata());n=len(pixels)
    if mode=='system':return struct.pack('<4sHHB3x',b'DTI1',*image.size,3)+bytes(p[3] for p in pixels)
    mask=bytearray((n+7)//8);colors=bytearray()
    for i,(r,g,b,a) in enumerate(pixels):
        if a>=128:mask[i>>3]|=0x80>>(i&7)
        colors+=struct.pack('<H',((r>>3)<<11)|((g>>2)<<5)|(b>>3))
    return struct.pack('<4sHHB3x',b'DTI1',*image.size,2)+mask+colors

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--purpose',choices=['application','tile','notification']);p.add_argument('--mode',choices=['system','custom']);p.add_argument('--padding',type=int,default=8);p.add_argument('--config',type=Path)
    a=p.parse_args()
    if not 0<=a.padding<=30:p.error('padding must be 0..30 percent')
    a.output.mkdir(parents=True,exist_ok=True)
    sizes={'application':96,'tile':96,'notification':32,'tile-1x1':40,'tile-2x2':64,'tile-4x2':80,'tile-4x4':128}
    config=json.loads(a.config.read_text(encoding='utf-8')) if a.config else None
    if config:variants={k:sizes[k] for k in config}
    else:
        if not a.purpose or not a.mode:p.error('purpose and mode are required')
        variants={a.purpose:sizes[a.purpose]}
        if a.purpose=='tile' and a.mode=='system':variants.update({k:v for k,v in sizes.items() if k.startswith('tile-')})
    files=[]
    for name,size in variants.items():
        item=config[name] if config else dict(source=str(a.source),mode=a.mode,padding=a.padding)
        mode=item['mode'];padding=item['padding']
        if mode not in ('system','custom') or not isinstance(padding,int) or not 0<=padding<=30:raise ValueError('Invalid icon settings')
        source=load(Path(item['source']))
        if not source.getchannel('A').getbbox():p.error('image is completely transparent')
        limit=max(1,round(size*(100-2*padding)/100));scale=limit/max(source.size)
        small=source.resize((max(1,round(source.width*scale)),max(1,round(source.height*scale))),Image.Resampling.LANCZOS)
        image=Image.new('RGBA',(size,size));image.alpha_composite(small,((size-small.width)//2,(size-small.height)//2));encoded=encode(image,mode)
        (a.output/(name+'.dti')).write_bytes(encoded)
        for theme,bg,ink in [('light',(247,247,247),(31,31,31)),('dark',(17,17,17),(255,255,255))]:
            preview=Image.new('RGB',(size,size),bg)
            if mode=='system':preview.paste(ink,(0,0,size,size),image.getchannel('A'))
            else:
                values=[];maskbytes=(size*size+7)//8
                for i in range(size*size):
                    c=struct.unpack_from('<H',encoded,12+maskbytes+2*i)[0];values.append((((c>>11)&31)*255//31,((c>>5)&63)*255//63,(c&31)*255//31,255 if encoded[12+(i>>3)]&(0x80>>(i&7)) else 0))
                decoded=Image.new('RGBA',(size,size));decoded.putdata(values);preview.paste(decoded,mask=decoded.getchannel('A'))
            preview.save(a.output/(name+'-'+theme+'.png'))
        if mode=='system':image=Image.new('RGBA',(size,size),(255,255,255,0));image.putalpha(Image.frombytes('L',(size,size),encoded[12:]))
        else:image=decoded
        image.save(a.output/(name+'-transparent.png'))
        files.append(dict(file=name+'.dti',size=size))
    (a.output/'assets.json').write_text(json.dumps(dict(purpose=a.purpose,mode=a.mode,files=files),indent=2),encoding='utf-8');print(a.output/'assets.json')

if __name__=='__main__':main()
