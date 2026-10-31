"""Build a freestanding ESP32-S3 Native .dtapp using the public SDK only."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[1]
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path);parser.add_argument('output',type=Path)
    parser.add_argument('--compiler',help='Path to xtensa-esp32s3-elf-g++')
    parser.add_argument('--development',action='store_true');parser.add_argument('--signing-key',type=Path)
    args=parser.parse_args();source=args.source.resolve();output=args.output.resolve()
    compiler=args.compiler or shutil.which('xtensa-esp32s3-elf-g++')
    if not compiler:raise SystemExit('Install the ESP32-S3 Xtensa toolchain and use --compiler or PATH.')
    compiler=Path(compiler).resolve();strip=compiler.with_name(compiler.name.replace('g++','strip'))
    sources=sorted((source/'src').rglob('*.cpp'))
    if not sources:raise SystemExit('Native source/src/*.cpp is missing')
    with tempfile.TemporaryDirectory(prefix='desktile-native-build-') as directory:
        temp=Path(directory);package=temp/'package';shutil.copytree(source,package)
        runtime=temp/'support.cpp'
        runtime.write_text('''#include <stddef.h>
extern "C" void *memcpy(void *d,const void *s,size_t n){auto *a=(unsigned char*)d;auto *b=(const unsigned char*)s;for(size_t i=0;i<n;++i)a[i]=b[i];return d;}
extern "C" void *memset(void *d,int c,size_t n){auto *a=(unsigned char*)d;for(size_t i=0;i<n;++i)a[i]=(unsigned char)c;return d;}
extern "C" void *memmove(void *d,const void *s,size_t n){auto *a=(unsigned char*)d;auto *b=(const unsigned char*)s;if(a<b)for(size_t i=0;i<n;++i)a[i]=b[i];else for(size_t i=n;i;--i)a[i-1]=b[i-1];return d;}
extern "C" size_t strlen(const char *s){size_t n=0;while(s[n])++n;return n;}
extern "C" char *strcpy(char *d,const char *s){char *out=d;do{*d++=*s;}while(*s++);return out;}
extern "C" void *memchr(const void *s,int c,size_t n){auto *p=(const unsigned char*)s;for(size_t i=0;i<n;++i)if(p[i]==(unsigned char)c)return const_cast<unsigned char*>(p+i);return nullptr;}
extern "C" int strcmp(const char *a,const char *b){while(*a&&*a==*b){++a;++b;}return (unsigned char)*a-(unsigned char)*b;}
extern "C" int strncmp(const char *a,const char *b,size_t n){while(n&&*a&&*a==*b){++a;++b;--n;}return n?(unsigned char)*a-(unsigned char)*b:0;}
extern "C" int memcmp(const void *a,const void *b,size_t n){auto *x=(const unsigned char*)a;auto *y=(const unsigned char*)b;for(size_t i=0;i<n;++i)if(x[i]!=y[i])return x[i]-y[i];return 0;}
extern "C" char *strrchr(const char *s,int c){const char *last=nullptr;do{if((unsigned char)*s==(unsigned char)c)last=s;}while(*s++);return const_cast<char*>(last);}
extern "C" size_t strspn(const char *s,const char *accept){size_t n=0;for(;s[n];++n){const char *a=accept;while(*a&&*a!=s[n])++a;if(!*a)break;}return n;}
''',encoding='utf-8')
        elf=package/'app.elf'
        command=[str(compiler),'-std=c++17','-Os','-ffreestanding','-fno-builtin','-fno-tree-loop-distribute-patterns','-fno-exceptions','-fno-rtti','-fno-threadsafe-statics','-fPIC','-fvisibility=hidden','-nostdlib','-nostartfiles','-shared','-Wl,-Bsymbolic','-Wl,-e,dt_app_entry','-Wl,--gc-sections','-Wl,--no-undefined','-ffunction-sections','-fdata-sections','-I'+str(ROOT/'sdk/include'),*map(str,sources),str(runtime),'-lgcc','-o',str(elf)]
        subprocess.run(command,check=True)
        subprocess.run([str(strip),'--strip-unneeded','--remove-section=.comment','--remove-section=.got.loc','--remove-section=.dynamic','--remove-section=.xt.lit','--remove-section=.xt.prop','--remove-section=.xtensa.info',str(elf)],check=True)
        assets=package/'assets';assets.mkdir(exist_ok=True)
        for name in ('application','tile'):
            if not (assets/(name+'.dti')).exists():
                candidates=[ROOT/'resources/icons/dti/DeskTile.dti',ROOT/'build/sample-app-sources/javascript/assets'/ (name+'.dti')]
                icon=next((p for p in candidates if p.exists()),None)
                if not icon:raise SystemExit('Provide source/assets/application.dti and tile.dti')
                shutil.copyfile(icon,assets/(name+'.dti'))
        builder=ROOT/'tools/build_dtapp.py';options=['--development'] if args.development else ['--signing-key',str(args.signing_key)] if args.signing_key else []
        subprocess.run([sys.executable,str(builder),str(package),str(output),*options],check=True)
        metadata={'compiler':subprocess.check_output([str(compiler),'--version'],text=True).splitlines()[0],'elf_sha256':hashlib.sha256(elf.read_bytes()).hexdigest(),'package_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'target':'esp32s3','entry':'dt_app_entry'}
        print(json.dumps(metadata,ensure_ascii=False))
if __name__=='__main__':main()
