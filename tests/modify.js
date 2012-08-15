function selectNodes(target){
    var st =new nuit.ServiceTree({
        iconsPath:"/datadist/static/lib/nuit/images/",
        treeOptions:{checkbox:true,checkMode:2},//checkMode:3 级联选择
        loadNodesUrl:"/noah/index.php?r=ServiceTree/LoadChildNode", //只允许访问有权限的节点
        dialogOptions:{titleText:"请选择节点/分组/机器"},
        onbeforerequest:function(e,data){ /* 增加机器分组的需求 */
            if(data.node && (data.node.iconCls=="icon-su" || data.node.iconCls=="icon-machinegroup")) {
                data.url="/datadist/dist/getServiceGroup/?type="+(data.node.iconCls=="icon-su"?"group":"host")+"&id="+(data.node.dataId);
            }
        },
        parseData:function(requestData,eventData){   /*  增加机器分组的需求*/
            var me=this,treedata = [],isSearch=eventData.data.indexOf("token=")!=-1;
            if(!isSearch){
                baidu.array.each(requestData,function(row){
                    if(eventData.node && (eventData.node.iconCls=="icon-su" || eventData.node.iconCls=="icon-machinegroup") ){
                        var nodeid = row.id+"-"+parseInt(Math.random()*10000);
                        baidu.object.extend(row,{
                            icon:me.iconsPath+(eventData.node.iconCls=="icon-su"?"machine-group.gif":"machine.gif"),
                            type:eventData.node.iconCls=="icon-machinegroup"?"leaf":"trunk",
                            children:row.iconCls=="icon-machinegroup"?[]:[{id:"loading-"+nodeid,"text":"正在加载...",icon:me.iconsPath+"spinner.gif"}],
                            title:row.name,
                            text:row.name,
                            id:nodeid,
                            dataId:row.id,
                            iconCls:eventData.node.iconCls=="icon-su"?"icon-machinegroup":"icon-machine",//标记
                            leaf:(eventData.node.iconCls=="icon-machinegroup")
                        });
                        treedata.push(row);
                    }else{ row.icon=me.iconsPath+(row.type=="su"?"su.gif":"service.gif"); row.type="trunk"; row.dataId=row.id;
                        row.id= row.id+"-"+parseInt(Math.random()*1000),
                        row.children=[{id:"loading-"+row.id,"text":"正在加载...",icon:me.iconsPath+"spinner.gif"}]
                        treedata.push(row);
                    }
                });
            }else{
                var realNodes=[],machines={},travel=function(node){
                    if(node.leaf){
                        if(!machines[node.text]){
                            realNodes.push(baidu.object.extend(node,{
                                icon:me.iconsPath+"machine.png",
                                type:"leaf"
                            }));
                            machines[node.text]=true;
                        }
                    }
                    if(node.children && node.children.length>0){
                        for(var i = 0,l=node.children.length;i<l;i++){
                            travel(node.children[i]);
                        }
                    }
                };
                treedata= {id:"root",icon:me.iconsPath+"service.gif",text:"搜索结果",children:realNodes};
                for(var i=0,l= requestData.length;i<l;i++){
                    travel(requestData[i]);
                }

            }
            return treedata;
        },

        onok:function(e,data){
            var tree= e.target.getTree(),checked=tree.getCheckedNodes(false),curNode=tree.getCurrentNode();//false:不包括半选节点
            if(checked.length==0){
                alert("请选择节点/机器");
                return false;
            }
            //是否进行小流量分发校验 - 验证机器
            // if(target.id == "machinelist" || target.id == "machinelist_1"){
	            // var validMachine=0;
	            // baidu.array.each(checked,function(o){
		            // if(o.iconCls != "icon-service"){
		            		// validMachine++;
		            // }
	            // });
		            // if(validMachine===0){
		                // alert("只能选择机器和节点");
		                // return ;
		            // }
            // }
            //正常状态
            baidu.array.each(checked,function(node){
					if(node.text!="搜索结果"){
						var nodeid=node.id,isMachine = (node.type=="leaf"),nodetype=isMachine?"1":(node.iconCls=="icon-machinegroup"?"2":"0"),nodetypenames={"0":"(节点)","1":"(机器)","2":"(分组)"},
		                    optionValue =((isMachine?node.text:node.path.replace(/_/gi,"/"))+"|"+nodetype),
		                    optionText = ((isMachine?node.text:node.path.replace(/_/gi,"/"))+nodetypenames[nodetype]),
		                    exist= false,//是否已经存在
		                    existOptions = baidu.dom.query("option",target);
		                baidu.array.each(existOptions,function(o){
		                    if(o.value== optionValue){
		                        exist = true;
		                        return false;
		                    }
		                });
		                if(!exist){
		                		if(target.id == "machinelist" || target.id == "machinelist_1"){
		                			var newOption = new Option(optionText,optionValue);
		                			if(optionValue.indexOf("|1") != -1 || optionValue.indexOf("|0") != -1){
		                				target.options.add(newOption); 
		                			}
		                		}else{
		                			var newOption = new Option(optionText,optionValue);
		                   		target.options.add(newOption); 
		                		}
		                    
		                }	
					}
            });
            st.close();
        }
    });
    st.open();
}
//是否进行小流量分发校验 - 验证机器
function smallSelectNodes(target){
        var st =new nuit.ServiceTree({
        iconsPath:"/datadist/static/lib/nuit/images/",
        treeOptions:{checkbox:true,checkMode:2},//checkMode:3 级联选择
        loadNodesUrl:"/noah/index.php?r=ServiceTree/LoadChildNode", //只允许访问有权限的节点
        onbeforerequest:function(e,data){ /* ServiceTree/LoadChildNode 只加载节点，不加载机器 */
			if(data.node && data.node.iconCls=="icon-su" ){
				data.url="/noah/index.php?r=selectMachine/loadTree&objectType=host";
			}
		},
        dialogOptions:{titleText:"请选择节点/分组/机器"},
       	parseData:function(requestData,eventData){
			var me=this,treedata = [],isSearch=eventData.data.indexOf("token=")!=-1;
			if(!isSearch){
				baidu.array.each(requestData,function(row){
					if(row.iconCls=='icon-machine'){//机器
						row.type="leaf";
						row.icon=me.iconsPath+"machine.png";
						treedata.push(row);
					}
					if(row.iconCls=="icon-service" || row.iconCls=="icon-su"){
						row.icon=me.iconsPath+(row.type=="su"?"su.gif":"service.gif");
						row.type="trunk";
						row.children=[{id:"loading-"+row.id,"text":"正在加载...",icon:me.iconsPath+"spinner.gif"}]
						treedata.push(row);
					}
				});
				}else{
					var realNodes=[],machines={},travel=function(node){
						if(node.leaf){
							if(!machines[node.text]){
								realNodes.push(baidu.object.extend(node,{
									icon:me.iconsPath+"machine.png",
									type:"leaf"
								}));
								machines[node.text]=true;
							}
						}
						if(node.children && node.children.length>0){
							for(var i = 0,l=node.children.length;i<l;i++){
								travel(node.children[i]);
							}
						}
					};
					treedata= {id:"root",icon:me.iconsPath+"service.gif",text:"搜索结果",children:realNodes};
					for(var i=0,l= requestData.length;i<l;i++){
						travel(requestData[i]);
					}
				}
				return treedata;
			},

        onok:function(e,data){
            var tree= e.target.getTree(),checked=tree.getCheckedNodes(false),curNode=tree.getCurrentNode();//false:不包括半选节点
            if(checked.length==0){
                alert("请选择节点/机器");
                return false;
            }
            //是否进行小流量分发校验 - 验证机器
            baidu.array.each(checked,function(node){
					if(node.text!="搜索结果"){
						var nodeid=node.id,isMachine = (node.type=="leaf"),nodetype=isMachine?"1":(node.iconCls=="icon-machinegroup"?"2":"0"),nodetypenames={"0":"(节点)","1":"(机器)","2":"(分组)"},
		                    optionValue =((isMachine?node.text:node.path.replace(/_/gi,"/"))+"|"+nodetype),
		                    optionText = ((isMachine?node.text:node.path.replace(/_/gi,"/"))+nodetypenames[nodetype]),
		                    exist= false,//是否已经存在
		                    existOptions = baidu.dom.query("option",target);
		                baidu.array.each(existOptions,function(o){
		                    if(o.value== optionValue){
		                        exist = true;
		                        return false;
		                    }
		                });
		                if(!exist){
		                		if(target.id == "machinelist" || target.id == "machinelist_1"){
		                			var newOption = new Option(optionText,optionValue);
		                			if(optionValue.indexOf("|1") != -1 || optionValue.indexOf("|0") != -1){
		                				target.options.add(newOption); 
		                			}
		                		}
		                    
		                }	
					}
            });
            st.close();
        }
    });
        st.open();
}
function machineProcess(type,n,host){
    currentElement = document.getElementsByName( n )[0];
	switch(type){
		case "add":
			//dig.show();
            selectNodes(currentElement);
			break;
		case "smallAdd":
	        smallSelectNodes(currentElement);
			break;
		case "remove":
			baidu.array.each(baidu.dom.query(" option:selected",currentElement),function(v,k){
				baidu.dom.remove( v );
			});
			break;
		default:
		break;
	}
	
	
	
}	
	
function siteTabs(index){
	var i = 1, len = 6;
	for(; i <= len; i++){
		baidu.dom.hide( "tangram-tabs-c" + i );
		baidu.dom.removeClass( "tangram-tabs-b"+i,"current" );
	}
	baidu.dom.show( "tangram-tabs-c" + index );
	baidu.dom.addClass( "tangram-tabs-b"+index,"current" );
}


/*获取配送目标模板*/
var distDestStartIndex = 10000;
function getdistDestElement(id){
    var _tpl="",_t;
    id=id||"0";
    _tpl = baidu.G( 'distDestItem_'+id ).innerHTML;
    _tpl = "<div id='distDestItem_99999'>" + _tpl + "</div>";
	_tpl = _tpl.replace(/distDestItem_\d+/g,"distDestItem_"+distDestStartIndex);
	_tpl = _tpl.replace(/dist_dest_str\[\d+\]/g,"dist_dest_str["+distDestStartIndex+"]");
	_tpl = _tpl.replace(/dist_group\[\d+\]/g,"dist_group["+distDestStartIndex+"]");	
	_tpl = _tpl.replace(/dist_dest_node\[\d+\]/g,"dist_dest_node["+distDestStartIndex+"]");
	_tpl = _tpl.replace(/distDestProcess\('add','\d+'\)/g,"distDestProcess('add','"+distDestStartIndex+"')");
	_tpl = _tpl.replace(/distDestProcess\('remove','\d+'\)/g,"distDestProcess('remove','"+distDestStartIndex+"')");
    
    //组内失败机器数阈值 类型/百分比
	_tpl = _tpl.replace(/radio_max_failure_machine_\d+/g,"radio_max_failure_machine_"+distDestStartIndex);
	_tpl = _tpl.replace(/radio_max_failure_machine_percent_\d+/g,"radio_max_failure_machine_percent_"+distDestStartIndex);
	_tpl = _tpl.replace(/radio_group_max_failure_machine_\d+/g,"radio_group_max_failure_machine_"+distDestStartIndex);
	_t = document.createElement( "div" );
	_t.innerHTML = _tpl;
	distDestStartIndex++;
	return baidu.dom.first( _t );
}

function distDestUpdateCount(){
	var item = baidu.dom.query( ".dist_count" );
	baidu.array.each(item,function(v,k){
		v.innerHTML = k+1;
	});
}
distDestUpdateCount();
function distDestProcess(type,id){
	switch(type){
		case 'remove':
			if(window.confirm("确定删除")){
				baidu.dom.remove( "distDestItem_" + id );
				distDestUpdateCount();
			}
			break;
		case 'add':
            var destElement = getdistDestElement(id);
			baidu.dom.insertAfter( destElement, baidu.G("distDestItem_" + id));
            try{ baidu.event.fire(baidu.dom.query(":radio:checked",destElement)[0],"click");} catch(e){}
			distDestUpdateCount();
			break;
		default:
			break;
	
	}
}

/*
 *后置命令
 */
var distHookStartIndex = 10000,distHookHTML = "";
(function(){
	distHookHTML = baidu.G( 'distHookItem_0' ).innerHTML;
	distHookHTML = "<div id='distHookItem_99999'>" + distHookHTML + "</div>";
})();
function getdistHookElement(){
	var _tpl,_t;
	_tpl = distHookHTML;
	_tpl = _tpl.replace(/distHookItem_\d+/g,"distHookItem_"+distHookStartIndex);
	_tpl = _tpl.replace(/dist_hook\[\d+\]/g,"dist_hook["+distHookStartIndex+"]");
	_tpl = _tpl.replace(/distHookProcess\('add','\d+'\)/g,"distHookProcess('add','"+distHookStartIndex+"')");
	_tpl = _tpl.replace(/distHookProcess\('remove','\d+'\)/g,"distHookProcess('remove','"+distHookStartIndex+"')");
	//
	_t = document.createElement( "div" );
	
	_t.innerHTML = _tpl;
	
	distHookStartIndex++;
	
	return baidu.dom.first( _t );
}

function distHookUpdateCount(){
	var item = baidu.dom.query( "#tangram-tabs-c4 .hook_count" );
	baidu.array.each(item,function(v,k){
		v.innerHTML = k+1;
	});
	item = baidu.dom.query( "#tangram-tabs-c4 .hook_num" );
	baidu.array.each(item,function(v,k){
		v.value = k+1;
	});
}
distHookUpdateCount();

function distHookProcess(type,id){
	switch(type){
		case 'remove':
			if(window.confirm("确定删除")){
				baidu.dom.remove( "distHookItem_" + id );
				distHookUpdateCount();
			}
			break;
		case 'add':
			baidu.dom.insertAfter( getdistHookElement(), baidu.G("distHookItem_" + id));
			distHookUpdateCount();
			break;
		default:
			break;
	
	}
}

/*
 *前置命令
 */
var distPreCmdStartIndex = 10000,distPreCmdHTML = "";
(function(){
	distPreCmdHTML = baidu.G( 'distPreCmdItem_0' ).innerHTML;
	distPreCmdHTML = "<div id='distPreCmdItem_99999'>" + distPreCmdHTML + "</div>";
})();
function getdistPreCmdElement(){
	var _tpl,_t;
	_tpl = distPreCmdHTML;
	_tpl = _tpl.replace(/distPreCmdItem_\d+/g,"distPreCmdItem_"+distPreCmdStartIndex);
	_tpl = _tpl.replace(/dist_pre_cmd\[\d+\]/g,"dist_pre_cmd["+distPreCmdStartIndex+"]");
	_tpl = _tpl.replace(/distPreCmdProcess\('add','\d+'\)/g,"distPreCmdProcess('add','"+distPreCmdStartIndex+"')");
	_tpl = _tpl.replace(/distPreCmdProcess\('remove','\d+'\)/g,"distPreCmdProcess('remove','"+distPreCmdStartIndex+"')");
	//
	_t = document.createElement( "div" );
	
	_t.innerHTML = _tpl;
	
	distPreCmdStartIndex++;
	
	return baidu.dom.first( _t );
}

function distPreCmdUpdateCount(){
	var item = baidu.dom.query( ".precmd_count" );
	baidu.array.each(item,function(v,k){
		v.innerHTML = k+1;
	});
}
distPreCmdUpdateCount();

function distPreCmdProcess(type,id){
	switch(type){
		case 'remove':
			if(window.confirm("确定删除")){
				baidu.dom.remove( "distPreCmdItem_" + id );
				distPreCmdUpdateCount();
			}
			break;
		case 'add':
			baidu.dom.insertAfter( getdistPreCmdElement(), baidu.G("distPreCmdItem_" + id));
			distPreCmdUpdateCount();
			break;
		default:
			break;
	
	}
}

/*
 *  邮件，短信，自动提示
 *  只在编辑时候才有自动提示，查看时不需要
 */
(function(){
    if(window.location.href.indexOf("view=1")!=-1) return ;//查看直接跳过此段代码
	var options = {
		getDataByIndex : function( index ){
            if(isNaN(index)) return {};
            var value =  this.currentData[index].value,
                curValue = this.getTarget().value,
                newValue="";
            if((new RegExp("\\;$","gi")).test(curValue)){   
                //end with ; replace the last x; with value
                newValue = curValue.replace(/[^\;]+\;$/gi,"")+value+";";
            }else{
                //replace c of  aa;bb;c  with value
                newValue=curValue.replace(/[^\;]+$/gi,"")+value+";";
            }
            value = newValue;

            //remove the duplicate item  in value
            var o ={},arr= value.split(/\;/gi),resultArr=[];
            for(var i=0,l=arr.length;i<l;i++){
                if(arr[i] && (!o[arr[i]])){
                    resultArr.push(arr[i]);
                    o[arr[i]]=1;
                }
            }
            //console.log(resultArr);
            value = resultArr.join(";")+";";

            this.currentData[index] = {
                content : value,
                value   : value
            };
            return {
                item    : this.currentData[index],
                index   : index
            };
        },
        getData : function(word){
            var url,data,success,token,self = this;
            url = "/noah/index.php?r=monitorRule/GetReceiver";
            token = word.replace( /(.*?;)/gi,"");
            data = "token=" + token;
            var curValue = this.getTarget().value;
            var arr= curValue.split(/\;/);	
            success = function(xhr,responseText){
                var result,sData = [];
                result = baidu.json.parse( (baidu.string.trim(responseText) != "") ? responseText : "[]"  );
                baidu.array.each(result,function(v,k){
                    if(baidu.array.indexOf(arr,v[0])==-1)sData.push({content: "<span>"+v[0]+"</span><span style='padding-left:3px;color:#AAA;'>"+v[1]+"</span>",value:v[0]} );
                });
                (sData.length > 10) ? (sData.length = 10):0;
                self.setData(word,sData);
            };
            baidu.ajax.post(url,data,success);
        },
        onbeforepick:function(e){
            var value =  e.data.item.value;
            var curValue = this.getTarget().value;
            var newValue="";
            if((new RegExp("\\;$","gi")).test(curValue)){   
                //end with ; replace the last x; with value
                newValue = curValue.replace(/[^\;]+\;$/gi,"")+value+";";
            }else{
                //replace c of  aa;bb;c  with value
                newValue=curValue.replace(/[^\;]+$/gi,"")+value+";";
            }
            value = newValue;

            //remove the duplicate item  in value
            var o ={},arr= value.split(/\;/gi),resultArr=[];
            for(var i=0,l=arr.length;i<l;i++){
                if(arr[i] && (!o[arr[i]])){
                    resultArr.push(arr[i]);
                    o[arr[i]]=1;
                }
            }
            value = resultArr.join(";")+";";
            this.currentData[e.data.index].value = value;
        }
	};//end options

    
    var sugmail = new nuit.Suggestion(options);    
    sugmail.render("alarm_mail");
    
    var sugsms = new nuit.Suggestion(options);
    sugsms.render("alarm_sms");

    //suggestions for data_key 
    //var dksug= baidu.ui.suggestion.create(baidu.g("data_key"),{
    var dksug= new nuit.Suggestion({
        getData:function(token){
            var self = this,
            		nodeId = baidu.dom.getAttr("tabs", "data-id")
            //self.setData(token,["a","b"]);
            baidu.ajax.post("/drc/index.php?r=Data/Show/SuggestDataList","nodeId="+nodeId+"&token="+token,function(xhr,result){
				result = baidu.json.parse( (baidu.string.trim(result) != "") ? result : "[]"  );
                var suggestions=[];
                baidu.array.each(result.data,function(row){
				    suggestions.push( {content:"<span>"+row.name+"</span><span style='padding-left:3px;color:#AAA;' datakey=\""+row.dataKey+"\">"+row.dataKey+"</span>",value:row.dataKey} );
                });
               self.setData(token,suggestions);
            });
        },
        onshow:function(){
            var s = this,box = baidu.g(s.mainId);
            box.childNodes[0].style.width="auto";
            box.childNodes[0].style.backgroundColor="#fff";
         },
         getDataByIndex : function( index ){
            if(isNaN(index)) return {};
            if(this.currentData[index].value.indexOf("datakey=")!=-1){
                var value =  this.currentData[index].value.match(new RegExp("datakey\\=\\\"(.*?)\\\""))[1];
				this.currentData[index] = {
					content : value,
					value   : value
                };
            }
			return {
				item    : this.currentData[index],
				index   : index
            };
         }
    });
    
    dksug.render("data_key");
    
    
})();

/**
 *启动方式如果是数据触发，禁用crontab字段
*/
$(function(){
    $("#triggertype").change(function(){
        var triggertype = $(this).val(),$crontab = $("#crontab");
        $crontab.attr("readonly",triggertype=="data_trig"?true:false);
        $crontab.val(triggertype=="data_trig"?"":$crontab.val());
        $("#crontabitem").css("display",triggertype=="data_trig"?"none":"block");
    }).trigger("change"); 
});
/**
 *是否进行小流量分发校验
*/
baidu.dom.ready(function(){
	var D = baidu.dom, 
		E = baidu.event;
	function hasCheck(checkedId,boxId){
		var oCheckbox = D.g(checkedId),
		ckeckedVal= oCheckbox["checked"],
		aItem = D.g(boxId);
		E.on(oCheckbox, "click", function(e){
			if(aItem.style.display == "none"){
				ckeckedVal = true;
				aItem.style.display = "block";
			}else {
				ckeckedVal = false;
				aItem.style.display = "none";
			}
		});
	}
	hasCheck("dist_has_check", "js_calibrationInfo");
	hasCheck("dist_has_check_1", "js_calibrationInfo_1");
});
//机器验证 - 添加机器
// function addMachine(machineId,inputId){
    // var tree = new nuit.ServiceTree({
        // dialogOptions:{
            // draggable:false,
            // resizable:false,
            // width:450},
        // iconsPath:"/datadist/static/lib/nuit/images/",
        // treeOptions:{
                // checkbox:true,
                // checkMode:3
        // },
        // onok:function(e){
            // var servicetreedlg=e.target,tree=servicetreedlg.getTree(),curNode=tree.getCurrentNode(),exist= function(m){
                // var arr=baidu.g(machineId).options,result=false;
                // for(var i=0,l=arr.length;i<l;i++){
                    // if(arr[i].value==m){
                        // result= true;
                        // break;
                    // }
                // }
                // return result;
            // };
            // if(curNode == null){
                // alert("请选择机器");
                // return;
            // }
            // var tree=e.target.getTree(),item = tree.getCheckedNodes(false),validMachine=0;
            // baidu.array.each(item,function(o){
                // if( o.iconCls=="icon-machine" && (!exist(o.text))){
                    // validMachine++;
                    // var option = document.createElement('option');
                    // option.value = o.text + "|1";
                    // option.innerHTML = o.text;
                    // baidu.g(machineId).appendChild(option);
                    // baidu.g(inputId).value += ((baidu.g(inputId).value==""?"":";")+o.text);
                // }
            // });
            // if(validMachine===0){
                // alert("没有选择新机器");
                // return ;
            // }
            // e.target.close();
        // }
    // });
    // tree.open();
// }
// baidu.event.on(baidu.g("btnaddmachine"),"click",addMachine("machinelist", "machinename"));
// baidu.event.on(baidu.g("btnaddmachine_1"),"click",addMachine("machinelist_1", "machinename_1"));
// //机器验证 - 删除机器
// function removeMachine(machineId,inputId){
    // var oList = baidu.g(machineId),options=oList.options,l=options.length,arr=[];
    // while(l--){
        // if(options[l].selected) {
            // options.remove(l);
        // }else{
            // arr.push(options[l].value);
        // }
    // }
    // baidu.g(inputId).value=arr.join(";");
// }
// baidu.event.on(baidu.g("btnremovemachine"),"click",removeMachine("machinelist","machinename"));
// baidu.event.on(baidu.g("btnremovemachine_1"),"click",removeMachine("machinelist_1","machinename_1"));
// //机器验证 - 直接编辑
// function beginEditMachine(){
    // var oMachineList= baidu.g("machinelist"),ta=baidu.g("tamachinelist"),oMachineName= baidu.g("machinename");
    // ta.value=oMachineName.value.replace(/\;/g,"\n"); 
    // oMachineList.style.display="none";
    // ta.style.display="";
    // baidu.g("btneditm").style.display="none";
    // baidu.g("btnendeditm").style.display="";
    // baidu.g("btnaddmachine").style.display="none";
    // baidu.g("btnremovemachine").style.display="none";
// }
// baidu.event.on("btneditm","click",beginEditMachine)
// //机器验证 - 结束编辑
// function endEditMachine(){
    // var oMachineList= baidu.g("machinelist"),opts=oMachineList.options,ta=baidu.g("tamachinelist"),arrM=ta.value.split("\n"),arrNewValue=[];
    // if(ta.style.display=="none"){ // already ended
        // return ;
    // }
    // while(opts.length) opts.remove(opts.length-1);//clear options
    // for(var i=0,l=arrM.length;i<l;i++){
        // var m = arrM[i],exist=false;
        // if(!m) continue;
        // for(var ii=0,ll=arrNewValue.length;ii<ll;ii++){
            // if(arrNewValue[ii]==m){
                // exist=true;
                // break;
            // }
        // }
        // if(!exist){
            // arrNewValue.push(m);
            // var o = new Option(m,m);
            // opts.add(o);
        // }
    // }
    // baidu.g("machinename").value= arrNewValue.join(";");
    // oMachineList.style.display="";
    // ta.style.display="none";
    // baidu.g("btneditm").style.display="";
    // baidu.g("btnendeditm").style.display="none";
    // baidu.g("btnaddmachine").style.display="";
    // baidu.g("btnremovemachine").style.display="";
// }
// 
// baidu.event.on("tamachinelist","blur",endEditMachine)
// baidu.event.on("btnendeditm","click",endEditMachine)
/**
*   传输方式
*/
baidu.dom.ready(function(){
    function applyTransportType(){
        var t  = baidu.dom.query("#transport_type_options :radio:checked")[0].value;
        if(t==0){
            baidu.dom.hide(baidu.dom.g("transport_type_1_fields"));
            baidu.dom.show(baidu.dom.g("transport_type_0_fields"));
            //baidu.dom.show(baidu.dom.g("machine_timeout_item"));
        }else if(t==1){
            baidu.dom.hide(baidu.dom.g("transport_type_0_fields"));
            baidu.dom.show(baidu.dom.g("transport_type_1_fields"));
            //baidu.dom.hide(baidu.dom.g("machine_timeout_item"));
            
            //恢复隐藏字段
            baidu.array.each(baidu.dom.query("#transport_type_1_fields .J_specificType"), function(item){
	        		item.style.display = "block";
	        });
        }else if(t==2){
        		baidu.dom.hide(baidu.dom.g("transport_type_0_fields"));
            baidu.dom.show(baidu.dom.g("transport_type_1_fields"));
            //源机器做种P2P传输
            sourceMachine();
        }
    }
    baidu.array.each(baidu.dom.query("#transport_type_options :radio"),function(r){
        baidu.event.on(r,"change",applyTransportType);
    });
    //源机器做种P2P传输
    function sourceMachine(){
    		var url = window.location.href,
        		hookurlKey = baidu.url.getQueryValue(url, "hookurl"),
        		dist_idKey = baidu.url.getQueryValue(url, "dist_id"),
        		specificType = baidu.dom.query("#transport_type_1_fields .J_specificType");
        
        baidu.array.each(specificType, function(item){
        		item.style.display = "none"
        });
        
        if(dist_idKey == null && hookurlKey != null && hookurlKey != undefined && hookurlKey != ""){
        		baidu.dom.g("dist_done_hook['url']").value = decodeURIComponent(hookurlKey);
        }
    }
    //p2p高级选项
    baidu.event.on(baidu.dom.g("btn_toggle_p2p_config"),"click",function(){
        var i = baidu.dom.g("p2p_config_toggle_status"),p= baidu.dom.g("p2p_config");
        if(p.style.display!="block"){
            p.style.display="block";
            i.setAttribute("src","/datadist/static/img/-.gif")
        }else{
            p.style.display="none";
            i.setAttribute("src","/datadist/static/img/+.gif")
        }
    });
    //baidu.event.fire(baidu.dom.g("btn_toggle_p2p_config"),"click");
});

/*
 *  总失败机器阀值 数值/百分比
 */
baidu.dom.ready(function(){
    function applyfm(){
        var radio =this,radioId= this.id,parentSpan=radio.parentNode,
            spanToShow=baidu.g(radioId.replace(/^radio/i,"span")),
            txtToShow=baidu.dom.query(":input",spanToShow)[0];
        //将parentSpan前面的span都隐藏
        while(parentSpan){
            parentSpan =parentSpan.previousSibling;
            if(parentSpan && parentSpan.tagName && parentSpan.tagName.toLowerCase()=="span"){
                baidu.dom.hide(parentSpan);
            }
        }
        //显示该显示的span
        baidu.dom.show(spanToShow);
        //百分比默认为0
        if(radioId.indexOf("_percent_")!=-1 && txtToShow.value==""){
            txtToShow.value="0";
        }
    }
    baidu.array.each(baidu.dom.query("#tangram-tabs-c3 .span-fm-radios :radio"),function(r){
        baidu.event.on(r,"change",applyfm);
    });
});

/**
*   组内失败机器数阀值 数值/百分比
*/
baidu.dom.ready(function(){
    baidu.event.on(baidu.g("transport_type_0_fields"),"click",function(e){ // 利用事件冒泡
        var srcEl = e.originalTarget||e.srcElement;// 找到事件的触发源
        try{
            if(srcEl && srcEl.tagName && baidu.dom.hasClass(srcEl,"dist-group-clickable")){  //  数值/百分比切换
                var item = baidu.dom.getAncestorByClass(srcEl,"item"),
                    spanfm=baidu.dom.query(".dist_group_fm",item)[0],
                    spanfmpercent=baidu.dom.query(".dist_group_fm_percent",item)[0],
                    txt= baidu.dom.query(":input",spanfmpercent)[0];
                spanfm.style.display=(/_0$/i.test(srcEl.id)?"":"none");
                spanfmpercent.style.display=(/_0$/i.test(srcEl.id)?"none":"");
                if(!/_0$/i.test(srcEl.id) && txt.value==""){ //  百分比默认是0%
                    txt.value="0";
                }
            }
        }catch(e){}//貌似FF下originalTarget.tagName 有时不让访问。。。
    });
});

/*
 *提交数据的ajax处理
 */
(function(){
	//url = datadist/detail/modify/save
	//data = json
	var postProcess = function(){
		var result = {},tabs=[],msg=[],precmdret="",precmdjumpret="",triggertype="",optinonsVlue = baidu.dom.query("#transport_type_options :radio:checked")[0].value,transporttype=optinonsVlue==2 ? optinonsVlue = 1 : optinonsVlue = optinonsVlue;
        if(transporttype=="1"){  //  P2P传输
            baidu.array.each(baidu.dom.query("#group_concurrency,#max_failure_group,[id*=max_failure_machine],[name*=max_failure_machine],[name*=concurrency]",baidu.g("transport_type_0_fields")),function(o){
                o.value="";
            });
            baidu.array.each(baidu.dom.query("#transport_type_0_fields select[name^=dist_dest_node]"),function(o){
                var options = o.options;
                while(options.length) options.remove(options.length-1);
            });
            //删除普通传输中的分组
            baidu.array.each(baidu.dom.query("#transport_type_0_fields > [id^=distDestItem_]"),function(o){
                o.innerHTML="";
            });
        }else{  //  普通传输
            baidu.array.each(baidu.dom.query("[id*=max_failure_machine],[name*=max_failure_machine],[name^=dist_p2p_config]",baidu.g("transport_type_1_fields")),function(o){
                o.value="";
            });
            baidu.array.each(baidu.dom.query("select[name*=dist_dest_node],select[name^=dist_seed_node]",baidu.g("transport_type_1_fields")),function(o){
                var options = o.options;
                while(options.length) options.remove(options.length-1);
            });
        }
		baidu.array.each(baidu.dom.query( "input,textarea,select" ),function(v,k){
			if( baidu.dom.getAttr( v,"multiple")){  // 配送目标中的节点/分组/机器 and p2p传输中的中转机 and p2p传输中的节点/分组/机器
				var node = [],host=[],group=[];
                //baidu.array.each(baidu.dom.query( "select[name="+ v.name +"] option" )
                //Tangram 升级到1.3.9后 CSS Selector Sizzle 也升级
                //之前baidu.dom.query("select[name=dest_dist_node[0]]") 有用,新版[0]处理方式不同
				baidu.array.each(baidu.dom.query( " option",v ),function(vv,kk){
					var _tmp = vv.value.split( "|" );
                    //总觉得下面的if/else代码让我很纠结。于是我改成了
					/*if( _tmp[1] == "0" ){
						node.push( _tmp[0] );
					}else if(_tmp[1]=="1"){
						host.push( _tmp[0] );
					}else{
                        group.push(_tmp[0]);
                    }*/
                    //这样写还不简洁
                    /*(_tmp[1]=="0") && (node.push(_tmp[0]));
                    (_tmp[1]=="1") && (host.push(_tmp[0]));
                    (_tmp[1]=="2") && (group.push(_tmp[0]));*/
                    //终极版
                    [node,host,group][_tmp[1]].push(_tmp[0]);
                    //:) 
				});
                if(transporttype!="1" && v.name.indexOf("dist_dest_node")==0 && (host.length+node.length+group.length)==0){
					msg.push("配送目标不能为空");
					tabs.push({elem:v,tab:3});
				}
				if(baidu.dom.query("#transport_type_options :radio:checked")[0].value != "2"){
					if( transporttype=="1" &&  v.name.indexOf("dist_seed_node[0]")==0 && (host.length+node.length+group.length)==0){
						msg.push("P2P中转机不能为空");
						tabs.push({elem:v,tab:3});
					}
				}
				if( transporttype=="1" &&  v.name.indexOf("tt1_dist_dest_node[0]")==0 && (host.length+node.length+group.length)==0){
					msg.push("P2P传输配送目标不能为空");
					tabs.push({elem:v,tab:3});
				}
				
                var targetname = v.name;
                if(transporttype =="1") {  // p2p传输 配送目标覆盖 第一组配送目标(普通传输的配送目标出现p2p配送目标之前)
                    targetname= targetname.replace(/^tt1_/i,"");
                }
				result[ targetname ] = node.join(",");
				result[ targetname.replace(/_node/gi,"_host") ] = host.join(",");
				result[ targetname.replace(/_node/gi,"_group") ] = group.join(",");
				
				//是否进行小流量分发校验
				var checkmachine = "dist_check['check_machine']";
				if(baidu.dom.g("dist_has_check_1").checked){
					if(transporttype=="1" && v.name=="dist_check[check_machine_1]" && (host.length + node.length)==0 ){
						msg.push("验证机器不能为空");
						tabs.push({elem:v,tab:3}); 
					}else if(transporttype=="1" && v.name=="dist_check[check_machine_1]" && (host.length + node.length)!=0){
						result[ checkmachine ] = host.concat(node).join(",");
					}
				}
				if(baidu.dom.g("dist_has_check").checked){
					if(transporttype=="0" && v.name=="dist_check[check_machine]" && (host.length + node.length)==0){
						msg.push("验证机器不能为空");
						tabs.push({elem:v,tab:3}); 
					}else if(transporttype=="0" && v.name=="dist_check[check_machine]" && (host.length + node.length)!=0){
						result[ checkmachine ] = host.concat(node).join(",");
					}
				}
				
			}else{
				// 是否进行小流量分发校验
				if(transporttype == "0"){
					result["dist['has_check']"] =  baidu.dom.g("dist_has_check").checked ? 1 :0;
				}else if(transporttype != "0"){
					result["dist['has_check']"] =  baidu.dom.g("dist_has_check_1").checked ? 1 :0;
				}
				if(transporttype != "0"){
					if(baidu.dom.g("dist_has_check_1").checked){
						if(v.id=="dist_check_check_cmd_1"){
							result["dist_check['check_cmd']"] = baidu.dom.g("dist_check_check_cmd_1").value;
						}
						if(v.id=="dist_check_success_return_1"){
							result["dist_check['success_return']"] = baidu.dom.g("dist_check_success_return_1").value;
						}
					}
				}
				if(transporttype == "0"){
					if(baidu.dom.g("dist_has_check").checked){
						if(v.id=="dist_check_check_cmd"){
							 result[ v.name ] = v.value;
						}
						if(v.id=="dist_check_success_return"){
							 result[ v.name ] = v.value;
						}
					}
				}
				
				//
                if(v.id =="auto_finish"){
                    result[ v.name ] = v.checked ? 1 :0;
                }else if(v.id=="type-http"){
                    result[v.name]= v.checked ? 0 : 1;
                }else{
                    if(!/^radio_/i.test(v.name)){   //   radio_开始的字段跳过
                        result[ v.name ] = v.value;
                    }
                }
                if(v.id=="distname" && v.value.length<1){
                    msg.push("配送任务名不能少于一个字符");
                    tabs.push({elem:v,tab:1});
                } 
                if(v.name=="dist['machine_timeout']" /*&& transporttype!="1"*/){
                    if(v.value==""){
                        msg.push("单机超时必须填写");
                        tabs.push({elem:v,tab:1});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("单机超时必须是数字");
                            tabs.push({elem:v,tab:1});
                        }else{
                            if(parseInt(v.value)<120 && parseInt(v.value)!=0){
                                msg.push("单机超时不能小于120s");
                                tabs.push({elem:v,tab:1});
                            }
                        }
                    }
                }
                if(v.name=="dist['check_timeout']"){
                    if(v.value==""){
                        msg.push("任务总体超时必须填写");
                        tabs.push({elem:v,tab:1});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("任务总体超时必须是数字");
                            tabs.push({elem:v,tab:1});
                        }else{
                            if(parseInt(v.value)<300 && parseInt(v.value)!=0){
                                msg.push("任务总体超时超时不能小于300s");
                                tabs.push({elem:v,tab:1});
                            }
                        }
                    }
                }
                if(v.id=="triggertype") triggertype= v.value;
                if(v.id == "crontab"){
                    if(v.value=="" && (triggertype!="data_trig")){
                        msg.push("crontab不能为空");
                        tabs.push({elem:v,tab:1});
                    }
                    /*if(!/^(((([\*]{1}){1})|((\*\/){0,1}(([0-9]{1}){1}|(([1-5]{1}){1}([0-9]{1}){1}){1}))) ((([\*]{1}){1})|((\*\/){0,1}(([0-9]{1}){1}|(([1]{1}){1}([0-9]{1}){1}){1}|([2]{1}){1}([0-3]{1}){1}))) ((([\*]{1}){1})|((\*\/){0,1}(([1-9]{1}){1}|(([1-2]{1}){1}([0-9]{1}){1}){1}|([3]{1}){1}([0-1]{1}){1}))) ((([\*]{1}){1})|((\*\/){0,1}(([1-9]{1}){1}|(([1-2]{1}){1}([0-9]{1}){1}){1}|([3]{1}){1}([0-1]{1}){1}))|(jan|feb|mar|apr|may|jun|jul|aug|sep|okt|nov|dec)) ((([\*]{1}){1})|((\*\/){0,1}(([0-7]{1}){1}))|(sun|mon|tue|wed|thu|fri|sat)))$/.test(v.value)){
                        alert('crontab格式不正确！');
                        tabs.push({elem:v,tab:1});
                        _validate = false;
                        return;
                    }*/
                }
                if(v.id == "alarm_mail"){
                    if(v.value==""){
                        msg.push("报警邮件不能为空");
                        tabs.push({elem:v,tab:1});
                    }
                }
                //data_key
                if(v.id == "data_key"){
                    if(v.value==""){
                        msg.push("资源名称不能为空");
                        tabs.push({elem:v,tab:2});
                    }

                }
                //dist['wget_retry_time']
                //dist['wget_retry_interval']
                if(v.name=="dist['wget_retry_time']"){
                    if(v.value==""){
                        msg.push("分发重试次数必须填写");
                        tabs.push({elem:v,tab:2});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("分发重试次数必须是数字");
                            tabs.push({elem:v,tab:2});
                        }
                    }
                }
                if(v.name=="dist['wget_retry_interval']"){
                    if(v.value==""){
                        msg.push("分发重试间隔必须填写");
                        tabs.push({elem:v,tab:2});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("分发重试间隔必须是数字");
                            tabs.push({elem:v,tab:2});
                        }
                    }
                }

                if(v.name=="dist['wget_limit_time']"){
                    if(v.value==""){
                        msg.push("分发超时必须填写");
                        tabs.push({elem:v,tab:2});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("分发超时必须是数字");
                            tabs.push({elem:v,tab:2});
                        }
                    }
                }
                if(v.id == "dest_path"){
                    if(v.value==""){
                        msg.push("目录目录/文件不能为空");
                        tabs.push({elem:v,tab:2});
                    }

                }
                if(v.id=="speed_limit"){
                    if(v.value==""){
                        msg.push("分发限速必须填写");
                        tabs.push({elem:v,tab:2});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("分发限速必须是数字");
                            tabs.push({elem:v,tab:2});
                        }
                    }
                }
                if(v.id=="max_tolerate"){
                    if(v.value==""){
                    }else{
                        if(isNaN(v.value)){
                            msg.push("最大配送容忍时间必须是数字");
                            tabs.push({elem:v,tab:2});
                        }
                    }
                }
                if(v.id=="group_concurrency" && transporttype=="0"){
                    if(v.value==""){
                        msg.push("并发组数必须填写");
                        tabs.push({elem:v,tab:3});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("并发组数必须是数字");
                            tabs.push({elem:v,tab:3});
                        }
                    }
                }
                if(v.id=="max_failure_group" && transporttype=="0"){
                    if(v.value==""){
                        msg.push("总失败分组数阀值必须填写");
                        tabs.push({elem:v,tab:3});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("总失败分组数阀值必须是数字");
                            tabs.push({elem:v,tab:3});
                        }
                    }
                }
                if(v.name=="dist['max_failure_machine']"){   //   隐藏域 数值
                    var t= baidu.dom.query("#transport_type_options :radio:checked")[0].value,//传输类型
                    		vNum = t==2?t=1:t=t,
                        $v=baidu.dom.g("max_failure_machine_"+vNum),
                        isPercent=baidu.g("radio_max_failure_machine_percent_"+vNum).checked;//是否选中百分比
                    //类型radio如果选择百分比,数值为0,不校验
                    if(!isPercent){
                        v.value = $v.value;//将文本框的值赋值给隐藏域
                        result[v.name]=v.value;
                        v  = $v; //如果错误，聚焦在文本框上
                        if(v.value==""){
                            msg.push("总失败机器数阀值必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("总失败机器数阀值必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }else{
                        v.value= "0";
                        $v.value="0";
                        result[v.name]="0";
                    }
                }
                if(v.name=="dist['max_failure_machine_percent']"){   //   隐藏域 百分比
                    var t= baidu.dom.query("#transport_type_options :radio:checked")[0].value,//传输类型
                    		vNum = t==2?t=1:t=t,
                        $v=baidu.dom.g("max_failure_machine_percent_"+vNum),
                        isPercent=baidu.g("radio_max_failure_machine_percent_"+vNum).checked;//是否选中百分比
                    //类型radio如果选择数值,百分比为0,不校验
                    if(isPercent){
                        v.value = $v.value;//将文本框的值赋值给隐藏域
                        result[v.name]=v.value;
                        v  = $v; //如果错误，聚焦在文本框上
                        if(v.value==""){
                            msg.push("总失败机器数阀值必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("总失败机器数阀值必须是数字");
                                tabs.push({elem:v,tab:3});
                            }else{    //    百分比介于0~100之间
                                if(parseFloat(v.value)<0 || parseFloat(v.value)>100){
                                    msg.push("总失败机器数阀值百分值必须介于0~100之间");
                                    tabs.push({elem:v,tab:3});
                                }
                            }
                        }
                    }else{
                        v.value= "0";
                        $v.value="0";
                        result[v.name]="0";
                    }
                }
                //p2p传输中失败是否退出同原第一组的失败是否退出 
                if(v.id=="tt1_abort_on_failure" && transporttype=="1"){
                    result["dist_group[0]['abort_on_failure']"]=v.options[v.selectedIndex].value;
                }

                //dist_group[0]['concurrency']
                if(v.name.indexOf("['concurrency']")!=-1 && transporttype=="0"){
                    if(v.value==""){
                        msg.push("组内机器并发数必须填写");
                        tabs.push({elem:v,tab:3});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("组内机器并发数必须是数字");
                            tabs.push({elem:v,tab:3});
                        }
                    }
                }
                
                //dist_group[0]['max_failure_machine']
                //组内失败机器数阀值
                if(v.name.indexOf("['max_failure_machine']")!=-1 && v.name.indexOf("group")!=-1  && transporttype=="0"){
                    //如果选择的是百分比，数值为0，不校验
                    var item = baidu.dom.getAncestorByClass(v,"item"),isPercent=baidu.dom.query(":radio:checked",item)[0].value=="1";
                    if(!isPercent){
                        if(v.value==""){
                            msg.push("组内失败机器数阈值必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("组内失败机器数阈值必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }else{
                        v.value="0";
                        result[v.name]="0";
                    }
                }
                
                //组内失败机器数阀值 百分比
                if(v.name.indexOf("['max_failure_machine_percent']")!=-1 && v.name.indexOf("group")!=-1 ){
                    //如果选择的是数值，百分比为0，不校验
                    var item = baidu.dom.getAncestorByClass(v,"item"),isPercent=baidu.dom.query(":radio:checked",item)[0].value=="1";
                    if(isPercent){
                        if(v.value==""){
                            msg.push("组内失败机器数阈值必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("组内失败机器数阈值必须是数字");
                                tabs.push({elem:v,tab:3});
                            }else if(parseFloat(v.value)<0 || parseFloat(v.value)>100){
                                msg.push("组内失败机器数阀值百分比必须介于0~100之间");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }else{
                        v.value="0";
                        result[v.name]="0";
                    }
                }


                if(transporttype=="1") {
                    if(v.name=="dist_p2p_config['seed_account']"){
                        if(v.value==""){
                            msg.push("种子机执行账户必须填写");
                            tabs.push({elem:v,tab:3});
                        }
                    }

                    if(v.name=="dist_p2p_config['bscp_download_speed_limit']"){
                        if(v.value==""){
                            msg.push("种子机下载限速必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("种子机下载限速必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }


                    if(v.name=="dist_p2p_config['seed_upload_speed_limit']"){
                        if(v.value==""){
                            msg.push("种子机上传限速必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("种子机上传限速必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }

                    if(v.name=="dist_p2p_config['seed_retry_time']"){
                        if(v.value==""){
                            msg.push("种子机启动重试次数必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("种子机启动重试次数必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }

                    if(v.name=="dist_p2p_config['seed_retry_interval']"){
                        if(v.value==""){
                            msg.push("种子机启动重试间隔必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("种子机启动重试间隔必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }

                    if(v.name=="dist_p2p_config['seeded_time']"){
                        if(v.value==""){
                            msg.push("目标机做种时间必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("目标机做种时间必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }

                    if(v.name=="dist_p2p_config['client_upload_speed_limit']"){
                        if(v.value==""){
                            msg.push("客户机上传限速必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("客户机上传限速必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }
                    
                    if(v.name=="dist_p2p_config['seed_clean_retry_time']"){
                        if(v.value==""){
                            msg.push("种子机清理重试次数必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("种子机清理重试次数必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }

                    if(v.name=="dist_p2p_config['seed_clean_retry_interval']"){
                        if(v.value==""){
                            msg.push("种子机清理重试间隔必须填写");
                            tabs.push({elem:v,tab:3});
                        }else{
                            if(isNaN(v.value)){
                                msg.push("种子机清理重试间隔必须是数字");
                                tabs.push({elem:v,tab:3});
                            }
                        }
                    }

                }//end transporttype=="1"

                if(v.id=="hookret" && v.value!="" &&  (!/^((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]\d)|\d)(\,((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]\d)|\d)){0,}$/.test(v.value))){
                    msg.push("后置命令返回值格式不正确");
                    tabs.push({elem:v,tab:4});
                }

				
				if(v.id=="mutex_time") {
                    if(v.value==""){
                        msg.push("互斥标记持续时间必须填写");
                        tabs.push({elem:v,tab:4});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("互斥标记持续时间必须是数字");
                            tabs.push({elem:v,tab:4});
                        }
                    }
                }
                if(v.id=="global_retry_times") {
                    if(v.value==""){
                    }else{
                        if(isNaN(v.value)){
                            msg.push("全局重试次数必须是数字");
                            tabs.push({elem:v,tab:1});
                        }
                    }
                }
                if(v.id=="dist_done_hook['retry_times']") {
                    if(v.value==""){
                        msg.push("重试次数必须填写");
                        tabs.push({elem:v,tab:6});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("重试次数必须是数字");
                            tabs.push({elem:v,tab:6});
                        }
                    }
                }
                if(v.id=="dist_done_hook['retry_interval']") {
                    if(v.value==""){
                        msg.push("重试间隔必须填写");
                        tabs.push({elem:v,tab:6});
                    }else{
                        if(isNaN(v.value)){
                            msg.push("重试间隔必须是数字");
                            tabs.push({elem:v,tab:6});
                        }
                    }
                }
                
            }

            result["dist['transport_type']"]=baidu.dom.query("#transport_type_options :radio:checked")[0].value;
            // result["nodeId"] = "{/$nodeId/}";
            // result["nodeId"] = baidu.url.getQueryValue(location.href,"nodeId");
            result["nodeId"] = baidu.dom.getAttr("tabs", "data-id");
            
        });
        if(msg.length>0) {
            alert(msg.join("\n"));
            window.setTimeout(function(){
                if(tabs[0].tab==3 && tabs[0].elem.name.indexOf("dist_p2p_config")!=-1 && baidu.dom.g("p2p_config").style.display=="none") baidu.event.fire(baidu.dom.g("btn_toggle_p2p_config"),"click");
                siteTabs(tabs[0].tab);
                tabs[0].elem.focus();
            },60);
            return;
        }
        //是否进行小流量分发校验  删除多余字段
        delete result["dist_check[check_machine]"];
		delete result["dist_check[check_machine_1]"];
		delete result["dist_check['success_return_1']"];
		delete result["dist_check['check_cmd_1']"];
        window.mask = new baidu.ui.Modal({container:document.getElementsByTagName('body')[0]});
        window.mask.render();
        window.mask.show();
        //$(document.body).showLoading();
        baidu.ajax.request("/datadist/detail/save",{
            method:"POST",
            data:"data="+encodeURIComponent(baidu.json.stringify(result)),
            onsuccess:function(xhr,responseText){
                //$(document.body).hideLoading();
                window.mask.hide();
                var result = baidu.json.parse( responseText );
                if( result["status"] != 0){
                    alert( result["message"] );
                    return false;
                }
                alert("保存成功");
                window.setTimeout(function(){
                    window.location.href = result.location;
                },60);
            },
            onfailure:function(xhr){
                alert("保存出错,http状态:"+xhr.status);
            }
        });
        return false;
    
    };
	baidu.array.each( baidu.dom.query( ".J-submit" ),function(v,k){
		baidu.event.on(v,"click",postProcess);
	});
})();


(function(){
	if(baidu.dom.g("auto_finish").value == ""){
		baidu.G("auto_finish").checked = false;
	
	}else{
		if(baidu.dom.g("auto_finish").value == "1"){
			baidu.G("auto_finish").checked = true;
		
		}else{
			baidu.G("auto_finish").checked = false;
		}
	
	}
    //view
	var view = (window.location.href.indexOf("view=1&") > 0);

	if(view){

		baidu.array.each(baidu.dom.query(".m-sub"),function(v,k){
			baidu.dom.hide(v);
		});
        baidu.array.each(baidu.dom.query(".ftext"),function(v,k){
			baidu.dom.setAttr(v, 'readonly', 'readonly');
		});
        baidu.dom.setAttr(baidu.G("auto_finish"), 'disabled', 'disabled');
        baidu.array.each(baidu.dom.query("select,:radio,:checkbox"),function(v,k){
			baidu.dom.setAttr(v, 'disabled', 'disabled');
		});
        baidu.array.each(baidu.dom.query("#transport_type_options :radio"),function(v,k){
			baidu.dom.setAttr(v, 'disabled', 'disabled');
		});
        baidu.dom.hide(baidu.g("topnav"));
	}
})();
function cancel(){
	var nodeId = baidu.url.getQueryValue(location.href, "nodeId");
    window.location.href = '/datadist/dist/list?nodeId='+nodeId+'&nodeid='+nodeId;
}

function fixedCreateNewData(){
    createNewData({
        subSys:false,
        url:"/drc/index.php?r=Data/Create/CreateDataInDist",
        callback:function(result){
            if(!result.success){
                alert(result.message);
            }else{
                (result.data && result.data.dataKey) && (document.getElementById("data_key").value= result.data.dataKey);
            }
        }
    });
}
