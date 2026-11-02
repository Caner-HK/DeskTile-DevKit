'use strict';
const path=require('node:path'),{spawn}=require('node:child_process');
const {DevKitError}=require('./core'),{t}=require('./i18n');
class DocumentationServer{
 constructor({root,port=8800,log=()=>{},onChange=()=>{},spawnProcess=spawn,startupMs=5000}){
  Object.assign(this,{root,port,log,onChange,spawnProcess,startupMs});this.child=null;this.starting=null;this.stopping=null;this.cancelStart=null;
 }
 get running(){return this.child!==null;}
 start(){
  if(this.stopping)return this.stopping.then(()=>this.start());
  if(this.starting)return this.starting;
  const url='http://127.0.0.1:'+this.port+'/';if(this.child)return Promise.resolve(url);
  let child;try{child=this.spawnProcess(process.execPath,[path.join(this.root,'bin/desktile.js'),'docs','--port',String(this.port)],{windowsHide:true,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}});}catch(error){return Promise.reject(error);}
  this.child=child;this.onChange();child.stderr.on('data',data=>this.log(data.toString()));
  child.once('close',()=>{if(this.child===child){this.child=null;this.onChange();}});
  const ready=new Promise((resolve,reject)=>{
   let output='',settled=false;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);child.stdout.off('data',data);child.off('error',failed);child.off('exit',exited);this.cancelStart=null;error?reject(error):resolve(url);};
   const data=value=>{output+=value.toString();if(output.includes(url+'\n')||output.includes(url+'\r\n'))finish();};
   const failed=error=>finish(error),exited=code=>finish(new Error(t('Documentation server exited {0}',code)));
   const timer=setTimeout(()=>finish(new Error(t('Documentation server did not start.'))),this.startupMs);
   this.cancelStart=()=>finish(new DevKitError('CANCELLED',t('Operation cancelled.')));
   child.stdout.on('data',data);child.once('error',failed);child.once('exit',exited);
  });
  const pending=ready.catch(async error=>{await this.stop();throw error;}).finally(()=>{if(this.starting===pending)this.starting=null;});
  this.starting=pending;return pending;
 }
 stop(){
  if(this.stopping)return this.stopping;
  const child=this.child;if(!child)return Promise.resolve(false);
  this.cancelStart?.();
  const pending=new Promise((resolve,reject)=>{
   const closed=()=>{child.off('error',failed);resolve(true);},failed=error=>{child.off('close',closed);reject(error);};
   child.once('close',closed);child.once('error',failed);try{child.kill();}catch(error){failed(error);}
  }).finally(()=>{if(this.stopping===pending)this.stopping=null;});
  this.stopping=pending;return pending;
 }
 dispose(){this.stop().catch(error=>this.log(error.message+'\n'));}
}
module.exports={DocumentationServer};
