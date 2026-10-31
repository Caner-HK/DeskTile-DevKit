'use strict';
const fs=require('node:fs'),path=require('node:path');
function folderError(parent,name){
 if(!name||!name.trim())return 'Enter a project folder name.';
 if(name!==name.trim()||/[<>:"/\\|?*\x00-\x1f]/.test(name)||/[. ]$/.test(name)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))return 'Use a valid folder name without path separators.';
 if(name.length>100)return 'Use a folder name of up to 100 characters.';
 if(fs.existsSync(path.join(parent,name)))return 'A file or folder with this name already exists. Choose a new name.';
 return undefined;
}
module.exports={folderError};
