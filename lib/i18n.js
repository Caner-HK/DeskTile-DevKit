'use strict';
const chinese=require('./locales/zh-cn.json');
let language='en';
function resolve(setting,host='en'){return (setting==='auto'?host:setting).toLowerCase().startsWith('zh')?'zh-cn':'en';}
function configure(setting='auto',host='en'){language=resolve(setting,host);return language;}
function t(message,...args){const text=language==='zh-cn'?(chinese[message]||message):message;return text.replace(/\{(\d+)\}/g,(_,i)=>String(args[Number(i)]??''));}
function getLanguage(){return language;}
module.exports={resolve,configure,t,getLanguage};
