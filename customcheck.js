/*
*	customcheck.js ：提供个性化检查
*	使用方法 
*		var check = require('./customcheck.js'),
			checkresult = check.check("jsSource",true/false),
			errors = check .error();

errors格式: [
 	{
     line      : The line (relative to 1) at which the lint was found
     character : The character (relative to 1) at which the lint was found
     reason    : The problem
     evidence  : The text line in which the problem occurred
     raw       : The raw message before the details were inserted
     a         : The first detail
     b         : The second detail
     c         : The third detail
     d         : The fourth detail
 },
 	....
]

*/
exports.check=function(source,isHTML){

	var me  =this,rows = source.split("\n"),
		inComment=false,
		addError = function(reason,line,character,evidence){
			me._errors.push({
				line:line,
				character:character,
				reason:reason,
				evidence:evidence,
				raw:evidence
			});
		};
	if(me._errors){
		while(me._errors.length) me._errors.pop();
	}else{
		me._errors=[];
	}
	for(var j=0,l=rows.length;j<l;j++){
		var row = rows[j].replace(/(^[\s]*)|([\s]*$)/g, ""),i=j+1;
		
		//check #1 zidonggengxin
        if( (/^.*\<script.+src\=.+$/i.test(row) || /^.*<link.+href\=.+$/i.test(row) ) && row.indexOf("v=zidonggengxin")==-1){
            addError("v=zidonggengxin丢失",i,0,row);
        }

        if(/^\/\*/.test(row) && /\*\/$/.test(row)){/* 这种情况*/ 
        	continue;
        }
        if(/^\/\//.test(row)){ // 单行注释 or 多行注释中 ，此行跳过
            continue;
        }
        if(/^\/\*/.test(row)){ //多行注释开始 
            inComment=true;
            continue;
        }

        

        if(inComment){
	        if(/\*\/$/.test(row)){ //多行注释结束
	            inComment=false;
	        }

        	if(inComment) continue;
        }
        //check #2 top.controll.
        if(row.indexOf("top.controll")!=-1){
            addError("调用废弃的top.controll",i,0,row);
        }
        //check #3  debugger
        if(row.indexOf("debugger")!=-1){
            addError("调试代码debugger",i,0,row);
        }
        //check #4  console
        if(row.indexOf("console.")!=-1){
            addError("调试代码console",i,0,row);
        }
        
	}
	return me._errors.length==0;
};


exports.error=function(){
	return this._errors;
};
