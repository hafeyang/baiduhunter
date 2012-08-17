var argument = require("./src/arguments"),
    filescaner = require("./src/filescaner"),
    global;

global = argument.parse(process.argv);
global.files = filescaner.scanFile(global.dirPath, global.conf.fileExt, global.conf.ignoreFiles);
// console.log(global);
