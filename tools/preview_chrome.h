#pragma once
#include <cwchar>
namespace preview_chrome {
inline std::wstring text(const wchar_t*value,bool chinese){
 if(!chinese)return value;
 static const std::pair<const wchar_t*,const wchar_t*> labels[]{
  {L"Light theme",L"浅色主题"},{L"Dark theme",L"深色主题"},{L"Layout bounds",L"布局边界"},{L"Performance",L"性能"},
  {L"App menu",L"应用菜单"},{L"Settings",L"设置"},{L"Preview settings",L"预览设置"},{L"Preview",L"应用预览"},
  {L"Theme",L"应用主题"},{L"Scale",L"缩放"},{L"Latin font",L"西文字体"},{L"System language",L"模拟系统语言"},
  {L"Interface",L"工具界面"},{L"Interface theme",L"界面主题"},{L"Interface language",L"界面语言"},
  {L"Follow VS Code",L"跟随 VS Code"},{L"Follow system",L"跟随系统"},{L"Light",L"浅色"},{L"Dark",L"深色"},
  {L"Status bar",L"模拟状态栏"},{L"Battery level",L"电量"},{L"Charging",L"正在充电"},{L"Fit window",L"适应窗口"},
  {L"Off",L"关闭"},{L"Disconnected",L"未连接"},{L"Weak signal",L"弱信号"},{L"Fair signal",L"一般信号"},{L"Good signal",L"良好信号"},{L"Full signal",L"满格信号"},
  {L"Cancel",L"取消"},{L"Apply",L"应用"},{L"OK",L"确定"},{L"Close",L"关闭"},{L"Allow",L"允许"},{L"Deny",L"拒绝"},
  {L"Supported files",L"支持的文件"},{L"Save file",L"保存文件"},{L"Open file",L"打开文件"},
  {L"Text input",L"输入文字"},{L"Preview error",L"预览错误"},{L"Text too long",L"文字过长"},{L"Permission request",L"权限请求"},
  {L"The entered text exceeds this field's byte limit.",L"输入内容超过此字段允许的字节数。"},{L"Enter a battery level from 0 to 100.",L"请输入 0 到 100 之间的电量。"}
 };
 for(const auto&entry:labels)if(!wcscmp(value,entry.first))return entry.second;
 return value;
}
struct Colors{COLORREF background,canvas,field,text,secondary,border,hover,pressed,selection,accent,onAccent;};
struct Appearance{
 std::string mode="auto",language="auto";bool dark=false,chinese=false;Colors c{};
 HBRUSH backgroundBrush=nullptr,fieldBrush=nullptr;
 Appearance(){sync();}
 Appearance(const Appearance&)=delete;Appearance&operator=(const Appearance&)=delete;
 ~Appearance(){if(backgroundBrush)DeleteObject(backgroundBrush);if(fieldBrush)DeleteObject(fieldBrush);}
 static bool systemDark(){
  using Read=LSTATUS(WINAPI*)(HKEY,LPCWSTR,LPCWSTR,DWORD,LPDWORD,PVOID,LPDWORD);
  auto module=LoadLibraryW(L"advapi32.dll");if(!module)return false;
  auto read=reinterpret_cast<Read>(GetProcAddress(module,"RegGetValueW"));DWORD light=1,size=sizeof(light);
  if(read)read(HKEY_CURRENT_USER,L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",L"AppsUseLightTheme",RRF_RT_REG_DWORD,nullptr,&light,&size);
  FreeLibrary(module);return light==0;
 }
 void sync(){
  const char*editorTheme=getenv("DESKTILE_PREVIEW_UI_THEME"),*editorLanguage=getenv("DESKTILE_PREVIEW_UI_LANGUAGE");
  dark=mode=="dark"||(mode=="auto"&&(editorTheme?std::string(editorTheme)=="dark":systemDark()));
  chinese=language=="zh-CN"||(language=="auto"&&(editorLanguage?std::string(editorLanguage).rfind("zh",0)==0:PRIMARYLANGID(GetUserDefaultUILanguage())==LANG_CHINESE));
  c=dark?Colors{RGB(31,31,31),RGB(24,24,24),RGB(49,49,49),RGB(204,204,204),RGB(157,157,157),RGB(69,69,69),RGB(45,46,46),RGB(62,62,64),RGB(4,57,94),RGB(0,120,212),RGB(255,255,255)}:
         Colors{RGB(255,255,255),RGB(243,243,243),RGB(255,255,255),RGB(51,51,51),RGB(97,97,97),RGB(206,206,206),RGB(232,232,232),RGB(213,213,213),RGB(221,235,249),RGB(0,120,212),RGB(255,255,255)};
  if(backgroundBrush)DeleteObject(backgroundBrush);if(fieldBrush)DeleteObject(fieldBrush);
  backgroundBrush=CreateSolidBrush(c.background);fieldBrush=CreateSolidBrush(c.field);
 }
 void titleBar(HWND window)const{
  if(!window)return;using Set=HRESULT(WINAPI*)(HWND,DWORD,LPCVOID,DWORD);
  auto module=LoadLibraryW(L"dwmapi.dll");if(!module)return;
  auto set=reinterpret_cast<Set>(GetProcAddress(module,"DwmSetWindowAttribute"));BOOL value=dark;
  if(set)set(window,20,&value,sizeof(value));FreeLibrary(module);
 }
 std::wstring label(const wchar_t*value)const{return text(value,chinese);}
};
}
