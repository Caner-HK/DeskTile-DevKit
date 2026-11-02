dt_result Services::deviceState(const runtime::AppContext&,dt_device_state_v1&state){state={};state.structure_size=sizeof(state);state.battery_percent=uint8_t(battery);state.wifi_connected=wifi>=2;state.display_awake=1;state.power_source=charging?DT_POWER_SOURCE_EXTERNAL:DT_POWER_SOURCE_BATTERY;strcpy_s(state.model,"Preview");return DT_OK;}
dt_result Services::platformRequest(dt_app_context owner,const runtime::AppContext&caller,dt_bytes input,dt_request_id id){
 if(fileRequest)return DT_ERR_BUSY;auto root=parse(std::vector<uint8_t>(input.data,input.data+input.size));if(!root||num(root.get(),"schema")!=1)return DT_ERR_INVALID_ARGUMENT;
 const std::string op=str(root.get(),"operation");
 const bool selected=selections.count(str(root.get(),"path"))!=0;
 if(op.compare(0,5,"data.")==0||op.compare(0,7,"locale.")==0||(op.compare(0,6,"files.")==0&&op!="files.pick"&&!selected)){if(dataRequest)return DT_ERR_BUSY;dataOptions.assign(reinterpret_cast<const char*>(input.data),input.size);dataRequest=id;dataOwner=owner;dataCaller=&caller;return DT_OK;}
 if(op!="files.pick"&&op!="files.read"&&op!="files.write")return DT_ERR_NOT_SUPPORTED;
 const bool writing=op=="files.write"||(op=="files.pick"&&!strcmp(str(root.get(),"mode"),"save"));
 if(caller.access(writing?security::Permission::UserFilesWrite:security::Permission::UserFilesRead)!=runtime::PermissionState::Granted)return DT_ERR_PERMISSION_DENIED;
 fileOptions.assign(reinterpret_cast<const char*>(input.data),input.size);fileRequest=id;return DT_OK;
}
void Preview::processFile(const std::wstring*scriptPath){
 const auto id=services.fileRequest;if(!id)return;auto request=Json(cJSON_Parse(services.fileOptions.c_str()),cJSON_Delete);services.fileRequest=0;services.fileOptions.clear();
 dt_result result=DT_OK;Json response(cJSON_CreateObject(),cJSON_Delete);
 try{
  const std::string op=str(request.get(),"operation");
  if(op=="files.pick"){
   const std::string mode=str(request.get(),"mode");if(mode!="open"&&mode!="save")throw DT_ERR_INVALID_ARGUMENT;const bool save=mode=="save";
   std::vector<wchar_t> buffer(32768);auto initial=wide(str(request.get(),"name"));if(initial.find_first_of(L"\\/:")!=std::wstring::npos||initial.size()>255)throw DT_ERR_INVALID_ARGUMENT;std::copy(initial.begin(),initial.end(),buffer.begin());
   std::wstring patterns;auto*extensions=cJSON_GetObjectItemCaseSensitive(request.get(),"extensions");cJSON*item=nullptr;cJSON_ArrayForEach(item,extensions){if(!cJSON_IsString(item))throw DT_ERR_INVALID_ARGUMENT;std::string ext=item->valuestring;if(ext.empty()||ext.size()>12||ext.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")!=std::string::npos)throw DT_ERR_INVALID_ARGUMENT;if(!patterns.empty())patterns+=L";";patterns+=L"*."+wide(ext);}
   if(patterns.empty())patterns=L"*.*";std::wstring filter=chromeText(L"Supported files");filter.push_back(0);filter+=patterns;filter.push_back(0);filter.push_back(0);
   const auto pickerTitle=chromeText(save?L"Save file":L"Open file");OPENFILENAMEW dialog{};dialog.lStructSize=sizeof(dialog);dialog.hwndOwner=window;dialog.lpstrFile=buffer.data();dialog.nMaxFile=DWORD(buffer.size());dialog.lpstrFilter=filter.c_str();dialog.Flags=OFN_EXPLORER|OFN_NOCHANGEDIR|OFN_PATHMUSTEXIST|(save?OFN_OVERWRITEPROMPT:OFN_FILEMUSTEXIST);dialog.lpstrTitle=pickerTitle.c_str();
   std::wstring chosen;
   if(scriptPath)chosen=*scriptPath;else if(save?GetSaveFileNameW(&dialog):GetOpenFileNameW(&dialog))chosen=buffer.data();else if(CommDlgExtendedError())throw DT_ERR_STORAGE;
   if(chosen.empty())throw DT_ERR_CANCELLED;
   auto path=fs::weakly_canonical(chosen);if(fs::is_directory(path))throw DT_ERR_INVALID_ARGUMENT;
   if(!save){if(!fs::is_regular_file(path))throw DT_ERR_NOT_FOUND;const auto maximum=num(request.get(),"maximum_bytes",32*1024*1024);if(maximum<1||fs::file_size(path)>uint64_t(maximum))throw DT_ERR_BUFFER_TOO_SMALL;}
   if(extensions&&cJSON_GetArraySize(extensions)){std::wstring ext=path.extension().wstring();if(!ext.empty())ext.erase(0,1);bool match=false;cJSON_ArrayForEach(item,extensions)if(!_wcsicmp(ext.c_str(),wide(item->valuestring).c_str()))match=true;if(!match)throw DT_ERR_INVALID_ARGUMENT;}
   const auto token="selected/"+std::to_string(++services.selectionSerial)+"/"+path.filename().u8string();services.selections[token]={path,save};
   cJSON_AddNumberToObject(response.get(),"schema",1);cJSON_AddStringToObject(response.get(),"provider","hk.caner.desktile.files");cJSON_AddStringToObject(response.get(),"mode",mode.c_str());cJSON_AddStringToObject(response.get(),"path",token.c_str());
  }else{
   if(strcmp(str(request.get(),"scope"),"user"))throw DT_ERR_INVALID_ARGUMENT;
   const auto found=services.selections.find(str(request.get(),"path"));if(found==services.selections.end())throw DT_ERR_PERMISSION_DENIED;
   const auto path=found->second.path;
   if(op=="files.read"){
    const int maximum=num(request.get(),"maximum_bytes",8192);if(maximum<1||maximum>8192)throw DT_ERR_INVALID_ARGUMENT;
    const std::string offsetText=str(request.get(),"offset","0");if(offsetText.empty()||offsetText.find_first_not_of("0123456789")!=std::string::npos)throw DT_ERR_INVALID_ARGUMENT;
    const auto offset=std::stoull(offsetText),size=fs::file_size(path);if(offset>size)throw DT_ERR_INVALID_ARGUMENT;const auto count=size_t(std::min<uint64_t>(maximum,size-offset));std::vector<uint8_t> bytes(count);std::ifstream in(path,std::ios::binary);in.seekg(offset);if(count)in.read(reinterpret_cast<char*>(bytes.data()),count);if(!in)throw DT_ERR_STORAGE;
    std::vector<char> encoded(sdk::base64Size(count)+1);sdk::base64Encode(bytes.data(),count,encoded.data(),encoded.size());cJSON_AddStringToObject(response.get(),"data_base64",encoded.data());cJSON_AddStringToObject(response.get(),"offset",offsetText.c_str());cJSON_AddStringToObject(response.get(),"next_offset",std::to_string(offset+count).c_str());cJSON_AddStringToObject(response.get(),"file_bytes",std::to_string(size).c_str());cJSON_AddBoolToObject(response.get(),"eof",offset+count==size);
   }else{
    if(!found->second.writable)throw DT_ERR_PERMISSION_DENIED;
    // Initial desktop support creates new exports. Existing files require the firmware's digest contract.
    if(fs::exists(path))throw DT_ERR_BUSY;
    std::vector<uint8_t> bytes;auto*text=cJSON_GetObjectItemCaseSensitive(request.get(),"text");auto*encoded=cJSON_GetObjectItemCaseSensitive(request.get(),"data_base64");if(cJSON_IsString(text)&&!encoded){std::string s=text->valuestring;bytes.assign(s.begin(),s.end());}else if(cJSON_IsString(encoded)&&!text){bytes.resize(8192);size_t count=0;if(!sdk::base64Decode(encoded->valuestring,strlen(encoded->valuestring),bytes.data(),bytes.size(),count))throw DT_ERR_INVALID_ARGUMENT;bytes.resize(count);}else throw DT_ERR_INVALID_ARGUMENT;
    if(bytes.size()>8192)throw DT_ERR_BUFFER_TOO_SMALL;
    HANDLE file=CreateFileW(path.c_str(),GENERIC_WRITE,0,nullptr,CREATE_NEW,FILE_ATTRIBUTE_NORMAL,nullptr);if(file==INVALID_HANDLE_VALUE)throw DT_ERR_STORAGE;DWORD written=0;const bool ok=WriteFile(file,bytes.data(),DWORD(bytes.size()),&written,nullptr)&&written==bytes.size()&&FlushFileBuffers(file);CloseHandle(file);if(!ok){DeleteFileW(path.c_str());throw DT_ERR_STORAGE;}cJSON_AddStringToObject(response.get(),"bytes",std::to_string(bytes.size()).c_str());
   }
  }
 }catch(dt_result error){result=error;}catch(...){result=DT_ERR_STORAGE;}
 char*json=result==DT_OK?cJSON_PrintUnformatted(response.get()):nullptr;check(host.completeRequest(owner,id,result,json,json?strlen(json):0),"File completion");cJSON_free(json);changed=true;
}

