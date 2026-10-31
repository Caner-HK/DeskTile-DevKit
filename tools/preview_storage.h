#pragma once
#include "src/storage/FileSystem.h"
#include "src/platform/HttpClient.h"
#include <filesystem>
#include <io.h>

// Desktop backing for the production repositories and replacement journal.
namespace desktile {
FileHandle::FileHandle(const std::string &path,const char *mode):path_(path){
 std::error_code ec;
 if(std::filesystem::is_directory(std::filesystem::u8path(path),ec)){
  auto state=std::make_shared<DIR>();
  state->next=std::filesystem::directory_iterator(std::filesystem::u8path(path),ec);
  if(!ec)directory_=std::move(state);
 }else{std::wstring m(mode,mode+strlen(mode));file_=std::shared_ptr<FILE>(_wfopen(std::filesystem::u8path(path).c_str(),m.c_str()),[](FILE*f){if(f)fclose(f);});}
}
size_t FileHandle::read(uint8_t*p,size_t n){return file_?fread(p,1,n,file_.get()):0;}
size_t FileHandle::write(const uint8_t*p,size_t n){return file_?fwrite(p,1,n,file_.get()):0;}
bool FileHandle::seek(size_t n){return file_&&_fseeki64(file_.get(),n,SEEK_SET)==0;}
size_t FileHandle::size()const{if(!file_)return 0;const auto at=_ftelli64(file_.get());if(at<0||_fseeki64(file_.get(),0,SEEK_END))return 0;const auto end=_ftelli64(file_.get());_fseeki64(file_.get(),at,SEEK_SET);return end<0?0:size_t(end);}
size_t FileHandle::available()const{if(!file_)return 0;const auto at=_ftelli64(file_.get());return at<0?0:size()-std::min(size(),size_t(at));}
int64_t FileHandle::modifiedTime()const{return 0;}
bool FileHandle::flush(){return file_&&fflush(file_.get())==0&&_commit(_fileno(file_.get()))==0;}
void FileHandle::close(){file_.reset();directory_.reset();}
DirectoryRead FileHandle::readDirectoryEntry(DirectoryEntry &out){
 out={};if(!directory_)return DirectoryRead::Error;
 if(directory_->next==std::filesystem::directory_iterator{})return DirectoryRead::End;
 std::error_code ec;const auto entry=*directory_->next;directory_->next.increment(ec);if(ec)return DirectoryRead::Error;
 const auto name=entry.path().filename().u8string();if(name.size()>=sizeof(out.name))return DirectoryRead::Error;
 strcpy(out.name,name.c_str());out.directory=entry.is_directory(ec);if(ec)return DirectoryRead::Error;
 if(!out.directory){out.bytes=entry.file_size(ec);if(ec)return DirectoryRead::Error;}return DirectoryRead::Entry;
}
FileHandle FileHandle::openNextFile(){DirectoryEntry entry{};return readDirectoryEntry(entry)==DirectoryRead::Entry?FileHandle(path_+"/"+entry.name,"rb"):FileHandle{};}
void FileHandle::diagnosticState(){}
static std::filesystem::path previewPath(const std::string &root,const char *path){
 if(!path||path[0]!='/')throw std::invalid_argument("Invalid preview storage path");
 auto relative=std::filesystem::u8path(path+1);if(relative.has_root_path())throw std::invalid_argument("Invalid preview storage path");
 for(const auto &part:relative)if(part==L"..")throw std::invalid_argument("Invalid preview storage path");
 auto base=std::filesystem::weakly_canonical(std::filesystem::u8path(root));auto result=std::filesystem::weakly_canonical(base/relative);
 auto within=result.lexically_relative(base);if(within.empty()||*within.begin()==L"..")throw std::invalid_argument("Preview storage escape");return result;
}
FileHandle FileSystem::open(const char*p,const char*m)const{auto lock=access();return FileHandle(previewPath(root_,p).u8string(),m);}
bool FileSystem::exists(const char*p)const{auto lock=access();std::error_code ec;const bool result=std::filesystem::exists(previewPath(root_,p),ec);errno=ec?EIO:result?0:ENOENT;return result;}
bool FileSystem::mkdir(const char*p)const{auto lock=access();std::error_code ec;auto path=previewPath(root_,p);std::filesystem::create_directories(path,ec);return !ec&&std::filesystem::is_directory(path);}
bool FileSystem::remove(const char*p)const{auto lock=access();std::error_code ec;auto path=previewPath(root_,p);if(std::filesystem::is_directory(path,ec))return false;const bool result=std::filesystem::remove(path,ec);if(result)noteMutation(p);return result&&!ec;}
bool FileSystem::removeEmptyDirectory(const char*p)const{auto lock=access();std::error_code ec;auto path=previewPath(root_,p);if(!std::filesystem::is_directory(path,ec))return false;return std::filesystem::remove(path,ec)&&!ec;}
bool FileSystem::removeTree(const char*p)const{auto lock=access();std::error_code ec;std::filesystem::remove_all(previewPath(root_,p),ec);if(!ec)noteMutation(p);return !ec;}
bool FileSystem::rename(const char*a,const char*b)const{auto lock=access();auto from=previewPath(root_,a),to=previewPath(root_,b);if(!MoveFileExW(from.c_str(),to.c_str(),MOVEFILE_WRITE_THROUGH))return false;noteMutation(a);noteMutation(b);return true;}
// Calendar subscription refresh is offline until a network provider is supplied.
int fetchHttp(const char*,std::string &body,const HttpOptions&){body.clear();return -1;}
}
