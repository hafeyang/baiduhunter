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
        .version("0.0.1")
        .option("-c --config <string>", "Configuration file")
        .option("-s --src <string>", "Source to be check, file or dir")
        
    
    var parse = function(commandArgu) {
        commander.parse(commandArgu);
        if(commander.config) {

        }
        
        console.log(commandArgu);
    };

    exports.parse = parse;

})();
