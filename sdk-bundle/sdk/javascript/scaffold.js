"use strict";
const navigation=require("./navigation.js");
function navigationBoolean(value,fallback){if(value===undefined)return fallback;if(typeof value!=='boolean')throw Error('Invalid navigation policy');return value;}
function navigationRect(value){if(!value||['x','y','w','h'].some(key=>!Number.isInteger(value[key])||Math.abs(value[key])>4096))throw Error('Invalid navigation viewport');return {x:value.x,y:value.y,w:Math.max(0,value.w),h:Math.max(0,value.h)};}
function escape(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function id(value){if(typeof value!=="string"||!/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(value))throw new Error("Invalid component ID");return value;}
function dimension(value,fallback,minimum,maximum){if(value===undefined)return fallback;if(!Number.isInteger(value)||value<minimum||value>maximum)throw new Error("Invalid stepper dimension");return value;}
exports.createScaffold=function(options){
    options=options||{};const stem=id(options.id);
    if(stem.length>16)throw Error('Scaffold ID exceeds child ID budget');
    const viewport=navigationRect(options.viewport||{x:0,y:0,w:800,h:480});
    if(!viewport.w||!viewport.h)throw Error('Scaffold viewport is empty');
    const statusVisible=navigationBoolean(options.statusVisible,true),appBarVisible=navigationBoolean(options.appBarVisible,true),iconWidth=dimension(options.iconWidth,96,64,4096),labelWidth=dimension(options.labelWidth,320,64,4096),holdMs=dimension(options.originalHoldMs,300,100,10000);
    let originalIcon=dimension(options.originalIcon,11,0,103);
    if(typeof options.title!=='string')throw Error('Scaffold title required');
    function entry(value){if(!value||typeof value.label!=='string')throw Error('Navigation label required');return {label:value.label,icon:dimension(value.icon,0,0,103),enabled:navigationBoolean(value.enabled,true)};}
    if(options.items!==undefined&&!Array.isArray(options.items))throw Error('Navigation items required');
    const items=(options.items||[]).map(entry),bottomCount=dimension(options.bottomCount,0,0,items.length);
    if(items.length>8)throw Error('Navigation item limit exceeded');
    const state=navigation.createNavigation(options.navigation),targetGeometry=()=>navigation.scaffoldLayout(viewport,state,{statusVisible,appBarVisible,iconWidth,labelWidth});
    const animate=navigationBoolean(options.animateNavigation,true),motion=navigation.createNavigationMotion(targetGeometry().navigation);
    let clock=0,bufferedNavigation=false;
    const geometry=()=>{const g=targetGeometry();if(animate&&!bufferedNavigation){motion.apply(g.navigation);g.content=g.navigation.content;}return g;};
    function navigationPresentation(){const g=targetGeometry(),data=new ArrayBuffer(28),v=new DataView(data);[28,g.body.x,g.body.y,g.body.w,g.body.h,g.navigation.panel.w,g.content.x-g.body.x].forEach((n,i)=>v.setInt32(i*4,n,true));return data;}
    let title=options.title,selected=items.length?0:-1,D=null,handles={},cache={},result=0,mounted=false,held=false,cancelled=false,fired=false,downAt=0,downX=0,downY=0;
    let colors={header:0xf2f2f2,primaryText:0x181818,border:0xc6c6c6,accent:0xff9900,pressed:0xc3c3c3,onPressed:0x141414};
    const key=suffix=>stem+'-'+suffix,handle=suffix=>handles[suffix]||0,ink=value=>'#'+value.toString(16).padStart(6,'0');
    const margin=r=>[Math.max(0,r.y),0,0,Math.max(0,r.x)].join(','),place=r=>' width="'+Math.max(0,r.w)+'" height="'+Math.max(0,r.h)+'" margin="'+margin(r)+'"';
    const primaryIcon=()=>!items.length||state.primary(held&&fired)==='original'?originalIcon:state.primary()==='menu-open'?93:92;
    function scheme(){if(D&&typeof D.colorScheme==='function'){const next=D.colorScheme();if(next)colors=Object.assign({},colors,next);}}
    function write(suffix,property,value,kind){
        if(!mounted||result)return;const token=suffix+':'+property,encoded=kind==='margin'?value.join(','):value;
        if(Object.prototype.hasOwnProperty.call(cache,token)&&cache[token]===encoded)return;
        let data=value;if(kind==='margin'){data=new ArrayBuffer(8);const view=new DataView(data);value.forEach((n,i)=>view.setInt16(i*2,n,true));}
        result=D[kind==='boolean'?'setBoolean':kind==='text'?'setText':kind==='color'?'setColor':kind==='margin'?'setBytes':'setNumber'](handle(suffix),property,data);
        if(!result)cache[token]=encoded;
    }
    function positioned(suffix,r){write(suffix,22,[Math.max(0,r.y),0,0,Math.max(0,r.x)],'margin');write(suffix,15,Math.max(0,r.w));write(suffix,16,Math.max(0,r.h));}
    const outcome=(action,index,consumed)=>({action:action||'none',index:index===undefined?-1:index,consumed:!!consumed,result});
    const api={state,
        get root(){return handles.root||0;},get content(){return handle('content');},get actions(){return handle('actions');},get primary(){return handle('primary');},
        item(index){return Number.isInteger(index)&&index>=0&&index<items.length?handle('item-'+index):0;},layout:geometry,
        markup(content,actions){
            if(content!==undefined&&typeof content!=='string'||actions!==undefined&&typeof actions!=='string')throw Error('Scaffold slots require component markup');
            const g=geometry(),n=g.navigation;
            let html='<dt-page id="'+stem+'" surface-style="'+(statusVisible?0:3)+'"><dt-system-bar id="'+key('bar')+'" visible="'+appBarVisible+'" height="'+g.appBar.h+'" background="'+ink(colors.header)+'"><dt-button id="'+key('primary')+'" width="'+n.primary.w+'" height="'+g.appBar.h+'" button-style="5" pointer-input="true" icon="'+primaryIcon()+'"/><dt-text id="'+key('title')+'" text="'+escape(title)+'" font-size="32" flex-grow="1" margin="0,0,0,16"/><dt-row id="'+key('actions')+'" padding="0,12,0,0" height="'+g.appBar.h+'">'+(actions||'')+'</dt-row></dt-system-bar><dt-stack id="'+key('body')+'" height="'+g.body.h+'" flex-grow="1"><dt-stack id="'+key('content')+'" margin="0,0,0,'+(g.content.x-g.body.x)+'">'+(content||'')+'</dt-stack><dt-stack id="'+key('backdrop')+'" pointer-input="true" visible="'+(state.mode==='labels')+'"/><dt-stack id="'+key('panel')+'" width="'+n.panel.w+'" pointer-input="true" visible="'+state.visible()+'" background="'+ink(colors.header)+'"><dt-stack id="'+key('top')+'"'+place({x:n.divider.x-g.body.x,y:0,w:n.divider.w,h:1})+' background="'+ink(colors.border)+'"/>';
            items.forEach((value,i)=>{const r=n.item(i,items.length,bottomCount);html+='<dt-button id="'+key('item-'+i)+'" accessibility-label="'+escape(value.label)+'" button-style="4" enabled="'+value.enabled+'" visible="'+!!r.h+'" background="'+ink(colors.header)+'"'+place({x:0,y:r.y-g.body.y,w:r.w,h:r.h})+'><dt-stack id="'+key('row-'+i)+'" width="'+r.w+'" height="'+r.h+'"><dt-stack id="'+key('mark-'+i)+'" visible="'+(selected===i)+'" width="4" height="32" margin="16,0,0,0" background="'+ink(colors.accent)+'"/><dt-icon id="'+key('icon-'+i)+'" icon="'+value.icon+'" width="32" height="32" margin="16,0,0,32" foreground-role="6"/><dt-text id="'+key('label-'+i)+'" text="'+escape(value.label)+'" font-size="20" height="64" margin="0,16,0,96" foreground-role="6" visible="'+(state.mode==='labels')+'"/></dt-stack></dt-button>';});
            const b=n.bottomDivider(items.length,bottomCount);return html+'<dt-stack id="'+key('bottom')+'" visible="'+!!b.w+'"'+place({x:b.x-g.body.x,y:b.y-g.body.y,w:b.w,h:b.h})+' background="'+ink(colors.border)+'"/></dt-stack></dt-stack></dt-page>';
        },
        mount(bridge,content,actions){
            if(mounted)return -6;if(!bridge||typeof bridge.loadDocument!=='function'||typeof bridge.byId!=='function')throw Error('Scaffold bridge required');
            if(bridge.features&&bridge.features.pointerInput===false)return -2;
            D=bridge;if(options.originalIcon===undefined&&typeof D.launchInfo==='function'){const launch=D.launchInfo();if(launch&&Number.isInteger(launch.exitIcon)&&launch.exitIcon>=0&&launch.exitIcon<=103)originalIcon=launch.exitIcon;}scheme();result=D.loadDocument(api.markup(content,actions));if(result)return result;
            handles={root:D.byId(stem)};for(const suffix of ['bar','primary','title','actions','body','content','backdrop','panel','top','bottom'])handles[suffix]=D.byId(key(suffix));
            for(let i=0;i<items.length;++i)for(const part of ['item','row','mark','icon','label'])handles[part+'-'+i]=D.byId(key(part+'-'+i));
            bufferedNavigation=animate&&typeof D.setBytes==='function'&&D.setBytes(handles.root,63,navigationPresentation())===0;
            mounted=true;cache={};return api.refresh();
        },
        refresh(){
            result=0;if(!mounted)return 0;scheme();if(animate&&!bufferedNavigation)motion.advance(targetGeometry().navigation,clock);const g=geometry(),n=g.navigation;
            if(bufferedNavigation){result=D.setBytes(handles.root,63,navigationPresentation());if(result)return result;}
            write('bar',11,colors.header,'color');write('primary',11,held&&!cancelled?colors.pressed:colors.header,'color');write('primary',10,held&&!cancelled?colors.onPressed:colors.primaryText,'color');write('primary',3,primaryIcon());write('title',10,colors.primaryText,'color');write('title',0,title,'text');
            write('content',22,[0,0,0,g.content.x-g.body.x],'margin');write('backdrop',4,state.mode==='labels'||motion.moving(),'boolean');write('panel',4,n.panel.w>0,'boolean');write('panel',15,n.panel.w);write('panel',11,colors.header,'color');
            positioned('top',{x:n.divider.x-g.body.x,y:0,w:n.divider.w,h:1});write('top',11,colors.border,'color');
            const b=n.bottomDivider(items.length,bottomCount);write('bottom',4,!!b.w,'boolean');positioned('bottom',{x:b.x-g.body.x,y:b.y-g.body.y,w:b.w,h:b.h});write('bottom',11,colors.border,'color');
            items.forEach((value,i)=>{const r=n.item(i,items.length,bottomCount),suffix='item-'+i;
                write(suffix,4,!!r.h,'boolean');write(suffix,5,value.enabled,'boolean');write(suffix,11,colors.header,'color');write(suffix,1,value.label,'text');positioned(suffix,{x:0,y:r.y-g.body.y,w:r.w,h:r.h});
                write('row-'+i,15,r.w);write('row-'+i,16,r.h);
                write('mark-'+i,4,selected===i,'boolean');write('mark-'+i,11,colors.accent,'color');write('icon-'+i,3,value.icon);write('label-'+i,4,n.panel.w>iconWidth,'boolean');write('label-'+i,15,Math.max(0,labelWidth-112));write('label-'+i,0,value.label,'text');
            });return result;
        },
        select(index){if(!Number.isInteger(index)||index<0||index>=items.length||!items[index].enabled)return -3;selected=index;return api.refresh();},
        setTitle(value){if(typeof value!=='string')throw Error('Scaffold title required');title=value;return api.refresh();},
        setEntry(index,value){if(!Number.isInteger(index)||index<0||index>=items.length)return -3;items[index]=entry(value);return api.refresh();},
        activate(target){result=0;if(!mounted)return outcome();if(motion.moving())return outcome('none',-1,true);for(let i=0;i<items.length;++i)if(target===handle('item-'+i)||target===key('item-'+i)){if(!state.visible()||!items[i].enabled||!geometry().navigation.item(i,items.length,bottomCount).h)return outcome('none',-1,true);selected=i;state.selected();api.refresh();return outcome('selected',i,true);}return outcome();},
        event(type,target){return type===0?api.activate(target):outcome();},
        pointer(type,e){
            result=0;if([12,13,14,15].indexOf(type)<0||!e||![e.x,e.y].every(Number.isInteger)||!Number.isFinite(e.monotonicMs))return outcome();
            clock=e.monotonicMs;if(motion.moving())return outcome('none',-1,true);
            if(e.target===handle('backdrop')&&mounted){if(type===14){state.dismiss();api.refresh();}return outcome('none',-1,true);}
            if(e.target===handle('panel')&&mounted)return outcome('none',-1,true);
            if(!appBarVisible||e.target!==handle('primary')||!mounted)return outcome();
            let action='none';if(type===12){held=true;cancelled=fired=false;downAt=e.monotonicMs;downX=e.x;downY=e.y;}
            else if(type===15){held=false;cancelled=true;}
            else if(type===13&&held){if(Math.abs(e.x-downX)>12||Math.abs(e.y-downY)>12)cancelled=true;}
            else if(type===14&&held){held=false;const r=geometry().navigation.primary;if(!cancelled&&!fired&&e.monotonicMs>=downAt&&e.x>=r.x&&e.x<r.x+r.w&&e.y>=r.y&&e.y<r.y+r.h){if(e.monotonicMs-downAt>=holdMs||!items.length||!state.policy.primaryOpens)action='original';else state.toggle();}}
            api.refresh();return outcome(action,-1,true);
        },
        tick(now){result=0;if(!Number.isFinite(now))return outcome();clock=now;const changed=animate&&!bufferedNavigation&&motion.moving()&&motion.advance(targetGeometry().navigation,now);if(changed)api.refresh();if(held&&!cancelled&&!fired&&now>=downAt&&now-downAt>=holdMs){fired=true;api.refresh();return outcome('original',-1,true);}return outcome('none',-1,changed);},
        destroy(){result=mounted?D.destroy(handles.root):0;mounted=false;held=false;handles={};cache={};D=null;return result;}
    };return Object.freeze(api);
};
