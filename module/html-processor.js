var fs = require("fs");
function processHTML(fileName) {
    var script = "", html, matches,
        ltBegin = 0, gtBegin = 0,
        endScriptTag = 0;
    if(fileName.indexOf(".html") === -1 || fileName.indexOf(".htm") === -1) {
        return script;
    }
    html = fs.readFileSync(fileName, "utf-8");
    ltBegin = html.indexOf("<script", ltBegin);
    while(ltBegin !== -1) {
        gtBegin = html.indexOf(">", ltBegin);
        endScriptTag = html.indexOf("</script>", gtBegin);
        script += html.substring(gtBegin + 1, endScriptTag).trim();
        ltBegin = html.indexOf("<script", ltBegin + 1);
    }
    return script;
}
