const TEXT=0,VISIBLE=4,ENABLED=5,ICON=3,VALUE=7,CANVAS=29,SURFACE=31;
const handles={};
for(const id of ['error-dialog','error-title','error-body','error-close'])handles[id]=DeskTile.byId(id);
for(const id of ['page','bar','bar-title','body','content','status','clock','focus-screen','focus','one','five','fifteen','custom','start','reset','back','navigation-icon','info-dialog','info-title','info-usage','info-persistence','info-close','alarm','alarm-group','alarm-title','alarm-hint','picker','picker-cancel','picker-save','time-selector','options','pause','restart','end'])handles[id]=DeskTile.byId(id);
const language=DeskTile.createI18n('locales/catalog.json');
const launch=DeskTile.launchInfo(),exitIcon=launch?launch.exitIcon:13;
const bootId=DeskTile.bootId();
const pair=n=>String(n).padStart(2,'0'),t=(key,parameters)=>language.t(key,parameters);
const text=(id,value)=>DeskTile.setText(handles[id],TEXT,value);
const visible=(id,value)=>DeskTile.setBoolean(handles[id],VISIBLE,value);
let duration=300000,remaining=duration,deadline=0,running=false,focused=false,alarming=false;
const presetIds=['one','five','fifteen'];
let recentDurations=[60000,300000,900000];
let infoOpen=false,pickerOpen=false,optionsOpen=false,draftSeconds=300,status='ready',saveFailed=false;
let errorOpen=false;
let savedBytes=null;
let alarmHint='';
let shown=-1,fillPixel=-1,blink=-1,colors=null,press=null,optionsUntil=0,waveClock=0,waveAt=0,waveFrame=-1;

function formattedTime(){
    const seconds=Math.ceil(remaining/1000);
    if(duration>=3600000)return pair(Math.floor(seconds/3600))+':'+pair(Math.floor(seconds/60)%60)+':'+pair(seconds%60);
    if(duration>=60000)return pair(Math.floor(seconds/60))+':'+pair(seconds%60);
    return pair(seconds);
}
function displayAlarmHint(now){
    const elapsed=alarming?Math.max(0,now-deadline):0;
    let value=t('stopHint');
    if(elapsed>10000){
        const seconds=Math.floor(elapsed/1000),hours=Math.floor(seconds/3600);
        const time=(hours?pair(hours)+':':'')+pair(Math.floor(seconds/60)%60)+':'+pair(seconds%60);
        value+=t('overdue',{time});
    }
    if(value!==alarmHint){alarmHint=value;text('alarm-hint',value);}
}
function pickerRender(){
    DeskTile.setBoolean(handles['picker-save'],ENABLED,draftSeconds>0);
}
function presetLabel(ms){
    const seconds=ms/1000;
    if(seconds%60===0&&seconds<3600)return t(seconds===60?'presetMinute':'presetMinutes',{count:seconds/60});
    if(seconds<60)return t(seconds===1?'presetSecond':'presetSeconds',{count:seconds});
    return (seconds>=3600?pair(Math.floor(seconds/3600))+':':'')+pair(Math.floor(seconds/60)%60)+':'+pair(seconds%60);
}
function renderLabels(){
    const cornerBuffer=new ArrayBuffer(80),cornerView=new DataView(cornerBuffer),cornerBytes=new Uint8Array(cornerBuffer);
    cornerView.setUint32(0,80,true);cornerView.setUint32(4,1,true);
    ['hour','minute','second'].forEach((key,i)=>cornerBytes.set(DeskTile.utf8Encode(t(key)),44+i*12));
    DeskTile.setBytes(handles['time-selector'],62,cornerBuffer);
    presetIds.forEach((id,i)=>text(id,presetLabel(recentDurations[i])));
    const labels={'custom':'custom','reset':'reset','picker-cancel':'cancel','picker-save':'confirm','info-title':'about','info-usage':'usage','info-persistence':'persistence','info-close':'close','alarm-title':'expired','restart':'restart','end':'end'};
    for(const id of Object.keys(labels))text(id,t(labels[id]));
    displayAlarmHint(DeskTile.monotonicMs());
    text('bar-title',t(pickerOpen?'duration':'title'));
    text('status',t(status));
    text('error-title',t('saveFailureTitle'));text('error-body',t('saveFailed'));text('error-close',t('close'));
    text('start',t(remaining<duration?'resume':'start'));
    text('pause',t(running?'pause':'resume'));
    DeskTile.setNumber(handles.pause,ICON,running?51:50);
    DeskTile.setNumber(handles['navigation-icon'],ICON,pickerOpen?11:exitIcon);
    for(const [id,key] of [['back',pickerOpen||exitIcon!==13?'back':'home'],['clock','setDuration'],['focus','holdOptions'],['time-selector','setDuration']])DeskTile.setText(handles[id],1,t(key));
    if(typeof DeskTile.registerMenu==='function')DeskTile.registerMenu(aboutAvailable()?[{action:102,label:t('about'),icon:37,type:0}]:[]);
}
function aboutAvailable(){return !focused&&!alarming&&!pickerOpen&&!errorOpen&&!infoOpen;}
function screen(){
    visible('bar',!focused&&!alarming);visible('body',!focused&&!alarming);
    visible('focus-screen',focused&&!alarming);visible('alarm',alarming);
    visible('content',!pickerOpen);visible('picker',pickerOpen);
    visible('info-dialog',infoOpen);visible('options',optionsOpen&&!alarming);
    visible('error-dialog',errorOpen);
    DeskTile.setNumber(handles.page,SURFACE,alarming?1:focused?3:0);
    renderLabels();
}
function picker(value){
    pickerOpen=value;
    if(value){
        draftSeconds=Math.floor(duration/1000);
        const seconds=new ArrayBuffer(4);
        new DataView(seconds).setFloat32(0,draftSeconds,true);
        DeskTile.setBytes(handles['time-selector'],VALUE,seconds);
        pickerRender();
    }
    screen();
}
function paintFocus(value,height){
    if(!colors)colors=DeskTile.colorScheme();
    if(!colors)throw Error('System color scheme unavailable');
    const width=DeskTile.measureText(value,48),x=Math.floor((800-width)/2);
    const commands=[];
    function command(op,size){const bytes=new ArrayBuffer(size),view=new DataView(bytes);view.setUint8(0,op);view.setUint16(2,size,true);commands.push(bytes);return view;}
    function rect(y,h,color){if(!h)return;const v=command(1,20);v.setInt16(6,y,true);v.setInt16(8,800,true);v.setInt16(10,h,true);v.setUint32(12,color,true);}
    rect(0,480,colors.background);
    const wave=command(9,24);wave.setInt16(8,800,true);wave.setInt16(10,480,true);wave.setUint32(12,colors.accent,true);wave.setUint16(16,height,true);wave.setUint16(18,4,true);wave.setUint16(20,56,true);wave.setUint16(22,Math.floor((waveClock%4800)*65536/4800),true);
    const label=command(10,28+value.length);label.setInt16(4,x,true);label.setInt16(6,176,true);label.setInt16(8,width,true);label.setInt16(10,128,true);label.setUint32(12,colors.primaryText,true);label.setUint16(16,48,true);label.setUint16(18,value.length,true);label.setUint32(20,colors.accent,true);label.setUint32(24,colors.onAccent,true);for(let i=0;i<value.length;i++)label.setUint8(28+i,value.charCodeAt(i));
    const output=new Uint8Array(commands.reduce((n,b)=>n+b.byteLength,0));let offset=0;
    for(const bytes of commands){output.set(new Uint8Array(bytes),offset);offset+=bytes.byteLength;}
    DeskTile.setBytes(handles.focus,CANVAS,output.buffer);
}
function display(force){
    const seconds=Math.ceil(remaining/1000),height=Math.max(0,Math.min(480,Math.floor((duration-remaining)*480/duration)));
    const motion=Math.floor(waveClock/40);
    if(force||seconds!==shown||height!==fillPixel||motion!==waveFrame){shown=seconds;fillPixel=height;waveFrame=motion;const value=formattedTime();text('clock',value);if(focused)paintFocus(value,height);}
}
function save(){
    const buffer=new ArrayBuffer(44),view=new DataView(buffer);view.setUint32(0,3,true);view.setUint32(4,duration,true);view.setUint32(8,remaining,true);view.setUint32(12,running?1:0,true);view.setUint32(16,bootId,true);
    const end=running||alarming?deadline:0;view.setUint32(20,end%4294967296,true);view.setUint32(24,Math.floor(end/4294967296),true);
    recentDurations.forEach((ms,i)=>view.setUint32(32+i*4,ms,true));
    const bytes=new Uint8Array(buffer);
    if(!saveFailed&&savedBytes&&savedBytes.length===bytes.length){
        let unchanged=true;
        for(let i=0;i<bytes.length;i++)if(bytes[i]!==savedBytes[i]){unchanged=false;break;}
        if(unchanged)return;
    }
    const failed=DeskTile.storageWrite('timer-v1',buffer)!==0;
    if(!failed)savedBytes=bytes;
    if(failed&&!saveFailed)errorOpen=true;
    saveFailed=failed;visible('error-dialog',errorOpen);renderLabels();
}
function choose(ms,paint=true){duration=remaining=ms;deadline=DeskTile.monotonicMs();running=focused=alarming=optionsOpen=false;status='ready';saveFailed=false;press=null;waveClock=0;shown=fillPixel=waveFrame=-1;if(paint){screen();display(true);}}
function start(showControls=false){if(!remaining)remaining=duration;recentDurations=[duration,...recentDurations.filter(ms=>ms!==duration)].slice(0,3);waveAt=DeskTile.monotonicMs();deadline=waveAt+remaining;running=focused=true;status='running';optionsOpen=showControls;optionsUntil=waveAt+5000;press=null;screen();display(true);save();}
function tick(now){
    if(running){if(now>=waveAt)waveClock+=now-waveAt;waveAt=now;remaining=Math.max(0,Math.min(duration,deadline-now));
        if(!remaining){display(true);running=focused=false;alarming=true;optionsOpen=infoOpen=false;status='expired';press=null;blink=-1;screen();save();}}
    if(alarming){displayAlarmHint(now);const phase=Math.floor(now/500)%2;if(phase!==blink){blink=phase;visible('alarm-group',phase===0);}}
    else display(false);
}
function enter(){
    errorOpen=false;
    savedBytes=null;
    recentDurations=[60000,300000,900000];
    choose(duration,false);
    const buffer=DeskTile.storageRead('timer-v1');
    if(buffer&&(buffer.byteLength===20||buffer.byteLength===32||buffer.byteLength===44)){
        const view=new DataView(buffer),version=view.getUint32(0,true),ms=view.getUint32(4,true),left=view.getUint32(8,true),wasRunning=view.getUint32(12,true);
        if(((version===1&&buffer.byteLength===20)||(version===2&&buffer.byteLength===32)||(version===3&&buffer.byteLength===44))&&ms>=1000&&ms<=359999000&&ms%1000===0&&left<=ms&&wasRunning<=1){
            savedBytes=new Uint8Array(buffer);
            if(version===3){
                const recents=[0,1,2].map(i=>view.getUint32(32+i*4,true));
                if(recents.every((value,i)=>value>=1000&&value<=359999000&&value%1000===0&&recents.indexOf(value)===i))recentDurations=recents;
                else savedBytes=null;
            }
            choose(ms,false);remaining=left;
            if(version>=2&&(wasRunning||!left)&&bootId&&view.getUint32(16,true)===bootId){
                const end=view.getUint32(20,true)+view.getUint32(24,true)*4294967296,now=DeskTile.monotonicMs();
                if(Number.isSafeInteger(end)&&end>0){
                    if(wasRunning){remaining=Math.min(duration,Math.max(0,end-now));deadline=end;if(remaining){waveAt=now;running=focused=true;}}
                    else if(end<=now)deadline=end;
                }
            }
            if(running)status='running';else if(!remaining){status='expired';alarming=true;}else if(remaining<duration||wasRunning)status='paused';
        }
    }
    screen();display(true);tick(DeskTile.monotonicMs());
}
function update(now){
    tick(now);
    if(press&&!press.cancelled&&now>=press.at&&now-press.at>=500&&focused&&!alarming&&!optionsOpen){press.cancelled=true;optionsOpen=true;optionsUntil=now+5000;screen();}
    if(optionsOpen&&now>=optionsUntil&&!press){optionsOpen=false;screen();}
}
function onPointer(event,point){
    if(errorOpen)return;
    if(point.target!==handles.focus||!focused||alarming)return;
    if(optionsOpen)optionsUntil=point.monotonicMs+5000;
    if(event===12)press={id:point.pointerId,x:point.x,y:point.y,at:point.monotonicMs,cancelled:false};
    else if(press&&point.pointerId===press.id){if(event===13&&(Math.abs(point.x-press.x)>12||Math.abs(point.y-press.y)>12))press.cancelled=true;if(event===14||event===15)press=null;}
}
function onLifecycle(event){if(event===1||event===3)press=null;if(event===2||event===3){tick(DeskTile.monotonicMs());if(event===3)save();}}
function themeChanged(){colors=null;display(true);}
function onLanguageChanged(locale){language.select(locale);renderLabels();}
function onEvent(event,target,value){
    if(event===1&&target===handles['time-selector']){
        if(pickerOpen&&!errorOpen&&Number.isInteger(value)&&value>=0&&value<=359999){draftSeconds=value;pickerRender();}
        return;
    }
    if(event===9){if(target===102&&aboutAvailable()){infoOpen=true;screen();}return;}
    if(event!==0)return;
    if(errorOpen){if(target===handles['error-close']||target===handles.back){errorOpen=false;visible('error-dialog',false);renderLabels();}return;}
    if(alarming){if(target===handles.alarm){choose(duration);save();}return;}
    if(optionsOpen){
        optionsUntil=DeskTile.monotonicMs()+5000;
        if(target===handles.pause){tick(DeskTile.monotonicMs());if(alarming)return;if(running){running=false;status='paused';screen();save();}else start(true);return;}
        if(target===handles.restart){remaining=duration;waveClock=0;start(true);return;}
        if(target===handles.end){choose(duration);save();return;}
        return;
    }
    if(focused)return;
    if(target===handles['info-close']||(infoOpen&&target===handles.back)){infoOpen=false;screen();return;}
    if(infoOpen)return;
    if(pickerOpen){
        if(target===handles.back||target===handles['picker-cancel']){picker(false);return;}
        if(target===handles['picker-save']){if(draftSeconds){picker(false);choose(draftSeconds*1000);save();}return;}
        return;
    }
    if(target===handles.back){DeskTile.exit();return;}
    if(target===handles.start){start();return;}
    if(target===handles.reset){choose(duration);save();return;}
    if(target===handles.custom||target===handles.clock){picker(true);return;}
    const presetIndex=presetIds.findIndex(id=>target===handles[id]);
    const preset=presetIndex>=0?recentDurations[presetIndex]:0;
    if(preset){choose(preset);save();}
}
