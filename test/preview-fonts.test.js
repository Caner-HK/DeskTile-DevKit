'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const kit=path.resolve(__dirname,'..'),repo=process.env.DESKTILE_SYSTEM_SOURCE||path.dirname(kit);
const pack=()=>fs.readFileSync(path.join(kit,'renderer/ui-fonts.pack')),inventory=()=>JSON.parse(fs.readFileSync(path.join(kit,'renderer/font-inventory.json')));
test('preview font pack contains only declared general fonts and matches every published pixel checksum',()=>{
 const data=pack(),fonts=inventory().fonts;
 assert.equal(data.subarray(0,8).toString(),'DTUIF002');
 assert.deepEqual(crypto.createHash('sha256').update(data.subarray(40)).digest(),data.subarray(8,40));
 assert.equal(fonts.length,25);
 assert.deepEqual([...new Set(fonts.map(f=>f.family))].sort(),['Cabin','MiSans','Noto Sans','Source Serif 4'].sort());
 for(const font of fonts){
  const pixels=data.subarray(font.offset,font.offset+font.bytes);
  assert.equal(pixels.length,font.bytes);
  assert.equal(crypto.createHash('sha256').update(pixels).digest('hex'),font.sha256);
  assert.doesNotMatch(font.name,/hk|gds|myriad|lisong/i);
 }
});
const provenance=fs.existsSync(path.join(repo,'src/graphics/UiNativeGlyphs.h'))&&fs.existsSync(path.join(repo,'assets/fonts/ui-fonts.pack'));
test('preview font pixels and compiled sources match the optional firmware source tree',{skip:!provenance},()=>{
 const data=pack(),fonts=inventory().fonts,source=fs.readFileSync(path.join(repo,'src/graphics/UiNativeGlyphs.h'),'utf8'),original=fs.readFileSync(path.join(repo,'assets/fonts/ui-fonts.pack'));
 for(const font of fonts){
  const fields=source.match(new RegExp('inline constexpr Font font'+font.name+'\\{([^}]+)\\}'))[1].split(',');
  const start=Number(fields[5]),bytes=Number(fields[6]);
  assert.deepEqual(data.subarray(font.offset,font.offset+font.bytes),original.subarray(start,start+bytes),font.name);
 }
 const build=fs.existsSync(path.join(kit,'build/interactive/src/graphics/Canvas.cpp'))?path.join(kit,'build/interactive'):path.join(repo,'devkit/build/interactive');
 const canvas=fs.readFileSync(path.join(build,'src/graphics/Canvas.cpp'),'utf8');
 assert.doesNotMatch(canvas,/MtrPidsHostFontCache|mtrpids_typeface/);
 const header=fs.readFileSync(path.join(build,'src/graphics/UiNativeGlyphs.h'),'utf8');
 assert.doesNotMatch(header,/fonthk|pixelshk|glyphshk|fontgds|pixelsgds|glyphsgds/);
});
