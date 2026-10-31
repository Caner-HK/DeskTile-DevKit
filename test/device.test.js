'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),core=require('../lib/core'),device=require('../lib/device');
test('serial launch validates project and port before transmitting',async()=>{
 await assert.rejects(device.monitor({port:'COM4\ndiag prepare-flash'}),{code:'PORT'});
 await assert.rejects(device.monitor({}),{code:'PORT'});
});
test('serial wrapper uses bounded logs and does not toggle reset lines',async()=>{
 const original=core.run;let args;
 core.run=async(exe,values)=>{args=values;return '';};
 try{await device.monitor({port:'COM4',logFile:'serial.log'});assert.equal(args[0],'-u');assert.ok(args[2].includes('connection.dtr=False; connection.rts=False'));assert.ok(args[2].includes('5*1024*1024'));assert.equal(args[3],'COM4');assert.equal(args[4],'');}finally{core.run=original;}
});
