#include "TodoController.h"
namespace {
dt_result lifecycle(void*,dt_lifecycle_event kind){auto &a=todo::app;if(kind==DT_LIFECYCLE_ENTER){a.refreshLocale();a.supported=a.host.supports(DT_CAPABILITY_PLATFORM_SERVICES|DT_CAPABILITY_SHARED_DATA|DT_CAPABILITY_LOCALES|DT_CAPABILITY_COMPONENT_READ|DT_CAPABILITY_TEXT_METRICS|DT_CAPABILITY_SCROLL_POSITION|DT_CAPABILITY_DATE_TIME_PICKER|DT_CAPABILITY_EMBEDDED_DOCUMENT_EDITOR|DT_CAPABILITY_TASK_DUE_TIME|DT_CAPABILITY_TEXT_STRIKETHROUGH);a.render();if(a.supported)a.registerLocale();}else if(kind==DT_LIFECYCLE_RESUME){a.refreshLocale();if(!a.busy()&&!a.editing()&&a.modal==todo::Modal::None)a.readPage();}else if(kind==DT_LIFECYCLE_THEME_CHANGED){if(!a.keyboardRequest)a.render();}else if(kind==DT_LIFECYCLE_LEAVE){if(a.request)a.host.cancelRequest(a.request);if(a.keyboardRequest)a.host.cancelRequest(a.keyboardRequest);}return a.ui.result;}
dt_result event(void*,uint16_t kind,dt_bytes value){return todo::app.event(kind,value);}
void destroy(void*){}
}
extern "C" dt_result dt_app_entry(const dt_host_api_v1 *host,dt_app_context owner,dt_app_instance_v1 *instance){
    if(!host||!owner||!instance||(host->abi_version>>16)!=DT_SDK_ABI_MAJOR)return DT_ERR_INVALID_ARGUMENT;
    std::memset(&todo::app,0,sizeof(todo::app));auto &a=todo::app;a.ui.api=host;a.ui.owner=owner;a.host=desktile::sdk::Host(host,owner);a.draft=todo::Record{};a.original=todo::Record{};a.list=todo::Record{};a.today={2000,1,1};
    instance->abi_version=DT_SDK_ABI_VERSION;instance->user_data=&a;instance->lifecycle=lifecycle;instance->event=event;instance->destroy=destroy;return DT_OK;
}
