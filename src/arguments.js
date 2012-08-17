/*
 * 处理用户命令行调用的模块
 * 调用方式：
 * var argu = require(".module/arguments.js");
 * var configObj = argu.parse(process.argv);
 *
 */
(function() {

    var commander = require("../lib/commander"),
        fs = require("fs"),
        path = require("path"),
        DEFAULT_CONFIG_PATH = "../conf/cfg.js",
        DEFAULT_SOURCE_PATH = "./src/";

    var global = {
        debug: false,
        conf: undefined
    };
    
    commander
        .version("0.1")
        .usage('[options] <dirToCheck>')
        .option("-c --config <string>", "Configuration file")
        .option("-d --debug", "switch of debug flag");
        
    
    var parse = function(commandArgu) {
        var configPath = DEFAULT_CONFIG_PATH,
            dirToCheck, argLength = commandArgu.length;
        commander.parse(commandArgu);
        if(argLength === 2) {
            console.error("Usage: node hunter.js dirToCheck");
            process.exit(1);
        }
        if(commander.config) {
            if(/\.js$/i.test(commander.config)) {
                configPath = commander.config;
                // path.exists 与path.existsSync 方法在0.8版本中被移到了fs.exists fs.existsSync中
                if(!path.existsSync(configPath)) {
                    console.error("配置文件不存在");
                }
            } else {
                console.error("你输入的配置文件路径不正确");
                process.exit(1);
            }
        }
        if(commander.debug) {
            global = true;
        }
        dirToCheck = commandArgu[argLength - 1]; 
        stat = fs.lstatSync(dirToCheck);
        if(!stat.isDirectory()) {
            console.error("检查的路径需要为文件夹路径");
            process.exit(1);
        }
    };

    exports.parse = parse;

})();
