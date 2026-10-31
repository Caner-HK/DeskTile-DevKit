'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const core=require('../lib/core');
test('file push/pull preserves paths, commits atomically and roundtrips through FTP sockets',async()=>{
 const result=await core.run(process.env.DESKTILE_PYTHON||'python',[path.join(__dirname,'file_transfer_test.py')]);
 assert.match(result,/Ran 4 tests/);assert.match(result,/OK/);
});
