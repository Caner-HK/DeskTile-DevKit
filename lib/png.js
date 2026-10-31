'use strict';
const zlib=require('node:zlib');
function crc32(b){let n=0xffffffff;for(const v of b){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([size,t,data,crc]);}
function rgb565ToPng(input,width,height){
 if(input.length!==width*height*2)throw Error('Invalid renderer frame size');
 const raw=Buffer.alloc(height*(1+width*3)),header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=input.readUInt16LE((y*width+x)*2),p=y*(width*3+1)+1+x*3;raw[p]=Math.round(((v>>11)&31)*255/31);raw[p+1]=Math.round(((v>>5)&63)*255/63);raw[p+2]=Math.round((v&31)*255/31);}
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
module.exports={rgb565ToPng};
