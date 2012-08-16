/*
 * 处理用户命令行调用的模块
 * 调用方式：
 * var argu = require(".module/arguments.js");
 * var configObj = argu.parse(process.argv);
 *
 */
(function() {

    var commander = require("../lib/commander"),
        path = require("path"),
        DEFAULT_CONFIG_PATH = "../conf/cfg.js",
        DEFAULT_SOURCE_PATH = "./src/";
    
    commander
        .version("0.1")
        .option("-c --config <string>", "Configuration file")
        .option("-s --source <string>", "Source to be check, file or dir")
        .option("-d", "switch of debug flag");
        
    
    var parse = function(commandArgu) {
        var configPath = DEFAULT_CONFIG_PATH;
        commander.parse(commandArgu);
        if(commander.config) {
            if(/\.js$/i.test(commander.config)) {
                configPath = commander.config;
            } else {
                console.log("你输入的配置文件路径不正确");
                process.exit(1);
            }
        }
        
        console.log(commandArgu);
    };

    exports.parse = parse;

})();
