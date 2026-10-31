/** DeskTile firmware global bridge. Results: 0 success, negative dt_result error. */
interface DeskTileMenuItem { action: number; label: string; icon?: number; type?: 0 | 1 | 2 | 3; checked?: 0 | 1; }
interface DeskTileScopeOptions { scope?: "page" | "application"; }
interface DeskTilePageContext {
  name: string; params: Record<string, unknown>; state: Record<string, unknown>; store: Record<string, unknown>;
  byId(id: string): number; track(request: number): number;
  navigate(name: string, params?: Record<string, unknown>, settings?: { replace?: boolean }): boolean;
  back(): boolean;
}
interface DeskTileRoute {
  document?: string; render?(context: DeskTilePageContext): string;
  beforeLeave?(context: DeskTilePageContext, reason: string): boolean | void;
  onEnter?(context: DeskTilePageContext, reason: string): void;
  onResume?(context: DeskTilePageContext, reason: string): void;
  onLeave?(context: DeskTilePageContext, reason: string): void;
  onExit?(context: DeskTilePageContext): boolean | void;
  onEvent?(context: DeskTilePageContext, event: number, target: number, value: number): void;
  update?(context: DeskTilePageContext, now: number): void;
  onPermissionResult?(context: DeskTilePageContext, request: number, permission: number, state: number): void;
  onRequestComplete?(context: DeskTilePageContext, request: number, result: number, payload: ArrayBuffer): void;
  onLifecycle?(context: DeskTilePageContext, event: number): void;
}
interface DeskTileRouter {
  navigate(name: string, params?: Record<string, unknown>, settings?: { replace?: boolean }): boolean;
  back(): boolean; backOrExit(): number | boolean; depth(): number;
  current(): { name: string; params: Record<string, unknown>; state: Record<string, unknown> } | null;
  track(request: number): number; dispatch(name: string, args: unknown[]): unknown; store: Record<string, unknown>;
}
declare namespace DeskTile {
  const icons: Readonly<{ current(): string | null; select(id: string): number; reset(): number }>;
  function loadDocument(markup: string): number;
  function captureViewState(): Record<string, number>;
  function restoreViewState(state: Record<string, number>): number;
  function requestExit(): number;
  function resourceText(path: string, maximumBytes?: number): string;
  function resourceJson<T = unknown>(path: string): T;
  function require<T = unknown>(path: string): T;
  function template(path: string, values?: Record<string, unknown>): string;
  function loadPage(path: string, values?: Record<string, unknown>): number;
  function capabilities(): { abiMajor: number; abiMinor: number; flags: number };
  const features: Readonly<Record<"modules"|"navigation"|"sharedTemplates"|"listSlots"|"choiceStepper"|"nativeModules"|"listNotes"|"versionCode"|"animatedProgress"|"applicationActionIcons"|"applicationSplash"|"confirmationDialogs"|"systemColorScheme"|"embeddedDocumentEditor"|"platformServices"|"sharedData"|"pointerInput"|"dateTimePicker"|"locales"|"publicFiles"|"listDividerContext"|"canvasClipping"|"filePicker"|"canvasWaves"|"componentRead"|"textMetrics"|"scrollPosition"|"taskDueTime"|"textStrikethrough",boolean>>;
  function createRouter(routes: Record<string, string | DeskTileRoute>, options?: { initial?: string; params?: Record<string, unknown>; store?: Record<string, unknown>; historyLimit?: number }): DeskTileRouter;
  let router: DeskTileRouter | undefined;
  const resources: Readonly<{ read: typeof resourceRead; size: typeof resourceSize; readRange: typeof resourceReadRange; text: typeof resourceText; json: typeof resourceJson; require: typeof require; template: typeof template }>;
  const navigation: Readonly<{ createRouter: typeof createRouter; loadPage: typeof loadPage }>;
  const app: Readonly<{ requestExit: typeof requestExit; registerMenu: typeof registerMenu; capabilities: typeof capabilities }>;
  const ui: Readonly<{ create: typeof create; append: typeof append; byId: typeof byId; loadDocument: typeof loadDocument; present: typeof present }>;
  function create(componentKind: number): number;
  function append(parent: number, child: number): number;
  function byId(id: string): number;
  function setText(handle: number, property: number, value: string): number;
  function setNumber(handle: number, property: number, value: number): number;
  function setBoolean(handle: number, property: number, value: boolean): number;
  function setColor(handle: number, property: number, value: number): number;
  function setBytes(handle: number, property: number, value: ArrayBuffer): number;
  function present(page: number): number;
  function log(level: number, message: string): void;
  function exit(): number;
  function permission(permissionId: number): 0 | 1 | 2;
  function requestPermission(permissionId: number, reason: string, scope?: DeskTileScopeOptions): number;
  function network(optionsJson: string, scope?: DeskTileScopeOptions): number;
  function keyboard(optionsJson: string, scope?: DeskTileScopeOptions): number;
  function notify(optionsJson: string): number;
  interface NotificationOptions {
    id: string; title: string; body?: string; data?: string;
    /** Event timestamp in Unix seconds, in the past or future. Defaults to posting time. */
    eventTime?: number;
  }
  /** Returns a positive request ID or a negative SDK error. App identity comes from the host. */
  function postNotification(options: NotificationOptions): number;
  function updateNotification(options: NotificationOptions): number;
  function cancelNotification(id: string): number;
  function cancelRequest(requestId: number): number;
  function storageRead(key: string): ArrayBuffer | null;
  function storageWrite(key: string, data: ArrayBuffer): number;
  function storageRemove(key: string): number;
  function cacheRead(key: string): ArrayBuffer | null;
  function cacheWrite(key: string, data: ArrayBuffer): number;
  function cacheRemove(key: string): number;
  function resourceRead(path: string): ArrayBuffer | null;
  function resourceSize(path: string): number;
  function resourceReadRange(path: string, offset: number, length: number): ArrayBuffer | null;
  function deviceState(): { batteryPercent: number; wifiConnected: boolean; displayAwake: boolean; powerSource: number; freeHeapBytes: number; freePsramBytes: number; model: string; serial: string } | null;
  function launchInfo(): { origin: number; exitIcon: number } | null;
  function registerMenu(items: DeskTileMenuItem[]): number;
  function monotonicMs(): number;
  function wallClockSeconds(): number;
  function bootId(): number;
  function measureText(text: string, size: number): number;
}

declare function enter(): void;
declare function leave(): void;
declare function update(now: number): void;
declare function onExit(): boolean | void;
declare function onEvent(event: number, target: number, value: number): void;
declare function onPermissionResult(request: number, permission: number, state: number): void;
declare function onRequestComplete(request: number, result: number, payload: ArrayBuffer): void;
declare function onLifecycle(event: number): void;

declare namespace DeskTile {
  function destroy(target:number):number;
  function storageReadResult(key:string):import("./platform").StorageReadResult;
  function platformRequest(json:string,settings?:import("./platform").RequestScope):number;
  function platform(operation:string,options?:Record<string,unknown>,settings?:import("./platform").RequestScope):number;
  function platformResult<T=unknown>(payload:ArrayBuffer):T;
  function colorScheme():import("./platform").ColorScheme|null;
  function localeInfo():import("./platform").LocaleInfo|null;
  function createI18n(catalogPath?:string):import("./platform").I18n;
  function utf8Encode(value:string):Uint8Array & {readonly buffer:ArrayBuffer};
  function utf8Decode(value:ArrayBuffer|Uint8Array):string;
  function createDateTimePicker(options?:import("./components").DateTimePickerOptions):number;
  function configureDateTimePicker(target:number,options:import("./components").DateTimePickerOptions):number;
  function setListFollowingContent(target:number,value:boolean):number;
  function documentLayout(text:string,width:number,headings?:boolean,target?:number):{height:number;cursor:number;color:number}|number;
  function documentEditor(target:number):{text:string;cursor:number;scroll:number;focused:boolean;height:number}|null;
  const tasks:Readonly<import("./platform").TaskApi>;
  const bluetooth:Readonly<import("./platform").BluetoothApi>;
  const data:Readonly<import("./platform").SharedDataApi>;
  const files:Readonly<import("./platform").FilesApi>;
  const locale:Readonly<import("./platform").LocaleApi>;
  function normalizeLocale(tag:string):string;
  function fileBytes(result:import("./platform").FileReadResult):Uint8Array;
  function fileBase64(data:ArrayBuffer|Uint8Array):string;
  const foregroundRoles:Readonly<{default:0;accent:1;danger:2;supporting:3;body:4;disabled:5;primary:6;success:7;warning:8}>;
  const canvasClipping:boolean,canvasWaves:boolean;
}
declare function onPointer(kind:number,event:import("./components").PointerEvent):void;
declare function onDateTimeChanged(target:number,day:number,minute:number):void;
declare function onLanguageChanged(locale:string):void;
/** Delivered after the banner opens this application. */
declare function onNotification(notification: {id:string;data:string}):void;
