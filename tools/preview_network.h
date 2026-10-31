#pragma once
#include <winhttp.h>
#include <array>
#include <atomic>
#include <memory>
#include <thread>
#include <vector>
#include "src/platform/HttpClient.h"

namespace preview_network {
struct Handle {
    HINTERNET value = nullptr;
    explicit Handle(HINTERNET handle) : value(handle) {}
    ~Handle() { if (value) WinHttpCloseHandle(value); }
    operator HINTERNET() const { return value; }
    Handle(const Handle&) = delete;
};
inline std::wstring unicode(const char *text) {
    const int size = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, text, -1, nullptr, 0);
    if (!size) return {};
    std::wstring result(size, 0);
    MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, text, -1, result.data(), size);
    result.pop_back();
    return result;
}
inline int fetch(const char *url, std::string &body, const desktile::HttpOptions &options) {
    body.clear();
    if (!url || !options.accept || !options.method || options.timeoutMs <= 0 ||
        (options.bodyBytes && !options.body)) return -1;
    auto cancelled = [&] { return options.cancelled && options.cancelled->load(); };
    if (cancelled()) return -1;
    const auto address = unicode(url);
    URL_COMPONENTS parts{}; parts.dwStructSize = sizeof(parts);
    parts.dwHostNameLength = parts.dwUrlPathLength = parts.dwExtraInfoLength = DWORD(-1);
    if (!WinHttpCrackUrl(address.c_str(), DWORD(address.size()), 0, &parts) ||
        (parts.nScheme != INTERNET_SCHEME_HTTP && parts.nScheme != INTERNET_SCHEME_HTTPS)) return -1;
    const std::wstring host(parts.lpszHostName, parts.dwHostNameLength);
    std::wstring path(parts.lpszUrlPath, parts.dwUrlPathLength);
    if (parts.dwExtraInfoLength) path.append(parts.lpszExtraInfo, parts.dwExtraInfoLength);
    const auto fragment = path.find(L'#'); if (fragment != std::wstring::npos) path.resize(fragment);
    if (path.empty()) path = L"/";
    Handle session(WinHttpOpen(L"DeskTile Preview/1.0", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
                              WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0));
    if (!session.value || !WinHttpSetTimeouts(session, options.timeoutMs, options.timeoutMs,
                                             options.timeoutMs, options.timeoutMs)) return -1;
    Handle connection(WinHttpConnect(session, host.c_str(), parts.nPort, 0));
    if (!connection.value) return -1;
    const auto method = unicode(options.method);
    Handle request(WinHttpOpenRequest(connection, method.c_str(), path.c_str(), nullptr,
                                     WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES,
                                     parts.nScheme == INTERNET_SCHEME_HTTPS ? WINHTTP_FLAG_SECURE : 0));
    if (!request.value) return -1;
    DWORD responseTimeout = DWORD(options.timeoutMs);
    if (!WinHttpSetOption(request, WINHTTP_OPTION_RECEIVE_RESPONSE_TIMEOUT,
                          &responseTimeout, sizeof(responseTimeout))) return -1;
    DWORD redirect = options.followRedirects ? WINHTTP_OPTION_REDIRECT_POLICY_DISALLOW_HTTPS_TO_HTTP
                                             : WINHTTP_OPTION_REDIRECT_POLICY_NEVER;
    if (!WinHttpSetOption(request, WINHTTP_OPTION_REDIRECT_POLICY, &redirect, sizeof(redirect))) return -1;
    // Preview requests never inherit the developer's Windows login credentials.
    DWORD auth = WINHTTP_AUTOLOGON_SECURITY_LEVEL_HIGH;
    if (!WinHttpSetOption(request, WINHTTP_OPTION_AUTOLOGON_POLICY, &auth, sizeof(auth))) return -1;
    std::wstring headers = L"Accept: " + unicode(options.accept) + L"\r\n";
    if (!strcmp(options.method, "POST") && options.contentType)
        headers += L"Content-Type: " + unicode(options.contentType) + L"\r\n";
    const bool post = !strcmp(options.method, "POST");
    if (cancelled() || !WinHttpSendRequest(request, headers.c_str(), DWORD(headers.size()),
            post ? const_cast<char*>(options.body) : nullptr,
            post ? DWORD(options.bodyBytes) : 0, post ? DWORD(options.bodyBytes) : 0, 0) ||
        cancelled() || !WinHttpReceiveResponse(request, nullptr)) return -1;
    DWORD status = 0, size = sizeof(status);
    if (!WinHttpQueryHeaders(request, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                            WINHTTP_HEADER_NAME_BY_INDEX, &status, &size, WINHTTP_NO_HEADER_INDEX)) return -1;
    // Match the firmware HttpClient: only status 200 carries response bytes.
    if (status != 200) return int(status);
    char chunk[4096];
    for (;;) {
        DWORD count = 0;
        if (cancelled() || !WinHttpReadData(request, chunk, sizeof(chunk), &count)) { body.clear(); return -1; }
        if (!count) return int(status);
        if (options.maximumResponseBytes && count > options.maximumResponseBytes - body.size()) {
            body.clear(); return -1;
        }
        body.append(chunk, count);
    }
}

class Requests {
    struct Job {
        dt_app_context owner = 0; dt_request_id id = 0;
        std::string url, method = "GET", accept = "application/json", body, response;
        int timeout = 15000, status = -1;
        ULONGLONG started = 0;
        std::atomic<bool> cancelled{false}, done{false};
    };
    std::array<std::shared_ptr<Job>, 4> jobs_{};
public:
    ~Requests() { for (auto &job : jobs_) if (job) job->cancelled = true; }
    dt_result start(dt_app_context owner, dt_bytes input, dt_request_id id) {
        if (!input.data || !input.size || input.size > 12 * 1024) return DT_ERR_INVALID_ARGUMENT;
        auto request = std::unique_ptr<cJSON, decltype(&cJSON_Delete)>(
            cJSON_ParseWithLength(reinterpret_cast<const char*>(input.data), input.size), cJSON_Delete);
        if (!cJSON_IsObject(request.get())) return DT_ERR_INVALID_ARGUMENT;
        auto job = std::make_shared<Job>(); job->owner = owner; job->id = id;
        auto string = [&](const char *key, std::string &out, size_t max, bool required = false) {
            auto *value = cJSON_GetObjectItemCaseSensitive(request.get(), key);
            if (!value) return !required;
            if (!cJSON_IsString(value) || !value->valuestring || strlen(value->valuestring) > max ||
                (required && !*value->valuestring)) return false;
            out = value->valuestring; return true;
        };
        if (!string("url", job->url, 512, true) || !string("method", job->method, 4) ||
            !string("accept", job->accept, 96) || !string("body", job->body, 8192)) return DT_ERR_INVALID_ARGUMENT;
        if (job->method.empty()) job->method = "GET";
        if (job->accept.empty()) job->accept = "application/json";
        if (job->method != "GET" && job->method != "POST") return DT_ERR_INVALID_ARGUMENT;
        if (job->accept.find_first_of("\r\n") != std::string::npos) return DT_ERR_INVALID_ARGUMENT;
        auto *timeout = cJSON_GetObjectItemCaseSensitive(request.get(), "timeout_ms");
        if (timeout) {
            if (!cJSON_IsNumber(timeout) || timeout->valuedouble < 1000 || timeout->valuedouble > 60000)
                return DT_ERR_INVALID_ARGUMENT;
            job->timeout = timeout->valueint;
        }
        for (auto &slot : jobs_) if (!slot || (slot->cancelled && slot->done)) {
            try {
                job->started = GetTickCount64();
                // Worker owns its input/result. Only the UI thread touches NativeSdkHost.
                std::thread([job] {
                    try {
                        desktile::HttpOptions options;
                        options.method = job->method.c_str(); options.accept = job->accept.c_str();
                        options.body = job->body.data(); options.bodyBytes = job->body.size();
                        options.timeoutMs = job->timeout; options.maximumResponseBytes = 32 * 1024;
                        options.cancelled = &job->cancelled;
                        job->status = fetch(job->url.c_str(), job->response, options);
                    } catch (...) { job->status = -1; job->response.clear(); }
                    job->done = true;
                }).detach();
                slot = job; return DT_OK;
            } catch (...) { return DT_ERR_OUT_OF_MEMORY; }
        }
        return DT_ERR_BUSY;
    }
    void cancel(dt_app_context owner, dt_request_id id) {
        for (auto &job : jobs_) if (job && job->owner == owner && job->id == id) job->cancelled = true;
    }
    void process(desktile::runtime::NativeSdkHost &host) {
        for (auto &job : jobs_) {
            if (!job) continue;
            if (!job->cancelled && GetTickCount64() - job->started >= ULONGLONG(job->timeout)) {
                const dt_network_response_header_v1 timeout{-1, 0};
                const auto result = host.completeRequest(job->owner, job->id, DT_ERR_STORAGE, &timeout, sizeof(timeout));
                if (result == DT_OK || result == DT_ERR_INVALID_ARGUMENT) job->cancelled = true;
                // Keep the slot until its worker has released every HTTP handle.
                if (!job->cancelled) continue;
            }
            if (!job->done) continue;
            if (job->cancelled) { job.reset(); continue; }
            const dt_network_response_header_v1 header{job->status, uint32_t(job->response.size())};
            std::vector<uint8_t> payload(sizeof(header) + job->response.size());
            memcpy(payload.data(), &header, sizeof(header));
            if (!job->response.empty()) memcpy(payload.data() + sizeof(header), job->response.data(), job->response.size());
            auto result = host.completeRequest(job->owner, job->id, job->status >= 0 ? DT_OK : DT_ERR_STORAGE,
                                              payload.data(), payload.size());
            if (result == DT_OK || result == DT_ERR_INVALID_ARGUMENT) job.reset();
        }
    }
};
}
