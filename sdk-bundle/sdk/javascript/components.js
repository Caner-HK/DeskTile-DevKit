"use strict";
// Keep compilation peaks bounded on the 512 KiB application heap.
exports.createNavigation=function(){const ui=require('./navigation.js');return ui.createNavigation.apply(null,arguments);};
exports.scaffoldLayout=function(){const ui=require('./navigation.js');return ui.scaffoldLayout.apply(null,arguments);};
exports.createScaffold=function(){const ui=require('./scaffold.js');return ui.createScaffold.apply(null,arguments);};
exports.settingsPath=function(){const ui=require('./patterns.js');return ui.settingsPath.apply(null,arguments);};
exports.listRow=function(){const ui=require('./patterns.js');return ui.listRow.apply(null,arguments);};
exports.menu=function(){const ui=require('./patterns.js');return ui.menu.apply(null,arguments);};
exports.choicePolicy=function(){const ui=require('./patterns.js');return ui.choicePolicy.apply(null,arguments);};
exports.listNote=function(){const ui=require('./patterns.js');return ui.listNote.apply(null,arguments);};
exports.confirmation=function(){const ui=require('./patterns.js');return ui.confirmation.apply(null,arguments);};
exports.progress=function(){const ui=require('./patterns.js');return ui.progress.apply(null,arguments);};
exports.numberStepper=function(){const ui=require('./patterns.js');return ui.numberStepper.apply(null,arguments);};
