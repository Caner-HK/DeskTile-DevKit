'use strict';
const core=require('./core'),path=require('node:path');
const LIST='import json; from serial.tools import list_ports; print(json.dumps([{\"port\":p.device,\"description\":p.description,\"serialNumber\":p.serial_number} for p in list_ports.comports()]))';
const SESSION=String.raw`
import sys,time,os
import serial
port,command,logfile=sys.argv[1:4]
log=None
try:
    connection=serial.Serial(port=None,baudrate=115200,timeout=0.1,write_timeout=2)
    connection.dtr=False; connection.rts=False; connection.port=port
    connection.open()
    with connection:
        if command:
            connection.write((command+'\n').encode('ascii')); connection.flush()
            print('Launch command sent. Verify the application on the device.',flush=True)
        else:
            print('Monitoring '+port+' at 115200. Stop to release the port.',flush=True)
        if logfile:
            os.makedirs(os.path.dirname(os.path.abspath(logfile)),exist_ok=True)
            log=open(logfile,'ab')
        deadline=time.monotonic()+2 if command else None
        while deadline is None or time.monotonic()<deadline:
            data=connection.read(4096)
            if data:
                sys.stdout.buffer.write(data);sys.stdout.buffer.flush()
                if log:
                    if log.tell()+len(data)>5*1024*1024:
                        log.close();os.replace(logfile,logfile+'.1');log=open(logfile,'wb')
                    log.write(data);log.flush()
except KeyboardInterrupt: pass
finally:
    if log:log.close()
`;
function port(value){if(typeof value!=='string'||!value.trim()||/[\r\n\x00]/.test(value))throw new core.DevKitError('PORT','Specify a serial port with --port.');return value;}
async function devices(options={}){const s=await core.run(options.python||process.env.DESKTILE_PYTHON||'python',['-c',LIST],{...options,log:undefined});return JSON.parse(s);}
async function session(command,options={}){
 await core.run(options.python||process.env.DESKTILE_PYTHON||'python',['-u','-c',SESSION,port(options.port),command,options.logFile?path.resolve(options.logFile):''],options);
 return {port:options.port,commandSent:!!command};
}
async function launch(directory,options={}){const p=core.project(directory);return session('diag open-app '+p.manifest.id,options);}
async function monitor(options={}){return session('',options);}
async function transport(mode,options={}){
 const args=['-u',path.join(__dirname,'device-session.py'),mode,port(options.port)];
 if(options.package)args.push('--package',path.resolve(options.package));
 if(options.seconds!==undefined){const seconds=Number(options.seconds);if(!Number.isInteger(seconds)||seconds<0)throw new core.DevKitError('DURATION','Seconds must be a non-negative integer.');args.push('--seconds',String(seconds));}
 let pending='',last;
 const log=chunk=>{options.log?.(chunk);pending+=chunk;const lines=pending.split('\n');pending=lines.pop();for(const line of lines){try{const value=JSON.parse(line);last=value;options.onSample?.(value);}catch{}}};
 await core.run(options.python||process.env.DESKTILE_PYTHON||'python',args,{...options,log});
 return last;
}
async function install(file,options={}){core.inspect(file);return transport('install',{...options,package:file});}
async function profile(options={}){return transport('profile',options);}
module.exports={devices,launch,monitor,install,profile};
