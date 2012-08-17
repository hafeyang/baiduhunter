/*
 * 扫描制定目录下的全部文件，并且根据条件过滤
 * 目前这个模块的解耦还做得不是很好，依赖与全局配置文件的配置
 * var scan = require("./src/filescaner");
 * files = scan.scanFile(dirToScan, fileExt, ignoreFileName);
 * @param {String} dirPath 
 * @param {Array} fileExt 需要检测的文件名后缀
 * @param {Array} ignoreFileName 需要过滤掉，不检测的文件名后缀
 * by ouzhencong(ClarenceAu@github) 2012-08-17
 */
(function() {
    var path = require("path"),
        fs = require("fs"),
        fileNameFilter, fileTypeFilter,
        files = [], totalFileCount = 0;
    
    var scanFile = function(dirPath, fileExt, ignoreFileName) {
        if(ignoreFileName && ignoreFileName instanceof Array) {
            fileNameFilter = new RegExp("(" + ignoreFileName.join("|") + ")");
        }
        if(fileExt && fileExt instanceof Array) {
            fileTypeFilter = new RegExp(fileExt.join("|"));
        }
        if(dirPath) {
            findAllFiles(dirPath);
        }
        console.log("扫描出文件总数：" + totalFileCount);
        console.log("符合条件文件总数：" + files.length);
        return files;
    };

    /*
     * recursive scan
     * use 'files' as the accumulator
     */
    function findAllFiles(dirToBegin) {
        var subFiles = fs.readdirSync(dirToBegin);
        subFiles.forEach(function(file, index, arr) {
            var wholePath = path.resolve(dirToBegin + "/" + file),
                stat = fs.lstatSync(wholePath);
            if(stat.isDirectory()) {
                findAllFiles(wholePath);
            } else {
                totalFileCount++;
                if(fileTypeFilter.test(wholePath) && !fileNameFilter.test(wholePath)) {
                    files.push(wholePath);
                }
            }
        });
    }

    exports.scanFile = scanFile;
})();
