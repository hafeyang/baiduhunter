/*
 *
 * by ouzhencong(ClarenceAu@github) 2012-08-17
 */
(function() {

    function statistics(fileName, errors, errordef) {
        var statObj, i, length, error;
        statObj = {
            fileName: fileName,
            stats: {
                error: 0,
                warning: 0,
                ignore: 0,
                total: 0
            },
            errors: errors
        };
    
        for(i = 0, length = errors.length; i < length; i++) {
            error = errors[i];
            if(!!error) {
                error.level = "error";
                for(key in errordef) {
                    if(error.raw && error.raw.indexOf(key) > -1) {
                        error.level = errordef[key];
                        break;
                    }
                }
                statObj.stats[error.level]++;
            }
        }

        statObj.stats.total = statObj.stats.error + statObj.stats.warning + statObj.stats.ignore;

        return statObj;
    }

    exports.statistics = statistics;

})();
