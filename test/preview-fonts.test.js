'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const kit=path.resolve(__dirname,'..'),repo=path.dirname(kit);
test('preview font pack contains only declared general fonts and preserves original UI pixels',()=>{
 const pack=fs.readFileSync(path.join(kit,'renderer/ui-fonts.pack'));
 const inventory=JSON.parse(fs.readFileSync(path.join(kit,'renderer/font-inventory.json')));
 const source=fs.readFileSync(path.join(repo,'src/graphics/UiNativeGlyphs.h'),'utf8');
 const original=fs.readFileSync(path.join(repo,'assets/fonts/ui-fonts.pack'));
 assert.equal(pack.subarray(0,8).toString(),'DTUIF002');
 assert.deepEqual(crypto.createHash('sha256').update(pack.subarray(40)).digest(),pack.subarray(8,40));
 assert.equal(inventory.fonts.length,25);
 assert.deepEqual([...new Set(inventory.fonts.map(f=>f.family))].sort(),['Cabin','MiSans','Noto Sans','Source Serif 4'].sort());
 for(const font of inventory.fonts){
  const pixels=pack.subarray(font.offset,font.offset+font.bytes);
  assert.equal(pixels.length,font.bytes);
  assert.equal(crypto.createHash('sha256').update(pixels).digest('hex'),font.sha256);
  const fields=source.match(new RegExp('inline constexpr Font font'+font.name+'\\{([^}]+)\\}'))[1].split(',');
  const start=Number(fields[5]),bytes=Number(fields[6]);
  assert.deepEqual(pixels,original.subarray(start,start+bytes),font.name);
 }
 const canvas=fs.readFileSync(path.join(kit,'build/interactive/src/graphics/Canvas.cpp'),'utf8');
 assert.doesNotMatch(canvas,/MtrPidsHostFontCache|mtrpids_typeface/);
 const header=fs.readFileSync(path.join(kit,'build/interactive/src/graphics/UiNativeGlyphs.h'),'utf8');
 assert.doesNotMatch(header,/fonthk|pixelshk|glyphshk|fontgds|pixelsgds|glyphsgds/);
});
