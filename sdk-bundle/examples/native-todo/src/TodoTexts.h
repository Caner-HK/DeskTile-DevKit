#pragma once
#include <cstring>
namespace todo {
enum class Text {
    App, Lists, NewList, EditList, NewTask, EditTask, Title, Notes, Due, NoDate,
    EmptyLists, EmptyTasks, Loading, Saving, Save, Cancel, Discard, Delete,
    LeaveTitle, LeaveBody, DeleteList, DeleteTask, DeleteBody, ReadPermission, WritePermission,
    Denied, ReadError, WriteError, Conflict, Missing, Capacity, InvalidTitle, Unsupported,
    Retry, SetDate, ListColor, NonemptyList, AddDate, TaskTitle, OptionalNotes,
    Overdue, Pending, Completed, NoLists, NoTasks, ListIcon, Progress, Latest, DeleteListBody, Close, ReadFailed, Count
};
inline const char *text(Text id,const char *locale) {
    static const char *const values[][3]{
        {"待办","待辦","ToDo"}, {"清单","清單","Lists"},
        {"新建清单","新增清單","New list"}, {"编辑清单","編輯清單","Edit list"},
        {"新建待办","新增待辦","New task"}, {"编辑待办","編輯待辦","Edit task"},
        {"标题","標題","Title"}, {"备注","備註","Notes"},
        {"时间","時間","Date & time"}, {"不设置","不設定","Not set"},
        {"创建清单，整理你的待办。","建立清單，整理你的待辦。","Create a list to organize your tasks."},
        {"添加待办，安排需要完成的事。","加入待辦，安排需要完成的事。","Add a task to this list."},
        {"正在读取…","讀取中…","Loading..."}, {"正在保存…","儲存中…","Saving..."},
        {"保存","儲存","Save"}, {"取消","取消","Cancel"},
        {"放弃修改","捨棄更改","Discard"}, {"删除","刪除","Delete"},
        {"保存修改？","儲存更改？","Save changes?"},
        {"你编辑的内容尚未保存。","你編輯的內容尚未儲存。","Your changes haven't been saved."},
        {"删除清单？","刪除清單？","Delete list?"}, {"删除待办？","刪除待辦？","Delete task?"},
        {"删除后将无法恢复。","刪除後將無法復原。","This can't be undone."},
        {"读取清单和待办。","讀取清單及待辦。","Read your lists and tasks."},
        {"保存清单和待办的修改。","儲存清單及待辦的更改。","Save changes to your lists and tasks."},
        {"请在应用权限中允许访问待办。","請在應用程式權限中允許存取待辦。","Allow task access in app permissions."},
        {"暂时无法读取，请重试。","暫時無法讀取，請重試。","Couldn't load your tasks. Try again."},
        {"暂时无法保存，你的修改仍保留在此页面。","暫時無法儲存，你的更改仍保留在此頁面。","Couldn't save. Your changes are still here."},
        {"此项目已在别处更改。草稿仍保留，重新打开可读取最新内容。","此項目已在別處更改。草稿仍保留，重新開啟可讀取最新內容。","This item changed elsewhere. Your draft is still here."},
        {"此项目已被删除，你的修改仍保留在此页面。","此項目已被刪除，你的更改仍保留在此頁面。","This item was deleted. Your changes are still here."},
        {"待办存储空间已满，请先删除不需要的项目。","待辦儲存空間已滿，請先刪除不需要的項目。","Task storage is full. Delete items you no longer need."},
        {"请填写标题。","請填寫標題。","Enter a title."},
        {"请更新系统后打开待办。","請更新系統後開啟待辦。","Update DeskTile to use ToDo."},
        {"重试","重試","Retry"},
        {"设置日期","設定日期","Set due date"}, {"清单颜色","清單顏色","List color"},
        {"请先移除清单中的待办，再删除清单。","請先移除清單內的待辦，再刪除清單。","Remove this list's tasks before deleting the list."},
        {"添加日期","加入日期","Add date"}, {"待办名称","待辦名稱","Task title"},
        {"备注（可选）","備註（選填）","Notes (optional)"},
        {"逾时","逾時","Overdue"}, {"待办","待辦","To do"}, {"已完成","已完成","Completed"},
        {"暂无清单","暫無清單","No lists yet"}, {"暂无待办","暫無待辦","No tasks yet"},
        {"清单图标","清單圖示","List icon"},{"已完成 %u / %u","已完成 %u / %u","%u of %u completed"},
        {"最近：%s","最近：%s","Latest: %s"},
        {"删除此清单及其中的全部待办？","刪除此清單及其中的全部待辦？","Delete this list and all its tasks?"},
        {"关闭","關閉","Close"}, {"读取失败","讀取失敗","Couldn't load"}
    };
    static_assert(sizeof(values)/sizeof(values[0])==unsigned(Text::Count));
    const unsigned column=locale&&!std::strncmp(locale,"en",2)?2:locale&&!std::strcmp(locale,"zh-HK")?1:0;
    return values[unsigned(id)][column];
}
}
