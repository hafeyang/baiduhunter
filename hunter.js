var fs = require("fs"),
    argument = require("./src/arguments"),
    filescaner = require("./src/filescaner"),
    hprocessor = require("./src/html-processor"),
    cchecker = require("./src/customcheck"),
    hchecker = require("./src/hintchecker"),
    global, i, length;

global = argument.parse(process.argv);
global.files = filescaner.scanFile(global.dirPath, global.conf.fileExt, global.conf.ignoreFiles);
// console.log(global);

for(i = 0, length = global.files.length; i < length; i++) {
    var file = global.files[i], 
        fileText = fs.readFileSync(file, "utf-8"),
        scripts, isHtml = false,
        errorObj = {
            fileName: file,
            errors: []
        };
    if(global.debug) {
        console.log("scanning " + file);
    }
    if(/\.html$/.test(file)) {
        if(hprocessor.scratchJS(fileText)) {
            scripts = hprocessor.scripts();
        }
        isHtml = true;
    } else {
        scripts = fileText;
    }
    // use jshint to scan javascirpt code
    hchecker.check(scripts, global.conf.hint, global.conf.global);            
    // use custom checker to scan all html and javascirpt code
    cchecker.check(fileText, isHtml);   
}
console.log("scaning complete");
