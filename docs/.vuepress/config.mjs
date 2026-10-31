import {defineUserConfig} from 'vuepress';
import {viteBundler} from '@vuepress/bundler-vite';
import {defaultTheme} from '@vuepress/theme-default';
import {searchPlugin} from '@vuepress/plugin-search';
import {sidebarFor, pageNavigation, englishNavigation} from './navigation.mjs';
const adjacentPages = new Map([...pageNavigation(),...pageNavigation(englishNavigation)]);
const base = process.env.DESKTILE_DOCS_BASE || '/';
export default defineUserConfig({
 base,
 lang:'zh-CN',title:'DeskTile DevKit',description:'使用 SDK 1.0 创建、构建与安装 DeskTile 应用',
 locales:{'/':{lang:'zh-CN',title:'DeskTile DevKit',description:'使用 SDK 1.0 创建、构建与安装 DeskTile 应用'},'/en/':{lang:'en-US',title:'DeskTile DevKit',description:'Create, build and install DeskTile applications with SDK 1.0'}},
 bundler:viteBundler(),
 head:[['link',{rel:'icon',type:'image/png',href:base+'favicon.png'}]],
 plugins:[searchPlugin({maxSuggestions:10,locales:{'/':{placeholder:'搜索文档'},'/en/':{placeholder:'Search documentation'}}}), {
  name:'desktile-document-order',
  extendsMarkdown(md) {
   if (base === '/') return;
   // Generated SDK download links and breadcrumbs also need the project base.
   for (const rule of ['link_open']) {
    const original = md.renderer.rules[rule];
    md.renderer.rules[rule] = (...args) => {
     const html = original ? original(...args) : md.renderer.renderToken(...args);
     return html.replace(/(href|src)="(\/[^\"]*)"/g, (match, attribute, url) =>
      url.startsWith('//') || url.startsWith(base) ? match : `${attribute}="${base}${url.slice(1)}"`);
    };
   }
  },
  extendsPage(page) {
   const adjacent = adjacentPages.get(page.path);
   if (adjacent) Object.assign(page.frontmatter, adjacent);
   else if (page.filePathRelative) throw Error(`Page missing from documentation order: ${page.path}`);
  }
 }],
 theme:defaultTheme({
  contributors:false,lastUpdated:false,editLink:false,
  logo:'/logo.svg',logoDark:'/logo-dark.svg',
  sidebarDepth:0,
  locales:{
   '/':{selectLanguageName:'简体中文',selectLanguageText:'语言',prev:'上一页',next:'下一页',sidebar:sidebarFor(),navbar:[{text:'开始',link:'/start/install.html'},{text:'开发指南',link:'/guide/project.html'},{text:'设计与组件',link:'/design/'},{text:'API',link:'/api/'},{text:'开发工具',link:'/tools/'},{text:'发布',link:'/publish/'}]},
   '/en/':{selectLanguageName:'English',selectLanguageText:'Language',prev:'Previous',next:'Next',sidebar:sidebarFor(englishNavigation),navbar:[{text:'Start',link:'/en/start/install.html'},{text:'Guides',link:'/en/guide/project.html'},{text:'Design and components',link:'/en/design/'},{text:'API',link:'/en/api/'},{text:'Tools',link:'/en/tools/'},{text:'Publish',link:'/en/publish/'}]}
  }
 }),
 markdown:{headers:{level:[2,3]},toc:{level:[2]}}
});
