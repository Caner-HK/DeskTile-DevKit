#pragma once

#include "sdk.h"
#include "file_picker.hpp"
#include "json.hpp"
#include <cstring>
#include <new>
#include <type_traits>
#include <utility>

namespace desktile::sdk {

struct Component {
    dt_handle handle = 0;
    explicit operator bool() const { return handle != 0; }
};

class Host {
public:
    Host() = default;
    Host(const dt_host_api_v1 *api, dt_app_context context) : api_(api), context_(context) {}

    explicit operator bool() const { return api_ && context_; }
    uint32_t abiVersion() const { return api_ ? api_->abi_version : 0; }
    dt_app_context context() const { return context_; }
    uint64_t monotonicMs() const { return api_ ? api_->monotonic_ms(context_) : 0; }
    int64_t wallClockSeconds() const { return api_ ? api_->wall_clock_seconds(context_) : 0; }
    dt_permission_state permission(dt_permission value) const
    {
        return api_ ? api_->permission_check(context_, value) : DT_PERMISSION_DENIED;
    }
    dt_result requestPermission(dt_permission value, const char *reason, dt_request_id &request) const
    {
        return api_ ? api_->permission_request(context_, value, reason, &request)
                    : DT_ERR_NOT_SUPPORTED;
    }
    void log(uint8_t level, const char *message) const { if (api_) api_->log(context_, level, message); }

    dt_result create(dt_component_kind kind, Component &component) const
    {
        return api_ ? api_->ui_create(context_, kind, &component.handle) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result destroy(Component component) const { return api_ ? api_->ui_destroy(context_, component.handle) : DT_ERR_NOT_SUPPORTED; }
    dt_result append(Component parent, Component child) const
    {
        return api_ ? api_->ui_append(context_, parent.handle, child.handle) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result present(Component root) const { return api_ ? api_->ui_present(context_, root.handle) : DT_ERR_NOT_SUPPORTED; }
    dt_result getBytes(Component component,dt_property property,dt_mutable_bytes &value)const{
        value.size=0;
        return supports(DT_CAPABILITY_COMPONENT_READ)&&api_->ui_get?api_->ui_get(context_,component.handle,property,&value):DT_ERR_NOT_SUPPORTED;
    }
    template<class T>dt_result get(Component component,dt_property property,T &value)const{
        static_assert(std::is_trivially_copyable<T>::value,"SDK properties are value types");
        value={};dt_mutable_bytes bytes{reinterpret_cast<uint8_t*>(&value),sizeof(value),0};const auto result=getBytes(component,property,bytes);
        return result==DT_OK&&bytes.size!=sizeof(value)?DT_ERR_INVALID_ARGUMENT:result;
    }
    dt_result getText(Component component,dt_property property,char *text,size_t capacity)const{
        if(!text||!capacity)return DT_ERR_INVALID_ARGUMENT;
        text[0]=0;dt_mutable_bytes bytes{reinterpret_cast<uint8_t*>(text),capacity-1,0};const auto result=getBytes(component,property,bytes);
        if(result==DT_OK)text[bytes.size]=0;
        return result;
    }
    dt_result textWidth(const char *text,uint16_t size,int32_t &width)const{
        width=0;if(!text)return DT_ERR_INVALID_ARGUMENT;
        return supports(DT_CAPABILITY_TEXT_METRICS)&&api_->text_width?api_->text_width(context_,{reinterpret_cast<const uint8_t*>(text),std::strlen(text)},size,&width):DT_ERR_NOT_SUPPORTED;
    }

    dt_result setBytes(Component component, dt_property property, const void *data, size_t size) const
    {
        return api_ ? api_->ui_set(context_, component.handle, property,
                                   {static_cast<const uint8_t *>(data), size})
                    : DT_ERR_NOT_SUPPORTED;
    }
    dt_result setText(Component component, dt_property property, const char *text) const
    {
        return text ? setBytes(component, property, text, std::strlen(text)) : DT_ERR_INVALID_ARGUMENT;
    }
    template<class T> dt_result set(Component component, dt_property property, const T &value) const
    {
        static_assert(std::is_trivially_copyable<T>::value, "SDK property values must be value types");
        return setBytes(component, property, &value, sizeof(value));
    }

    dt_result storageRead(const char *key, dt_mutable_bytes &value) const
    {
        return api_ ? api_->storage_read(context_, key, &value) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result storageWrite(const char *key, dt_bytes value) const
    {
        return api_ ? api_->storage_write(context_, key, value) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result storageRemove(const char *key) const { return api_ ? api_->storage_remove(context_, key) : DT_ERR_NOT_SUPPORTED; }
    dt_result resourceRead(const char *path, dt_mutable_bytes &value) const
    {
        return api_ ? api_->resource_read(context_, path, &value) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result resourceSize(const char *path, uint64_t &size) const
    {
        size = 0;
        return api_ ? api_->resource_size(context_, path, &size) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result resourceReadRange(const char *path, uint64_t offset, dt_mutable_bytes &value) const
    {
        return api_ ? api_->resource_read_range(context_, path, offset, &value)
                    : DT_ERR_NOT_SUPPORTED;
    }
    dt_result cacheRead(const char *key, dt_mutable_bytes &value) const
    {
        return api_ ? api_->cache_read(context_, key, &value) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result cacheWrite(const char *key, dt_bytes value) const
    {
        return api_ ? api_->cache_write(context_, key, value) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result cacheRemove(const char *key) const { return api_ ? api_->cache_remove(context_, key) : DT_ERR_NOT_SUPPORTED; }
    dt_result networkRequest(dt_bytes request, dt_request_id &id) const
    {
        return api_ ? api_->network_request(context_, request, &id) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result cancelRequest(dt_request_id id) const
    {
        return api_ ? api_->request_cancel(context_, id) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result showKeyboard(dt_bytes options, dt_request_id &id) const
    {
        return api_ ? api_->keyboard_show(context_, options, &id) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result postNotification(dt_bytes notification, dt_request_id &id) const
    {
        return api_ ? api_->notification_post(context_, notification, &id) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result deviceState(dt_device_state_v1 &state) const
    {
        state = {};
        state.structure_size = sizeof(state);
        return api_ ? api_->device_state(context_, &state) : DT_ERR_NOT_SUPPORTED;
    }
    dt_result requestExit() const { return api_ ? api_->request_exit(context_) : DT_ERR_NOT_SUPPORTED; }
    dt_result capabilities(dt_sdk_capabilities_v1 &info) const {
        info={};dt_mutable_bytes value{reinterpret_cast<uint8_t*>(&info),sizeof(info),0};
        const auto result=api_&&api_->resource_read?api_->resource_read(context_,DT_SYSTEM_CAPABILITIES_RESOURCE,&value):DT_ERR_NOT_SUPPORTED;
        return result==DT_OK&&(value.size!=sizeof(info)||info.structure_size<sizeof(info))?DT_ERR_INVALID_ARGUMENT:result;
    }
    bool supports(uint32_t flags) const {
        dt_sdk_capabilities_v1 info{};return capabilities(info)==DT_OK&&(info.flags&flags)==flags;
    }
    dt_result platformRequest(const char *json,dt_request_id &request)const{
        request=0;if(!json)return DT_ERR_INVALID_ARGUMENT;
        if(!supports(DT_CAPABILITY_PLATFORM_SERVICES))return DT_ERR_NOT_SUPPORTED;
        return api_->platform_request?api_->platform_request(context_,{reinterpret_cast<const uint8_t*>(json),std::strlen(json)},&request):DT_ERR_NOT_SUPPORTED;
    }
    dt_result pickFile(const FilePickerOptions &options,dt_request_id &request)const{
        request=0;
        if(!supports(DT_CAPABILITY_FILE_PICKER))return DT_ERR_NOT_SUPPORTED;
        if(options.extensionCount>filePickerExtensionLimit||!std::memchr(options.directory,0,sizeof(options.directory))||!std::memchr(options.name,0,sizeof(options.name)))return DT_ERR_INVALID_ARGUMENT;
        char encoded[4096];JsonWriter json(encoded,sizeof(encoded));json.raw("{\"schema\":1,\"operation\":\"files.pick\",\"mode\":");json.string(options.save?"save":"open");
        json.raw(",\"directory\":");json.string(options.directory);json.raw(",\"name\":");json.string(options.name);json.raw(",\"maximum_bytes\":");json.number(options.maximumBytes);json.raw(",\"extensions\":[");
        for(unsigned i=0;i<options.extensionCount;++i){if(!std::memchr(options.extensions[i],0,sizeof(options.extensions[i])))return DT_ERR_INVALID_ARGUMENT;if(i)json.raw(",");json.string(options.extensions[i]);}
        json.raw("]}");return json.ok()?platformRequest(encoded,request):DT_ERR_BUFFER_TOO_SMALL;
    }
    dt_result launchInfo(dt_launch_info_v1 &info) const {
        info={DT_LAUNCH_UNKNOWN,11};dt_mutable_bytes value{reinterpret_cast<uint8_t*>(&info),sizeof(info),0};
        const auto result=api_&&api_->resource_read?api_->resource_read(context_,DT_SYSTEM_LAUNCH_INFO_RESOURCE,&value):DT_ERR_NOT_SUPPORTED;
        return result==DT_OK&&value.size!=sizeof(info)?DT_ERR_INVALID_ARGUMENT:result;
    }
    dt_result localeInfo(dt_locale_info_v1 &info)const{
        info={};if(!supports(DT_CAPABILITY_LOCALES))return DT_ERR_NOT_SUPPORTED;
        dt_mutable_bytes value{reinterpret_cast<uint8_t*>(&info),sizeof(info),0};const auto result=resourceRead(DT_SYSTEM_LOCALE_INFO_RESOURCE,value);
        return result==DT_OK&&(value.size!=sizeof(info)||info.structure_size!=sizeof(info)||info.schema!=1)?DT_ERR_INVALID_ARGUMENT:result;
    }
    dt_result colorScheme(dt_color_scheme_v1 &info)const{
        info={};if(!supports(DT_CAPABILITY_SYSTEM_COLOR_SCHEME))return DT_ERR_NOT_SUPPORTED;
        dt_mutable_bytes value{reinterpret_cast<uint8_t*>(&info),sizeof(info),0};const auto result=resourceRead(DT_SYSTEM_COLOR_SCHEME_RESOURCE,value);
        return result==DT_OK&&(value.size!=sizeof(info)||info.structure_size!=sizeof(info)||info.schema!=1)?DT_ERR_INVALID_ARGUMENT:result;
    }
    dt_result colorPalette(dt_color_palette_v1 &info)const{
        info={};dt_mutable_bytes value{reinterpret_cast<uint8_t*>(&info),sizeof(info),0};
        const auto result=resourceRead(DT_SYSTEM_COLOR_PALETTE_RESOURCE,value);
        if(result!=DT_OK)return result;
        if(value.size!=sizeof(info)||info.structure_size!=sizeof(info)||info.schema!=1||info.count>DT_MAX_CUSTOM_COLORS)return DT_ERR_INVALID_ARGUMENT;
        for(unsigned i=0;i<info.count;++i)if(info.colors[i]>0xffffff)return DT_ERR_INVALID_ARGUMENT;
        return DT_OK;
    }
    dt_result userFilesList(const char *path,uint32_t offset,dt_request_id &id) const
    {
        return api_ && (abiVersion() >> 16U) == DT_SDK_ABI_MAJOR && api_->user_files_list
            ? api_->user_files_list(context_,path,offset,&id)
                                           : DT_ERR_NOT_SUPPORTED;
    }

private:
    const dt_host_api_v1 *api_ = nullptr;
    dt_app_context context_ = 0;
};

class Application {
public:
    explicit Application(Host host) : host_(host) {}
    virtual ~Application() = default;
    virtual dt_result enter() = 0;
    virtual dt_result suspend() { return DT_OK; }
    virtual dt_result resume() { return DT_OK; }
    virtual dt_result leave() { return DT_OK; }
    virtual dt_result themeChanged() { return DT_OK; }
    virtual dt_result memoryPressure() { return DT_OK; }
    virtual dt_result event(dt_ui_event, dt_bytes) { return DT_ERR_NOT_SUPPORTED; }

protected:
    Host &host() { return host_; }
    const Host &host() const { return host_; }

private:
    Host host_;
};

inline dt_result lifecycleThunk(void *userData, dt_lifecycle_event event)
{
    if (!userData) return DT_ERR_INVALID_ARGUMENT;
    auto &application = *static_cast<Application *>(userData);
    switch (event) {
    case DT_LIFECYCLE_ENTER: return application.enter();
    case DT_LIFECYCLE_SUSPEND: return application.suspend();
    case DT_LIFECYCLE_RESUME: return application.resume();
    case DT_LIFECYCLE_LEAVE: return application.leave();
    case DT_LIFECYCLE_THEME_CHANGED: return application.themeChanged();
    case DT_LIFECYCLE_MEMORY_PRESSURE: return application.memoryPressure();
    }
    return DT_ERR_INVALID_ARGUMENT;
}

inline dt_result eventThunk(void *userData, uint16_t event, dt_bytes payload)
{
    return userData ? static_cast<Application *>(userData)->event(static_cast<dt_ui_event>(event), payload)
                    : DT_ERR_INVALID_ARGUMENT;
}

inline void destroyThunk(void *userData) { delete static_cast<Application *>(userData); }

template<class T, class... Args>
dt_result createApplication(const dt_host_api_v1 *api, dt_app_context context,
                            dt_app_instance_v1 *instance, Args &&...args)
{
    static_assert(std::is_base_of<Application, T>::value, "SDK applications derive from Application");
    if (!api || !instance || (api->abi_version >> 16U) != DT_SDK_ABI_MAJOR)
        return DT_ERR_NOT_SUPPORTED;
    T *application = new (std::nothrow) T(Host(api, context), std::forward<Args>(args)...);
    if (!application) return DT_ERR_OUT_OF_MEMORY;
    instance->abi_version = DT_SDK_ABI_VERSION;
    instance->user_data = application;
    instance->lifecycle = lifecycleThunk;
    instance->event = eventThunk;
    instance->destroy = destroyThunk;
    return DT_OK;
}

}  // namespace desktile::sdk

#define DT_NATIVE_APP_ENTRY(symbol, application_type)                                      \
    extern "C" dt_result symbol(const dt_host_api_v1 *host, dt_app_context context,      \
                                 dt_app_instance_v1 *instance)                              \
    {                                                                                       \
        return ::desktile::sdk::createApplication<application_type>(host, context, instance); \
    }
