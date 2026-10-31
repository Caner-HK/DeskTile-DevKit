import {readFileSync} from 'node:fs';

export const navigation = JSON.parse(readFileSync(new URL('../navigation.json', import.meta.url), 'utf8'));
export const englishNavigation = JSON.parse(readFileSync(new URL('../navigation.en.json', import.meta.url), 'utf8'));
export function routeFor(link) {
  return link.replace(/(?:README|index)\.md$/, '').replace(/\.md$/, '.html');
}
export function readingOrder(nodes = navigation) {
  const pages = [];
  const visit = entries => entries.forEach(node => {
    if (node.children) visit(node.children);
    else if (node.link) pages.push({text: node.text, link: routeFor(node.link)});
  });
  visit(nodes);
  const seen = new Set();
  for (const page of pages) {
    if (seen.has(page.link)) throw Error(`Duplicate documentation page: ${page.link}`);
    seen.add(page.link);
  }
  return pages;
}
export function sidebarFor(nodes = navigation) {
  return nodes.map(node => node.children
    ? {text: node.text, children: sidebarFor(node.children)}
    : {...node, link: routeFor(node.link)});
}
export function pageNavigation(nodes = navigation) {
  const pages = readingOrder(nodes);
  return new Map(pages.map((page, i) => [page.link, {
    prev: pages[i - 1] || false,
    next: pages[i + 1] || false,
  }]));
}
