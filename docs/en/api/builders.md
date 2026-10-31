# UI builders

[Documentation home](/en/) / [API reference](/en/api/)

Read [component patterns](../components/patterns.md) for common layouts. These are the same declarations used for editor completion.

<!-- page-outline -->
[[toc]]

## settingsPath

```ts
export function settingsPath(levels:readonly string[]):string;
```

## ListRowOptions

```ts
export interface ListRowOptions {
  id: string; label?: string | number; enabled?: boolean; icon?: number;
  density?: 'comfortable' | 'compact'; height?: number;
  summary?: string; summaryPosition?: 'middle' | 'trailing';
  toggle?: { id: string; checked?: boolean; enabled?: boolean };
}
```

## listRow

```ts
export function listRow(options: ListRowOptions): string;
```

## listNote

```ts
export function listNote(options: { id?: string; text?: string }): string;
```

## MenuOptions

```ts
export interface MenuOptions {
  /** Native PopupMenu geometry. Place the returned embedded panel in an overlay;
   * the application handles outside clicks and closes it after an action. */
  id: string; title?: string; showHeader?: boolean; width?: number;
  items?: Array<{ id: string; label?: string; icon?: number; enabled?: boolean; destructive?: boolean }>;
}
```

## menu

```ts
export function menu(options: MenuOptions): string;
```

## ConfirmationOptions

```ts
export interface ConfirmationOptions {
  id: string; title: string; body: string; visible?: boolean; width?: number; maximumHeight?: number;
  actions: Array<{ id: string; label: string; icon?: number; destructive?: boolean }>;
}
```

## confirmation

```ts
export function confirmation(options: ConfirmationOptions): string;
```

## NumberStepperOptions

```ts
export interface NumberStepperOptions {
  id: string; value?: string | number; unit?: string; symbols?: 'arrows' | 'plus-minus';
  width?: number; buttonHeight?: number; valueHeight?: number; gap?: number;
  numberSize?: number; unitSize?: number; unitGap?: number; repeatInterval?: number;
}
```

## choicePolicy

```ts
export function choicePolicy(count: number): Readonly<{ opensPicker: boolean; next(selected: number): number }>;
```

## numberStepper

```ts
export function numberStepper(options: NumberStepperOptions): string;
```

## DateTimePickerOptions

```ts
export interface DateTimePickerOptions {
  mode?: 'both'|'date'|'time'; symbols?: 'arrows'|'plus-minus';
  date?: string; time?: string|number; minimumDate?: string; maximumDate?: string;
  minimumTime?: string|number; maximumTime?: string|number; minuteStep?: number;
  dateLabel?: string; timeLabel?: string; units?: [string,string,string,string,string];
  buttonHeight?: number; valueHeight?: number; verticalGap?: number; columnGap?: number;
  groupGap?: number; numberSize?: number; unitSize?: number; unitGap?: number;
  titleHeight?: number; titleGap?: number;
}
```

## EmbeddedInputApi

```ts
export interface EmbeddedInputApi {
  createDateTimePicker(options?: DateTimePickerOptions): number;
  configureDateTimePicker(target: number, options: DateTimePickerOptions): number;
}
```

## ProgressOptions

```ts
export interface ProgressOptions {
  id?: string; style?: 'squares' | 'bars' | 'determinate'; width?: number; height?: number;
  minimum?:number;maximum?:number;value?:number;
  duration?: number; delay?: number; itemSize?: number; itemGap?: number;
}
```

## progress

```ts
export function progress(options?: ProgressOptions): string;
```

## PointerEvent

```ts
export interface PointerEvent {
  target: number; x: number; y: number; localX: number; localY: number;
  pointerId: 0; monotonicMs: number;
}
```

## NavigationMode

```ts
export type NavigationMode='hidden'|'icons'|'labels';
```

## NavigationPolicy

```ts
export interface NavigationPolicy {initial?:NavigationMode;opened?:NavigationMode;dismissed?:NavigationMode;permanentIcons?:boolean;primaryOpens?:boolean;allowHideIcons?:boolean;dismissIconsOnSelection?:boolean;}
```

## Rect

```ts
export interface Rect {x:number;y:number;w:number;h:number;}
```

## NavigationLayout

```ts
export interface NavigationLayout {primary:Rect;panel:Rect;content:Rect;divider:Rect;rowHeight:64;padding:8;item(index:number,count:number,bottomCount?:number):Rect;indicator(item:Rect):Rect;bottomDivider(count:number,bottomCount:number):Rect;}
```

## NavigationState

```ts
export interface NavigationState {readonly mode:NavigationMode;readonly policy:Readonly<Required<NavigationPolicy>>;visible():boolean;canClose():boolean;primary(heldOriginal?:boolean):'original'|'menu'|'menu-open';toggle():boolean;dismiss():boolean;selected():boolean;occupiedWidth(iconWidth?:number):number;layout(body:Rect,options?:{iconWidth?:number;labelWidth?:number;appBarHeight?:number}):NavigationLayout;}
```

## createNavigation

```ts
export function createNavigation(options?:NavigationPolicy):Readonly<NavigationState>;
```

## scaffoldLayout

```ts
export function scaffoldLayout(viewport:Rect,state:NavigationState,options?:{statusVisible?:boolean;appBarVisible?:boolean;iconWidth?:number;labelWidth?:number}):{statusBar:Rect;appBar:Rect;body:Rect;content:Rect;navigation:NavigationLayout};
```

## NavigationEntry

```ts
export interface NavigationEntry {label:string;icon?:number;enabled?:boolean;}
```

## ScaffoldOptions

```ts
export interface ScaffoldOptions {
  id:string;title:string;items?:NavigationEntry[];bottomCount?:number;navigation?:NavigationPolicy;
  viewport?:Rect;statusVisible?:boolean;appBarVisible?:boolean;iconWidth?:number;labelWidth?:number;
  originalIcon?:number;originalHoldMs?:number;animateNavigation?:boolean;
}
```

## ScaffoldOutcome

```ts
export interface ScaffoldOutcome {action:'none'|'selected'|'original';index:number;consumed:boolean;result:number;}
```

## ScaffoldBridge

```ts
export interface ScaffoldBridge {
  features?:{pointerInput?:boolean};
  launchInfo?():{exitIcon:number;origin?:number}|null;
  loadDocument(markup:string):number;byId(id:string):number;destroy(target:number):number;
  setText(target:number,property:number,value:string):number;
  setNumber(target:number,property:number,value:number):number;
  setBoolean(target:number,property:number,value:boolean):number;
  setColor(target:number,property:number,value:number):number;
  setBytes(target:number,property:number,value:ArrayBuffer):number;
  colorScheme?():{header:number;primaryText:number;border:number;accent:number;pressed:number;onPressed:number}|null;
}
```

## ScaffoldView

```ts
export interface ScaffoldView {
  readonly root:number;readonly content:number;readonly actions:number;readonly primary:number;
  readonly state:Readonly<NavigationState>;item(index:number):number;
  layout():ReturnType<typeof scaffoldLayout>;
  markup(content?:string,actions?:string):string;
  mount(bridge:ScaffoldBridge,content?:string,actions?:string):number;
  refresh():number;select(index:number):number;setTitle(title:string):number;
  setEntry(index:number,entry:NavigationEntry):number;
  activate(target:number|string):ScaffoldOutcome;event(type:number,target:number):ScaffoldOutcome;
  pointer(type:number,event:PointerEvent):ScaffoldOutcome;tick(monotonicMs:number):ScaffoldOutcome;
  destroy():number;
}
```

## createScaffold

```ts
export function createScaffold(options:ScaffoldOptions):Readonly<ScaffoldView>;
```

## Type declarations

[Download](/api-source/components.d.ts).
