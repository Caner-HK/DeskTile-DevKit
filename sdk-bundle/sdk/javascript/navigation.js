"use strict";
function navigationProgress(time){
    if(time<=0)return 0;if(time>=1)return 1;
    let low=0,high=1;
    for(let i=0;i<16;i++){const t=(low+high)*0.5,s=1-t,x=3*s*s*t*0.1+3*s*t*t*0.2+t*t*t;if(x<time)low=t;else high=t;}
    const t=(low+high)*0.5,s=1-t;return 3*s*s*t*0.9+3*s*t*t+t*t*t;
}
function dimension(value,fallback,minimum,maximum){if(value===undefined)return fallback;if(!Number.isInteger(value)||value<minimum||value>maximum)throw new Error("Invalid navigation dimension");return value;}
const navigationModes=['hidden','icons','labels'];
function navigationMode(value,fallback){if(value===undefined)return fallback;if(navigationModes.indexOf(value)<0)throw Error('Invalid navigation mode');return value;}
function navigationBoolean(value,fallback){if(value===undefined)return fallback;if(typeof value!=='boolean')throw Error('Invalid navigation policy');return value;}
function navigationRect(value){if(!value||['x','y','w','h'].some(key=>!Number.isInteger(value[key])||Math.abs(value[key])>4096))throw Error('Invalid navigation viewport');return {x:value.x,y:value.y,w:Math.max(0,value.w),h:Math.max(0,value.h)};}
exports.createNavigation=function(options){
    options=options||{};
    const p={initial:navigationMode(options.initial,'hidden'),opened:navigationMode(options.opened,'labels'),dismissed:navigationMode(options.dismissed,'hidden'),permanentIcons:navigationBoolean(options.permanentIcons,false),primaryOpens:navigationBoolean(options.primaryOpens,true),allowHideIcons:navigationBoolean(options.allowHideIcons,true),dismissIconsOnSelection:navigationBoolean(options.dismissIconsOnSelection,true)};
    if(p.opened==='hidden')p.opened='icons';if(p.dismissed==='labels')p.dismissed='icons';
    if(p.permanentIcons){p.allowHideIcons=false;p.dismissed='icons';if(p.initial==='hidden')p.initial='icons';if(p.opened==='icons')p.primaryOpens=false;}
    let mode=p.initial,userOpened=false,collapsedToIcons=false;
    const policy=Object.freeze(p),api={
        get mode(){return mode;},policy,
        visible(){return mode!=='hidden';},
        canClose(){return mode==='labels'||mode==='icons'&&p.allowHideIcons&&!p.permanentIcons;},
        primary(heldOriginal){if(heldOriginal||!p.primaryOpens)return 'original';return userOpened&&api.canClose()?'menu-open':'menu';},
        toggle(){
            if(!p.primaryOpens)return false;const old=mode;
            if(mode==='hidden'){mode=p.opened;userOpened=true;}
            else if(mode==='labels')api.dismiss();
            else if(collapsedToIcons&&p.allowHideIcons&&!p.permanentIcons){mode='hidden';userOpened=collapsedToIcons=false;}
            else if(p.opened==='labels'){mode='labels';userOpened=true;collapsedToIcons=false;}
            else if(api.canClose()){mode='hidden';userOpened=false;}
            return old!==mode;
        },
        dismiss(){const old=mode;if(mode==='labels'){mode=p.dismissed;if(mode==='icons')collapsedToIcons=true;}else if(api.canClose())mode='hidden';if(mode==='hidden')userOpened=collapsedToIcons=false;return old!==mode;},
        selected(){return mode==='labels'||p.dismissIconsOnSelection?api.dismiss():false;},
        occupiedWidth(iconWidth){iconWidth=dimension(iconWidth,96,0,4096);return mode==='icons'||mode==='labels'&&(p.permanentIcons||p.dismissed==='icons')?iconWidth:0;},
        layout(body,options){return navigationLayout(body,api,options);}
    };return Object.freeze(api);
};
function navigationLayout(body,state,options){
    body=navigationRect(body);options=options||{};
    const iconWidth=Math.min(body.w,Math.max(64,dimension(options.iconWidth,96,0,4096))),labelWidth=Math.max(iconWidth,Math.min(body.w,dimension(options.labelWidth,320,0,4096))),bar=dimension(options.appBarHeight,72,0,4096);
    const panel={x:body.x,y:body.y,w:state.visible()?state.mode==='labels'?labelWidth:iconWidth:0,h:body.h},occupied=Math.min(body.w,state.occupiedWidth(iconWidth)),inset=Math.floor(iconWidth/6);
    const divider={x:body.x+inset,y:body.y,w:Math.max(0,panel.w-inset*2),h:1};
    function item(index,count,bottomCount){bottomCount=bottomCount===undefined?0:bottomCount;if([index,count,bottomCount].some(n=>!Number.isInteger(n)||n<0)||!panel.w||index>=count||bottomCount>count)return {x:0,y:0,w:0,h:0};
            const topCount=count-bottomCount,y=index<topCount?panel.y+8+index*64:panel.y+panel.h-8-(count-index)*64;
            return y<panel.y||y+64>panel.y+panel.h||index>=topCount&&y<panel.y+8+topCount*64?{x:0,y:0,w:0,h:0}:{x:panel.x,y,w:panel.w,h:64};
    }
    return {primary:{x:body.x,y:body.y-bar,w:iconWidth,h:bar},panel,content:{x:body.x+occupied,y:body.y,w:body.w-occupied,h:body.h},divider,rowHeight:64,padding:8,item,
        indicator(item){return {x:item.x,y:item.y+Math.trunc((item.h-32)/2),w:4,h:32};},
        bottomDivider(count,bottomCount){if(!bottomCount||bottomCount>count)return {x:0,y:0,w:0,h:0};const first=item(count-bottomCount,count,bottomCount);return first.h?{x:divider.x,y:first.y,w:divider.w,h:1}:{x:0,y:0,w:0,h:0};}
    };
}
exports.scaffoldLayout=function(viewport,state,options){
    viewport=navigationRect(viewport);if(!state||typeof state.layout!=='function')throw Error('Navigation state required');options=options||{};
    const status=navigationBoolean(options.statusVisible,true)?Math.min(32,viewport.h):0,bar=navigationBoolean(options.appBarVisible,true)?Math.min(72,viewport.h-status):0;
    const body={x:viewport.x,y:viewport.y+status+bar,w:viewport.w,h:viewport.h-status-bar},navigation=state.layout(body,{iconWidth:options.iconWidth,labelWidth:options.labelWidth,appBarHeight:bar});
    return {statusBar:{x:viewport.x,y:viewport.y,w:viewport.w,h:status},appBar:{x:viewport.x,y:viewport.y+status,w:viewport.w,h:bar},body,content:navigation.content,navigation};
};

exports.createNavigationMotion=function(initial){
    let width=initial.panel.w,inset=initial.content.x-initial.panel.x,targetWidth=width,targetInset=inset;
    let fromWidth=width,fromInset=inset,started=0,duration=0,moving=false,expanding=false;
    return {
        moving:()=>moving,
        advance(target,now){
            const oldWidth=width,oldInset=inset;
            const oldMoving=moving;
            if(moving){
                const t=Math.max(0,Math.min(1,(now-started)/duration));
                const amount=navigationProgress(t);
                width=fromWidth+Math.round((targetWidth-fromWidth)*amount);
                inset=fromInset+Math.round((targetInset-fromInset)*amount);
                if(t>=1){width=targetWidth;inset=targetInset;moving=false;}
            }
            const nextInset=target.content.x-target.panel.x;
            if(targetWidth!==target.panel.w||targetInset!==nextInset){
                fromWidth=width;fromInset=inset;targetWidth=target.panel.w;targetInset=nextInset;
                expanding=targetWidth>fromWidth;duration=expanding?350:120;started=now;
                moving=width!==targetWidth||inset!==targetInset;
            }
            return moving||oldMoving!==moving||oldWidth!==width||oldInset!==inset;
        },
        apply(layout){
            const total=layout.content.w+layout.content.x-layout.panel.x;
            layout.panel.w=Math.max(0,Math.min(total,width));
            layout.content.x=layout.panel.x+Math.max(0,Math.min(total,inset));
            layout.content.w=total-(layout.content.x-layout.panel.x);
            layout.divider.w=Math.max(0,layout.panel.w-2*(layout.divider.x-layout.panel.x));
            return layout;
        }
    };
};
