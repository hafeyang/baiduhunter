/*
 * 用于抓取html页面中的JS代码
 * by ouzhencong(ClarenceAu@github) 2012-08-17
 */
(function() {
    var fs = require("fs"),
        data = { html: "", scripts: "" };

    function scratchJS(html) {
        var lines = html.split(/\n/gi), i, length, 
            find = false;
        for(i = 0, length = lines.length; i < length; i++) {
            if(!find) {
                data.scripts += "\n";
            }
            if(/^.*<script.*/.test(lines[i])) {
                if(!/<\/script>/.test(lines[i])) {
                    find = true;
                }
            } else if(find && /<\/script>/.test(lines[i])) {
                data.scripts += "\n";
                find = false;
            } else if(find) {
                data.scripts += lines[i] + "\n";
            }
        }
    }

    function scripts() {
        return data.scripts;
    }

    exports.scratchJS = scratchJS;
    exports.scripts = scripts;

})();
