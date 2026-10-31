const TEXT=0,VISIBLE=4,ENABLED=5,PLACEHOLDER=56;
const handles={};
const launch=typeof DeskTile.launchInfo==='function'?DeskTile.launchInfo():null;
const exitIcon=launch?launch.exitIcon:13;
const lastText={},lastVisible={};
let localizedIndex='',dividerColor=-1;
function handle(id){return handles[id]||(handles[id]=DeskTile.byId(id));}
for(const id of ['new','back','save','body','delete','import','export','info-close','message-cancel','message-ok','error-close','discard','delete-cancel','delete-confirm'])handles[id]=DeskTile.byId(id);
const rows=Array.from({length:24},(_,i)=>DeskTile.byId('note-'+i));
let notes=[],selected=-1,pendingRequest=0,draft='',editing=false;
let storageHealthy=true,infoOpen=false,message='',messageTitle='',messageKind='',exitAfterEditor=false;
let fileKind='',exportText='',exportPath='',permissionRequest=0;
const language=DeskTile.createI18n('locales/catalog.json');
function fileText(key){return language.t(key);}
function localize(){
  const column=language.locale();if(localizedIndex===column)return;
  for(const id of ['app-title','empty-title','empty-body','about-title','about-body','about-storage','delete-title','delete-body','save-title','save-body','info-close','delete-cancel','delete-confirm','message-cancel','discard','message-ok','error-close']){
    const key={'app-title':'title','empty-title':'empty','empty-body':'emptyBody','about-title':'about','about-body':'aboutBody','about-storage':'aboutStorage','delete-title':'confirmDelete','delete-body':'deleteBody','save-title':'confirmSave','save-body':'unsaved','info-close':'close','delete-cancel':'cancel','delete-confirm':'delete','message-cancel':'cancel','discard':'discard','message-ok':'save','error-close':'close'}[id];text(id,fileText(key));
  }
  for(const pair of [['new','new'],['save','saveLabel'],['delete','deleteLabel'],['import','import'],['export','export'],['body','editLabel']]){const key='label:'+pair[0],value=fileText(pair[1]);if(lastText[key]!==value&&DeskTile.setText(handle(pair[0]),1,value)===0)lastText[key]=value;}
  const placeholder=fileText('placeholder');if(lastText.placeholder!==placeholder&&DeskTile.setText(handles.body,PLACEHOLDER,placeholder)===0)lastText.placeholder=placeholder;
  localizedIndex=column;
}
function fileMenu(){
  if(typeof DeskTile.registerMenu!=='function')return;
  const items=[];
  items.push({action:102,label:fileText('about'),icon:37,type:0});
  DeskTile.registerMenu(items);
}
function fileRequest(request,kind){
  if(!Number.isInteger(request)||request<=0){fileKind='';showMessage('failure',kind.startsWith('export')?'writeFailure':'readFailure');return false;}
  pendingRequest=request;fileKind=kind;render();return true;
}
function selectFile(kind){
  if(kind==='import')fileRequest(DeskTile.files.pick({mode:'open',extensions:['txt','md'],maximum_bytes:512}),'importPick');
  else{
    const title=(exportText.split('\n')[0]||'note').trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').replace(/[ .]+$/,'');
    const name=Array.from(title||'note').slice(0,48).join('')+'.txt';
    fileRequest(DeskTile.files.pick({mode:'save',directory:'',name,extensions:['txt']}),'exportPick');
  }
}
function beginFile(kind){
  if(pendingRequest||permissionRequest||!storageHealthy)return;
  if(!DeskTile.features||!DeskTile.features.filePicker){showMessage('failure','upgrade');return;}
  if(kind==='export'){if(!editing||!draft.trim())return;exportText=draft;}
  const permission=kind==='import'?2:3,state=DeskTile.permission(permission);
  fileKind=kind;
  if(state===1)selectFile(kind);
  else if(state===0){const id=DeskTile.requestPermission(permission,fileText(kind==='import'?'readReason':'writeReason'));if(id>0){permissionRequest=id;render();}else{fileKind='';exportText='';showMessage('failure',kind==='import'?'readFailure':'writeFailure');}}
  else{fileKind='';exportText='';showMessage('denied','deniedBody');}
}
function onPermissionResult(request,permission,state){
  if(request!==permissionRequest)return;permissionRequest=0;const kind=fileKind;fileKind='';
  if(state===1)selectFile(kind);else{exportText='';showMessage('denied','deniedBody');}
}
function text(id,value){if(lastText[id]!==value&&DeskTile.setText(handle(id),TEXT,value)===0)lastText[id]=value;}
function visible(id,value){if(lastVisible[id]!==value&&DeskTile.setBoolean(handle(id),VISIBLE,value)===0)lastVisible[id]=value;}
function encode(value){const bytes=[];for(const c of value){const cp=c.codePointAt(0);if(cp<128)bytes.push(cp);else if(cp<2048)bytes.push(192|(cp>>6),128|(cp&63));else if(cp<65536)bytes.push(224|(cp>>12),128|((cp>>6)&63),128|(cp&63));else bytes.push(240|(cp>>18),128|((cp>>12)&63),128|((cp>>6)&63),128|(cp&63));}return new Uint8Array(bytes).buffer;}
function decode(buffer){const bytes=new Uint8Array(buffer);let value='';for(let i=0;i<bytes.length;){const first=bytes[i++];let cp=first,count=0,minimum=0;if(first>=240&&first<=244){cp&=7;count=3;minimum=65536;}else if(first>=224&&first<240){cp&=15;count=2;minimum=2048;}else if(first>=194&&first<224){cp&=31;count=1;minimum=128;}else if(first>=128)throw Error('Invalid text');while(count--){if(i>=bytes.length||(bytes[i]&192)!==128)throw Error('Invalid text');cp=(cp<<6)|(bytes[i++]&63);}if(cp<minimum||cp>1114111||(cp>=55296&&cp<=57343))throw Error('Invalid text');value+=String.fromCodePoint(cp);}return value;}
function dirty(){return editing&&draft!==(selected>=0?notes[selected]:'');}
function showMessage(title,body,kind='error'){messageTitle=title;message=body;messageKind=kind;render();}
function persist(next){if(DeskTile.storageWrite('notes-v1',encode(JSON.stringify({version:1,notes:next})))!==0){showMessage('saveFailure','keepEditor');return false;}notes=next;return true;}
function render(){
  if(dividerColor<0){const colors=DeskTile.colorScheme();if(colors){dividerColor=colors.border;DeskTile.setColor(handle('action-divider'),11,dividerColor);}}
  localize();if(message){text('message-title',fileText(messageTitle));text('message-body',messageKind==='export'?message:fileText(message));}
  fileMenu();text('info-files',fileText('hint'));
  DeskTile.setNumber(handle('navigation-icon'),3,editing?11:exitIcon);
  DeskTile.setText(handles.back,1,fileText(editing||exitIcon!==13?'back':'home'));
  visible('home',!editing);visible('detail',editing);visible('empty',!notes.length);visible('notes-scroll',!!notes.length);visible('new-overlay',!editing);visible('editor-actions',editing);visible('import',!editing);visible('save',editing);visible('delete',editing&&selected>=0);
  DeskTile.setBoolean(handles.new,ENABLED,storageHealthy&&notes.length<24&&!pendingRequest);
  DeskTile.setBoolean(handles.save,ENABLED,storageHealthy&&dirty()&&!pendingRequest);
  DeskTile.setBoolean(handles.delete,ENABLED,storageHealthy&&!pendingRequest);
  for(let i=0;i<24;i++){visible('note-'+i,i<notes.length);if(i>=notes.length)continue;const value=notes[i],parts=value.split('\n'),title=parts[0]||fileText('title');text('title-'+i,Array.from(title).slice(0,21).join('')+(Array.from(title).length>21?'…':''));const preview=parts.length>1?parts.slice(1).join(' '):Array.from(title).slice(21).join('');text('preview-'+i,Array.from(preview.replace(/\s+/g,' ')).slice(0,35).join('')+(Array.from(preview).length>35?'…':''));}
  const keyboardPending=!!pendingRequest&&!fileKind;
  visible('appbar',!keyboardPending);
  if(editing&&typeof DeskTile.documentEditor==='function'){if(!keyboardPending)text('body',draft);const layout=DeskTile.documentLayout(draft,752,true);DeskTile.setNumber(handles.body,16,keyboardPending?148:Math.max(376,48+layout.height));const edges=new Int16Array(keyboardPending?[0,24,8,24]:[24,24,24,24]);DeskTile.setBytes(handles.body,21,edges.buffer);}
  visible('info-dialog',infoOpen);visible('delete-dialog',!!message&&messageKind==='delete');visible('save-confirm-dialog',!!message&&messageKind==='leave');visible('message-dialog',!!message&&messageKind!=='delete'&&messageKind!=='leave');
}
function enter(){
  let stored=null,result=-6;
  if(typeof DeskTile.storageReadResult==='function'){const read=DeskTile.storageReadResult('notes-v1');result=read.result;stored=read.data;}
  else{stored=DeskTile.storageRead('notes-v1');if(stored!==null)result=0;}
  if(result!==0&&result!==-8){storageHealthy=false;showMessage('readError','readLater');}
  else if(result===0){try{const data=JSON.parse(decode(stored));if(data.version!==1||!Array.isArray(data.notes)||data.notes.length>24||data.notes.some(n=>typeof n!=='string'||encode(n).byteLength>512))throw Error('Invalid notes');notes=data.notes;}catch(_){storageHealthy=false;showMessage('readError','readCorrupt');}}
  render();
}
function open(index,initial=''){if(typeof DeskTile.documentEditor!=='function'){showMessage('editUnavailable','upgrade');return;}selected=index;draft=index>=0?notes[index]:initial;editing=true;render();}
function save(){if(!storageHealthy||!editing)return false;const value=draft;if(!value.trim()){showMessage('blank','writeFirst');return false;}if(encode(value).byteLength>512){showMessage('tooLong','overLimit');return false;}const next=notes.slice();if(selected<0)next.push(value);else next[selected]=value;if(!persist(next))return false;if(selected<0)selected=notes.length-1;draft=value;render();return true;}
function closeEditor(){editing=false;selected=-1;draft='';message='';messageKind='';render();if(exitAfterEditor){exitAfterEditor=false;DeskTile.exit();}}
function onExit(){if(pendingRequest||permissionRequest)return;if(dirty()){exitAfterEditor=true;infoOpen=false;showMessage('confirmSave','unsaved','leave');}else DeskTile.exit();}
function onEvent(event,target){
  if(event===9){if(target===102&&!pendingRequest&&!permissionRequest&&!message){infoOpen=true;render();}return;}
  if(event===2&&target===handles.body){const editor=DeskTile.documentEditor(handles.body);if(editor){draft=editor.text;lastText.body=draft;}return;}
  if(event!==0||pendingRequest||permissionRequest)return;
  if(message){if(target===(messageKind==='delete'?handles['delete-cancel']:messageKind==='leave'?handles['message-cancel']:handles['error-close'])||target===handles.back){message='';messageKind='';exitAfterEditor=false;render();}else if(target===handles.discard&&messageKind==='leave')closeEditor();else if(target===(messageKind==='delete'?handles['delete-confirm']:handles['message-ok'])){const kind=messageKind;message='';messageKind='';if(kind==='delete'){if(persist(notes.filter((_,i)=>i!==selected)))closeEditor();}else if(kind==='leave'){if(save())closeEditor();}render();}return;}
  if(target===handles['info-close']||(infoOpen&&target===handles.back)){infoOpen=false;render();return;}if(infoOpen)return;
  if(target===handles.import&&!editing&&notes.length<24){beginFile('import');return;}
  if(target===handles.export&&editing){beginFile('export');return;}
  if(target===handles.new&&storageHealthy&&notes.length<24)open(-1);
  else if(target===handles.body&&editing&&storageHealthy){const editor=DeskTile.documentEditor(handles.body);pendingRequest=DeskTile.keyboard(JSON.stringify({title:fileText('title'),presentation:'embedded_document',editor_target:handles.body,initial:draft,cursor_byte:editor.cursor,placeholder:fileText('placeholder'),input_type:'multiline',maximum_length:512}));if(!Number.isInteger(pendingRequest)||pendingRequest<=0){pendingRequest=0;showMessage('editUnavailable','retry');}render();}
  else if(target===handles.save){save();render();}
  else if(target===handles.back){if(!editing)DeskTile.exit();else if(dirty())showMessage('confirmSave','unsaved','leave');else closeEditor();}
  else if(target===handles.delete&&selected>=0)showMessage('confirmDelete','deleteBody','delete');
  else{const row=rows.indexOf(target);if(row>=0&&row<notes.length)open(row);}
}
function onRequestComplete(request,result,payload){
  if(!pendingRequest||request!==pendingRequest)return;pendingRequest=0;
  const kind=fileKind;fileKind='';
  if(result===-5){if(kind){exportText='';exportPath='';}render();return;}
  if(kind){completeFile(kind,result,payload);return;}
  if(result!==0){showMessage('editIncomplete','keepOriginal');return;}
  try{const value=decode(payload);if(encode(value).byteLength>512)throw Error('Too long');draft=value;render();}catch(_){showMessage('textReadError','keepOriginal');}
}
function completeFile(kind,result,payload){
  if(result!==0){exportText='';exportPath='';showMessage('failure',kind.startsWith('export')?'writeFailure':'readFailure');return;}
  try{
    const value=DeskTile.platformResult(payload);
    if(kind==='importPick'||kind==='exportPick'){
      if(value.schema!==1||value.provider!=='hk.caner.desktile.files'||value.mode!==(kind==='importPick'?'open':'save')||typeof value.path!=='string'||!value.path||value.path.length>1000)throw Error('Invalid selection');
      if(kind==='importPick')fileRequest(DeskTile.files.read(value.path,{scope:'user',maximum_bytes:513}),'importRead');
      else{exportPath=value.path;fileRequest(DeskTile.files.writeText(exportPath,exportText,{scope:'user',create_only:true}),'exportWrite');}
    }else if(kind==='importRead'){
      if(value.eof!==true||notes.length>=24)throw Error('Incomplete text');
      const bytes=DeskTile.files.bytes(value);if(bytes.byteLength>512)throw Error('Too long');
      const content=decode(bytes.buffer);if(!content.trim()||content.includes('\0'))throw Error('Invalid text');
      open(-1,content);
    }else if(kind==='exportWrite'){
      if(value.bytes!==String(encode(exportText).byteLength))throw Error('Invalid write result');
      showMessage('complete',exportPath,'export');exportText='';exportPath='';
    }
  }catch(_){exportText='';exportPath='';showMessage(kind==='importRead'?'invalid':'failure',kind==='importRead'?'invalidBody':kind.startsWith('export')?'writeFailure':'readFailure');}
}
function themeChanged(){dividerColor=-1;render();}
function onLanguageChanged(){render();}
