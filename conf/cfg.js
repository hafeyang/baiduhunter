module.exports={
	"fileExt": [//需要检查的文件的后缀
        ".html",
        ".js"
    ],
    "ignoreFiles":[//忽略的文件，支持正则
        ".svn",
    	"jquery",
        "json2",
        "tangram",
        "backbone",
        "underscore",
    	"nuit"
    ],
    "hint":{  //hint的配置项，详见http://www.jshint.com/docs/
    	asi         : true, // if automatic semicolon insertion should be tolerated
        bitwise     : true, // if bitwise operators should not be allowed
        boss        : true, // if advanced usage of assignments should be allowed
        browser     : true, // if the standard browser globals should be predefined
        camelcase   : true, // if identifiers should be required in camel case
        couch       : true, // if CouchDB globals should be predefined
        curly       : true, // if curly braces around all blocks should be required
        debug       : true, // if debugger statements should be allowed
        devel       : true, // if logging globals should be predefined (console,
                            // alert, etc.)
        dojo        : true, // if Dojo Toolkit globals should be predefined
        eqeqeq      : true, // if === should be required
        eqnull      : true, // if == null comparisons should be tolerated
        es5         : true, // if ES5 syntax should be allowed
        esnext      : true, // if es.next specific syntax should be allowed
        evil        : true, // if eval should be allowed
        expr        : true, // if ExpressionStatement should be allowed as Programs
        forin       : true, // if for in statements must filter
        funcscope   : true, // if only function scope should be used for scope tests
        globalstrict: true, // if global "use strict"; should be allowed (also
                            // enables 'strict')
        immed       : true, // if immediate invocations must be wrapped in parens
        iterator    : true, // if the `__iterator__` property should be allowed
        jquery      : true, // if jQuery globals should be predefined
        lastsemic   : true, // if semicolons may be ommitted for the trailing
                            // statements inside of a one-line blocks.
        latedef     : true, // if the use before definition should not be tolerated
        laxbreak    : true, // if line breaks should not be checked
        laxcomma    : true, // if line breaks should not be checked around commas
        loopfunc    : true, // if functions should be allowed to be defined within
                            // loops
        mootools    : true, // if MooTools globals should be predefined
        multistr    : true, // allow multiline strings
        newcap      : true, // if constructor names must be capitalized
        noarg       : true, // if arguments.caller and arguments.callee should be
                            // disallowed
        node        : true, // if the Node.js environment globals should be
                            // predefined
        noempty     : true, // if empty blocks should be disallowed
        nonew       : true, // if using `new` for side-effects should be disallowed
        nonstandard : true, // if non-standard (but widely adopted) globals should
                            // be predefined
        nomen       : true, // if names should be checked
        onevar      : true, // if only one var statement per function should be
                            // allowed
        onecase     : true, // if one case switch statements should be allowed
        passfail    : true, // if the scan should stop on first error
        plusplus    : true, // if increment/decrement should not be allowed
        proto       : true, // if the `__proto__` property should be allowed
        prototypejs : true, // if Prototype and Scriptaculous globals should be
                            // predefined
        regexdash   : true, // if unescaped first/last dash (-) inside brackets
                            // should be tolerated
        regexp      : true, // if the . should not be allowed in regexp literals
        rhino       : true, // if the Rhino environment globals should be predefined
        undef       : true, // if variables should be declared before used
        unused      : true, // if variables should be always used
        scripturl   : true, // if script-targeted URLs should be tolerated
        shadow      : true, // if variable shadowing should be tolerated
        smarttabs   : true, // if smarttabs should be tolerated
                            // (http://www.emacswiki.org/emacs/SmartTabs)
        strict      : true, // require the "use strict"; pragma
        sub         : true, // if all forms of subscript notation are tolerated
        supernew    : true, // if `new function () { ... };` and `new Object;`
                            // should be tolerated
        trailing    : true, // if trailing whitespace rules apply
        validthis   : true, // if 'this' inside a non-constructor function is valid.
                            // This is a function scoped option only.
        withstmt    : true, // if with statements should be allowed
        white       : true, // if strict whitespace rules apply
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
    }
};
