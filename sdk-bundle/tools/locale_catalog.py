"""Validate the optional, versioned application-language resource profile."""
import json
import re
from pathlib import Path, PurePosixPath

def normalize_tag(value):
    if not isinstance(value,str) or len(value)>31 or not re.fullmatch(r'[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*',value):
        raise ValueError('invalid language tag')
    output=[];script=region=variants=False
    for index,part in enumerate(value.split('-')):
        result=part.lower()
        if index:
            if not variants and not script and not region and re.fullmatch('[A-Za-z]{4}',part):script=True;result=part.title()
            elif not variants and not region and re.fullmatch(r'[A-Za-z]{2}|[0-9]{3}',part):region=True;result=part.upper()
            else:
                if len(part)<5 and not re.fullmatch(r'[0-9][A-Za-z0-9]{3}',part):raise ValueError('unsupported language subtag')
                variants=True
            if result.lower() in [p.lower() for p in output]:raise ValueError('duplicate language subtag')
        output.append(result)
    return '-'.join(output)

def parameters(text):
    if not isinstance(text,str) or '\0' in text or len(text.encode('utf-8'))>1024:raise ValueError('invalid message text')
    names=set();at=0
    while at<len(text):
        if text[at:at+2] in ('{{','}}'):at+=2;continue
        if text[at]=='{':
            end=text.find('}',at+1);name=text[at+1:end]
            if end<0 or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]{0,31}',name):raise ValueError('invalid message parameter')
            names.add(name);at=end+1
        elif text[at]=='}':raise ValueError('unmatched message brace')
        else:at+=1
    return frozenset(names)

def _object(pairs):
    result={}
    for key,value in pairs:
        if key in result:raise ValueError('duplicate JSON key')
        result[key]=value
    return result

def _read(path,maximum):
    if path.stat().st_size>maximum:raise ValueError('language resource exceeds its budget')
    return json.loads(path.read_text(encoding='utf-8'),object_pairs_hook=_object)

def validate_catalog(root:Path):
    catalog_path=root/'locales/catalog.json'
    if not catalog_path.exists():return
    if not catalog_path.resolve().is_relative_to(root.resolve()):raise ValueError('language catalog escapes the package')
    meta=_read(catalog_path,2048)
    if not isinstance(meta,dict) or set(meta)!={'schema','default','locales'} or type(meta['schema']) is not int or meta['schema']!=1:raise ValueError('invalid language catalog schema')
    locales=meta['locales']
    if not isinstance(locales,dict) or not 1<=len(locales)<=8 or meta['default'] not in locales:raise ValueError('invalid supported languages')
    signatures={}
    for tag,name in locales.items():
        if normalize_tag(tag)!=tag or not isinstance(name,str) or not name.startswith('locales/') or len(name.encode('utf-8'))>127 or PurePosixPath(name).as_posix()!=name or any(part in ('','.','..') for part in name.split('/')) or '\\' in name or ':' in name or any(ord(c)<32 for c in name):raise ValueError('invalid language resource path or tag')
        path=root/Path(*PurePosixPath(name).parts)
        if not path.resolve().is_relative_to(root.resolve()) or not path.is_file():raise ValueError('language resource unavailable')
        messages=_read(path,16384)
        if not isinstance(messages,dict) or not messages or len(messages)>256:raise ValueError('invalid message catalog')
        signature={}
        for key,value in messages.items():
            if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_.-]{0,62}',key) or key in ('constructor','__proto__'):raise ValueError('invalid stable message key')
            forms=[value] if isinstance(value,str) else list(value.values()) if isinstance(value,dict) and 'other' in value and set(value)<={'one','other'} else []
            if not forms:raise ValueError('invalid plural message')
            names=[parameters(text) for text in forms]
            if any(item!=names[0] for item in names):raise ValueError('plural parameter mismatch')
            signature[key]=names[0]
        signatures[tag]=signature
    default=signatures[meta['default']]
    if any(signature!=default for signature in signatures.values()):raise ValueError('translated keys or parameters differ from the default catalog')
