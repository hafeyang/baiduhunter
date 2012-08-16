var fs =require("fs"),
    jshint  = require("./jshint").JSHINT;

fs.readFile("../tests/js2hint.js",function(err,data){
    if(err){
        console.log("error:"+err);
        return ;
    }        
    
    //hint
    var result =  jshint(data.toString(),{jquery:true},{xxx:true});

    if(result){
    	console.log("no error");
    }else{
	    var out = jshint.data(),
	        errors = out.errors;

	    for(var j=0;j<errors.length;j++) {
	        errors[j] && console.log(errors[j].line + ':' + errors[j].character + ' -> ' + errors[j].reason + ' -> ' + errors[j].evidence);
	    }
	}
});
