'use strict';
const core=require('./core'),path=require('node:path');
async function transfer(mode,source,destination,options={}){
 if(!['push','pull'].includes(mode)||!source||!destination||!options.host)
  throw new core.DevKitError('ARGUMENT','Specify source, destination and --host for push or pull.');
 const args=[path.join(__dirname,'file-transfer.py'),mode,source,destination,'--host',options.host];
 if(options.port)args.push('--port',String(options.port));
 if(options.user)args.push('--user',options.user);
 return JSON.parse(await core.run(options.python||process.env.DESKTILE_PYTHON||'python',args,{...options,log:undefined}));
}
module.exports={transfer};
