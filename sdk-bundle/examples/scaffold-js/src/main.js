"use strict";
var shell, words, large = false, section = 0;
var language = DeskTile.createI18n();
function chooseLanguage() {
  words = ["title","reading","settings","heading","body","largeText","saveError","readError"].map(function(key) { return language.t(key); });
}
function text(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function status(message) { DeskTile.setText(DeskTile.byId("preference-status"), 0, message || ""); }
function showSection(index) {
  section = index;
  DeskTile.setBoolean(DeskTile.byId("reading"), 4, index === 0);
  DeskTile.setBoolean(DeskTile.byId("preferences"), 4, index === 1);
}
function mount() {
  var ui = DeskTile.require("ui/components.js");
  shell = ui.createScaffold({id:"main",title:words[0],items:[{label:words[1],icon:43},{label:words[2],icon:3}],bottomCount:1});
  var body = '<dt-scroll id="reading"><dt-column padding="24" gap="24"><dt-text text="'+text(words[3])+'" font-size="32" text-wrap="true"/><dt-text id="article" text="'+text(words[4])+'" font-size="'+(large?32:20)+'" text-wrap="true"/></dt-column></dt-scroll>' +
    '<dt-column id="preferences" visible="false" gap="16"><dt-list>'+ui.listRow({id:"large-row",label:words[5],toggle:{id:"large",checked:large}})+'</dt-list><dt-text id="preference-status" text="" font-size="20" text-wrap="true" margin="0,24,0,24" foreground-role="3"/></dt-column>';
  var result = shell.mount(DeskTile, body);
  if (result !== 0) throw Error("Unable to create reading surface: "+result);
  shell.select(section); showSection(section);
}
function enter() {
  chooseLanguage();
  var saved = DeskTile.storageReadResult("large-text");
  if (saved.result === 0 && saved.data && saved.data.byteLength === 1) large = new Uint8Array(saved.data)[0] === 1;
  mount();
  if (saved.result !== 0 && saved.result !== -8) status(words[7]);
}
function handle(action) {
  if (action.result !== 0) throw Error("Unable to update reading surface: "+action.result);
  if (action.action === "original") DeskTile.requestExit();
  else if (action.action === "selected") showSection(action.index);
  return action.consumed;
}
function onPointer(kind, event) { if (shell) handle(shell.pointer(kind, event)); }
function onEvent(kind, target, value) {
  if (!shell || handle(shell.event(kind, target))) return;
  if ((kind === 1 && target === DeskTile.byId("large")) || (kind === 0 && target === DeskTile.byId("large-row"))) {
    var next = kind === 0 ? !large : value !== 0, bytes = new Uint8Array([next?1:0]);
    if (DeskTile.storageWrite("large-text", bytes.buffer) === 0) { large = next; status(""); }
    else status(words[6]);
    DeskTile.setBoolean(DeskTile.byId("large"), 6, large);
    DeskTile.setNumber(DeskTile.byId("article"), 13, large?32:20);
  }
}
function update(now) { if (shell) handle(shell.tick(now)); }
function themeChanged() { if (shell) shell.refresh(); }
function onLanguageChanged() { chooseLanguage(); if (shell) shell.destroy(); mount(); }
function onExit() { DeskTile.exit(); }
function leave() { if (shell) { shell.destroy(); shell = null; } }
