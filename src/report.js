/*
 *
 * report.report(data)
 * @param {object} data 
 *  {
 *      title: {string},
 *      version: {string},
 *      errors: {Array}
 *  }
 * by ouzhencong(ClarenceAu@github) 2012-08-17
 */
(function() {
    var fs = require("fs"),
        path = require("path"),
        _ = require("../lib/underscore"),
        moduleFileName = module.filename,
        DEFAULT_TPL_LOCATION = moduleFileName.substring(0, moduleFileName.indexOf("src")) + "conf/report.template";

    function generate(fileName, version, allErrors) {
        var template = _.template(fs.readFileSync(DEFAULT_TPL_LOCATION, "utf-8")),
            reportName = fileName + "-" + version,
            tplObject = {
                reportName: reportName,
                total: 0,
                error: 0,
                ignored: 0,
                warning: 0,
                time: new Date().toLocaleString()
            },
            currentPath = path.resolve("./");
        if(allErrors) {
            for(var i = 0, length = allErrors.length; i < length; i++) {
                tplObject.error += allErrors[i].stats.error;
                tplObject.warning += allErrors[i].stats.warning;
                tplObject.ignored += allErrors[i].stats.ignore;
                tplObject.total += allErrors[i].stats.total;
            }
        }
        tplObject.files = allErrors;

        fs.writeFileSync(reportName + ".html", template(tplObject), "utf-8");
        console.log("report generated: " + path.resolve(reportName + ".html"));
    }

    exports.generate = generate;
})();
