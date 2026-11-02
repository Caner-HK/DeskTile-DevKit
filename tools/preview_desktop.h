// Desktop-only window layout. Application coordinates remain 800 x 480.
#include "src/graphics/StatusBarLayout.h"
static int setenv(const char*name,const char*value,int overwrite){return !overwrite&&getenv(name)?0:_putenv_s(name,value);}
#include "src/system/UiSupport.h"
Rect Preview::appMenuRow(size_t index,size_t count)const{return ui_support::appMenuExtensionBounds(index,count);}
void Preview::drawAppMenu(){
 const auto&t=ui::theme();ui::sideDialog(canvas,t.accent);
 const bool chinese=services.locale.rfind("zh",0)==0,traditional=services.locale=="zh-HK"||services.locale=="zh-TW";
 ui::sideDialogTitle(canvas,chinese?(traditional?"應用程式選單":"应用菜单"):"App menu");
 size_t count=0;const auto*items=host.appMenuItems(count,owner);
 const int actionsTop=count?appMenuRow(0,count).y:ui_support::kAppMenuCancelButton.y;
 if(ui::sizedTextWidth(displayName.c_str(),22,canvas.traditionalUiFont())<=312)ui::sideDialogSubtitle(canvas,displayName.c_str());
 else{const int top=count>=3?112:124;ui::paragraph(canvas,{464,top,312,actionsTop-top},displayName.c_str(),t.secondaryText,22,22);}
 if(count){const auto r=ui_support::kAppMenuDivider;canvas.fillRect(r.x,r.y,r.w,r.h,t.border);}
 for(size_t i=0;i<count;++i){const auto r=appMenuRow(i,count);const bool enabled=!(items[i].type&DT_APP_MENU_DISABLED);const auto ink=enabled?t.primaryText:t.disabledText;
  if(items[i].type&DT_APP_MENU_TOGGLE){ui::icon(canvas,static_cast<ui_icons::Id>(items[i].icon),{r.x+12,r.y+(r.h-24)/2,24,24},ink);ui::ellipsizedText(canvas,{r.x+48,r.y,r.w-132,r.h},items[i].label,ink);ui::toggle(canvas,{r.x+r.w-76,r.y+(r.h-40)/2,72,40},items[i].checked,t.raised,enabled);}
  else ui::settingsIconTextButton(canvas,r,items[i].label,static_cast<ui_icons::Id>(items[i].icon),ui::tonalButtonFill(t.raised),ink,enabled&&appMenuPressed==int(i));
 }
 ui::settingsIconTextButton(canvas,ui_support::kAppMenuCancelButton,chinese?"取消":"Cancel",ui_icons::Id::Close,ui::tonalButtonFill(t.raised),t.primaryText,appMenuPressed==100);
 ui::settingsIconTextButton(canvas,ui_support::kAppMenuExitButton,chinese?(traditional?"離開":"退出"):"Exit",ui_icons::Id::Home,t.accent,t.onAccent,appMenuPressed==101);
}
int Preview::appMenuHit(int x,int y){
 auto inside=[&](Rect r){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;};
 if(!inside(ui_support::kAppMenuPanel))return 102;
 if(inside(ui_support::kAppMenuCancelButton))return 100;
 if(inside(ui_support::kAppMenuExitButton))return 101;
 size_t count=0;const auto*items=host.appMenuItems(count,owner);
 for(size_t i=0;i<count;++i)if(inside(appMenuRow(i,count))&&!(items[i].type&DT_APP_MENU_DISABLED))return int(i);
 return -1;
}
void Preview::appMenuPointer(int kind,int x,int y){
 const int hit=appMenuHit(x,y);
 if(kind==0){appMenuPressed=hit;return;}
 if(kind==1){if(hit!=appMenuPressed)appMenuPressed=-1;return;}
 if(kind!=2)return;const int selected=appMenuPressed;appMenuPressed=-1;if(selected<0||selected!=hit)return;
 if(selected==100||selected==102){appMenuVisible=false;return;}
 if(selected==101){appMenuVisible=false;check(app->requestExit(),"Exit application");return;}
 size_t count=0;const auto*items=host.appMenuItems(count,owner);const bool toggle=size_t(selected)<count&&(items[selected].type&DT_APP_MENU_TOGGLE);
 if(host.activateAppMenu(size_t(selected),owner)){appMenuVisible=toggle;route();}
}
RECT Preview::viewport()const{
 RECT client{0,0,800,556};if(window)GetClientRect(window,&client);
 const int top=int(const_cast<Preview*>(this)->toolbarHeight()*dpi)+1,bottom=client.bottom-int(28*dpi)-1;
 const double available=std::max(0.1,std::min(client.right/800.0,(bottom-top)/480.0));
 const double scale=fit?available:std::min(available,zoom);
 const int width=int(800*scale),height=int(480*scale);
 const int left=(client.right-width)/2,y=top+std::max(0,(bottom-top-height)/2);
 return {left,y,left+width,y+height};
}
POINT Preview::logicalPoint(int x,int y)const{const auto r=viewport();return {LONG((x-r.left)*800.0/(r.right-r.left)),LONG((y-r.top)*480.0/(r.bottom-r.top))};}
void Preview::layoutToolbar(){if(window){for(int id=201;id<=206;++id){auto r=controlRect(id);if(auto h=toolbarControl(id))MoveWindow(h,int(r.left*dpi),int(r.top*dpi),int((r.right-r.left)*dpi),int((r.bottom-r.top)*dpi),TRUE);}InvalidateRect(window,nullptr,FALSE);}}
void Preview::resizePreview(){
 if(!window)return;MONITORINFO m{sizeof(m)};GetMonitorInfoW(MonitorFromWindow(window,MONITOR_DEFAULTTONEAREST),&m);
 const double z=fit?1.0:zoom;const int width=int(800*z);RECT r{0,0,width,int(480*z+(toolbarHeight(int(width/dpi))+28)*dpi)+2};
 AdjustWindowRect(&r,GetWindowLongW(window,GWL_STYLE),FALSE);
 SetWindowPos(window,nullptr,0,0,std::min(int(r.right-r.left),int(m.rcWork.right-m.rcWork.left)),std::min(int(r.bottom-r.top),int(m.rcWork.bottom-m.rcWork.top)),SWP_NOMOVE|SWP_NOZORDER);
 InvalidateRect(window,nullptr,FALSE);
}
void Preview::drawStatus(uint16_t ink,uint16_t background){
 char label[16];sprintf_s(label,"%d%%",services.battery);
 const int width=ui::status_bar::textInk(label).w,textX=784-width;
 ui::status_bar::text(canvas,{textX,0,width,32},label,ink);
 const int batteryX=textX-8-ui::status_bar::batteryWidth;
 const auto r=ui::status_bar::batteryBody(batteryX,32);
 canvas.drawRect(r.x,r.y,r.w,r.h,ink,2);canvas.fillRect(r.x+r.w+1,r.y+5,2,7,ink);
 if(services.battery>0)canvas.fillRect(r.x+3,r.y+3,(r.w-6)*services.battery/100,r.h-6,services.battery<=15?ui::theme().danger:ink);
 if(services.wifi){const int x=batteryX-8-24;const auto kind=wifi_icons::signal(services.wifi==1?0:services.wifi-1);const auto b=ui::status_bar::maskBounds({x,0,24,32},kind);wifi_icons::draw(canvas,kind,b.x,b.y,24,ink);}
}

class ToolbarToggleProvider final:public IRawElementProviderSimple,public IToggleProvider{
 LONG references=1;HWND window;int id;
public:
 ToolbarToggleProvider(HWND value,int control):window(value),id(control){}
 HRESULT STDMETHODCALLTYPE QueryInterface(REFIID iid,void**value)override{if(!value)return E_POINTER;*value=nullptr;if(iid==__uuidof(IUnknown)||iid==__uuidof(IRawElementProviderSimple))*value=static_cast<IRawElementProviderSimple*>(this);else if(iid==__uuidof(IToggleProvider))*value=static_cast<IToggleProvider*>(this);else return E_NOINTERFACE;AddRef();return S_OK;}
 ULONG STDMETHODCALLTYPE AddRef()override{return InterlockedIncrement(&references);}
 ULONG STDMETHODCALLTYPE Release()override{const auto count=InterlockedDecrement(&references);if(!count)delete this;return count;}
 HRESULT STDMETHODCALLTYPE get_ProviderOptions(ProviderOptions*value)override{if(!value)return E_POINTER;*value=ProviderOptions_ServerSideProvider;return S_OK;}
 HRESULT STDMETHODCALLTYPE GetPatternProvider(PATTERNID pattern,IUnknown**value)override{if(!value)return E_POINTER;*value=nullptr;if(pattern==UIA_TogglePatternId){*value=static_cast<IToggleProvider*>(this);AddRef();}return S_OK;}
 HRESULT STDMETHODCALLTYPE GetPropertyValue(PROPERTYID property,VARIANT*value)override{
  if(!value)return E_POINTER;VariantInit(value);if(!IsWindow(window))return UIA_E_ELEMENTNOTAVAILABLE;
  if(property==UIA_ControlTypePropertyId){value->vt=VT_I4;value->lVal=UIA_CheckBoxControlTypeId;}
  else if(property==UIA_NamePropertyId||property==UIA_AutomationIdPropertyId){wchar_t text[128];GetWindowTextW(window,text,128);value->vt=VT_BSTR;value->bstrVal=SysAllocString(property==UIA_NamePropertyId?text:std::to_wstring(id).c_str());}
  else if(property==UIA_IsEnabledPropertyId||property==UIA_HasKeyboardFocusPropertyId||property==UIA_IsKeyboardFocusablePropertyId||property==UIA_IsControlElementPropertyId||property==UIA_IsContentElementPropertyId){value->vt=VT_BOOL;value->boolVal=(property==UIA_IsEnabledPropertyId?IsWindowEnabled(window):property==UIA_HasKeyboardFocusPropertyId?GetFocus()==window:true)?VARIANT_TRUE:VARIANT_FALSE;}
  return S_OK;
 }
 HRESULT STDMETHODCALLTYPE get_HostRawElementProvider(IRawElementProviderSimple**value)override{return UiaHostProviderFromHwnd(window,value);}
 HRESULT STDMETHODCALLTYPE Toggle()override{if(!IsWindow(window))return UIA_E_ELEMENTNOTAVAILABLE;if(!IsWindowEnabled(window))return UIA_E_ELEMENTNOTENABLED;SendMessageW(window,WM_APP+41,0,0);return S_OK;}
 HRESULT STDMETHODCALLTYPE get_ToggleState(ToggleState*value)override{if(!value)return E_POINTER;if(!IsWindow(window))return UIA_E_ELEMENTNOTAVAILABLE;*value=SendMessageW(GetDlgItem(GetParent(window),id),BM_GETCHECK,0,0)==BST_CHECKED?ToggleState_On:ToggleState_Off;return S_OK;}
};
static LRESULT CALLBACK toolbarToggleProc(HWND w,UINT message,WPARAM a,LPARAM b){
 auto*p=reinterpret_cast<Preview*>(GetWindowLongPtrW(w,GWLP_USERDATA));if(message==WM_NCCREATE){p=static_cast<Preview*>(reinterpret_cast<CREATESTRUCTW*>(b)->lpCreateParams);SetWindowLongPtrW(w,GWLP_USERDATA,reinterpret_cast<LONG_PTR>(p));}
 if(!p)return DefWindowProcW(w,message,a,b);const int id=GetDlgCtrlID(w)-200;
 auto activate=[&]{const auto before=p->controlChecked(id);p->toolbarCommand(id);auto*provider=new ToolbarToggleProvider(w,id);VARIANT previous{},next{};previous.vt=next.vt=VT_I4;previous.lVal=before?ToggleState_On:ToggleState_Off;next.lVal=p->controlChecked(id)?ToggleState_On:ToggleState_Off;UiaRaiseAutomationPropertyChangedEvent(provider,UIA_ToggleToggleStatePropertyId,previous,next);provider->Release();InvalidateRect(w,nullptr,FALSE);};
 if(message==WM_GETOBJECT&&static_cast<LONG>(b)==UiaRootObjectId){auto*provider=new ToolbarToggleProvider(w,id);auto result=UiaReturnRawElementProvider(w,a,b,provider);provider->Release();return result;}
 if(message==WM_PAINT||message==WM_PRINTCLIENT){PAINTSTRUCT paint{};auto dc=message==WM_PRINTCLIENT?(HDC)a:BeginPaint(w,&paint);RECT r;GetClientRect(w,&r);p->paintControl(dc,id,r,GetPropW(w,L"DeskTilePressed")!=nullptr,GetFocus()==w,p->dpi);if(message==WM_PAINT)EndPaint(w,&paint);return 0;}
 if(message==WM_ERASEBKGND)return 1;
 if(message==WM_GETDLGCODE)return DLGC_BUTTON;
 if(message==WM_SETFOCUS||message==WM_KILLFOCUS){InvalidateRect(w,nullptr,FALSE);return 0;}
 if(message==WM_MOUSEMOVE){if(!GetPropW(w,L"DeskTileHot")){SetPropW(w,L"DeskTileHot",HANDLE(1));TRACKMOUSEEVENT tracking{sizeof(tracking),TME_LEAVE,w,0};TrackMouseEvent(&tracking);InvalidateRect(w,nullptr,FALSE);}return 0;}
 if(message==WM_MOUSELEAVE){RemovePropW(w,L"DeskTileHot");InvalidateRect(w,nullptr,FALSE);return 0;}
 if(message==WM_LBUTTONDOWN){SetFocus(w);SetCapture(w);SetPropW(w,L"DeskTilePressed",HANDLE(1));InvalidateRect(w,nullptr,FALSE);return 0;}
 if(message==WM_LBUTTONUP&&GetCapture()==w){RECT r;GetClientRect(w,&r);POINT point{GET_X_LPARAM(b),GET_Y_LPARAM(b)};ReleaseCapture();RemovePropW(w,L"DeskTilePressed");if(PtInRect(&r,point))activate();InvalidateRect(w,nullptr,FALSE);return 0;}
 if(message==WM_CAPTURECHANGED){RemovePropW(w,L"DeskTilePressed");InvalidateRect(w,nullptr,FALSE);return 0;}
 if(message==WM_KEYDOWN&&(a==VK_SPACE||a==VK_RETURN)){SetPropW(w,L"DeskTilePressed",HANDLE(1));InvalidateRect(w,nullptr,FALSE);return 0;}
 if(message==WM_KEYUP&&(a==VK_SPACE||a==VK_RETURN)){if(RemovePropW(w,L"DeskTilePressed"))activate();return 0;}
 if(message==WM_APP+41){activate();return 0;}
 if(message==WM_NCDESTROY){RemovePropW(w,L"DeskTilePressed");RemovePropW(w,L"DeskTileHot");}
 return DefWindowProcW(w,message,a,b);
}
static LRESULT CALLBACK flatControlProc(HWND w,UINT msg,WPARAM a,LPARAM b){
 auto original=reinterpret_cast<WNDPROC>(GetPropW(w,L"DeskTileOriginalProc"));
 if(msg==WM_MOUSEMOVE&&!GetPropW(w,L"DeskTileHot")){SetPropW(w,L"DeskTileHot",HANDLE(1));TRACKMOUSEEVENT tracking{sizeof(tracking),TME_LEAVE,w,0};TrackMouseEvent(&tracking);InvalidateRect(w,nullptr,FALSE);}
 if(msg==WM_MOUSELEAVE){RemovePropW(w,L"DeskTileHot");InvalidateRect(w,nullptr,FALSE);}
 if(msg==WM_NCDESTROY){RemovePropW(w,L"DeskTileHot");RemovePropW(w,L"DeskTileOriginalProc");RemovePropW(w,L"DeskTilePreview");}
 return CallWindowProcW(original,w,msg,a,b);
}
static LRESULT CALLBACK centeredEditProc(HWND w,UINT message,WPARAM a,LPARAM b){
 auto original=reinterpret_cast<WNDPROC>(GetPropW(w,L"DeskTileEditProc"));auto*p=static_cast<Preview*>(GetPropW(w,L"DeskTileEditOwner"));
 if(message==WM_NCCALCSIZE){auto*r=reinterpret_cast<RECT*>(b);r->left+=1;r->right-=1;r->top+=1;r->bottom-=1;auto dc=GetDC(w);auto font=SelectObject(dc,reinterpret_cast<HFONT>(SendMessageW(w,WM_GETFONT,0,0)));TEXTMETRICW metrics{};GetTextMetricsW(dc,&metrics);SelectObject(dc,font);ReleaseDC(w,dc);const int extra=std::max(0,int(r->bottom-r->top-metrics.tmHeight));r->top+=extra/2;r->bottom-=extra-extra/2;return 0;}
 if(message==WM_NCPAINT&&p){auto dc=GetWindowDC(w);RECT r;GetWindowRect(w,&r);OffsetRect(&r,-r.left,-r.top);POINT origin{0,0};ClientToScreen(w,&origin);RECT outer;GetWindowRect(w,&outer);RECT client;GetClientRect(w,&client);OffsetRect(&client,origin.x-outer.left,origin.y-outer.top);ExcludeClipRect(dc,client.left,client.top,client.right,client.bottom);FillRect(dc,&r,p->chrome.fieldBrush);auto border=CreateSolidBrush(GetFocus()==w?p->chrome.c.accent:p->chrome.c.border);FrameRect(dc,&r,border);DeleteObject(border);ReleaseDC(w,dc);return 0;}
 if(message==WM_SETFOCUS||message==WM_KILLFOCUS){auto result=CallWindowProcW(original,w,message,a,b);RedrawWindow(w,nullptr,nullptr,RDW_FRAME|RDW_INVALIDATE);return result;}
 if(message==WM_NCDESTROY){RemovePropW(w,L"DeskTileEditProc");RemovePropW(w,L"DeskTileEditOwner");}
 return CallWindowProcW(original,w,message,a,b);
}
static HWND panelControl(Preview*p,HWND parent,const wchar_t*klass,const wchar_t*text,DWORD style,int id,int x,int y,int width,int height){
 const bool button=!wcscmp(klass,L"BUTTON"),edit=!wcscmp(klass,L"EDIT");
 if(button)style=(style&~BS_TYPEMASK)|BS_OWNERDRAW;
 auto h=CreateWindowExW(0,klass,text,WS_CHILD|WS_VISIBLE|style|(edit&&(style&ES_MULTILINE)?WS_BORDER:0),int(x*p->dpi),int(y*p->dpi),int(width*p->dpi),int(height*p->dpi),parent,(HMENU)(INT_PTR)id,GetModuleHandleW(nullptr),nullptr);
 SendMessageW(h,WM_SETFONT,(WPARAM)p->panelFont(),TRUE);
 if(edit&&!(style&ES_MULTILINE)){auto original=SetWindowLongPtrW(h,GWLP_WNDPROC,(LONG_PTR)centeredEditProc);SetPropW(h,L"DeskTileEditProc",(HANDLE)original);SetPropW(h,L"DeskTileEditOwner",p);SetWindowPos(h,nullptr,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOZORDER|SWP_FRAMECHANGED);}
 if(button){auto original=SetWindowLongPtrW(h,GWLP_WNDPROC,(LONG_PTR)flatControlProc);SetPropW(h,L"DeskTileOriginalProc",(HANDLE)original);}
 return h;
}
static void drawPanelButton(Preview*p,DRAWITEMSTRUCT*d){
 const bool primary=d->CtlID==IDOK,dropdown=(d->CtlID>=301&&d->CtlID<=304)||(d->CtlID>=307&&d->CtlID<=309);
 const bool pressed=d->itemState&ODS_SELECTED,focus=d->itemState&ODS_FOCUS,hot=GetPropW(d->hwndItem,L"DeskTileHot")!=nullptr;
 const auto&c=p->chrome.c;const COLORREF accent=c.accent,background=primary?(pressed?RGB(0,75,145):hot?RGB(0,110,196):accent):(pressed?c.pressed:hot?c.hover:c.field);
 RECT r=d->rcItem;auto brush=CreateSolidBrush(background);FillRect(d->hDC,&r,brush);DeleteObject(brush);
 auto border=CreateSolidBrush(focus?accent:c.border);FrameRect(d->hDC,&r,border);DeleteObject(border);
 SelectObject(d->hDC,dropdown?p->panelFont():p->panelActionFont());SetBkMode(d->hDC,TRANSPARENT);SetTextColor(d->hDC,primary?c.onAccent:c.text);
 RECT text=r;text.left+=int((dropdown?8:12)*p->dpi);text.right-=int((dropdown?28:12)*p->dpi);
 wchar_t label[256];GetWindowTextW(d->hwndItem,label,256);DrawTextW(d->hDC,label,-1,&text,DT_VCENTER|DT_SINGLELINE|DT_NOPREFIX|(dropdown?DT_LEFT:DT_CENTER));
 if(dropdown){auto pen=CreatePen(PS_SOLID,std::max(1,int(p->dpi)),c.secondary);auto old=SelectObject(d->hDC,pen);const int x=r.right-int(22*p->dpi),y=(r.top+r.bottom)/2-int(2*p->dpi);MoveToEx(d->hDC,x,y,nullptr);LineTo(d->hDC,x+int(4*p->dpi),y+int(4*p->dpi));LineTo(d->hDC,x+int(8*p->dpi),y);SelectObject(d->hDC,old);DeleteObject(pen);}
}
static LRESULT panelColor(Preview*p,UINT message,WPARAM a){auto dc=(HDC)a;const bool edit=message==WM_CTLCOLOREDIT;SetTextColor(dc,p->chrome.c.text);SetBkColor(dc,edit?p->chrome.c.field:p->chrome.c.background);return (LRESULT)(edit?p->chrome.fieldBrush:p->chrome.backgroundBrush);}
struct HostMessageState{Preview*preview;bool done=false;int result=IDCANCEL;};
static LRESULT CALLBACK hostMessageProc(HWND w,UINT message,WPARAM a,LPARAM b){
 auto*s=reinterpret_cast<HostMessageState*>(GetWindowLongPtrW(w,GWLP_USERDATA));
 if(message==WM_NCCREATE){s=static_cast<HostMessageState*>(reinterpret_cast<CREATESTRUCTW*>(b)->lpCreateParams);SetWindowLongPtrW(w,GWLP_USERDATA,reinterpret_cast<LONG_PTR>(s));}
 if(!s)return DefWindowProcW(w,message,a,b);
 if(message==WM_CTLCOLORSTATIC)return panelColor(s->preview,message,a);
 if(message==WM_DRAWITEM){drawPanelButton(s->preview,reinterpret_cast<DRAWITEMSTRUCT*>(b));return TRUE;}
 if(message==WM_PAINT){PAINTSTRUCT paint;auto dc=BeginPaint(w,&paint);RECT r;GetClientRect(w,&r);FillRect(dc,&r,s->preview->chrome.backgroundBrush);EndPaint(w,&paint);return 0;}
 if(message==WM_COMMAND&&(LOWORD(a)==IDOK||LOWORD(a)==IDCANCEL)){s->result=LOWORD(a);s->done=true;return 0;}
 if(message==WM_CLOSE){s->done=true;return 0;}
 if(message==WM_ERASEBKGND)return 1;
 return DefWindowProcW(w,message,a,b);
}
static int hostMessage(Preview*p,HWND owner,const std::wstring&title,const std::wstring&text,bool confirm){
 WNDCLASSW klass{};klass.lpfnWndProc=hostMessageProc;klass.hInstance=GetModuleHandleW(nullptr);klass.lpszClassName=L"DeskTilePreviewMessage";klass.hCursor=LoadCursor(nullptr,IDC_ARROW);RegisterClassW(&klass);
 HDC dc=GetDC(owner);auto font=SelectObject(dc,p->panelFont());RECT measured{0,0,int(392*p->dpi),0};DrawTextW(dc,text.c_str(),-1,&measured,DT_CALCRECT|DT_WORDBREAK|DT_NOPREFIX);SelectObject(dc,font);ReleaseDC(owner,dc);
 const int height=std::max(136,int((measured.bottom-measured.top)/p->dpi)+82);RECT bounds{0,0,int(440*p->dpi),int(height*p->dpi)},parent;GetWindowRect(owner,&parent);DWORD style=WS_CAPTION|WS_SYSMENU|WS_CLIPCHILDREN;AdjustWindowRectEx(&bounds,style,FALSE,WS_EX_DLGMODALFRAME);
 HostMessageState state{p};auto window=CreateWindowExW(WS_EX_DLGMODALFRAME,klass.lpszClassName,title.c_str(),style,parent.left+int(24*p->dpi),parent.top+int(40*p->dpi),bounds.right-bounds.left,bounds.bottom-bounds.top,owner,nullptr,klass.hInstance,&state);
 if(!window)return IDCANCEL;
 panelControl(p,window,L"STATIC",text.c_str(),0,0,24,20,392,height-76);
 if(confirm)panelControl(p,window,L"BUTTON",p->chromeText(L"Deny").c_str(),WS_TABSTOP,IDCANCEL,216,height-46,96,26);
 panelControl(p,window,L"BUTTON",p->chromeText(confirm?L"Allow":L"Close").c_str(),WS_TABSTOP,IDOK,320,height-46,96,26);
 p->chrome.titleBar(window);const bool oldPopup=p->popupOpen;p->popupOpen=true;EnableWindow(owner,FALSE);ShowWindow(window,SW_SHOW);SetFocus(GetDlgItem(window,confirm?IDCANCEL:IDOK));MSG message;bool quit=false;int quitCode=0;
 while(!state.done){const int result=GetMessageW(&message,nullptr,0,0);if(result<=0){quit=result==0;quitCode=int(message.wParam);break;}if(!IsDialogMessageW(window,&message)){TranslateMessage(&message);DispatchMessageW(&message);}}
 DestroyWindow(window);EnableWindow(owner,TRUE);p->popupOpen=oldPopup;SetForegroundWindow(owner);if(quit)PostQuitMessage(quitCode);return state.result;
}
struct PopupRow{std::wstring label;bool selected;int width,height;};
static bool popupMessage(Preview*p,UINT message,LPARAM value){
 if(message==WM_MEASUREITEM){auto*m=reinterpret_cast<MEASUREITEMSTRUCT*>(value);if(m->CtlType!=ODT_MENU)return false;auto*r=reinterpret_cast<PopupRow*>(m->itemData);m->itemWidth=r->width;m->itemHeight=r->height;return true;}
 if(message!=WM_DRAWITEM)return false;auto*d=reinterpret_cast<DRAWITEMSTRUCT*>(value);if(d->CtlType!=ODT_MENU)return false;auto*r=reinterpret_cast<PopupRow*>(d->itemData);
 auto brush=CreateSolidBrush(r->selected?p->chrome.c.accent:d->itemState&ODS_SELECTED?p->chrome.c.hover:p->chrome.c.background);FillRect(d->hDC,&d->rcItem,brush);DeleteObject(brush);SelectObject(d->hDC,p->panelFont());SetBkMode(d->hDC,TRANSPARENT);SetTextColor(d->hDC,r->selected?p->chrome.c.onAccent:p->chrome.c.text);RECT text=d->rcItem;text.left+=int(8*p->dpi);text.right-=int(8*p->dpi);DrawTextW(d->hDC,r->label.c_str(),-1,&text,DT_SINGLELINE|DT_VCENTER|DT_NOPREFIX);
 return true;
}
struct FlatPopupState{Preview*preview;const std::vector<std::wstring>*labels;int selected,hot,rowHeight,padding,result=-1,pressed=-1;bool done=false;};
static void paintFlatPopup(HDC dc,RECT r,const FlatPopupState&state){const auto*s=&state;
 const int saved=SaveDC(dc);FillRect(dc,&r,s->preview->chrome.backgroundBrush);
  auto pen=CreatePen(PS_SOLID,1,s->preview->chrome.c.border);auto oldPen=SelectObject(dc,pen),oldBrush=SelectObject(dc,GetStockObject(NULL_BRUSH));Rectangle(dc,0,0,r.right,r.bottom);SelectObject(dc,oldBrush);SelectObject(dc,oldPen);DeleteObject(pen);
  for(size_t i=0;i<s->labels->size();++i){PopupRow row{(*s->labels)[i],int(i)==s->selected,int(r.right),s->rowHeight};DRAWITEMSTRUCT item{};item.CtlType=ODT_MENU;item.hDC=dc;item.rcItem={1,LONG(s->padding+i*s->rowHeight),r.right-1,LONG(s->padding+(i+1)*s->rowHeight)};item.itemData=reinterpret_cast<ULONG_PTR>(&row);item.itemState=int(i)==s->hot?ODS_SELECTED:0;popupMessage(s->preview,WM_DRAWITEM,reinterpret_cast<LPARAM>(&item));}
  RestoreDC(dc,saved);
}

static LRESULT CALLBACK flatPopupProc(HWND w,UINT message,WPARAM a,LPARAM b){
 auto*s=reinterpret_cast<FlatPopupState*>(GetWindowLongPtrW(w,GWLP_USERDATA));
 if(message==WM_NCCREATE){s=static_cast<FlatPopupState*>(reinterpret_cast<CREATESTRUCTW*>(b)->lpCreateParams);SetWindowLongPtrW(w,GWLP_USERDATA,reinterpret_cast<LONG_PTR>(s));}
 if(!s)return DefWindowProcW(w,message,a,b);
 auto hit=[&](int x,int y){RECT r;GetClientRect(w,&r);const int index=(y-s->padding)/s->rowHeight;return x>=1&&x<r.right-1&&y>=s->padding&&index<int(s->labels->size())?index:-1;};
 if(message==WM_PAINT){PAINTSTRUCT paint;auto dc=BeginPaint(w,&paint);RECT r;GetClientRect(w,&r);paintFlatPopup(dc,r,*s);EndPaint(w,&paint);return 0;}
 if(message==WM_MOUSEMOVE){int next=hit(GET_X_LPARAM(b),GET_Y_LPARAM(b));if(next!=s->hot){s->hot=next;InvalidateRect(w,nullptr,FALSE);}return 0;}
 if(message==WM_LBUTTONDOWN){s->pressed=hit(GET_X_LPARAM(b),GET_Y_LPARAM(b));if(s->pressed<0)s->done=true;return 0;}
 if(message==WM_LBUTTONUP){const int index=hit(GET_X_LPARAM(b),GET_Y_LPARAM(b));if(index>=0&&index==s->pressed){s->result=index;s->done=true;}return 0;}
 if(message==WM_KEYDOWN){if(a==VK_ESCAPE||a==VK_TAB)s->done=true;else if(a==VK_RETURN||a==VK_SPACE){s->result=s->hot>=0?s->hot:s->selected;s->done=true;}else if(a==VK_UP||a==VK_DOWN||a==VK_HOME||a==VK_END){const int count=int(s->labels->size()),current=s->hot<0?s->selected:s->hot;s->hot=a==VK_HOME?0:a==VK_END?count-1:(current+(a==VK_UP?count-1:1)+count)%count;InvalidateRect(w,nullptr,FALSE);}return 0;}
 if((message==WM_ACTIVATE&&LOWORD(a)==WA_INACTIVE)||message==WM_CANCELMODE||message==WM_CLOSE||message==WM_CAPTURECHANGED){s->done=true;return 0;}
 if(message==WM_ERASEBKGND)return 1;
 return DefWindowProcW(w,message,a,b);
}
static int flatPopup(Preview*p,HWND owner,HWND anchor,const std::vector<std::wstring>&labels,int selected){
 if(p->popupOpen||labels.empty()||!anchor)return -1;
 RECT bounds;GetWindowRect(anchor,&bounds);FlatPopupState state{p,&labels,selected,-1,int(std::lround(26*p->dpi)),int(std::lround(4*p->dpi))};
 WNDCLASSW klass{};klass.lpfnWndProc=flatPopupProc;klass.hInstance=GetModuleHandleW(nullptr);klass.lpszClassName=L"DeskTilePreviewSelect";klass.hCursor=LoadCursor(nullptr,IDC_ARROW);RegisterClassW(&klass);
 const int width=bounds.right-bounds.left,height=int(labels.size())*state.rowHeight+state.padding*2,gap=int(std::lround(4*p->dpi));
 MONITORINFO monitor{sizeof(monitor)};GetMonitorInfoW(MonitorFromWindow(anchor,MONITOR_DEFAULTTONEAREST),&monitor);
 const int top=bounds.bottom+gap+height<=monitor.rcWork.bottom?bounds.bottom+gap:bounds.top-gap-height,left=std::clamp(int(bounds.left),int(monitor.rcWork.left),int(monitor.rcWork.right)-width);
 p->popupOpen=true;auto popup=CreateWindowExW(WS_EX_TOOLWINDOW,klass.lpszClassName,L"",WS_POPUP,left,top,width,height,owner,nullptr,klass.hInstance,&state);
 if(!popup){p->popupOpen=false;return -1;}
 ShowWindow(popup,SW_SHOW);SetFocus(popup);SetCapture(popup);MSG message;bool quit=false;int quitCode=0;
 while(!state.done){const int got=GetMessageW(&message,nullptr,0,0);if(got<=0){quit=got==0;quitCode=int(message.wParam);break;}TranslateMessage(&message);DispatchMessageW(&message);}
 if(GetCapture()==popup)ReleaseCapture();DestroyWindow(popup);p->popupOpen=false;if(IsWindow(anchor))SetFocus(anchor);if(quit)PostQuitMessage(quitCode);return state.result;
}
static const std::vector<std::vector<const wchar_t*>> settingOptions{
 {L"Light",L"Dark"},{L"Fit window",L"75%",L"100%",L"125%",L"150%",L"200%"},
 {L"MiSans",L"Cabin",L"Noto Sans",L"Source Serif"},{L"Off",L"Disconnected",L"Weak signal",L"Fair signal",L"Good signal",L"Full signal"},
 {L"简体中文",L"繁體中文",L"English"},{L"Follow VS Code",L"Light",L"Dark"},{L"Follow VS Code",L"简体中文",L"English"}};
static std::wstring settingLabel(Preview*p,int index,int value){
 const auto*label=settingOptions[index][value];
 if(index>=5&&value==0&&!getenv("DESKTILE_PREVIEW_UI_THEME")&&!getenv("DESKTILE_PREVIEW_UI_LANGUAGE"))label=L"Follow system";
 return p->chromeText(label);
}
static void closeSettings(Preview*p,HWND w){p->settingsWindow=nullptr;EnableWindow(p->window,TRUE);DestroyWindow(w);SetForegroundWindow(p->window);}
static LRESULT CALLBACK settingsProc(HWND w,UINT msg,WPARAM a,LPARAM b){
 auto*p=active;
 try{
 if(popupMessage(p,msg,b))return TRUE;
 if(msg==WM_CTLCOLORSTATIC||msg==WM_CTLCOLOREDIT)return panelColor(p,msg,a);
 if(msg==WM_DRAWITEM){drawPanelButton(p,reinterpret_cast<DRAWITEMSTRUCT*>(b));return TRUE;}
 if(msg==WM_ERASEBKGND)return 1;
 if(msg==WM_PAINT){PAINTSTRUCT paint;auto dc=BeginPaint(w,&paint);RECT r;GetClientRect(w,&r);FillRect(dc,&r,p->chrome.backgroundBrush);auto pen=CreatePen(PS_SOLID,1,p->chrome.c.border);auto old=SelectObject(dc,pen);for(int y:{122,316,428}){MoveToEx(dc,int(24*p->dpi),int(y*p->dpi),nullptr);LineTo(dc,r.right-int(24*p->dpi),int(y*p->dpi));}SelectObject(dc,old);DeleteObject(pen);EndPaint(w,&paint);return 0;}
 if(msg==WM_COMMAND){const int id=LOWORD(a);
  if((id>=301&&id<=304)||(id>=307&&id<=309)){const int index=id<=304?id-301:id-303;std::vector<std::wstring> labels;for(size_t i=0;i<settingOptions[index].size();++i)labels.push_back(settingLabel(p,index,int(i)));const int choice=flatPopup(p,w,GetDlgItem(w,id),labels,p->settingValues[index]);if(choice>=0){p->settingValues[index]=choice;SetDlgItemTextW(w,id,labels[choice].c_str());}return 0;}
  if(id==IDOK){if(p->applySettings())closeSettings(p,w);return 0;}
  if(id==IDCANCEL){closeSettings(p,w);return 0;}
 }
 if(msg==WM_CLOSE){closeSettings(p,w);return 0;}
 }catch(const std::exception&e){hostMessage(p,w,p->chromeText(L"Preview settings"),wide(e.what()));}
 return DefWindowProcW(w,msg,a,b);
}
void Preview::openSettings(){
 if(settingsWindow){SetForegroundWindow(settingsWindow);return;}
 WNDCLASSW c{};c.lpfnWndProc=settingsProc;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=L"DeskTilePreviewSettings";c.hCursor=LoadCursor(nullptr,IDC_ARROW);c.hbrBackground=nullptr;RegisterClassW(&c);
 RECT owner;GetWindowRect(window,&owner);RECT size{0,0,int(480*dpi),int(492*dpi)};DWORD style=WS_CAPTION|WS_SYSMENU|WS_CLIPCHILDREN;AdjustWindowRectEx(&size,style,FALSE,WS_EX_DLGMODALFRAME);
 settingsWindow=CreateWindowExW(WS_EX_DLGMODALFRAME,c.lpszClassName,chromeText(L"Preview settings").c_str(),style,owner.left+int(40*dpi),owner.top+int(24*dpi),size.right-size.left,size.bottom-size.top,window,nullptr,c.hInstance,nullptr);
 settingValues[0]=dark?1:0;settingValues[1]=fit?0:zoom<1?1:zoom<1.25?2:zoom<1.5?3:zoom<2?4:5;
 settingValues[2]=native_ui::currentWesternFont==sdk::WesternFont::MiSans?0:int(native_ui::currentWesternFont)-1;settingValues[3]=services.wifi;settingValues[4]=services.locale=="zh-CN"?0:services.locale=="zh-HK"?1:2;
 settingValues[5]=chrome.mode=="auto"?0:chrome.mode=="light"?1:2;settingValues[6]=chrome.language=="auto"?0:chrome.language=="zh-CN"?1:2;
 auto section=[&](const wchar_t*label,int y){panelControl(this,settingsWindow,L"STATIC",chromeText(label).c_str(),0,0,24,y,432,20);};
 auto field=[&](const wchar_t*label,int index,int id,int y){panelControl(this,settingsWindow,L"STATIC",chromeText(label).c_str(),SS_CENTERIMAGE,0,24,y,156,26);panelControl(this,settingsWindow,L"BUTTON",settingLabel(this,index,settingValues[index]).c_str(),WS_TABSTOP,id,196,y,260,26);};
 section(L"Interface",16);field(L"Interface theme",5,308,44);field(L"Interface language",6,309,80);
 section(L"Preview",136);field(L"Theme",0,301,164);field(L"Scale",1,302,200);field(L"Latin font",2,303,236);field(L"System language",4,307,272);
 section(L"Status bar",328);field(L"Wi-Fi",3,304,356);
 panelControl(this,settingsWindow,L"STATIC",chromeText(L"Battery level").c_str(),SS_CENTERIMAGE,0,24,392,156,26);
 auto battery=panelControl(this,settingsWindow,L"EDIT",std::to_wstring(services.battery).c_str(),WS_TABSTOP|ES_NUMBER,305,196,392,80,26);SendMessageW(battery,EM_SETLIMITTEXT,3,0);SendMessageW(battery,EM_SETMARGINS,EC_LEFTMARGIN|EC_RIGHTMARGIN,MAKELPARAM(int(6*dpi),int(6*dpi)));
 panelControl(this,settingsWindow,L"STATIC",L"%",SS_CENTERIMAGE,0,284,392,30,26);
 panelControl(this,settingsWindow,L"BUTTON",chromeText(L"Cancel").c_str(),WS_TABSTOP,IDCANCEL,248,448,96,26);
 panelControl(this,settingsWindow,L"BUTTON",chromeText(L"Apply").c_str(),WS_TABSTOP,IDOK,360,448,96,26);
 chrome.titleBar(settingsWindow);EnableWindow(window,FALSE);ShowWindow(settingsWindow,SW_SHOW);SetFocus(GetDlgItem(settingsWindow,308));
}
bool Preview::applySettings(){
 BOOL valid=FALSE;const UINT value=GetDlgItemInt(settingsWindow,305,&valid,FALSE);if(!valid||value>100){hostMessage(this,settingsWindow,chromeText(L"Battery level"),chromeText(L"Enter a battery level from 0 to 100."));return false;}
 auto selected=[&](int id){return settingValues[id-301];};
 setTheme(selected(301)==1);int z=selected(302);const double scales[]{1,0.75,1,1.25,1.5,2};fit=z==0;zoom=scales[std::clamp(z,0,5)];
 const sdk::WesternFont fonts[]{sdk::WesternFont::MiSans,sdk::WesternFont::Cabin,sdk::WesternFont::NotoSans,sdk::WesternFont::SourceSerif};native_ui::setWesternFont(fonts[std::clamp(selected(303),0,3)]);
  check(app->lifecycle(DT_LIFECYCLE_THEME_CHANGED),"Font change");const char*languages[]{"zh-CN","zh-HK","en-US"};setLanguage(languages[std::clamp(settingValues[4],0,2)]);services.wifi=selected(304);services.battery=value;const char*themes[]{"auto","light","dark"},*interfaceLanguages[]{"auto","zh-CN","en"};chrome.mode=themes[std::clamp(settingValues[5],0,2)];chrome.language=interfaceLanguages[std::clamp(settingValues[6],0,2)];chrome.sync();chrome.titleBar(window);SetWindowTextW(window,wide((chrome.chinese?"DeskTile 预览 - ":"DeskTile Preview - ")+name).c_str());layoutToolbar();changed=true;savePreferences();resizePreview();render();return true;
}
static void saveSelectEvidence(Preview*p,const fs::path&path,double scale){
 const double previousDpi=p->dpi;auto previousForm=p->formFont,previousAction=p->actionFont;p->dpi=scale;p->formFont=nullptr;p->actionFont=nullptr;
 const int width=int(900*scale),height=int(660*scale);HDC dc=CreateCompatibleDC(nullptr);BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=width;info.bmiHeader.biHeight=-height;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;void*bits=nullptr;auto bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,&bits,nullptr,0);auto original=SelectObject(dc,bitmap);RECT all{0,0,width,height};FillRect(dc,&all,p->chrome.backgroundBrush);
 Json metadata(cJSON_CreateObject(),cJSON_Delete);cJSON_AddNumberToObject(metadata.get(),"scale",scale);auto*controls=cJSON_AddArrayToObject(metadata.get(),"controls");
 const int ids[]{201,204,301,302,303,304,307,308,309};int position=0;
 for(const int id:ids){
  const bool toolbar=id<300;const int index=toolbar?0:id<=304?id-301:id-303;std::vector<std::wstring> labels;if(toolbar)labels=p->selectLabels(id);else for(size_t i=0;i<settingOptions[index].size();++i)labels.push_back(settingLabel(p,index,int(i)));
  const int logicalWidth=toolbar?p->controlRect(id,800).right-p->controlRect(id,800).left:260,fieldWidth=int(logicalWidth*scale),fieldHeight=int(26*scale),padding=int(std::lround(4*scale)),rowHeight=int(std::lround(26*scale)),popupHeight=int(labels.size())*rowHeight+padding*2,x=int((position%3*300+16)*scale),y=int((position/3*220+16)*scale);position++;
  RECT field{x,y,x+fieldWidth,y+fieldHeight};
  if(toolbar)p->paintControl(dc,id,field,false,false,scale);
  else{auto window=CreateWindowW(L"BUTTON",labels.front().c_str(),WS_POPUP|BS_OWNERDRAW,0,0,fieldWidth,fieldHeight,nullptr,nullptr,GetModuleHandleW(nullptr),nullptr);DRAWITEMSTRUCT item{};item.hwndItem=window;item.CtlID=id;item.hDC=dc;item.rcItem=field;drawPanelButton(p,&item);DestroyWindow(window);}
  auto*control=cJSON_CreateObject();cJSON_AddNumberToObject(control,"id",id);cJSON_AddNumberToObject(control,"fieldWidth",fieldWidth);cJSON_AddNumberToObject(control,"popupWidth",fieldWidth);const int available=fieldWidth-2-int(16*scale);cJSON_AddNumberToObject(control,"available",available);auto*texts=cJSON_AddArrayToObject(control,"options");
  SelectObject(dc,p->panelFont());for(const auto&label:labels){SIZE extent{};GetTextExtentPoint32W(dc,label.c_str(),int(label.size()),&extent);auto*text=cJSON_CreateObject();const auto value=utf8(label);cJSON_AddStringToObject(text,"text",value.c_str());cJSON_AddNumberToObject(text,"width",extent.cx);cJSON_AddItemToArray(texts,text);}
  cJSON_AddItemToArray(controls,control);const int saved=SaveDC(dc);SetViewportOrgEx(dc,x,y+fieldHeight+padding,nullptr);FlatPopupState state{p,&labels,0,-1,rowHeight,padding};RECT menu{0,0,fieldWidth,popupHeight};paintFlatPopup(dc,menu,state);RestoreDC(dc,saved);
 }
 GdiFlush();BITMAPFILEHEADER file{};file.bfType=0x4d42;file.bfOffBits=sizeof(file)+sizeof(BITMAPINFOHEADER);file.bfSize=file.bfOffBits+width*height*4;std::ofstream output(path,std::ios::binary);output.write(reinterpret_cast<char*>(&file),sizeof(file));output.write(reinterpret_cast<char*>(&info.bmiHeader),sizeof(BITMAPINFOHEADER));output.write(static_cast<char*>(bits),width*height*4);auto*json=cJSON_Print(metadata.get());std::ofstream(path.wstring()+L".json")<<json;cJSON_free(json);
 SelectObject(dc,original);DeleteObject(bitmap);DeleteDC(dc);if(p->formFont)DeleteObject(p->formFont);if(p->actionFont)DeleteObject(p->actionFont);p->formFont=previousForm;p->actionFont=previousAction;p->dpi=previousDpi;
}

static void saveCheckboxEvidence(Preview*p,const fs::path&path,double scale){
 const double previousDpi=p->dpi;auto previousForm=p->formFont,previousAction=p->actionFont;p->dpi=scale;p->formFont=nullptr;p->actionFont=nullptr;
 const HWND previous=p->window;p->window=CreateWindowW(L"STATIC",L"",WS_POPUP|WS_CLIPCHILDREN,0,0,int(800*scale),int(600*scale),nullptr,nullptr,GetModuleHandleW(nullptr),nullptr);p->toolbar();
 const int width=int(320*scale),height=int(216*scale),stride=int(36*scale);HDC dc=CreateCompatibleDC(nullptr);BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=width;info.bmiHeader.biHeight=-height;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;void*bits=nullptr;auto bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,&bits,nullptr,0);auto original=SelectObject(dc,bitmap);RECT r{0,0,width,height};FillRect(dc,&r,p->chrome.backgroundBrush);Json metadata(cJSON_CreateArray(),cJSON_Delete);int row=0;
 for(const int id:{202,203}){auto source=GetDlgItem(p->window,id),visual=p->toolbarControl(id);auto*provider=new ToolbarToggleProvider(visual,id);auto*control=cJSON_CreateObject();cJSON_AddNumberToObject(control,"id",id);cJSON_AddBoolToObject(control,"sourceHidden",(GetWindowLongW(source,GWL_STYLE)&WS_VISIBLE)==0);VARIANT type{};provider->GetPropertyValue(UIA_ControlTypePropertyId,&type);cJSON_AddNumberToObject(control,"controlType",type.lVal);VariantClear(&type);auto*states=cJSON_AddArrayToObject(control,"states");
  for(int step=0;step<3;++step){ToggleState state;provider->get_ToggleState(&state);cJSON_AddItemToArray(states,cJSON_CreateNumber(state));const int saved=SaveDC(dc);SetViewportOrgEx(dc,0,row*stride,nullptr);SendMessageW(visual,WM_PRINTCLIENT,reinterpret_cast<WPARAM>(dc),PRF_CLIENT);RestoreDC(dc,saved);++row;if(step<2)provider->Toggle();}
  cJSON_AddItemToArray(metadata.get(),control);provider->Release();
 }
 GdiFlush();BITMAPFILEHEADER file{};file.bfType=0x4d42;file.bfOffBits=sizeof(file)+sizeof(BITMAPINFOHEADER);file.bfSize=file.bfOffBits+width*height*4;std::ofstream output(path,std::ios::binary);output.write(reinterpret_cast<char*>(&file),sizeof(file));output.write(reinterpret_cast<char*>(&info.bmiHeader),sizeof(BITMAPINFOHEADER));output.write(static_cast<char*>(bits),width*height*4);auto*json=cJSON_Print(metadata.get());std::ofstream(path.wstring()+L".json")<<json;cJSON_free(json);SelectObject(dc,original);DeleteObject(bitmap);DeleteDC(dc);DestroyWindow(p->window);p->window=previous;if(p->formFont)DeleteObject(p->formFont);if(p->actionFont)DeleteObject(p->actionFont);p->formFont=previousForm;p->actionFont=previousAction;p->dpi=previousDpi;
}

bool Preview::desktopScenario(cJSON*step){
 const std::string action=str(step,"action");
 if(action=="icon-appearance"){
  sdk::Host api(host.api(),owner);const auto *value=cJSON_GetObjectItemCaseSensitive(step,"value");dt_result result=DT_OK;
  if(value)result=sdk::setIconAppearance(api,str(step,"value"));if(result!=num(step,"result",DT_OK))throw std::runtime_error("Unexpected icon selection result");tick();
  char id[17]{};check(sdk::iconAppearance(api,id),"Read icon appearance");Json receipt(cJSON_CreateObject(),cJSON_Delete);cJSON_AddStringToObject(receipt.get(),"id",id);cJSON_AddNumberToObject(receipt.get(),"result",result);
  const char *resource=str(step,"resource");if(resource[0]){std::vector<uint8_t> data(256*1024);dt_mutable_bytes bytes{data.data(),data.size(),0};check(api.resourceRead(resource,bytes),"Read selected resource");cJSON_AddNumberToObject(receipt.get(),"size",bytes.size);if(bytes.size>=14)cJSON_AddNumberToObject(receipt.get(),"pixel",data[12]|unsigned(data[13])<<8);ui::CanvasComponentTarget target(canvas,&resources,&context);if(!target.image({0,32,96,96},resource))throw std::runtime_error("Cannot draw selected icon");cJSON_AddNumberToObject(receipt.get(),"paintPixel",canvas.pixels()[32*800]);}
  if(*str(step,"output")){char *json=cJSON_Print(receipt.get());std::ofstream(fs::u8path(str(step,"output")))<<json;cJSON_free(json);}return true;
 }
 if(action=="checkbox-evidence"){saveCheckboxEvidence(this,fs::u8path(str(step,"path")),num(step,"dpi",100)/100.0);return true;}
 if(action=="select-evidence"){saveSelectEvidence(this,fs::u8path(str(step,"path")),num(step,"dpi",100)/100.0);return true;}
 if(action=="host-ui"){chrome.mode=str(step,"theme","auto");chrome.language=str(step,"language","auto");chrome.sync();refreshControls();layoutToolbar();return true;}
 if(action=="save-preferences"){savePreferences();return true;}
 if(action=="file"){if(!services.fileRequest)throw std::runtime_error("No pending file picker");auto path=wide(str(step,"path"));processFile(&path);}
 else if(action=="permission"){runtime::NativeSdkHost::PermissionRequestView request;if(!host.nextPermissionRequest(request))throw std::runtime_error("No pending permission request");check(host.resolvePermissionRequest(request.request,num(step,"allow",1)!=0),"Permission response");dt_permission_result_event result;while(host.takePermissionResult(owner,result))send(DT_EVENT_PERMISSION_RESULT,result);}
  else if(action=="status"){services.battery=std::clamp(num(step,"battery",78),0,100);services.wifi=std::clamp(num(step,"wifi",5),0,5);services.charging=num(step,"charging")!=0;changed=true;}
  else if(action=="language"){setLanguage(str(step,"value"));}
 else if(action=="font"){const int id=num(step,"value");if(id==1||id<0||id>4)throw std::runtime_error("Font is not distributed with the preview");native_ui::setWesternFont(sdk::WesternFont(id));check(app->lifecycle(DT_LIFECYCLE_THEME_CHANGED),"Font change");changed=true;}
 else if(action=="map-pointer"){auto bounds=viewport();const int x=num(step,"x"),y=num(step,"y");const auto point=logicalPoint(bounds.left+int((x+0.5)*(bounds.right-bounds.left)/800.0),bounds.top+int((y+0.5)*(bounds.bottom-bounds.top)/480.0));if(abs(point.x-x)>1||abs(point.y-y)>1)throw std::runtime_error("Scaled pointer mapping mismatch");}
 else return false;return true;
}
