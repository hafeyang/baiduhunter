/*
 *
 * by ouzhencong(ClarenceAu@github) 2012-08-17
 *
 */
(function() {
    var hint = require("../lib/jshint").JSHINT,
        data = { errors: [] };

    function check(scripts, options, global, minline) {
        var lineNum = scripts.match(/\n/gi),
            result = true;
        if(minline && lineNum < minline) {
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
