var fs = require("fs"),
    argument = require("./src/arguments"),
    filescaner = require("./src/filescaner"),
    hprocessor = require("./src/html-processor"),
    cchecker = require("./src/customcheck"),
    hchecker = require("./src/hintchecker"),
    stats = require("./src/stats"),
    report = require("./src/report"),
    global, allErrors = []; 

(function() {
    var i, length;
    global = argument.parse(process.argv);
    global.files = filescaner.scanFile(global.dirPath, global.conf.fileExt, global.conf.ignoreFiles);

    for(i = 0, length = global.files.length; i < length; i++) {
        var file = global.files[i], 
            errors = checkFile(file);
        obj = stats.statistics(file, errors, global.conf.errordef);
        allErrors.push(obj);
    }

    function checkFile(fileName) {
        var errors = [], fileText = fs.readFileSync(fileName, "utf-8"),
            scripts, isHtml = false;
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
        if(!hchecker.check(fileName, scripts, global.conf.hint, global.conf.global, global.conf.minline)) {
            errors = errors.concat(hchecker.errors());
        }
        // use custom checker to scan all html and javascirpt code
        if(!cchecker.check(fileText, isHtml)) {
            errors = errors.concat(cchecker.error());
        }
        return errors;
    };

})();
console.log("scaning complete");

report.generate(global.dirPath.substring(global.dirPath.lastIndexOf("/") + 1), global.version, allErrors);

