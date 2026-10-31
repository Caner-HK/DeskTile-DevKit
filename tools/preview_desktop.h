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
void Preview::layoutToolbar(){if(window){for(int id=201;id<=206;++id){auto r=controlRect(id);if(auto h=GetDlgItem(window,id))MoveWindow(h,int(r.left*dpi),int(r.top*dpi),int((r.right-r.left)*dpi),int((r.bottom-r.top)*dpi),TRUE);}InvalidateRect(window,nullptr,FALSE);}}
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
static LRESULT CALLBACK flatControlProc(HWND w,UINT msg,WPARAM a,LPARAM b){
 auto original=reinterpret_cast<WNDPROC>(GetPropW(w,L"DeskTileOriginalProc"));
 if(msg==WM_MOUSEMOVE&&!GetPropW(w,L"DeskTileHot")){SetPropW(w,L"DeskTileHot",HANDLE(1));TRACKMOUSEEVENT tracking{sizeof(tracking),TME_LEAVE,w,0};TrackMouseEvent(&tracking);InvalidateRect(w,nullptr,FALSE);}
 if(msg==WM_MOUSELEAVE){RemovePropW(w,L"DeskTileHot");InvalidateRect(w,nullptr,FALSE);}
 if(msg==WM_NCDESTROY){RemovePropW(w,L"DeskTileHot");RemovePropW(w,L"DeskTileOriginalProc");}
 return CallWindowProcW(original,w,msg,a,b);
}
static HWND panelControl(Preview*p,HWND parent,const wchar_t*klass,const wchar_t*text,DWORD style,int id,int x,int y,int width,int height){
 const bool button=!wcscmp(klass,L"BUTTON"),edit=!wcscmp(klass,L"EDIT");
 if(button)style=(style&~BS_TYPEMASK)|BS_OWNERDRAW;
 auto h=CreateWindowExW(0,klass,text,WS_CHILD|WS_VISIBLE|style|(edit?WS_BORDER:0),int(x*p->dpi),int(y*p->dpi),int(width*p->dpi),int(height*p->dpi),parent,(HMENU)(INT_PTR)id,GetModuleHandleW(nullptr),nullptr);
 SendMessageW(h,WM_SETFONT,(WPARAM)p->panelFont(),TRUE);
 if(button){auto original=SetWindowLongPtrW(h,GWLP_WNDPROC,(LONG_PTR)flatControlProc);SetPropW(h,L"DeskTileOriginalProc",(HANDLE)original);}
 return h;
}
static void drawPanelButton(Preview*p,DRAWITEMSTRUCT*d){
 const bool primary=d->CtlID==IDOK,dropdown=(d->CtlID>=301&&d->CtlID<=304)||d->CtlID==307,checkbox=d->CtlID==306;
 const bool pressed=d->itemState&ODS_SELECTED,focus=d->itemState&ODS_FOCUS,hot=GetPropW(d->hwndItem,L"DeskTileHot")!=nullptr;
 const COLORREF accent=RGB(0,103,192),background=primary?(pressed?RGB(0,75,145):hot?RGB(0,90,170):accent):(pressed?RGB(224,228,232):hot?RGB(242,245,248):RGB(255,255,255));
 RECT r=d->rcItem;auto brush=CreateSolidBrush(background);FillRect(d->hDC,&r,brush);DeleteObject(brush);
 auto border=CreateSolidBrush(focus?accent:RGB(190,195,200));if(!checkbox)FrameRect(d->hDC,&r,border);DeleteObject(border);
 SelectObject(d->hDC,p->panelFont());SetBkMode(d->hDC,TRANSPARENT);SetTextColor(d->hDC,primary?RGB(255,255,255):RGB(32,32,32));
 RECT text=r;text.left+=int(12*p->dpi);text.right-=int((dropdown?32:12)*p->dpi);
 if(checkbox){const int x=r.left+int(2*p->dpi),y=(r.top+r.bottom)/2-int(7*p->dpi);RECT box{x,y,x+int(14*p->dpi),y+int(14*p->dpi)};auto color=CreateSolidBrush(p->settingCharging?accent:RGB(120,125,130));if(p->settingCharging)FillRect(d->hDC,&box,color);else FrameRect(d->hDC,&box,color);DeleteObject(color);if(p->settingCharging){auto pen=CreatePen(PS_SOLID,std::max(1,int(p->dpi)),RGB(255,255,255));auto old=SelectObject(d->hDC,pen);MoveToEx(d->hDC,x+int(3*p->dpi),y+int(7*p->dpi),nullptr);LineTo(d->hDC,x+int(6*p->dpi),y+int(10*p->dpi));LineTo(d->hDC,x+int(11*p->dpi),y+int(4*p->dpi));SelectObject(d->hDC,old);DeleteObject(pen);}text.left=r.left+int(26*p->dpi);}
 wchar_t label[256];GetWindowTextW(d->hwndItem,label,256);DrawTextW(d->hDC,label,-1,&text,DT_VCENTER|DT_SINGLELINE|DT_NOPREFIX|(dropdown||checkbox?DT_LEFT:DT_CENTER));
 if(dropdown){auto pen=CreatePen(PS_SOLID,std::max(1,int(p->dpi)),RGB(70,75,80));auto old=SelectObject(d->hDC,pen);const int x=r.right-int(22*p->dpi),y=(r.top+r.bottom)/2-int(2*p->dpi);MoveToEx(d->hDC,x,y,nullptr);LineTo(d->hDC,x+int(4*p->dpi),y+int(4*p->dpi));LineTo(d->hDC,x+int(8*p->dpi),y);SelectObject(d->hDC,old);DeleteObject(pen);}
 if(focus){InflateRect(&r,-int(3*p->dpi),-int(3*p->dpi));DrawFocusRect(d->hDC,&r);}
}
static LRESULT panelColor(WPARAM a){auto dc=(HDC)a;SetTextColor(dc,RGB(32,32,32));SetBkColor(dc,RGB(255,255,255));return (LRESULT)GetStockObject(WHITE_BRUSH);}
struct PopupRow{std::wstring label;bool selected;int width,height;};
static bool popupMessage(Preview*p,UINT message,LPARAM value){
 if(message==WM_MEASUREITEM){auto*m=reinterpret_cast<MEASUREITEMSTRUCT*>(value);if(m->CtlType!=ODT_MENU)return false;auto*r=reinterpret_cast<PopupRow*>(m->itemData);m->itemWidth=r->width;m->itemHeight=r->height;return true;}
 if(message!=WM_DRAWITEM)return false;auto*d=reinterpret_cast<DRAWITEMSTRUCT*>(value);if(d->CtlType!=ODT_MENU)return false;auto*r=reinterpret_cast<PopupRow*>(d->itemData);
 auto brush=CreateSolidBrush(d->itemState&ODS_SELECTED?RGB(224,237,249):RGB(255,255,255));FillRect(d->hDC,&d->rcItem,brush);DeleteObject(brush);SelectObject(d->hDC,p->panelFont());SetBkMode(d->hDC,TRANSPARENT);SetTextColor(d->hDC,RGB(32,32,32));RECT text=d->rcItem;text.left+=int(34*p->dpi);text.right-=int(12*p->dpi);DrawTextW(d->hDC,r->label.c_str(),-1,&text,DT_SINGLELINE|DT_VCENTER|DT_NOPREFIX);
 if(r->selected){const int x=d->rcItem.left+int(12*p->dpi),y=(d->rcItem.top+d->rcItem.bottom)/2;auto pen=CreatePen(PS_SOLID,std::max(1,int(2*p->dpi)),RGB(0,103,192));auto old=SelectObject(d->hDC,pen);MoveToEx(d->hDC,x,y,nullptr);LineTo(d->hDC,x+int(4*p->dpi),y+int(4*p->dpi));LineTo(d->hDC,x+int(11*p->dpi),y-int(4*p->dpi));SelectObject(d->hDC,old);DeleteObject(pen);}return true;
}
struct FlatPopupState{Preview*preview;const std::vector<std::wstring>*labels;int selected,hot,rowHeight,result=-1;bool done=false;};
static LRESULT CALLBACK flatPopupProc(HWND w,UINT message,WPARAM a,LPARAM b){
 auto*s=reinterpret_cast<FlatPopupState*>(GetWindowLongPtrW(w,GWLP_USERDATA));
 if(message==WM_NCCREATE){s=static_cast<FlatPopupState*>(reinterpret_cast<CREATESTRUCTW*>(b)->lpCreateParams);SetWindowLongPtrW(w,GWLP_USERDATA,reinterpret_cast<LONG_PTR>(s));}
 if(!s)return DefWindowProcW(w,message,a,b);
 auto hit=[&](int x,int y){RECT r;GetClientRect(w,&r);return x>=0&&x<r.right&&y>=0&&y<r.bottom?y/s->rowHeight:-1;};
 if(message==WM_PAINT){PAINTSTRUCT paint;auto dc=BeginPaint(w,&paint);RECT r;GetClientRect(w,&r);FillRect(dc,&r,(HBRUSH)GetStockObject(WHITE_BRUSH));for(size_t i=0;i<s->labels->size();++i){PopupRow row{(*s->labels)[i],int(i)==s->selected,int(r.right),s->rowHeight};DRAWITEMSTRUCT item{};item.CtlType=ODT_MENU;item.hDC=dc;item.rcItem={0,LONG(i*s->rowHeight),r.right,LONG((i+1)*s->rowHeight)};item.itemData=reinterpret_cast<ULONG_PTR>(&row);item.itemState=int(i)==s->hot?ODS_SELECTED:0;popupMessage(s->preview,WM_DRAWITEM,reinterpret_cast<LPARAM>(&item));}EndPaint(w,&paint);return 0;}
 if(message==WM_MOUSEMOVE){int next=hit(GET_X_LPARAM(b),GET_Y_LPARAM(b));if(next!=s->hot){s->hot=next;InvalidateRect(w,nullptr,FALSE);}return 0;}
 if(message==WM_LBUTTONDOWN){if(hit(GET_X_LPARAM(b),GET_Y_LPARAM(b))<0)s->done=true;return 0;}
 if(message==WM_LBUTTONUP){s->result=hit(GET_X_LPARAM(b),GET_Y_LPARAM(b));s->done=true;return 0;}
 if(message==WM_KEYDOWN){if(a==VK_ESCAPE)s->done=true;else if(a==VK_RETURN||a==VK_SPACE){s->result=s->hot;s->done=true;}else if(a==VK_UP||a==VK_DOWN){const int count=int(s->labels->size());s->hot=(s->hot+(a==VK_UP?count-1:1)+count)%count;InvalidateRect(w,nullptr,FALSE);}return 0;}
 if(message==WM_ACTIVATE&&LOWORD(a)==WA_INACTIVE||message==WM_CANCELMODE||message==WM_CLOSE){s->done=true;return 0;}
 if(message==WM_ERASEBKGND)return 1;
 return DefWindowProcW(w,message,a,b);
}
static int flatPopup(Preview*p,HWND owner,HWND anchor,const std::vector<std::wstring>&labels,int selected){
 if(p->popupOpen||labels.empty())return -1;
 RECT bounds;GetWindowRect(anchor,&bounds);FlatPopupState state{p,&labels,selected,selected,int(34*p->dpi)};
 WNDCLASSW klass{};klass.lpfnWndProc=flatPopupProc;klass.hInstance=GetModuleHandleW(nullptr);klass.lpszClassName=L"DeskTilePreviewSelect";klass.hCursor=LoadCursor(nullptr,IDC_ARROW);RegisterClassW(&klass);
 const int height=int(labels.size())*state.rowHeight+2;
 MONITORINFO monitor{sizeof(monitor)};GetMonitorInfoW(MonitorFromWindow(anchor,MONITOR_DEFAULTTONEAREST),&monitor);
 const int top=bounds.bottom+height<=monitor.rcWork.bottom?bounds.bottom:bounds.top-height;
 // The outer window rectangle is exactly the select control's outer rectangle width.
 p->popupOpen=true;auto popup=CreateWindowExW(WS_EX_TOOLWINDOW,klass.lpszClassName,L"",WS_POPUP|WS_BORDER,bounds.left,top,bounds.right-bounds.left,height,owner,nullptr,klass.hInstance,&state);
 if(!popup){p->popupOpen=false;return -1;}
 ShowWindow(popup,SW_SHOW);SetFocus(popup);SetCapture(popup);MSG message;bool quit=false;int quitCode=0;
 while(!state.done){const int got=GetMessageW(&message,nullptr,0,0);if(got<=0){quit=got==0;quitCode=int(message.wParam);break;}TranslateMessage(&message);DispatchMessageW(&message);}
 if(GetCapture()==popup)ReleaseCapture();DestroyWindow(popup);p->popupOpen=false;if(IsWindow(anchor))SetFocus(anchor);if(quit)PostQuitMessage(quitCode);return state.result;
}
static const std::vector<std::vector<const wchar_t*>> settingOptions{
 {L"Light",L"Dark"},{L"Fit window",L"75%",L"100%",L"125%",L"150%",L"200%"},
  {L"MiSans",L"Cabin",L"Noto Sans",L"Source Serif"},{L"Off",L"Disconnected",L"Weak signal",L"Fair signal",L"Good signal",L"Full signal"},
  {L"简体中文",L"繁體中文",L"English"}};
static void closeSettings(Preview*p,HWND w){p->settingsWindow=nullptr;EnableWindow(p->window,TRUE);DestroyWindow(w);SetForegroundWindow(p->window);}
static LRESULT CALLBACK settingsProc(HWND w,UINT msg,WPARAM a,LPARAM b){
 auto*p=active;
 try{
 if(popupMessage(p,msg,b))return TRUE;
 if(msg==WM_CTLCOLORSTATIC||msg==WM_CTLCOLOREDIT)return panelColor(a);
 if(msg==WM_DRAWITEM){drawPanelButton(p,reinterpret_cast<DRAWITEMSTRUCT*>(b));return TRUE;}
 if(msg==WM_PAINT){PAINTSTRUCT paint;auto dc=BeginPaint(w,&paint);RECT r;GetClientRect(w,&r);FillRect(dc,&r,(HBRUSH)GetStockObject(WHITE_BRUSH));auto pen=CreatePen(PS_SOLID,1,RGB(225,228,232));auto old=SelectObject(dc,pen);MoveToEx(dc,int(24*p->dpi),int(234*p->dpi),nullptr);LineTo(dc,r.right-int(24*p->dpi),int(234*p->dpi));MoveToEx(dc,0,int(412*p->dpi),nullptr);LineTo(dc,r.right,int(412*p->dpi));SelectObject(dc,old);DeleteObject(pen);EndPaint(w,&paint);return 0;}
 if(msg==WM_COMMAND){const int id=LOWORD(a);
  if((id>=301&&id<=304)||id==307){const int index=id==307?4:id-301;const auto&items=settingOptions[index];std::vector<std::wstring> labels(items.begin(),items.end());const int choice=flatPopup(p,w,GetDlgItem(w,id),labels,p->settingValues[index]);if(choice>=0){p->settingValues[index]=choice;SetDlgItemTextW(w,id,items[choice]);}return 0;}
  if(id==306){p->settingCharging=!p->settingCharging;InvalidateRect(GetDlgItem(w,id),nullptr,FALSE);return 0;}
  if(id==IDOK){if(p->applySettings())closeSettings(p,w);return 0;}
  if(id==IDCANCEL){closeSettings(p,w);return 0;}
 }
 if(msg==WM_CLOSE){closeSettings(p,w);return 0;}
 }catch(const std::exception&e){MessageBoxW(w,wide(e.what()).c_str(),L"Preview settings",MB_OK|MB_ICONERROR);}
 return DefWindowProcW(w,msg,a,b);
}
void Preview::openSettings(){
 if(settingsWindow){SetForegroundWindow(settingsWindow);return;}
 WNDCLASSW c{};c.lpfnWndProc=settingsProc;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=L"DeskTilePreviewSettings";c.hCursor=LoadCursor(nullptr,IDC_ARROW);c.hbrBackground=(HBRUSH)(COLOR_WINDOW+1);RegisterClassW(&c);
  RECT owner;GetWindowRect(window,&owner);RECT size{0,0,int(480*dpi),int(474*dpi)};DWORD style=WS_CAPTION|WS_SYSMENU;AdjustWindowRectEx(&size,style,FALSE,WS_EX_DLGMODALFRAME);
 settingsWindow=CreateWindowExW(WS_EX_DLGMODALFRAME,c.lpszClassName,L"Preview settings",style,owner.left+int(40*dpi),owner.top+int(50*dpi),size.right-size.left,size.bottom-size.top,window,nullptr,c.hInstance,nullptr);
 settingValues[0]=dark?1:0;settingValues[1]=fit?0:zoom<1?1:zoom<1.25?2:zoom<1.5?3:zoom<2?4:5;
 settingValues[2]=native_ui::currentWesternFont==sdk::WesternFont::MiSans?0:int(native_ui::currentWesternFont)-1;settingValues[3]=services.wifi;settingCharging=services.charging;
 panelControl(this,settingsWindow,L"STATIC",L"Preview",0,0,24,16,160,24);
  const wchar_t*labels[]{L"Theme",L"Scale",L"Latin font",L"Wi-Fi"};const int positions[]{48,92,136,276};
 for(int i=0;i<4;++i){panelControl(this,settingsWindow,L"STATIC",labels[i],SS_CENTERIMAGE,0,24,positions[i],156,32);panelControl(this,settingsWindow,L"BUTTON",settingOptions[i][settingValues[i]],WS_TABSTOP,301+i,196,positions[i],260,32);}
  settingValues[4]=services.locale=="zh-CN"?0:services.locale=="zh-HK"?1:2;
  panelControl(this,settingsWindow,L"STATIC",L"System language",SS_CENTERIMAGE,0,24,180,156,32);
  panelControl(this,settingsWindow,L"BUTTON",settingOptions[4][settingValues[4]],WS_TABSTOP,307,196,180,260,32);
  panelControl(this,settingsWindow,L"STATIC",L"Status bar",0,0,24,248,160,24);
  panelControl(this,settingsWindow,L"STATIC",L"Battery level",SS_CENTERIMAGE,0,24,320,156,32);
  auto battery=panelControl(this,settingsWindow,L"EDIT",std::to_wstring(services.battery).c_str(),WS_TABSTOP|ES_NUMBER,305,196,324,80,24);SendMessageW(battery,EM_SETLIMITTEXT,3,0);SendMessageW(battery,EM_SETMARGINS,EC_LEFTMARGIN|EC_RIGHTMARGIN,MAKELPARAM(int(8*dpi),int(8*dpi)));
  panelControl(this,settingsWindow,L"STATIC",L"%",SS_CENTERIMAGE,0,284,320,30,32);
  panelControl(this,settingsWindow,L"BUTTON",L"Charging",WS_TABSTOP,306,196,364,260,32);
  panelControl(this,settingsWindow,L"BUTTON",L"Cancel",WS_TABSTOP,IDCANCEL,248,428,96,32);
  panelControl(this,settingsWindow,L"BUTTON",L"Apply",WS_TABSTOP,IDOK,360,428,96,32);
 EnableWindow(window,FALSE);ShowWindow(settingsWindow,SW_SHOW);
 SetFocus(GetDlgItem(settingsWindow,301));
}
bool Preview::applySettings(){
 BOOL valid=FALSE;const UINT value=GetDlgItemInt(settingsWindow,305,&valid,FALSE);if(!valid||value>100){MessageBoxW(settingsWindow,L"Enter a battery level from 0 to 100.",L"Battery level",MB_OK);return false;}
 auto selected=[&](int id){return settingValues[id-301];};
 setTheme(selected(301)==1);int z=selected(302);const double scales[]{1,0.75,1,1.25,1.5,2};fit=z==0;zoom=scales[std::clamp(z,0,5)];
 const sdk::WesternFont fonts[]{sdk::WesternFont::MiSans,sdk::WesternFont::Cabin,sdk::WesternFont::NotoSans,sdk::WesternFont::SourceSerif};native_ui::setWesternFont(fonts[std::clamp(selected(303),0,3)]);
  check(app->lifecycle(DT_LIFECYCLE_THEME_CHANGED),"Font change");const char*languages[]{"zh-CN","zh-HK","en-US"};setLanguage(languages[std::clamp(settingValues[4],0,2)]);services.wifi=selected(304);services.battery=value;services.charging=settingCharging;changed=true;savePreferences();resizePreview();render();return true;
}
bool Preview::desktopScenario(cJSON*step){
 const std::string action=str(step,"action");
 if(action=="save-preferences"){savePreferences();return true;}
 if(action=="file"){if(!services.fileRequest)throw std::runtime_error("No pending file picker");auto path=wide(str(step,"path"));processFile(&path);}
 else if(action=="permission"){runtime::NativeSdkHost::PermissionRequestView request;if(!host.nextPermissionRequest(request))throw std::runtime_error("No pending permission request");check(host.resolvePermissionRequest(request.request,num(step,"allow",1)!=0),"Permission response");dt_permission_result_event result;while(host.takePermissionResult(owner,result))send(DT_EVENT_PERMISSION_RESULT,result);}
  else if(action=="status"){services.battery=std::clamp(num(step,"battery",78),0,100);services.wifi=std::clamp(num(step,"wifi",5),0,5);services.charging=num(step,"charging")!=0;changed=true;}
  else if(action=="language"){setLanguage(str(step,"value"));}
 else if(action=="font"){const int id=num(step,"value");if(id==1||id<0||id>4)throw std::runtime_error("Font is not distributed with the preview");native_ui::setWesternFont(sdk::WesternFont(id));check(app->lifecycle(DT_LIFECYCLE_THEME_CHANGED),"Font change");changed=true;}
 else if(action=="map-pointer"){auto bounds=viewport();const int x=num(step,"x"),y=num(step,"y");const auto point=logicalPoint(bounds.left+int((x+0.5)*(bounds.right-bounds.left)/800.0),bounds.top+int((y+0.5)*(bounds.bottom-bounds.top)/480.0));if(abs(point.x-x)>1||abs(point.y-y)>1)throw std::runtime_error("Scaled pointer mapping mismatch");}
 else return false;return true;
}
