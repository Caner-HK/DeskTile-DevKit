'use strict';
const fs=require('node:fs'),path=require('node:path'),core=require('./core');
const markupAttributes=new Set('text accessibility-label resource placeholder width height min-width min-height max-width max-height gap font-size item-size item-gap document-cursor document-scroll icon font-weight repeat-interval progress-style animation-duration animation-delay alignment justification button-style surface-style dialog-presentation foreground-role scroll-axis grid-columns slot foreground background accent dialog-border-color status-bar-background status-bar-foreground visible enabled checked indeterminate pointer-input has-following-content text-wrap text-strikethrough dialog-title-divider icon-trailing dialog-border dialog-destructive document-headings document-focused document-caret-visible value minimum maximum flex-grow step padding margin'.split(' '));
const enumValues={alignment:['0','1','2','3'],justification:['0','1','2','3','4'],'scroll-axis':['0','1'],'button-style':['0','1','2','3','4','5'],'surface-style':['0','1','2'],'progress-style':['0','1','2'],'font-size':['16','20','22','32','48']};
const aliases={'scroll-view':'scroll','canvas-view':'canvas'},cache=new Map();
function catalog(sdk){
 const file=path.join(sdk,'sdk/contract/desktile-api.json'),stamp=fs.statSync(file).mtimeMs,prior=cache.get(file);if(prior?.stamp===stamp)return prior;
 const contract=JSON.parse(fs.readFileSync(file,'utf8')),directory=path.join(sdk,'sdk/javascript'),declarations=fs.readdirSync(directory).filter(f=>f.endsWith('.d.ts')).map(f=>fs.readFileSync(path.join(directory,f),'utf8')).join('\n');
 const enums={};let header='';try{header=fs.readFileSync(path.join(sdk,'sdk/include/desktile/sdk.h'),'utf8');}catch{}
 for(const [attribute,type] of Object.entries({'button-style':'button_style','surface-style':'surface_style','progress-style':'progress_style','alignment':'alignment','justification':'justification','scroll-axis':'axis','dialog-presentation':'dialog_presentation','foreground-role':'foreground_role'})){const match=header.match(new RegExp('typedef enum dt_'+type+'\\s*\\{([\\s\\S]*?)\\}'));if(match)enums[attribute]=[...match[1].matchAll(/(DT_[A-Z_]+)\s*=\s*(\d+)/g)].map(m=>({value:m[2],name:m[1]}));}
 const value={stamp,contract,declarations,directory,enums,components:contract.components.map(name=>'dt-'+(aliases[name]||name)),properties:[{id:'id',value:'utf8'},...contract.properties.map(p=>({...p,id:p.html_attribute||({'slot-position':'slot'}[p.id]||p.id)})).filter(p=>markupAttributes.has(p.id))]};cache.set(file,value);return value;
}
function files(root,filter,limit=256){
 const output=[];if(!root||!fs.existsSync(root))return output;const base=fs.realpathSync(root),pending=[''];
 while(pending.length&&output.length<limit){const relative=pending.pop();for(const entry of fs.readdirSync(path.join(base,relative),{withFileTypes:true})){if(entry.isSymbolicLink()||entry.name.startsWith('.')||['node_modules','dist','build','icon-design'].includes(entry.name))continue;const item=path.posix.join(relative,entry.name);if(entry.isDirectory())pending.push(item);else if(filter(item))output.push(item);if(output.length>=limit)break;}}
 return output.sort();
}
function item(label,start,end,kind='Property',detail='',snippet){return {label,start,end,kind,detail,insertText:snippet??label,snippet:snippet!==undefined};}
function maskCode(text){
 let result='',mode='',escaped=false;for(let i=0;i<text.length;i++){const c=text[i],next=text[i+1];if(mode==='line'){result+=c==='\n'?'\n':' ';if(c==='\n')mode='';continue;}if(mode==='block'){result+=' ';if(c==='*'&&next==='/'){result+=' ';i++;mode='';}continue;}if(mode){result+=' ';if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===mode)mode='';continue;}if(c==='/'&&next==='/'){result+='  ';i++;mode='line';}else if(c==='/'&&next==='*'){result+='  ';i++;mode='block';}else if(['"',"'",'`'].includes(c)){mode=c;result+=' ';}else result+=c;}return result;
}
function html(text,offset,data,project){
 const before=text.slice(0,offset);if(before.lastIndexOf('<!--')>before.lastIndexOf('-->'))return [];
 let open=-1,quote='';for(let i=0;i<before.length;i++){const c=before[i];if(open<0){if(before.startsWith('<!--',i)){const end=before.indexOf('-->',i+4);if(end<0)return [];i=end+2;}else if(c==='<')open=i;}else if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='>')open=-1;else if(c==='<')open=i;}if(open<0)return [];
 const part=before.slice(open),name=part.match(/^<\/?([\w-]*)$/);
 if(name){const closing=part.startsWith('</'),prefix=name[1],start=offset-prefix.length;return data.components.filter(k=>k.startsWith(prefix)).map(k=>item(k,start,offset,'Class','DeskTile SDK component',closing?undefined:k+' ${1}>$0</'+k+'>'));}
 const tag=part.match(/^<(dt-[\w-]+)\s/);if(!tag||!data.components.includes(tag[1]))return [];
 const value=part.match(/([\w-]+)\s*=\s*(["'])([^"']*)$/);
 if(value){const [,attribute,,prefix]=value,start=offset-prefix.length;
  if(attribute==='resource')return files(project,f=>f.endsWith('.dti')).filter(f=>f.startsWith(prefix)).map(f=>item(f,start,offset,'File','Packaged DTI resource'));
  if(attribute==='icon'){let icons=[];try{icons=JSON.parse(fs.readFileSync(path.join(data.directory,'../../resources/icons/catalog.json'),'utf8'));if(!Array.isArray(icons))icons=icons.icons||[];}catch{}return icons.filter(i=>Number.isInteger(i.id)&&i.id<=120&&String(i.id).startsWith(prefix)).map(i=>item(String(i.id),start,offset,'Value',i.name||'System icon'));}
  const prop=data.properties.find(p=>p.id===attribute),values=prop?.value==='bool'?['true','false']:(data.enums[attribute]?.map(v=>v.value)||enumValues[attribute]||[]);
  return values.filter(v=>v.startsWith(prefix)).map(v=>item(v,start,offset,'Value',data.enums[attribute]?.find(e=>e.value===v)?.name||prop?.meaning||prop?.value||'SDK value'));
 }
 const prefix=part.match(/(?:\s)([\w-]*)$/)?.[1];if(prefix===undefined)return [];
 const used=new Set([...part.matchAll(/([\w-]+)\s*=/g)].map(m=>m[1])),start=offset-prefix.length;
 return data.properties.filter(p=>!used.has(p.id)&&p.id.startsWith(prefix)).map(p=>item(p.id,start,offset,'Property',(p.meaning||p.value)+(p.range?' ['+p.range.join('…')+']':''),p.id+'="${1}"'));
}
function members(declarations,expression){
 if(expression==='DeskTile')return [...declarations.matchAll(/^  (?:function|const)\s+(\w+)([^\n]*)/gm)].map(m=>({name:m[1],signature:m[1]+m[2],method:!m[2].startsWith(':')}));
 const member=expression.match(/^DeskTile\.(\w+)$/);if(!member)return [];
 const declaration=declarations.match(new RegExp('const '+member[1]+':([^;\\n]+(?:;[^\\n]+)?)'));
 if(!declaration)return [];let body=declaration[1];
 const type=body.match(/import\(["'][^"']+["']\)\.(\w+)/);if(type){const at=declarations.indexOf('interface '+type[1]+' ');if(at>=0){const start=declarations.indexOf('{',at);let depth=1,end=start+1;while(end<declarations.length&&depth){if(declarations[end]==='{')depth++;if(declarations[end]==='}')depth--;end++;}body=declarations.slice(start+1,end-1);}}
 return [...body.matchAll(/(?:^|[;{]\s*|\n\s*)(\w+)\s*(\([^;\n]*?\)\s*:[^;\n]+|:\s*typeof\s+(\w+))/g)].map(m=>({name:m[1],signature:m[1]+m[2],method:true}));
}
function javascript(text,offset,data,project){
 const before=text.slice(0,offset),required=before.match(/DeskTile\.require\(\s*["']([^"']*)$/);
 if(required){const prefix=required[1],start=offset-prefix.length;const paths=[...fs.readdirSync(data.directory).filter(f=>f.endsWith('.js')).map(f=>'ui/'+f),...files(project,f=>f.endsWith('.js'))];return [...new Set(paths)].filter(f=>f.startsWith(prefix)).map(f=>item(f,start,offset,'Module','DeskTile module'));}
 const masked=maskCode(before),access=masked.match(/\b(DeskTile(?:\.\w+)?|[A-Za-z_$][\w$]*)\.([\w$]*)$/);
 if(access){const expression=access[1],prefix=access[2],start=offset-prefix.length;let results=members(data.declarations,expression);
  if(expression!=='DeskTile'&&!expression.startsWith('DeskTile.')){
   const escaped=expression.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp('(?:var|let|const)\\s+'+escaped+'\\s*=\\s*(?:/\\*[\\s\\S]*?\\*/\\s*)?\\(?\\s*DeskTile\\.require\\(\\s*["\'](ui/[^"\']+)["\']','g');let match,last;while((match=pattern.exec(before)))last=match[1];
   if(last){const file=path.resolve(data.directory,path.basename(last));if(core.isWithin(data.directory,file)&&fs.existsSync(file))results=[...fs.readFileSync(file,'utf8').matchAll(/\bexports\.(\w+)\s*=/g)].map(m=>{const signature=data.declarations.match(new RegExp('export function '+m[1]+'([^\\n]+)'));return {name:m[1],signature:signature?m[1]+signature[1]:m[1]+'()',method:true};});}
  }
  return [...new Map(results.filter(r=>r.name.startsWith(prefix)).map(r=>[r.name,r])).values()].map(r=>item(r.name,start,offset,r.method?'Function':'Property',r.signature,r.method?r.name+'($0)':undefined));
 }
 return [];
}
function suggestions(text,offset,{sdk,project,language}){
 const data=catalog(sdk);if(language==='html')return html(text,offset,data,project);
 if(language==='javascript'||language==='typescript')return javascript(text,offset,data,project);
 if(language==='cpp'||language==='c'){const match=text.slice(0,offset).match(/#\s*include\s*[<"]([^>"]*)$/);if(!match||!match[1].startsWith('desktile/'))return [];return files(path.join(sdk,'sdk/include'),f=>/\.h(?:pp)?$/.test(f)).filter(f=>f.startsWith(match[1])).map(f=>item(f,offset-match[1].length,offset,'File','DeskTile Native SDK header'));}
 return [];
}
function projectRoot(file){
 if(!file)return undefined;for(let at=path.dirname(file);;at=path.dirname(at)){if(fs.existsSync(path.join(at,'manifest.json')))return at;if(path.dirname(at)===at)return undefined;}
}
function register(vscode,context,options){
 const provider={provideCompletionItems(document,position,token){if(token?.isCancellationRequested)return [];try{const text=document.getText(),offset=document.offsetAt(position),sdk=core.sdkRoot(options()),project=projectRoot(document.uri?.fsPath);
  return suggestions(text,offset,{sdk,project,language:document.languageId}).map(value=>{const result=new vscode.CompletionItem(value.label,vscode.CompletionItemKind[value.kind]);result.detail=value.detail;result.insertText=value.snippet?new vscode.SnippetString(value.insertText):value.insertText;result.range=new vscode.Range(document.positionAt(value.start),position);return result;});
 }catch{return [];}}};
 context.subscriptions.push(vscode.languages.registerCompletionItemProvider([{language:'html'},{language:'javascript'},{language:'typescript'},{language:'cpp'},{language:'c'}],provider,'<',' ','.','"',"'",'/', '='));
 return provider;
}
module.exports={suggestions,register,catalog,projectRoot,maskCode};

