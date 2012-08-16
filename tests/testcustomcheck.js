var fs =require("fs")
    cc = require("../customcheck");

fs.readFile("../src/demo.html",function(err,data){
    if(err){
        console.log("error:"+err);
        return ;
    }        
    

    var result =  cc.check(data.toString(),true);

    if(result){
    	console.log("no error");
    }else{
	    var errors = cc.error();

	    for(var j=0;j<errors.length;j++) {
	        errors[j] && console.log(errors[j].line + ':' + errors[j].character + ' -> ' + errors[j].reason + ' -> ' + errors[j].evidence);
	    }
	}
});
