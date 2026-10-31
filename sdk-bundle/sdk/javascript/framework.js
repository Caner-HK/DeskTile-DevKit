/* DeskTile package-scoped modules, templates and page navigation. */
(function (D) {
    "use strict";
    const modules = Object.create(null);
    let moduleCount = 0, moduleBytes = 0;
    function path(value, parent) {
        if (typeof value !== "string" || !value || value[0] === "/") throw new Error("Invalid package path");
        for (let i=0;i<value.length;++i) if(value.charCodeAt(i)<32||value[i]==="\\"||value[i]===":") throw new Error("Invalid package path");
        const parts = value[0] === "." && parent ? parent.split("/").slice(0, -1) : [];
        for (const part of value.split("/")) {
            if (!part || part === ".") continue;
            if (part === "..") { if (!parts.length) throw new Error("Package path escapes root"); parts.pop(); }
            else parts.push(part);
        }
        const result = parts.join("/");
        if (!result || result.length > 127) throw new Error("Invalid package path");
        return result;
    }
    const decode = D._decodeUtf8;
    function textBytes(text) {
        let bytes=0;
        for(const c of text){const cp=c.codePointAt(0);if(cp>=55296&&cp<=57343)throw Error('Invalid UTF-8 text');bytes+=cp<128?1:cp<2048?2:cp<65536?3:4;}
        return bytes;
    }
    D.utf8Encode=function(value){
        const out=[];for(const c of String(value)){const p=c.codePointAt(0);if(p>=0xd800&&p<=0xdfff)throw new Error("Invalid UTF-8 text");
            if(p<128)out.push(p);else if(p<2048)out.push(192|(p>>6),128|(p&63));else if(p<65536)out.push(224|(p>>12),128|((p>>6)&63),128|(p&63));else out.push(240|(p>>18),128|((p>>12)&63),128|((p>>6)&63),128|(p&63));}
        return new Uint8Array(out);
    };
    D.utf8Decode=function(value){if(!(value instanceof ArrayBuffer)&&!(value instanceof Uint8Array))throw Error('UTF-8 bytes required');return decode(value);};
    D.resourceText = function (name, maximum) {
        name = path(name); const bytes = D.resourceSize(name), limit = maximum === undefined ? 65536 : maximum;
        if (!Number.isInteger(limit) || limit < 1 || limit > 65536 || bytes < 0 || bytes > limit) throw new Error("Resource exceeds text budget");
        const data = D.resourceRead(name); if (data === null || data.byteLength !== bytes) throw new Error("Resource unavailable or incomplete: " + name);
        return decode(data);
    };
    D.resourceJson = function (name) { return JSON.parse(D.resourceText(name)); };
    function requireModule(name, parent) {
        name = path(name, parent); if (!/\.(js|json)$/.test(name)) name += ".js";
        if (modules[name]) return modules[name].exports;
        const code = D.resourceText(name), bytes = D.resourceSize(name);
        if (moduleCount >= 32 || moduleBytes + bytes > 262144) throw new Error("Module budget exhausted");
        const module = { exports: {} }; modules[name] = module; ++moduleCount; moduleBytes += bytes;
        try {
            if (name.endsWith(".json")) module.exports = JSON.parse(code);
            else Function("require", "module", "exports", "DeskTile", code)(value => requireModule(value, name), module, module.exports, D);
            return module.exports;
        } catch (error) { delete modules[name]; --moduleCount; moduleBytes -= bytes; throw error; }
    }
    D.require = name => requireModule(name);
    const escape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\{/g,"&#123;").replace(/\}/g,"&#125;");
    function template(name, values, ancestry) {
        name = path(name); if (ancestry.length >= 8 || ancestry.indexOf(name) >= 0) throw new Error("Circular or excessively deep template");
        let html = D.resourceText(name);
        const includes=/<dt-include\s+resource=["']([^"']+)["']\s*\/>/g;
        let output="",cursor=0,match;
        while((match=includes.exec(html))!==null){output+=html.slice(cursor,match.index)+template(path(match[1],name),values,ancestry.concat(name));cursor=includes.lastIndex;}
        html=output+html.slice(cursor);
        html = html.replace(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g, (_, key) => { if (!Object.prototype.hasOwnProperty.call(values, key)) throw new Error("Missing template value: " + key); return escape(values[key]); });
        if (html.length > 65536) throw new Error("Expanded document exceeds budget");
        return html;
    }
    D.template = (name, values) => template(name, values || {}, []);
    D.loadPage = function (name, values) { return D.loadDocument(D.template(name, values)); };
    let router = null;
    D.createRouter = function (routes, options) {
        if (router) throw new Error("One router per application");
        options = options || {}; const limit = options.historyLimit === undefined ? 16 : options.historyLimit;
        if (!Number.isInteger(limit) || limit < 1 || limit > 32) throw new Error("Invalid history limit");
        let history = [], current = null, navigating = false;
        const store = options.store || {};
        function context(record) {
            return { name: record.name, params: record.params, state: record.state, store, byId: D.byId,
                track(request) { if (request && record.requests.indexOf(request) < 0) record.requests.push(request); return request; },
                navigate: api.navigate, back: api.back };
        }
        function hook(record, name, args) { const fn = record && record.route[name]; return typeof fn === "function" ? fn.apply(record.route, [context(record)].concat(args || [])) : undefined; }
        function transition(target, mode) {
            if (navigating) throw new Error("Reentrant navigation"); navigating = true;
            try {
                if (hook(current, "beforeLeave", [mode]) === false) return false;
                const markup = typeof target.route.render === "function" ? target.route.render(context(target)) : D.template(target.route.document, target.params);
                if(current)current.viewState=D.captureViewState();
                hook(current, "onLeave", [mode]);
                if(current&&D.tasks)D.tasks.presented([],{scope:"application"});
                const result = D.loadDocument(markup);
                if (result !== 0) { hook(current, "onResume", ["load-failed"]); throw new Error("Page load failed: " + result); }
                if (current) { for (const id of current.requests) D.cancelRequest(id); current.requests.length = 0; }
                if (mode === "back") history.pop();
                else if (mode === "replace" && history.length) history[history.length - 1] = target;
                else { history.push(target); if (history.length > limit) history.shift(); }
                current = target;if(target.viewState)D.restoreViewState(target.viewState); hook(current, mode === "back" ? "onResume" : "onEnter", [mode]); return true;
            } finally { navigating = false; }
        }
        const api = {
            navigate(name, params, settings) {
                if (!Object.prototype.hasOwnProperty.call(routes, name)) throw new Error("Unknown route: " + name);
                const route = typeof routes[name] === "string" ? { document: routes[name] } : routes[name];
                return transition({ name, route, params: params || {}, state: {}, requests: [] }, settings && settings.replace ? "replace" : "push");
            },
            back() { return history.length > 1 ? transition(history[history.length - 2], "back") : false; },
            current() { return current ? { name: current.name, params: current.params, state: current.state } : null; },
            depth() { return history.length; },
            dispatch(name, args) {
                if ((name === "onRequestComplete" || name === "onPermissionResult") && current) {
                    const index = current.requests.indexOf(args[0]); if (index < 0) return;
                    current.requests.splice(index, 1);
                }
                return hook(current, name, args);
            },
            track(request) { if (current) context(current).track(request); return request; },
            backOrExit() { return history.length > 1 ? api.back() : D.requestExit(); },
            store
        };
        router = api; D.router = api;
        if (options.initial !== undefined) api.navigate(options.initial, options.params);
        return api;
    };
    for (const name of ["network", "keyboard", "requestPermission", "platformRequest", "userFilesList"]) {
        const native = D[name];
        if (typeof native !== "function") continue;
        D[name] = function () { const args = Array.prototype.slice.call(arguments), options = args[name === "requestPermission" || name === "userFilesList" ? 2 : 1]; const request = native.apply(D, args); if (router && Number.isInteger(request)&&request>0&&!(options && options.scope === "application")) router.track(request); return request; };
    }
    D._pageHook = function (name, args) {
        if(name==='onLanguageChanged'&&typeof D._localeChanged==='function')D._localeChanged(args[0]);
        if (!router) return;
        if (name === "leave") return router.dispatch("onLeave", ["exit"]);
        return router.dispatch(name, args);
    };
    D.capabilities = function () {
        const data = D.resourceRead("@system/sdk-capabilities");
        if (!data || data.byteLength < 16) return { abiMajor: 1, abiMinor: 0, flags: 0 };
        const view = new DataView(data);
        if (view.getUint32(0, true) < 16) return { abiMajor: 1, abiMinor: 0, flags: 0 };
        return { abiMajor: view.getUint32(4, true), abiMinor: view.getUint32(8, true), flags: view.getUint32(12, true) };
    };
    const flags = D.capabilities().flags;
    D.features = Object.freeze({ modules: !!(flags & 1), navigation: !!(flags & 2), sharedTemplates: !!(flags & 4), listSlots: !!(flags & 8), choiceStepper: !!(flags & 16), nativeModules: !!(flags & 32), listNotes: !!(flags & 64), versionCode: !!(flags & 128), animatedProgress: !!(flags & 256), applicationActionIcons: !!(flags & 512), applicationSplash: !!(flags & 1024), confirmationDialogs: !!(flags & 2048), systemColorScheme: !!(flags & 4096), embeddedDocumentEditor: !!(flags & 8192), platformServices: !!(flags & 16384), sharedData: !!(flags & 32768), pointerInput: !!(flags & 65536), dateTimePicker: !!(flags & 131072), locales: !!(flags & 262144), publicFiles: !!(flags & 524288), listDividerContext: !!(flags & 1048576) });
    D.foregroundRoles = Object.freeze({ default: 0, accent: 1, danger: 2, supporting: 3, body: 4, disabled: 5, primary: 6, success: 7, warning: 8 });
    D.canvasClipping=!!(flags&2097152);
    D.canvasWaves=!!(flags&8388608);
    D.features=Object.freeze(Object.assign({},D.features,{canvasClipping:D.canvasClipping,canvasWaves:D.canvasWaves,filePicker:!!(flags&4194304),componentRead:!!(flags&16777216),textMetrics:!!(flags&33554432),scrollPosition:!!(flags&67108864),taskDueTime:!!(flags&134217728),textStrikethrough:!!(flags&268435456),colorSwatch:!!(flags&536870912),taskListTiles:!!(flags&1073741824)}));
    D.colorScheme=function(){
        const data=D.resourceRead('@system/color-scheme');if(!data||data.byteLength!==124)return null;
        const view=new DataView(data);if(view.getUint32(0,true)!==124||view.getUint32(4,true)!==1)return null;
        const names=['background','surface','header','raised','alternate','sidebar','primaryText','bodyText','supportingText','disabledText','border','accent','onAccent','listPressed','success','warning','danger','dangerFill','onDanger','keyboard','key','input','inputText','pressed','onPressed','selectionBorder','switchTrack','switchInk','iconInk'],result={};
        names.forEach((name,i)=>result[name]=view.getUint32(8+i*4,true));return Object.freeze(result);
    };
    D.setListFollowingContent=function(target,value){if(!(flags&1048576))return -2;if(typeof value!=='boolean')throw Error('Following-content flag must be boolean');return D.setBytes(target,59,new Uint8Array([value?1:0]).buffer);};
    D.configureDateTimePicker=function(target,options){
        if(!(flags&131072))return -2;options=options||{};
        function integer(value,fallback,min,max){value=value===undefined?fallback:value;if(!Number.isInteger(value)||value<min||value>max)throw new Error("Invalid date/time picker option");return value;}
        function day(value,fallback){value=value===undefined?fallback:value;if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error("Invalid date");
            const date=new Date(value+"T00:00:00Z");if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw new Error("Invalid date");return date.getTime()/86400000;}
        function minute(value,fallback){value=value===undefined?fallback:value;if(typeof value==="string"&&/^\d{2}:\d{2}$/.test(value)){const h=Number(value.slice(0,2)),m=Number(value.slice(3));if(h<24&&m<60)return h*60+m;}return integer(value,0,0,1439);}
        const modes={both:0,date:1,time:2},mode=options.mode===undefined?0:modes[options.mode];if(mode===undefined)throw new Error("Invalid picker mode");
        const symbols=options.symbols===undefined||options.symbols==='plus-minus'?0:options.symbols==='arrows'?1:-1;if(symbols<0)throw new Error("Invalid picker symbols");
        const minimum=day(options.minimumDate,'1900-01-01'),maximum=day(options.maximumDate,'2100-12-31'),selected=day(options.date,'2000-01-01');
        const minMinute=minute(options.minimumTime,0),maxMinute=minute(options.maximumTime,1439),selectedMinute=minute(options.time,0);
        if(minimum>maximum||selected<minimum||selected>maximum||minMinute>maxMinute||selectedMinute<minMinute||selectedMinute>maxMinute)throw new Error("Selection outside picker limits");
        const buffer=new ArrayBuffer(204),view=new DataView(buffer),bytes=new Uint8Array(buffer);
        const values=[204,mode,symbols,integer(options.minuteStep,1,1,60),selected,selectedMinute,minimum,maximum,minMinute,maxMinute,
            integer(options.buttonHeight,52,24,128),integer(options.valueHeight,52,8,256),integer(options.verticalGap,8,0,64),integer(options.columnGap,16,0,64),integer(options.groupGap,56,16,96),
            integer(options.numberSize,32,8,96),integer(options.unitSize,20,8,96),integer(options.unitGap,8,0,64),integer(options.titleHeight,40,24,96),integer(options.titleGap,20,8,64)];
        values.forEach((v,i)=>view.setInt32(i*4,v,true));
        function label(offset,capacity,text){const encoded=D.utf8Encode(text);if(encoded.length>=capacity||encoded.some(b=>b<32))throw new Error("Invalid picker label");bytes.set(encoded,offset);}
        label(80,32,options.dateLabel===undefined?'Date':options.dateLabel);label(112,32,options.timeLabel===undefined?'Time':options.timeLabel);
        const units=options.units===undefined?['Y','M','D','h','min']:options.units;if(!Array.isArray(units)||units.length!==5)throw new Error("Picker requires five unit labels");units.forEach((u,i)=>label(144+i*12,12,u));
        return D.setBytes(target,58,buffer);
    };
    D.createDateTimePicker=function(options){if(!(flags&131072))throw new Error("Date/time picker unsupported");const target=D.create(23);if(!target)throw new Error("Date/time picker allocation failed");
        try{const result=D.configureDateTimePicker(target,options);if(result!==0)throw new Error("Date/time picker configuration failed: "+result);return target;}catch(error){if(typeof D.destroy==='function')D.destroy(target);throw error;}};
    D.platform = function(operation,options,settings){
        if(!(flags&16384)||typeof D.platformRequest!=="function")return -2;
        if(typeof operation!=="string"||!operation||options!==undefined&&(options===null||typeof options!=="object"||Array.isArray(options)))return -3;
        return D.platformRequest(JSON.stringify(Object.assign({},options||{},{schema:1,operation})),settings);
    };
    D.platformResult = buffer => JSON.parse(decode(buffer));
    const bleUInt=(value,min,max)=>{if(!Number.isInteger(value)||value<min||value>max)throw Error('Invalid Bluetooth parameter');return value;};
    const bleConnection=value=>bleUInt(value,1,4294967295);
    const bleAttribute=value=>bleUInt(value,1,65535);
    const bleUuid=value=>{
        if(typeof value!=='string'||! /^(?:[0-9a-f]{4}|[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(value))throw Error('Invalid Bluetooth UUID');
        value=value.toLowerCase();return value.length===36?value:(value.length===4?'0000':'')+value+'-0000-1000-8000-00805f9b34fb';
    };
    D.bluetooth=Object.freeze({
        status:settings=>D.platform('bluetooth.status',{},settings),
        scan:(options,settings)=>{
            options=options||{};const passive=options.passive===undefined?true:options.passive;
            if(typeof passive!=='boolean')throw Error('Invalid Bluetooth scan mode');
            return D.platform('bluetooth.scan',{durationMs:bleUInt(options.durationMs===undefined?10000:options.durationMs,100,60000),passive},settings);
        },
        listen:settings=>D.platform('bluetooth.listen',{},settings),
        stopScan:settings=>D.platform('bluetooth.stopScan',{},settings),
        connect:(address,addressType,settings)=>{
            if(typeof address!=='string'||!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(address))throw Error('Invalid Bluetooth address');
            return D.platform('bluetooth.connect',{address:address.toUpperCase(),addressType:bleUInt(addressType,0,1)},settings);
        },
        disconnect:(connection,settings)=>D.platform('bluetooth.disconnect',{connection:bleConnection(connection)},settings),
        attach:(connection,settings)=>D.platform('bluetooth.attach',{connection:bleConnection(connection)},settings),
        detach:(connection,settings)=>D.platform('bluetooth.detach',{connection:bleConnection(connection)},settings),
        pair:(connection,settings)=>D.platform('bluetooth.pair',{connection:bleConnection(connection)},settings),
        pairingReply:(connection,action,prompt,passkey,accept,settings)=>{
            if(!['input','display','confirm'].includes(action)||typeof accept!=='boolean')throw Error('Invalid Bluetooth pairing reply');
            return D.platform('bluetooth.pairingReply',{connection:bleConnection(connection),action,prompt:bleUInt(prompt,1,4294967295),passkey:bleUInt(passkey,0,999999),accept},settings);
        },
        read:(connection,attribute,settings)=>D.platform('bluetooth.read',{connection:bleConnection(connection),attribute:bleAttribute(attribute)},settings),
        discoverServices:(connection,uuid,settings)=>D.platform('bluetooth.discoverServices',Object.assign({connection:bleConnection(connection)},uuid===undefined||uuid===null?{}:{serviceUuid:bleUuid(uuid)}),settings),
        discoverCharacteristics:(connection,serviceUuid,uuid,settings)=>D.platform('bluetooth.discoverCharacteristics',Object.assign({connection:bleConnection(connection),serviceUuid:bleUuid(serviceUuid)},uuid===undefined||uuid===null?{}:{characteristicUuid:bleUuid(uuid)}),settings),
        discoverDescriptors:(connection,serviceUuid,characteristicUuid,uuid,settings)=>D.platform('bluetooth.discoverDescriptors',Object.assign({connection:bleConnection(connection),serviceUuid:bleUuid(serviceUuid),characteristicUuid:bleUuid(characteristicUuid)},uuid===undefined||uuid===null?{}:{descriptorUuid:bleUuid(uuid)}),settings),
        readUuid:(connection,serviceUuid,characteristicUuid,settings)=>D.platform('bluetooth.readUuid',{connection:bleConnection(connection),serviceUuid:bleUuid(serviceUuid),characteristicUuid:bleUuid(characteristicUuid)},settings),
        subscribe:(connection,serviceUuid,characteristicUuid,settings)=>D.platform('bluetooth.subscribe',{connection:bleConnection(connection),serviceUuid:bleUuid(serviceUuid),characteristicUuid:bleUuid(characteristicUuid)},settings),
        unsubscribe:(connection,serviceUuid,characteristicUuid,settings)=>D.platform('bluetooth.unsubscribe',{connection:bleConnection(connection),serviceUuid:bleUuid(serviceUuid),characteristicUuid:bleUuid(characteristicUuid)},settings),
        write:(connection,attribute,data,settings)=>{
            if(typeof data!=='string'||data.length>488||data.length%2||!/^[0-9a-f]*$/i.test(data))throw Error('Invalid Bluetooth hex value');
            return D.platform('bluetooth.write',{connection:bleConnection(connection),attribute:bleAttribute(attribute),data:data.toUpperCase()},settings);
        },
        nextEvent:(timeoutMs,settings)=>D.platform('bluetooth.nextEvent',{timeoutMs:bleUInt(timeoutMs===undefined?30000:timeoutMs,0,30000)},settings)
    });
    function taskId(id){if(typeof id!=="string"||!/^[1-9][0-9]{0,19}$/.test(id))throw new TypeError("Task IDs are decimal strings");return id;}
    D.tasks=Object.freeze({presented:(ids,settings)=>{if(!Array.isArray(ids)||ids.length>12)throw new TypeError("At most 12 visible task IDs");return D.platform("tasks.presented",{ids:ids.map(taskId)},settings);},submit:(options,settings)=>D.platform("tasks.submit",options,settings),list:settings=>D.platform("tasks.list",{},settings),get:(id,settings)=>D.platform("tasks.get",{id:taskId(id)},settings),cancel:(id,settings)=>D.platform("tasks.cancel",{id:taskId(id)},settings),retry:(id,settings)=>D.platform("tasks.retry",{id:taskId(id)},settings),remove:(id,settings)=>D.platform("tasks.remove",{id:taskId(id)},settings)});
    function collection(value){if(value!=="lists"&&value!=="tasks"&&value!=="events")throw new TypeError("Unknown shared-data collection");return value;}
    D.data=Object.freeze({list:(kind,options,settings)=>D.platform("data.list",Object.assign({},options||{},{collection:collection(kind)}),settings),get:(kind,id,settings)=>D.platform("data.get",{collection:collection(kind),id:taskId(id)},settings),create:(kind,fields,clientKey,settings)=>D.platform("data.create",{collection:collection(kind),fields,client_key:clientKey},settings),update:(kind,id,revision,fields,settings)=>D.platform("data.update",{collection:collection(kind),id:taskId(id),revision,fields},settings),remove:(kind,id,revision,settings)=>D.platform("data.delete",{collection:collection(kind),id:taskId(id),revision},settings)});
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    D.fileBase64=function(data){const bytes=data instanceof ArrayBuffer?new Uint8Array(data):data;if(!(bytes instanceof Uint8Array)||bytes.byteLength>8192)throw new Error("File write exceeds byte budget");let out='';
        for(let i=0;i<bytes.length;i+=3){const n=(bytes[i]<<16)|((bytes[i+1]||0)<<8)|(bytes[i+2]||0);out+=alphabet[n>>>18]+alphabet[(n>>>12)&63]+(i+1<bytes.length?alphabet[(n>>>6)&63]:'=')+(i+2<bytes.length?alphabet[n&63]:'=');}return out;};
    D.fileBytes=function(result){const s=result&&result.data_base64;if(typeof s!=='string'||s.length>10924||s.length%4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))throw new Error("Invalid file data");
        const padding=s.endsWith('==')?2:s.endsWith('=')?1:0,size=s.length/4*3-padding;if(size>8192)throw new Error("File read exceeds byte budget");const bytes=new Uint8Array(size);let at=0;
        for(let i=0;i<s.length;i+=4){const a=alphabet.indexOf(s[i]),b=alphabet.indexOf(s[i+1]),c=alphabet.indexOf(s[i+2]),d=alphabet.indexOf(s[i+3]);if(s[i+2]==='='&&(b&15)||s[i+3]==='='&&s[i+2]!=='='&&(c&3))throw new Error("Noncanonical file data");const n=(a<<18)|(b<<12)|((c<0?0:c)<<6)|(d<0?0:d);if(at<size)bytes[at++]=n>>>16;if(at<size)bytes[at++]=(n>>>8)&255;if(at<size)bytes[at++]=n&255;}return bytes;};
    function fileOperation(operation,path,options,settings){if(!(flags&524288))return -2;return D.platform('files.'+operation,Object.assign({},options||{},{path}),settings);}
    D.files=Object.freeze({
        pick:(options,settings)=>(flags&4194304)?D.platform('files.pick',Object.assign({mode:'open'},options||{}),settings):-2,
        list:(path,options,settings)=>fileOperation('list',path===undefined?'':path,options,settings),
        stat:(path,options,settings)=>fileOperation('stat',path,options,settings),
        read:(path,options,settings)=>fileOperation('read',path,options,settings),
        write:(path,options,settings)=>fileOperation('write',path,options,settings),
        writeText:(path,text,options,settings)=>fileOperation('write',path,Object.assign({},options||{},{text}),settings),
        writeBytes:(path,data,options,settings)=>fileOperation('write',path,Object.assign({},options||{},{data_base64:D.fileBase64(data)}),settings),
        mkdir:(path,options,settings)=>fileOperation('mkdir',path,options,settings),
        rename:(path,name,options,settings)=>fileOperation('rename',path,Object.assign({},options||{},{name}),settings),
        move:(path,target,options,settings)=>fileOperation('move',path,Object.assign({},options||{},{target}),settings),
        copy:(path,target,options,settings)=>fileOperation('copy',path,Object.assign({},options||{},{target}),settings),
        remove:(path,options,settings)=>fileOperation('delete',path,options,settings),bytes:D.fileBytes,text:result=>decode(D.fileBytes(result).buffer)
    });
    D.resources = Object.freeze({ read: D.resourceRead, size: D.resourceSize, readRange: D.resourceReadRange, text: D.resourceText, json: D.resourceJson, require: D.require, template: D.template });
    D.navigation = Object.freeze({ createRouter: D.createRouter, loadPage: D.loadPage });
    D.app = Object.freeze({ requestExit: D.requestExit, registerMenu: D.registerMenu, capabilities: D.capabilities });
    D.icons = Object.freeze({
        current: function () { const data=D.storageRead('@system/icon-appearance');return data===null?null:decode(data); },
        select: function (id) {
            if(typeof id!=='string'||!/^[A-Za-z0-9_-]{0,16}$/.test(id))throw Error('Invalid icon appearance');
            return D.storageWrite('@system/icon-appearance',D.utf8Encode(id).buffer);
        },
        reset: function () { return D.storageWrite('@system/icon-appearance',new ArrayBuffer(0)); }
    });
    D.localeInfo=function(){
        const data=D.resourceRead('@system/locale-info');if(!data||data.byteLength<180)return null;
        const view=new DataView(data);if(view.getUint32(0,true)<180||view.getUint32(4,true)!==1)return null;
        function label(offset,length){const bytes=new Uint8Array(data,offset,length);let count=0;while(count<length&&bytes[count])++count;if(count===length)throw Error('Invalid locale information');return decode(bytes.slice(0,count).buffer);}
        return {systemLocale:label(20,32),applicationLocale:label(52,32),requestedLocale:label(84,32),timezone:label(116,64),utcOffsetMinutes:view.getInt32(16,true),use24Hour:view.getUint32(8,true)!==0,registered:(view.getUint32(12,true)&1)!==0};
    };
    D.locale=Object.freeze({
        get:settings=>D.platform('locale.get',{},settings),
        register:(options,settings)=>D.platform('locale.register',options,settings),
        set:(requested,settings)=>D.platform('locale.set',{requested},settings)
    });
    D.normalizeLocale=function(tag){
        if(typeof tag!=='string'||tag.length>31||! /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(tag))throw Error('Invalid locale tag');
        let script=false,region=false,variants=false;const seen=Object.create(null);
        return tag.split('-').map((part,index)=>{
            let result=part.toLowerCase();if(index){
                if(!variants&&!script&&!region&&/^[A-Za-z]{4}$/.test(part)){script=true;result=result[0].toUpperCase()+result.slice(1);}
                else if(!variants&&!region&&/^(?:[A-Za-z]{2}|[0-9]{3})$/.test(part)){region=true;result=part.toUpperCase();}
                else{if(part.length<5&&!/^[0-9][A-Za-z0-9]{3}$/.test(part))throw Error('Unsupported locale tag');variants=true;}
                if(seen[result.toLowerCase()])throw Error('Duplicate locale subtag');
            }seen[result.toLowerCase()]=true;return result;
        }).join('-');
    };
    let i18n=null;
    D.createI18n=function(catalogPath){
        if(i18n)throw Error('One translation catalog per application');
        const meta=JSON.parse(D.resourceText(catalogPath||'locales/catalog.json',2048));
        if(!meta||meta.schema!==1||typeof meta.locales!=='object'||!meta.locales||Array.isArray(meta.locales))throw Error('Invalid translation catalog');
        const supported=Object.keys(meta.locales);if(!supported.length||supported.length>8||supported.some(tag=>D.normalizeLocale(tag)!==tag||typeof meta.locales[tag]!=='string')||supported.indexOf(meta.default)<0)throw Error('Invalid supported locales');
        function load(tag){
            const map=JSON.parse(D.resourceText(meta.locales[tag],16384));
            if(!map||typeof map!=='object'||Array.isArray(map)||Object.keys(map).length>256)throw Error('Invalid translation messages');
            for(const key of Object.keys(map)){
                if(!/^[A-Za-z][A-Za-z0-9_.-]{0,62}$/.test(key)||key==='constructor'||key==='__proto__')throw Error('Invalid translation key');
                const item=map[key],texts=typeof item==='string'?[item]:item&&typeof item==='object'&&!Array.isArray(item)&&Object.keys(item).every(k=>k==='one'||k==='other')&&typeof item.other==='string'?Object.keys(item).map(k=>item[k]):[];
                if(!texts.length||texts.some(text=>typeof text!=='string'||textBytes(text)>1024||text.indexOf('\0')>=0))throw Error('Invalid translation value');
            }return map;
        }
        let selected='',messages=null;
        function resolve(requested){
            let tag;try{tag=D.normalizeLocale(requested);}catch(_){return meta.default;}
            for(;;){if(supported.indexOf(tag)>=0)return tag;
                if(meta.default.startsWith(tag+'-'))return meta.default;
                for(const item of supported)if(item.startsWith(tag+'-'))return item;
                const last=tag.lastIndexOf('-');if(last<0)return meta.default;tag=tag.slice(0,last);
            }
        }
        function select(requested){const next=resolve(requested);if(next!==selected){const value=load(next);messages=value;selected=next;}return selected;}
        let choice='';if(typeof D.storageReadResult==='function'){
            const result=D.storageReadResult('_dt-language-v1');if(result.result===0){const saved=JSON.parse(decode(result.data));if(saved.schema!==1||typeof saved.requested!=='string')throw Error('Invalid saved language');choice=saved.requested;}
            else if(result.result!==-8)throw Error('Application language unavailable: '+result.result);
        }
        const info=D.localeInfo();select(choice||(info?info.systemLocale:meta.default));
        const api={
            locale:()=>selected,supported:()=>supported.slice(),select,
            register:settings=>D.locale.register({default:meta.default,supported},settings),
            t(key,parameters){
                if(!Object.prototype.hasOwnProperty.call(messages,key))throw Error('Unknown translation key');
                parameters=parameters||{};let value=messages[key];
                if(typeof value!=='string'){const count=parameters.count;if(!Number.isSafeInteger(count)||count<0)throw Error('Plural count must be a nonnegative safe integer');value=/^en(?:-|$)/.test(selected)&&count===1&&typeof value.one==='string'?value.one:value.other;}
                // Catalog entries were UTF-8/length validated at load time.
                if(value.indexOf('{')<0&&value.indexOf('}')<0)return value;
                const text=value.replace(/\{\{|\}\}|\{([A-Za-z][A-Za-z0-9_]{0,31})\}/g,(match,name)=>{
                    if(match==='{{')return '{';if(match==='}}')return '}';
                    if(!Object.prototype.hasOwnProperty.call(parameters,name)||typeof parameters[name]!=='string'&&typeof parameters[name]!=='number'||typeof parameters[name]==='number'&&!Number.isFinite(parameters[name]))throw Error('Missing or invalid translation parameter');
                    const value=String(parameters[name]);if(value.indexOf('\0')>=0)throw Error('Invalid translation parameter');return value;
                });if(textBytes(text)>1024)throw Error('Translated text exceeds UI limit');return text;
            },
            formatDate(value){
                if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Invalid date');const parts=value.split('-').map(Number),date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
                if(parts[0]<1900||parts[0]>2100||date.getUTCFullYear()!==parts[0]||date.getUTCMonth()!==parts[1]-1||date.getUTCDate()!==parts[2])throw Error('Invalid date');
                if(!/^en(?:-|$)/.test(selected))return value.replace(/-/g,'/');const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parts[1]-1];return selected==='en'||selected==='en-US'?month+' '+parts[2]+', '+parts[0]:parts[2]+' '+month+' '+parts[0];
            },
            formatTime(minute,options){
                if(!Number.isInteger(minute)||minute<0||minute>1439)throw Error('Invalid local minute');const info=D.localeInfo(),use24=options&&options.use24Hour!==undefined?options.use24Hour:info?info.use24Hour:true;
                if(typeof use24!=='boolean')throw Error('Invalid clock format');const hour=Math.floor(minute/60),pad=n=>n<10?'0'+n:String(n);return use24?pad(hour)+':'+pad(minute%60):(hour%12||12)+':'+pad(minute%60)+' '+(hour<12?'AM':'PM');
            }
        };
        i18n=Object.freeze(api);D._localeChanged=select;return i18n;
    };
    D.ui = Object.freeze({ create: D.create, destroy:D.destroy, append: D.append, byId: D.byId, loadDocument: D.loadDocument, present: D.present });
})(DeskTile);
