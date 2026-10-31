#pragma once
namespace desktile::sdk {
struct ListDividerContext {
    bool last=false;
    int contentHeight=0,viewportHeight=0;
    bool atViewportEdge=false,hasFollowingContent=false,scrolling=false;
};
inline constexpr bool listDividerVisible(ListDividerContext value){
    return !value.last||value.hasFollowingContent||(!value.scrolling&&value.contentHeight<value.viewportHeight&&!value.atViewportEdge);
}
inline constexpr bool listDividerVisible(bool last,int contentHeight,int viewportHeight,bool atViewportEdge=false,bool hasFollowingContent=false){
    return listDividerVisible({last,contentHeight,viewportHeight,atViewportEdge,hasFollowingContent,false});
}
}
