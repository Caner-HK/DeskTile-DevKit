'use strict';
const {selectCss}=require('./select-control');
const commonCss=`
*{box-sizing:border-box}
html body{margin:0;padding:0;color:var(--vscode-foreground,#ccc);background:var(--vscode-editor-background,#1f1f1f);font:13px var(--vscode-font-family,'Segoe UI',sans-serif);line-height:1.5}
body.vscode-dark,body.vscode-high-contrast{color-scheme:dark}
body.vscode-light,body.vscode-high-contrast-light{color-scheme:light}
button{height:26px;min-height:26px;padding:0 8px;border:1px solid var(--vscode-button-secondaryBorder,var(--vscode-button-border,transparent));border-radius:0;font-family:inherit;font-size:12px;font-weight:400;line-height:16px;cursor:pointer;color:var(--vscode-button-secondaryForeground,#ccc);background:var(--vscode-button-secondaryBackground,#313131);display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}
button:hover{background:var(--vscode-button-secondaryHoverBackground,#454545)}
button:disabled{opacity:.5;cursor:default}
button.primary{background:var(--vscode-button-background,#0078d4);color:var(--vscode-button-foreground,#fff);border-color:var(--vscode-button-border,transparent)}
button.primary:hover{background:var(--vscode-button-hoverBackground,#026ec1)}
input:not([type=checkbox]),select{height:26px;min-height:26px;box-sizing:border-box;padding:0 6px;border:1px solid var(--vscode-input-border,transparent);border-radius:0;font:inherit;background:var(--vscode-input-background,#313131);color:var(--vscode-input-foreground,#ccc)}
button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:1px solid var(--vscode-focusBorder,#0078d4);outline-offset:2px}
header{padding:20px 24px;border-bottom:1px solid var(--vscode-panel-border,#444);display:flex;align-items:center;gap:12px;flex-wrap:wrap}
h1{font-size:18px;line-height:1.4;font-weight:600;margin:0;flex:1}
button.tile{border-radius:0}
nav#slots{margin:0;padding:16px 0;border-radius:0;box-shadow:none;background:var(--vscode-sideBar-background,var(--vscode-editor-background,#1f1f1f))}
nav#slots button{box-sizing:border-box;display:block;width:100%;height:28px;min-height:28px;margin:0;padding:0 20px;border:0;border-radius:0;background:transparent;text-align:left;font-size:13px;line-height:28px}
nav#slots button:hover{background:var(--vscode-list-hoverBackground,#2a2d2e)}
nav#slots button[aria-pressed=true]{background:var(--vscode-list-activeSelectionBackground,#094771);color:var(--vscode-list-activeSelectionForeground,#fff)}
nav#slots button:focus-visible{outline-offset:-1px}${selectCss}
`;
module.exports={commonCss};
