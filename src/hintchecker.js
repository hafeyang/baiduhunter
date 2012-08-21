/*
 *
 * by ouzhencong(ClarenceAu@github) 2012-08-17
 *
 */
(function() {
    var hint = require("../lib/jshint").JSHINT,
        data = { errors: [] };

    function check(filename, scripts, options, global, minline) {
        var lineNum = scripts && scripts.match(/\n/gi),
            result = true;
        if((minline && lineNum && lineNum < minline) || !scripts) {
            console.log("skip file " + filename);
            return true;
        }
        
        result = hint(scripts, options, global);
        if(!result) {
            data.errors = hint.data().errors;
        }

        return result;
    }

    function errors() {
        return data.errors;
    }

    exports.errors = errors;
    exports.check = check;
})();
