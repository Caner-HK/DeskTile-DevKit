"use strict";
exports.settingsPath=function(levels){
    if(!Array.isArray(levels)||!levels.length||levels.length>8||levels.some(value=>typeof value!=='string'||!value||/[\x00-\x1f]/.test(value)))throw Error('Invalid settings path');
    return levels.join(' → ');
};
function escape(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function id(value){if(typeof value!=="string"||!/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(value))throw new Error("Invalid component ID");return value;}
exports.listRow=function(options){
    options=options||{};
    if(options.density!==undefined&&options.density!=='comfortable'&&options.density!=='compact')throw new Error("Invalid list density");
    const height=dimension(options.height,options.density==='compact'?54:76,32,240);
    let html='<dt-list-row id="'+id(options.id)+'" text="'+escape(options.label===undefined?'':options.label)+'" font-size="20" height="'+height+'" enabled="'+(options.enabled===false?'false':'true')+'">';
    if(options.icon!==undefined){
        if(!Number.isInteger(options.icon)||options.icon<0||options.icon>103)throw new Error("Invalid list icon");
        html+='<dt-icon icon="'+options.icon+'" width="28" height="28" slot="0"/>';
    }
    if(options.summary!==undefined){
        if(options.toggle&&options.summaryPosition!=='middle')throw new Error("Trailing summary and toggle share one slot");
        html+='<dt-text text="'+escape(options.summary)+'" font-size="20" foreground-role="3" slot="'+(options.summaryPosition==='middle'?1:2)+'"/>';
    }
    if(options.toggle){
        const toggle=options.toggle;
        html+='<dt-toggle id="'+id(toggle.id)+'" checked="'+(toggle.checked===true?'true':'false')+'" enabled="'+(toggle.enabled===false?'false':'true')+'" width="112" height="'+Math.min(height,56)+'" slot="2"/>';
    }
    return html+'</dt-list-row>';
};
exports.menu=function(options){
    options=options||{};const items=options.items||[];if(items.length>8)throw new Error("Menu item limit exceeded");
    const width=options.width===undefined?256:options.width;if(!Number.isInteger(width)||width<240||width>704)throw new Error("Invalid menu width");
    const header=options.showHeader!==false&&!!options.title, height=Math.min(376,(header?56:0)+items.length*56);
    let html='<dt-dialog id="'+id(options.id)+'" width="'+width+'" height="'+height+'" dialog-presentation="0" surface-style="4">';
    if(header)html+='<dt-column height="56" padding="12,16,12,16"><dt-text text="'+escape(options.title)+'" font-size="20" height="32" foreground-role="3"/></dt-column>';
    html+='<dt-scroll flex-grow="1"><dt-column>';
    for(const item of items){
        if(item.icon!==undefined&&(!Number.isInteger(item.icon)||item.icon<0||item.icon>103))throw new Error("Invalid menu icon");
        const ink=item.destructive?' foreground-role="2"':'';
        html+='<dt-button id="'+id(item.id)+'" accessibility-label="'+escape(item.label||'')+'" height="56" button-style="4" enabled="'+(item.enabled===false?'false':'true')+'"><dt-row height="56" padding="0,16,0,16" gap="16" alignment="1">';
        html+=item.icon===undefined?'<dt-column width="28" height="28"/>':'<dt-icon icon="'+item.icon+'" width="28" height="28"'+ink+'/>';
        html+='<dt-text text="'+escape(item.label||'')+'" font-size="20" height="56" flex-grow="1"'+ink+'/></dt-row></dt-button>';
    }
    return html+'</dt-column></dt-scroll></dt-dialog>';
};
exports.choicePolicy=function(count){
    if(!Number.isInteger(count)||count<0||count>256)throw new Error("Invalid choice count");
    return Object.freeze({opensPicker:count>=4,next:function(selected){if(!Number.isInteger(selected)||selected<0||selected>=count)throw new Error("Invalid selected index");return (selected+1)%count;}});
};
exports.listNote=function(options){
    options=options||{};return '<dt-list-note'+(options.id?' id="'+id(options.id)+'"':'')+' text="'+escape(options.text||'')+'"/>';
};
function dimension(value,fallback,minimum,maximum){if(value===undefined)return fallback;if(!Number.isInteger(value)||value<minimum||value>maximum)throw new Error("Invalid stepper dimension");return value;}
exports.confirmation=function(options){
    options=options||{};const actions=options.actions||[];
    if(actions.length<1||actions.length>3)throw new Error('Confirmation needs one to three actions');
    const width=dimension(options.width,592,240,704),maximum=dimension(options.maximumHeight,400,220,432);
    let html='<dt-dialog id="'+id(options.id)+'" width="'+width+'" max-height="'+maximum+'" dialog-presentation="1" dialog-title-divider="true" padding="24" surface-style="2" visible="'+(options.visible===true?'true':'false')+'"><dt-column gap="24" flex-grow="1"><dt-text text="'+escape(options.title||'')+'" font-size="32" height="48" margin="0,0,12,0"/><dt-scroll flex-grow="1"><dt-text text="'+escape(options.body||'')+'" font-size="20" foreground-role="4" text-wrap="true"/></dt-scroll><dt-row height="52" gap="12">';
    actions.forEach(function(action,index){
        if(action.icon!==undefined&&(!Number.isInteger(action.icon)||action.icon<0||action.icon>103))throw new Error('Invalid confirmation icon');
        html+='<dt-button id="'+id(action.id)+'" text="'+escape(action.label||'')+'" width="0" height="52" flex-grow="1" font-size="20" button-style="'+(action.destructive?2:index===actions.length-1?0:9)+'"'+(action.icon===undefined?'':' icon="'+action.icon+'"')+'/>';
    });return html+'</dt-row></dt-column></dt-dialog>';
};
exports.progress=function(options){
    options=options||{};
    if(options.style!==undefined&&options.style!=='squares'&&options.style!=='bars'&&options.style!=='determinate')throw new Error("Invalid progress style");
    if(options.style==='determinate'){
        const width=dimension(options.width,320,16,800),height=dimension(options.height,12,8,480),minimum=options.minimum===undefined?0:options.minimum,maximum=options.maximum===undefined?100:options.maximum,value=options.value===undefined?minimum:options.value;
        if([minimum,maximum,value].some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>3.4e38)||maximum<=minimum)throw new Error('Invalid progress range');
        return '<dt-progress'+(options.id?' id="'+id(options.id)+'"':'')+' progress-style="0" width="'+width+'" height="'+height+'" minimum="'+minimum+'" maximum="'+maximum+'" value="'+value+'"/>';
    }
    const bars=options.style==='bars',width=dimension(options.width,bars?48:160,16,800),height=dimension(options.height,bars?40:30,8,480),duration=dimension(options.duration,bars?600:2800,300,30000),delay=dimension(options.delay,bars?200:120,0,2000),size=dimension(options.itemSize,8,2,32),gap=dimension(options.itemGap,4,0,64);
    return '<dt-progress'+(options.id?' id="'+id(options.id)+'"':'')+' progress-style="'+(bars?2:1)+'" width="'+width+'" height="'+height+'" animation-duration="'+duration+'" animation-delay="'+delay+'" item-size="'+size+'" item-gap="'+gap+'"/>';
};
exports.numberStepper=function(options){
    options=options||{};const stem=id(options.id),width=dimension(options.width,128,64,704),buttonHeight=dimension(options.buttonHeight,52,24,128),valueHeight=dimension(options.valueHeight,52,32,128),gap=dimension(options.gap,8,0,64),font=dimension(options.numberSize,32,8,96),unitFont=dimension(options.unitSize,20,8,96),unitGap=dimension(options.unitGap,8,0,64),repeat=dimension(options.repeatInterval,100,50,2000);
    if(valueHeight<font||valueHeight<unitFont)throw new Error("Stepper value area is smaller than its font");
    if(options.symbols!==undefined&&options.symbols!=='arrows'&&options.symbols!=='plus-minus')throw new Error("Invalid stepper symbols");
    const arrows=options.symbols==='arrows';
    function button(suffix,icon){return '<dt-button id="'+id(stem+suffix)+'" icon="'+icon+'" width="'+width+'" height="'+buttonHeight+'" button-style="6" repeat-interval="'+repeat+'"/>';}
    return '<dt-column width="'+width+'" height="'+(buttonHeight*2+valueHeight+gap*2)+'" gap="'+gap+'">'+button('-up',arrows?20:39)+'<dt-row height="'+valueHeight+'" gap="'+unitGap+'" alignment="1" justification="1"><dt-text id="'+id(stem+'-value')+'" text="'+escape(options.value===undefined?'00':options.value)+'" font-size="'+font+'" height="'+valueHeight+'"/>'+(options.unit?'<dt-text text="'+escape(options.unit)+'" font-size="'+unitFont+'" height="'+valueHeight+'" foreground-role="3"/>':'')+'</dt-row>'+button('-down',arrows?21:40)+'</dt-column>';
};
