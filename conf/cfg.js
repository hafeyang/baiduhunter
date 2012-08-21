module.exports={
	"fileExt": [//需要检查的文件的后缀
        "\.html$",
        "\.js$"
    ],
    "ignoreFiles":[//忽略的文件，支持正则，如果文件的全路径中包含该正则，该文件不做检查
        "svn",
        "jquery",
        "fly",
        "ext",
        "tangram",
        "nuit",
        "backbone",
        "underscore",
        "json2",
        "highcharts",
        "highstock",
        "knockout",
        "raphael",
        "css",
        "WdatePicker",
        "My97DatePicker",
        "ZeroClipboard",
        "jqGrid",
        "\/data"
     ],
    "hint":{  //hint的配置项，详见http://www.jshint.com/docs/
    	asi         : true, // if automatic semicolon insertion should be tolerated
        bitwise     : true, // if bitwise operators should not be allowed
        boss        : false, // if advanced usage of assignments should be allowed
        browser     : true, // if the standard browser globals should be predefined
        camelcase   : false, // if identifiers should be required in camel case
        couch       : false, // if CouchDB globals should be predefined
        curly       : false, // if curly braces around all blocks should be required
        debug       : false, // if debugger statements should be allowed
        devel       : true, // if logging globals should be predefined (console,
                            // alert, etc.)
        dojo        : true, // if Dojo Toolkit globals should be predefined
        eqeqeq      : false, // if === should be required
        eqnull      : false, // if == null comparisons should be tolerated
        es5         : false, // if ES5 syntax should be allowed
        esnext      : false, // if es.next specific syntax should be allowed
        evil        : true, // if eval should be allowed
        expr        : true, // if ExpressionStatement should be allowed as Programs
        forin       : true, // if for in statements must filter
        funcscope   : true, // if only function scope should be used for scope tests
        globalstrict: true, // if global "use strict"; should be allowed (also
                            // enables 'strict')
        immed       : false, // if immediate invocations must be wrapped in parens
        indent      : false, // if indention must be checked
        iterator    : true, // if the `__iterator__` property should be allowed
        jquery      : true, // if jQuery globals should be predefined
        lastsemic   : true, // if semicolons may be ommitted for the trailing
                            // statements inside of a one-line blocks.
        latedef     : false, // if the use before definition should not be tolerated
        laxbreak    : true, // if line breaks should not be checked
        laxcomma    : true, // if line breaks should not be checked around commas
        loopfunc    : true, // if functions should be allowed to be defined within
                            // loops
        maxerr      : 50000,
        mootools    : true, // if MooTools globals should be predefined
        multistr    : true, // allow multiline strings
        newcap      : true, // if constructor names must be capitalized
        noarg       : false, // if arguments.caller and arguments.callee should be
                            // disallowed
        node        : true, // if the Node.js environment globals should be
                            // predefined
        noempty     : true, // if empty blocks should be disallowed
        nonew       : true, // if using `new` for side-effects should be disallowed
        nonstandard : true, // if non-standard (but widely adopted) globals should
                            // be predefined
        nomen       : false, // if names should be checked
        onevar      : true, // if only one var statement per function should be
                            // allowed
        onecase     : true, // if one case switch statements should be allowed
        passfail    : false, // if the scan should stop on first error
        plusplus    : false, // if increment/decrement should not be allowed
        proto       : true, // if the `__proto__` property should be allowed
        prototypejs : true, // if Prototype and Scriptaculous globals should be
                            // predefined
        regexdash   : true, // if unescaped first/last dash (-) inside brackets
                            // should be tolerated
        regexp      : true, // if the . should not be allowed in regexp literals
        rhino       : true, // if the Rhino environment globals should be predefined
        undef       : false, // if variables should be declared before used
        unused      : false, // if variables should be always used
        scripturl   : true, // if script-targeted URLs should be tolerated
        shadow      : true, // if variable shadowing should be tolerated
        smarttabs   : true, // if smarttabs should be tolerated
                            // (http://www.emacswiki.org/emacs/SmartTabs)
        strict      : false, // require the "use strict"; pragma
        sub         : true, // if all forms of subscript notation are tolerated
        supernew    : true, // if `new function () { ... };` and `new Object;`
                            // should be tolerated
        trailing    : false, // if trailing whitespace rules apply
        validthis   : true, // if 'this' inside a non-constructor function is valid.
                            // This is a function scoped option only.
        withstmt    : true, // if with statements should be allowed
        white       : false, // if strict whitespace rules apply
        worker      : true, // if Web Worker script symbols should be allowed
        wsh         : true  // if the Windows Scripting Host environment globals
                            // should be predefined
    },
    "global":{ //全局变量
    	"nuit":true,
    	"baidu":true,
    	"Ext":true,
    	"T":true,
    	"$":true,
    	"jQuery":true,
    	"Noah":true,
    	"noah":true,
    	"Backbone":true,
    	"WdatePicker":true,
    	"_":true
    },
    errordef:{ //定义错误级别，在生成报表前可以过滤，调整某些错误的级别,级别有error,warning,ignore
        "Unsafe character":"warining",
        "Mixed spaces and tabs":"ignore",
        "Too many var statements":"warning",
        "Insecure":"warning",
        "to compare with":"ignore",
        "Expected":" warning",
        "Unescaped":" warning",
        "Missing semicolon":"warning",
        "console":"error",
        "top.control":"warning",
        "timestamp missed":"warning",
        'Unexpected space':'ignore',
        'Missing space':'ignore'
    },
    minline: 10        // 定义最小的扫描行数，当文件的行数小于这个值时，不对文件进行检查，避免检查经过压缩的JS文件
};
