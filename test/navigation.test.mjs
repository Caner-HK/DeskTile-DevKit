import test from 'node:test';
import assert from 'node:assert/strict';
import {readingOrder, sidebarFor, pageNavigation, englishNavigation} from '../docs/.vuepress/navigation.mjs';
import fs from 'node:fs';

test('page sequence follows sidebar leaf order without duplicate chapter links', () => {
 const order = readingOrder(), links = pageNavigation();
 assert.equal(links.get('/guide/project.html').next.link, '/guide/lifecycle.html');
 assert.equal(links.get('/guide/lifecycle.html').prev.link, '/guide/project.html');
 assert.equal(links.get('/components/scroll-view.html').next.link, '/components/text.html');
 assert.equal(links.get('/').prev, false);
 assert.equal(links.get('/publish/').next, false);
 for (let i = 0; i < order.length; i++) {
  assert.deepEqual(links.get(order[i].link), {prev:order[i-1] || false,next:order[i+1] || false});
 }
 const walk = nodes => nodes.forEach(node => {
  if (node.children) {assert.equal(node.link, undefined);walk(node.children);}
 });
 walk(sidebarFor());
 assert.throws(() => readingOrder([{link:'/guide/project.md'},{link:'/guide/project.html'}]), /Duplicate/);
});

test('English pages mirror the complete Chinese reading order and stay in their locale', () => {
 const chinese = readingOrder(), english = readingOrder(englishNavigation);
 assert.equal(english.length, chinese.length);
 const adjacent = pageNavigation(englishNavigation);
 for (let i=0;i<chinese.length;i++) {
  assert.equal(english[i].link, '/en'+chinese[i].link);
  assert.deepEqual(adjacent.get(english[i].link), {prev:english[i-1]||false,next:english[i+1]||false});
  const relative=english[i].link==='/en/'?'en/README.md':english[i].link.endsWith('/')?english[i].link.slice(1)+'index.md':english[i].link.slice(1).replace(/\.html$/,'.md');
  assert.ok(fs.existsSync(new URL('../docs/'+relative,import.meta.url)),relative);
 }
 assert.equal(adjacent.get('/en/guide/project.html').next.link,'/en/guide/lifecycle.html');
});
