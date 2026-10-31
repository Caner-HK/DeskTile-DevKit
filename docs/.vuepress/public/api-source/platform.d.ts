export type TaskId = string;
export type StorageReadResult = {result:0;data:ArrayBuffer} | {result:number;data:null};
export interface PrivateStorageApi {
  storageReadResult(key:string):StorageReadResult;
  storageWrite(key:string,value:ArrayBuffer):number;
  storageRemove(key:string):number;
}
export interface LocaleInfo {systemLocale:string;applicationLocale:string;requestedLocale:string;timezone:string;utcOffsetMinutes:number;use24Hour:boolean;registered:boolean;}
export interface LocaleSnapshot {system_locale:string;locale:string;requested:string;registered:boolean;default:string;supported:string[];}
export interface LocaleApi {
  get(settings?:RequestScope):number;
  register(options:{default:string;supported:string[]},settings?:RequestScope):number;
  set(requested:string,settings?:RequestScope):number;
}
export interface I18n {
  locale():string;supported():string[];select(requested:string):string;register(settings?:RequestScope):number;
  t(key:string,parameters?:Record<string,string|number>):string;
  formatDate(isoDate:string):string;formatTime(localMinute:number,options?:{use24Hour?:boolean}):string;
}
export type FileScope = 'private' | 'user';
export type TaskState = 'queued' | 'running' | 'waiting' | 'waiting_for_user' | 'succeeded' | 'failed' | 'cancelled';
export interface FileVerifyPayload { source: string; source_scope?: FileScope; sha256?: string; }
export interface FileCopyPayload extends FileVerifyPayload { target: string; target_scope?: FileScope; recursive?:boolean; }
export interface DownloadPayload { url: string; target: string; target_scope?: FileScope; sha256?: string; maximum_bytes?: number; }
export type TaskSubmission = {
  title: string; unique_key?: string; visible?: boolean; payload_version?: 1;
} & ({ type: 'file.verify'; payload: FileVerifyPayload } |
     { type: 'file.copy'; payload: FileCopyPayload } |
     { type: 'file.move'; payload: FileCopyPayload } |
     { type: 'network.download'; payload: DownloadPayload });
export interface TaskSnapshot {
  id: TaskId; revision: number; attempt: number; type: string; title: string;
  state: TaskState; stage: string; error: string; bytes_done: string; bytes_total: string;
  indeterminate: boolean; visible: boolean; cancellable: boolean; cancel_requested: boolean;
  created_at: number; updated_at: number; result?: { sha256: string; bytes: string };
}
export interface RequestScope { scope?: 'page' | 'application'; }
export interface TaskApi {
  /** Exact task IDs whose progress is visible. Clear when covering or leaving the page. */
  presented(ids: TaskId[], settings?: RequestScope): number;
  submit(options: TaskSubmission, settings?: RequestScope): number;
  list(settings?: RequestScope): number;
  get(id: TaskId, settings?: RequestScope): number;
  cancel(id: TaskId, settings?: RequestScope): number;
  retry(id: TaskId, settings?: RequestScope): number;
  remove(id: TaskId, settings?: RequestScope): number;
}
export interface PlatformApi {
  bluetooth:Readonly<BluetoothApi>;
  colorScheme():Readonly<ColorScheme>|null;
  platform(operation: string, options?: object, settings?: RequestScope): number;
  platformResult<T = unknown>(buffer: ArrayBuffer): T;
  tasks: Readonly<TaskApi>;
  data: Readonly<SharedDataApi>;
  files: Readonly<FilesApi>;
}
export interface BluetoothDevice {
  address:string;addressType:0|1;name:string;rssi:number;connectable:boolean;
}
export type BluetoothPairingAction = 'input' | 'display' | 'confirm';
export interface BluetoothSecurity {
  pairing:boolean;pairingAction:BluetoothPairingAction|'none';prompt:number;passkey:number;
  encrypted:boolean;authenticated:boolean;bonded:boolean;
}
export interface BluetoothConnection extends BluetoothDevice, Partial<BluetoothSecurity> {connection:number;connected:boolean;system:boolean;}
export interface BluetoothStatus {schema:1;enabled:boolean;ready:boolean;systemConnections:boolean;uuidGatt:boolean;connectionLimit:number;droppedEvents:number;connections:BluetoothConnection[];}
export interface BluetoothEvent extends BluetoothDevice, Partial<BluetoothSecurity> {
  schema:1;event:'advertisement'|'scanFinished'|'connected'|'disconnected'|'read'|'write'|'notification'|'reset'|'pairing'|'securityChanged'|'subscribed'|'unsubscribed'|'services'|'characteristics'|'descriptors';
  sequence:number;connection:number;request:number;result:number;detail:number;attribute:number;
  scanResponse:boolean;truncated:boolean;data:string;
  serviceUuid?:string;characteristicUuid?:string;descriptorUuid?:string;
  endAttribute?:number;properties?:number;complete?:boolean;
}
export type BluetoothNextEvent=BluetoothEvent|{schema:1;event:null};
export interface BluetoothApi {
  status(settings?:RequestScope):number;
  scan(options?:{durationMs?:number;passive?:boolean},settings?:RequestScope):number;
  listen(settings?:RequestScope):number;
  stopScan(settings?:RequestScope):number;
  connect(address:string,addressType:0|1,settings?:RequestScope):number;
  disconnect(connection:number,settings?:RequestScope):number;
  attach(connection:number,settings?:RequestScope):number;
  detach(connection:number,settings?:RequestScope):number;
  pair(connection:number,settings?:RequestScope):number;
  pairingReply(connection:number,action:BluetoothPairingAction,prompt:number,passkey:number,accept:boolean,settings?:RequestScope):number;
  read(connection:number,attribute:number,settings?:RequestScope):number;
  discoverServices(connection:number,serviceUuid?:string|null,settings?:RequestScope):number;
  discoverCharacteristics(connection:number,serviceUuid:string,characteristicUuid?:string|null,settings?:RequestScope):number;
  discoverDescriptors(connection:number,serviceUuid:string,characteristicUuid:string,descriptorUuid?:string|null,settings?:RequestScope):number;
  readUuid(connection:number,serviceUuid:string,characteristicUuid:string,settings?:RequestScope):number;
  subscribe(connection:number,serviceUuid:string,characteristicUuid:string,settings?:RequestScope):number;
  unsubscribe(connection:number,serviceUuid:string,characteristicUuid:string,settings?:RequestScope):number;
  write(connection:number,attribute:number,data:string,settings?:RequestScope):number;
  nextEvent(timeoutMs?:number,settings?:RequestScope):number;
}
export interface ColorScheme {
  background:number;surface:number;header:number;raised:number;alternate:number;sidebar:number;
  primaryText:number;bodyText:number;supportingText:number;disabledText:number;border:number;
  accent:number;onAccent:number;listPressed:number;success:number;warning:number;danger:number;dangerFill:number;onDanger:number;
  keyboard:number;key:number;input:number;inputText:number;pressed:number;onPressed:number;
  selectionBorder:number;switchTrack:number;switchInk:number;iconInk:number;
}
export type SharedCollection = 'lists' | 'tasks' | 'events';
export interface SharedRecord {
  id: string; revision: number; collection: SharedCollection; title: string;
  creator: string; created_at: number; updated_at: number; notes?: string;
  color?: number; parent?: string; completed?: boolean; due_date?: string | null; due_time?: string | null;
  all_day?: boolean; start?: string; end?: string;
}
export interface SharedFields {
  title?: string; notes?: string; color?: number; parent?: string; completed?: boolean;
  due_date?: string | null; due_time?: string | null; all_day?: boolean; start?: string; end?: string;
}
export interface SharedDataApi {
  list(kind: SharedCollection, options?: {offset?: number; limit?: number; parent?: string; include_completed?: boolean; include_notes?: boolean}, settings?: RequestScope): number;
  get(kind: SharedCollection, id: string, settings?: RequestScope): number;
  create(kind: SharedCollection, fields: SharedFields, clientKey?: string, settings?: RequestScope): number;
  update(kind: SharedCollection, id: string, revision: number, fields: SharedFields, settings?: RequestScope): number;
  remove(kind: SharedCollection, id: string, revision: number, settings?: RequestScope): number;
}
export interface FileOptions { scope?: FileScope; }
export interface FileMetadata {name:string; directory:boolean; type:'directory'|'text'|'image'|'audio'|'video'|'archive'|'pdf'|'package'|'file';bytes:string;modified_at:number|null;}
export interface FileReadResult {data_base64:string;offset:string;next_offset:string;file_bytes:string;eof:boolean;}
export interface FileWriteOptions extends FileOptions {create_only?:boolean;expected_sha256?:string;}
export interface FileTransferOptions extends FileOptions {target_scope?:FileScope;title?:string;}
export interface FilesApi {
  pick(options?:FilePickerOptions,settings?:RequestScope):number;
  list(path?:string,options?:FileOptions&{offset?:number;limit?:number},settings?:RequestScope):number;
  stat(path:string,options?:FileOptions,settings?:RequestScope):number;
  read(path:string,options?:FileOptions&{offset?:string;maximum_bytes?:number},settings?:RequestScope):number;
  write(path:string,options:FileWriteOptions&({text:string}|{data_base64:string}),settings?:RequestScope):number;
  writeText(path:string,text:string,options?:FileWriteOptions,settings?:RequestScope):number;
  writeBytes(path:string,bytes:Uint8Array|ArrayBuffer,options?:FileWriteOptions,settings?:RequestScope):number;
  mkdir(path:string,options?:FileOptions,settings?:RequestScope):number;
  rename(path:string,name:string,options?:FileOptions,settings?:RequestScope):number;
  move(path:string,target:string,options?:FileTransferOptions,settings?:RequestScope):number;
  copy(path:string,target:string,options?:FileTransferOptions,settings?:RequestScope):number;
  remove(path:string,options?:FileOptions&{recursive?:boolean},settings?:RequestScope):number;
  bytes(result:FileReadResult):Uint8Array;
  text(result:FileReadResult):string;
}
export interface FilePickerOptions {mode?:'open'|'save';directory?:string;name?:string;extensions?:string[];maximum_bytes?:number;}
export interface FilePickerResult {schema:1;provider:'hk.caner.desktile.files';mode:'open'|'save';path:string;}
