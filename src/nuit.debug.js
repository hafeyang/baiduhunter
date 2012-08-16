/*
* nuit: NOAH UI,Noah Team @ 2012
* version: 1.0
* build date:20120720142040
*/
// Copyright (c) 2009, Baidu Inc. All rights reserved.
//
// Licensed under the BSD License
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://tangram.baidu.com/license.html
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */

 /**
 * @namespace T Tangram七巧板
 * @name T
 * @version 1.6.0
*/

/**
 * 声明baidu包
 * @author: allstar, erik, meizz, berg
 */
var T,
    baidu = T = baidu || {version: "1.5.0"}; 

//提出guid，防止在与老版本Tangram混用时
//在下一行错误的修改window[undefined]
baidu.guid = "$BAIDU$";

//Tangram可能被放在闭包中
//一些页面级别唯一的属性，需要挂载在window[baidu.guid]上
baidu.$$ = window[baidu.guid] = window[baidu.guid] || {global:{}};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/ajax.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/11/13
 */


/**
 * 对XMLHttpRequest请求的封装
 * @namespace baidu.ajax
 */
baidu.ajax = baidu.ajax || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: baidu/fn.js
 * author: berg
 * version: 1.0.0
 * date: 2010/11/02
 */


/**
 * 对方法的操作，解决内存泄露问题
 * @namespace baidu.fn
 */
baidu.fn = baidu.fn || {};
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 */



/**
 * 这是一个空函数，用于需要排除函数作用域链干扰的情况.
 * @author rocy
 * @name baidu.fn.blank
 * @function
 * @grammar baidu.fn.blank()
 * @meta standard
 * @return {Function} 一个空函数
 * @version 1.3.3
 */
baidu.fn.blank = function () {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 发送一个ajax请求
 * @author: allstar, erik, berg
 * @name baidu.ajax.request
 * @function
 * @grammar baidu.ajax.request(url[, options])
 * @param {string} 	url 发送请求的url
 * @param {Object} 	options 发送请求的选项参数
 * @config {String} 	[method] 			请求发送的类型。默认为GET
 * @config {Boolean}  [async] 			是否异步请求。默认为true（异步）
 * @config {String} 	[data] 				需要发送的数据。如果是GET请求的话，不需要这个属性
 * @config {Object} 	[headers] 			要设置的http request header
 * @config {number}   [timeout]       超时时间，单位ms
 * @config {String} 	[username] 			用户名
 * @config {String} 	[password] 			密码
 * @config {Function} [onsuccess] 		请求成功时触发，function(XMLHttpRequest xhr, string responseText)。
 * @config {Function} [onfailure] 		请求失败时触发，function(XMLHttpRequest xhr)。
 * @config {Function} [onbeforerequest]	发送请求之前触发，function(XMLHttpRequest xhr)。
 * @config {Function} [on{STATUS_CODE}] 	当请求为相应状态码时触发的事件，如on302、on404、on500，function(XMLHttpRequest xhr)。3XX的状态码浏览器无法获取，4xx的，可能因为未知问题导致获取失败。
 * @config {Boolean}  [noCache] 			是否需要缓存，默认为false（缓存），1.1.1起支持。
 * 
 * @meta standard
 * @see baidu.ajax.get,baidu.ajax.post,baidu.ajax.form
 *             
 * @returns {XMLHttpRequest} 发送请求的XMLHttpRequest对象
 */
baidu.ajax.request = function (url, opt_options) {
    var options     = opt_options || {},
        data        = options.data || "",
        async       = !(options.async === false),
        username    = options.username || "",
        password    = options.password || "",
        method      = (options.method || "GET").toUpperCase(),
        headers     = options.headers || {},
        // 基本的逻辑来自lili同学提供的patch
        timeout     = options.timeout || 0,
        eventHandlers = {},
        tick, key, xhr;

    /**
     * readyState发生变更时调用
     * 
     * @ignore
     */
    function stateChangeHandler() {
        if (xhr.readyState == 4) {
            try {
                var stat = xhr.status;
            } catch (ex) {
                // 在请求时，如果网络中断，Firefox会无法取得status
                fire('failure');
                return;
            }
            
            fire(stat);
            
            // http://www.never-online.net/blog/article.asp?id=261
            // case 12002: // Server timeout      
            // case 12029: // dropped connections
            // case 12030: // dropped connections
            // case 12031: // dropped connections
            // case 12152: // closed by server
            // case 13030: // status and statusText are unavailable
            
            // IE error sometimes returns 1223 when it 
            // should be 204, so treat it as success
            if ((stat >= 200 && stat < 300)
                || stat == 304
                || stat == 1223) {
                fire('success');
            } else {
                fire('failure');
            }
            
            /*
             * NOTE: Testing discovered that for some bizarre reason, on Mozilla, the
             * JavaScript <code>XmlHttpRequest.onreadystatechange</code> handler
             * function maybe still be called after it is deleted. The theory is that the
             * callback is cached somewhere. Setting it to null or an empty function does
             * seem to work properly, though.
             * 
             * On IE, there are two problems: Setting onreadystatechange to null (as
             * opposed to an empty function) sometimes throws an exception. With
             * particular (rare) versions of jscript.dll, setting onreadystatechange from
             * within onreadystatechange causes a crash. Setting it from within a timeout
             * fixes this bug (see issue 1610).
             * 
             * End result: *always* set onreadystatechange to an empty function (never to
             * null). Never set onreadystatechange from within onreadystatechange (always
             * in a setTimeout()).
             */
            window.setTimeout(
                function() {
                    // 避免内存泄露.
                    // 由new Function改成不含此作用域链的 baidu.fn.blank 函数,
                    // 以避免作用域链带来的隐性循环引用导致的IE下内存泄露. By rocy 2011-01-05 .
                    xhr.onreadystatechange = baidu.fn.blank;
                    if (async) {
                        xhr = null;
                    }
                }, 0);
        }
    }
    
    /**
     * 获取XMLHttpRequest对象
     * 
     * @ignore
     * @return {XMLHttpRequest} XMLHttpRequest对象
     */
    function getXHR() {
        if (window.ActiveXObject) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {}
            }
        }
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }
    }
    
    /**
     * 触发事件
     * 
     * @ignore
     * @param {String} type 事件类型
     */
    function fire(type) {
        type = 'on' + type;
        var handler = eventHandlers[type],
            globelHandler = baidu.ajax[type];
        
        // 不对事件类型进行验证
        if (handler) {
            if (tick) {
              clearTimeout(tick);
            }

            if (type != 'onsuccess') {
                handler(xhr);
            } else {
                //处理获取xhr.responseText导致出错的情况,比如请求图片地址.
                try {
                    xhr.responseText;
                } catch(error) {
                    return handler(xhr);
                }
                handler(xhr, xhr.responseText);
            }
        } else if (globelHandler) {
            //onsuccess不支持全局事件
            if (type == 'onsuccess') {
                return;
            }
            globelHandler(xhr);
        }
    }
    
    
    for (key in options) {
        // 将options参数中的事件参数复制到eventHandlers对象中
        // 这里复制所有options的成员，eventHandlers有冗余
        // 但是不会产生任何影响，并且代码紧凑
        eventHandlers[key] = options[key];
    }
    
    headers['X-Requested-With'] = 'XMLHttpRequest';
    
    
    try {
        xhr = getXHR();
        
        if (method == 'GET') {
            if (data) {
                url += (url.indexOf('?') >= 0 ? '&' : '?') + data;
                data = null;
            }
            if(options['noCache'])
                url += (url.indexOf('?') >= 0 ? '&' : '?') + 'b' + (+ new Date) + '=1';
        }
        
        if (username) {
            xhr.open(method, url, async, username, password);
        } else {
            xhr.open(method, url, async);
        }
        
        if (async) {
            xhr.onreadystatechange = stateChangeHandler;
        }
        
        // 在open之后再进行http请求头设定
        // FIXME 是否需要添加; charset=UTF-8呢
        if (method == 'POST') {
            xhr.setRequestHeader("Content-Type",
                (headers['Content-Type'] || "application/x-www-form-urlencoded"));
        }
        
        for (key in headers) {
            if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }
        
        fire('beforerequest');

        if (timeout) {
          tick = setTimeout(function(){
            xhr.onreadystatechange = baidu.fn.blank;
            xhr.abort();
            fire("timeout");
          }, timeout);
        }
        xhr.send(data);
        
        if (!async) {
            stateChangeHandler();
        }
    } catch (ex) {
        fire('failure');
    }
    
    return xhr;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/url.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/16
 */


/**
 * 操作url的方法
 * @namespace baidu.url
 */
baidu.url = baidu.url || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 对字符串进行%#&+=以及和\s匹配的所有字符进行url转义
 * @name baidu.url.escapeSymbol
 * @function
 * @grammar baidu.url.escapeSymbol(source)
 * @param {string} source 需要转义的字符串.
 * @return {string} 转义之后的字符串.
 * @remark
 * 用于get请求转义。在服务器只接受gbk，并且页面是gbk编码时，可以经过本转义后直接发get请求。
 *
 * @return {string} 转义后的字符串
 */
baidu.url.escapeSymbol = function(source) {
    
    //TODO: 之前使用\s来匹配任意空白符
    //发现在ie下无法匹配中文全角空格和纵向指标符\v，所以改\s为\f\r\n\t\v以及中文全角空格和英文空格
    //但是由于ie本身不支持纵向指标符\v,故去掉对其的匹配，保证各浏览器下效果一致
    return String(source).replace(/[#%&+=\/\\\ \　\f\r\n\t]/g, function(all) {
        return '%' + (0x100 + all.charCodeAt()).toString(16).substring(1).toUpperCase();
    });
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/ajax/form.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */





/**
 * 将一个表单用ajax方式提交
 * @name baidu.ajax.form
 * @function
 * @grammar baidu.ajax.form(form[, options])
 * @param {HTMLFormElement} form             需要提交的表单元素
 * @param {Object} 	[options] 					发送请求的选项参数
 * @config {Boolean} [async] 			是否异步请求。默认为true（异步）
 * @config {String} 	[username] 			用户名
 * @config {String} 	[password] 			密码
 * @config {Object} 	[headers] 			要设置的http request header
 * @config {Function} [replacer] 			对参数值特殊处理的函数,replacer(string value, string key)
 * @config {Function} [onbeforerequest] 	发送请求之前触发，function(XMLHttpRequest xhr)。
 * @config {Function} [onsuccess] 		请求成功时触发，function(XMLHttpRequest xhr, string responseText)。
 * @config {Function} [onfailure] 		请求失败时触发，function(XMLHttpRequest xhr)。
 * @config {Function} [on{STATUS_CODE}] 	当请求为相应状态码时触发的事件，如on302、on404、on500，function(XMLHttpRequest xhr)。3XX的状态码浏览器无法获取，4xx的，可能因为未知问题导致获取失败。
	
 * @see baidu.ajax.request
 *             
 * @returns {XMLHttpRequest} 发送请求的XMLHttpRequest对象
 */
baidu.ajax.form = function (form, options) {
    options = options || {};
    var elements    = form.elements,
        len         = elements.length,
        method      = form.getAttribute('method'),
        url         = form.getAttribute('action'),
        replacer    = options.replacer || function (value, name) {
            return value;
        },
        sendOptions = {},
        data = [],
        i, item, itemType, itemName, itemValue, 
        opts, oi, oLen, oItem;
        
    /**
     * 向缓冲区添加参数数据
     * @private
     */
    function addData(name, value) {
        data.push(name + '=' + value);
    }
    
    // 复制发送参数选项对象
    for (i in options) {
        if (options.hasOwnProperty(i)) {
            sendOptions[i] = options[i];
        }
    }
    
    for (i = 0; i < len; i++) {
        item = elements[i];
        itemName = item.name;
        
        // 处理：可用并包含表单name的表单项
        if (!item.disabled && itemName) {
            itemType = item.type;
            itemValue = baidu.url.escapeSymbol(item.value);
        
            switch (itemType) {
            // radio和checkbox被选中时，拼装queryString数据
            case 'radio':
            case 'checkbox':
                if (!item.checked) {
                    break;
                }
                
            // 默认类型，拼装queryString数据
            case 'textarea':
            case 'text':
            case 'password':
            case 'hidden':
            case 'select-one':
                addData(itemName, replacer(itemValue, itemName));
                break;
                
            // 多行选中select，拼装所有选中的数据
            case 'select-multiple':
                opts = item.options;
                oLen = opts.length;
                for (oi = 0; oi < oLen; oi++) {
                    oItem = opts[oi];
                    if (oItem.selected) {
                        addData(itemName, replacer(oItem.value, itemName));
                    }
                }
                break;
            }
        }
    }
    
    // 完善发送请求的参数选项
    sendOptions.data = data.join('&');
    sendOptions.method = form.getAttribute('method') || 'GET';
    
    // 发送请求
    return baidu.ajax.request(url, sendOptions);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/ajax/get.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */




/**
 * 发送一个get请求
 * @name baidu.ajax.get
 * @function
 * @grammar baidu.ajax.get(url[, onsuccess])
 * @param {string} 	url 		发送请求的url地址
 * @param {Function} [onsuccess] 请求成功之后的回调函数，function(XMLHttpRequest xhr, string responseText)
 * @meta standard
 * @see baidu.ajax.post,baidu.ajax.request
 *             
 * @returns {XMLHttpRequest} 	发送请求的XMLHttpRequest对象
 */
baidu.ajax.get = function (url, onsuccess) {
    return baidu.ajax.request(url, {'onsuccess': onsuccess});
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/ajax/post.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */




/**
 * 发送一个post请求
 * @name baidu.ajax.post
 * @function
 * @grammar baidu.ajax.post(url, data[, onsuccess])
 * @param {string} 	url 		发送请求的url地址
 * @param {string} 	data 		发送的数据
 * @param {Function} [onsuccess] 请求成功之后的回调函数，function(XMLHttpRequest xhr, string responseText)
 * @meta standard
 * @see baidu.ajax.get,baidu.ajax.request
 *             
 * @returns {XMLHttpRequest} 	发送请求的XMLHttpRequest对象
 */
baidu.ajax.post = function (url, data, onsuccess) {
    return baidu.ajax.request(
        url, 
        {
            'onsuccess': onsuccess,
            'method': 'POST',
            'data': data
        }
    );
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: baidu/array.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 操作数组的方法
 * @namespace baidu.array
 */

baidu.array = baidu.array || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/array/indexOf.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 查询数组中指定元素的索引位置
 * @name baidu.array.indexOf
 * @function
 * @grammar baidu.array.indexOf(source, match[, fromIndex])
 * @param {Array} source 需要查询的数组
 * @param {Any} match 查询项
 * @param {number} [fromIndex] 查询的起始位索引位置，如果为负数，则从source.length+fromIndex往后开始查找
 * @see baidu.array.find,baidu.array.lastIndexOf
 *             
 * @returns {number} 指定元素的索引位置，查询不到时返回-1
 */
baidu.array.indexOf = function (source, match, fromIndex) {
    var len = source.length,
        iterator = match;
        
    fromIndex = fromIndex | 0;
    if(fromIndex < 0){//小于0
        fromIndex = Math.max(0, len + fromIndex)
    }
    for ( ; fromIndex < len; fromIndex++) {
        if(fromIndex in source && source[fromIndex] === match) {
            return fromIndex;
        }
    }
    
    return -1;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 判断一个数组中是否包含给定元素
 * @name baidu.array.contains
 * @function
 * @grammar baidu.array.contains(source, obj)
 * @param {Array} source 需要判断的数组.
 * @param {Any} obj 要查找的元素.
 * @return {boolean} 判断结果.
 * @author berg
 */
baidu.array.contains = function(source, obj) {
    return (baidu.array.indexOf(source, obj) >= 0);
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/array/each.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 遍历数组中所有元素
 * @name baidu.array.each
 * @function
 * @grammar baidu.array.each(source, iterator[, thisObject])
 * @param {Array} source 需要遍历的数组
 * @param {Function} iterator 对每个数组元素进行调用的函数，该函数有两个参数，第一个为数组元素，第二个为数组索引值，function (item, index)。
 * @param {Object} [thisObject] 函数调用时的this指针，如果没有此参数，默认是当前遍历的数组
 * @remark
 * each方法不支持对Object的遍历,对Object的遍历使用baidu.object.each 。
 * @shortcut each
 * @meta standard
 *             
 * @returns {Array} 遍历的数组
 */
 
baidu.each = baidu.array.forEach = baidu.array.each = function (source, iterator, thisObject) {
    var returnValue, item, i, len = source.length;
    
    if ('function' == typeof iterator) {
        for (i = 0; i < len; i++) {
            item = source[i];
            //TODO
            //此处实现和标准不符合，标准中是这样说的：
            //If a thisObject parameter is provided to forEach, it will be used as the this for each invocation of the callback. If it is not provided, or is null, the global object associated with callback is used instead.
            returnValue = iterator.call(thisObject || source, item, i);
    
            if (returnValue === false) {
                break;
            }
        }
    }
    return source;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 清空一个数组
 * @name baidu.array.empty
 * @function
 * @grammar baidu.array.empty(source)
 * @param {Array} source 需要清空的数组.
 * @author berg
 */
baidu.array.empty = function(source) {
    source.length = 0;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断一个数组中是否所有元素都满足给定条件
 * @name baidu.array.every
 * @function
 * @grammar baidu.array.every(source, iterator[,thisObject])
 * @param {Array} source 需要判断的数组.
 * @param {Function} iterator 判断函数.
 * @param {Object} [thisObject] 函数调用时的this指针，如果没有此参数，默认是当前遍历的数组
 * @return {boolean} 判断结果.
 * @see baidu.array.some
 */
baidu.array.every = function(source, iterator, thisObject) {
    var i = 0,
        len = source.length;
    for (; i < len; i++) {
        if (i in source && !iterator.call(thisObject || source, source[i], i)) {
            return false;
        }
    }
    return true;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 从数组中筛选符合条件的元素
 * @name baidu.array.filter
 * @function
 * @grammar baidu.array.filter(source, iterator[, thisObject])
 * @param {Array} source 需要筛选的数组
 * @param {Function} iterator 对每个数组元素进行筛选的函数，该函数有两个参数，第一个为数组元素，第二个为数组索引值，function (item, index)，函数需要返回true或false
 * @param {Object} [thisObject] 函数调用时的this指针，如果没有此参数，默认是当前遍历的数组
 * @meta standard
 * @see baidu.array.find
 *             
 * @returns {Array} 符合条件的数组项集合
 */

baidu.array.filter = function (source, iterator, thisObject) {
    var result = [],
        resultIndex = 0,
        len = source.length,
        item,
        i;
    
    if ('function' == typeof iterator) {
        for (i = 0; i < len; i++) {
            item = source[i];
            //TODO
            //和标准不符，see array.each
            if (true === iterator.call(thisObject || source, item, i)) {
                // resultIndex用于优化对result.length的多次读取
                result[resultIndex++] = item;
            }
        }
    }
    
    return result;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/array/find.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 从数组中寻找符合条件的第一个元素
 * @name baidu.array.find
 * @function
 * @grammar baidu.array.find(source, iterator)
 * @param {Array} source 需要查找的数组
 * @param {Function} iterator 对每个数组元素进行查找的函数，该函数有两个参数，第一个为数组元素，第二个为数组索引值，function (item, index)，函数需要返回true或false
 * @see baidu.array.filter,baidu.array.indexOf
 *             
 * @returns {Any|null} 符合条件的第一个元素，找不到时返回null
 */
baidu.array.find = function (source, iterator) {
    var item, i, len = source.length;
    
    if ('function' == typeof iterator) {
        for (i = 0; i < len; i++) {
            item = source[i];
            if (true === iterator.call(source, item, i)) {
                return item;
            }
        }
    }
    
    return null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 将两个数组参数合并成一个类似hashMap结构的对象，这个对象使用第一个数组做为key，使用第二个数组做为值，如果第二个参数未指定，则把对象的所有值置为true。
 * @name baidu.array.hash
 * @function
 * @grammar baidu.array.hash(keys[, values])
 * @param {Array} keys 作为key的数组
 * @param {Array} [values] 作为value的数组，未指定此参数时，默认值将对象的值都设为true。
 *             
 * @returns {Object} 合并后的对象{key : value}
 */
baidu.array.hash = function(keys, values) {
    var o = {}, vl = values && values.length, i = 0, l = keys.length;
    for (; i < l; i++) {
        o[keys[i]] = (vl && vl > i) ? values[i] : true;
    }
    return o;
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/array/lastIndexOf.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/14
 */



/**
 * 从后往前，查询数组中指定元素的索引位置
 * @name baidu.array.lastIndexOf
 * @function
 * @grammar baidu.array.lastIndexOf(source, match)
 * @param {Array} source 需要查询的数组
 * @param {Any} match 查询项
 * @param {number} [fromIndex] 查询的起始位索引位置，如果为负数，则从source.length+fromIndex往前开始查找
 * @see baidu.array.indexOf
 *             
 * @returns {number} 指定元素的索引位置，查询不到时返回-1
 */

baidu.array.lastIndexOf = function (source, match, fromIndex) {
    var len = source.length;

    fromIndex = fromIndex | 0;

    if(!fromIndex || fromIndex >= len){
        fromIndex = len - 1;
    }
    if(fromIndex < 0){
        fromIndex += len;
    }
    for(; fromIndex >= 0; fromIndex --){
        if(fromIndex in source && source[fromIndex] === match){
            return fromIndex;
        }
    }
    
    return -1;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 遍历数组中所有元素，将每一个元素应用方法进行转换，并返回转换后的新数组。
 * @name baidu.array.map
 * @function
 * @grammar baidu.array.map(source, iterator[, thisObject])
 * @param {Array}    source   需要遍历的数组.
 * @param {Function} iterator 对每个数组元素进行处理的函数.
 * @param {Object} [thisObject] 函数调用时的this指针，如果没有此参数，默认是当前遍历的数组
 * @return {Array} map后的数组.
 * @see baidu.array.reduce
 */
baidu.array.map = function(source, iterator, thisObject) {
    var results = [],
        i = 0,
        l = source.length;
    for (; i < l; i++) {
        results[i] = iterator.call(thisObject || source, source[i], i);
    }
    return results;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 遍历数组中所有元素，将每一个元素应用方法进行合并，并返回合并后的结果。
 * @name baidu.array.reduce
 * @function
 * @grammar baidu.array.reduce(source, iterator[, initializer])
 * @param {Array}    source 需要遍历的数组.
 * @param {Function} iterator 对每个数组元素进行处理的函数，函数接受四个参数：上一次reduce的结果（或初始值），当前元素值，索引值，整个数组.
 * @param {Object}   [initializer] 合并的初始项，如果没有此参数，默认用数组中的第一个值作为初始值.
 * @return {Array} reduce后的值.
 * @version 1.3.4
 * @see baidu.array.reduce
 */
baidu.array.reduce = function(source, iterator, initializer) {
    var i = 0,
        l = source.length,
        found = 0;

    if( arguments.length < 3){
        //没有initializer的情况，找到第一个可用的值
        for(; i < l; i++){
            initializer = source[i++];
            found = 1;
            break;
        }
        if(!found){
            return ;
        }
    }

    for (; i < l; i++) {
        if( i in source){
            initializer = iterator(initializer, source[i] , i , source);
        }
    }
    return initializer;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/array/remove.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/30
 */



/**
 * 移除数组中的项
 * @name baidu.array.remove
 * @function
 * @grammar baidu.array.remove(source, match)
 * @param {Array} source 需要移除项的数组
 * @param {Any} match 要移除的项
 * @meta standard
 * @see baidu.array.removeAt
 *             
 * @returns {Array} 移除后的数组
 */
baidu.array.remove = function (source, match) {
    var len = source.length;
        
    while (len--) {
        if (len in source && source[len] === match) {
            source.splice(len, 1);
        }
    }
    return source;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/array/removeAt.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/30
 */



/**
 * 移除数组中的项
 * @name baidu.array.removeAt
 * @function
 * @grammar baidu.array.removeAt(source, index)
 * @param {Array} source 需要移除项的数组
 * @param {number} index 要移除项的索引位置
 * @see baidu.array.remove
 * @meta standard
 * @returns {Any} 被移除的数组项
 */
baidu.array.removeAt = function (source, index) {
    return source.splice(index, 1)[0];
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断一个数组中是否有部分元素满足给定条件
 * @name baidu.array.some
 * @function
 * @grammar baidu.array.some(source, iterator[,thisObject])
 * @param {Array} source 需要判断的数组.
 * @param {Function} iterator 判断函数.
 * @param {Object} [thisObject] 函数调用时的this指针，如果没有此参数，默认是当前遍历的数组
 * @return {boolean} 判断结果.
 * @see baidu.array.every
 */
baidu.array.some = function(source, iterator, thisObject) {
    var i = 0,
        len = source.length;
    for (; i < len; i++) {
        if (i in source && iterator.call(thisObject || source, source[i], i)) {
            return true;
        }
    }
    return false;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/array/unique.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 过滤数组中的相同项。如果两个元素相同，会删除后一个元素。
 * @name baidu.array.unique
 * @function
 * @grammar baidu.array.unique(source[, compareFn])
 * @param {Array} source 需要过滤相同项的数组
 * @param {Function} [compareFn] 比较两个数组项是否相同的函数,两个数组项作为函数的参数。
 *             
 * @returns {Array} 过滤后的新数组
 */
baidu.array.unique = function (source, compareFn) {
    var len = source.length,
        result = source.slice(0),
        i, datum;
        
    if ('function' != typeof compareFn) {
        compareFn = function (item1, item2) {
            return item1 === item2;
        };
    }
    
    // 从后往前双重循环比较
    // 如果两个元素相同，删除后一个
    while (--len > 0) {
        datum = result[len];
        i = len;
        while (i--) {
            if (compareFn(datum, result[i])) {
                result.splice(len, 1);
                break;
            }
        }
    }

    return result;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */


/**
 * 对异步调用的封装
 * @namespace baidu.async
 * @author rocy
 */
baidu.async = baidu.async || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/object.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */


/**
 * 操作原生对象的方法
 * @namespace baidu.object
 */
baidu.object = baidu.object || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 将源对象的所有属性拷贝到目标对象中
 * @author erik
 * @name baidu.object.extend
 * @function
 * @grammar baidu.object.extend(target, source)
 * @param {Object} target 目标对象
 * @param {Object} source 源对象
 * @see baidu.array.merge
 * @remark
 * 
1.目标对象中，与源对象key相同的成员将会被覆盖。<br>
2.源对象的prototype成员不会拷贝。
		
 * @shortcut extend
 * @meta standard
 *             
 * @returns {Object} 目标对象
 */
baidu.extend =
baidu.object.extend = function (target, source) {
    for (var p in source) {
        if (source.hasOwnProperty(p)) {
            target[p] = source[p];
        }
    }
    
    return target;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */


/**
 * 对语言层面的封装，包括类型判断、模块扩展、继承基类以及对象自定义事件的支持。
 * @namespace baidu.lang
 */
baidu.lang = baidu.lang || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/isFunction.js
 * author: rocy
 * version: 1.1.2
 * date: 2010/06/12
 */



/**
 * 判断目标参数是否为function或Function实例
 * @name baidu.lang.isFunction
 * @function
 * @grammar baidu.lang.isFunction(source)
 * @param {Any} source 目标参数
 * @version 1.2
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isArray,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 * @meta standard
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isFunction = function (source) {
    // chrome下,'function' == typeof /a/ 为true.
    return '[object Function]' == Object.prototype.toString.call(source);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断给定object是否包含Deferred主要特征.
 * @param {Object} obj 待判定object.
 * @return {Boolean} 判定结果, true 则该object符合Deferred特征.
 * @private 
 * @author rocy
 */
baidu.async._isDeferred = function(obj) {
    var isFn = baidu.lang.isFunction;
    return obj && isFn(obj.success) && isFn(obj.then)
        && isFn(obj.fail) && isFn(obj.cancel);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */






/**
 * 用于支持异步处理, 使同步异步的调用风格统一.
 * @class
 * @private
 * @grammar new baidu.async.Deferred()
 * @remark
 * 示例:
    function someAsync(){
        var deferred = new baidu.async.Deferred();
        setTimeout(function(){
            afterSomeOperation();
            if(someReason){
                deferred.resolve(someValue);
            } else {
                deferred.reject(someError);
            }
        },100);
        return deferred;
    }
    //用类似同步的方式调用异步操作.
    someAsync().then(onSuccess, onFail);
    //onSuccess或onFail可以确保在正确的时间点执行.

 * @author rocy
 */
baidu.async.Deferred = function() {
    var me = this;
    baidu.extend(me, {
        _fired: 0,
        _firing: 0,
        _cancelled: 0,
        _resolveChain: [],
        _rejectChain: [],
        _result: [],
        _isError: 0
    });

    function fire() {
        if (me._cancelled || me._firing) {
            return;
        }
        //如果已有nextDeferred对象,则转移到nextDeferred上.
        if (me._nextDeferred) {
            me._nextDeferred.then(me._resolveChain[0], me._rejectChain[0]);
            return;
        }
        me._firing = 1;
        var chain = me._isError ? me._rejectChain : me._resolveChain,
            result = me._result[me._isError ? 1 : 0];
        // 此处使用while而非for循环,是为了避免firing时插入新函数.
        while (chain[0] && (! me._cancelled)) {
            //所有函数仅调用一次.
            //TODO: 支持传入 this 和 arguments, 而不是仅仅一个值.
            try {
                var chainResult = chain.shift().call(me, result);
                //若方法返回Deferred,则将剩余方法延至Deferred中执行
                if (baidu.async._isDeferred(chainResult)) {
                    me._nextDeferred = chainResult;
                    [].push.apply(chainResult._resolveChain, me._resolveChain);
                    [].push.apply(chainResult._rejectChain, me._rejectChain);
                    chain = me._resolveChain = [];
                    me._rejectChain = [];
                }
            } catch (error) {
                throw error;
            } finally {
                me._fired = 1;
                me._firing = 0;
            }
        }
    }


    /**
     * 调用onSuccess链.使用给定的value作为函数参数.
     * @param {*} value 成功结果.
     * @return {baidu.async.Deferred} this.
     */
    me.resolve = me.fireSuccess = function(value) {
        me._result[0] = value;
        fire();
        return me;
    };

    /**
     * 调用onFail链. 使用给定的error作为函数参数.
     * @param {Error} error 失败原因.
     * @return {baidu.async.Deferred} this.
     */
    me.reject = me.fireFail = function(error) {
        me._result[1] = error;
        me._isError = 1;
        fire();
        return me;
    };

    /**
     * 添加onSuccess和onFail方法到各自的链上. 如果该deferred已触发,则立即执行.
     * @param {Function} onSuccess 该deferred成功时的回调函数.第一个形参为成功时结果.
     * @param {Function} onFail 该deferred失败时的回调函数.第一个形参为失败时结果.
     * @return {baidu.async.Deferred} this.
     */
    me.then = function(onSuccess, onFail) {
        me._resolveChain.push(onSuccess);
        me._rejectChain.push(onFail);
        if (me._fired) {
            fire();
        }
        return me;
    };
    
    /**
     * 添加方法到onSuccess链上. 如果该deferred已触发,则立即执行.
     * @param {Function} onSuccess 该deferred成功时的回调函数.第一个形参为成功时结果.
     * @return {baidu.async.Deferred} this.
     */
    me.success = function(onSuccess) {
        return me.then(onSuccess, baidu.fn.blank);
    };

    /**
     * 添加方法到onFail链上. 如果该deferred已触发,则立即执行.
     * @param {Function} onFail 该deferred失败时的回调函数.第一个形参为失败时结果.
     * @return {baidu.async.Deferred} this.
     */
    me.fail = function(onFail) {
        return me.then(baidu.fn.blank, onFail);
    };
     
    /**
     * 中断该deferred, 使其失效.
     */
    me.cancel = function() {
        me._cancelled = 1;
    };
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 支持异步的ajax.get封装.
 * @grammar baidu.async.Deferred(url)
 * @param {String} url 请求地址.
 * @version 1.3.9 
 * @return {baidu.async.Deferred} Deferred对象,支持链式调用.
 */
baidu.async.get = function(url){
    var deferred = new baidu.async.Deferred();
    baidu.ajax.request(url, {
        onsuccess: function(xhr, responseText) {
            deferred.resolve({xhr: xhr, responseText: responseText}); 
        },
        onfailure: function(xhr) {
            deferred.reject({xhr: xhr});
        }
    });
    return deferred;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 支持异步的ajax.post封装.
 * @grammar baidu.async.post(url, data)
 * @param {String} url 请求地址.
 * @param {String} data 请求数据.
 * @version 1.3.9 
 * @return {baidu.async.Deferred} Deferred对象,支持链式调用.
 */
baidu.async.post = function(url, data){
    var deferred = new baidu.async.Deferred();
    baidu.ajax.request(url, {
        method: 'POST',
        data: data,
        onsuccess: function(xhr, responseText) {
            deferred.resolve({xhr: xhr, responseText: responseText}); 
        },
        onfailure: function(xhr) {
            deferred.reject({xhr: xhr});
        }
    });
    return deferred;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 保证onResolve或onReject可以按序执行. 若第一个参数为deferred,则deferred完成后执行.否则立即执行onResolve,并传入第一个参数.
 * @grammar baidu.async.when(deferredOrValue, onResolve, onReject)
 * @param {baidu.async.Deferred|*} deferredOrValue deferred实例或任意值.
 * @param {Function} onResolve 成功时的回调函数.若第一个参数不是Deferred实例,则立即执行此方法.
 * @param {Function} onReject 失败时的回调函数.
 * @version 1.3.9 
 * @remark
 * 示例一:异步调用: baidu.async.when(asyncLoad(), onResolve, onReject).then(nextSuccess, nextFail);
 * 示例二:同步异步不确定的调用: baidu.async.when(syncOrNot(), onResolve, onReject).then(nextSuccess, nextFail);
 * 示例三:同步接异步的调用: baidu.async.when(sync(), onResolve, onReject).then(asyncSuccess, asyncFail).then(afterAllSuccess, afterAllFail);
 * @return {baidu.async.Deferred} deferred.
 */
baidu.async.when = function(deferredOrValue, onResolve, onReject) {
    if (baidu.async._isDeferred(deferredOrValue)) {
        deferredOrValue.then(onResolve, onReject);
        return deferredOrValue;
    }
    var deferred = new baidu.async.Deferred();
    deferred.then(onResolve, onReject).resolve(deferredOrValue);
    return deferred;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/browser.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 判断浏览器类型和特性的属性
 * @namespace baidu.browser
 */
baidu.browser = baidu.browser || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为chrome浏览器
 * @grammar baidu.browser.chrome
 * @see baidu.browser.ie,baidu.browser.firefox,baidu.browser.safari,baidu.browser.opera   
 * @property chrome chrome版本号
 * @return {Number} chrome版本号
 */
baidu.browser.chrome = /chrome\/(\d+\.\d+)/i.test(navigator.userAgent) ? + RegExp['\x241'] : undefined;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为firefox浏览器
 * @property firefox firefox版本号
 * @grammar baidu.browser.firefox
 * @meta standard
 * @see baidu.browser.ie,baidu.browser.safari,baidu.browser.opera,baidu.browser.chrome
 * @return {Number} firefox版本号
 */
baidu.browser.firefox = /firefox\/(\d+\.\d+)/i.test(navigator.userAgent) ? + RegExp['\x241'] : undefined;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



//IE 8下，以documentMode为准
//在百度模板中，可能会有$，防止冲突，将$1 写成 \x241
/**
 * 判断是否为ie浏览器
 * @name baidu.browser.ie
 * @field
 * @grammar baidu.browser.ie
 * @returns {Number} IE版本号
 */
baidu.browser.ie = baidu.ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || + RegExp['\x241']) : undefined;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/browser/isGecko.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 判断是否为gecko内核
 * @property isGecko 
 * @grammar baidu.browser.isGecko
 * @meta standard
 * @see baidu.browser.isWebkit
 * @returns {Boolean} 布尔值
 */
baidu.browser.isGecko = /gecko/i.test(navigator.userAgent) && !/like gecko/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/browser/isStrict.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 判断是否严格标准的渲染模式
 * @property isStrict 
 * @grammar baidu.browser.isStrict
 * @meta standard
 * @returns {Boolean} 布尔值
 */
baidu.browser.isStrict = document.compatMode == "CSS1Compat";
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/browser/isWebkit.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 判断是否为webkit内核
 * @property isWebkit 
 * @grammar baidu.browser.isWebkit
 * @meta standard
 * @see baidu.browser.isGecko
 * @returns {Boolean} 布尔值
 */
baidu.browser.isWebkit = /webkit/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/browser/maxthon.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/23
 */



try {
    if (/(\d+\.\d+)/.test(external.max_version)) {
/**
 * 判断是否为maxthon浏览器
 * @property maxthon maxthon版本号
 * @grammar baidu.browser.maxthon
 * @see baidu.browser.ie
 * @returns {Number} maxthon版本号
 */
        baidu.browser.maxthon = + RegExp['\x241'];
    }
} catch (e) {}
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/browser/opera.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 判断是否为opera浏览器
 * @property opera opera版本号
 * @grammar baidu.browser.opera
 * @meta standard
 * @see baidu.browser.ie,baidu.browser.firefox,baidu.browser.safari,baidu.browser.chrome
 * @returns {Number} opera版本号
 */

/**
 * opera 从10开始不是用opera后面的字符串进行版本的判断
 * 在Browser identification最后添加Version + 数字进行版本标识
 * opera后面的数字保持在9.80不变
 */
baidu.browser.opera = /opera(\/| )(\d+(\.\d+)?)(.+?(version\/(\d+(\.\d+)?)))?/i.test(navigator.userAgent) ?  + ( RegExp["\x246"] || RegExp["\x242"] ) : undefined;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



(function(){
    var ua = navigator.userAgent;
    /*
     * 兼容浏览器为safari或ipad,其中,一段典型的ipad UA 如下:
     * Mozilla/5.0(iPad; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B314 Safari/531.21.10
     */
    
    /**
     * 判断是否为safari浏览器, 支持ipad
     * @property safari safari版本号
     * @grammar baidu.browser.safari
     * @meta standard
     * @see baidu.browser.ie,baidu.browser.firefox,baidu.browser.opera,baidu.browser.chrome   
     */
    baidu.browser.safari = /(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i.test(ua) && !/chrome/i.test(ua) ? + (RegExp['\x241'] || RegExp['\x242']) : undefined;
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/cookie.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */


/**
 * 操作cookie的方法
 * @namespace baidu.cookie
 */
baidu.cookie = baidu.cookie || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/cookie/_isValidKey.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 验证字符串是否合法的cookie键名
 * 
 * @param {string} source 需要遍历的数组
 * @meta standard
 * @return {boolean} 是否合法的cookie键名
 */
baidu.cookie._isValidKey = function (key) {
    // http://www.w3.org/Protocols/rfc2109/rfc2109
    // Syntax:  General
    // The two state management headers, Set-Cookie and Cookie, have common
    // syntactic properties involving attribute-value pairs.  The following
    // grammar uses the notation, and tokens DIGIT (decimal digits) and
    // token (informally, a sequence of non-special, non-white space
    // characters) from the HTTP/1.1 specification [RFC 2068] to describe
    // their syntax.
    // av-pairs   = av-pair *(";" av-pair)
    // av-pair    = attr ["=" value] ; optional value
    // attr       = token
    // value      = word
    // word       = token | quoted-string
    
    // http://www.ietf.org/rfc/rfc2068.txt
    // token      = 1*<any CHAR except CTLs or tspecials>
    // CHAR       = <any US-ASCII character (octets 0 - 127)>
    // CTL        = <any US-ASCII control character
    //              (octets 0 - 31) and DEL (127)>
    // tspecials  = "(" | ")" | "<" | ">" | "@"
    //              | "," | ";" | ":" | "\" | <">
    //              | "/" | "[" | "]" | "?" | "="
    //              | "{" | "}" | SP | HT
    // SP         = <US-ASCII SP, space (32)>
    // HT         = <US-ASCII HT, horizontal-tab (9)>
        
    return (new RegExp("^[^\\x00-\\x20\\x7f\\(\\)<>@,;:\\\\\\\"\\[\\]\\?=\\{\\}\\/\\u0080-\\uffff]+\x24")).test(key);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/cookie/getRaw.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 获取cookie的值，不对值进行解码
 * @name baidu.cookie.getRaw
 * @function
 * @grammar baidu.cookie.getRaw(key)
 * @param {string} key 需要获取Cookie的键名
 * @meta standard
 * @see baidu.cookie.get,baidu.cookie.setRaw
 *             
 * @returns {string|null} 获取的Cookie值，获取不到时返回null
 */
baidu.cookie.getRaw = function (key) {
    if (baidu.cookie._isValidKey(key)) {
        var reg = new RegExp("(^| )" + key + "=([^;]*)(;|\x24)"),
            result = reg.exec(document.cookie);
            
        if (result) {
            return result[2] || null;
        }
    }

    return null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/cookie/get.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 获取cookie的值，用decodeURIComponent进行解码
 * @name baidu.cookie.get
 * @function
 * @grammar baidu.cookie.get(key)
 * @param {string} key 需要获取Cookie的键名
 * @remark
 * <b>注意：</b>该方法会对cookie值进行decodeURIComponent解码。如果想获得cookie源字符串，请使用getRaw方法。
 * @meta standard
 * @see baidu.cookie.getRaw,baidu.cookie.set
 *             
 * @returns {string|null} cookie的值，获取不到时返回null
 */
baidu.cookie.get = function (key) {
    var value = baidu.cookie.getRaw(key);
    if ('string' == typeof value) {
        value = decodeURIComponent(value);
        return value;
    }
    return null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/cookie/setRaw.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 设置cookie的值，不对值进行编码
 * @name baidu.cookie.setRaw
 * @function
 * @grammar baidu.cookie.setRaw(key, value[, options])
 * @param {string} key 需要设置Cookie的键名
 * @param {string} value 需要设置Cookie的值
 * @param {Object} [options] 设置Cookie的其他可选参数
 * @config {string} [path] cookie路径
 * @config {Date|number} [expires] cookie过期时间,如果类型是数字的话, 单位是毫秒
 * @config {string} [domain] cookie域名
 * @config {string} [secure] cookie是否安全传输
 * @remark
 * 
<b>options参数包括：</b><br>
path:cookie路径<br>
expires:cookie过期时间，Number型，单位为毫秒。<br>
domain:cookie域名<br>
secure:cookie是否安全传输
		
 * @meta standard
 * @see baidu.cookie.set,baidu.cookie.getRaw
 */
baidu.cookie.setRaw = function (key, value, options) {
    if (!baidu.cookie._isValidKey(key)) {
        return;
    }
    
    options = options || {};
    //options.path = options.path || "/"; // meizz 20100402 设定一个初始值，方便后续的操作
    //berg 20100409 去掉，因为用户希望默认的path是当前路径，这样和浏览器对cookie的定义也是一致的
    
    // 计算cookie过期时间
    var expires = options.expires;
    if ('number' == typeof options.expires) {
        expires = new Date();
        expires.setTime(expires.getTime() + options.expires);
    }
    
    document.cookie =
        key + "=" + value
        + (options.path ? "; path=" + options.path : "")
        + (expires ? "; expires=" + expires.toGMTString() : "")
        + (options.domain ? "; domain=" + options.domain : "")
        + (options.secure ? "; secure" : ''); 
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/cookie/remove.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 删除cookie的值
 * @name baidu.cookie.remove
 * @function
 * @grammar baidu.cookie.remove(key, options)
 * @param {string} key 需要删除Cookie的键名
 * @param {Object} options 需要删除的cookie对应的 path domain 等值
 * @meta standard
 */
baidu.cookie.remove = function (key, options) {
    options = options || {};
    options.expires = new Date(0);
    baidu.cookie.setRaw(key, '', options);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/cookie/set.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 设置cookie的值，用encodeURIComponent进行编码
 * @name baidu.cookie.set
 * @function
 * @grammar baidu.cookie.set(key, value[, options])
 * @param {string} key 需要设置Cookie的键名
 * @param {string} value 需要设置Cookie的值
 * @param {Object} [options] 设置Cookie的其他可选参数
 * @config {string} [path] cookie路径
 * @config {Date|number} [expires] cookie过期时间,如果类型是数字的话, 单位是毫秒
 * @config {string} [domain] cookie域名
 * @config {string} [secure] cookie是否安全传输
 * @remark
 * 
1. <b>注意：</b>该方法会对cookie值进行encodeURIComponent编码。如果想设置cookie源字符串，请使用setRaw方法。<br><br>
2. <b>options参数包括：</b><br>
path:cookie路径<br>
expires:cookie过期时间，Number型，单位为毫秒。<br>
domain:cookie域名<br>
secure:cookie是否安全传输
		
 * @meta standard
 * @see baidu.cookie.setRaw,baidu.cookie.get
 */
baidu.cookie.set = function (key, value, options) {
    baidu.cookie.setRaw(key, encodeURIComponent(value), options);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/date.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/04
 */


/**
 * 操作日期的方法
 * @namespace baidu.date
 */
baidu.date = baidu.date || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/number.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/2
 */


/**
 * 操作number的方法
 * @namespace baidu.number
 */
baidu.number = baidu.number || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/number/pad.js
 * author: dron, erik, berg
 * version: 1.1.0
 * date: 20100412
 */



/**
 * 对目标数字进行0补齐处理
 * @name baidu.number.pad
 * @function
 * @grammar baidu.number.pad(source, length)
 * @param {number} source 需要处理的数字
 * @param {number} length 需要输出的长度
 *             
 * @returns {string} 对目标数字进行0补齐处理后的结果
 */
baidu.number.pad = function (source, length) {
    var pre = "",
        negative = (source < 0),
        string = String(Math.abs(source));

    if (string.length < length) {
        pre = (new Array(length - string.length + 1)).join('0');
    }

    return (negative ?  "-" : "") + pre + string;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/date/format.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/04
 */




/**
 * 对目标日期对象进行格式化
 * @name baidu.date.format
 * @function
 * @grammar baidu.date.format(source, pattern)
 * @param {Date} source 目标日期对象
 * @param {string} pattern 日期格式化规则
 * @remark
 * 
<b>格式表达式，变量含义：</b><br><br>
hh: 带 0 补齐的两位 12 进制时表示<br>
h: 不带 0 补齐的 12 进制时表示<br>
HH: 带 0 补齐的两位 24 进制时表示<br>
H: 不带 0 补齐的 24 进制时表示<br>
mm: 带 0 补齐两位分表示<br>
m: 不带 0 补齐分表示<br>
ss: 带 0 补齐两位秒表示<br>
s: 不带 0 补齐秒表示<br>
yyyy: 带 0 补齐的四位年表示<br>
yy: 带 0 补齐的两位年表示<br>
MM: 带 0 补齐的两位月表示<br>
M: 不带 0 补齐的月表示<br>
dd: 带 0 补齐的两位日表示<br>
d: 不带 0 补齐的日表示
		
 *             
 * @returns {string} 格式化后的字符串
 */

baidu.date.format = function (source, pattern) {
    if ('string' != typeof pattern) {
        return source.toString();
    }

    function replacer(patternPart, result) {
        pattern = pattern.replace(patternPart, result);
    }
    
    var pad     = baidu.number.pad,
        year    = source.getFullYear(),
        month   = source.getMonth() + 1,
        date2   = source.getDate(),
        hours   = source.getHours(),
        minutes = source.getMinutes(),
        seconds = source.getSeconds();

    replacer(/yyyy/g, pad(year, 4));
    replacer(/yy/g, pad(parseInt(year.toString().slice(2), 10), 2));
    replacer(/MM/g, pad(month, 2));
    replacer(/M/g, month);
    replacer(/dd/g, pad(date2, 2));
    replacer(/d/g, date2);

    replacer(/HH/g, pad(hours, 2));
    replacer(/H/g, hours);
    replacer(/hh/g, pad(hours % 12, 2));
    replacer(/h/g, hours % 12);
    replacer(/mm/g, pad(minutes, 2));
    replacer(/m/g, minutes);
    replacer(/ss/g, pad(seconds, 2));
    replacer(/s/g, seconds);

    return pattern;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/date/parse.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/04
 */



/**
 * 将目标字符串转换成日期对象
 * @name baidu.date.parse
 * @function
 * @grammar baidu.date.parse(source)
 * @param {string} source 目标字符串
 * @remark
 * 
对于目标字符串，下面这些规则决定了 parse 方法能够成功地解析： <br>
<ol>
<li>短日期可以使用“/”或“-”作为日期分隔符，但是必须用月/日/年的格式来表示，例如"7/20/96"。</li>
<li>以 "July 10 1995" 形式表示的长日期中的年、月、日可以按任何顺序排列，年份值可以用 2 位数字表示也可以用 4 位数字表示。如果使用 2 位数字来表示年份，那么该年份必须大于或等于 70。 </li>
<li>括号中的任何文本都被视为注释。这些括号可以嵌套使用。 </li>
<li>逗号和空格被视为分隔符。允许使用多个分隔符。 </li>
<li>月和日的名称必须具有两个或两个以上的字符。如果两个字符所组成的名称不是独一无二的，那么该名称就被解析成最后一个符合条件的月或日。例如，"Ju" 被解释为七月而不是六月。 </li>
<li>在所提供的日期中，如果所指定的星期几的值与按照该日期中剩余部分所确定的星期几的值不符合，那么该指定值就会被忽略。例如，尽管 1996 年 11 月 9 日实际上是星期五，"Tuesday November 9 1996" 也还是可以被接受并进行解析的。但是结果 date 对象中包含的是 "Friday November 9 1996"。 </li>
<li>JScript 处理所有的标准时区，以及全球标准时间 (UTC) 和格林威治标准时间 (GMT)。</li> 
<li>小时、分钟、和秒钟之间用冒号分隔，尽管不是这三项都需要指明。"10:"、"10:11"、和 "10:11:12" 都是有效的。 </li>
<li>如果使用 24 小时计时的时钟，那么为中午 12 点之后的时间指定 "PM" 是错误的。例如 "23:15 PM" 就是错误的。</li> 
<li>包含无效日期的字符串是错误的。例如，一个包含有两个年份或两个月份的字符串就是错误的。</li>
</ol>
		
 *             
 * @returns {Date} 转换后的日期对象
 */

baidu.date.parse = function (source) {
    var reg = new RegExp("^\\d+(\\-|\\/)\\d+(\\-|\\/)\\d+\x24");
    if ('string' == typeof source) {
        if (reg.test(source) || isNaN(Date.parse(source))) {
            var d = source.split(/ |T/),
                d1 = d.length > 1 
                        ? d[1].split(/[^\d]/) 
                        : [0, 0, 0],
                d0 = d[0].split(/[^\d]/);
            return new Date(d0[0] - 0, 
                            d0[1] - 1, 
                            d0[2] - 0, 
                            d1[0] - 0, 
                            d1[1] - 0, 
                            d1[2] - 0);
        } else {
            return new Date(source);
        }
    }
    
    return new Date();
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */


/**
 * 操作dom的方法
 * @namespace baidu.dom 
 */
baidu.dom = baidu.dom || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: baidu/dom/g.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 从文档中获取指定的DOM元素
 * @name baidu.dom.g
 * @function
 * @grammar baidu.dom.g(id)
 * @param {string|HTMLElement} id 元素的id或DOM元素.
 * @shortcut g,T.G
 * @meta standard
 * @see baidu.dom.q
 *
 * @return {HTMLElement|null} 获取的元素，查找不到时返回null,如果参数不合法，直接返回参数.
 */
baidu.dom.g = function(id) {
    if (!id) return null; //修改IE下baidu.dom.g(baidu.dom.g('dose_not_exist_id'))报错的bug，by Meizz, dengping
    if ('string' == typeof id || id instanceof String) {
        return document.getElementById(id);
    } else if (id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
        return id;
    }
    return null;
};

// 声明快捷方法
baidu.g = baidu.G = baidu.dom.g;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */


/**
 * 操作字符串的方法
 * @namespace baidu.string
 */
baidu.string = baidu.string || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/trim.js
 * author: dron, erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 删除目标字符串两端的空白字符
 * @name baidu.string.trim
 * @function
 * @grammar baidu.string.trim(source)
 * @param {string} source 目标字符串
 * @remark
 * 不支持删除单侧空白字符
 * @shortcut trim
 * @meta standard
 *             
 * @returns {string} 删除两端空白字符后的字符串
 */

(function () {
    var trimer = new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g");
    
    baidu.string.trim = function (source) {
        return String(source)
                .replace(trimer, "");
    };
})();

// 声明快捷方法
baidu.trim = baidu.string.trim;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All right reserved.
 * 
 * path: baidu/dom/addClass.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/2
 */




/**
 * 为目标元素添加className
 * @name baidu.dom.addClass
 * @function
 * @grammar baidu.dom.addClass(element, className)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} className 要添加的className，允许同时添加多个class，中间使用空白符分隔
 * @remark
 * 使用者应保证提供的className合法性，不应包含不合法字符，className合法字符参考：http://www.w3.org/TR/CSS2/syndata.html。
 * @shortcut addClass
 * @meta standard
 * @see baidu.dom.removeClass
 * 	
 * 	            
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.addClass = function (element, className) {
    element = baidu.dom.g(element);
    var classArray = className.split(/\s+/),
        result = element.className,
        classMatch = " " + result + " ",
        i = 0,
        l = classArray.length;

    for (; i < l; i++){
         if ( classMatch.indexOf( " " + classArray[i] + " " ) < 0 ) {
             result += (result ? ' ' : '') + classArray[i];
         }
    }

    element.className = result;
    return element;
};

// 声明快捷方法
baidu.addClass = baidu.dom.addClass;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/children.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */




/**
 * 获取目标元素的直接子元素列表
 * @name baidu.dom.children
 * @function
 * @grammar baidu.dom.children(element)
 * @param {HTMLElement|String} element 目标元素或目标元素的id
 * @meta standard
 *             
 * @returns {Array} 目标元素的子元素列表，没有子元素时返回空数组
 */
baidu.dom.children = function (element) {
    element = baidu.dom.g(element);

    for (var children = [], tmpEl = element.firstChild; tmpEl; tmpEl = tmpEl.nextSibling) {
        if (tmpEl.nodeType == 1) {
            children.push(tmpEl);
        }
    }
    
    return children;    
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/isString.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/30
 */



/**
 * 判断目标参数是否string类型或String对象
 * @name baidu.lang.isString
 * @function
 * @grammar baidu.lang.isString(source)
 * @param {Any} source 目标参数
 * @shortcut isString
 * @meta standard
 * @see baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isArray,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isString = function (source) {
    return '[object String]' == Object.prototype.toString.call(source);
};

// 声明快捷方法
baidu.isString = baidu.lang.isString;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/g.js
 * author: allstar, erik, berg
 * version: 1.3
 * date: 2010-07-07
 */




/**
 * 从文档中获取指定的DOM元素
 * **内部方法**
 * 
 * @param {string|HTMLElement} id 元素的id或DOM元素
 * @meta standard
 * @return {HTMLElement} DOM元素，如果不存在，返回null，如果参数不合法，直接返回参数
 */
baidu.dom._g = function (id) {
    if (baidu.lang.isString(id)) {
        return document.getElementById(id);
    }
    return id;
};

// 声明快捷方法
baidu._g = baidu.dom._g;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/contains.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 判断一个元素是否包含另一个元素
 * @name baidu.dom.contains
 * @function
 * @grammar baidu.dom.contains(container, contained)
 * @param {HTMLElement|string} container 包含元素或元素的id
 * @param {HTMLElement|string} contained 被包含元素或元素的id
 * @meta standard
 * @see baidu.dom.intersect
 *             
 * @returns {boolean} contained元素是否被包含于container元素的DOM节点上
 */
baidu.dom.contains = function (container, contained) {

    var g = baidu.dom._g;
    container = g(container);
    contained = g(contained);

    //fixme: 无法处理文本节点的情况(IE)
    return container.contains
        ? container != contained && container.contains(contained)
        : !!(container.compareDocumentPosition(contained) & 16);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_NAME_ATTRS.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/2
 */




/**
 * 提供给setAttr与getAttr方法作名称转换使用
 * ie6,7下class要转换成className
 * @meta standard
 */

baidu.dom._NAME_ATTRS = (function () {
    var result = {
        'cellpadding': 'cellPadding',
        'cellspacing': 'cellSpacing',
        'colspan': 'colSpan',
        'rowspan': 'rowSpan',
        'valign': 'vAlign',
        'usemap': 'useMap',
        'frameborder': 'frameBorder'
    };
    
    if (baidu.browser.ie < 8) {
        result['for'] = 'htmlFor';
        result['class'] = 'className';
    } else {
        result['htmlFor'] = 'for';
        result['className'] = 'class';
    }
    
    return result;
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/setAttr.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */




/**
 * 设置目标元素的attribute值
 * @name baidu.dom.setAttr
 * @function
 * @grammar baidu.dom.setAttr(element, key, value)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} key 要设置的attribute键名
 * @param {string} value 要设置的attribute值
 * @remark
 * 
            设置object的自定义属性时，由于浏览器限制，无法设置。
        
 * @shortcut setAttr
 * @meta standard
 * @see baidu.dom.getAttr,baidu.dom.setAttrs
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.setAttr = function (element, key, value) {
    element = baidu.dom.g(element);

    if ('style' == key){
        element.style.cssText = value;
    } else {
        key = baidu.dom._NAME_ATTRS[key] || key;
        element.setAttribute(key, value);
    }

    return element;
};

// 声明快捷方法
baidu.setAttr = baidu.dom.setAttr;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/setAttrs.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */




/**
 * 批量设置目标元素的attribute值
 * @name baidu.dom.setAttrs
 * @function
 * @grammar baidu.dom.setAttrs(element, attributes)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {Object} attributes 要设置的attribute集合
 * @shortcut setAttrs
 * @meta standard
 * @see baidu.dom.setAttr,baidu.dom.getAttr
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.setAttrs = function (element, attributes) {
    element = baidu.dom.g(element);

    for (var key in attributes) {
        baidu.dom.setAttr(element, key, attributes[key]);
    }

    return element;
};

// 声明快捷方法
baidu.setAttrs = baidu.dom.setAttrs;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All right reserved.
 */


/**
 * 创建 Element 对象。
 * @author berg
 * @name baidu.dom.create
 * @function
 * @grammar baidu.dom.create(tagName[, options])
 * @param {string} tagName 标签名称.
 * @param {Object} opt_attributes 元素创建时拥有的属性，如style和className.
 * @version 1.3
 * @meta standard
 * @returns {HTMLElement} 创建的 Element 对象
 */
baidu.dom.create = function(tagName, opt_attributes) {
    var el = document.createElement(tagName),
        attributes = opt_attributes || {};
    return baidu.dom.setAttrs(el, attributes);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/guid.js
 * author: meizz
 * version: 1.1.0
 * date: 2010/02/04
 */



/**
 * 返回一个当前页面的唯一标识字符串。
 * @name baidu.lang.guid
 * @function
 * @grammar baidu.lang.guid()
 * @version 1.1.1
 * @meta standard
 *             
 * @returns {String} 当前页面的唯一标识字符串
 */
baidu.lang.guid = function() {
    return "TANGRAM$" + baidu.$$._counter ++;
};

//不直接使用window，可以提高3倍左右性能
baidu.$$._counter = baidu.$$._counter || 1;


// 20111129	meizz	去除 _counter.toString(36) 这步运算，节约计算量
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/Class.js
 * author: meizz, erik
 * version: 1.1.0
 * date: 2009/12/1
 */



/**
 * Tangram继承机制提供的一个基类，用户可以通过继承baidu.lang.Class来获取它的属性及方法。
 * @class
 * @name 	baidu.lang.Class
 * @grammar baidu.lang.Class(guid)
 * @param 	{string}	guid	对象的唯一标识
 * @meta standard
 * @remark baidu.lang.Class和它的子类的实例均包含一个全局唯一的标识guid。guid是在构造函数中生成的，因此，继承自baidu.lang.Class的类应该直接或者间接调用它的构造函数。<br>baidu.lang.Class的构造函数中产生guid的方式可以保证guid的唯一性，及每个实例都有一个全局唯一的guid。
 * @meta standard
 * @see baidu.lang.inherits,baidu.lang.Event
 */
baidu.lang.Class = function() {
    this.guid = baidu.lang.guid();

    !this.__decontrolled && (baidu.$$._instances[this.guid] = this);
};

baidu.$$._instances = baidu.$$._instances || {};

/**
 * 释放对象所持有的资源，主要是自定义事件。
 * @name dispose
 * @grammar obj.dispose()
 * TODO: 将_listeners中绑定的事件剔除掉
 */
baidu.lang.Class.prototype.dispose = function(){
    delete baidu.$$._instances[this.guid];

    // this.__listeners && (for (var i in this.__listeners) delete this.__listeners[i]);

    for(var property in this){
        typeof this[property] != "function" && delete this[property];
    }
    this.disposed = true;   // 20100716
};

/**
 * 重载了默认的toString方法，使得返回信息更加准确一些。
 * 20111219 meizz 为支持老版本的className属性，以后统一改成 __type
 * @return {string} 对象的String表示形式
 */
baidu.lang.Class.prototype.toString = function(){
    return "[object " + (this.__type || this._className || "Object") + "]";
};

/**
 * 按唯一标识guid字符串取得实例对象
 *
 * @param   {String}    guid
 * @return  {object}            实例对象
 */
 window["baiduInstance"] = function(guid) {
     return baidu.$$._instances[guid];
 }

//  2011.11.23  meizz   添加 baiduInstance 这个全局方法，可以快速地通过guid得到实例对象
//  2011.11.22  meizz   废除创建类时指定guid的模式，guid只作为只读属性
//  2011.11.22  meizz   废除 baidu.lang._instances 模块，由统一的global机制完成；
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/Class/removeEventListener.js
 * author: meizz
 * version: 1.6.0
 * date: 2011/11/23
 * modify: 2011/11/23
 */



 
/**
 * 移除对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
 * 事件移除操作是一个不常用的方法，如果你有需求再import调入，可以节约代码
 * 可能通过参数走不同的分支：不传handler会移除某类事件监听；如果连type都不传那就移除当前实例的全部事件监听
 *
 * @grammar obj.removeEventListener(type, handler)
 * @param {string}   type     事件类型
 * @param {Function} handler  要移除的事件监听函数或者监听函数的key
 * @remark 	如果第二个参数handler没有被绑定到对应的自定义事件中，什么也不做。
 */
baidu.lang.Class.prototype.un =
baidu.lang.Class.prototype.removeEventListener = function (type, handler) {
    var i,
        t = this.__listeners;
    if (!t) return;

    // remove all event listener
    if (typeof type == "undefined") {
        for (i in t) {
            delete t[i];
        }
        return;
    }

    type.indexOf("on") && (type = "on" + type);

    // 移除某类事件监听
    if (typeof handler == "undefined") {
        delete t[type];
    } else if (t[type]) {
        // [TODO delete 2013] 支持按 key 删除注册的函数
        typeof handler=="string" && (handler=t[type][handler]) && delete t[type][handler];

        for (i = t[type].length - 1; i >= 0; i--) {
            if (t[type][i] === handler) {
                t[type].splice(i, 1);
            }
        }
    }
};

// 2011.12.19 meizz 为兼容老版本的按 key 删除，添加了一行代码
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/Event.js
 * author: meizz, erik, berg
 * version: 1.6.0
 * date: 2009/11/24
 * modify: 2011/11/24 meizz
 */





/**
 * 自定义的事件对象。
 * @class
 * @name 	baidu.lang.Event
 * @grammar baidu.lang.Event(type[, target])
 * @param 	{string} type	 事件类型名称。为了方便区分事件和一个普通的方法，事件类型名称必须以"on"(小写)开头。
 * @param 	{Object} [target]触发事件的对象
 * @meta standard
 * @remark 引入该模块，会自动为Class引入3个事件扩展方法：addEventListener、removeEventListener和dispatchEvent。
 * @meta standard
 * @see baidu.lang.Class
 */
baidu.lang.Event = function (type, target) {
    this.type = type;
    this.returnValue = true;
    this.target = target || null;
    this.currentTarget = null;
};
 
/**
 * 派发自定义事件，使得绑定到自定义事件上面的函数都会被执行。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
 * @grammar obj.dispatchEvent(event, options)
 * @param {baidu.lang.Event|String} event 	Event对象，或事件名称(1.1.1起支持)
 * @param {Object} 					options 扩展参数,所含属性键值会扩展到Event对象上(1.2起支持)
 * @remark 处理会调用通过addEventListenr绑定的自定义事件回调函数之外，还会调用直接绑定到对象上面的自定义事件。例如：<br>
myobj.onMyEvent = function(){}<br>
myobj.addEventListener("onMyEvent", function(){});
 */
baidu.lang.Class.prototype.fire =
baidu.lang.Class.prototype.dispatchEvent = function (event, options) {
    baidu.lang.isString(event) && (event = new baidu.lang.Event(event));

    !this.__listeners && (this.__listeners = {});

    // 20100603 添加本方法的第二个参数，将 options extend到event中去传递
    options = options || {};
    for (var i in options) {
        event[i] = options[i];
    }

    var i, n, me = this, t = me.__listeners, p = event.type;
    event.target = event.target || (event.currentTarget = me);

    // 支持非 on 开头的事件名
    p.indexOf("on") && (p = "on" + p);

    typeof me[p] == "function" && me[p].apply(me, arguments);

    if (typeof t[p] == "object") {
        for (i=0, n=t[p].length; i<n; i++) {
            t[p][i] && t[p][i].apply(me, arguments);
        }
    }
    return event.returnValue;
};

/**
 * 注册对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
 * @grammar obj.addEventListener(type, handler[, key])
 * @param   {string}   type         自定义事件的名称
 * @param   {Function} handler      自定义事件被触发时应该调用的回调函数
 * @return  {Function}              将用户注入的监听函数返回，以便移除事件监听，特别适用于匿名函数。
 * @remark  事件类型区分大小写。如果自定义事件名称不是以小写"on"开头，该方法会给它加上"on"再进行判断，即"click"和"onclick"会被认为是同一种事件。 
 */
baidu.lang.Class.prototype.on =
baidu.lang.Class.prototype.addEventListener = function (type, handler, key) {
    if (typeof handler != "function") {
        return;
    }

    !this.__listeners && (this.__listeners = {});

    var i, t = this.__listeners;

    type.indexOf("on") && (type = "on" + type);

    typeof t[type] != "object" && (t[type] = []);

    // 避免函数重复注册
    for (i = t[type].length - 1; i >= 0; i--) {
        if (t[type][i] === handler) return handler;
    };

    t[type].push(handler);

    // [TODO delete 2013] 2011.12.19 兼容老版本，2013删除此行
    key && typeof key == "string" && (t[type][key] = handler);

    return handler;
};

//  2011.12.19  meizz   很悲剧，第三个参数 key 还需要支持一段时间，以兼容老版本脚本
//  2011.11.24  meizz   事件添加监听方法 addEventListener 移除第三个参数 key，添加返回值 handler
//  2011.11.23  meizz   事件handler的存储对象由json改成array，以保证注册函数的执行顺序
//  2011.11.22  meizz   将 removeEventListener 方法分拆到 baidu.lang.Class.removeEventListener 中，以节约主程序代码
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/createSingle.js
 * author: meizz, berg
 * version: 1.1.2
 * date: 2010-05-13
 */






/**
 * 创建一个baidu.lang.Class的单例实例
 * @name baidu.lang.createSingle
 * @function
 * @grammar baidu.lang.createSingle(json)
 * @param {Object} json 直接挂载到这个单例里的预定属性/方法
 * @version 1.2
 * @see baidu.lang.Class
 *             
 * @returns {Object} 一个实例
 */
baidu.lang.createSingle = function (json) {
    var c = new baidu.lang.Class();

    for (var key in json) {
        c[key] = json[key];
    }
    return c;
};

/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/dragManager.js
 * author: rocy
 * version: 1.4.0
 * date: 2010/10/14
 */




/**
 * 拖曳管理器
 * @function
 * @param   {HTMLElement|ID}    element 被拖曳的元素
 * @param   {JSON}              options 拖曳配置项 {toggle, autoStop, interval, capture, range, ondragstart, ondragend, ondrag}
 * @return {DOMElement}                 可拖拽的元素
 * @private
 */
baidu.dom.ddManager = baidu.lang.createSingle({
	_targetsDroppingOver:{}
});
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getDocument.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 获取目标元素所属的document对象
 * @name baidu.dom.getDocument
 * @function
 * @grammar baidu.dom.getDocument(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @meta standard
 * @see baidu.dom.getWindow
 *             
 * @returns {HTMLDocument} 目标元素所属的document对象
 */
baidu.dom.getDocument = function (element) {
    element = baidu.dom.g(element);
    return element.nodeType == 9 ? element : element.ownerDocument || element.document;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 获取目标元素的computed style值。如果元素的样式值不能被浏览器计算，则会返回空字符串（IE）
 *
 * @author berg
 * @name baidu.dom.getComputedStyle
 * @function
 * @grammar baidu.dom.getComputedStyle(element, key)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} key 要获取的样式名
 *
 * @see baidu.dom.getStyle
 *             
 * @returns {string} 目标元素的computed style值
 */

baidu.dom.getComputedStyle = function(element, key){
    element = baidu.dom._g(element);
    var doc = baidu.dom.getDocument(element),
        styles;
    if (doc.defaultView && doc.defaultView.getComputedStyle) {
        styles = doc.defaultView.getComputedStyle(element, null);
        if (styles) {
            return styles[key] || styles.getPropertyValue(key);
        }
    }
    return ''; 
};

// 20111204 meizz   去掉一个无用的import baidu.browser.ie
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFixer.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 提供给setStyle与getStyle使用
 */
baidu.dom._styleFixer = baidu.dom._styleFixer || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFilters.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 提供给setStyle与getStyle使用
 */
baidu.dom._styleFilter = baidu.dom._styleFilter || [];

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFilter/filter.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 为获取和设置样式的过滤器
 * @private
 * @meta standard
 */
baidu.dom._styleFilter.filter = function (key, value, method) {
    for (var i = 0, filters = baidu.dom._styleFilter, filter; filter = filters[i]; i++) {
        if (filter = filter[method]) {
            value = filter(key, value);
        }
    }

    return value;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/toCamelCase.js
 * author: erik, berg
 * version: 1.2
 * date: 2010-06-22
 */



/**
 * 将目标字符串进行驼峰化处理
 * @name baidu.string.toCamelCase
 * @function
 * @grammar baidu.string.toCamelCase(source)
 * @param {string} source 目标字符串
 * @remark
 * 支持单词以“-_”分隔
 * @meta standard
 *             
 * @returns {string} 驼峰化处理后的字符串
 */
 
 //todo:考虑以后去掉下划线支持？
baidu.string.toCamelCase = function (source) {
    //提前判断，提高getStyle等的效率 thanks xianwei
    if (source.indexOf('-') < 0 && source.indexOf('_') < 0) {
        return source;
    }
    return source.replace(/[-_][^-_]/g, function (match) {
        return match.charAt(1).toUpperCase();
    });
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */







/**
 * 获取目标元素的样式值
 * @name baidu.dom.getStyle
 * @function
 * @grammar baidu.dom.getStyle(element, key)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} key 要获取的样式名
 * @remark
 * 
 * 为了精简代码，本模块默认不对任何浏览器返回值进行归一化处理（如使用getStyle时，不同浏览器下可能返回rgb颜色或hex颜色），也不会修复浏览器的bug和差异性（如设置IE的float属性叫styleFloat，firefox则是cssFloat）。<br />
 * baidu.dom._styleFixer和baidu.dom._styleFilter可以为本模块提供支持。<br />
 * 其中_styleFilter能对颜色和px进行归一化处理，_styleFixer能对display，float，opacity，textOverflow的浏览器兼容性bug进行处理。	
 * @shortcut getStyle
 * @meta standard
 * @see baidu.dom.setStyle,baidu.dom.setStyles, baidu.dom.getComputedStyle
 *             
 * @returns {string} 目标元素的样式值
 */
// TODO
// 1. 无法解决px/em单位统一的问题（IE）
// 2. 无法解决样式值为非数字值的情况（medium等 IE）
baidu.dom.getStyle = function (element, key) {
    var dom = baidu.dom;

    element = dom.g(element);
    key = baidu.string.toCamelCase(key);
    //computed style, then cascaded style, then explicitly set style.
    var value = element.style[key] ||
                (element.currentStyle ? element.currentStyle[key] : "") || 
                dom.getComputedStyle(element, key);

    // 在取不到值的时候，用fixer进行修正
    if (!value) {
        var fixer = dom._styleFixer[key];
        if(fixer){
            value = fixer.get ? fixer.get(element) : baidu.dom.getStyle(element, fixer);
        }
    }
    
    /* 检查结果过滤器 */
    if (fixer = dom._styleFilter) {
        value = fixer.filter(key, value, 'get');
    }

    return value;
};

// 声明快捷方法
baidu.getStyle = baidu.dom.getStyle;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 屏蔽浏览器差异性的事件封装
 * @namespace baidu.event
 * @property target 	事件的触发元素
 * @property pageX 		鼠标事件的鼠标x坐标
 * @property pageY 		鼠标事件的鼠标y坐标
 * @property keyCode 	键盘事件的键值
 */
baidu.event = baidu.event || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/_listeners.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 事件监听器的存储表
 * @private
 * @meta standard
 */
baidu.event._listeners = baidu.event._listeners || [];
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/on.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/16
 */




/**
 * 为目标元素添加事件监听器
 * @name baidu.event.on
 * @function
 * @grammar baidu.event.on(element, type, listener)
 * @param {HTMLElement|string|window} element 目标元素或目标元素id
 * @param {string} type 事件类型
 * @param {Function} listener 需要添加的监听器
 * @remark
 * 
1. 不支持跨浏览器的鼠标滚轮事件监听器添加<br>
2. 改方法不为监听器灌入事件对象，以防止跨iframe事件挂载的事件对象获取失败
    
 * @shortcut on
 * @meta standard
 * @see baidu.event.un
 * @returns {HTMLElement|window} 目标元素
 */
baidu.event.on = /**@function*/function (element, type, listener) {
    type = type.replace(/^on/i, '');
    element = baidu.dom._g(element);

    var realListener = function (ev) {
            // 1. 这里不支持EventArgument,  原因是跨frame的事件挂载
            // 2. element是为了修正this
            listener.call(element, ev);
        },
        lis = baidu.event._listeners,
        filter = baidu.event._eventFilter,
        afterFilter,
        realType = type;
    type = type.toLowerCase();
    // filter过滤
    if(filter && filter[type]){
        afterFilter = filter[type](element, type, realListener);
        realType = afterFilter.type;
        realListener = afterFilter.listener;
    }
    
    // 事件监听器挂载
    if (element.addEventListener) {
        element.addEventListener(realType, realListener, false);
    } else if (element.attachEvent) {
        element.attachEvent('on' + realType, realListener);
    }
  
    // 将监听器存储到数组中
    lis[lis.length] = [element, type, listener, realListener, realType];
    return element;
};

// 声明快捷方法
baidu.on = baidu.event.on;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/un.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/16
 */




/**
 * 为目标元素移除事件监听器
 * @name baidu.event.un
 * @function
 * @grammar baidu.event.un(element, type, listener)
 * @param {HTMLElement|string|window} element 目标元素或目标元素id
 * @param {string} type 事件类型
 * @param {Function} listener 需要移除的监听器
 * @shortcut un
 * @meta standard
 * @see baidu.event.on
 *             
 * @returns {HTMLElement|window} 目标元素
 */
baidu.event.un = function (element, type, listener) {
    element = baidu.dom._g(element);
    type = type.replace(/^on/i, '').toLowerCase();
    
    var lis = baidu.event._listeners, 
        len = lis.length,
        isRemoveAll = !listener,
        item,
        realType, realListener;
    
    //如果将listener的结构改成json
    //可以节省掉这个循环，优化性能
    //但是由于un的使用频率并不高，同时在listener不多的时候
    //遍历数组的性能消耗不会对代码产生影响
    //暂不考虑此优化
    while (len--) {
        item = lis[len];
        
        // listener存在时，移除element的所有以listener监听的type类型事件
        // listener不存在时，移除element的所有type类型事件
        if (item[1] === type
            && item[0] === element
            && (isRemoveAll || item[2] === listener)) {
           	realType = item[4];
           	realListener = item[3];
            if (element.removeEventListener) {
                element.removeEventListener(realType, realListener, false);
            } else if (element.detachEvent) {
                element.detachEvent('on' + realType, realListener);
            }
            lis.splice(len, 1);
        }
    }
    
    return element;
};

// 声明快捷方法
baidu.un = baidu.event.un;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/preventDefault.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 阻止事件的默认行为
 * @name baidu.event.preventDefault
 * @function
 * @grammar baidu.event.preventDefault(event)
 * @param {Event} event 事件对象
 * @meta standard
 * @see baidu.event.stop,baidu.event.stopPropagation
 */
baidu.event.preventDefault = function (event) {
   if (event.preventDefault) {
       event.preventDefault();
   } else {
       event.returnValue = false;
   }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/17
 */


/**
 * 对页面层面的封装，包括页面的高宽属性、以及外部css和js的动态添加
 * @namespace baidu.page
 */
baidu.page = baidu.page || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/getScrollTop.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 获取纵向滚动量
 * @name baidu.page.getScrollTop
 * @function
 * @grammar baidu.page.getScrollTop()
 * @see baidu.page.getScrollLeft
 * @meta standard
 * @returns {number} 纵向滚动量
 */
baidu.page.getScrollTop = function () {
    var d = document;
    return window.pageYOffset || d.documentElement.scrollTop || d.body.scrollTop;
};
/**
 * 获取横向滚动量
 * @name baidu.page.getScrollLeft
 * @function
 * @grammar baidu.page.getScrollLeft()
 * @see baidu.page.getScrollTop
 *             
 * @returns {number} 横向滚动量
 */
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/getScrollLeft.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 获取横向滚动量
 * 
 * @return {number} 横向滚动量
 */
baidu.page.getScrollLeft = function () {
    var d = document;
    return window.pageXOffset || d.documentElement.scrollLeft || d.body.scrollLeft;
};
/**
 * 获得页面里的目前鼠标所在的坐标
 * @name baidu.page.getMousePosition
 * @function
 * @grammar baidu.page.getMousePosition()
 * @version 1.2
 *             
 * @returns {object} 鼠标坐标值{x:[Number], y:[Number]}
 */
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/getMousePosition.js
 * author: meizz
 * version: 1.1.0
 * date: 2010/06/02
 */




/**
 * 取得当前页面里的目前鼠标所在的坐标（x y）
 *
 * @return  {JSON}  当前鼠标的坐标值({x, y})
 */
(function(){

 baidu.page.getMousePosition = function(){
 return {
x : baidu.page.getScrollLeft() + xy.x,
y : baidu.page.getScrollTop() + xy.y
};
};

var xy = {x:0, y:0};
// 监听当前网页的 mousemove 事件以获得鼠标的实时坐标
baidu.event.on(document, "onmousemove", function(e){
    e = window.event || e;
    xy.x = e.clientX;
    xy.y = e.clientY;
    });

})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getPosition.js
 * author: berg
 * version: 1.2.0
 * date: 2010/12/16
 *
 * thanks google closure & jquery
 * 本函数部分思想来自：http://code.google.com/p/doctype/wiki/ArticlePageOffset
 */










/**
 * 获取目标元素相对于整个文档左上角的位置
 * @name baidu.dom.getPosition
 * @function
 * @grammar baidu.dom.getPosition(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @meta standard
 *             
 * @returns {Object} 目标元素的位置，键值为top和left的Object。
 */
baidu.dom.getPosition = function (element) {
    element = baidu.dom.g(element);
    var doc = baidu.dom.getDocument(element), 
        browser = baidu.browser,
        getStyle = baidu.dom.getStyle,
    // Gecko 1.9版本以下用getBoxObjectFor计算位置
    // 但是某些情况下是有bug的
    // 对于这些有bug的情况
    // 使用递归查找的方式
        BUGGY_GECKO_BOX_OBJECT = browser.isGecko > 0 && 
                                 doc.getBoxObjectFor &&
                                 getStyle(element, 'position') == 'absolute' &&
                                 (element.style.top === '' || element.style.left === ''),
        pos = {"left":0,"top":0},
        viewport = (browser.ie && !browser.isStrict) ? doc.body : doc.documentElement,
        parent,
        box;
    
    if(element == viewport){
        return pos;
    }


    if(element.getBoundingClientRect){ // IE and Gecko 1.9+
        
    	//当HTML或者BODY有border width时, 原生的getBoundingClientRect返回值是不符合预期的
    	//考虑到通常情况下 HTML和BODY的border只会设成0px,所以忽略该问题.
        box = element.getBoundingClientRect();

        pos.left = Math.floor(box.left) + Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft);
        pos.top  = Math.floor(box.top)  + Math.max(doc.documentElement.scrollTop,  doc.body.scrollTop);
	    
        // IE会给HTML元素添加一个border，默认是medium（2px）
        // 但是在IE 6 7 的怪异模式下，可以被html { border: 0; } 这条css规则覆盖
        // 在IE7的标准模式下，border永远是2px，这个值通过clientLeft 和 clientTop取得
        // 但是。。。在IE 6 7的怪异模式，如果用户使用css覆盖了默认的medium
        // clientTop和clientLeft不会更新
        pos.left -= doc.documentElement.clientLeft;
        pos.top  -= doc.documentElement.clientTop;
        
        var htmlDom = doc.body,
            // 在这里，不使用element.style.borderLeftWidth，只有computedStyle是可信的
            htmlBorderLeftWidth = parseInt(getStyle(htmlDom, 'borderLeftWidth')),
            htmlBorderTopWidth = parseInt(getStyle(htmlDom, 'borderTopWidth'));
        if(browser.ie && !browser.isStrict){
            pos.left -= isNaN(htmlBorderLeftWidth) ? 2 : htmlBorderLeftWidth;
            pos.top  -= isNaN(htmlBorderTopWidth) ? 2 : htmlBorderTopWidth;
        }
    /*
     * 因为firefox 3.6和4.0在特定页面下(场景待补充)都会出现1px偏移,所以暂时移除该逻辑分支
     * 如果 2.0版本时firefox仍存在问题,该逻辑分支将彻底移除. by rocy 2011-01-20
    } else if (doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT){ // gecko 1.9-

        // 1.9以下的Gecko，会忽略ancestors的scroll值
        // https://bugzilla.mozilla.org/show_bug.cgi?id=328881 and
        // https://bugzilla.mozilla.org/show_bug.cgi?id=330619

        box = doc.getBoxObjectFor(element);
        var vpBox = doc.getBoxObjectFor(viewport);
        pos.left = box.screenX - vpBox.screenX;
        pos.top  = box.screenY - vpBox.screenY;
        */
    } else { // safari/opera/firefox
        parent = element;

        do {
            pos.left += parent.offsetLeft;
            pos.top  += parent.offsetTop;
      
            // safari里面，如果遍历到了一个fixed的元素，后面的offset都不准了
            if (browser.isWebkit > 0 && getStyle(parent, 'position') == 'fixed') {
                pos.left += doc.body.scrollLeft;
                pos.top  += doc.body.scrollTop;
                break;
            }
            
            parent = parent.offsetParent;
        } while (parent && parent != element);

        // 对body offsetTop的修正
        if(browser.opera > 0 || (browser.isWebkit > 0 && getStyle(element, 'position') == 'absolute')){
            pos.top  -= doc.body.offsetTop;
        }

        // 计算除了body的scroll
        parent = element.offsetParent;
        while (parent && parent != doc.body) {
            pos.left -= parent.scrollLeft;
            // see https://bugs.opera.com/show_bug.cgi?id=249965
//            if (!b.opera || parent.tagName != 'TR') {
            if (!browser.opera || parent.tagName != 'TR') {
                pos.top -= parent.scrollTop;
            }
            parent = parent.offsetParent;
        }
    }

    return pos;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/setStyle.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/18
 */






/**
 * 设置目标元素的style样式值
 * @name baidu.dom.setStyle
 * @function
 * @grammar baidu.dom.setStyle(element, key, value)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} key 要设置的样式名
 * @param {string} value 要设置的样式值
 * @remark
 * 
            为了精简代码，本模块默认不对任何浏览器返回值进行归一化处理（如使用getStyle时，不同浏览器下可能返回rgb颜色或hex颜色），也不会修复浏览器的bug和差异性（如设置IE的float属性叫styleFloat，firefox则是cssFloat）。<br />
baidu.dom._styleFixer和baidu.dom._styleFilter可以为本模块提供支持。<br />
其中_styleFilter能对颜色和px进行归一化处理，_styleFixer能对display，float，opacity，textOverflow的浏览器兼容性bug进行处理。
		
 * @shortcut setStyle
 * @meta standard
 * @see baidu.dom.getStyle,baidu.dom.setStyles
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.setStyle = function (element, key, value) {
    var dom = baidu.dom, fixer;
    
    // 放弃了对firefox 0.9的opacity的支持
    element = dom.g(element);
    key = baidu.string.toCamelCase(key);

    if (fixer = dom._styleFilter) {
        value = fixer.filter(key, value, 'set');
    }

    fixer = dom._styleFixer[key];
    (fixer && fixer.set) ? fixer.set(element, value) : (element.style[fixer || key] = value);

    return element;
};

// 声明快捷方法
baidu.setStyle = baidu.dom.setStyle;
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 *
 * path: baidu/dom/drag.js
 * author: meizz, berg, lxp
 * version: 1.1.0
 * date: 2010/06/02
 */
















/**
 * 拖动指定的DOM元素
 * @name baidu.dom.drag
 * @function
 * @grammar baidu.dom.drag(element, options)
 * @param {HTMLElement|string} element 元素或者元素的id.
 * @param {Object} options 拖曳配置项.

 * @param {Array} options.range 限制drag的拖拽范围，数组中必须包含四个值，分别是上、右、下、左边缘相对上方或左方的像素距离。默认无限制.
 * @param {Number} options.interval 拖曳行为的触发频度（时间：毫秒）.
 * @param {Boolean} options.capture 鼠标拖曳粘滞.
 * @param {Object} options.mouseEvent 键名为clientX和clientY的object，若不设置此项，默认会获取当前鼠标位置.
 * @param {Function} options.ondragstart drag开始时触发.
 * @param {Function} options.ondrag drag进行中触发.
 * @param {Function} options.ondragend drag结束时触发.
 * @param {function} options.autoStop 是否在onmouseup时自动停止拖拽。默认为true.
 * @version 1.2
 * @remark
 *
            要拖拽的元素必须事先设定样式的postion值，如果postion为absloute，并且没有设定top和left，拖拽开始时，无法取得元素的top和left值，这时会从[0,0]点开始拖拽

 * @see baidu.dom.draggable
 */
/**
 *
 拖曳DOM元素
 * @param   {HTMLElement|ID}    element 被拖曳的元素.
 * @param   {JSON}              options 拖曳配置项
 *          {autoStop, interval, capture, range, ondragstart, ondragend, ondrag, mouseEvent}.
 */
(function() {
    var target, // 被拖曳的DOM元素
        op, ox, oy, //timer,
        top, left, mozUserSelect,
        lastLeft, lastTop,
        setMargin,
        isFunction = baidu.lang.isFunction,
        timer,
        offset_parent, offset_target;

    baidu.dom.drag = function(element, options) {
        //每次开始拖拽的时候重置lastTop和lastLeft
        lastTop = lastLeft = null;

        if (!(target = baidu.dom.g(element))) return false;
        op = baidu.object.extend({
            autoStop: true   // false 用户手动结束拖曳 ｜ true 在mouseup时自动停止拖曳
, capture: true // 鼠标拖曳粘滞
, interval: 16  // 拖曳行为的触发频度（时间：毫秒）
            , handler: target
        }, options);

        offset_parent = baidu.dom.getPosition(target.offsetParent);
        offset_target = baidu.dom.getPosition(target);

        if (baidu.getStyle(target, 'position') == 'absolute') {
            top = offset_target.top - (target.offsetParent == document.body ? 0 : offset_parent.top);
            left = offset_target.left - (target.offsetParent == document.body ? 0 : offset_parent.left);
        }else {
            top = parseFloat(baidu.getStyle(target, 'top')) || -parseFloat(baidu.getStyle(target, 'bottom')) || 0;
            left = parseFloat(baidu.getStyle(target, 'left')) || -parseFloat(baidu.getStyle(target, 'right')) || 0;
        }

        if (op.mouseEvent) {
            // [2010/11/16] 可以不依赖getMousePosition，直接通过一个可选参数获得鼠标位置
            ox = baidu.page.getScrollLeft() + op.mouseEvent.clientX;
            oy = baidu.page.getScrollTop() + op.mouseEvent.clientY;
        }else {
            var xy = baidu.page.getMousePosition();    // 得到当前鼠标坐标值
            ox = xy.x;
            oy = xy.y;
        }

        //timer = setInterval(render, op.interval);

        // 这项为 true，缺省在 onmouseup 事件终止拖曳
        op.autoStop && baidu.event.on(op.handler, 'mouseup', stop);
        op.autoStop && baidu.event.on(window, 'mouseup', stop);

        // 在拖曳过程中页面里的文字会被选中高亮显示，在这里修正
        baidu.event.on(document, 'selectstart', unselect);

        // 设置鼠标粘滞
        if (op.capture && op.handler.setCapture) {
            op.handler.setCapture();
        } else if (op.capture && window.captureEvents) {
            window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
        }

        //baidu.on(target,"mousemove",render);

        // fixed for firefox
        mozUserSelect = document.body.style.MozUserSelect;
        document.body.style.MozUserSelect = 'none';

        // ondragstart 事件
        if (isFunction(op.ondragstart)) {
            op.ondragstart(target, op);
        }

        timer = setInterval(render, op.interval);
        return {stop: stop, update: update};
    };

    /**
     * 更新当前拖拽对象的属性
     */
    function update(options) {
        baidu.extend(op, options);
    }

    /**
     * 手动停止拖拽
     */
    function stop() {
        clearInterval(timer);
        setMargin = false;

        // 解除鼠标粘滞
        if (op.capture && op.handler.releaseCapture) {
            op.handler.releaseCapture();
        } else if (op.capture && window.releaseEvents) {
            window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP);
        }

        // 拖曳时网页内容被框选
        document.body.style.MozUserSelect = mozUserSelect;
        baidu.event.un(document, 'selectstart', unselect);
        op.autoStop && baidu.event.un(op.handler, 'mouseup', stop);
        op.autoStop && baidu.event.un(window, 'mouseup', stop);

        // ondragend 事件
        if (isFunction(op.ondragend)) {
            op.ondragend(target, op);
        }
    }

    // 对DOM元素进行top/left赋新值以实现拖曳的效果
    function render(e) {
        var rg = op.range,
            xy = baidu.page.getMousePosition(),
            el = left + xy.x - ox,
            et = top + xy.y - oy;

        // 如果用户限定了可拖动的范围
        if (typeof rg == 'object' && rg && rg.length == 4) {
            el = Math.max(rg[3], el);
            el = Math.min(rg[1] - target.offsetWidth, el);
            et = Math.max(rg[0], et);
            et = Math.min(rg[2] - target.offsetHeight, et);
        }

        if (!setMargin) {
            baidu.setStyle(target, 'marginTop', 0);
            baidu.setStyle(target, 'marginLeft', 0);
            setMargin = true;
        }

        target.style.top = et + 'px';
        target.style.left = el + 'px';

        if ((lastLeft !== el || lastTop !== et) && (lastLeft !== null || lastTop !== null)) {
            if (isFunction(op.ondrag)) {
                op.ondrag(target, op);
            }
        }
        lastLeft = el;
        lastTop = et;
    }

    // 对document.body.onselectstart事件进行监听，避免拖曳时文字被选中
    function unselect(e) {
        return baidu.event.preventDefault(e, false);
    }
})();
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 */














/**
 * 让一个DOM元素可拖拽
 * @name baidu.dom.draggable
 * @function
 * @grammar baidu.dom.draggable(element[, options])
 * @param  {string|HTMLElement}   element 		        元素或者元素的ID.
 * @param  {Object} 		      [options] 			选项.
 * @config {Array} 		          [range] 		        限制drag的拖拽范围，数组中必须包含四个值，分别是上、右、下、左边缘相对上方或左方的像素距离。默认无限制.
 * @config {Number} 	          [interval] 	        拖曳行为的触发频度（时间：毫秒）.
 * @config {Boolean} 	          [capture] 	        鼠标拖曳粘滞.
 * @config {Object} 	          [mouseEvent] 	        键名为clientX和clientY的object，若不设置此项，默认会获取当前鼠标位置.
 * @config {Function} 	          [onbeforedragstart]   drag开始前触发（即鼠标按下时）.
 * @config {Function} 	          [ondragstart]         drag开始时触发.
 * @config {Function} 	          [ondrag] 		        drag进行中触发.
 * @config {Function} 	          [ondragend] 	        drag结束时触发.
 * @config {HTMLElement}          [handler] 	        用于拖拽的手柄，比如dialog的title.
 * @config {Function} 	          [toggle] 		        在每次ondrag的时候，会调用这个方法判断是否应该停止拖拽。如果此函数返回值为false，则停止拖拽.
 * @version 1.2
 * @remark    要拖拽的元素必须事先设定样式的postion值，如果postion为absloute，并且没有设定top和left，拖拽开始时，无法取得元素的top和left值，这时会从[0,0]点开始拖拽<br>如果要拖拽的元素是static定位，会被改成relative定位方式。
 * @see baidu.dom.drag
 * @returns {Draggable Instance} 拖拽实例，包含cancel方法，可以停止拖拽.
 */

baidu.dom.draggable = function(element, options) {
    options = baidu.object.extend({toggle: function() {return true}}, options || {});
    options.autoStop = true;
    element = baidu.dom.g(element);
    options.handler = options.handler || element;
    var manager,
        events = ['ondragstart', 'ondrag', 'ondragend'],
        i = events.length - 1,
        eventName,
        dragSingle,
        draggableSingle = {
            dispose: function() {
                dragSingle && dragSingle.stop();
                baidu.event.un(options.handler, 'onmousedown', handlerMouseDown);
                baidu.lang.Class.prototype.dispose.call(draggableSingle);
            }
        },
        me = this;

    //如果存在ddManager, 将事件转发到ddManager中
    if (manager = baidu.dom.ddManager) {
        for (; i >= 0; i--) {
            eventName = events[i];
            options[eventName] = (function(eventName) {
                var fn = options[eventName];
                return function() {
                    baidu.lang.isFunction(fn) && fn.apply(me, arguments);
                    manager.dispatchEvent(eventName, {DOM: element});
                }
            })(eventName);
        }
    }


    // 拖曳只针对有 position 定位的元素
    if (element) {
        function handlerMouseDown(e) {
            var event = options.mouseEvent = window.event || e;
            if (event.button > 1 //只支持鼠标左键拖拽; 左键代码: IE为1,W3C为0
                // 可以通过配置项里的这个开关函数暂停或启用拖曳功能
                || (baidu.lang.isFunction(options.toggle) && !options.toggle())) {
                return;
            }
            if (baidu.dom.getStyle(element, 'position') == 'static') {
                baidu.dom.setStyle(element, 'position', 'relative');
            }
            if (baidu.lang.isFunction(options.onbeforedragstart)) {
                options.onbeforedragstart(element);
            }
            dragSingle = baidu.dom.drag(element, options);
            draggableSingle.stop = dragSingle.stop;
            draggableSingle.update = dragSingle.update;
            //防止ff下出现禁止拖拽的图标
            baidu.event.preventDefault(event);
        }

        // 对拖曳的扳机元素监听 onmousedown 事件，以便进行拖曳行为
        baidu.event.on(options.handler, 'onmousedown', handlerMouseDown);
    }
    return {
        cancel: function() {
            draggableSingle.dispose();
        }
    };
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/intersect.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/12/02
 */




/**
 * 检查两个元素是否相交
 * @name baidu.dom.intersect
 * @function
 * @grammar baidu.dom.intersect(element1, element2)
 * @param {HTMLElement|string} element1 要检查的元素或元素的id
 * @param {HTMLElement|string} element2 要检查的元素或元素的id
 * @see baidu.dom.contains
 *             
 * @returns {boolean} 两个元素是否相交的检查结果
 */
baidu.dom.intersect = function (element1, element2) {
    var g = baidu.dom.g, 
        getPosition = baidu.dom.getPosition, 
        max = Math.max, 
        min = Math.min;

    element1 = g(element1);
    element2 = g(element2);

    var pos1 = getPosition(element1),
        pos2 = getPosition(element2);

    return max(pos1.left, pos2.left) <= min(pos1.left + element1.offsetWidth, pos2.left + element2.offsetWidth)
        && max(pos1.top, pos2.top) <= min(pos1.top + element1.offsetHeight, pos2.top + element2.offsetHeight);
};
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/droppable.js
 * author: rocy
 * version: 1.4.0
 * date: 2010/10/14
 */








//TODO: 添加对 accept, hoverclass 等参数的支持.
/**
 * 让一个DOM元素可以容纳被拖拽的DOM元素
 * @name baidu.dom.droppable
 * @function
 * @grammar baidu.dom.droppable(element[, options])
 * @param {HTMLElement|string} element 容器元素或者容器元素的ID
 * @param {Object} [options] 选项，拖拽元素对于容器元素的事件
                
 * @config {Function} [ondrop] 当元素放到容器元素内部触发
 * @config {Function} [ondropover] 当元素在容器元素上方时触发
 * @config {Function} [ondropout] 当元素移除容器元素时触发
 * @version 1.3
 * @remark
 * 
            需要将元素和容器元素的定位都设置为absolute
        
 * @see baidu.dom.droppable
 *             
 * @returns {Function} cancel取消拖拽
 */
baidu.dom.droppable = function(element, options){
	options = options || {};
	var manager = baidu.dom.ddManager,
		target = baidu.dom.g(element),
	    guid = baidu.lang.guid(),
		//拖拽进行时判断
		_dragging = function(event){
			var _targetsDroppingOver = manager._targetsDroppingOver,
			    eventData = {trigger:event.DOM,reciever: target};
			//判断被拖拽元素和容器是否相撞
			if(baidu.dom.intersect(target, event.DOM)){
				//进入容器区域
				if(! _targetsDroppingOver[guid]){
					//初次进入
					(typeof options.ondropover == 'function') && options.ondropover.call(target,eventData);
					manager.dispatchEvent("ondropover", eventData);
					_targetsDroppingOver[guid] = true;
				}
			} else {
				//出了容器区域
				if(_targetsDroppingOver[guid]){
					(typeof options.ondropout == 'function') && options.ondropout.call(target,eventData);
					manager.dispatchEvent("ondropout", eventData);
				}
				delete _targetsDroppingOver[guid];
			}
		},
		//拖拽结束时判断
		_dragend = function(event){
			var eventData = {trigger:event.DOM,reciever: target};
			if(baidu.dom.intersect(target, event.DOM)){
				typeof options.ondrop == 'function' && options.ondrop.call(target, eventData);
				manager.dispatchEvent("ondrop", eventData);
			}
			delete manager._targetsDroppingOver[guid];
		};
	//事件注册,return object提供事件解除
	manager.addEventListener("ondrag", _dragging);
	manager.addEventListener("ondragend", _dragend);
	return {
		cancel : function(){
			manager.removeEventListener("ondrag", _dragging);
			manager.removeEventListener("ondragend",_dragend);
		}
	};
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/empty.js
 * author: berg
 * version: 1.0
 * date: 2010-07-06
 */

/**
 * 删除一个节点下面的所有子节点。
 * @name baidu.dom.empty
 * @function
 * @grammar baidu.dom.empty(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @version 1.3
 *             
 * @returns {HTMLElement} 目标元素
        
 */



baidu.dom.empty = function (element) {
    element = baidu.dom.g(element);
    
    while(element.firstChild){
        element.removeChild(element.firstChild);
    }
    //todo：删除元素上绑定的事件等?

    return element;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_matchNode.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/18
 */




/**
 * 从目标元素指定的方向搜索元素
 *
 * @param {HTMLElement|string} element   目标元素或目标元素的id
 * @param {string}             direction 遍历的方向名称，取值为previousSibling,nextSibling
 * @param {string}             start     遍历的开始位置，取值为firstChild,lastChild,previousSibling,nextSibling
 * @meta standard
 * @return {HTMLElement} 搜索到的元素，如果没有找到，返回 null
 */
baidu.dom._matchNode = function (element, direction, start) {
    element = baidu.dom.g(element);

    for (var node = element[start]; node; node = node[direction]) {
        if (node.nodeType == 1) {
            return node;
        }
    }

    return null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/first.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/11/18
 */



/**
 * 获取目标元素的第一个元素节点
 * @name baidu.dom.first
 * @function
 * @grammar baidu.dom.first(element)
 * @param {HTMLElement|String} element 目标元素或目标元素的id
 * @see baidu.dom.last,baidu.dom.prev,baidu.dom.next
 * @meta standard
 * @returns {HTMLElement|null} 目标元素的第一个元素节点，查找不到时返回null
 */
baidu.dom.first = function (element) {
    return baidu.dom._matchNode(element, 'nextSibling', 'firstChild');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getAttr.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */




/**
 * 获取目标元素的属性值
 * @name baidu.dom.getAttr
 * @function
 * @grammar baidu.dom.getAttr(element, key)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} key 要获取的attribute键名
 * @shortcut getAttr
 * @meta standard
 * @see baidu.dom.setAttr,baidu.dom.setAttrs
 *             
 * @returns {string|null} 目标元素的attribute值，获取不到时返回null
 */
baidu.dom.getAttr = function (element, key) {
    element = baidu.dom.g(element);

    if ('style' == key){
        return element.style.cssText;
    }

    key = baidu.dom._NAME_ATTRS[key] || key;
    return element.getAttribute(key);
};

// 声明快捷方法
baidu.getAttr = baidu.dom.getAttr;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/setStyles.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/18
 */




/**
 * 批量设置目标元素的style样式值
 * @name baidu.dom.setStyles
 * @function
 * @grammar baidu.dom.setStyles(element, styles)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {Object} styles 要设置的样式集合
 * @shortcut setStyles
 * @meta standard
 * @see baidu.dom.setStyle,baidu.dom.getStyle
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.setStyles = function (element, styles) {
    element = baidu.dom.g(element);

    for (var key in styles) {
        baidu.dom.setStyle(element, key, styles[key]);
    }

    return element;
};

// 声明快捷方法
baidu.setStyles = baidu.dom.setStyles;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/getViewHeight.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/20
 */



/**
 * 获取页面视觉区域高度
 * @name baidu.page.getViewHeight
 * @function
 * @grammar baidu.page.getViewHeight()
 * @see baidu.page.getViewWidth
 * @meta standard
 * @returns {number} 页面视觉区域高度
 */
baidu.page.getViewHeight = function () {
    var doc = document,
        client = doc.compatMode == 'BackCompat' ? doc.body : doc.documentElement;

    return client.clientHeight;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/getViewWidth.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/20
 */



/**
 * 获取页面视觉区域宽度
 * @name baidu.page.getViewWidth
 * @function
 * @grammar baidu.page.getViewWidth()
 * @see baidu.page.getViewHeight
 *             
 * @returns {number} 页面视觉区域宽度
 */
baidu.page.getViewWidth = function () {
    var doc = document,
        client = doc.compatMode == 'BackCompat' ? doc.body : doc.documentElement;

    return client.clientWidth;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFilter/px.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 提供给setStyle与getStyle使用
 * @meta standard
 */
baidu.dom._styleFilter[baidu.dom._styleFilter.length] = {
    set: function (key, value) {
        if (value.constructor == Number 
            && !/zIndex|fontWeight|opacity|zoom|lineHeight/i.test(key)){
            value = value + "px";
        }

        return value;
    }
};
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All right reserved.
 */
















/**
 * 使目标元素拥有可进行与页面可见区域相对位置保持不变的移动的能力
 * @name baidu.dom.fixable
 * @grammar baidu.dom.fixable(element, options)
 * @param {HTMLElement|String} element 目标元素或目标元素的id
 * @param {Object} options 配置项
 * @config {String} [vertival] 取值[top|bottom] 默认值 top
 * @config {Strgin} [horizontal] 取值[left|right] 默认值 left
 * @config {Object} [offset] {x:String|Number, y:String|Number}} 横向与纵向的取值
 * @config {Boolean} [autofix] 是否自动进行fix，默认值为true
 * @config {Function} [onrender] 当被渲染时候触发
 * @config {Function} [onupdate] 当位置被更新的时候触发
 * @config {Function} [onrelease] 当被释放的时候触发
 * @returns {Object} 返回值一个对象，有三个方法：render、update、release
 */
baidu.dom.fixable = /**@function*/function(element, options){

    var target  = baidu.g(element),
        isUnderIE7 = baidu.browser.ie && baidu.browser.ie <= 7 ? true : false,
        vertival = options.vertival || 'top',
        horizontal = options.horizontal || 'left',
        autofix = typeof options.autofix != 'undefined' ? options.autofix : true,
        origPos,offset,isRender = false,
        onrender = options.onrender || new Function(),
        onupdate = options.onupdate || new Function(),
        onrelease = options.onrelease || new Function();

    if(!target) return;

    //获取target原始值
    origPos = _getOriginalStyle();
    //设置offset值
    offset = {
        y: isUnderIE7 ? (origPos.position == "static" ? baidu.dom.getPosition(target).top :  baidu.dom.getPosition(target).top - baidu.dom.getPosition(target.parentNode).top) : target.offsetTop,
        x: isUnderIE7 ? (origPos.position == "static" ? baidu.dom.getPosition(target).left :  baidu.dom.getPosition(target).left - baidu.dom.getPosition(target.parentNode).left) : target.offsetLeft
    };
    baidu.extend(offset, options.offset || {});

    autofix && render();
   
    function _convert(){
        return {
            top : vertival == "top" ? offset.y : baidu.page.getViewHeight() - offset.y - origPos.height,
            left: horizontal == "left" ? offset.x : baidu.page.getViewWidth() - offset.x - origPos.width
        };
    }

    /**
     * 
     */
    function _handleOnMove(){
        var p = _convert(); 
        
        target.style.setExpression("left","eval((document.body.scrollLeft || document.documentElement.scrollLeft) + " + p.left + ") + 'px'");
        target.style.setExpression("top", "eval((document.body.scrollTop || document.documentElement.scrollTop) + " + p.top + ") + 'px'");
    }

    /**
     * 返回target原始position值
     * @return {Object}
     */
    function _getOriginalStyle(){
        var result = {
            position: baidu.getStyle(target,"position"),
            height: function(){
                var h = baidu.getStyle(target,"height");
                return (h != "auto") ? (/\d+/.exec(h)[0]) : target.offsetHeight;
            }(),
            width: function(){			
                var w = baidu.getStyle(target,"width");
                return (w != "auto") ? (/\d+/.exec(w)[0]) : target.offsetWidth;
            }()
        };

        _getValue('top', result);
        _getValue('left', result);
        _getValue('bottom', result);
        _getValue('right', result);
        
        return result;
    }

    function _getValue(position, options){
        var result;

        if(options.position == 'static'){
            options[position] = '';   
        }else{
            result = baidu.getStyle(target, position);
            if(result == 'auto' || result == '0px' ){
                options[position] = '';
            }else{
                options[position] = result;
            }
        }
    }

    function render(){
        if(isRender) return;

        baidu.setStyles(target, {top:'', left:'', bottom:'', right:''});
        
        if(!isUnderIE7){
            var style = {position:"fixed"};
            style[vertival == "top" ? "top" : "bottom"] = offset.y + "px";
            style[horizontal == "left" ? "left" : "right"] = offset.x + "px";

            baidu.setStyles(target, style);
        }else{
            baidu.setStyle(target,"position","absolute");
            _handleOnMove();
        }

        onrender();
        isRender = true;
    }

    function release(){
       if(!isRender) return;

       var style = {
           position: origPos.position,
           left: origPos.left == '' ? 'auto' : origPos.left,
           top: origPos.top == '' ? 'auto' : origPos.top,
           bottom: origPos.bottom == '' ? 'auto' : origPos.bottom,
           right: origPos.right == '' ?  'auto' : origPos.right
       };

        if(isUnderIE7){
            target.style.removeExpression("left");
            target.style.removeExpression("top");
        }
        baidu.setStyles(target, style);

        onrelease();
        isRender = false;
    }

    function update(options){
        if(!options) return;

        //更新事件
        onrender = options.onrender || onrender;
        onupdate = options.onupdate || onupdate;
        onrelease = options.onrelease || onrelease;
        
        //更新设置
        vertival = options.vertival || 'top';
        horizontal = options.horizontal || 'left';

        //更新offset
        baidu.extend(offset, options.offset || {});

        onupdate();
    }

    return {render: render, update: update, release:release};
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getAncestorBy.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 获取目标元素符合条件的最近的祖先元素
 * @name baidu.dom.getAncestorBy
 * @function
 * @grammar baidu.dom.getAncestorBy(element, method)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {Function} method 判断祖先元素条件的函数，function (element)
 * @see baidu.dom.getAncestorByTag,baidu.dom.getAncestorByClass
 *             
 * @returns {HTMLElement|null} 符合条件的最近的祖先元素，查找不到时返回null
 */
baidu.dom.getAncestorBy = function (element, method) {
    element = baidu.dom.g(element);

    while ((element = element.parentNode) && element.nodeType == 1) {
        if (method(element)) {
            return element;
        }
    }

    return null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getAncestorByClass.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */




/**
 * 获取目标元素指定元素className最近的祖先元素
 * @name baidu.dom.getAncestorByClass
 * @function
 * @grammar baidu.dom.getAncestorByClass(element, className)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} className 祖先元素的class，只支持单个class
 * @remark 使用者应保证提供的className合法性，不应包含不合法字符，className合法字符参考：http://www.w3.org/TR/CSS2/syndata.html。
 * @see baidu.dom.getAncestorBy,baidu.dom.getAncestorByTag
 *             
 * @returns {HTMLElement|null} 指定元素className最近的祖先元素，查找不到时返回null
 */
baidu.dom.getAncestorByClass = function (element, className) {
    element = baidu.dom.g(element);
    className = new RegExp("(^|\\s)" + baidu.string.trim(className) + "(\\s|\x24)");

    while ((element = element.parentNode) && element.nodeType == 1) {
        if (className.test(element.className)) {
            return element;
        }
    }

    return null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getAncestorByTag.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 获取目标元素指定标签的最近的祖先元素
 * @name baidu.dom.getAncestorByTag
 * @function
 * @grammar baidu.dom.getAncestorByTag(element, tagName)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} tagName 祖先元素的标签名
 * @see baidu.dom.getAncestorBy,baidu.dom.getAncestorByClass
 *             
 * @returns {HTMLElement|null} 指定标签的最近的祖先元素，查找不到时返回null
 */
baidu.dom.getAncestorByTag = function (element, tagName) {
    element = baidu.dom.g(element);
    tagName = tagName.toUpperCase();

    while ((element = element.parentNode) && element.nodeType == 1) {
        if (element.tagName == tagName) {
            return element;
        }
    }

    return null;
};
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 *
 * author: meizz
 * create: 20111204
 */




/**
 * 获取目标元素的 currentStyle 值，兼容非IE浏览器
 * 某些样式名称或者值需要hack的话，需要别外处理！
 * @author meizz
 * @name baidu.dom.getCurrentStyle
 * @function
 * @grammar baidu.dom.currentStyle(element, key)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} key 要获取的样式名
 *
 * @see baidu.dom.getStyle
 *             
 * @returns {string} 目标元素的computed style值
 */

baidu.dom.getCurrentStyle = function(element, key){
    element = baidu.dom.g(element);

    return element.style[key] ||
        (element.currentStyle ? element.currentStyle[key] : "") || 
        baidu.dom.getComputedStyle(element, key);
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All right reserved.
 * 
 * path: baidu/dom/getParent.js
 * author: berg
 * version: 1.0.0
 * date: 2010/12/02
 */



/**
 * 获得元素的父节点
 * @name baidu.dom.getParent
 * @function
 * @grammar baidu.dom.getParent(element)
 * @param {HTMLElement|string} element   目标元素或目标元素的id
 * @returns {HTMLElement|null} 父元素，如果找不到父元素，返回null
 */
baidu.dom.getParent = function (element) {
    element = baidu.dom._g(element);
    //parentElement在IE下准确，parentNode在ie下可能不准确
    return element.parentElement || element.parentNode || null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getText.js
 * author: berg
 * version: 1.0
 * date: 2010/07/16 
 */



/**
 * 获得元素中的文本内容。
 * @name baidu.dom.getText
 * @function
 * @grammar baidu.dom.getText(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @version 1.3
 *             
 * @returns {String} 元素中文本的内容      
 */
baidu.dom.getText = function (element) {
    var ret = "", childs, i=0, l;

    element = baidu._g(element);

    //  text 和 CDATA 节点，取nodeValue
    if ( element.nodeType === 3 || element.nodeType === 4 ) {
        ret += element.nodeValue;
    } else if ( element.nodeType !== 8 ) {// 8 是 comment Node
        childs = element.childNodes;
        for(l = childs.length; i < l; i++){
            ret += baidu.dom.getText(childs[i]);
        }
    }

    return ret;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/getWindow.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */




/**
 * 获取目标元素所属的window对象
 * @name baidu.dom.getWindow
 * @function
 * @grammar baidu.dom.getWindow(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @see baidu.dom.getDocument
 *             
 * @returns {window} 目标元素所属的window对象
 */
baidu.dom.getWindow = function (element) {
    element = baidu.dom.g(element);
    var doc = baidu.dom.getDocument(element);
    
    // 没有考虑版本低于safari2的情况
    // @see goog/dom/dom.js#goog.dom.DomHelper.prototype.getWindow
    return doc.parentWindow || doc.defaultView || null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/hasAttr.js
 * author: berg
 * version: 1.0
 * date: 2010/07/16 
 */



/**
 * 查询一个元素是否包含指定的属性
 * @name baidu.dom.hasAttr
 * @function
 * @grammar baidu.dom.hasAttr(element, name)
 * @param {DOMElement|string} element DOM元素或元素的id
 * @param {string} name 要查找的属性名
 * @version 1.3
 *             
 * @returns {Boolean} 是否包含此属性        
 */

baidu.dom.hasAttr = function (element, name){
    element = baidu.g(element);
    var attr = element.attributes.getNamedItem(name);
    return !!( attr && attr.specified );
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/hasClass.js
 * author: berg
 * version: 1.0
 * date: 2010-07-06
 */






/**
 * 判断元素是否拥有指定的className
 * @name baidu.dom.hasClass
 * @function
 * @grammar baidu.dom.hasClass(element, className)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} className 要判断的className，可以是用空格拼接的多个className
 * @version 1.2
 * @remark
 * 对于参数className，支持空格分隔的多个className
 * @see baidu.dom.addClass, baidu.dom.removeClass
 * @meta standard
 * @returns {Boolean} 是否拥有指定的className，如果要查询的classname有一个或多个不在元素的className中，返回false
 */
baidu.dom.hasClass = function (element, className) {
    element = baidu.dom.g(element);

    // 对于 textNode 节点来说没有 className
    if(!element || !element.className) return false;

    var classArray = baidu.string.trim(className).split(/\s+/), 
        len = classArray.length;

    className = element.className.split(/\s+/).join(" ");

    while (len--) {
        if(!(new RegExp("(^| )" + classArray[len] + "( |\x24)")).test(className)){
            return false;
        }
    }
    return true;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/hide.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 隐藏目标元素
 * @name baidu.dom.hide
 * @function
 * @grammar baidu.dom.hide(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @shortcut hide
 * @meta standard
 * @see baidu.dom.show,baidu.dom.toggle
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.hide = function (element) {
    element = baidu.dom.g(element);
    element.style.display = "none";

    return element;
};

// 声明快捷方法
baidu.hide = baidu.dom.hide;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/insertAfter.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 将目标元素添加到基准元素之后
 * @name baidu.dom.insertAfter
 * @function
 * @grammar baidu.dom.insertAfter(newElement, existElement)
 * @param {HTMLElement|string} newElement 被添加的目标元素
 * @param {HTMLElement|string} existElement 基准元素
 * @meta standard
 * @see baidu.dom.insertBefore
 *             
 * @returns {HTMLElement} 被添加的目标元素
 */
baidu.dom.insertAfter = function (newElement, existElement) {
    var g, existParent;
    g = baidu.dom._g;
    newElement = g(newElement);
    existElement = g(existElement);
    existParent = existElement.parentNode;
    
    if (existParent) {
        existParent.insertBefore(newElement, existElement.nextSibling);
    }
    return newElement;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/insertBefore.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 将目标元素添加到基准元素之前
 * @name baidu.dom.insertBefore
 * @function
 * @grammar baidu.dom.insertBefore(newElement, existElement)
 * @param {HTMLElement|string} newElement 被添加的目标元素
 * @param {HTMLElement|string} existElement 基准元素
 * @meta standard
 * @see baidu.dom.insertAfter
 *             
 * @returns {HTMLElement} 被添加的目标元素
 */
baidu.dom.insertBefore = function (newElement, existElement) {
    var g, existParent;
    g = baidu.dom._g;
    newElement = g(newElement);
    existElement = g(existElement);
    existParent = existElement.parentNode;

    if (existParent) {
        existParent.insertBefore(newElement, existElement);
    }

    return newElement;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 在目标元素的指定位置插入HTML代码
 * @name baidu.dom.insertHTML
 * @function
 * @grammar baidu.dom.insertHTML(element, position, html)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} position 插入html的位置信息，取值为beforeBegin,afterBegin,beforeEnd,afterEnd
 * @param {string} html 要插入的html
 * @remark
 * 
 * 对于position参数，大小写不敏感<br>
 * 参数的意思：beforeBegin&lt;span&gt;afterBegin   this is span! beforeEnd&lt;/span&gt; afterEnd <br />
 * 此外，如果使用本函数插入带有script标签的HTML字符串，script标签对应的脚本将不会被执行。
 * 
 * @shortcut insertHTML
 * @meta standard
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.insertHTML = function (element, position, html) {
    element = baidu.dom.g(element);
    var range,begin;

    //在opera中insertAdjacentHTML方法实现不标准，如果DOMNodeInserted方法被监听则无法一次插入多element
    //by lixiaopeng @ 2011-8-19
    if (element.insertAdjacentHTML && !baidu.browser.opera) {
        element.insertAdjacentHTML(position, html);
    } else {
        // 这里不做"undefined" != typeof(HTMLElement) && !window.opera判断，其它浏览器将出错？！
        // 但是其实做了判断，其它浏览器下等于这个函数就不能执行了
        range = element.ownerDocument.createRange();
        // FF下range的位置设置错误可能导致创建出来的fragment在插入dom树之后html结构乱掉
        // 改用range.insertNode来插入html, by wenyuxiang @ 2010-12-14.
        position = position.toUpperCase();
        if (position == 'AFTERBEGIN' || position == 'BEFOREEND') {
            range.selectNodeContents(element);
            range.collapse(position == 'AFTERBEGIN');
        } else {
            begin = position == 'BEFOREBEGIN';
            range[begin ? 'setStartBefore' : 'setEndAfter'](element);
            range.collapse(begin);
        }
        range.insertNode(range.createContextualFragment(html));
    }
    return element;
};

baidu.insertHTML = baidu.dom.insertHTML;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/last.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/18
 */



/**
 * 获取目标元素的最后一个元素节点
 * @name baidu.dom.last
 * @function
 * @grammar baidu.dom.last(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @see baidu.dom.first,baidu.dom.prev,baidu.dom.next
 *             
 * @returns {HTMLElement|null} 目标元素的最后一个元素节点，查找不到时返回null
 */
baidu.dom.last = function (element) {
    return baidu.dom._matchNode(element, 'previousSibling', 'lastChild');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/next.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/18
 */



/**
 * 获取目标元素的下一个兄弟元素节点
 * @name baidu.dom.next
 * @function
 * @grammar baidu.dom.next(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @see baidu.dom.first,baidu.dom.last,baidu.dom.prev
 * @meta standard
 * @returns {HTMLElement|null} 目标元素的下一个兄弟元素节点，查找不到时返回null
 */
baidu.dom.next = function (element) {
    return baidu.dom._matchNode(element, 'nextSibling', 'nextSibling');
};



/**
 * 设置HTML元素的不透明性，跨浏览器种类兼容处理
 * 
 * @author: meizz
 * @version: 2011-07-11
 * @namespace: baidu.dom.opacity
 * @grammar baidu.dom.opacity(element, opacity)
 * @param {String|HTMLElement}  element 定位插入的HTML的目标DOM元素
 * @param {Number}              opacity 不透明度
 */
baidu.dom.opacity = function(element, opacity){
    element = baidu.dom.g(element);

    if (!baidu.browser.ie) {
        element.style.opacity = opacity;
        element.style.KHTMLOpacity = opacity;
    } else {
        element.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity:"+
            Math.floor(opacity * 100) +")";
    }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/prev.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/18
 */



/**
 * 获取目标元素的上一个兄弟元素节点
 * @name baidu.dom.prev
 * @function
 * @grammar baidu.dom.prev(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @see baidu.dom.first,baidu.dom.last,baidu.dom.next
 *             
 *             
 * @returns {HTMLElement|null} 目标元素的上一个兄弟元素节点，查找不到时返回null
 */
baidu.dom.prev = function (element) {
    return baidu.dom._matchNode(element, 'previousSibling', 'previousSibling');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/escapeReg.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 将目标字符串中可能会影响正则表达式构造的字符串进行转义。
 * @name baidu.string.escapeReg
 * @function
 * @grammar baidu.string.escapeReg(source)
 * @param {string} source 目标字符串
 * @remark
 * 给以下字符前加上“\”进行转义：.*+?^=!:${}()|[]/\
 * @meta standard
 *             
 * @returns {string} 转义后的字符串
 */
baidu.string.escapeReg = function (source) {
    return String(source)
            .replace(new RegExp("([.*+?^=!:\x24{}()|[\\]\/\\\\])", "g"), '\\\x241');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/q.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */





/**
 * 通过className获取元素
 * @name baidu.dom.q
 * @function
 * @grammar baidu.dom.q(className[, element, tagName])
 * @param {string} className 元素的class，只能指定单一的class，如果为空字符串或者纯空白的字符串，返回空数组。
 * @param {string|HTMLElement} [element] 开始搜索的元素，默认是document。
 * @param {string} [tagName] 要获取元素的标签名，如果没有值或者值为空字符串或者纯空白的字符串，表示不限制标签名。
 * @remark 不保证返回数组中DOM节点的顺序和文档中DOM节点的顺序一致。
 * @shortcut q,T.Q
 * @meta standard
 * @see baidu.dom.g
 *             
 * @returns {Array} 获取的元素集合，查找不到或className参数错误时返回空数组.
 */
baidu.dom.q = function (className, element, tagName) {
    var result = [], 
    trim = baidu.string.trim, 
    len, i, elements, node;

    if (!(className = trim(className))) {
        return result;
    }
    
    // 初始化element参数
    if ('undefined' == typeof element) {
        element = document;
    } else {
        element = baidu.dom.g(element);
        if (!element) {
            return result;
        }
    }
    
    // 初始化tagName参数
    tagName && (tagName = trim(tagName).toUpperCase());
    
    // 查询元素
    if (element.getElementsByClassName) {
        elements = element.getElementsByClassName(className); 
        len = elements.length;
        for (i = 0; i < len; i++) {
            node = elements[i];
            if (tagName && node.tagName != tagName) {
                continue;
            }
            result[result.length] = node;
        }
    } else {
        className = new RegExp(
                        "(^|\\s)" 
                        + baidu.string.escapeReg(className)
                        + "(\\s|\x24)");
        elements = tagName 
                    ? element.getElementsByTagName(tagName) 
                    : (element.all || element.getElementsByTagName("*"));
        len = elements.length;
        for (i = 0; i < len; i++) {
            node = elements[i];
            className.test(node.className) && (result[result.length] = node);
        }
    }

    return result;
};

// 声明快捷方法
baidu.q = baidu.Q = baidu.dom.q;


/*!
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */


/**
 * 提供css选择器功能   选择器支持所有的<a href="http://www.w3.org/TR/css3-selectors/">css3选择器</a> ，核心实现采用sizzle。baidu.dom.query.matches 请参考<a href="http://wiki.github.com/jeresig/sizzle/" target="_blank">sizzle 文档</a> 
 * @name baidu.dom.query
 * @function
 * @grammar baidu.dom.query(selector[, context, results])
 * @param {String} selector 选择器定义
 * @param {HTMLElement | DOMDocument} [context] 查找的上下文
 * @param {Array} [results] 查找的结果会追加到这个数组中
 * @version 1.5
 * @remark
 * 
            选择器支持所有的<a href="http://www.w3.org/TR/css3-selectors/">css3选择器</a> ，核心实现采用sizzle。可参考<a href="https://github.com/jquery/sizzle/wiki/Sizzle-Home" target="_blank">sizzle 文档</a>
        
 * @see baidu.dom.g, baidu.dom.q,
 * @returns {Array}        包含所有筛选出的DOM元素的数组
 */

(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	expando = "sizcache" + (Math.random() + '').replace('.', ''),
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true,
	rBackslash = /\\/g,
	rReturn = /\r\n/g,
	rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function() {
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function( selector, context, results, seed ) {
	results = results || [];
	context = context || document;

	var origContext = context;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var m, set, checkSet, extra, ret, cur, pop, i,
		prune = true,
		contextXML = Sizzle.isXML( context ),
		parts = [],
		soFar = selector;
	
	// Reset the position of the chunker regexp (start from head)
	do {
		chunker.exec( "" );
		m = chunker.exec( soFar );

		if ( m ) {
			soFar = m[3];
		
			parts.push( m[1] );
		
			if ( m[2] ) {
				extra = m[3];
				break;
			}
		}
	} while ( m );

	if ( parts.length > 1 && origPOS.exec( selector ) ) {

		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context, seed );

		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}
				
				set = posProcess( selector, set, seed );
			}
		}

	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

			ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ?
				Sizzle.filter( ret.expr, ret.set )[0] :
				ret.set[0];
		}

		if ( context ) {
			ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

			set = ret.expr ?
				Sizzle.filter( ret.expr, ret.set ) :
				ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray( set );

			} else {
				prune = false;
			}

			while ( parts.length ) {
				cur = parts.pop();
				pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}

		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		Sizzle.error( cur || selector );
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );

		} else if ( context && context.nodeType === 1 ) {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}

		} else {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}

	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function( results ) {
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[ i - 1 ] ) {
					results.splice( i--, 1 );
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function( expr, set ) {
	return Sizzle( expr, null, null, set );
};

Sizzle.matchesSelector = function( node, expr ) {
	return Sizzle( expr, null, null, [node] ).length > 0;
};

Sizzle.find = function( expr, context, isXML ) {
	var set, i, len, match, type, left;

	if ( !expr ) {
		return [];
	}

	for ( i = 0, len = Expr.order.length; i < len; i++ ) {
		type = Expr.order[i];
		
		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			left = match[1];
			match.splice( 1, 1 );

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace( rBackslash, "" );
				set = Expr.find[ type ]( match, context, isXML );

				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = typeof context.getElementsByTagName !== "undefined" ?
			context.getElementsByTagName( "*" ) :
			[];
	}

	return { set: set, expr: expr };
};

Sizzle.filter = function( expr, set, inplace, not ) {
	var match, anyFound,
		type, found, item, filter, left,
		i, pass,
		old = expr,
		result = [],
		curLoop = set,
		isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

	while ( expr && set.length ) {
		for ( type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				filter = Expr.filter[ type ];
				left = match[1];

				anyFound = false;

				match.splice(1,1);

				if ( left.substr( left.length - 1 ) === "\\" ) {
					continue;
				}

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;

					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							pass = not ^ found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;

								} else {
									curLoop[i] = false;
								}

							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				Sizzle.error( expr );

			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

Sizzle.error = function( msg ) {
	throw "Syntax error, unrecognized expression: " + msg;
};

/**
 * Utility function for retreiving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
var getText = Sizzle.getText = function( elem ) {
    var i, node,
		nodeType = elem.nodeType,
		ret = "";

	if ( nodeType ) {
		if ( nodeType === 1 ) {
			// Use textContent || innerText for elements
			if ( typeof elem.textContent === 'string' ) {
				return elem.textContent;
			} else if ( typeof elem.innerText === 'string' ) {
				// Replace IE's carriage returns
				return elem.innerText.replace( rReturn, '' );
			} else {
				// Traverse it's children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
	} else {

		// If no nodeType, this is expected to be an array
		for ( i = 0; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			if ( node.nodeType !== 8 ) {
				ret += getText( node );
			}
		}
	}
	return ret;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],

	match: {
		ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
	},

	leftMatch: {},

	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},

	attrHandle: {
		href: function( elem ) {
			return elem.getAttribute( "href" );
		},
		type: function( elem ) {
			return elem.getAttribute( "type" );
		}
	},

	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !rNonWord.test( part ),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},

		">": function( checkSet, part ) {
			var elem,
				isPartStr = typeof part === "string",
				i = 0,
				l = checkSet.length;

			if ( isPartStr && !rNonWord.test( part ) ) {
				part = part.toLowerCase();

				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}

			} else {
				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},

		"": function(checkSet, part, isXML){
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !rNonWord.test( part ) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
		},

		"~": function( checkSet, part, isXML ) {
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !rNonWord.test( part ) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
		}
	},

	find: {
		ID: function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		},

		NAME: function( match, context ) {
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [],
					results = context.getElementsByName( match[1] );

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},

		TAG: function( match, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( match[1] );
			}
		}
	},
	preFilter: {
		CLASS: function( match, curLoop, inplace, result, not, isXML ) {
			match = " " + match[1].replace( rBackslash, "" ) + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}

					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},

		ID: function( match ) {
			return match[1].replace( rBackslash, "" );
		},

		TAG: function( match, curLoop ) {
			return match[1].replace( rBackslash, "" ).toLowerCase();
		},

		CHILD: function( match ) {
			if ( match[1] === "nth" ) {
				if ( !match[2] ) {
					Sizzle.error( match[0] );
				}

				match[2] = match[2].replace(/^\+|\s*/g, '');

				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}
			else if ( match[2] ) {
				Sizzle.error( match[0] );
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},

		ATTR: function( match, curLoop, inplace, result, not, isXML ) {
			var name = match[1] = match[1].replace( rBackslash, "" );
			
			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			// Handle if an un-quoted value was used
			match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},

		PSEUDO: function( match, curLoop, inplace, result, not ) {
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);

				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

					if ( !inplace ) {
						result.push.apply( result, ret );
					}

					return false;
				}

			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}
			
			return match;
		},

		POS: function( match ) {
			match.unshift( true );

			return match;
		}
	},
	
	filters: {
		enabled: function( elem ) {
			return elem.disabled === false && elem.type !== "hidden";
		},

		disabled: function( elem ) {
			return elem.disabled === true;
		},

		checked: function( elem ) {
			return elem.checked === true;
		},
		
		selected: function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}
			
			return elem.selected === true;
		},

		parent: function( elem ) {
			return !!elem.firstChild;
		},

		empty: function( elem ) {
			return !elem.firstChild;
		},

		has: function( elem, i, match ) {
			return !!Sizzle( match[3], elem ).length;
		},

		header: function( elem ) {
			return (/h\d/i).test( elem.nodeName );
		},

		text: function( elem ) {
			var attr = elem.getAttribute( "type" ), type = elem.type;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc) 
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
		},

		radio: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
		},

		checkbox: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
		},

		file: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
		},

		password: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
		},

		submit: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && "submit" === elem.type;
		},

		image: function( elem ) {
			return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
		},

		reset: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && "reset" === elem.type;
		},

		button: function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && "button" === elem.type || name === "button";
		},

		input: function( elem ) {
			return (/input|select|textarea|button/i).test( elem.nodeName );
		},

		focus: function( elem ) {
			return elem === elem.ownerDocument.activeElement;
		}
	},
	setFilters: {
		first: function( elem, i ) {
			return i === 0;
		},

		last: function( elem, i, match, array ) {
			return i === array.length - 1;
		},

		even: function( elem, i ) {
			return i % 2 === 0;
		},

		odd: function( elem, i ) {
			return i % 2 === 1;
		},

		lt: function( elem, i, match ) {
			return i < match[3] - 0;
		},

		gt: function( elem, i, match ) {
			return i > match[3] - 0;
		},

		nth: function( elem, i, match ) {
			return match[3] - 0 === i;
		},

		eq: function( elem, i, match ) {
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function( elem, match, i, array ) {
			var name = match[1],
				filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );

			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;

			} else if ( name === "not" ) {
				var not = match[3];

				for ( var j = 0, l = not.length; j < l; j++ ) {
					if ( not[j] === elem ) {
						return false;
					}
				}

				return true;

			} else {
				Sizzle.error( name );
			}
		},

		CHILD: function( elem, match ) {
			var first, last,
				doneName, parent, cache,
				count, diff,
				type = match[1],
				node = elem;

			switch ( type ) {
				case "only":
				case "first":
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}

					if ( type === "first" ) { 
						return true; 
					}

					node = elem;

				case "last":
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}

					return true;

				case "nth":
					first = match[2];
					last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}
					
					doneName = match[0];
					parent = elem.parentNode;
	
					if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
						count = 0;
						
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						} 

						parent[ expando ] = doneName;
					}
					
					diff = elem.nodeIndex - last;

					if ( first === 0 ) {
						return diff === 0;

					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},

		ID: function( elem, match ) {
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},

		TAG: function( elem, match ) {
			return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
		},
		
		CLASS: function( elem, match ) {
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},

		ATTR: function( elem, match ) {
			var name = match[1],
				result = Sizzle.attr ?
					Sizzle.attr( elem, name ) :
					Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				!type && Sizzle.attr ?
				result != null :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},

		POS: function( elem, match, i, array ) {
			var name = match[2],
				filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS,
	fescape = function(all, num){
		return "\\" + (num - 0 + 1);
	};

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
}

var makeArray = function( array, results ) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch( e ) {
	makeArray = function( array, results ) {
		var i = 0,
			ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );

		} else {
			if ( typeof array.length === "number" ) {
				for ( var l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}

			} else {
				for ( ; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder, siblingCheck;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			return a.compareDocumentPosition ? -1 : 1;
		}

		return a.compareDocumentPosition(b) & 4 ? -1 : 1;
	};

} else {
	sortOrder = function( a, b ) {
		// The nodes are identical, we can exit early
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Fallback to using sourceIndex (in IE) if it's available on both nodes
		} else if ( a.sourceIndex && b.sourceIndex ) {
			return a.sourceIndex - b.sourceIndex;
		}

		var al, bl,
			ap = [],
			bp = [],
			aup = a.parentNode,
			bup = b.parentNode,
			cur = aup;

		// If the nodes are siblings (or identical) we can do a quick check
		if ( aup === bup ) {
			return siblingCheck( a, b );

		// If no parents were found then the nodes are disconnected
		} else if ( !aup ) {
			return -1;

		} else if ( !bup ) {
			return 1;
		}

		// Otherwise they're somewhere else in the tree so we need
		// to build up a full list of the parentNodes for comparison
		while ( cur ) {
			ap.unshift( cur );
			cur = cur.parentNode;
		}

		cur = bup;

		while ( cur ) {
			bp.unshift( cur );
			cur = cur.parentNode;
		}

		al = ap.length;
		bl = bp.length;

		// Start walking down the tree looking for a discrepancy
		for ( var i = 0; i < al && i < bl; i++ ) {
			if ( ap[i] !== bp[i] ) {
				return siblingCheck( ap[i], bp[i] );
			}
		}

		// We ended someplace up the tree so do a sibling check
		return i === al ?
			siblingCheck( a, bp[i], -1 ) :
			siblingCheck( ap[i], b, 1 );
	};

	siblingCheck = function( a, b, ret ) {
		if ( a === b ) {
			return ret;
		}

		var cur = a.nextSibling;

		while ( cur ) {
			if ( cur === b ) {
				return -1;
			}

			cur = cur.nextSibling;
		}

		return 1;
	};
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date()).getTime(),
		root = document.documentElement;

	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);

				return m ?
					m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
						[m] :
						undefined :
					[];
			}
		};

		Expr.filter.ID = function( elem, match ) {
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );

	// release memory in IE
	root = form = null;
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function( match, context ) {
			var results = context.getElementsByTagName( match[1] );

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";

	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {

		Expr.attrHandle.href = function( elem ) {
			return elem.getAttribute( "href", 2 );
		};
	}

	// release memory in IE
	div = null;
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle,
			div = document.createElement("div"),
			id = "__sizzle__";

		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}
	
		Sizzle = function( query, context, extra, seed ) {
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && !Sizzle.isXML(context) ) {
				// See if we find a selector to speed up
				var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );
				
				if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
					// Speed-up: Sizzle("TAG")
					if ( match[1] ) {
						return makeArray( context.getElementsByTagName( query ), extra );
					
					// Speed-up: Sizzle(".CLASS")
					} else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
						return makeArray( context.getElementsByClassName( match[2] ), extra );
					}
				}
				
				if ( context.nodeType === 9 ) {
					// Speed-up: Sizzle("body")
					// The body element only exists once, optimize finding it
					if ( query === "body" && context.body ) {
						return makeArray( [ context.body ], extra );
						
					// Speed-up: Sizzle("#ID")
					} else if ( match && match[3] ) {
						var elem = context.getElementById( match[3] );

						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						if ( elem && elem.parentNode ) {
							// Handle the case where IE and Opera return items
							// by name instead of ID
							if ( elem.id === match[3] ) {
								return makeArray( [ elem ], extra );
							}
							
						} else {
							return makeArray( [], extra );
						}
					}
					
					try {
						return makeArray( context.querySelectorAll(query), extra );
					} catch(qsaError) {}

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				} else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
					var oldContext = context,
						old = context.getAttribute( "id" ),
						nid = old || id,
						hasParent = context.parentNode,
						relativeHierarchySelector = /^\s*[+~]/.test( query );

					if ( !old ) {
						context.setAttribute( "id", nid );
					} else {
						nid = nid.replace( /'/g, "\\$&" );
					}
					if ( relativeHierarchySelector && hasParent ) {
						context = context.parentNode;
					}

					try {
						if ( !relativeHierarchySelector || hasParent ) {
							return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
						}

					} catch(pseudoError) {
					} finally {
						if ( !old ) {
							oldContext.removeAttribute( "id" );
						}
					}
				}
			}
		
			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		// release memory in IE
		div = null;
	})();
}

(function(){
	var html = document.documentElement,
		matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;

	if ( matches ) {
		// Check to see if it's possible to do matchesSelector
		// on a disconnected node (IE 9 fails this)
		var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
			pseudoWorks = false;

		try {
			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( document.documentElement, "[test!='']:sizzle" );
	
		} catch( pseudoError ) {
			pseudoWorks = true;
		}

		Sizzle.matchesSelector = function( node, expr ) {
			// Make sure that attribute selectors are quoted
			expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

			if ( !Sizzle.isXML( node ) ) {
				try { 
					if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
						var ret = matches.call( node, expr );

						// IE 9's matchesSelector returns false on disconnected nodes
						if ( ret || !disconnectedMatch ||
								// As well, disconnected nodes are said to be in a document
								// fragment in IE 9, so check for that
								node.document && node.document.nodeType !== 11 ) {
							return ret;
						}
					}
				} catch(e) {}
			}

			return Sizzle(expr, null, null, [node]).length > 0;
		};
	}
})();

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}
	
	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function( match, context, isXML ) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	// release memory in IE
	div = null;
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;

			elem = elem[dir];

			while ( elem ) {
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem[ expando ] = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;
			
			elem = elem[dir];

			while ( elem ) {
				if ( elem[ expando ] === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem[ expando ] = doneName;
						elem.sizset = i;
					}

					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

if ( document.documentElement.contains ) {
	Sizzle.contains = function( a, b ) {
		return a !== b && (a.contains ? a.contains(b) : true);
	};

} else if ( document.documentElement.compareDocumentPosition ) {
	Sizzle.contains = function( a, b ) {
		return !!(a.compareDocumentPosition(b) & 16);
	};

} else {
	Sizzle.contains = function() {
		return false;
	};
}

Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833) 
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function( selector, context, seed ) {
	var match,
		tmpSet = [],
		later = "",
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet, seed );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE

baidu.dom.query = Sizzle;

})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */






/**
 * 使函数在页面dom节点加载完毕时调用
 * @author allstar
 * @name baidu.dom.ready
 * @function
 * @grammar baidu.dom.ready(callback)
 * @param {Function} callback 页面加载完毕时调用的函数.
 * @remark
 * 如果有条件将js放在页面最底部, 也能达到同样效果，不必使用该方法。
 * @meta standard
 */
(function() {

    var ready = baidu.dom.ready = function() {
        var readyBound = false,
            readyList = [],
            DOMContentLoaded;

        if (document.addEventListener) {
            DOMContentLoaded = function() {
                document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
                ready();
            };

        } else if (document.attachEvent) {
            DOMContentLoaded = function() {
                if (document.readyState === 'complete') {
                    document.detachEvent('onreadystatechange', DOMContentLoaded);
                    ready();
                }
            };
        }
        /**
         * @private
         */
        function ready() {
            if (!ready.isReady) {
                ready.isReady = true;
                for (var i = 0, j = readyList.length; i < j; i++) {
                    readyList[i]();
                }
            }
        }
        /**
         * @private
         */
        function doScrollCheck(){
            try {
                document.documentElement.doScroll("left");
            } catch(e) {
                setTimeout( doScrollCheck, 1 );
                return;
            }   
            ready();
        }
        /**
         * @private
         */
        function bindReady() {
            if (readyBound) {
                return;
            }
            readyBound = true;

            if (document.readyState === 'complete') {
                ready.isReady = true;
            } else {
                if (document.addEventListener) {
                    document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
                    window.addEventListener('load', ready, false);
                } else if (document.attachEvent) {
                    document.attachEvent('onreadystatechange', DOMContentLoaded);
                    window.attachEvent('onload', ready);

                    var toplevel = false;

                    try {
                        toplevel = window.frameElement == null;
                    } catch (e) {}

                    if (document.documentElement.doScroll && toplevel) {
                        doScrollCheck();
                    }
                }
            }
        }
        bindReady();

        return function(callback) {
            ready.isReady ? callback() : readyList.push(callback);
        };
    }();

    ready.isReady = false;
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/remove.js
 * author: allstar,berg
 * version: 1.1.0
 * date: 2009/11/17
 */




/**
 * 从DOM树上移除目标元素
 * @name baidu.dom.remove
 * @function
 * @grammar baidu.dom.remove(element)
 * @param {HTMLElement|string} element 需要移除的元素或元素的id
 * @remark
 * <b>注意：</b>对于移除的dom元素，IE下会释放该元素的空间，继续使用该元素的引用进行操作将会引发不可预料的问题。
 * @meta standard
 */
baidu.dom.remove = function (element) {
    element = baidu.dom._g(element);
	var tmpEl = element.parentNode;
    //去掉了对ie下的特殊处理：创建一个div，appendChild，然后div.innerHTML = ""
    tmpEl && tmpEl.removeChild(element);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/removeClass.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */




/**
 * 移除目标元素的className
 * @name baidu.dom.removeClass
 * @function
 * @grammar baidu.dom.removeClass(element, className)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {string} className 要移除的className，允许同时移除多个class，中间使用空白符分隔
 * @remark
 * 使用者应保证提供的className合法性，不应包含不合法字符，className合法字符参考：http://www.w3.org/TR/CSS2/syndata.html。
 * @shortcut removeClass
 * @meta standard
 * @see baidu.dom.addClass
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.removeClass = function (element, className) {
    element = baidu.dom.g(element);

    var oldClasses = element.className.split(/\s+/),
        newClasses = className.split(/\s+/),
        lenOld,
        lenDel = newClasses.length,
        j,
        i = 0;
    //考虑到同时删除多个className的应用场景概率较低,故放弃进一步性能优化 
    // by rocy @1.3.4
    for (; i < lenDel; ++i){
        for(j = 0, lenOld = oldClasses.length; j < lenOld; ++j){
            if(oldClasses[j] == newClasses[i]){
            	oldClasses.splice(j, 1);
            	break;
            }
        }
    }
    element.className = oldClasses.join(' ');
    return element;
};

// 声明快捷方法
baidu.removeClass = baidu.dom.removeClass;
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 *
 * path: baidu/dom/removeStyle.js
 * author: wenyuxiang, berg
 * version: 1.0.1
 * date: 2010/9/10
 */




/**
 * 删除元素的某个样式
 * @name baidu.dom.removeStyle
 * @function
 * @grammar baidu.dom.removeStyle(element, styleName)
 * @param {HTMLElement|String} element 需要删除样式的元素或者元素id
 * @param {string} styleName 需要删除的样式名字
 * @version 1.3
 * @see baidu.dom.setStyle
 *             
 * @returns {HTMLElement} 目标元素
 */
 
// todo: 1. 只支持现代浏览器，有一些老浏览器可能不支持; 2. 有部分属性无法被正常移除
baidu.dom.removeStyle = function (){
    var ele = document.createElement("DIV"),
        fn,
        _g = baidu.dom._g;
    
    if (ele.style.removeProperty) {// W3C, (gecko, opera, webkit)
        fn = function (el, st){
            el = _g(el);
            el.style.removeProperty(st);
            return el;
        };
    } else if (ele.style.removeAttribute) { // IE
        fn = function (el, st){
            el = _g(el);
            el.style.removeAttribute(baidu.string.toCamelCase(st));
            return el;
        };
    }
    ele = null;
    return fn;
}();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/object/each.js
 * author: berg
 * version: 1.1.1
 * date: 2010-04-19
 */



/**
 * 遍历Object中所有元素，1.1.1增加
 * @name baidu.object.each
 * @function
 * @grammar baidu.object.each(source, iterator)
 * @param {Object} source 需要遍历的Object
 * @param {Function} iterator 对每个Object元素进行调用的函数，function (item, key)
 * @version 1.1.1
 *             
 * @returns {Object} 遍历的Object
 */
baidu.object.each = function (source, iterator) {
    var returnValue, key, item; 
    if ('function' == typeof iterator) {
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                item = source[key];
                returnValue = iterator.call(source, item, key);
        
                if (returnValue === false) {
                    break;
                }
            }
        }
    }
    return source;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断目标参数是否number类型或Number对象
 * @name baidu.lang.isNumber
 * @function
 * @grammar baidu.lang.isNumber(source)
 * @param {Any} source 目标参数
 * @meta standard
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isArray,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 * @remark 用本函数判断NaN会返回false，尽管在Javascript中是Number类型。
 */
baidu.lang.isNumber = function (source) {
    return '[object Number]' == Object.prototype.toString.call(source) && isFinite(source);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/getTarget.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 获取事件的触发元素
 * @name baidu.event.getTarget
 * @function
 * @grammar baidu.event.getTarget(event)
 * @param {Event} event 事件对象
 * @meta standard
 * @returns {HTMLElement} 事件的触发元素
 */
 
baidu.event.getTarget = function (event) {
    return event.target || event.srcElement;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */









/**
 * 按照border-box模型设置元素的height和width值。只支持元素的padding/border/height/width使用同一种计量单位的情况。<br/> 不支持：<br/> 1. 非数字值(medium)<br/> 2. em/px在不同的属性中混用
 * @name baidu.dom.setBorderBoxSize
 * @author berg
 * @function
 * @grammar baidu.dom.setBorderBoxSize(element, size)
 * @param {HTMLElement|string} element 元素或DOM元素的id
 * @param {object} size 包含height和width键名的对象
 *
 * @see baidu.dom.setBorderBoxWidth, baidu.dom.setBorderBoxHeight
 *
 * @return {HTMLElement}  设置好的元素
 */
baidu.dom.setBorderBoxSize = /**@function*/function (element, size) {
    var result = {};
    size.width && (result.width = parseFloat(size.width));
    size.height && (result.height = parseFloat(size.height));

    function getNumericalStyle(element, name){
        return parseFloat(baidu.getStyle(element, name)) || 0;
    }
    
    if(baidu.browser.isStrict){
        if(size.width){
            result.width = parseFloat(size.width)  -
                           getNumericalStyle(element, 'paddingLeft') - 
                           getNumericalStyle(element, 'paddingRight') - 
                           getNumericalStyle(element, 'borderLeftWidth') -
                           getNumericalStyle(element, 'borderRightWidth');
            result.width < 0 && (result.width = 0);
        }
        if(size.height){
            result.height = parseFloat(size.height) -
                            getNumericalStyle(element, 'paddingTop') - 
                            getNumericalStyle(element, 'paddingBottom') - 
                            getNumericalStyle(element, 'borderTopWidth') - 
                            getNumericalStyle(element, 'borderBottomWidth');
            result.height < 0 && (result.height = 0);
        }
    }
    return baidu.dom.setStyles(element, result);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 按照border-box模型设置元素的height值
 * 
 * @author berg
 * @name baidu.dom.setBorderBoxHeight
 * @function
 * @grammar baidu.dom.setBorderBoxHeight(element, height)
 * 
 * @param {HTMLElement|string} element DOM元素或元素的id
 * @param {number|string} height 要设置的height
 *
 * @return {HTMLElement}  设置好的元素
 * @see baidu.dom.setBorderBoxWidth, baidu.dom.setBorderBoxSize
 * @shortcut dom.setOuterHeight
 */
baidu.dom.setOuterHeight = 
baidu.dom.setBorderBoxHeight = function (element, height) {
    return baidu.dom.setBorderBoxSize(element, {height : height});
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/**
 * 按照border-box模型设置元素的width值
 * 
 * @author berg
 * @name baidu.dom.setBorderBoxWidth
 * @function
 * @grammar baidu.dom.setBorderBoxWidth(element, width)
 * 
 * @param {HTMLElement|string} 	element DOM元素或元素的id
 * @param {number|string} 		width 	要设置的width
 *
 * @return {HTMLElement}  设置好的元素
 * @see baidu.dom.setBorderBoxHeight, baidu.dom.setBorderBoxSize
 * @shortcut dom.setOuterWidth
 */
baidu.dom.setOuterWidth = 
baidu.dom.setBorderBoxWidth = function (element, width) {
    return baidu.dom.setBorderBoxSize(element, {width : width});
};
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 */






















/**
 * 绘制可以根据鼠标行为改变HTMLElement大小的resize handle
 * @name baidu.dom.resizable
 * @function
 * @grammar baidu.dom.resizable(element[, options])
 * @param {HTMLElement|string} element 需要改变大小的元素或者元素的id.
 * @param {Object} [options] resizable参数配置
 * @config {Array} [direction] 可以改变的方向[e,se,s,ws,w,wn,n,en]
 * @config {Function} [onresizestart] 开始改变大小时触发
 * @config {Function} [onresizeend] 大小改变结束时触发
 * @config {Function} [onresize] 大小改变后时触发
 * @config {Number|String} [maxWidth] 可改变的最大宽度
 * @config {Number|String} [maxHeight] 可改变的最大高度
 * @config {Number|String} [minWidth] 可改变的最小宽度
 * @config {Number|String} [minHeight] 可改变的最小高度
 * @config {String} [classPrefix] className 前缀
 * @config {Object} [directionHandlePosition] resizHandle的位置参数
 * @return {Object} {cancel:Function} cancel函数
 * @remark  需要将元素的定位设置为absolute
 * @author lixiaopeng
 * @version 1.3
 */
baidu.dom.resizable = /**@function*/function(element,options) {
    var target,
        op,
        resizeHandle = {},
        directionHandlePosition,
        orgStyles = {},
        range, mozUserSelect,
        orgCursor,
        offsetParent,
        currentEle,
        handlePosition,
        timer,
        isCancel = false,
        isResizabled = false,
        defaultOptions = {
            direction: ['e', 's', 'se'],
            minWidth: 16,
            minHeight: 16,
            classPrefix: 'tangram',
            directionHandlePosition: {}
        };

        
    if (!(target = baidu.dom.g(element)) && baidu.getStyle(target, 'position') == 'static') {
        return false;
    }
    offsetParent = target.offsetParent;
    var orgPosition = baidu.getStyle(target,'position');

    /*
     * 必要参数的扩展
     * resize handle以方向命名
     * 顺时针的顺序为
     * north northwest west southwest south southeast east northeast
     */
    op = baidu.extend(defaultOptions, options);

    /*
     * 必要参数转换
     */
    baidu.each(['minHeight', 'minWidth', 'maxHeight', 'maxWidth'], function(style) {
        op[style] && (op[style] = parseFloat(op[style]));
    });

    /*
     * {Array[Number]} rangeObject
     * minWidth,maxWidth,minHeight,maxHeight
     */
    range = [
        op.minWidth || 0,
        op.maxWidth || Number.MAX_VALUE,
        op.minHeight || 0,
        op.maxHeight || Number.MAX_VALUE
    ];

    render(); 

    /**
     * 绘制resizable handle 
     */
    function render(){
      
        //位置属性
        handlePosition = baidu.extend({
            'e' : {'right': '-5px', 'top': '0px', 'width': '7px', 'height': target.offsetHeight},
            's' : {'left': '0px', 'bottom': '-5px', 'height': '7px', 'width': target.offsetWidth},
            'n' : {'left': '0px', 'top': '-5px', 'height': '7px', 'width': target.offsetWidth},
            'w' : {'left': '-5px', 'top': '0px', 'height':target.offsetHeight , 'width': '7px'},
            'se': {'right': '1px', 'bottom': '1px', 'height': '16px', 'width': '16px'},
            'sw': {'left': '1px', 'bottom': '1px', 'height': '16px', 'width': '16px'},
            'ne': {'right': '1px', 'top': '1px', 'height': '16px', 'width': '16px'},
            'nw': {'left': '1px', 'top': '1px', 'height': '16px', 'width': '16px'}
        },op.directionHandlePosition);
        
        //创建resizeHandle
        baidu.each(op.direction, function(key) {
            var className = op.classPrefix.split(' ');
            className[0] = className[0] + '-resizable-' + key;

            var ele = baidu.dom.create('div', {
                className: className.join(' ')
            }),
                styles = handlePosition[key];

            styles['cursor'] = key + '-resize';
            styles['position'] = 'absolute';
            baidu.setStyles(ele, styles);
            
            ele.key = key;
            ele.style.MozUserSelect = 'none';

            target.appendChild(ele);
            resizeHandle[key] = ele;

            baidu.on(ele, 'mousedown',start);
        });

        isCancel = false;
    }

    /**
     * cancel resizeHandle
     * @public
     * @return  void
     */
    function cancel(){
        currentEle && stop();
        baidu.object.each(resizeHandle,function(item){
            baidu.un(item,"mousedown",start);
            baidu.dom.remove(item);
        });
        isCancel = true;    
    }

    /**
     * update resizable
     * @public 
     * @param {Object} options
     * @return null
     */
    function update(options){
        if(!isCancel){
            op = baidu.extend(op,options || {});
            cancel();
            render();
        }
    }

    /**
     * resizeHandle相应mousedown事件的函数
     * @param {Event} e
     * @return void
     */
    function start(e){
		isResizabled && stop();
        var ele = baidu.event.getTarget(e),
            key = ele.key;
        currentEle = ele;
		isResizabled = true;
		
        if (ele.setCapture) {
            ele.setCapture();
        } else if (window.captureEvents) {
            window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
        }

        /*
         * 给body设置相应的css属性
         * 添加事件监听
         */
        orgCursor = baidu.getStyle(document.body, 'cursor');
        baidu.setStyle(document.body, 'cursor', key + '-resize');
        baidu.on(document.body, 'mouseup',stop);
        baidu.on(document.body, 'selectstart', unselect);
        mozUserSelect = document.body.style.MozUserSelect;
        document.body.style.MozUserSelect = 'none';

        /*
         * 获取鼠标坐标
         * 偏移量计算
         */
        var orgMousePosition = baidu.page.getMousePosition();
        orgStyles = _getOrgStyle();
        timer = setInterval(function(){
            resize(key,orgMousePosition);
        }, 20);

        baidu.lang.isFunction(op.onresizestart) && op.onresizestart();
        baidu.event.preventDefault(e);
    }

    /**
     * 当鼠标按键抬起时终止对鼠标事件的监听
     * @private
     * @return void
     */
    function stop() {
        if (currentEle && currentEle.releaseCapture) {
            currentEle.releaseCapture();
        } else if (window.releaseEvents) {
            window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP);
        }

        /*
         * 删除事件监听
         * 还原css属性设置
         */
        baidu.un(document.body, 'mouseup',stop);
        baidu.un(document, 'selectstart', unselect);
        document.body.style.MozUserSelect = mozUserSelect;
        baidu.un(document.body, 'selectstart', unselect);

        clearInterval(timer);
        baidu.setStyle(document.body, 'cursor',orgCursor);
        currentEle = null;
		isResizabled = false;
        baidu.lang.isFunction(op.onresizeend) && op.onresizeend();
    }

    /**
     * 根据鼠标移动的距离来绘制target
     * @private
     * @param {String} key handle的direction字符串
     * @param {Object} orgMousePosition 鼠标坐标{x,y}
     * @return void
     */
    function resize(key,orgMousePosition) {
        var xy = baidu.page.getMousePosition(),
            width = orgStyles['width'],
            height = orgStyles['height'],
            top = orgStyles['top'],
            left = orgStyles['left'],
            styles;

        if (key.indexOf('e') >= 0) {
            width = Math.max(xy.x - orgMousePosition.x + orgStyles['width'], range[0]);
            width = Math.min(width, range[1]);
        }else if (key.indexOf('w') >= 0) {
            width = Math.max(orgMousePosition.x - xy.x + orgStyles['width'], range[0]);
            width = Math.min(width, range[1]);
            left -= width - orgStyles['width'];
       }

        if (key.indexOf('s') >= 0) {
            height = Math.max(xy.y - orgMousePosition.y + orgStyles['height'], range[2]);
            height = Math.min(height, range[3]);
        }else if (key.indexOf('n') >= 0) {
            height = Math.max(orgMousePosition.y - xy.y + orgStyles['height'], range[2]);
            height = Math.min(height, range[3]);
            top -= height - orgStyles['height'];
        }
         
        styles = {'width': width, 'height': height, 'top': top, 'left': left};
        baidu.dom.setOuterHeight(target,height);
        baidu.dom.setOuterWidth(target,width);
        baidu.setStyles(target,{"top":top,"left":left});

        resizeHandle['n'] && baidu.setStyle(resizeHandle['n'], 'width', width);
        resizeHandle['s'] && baidu.setStyle(resizeHandle['s'], 'width', width);
        resizeHandle['e'] && baidu.setStyle(resizeHandle['e'], 'height', height);
        resizeHandle['w'] && baidu.setStyle(resizeHandle['w'], 'height', height);

        baidu.lang.isFunction(op.onresize) && op.onresize({current:styles,original:orgStyles});
    }

    /**
     * 阻止文字被选中
     * @private
     * @param {Event} e
     * @return {Boolean}
     */
    function unselect(e) {
        return baidu.event.preventDefault(e, false);
    }

    /**
     * 获取target的原始宽高
     * @private
     * @return {Object} {width,height,top,left}
     */
    function _getOrgStyle() {
        var offset_parent = baidu.dom.getPosition(target.offsetParent),
            offset_target = baidu.dom.getPosition(target),
            top,
            left;
       
        if(orgPosition == "absolute"){
            top =  offset_target.top - (target.offsetParent == document.body ? 0 : offset_parent.top);
            left = offset_target.left - (target.offsetParent == document.body ? 0 :offset_parent.left);
        }else{
            top = parseFloat(baidu.getStyle(target,"top")) || -parseFloat(baidu.getStyle(target,"bottom")) || 0;
            left = parseFloat(baidu.getStyle(target,"left")) || -parseFloat(baidu.getStyle(target,"right")) || 0; 
        }
        baidu.setStyles(target,{top:top,left:left});

        return {
            width:target.offsetWidth,
            height:target.offsetHeight,
            top:top,
            left:left
        };
    }
    
    return {cancel:cancel,update:update,enable:render};
};
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 *
 * author: meizz
 * create: 2011-12-14
 */




/**
 * 给元素样式（比如width）赋值时，如果是数字则添加单位(px)，如果是其它值直接赋
 * @grammar baidu.dom.setPixel(el, style, n)
 * @param	{HTMLElement}	el 		DOM元素
 * @param 	{String}		style 	样式属性名
 * @param	{Number|String} n 		被赋的值
 */
baidu.dom.setPixel = function (el, style, n) {
	typeof n != "undefined" &&
	(baidu.dom.g(el).style[style] = n +(!isNaN(n) ? "px" : ""));
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/setPosition.js
 * author: berg
 * version: 1.0.0
 * date: 2010/12/14
 */









/**
 * 设置目标元素的top和left值到用户指定的位置
 * 
 * @name baidu.dom.setPosition
 * @function
 * @grammar baidu.dom.setPosition(element, position)
 * 
 * @param {HTMLElement|string}	element 	目标元素或目标元素的id
 * @param {object} 				position 	位置对象 {top: {number}, left : {number}}
 *
 * @return {HTMLElement}  进行设置的元素
 */
baidu.dom.setPosition = function (element, position) {
    return baidu.dom.setStyles(element, {
        left : position.left - (parseFloat(baidu.dom.getStyle(element, "margin-left")) || 0),
        top : position.top - (parseFloat(baidu.dom.getStyle(element, "margin-top")) || 0)
    });
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 显示目标元素，即将目标元素的display属性还原成默认值。默认值可能在stylesheet中定义，或者是继承了浏览器的默认样式值
 * @author allstar, berg
 * @name baidu.dom.show
 * @function
 * @grammar baidu.dom.show(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @remark
 * 注意1：如果在CSS中定义此元素的样式为display:none
 * 在调用本函数以后，会将display属性仍然还原成none，元素仍然无法显示。
 * 注意2：如果这个元素的display属性被设置成inline
 * （由element.style.display或者HTML中的style属性设置）
 * 调用本方法将清除此inline属性，导致元素的display属性变成继承值
 * 因此，针对上面两种情况，建议使用dom.setStyle("display", "something")
 * 来明确指定要设置的display属性值。
 * 
 * @shortcut show
 * @meta standard
 * @see baidu.dom.hide,baidu.dom.toggle
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.show = function (element) {
    element = baidu.dom.g(element);
    element.style.display = "";

    return element;
};

// 声明快捷方法
baidu.show = baidu.dom.show;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/toggle.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 改变目标元素的显示/隐藏状态
 * @name baidu.dom.toggle
 * @function
 * @grammar baidu.dom.toggle(element)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @meta standard
 * @see baidu.dom.show,baidu.dom.hide
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.dom.toggle = function (element) {
    element = baidu.dom.g(element);
    element.style.display = element.style.display == "none" ? "" : "none";

    return element;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/toggleClass.js
 * author: berg
 * version: 1.0
 * date: 2010-07-06
 */

/**
 * 添加或者删除一个节点中的指定class，如果已经有就删除，否则添加
 * @name baidu.dom.toggleClass
 * @function
 * @grammar baidu.dom.toggleClass(element, className)
 * @param {HTMLElement|string} element 目标元素或目标元素的id
 * @param {String} className 指定的className。允许同时添加多个class，中间使用空白符分隔
 * @version 1.3
 * @remark
 * 
 * 传入多个class时，只要其中有一个class不在当前元素中，则添加所有class，否则删除所有class。
 */





baidu.dom.toggleClass = function (element, className) {
    if(baidu.dom.hasClass(element, className)){
        baidu.dom.removeClass(element, className);
    }else{
        baidu.dom.addClass(element, className);
    }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFilter/color.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/02
 */



/**
 * 提供给setStyle与getStyle使用
 * @meta standard
 */
baidu.dom._styleFilter[baidu.dom._styleFilter.length] = {
    get: function (key, value) {
        if (/color/i.test(key) && value.indexOf("rgb(") != -1) {
            var array = value.split(",");

            value = "#";
            for (var i = 0, color; color = array[i]; i++){
                color = parseInt(color.replace(/[^\d]/gi, ''), 10).toString(16);
                value += color.length == 1 ? "0" + color : color;
            }

            value = value.toUpperCase();
        }

        return value;
    }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFixer/display.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/24
 */





/**
 * 提供给setStyle与getStyle使用
 * @meta standard
 */
baidu.dom._styleFixer.display = baidu.browser.ie && baidu.browser.ie < 8 ? { // berg: 修改到<8，因为ie7同样存在这个问题，from 先伟
    set: function (element, value) {
        element = element.style;
        if (value == 'inline-block') {
            element.display = 'inline';
            element.zoom = 1;
        } else {
            element.display = value;
        }
    }
} : baidu.browser.firefox && baidu.browser.firefox < 3 ? {
    set: function (element, value) {
        element.style.display = value == 'inline-block' ? '-moz-inline-box' : value;
    }
} : null;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All right reserved.
 * 
 * path: baidu/dom/_styleFixer/float.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 提供给setStyle与getStyle使用
 * @meta standard
 */
baidu.dom._styleFixer["float"] = baidu.browser.ie ? "styleFloat" : "cssFloat";
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFixer/opacity.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */




/**
 * 提供给setStyle与getStyle使用
 * @meta standard
 */
baidu.dom._styleFixer.opacity = baidu.browser.ie ? {
    get: function (element) {
        var filter = element.style.filter;
        return filter && filter.indexOf("opacity=") >= 0 ? (parseFloat(filter.match(/opacity=([^)]*)/)[1]) / 100) + "" : "1";
    },

    set: function (element, value) {
        var style = element.style;
        // 只能Quirks Mode下面生效??
        style.filter = (style.filter || "").replace(/alpha\([^\)]*\)/gi, "") + (value == 1 ? "" : "alpha(opacity=" + value * 100 + ")");
        // IE filters only apply to elements with "layout."
        style.zoom = 1;
    }
} : null;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/dom/_styleFixer/textOverflow.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/17
 */






/**
 * 提供给setStyle与getStyle使用，在做textOverflow时会向element对象中添加,_baiduOverflow, _baiduHTML两个属性保存原始的innerHTML信息
 */
baidu.dom._styleFixer.textOverflow = (function () {
    var fontSizeCache = {};

    function pop(list) {
        var o = list.length;
        if (o > 0) {
            o = list[o - 1];
            list.length--;
        } else {
            o = null;
        }
        return o;
    }

    function setText(element, text) {
        element[baidu.browser.firefox ? "textContent" : "innerText"] = text;
    }

    function count(element, width, ellipsis) {
        /* 计算cache的名称 */
        var o = baidu.browser.ie ? element.currentStyle || element.style : getComputedStyle(element, null),
            fontWeight = o.fontWeight,
            cacheName =
                "font-family:" + o.fontFamily + ";font-size:" + o.fontSize
                + ";word-spacing:" + o.wordSpacing + ";font-weight:" + ((parseInt(fontWeight) || 0) == 401 ? 700 : fontWeight)
                + ";font-style:" + o.fontStyle + ";font-variant:" + o.fontVariant,
            cache = fontSizeCache[cacheName];

        if (!cache) {
            o = element.appendChild(document.createElement("div"));

            o.style.cssText = "float:left;" + cacheName;
            cache = fontSizeCache[cacheName] = [];

            /* 计算ASCII字符的宽度cache */
            for (var i=0; i < 256; i++) {
                i == 32 ? (o.innerHTML = "&nbsp;") : setText(o, String.fromCharCode(i));
                cache[i] = o.offsetWidth;
            }

            /* 计算非ASCII字符的宽度、字符间距、省略号的宽度,\u4e00是汉字一的编码*/
            setText(o, "\u4e00");
            cache[256] = o.offsetWidth;
            setText(o, "\u4e00\u4e00");
            cache[257] = o.offsetWidth - cache[256] * 2;
            cache[258] = cache[".".charCodeAt(0)] * 3 + cache[257] * 3;

            element.removeChild(o);
        }

        for (
            /* wordWidth是每个字符或子节点计算之前的宽度序列 */
            var node = element.firstChild, charWidth = cache[256], wordSpacing = cache[257], ellipsisWidth = cache[258],
                wordWidth = [], ellipsis = ellipsis ? ellipsisWidth : 0;
            node;
            node = node.nextSibling
        ) {
            if (width < ellipsis) {
                element.removeChild(node);
            }
            else if (node.nodeType == 3) {
                for (var i = 0, text = node.nodeValue, length = text.length; i < length; i++) {
                    o = text.charCodeAt(i);
                    /* 计算增加字符后剩余的长度 */
                    wordWidth[wordWidth.length] = [width, node, i];
                    width -= (i ? wordSpacing : 0) + (o < 256 ? cache[o] : charWidth);
                    if (width < ellipsis) {
                        break;
                    }
                }
            }
            else {
                o = node.tagName;
                if (o == "IMG" || o == "TABLE") {
                    /* 特殊元素直接删除 */
                    o = node;
                    node = node.previousSibling;
                    element.removeChild(o);
                }
                else {
                    wordWidth[wordWidth.length] = [width, node];
                    width -= node.offsetWidth;
                }
            }
        }

        if (width < ellipsis) {
            /* 过滤直到能得到大于省略号宽度的位置 */
            while (o = pop(wordWidth)) {
                width = o[0];
                node = o[1];
                o = o[2];
                if (node.nodeType == 3) {
                    if (width >= ellipsisWidth) {
                        node.nodeValue = node.nodeValue.substring(0, o) + "...";
                        return true;
                    }
                    else if (!o) {
                        element.removeChild(node);
                    }
                }
                else if (count(node, width, true)) {
                    return true;
                }
                else {
                    element.removeChild(node);
                }
            }

            /* 能显示的宽度小于省略号的宽度，直接不显示 */
            element.innerHTML = "";
        }
    }

    return {
		get: function (element) {
            var browser = baidu.browser,
                getStyle = dom.getStyle;
			return (browser.opera ?
                        getStyle("OTextOverflow") :
                        browser.firefox ?
                            element._baiduOverflow :
                            getStyle("textOverflow")) ||
                   "clip";
		},

		set: function (element, value) {
            var browser = baidu.browser;
			if (element.tagName == "TD" || element.tagName == "TH" || browser.firefox) {
				element._baiduHTML && (element.innerHTML = element._baiduHTML);

				if (value == "ellipsis") {
					element._baiduHTML = element.innerHTML;
					var o = document.createElement("div"), width = element.appendChild(o).offsetWidth;
					element.removeChild(o);
					count(element, width);
				}
				else {
					element._baiduHTML = "";
				}
			}

			o = element.style;
			browser.opera ? (o.OTextOverflow = value) : browser.firefox ? (element._baiduOverflow = value) : (o.textOverflow = value);
		}
    };
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/isArray.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/30
 */



/**
 * 判断目标参数是否Array对象
 * @name baidu.lang.isArray
 * @function
 * @grammar baidu.lang.isArray(source)
 * @param {Any} source 目标参数
 * @meta standard
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isArray = function (source) {
    return '[object Array]' == Object.prototype.toString.call(source);
};
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/toArray.js
 * author: berg
 * version: 1.0
 * date: 2010-07-05
 */





/**
 * 将一个变量转换成array
 * @name baidu.lang.toArray
 * @function
 * @grammar baidu.lang.toArray(source)
 * @param {mix} source 需要转换成array的变量
 * @version 1.3
 * @meta standard
 * @returns {array} 转换后的array
 */
baidu.lang.toArray = function (source) {
    if (source === null || source === undefined)
        return [];
    if (baidu.lang.isArray(source))
        return source;

    // The strings and functions also have 'length'
    if (typeof source.length !== 'number' || typeof source === 'string' || baidu.lang.isFunction(source)) {
        return [source];
    }

    //nodeList, IE 下调用 [].slice.call(nodeList) 会报错
    if (source.item) {
        var l = source.length, array = new Array(l);
        while (l--)
            array[l] = source[l];
        return array;
    }

    return [].slice.call(source);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/fn/methodize.js
 * author: berg
 * version: 1.0.0
 * date: 2010/11/02 
 */



/**
 * 将一个静态函数变换成一个对象的方法，使其的第一个参数为this，或this[attr]
 * @name baidu.fn.methodize
 * @function
 * @grammar baidu.fn.methodize(func[, attr])
 * @param {Function}	func	要方法化的函数
 * @param {string}		[attr]	属性
 * @version 1.3
 * @returns {Function} 已方法化的函数
 */
baidu.fn.methodize = function (func, attr) {
    return function(){
        return func.apply(this, [(attr ? this[attr] : this)].concat([].slice.call(arguments)));
    };
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 包装函数的返回值，使其在能按照index指定的方式返回。<br/>如果其值为-1，直接返回返回值。 <br/>如果其值为0，返回"返回值"的包装结果。<br/> 如果其值大于0，返回第i个位置的参数的包装结果（从1开始计数）
 * @author berg
 * @name baidu.fn.wrapReturnValue
 * @function
 * @grammar baidu.fn.wrapReturnValue(func, wrapper, mode)
 * @param {function} func    需要包装的函数
 * @param {function} wrapper 包装器
 * @param {number} 包装第几个参数
 * @version 1.3.5
 * @return {function} 包装后的函数
 */
baidu.fn.wrapReturnValue = function (func, wrapper, mode) {
    mode = mode | 0;
    return function(){
        var ret = func.apply(this, arguments); 

        if(mode > 0){
            return new wrapper(arguments[mode - 1]);
        }
        if(!mode){
            return new wrapper(ret);
        }
        return ret;
    }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/fn/multize.js
 * author: berg
 * version: 1.0.0
 * date: 2010/11/02 
 */



/**
 * 对函数进行集化，使其在第一个参数为array时，结果也返回一个数组
 * @name baidu.fn.multize
 * @function
 * @grammar baidu.fn.multize(func[, recursive])
 * @param {Function}	func 		需要包装的函数
 * @param {Boolean}		[recursive] 是否递归包装（如果数组里面一项仍然是数组，递归），可选
 * @param {Boolean}		[joinArray] 将操作的结果展平后返回（如果返回的结果是数组，则将多个数组合成一个），可选
 * @version 1.3
 *
 * @returns {Function} 已集化的函数
 */
baidu.fn.multize = /**@function*/function (func, recursive, joinArray) {
    var newFunc = function(){
        var list = arguments[0],
            fn = recursive ? newFunc : func,
            ret = [],
            moreArgs = [].slice.call(arguments,0),
            i = 0,
            len,
            r;

        if(list instanceof Array){
            for(len = list.length; i < len; i++){
                moreArgs[0]=list[i];
                r = fn.apply(this, moreArgs);
                if (joinArray) {
                    if (r) {
                        //TODO: 需要去重吗？
                        ret = ret.concat(r);
                    }
                } else {
                    ret.push(r); 	
                }
            }
            return ret;
        }else{
            return func.apply(this, arguments);
        }
    }
    return newFunc;
};
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All right reserved.
 * 
 * path: baidu/dom/element.js
 * author: berg
 * version: 1.0.0
 * date: 2010-07-12
 */














/**
 * 通过该方法封装的对象可使用dom、event方法集合以及each方法进行链式调用
 * @namespace baidu.element
 */
baidu.element = function(node){
    var gNode = baidu._g(node);
    if(!gNode && baidu.dom.query){
        gNode = baidu.dom.query(node);
    }
    return new baidu.element.Element(gNode);
};
// 声明快捷方法
baidu.e = baidu.element;

/**
 * Element类，所有扩展到链条上的方法都会被放在这里面
 * @name baidu.element.Element
 * @grammar baidu.element.Element(node)
 * @param {DOMElement|NodeList} node   目标元素，可以是数组或者单个node节点
 * @returns {ElementObj} 包装后的DOM对象
 * @version 1.3
 */
baidu.element.Element = function(node){
    if(!baidu.element._init){
        //由于element可能会在其他代码之前加载，因此用这个方法来延迟加载
        baidu.element._makeChain();
        baidu.element._init = true;
    }
    /**
     * @private
     * @type {Array.<Node>}
     */
    this._dom = (node.tagName || '').toLowerCase() == 'select' ? 
    	[node] : baidu.lang.toArray(node);
};

/**
 * 以每一个匹配的元素作为上下文执行传递进来的函数，方便用户自行遍历dom。
 * @name baidu.element.each
 * @function
 * @grammar baidu.element(node).each(iterator)
 * @param {Function} iterator 遍历Dom时调用的方法
 * @version 1.3
 */
baidu.element.Element.prototype.each = function(iterator) {
    // 每一个iterator接受到的都是封装好的node
    baidu.array.each(this._dom, function(node, i){
        iterator.call(node, node, i);
    });
};

/*
 * 包装静态方法，使其变成一个链条方法。
 * 先把静态方法multize化，让其支持接受数组参数，
 * 然后包装返回值，返回值是一个包装类
 * 最后把静态方法methodize化，让其变成一个对象方法。
 *
 * @param {Function}    func    要包装的静态方法
 * @param {number}      index   包装函数的第几个返回值
 *
 * @return {function}   包装后的方法，能直接挂到Element的prototype上。
 * @private
 */
baidu.element._toChainFunction = function(func, index, joinArray){
    return baidu.fn.methodize(baidu.fn.wrapReturnValue(baidu.fn.multize(func, 0, 1), baidu.element.Element, index), '_dom');
};

/**
 * element对象包装了dom包下的除了drag和ready,create,ddManager之外的大部分方法。这样做的目的是提供更为方便的链式调用操作。其中doms代指dom包下的方法名。
 * @name baidu.element.doms
 * @function
 * @grammar baidu.element(node).doms
 * @param 详见dom包下相应方法的参数。
 * @version 1.3
 * @private
 */
baidu.element._makeChain = function(){ //将dom/event包下的东西挂到prototype里面
    var proto = baidu.element.Element.prototype,
        fnTransformer = baidu.element._toChainFunction;

    //返回值是第一个参数的包装
    baidu.each(("draggable droppable resizable fixable").split(' '),
              function(fn){
                  proto[fn] =  fnTransformer(baidu.dom[fn], 1);
              });

    //直接返回返回值
    baidu.each(("remove getText contains getAttr getPosition getStyle hasClass intersect hasAttr getComputedStyle").split(' '),
              function(fn){
                  proto[fn] = proto[fn.replace(/^get[A-Z]/g, stripGet)] = fnTransformer(baidu.dom[fn], -1);
              });

    //包装返回值
    //包含
    //1. methodize
    //2. multize，结果如果是数组会被展平
    //3. getXx == xx
    baidu.each(("addClass empty hide show insertAfter insertBefore insertHTML removeClass " + 
              "setAttr setAttrs setStyle setStyles show toggleClass toggle next first " + 
              "getAncestorByClass getAncestorBy getAncestorByTag getDocument getParent getWindow " +
              "last next prev g removeStyle setBorderBoxSize setOuterWidth setOuterHeight " +
              "setBorderBoxWidth setBorderBoxHeight setPosition children query").split(' '),
              function(fn){
                  proto[fn] = proto[fn.replace(/^get[A-Z]/g, stripGet)] = fnTransformer(baidu.dom[fn], 0);
              });

    //对于baidu.dom.q这种特殊情况，将前两个参数调转
    //TODO：需要将这种特殊情况归纳到之前的情况中
    proto['q'] = proto['Q'] = fnTransformer(function(arg1, arg2){
        return baidu.dom.q.apply(this, [arg2, arg1].concat([].slice.call(arguments, 2)));
    }, 0);

    //包装event中的on 和 un
    baidu.each(("on un").split(' '), function(fn){
        proto[fn] = fnTransformer(baidu.event[fn], 0);
    });
  
    /** 
     * 方法提供了事件绑定的快捷方式，事件发生时会触发传递进来的函数。events代指事件方法的总和。
     * @name baidu.element.events 
     * @function
     * @grammar baidu.element(node).events(fn)
     * @param {Function} fn 事件触发时要调用的方法
     * @version 1.3
     * @remark 包装event的快捷方式具体包括blur、focus、focusin、focusout、load 、resize 、scroll 、unload 、click、 dblclick、mousedown 、mouseup 、mousemove、 mouseover 、mouseout 、mouseenter、 mouseleave、change 、select 、submit 、keydown、 keypress 、keyup、 error。
     * @returns {baidu.element} Element对象
     */
    //包装event的快捷方式
    baidu.each(("blur focus focusin focusout load resize scroll unload click dblclick " +
                "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + 
                "change select submit keydown keypress keyup error").split(' '), function(fnName){
        proto[fnName] = function(fn){
            return this.on(fnName, fn);
        };
    });


    /**
     * 把get去掉
     * 链里面的方法可以不以get开头调用
     * 如 baidu.element("myDiv").parent() == baidu.element("myDiv").getParent();
     * TODO: 合并getter和setter. baidu.e('myDiv').style() &  baidu.e('myDiv').style('width', '100');
     */
    function stripGet(match) {  
        return match.charAt(3).toLowerCase();
    }
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/element/extend.js
 * author: berg
 * version: 1.0.0
 * date: 2010/12/16
 */







 /**
 * 为element对象扩展一个方法。
 * @name baidu.element.extend
 * @function
 * @grammar baidu.element.extend(json)
 * @param {Object} json 要扩展的方法名以及方法
 * @version 1.3
 * @shortcut e
 * @returns {baidu.element.Element} Element对象
 *
 */
baidu.element.extend = function(json){
    var e = baidu.element;
    baidu.object.each(json, function(item, key){
        e.Element.prototype[key] = baidu.element._toChainFunction(item, -1);
    });
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/EventArg.js
 * author: erik
 * version: 1.1.0
 * date: 2010/01/11
 */



/**
 * 事件对象构造器，屏蔽浏览器差异的事件类
 * @name baidu.event.EventArg
 * @class
 * @grammar baidu.event.EventArg(event[, win])
 * @param {Event}   event   事件对象
 * @param {Window}  [win]	窗口对象，默认为window
 * @meta standard
 * @remark 1.1.0开始支持
 * @see baidu.event.get
 */
baidu.event.EventArg = function (event, win) {
    win = win || window;
    event = event || win.event;
    var doc = win.document;
    
    this.target = /** @type {Node} */ (event.target) || event.srcElement;
    this.keyCode = event.which || event.keyCode;
    for (var k in event) {
        var item = event[k];
        // 避免拷贝preventDefault等事件对象方法
        if ('function' != typeof item) {
            this[k] = item;
        }
    }
    
    if (!this.pageX && this.pageX !== 0) {
        this.pageX = (event.clientX || 0) 
                        + (doc.documentElement.scrollLeft 
                            || doc.body.scrollLeft);
        this.pageY = (event.clientY || 0) 
                        + (doc.documentElement.scrollTop 
                            || doc.body.scrollTop);
    }
    this._event = event;
};

/**
 * 阻止事件的默认行为
 * @name preventDefault
 * @grammar eventArgObj.preventDefault()
 * @returns {baidu.event.EventArg} EventArg对象
 */
baidu.event.EventArg.prototype.preventDefault = function () {
    if (this._event.preventDefault) {
        this._event.preventDefault();
    } else {
        this._event.returnValue = false;
    }
    return this;
};

/**
 * 停止事件的传播
 * @name stopPropagation
 * @grammar eventArgObj.stopPropagation()
 * @returns {baidu.event.EventArg} EventArg对象
 */
baidu.event.EventArg.prototype.stopPropagation = function () {
    if (this._event.stopPropagation) {
        this._event.stopPropagation();
    } else {
        this._event.cancelBubble = true;
    }
    return this;
};

/**
 * 停止事件
 * @name stop
 * @grammar eventArgObj.stop()
 * @returns {baidu.event.EventArg} EventArg对象
 */
baidu.event.EventArg.prototype.stop = function () {
    return this.stopPropagation().preventDefault();
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/object/values.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 获取目标对象的值列表
 * @name baidu.object.values
 * @function
 * @grammar baidu.object.values(source)
 * @param {Object} source 目标对象
 * @see baidu.object.keys
 *             
 * @returns {Array} 值列表
 */
baidu.object.values = function (source) {
    var result = [], resultLen = 0, k;
    for (k in source) {
        if (source.hasOwnProperty(k)) {
            result[resultLen++] = source[k];
        }
    }
    return result;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/fire.js
 * author: linlingyu
 * version: 1.1.0
 * date: 2010/10/28
 */






/**
 * 触发已经注册的事件。注：在ie下不支持load和unload事件
 * @name baidu.event.fire
 * @function
 * @grammar baidu.event.fire(element, type, options)
 * @param {HTMLElement|string|window} element 目标元素或目标元素id
 * @param {string} type 事件类型
 * @param {Object} options 触发的选项
				
 * @param {Boolean} options.bubbles 是否冒泡
 * @param {Boolean} options.cancelable 是否可以阻止事件的默认操作
 * @param {window|null} options.view 指定 Event 的 AbstractView
 * @param {1|Number} options.detail 指定 Event 的鼠标单击量
 * @param {Number} options.screenX 指定 Event 的屏幕 x 坐标
 * @param {Number} options.screenY number 指定 Event 的屏幕 y 坐标
 * @param {Number} options.clientX 指定 Event 的客户端 x 坐标
 * @param {Number} options.clientY 指定 Event 的客户端 y 坐标
 * @param {Boolean} options.ctrlKey 指定是否在 Event 期间按下 ctrl 键
 * @param {Boolean} options.altKey 指定是否在 Event 期间按下 alt 键
 * @param {Boolean} options.shiftKey 指定是否在 Event 期间按下 shift 键
 * @param {Boolean} options.metaKey 指定是否在 Event 期间按下 meta 键
 * @param {Number} options.button 指定 Event 的鼠标按键
 * @param {Number} options.keyCode 指定 Event 的键盘按键
 * @param {Number} options.charCode 指定 Event 的字符编码
 * @param {HTMLElement} options.relatedTarget 指定 Event 的相关 EventTarget
 * @version 1.3
 *             
 * @returns {HTMLElement} 目标元素
 */
(function(){
	var browser = baidu.browser,
	keys = {
		keydown : 1,
		keyup : 1,
		keypress : 1
	},
	mouses = {
		click : 1,
		dblclick : 1,
		mousedown : 1,
		mousemove : 1,
		mouseup : 1,
		mouseover : 1,
		mouseout : 1
	},
	htmls = {
		abort : 1,
		blur : 1,
		change : 1,
		error : 1,
		focus : 1,
		load : browser.ie ? 0 : 1,
		reset : 1,
		resize : 1,
		scroll : 1,
		select : 1,
		submit : 1,
		unload : browser.ie ? 0 : 1
	},
	bubblesEvents = {
		scroll : 1,
		resize : 1,
		reset : 1,
		submit : 1,
		change : 1,
		select : 1,
		error : 1,
		abort : 1
	},
	parameters = {
		"KeyEvents" : ["bubbles", "cancelable", "view", "ctrlKey", "altKey", "shiftKey", "metaKey", "keyCode", "charCode"],
		"MouseEvents" : ["bubbles", "cancelable", "view", "detail", "screenX", "screenY", "clientX", "clientY", "ctrlKey", "altKey", "shiftKey", "metaKey", "button", "relatedTarget"],
		"HTMLEvents" : ["bubbles", "cancelable"],
		"UIEvents" : ["bubbles", "cancelable", "view", "detail"],
		"Events" : ["bubbles", "cancelable"]
	};
	baidu.object.extend(bubblesEvents, keys);
	baidu.object.extend(bubblesEvents, mouses);
	function parse(array, source){//按照array的项在source中找到值生成新的obj并把source中对应的array的项删除
		var i = 0, size = array.length, obj = {};
		for(; i < size; i++){
			obj[array[i]] = source[array[i]];
			delete source[array[i]];
		}
		return obj;
	};
	function eventsHelper(type, eventType, options){//非IE内核的事件辅助
		options = baidu.object.extend({}, options);
		var param = baidu.object.values(parse(parameters[eventType], options)),
			evnt = document.createEvent(eventType);
		param.unshift(type);
		if("KeyEvents" == eventType){
			evnt.initKeyEvent.apply(evnt, param);
		}else if("MouseEvents" == eventType){
			evnt.initMouseEvent.apply(evnt, param);
		}else if("UIEvents" == eventType){
			evnt.initUIEvent.apply(evnt, param);
		}else{//HTMMLEvents, Events
			evnt.initEvent.apply(evnt, param);
		}
		baidu.object.extend(evnt, options);//把多出来的options再附加上去,这是为解决当创建一个其它event时，当用Events代替后需要把参数附加到对象上
		return evnt;
	};
	function eventObject(options){//ie内核的构建方式
		var evnt;
		if(document.createEventObject){
			evnt = document.createEventObject();
			baidu.object.extend(evnt, options);
		}
		return evnt;
	};
	function keyEvents(type, options){//keyEvents
		options = parse(parameters["KeyEvents"], options);
		var evnt;
		if(document.createEvent){
			try{//opera对keyEvents的支持极差
				evnt = eventsHelper(type, "KeyEvents", options);
			}catch(keyError){
				try{
					evnt = eventsHelper(type, "Events", options);
				}catch(evtError){
					evnt = eventsHelper(type, "UIEvents", options);
				}
			}
		}else{
			options.keyCode = options.charCode > 0 ? options.charCode : options.keyCode;
			evnt = eventObject(options);
		}
		return evnt;
	};
	function mouseEvents(type, options){//mouseEvents
		options = parse(parameters["MouseEvents"], options);
		var evnt;
		if(document.createEvent){
			evnt = eventsHelper(type, "MouseEvents", options);//mouseEvents基本浏览器都支持
			if(options.relatedTarget && !evnt.relatedTarget){
				if("mouseout" == type.toLowerCase()){
					evnt.toElement = options.relatedTarget;
				}else if("mouseover" == type.toLowerCase()){
					evnt.fromElement = options.relatedTarget;
				}
			}
		}else{
			options.button = options.button == 0 ? 1
								: options.button == 1 ? 4
									: baidu.lang.isNumber(options.button) ? options.button : 0;
			evnt = eventObject(options);
		}
		return evnt;
	};
	function htmlEvents(type, options){//htmlEvents
		options.bubbles = bubblesEvents.hasOwnProperty(type);
		options = parse(parameters["HTMLEvents"], options);
		var evnt;
		if(document.createEvent){
			try{
				evnt = eventsHelper(type, "HTMLEvents", options);
			}catch(htmlError){
				try{
					evnt = eventsHelper(type, "UIEvents", options);
				}catch(uiError){
					evnt = eventsHelper(type, "Events", options);
				}
			}
		}else{
			evnt = eventObject(options);
		}
		return evnt;
	};
	baidu.event.fire = function(element, type, options){
		var evnt;
		type = type.replace(/^on/i, "");
		element = baidu.dom._g(element);
		options = baidu.object.extend({
			bubbles : true,
			cancelable : true,
			view : window,
			detail : 1,
			screenX : 0,
			screenY : 0,
			clientX : 0,
			clientY : 0,
			ctrlKey : false,
			altKey  : false,
			shiftKey: false,
			metaKey : false,
			keyCode : 0,
			charCode: 0,
			button  : 0,
			relatedTarget : null
		}, options);
		if(keys[type]){
			evnt = keyEvents(type, options);
		}else if(mouses[type]){
			evnt = mouseEvents(type, options);
		}else if(htmls[type]){
			evnt = htmlEvents(type, options);
		}else{
		    throw(new Error(type + " is not support!"));
		}
		if(evnt){//tigger event
			if(element.dispatchEvent){
				element.dispatchEvent(evnt);
			}else if(element.fireEvent){
				element.fireEvent("on" + type, evnt);
			}
		}
	}
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/get.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 获取扩展的EventArg对象
 * @name baidu.event.get
 * @function
 * @grammar baidu.event.get(event[, win])
 * @param {Event} event 事件对象
 * @param {window} [win] 触发事件元素所在的window
 * @meta standard
 * @see baidu.event.EventArg
 *             
 * @returns {EventArg} 扩展的事件对象
 */
baidu.event.get = function (event, win) {
    return new baidu.event.EventArg(event, win);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: baidu/event/getEvent.js
 * author: xiadengping
 * version: 1.6.0
 * date: 2011/12/08
 */



/**
 * 获取事件对象
 * @name baidu.event.getEvent
 * @function
 * @param {Event} event event对象，目前没有使用这个参数，只是保留接口。by dengping.
 * @grammar baidu.event.getEvent()
 * @meta standard
 * @return {Event} event对象.
 */

baidu.event.getEvent = function(event) {
    if (window.event) {
        return window.event;
    } else {
        var f = arguments.callee;
        do { //此处参考Qwrap框架 see http://www.qwrap.com/ by dengping
            if (/Event/.test(f.arguments[0])) {
                return f.arguments[0];
            }
        } while (f = f.caller);
        return null;
    }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/getKeyCode.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/23
 */


/**
 * 获取键盘事件的键值
 * @name baidu.event.getKeyCode
 * @function
 * @grammar baidu.event.getKeyCode(event)
 * @param {Event} event 事件对象
 *             
 * @returns {number} 键盘事件的键值
 */
baidu.event.getKeyCode = function (event) {
    return event.which || event.keyCode;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/getPageX.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/16
 */



/**
 * 获取鼠标事件的鼠标x坐标
 * @name baidu.event.getPageX
 * @function
 * @grammar baidu.event.getPageX(event)
 * @param {Event} event 事件对象
 * @see baidu.event.getPageY
 *             
 * @returns {number} 鼠标事件的鼠标x坐标
 */
baidu.event.getPageX = function (event) {
    var result = event.pageX,
        doc = document;
    if (!result && result !== 0) {
        result = (event.clientX || 0) 
                    + (doc.documentElement.scrollLeft 
                        || doc.body.scrollLeft);
    }
    return result;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/getPageY.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/16
 */



/**
 * 获取鼠标事件的鼠标y坐标
 * @name baidu.event.getPageY
 * @function
 * @grammar baidu.event.getPageY(event)
 * @param {Event} event 事件对象
 * @see baidu.event.getPageX
 *             
 * @returns {number} 鼠标事件的鼠标y坐标
 */
baidu.event.getPageY = function (event) {
    var result = event.pageY,
        doc = document;
    if (!result && result !== 0) {
        result = (event.clientY || 0) 
                    + (doc.documentElement.scrollTop 
                        || doc.body.scrollTop);
    }
    return result;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/once.js
 * author: wangcheng
 * version: 1.1.0
 * date: 2010/10/29
 */





/**
 * 为目标元素添加一次事件绑定
 * @name baidu.event.once
 * @function
 * @grammar baidu.event.once(element, type, listener)
 * @param {HTMLElement|string} element 目标元素或目标元素id
 * @param {string} type 事件类型
 * @param {Function} listener 需要添加的监听器
 * @version 1.3
 * @see baidu.event.un,baidu.event.on
 *             
 * @returns {HTMLElement} 目标元素
 */
baidu.event.once = /**@function*/function(element, type, listener){
    element = baidu.dom._g(element);
    function onceListener(event){
        listener.call(element,event);
        baidu.event.un(element, type, onceListener);
    } 
    
    baidu.event.on(element, type, onceListener);
    return element;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/stopPropagation.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/23
 */



/**
 * 阻止事件传播
 * @name baidu.event.stopPropagation
 * @function
 * @grammar baidu.event.stopPropagation(event)
 * @param {Event} event 事件对象
 * @see baidu.event.stop,baidu.event.preventDefault
 */
baidu.event.stopPropagation = function (event) {
   if (event.stopPropagation) {
       event.stopPropagation();
   } else {
       event.cancelBubble = true;
   }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/stop.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/23
 */




/**
 * 停止事件
 * @name baidu.event.stop
 * @function
 * @grammar baidu.event.stop(event)
 * @param {Event} event 事件对象
 * @see baidu.event.stopPropagation,baidu.event.preventDefault
 */
baidu.event.stop = function (event) {
    var e = baidu.event;
    e.stopPropagation(event);
    e.preventDefault(event);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/_eventFilter.js
 * author: rocy
 * version: 1.0.0
 * date: 2010/10/29
 */


baidu.event._eventFilter = baidu.event._eventFilter || {};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/_eventFilter/_crossElementBoundary.js
 * author: Rocy, berg
 * version: 1.0.0
 * date: 2010/12/16
 */





/**
 * 事件仅在鼠标进入/离开元素区域触发一次，当鼠标在元素区域内部移动的时候不会触发，用于为非IE浏览器添加mouseleave/mouseenter支持。
 * 
 * @name baidu.event._eventFilter._crossElementBoundary
 * @function
 * @grammar baidu.event._eventFilter._crossElementBoundary(listener, e)
 * 
 * @param {function} listener	要触发的函数
 * @param {DOMEvent} e 			DOM事件
 */

baidu.event._eventFilter._crossElementBoundary = function(listener, e){
    var related = e.relatedTarget,
        current = e.currentTarget;
    if(
       related === false || 
       // 如果current和related都是body，contains函数会返回false
       current == related ||
       // Firefox有时会把XUL元素作为relatedTarget
       // 这些元素不能访问parentNode属性
       // thanks jquery & mootools
       (related && (related.prefix == 'xul' ||
       //如果current包含related，说明没有经过current的边界
       baidu.dom.contains(current, related)))
      ){
        return ;
    }
    return listener.call(current, e);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/fn/bind.js
 * author: berg
 * version: 1.0.0
 * date: 2010/11/02 
 */





/** 
 * 为对象绑定方法和作用域
 * @name baidu.fn.bind
 * @function
 * @grammar baidu.fn.bind(handler[, obj, args])
 * @param {Function|String} handler 要绑定的函数，或者一个在作用域下可用的函数名
 * @param {Object} obj 执行运行时this，如果不传入则运行时this为函数本身
 * @param {args* 0..n} args 函数执行时附加到执行时函数前面的参数
 * @version 1.3
 *
 * @returns {Function} 封装后的函数
 */
baidu.fn.bind = function(func, scope) {
    var xargs = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
    return function () {
        var fn = baidu.lang.isString(func) ? scope[func] : func,
            args = (xargs) ? xargs.concat([].slice.call(arguments, 0)) : arguments;
        return fn.apply(scope || fn, args);
    };
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/_eventFilter/mouseenter.js
 * author: Rocy
 * version: 1.0.0
 * date: 2010/11/09
 */





/**
 * 用于为非IE浏览器添加mouseenter的支持;
 * mouseenter事件仅在鼠标进入元素区域触发一次,
 *    当鼠标在元素内部移动的时候不会多次触发.
 */
baidu.event._eventFilter.mouseenter = window.attachEvent ? null : function(element,type, listener){
	return {
		type: "mouseover",
		listener: baidu.fn.bind(baidu.event._eventFilter._crossElementBoundary, this, listener)
	}
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/event/_eventFilter/mouseleave.js
 * author: Rocy, berg
 * version: 1.0.0
 * date: 2010/11/09
 */




/**
 * 用于为非IE浏览器添加mouseleave的支持;
 * mouseleave事件仅在鼠标移出元素区域触发一次,
 *    当鼠标在元素区域内部移动的时候不会触发.
 */
baidu.event._eventFilter.mouseleave = window.attachEvent ? null : function(element,type, listener){
	return {
		type: "mouseout",
		listener: baidu.fn.bind(baidu.event._eventFilter._crossElementBoundary, this, listener)
	}
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: baidu/event/_unload.js
 * author: erik, berg
 * version: 1.1.0
 * date: 2009/12/16
 */




/**
 * 卸载所有事件监听器
 * @private
 */
baidu.event._unload = function() {
    var lis = baidu.event._listeners,
        len = lis.length,
        standard = !!window.removeEventListener,
        item, el;

    while (len--) {
        item = lis[len];
        //20100409 berg: 不解除unload的绑定，保证用户的事件一定会被执行
        //否则用户挂载进入的unload事件也可能会在这里被删除
        if (item[1] == 'unload') {
            continue;
        }
        //如果el被移除，不做判断将导致js报错
        if (!(el = item[0])) {
            continue;
        }
        if (el.removeEventListener) {
            el.removeEventListener(item[1], item[3], false);
        } else if (el.detachEvent) {
            el.detachEvent('on' + item[1], item[3]);
        }
    }

    if (standard) {
        window.removeEventListener('unload', baidu.event._unload, false);
    } else {
        window.detachEvent('onunload', baidu.event._unload);
    }
};

// 在页面卸载的时候，将所有事件监听器移除
if (window.attachEvent) {
    window.attachEvent('onunload', baidu.event._unload);
} else {
    window.addEventListener('unload', baidu.event._unload, false);
}
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 *
 * path: baidu/fn/abstractMethod.js
 * author: leeight
 * version: 1.0.0
 * date: 2011/04/29
 */



/**
 * 定义一个抽象方法
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 * @see goog.abstractMethod
 */
baidu.fn.abstractMethod = function() {
    throw Error('unimplemented abstract method');
};
﻿/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: baidu/fn.js
 * author: qiaoyue
 * version: 1.0.0
 * date: 2011/12/23
 */


/**
 * 对form的操作，解决表单数据问题
 * @namespace baidu.form
 */
baidu.form = baidu.form || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/form/json.js
 * author: qiaoyue
 * version: 1.1.0
 * date: 2011/12/23
 */




/**
 * josn化表单数据
 * @name baidu.form.json
 * @function
 * @grammar baidu.form.json(form[, replacer])
 * @param {HTMLFormElement} form        需要提交的表单元素
 * @param {Function} replacer           对参数值特殊处理的函数,replacer(string value, string key)
	           
 * @returns {data} 表单数据js对象
 */
baidu.form.json = function (form, replacer) {
    var elements = form.elements,
        replacer = replacer || function (value, name) {
            return value;
        },
        data = {},
        item, itemType, itemName, itemValue, 
        opts, oi, oLen, oItem;
        
    /**
     * 向缓冲区添加参数数据
     * @private
     */
    function addData(name, value) {
        var val = data[name];
        if(val){
            val.push || ( data[name] = [val] );
            data[name].push(value);
        }else{
            data[name] = value;
        }
    }
    
    for (var i = 0, len = elements.length; i < len; i++) {
        item = elements[i];
        itemName = item.name;
        
        // 处理：可用并包含表单name的表单项
        if (!item.disabled && itemName) {
            itemType = item.type;
            itemValue = baidu.url.escapeSymbol(item.value);
        
            switch (itemType) {
            // radio和checkbox被选中时，拼装queryString数据
            case 'radio':
            case 'checkbox':
                if (!item.checked) {
                    break;
                }
                
            // 默认类型，拼装queryString数据
            case 'textarea':
            case 'text':
            case 'password':
            case 'hidden':
            case 'file':
            case 'select-one':
                addData(itemName, replacer(itemValue, itemName));
                break;
                
            // 多行选中select，拼装所有选中的数据
            case 'select-multiple':
                opts = item.options;
                oLen = opts.length;
                for (oi = 0; oi < oLen; oi++) {
                    oItem = opts[oi];
                    if (oItem.selected) {
                        addData(itemName, replacer(oItem.value, itemName));
                    }
                }
                break;
            }
        }
    }

    return data;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/form/serialize.js
 * author: qiaoyue
 * version: 1.1.0
 * date: 2011/12/23
 */




/**
 * 序列化表单数据
 * @name baidu.form.serialize
 * @function
 * @grammar baidu.form.serialize(form[, replacer])
 * @param {HTMLFormElement} form        需要提交的表单元素
 * @param {Function} replacer           对参数值特殊处理的函数,replacer(string value, string key)
	           
 * @returns {data} 表单数据数组
 */
baidu.form.serialize = function (form, replacer) {
    var elements = form.elements,
        replacer = replacer || function (value, name) {
            return value;
        },
        data = [],
        item, itemType, itemName, itemValue, 
        opts, oi, oLen, oItem;
        
    /**
     * 向缓冲区添加参数数据
     * @private
     */
    function addData(name, value) {
        data.push(name + '=' + value);
    }
    
    for (var i = 0, len = elements.length; i < len; i++) {
        item = elements[i];
        itemName = item.name;
        
        // 处理：可用并包含表单name的表单项
        if (!item.disabled && itemName) {
            itemType = item.type;
            itemValue = baidu.url.escapeSymbol(item.value);
        
            switch (itemType) {
            // radio和checkbox被选中时，拼装queryString数据
            case 'radio':
            case 'checkbox':
                if (!item.checked) {
                    break;
                }
                
            // 默认类型，拼装queryString数据
            case 'textarea':
            case 'text':
            case 'password':
            case 'hidden':
            case 'file':
            case 'select-one':
                addData(itemName, replacer(itemValue, itemName));
                break;
                
            // 多行选中select，拼装所有选中的数据
            case 'select-multiple':
                opts = item.options;
                oLen = opts.length;
                for (oi = 0; oi < oLen; oi++) {
                    oItem = opts[oi];
                    if (oItem.selected) {
                        addData(itemName, replacer(oItem.value, itemName));
                    }
                }
                break;
            }
        }
    }

    return data;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * version: 1.4.0
 * date: 2011/07/05
 */



/**
 * @namespace baidu.global 操作global对象的方法。
 * @author meizz
 */
baidu.global = baidu.global || {};

// 将全局存放在的变量都集中到一个地方
window[baidu.guid].global = window[baidu.guid].global || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * version: 1.4.0
 * date: 2011/07/05
 */



/**
 * @namespace baidu.global.get 取得global全局对象里存储的信息。
 * @author meizz
 *
 * @param   {string}    key     信息对应的 key 值
 * @return  {object}            信息
 */
(function(){
    var global = window[baidu.guid].global;

    baidu.global.get = function(key) {
        return global[key];
    };
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * version: 1.4.0
 * date: 2011/07/05
 */



/**
 * @namespace baidu.global.set 向global全局对象里存储信息。
 * @author meizz
 *
 * @param   {string}    key         信息对应的 key 值
 * @param   {object}    value       被存储的信息
 * @param   {boolean}   protected_  保护原值不被覆盖，默认值 false 可覆盖
 * @return  {object}                信息
 */
(function(){
    var global = window[baidu.guid].global;

    baidu.global.set = function(key, value, protected_) {
        var b = !protected_ || (protected_ && typeof global[key] == "undefined");

        b && (global[key] = value);
        return global[key];
    };
})();
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 * 
 * author: meizz
 * version: 2.0
 * date: 2011.12.22
 */





/**
 * @namespace baidu.global.getZIndex 全局统一管理 z-index。
 *
 * @param   {String}    key 	信息对应的 key 值(popup | dialog)
 * @param   {Number}    step 	z-index 增长的步长
 * @return  {Number}            z-index
 */
baidu.global.getZIndex = function(key, step){
	if(key)
		key = baidu.global.get("zIndex")[key] = baidu.global.get("zIndex")[key] + (step || 1);
    return key;
};

baidu.global.set("zIndex", {popup : 50000, dialog : 1000}, true);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/02
 */


/**
 * 操作json对象的方法
 * @namespace baidu.json
 */
baidu.json = baidu.json || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/parse.js
 * author: erik, berg
 * version: 1.2
 * date: 2009/11/23
 */



/**
 * 将字符串解析成json对象。注：不会自动祛除空格
 * @name baidu.json.parse
 * @function
 * @grammar baidu.json.parse(data)
 * @param {string} source 需要解析的字符串
 * @remark
 * 该方法的实现与ecma-262第五版中规定的JSON.parse不同，暂时只支持传入一个参数。后续会进行功能丰富。
 * @meta standard
 * @see baidu.json.stringify,baidu.json.decode
 *             
 * @returns {JSON} 解析结果json对象
 */
baidu.json.parse = function (data) {
    //2010/12/09：更新至不使用原生parse，不检测用户输入是否正确
    return (new Function("return (" + data + ")"))();
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/decode.js
 * author: erik, cat
 * version: 1.3.4
 * date: 2010/12/23
 */



/**
 * 将字符串解析成json对象，为过时接口，今后会被baidu.json.parse代替
 * @name baidu.json.decode
 * @function
 * @grammar baidu.json.decode(source)
 * @param {string} source 需要解析的字符串
 * @meta out
 * @see baidu.json.encode,baidu.json.parse
 *             
 * @returns {JSON} 解析结果json对象
 */
baidu.json.decode = baidu.json.parse;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/stringify.js
 * author: erik
 * version: 1.1.0
 * date: 2010/01/11
 */



/**
 * 将json对象序列化
 * @name baidu.json.stringify
 * @function
 * @grammar baidu.json.stringify(value)
 * @param {JSON} value 需要序列化的json对象
 * @remark
 * 该方法的实现与ecma-262第五版中规定的JSON.stringify不同，暂时只支持传入一个参数。后续会进行功能丰富。
 * @meta standard
 * @see baidu.json.parse,baidu.json.encode
 *             
 * @returns {string} 序列化后的字符串
 */
baidu.json.stringify = (function () {
    /**
     * 字符串处理时需要转义的字符表
     * @private
     */
    var escapeMap = {
        "\b": '\\b',
        "\t": '\\t',
        "\n": '\\n',
        "\f": '\\f',
        "\r": '\\r',
        '"' : '\\"',
        "\\": '\\\\'
    };
    
    /**
     * 字符串序列化
     * @private
     */
    function encodeString(source) {
        if (/["\\\x00-\x1f]/.test(source)) {
            source = source.replace(
                /["\\\x00-\x1f]/g, 
                function (match) {
                    var c = escapeMap[match];
                    if (c) {
                        return c;
                    }
                    c = match.charCodeAt();
                    return "\\u00" 
                            + Math.floor(c / 16).toString(16) 
                            + (c % 16).toString(16);
                });
        }
        return '"' + source + '"';
    }
    
    /**
     * 数组序列化
     * @private
     */
    function encodeArray(source) {
        var result = ["["], 
            l = source.length,
            preComma, i, item;
            
        for (i = 0; i < l; i++) {
            item = source[i];
            
            switch (typeof item) {
            case "undefined":
            case "function":
            case "unknown":
                break;
            default:
                if(preComma) {
                    result.push(',');
                }
                result.push(baidu.json.stringify(item));
                preComma = 1;
            }
        }
        result.push("]");
        return result.join("");
    }
    
    /**
     * 处理日期序列化时的补零
     * @private
     */
    function pad(source) {
        return source < 10 ? '0' + source : source;
    }
    
    /**
     * 日期序列化
     * @private
     */
    function encodeDate(source){
        return '"' + source.getFullYear() + "-" 
                + pad(source.getMonth() + 1) + "-" 
                + pad(source.getDate()) + "T" 
                + pad(source.getHours()) + ":" 
                + pad(source.getMinutes()) + ":" 
                + pad(source.getSeconds()) + '"';
    }
    
    return function (value) {
        switch (typeof value) {
        case 'undefined':
            return 'undefined';
            
        case 'number':
            return isFinite(value) ? String(value) : "null";
            
        case 'string':
            return encodeString(value);
            
        case 'boolean':
            return String(value);
            
        default:
            if (value === null) {
                return 'null';
            } else if (value instanceof Array) {
                return encodeArray(value);
            } else if (value instanceof Date) {
                return encodeDate(value);
            } else {
                var result = ['{'],
                    encode = baidu.json.stringify,
                    preComma,
                    item;
                    
                for (var key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        item = value[key];
                        switch (typeof item) {
                        case 'undefined':
                        case 'unknown':
                        case 'function':
                            break;
                        default:
                            if (preComma) {
                                result.push(',');
                            }
                            preComma = 1;
                            result.push(encode(key) + ':' + encode(item));
                        }
                    }
                }
                result.push('}');
                return result.join('');
            }
        }
    };
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/json/encode.js
 * author: erik, cat
 * version: 1.3.4
 * date: 2010/12/23
 */



/**
 * 将json对象序列化，为过时接口，今后会被baidu.json.stringify代替
 * @name baidu.json.encode
 * @function
 * @grammar baidu.json.encode(value)
 * @param {JSON} value 需要序列化的json对象
 * @meta out
 * @see baidu.json.decode,baidu.json.stringify
 *             
 * @returns {string} 序列化后的字符串
 */
baidu.json.encode = baidu.json.stringify;
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/Class/addEventListeners.js
 * author: berg
 * version: 1.0
 * date: 2010-07-05
 */




/**
 * 添加多个自定义事件。
 * @grammar obj.addEventListeners(events, fn)
 * @param 	{object}   events       json对象，key为事件名称，value为事件被触发时应该调用的回调函数
 * @param 	{Function} fn	        要挂载的函数
 * @version 1.3
 */
/* addEventListeners("onmyevent,onmyotherevent", fn);
 * addEventListeners({
 *      "onmyevent"         : fn,
 *      "onmyotherevent"    : fn1
 * });
 */
baidu.lang.Class.prototype.addEventListeners = function (events, fn) {
    if(typeof fn == 'undefined'){
        for(var i in events){
            this.addEventListener(i, events[i]);
        }
    }else{
        events = events.split(',');
        var i = 0, len = events.length, event;
        for(; i < len; i++){
            this.addEventListener(baidu.trim(events[i]), fn);
        }
    }
};
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * @author: meizz
 * @namespace: baidu.lang.createClass
 * @version: 1.6.0
 * @modify: 2011.11.24 meizz
 */





/**
 * 创建一个类，包括创造类的构造器、继承基类Class
 * @name baidu.lang.createClass
 * @function
 * @grammar baidu.lang.createClass(constructor[, options])
 * @param {Function} constructor 类的构造器函数
 * @param {Object} [options] 
                
 * @config {string} [type] 类名
 * @config {Function} [superClass] 父类，默认为baidu.lang.Class
 * @version 1.2
 * @remark
 * 
            使用createClass能方便的创建一个带有继承关系的类。同时会为返回的类对象添加extend方法，使用obj.extend({});可以方便的扩展原型链上的方法和属性
        
 * @see baidu.lang.Class,baidu.lang.inherits
 *             
 * @returns {Object} 一个类对象
 */

baidu.lang.createClass = /**@function*/function(constructor, options) {
    options = options || {};
    var superClass = options.superClass || baidu.lang.Class;

    // 创建新类的真构造器函数
    var fn = function(){
        var me = this;

        // 20101030 某类在添加该属性控制时，guid将不在全局instances里控制
        options.decontrolled && (me.__decontrolled = true);

        // 继承父类的构造器
        superClass.apply(me, arguments);

        // 全局配置
        for (i in fn.options) me[i] = fn.options[i];

        constructor.apply(me, arguments);

        for (var i=0, reg=fn["\x06r"]; reg && i<reg.length; i++) {
            reg[i].apply(me, arguments);
        }
    };

    // [TODO delete 2013] 放置全局配置，这个全局配置可以直接写到类里面
    fn.options = options.options || {};

    var C = function(){},
        cp = constructor.prototype;
    C.prototype = superClass.prototype;

    // 继承父类的原型（prototype)链
    var fp = fn.prototype = new C();

    // 继承传参进来的构造器的 prototype 不会丢
    for (var i in cp) fp[i] = cp[i];

    // 20111122 原className参数改名为type
    var type = options.className || options.type;
    typeof type == "string" && (fp.__type = type);

    // 修正这种继承方式带来的 constructor 混乱的问题
    fp.constructor = cp.constructor;

    // 给类扩展出一个静态方法，以代替 baidu.object.extend()
    fn.extend = function(json){
        for (var i in json) {
            fn.prototype[i] = json[i];
        }
        return fn;  // 这个静态方法也返回类对象本身
    };

    return fn;
};

// 20111221 meizz   修改插件函数的存放地，重新放回类构造器静态属性上
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/_instances.js
 * author: meizz, erik
 * version: 1.1.0
 * date: 2009/12/1
 */




/**
 * 所有类的实例的容器
 * key为每个实例的guid
 * @meta standard
 */

window[baidu.guid]._instances = window[baidu.guid]._instances || {};

//	[TODO]	meizz	在2012年版本中将删除此模块
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/decontrol.js
 * author: meizz
 * version: 1.1.0
 * $date$
 */



/**
 * 解除instance中对指定类实例的引用关系。
 * @name baidu.lang.decontrol
 * @function
 * @grammar baidu.lang.decontrol(guid)
 * @param {string} guid 类的唯一标识
 * @version 1.1.1
 * @see baidu.lang.instance
 */
baidu.lang.decontrol = function(guid) {
    var m = window[baidu.guid];
    m._instances && (delete m._instances[guid]);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 事件中心
 * @class
 * @name baidu.lang.eventCenter
 * @author rocy
 */
baidu.lang.eventCenter = baidu.lang.eventCenter || baidu.lang.createSingle();

/**
 * 注册全局事件监听器。
 * @name baidu.lang.eventCenter.addEventListener
 * @function
 * @grammar baidu.lang.eventCenter.addEventListener(type, handler[, key])
 * @param 	{string}   type         自定义事件的名称
 * @param 	{Function} handler      自定义事件被触发时应该调用的回调函数
 * @param 	{string}   [key]		为事件监听函数指定的名称，可在移除时使用。如果不提供，方法会默认为它生成一个全局唯一的key。
 * @remark 	事件类型区分大小写。如果自定义事件名称不是以小写"on"开头，该方法会给它加上"on"再进行判断，即"click"和"onclick"会被认为是同一种事件。 
 */

/**
 * 移除全局事件监听器。
 * @name baidu.lang.eventCenter.removeEventListener
 * @grammar baidu.lang.eventCenter.removeEventListener(type, handler)
 * @function
 * @param {string}   type     事件类型
 * @param {Function|string} handler  要移除的事件监听函数或者监听函数的key
 * @remark 	如果第二个参数handler没有被绑定到对应的自定义事件中，什么也不做。
 */

/**
 * 派发全局自定义事件，使得绑定到全局自定义事件上面的函数都会被执行。
 * @name baidu.lang.eventCenter.dispatchEvent
 * @grammar baidu.lang.eventCenter.dispatchEvent(event, options)
 * @function
 * @param {baidu.lang.Event|String} event 	Event对象，或事件名称(1.1.1起支持)
 * @param {Object} 					options 扩展参数,所含属性键值会扩展到Event对象上(1.2起支持)
 */
/*
 * tangram
 * copyright 2011 baidu inc. all rights reserved.
 *
 * path: baidu/lang/getModule.js
 * author: leeight
 * version: 1.1.0
 * date: 2011/04/29
 */



/**
 * 根据变量名或者命名空间来查找对象
 * @function
 * @grammar baidu.lang.getModule(name, opt_obj)
 * @param {string} name 变量或者命名空间的名字.
 * @param {Object=} opt_obj 从这个对象开始查找，默认是window;
 * @return {?Object} 返回找到的对象，如果没有找到返回null.
 * @see goog.getObjectByName
 */
baidu.lang.getModule = function(name, opt_obj) {
    var parts = name.split('.'),
        cur = opt_obj || window,
        part;
    for (; part = parts.shift(); ) {
        if (cur[part] != null) {
            cur = cur[part];
        } else {
          return null;
        }
    }

    return cur;
};



















/* vim: set ts=4 sw=4 sts=4 tw=100 noet: */
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/inherits.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/24
 */



/**
 * 为类型构造器建立继承关系
 * @name baidu.lang.inherits
 * @function
 * @grammar baidu.lang.inherits(subClass, superClass[, type])
 * @param {Function} subClass 子类构造器
 * @param {Function} superClass 父类构造器
 * @param {string} type 类名标识
 * @remark
 * 
使subClass继承superClass的prototype，因此subClass的实例能够使用superClass的prototype中定义的所有属性和方法。<br>
这个函数实际上是建立了subClass和superClass的原型链集成，并对subClass进行了constructor修正。<br>
<strong>注意：如果要继承构造函数，需要在subClass里面call一下，具体见下面的demo例子</strong>
	
 * @shortcut inherits
 * @meta standard
 * @see baidu.lang.Class
 */
baidu.lang.inherits = function (subClass, superClass, type) {
    var key, proto, 
        selfProps = subClass.prototype, 
        clazz = new Function();
        
    clazz.prototype = superClass.prototype;
    proto = subClass.prototype = new clazz();

    for (key in selfProps) {
        proto[key] = selfProps[key];
    }
    subClass.prototype.constructor = subClass;
    subClass.superClass = superClass.prototype;

    // 类名标识，兼容Class的toString，基本没用
    typeof type == "string" && (proto.__type = type);

    subClass.extend = function(json) {
        for (var i in json) proto[i] = json[i];
        return subClass;
    }
    
    return subClass;
};

// 声明快捷方法
baidu.inherits = baidu.lang.inherits;

//  2011.11.22  meizz   为类添加了一个静态方法extend()，方便代码书写
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/instance.js
 * author: meizz, erik
 * version: 1.1.0
 * date: 2009/12/1
 */



/**
 * 根据参数(guid)的指定，返回对应的实例对象引用
 * @name baidu.lang.instance
 * @function
 * @grammar baidu.lang.instance(guid)
 * @param {string} guid 需要获取实例的guid
 * @meta standard
 *             
 * @returns {Object|null} 如果存在的话，返回;否则返回null。
 */
baidu.lang.instance = function (guid) {
    return window[baidu.guid]._instances[guid] || null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/isBoolean.js
 * author: berg
 * version: 1.0.0
 * date: 2010/10/12
 */



/**
 * 判断目标参数是否Boolean对象
 * @name baidu.lang.isBoolean
 * @function
 * @grammar baidu.lang.isBoolean(source)
 * @param {Any} source 目标参数
 * @version 1.3
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isElement,baidu.lang.isArray,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isBoolean = function(o) {
    return typeof o === 'boolean';
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/isDate.js
 * author: berg
 * version: 1.0.0
 * date: 2010/10/12 
 */



/**
 * 判断目标参数是否为Date对象
 * @name baidu.lang.isDate
 * @function
 * @grammar baidu.lang.isDate(source)
 * @param {Any} source 目标参数
 * @version 1.3
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isArray,baidu.lang.isBoolean,baidu.lang.isElement
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isDate = function(o) {
    // return o instanceof Date;
    return {}.toString.call(o) === "[object Date]" && o.toString() !== 'Invalid Date' && !isNaN(o);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/isElement.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/30
 */



/**
 * 判断目标参数是否为Element对象
 * @name baidu.lang.isElement
 * @function
 * @grammar baidu.lang.isElement(source)
 * @param {Any} source 目标参数
 * @meta standard
 * @see baidu.lang.isString,baidu.lang.isObject,baidu.lang.isNumber,baidu.lang.isArray,baidu.lang.isBoolean,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isElement = function (source) {
    return !!(source && source.nodeName && source.nodeType == 1);
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/isObject.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/30
 */



/**
 * 判断目标参数是否为Object对象
 * @name baidu.lang.isObject
 * @function
 * @grammar baidu.lang.isObject(source)
 * @param {Any} source 目标参数
 * @shortcut isObject
 * @meta standard
 * @see baidu.lang.isString,baidu.lang.isNumber,baidu.lang.isArray,baidu.lang.isElement,baidu.lang.isBoolean,baidu.lang.isDate
 *             
 * @returns {boolean} 类型判断结果
 */
baidu.lang.isObject = function (source) {
    return 'function' == typeof source || !!(source && 'object' == typeof source);
};

// 声明快捷方法
baidu.isObject = baidu.lang.isObject;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 增加自定义模块扩展,默认创建在当前作用域
 * @author erik, berg
 * @name baidu.lang.module
 * @function
 * @grammar baidu.lang.module(name, module[, owner])
 * @param {string} name 需要创建的模块名.
 * @param {Any} module 需要创建的模块对象.
 * @param {Object} [owner] 模块创建的目标环境，默认为window.
 * @remark
 *
            从1.1.1开始，module方法会优先在当前作用域下寻找模块，如果无法找到，则寻找window下的模块

 * @meta standard
 */
baidu.lang.module = function(name, module, owner) {
    var packages = name.split('.'),
        len = packages.length - 1,
        packageName,
        i = 0;

    // 如果没有owner，找当前作用域，如果当前作用域没有此变量，在window创建
    if (!owner) {
        try {
            if (!(new RegExp('^[a-zA-Z_\x24][a-zA-Z0-9_\x24]*\x24')).test(packages[0])) {
                throw '';
            }
            owner = eval(packages[0]);
            i = 1;
        }catch (e) {
            owner = window;
        }
    }

    for (; i < len; i++) {
        packageName = packages[i];
        if (!owner[packageName]) {
            owner[packageName] = {};
        }
        owner = owner[packageName];
    }

    if (!owner[packages[len]]) {
        owner[packages[len]] = module;
    }
};
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 * 
 * path: baidu/lang/register.js
 * author: meizz, dron
 * version: 1.6.0
 * date: 2011/11/29
 */



/**
 * 向某个类注册插件
 * @name baidu.lang.register
 * @function
 * @grammar baidu.lang.register(Class, constructorHook, methods)
 * @param   {Class}     Class   		接受注册的载体 类
 * @param   {Function}  constructorHook 运行在载体类构造器里钩子函数
 * @param	{JSON}		methods			挂载到载体类原型链上的方法集，可选
 * @meta standard
 *             
 */
baidu.lang.register = function (Class, constructorHook, methods) {
    var reg = Class["\x06r"] || (Class["\x06r"] = []);
    reg[reg.length] = constructorHook;

    for (var method in methods) {
    	Class.prototype[method] = methods[method];
    }
};

// 20111221 meizz   修改插件函数的存放地，重新放回类构造器静态属性上
// 20111129	meizz	添加第三个参数，可以直接挂载方法到目标类原型链上
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/number/comma.js
 * author: dron, erik, berg
 * version: 1.2.0
 * date: 2010/09/07 
 */



/**
 * 为目标数字添加逗号分隔
 * @name baidu.number.comma
 * @function
 * @grammar baidu.number.comma(source[, length])
 * @param {number} source 需要处理的数字
 * @param {number} [length] 两次逗号之间的数字位数，默认为3位
 *             
 * @returns {string} 添加逗号分隔后的字符串
 */
baidu.number.comma = function (source, length) {
    if (!length || length < 1) {
        length = 3;
    }

    source = String(source).split(".");
    source[0] = source[0].replace(new RegExp('(\\d)(?=(\\d{'+length+'})+$)','ig'),"$1,");
    return source.join(".");
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/number/randomInt.js
 * author: berg
 * version: 1.0.0
 * date: 2010/12/14
 */



/**
 * 生成随机整数，范围是[min, max]
 * @name baidu.number.randomInt
 * @function
 * @grammar baidu.number.randomInt(min, max) 
 * 
 * @param 	{number} min 	随机整数的最小值
 * @param 	{number} max 	随机整数的最大值
 * @return 	{number} 		生成的随机整数
 */
baidu.number.randomInt = function(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */





/**
 * 判断一个对象是不是字面量对象，即判断这个对象是不是由{}或者new Object类似方式创建
 * 
 * @name baidu.object.isPlain
 * @function
 * @grammar baidu.object.isPlain(source)
 * @param {Object} source 需要检查的对象
 * @remark
 * 事实上来说，在Javascript语言中，任何判断都一定会有漏洞，因此本方法只针对一些最常用的情况进行了判断
 *             
 * @returns {Boolean} 检查结果
 */
baidu.object.isPlain  = function(obj){
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        key;
    if ( !obj ||
         //一般的情况，直接用toString判断
         Object.prototype.toString.call(obj) !== "[object Object]" ||
         //IE下，window/document/document.body/HTMLElement/HTMLCollection/NodeList等DOM对象上一个语句为true
         //isPrototypeOf挂在Object.prototype上的，因此所有的字面量都应该会有这个属性
         //对于在window上挂了isPrototypeOf属性的情况，直接忽略不考虑
         !('isPrototypeOf' in obj)
       ) {
        return false;
    }

    //判断new fun()自定义对象的情况
    //constructor不是继承自原型链的
    //并且原型中有isPrototypeOf方法才是Object
    if ( obj.constructor &&
        !hasOwnProperty.call(obj, "constructor") &&
        !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf") ) {
        return false;
    }
    //判断有继承的情况
    //如果有一项是继承过来的，那么一定不是字面量Object
    //OwnProperty会首先被遍历，为了加速遍历过程，直接看最后一项
    for ( key in obj ) {}
    return key === undefined || hasOwnProperty.call( obj, key );
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */





/**
 * 对一个object进行深度拷贝
 * 
 * @author berg
 * @name baidu.object.clone
 * @function
 * @grammar baidu.object.clone(source)
 * @param {Object} source 需要进行拷贝的对象
 * @remark
 * 对于Object来说，只拷贝自身成员，不拷贝prototype成员
 * @meta standard
 *             
 * @returns {Object} 拷贝后的新对象
 */
baidu.object.clone  = function (source) {
    var result = source, i, len;
    if (!source
        || source instanceof Number
        || source instanceof String
        || source instanceof Boolean) {
        return result;
    } else if (baidu.lang.isArray(source)) {
        result = [];
        var resultLen = 0;
        for (i = 0, len = source.length; i < len; i++) {
            result[resultLen++] = baidu.object.clone(source[i]);
        }
    } else if (baidu.object.isPlain(source)) {
        result = {};
        for (i in source) {
            if (source.hasOwnProperty(i)) {
                result[i] = baidu.object.clone(source[i]);
            }
        }
    }
    return result;
};
/*
 * tangram
 * copyright 2011 baidu inc. all rights reserved.
 *
 * path: baidu/object/isEmpty.js
 * author: leeight
 * version: 1.1.0
 * date: 2011/04/30
 */



/**
 * 检测一个对象是否是空的，需要注意的是：如果污染了Object.prototype或者Array.prototype，那么baidu.object.isEmpty({})或者baidu.object.isEmpty([])可能返回的就是false.
 * @function
 * @grammar baidu.object.isEmpty(obj)
 * @param {Object} obj 需要检测的对象.
 * @return {boolean} 如果是空的对象就返回true.
 */
baidu.object.isEmpty = function(obj) {
    for (var key in obj) {
        return false;
    }
    
    return true;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/object/keys.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 获取目标对象的键名列表
 * @name baidu.object.keys
 * @function
 * @grammar baidu.object.keys(source)
 * @param {Object} source 目标对象
 * @see baidu.object.values
 *             
 * @returns {Array} 键名列表
 */
baidu.object.keys = function (source) {
    var result = [], resultLen = 0, k;
    for (k in source) {
        if (source.hasOwnProperty(k)) {
            result[resultLen++] = k;
        }
    }
    return result;
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/object/map.js
 * author: berg
 * version: 1.1.0
 * date: 2010/12/14
 */



/**
 * 遍历object中所有元素，将每一个元素应用方法进行转换，返回转换后的新object。
 * @name baidu.object.map
 * @function
 * @grammar baidu.object.map(source, iterator)
 * 
 * @param 	{Array}    source   需要遍历的object
 * @param 	{Function} iterator 对每个object元素进行处理的函数
 * @return 	{Array} 			map后的object
 */
baidu.object.map = function (source, iterator) {
    var results = {};
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            results[key] = iterator(source[key], key);
        }
    }
    return results;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */





/*
 * 默认情况下，所有在源对象上的属性都会被非递归地合并到目标对象上
 * 并且如果目标对象上已有此属性，不会被覆盖
 */
/**
 * 合并源对象的属性到目标对象。
 *
 * @name baidu.object.merge
 * @function
 * @grammar baidu.object.merge(target, source[, opt_options])
 *
 * @param {Function} target 目标对象.
 * @param {Function} source 源对象.
 * @param {Object} opt_options optional merge选项.
 * @config {boolean} overwrite optional 如果为真，源对象属性会覆盖掉目标对象上的已有属性，默认为假.
 * @config {string[]} whiteList optional 白名单，默认为空，如果存在，只有在这里的属性才会被处理.
 * @config {boolean} recursive optional 是否递归合并对象里面的object，默认为否.
 * @return {object} merge后的object.
 * @see baidu.object.extend
 * @author berg
 */
(function() {
var isPlainObject = function(source) {
        return baidu.lang.isObject(source) && !baidu.lang.isFunction(source);
    };

function mergeItem(target, source, index, overwrite, recursive) {
    if (source.hasOwnProperty(index)) {
        if (recursive && isPlainObject(target[index])) {
            // 如果需要递归覆盖，就递归调用merge
            baidu.object.merge(
                target[index],
                source[index],
                {
                    'overwrite': overwrite,
                    'recursive': recursive
                }
            );
        } else if (overwrite || !(index in target)) {
            // 否则只处理overwrite为true，或者在目标对象中没有此属性的情况
            target[index] = source[index];
        }
    }
}

baidu.object.merge = function(target, source, opt_options) {
    var i = 0,
        options = opt_options || {},
        overwrite = options['overwrite'],
        whiteList = options['whiteList'],
        recursive = options['recursive'],
        len;

    // 只处理在白名单中的属性
    if (whiteList && whiteList.length) {
        len = whiteList.length;
        for (; i < len; ++i) {
            mergeItem(target, source, whiteList[i], overwrite, recursive);
        }
    } else {
        for (i in source) {
            mergeItem(target, source, i, overwrite, recursive);
        }
    }

    return target;
};
})();
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * @author: meizz
 * @namespace: baidu.page.createStyleSheet
 * @version: 2010-06-12
 */





/**
 * 在页面中创建样式表对象
 * @name baidu.page.createStyleSheet
 * @function
 * @grammar baidu.page.createStyleSheet(options)
 * @param {Object} options 配置信息
                
 * @param {Document} options.document 指定在哪个document下创建，默认是当前文档
 * @param {String} options.url css文件的URL
 * @param {Number} options.index 在文档里的排序索引（注意，仅IE下有效）
 * @version 1.2
 * @remark
 *  ie 下返回值styleSheet的addRule方法不支持添加逗号分隔的css rule.
 * 
 * @see baidu.page.createStyleSheet.StyleSheet
 *             
 * @returns {baidu.page.createStyleSheet.StyleSheet} styleSheet对象(注意: 仅IE下,其他浏览器均返回null)
 */
baidu.page.createStyleSheet = function(options){
    var op = options || {},
        doc = op.document || document,
        s;

    if (baidu.browser.ie) {
        //修复ie下会请求一个undefined的bug  berg 2010/08/27 
        if(!op.url)
            op.url = "";
        return doc.createStyleSheet(op.url, op.index);
    } else {
        s = "<style type='text/css'></style>";
        op.url && (s="<link type='text/css' rel='stylesheet' href='"+op.url+"'/>");
        baidu.dom.insertHTML(doc.getElementsByTagName("HEAD")[0],"beforeEnd",s);
        //如果用户传入了url参数，下面访问sheet.rules的时候会报错
        if(op.url){
            return null;
        }

        var sheet = doc.styleSheets[doc.styleSheets.length - 1],
            rules = sheet.rules || sheet.cssRules;
        return {
            self : sheet
            ,rules : sheet.rules || sheet.cssRules
            ,addRule : function(selector, style, i) {
                if (sheet.addRule) {
                    return sheet.addRule(selector, style, i);
                } else if (sheet.insertRule) {
                    isNaN(i) && (i = rules.length);
                    return sheet.insertRule(selector +"{"+ style +"}", i);
                }
            }
            ,removeRule : function(i) {
                if (sheet.removeRule) {
                    sheet.removeRule(i);
                } else if (sheet.deleteRule) {
                    isNaN(i) && (i = 0);
                    sheet.deleteRule(i);
                }
            }
        }
    }
};
/*
 * styleSheet对象 有两个方法 
 *  addRule(selector, style, i)
 *  removeRule(i)
 *  这两个方法已经做了浏览器兼容处理
 * 一个集合
 *  rules
 */
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/getHeight.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/03
 */



/**
 * 获取页面高度
 * @name baidu.page.getHeight
 * @function
 * @grammar baidu.page.getHeight()
 * @see baidu.page.getWidth
 *             
 * @returns {number} 页面高度
 */
baidu.page.getHeight = function () {
    var doc = document,
        body = doc.body,
        html = doc.documentElement,
        client = doc.compatMode == 'BackCompat' ? body : doc.documentElement;

    return Math.max(html.scrollHeight, body.scrollHeight, client.clientHeight);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/getWidth.js
 * author: allstar, erik
 * version: 1.1.0
 * date: 2009/12/03
 */



/**
 * 获取页面宽度
 * @name baidu.page.getWidth
 * @function
 * @grammar baidu.page.getWidth()
 * @see baidu.page.getHeight
 * @meta standard
 * @returns {number} 页面宽度
 */
baidu.page.getWidth = function () {
    var doc = document,
        body = doc.body,
        html = doc.documentElement,
        client = doc.compatMode == 'BackCompat' ? body : doc.documentElement;

    return Math.max(html.scrollWidth, body.scrollWidth, client.clientWidth);
};
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 */











/**
 * 延迟加载图片. 默认只加载可见高度以上的图片, 随着窗口滚动加载剩余图片.注意: 仅支持垂直方向.
 * @name baidu.page.lazyLoadImage
 * @function
 * @grammar baidu.page.lazyLoadImage([options])
 * @param {Object} options
 * @param {String} [options.className] 延迟加载的IMG的className,如果不传入该值将延迟加载所有IMG.
 * @param {Number} [options.preloadHeight] 预加载的高度, 可见窗口下该高度内的图片将被加载.
 * @param {String} [options.placeHolder] 占位图url.
 * @param {Function} [options.onlazyload] 延迟加载回调函数,在实际加载时触发.
 * @author rocy
 */
baidu.page.lazyLoadImage = function(options) {
    options = options || {};
    options.preloadHeight = options.preloadHeight || 0;

    baidu.dom.ready(function() {
        var imgs = document.getElementsByTagName('IMG'),
                targets = imgs,
                len = imgs.length,
                i = 0,
                viewOffset = getLoadOffset(),
                srcAttr = 'data-tangram-ori-src',
                target;
        //避免循环中每次都判断className
        if (options.className) {
            targets = [];
            for (; i < len; ++i) {
                if (baidu.dom.hasClass(imgs[i], options.className)) {
                    targets.push(imgs[i]);
                }
            }
        }
        //计算需要加载图片的页面高度
        function getLoadOffset() {
            return baidu.page.getScrollTop() + baidu.page.getViewHeight() + options.preloadHeight;
        }
        //加载可视图片
        for (i = 0, len = targets.length; i < len; ++i) {
            target = targets[i];
            if (baidu.dom.getPosition(target).top > viewOffset) {
                target.setAttribute(srcAttr, target.src);
                options.placeHolder ? target.src = options.placeHolder : target.removeAttribute('src');
            }
        }
        //处理延迟加载
        var loadNeeded = function() {
            var viewOffset = getLoadOffset(),
                imgSrc,
                finished = true,
                i = 0,
                len = targets.length;
            for (; i < len; ++i) {
                target = targets[i];
                imgSrc = target.getAttribute(srcAttr);
                imgSrc && (finished = false);
                if (baidu.dom.getPosition(target).top < viewOffset && imgSrc) {
                    target.src = imgSrc;
                    target.removeAttribute(srcAttr);
                    baidu.lang.isFunction(options.onlazyload) && options.onlazyload(target);
                }
            }
            //当全部图片都已经加载, 去掉事件监听
            finished && baidu.un(window, 'scroll', loadNeeded);
        };

        baidu.on(window, 'scroll', loadNeeded);
    });
};

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: baidu/page/load.js
 * author: rocy
 * version: 1.0.0
 * date: 2010/11/29
 */









/**
 *
 * 加载一组资源，支持多种格式资源的串/并行加载，支持每个文件有单独回调函数。
 *
 * @name baidu.page.load
 * @function
 * @grammar baidu.page.load(resources[, options])
 *
 * @param {Array} resources               资源描述数组，单个resource含如下属性.
 * @param {String} resources.url           链接地址.
 * @param {String} [resources.type]        取值["css","js","html"]，默认参考文件后缀.
 * @param {String} [resources.requestType] 取值["dom","ajax"]，默认js和css用dom标签，html用ajax.
 * @param {Function} resources.onload        当前resource加载完成的回调函数，若requestType为ajax，参数为xhr(可能失效)，responseText；若requestType为dom，无参数，执行时this为相应dom标签。.
 *
 * @param {Object} [options]               可选参数.
 * @param {Function} [options.onload]        资源全部加载完成的回调函数，无参数。.
 * @param {Boolean} [options.parallel]      是否并行加载，默认为false，串行。.
 * @param {Boolean} [ignoreAllLoaded]       全部加载之后不触发回调事件.主要用于内部实现.
 *
 *
 * @remark
 *  //串行实例
 *  baidu.page.load([
 *      { url : "http://img.baidu.com/js/tangram-1.3.2.js" },
 *      {url : "http://xxx.baidu.com/xpath/logicRequire.js",
 *          onload : fnOnRequireLoaded
 *      },
 *      { url : "http://xxx.baidu.com/xpath/target.js" }
 *  ],{
 *      onload : fnWhenTargetOK
 *  });
 *  //并行实例
 *  baidu.page.load([
 *      {
 *          url : "http://xxx.baidu.com/xpath/template.html",
 *          onload : fnExtractTemplate
 *      },
 *      { url : "http://xxx.baidu.com/xpath/style.css"},
 *      {
 *          url : "http://xxx.baidu.com/xpath/import.php?f=baidu.*",
 *          type : "js"
 *      },
 *      {
 *          url : "http://xxx.baidu.com/xpath/target.js",
 *      },
 *      {
 *          url : "http://xxx.baidu.com/xpath/jsonData.js",
 *          requestType : "ajax",
 *          onload : fnExtractData
 *      }
 *  ],{
 *      parallel : true,
 *      onload : fnWhenEverythingIsOK
 * });
 */
baidu.page.load = /**@function*/function(resources, options, ignoreAllLoaded) {
    //TODO failure, 整体onload能不能每个都调用; resources.charset
    options = options || {};
    var self = baidu.page.load,
        cache = self._cache = self._cache || {},
        loadingCache = self._loadingCache = self._loadingCache || {},
        parallel = options.parallel;

    function allLoadedChecker() {
        for (var i = 0, len = resources.length; i < len; ++i) {
            if (! cache[resources[i].url]) {
                setTimeout(arguments.callee, 10);
                return;
            }
        }
        options.onload();
    };

    function loadByDom(res, callback) {
        var node, loaded, onready;
        switch (res.type.toLowerCase()) {
            case 'css' :
                node = document.createElement('link');
                node.setAttribute('rel', 'stylesheet');
                node.setAttribute('type', 'text/css');
                break;
            case 'js' :
                node = document.createElement('script');
                node.setAttribute('type', 'text/javascript');
                node.setAttribute('charset', res.charset || self.charset);
                break;
            case 'html' :
                node = document.createElement('iframe');
                node.frameBorder = 'none';
                break;
            default :
                return;
        }

        // HTML,JS works on all browsers, CSS works only on IE.
        onready = function() {
            if (!loaded && (!this.readyState ||
                    this.readyState === 'loaded' ||
                    this.readyState === 'complete')) {
                loaded = true;
                // 防止内存泄露
                baidu.un(node, 'load', onready);
                baidu.un(node, 'readystatechange', onready);
                //node.onload = node.onreadystatechange = null;
                callback.call(window, node);
            }
        };
        baidu.on(node, 'load', onready);
        baidu.on(node, 'readystatechange', onready);
        //CSS has no onload event on firefox and webkit platform, so hack it.
        if (res.type == 'css') {
            (function() {
                //避免重复加载
                if (loaded) return;
                try {
                    node.sheet.cssRule;
                } catch (e) {
                    setTimeout(arguments.callee, 20);
                    return;
                }
                loaded = true;
                callback.call(window, node);
            })();
        }

        node.href = node.src = res.url;
        document.getElementsByTagName('head')[0].appendChild(node);
    }

    //兼容第一个参数直接是资源地址.
    baidu.lang.isString(resources) && (resources = [{url: resources}]);

    //避免递归出错,添加容错.
    if (! (resources && resources.length)) return;

    function loadResources(res) {
        var url = res.url,
            shouldContinue = !!parallel,
            cacheData,
            callback = function(textOrNode) {
                //ajax存入responseText,dom存入节点,用于保证onload的正确执行.
                cache[res.url] = textOrNode;
                delete loadingCache[res.url];

                if (baidu.lang.isFunction(res.onload)) {
                    //若返回false, 则停止接下来的加载.
                    if (false === res.onload.call(window, textOrNode)) {
                        return;
                    }
                }
                //串行时递归执行
                !parallel && self(resources.slice(1), options, true);
                if ((! ignoreAllLoaded) && baidu.lang.isFunction(options.onload)) {
                    allLoadedChecker();
                }
            };
        //默认用后缀名, 并防止后缀名大写
        res.type = res.type || url.replace(/^[^\?#]+\.(css|js|html)(\?|#| |$)[^\?#]*/i, '$1'); //[bugfix]修改xxx.js?v这种情况下取不到js的问题。 
        //默认html格式用ajax请求,其他都使用dom标签方式请求.
        res.requestType = res.requestType || (res.type == 'html' ? 'ajax' : 'dom');

        if (cacheData = cache[res.url]) {
            callback(cacheData);
            return shouldContinue;
        }
        if (!options.refresh && loadingCache[res.url]) {
            setTimeout(function() {loadResources(res);}, 10);
            return shouldContinue;
        }
        loadingCache[res.url] = true;
        if (res.requestType.toLowerCase() == 'dom') {
            loadByDom(res, callback);
        }else {//ajax
            baidu.ajax.get(res.url, function(xhr, responseText) {callback(responseText);});
        }
        //串行模式,通过callback方法执行后续
        return shouldContinue;
    };

    baidu.each(resources, loadResources);
};
//默认编码设置为UTF8
baidu.page.load.charset = 'UTF8';
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/loadCssFile.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/20
 */



/**
 * 动态在页面上加载一个外部css文件
 * @name baidu.page.loadCssFile
 * @function
 * @grammar baidu.page.loadCssFile(path)
 * @param {string} path css文件路径
 * @see baidu.page.loadJsFile
 */

baidu.page.loadCssFile = function (path) {
    var element = document.createElement("link");
    
    element.setAttribute("rel", "stylesheet");
    element.setAttribute("type", "text/css");
    element.setAttribute("href", path);

    document.getElementsByTagName("head")[0].appendChild(element);        
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/page/loadJsFile.js
 * author: allstar
 * version: 1.1.0
 * date: 2009/11/20
 */



/**
 * 动态在页面上加载一个外部js文件
 * @name baidu.page.loadJsFile
 * @function
 * @grammar baidu.page.loadJsFile(path)
 * @param {string} path js文件路径
 * @see baidu.page.loadCssFile
 */
baidu.page.loadJsFile = function (path) {
    var element = document.createElement('script');

    element.setAttribute('type', 'text/javascript');
    element.setAttribute('src', path);
    element.setAttribute('defer', 'defer');

    document.getElementsByTagName("head")[0].appendChild(element);    
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断平台类型和特性的属性
 * @namespace baidu.platform
 * @author jz
 */
baidu.platform = baidu.platform || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为android平台
 * @property android 是否为android平台
 * @grammar baidu.platform.android
 * @meta standard
 * @see baidu.platform.x11,baidu.platform.windows,baidu.platform.macintosh,baidu.platform.iphone,baidu.platform.ipad
 * @return {Boolean} 布尔值
 * @author jz
 */
baidu.platform.isAndroid = /android/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为ipad平台
 * @property ipad 是否为ipad平台
 * @grammar baidu.platform.ipad
 * @meta standard
 * @see baidu.platform.x11,baidu.platform.windows,baidu.platform.macintosh,baidu.platform.iphone,baidu.platform.android
 * @return {Boolean} 布尔值 
 * @author jz
 */
baidu.platform.isIpad = /ipad/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为iphone平台
 * @property iphone 是否为iphone平台
 * @grammar baidu.platform.iphone
 * @meta standard
 * @see baidu.platform.x11,baidu.platform.windows,baidu.platform.macintosh,baidu.platform.ipad,baidu.platform.android
 * @return {Boolean} 布尔值
 * @author jz
 */
baidu.platform.isIphone = /iphone/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为macintosh平台
 * @property macintosh 是否为macintosh平台
 * @grammar baidu.platform.macintosh
 * @meta standard
 * @see baidu.platform.x11,baidu.platform.windows,baidu.platform.iphone,baidu.platform.ipad,baidu.platform.android
 * @return {Boolean} 布尔值 
 * @author jz
 */
baidu.platform.isMacintosh = /macintosh/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为windows平台
 * @property windows 是否为windows平台
 * @grammar baidu.platform.windows
 * @meta standard
 * @see baidu.platform.x11,baidu.platform.macintosh,baidu.platform.iphone,baidu.platform.ipad,baidu.platform.android
 * @return {Boolean} 布尔值 
 * @author jz
 */
baidu.platform.isWindows = /windows/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 判断是否为x11平台
 * @property x11 是否为x11平台
 * @grammar baidu.platform.x11
 * @meta standard
 * @see baidu.platform.windows,baidu.platform.macintosh,baidu.platform.iphone,baidu.platform.ipad,baidu.platform.android
 * @return {Boolean} 布尔值 
 * @author jz
 */
baidu.platform.isX11 = /x11/i.test(navigator.userAgent);
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/sio.js
 * author: erik
 * version: 1.1.0
 * date: 2009/12/16
 */


/**
 * 使用动态script标签请求服务器资源，包括由服务器端的回调和浏览器端的回调
 * @namespace baidu.sio
 */
baidu.sio = baidu.sio || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 
 * @param {HTMLElement} src script节点
 * @param {String} url script节点的地址
 * @param {String} [charset] 编码
 */
baidu.sio._createScriptTag = function(scr, url, charset){
    scr.setAttribute('type', 'text/javascript');
    charset && scr.setAttribute('charset', charset);
    scr.setAttribute('src', url);
    document.getElementsByTagName('head')[0].appendChild(scr);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/**
 * 删除script的属性，再删除script标签，以解决修复内存泄漏的问题
 * 
 * @param {HTMLElement} src script节点
 */
baidu.sio._removeScriptTag = function(scr){
    if (scr.clearAttributes) {
        scr.clearAttributes();
    } else {
        for (var attr in scr) {
            if (scr.hasOwnProperty(attr)) {
                delete scr[attr];
            }
        }
    }
    if(scr && scr.parentNode){
        scr.parentNode.removeChild(scr);
    }
    scr = null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */





/**
 * 通过script标签加载数据，加载完成由浏览器端触发回调
 * @name baidu.sio.callByBrowser
 * @function
 * @grammar baidu.sio.callByBrowser(url, opt_callback, opt_options)
 * @param {string} url 加载数据的url
 * @param {Function|string} opt_callback 数据加载结束时调用的函数或函数名
 * @param {Object} opt_options 其他可选项
 * @config {String} [charset] script的字符集
 * @config {Integer} [timeOut] 超时时间，超过这个时间将不再响应本请求，并触发onfailure函数
 * @config {Function} [onfailure] timeOut设定后才生效，到达超时时间时触发本函数
 * @remark
 * 1、与callByServer不同，callback参数只支持Function类型，不支持string。
 * 2、如果请求了一个不存在的页面，callback函数在IE/opera下也会被调用，因此使用者需要在onsuccess函数中判断数据是否正确加载。
 * @meta standard
 * @see baidu.sio.callByServer
 */
baidu.sio.callByBrowser = function (url, opt_callback, opt_options) {
    var scr = document.createElement("SCRIPT"),
        scriptLoaded = 0,
        options = opt_options || {},
        charset = options['charset'],
        callback = opt_callback || function(){},
        timeOut = options['timeOut'] || 0,
        timer;
    
    // IE和opera支持onreadystatechange
    // safari、chrome、opera支持onload
    scr.onload = scr.onreadystatechange = function () {
        // 避免opera下的多次调用
        if (scriptLoaded) {
            return;
        }
        
        var readyState = scr.readyState;
        if ('undefined' == typeof readyState
            || readyState == "loaded"
            || readyState == "complete") {
            scriptLoaded = 1;
            try {
                callback();
                clearTimeout(timer);
            } finally {
                scr.onload = scr.onreadystatechange = null;
                baidu.sio._removeScriptTag(scr);
            }
        }
    };

    if( timeOut ){
        timer = setTimeout(function(){
            scr.onload = scr.onreadystatechange = null;
            baidu.sio._removeScriptTag(scr);
            options.onfailure && options.onfailure();
        }, timeOut);
    }
    
    baidu.sio._createScriptTag(scr, url, charset);
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */







/**
 * 通过script标签加载数据，加载完成由服务器端触发回调
 * @name baidu.sio.callByServer
 * @function
 * @grammar baidu.sio.callByServer(url, callback[, opt_options])
 * @param {string} url 加载数据的url.
 * @param {Function|string} callback 服务器端调用的函数或函数名。如果没有指定本参数，将在URL中寻找options['queryField']做为callback的方法名.
 * @param {Object} opt_options 加载数据时的选项.
 * @config {string} [charset] script的字符集
 * @config {string} [queryField] 服务器端callback请求字段名，默认为callback
 * @config {Integer} [timeOut] 超时时间(单位：ms)，超过这个时间将不再响应本请求，并触发onfailure函数
 * @config {Function} [onfailure] timeOut设定后才生效，到达超时时间时触发本函数
 * @remark
 * 如果url中已经包含key为“options['queryField']”的query项，将会被替换成callback中参数传递或自动生成的函数名。
 * @meta standard
 * @see baidu.sio.callByBrowser
 */
baidu.sio.callByServer = /**@function*/function(url, callback, opt_options) {
    var scr = document.createElement('SCRIPT'),
        prefix = 'bd__cbs__',
        callbackName,
        callbackImpl,
        options = opt_options || {},
        charset = options['charset'],
        queryField = options['queryField'] || 'callback',
        timeOut = options['timeOut'] || 0,
        timer,
        reg = new RegExp('(\\?|&)' + queryField + '=([^&]*)'),
        matches;

    if (baidu.lang.isFunction(callback)) {
        callbackName = prefix + Math.floor(Math.random() * 2147483648).toString(36);
        window[callbackName] = getCallBack(0);
    } else if(baidu.lang.isString(callback)){
        // 如果callback是一个字符串的话，就需要保证url是唯一的，不要去改变它
        // TODO 当调用了callback之后，无法删除动态创建的script标签
        callbackName = callback;
    } else {
        if (matches = reg.exec(url)) {
            callbackName = matches[2];
        }
    }

    if( timeOut ){
        timer = setTimeout(getCallBack(1), timeOut);
    }

    //如果用户在URL中已有callback，用参数传入的callback替换之
    url = url.replace(reg, '\x241' + queryField + '=' + callbackName);
    
    if (url.search(reg) < 0) {
        url += (url.indexOf('?') < 0 ? '?' : '&') + queryField + '=' + callbackName;
    }
    baidu.sio._createScriptTag(scr, url, charset);

    /*
     * 返回一个函数，用于立即（挂在window上）或者超时（挂在setTimeout中）时执行
     */
    function getCallBack(onTimeOut){
        /*global callbackName, callback, scr, options;*/
        return function(){
            try {
                if( onTimeOut ){
                    options.onfailure && options.onfailure();
                }else{
                    callback.apply(window, arguments);
                    clearTimeout(timer);
                }
                window[callbackName] = null;
                delete window[callbackName];
            } catch (exception) {
                // ignore the exception
            } finally {
                baidu.sio._removeScriptTag(scr);
            }
        }
    }
};
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 */



/**
 * 通过请求一个图片的方式令服务器存储一条日志
 * @function
 * @grammar baidu.sio.log(url)
 * @param {string} url 要发送的地址.
 * @author: int08h,leeight
 */
baidu.sio.log = function(url) {
  var img = new Image(),
      key = 'tangram_sio_log_' + Math.floor(Math.random() *
            2147483648).toString(36);

  // 这里一定要挂在window下
  // 在IE中，如果没挂在window下，这个img变量又正好被GC的话，img的请求会abort
  // 导致服务器收不到日志
  window[key] = img;

  img.onload = img.onerror = img.onabort = function() {
    // 下面这句非常重要
    // 如果这个img很不幸正好加载了一个存在的资源，又是个gif动画
    // 则在gif动画播放过程中，img会多次触发onload
    // 因此一定要清空
    img.onload = img.onerror = img.onabort = null;

    window[key] = null;

    // 下面这句非常重要
    // new Image创建的是DOM，DOM的事件中形成闭包环引用DOM是典型的内存泄露
    // 因此这里一定要置为null
    img = null;
  };

  // 一定要在注册了事件之后再设置src
  // 不然如果图片是读缓存的话，会错过事件处理
  // 最后，对于url最好是添加客户端时间来防止缓存
  // 同时服务器也配合一下传递Cache-Control: no-cache;
  img.src = url;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/decodeHTML.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 对目标字符串进行html解码
 * @name baidu.string.decodeHTML
 * @function
 * @grammar baidu.string.decodeHTML(source)
 * @param {string} source 目标字符串
 * @shortcut decodeHTML
 * @meta standard
 * @see baidu.string.encodeHTML
 *             
 * @returns {string} html解码后的字符串
 */
baidu.string.decodeHTML = function (source) {
    var str = String(source)
                .replace(/&quot;/g,'"')
                .replace(/&lt;/g,'<')
                .replace(/&gt;/g,'>')
                .replace(/&amp;/g, "&");
    //处理转义的中文和实体字符
    return str.replace(/&#([\d]+);/g, function(_0, _1){
        return String.fromCharCode(parseInt(_1, 10));
    });
};

baidu.decodeHTML = baidu.string.decodeHTML;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/encodeHTML.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 对目标字符串进行html编码
 * @name baidu.string.encodeHTML
 * @function
 * @grammar baidu.string.encodeHTML(source)
 * @param {string} source 目标字符串
 * @remark
 * 编码字符有5个：&<>"'
 * @shortcut encodeHTML
 * @meta standard
 * @see baidu.string.decodeHTML
 *             
 * @returns {string} html编码后的字符串
 */
baidu.string.encodeHTML = function (source) {
    return String(source)
                .replace(/&/g,'&amp;')
                .replace(/</g,'&lt;')
                .replace(/>/g,'&gt;')
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
};

baidu.encodeHTML = baidu.string.encodeHTML;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/filterFormat.js
 * author: rocy
 * version: 1.1.2
 * date: 2010/06/10
 */



/**
 * 对目标字符串进行格式化,支持过滤
 * @name baidu.string.filterFormat
 * @function
 * @grammar baidu.string.filterFormat(source, opts)
 * @param {string} source 目标字符串
 * @param {Object|string...} opts 提供相应数据的对象
 * @version 1.2
 * @remark
 * 
在 baidu.string.format的基础上,增加了过滤功能. 目标字符串中的#{url|escapeUrl},<br/>
会替换成baidu.string.filterFormat["escapeUrl"](opts.url);<br/>
过滤函数需要之前挂载在baidu.string.filterFormat属性中.
		
 * @see baidu.string.format,baidu.string.filterFormat.escapeJs,baidu.string.filterFormat.escapeString,baidu.string.filterFormat.toInt
 * @returns {string} 格式化后的字符串
 */
baidu.string.filterFormat = function (source, opts) {
    var data = Array.prototype.slice.call(arguments,1), toString = Object.prototype.toString;
    if(data.length){
	    data = data.length == 1 ? 
	    	/* ie 下 Object.prototype.toString.call(null) == '[object Object]' */
	    	(opts !== null && (/\[object Array\]|\[object Object\]/.test(toString.call(opts))) ? opts : data) 
	    	: data;
    	return source.replace(/#\{(.+?)\}/g, function (match, key){
		    var filters, replacer, i, len, func;
		    if(!data) return '';
	    	filters = key.split("|");
	    	replacer = data[filters[0]];
	    	// chrome 下 typeof /a/ == 'function'
	    	if('[object Function]' == toString.call(replacer)){
	    		replacer = replacer(filters[0]/*key*/);
	    	}
	    	for(i=1,len = filters.length; i< len; ++i){
	    		func = baidu.string.filterFormat[filters[i]];
	    		if('[object Function]' == toString.call(func)){
	    			replacer = func(replacer);
	    		}
	    	}
	    	return ( ('undefined' == typeof replacer || replacer === null)? '' : replacer);
    	});
    }
    return source;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/filterFormat/escapeJs.js
 * author: rocy
 * version: 1.1.2
 * date: 2010/06/12
 */


/**
 * 对js片段的字符做安全转义,编码低于255的都将转换成\x加16进制数
 * @name baidu.string.filterFormat.escapeJs
 * @function
 * @grammar baidu.string.filterFormat.escapeJs(source)
 * @param {String} source 待转义字符串
 * 
 * @see baidu.string.filterFormat,baidu.string.filterFormat.escapeString,baidu.string.filterFormat.toInt
 * @version 1.2
 * @return {String} 转义之后的字符串
 */
baidu.string.filterFormat.escapeJs = function(str){
	if(!str || 'string' != typeof str) return str;
	var i,len,charCode,ret = [];
	for(i=0, len=str.length; i < len; ++i){
		charCode = str.charCodeAt(i);
		if(charCode > 255){
			ret.push(str.charAt(i));
		} else{
			ret.push('\\x' + charCode.toString(16));
		}
	}
	return ret.join('');
};
baidu.string.filterFormat.js = baidu.string.filterFormat.escapeJs;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/filterFormat/escapeString.js
 * author: rocy
 * version: 1.1.2
 * date: 2010/06/12
 */


/**
 * 对字符串做安全转义,转义字符包括: 单引号,双引号,左右小括号,斜杠,反斜杠,上引号.
 * @name baidu.string.filterFormat.escapeString
 * @function
 * @grammar baidu.string.filterFormat.escapeString(source)
 * @param {String} source 待转义字符串
 * 
 * @see baidu.string.filterFormat,baidu.string.filterFormat.escapeJs,baidu.string.filterFormat.toInt
 * @version 1.2
 * @return {String} 转义之后的字符串
 */
baidu.string.filterFormat.escapeString = function(str){
	if(!str || 'string' != typeof str) return str;
	return str.replace(/["'<>\\\/`]/g, function($0){
	   return '&#'+ $0.charCodeAt(0) +';';
	});
};

baidu.string.filterFormat.e = baidu.string.filterFormat.escapeString;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/filterFormat/toInt.js
 * author: rocy
 * version: 1.1.2
 * date: 2010/06/12
 */


/**
 * 对数字做安全转义,确保是十进制数字;否则返回0.
 * @name baidu.string.filterFormat.toInt
 * @function
 * @grammar baidu.string.filterFormat.toInt(source)
 * @param {String} source 待转义字符串
 * 
 * @see baidu.string.filterFormat,baidu.string.filterFormat.escapeJs,baidu.string.filterFormat.escapeString
 * @version 1.2
 * @return {Number} 转义之后的数字
 */
baidu.string.filterFormat.toInt = function(str){
	return parseInt(str, 10) || 0;
};
baidu.string.filterFormat.i = baidu.string.filterFormat.toInt;
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/format.js
 * author: dron, erik
 * version: 1.1.0
 * date: 2009/11/30
 */



/**
 * 对目标字符串进行格式化
 * @name baidu.string.format
 * @function
 * @grammar baidu.string.format(source, opts)
 * @param {string} source 目标字符串
 * @param {Object|string...} opts 提供相应数据的对象或多个字符串
 * @remark
 * 
opts参数为“Object”时，替换目标字符串中的#{property name}部分。<br>
opts为“string...”时，替换目标字符串中的#{0}、#{1}...部分。
		
 * @shortcut format
 * @meta standard
 *             
 * @returns {string} 格式化后的字符串
 */
baidu.string.format = function (source, opts) {
    source = String(source);
    var data = Array.prototype.slice.call(arguments,1), toString = Object.prototype.toString;
    if(data.length){
	    data = data.length == 1 ? 
	    	/* ie 下 Object.prototype.toString.call(null) == '[object Object]' */
	    	(opts !== null && (/\[object Array\]|\[object Object\]/.test(toString.call(opts))) ? opts : data) 
	    	: data;
    	return source.replace(/#\{(.+?)\}/g, function (match, key){
	    	var replacer = data[key];
	    	// chrome 下 typeof /a/ == 'function'
	    	if('[object Function]' == toString.call(replacer)){
	    		replacer = replacer(key);
	    	}
	    	return ('undefined' == typeof replacer ? '' : replacer);
    	});
    }
    return source;
};

// 声明快捷方法
baidu.format = baidu.string.format;
/*
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * @author: meizz
 * @namespace: baidu.string.formatColor
 * @version: 2010-01-23
 */



/**
 * 将各种浏览器里的颜色值转换成 #RRGGBB 的格式
 * @name baidu.string.formatColor
 * @function
 * @grammar baidu.string.formatColor(color)
 * @param {string} color 颜色值字符串
 * @version 1.3
 *             
 * @returns {string} #RRGGBB格式的字符串或空
 */
(function(){
    // 将正则表达式预创建，可提高效率
    var reg1 = /^\#[\da-f]{6}$/i,
        reg2 = /^rgb\((\d+), (\d+), (\d+)\)$/,
        keyword = {
            black: '#000000',
            silver: '#c0c0c0',
            gray: '#808080',
            white: '#ffffff',
            maroon: '#800000',
            red: '#ff0000',
            purple: '#800080',
            fuchsia: '#ff00ff',
            green: '#008000',
            lime: '#00ff00',
            olive: '#808000',
            yellow: '#ffff0',
            navy: '#000080',
            blue: '#0000ff',
            teal: '#008080',
            aqua: '#00ffff'
        };

    baidu.string.formatColor = function(color) {
        if(reg1.test(color)) {
            // #RRGGBB 直接返回
            return color;
        } else if(reg2.test(color)) {
            // 非IE中的 rgb(0, 0, 0)
            for (var s, i=1, color="#"; i<4; i++) {
                s = parseInt(RegExp["\x24"+ i]).toString(16);
                color += ("00"+ s).substr(s.length);
            }
            return color;
        } else if(/^\#[\da-f]{3}$/.test(color)) {
            // 简写的颜色值: #F00
            var s1 = color.charAt(1),
                s2 = color.charAt(2),
                s3 = color.charAt(3);
            return "#"+ s1 + s1 + s2 + s2 + s3 + s3;
        }else if(keyword[color])
            return keyword[color];
        
        return "";
    };
})();

/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/getByteLength.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */



/**
 * 获取目标字符串在gbk编码下的字节长度
 * @name baidu.string.getByteLength
 * @function
 * @grammar baidu.string.getByteLength(source)
 * @param {string} source 目标字符串
 * @remark
 * 获取字符在gbk编码下的字节长度, 实现原理是认为大于127的就一定是双字节。如果字符超出gbk编码范围, 则这个计算不准确
 * @meta standard
 * @see baidu.string.subByte
 *             
 * @returns {number} 字节长度
 */
baidu.string.getByteLength = function (source) {
    return String(source).replace(/[^\x00-\xff]/g, "ci").length;
};
/*
 * tangram
 * copyright 2011 baidu inc. all rights reserved.
 *
 * path: baidu/string/stripTags.js
 * author: leeight
 * version: 1.1.0
 * date: 2011/04/30
 */



/**
 * 去掉字符串中的html标签
 * @function
 * @grammar baidu.string.stripTags(source)
 * @param {string} source 要处理的字符串.
 * @return {String}
 */
baidu.string.stripTags = function(source) {
    return String(source || '').replace(/<[^>]+>/g, '');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/subByte.js
 * author: dron, erik, berg
 * version: 1.2
 * date: 2010-06-30
 */



/**
 * 对目标字符串按gbk编码截取字节长度
 * @name baidu.string.subByte
 * @function
 * @grammar baidu.string.subByte(source, length)
 * @param {string} source 目标字符串
 * @param {number} length 需要截取的字节长度
 * @param {string} [tail] 追加字符串,可选.
 * @remark
 * 截取过程中，遇到半个汉字时，向下取整。
 * @see baidu.string.getByteLength
 *             
 * @returns {string} 字符串截取结果
 */
baidu.string.subByte = function (source, length, tail) {
    source = String(source);
    tail = tail || '';
    if (length < 0 || baidu.string.getByteLength(source) <= length) {
        return source + tail;
    }
    
    //thanks 加宽提供优化方法
    source = source.substr(0,length).replace(/([^\x00-\xff])/g,"\x241 ")//双字节字符替换成两个
        .substr(0,length)//截取长度
        .replace(/[^\x00-\xff]$/,"")//去掉临界双字节字符
        .replace(/([^\x00-\xff]) /g,"\x241");//还原
    return source + tail;

};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/toHalfWidth.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/15
 */


/**
 * 将目标字符串中常见全角字符转换成半角字符
 * @name baidu.string.toHalfWidth
 * @function
 * @grammar baidu.string.toHalfWidth(source)
 * @param {string} source 目标字符串
 * @remark
 * 
将全角的字符转成半角, 将“&amp;#xFF01;”至“&amp;#xFF5E;”范围的全角转成“&amp;#33;”至“&amp;#126;”, 还包括全角空格包括常见的全角数字/空格/字母, 用于需要同时支持全半角的转换, 具体转换列表如下("空格"未列出)：<br><br>

！ => !<br>
＂ => "<br>
＃ => #<br>
＄ => $<br>
％ => %<br>
＆ => &<br>
＇ => '<br>
（ => (<br>
） => )<br>
＊ => *<br>
＋ => +<br>
， => ,<br>
－ => -<br>
． => .<br>
／ => /<br>
０ => 0<br>
１ => 1<br>
２ => 2<br>
３ => 3<br>
４ => 4<br>
５ => 5<br>
６ => 6<br>
７ => 7<br>
８ => 8<br>
９ => 9<br>
： => :<br>
； => ;<br>
＜ => <<br>
＝ => =<br>
＞ => ><br>
？ => ?<br>
＠ => @<br>
Ａ => A<br>
Ｂ => B<br>
Ｃ => C<br>
Ｄ => D<br>
Ｅ => E<br>
Ｆ => F<br>
Ｇ => G<br>
Ｈ => H<br>
Ｉ => I<br>
Ｊ => J<br>
Ｋ => K<br>
Ｌ => L<br>
Ｍ => M<br>
Ｎ => N<br>
Ｏ => O<br>
Ｐ => P<br>
Ｑ => Q<br>
Ｒ => R<br>
Ｓ => S<br>
Ｔ => T<br>
Ｕ => U<br>
Ｖ => V<br>
Ｗ => W<br>
Ｘ => X<br>
Ｙ => Y<br>
Ｚ => Z<br>
［ => [<br>
＼ => \<br>
］ => ]<br>
＾ => ^<br>
＿ => _<br>
｀ => `<br>
ａ => a<br>
ｂ => b<br>
ｃ => c<br>
ｄ => d<br>
ｅ => e<br>
ｆ => f<br>
ｇ => g<br>
ｈ => h<br>
ｉ => i<br>
ｊ => j<br>
ｋ => k<br>
ｌ => l<br>
ｍ => m<br>
ｎ => n<br>
ｏ => o<br>
ｐ => p<br>
ｑ => q<br>
ｒ => r<br>
ｓ => s<br>
ｔ => t<br>
ｕ => u<br>
ｖ => v<br>
ｗ => w<br>
ｘ => x<br>
ｙ => y<br>
ｚ => z<br>
｛ => {<br>
｜ => |<br>
｝ => }<br>
～ => ~<br>
		
 *             
 * @returns {string} 转换后的字符串
 */

baidu.string.toHalfWidth = function (source) {
    return String(source).replace(/[\uFF01-\uFF5E]/g, 
        function(c){
            return String.fromCharCode(c.charCodeAt(0) - 65248);
        }).replace(/\u3000/g," ");
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/string/wbr.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/30
 */



/**
 * 为目标字符串添加wbr软换行
 * @name baidu.string.wbr
 * @function
 * @grammar baidu.string.wbr(source)
 * @param {string} source 目标字符串
 * @remark
 * 
1.支持html标签、属性以及字符实体。<br>
2.任意字符中间都会插入wbr标签，对于过长的文本，会造成dom节点元素增多，占用浏览器资源。
3.在opera下，浏览器默认css不会为wbr加上样式，导致没有换行效果，可以在css中加上 wbr:after { content: "\00200B" } 解决此问题
		
 *             
 * @returns {string} 添加软换行后的字符串
 */
baidu.string.wbr = function (source) {
    return String(source)
        .replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, '$&<wbr>')
        .replace(/><wbr>/g, '>');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/swf.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/16
 */


/**
 * 操作flash对象的方法，包括创建flash对象、获取flash对象以及判断flash插件的版本号
 * @namespace baidu.swf
 */
baidu.swf = baidu.swf || {};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/swf/version.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/17
 */



/**
 * 浏览器支持的flash插件版本
 * @property version 浏览器支持的flash插件版本
 * @grammar baidu.swf.version
 * @return {String} 版本号
 * @meta standard
 */
baidu.swf.version = (function () {
    var n = navigator;
    if (n.plugins && n.mimeTypes.length) {
        var plugin = n.plugins["Shockwave Flash"];
        if (plugin && plugin.description) {
            return plugin.description
                    .replace(/([a-zA-Z]|\s)+/, "")
                    .replace(/(\s)+r/, ".") + ".0";
        }
    } else if (window.ActiveXObject && !window.opera) {
        for (var i = 12; i >= 2; i--) {
            try {
                var c = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.' + i);
                if (c) {
                    var version = c.GetVariable("$version");
                    return version.replace(/WIN/g,'').replace(/,/g,'.');
                }
            } catch(e) {}
        }
    }
})();
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/swf/createHTML.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/17
 */




/**
 * 创建flash对象的html字符串
 * @name baidu.swf.createHTML
 * @function
 * @grammar baidu.swf.createHTML(options)
 * 
 * @param {Object} 	options 					创建flash的选项参数
 * @param {string} 	options.id 					要创建的flash的标识
 * @param {string} 	options.url 				flash文件的url
 * @param {String} 	options.errorMessage 		未安装flash player或flash player版本号过低时的提示
 * @param {string} 	options.ver 				最低需要的flash player版本号
 * @param {string} 	options.width 				flash的宽度
 * @param {string} 	options.height 				flash的高度
 * @param {string} 	options.align 				flash的对齐方式，允许值：middle/left/right/top/bottom
 * @param {string} 	options.base 				设置用于解析swf文件中的所有相对路径语句的基本目录或URL
 * @param {string} 	options.bgcolor 			swf文件的背景色
 * @param {string} 	options.salign 				设置缩放的swf文件在由width和height设置定义的区域内的位置。允许值：l/r/t/b/tl/tr/bl/br
 * @param {boolean} options.menu 				是否显示右键菜单，允许值：true/false
 * @param {boolean} options.loop 				播放到最后一帧时是否重新播放，允许值： true/false
 * @param {boolean} options.play 				flash是否在浏览器加载时就开始播放。允许值：true/false
 * @param {string} 	options.quality 			设置flash播放的画质，允许值：low/medium/high/autolow/autohigh/best
 * @param {string} 	options.scale 				设置flash内容如何缩放来适应设置的宽高。允许值：showall/noborder/exactfit
 * @param {string} 	options.wmode 				设置flash的显示模式。允许值：window/opaque/transparent
 * @param {string} 	options.allowscriptaccess 	设置flash与页面的通信权限。允许值：always/never/sameDomain
 * @param {string} 	options.allownetworking 	设置swf文件中允许使用的网络API。允许值：all/internal/none
 * @param {boolean} options.allowfullscreen 	是否允许flash全屏。允许值：true/false
 * @param {boolean} options.seamlesstabbing 	允许设置执行无缝跳格，从而使用户能跳出flash应用程序。该参数只能在安装Flash7及更高版本的Windows中使用。允许值：true/false
 * @param {boolean} options.devicefont 			设置静态文本对象是否以设备字体呈现。允许值：true/false
 * @param {boolean} options.swliveconnect 		第一次加载flash时浏览器是否应启动Java。允许值：true/false
 * @param {Object} 	options.vars 				要传递给flash的参数，支持JSON或string类型。
 * 
 * @see baidu.swf.create
 * @meta standard
 * @returns {string} flash对象的html字符串
 */
baidu.swf.createHTML = function (options) {
    options = options || {};
    var version = baidu.swf.version, 
        needVersion = options['ver'] || '6.0.0', 
        vUnit1, vUnit2, i, k, len, item, tmpOpt = {},
        encodeHTML = baidu.string.encodeHTML;
    
    // 复制options，避免修改原对象
    for (k in options) {
        tmpOpt[k] = options[k];
    }
    options = tmpOpt;
    
    // 浏览器支持的flash插件版本判断
    if (version) {
        version = version.split('.');
        needVersion = needVersion.split('.');
        for (i = 0; i < 3; i++) {
            vUnit1 = parseInt(version[i], 10);
            vUnit2 = parseInt(needVersion[i], 10);
            if (vUnit2 < vUnit1) {
                break;
            } else if (vUnit2 > vUnit1) {
                return ''; // 需要更高的版本号
            }
        }
    } else {
        return ''; // 未安装flash插件
    }
    
    var vars = options['vars'],
        objProperties = ['classid', 'codebase', 'id', 'width', 'height', 'align'];
    
    // 初始化object标签需要的classid、codebase属性值
    options['align'] = options['align'] || 'middle';
    options['classid'] = 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000';
    options['codebase'] = 'http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0';
    options['movie'] = options['url'] || '';
    delete options['vars'];
    delete options['url'];
    
    // 初始化flashvars参数的值
    if ('string' == typeof vars) {
        options['flashvars'] = vars;
    } else {
        var fvars = [];
        for (k in vars) {
            item = vars[k];
            fvars.push(k + "=" + encodeURIComponent(item));
        }
        options['flashvars'] = fvars.join('&');
    }
    
    // 构建IE下支持的object字符串，包括属性和参数列表
    var str = ['<object '];
    for (i = 0, len = objProperties.length; i < len; i++) {
        item = objProperties[i];
        str.push(' ', item, '="', encodeHTML(options[item]), '"');
    }
    str.push('>');
    var params = {
        'wmode'             : 1,
        'scale'             : 1,
        'quality'           : 1,
        'play'              : 1,
        'loop'              : 1,
        'menu'              : 1,
        'salign'            : 1,
        'bgcolor'           : 1,
        'base'              : 1,
        'allowscriptaccess' : 1,
        'allownetworking'   : 1,
        'allowfullscreen'   : 1,
        'seamlesstabbing'   : 1,
        'devicefont'        : 1,
        'swliveconnect'     : 1,
        'flashvars'         : 1,
        'movie'             : 1
    };
    
    for (k in options) {
        item = options[k];
        k = k.toLowerCase();
        if (params[k] && (item || item === false || item === 0)) {
            str.push('<param name="' + k + '" value="' + encodeHTML(item) + '" />');
        }
    }
    
    // 使用embed时，flash地址的属性名是src，并且要指定embed的type和pluginspage属性
    options['src']  = options['movie'];
    options['name'] = options['id'];
    delete options['id'];
    delete options['movie'];
    delete options['classid'];
    delete options['codebase'];
    options['type'] = 'application/x-shockwave-flash';
    options['pluginspage'] = 'http://www.macromedia.com/go/getflashplayer';
    
    
    // 构建embed标签的字符串
    str.push('<embed');
    // 在firefox、opera、safari下，salign属性必须在scale属性之后，否则会失效
    // 经过讨论，决定采用BT方法，把scale属性的值先保存下来，最后输出
    var salign;
    for (k in options) {
        item = options[k];
        if (item || item === false || item === 0) {
            if ((new RegExp("^salign\x24", "i")).test(k)) {
                salign = item;
                continue;
            }
            
            str.push(' ', k, '="', encodeHTML(item), '"');
        }
    }
    
    if (salign) {
        str.push(' salign="', encodeHTML(salign), '"');
    }
    str.push('></embed></object>');
    
    return str.join('');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/swf/create.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/17
 */




/**
 * 在页面中创建一个flash对象
 * @name baidu.swf.create
 * @function
 * @grammar baidu.swf.create(options[, container])
 * 
 * @param {Object} 	options 					创建flash的选项参数
 * @param {string} 	options.id 					要创建的flash的标识
 * @param {string} 	options.url 				flash文件的url
 * @param {String} 	options.errorMessage 		未安装flash player或flash player版本号过低时的提示
 * @param {string} 	options.ver 				最低需要的flash player版本号
 * @param {string} 	options.width 				flash的宽度
 * @param {string} 	options.height 				flash的高度
 * @param {string} 	options.align 				flash的对齐方式，允许值：middle/left/right/top/bottom
 * @param {string} 	options.base 				设置用于解析swf文件中的所有相对路径语句的基本目录或URL
 * @param {string} 	options.bgcolor 			swf文件的背景色
 * @param {string} 	options.salign 				设置缩放的swf文件在由width和height设置定义的区域内的位置。允许值：l/r/t/b/tl/tr/bl/br
 * @param {boolean} options.menu 				是否显示右键菜单，允许值：true/false
 * @param {boolean} options.loop 				播放到最后一帧时是否重新播放，允许值： true/false
 * @param {boolean} options.play 				flash是否在浏览器加载时就开始播放。允许值：true/false
 * @param {string} 	options.quality 			设置flash播放的画质，允许值：low/medium/high/autolow/autohigh/best
 * @param {string} 	options.scale 				设置flash内容如何缩放来适应设置的宽高。允许值：showall/noborder/exactfit
 * @param {string} 	options.wmode 				设置flash的显示模式。允许值：window/opaque/transparent
 * @param {string} 	options.allowscriptaccess 	设置flash与页面的通信权限。允许值：always/never/sameDomain
 * @param {string} 	options.allownetworking 	设置swf文件中允许使用的网络API。允许值：all/internal/none
 * @param {boolean} options.allowfullscreen 	是否允许flash全屏。允许值：true/false
 * @param {boolean} options.seamlesstabbing 	允许设置执行无缝跳格，从而使用户能跳出flash应用程序。该参数只能在安装Flash7及更高版本的Windows中使用。允许值：true/false
 * @param {boolean} options.devicefont 			设置静态文本对象是否以设备字体呈现。允许值：true/false
 * @param {boolean} options.swliveconnect 		第一次加载flash时浏览器是否应启动Java。允许值：true/false
 * @param {Object} 	options.vars 				要传递给flash的参数，支持JSON或string类型。
 * 
 * @param {HTMLElement|string} [container] 		flash对象的父容器元素，不传递该参数时在当前代码位置创建flash对象。
 * @meta standard
 * @see baidu.swf.createHTML,baidu.swf.getMovie
 */
baidu.swf.create = function (options, target) {
    options = options || {};
    var html = baidu.swf.createHTML(options) 
               || options['errorMessage'] 
               || '';
                
    if (target && 'string' == typeof target) {
        target = document.getElementById(target);
    }
    baidu.dom.insertHTML( target || document.body ,'beforeEnd',html );
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/swf/getMovie.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/16
 */





/**
 * 获得flash对象的实例
 * @name baidu.swf.getMovie
 * @function
 * @grammar baidu.swf.getMovie(name)
 * @param {string} name flash对象的名称
 * @see baidu.swf.create
 * @meta standard
 * @returns {HTMLElement} flash对象的实例
 */
baidu.swf.getMovie = function (name) {
	//ie9下, Object标签和embed标签嵌套的方式生成flash时,
	//会导致document[name]多返回一个Object元素,而起作用的只有embed标签
	var movie = document[name], ret;
    return baidu.browser.ie == 9 ?
    	movie && movie.length ? 
    		(ret = baidu.array.remove(baidu.lang.toArray(movie),function(item){
    			return item.tagName.toLowerCase() != "embed";
    		})).length == 1 ? ret[0] : ret
    		: movie
    	: movie || window[name];
};
/*
 * Tangram
 * Copyright 2011 Baidu Inc. All rights reserved.
 */






/**
 * Js 调用 Flash方法的代理类.
 * @function
 * @name baidu.swf.Proxy
 * @grammar new baidu.swf.Proxy(id, property, [, loadedHandler])
 * @param {string} id Flash的元素id.object标签id, embed标签name.
 * @param {string} property Flash的方法或者属性名称，用来检测Flash是否初始化好了.
 * @param {Function} loadedHandler 初始化之后的回调函数.
 * @remark Flash对应的DOM元素必须已经存在, 否则抛错. 可以使用baidu.swf.create预先创建Flash对应的DOM元素.
 * @author liyubei@baidu.com (leeight)
 */
baidu.swf.Proxy = function(id, property, loadedHandler) {
    /**
     * 页面上的Flash对象
     * @type {HTMLElement}
     */
    var me = this,
        flash = this._flash = baidu.swf.getMovie(id),
        timer;
    if (! property) {
        return this;
    }
    timer = setInterval(function() {
        try {
            /** @preserveTry */
            if (flash[property]) {
                me._initialized = true;
                clearInterval(timer);
                if (loadedHandler) {
                    loadedHandler();
                }
            }
        } catch (e) {
        }
    }, 100);
};
/**
 * 获取flash对象.
 * @return {HTMLElement} Flash对象.
 */
baidu.swf.Proxy.prototype.getFlash = function() {
    return this._flash;
};
/**
 * 判断Flash是否初始化完成,可以与js进行交互.
 */
baidu.swf.Proxy.prototype.isReady = function() {
    return !! this._initialized;
};
/**
 * 调用Flash中的某个方法
 * @param {string} methodName 方法名.
 * @param {...*} var_args 方法的参数.
 */
baidu.swf.Proxy.prototype.call = function(methodName, var_args) {
    try {
        var flash = this.getFlash(),
            args = Array.prototype.slice.call(arguments);

        args.shift();
        if (flash[methodName]) {
            flash[methodName].apply(flash, args);
        }
    } catch (e) {
    }
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/url/getQueryValue.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/16
 */




/**
 * 根据参数名从目标URL中获取参数值
 * @name baidu.url.getQueryValue
 * @function
 * @grammar baidu.url.getQueryValue(url, key)
 * @param {string} url 目标URL
 * @param {string} key 要获取的参数名
 * @meta standard
 * @see baidu.url.jsonToQuery
 *             
 * @returns {string|null} - 获取的参数值，其中URI编码后的字符不会被解码，获取不到时返回null
 */
baidu.url.getQueryValue = function (url, key) {
    var reg = new RegExp(
                        "(^|&|\\?|#)" 
                        + baidu.string.escapeReg(key) 
                        + "=([^&#]*)(&|\x24|#)", 
                    "");
    var match = url.match(reg);
    if (match) {
        return match[2];
    }
    
    return null;
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/url/jsonToQuery.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/16
 */





/**
 * 将json对象解析成query字符串
 * @name baidu.url.jsonToQuery
 * @function
 * @grammar baidu.url.jsonToQuery(json[, replacer])
 * @param {Object} json 需要解析的json对象
 * @param {Function=} replacer_opt 对值进行特殊处理的函数，function (value, key)
 * @see baidu.url.queryToJson,baidu.url.getQueryValue
 *             
 * @return {string} - 解析结果字符串，其中值将被URI编码，{a:'&1 '} ==> "a=%261%20"。
 */
baidu.url.jsonToQuery = function (json, replacer_opt) {
    var result = [], 
        itemLen,
        replacer = replacer_opt || function (value) {
          return baidu.url.escapeSymbol(value);
        };
        
    baidu.object.each(json, function(item, key){
        // 这里只考虑item为数组、字符串、数字类型，不考虑嵌套的object
        if (baidu.lang.isArray(item)) {
            itemLen = item.length;
            // value的值需要encodeURIComponent转义吗？
            // FIXED 优化了escapeSymbol函数
            while (itemLen--) {
                result.push(key + '=' + replacer(item[itemLen], key));
            }
        } else {
            result.push(key + '=' + replacer(item, key));
        }
    });
    
    return result.join('&');
};
/*
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: baidu/url/queryToJson.js
 * author: erik
 * version: 1.1.0
 * date: 2009/11/16
 */




/**
 * 解析目标URL中的参数成json对象
 * @name baidu.url.queryToJson
 * @function
 * @grammar baidu.url.queryToJson(url)
 * @param {string} url 目标URL
 * @see baidu.url.jsonToQuery
 *             
 * @returns {Object} - 解析为结果对象，其中URI编码后的字符不会被解码，'a=%20' ==> {a:'%20'}。
 */
baidu.url.queryToJson = function (url) {
    var query   = url.substr(url.lastIndexOf('?') + 1),
        params  = query.split('&'),
        len     = params.length,
        result  = {},
        i       = 0,
        key, value, item, param;
    
    for (; i < len; i++) {
        if(!params[i]){
            continue;
        }
        param   = params[i].split('=');
        key     = param[0];
        value   = param[1];
        
        item = result[key];
        if ('undefined' == typeof item) {
            result[key] = value;
        } else if (baidu.lang.isArray(item)) {
            item.push(value);
        } else { // 这里只可能是string了
            result[key] = [item, value];
        }
    }
    
    return result;
};

// Copyright (c) 2009, Baidu Inc. All rights reserved.
// 
// Licensed under the BSD License
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http:// tangram.baidu.com/license.html
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
 /**
 * @namespace T Tangram七巧板
 * @name T
 * @version 1.5.2
*/

/**
 * 声明baidu包
 * @author: allstar, erik, meizz, berg
 */
var T,
    baidu = T = baidu || {version: "1.5.2"}; 

//提出guid，防止在与老版本Tangram混用时
//在下一行错误的修改window[undefined]
baidu.guid = "$BAIDU$";

//Tangram可能被放在闭包中
//一些页面级别唯一的属性，需要挂载在window[baidu.guid]上
baidu.$$ = window[baidu.guid] = window[baidu.guid] || {global:{}};

/**
 * 各种页面的UI组件
 * @namespace baidu.ui
 */
baidu.ui = baidu.ui || { version: '1.3.9' };

/**
 * 通过uiType找到UI类
 * @function
 * @grammar baidu.ui.getUI(uiType)
 * @param  {String} uiType  查找规则：suggestion -> baidu.ui.Suggestion，toolbar-spacer -> baidu.ui.Toolbar.Spacer.
 * @return {object} UI类
 * @author berg
 */
baidu.ui.getUI = function(uiType){
    var uiType = uiType.split('-'),
        result = baidu.ui,
        len = uiType.length,
        i = 0;

    for (; i < len; i++) {
        result = result[uiType[i].charAt(0).toUpperCase() + uiType[i].slice(1)];
    }
    return result;
};


/* IGNORE API: baidu.lang.isString */

/**
 * 创建一个ui控件
 * @function
 * @grammar baidu.ui.create(UI, options)
 * @param {object|String} UI控件类或者uiType
 * @param {object} options optional 控件的初始化属性
 * @config {Boolean} autoRender 是否自动render，默认true
 * @config {String|HTMLElement} render render到的元素
 * @config {Object} parent 父控件
 * @return {Object} 创建好的控件实例
 * @author berg
 */
baidu.ui.create = function(UI, options){
    if(baidu.lang.isString(UI)){
        UI = baidu.ui.getUI(UI);
    }
    return new UI(options);
};



/* IGNORE API: baidu.dom.g */


/* IGNORE API: baidu.lang.Class */

/* IGNORE API: baidu.lang.Event */

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */


/**
 * UI基类，所有的UI都应该从这个类中派生出去
 * @name baidu.ui.Base
 * @grammar baidu.ui.Base
 * @class
 * @return {baidu.ui.Base}
 * @author berg
 */
baidu.ui.Base = 
/**
 * @lends baidu.ui.Base.prototype
 */
{

    id : "",

    /**
     * 获得当前控件的id
     * @param {string} optional key 
     * @return {string} id
     */
    getId : function(key){
        var ui = this, idPrefix;
        //通过guid区别多实例
        idPrefix = "tangram-" + ui.uiType + '--' + (ui.id ? ui.id : ui.guid);
        return key ? idPrefix + "-" + key : idPrefix;
    },

    /**
     * 获得class，支持skin
     *
     * @param {string} optional key
     *
     * @return {string} className
     */
    getClass : function(key){
        var me = this,
            className = me.classPrefix,
            skinName = me.skin;
         if (key) {
             className += '-' + key;
             skinName += '-' + key;
         }
         if (me.skin) {
             className += ' ' + skinName;
         }
         return className;
    },

    getMain : function(){
        return baidu.g(this.mainId);
    },

    getBody : function(){
        return baidu.g(this.getId());
    },

    
    /**
     * 控件类型：如dialog
     */
    uiType : "",
    
    /**
     * 获取调用的字符串的引用前缀
     */
    getCallRef : function(){
        return "window['$BAIDU$']._instances['" + this.guid + "']";
    },

    /**
     * 获取调用的字符串
     */
    getCallString : function(fn){
        var i = 0,
            arg = Array.prototype.slice.call(arguments, 1),
            len = arg.length;
        for (; i < len; i++) {
            if (typeof arg[i] == 'string') {
                arg[i] = "'" + arg[i] +"'";
            }
        }
        //如果被闭包包起来了，用baidu.lang.instance会找到最外面的baidu函数，可能出错
        return this.getCallRef() 
                + '.' + fn + '('
                + arg.join(',') 
                + ');'; 
    },

    /**
     * 添加事件. 避免析构中漏掉注销事件.
     * @param {HTMLElement|string|window} element 目标元素或目标元素id
     * @param {string} type 事件类型
     * @param {Function} listener 需要添加的监听器
     */
    on : function(element, type, listener){
        baidu.on(element, type, listener);
        this.addEventListener("ondispose", function(){
            baidu.un(element, type, listener);
        });
    },

    /**
     * 渲染控件到指定的元素
     * @param {HTMLElement} main optional   要渲染到的元素，可选。
     *                                      如果不传此参数，则会在body下创建一个绝对定位的div做为main
     * @return  {HTMLElement} main 渲染到的元素
     */
    renderMain : function(main){
        var ui = this,
            i = 0,
            len;
        //如果被渲染过就不重复渲染
        if (ui.getMain()) {
            return ;
        }
        main = baidu.g(main);
        //如果没有main元素，创建一个在body下面的div当作main
        if(!main){
            main = document.createElement('div');
            document.body.appendChild(main);
            main.style.position = "absolute";
            //给这个元素创建一个class，方便用户控制
            main.className = ui.getClass("main");
        }
        if(!main.id){
            main.id = ui.getId("main");
        }
        ui.mainId = main.id;
        main.setAttribute('data-guid', ui.guid);

        return main;
    },

    /**
     * 销毁当前实例
     */
    dispose : function(){
        this.dispatchEvent("dispose");
        baidu.lang.Class.prototype.dispose.call(this);
    }
};

/**
 * 获取UI控件的父控件
 * @memberOf baidu.ui.Base.prototype
 * @return {UI} 父控件
 */
baidu.ui.Base.getParent = function(){
    return this._parent || null;
};

/**
 * 设置UI控件的父控件
 * @memberOf baidu.ui.Base.prototype
 * @param {UI} 父控件
 */
baidu.ui.Base.setParent = function(parent){
    var me = this,
        oldParent = me._parent;
    oldParent && oldParent.dispatchEvent("removechild");
    if(parent.dispatchEvent("appendchild", { child : me })){
        me._parent = parent;

        /* 
         * childName名字没有确定，暂时先不加这段代码
         * //如果有childName，skin和classPrefix以父元素为准
         *if(me.childName){
         *    if(parent.skin){
         *        me.skin = parent.skin + '-' + me.childName;
         *    }
         *    if(parent.classPrefix){
         *        me.classPrefix = parent.classPrefix + '-' + me.childName;
         *    }
         *}
         */
    }
};

//依赖包
/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.lang.isFunction */

/**
 * 创建一个UI控件类
 * @function
 * @grammar baidu.ui.createUI(constructor, options)
 * @param {Function} constructor ui控件构造器
 * @param {Object} options 选项
 * @return {Object} ui控件
 */
baidu.ui.createUI = function(constructor, options) {
    options = options || {};
    var superClass = options.superClass || baidu.lang.Class,
        lastInherit = superClass == baidu.lang.Class ? 1 : 0,
        i,
        n,
        ui = function(opt, _isInherits){// 创建新类的真构造器函数
            var me = this;
            opt = opt || {};
            // 继承父类的构造器，将isInherits设置成true，在后面不执行render操作
            superClass.call(me, !lastInherit ? opt : (opt.guid || ""), true);

            //扩展静态配置到this上
            baidu.object.extend(me, ui.options);
            //扩展当前options中的项到this上
            baidu.object.extend(me, opt);
            //baidu.object.merge(me, opt, {overwrite:true, recursive:true});

            me.classPrefix = me.classPrefix || "tangram-" + me.uiType.toLowerCase();

            //初始化行为
            //行为就是在控件实例上附加一些属性和方法
            for(i in baidu.ui.behavior){
                //添加行为到控件上
                if(typeof me[i] != 'undefined' && me[i]){
                    baidu.object.extend(me, baidu.ui.behavior[i]);
                    if(baidu.lang.isFunction(me[i])){
                        me.addEventListener("onload", function(){
                            baidu.ui.behavior[i].call(me[i].apply(me));
                        });
                    }else{
                        baidu.ui.behavior[i].call(me);
                    }
                }
            }

            //执行控件自己的构造器
            constructor.apply(me, arguments);

            //执行插件的构造器
            for (i=0, n=ui._addons.length; i<n; i++) {
                ui._addons[i](me);
            }
            if(opt.parent && me.setParent){
                me.setParent(opt.parent);
            }
            if(!_isInherits && opt.autoRender){ 
                me.render(opt.element);
            }
        },
        C = function(){};

    C.prototype = superClass.prototype;

    //继承父类的原型链
    var proto = ui.prototype = new C();

    //继承Base中的方法到prototype中
    for (i in baidu.ui.Base) {
        proto[i] = baidu.ui.Base[i];
    }

    /**
     * 扩展控件的prototype
     * 
     * @param {Object} json 要扩展进prototype的对象
     *
     * @return {Object} 扩展后的对象
     */
    ui.extend = function(json){
        for (i in json) {
            ui.prototype[i] = json[i];
        }
        return ui;  // 这个静态方法也返回类对象本身
    };

    //插件支持
    ui._addons = [];
    ui.register = function(f){
        if (typeof f == "function")
            ui._addons.push(f);
    };
    
    //静态配置支持
    ui.options = {};
    
    return ui;
};


/* IGNORE API: baidu.page.getViewWidth */

/* IGNORE API: baidu.page.getViewHeight */

/* IGNORE API: baidu.page.getScrollLeft */

/* IGNORE API: baidu.page.getScrollTop */


/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.dom.children */


/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.dom.remove */

/* IGNORE API: baidu.dom.setStyles */

/* IGNORE API: baidu.dom.getStyle */

/* IGNORE API: baidu.dom._styleFilter.px */


/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.browser */


/* IGNORE API: baidu.lang.isNumber */

/* IGNORE API: baidu.dom.setBorderBoxHeight */

/* IGNORE API: baidu.dom.setBorderBoxWidth */

/**
 * Dialog基类，建立一个dialog实例
 * @class Dialog类
 * @grammar new baidu.ui.Dialog(options)
 * @param     {Object}        options               选项
 * @config    {DOMElement}    content               要放到dialog中的元素，如果传此参数时同时传contentText，则忽略contentText。
 * @config    {String}        contentText           dialog中的内容
 * @config    {String|Number} width                 内容区域的宽度，默认值为400，注意，这里的内容区域指getContent()得到元素的区域，不包含title和footer。
 * @config    {String|Number} height                内容区域的高度，默认值为300
 * @config    {String|Number} top                   dialog距离页面上方的距离
 * @config    {String|Number} left                  dialog距离页面左方的距离
 * @config    {String}        titleText             dialog标题文字
 * @config    {String}        classPrefix           dialog样式的前缀
 * @config    {Number}        zIndex                dialog的zIndex值，默认值为1000
 * @config    {Function}      onopen                dialog打开时触发
 * @config    {Function}      onclose               dialog关闭时触发
 * @config    {Function}      onbeforeclose         dialog关闭前触发，如果此函数返回false，则组织dialog关闭。
 * @config    {Function}      onupdate              dialog更新内容时触发
 * @config    {Boolean}       closeOnEscape         keyboardSupport模块提供支持，当esc键按下时关闭dialog。
 * @config    {String}        closeText             closeButton模块提供支持，关闭按钮上的title。
 * @config    {Boolean}       modal                 modal模块支持，是否显示遮罩
 * @config    {String}        modalColor            modal模块支持，遮罩的颜色
 * @config    {Number}        modalOpacity          modal模块支持，遮罩的透明度
 * @config    {Number}        modalZIndex           modal模块支持，遮罩的zIndex值
 * @config    {Boolean}       draggable             draggable模块支持，是否支持拖拽
 * @config    {Function}      ondragstart           draggable模块支持，当拖拽开始时触发
 * @config    {Function}      ondrag                draggable模块支持，拖拽过程中触发
 * @config    {Function}      ondragend             draggable模块支持，拖拽结束时触发
 * @plugin    autoDispose		支持关闭后自动销毁组建
 * @plugin    button			Dialog底部按钮
 * @plugin    closeButton		支持关闭按钮
 * @plugin    coverable			支持遮盖页面的任意元素
 * @plugin    draggable       	支持被拖拽
 * @plugin    iframe	      	支持创建的content是一个iframe
 * @plugin    keyboard	      	键盘支持插件
 * @plugin    modal		      	背景遮罩插件
 * @plugin    resizable		    缩放功能插件
 */

baidu.ui.Dialog = baidu.ui.createUI(function (options){

    var me = this;
    me._content = 'initElement';
    me.content = me.content || null;
    
    me._contentText = 'initText';
    me.contentText = me.contentText || '';
    
    me._titleText = 'initText';
    me.titleText = me.titleText || '';

}).extend(
/**
 *  @lends baidu.ui.Dialog.prototype
 */
{
    //ui控件的类型，传入给UIBase **必须**
    uiType: 'dialog',
    //ui控件的class样式前缀 可选
    //classPrefix     : "tangram-dialog-",

    width: '',
    height: '',

    top: 'auto',
    left: 'auto',
    zIndex: 1000,//没有做层管理
    //用style来保证其初始状态，不会占据屏幕的位置
    tplDOM: "<div id='#{id}' class='#{class}' style='position:relative'>#{title}#{content}#{footer}</div>",
    tplTitle: "<div id='#{id}' class='#{class}'><span id='#{inner-id}' class='#{inner-class}'>#{content}</span></div>",
    tplContent: "<div id='#{id}' class='#{class}' style='overflow:hidden; position:relative'>#{content}</div>",
    tplFooter: "<div id='#{id}' class='#{class}'></div>",

    /**
     * 查询当前窗口是否处于显示状态
     * @public
     * @return {Boolean}  是否处于显示状态
     */
    isShown: function() {
        return baidu.ui.Dialog.instances[this.guid] == 'show';
    },
    
    /**
     * 获取dialog的HTML字符串
     * @private
     * @return {String} DialogHtml
     */
    getString: function() {
        var me = this,
            html,
            title = 'title',
            titleInner = 'title-inner',
            content = 'content',
            footer = 'footer';

        return baidu.format(me.tplDOM, {
            id: me.getId(),
            'class' : me.getClass(),
            title: baidu.format(
                me.tplTitle, {
                    id: me.getId(title),
                    'class' : me.getClass(title),
                    'inner-id' : me.getId(titleInner),
                    'inner-class' : me.getClass(titleInner),
                    content: me.titleText || ''
                }),
            content: baidu.format(
                me.tplContent, {
                    id: me.getId(content),
                    'class' : me.getClass(content),
                    content: me.contentText || ''
                }),
            footer: baidu.format(
                me.tplFooter, {
                    id: me.getId(footer),
                    'class' : me.getClass(footer)
            })
        });
    },

    /**
     * 绘制dialog到页面
	 * @public
     * @return {HTMLElement} mainDiv
     */
    render: function() {
        var me = this,
            main;

        //避免重复render
        if (me.getMain()) {
            return;
        }

        main = me.renderMain();

        //main.style.left =  '-10000em';
        main.innerHTML = me.getString();
        me._update();
        me._updatePosition();

        baidu.dom.setStyles(me.getMain(), {
            position: 'absolute',
            zIndex: me.zIndex,
            marginLeft: '-100000px'
        });
        //当居中时，窗口改变大小时候要重新计算位置
        me.windowResizeHandler = me.getWindowResizeHandler();
        me.on(window, 'resize', me.windowResizeHandler);

        me.dispatchEvent('onload');

        return main;
    },
    
    /**
     * 更新title，和content内容函数
     * @private
     * @param {Object} options 传入参数
     * @return null
     */
    _update:function(options){
        var me = this,
            content = me.getContent(),
            options = options || {},
            title = me.getTitleInner(),
            setText = false;
      
        if(typeof options.titleText != 'undefined'){
            //当options中存在titleText时,认为用户需要更新titleText，直接更新
            title.innerHTML = options.titleText;
            me.titleText = me._titleText = options.titleText;
        }else if (me.titleText != me._titleText){
            //当第一次创建dialog时，无论是否传入titleText，都会走入该分支
            //之后若采用dialog.titleText = '***'；dialog.update();方式更新，也会进入该分支
            title.innerHTML = me.titleText;
            me._titleText = me.titleText;
        } 

        //content优先级大于contentText
        if(typeof options.content != 'undefined'){
            //当options中存在content，认为用户需要更新content,直接更新
            content.innerHTML = '';
            me.content = options.content;
            //若content为null。则代表删除content属性
            if(options.content !== null){
                content.appendChild(options.content);
                me.content = me._content = content.firstChild;
                me.contentText = me._contentText = content.innerHTML;
                return;
            }
            setText = true;
        }else if(me.content !== me._content){
            //第一次new dialog时，进入该分支
            //若采用dialog.content = HTMLElement;dialog.update();的方式进行更新，进去该分支
            content.innerHTML = '';
            if(me.content !== null){
                content.appendChild(me.content);
                me.content = me._content = content.firstChild;
                me.contentText = me._contentText = content.innerHTML;
                return;
            }
            setText = true;
        }

        if(typeof options.contentText != 'undefined'){
            //当options中存在contentText，则认为用户要更新contentText，直接更新
            content.innerHTML = options.contentText;
            me.contentText = me._contentText = options.contentText;
            me.content = me._content = content.firstChild;
        }else if((me.contentText != me._contentText) || setText){
            //当new dialog时，无论是否传入contentText,都会进入该分支
            //若才用dialog.contentText = '***';dialog.update()进行更新，也会进入该分支
            content.innerHTML = me.contentText;
            me._contentText = me.contentText;
            me.content = me._content = content.firstChild;
        }
        
        delete(options.content);
        delete(options.contentText);
        delete(options.titleText);
        baidu.extend(me,options);
    },

    /**
     * 获得resize事件绑定的函数
     * @private
     * @return {Function}
     */
    getWindowResizeHandler: function() {
        var me = this;
        return function() {
            me._updatePosition();
        };
    },

    /**
     * 显示当前dialog
	 * @public
     */
    open: function() {
        var me = this;
        me._updatePosition();    
        me.getMain().style.marginLeft = 'auto';
        baidu.ui.Dialog.instances[me.guid] = 'show';
        me.dispatchEvent('onopen');
    },

    /**
     * 隐藏当前dialog
	 * @public
     */
    close: function() {
        var me = this;
        if (me.dispatchEvent('onbeforeclose')) {
            me.getMain().style.marginLeft = '-100000px';
            baidu.ui.Dialog.instances[me.guid] = 'hide';

            me.dispatchEvent('onclose');
        }
    },

	/**
     * 更新dialog状态 
	 * @public
     * @param     {Object}        options               选项参数
     * @config    {DOMElement}    content               要放到dialog中的元素，如果传此参数时同时传contentText，则忽略contentText。
     * @config    {String}        contentText           dialog中的内容
     * @config    {String|Number} width                 内容区域的宽度，默认值为400，注意，这里的内容区域指getContent()得到元素的区域，不包含title和footer。
     * @config    {String|Number} height                内容区域的高度，默认值为300
     * @config    {String|Number} top                   dialog距离页面上方的距离
     * @config    {String|Number} left                  dialog距离页面左方的距离
     * @config    {String}        titleText             dialog标题文字
     * @config    {String}        classPrefix           dialog样式的前缀
     * @config    {Number}        zIndex                dialog的zIndex值，默认值为1000
     * @config    {Function}      onopen                dialog打开时触发
     * @config    {Function}      onclose               dialog关闭时触发
     * @config    {Function}      onbeforeclose         dialog关闭前触发，如果此函数返回false，则组织dialog关闭。
     * @config    {Function}      onupdate              dialog更新内容时触发
     * @config    {Boolean}       closeOnEscape         keyboardSupport模块提供支持，当esc键按下时关闭dialog。
     * @config    {String}        closeText             closeButton模块提供支持，关闭按钮上的title。
     * @config    {Boolean}       modal                 modal模块支持，是否显示遮罩
     * @config    {String}        modalColor            modal模块支持，遮罩的颜色
     * @config    {Number}        modalOpacity          modal模块支持，遮罩的透明度
     * @config    {Number}        modalZIndex           modal模块支持，遮罩的zIndex值
     * @config    {Boolean}       draggable             draggable模块支持，是否支持拖拽
     * @config    {Function}      ondragstart           draggable模块支持，当拖拽开始时触发
     * @config    {Function}      ondrag                draggable模块支持，拖拽过程中触发
     * @config    {Function}      ondragend             draggable模块支持，拖拽结束时触发
     */
    update: function(options) {
        var me = this;
        me._update(options);
        me._updatePosition();
        me.dispatchEvent('onupdate');
    },

    /**
     * 获取body的寛高
     * @private
     * @return {Object} {width,height}，名值对
     */
    _getBodyOffset: function() {
        var me = this,
            bodyOffset,
            body = me.getBody(),
            content = me.getContent(),
            title = me.getTitle(),
            footer = me.getFooter();

        bodyOffset = {
            'width' : 0,
            'height' : 0
        };

        //确定取值为数字
        function getStyleNum(d,style) {
            var result = parseFloat(baidu.getStyle(d, style));
            result = isNaN(result) ? 0 : result;
            result = baidu.lang.isNumber(result) ? result : 0;
            return result;
        }
        //fix margin
        baidu.each(['marginLeft', 'marginRight'], function(item,index) {
            bodyOffset['width'] += getStyleNum(content, item);
        });

        bodyOffset['height'] += title.offsetHeight + getStyleNum(title, 'marginTop');
        bodyOffset['height'] += footer.offsetHeight + getStyleNum(footer, 'marginBottom');

        //fix margin
        var mt = getStyleNum(content, 'marginTop'), md = getStyleNum(title, 'marginBottom');
        bodyOffset['height'] += mt >= md ? mt : md;
        mt = getStyleNum(footer, 'marginTop'), md = getStyleNum(content, 'marginBottom');
        bodyOffset['height'] += mt >= md ? mt : md;

        return bodyOffset;
    },

    /**
     * 更新dialog位置及内部元素styles
     * @private
     * @return void
     * */
    _updatePosition: function() {
        var me = this,
        	bodyOffset,
            top = '',
            right = '',
            bottom = '',
            left = '',
            content = me.getContent(),
            body = me.getBody(),
            width,height;

        /*
         * 添加默认值支持
         * 当me.width或者me.height没有设置有效值时，不对其进行计算
         *
         * 暂不支持百分比形式的寛高计算
         * 在render或者window resize时保证content上的寛高必有值
         * TODO resizable如何适应dialog有默认值时的计算方法
         * 
         * 在webkit中，为保持dom的完整性，浏览器会自己计算一下css值
         * 例如：
         * content的属性为: 
         *  width:100px
         *  marginLeft:5px
         *  marginRight:5px
         *
         * body的属性为：
         *  width:110px
         *
         * 此时更改content的width值为90px
         * 在webkit中，取content的marginLeft和marginRight值分别是5px，15px
         * 而不是原有的5px，5px
         *
         * 针对这个问题，调成程序执行顺序，先取得所有相关的css属性值
         * 之后更改content的寛高，再根据content当前的offset值与之前取得的属性值进行计算，获取body的寛高值
         */

        width = parseFloat(me.width);
        height = parseFloat(me.height);
        
        bodyOffset = me._getBodyOffset();
        
        baidu.lang.isNumber(width) && baidu.dom.setOuterWidth(content,width);
        baidu.lang.isNumber(height) && baidu.dom.setOuterHeight(content,height);

        bodyOffset.width += content.offsetWidth;
        bodyOffset.height += content.offsetHeight;

        me.width && baidu.setStyle(body, 'width', bodyOffset.width);
        me.height && baidu.setStyle(body, 'height', bodyOffset.height);

        if ((me.left && me.left != 'auto') || (me.right && me.right != 'auto')) {
            //按照用户的值来设置
            left = me.left || '';
            right = me.right || '';
        } else {
            //自动居中
            left = Math.max((baidu.page.getViewWidth() - parseFloat(me.getMain().offsetWidth)) / 2 + baidu.page.getScrollLeft(), 0);
        }
        //下面的代码是上面代码的重复
        if ((me.top && me.top != 'auto') || (me.bottom && me.bottom != 'auto')) {
            top = me.top || '';
            bottom = me.bottom || '';
        } else {
            top = Math.max((baidu.page.getViewHeight() - parseFloat(me.getMain().offsetHeight)) / 2 + baidu.page.getScrollTop(), 0);
        }

        baidu.dom.setStyles(me.getMain(), {
            top: top,
            right: right,
            bottom: bottom,
            left: left
        });
    },

    /**
     * 获得title对应的dom元素
     * @public
     * @return {HTMLElement} title
     */
    getTitle: function() {
        return baidu.g(this.getId('title'));
    },

    /**
     * 获得title文字对应的dom元素
     * @public
     * @return {HTMLElement} titleInner
     */
    getTitleInner: function() {
        return baidu.g(this.getId('title-inner'));
    },

    /**
     * 获得content对应的dom元素
     * @public
     * @return {HTMLElement} content
     */
    getContent: function() {
        return baidu.g(this.getId('content'));
    },

    /**
     * 获得footer对应的dom元素
     * @public
     * @return {HTMLElement} footer
     */
    getFooter: function() {
        return baidu.g(this.getId('footer'));
    },

    /**
     * 销毁dialog实例
	 * @public
     */
    dispose: function() {
        var me = this;

        //删除实例引用
        delete baidu.ui.Dialog.instances[me.guid];
        me.dispatchEvent('dispose');
        baidu.dom.remove(me.getMain());
        baidu.lang.Class.prototype.dispose.call(me);
    }
});

baidu.ui.Dialog.instances = baidu.ui.Dialog.instances || {};

/* IGNORE API: baidu.lang.isString */

/* IGNORE API: baidu.object.extend */

/**
 * 关闭后自动销毁插件
 * @name baidu.ui.Dialog.Dialog$autoDispose
 * @addon baidu.ui.Dialog
 */

baidu.extend(baidu.ui.Dialog.prototype,{
    autoDispose: true
});

baidu.ui.Dialog.register(function(me){

    if(me.autoDispose){
        me.addEventListener("onload",function(){

            //默认自动dispose
            if (typeof me.autoDispose == 'undefined' || me.autoDispose) {
                me.addEventListener('onclose', function() {
                    me.dispose();
                });
            }
        });
    }
});

//依赖包




/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.dom.removeClass */

/* IGNORE API: baidu.dom.addClass */

/* IGNORE API: baidu.dom.insertHTML */

/* IGNORE API: baidu.dom.remove */
//声明包
/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: ui/behavior/statable.js
 * author: berg, lingyu
 * version: 1.0.0
 * date: 2010/09/04
 */
/**
 * @namespace baidu.ui.behavior 为各个控件增加装饰器
 */
baidu.ui.behavior = baidu.ui.behavior || {};


/* IGNORE API: baidu.dom.addClass */

/* IGNORE API: baidu.dom.removeClass */

/* IGNORE API: baidu.dom.hasClass */

/* IGNORE API: baidu.event.getTarget */

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */

/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.object.each */

/* IGNORE API: baidu.fn.bind */

/* IGNORE API: baidu.lang.Class.$addEventListeners */

/**
 * 为ui控件添加状态管理行为
 */
(function() {
    var Statable = baidu.ui.behavior.statable = function() {
        var me = this;

        me.addEventListeners('ondisable,onenable', function(event,options) {
            var element, group;
            options = options || {};
            elementId = (options.element || me.getMain()).id;
            group = options.group;

            if (event.type == 'ondisable' && !me.getState(elementId, group)['disabled']) {
        	    me.removeState('press', elementId, group);
        	    me.removeState('hover', elementId, group);
        	    me.setState('disabled', elementId, group);
            }else if (event.type == 'onenable' && me.getState(elementId, group)['disabled']) {
                me.removeState('disabled', elementId, group);
        	}
        });
    };

    //保存实例中所有的状态，格式：group+elementId : {stateA : 1, stateB : 1}
    Statable._states = {};
    //所有可用的状态，调用者通过addState添加
    Statable._allStates = ['hover', 'press', 'disabled'];
    Statable._allEventsName = ['mouseover', 'mouseout', 'mousedown', 'mouseup'];
    Statable._eventsHandler = {
        'mouseover' : function(id, group) {
            var me = this;
            if (!me.getState(id, group)['disabled']) {
                me.setState('hover', id, group);
                return true;
            }
        },
        'mouseout' : function(id, group) {
            var me = this;
            if (!me.getState(id, group)['disabled']) {
                me.removeState('hover', id, group);
                me.removeState('press', id, group);
                return true;
            }
        },
        'mousedown' : function(id, group) {
            var me = this;
            if (!me.getState(id, group)['disabled']) {
                me.setState('press', id, group);
                return true;
            }
        },
        'mouseup' : function(id, group) {
            var me = this;
            if (!me.getState(id, group)['disabled']) {
                me.removeState('press', id, group);
                return true;
            }
        }
    };

    /**
     * 获得状态管理方法的字符串，用于插入元素的HTML字符串的属性部分
     *
     * @param {string} group optional    状态分组，同一组的相同状态会被加上相同的css.
     * @param {string} key optional 索引，在同一类中的索引.
     *
     * @return {string} 元素属性字符串.
     */
    Statable._getStateHandlerString = function(group, key) {
        var me = this,
            i = 0,
            len = me._allEventsName.length,
            ret = [],
            eventType;
        if (typeof group == 'undefined') {
            group = key = '';
        }
        for (; i < len; i++) {
            eventType = me._allEventsName[i];
            ret[i] = 'on' + eventType + '=\"' + me.getCallRef() + "._fireEvent('" + eventType + "', '" + group + "', '" + key + "', event)\"";
        }

        return ret.join(' ');
    };

    /**
     * 触发指定类型的事件
     * @param {string} eventType  事件类型.
     * @param {string} group optional    状态分组，同一组的相同状态会被加上相同的css.
     * @param {string} key 索引，在同一类中的索引.
     * @param {DOMEvent} e DOM原始事件.
     */
    Statable._fireEvent = function(eventType, group, key, e) {
        var me = this,
        	id = me.getId(group + key);
        if (me._eventsHandler[eventType].call(me, id, group)) {
            me.dispatchEvent(eventType, {
                element: id,
                group: group,
                key: key,
                DOMEvent: e
            });
        }
    };

    /**
     * 添加一个可用的状态
     * @param {string} state 要添加的状态.
     * @param {string} eventNam optional DOM事件名称.
     * @param {string} eventHandler optional DOM事件处理函数.
     */
    Statable.addState = function(state, eventName, eventHandler) {
        var me = this;
        me._allStates.push(state);
        if (eventName) {
            me._allEventsName.push(eventName);
            if (!eventHandler) {
                eventHandler = function() {return true;};
            }
            me._eventsHandler[eventName] = eventHandler;
        }
    };

    /**
     * 获得指定索引的元素的状态
     * @param {string} elementId 元素id，默认是main元素id.
     * @param {string} group optional    状态分组，同一组的相同状态会被加上相同的css.
     */
    Statable.getState = function(elementId, group) {
        var me = this,
            _states;
        group = group ? group + '-' : '';
        elementId = elementId ? elementId : me.getId();
        _states = me._states[group + elementId];
        return _states ? _states : {};
    };

    /**
     * 设置指定索的元素的状态
     * @param {string} state 枚举量 in ui._allStates.
     * @param {string} elementId optional 元素id，默认是main元素id.
     * @param {string} group optional    状态分组，同一组的相同状态会被加上相同的css.
     */
    Statable.setState = function(state, elementId, group) {
        var me = this,
            stateId,
            currentState;

        group = group ? group + '-' : '';
        elementId = elementId ? elementId : me.getId();
        stateId = group + elementId;

        me._states[stateId] = me._states[stateId] || {};
        currentState = me._states[stateId][state];
        if (!currentState) {
            me._states[stateId][state] = 1;
            baidu.addClass(elementId, me.getClass(group + state));
        }
    };

    /**
     * 移除指定索引的元素的状态
     * @param {string} state 枚举量 in ui._allStates.
     * @param {string} element optional 元素id，默认是main元素id.
     * @param {string} group optional    状态分组，同一组的相同状态会被加上相同的css.
     */
    Statable.removeState = function(state, elementId, group) {
        var me = this,
            stateId;

        group = group ? group + '-' : '';
        elementId = elementId ? elementId : me.getId();
        stateId = group + elementId;

        if (me._states[stateId]) {
            me._states[stateId][state] = 0;
            baidu.removeClass(elementId, me.getClass(group + state));
        }
    };
})();


/**
 * button基类，创建一个button实例
 * @name baidu.ui.Button
 * @class
 * @grammar new baidu.ui.Button(options)
 * @param {Object} [options] 选项
 * @config {String}             content     按钮文本信息
 * @config {Boolean}            disabled    按钮是否有效，默认为false（有效）。
 * @config {Function}           onmouseover 鼠标悬停在按钮上时触发
 * @config {Function}           onmousedown 鼠标按下按钮时触发
 * @config {Function}           onmouseup   按钮弹起时触发
 * @config {Function}           onmouseout  鼠标移出按钮时触发
 * @config {Function}           onclick		鼠标点击按钮时触发
 * @config {Function}           onupdate	更新按钮时触发
 * @config {Function}           onload		页面加载时触发
 * @config {Function}           ondisable   当调用button的实例方法disable，使得按钮失效时触发。
 * @config {Function}           onenable    当调用button的实例方法enable，使得按钮有效时触发。
 * @returns {Button}                        Button类
 * @plugin  capture            使按钮支持capture
 * @plugin  poll               使按钮支持poll轮询
 * @remark  创建按钮控件时，会自动为控件加上四种状态的style class，分别为正常情况(tangram-button)、鼠标悬停在按钮上(tangram-button-hover)、鼠标按下按钮时(tangram-button-press)、按钮失效时(tangram-button-disable)，用户可自定义样式。
 */
baidu.ui.Button = baidu.ui.createUI(new Function).extend(
    /**
     *  @lends baidu.ui.Button.prototype
     */
    {
       
    //ui控件的类型，传入给UIBase **必须**
    uiType: 'button',
    //ui控件的class样式前缀 可选
    //classPrefix     : "tangram-button-",
    tplBody: '<div id="#{id}" #{statable} class="#{class}">#{content}</div>',
    disabled: false,
    statable: true,

    /**
     *  获得button的HTML字符串
     *  @private
     *  @return {String} 拼接的字符串
     */
    _getString: function() {
        var me = this;
        return baidu.format(me.tplBody, {
            id: me.getId(),
            statable: me._getStateHandlerString(),
            'class' : me.getClass(),
            content: me.content
        });
    },

    /**
     *  将button绘制到DOM树中。
     *  @param {HTMLElement|String} target  需要渲染到的元素
     */	
    render: function(target) {
        var me = this,
            body;
        me.addState('click', 'click', function(id, group) {
            var me = this;
            if (!me.getState(id, group)['disabled']) {
                return true;
            }
        });
        baidu.dom.insertHTML(me.renderMain(target), 'beforeEnd', me._getString());

        body = baidu.g(target).lastChild;
        if (me.title) {
            body.title = me.title;
        }

        me.disabled && me.setState('disabled');
        me.dispatchEvent('onload');
    },

    /**
     *  判断按钮是否处于失效状态。
     *  @return {Boolean} 是否失效的状态
     */
    isDisabled: function() {
        var me = this,
        	id = me.getId();
        return me.getState()['disabled'];
    },

    /**
     *  销毁实例。
     */
	dispose : function(){
		var me = this,
            body = me.getBody();
        me.dispatchEvent('dispose');
       //删除当前实例上的方法
        baidu.each(me._allEventsName, function(item,index) {
            body['on' + item] = null;
        });
        baidu.dom.remove(body);
		
        me.dispatchEvent('ondispose');
        baidu.lang.Class.prototype.dispose.call(me);
	},

    /**
     * 设置disabled属性
	 */
    disable: function() {
        var me = this,
        body = me.getBody();
        me.dispatchEvent('ondisable', {element: body});
    },

    /**
     * 删除disabled属性
	 */
    enable: function() {
        var me = this;
        body = me.getBody();
        me.dispatchEvent('onenable', {element: body});
    },

    /**
     * 触发button事件
     * @param {String} eventName   要触发的事件名称
     * @param {Object} e           事件event
     */
    fire: function(eventType,e) {
        var me = this, eventType = eventType.toLowerCase();
        if (me.getState()['disabled']) {
            return;
        }
        me._fireEvent(eventType, null, null, e);
    },

    /**
     * 更新button的属性
     * @param {Object}              options     更新button的属性
	 * @config {String}             content     按钮文本信息
	 * @config {Boolean}            disabled    按钮是否有效，默认为false（有效）。
	 * @config {Function}           onmouseover 鼠标悬停在按钮上时触发
	 * @config {Function}           onmousedown 鼠标按下按钮时触发
	 * @config {Function}           onmouseup   按钮弹起时触发
	 * @config {Function}           onmouseout  鼠标移出按钮时触发
	 * @config {Function}           onclick		鼠标点击按钮时触发
	 * @config {Function}           onupdate	更新按钮时触发
	 * @config {Function}           onload		页面加载时触发
	 * @config {Function}           ondisable   当调用button的实例方法disable，使得按钮失效时触发。
	 * @config {Function}           onenable    当调用button的实例方法enable，使得按钮有效时触发。
     * 
     */
    update: function(options) {
        var me = this;
        baidu.extend(me, options);
        options.content && (me.getBody().innerHTML = options.content);

        me.dispatchEvent('onupdate');
    }
});


/* IGNORE API: baidu.object.each */


/**
 * 提供国际的一些接口
 * @namespace baidu.i18n
 */
baidu.i18n = baidu.i18n || {};
/**
 * string
 * @name baidu.i18n.string
 * @Object
 * @grammar baidu.i18n.string
 */
baidu.i18n.string = baidu.i18n.string || /**@lends baidu.i18n.string.prototype*/{
    
    /**
     * 按照某种语言的格式去掉字符串两边的空白字符
     * @grammar baidu.i18n.string.trim(source, locale)
     * @param {String} source 需要格式化的语言
     * @param {String} [locale] 目标语言
     * @return {String}
     */
    trim: function(source, locale){
        var pat = baidu.i18n.cultures[locale || baidu.i18n.currentLocale].whitespace;
        return String(source).replace(pat,"");
    },

    /**
     * 将传入的字符串翻译成目标语言
     * @grammar baidu.i18n.string.translation(source, locale)
     * @param {String} source 需要进行翻译的字符串
     * @param {String} [locale] 目标语言
     * @return {String}
     */
    translation: function(source, locale){
        var tOpt = baidu.i18n.cultures[locale || baidu.i18n.currentLocale].language;

        return tOpt[source] || '';
    }

};

baidu.i18n.cultures = baidu.i18n.cultures || {};

/* IGNORE API: baidu.object.extend */

baidu.i18n.cultures['zh-CN'] = baidu.object.extend(baidu.i18n.cultures['zh-CN'] || {}, {
    calendar: {
        dateFormat: 'yyyy-MM-dd',
        titleNames: '#{yyyy}年&nbsp;#{MM}月',
        monthNames: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
        dayNames: {mon: '一', tue: '二', wed: '三', thu: '四', fri: '五', sat: '六', sun: '日'}
    },
    
    timeZone: 8,
    whitespace: new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g"),
    
    number: {
        group: ",",
        groupLength: 3,
        decimal: ".",
        positive: "",
        negative: "-",

        _format: function(number, isNegative){
            return baidu.i18n.number._format(number, {
                group: this.group,
                groupLength: this.groupLength,
                decimal: this.decimal,
                symbol: isNegative ? this.negative : this.positive 
            });
        }
    },

    currency: {
        symbol: '￥'  
    },

    language: {
        ok: '确定',
        cancel: '取消',
        signin: '注册',
        signup: '登录'
    }
});

baidu.i18n.currentLocale = baidu.i18n.currentLocale || 'zh-CN';


/**
 * 允许创建底部按钮
 * @name baidu.ui.Dialog.Dialog$button
 * @addon baidu.ui.Dialog
 */
baidu.extend(baidu.ui.Dialog.prototype,{
    
    /**
     * 创建底部按钮
	 * @name baidu.ui.Dialog.Dialog$button.createButton
	 * @addon  baidu.ui.Dialog.Dialog$button
	 * @function 
     * @param {Object} option 创建按钮的options，格式与baidu.ui.Button的参数相同
     * @param {String} name 按钮的唯一标识符
     * @return void
     */
    createButton:function(option,name){
        var me = this;
        baidu.extend(option,{
            classPrefix : me.classPrefix + "-" + name,
            skin : me.skin ? me.skin + "-" + name : "",
            element : me.getFooter(),
            autoRender : true,
            parent : me
        });
        var buttonInstance = new baidu.ui.Button(option);
        me.buttonInstances[name] = buttonInstance;
    },
   
    /**
     * 删除底部按钮
	 * @name baidu.ui.Dialog.Dialog$button.removeButton
	 * @addon  baidu.ui.Dialog.Dialog$button
	 * @function 
     * @param {String} name 按钮的唯一标识符
     * @return void
     */
    removeButton:function(name){
        var me = this,
            button = me.buttonInstances[name];
        if(button){
            button.dispose();
            delete(me.buttonInstances[name]);
            delete(me.buttons[name]);
        }
    }
});
baidu.ui.Dialog.register(function(me){
    //存储button实例
    me.buttonInstances = {};
    me.language = me.language || 'zh-CN';
    
    var accept,cancel,tmpButtons = {},
        language = baidu.i18n.cultures[me.language].language;
    
    accept = {
        'content' : language['ok'],
        'onclick' : function() {
            var me = this,
                parent = me.getParent();
            parent.dispatchEvent('onaccept') && parent.close();
        }
    };
    cancel = {
        'content' : language['cancel'],
        'onclick' : function() {
            var me = this,
                parent = me.getParent();
            parent.dispatchEvent('oncancel') && parent.close();
        }
    };

    //在onLoad时创建buttons
    me.addEventListener("onload",function(){
        switch(me.type){
            case "alert":
                me.submitOnEnter = me.submitOnEnter || true;
                tmpButtons = {accept:accept};
                break;
            case "confirm":
                me.submitOnEnter = me.submitOnEnter || true;
                tmpButtons = {accept:accept,cancel:cancel};
                break;
            default:
        }
        me.buttons = baidu.extend(tmpButtons,me.buttons || {});
        baidu.object.each(me.buttons,function(opt, name){
            me.createButton(opt,name);
        });

        //注册ontener事件
        me.submitOnEnter && me.addEventListener('onenter', function(e) {
            me.buttonInstances['accept'].fire('click', e);
        });
    });

    //在dispose时同时dispose buttons
    me.addEventListener("ondispose",function(){
        baidu.object.each(me.buttons,function(opt, name){
            me.removeButton(name);
        });
    });

    //在update时同时update buttons
    me.addEventListener("onupdate",function(){
        baidu.object.each(me.buttons,function(opt, name){
            me.buttonInstances[name] ? me.buttonInstances[name].update(opt) : me.createButton(opt,name); 
        });
    });
});

/* IGNORE API: baidu.dom.insertHTML */



/* IGNORE API: baidu.event.stopPropagation */

/**
  * 支持关闭按钮插件
 * @name baidu.ui.Dialog.Dialog$closeButton
 * @addon baidu.ui.Dialog
 */

baidu.extend(baidu.ui.Dialog.prototype,{
    closeText  : "",
    closeButton : true
});
baidu.ui.Dialog.register(function(me){
    
    me.closeButton && me.addEventListener("onload", function(){
        var buttonInstance = new baidu.ui.Button({
            parent : me,
            classPrefix : me.classPrefix + "-close",
            skin : me.skin ? me.skin + "-close" : "",
            onclick : function(){
                me.close();
            },
            onmousedown : function(e){
               baidu.event.stopPropagation(e.DOMEvent);
            },
            element:me.getTitle(),
            autoRender:true
        });
        me.closeButtonInstance = buttonInstance;

        me.addEventListener("ondispose",function(){
            buttonInstance.dispose();
        });
    });
});

/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 */




/* IGNORE API: baidu.dom.children */

/* IGNORE API: baidu.dom.insertBefore */

/* IGNORE API: baidu.dom.setStyle */

/* IGNORE API: baidu.dom.setStyles */

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.dom.setBorderBoxSize */

(function(){
    var Coverable = baidu.ui.behavior.coverable = function() {};
    
    Coverable.Coverable_isShowing = false;
    Coverable.Coverable_iframe;
    Coverable.Coverable_container;
    Coverable.Coverable_iframeContainer;

    /**
     * 显示遮罩，当遮罩不存在时创建遮罩
     * @public
     * @return {NULL}
     */
    Coverable.Coverable_show = function(){
        var me = this;
        if(me.Coverable_iframe){
            me.Coverable_update();
            baidu.setStyle(me.Coverable_iframe, 'display', 'block'); 
            return;
        }
        
        var opt = me.coverableOptions || {},
            container = me.Coverable_container = opt.container || me.getMain(),
            opacity = opt.opacity || '0',
            color = opt.color || '',
            iframe = me.Coverable_iframe = document.createElement('iframe'),
            iframeContainer = me.Coverable_iframeContainer = document.createElement('div');

        //append iframe container
        baidu.dom.children(container).length > 0 ?
            baidu.dom.insertBefore(iframeContainer, container.firstChild):
            container.appendChild(iframeContainer);
       
        //setup iframeContainer styles
        baidu.setStyles(iframeContainer, {
            position: 'absolute',
            top: '0px',
            left: '0px'
        });
        baidu.dom.setBorderBoxSize(iframeContainer,{
            width: container.offsetWidth,
            height: container.offsetHeight
        });

        baidu.dom.setBorderBoxSize(iframe,{
            width: iframeContainer.offsetWidth
        });

        baidu.dom.setStyles(iframe,{
            zIndex  : -1,
            display  : "block",
            border: 0,
            backgroundColor: color,
            filter : 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=' + opacity + ')'
        });
        iframeContainer.appendChild(iframe);
        
        iframe.src = "javascript:void(0)";
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.height = '97%';
        me.Coverable_isShowing = true;
    };

    /**
     * 隐藏遮罩
     * @public
     * @return {NULL}
     */
    Coverable.Coverable_hide = function(){
        var me = this,
            iframe = me.Coverable_iframe;
        
        if(!me.Coverable_isShowing){
            return;
        }
        
        baidu.setStyle(iframe, 'display', 'none');
        me.Coverable_isShowing = false;
    };

    /**
     * 更新遮罩
     * @public
     * @param {Object} options
     * @config {Number|String} opacity 透明度
     * @config {String} backgroundColor 背景色
     */
    Coverable.Coverable_update = function(options){
        var me = this,
            options = options || {},
            container = me.Coverable_container,
            iframeContainer = me.Coverable_iframeContainer,
            iframe = me.Coverable_iframe;
  
        baidu.dom.setBorderBoxSize(iframeContainer,{
            width: container.offsetWidth,
            height: container.offsetHeight
        });

        baidu.dom.setBorderBoxSize(iframe,baidu.extend({
            width: baidu.getStyle(iframeContainer, 'width')
        },options));
    };
})();


/* IGNORE API: baidu.lang.Class.$addEventListeners */
/**
 * 支持遮盖页面的任意元素
 * @name baidu.ui.Dialog.Dialog$coverable
 * @addon baidu.ui.Dialog
 */

baidu.extend(baidu.ui.Dialog.prototype,{
    coverable: true,
    coverableOptions: {}
});

baidu.ui.Dialog.register(function(me){

    if(me.coverable){

        me.addEventListeners("onopen,onload", function(){
            me.Coverable_show();
        });

        me.addEventListener("onclose", function(){
            me.Coverable_hide();
        });

        me.addEventListener("onupdate",function(){
            me.Coverable_update();
        });
    }
});

/* IGNORE API: baidu.dom.draggable */

/* IGNORE API: baidu.page.getWidth */

/* IGNORE API: baidu.page.getHeight */

/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: ui/behavior/draggable.js
 * author: berg
 * version: 1.0.0
 * date: 2010/09/16
 */





/* IGNORE API: baidu.dom.drag */

/* IGNORE API: baidu.dom.getStyle */


/**
 * 为ui控件添加拖拽行为
 */
(function(){
    var Draggable = baidu.ui.behavior.draggable = function(){
        this.addEventListener("onload", function(){
            var me = this;
            me.dragUpdate();
        });
        this.addEventListener("ondispose", function(){
            var me  = this;
            baidu.un(me._dragOption.handler, "mousedown", me._dragFn);
            me._dragOption.handler = me.dragHandler = me._lastDragHandler = null;
        });
    };
    /**
     * 更新拖拽行为
     * @param {object} options 拖拽行为的选项，支持:
     * dragRange : 拖拽的范围
     * dragHandler : 拖拽手柄
     */
    Draggable.dragUpdate = function(options){
        var me = this;
        options = options || {};
        if(!me.draggable){
            return ;
        }
        //me.dragHandler != me._lastDragHandler,这个判断会造成当调用两次dragUpdate更新range时上次的事件没有被注销
        if(me._lastDragHandler && me._dragFn){
            baidu.event.un(me._lastDragHandler, "onmousedown", me._dragFn); //把上次的拖拽事件取消掉
        }
        baidu.object.extend(me, options);
        me._dragOption = {
            ondragstart : function(){
                me.dispatchEvent("ondragstart");
            },  
            ondrag : function(){
                me.dispatchEvent("ondrag");
            },
            ondragend : function(){
                me.dispatchEvent("ondragend");
            },
            autoStop : true
        };

        me._dragOption.range = me.dragRange || [];
        me._dragOption.handler = me._lastDragHandler = me.dragHandler || me.getMain();

        if (me._dragOption.handler) {
            baidu.event.on(me._dragOption.handler, "onmousedown", me._dragFn = function() {
                baidu.dom.drag(me.dragTarget || me.getMain(), me._dragOption);
            });
        }
    };
})();


/**
 * 为Dialog添加拖拽功能
 * @name baidu.ui.Dialog.Dialog$draggable
 * @addon baidu.ui.Dialog
 * @param {Boolean} draggable 是否启用draggable，默认为true
 * */
baidu.ui.Dialog.prototype.draggable = true;

baidu.ui.Dialog.register(function(me){
    if(me.draggable){
        /**
         * 更新拖拽的范围，通过调用draggable行为中提供的dragUpdate实现
         * @private
         * @return void
         */
        function updateDragRange(){
            me.dragRange = [0,baidu.page.getWidth(),baidu.page.getHeight(),0];
            me.dragUpdate();
        };

        me.addEventListener("onload", function(){
            me.dragHandler = me.dragHandler || me.getTitle();

            //默认的拖拽范围是在窗口内
            if(!me.dragRange){
                updateDragRange();

                //如果用户窗口改变，拖拽的范围也要跟着变
                me.on(window, "resize", updateDragRange);
            }else{
                me.dragUpdate();
            }
        });

        me.addEventListener("ondragend", function(){
            me.left = baidu.dom.getStyle(me.getMain(), "left");
            me.top = baidu.dom.getStyle(me.getMain(), "top");
        });
    }
});

/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.dom.setStyles */

/* IGNORE API: baidu.object.extend */


/**
 * 创建一个content是iframe的dialog
 * @name baidu.ui.Dialog.Dialog$iframe
 * @addon baidu.ui.Dialog
 */
baidu.ui.Dialog.register(function(me){
    if(me.type == "iframe"){
        baidu.extend(me,{
            autoRender : true,
            tplIframe: "<iframe width='100%' height='97%' frameborder='0' scrolling='no' name='#{name}' id='#{id}' class='#{class}'></iframe>",

            /**
             * 获取iframe
			 * @name baidu.ui.Dialog.Dialog$iframe.getIframe
			 * @addon baidu.ui.Dialog.Dialog$iframe
			 * @function 
             * @return {HTMLElement} iframe
             */
            getIframe: function(){
                return baidu.g(this.getId('iframe'));
            },

            /**
             * 更新iframe的Style，更新dialog
			 * @name baidu.ui.Dialog.Dialog$iframe.updateIframe
			 * @addon baidu.ui.Dialog.Dialog$iframe
			 * @function 
             * @param {Object} styles 样式名称和值组成的对象，例如{width:"500px",height:"300px"}
             * @return {Null}
             */
            updateIframe:function(styles){
                baidu.setStyles(this.getId('iframe'), styles);
                me._updatePosition();
                me.dispatchEvent('onupdate');
            }
        });
        
        var contentText,
            iframeId = me.getId('iframe'),
            iframeName = me.iframeName || iframeId,
            iframeElement,
            contentWindow,
            contentText = baidu.format(me.tplIframe,{
                name: iframeName,
                id: iframeId,
                'class': me.getClass('iframe')
            });

        me.addEventListener("onload",function(){
            me._update({contentText:contentText});
            me._updatePosition();
            iframeElement = baidu.g(iframeId);
    
            //解决iframe加载后无法准确定位dialog的问题
            me.on(iframeElement, 'onload', function() {
                me._updatePosition();
                me.dispatchEvent('onupdate');
            });
            iframeElement.src = me.iframeSrc;
        });  
    }
});

/* IGNORE API: baidu.lang.instance */

/* IGNORE API: baidu.object.each */

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */

/**
 * 键盘支持模块，支持esc关闭最上层的dialog，enter确认alert和confirm
 * @name baidu.ui.Dialog.Dialog$keyboard
 * @addon baidu.ui.Dialog
 */
baidu.extend(baidu.ui.Dialog.prototype,{
    enableKeyboard : true,
    closeOnEscape : true
});
baidu.ui.Dialog.register(function(me){

    baidu.ui.Dialog.keyboardHandler = baidu.ui.Dialog.keyboardHandler || function(e){
        e = window.event || e;
        var keyCode = e.keyCode || e.which, onTop, eachDialog;
        
        //所有操作针对zIndex最大的dialog
        baidu.object.each(baidu.ui.Dialog.instances, function(item, key){
            if(item == "show"){
                eachDialog = baidu.lang.instance(key);
                if(!onTop || eachDialog.zIndex > onTop.zIndex){
                    onTop = eachDialog;
                }
            }
        });
        if(onTop){
            switch (keyCode){
                //esc按键触发
                case 27:
                    onTop.closeOnEscape && onTop.close();
                    break;
                //回车键触发
                case 13:
                    onTop.dispatchEvent("onenter");
                    break;
                default:
            }
        }
    };

    if(me.enableKeyboard && !baidu.ui.Dialog.keyboardEventReady){
        baidu.on(document, "keyup", baidu.ui.Dialog.keyboardHandler);
        baidu.ui.Dialog.keyboardEventReady = true;
    }
    
    //如果一个instance都没有了，才把事件删除
    me.addEventListener("ondispose", function(){
        var noInstance = true;
        baidu.object.each(baidu.ui.Dialog.instances, function(item, key){
            noInstance = false;
            return false;
        });        
        if(noInstance){
            baidu.event.un(document, "keyup", baidu.ui.Dialog.keyboardHandler);
            baidu.ui.Dialog.keyboardEventReady = false;
        }
    });
});

/* IGNORE API: baidu.dom.setAttr */

/* IGNORE API: baidu.dom.setStyles */

/* IGNORE API: baidu.dom._styleFilter.px */

/* IGNORE API: baidu.dom._styleFixer.opacity */


/* IGNORE API: baidu.string.format */


/* IGNORE API: baidu.browser.ie */

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */

/* IGNORE API: baidu.page.getScrollLeft */

/* IGNORE API: baidu.page.getScrollTop */

/* IGNORE API: baidu.lang.isNumber */

/* IGNORE API: baidu.object.each */

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.array.each */


/* IGNORE API: baidu.dom.getAttr */

/* IGNORE API: baidu.dom.getAncestorBy */

/* IGNORE API: baidu.dom.getStyle */

/* IGNORE API: baidu.dom.getPosition */

/* IGNORE API: baidu.dom.children */

/* IGNORE API: baidu.dom.fixable */

/* IGNORE API: baidu.browser.ie */


/* IGNORE API: baidu.lang.instance */


/* IGNORE API: baidu.page.getViewWidth */

/* IGNORE API: baidu.page.getViewHeight */

//添加对flash的隐藏和显示
//在webkit中，使用iframe加div的方式遮罩wmode为window的flash会时性能下降到无法忍受的地步
//在Gecko中，使用透明的iframe无法遮住wmode为window的flash
//在其余浏览器引擎中wmode为window的flash会被遮罩，处于不可见状态
//因此，直接将wmode为window的flash隐藏，保证页面最小限度的修改


/**
 * 为控件增加遮罩.
 * @class Modal类
 * @grammar new baidu.ui.Modal()
 * @plugin coverable 支持背景遮罩
 */
baidu.ui.Modal = baidu.ui.createUI(function(options) {
    var me = this,
        container = (options && options.container) ? baidu.g(options.container) : null;

    !container && (container = document.body);
    if (!container.id) {
        container.id = me.getId('container');
    }

    me.containerId = container.id;
    me.styles = {
        color: '#000000',
        opacity: 0.6,
        zIndex: 1000
    };
    
}).extend(
/**
 *  @lends baidu.ui.Modal.prototype
 */
{
    uiType: 'modal',
    _showing: false,

    /**
     * 获取modal的Container
     * @public
     * @return {HTMLElement} container.
     */
    getContainer: function() {
        var me = this;
        return baidu.g(me.containerId);
    },

    /**
     * 渲染遮罩层
     * @public
     * @return {NULL}
     * */
    render: function() {
        var me = this,
            modalInstance,
            fixableInstance,
            style,
            main,
            id = me.containerId,
            container = baidu.g(me.containerId);

        //当该container中已经存在modal时
        //将所需参数付给当前的modalInstance
        if (modalInstance = baidu.ui.Modal.collection[id]) {
            me.mainId = modalInstance.mainId;
            main = me.getMain();
        }else {
            //如果不存在modal,则创建新的modal
            main = me.renderMain();
            if (container !== document.body) {
                container.appendChild(main);
            }else{
                fixableInstance = baidu.dom.fixable(main, {
                    autofix: false,
                    vertival: 'top',
                    horizontal: 'left',
                    offset: {x:0, y:0}
                });
            }
            //将参数写入
            baidu.ui.Modal.collection[id] = {
                mainId: me.mainId,
                instance: [],
                flash:{},
                fixableInstance: fixableInstance
            };
        }

        me.dispatchEvent('onload');
    },

    /**
     * 显示遮罩层
     * @public
     * @param  {Object} options     显示选项,任何合法的style属性.
     * @return {NULL}
     */
    show: function(options) {
        var me = this,
            container = me.getContainer(),
            main = me.getMain(),
            containerId = me.containerId,
            modalInstanceOptions = baidu.ui.Modal.collection[containerId],
            fixableInstance = modalInstanceOptions.fixableInstance,
            length = modalInstanceOptions.instance.length,
            lastTop;

        if (me._showing)
            return;

        if (length > 0) {
            lastTop = baidu.lang.instance(modalInstanceOptions.instance[length - 1]);
            lastTop && lastTop._removeHandler();
        }
        options = options || {};
        me._show(options.styles || {});
        if(fixableInstance)
            fixableInstance.render();
        main.style.display = 'block';
      
        //将在此层中隐藏flash入库
        modalInstanceOptions.flash[me.guid] = me._hideFlash();
    
        //将自己的guid加在guid最后
        modalInstanceOptions.instance.push(me.guid);
        me._showing = true;

        me.dispatchEvent('onshow');
    },

    /**
     * 更新遮罩层，绑定window.resize & window.scroll
     * @private
     * @param {Object} styles
     * @return {NULL}
     */
    _show: function(styles) {
        var me = this;

        me._getModalStyles(styles || {});
        me._update();

        if(me.getContainer() === document.body && baidu.browser.ie && baidu.browser.ie <= 7){
            me.windowHandler = me.getWindowHandle();
            baidu.on(window, 'resize', me.windowHandler);
        }
    },

    /**
     * 隐藏遮罩层
     * @public
     * @return {NULL}
     */
    hide: function() {
        var me = this;
        me._hide(); 
        me.dispatchEvent('onhide');
    },

    _hide: function(){
        var me = this,
            containerId = me.containerId,
            modalInstanceOptions = baidu.ui.Modal.collection[containerId],
            flash = modalInstanceOptions.flash[me.guid],
            main = me.getMain(),
            length = modalInstanceOptions.instance.length,
            lastTop;

         if (!me._showing)
             return;

         for (var i = 0; i < length; i++) {
             if (modalInstanceOptions.instance[i] == me.guid) {
                 modalInstanceOptions.instance.splice(i, 1);
                 break;
             }
         }
         length = modalInstanceOptions.instance.length;
         if (i == length) {
             me._removeHandler();
             if (length > 0) {
                 lastTop = baidu.lang.instance(modalInstanceOptions.instance[length - 1]);
                 lastTop && lastTop._show();
             }else {
                 main.style.display = 'none';
             }

             me._restoreFlash(flash);
         }else{
             //如果不是最后一个，就将该层对应的flash移动到下一层的数组中
             lastTop = baidu.lang.instance(modalInstanceOptions.instance[length - 1]);
             modalInstanceOptions.flash[lastTop.guid] = modalInstanceOptions.flash[lastTop.guid].concat(flash);
         }

         modalInstanceOptions.flash[me.guid] = []; 
         me._showing = false;
    },


    /**
     * 接触window.resize和window.scroll上的事件绑定
     * @private
     * @return {NULL}
     */
    _removeHandler: function() {
        var me = this;
        if(me.getContainer() === document.body && baidu.browser.ie && baidu.browser.ie <= 7){
            baidu.un(window, 'resize', me.windowHandler);
        }
    },

    /**
     * window.resize & window.scroll 事件调用的function
     * @public
     * @return {NULL}
     */
    getWindowHandle: function() {
        var me = this,
            main = me.getMain();

        return function() {
            baidu.setStyles(main, {
                width: baidu.page.getViewWidth(),
                height: baidu.page.getViewHeight()
            });
            
            if(me.getContainer() === document.body && baidu.browser.ie && baidu.browser.ie <= 7){
                //iframe 补丁
                window.top !== window.self && setTimeout(function(){
                    me._getModalStyles({});
                    me._update();
                },16);
            }
         };
    },

    /**
     * 更新遮罩层
     * @public
     * @param  {Object} options 显示选项，同show.
     * @return {NULL}
     */
    update: function(options) {
        options = options || {};
        var me = this,
            main = me.getMain(),
            modalInstanceOptions = baidu.ui.Modal.collection[me.containerId];

        options = options || {};
        baidu.extend(me, options);

        me._getModalStyles(options.styles || {});
        me._update();
        delete(options.styles);
        baidu.extend(me, options);

        me.dispatchEvent('onupdate');
    },

    /**
     * 更新样式
     * @private
     * @return {NULL}
     */
    _update: function() {
        var me = this, main = me.getMain();
        baidu.dom.setStyles(main, me.styles);
    },

    /**
     * 获取遮罩层相对container左上角的top和left
     * @private
     * @options {object} show传入的styles
     * @return {NULL}
     */
    _getModalStyles: function(styles) {
        var me = this,
            main = me.getMain(),
            container = me.getContainer(),
            offsetParentPosition,
            parentPosition, offsetParent;

        function getStyleNum(d,style) {
            var result = parseInt(baidu.getStyle(d, style));
            result = isNaN(result) ? 0 : result;
            result = baidu.lang.isNumber(result) ? result : 0;
            return result;
        }

        if (container !== document.body) {
            styles['width'] = container.offsetWidth;
            styles['height'] = container.offsetHeight;

            if (baidu.getStyle(container, 'position') == 'static') {
                offsetParent = main.offsetParent || document.body;
                offsetParentPosition = baidu.dom.getPosition(offsetParent);
                parentPosition = baidu.dom.getPosition(container);
                styles['top'] = parentPosition.top - offsetParentPosition.top + getStyleNum(offsetParent, 'marginTop');
                styles['left'] = parentPosition.left - offsetParentPosition.left + getStyleNum(offsetParent, 'marginLeft');
            }
        }else {
     
            if ( baidu.browser.ie > 7 || !baidu.browser.ie) {
                styles['width'] = '100%';
                styles['height'] = '100%';
            }else {
                styles['width'] = baidu.page.getViewWidth();
                styles['height'] = baidu.page.getViewHeight();
            }
        }

        //更新styles
        baidu.extend(me.styles, styles);
        me.styles['backgroundColor'] = me.styles['color'] || me.styles['backgroundColor'];
        delete(me.styles['color']);
    },

    /**
     * 隐藏flash
     * @private
     * @return {Null}
     */
    _hideFlash: function(){
        var me = this,
            container = me.getContainer(),
            elements = container.getElementsByTagName('object'),
            result = [];

        //只隐藏wmode = window的flash
        baidu.each(elements, function(item){
            var isWinMode = true;
            
            if(baidu.dom.getAncestorBy(item,function(element){
                if(baidu.getStyle(element, 'zIndex') > me.styles.zIndex){
                    return true;
                }
                
                return false;
            })){
                return;
            }

            baidu.each(baidu.dom.children(item), function(param){
                if(baidu.getAttr(param, 'name') == 'wmode' && baidu.getAttr(param, 'value') != 'window'){
                    isWinMode = false;
                }
            });

            if(isWinMode){
                result.push([item,baidu.getStyle(item, 'visibility')]);
                item.style.visibility = 'hidden';
            }
        });

        return result;
    },

    /**
     * 还原flash
     * @private
     * @return {Null}
     */
    _restoreFlash: function(flash){
        baidu.each(flash, function(item){
            if(item[0] != null){
                item[0].style.visibility = item[1];
            }
        });  
    },

    /**
     * 销毁
     * @public
     * @return {Null}
     */
    dispose: function(){
        var me = this;
        
        me._hide();
        me.dispatchEvent('ondispose');
        baidu.lang.Class.prototype.dispose.call(me);
    }
});

//存储所有的modal参数
baidu.ui.Modal.collection = {};

/* IGNORE API: baidu.browser.isWebkit */

/* IGNORE API: baidu.browser.isGecko */

/* IGNORE API: baidu.lang.Class.$addEventListeners */
/**
 * 支持背景遮罩掩盖select、flash、iframe元素
 * @name baidu.ui.Modal.Modal$coverable
 * @addon baidu.ui.Modal
 */
baidu.extend(baidu.ui.Modal.prototype,{
    coverable: true,
    coverableOptions: {}
});

baidu.ui.Modal.register(function(me){

    if(me.coverable){

        if(!baidu.browser.isWebkit && !baidu.browser.isGecko){
            me.addEventListener("onload", function(){
                me.Coverable_show();
            });

            me.addEventListeners("onshow,onupdate",function(){
                me.Coverable_update();
            });

            me.addEventListener("onhide", function(){
                me.Coverable_hide();
            })
        }
    }
});

/**
 *支持遮罩
 * @name baidu.ui.Dialog.Dialog$modal
 * @addon baidu.ui.Dialog
 */
baidu.extend(baidu.ui.Dialog.prototype, {
    modal : true,
    modalColor : "#000000",
    modalOpacity : 0.4,
    hideModal : function(){
        var me = this;
        (me.modal && me.modalInstance) && me.modalInstance.hide();
    }
});
baidu.ui.Dialog.register(function(me){
    if(me.modal){
        me.addEventListener("onopen", function(){
            //防止一个dialog创建两个modal
            if(!me.modalInstance){
                me.modalInstance = new baidu.ui.Modal({autoRender:true});
            }

            me.modalInstance.show({
                targetUI    : me,
                styles:{
                    color       : me.modalColor,
                    opacity     : me.modalOpacity,
                    zIndex      : me.modalZIndex ? me.modalZIndex : me.zIndex - 1
                }
            });
        });

        me.addEventListener("onclose", me.hideModal);
        me.addEventListener("ondispose", me.hideModal);
    }
});

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */
/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/* IGNORE API: baidu.dom.resizable */

/**
 * 为ui控件提供resize的行为
 */
(function() {
    var Resizable = baidu.ui.behavior.resizable = function() {};

    Resizable.resizeableHandle = null;
    
    /**
     * 更新reiszable设置
     * 创建resize handle
     * @param {Object} options
     * @see baidu.dom.resizable
     * @return baidu.dom.resizable
     */
    Resizable.resizeCreate = function(options) {
        var me = this, target;
        options = options || {};
        if (!me.resizable) {
            return;
        }

        baidu.object.extend(me, options);
        me._resizeOption = {
            onresizestart: function() {
                me.dispatchEvent('onresizestart');
            },
            onresize: function(styles) {
                me.dispatchEvent('onresize', styles);
            },
            onresizeend: function() {
                me.dispatchEvent('onresizeend');
            }
        };
        baidu.each(['minWidth', 'minHeight', 'maxWidth', 'maxHeight'], function(item,index) {
            me[item] && (me._resizeOption[item] = me[item]);
        });

        me._resizeOption.classPrefix = options.classPrefix || me.classPrefix;
        target = options.target || me.getBody();
        me.direction && (me._resizeOption.direction = me.direction);
        me.resizeableHandle = baidu.dom.resizable(target, me._resizeOption);
    };

    /**
     * 更新resizeable handle
     * @public
     * @param {Object} options
     * @return null
     */
    Resizable.resizeUpdate = function(options){
        this.resizeableHandle.update(options); 
    };

    /**
     * 取消resizeable功能
     * @public
     * @return null
     */
    Resizable.resizeCancel = function(){
        this.resizeableHandle.cancel();
    };

    /**
     * 激活resizeable
     * @public 
     * @return null
     */
    Resizable.resizeEnable = function(){
        this.resizeableHandle.enable();
    };
})();


/**
 * 为Dialog添加缩放功能
 * @name baidu.ui.Dialog.Dialog$resizable
 * @addon baidu.ui.Dialog
 * @param {Number} minWidth 可选，最小宽度.
 * @param {Number} minHeight 可选，最小高度.
 * @param {Boolean} resizable 可选，是否启用resizable.
 * @param {Array} direction 可选，允许resize的方向，默认为["s","e","se"]3方向
 */
baidu.extend(baidu.ui.Dialog.prototype, {
    resizable: true,
    minWidth: 100,
    minHeight: 100,
    direction: ['s', 'e', 'se']
});
baidu.ui.Dialog.register(function(me) {
    if (me.resizable) {
        var body,
            content,
            main,
            contentWidth, contentHeight,
            bodyWidth,bodyHeight;

        function getValue(){
            bodyWidth = body.offsetWidth;
            bodyHeight = body.offsetHeight;

            contentWidth = content.offsetWidth;
            contentHeight = content.offsetHeight;
        }

        /**
         * 注册onload事件
         * 创建resizeable handle
         */
        me.addEventListener('onload', function() {
            body = me.getBody();
            main = me.getMain();
            content = me.getContent();
            getValue();

            me.resizeCreate({target: main, classPrefix: me.classPrefix});
        });

        /**
         * 注册onresize事件
         * 当事件触发时设置content和body的OuterSize
         */
        me.addEventListener('onresize', function(styles) {
            baidu.dom.setOuterWidth(content, contentWidth + styles.current.width - styles.original.width);
            baidu.dom.setOuterHeight(content, contentHeight + styles.current.height - styles.original.height);
            
            baidu.dom.setOuterWidth(body, bodyWidth + styles.current.width - styles.original.width);
            baidu.dom.setOuterHeight(body, bodyHeight + styles.current.height - styles.original.height);
            
            me.coverable && me.Coverable_update();
        });

        /**
         * 注册onresizeend事件
         * 当事件触发时设置变量值
         */
        me.addEventListener('onresizeend', function() {
            getValue();
            me.width = contentWidth;
            me.height = contentHeight;

            baidu.setStyles(main,{height:"",width:""});
        });

        /**
         * 注册onupdate事件
         * 当事件触发时更新resizeHandle
         */
        me.addEventListener('onupdate',function() {
            getValue();
            me.resizeUpdate();
        });

        /**
         * 注册onopen事件
         * 当事件触发时更新resizeHandle
         */
        me.addEventListener('onopen',function() {
            getValue();
            me.resizeUpdate();
        });
    }
});


/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */

/* IGNORE API: baidu.event.get */

/* IGNORE API: baidu.object.each */

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.lang.Class.$removeEventListener */

 /**
 * 生成分页功能，默认会有一个横向的页面跳转链接列表，其两端有首页，尾页，上一页，下一页。若要自定义样式（如隐藏某些部件），请使用css（注：控件中各部件的css类名都有控件的tangram类名前缀）首页：first，尾页：last，上一页：previous，下一页：next，当前页：current。若要自定义控件生成的HTML，请参考源代码中以tpl开头的模板属性，类中的属性和方法都可以通过options动态覆盖。
 * @class
 * @grammar new baidu.ui.Pager(option)
 * @param     {Object}            [options]         更新选项，若选项值不符合规则，则此次更新不予更新任何选项
 * @config    {Number}            beginPage         页码范围：起始页码，默认值1。
 * @config    {Number}            endPage           页码范围：最后页码，大于或者等于起始页码，默认值100。
 * @config    {Number}            currentPage       必须在页码范围内，若未指定currentPage且当前页码已超出页码范围，则会自动将currentPage更新到beginPage。
 * @config    {Number}            itemCount         默认显示多少个页面的链接（不包括“首页”等特殊链接），默认值10。
 * @config    {Number}            leftItemCount     当前页面链接在页面链接列表中的默认位置，必须小于itemCount，默认值4。
 * @config    {Object}            specialLabelMap   设置首页，上一页，下一页链接显示的内容。默认为{first:'首页',next:'下一页',previous:'上一页'}
 * @config    {String}            tplHref           链接显示样式，默认为"##{page}"
 * @config    {String}            tplLabel          页码显示样式，默认为"[#{page}]"
 * @config    {String}            tplCurrentLabel   选中页码的显示样式
 */
baidu.ui.Pager = baidu.ui.createUI(function (options){
    this._init.apply(this, arguments);
}).extend(
    /**
     *  @lends baidu.ui.Pager.prototype
     */
{
    uiType: 'pager',
    id: 'pager',
    tplHref: '##{page}',
    tplLabel: '[#{page}]',
    specialLabelMap: {
        'first': '首页',
        'last': '尾页',
        'previous': '上一页',
        'next': '下一页'
    },
    tplCurrentLabel: '#{page}',
    tplItem: '<a class="#{class}" page="#{page}" target="_self" href="#{href}">#{label}</a>',
    //FIXME: 用#{onclick}形式绑定事件
    //#{onclick} {onclick: me.getCallRef() + ""}
    tplBody: '<div onclick="#{onclick}" id="#{id}" class="#{class}">#{items}</div>',
    beginPage: 1,
    endPage: 100,
    //当前页面
    //currentPage: undefined,
    itemCount: 10,
    leftItemCount: 4,
    /**
     * 初始化函数
     * @param options
     * @see baidu.ui.pager.Pager#update
     */
    _init: function (options){
        var me = this;
        me.update();
    },
    // 特殊链接请使用css控制隐藏和样式
    /**
     * 更新设置
	 * @public 
     * @param      {Object}     options          更新设置
     * @config     {Number}     beginPage        开始页
     * @config     {Number}     endPage          结束页
     * @config     {Number}     currentPage      跳转目标页的索引
     * @config     {Number}     itemCount        默认列出多少个a标签
     * @config     {Function}   leftItemCount    当前页的显示位置, 有默认实现
     */
    update: function (options){
        var me = this;
        options = options || {};
        if (me.checkOptions(options)) {
            //如果用户修改currentPage，则触发gotoPage事件. 如果事件处理函数取消了跳转，则不更新currentPage;
            if (options.hasOwnProperty('currentPage') && options.currentPage != me.currentPage) {
                if (!me._notifyGotoPage(options.currentPage, false)) {
                    delete options.currentPage;
                }
            }
            me._updateNoCheck(options);
            return true;
        }
        return false;
    },
    _updateNoCheck: function (options){
        var me = this;
        baidu.object.extend(me, options);
        if (me.getMain()) {
            me._refresh();
        }
    },
    /**
     * 检查参数是否出错
     * @private
     * @param {Object} options
     */
    checkOptions: function (options){
        var me = this;
        var begin = options.beginPage || me.beginPage;
        var end = options.endPage || me.endPage;
        // TODO: trace信息
        if (end <= begin) {
            return false;
        }
        // TODO: 不应该放在这里
        if (options.hasOwnProperty('beginPage') && me.currentPage < begin) {
            me.currentPage = begin;
        }
        if (options.hasOwnProperty('endPage') && me.currentPage >= end) {
            me.currentPage = end - 1;
        }

        var current = options.currentPage || me.currentPage;
        if (current < begin || current >= end){
            return false;
        }
        return true;
    },
    /**
     * 构造链接的HTML
     * @private
     * @param page {Number}
     * @param [spec] {String} first|last...
     * @private
     */
    _genItem: function (page, spec){
        var me = this;
        return baidu.string.format(me.tplItem, {
            "class": spec ? me.getClass(spec) : '',
            page: page,
            href: baidu.string.format(me.tplHref, {
                page: page
            }),
            label: function (){
                return ( spec
                  ? (spec == "current"
                       ? baidu.string.format(me.tplCurrentLabel, { page: page })
                       : me.specialLabelMap[spec]
                     )
                  : baidu.string.format(me.tplLabel, { page: page }) );
            }
        });
    },
    /**
     * @private
     */
    _genBody: function (){
        var me = this,
            begin = me.beginPage,
            end = me.endPage,
            current = me.currentPage,
            numlist = Math.min( Math.max(end - begin + 1, 1), me.itemCount),  // 处理范围小于显示数量的情况
            leftcnt = Math.min(current - begin, me.leftItemCount), // 处理当前页面在范围的两端的情况
            leftcnt = Math.max(numlist - (end + 1 - current), leftcnt),
            startPage = current - leftcnt,
            pageMap = {
                first: begin,
                last: end,
                previous: current - 1,
                next: current + 1
            }, // 生成特殊链接
            spec = {};

        baidu.object.each(pageMap, function (s, k){
            spec[k] = me._genItem(s, k);
        });

        spec.previous = pageMap.previous < begin ? '' : spec.previous;
        spec.next = pageMap.next > end ? '' : spec.next;
        spec.first = startPage == begin ? '' : spec.first;
        spec.last = startPage + numlist > end ? '' : spec.last;
        // 生成常规链接
        var buff = [];
        for (var i=0; i<numlist; i++) {
            var page = startPage + i;
            buff[i] = me._genItem(page, page == current ? "current" : null);
        }
        return baidu.string.format(me.tplBody, {
            id: me.getId(),
            "class": me.getClass(),
            items: spec.first + spec.previous + buff.join('') + spec.next + spec.last,
            onclick: me.getCallRef() + "._handleOnClick(event, this);"
        });
    },
    /**
     * 刷新界面
     * @private
     */
    _refresh: function (){
        var me = this;
        me.getMain().innerHTML = me.getString();
    },
    /**
     * 鼠标点击链接事件
     * @private
     * @param evt
     */
    _handleOnClick: function (evt){
        evt = baidu.event.get(evt);
        var me = this,
            el = evt.target,
            page = Number(el.getAttribute('page'));
        // IE6 doesnot support Element#hasAttribute.
        // 无需checkOptions检查，因为能点到页码的都是正常值
        if (page && me._notifyGotoPage(page, true)) {
            me._updateNoCheck({ currentPage: page });
        } else {
            evt.preventDefault();
        }
    },
    _notifyGotoPage: function (page, fromClick){
        return this.dispatchEvent('ongotopage', { page: page, fromClick: fromClick });
    },
    /**
     * 跳转页面事件  参数evt.page 可以使用evt.returnValue = false来取消跳转
     * @private
     * @param evt {Object} 将要跳转到的页面的索引
     * @event
     */
    ongotopage: function (evt){
        //evt.returnValue = false;
    },
    /**
     * 获取用于生成控件的HTML
     * @private
     */
    getString: function (){
        var me = this;
        if (me.currentPage === undefined) {
            me.currentPage = me.beginPage;
        }
        return me._genBody();
    },
    /**
     * 将控件渲染到目标元素
     * @public
     * @param    {String|HTMLElement}    container     目标元素或元素id
     */
    render: function (container){
        var me = this;
        me.renderMain(container);
        me.getMain().innerHTML = me.getString();
        me.update();
        me.dispatchEvent('onload');
    },
    /**
     * 销毁控件
	 * @public
     */
    dispose: function (){
        var me = this;
        me.dispatchEvent('ondispose');
        if (me.getMain()) {
            var main = me.getMain();
            baidu.event.un(main, 'click', me._handleOnClick);
            if (main.parentNode && main.parentNode.nodeType == 1) {
                main.parentNode.removeChild(main);
            }
            me.dispose = null;
            main = null;
            baidu.lang.Class.prototype.dispose.call(me);
        } else {
            me.addEventListener('onload', function callee(){
                me.removeEventListener('onload', callee);
                me.dispose();
            });
        }
    }
});

/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.dom.getPosition */

/* IGNORE API: baidu.dom.remove */

/* IGNORE API: baidu.dom.addClass */

/* IGNORE API: baidu.dom.removeClass */

/* IGNORE API: baidu.dom.hasClass */


/* IGNORE API: baidu.event.stop */

/* IGNORE API: baidu.event.preventDefault */


/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.array.contains */

/* IGNORE API: baidu.array.indexOf */


/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.browser.ie */


/* IGNORE API: baidu.lang.Event */




/* IGNORE API: baidu.lang.isString */

/* IGNORE API: baidu.lang.instance */

/* IGNORE API: baidu.dom.getAttr */
//

/**
 * 获取元素所在的控件
 * @function
 * @grammar baidu.ui.get(element)
 * @param {HTMLElement|string} 要查找的元素，如果是字符串，则查找这个guid为此字符串的控件
 * @param {string} optional  type 匹配查找指定类型的控件【暂未支持】
 * @return {object} ui控件
 */
baidu.ui.get = function(element/*, type*/){
    var buid;

    //如果是string，则按照guid来找
    if(baidu.lang.isString(element)){
        return baidu.lang.instance(element);
    }else{
        /*
         *type = type.toLowerCase();
         */
        do{
            //如果元素是document
        	//加上了!element判断,防止游离节点的父节点为null的情况  rocy@2010-08-05
            if(!element || element.nodeType == 9){
                return null;
            }
            if(buid = baidu.dom.getAttr(element, "data-guid")){
                     return baidu.lang.instance(buid);
                /*
                 *if( !type || buid.toLowerCase().indexOf(type) === 0){
                 *    return baidu.lang.instance(buid);
                 *}
                 */
            }
        }while((element = element.parentNode) != document.body)
    }
};


/**
 * Suggestion基类，建立一个Suggestion实例
 * @class
 * @grammar new baidu.ui.Suggestion(options)
 * @param  {Object}   [options]        选项.
 * @config {Function} onshow           当显示时触发。
 * @config {Function} onhide           当隐藏时触发，input或者整个window失去焦点，或者confirm以后会自动隐藏。
 * @config {Function} onconfirm        当确认条目时触发，回车后，或者在条目上按鼠标会触发确认操作。参数是event对象，其中有data属性，包括item和index值。item为当前确认的条目，index是条目索引。。
 * @config {Function} onbeforepick     使用方向键选中某一行，鼠标点击前触发。
 * @config {Function} onpick           使用方向键选中某一行，鼠标点击时触发。参数是event对象，其中有data属性，包括item和index值。item为当前确认的条目，index是条目索引。
 * @config {Function} onhighlight      当高亮时触发，使用方向键移过某一行，使用鼠标滑过某一行时会触发高亮。参数是event对象，其中有data属性，包括item和index值。item为当前确认的条目，index是条目索引。
 * @config {Function} onload
 * @config {Function} onmouseoveritem
 * @config {Function} onmouseoutitem
 * @config {Function} onmousedownitem
 * @config {Function} onitemclick
 * @config {Function} view             重新定位时，会调用这个方法来获取新的位置，传入的参数中会包括top、 left、width三个值。
 * @config {Function} getData          在需要获取数据的时候会调用此函数来获取数据，传入的参数word是用户在input中输入的数据。
 * @config {String}   prependHTML      写在下拉框列表前面的html
 * @config {String}   appendHTML       写在下拉框列表后面的html
 * @config {Boolean}  holdHighLight    鼠标移出待选项区域后，是否保持高亮元素的状态
 * @plugin coverable  支持背景遮罩
 * @plugin data		  提供数据内存缓存
 * @plugin fixWidth	  提供位置校准功能
 * @plugin input	  支持快捷键操作
 */
baidu.ui.Suggestion = baidu.ui.createUI(function(options) {
    var me = this;

    me.addEventListener('onload', function() {
        //监听suggestion外面的鼠标点击
        me.on(document, 'mousedown', me.documentMousedownHandler);

        //窗口失去焦点就hide
        me.on(window, 'blur', me.windowBlurHandler);
    });

    //初始化dom事件函数
    me.documentMousedownHandler = me._getDocumentMousedownHandler();
    me.windowBlurHandler = me._getWindowBlurHandler();

    //value为在data中的value
    me.enableIndex = [];
    //这个index指的是当前高亮条目在enableIndex中的index而非真正在data中的index
    me.currentIndex = -1;

}).extend(
/**
 *  @lends baidu.ui.Suggestion.prototype
 */
{
    uiType: 'suggestion',
    onbeforepick: new Function,
    onpick: new Function,
    onconfirm: new Function,
    onhighlight: new Function,
    onshow: new Function,
    onhide: new Function,

    /**
     * @private
     */
    getData: function() {return []},
    prependHTML: '',
    appendHTML: '',

    currentData: {},

    tplDOM: "<div id='#{0}' class='#{1}' style='position:relative; top:0px; left:0px'></div>",
    tplPrependAppend: "<div id='#{0}' class='#{1}'>#{2}</div>",
    tplBody: '<table cellspacing="0" cellpadding="2"><tbody>#{0}</tbody></table>',
    tplRow: '<tr><td id="#{0}" onmouseover="#{2}" onmouseout="#{3}" onmousedown="#{4}" onclick="#{5}" class="#{6}">#{1}</td></tr>',

    /**
     * 获得suggestion的外框HTML string
     * @private
     * @return {String}
     */
    getString: function() {
        var me = this;
        return baidu.format(
            me.tplDOM,
            me.getId(),
            me.getClass(),
            me.guid
        );
    },

    /**
     * 将suggestion渲染到dom树中
     * @public
     * @param {HTMLElement} target
     * @return {Null}
     */
    render: function(target) {
        var me = this,
            main,
            target = baidu.g(target);

        if (me.getMain() || !target) {
            return;
        }
        if (target.id) {
            me.targetId = target.id;
        }else {
            me.targetId = target.id = me.getId('input');
        }

        main = me.renderMain();

        main.style.display = 'none';
        main.innerHTML = me.getString();

        this.dispatchEvent('onload');
    },

    /**
     * 当前suggestion是否处于显示状态
     * @private
     * @return {Boolean}
     */
    _isShowing: function() {
        var me = this,
            main = me.getMain();
        return main && main.style.display != 'none';
    },

    /**
     * 把某个词放到input框中
     * @public
     * @param {String} index 条目索引.
     * @return {Null}
     */
    pick: function(index) {
        var me = this,
            currentData = me.currentData,
            word = currentData && typeof index == 'number' && typeof currentData[index] != 'undefined' ? currentData[index].value : index,
            eventData = {
                data: {
                    item: word == index ? {value: index, content: index} : currentData[index],
                    index: index
                }
            };

        if (me.dispatchEvent('onbeforepick', eventData)) {
            me.dispatchEvent('onpick', eventData);
        }
    },

    /**
     * 绘制suggestion
     * @public
     * @param {String}  word 触发sug的字符串.
     * @param {Object}  data suggestion数据.
     * @param {Boolean} [showEmpty] 如果sug数据为空是否依然显示 默认为false.
     * @return {Null}
     */
    show: function(word, data, showEmpty) {
        var i = 0,
            len = data.length,
            me = this;

        me.enableIndex = [];
        me.currentIndex = -1;

        if (len == 0 && !showEmpty) {
            me.hide();
        } else {
            me.currentData = [];
            for (; i < len; i++) {
                if (typeof data[i].value != 'undefined') {
                    me.currentData.push(data[i]);
                }else {
                    me.currentData.push({
                        value: data[i],
                        content: data[i]
                    });
                }
                if (typeof data[i]['disable'] == 'undefined' || data[i]['disable'] == false) {
                    me.enableIndex.push(i);
                }
            }

            me.getBody().innerHTML = me._getBodyString();
            me.getMain().style.display = 'block';
            me.dispatchEvent('onshow');
        }
    },

    /**
     * 隐藏suggestion
     * @public
     * @return {Null}
     */
    hide: function() {
        var me = this;

        //如果已经是隐藏状态就不用派发后面的事件了
        if (!me._isShowing())
            return;
        
        //如果当前有选中的条目，将其放到input中
        if(me.currentIndex >= 0 && me.holdHighLight){
            var currentData = me.currentData,
                j = -1;
            for(var i=0, len=currentData.length; i<len; i++){
                if(typeof currentData[i].disable == 'undefined' || currentData[i].disable == false){
                    j++;
                    if(j == me.currentIndex)
                        me.pick(i);
                }
            }
        }
        
        me.getMain().style.display = 'none';
        me.dispatchEvent('onhide');
    },

    /**
     * 高亮某个条目
     * @public
     * @param {String} index 条目索引.
     * @return {Null}
     */
    highLight: function(index) {
        var me = this,
            enableIndex = me.enableIndex,
            item = null;

        //若需要高亮的item被设置了disable，则直接返回
        if (!me._isEnable(index)) return;

        me.currentIndex >= 0 && me._clearHighLight();
        item = me._getItem(index);
        baidu.addClass(item, me.getClass('current'));
        me.currentIndex = baidu.array.indexOf(enableIndex, index);

        me.dispatchEvent('onhighlight', {
            index: index,
            data: me.getDataByIndex(index)
        });
    },

    /**
     * 清除item高亮状态
     * @public
     * @return {Null}
     */
    clearHighLight: function() {
        var me = this,
            currentIndex = me.currentIndex,
            index = me.enableIndex[currentIndex];

        //若当前没有元素处于高亮状态，则不发出事件
        me._clearHighLight() && me.dispatchEvent('onclearhighlight', {
            index: index,
            data: me.getDataByIndex(index)
        });
    },

    /**
     * 清除suggestion中tr的背景样式
     * @private
     * @return {Boolean} bool 当前有item处于高亮状态并成功进行clear highlight,返回true，否则返回false.
     */
    _clearHighLight: function() {
        var me = this,
            currentIndex = me.currentIndex,
            enableIndex = me.enableIndex,
            item = null;

        if (currentIndex >= 0) {
            item = me._getItem(enableIndex[currentIndex]);
            baidu.removeClass(item, me.getClass('current'));
            me.currentIndex = -1;
            return true;
        }
        return false;
    },

    /**
     * confirm指定的条目
     * @public
     * @param {Number|String} index or item.
     * @param {String} source 事件来源.
     * @return {Null}
     */
    confirm: function(index, source) {
        var me = this;

        if (source != 'keyboard') {
            if (!me._isEnable(index)) return;
        }

        me.pick(index);
        me.dispatchEvent('onconfirm', {
            data: me.getDataByIndex(index) || index,
            source: source
        });
        me.currentIndex = -1;
        me.hide();
    },

    /**
     * 根据index拿到传给event的data数据
     * @private
     * @return {Object}
     * @config {HTMLElement} item
     * @config {Number} index
     */
    getDataByIndex: function(index) {

        return {
            item: this.currentData[index],
            index: index
        };
    },

    /**
     * 获得target的值
     * @public
     * @return {String}
     */
    getTargetValue: function() {
        return this.getTarget().value;
    },

    /**
     * 获得input框元素
     * @public
     * @return {HTMLElement}
     */
    getTarget: function() {
        return baidu.g(this.targetId);
    },

    /**
     * 获得指定的条目
     * @private
     * @return {HTMLElement}
     */
    _getItem: function(index) {
        return baidu.g(this.getId('item' + index));
    },

    /**
     * 渲染body部分的string
     * @private
     * @return {String}
     */
    _getBodyString: function() {

        var me = this,
            html = '',
            itemsHTML = [],
            data = me.currentData,
            len = data.length,
            i = 0;

        function getPrependAppend(name) {
            return baidu.format(
                me.tplPrependAppend,
                me.getId(name),
                me.getClass(name),
                me[name + 'HTML']
            );
        }


        html += getPrependAppend('prepend');

        for (; i < len; i++) {
            itemsHTML.push(baidu.format(
                me.tplRow,
                me.getId('item' + i),
                data[i].content,
                me.getCallRef() + '._itemOver(event, ' + i + ')',
                me.getCallRef() + '._itemOut(event, ' + i + ')',
                me.getCallRef() + '._itemDown(event, ' + i + ')',
                me.getCallRef() + '._itemClick(event, ' + i + ')',
                (typeof data[i]['disable'] == 'undefined' || data[i]['disable'] == false) ? '' : me.getClass('disable')
            ));
        }

        html += baidu.format(
            me.tplBody, 
            itemsHTML.join('')
        );
        html += getPrependAppend('append');
        return html;
    },

    /**
     * 当焦点通过鼠标或键盘移动到某个条目
     * @private
     * @param {Event} e
     * @param {Number} index
     * @return {Null}
     */
    _itemOver: function(e, index) {
        var me = this;
        baidu.event.stop(e || window.event);
        me._isEnable(index) && me.highLight(index);

        me.dispatchEvent('onmouseoveritem', {
            index: index,
            data: me.getDataByIndex(index)
        });
    },

    /**
     * 当焦点通过鼠标或键盘移出某个条目
     * @private
     * @param {Event} e
     * @param {Number} index
     * @return {Null}
     */
    _itemOut: function(e, index) {
        var me = this;
        baidu.event.stop(e || window.event);
        if(!me.holdHighLight)
            me._isEnable(index) && me.clearHighLight();

        me.dispatchEvent('onmouseoutitem', {
            index: index,
            data: me.getDataByIndex(index)
        });
    },

    /**
     * 当通过鼠标选中某个条目
     * @private
     * @param {Event} e
     * @param {Number} index
     * @return {Null}
     */
    _itemDown: function(e, index) {
        var me = this;
        baidu.event.stop(e || window.event);

        me.dispatchEvent('onmousedownitem', {
            index: index,
            data: me.getDataByIndex(index)
        });
    },

    /**
     * 当鼠标点击某个条目
     * @private
     * @param {Event} e
     * @param {Number} index
     * @return {Null}
     */
    _itemClick: function(e, index) {
        var me = this;
        baidu.event.stop(e || window.event);

        me.dispatchEvent('onitemclick', {
            index: index,
            data: me.getDataByIndex(index)
        });

        me._isEnable(index) && me.confirm(index, 'mouse');
    },

    /**
     * 判断item是否处于enable状态
     * @param {Number} index 索引，和传入的data中相同.
     * @return {Boolean}
     */
    _isEnable: function(index) {
        var me = this;
        return baidu.array.contains(me.enableIndex, index);
    },

    /**
     * 外部事件绑定
     * @private
     * @return {Function}
     */
    _getDocumentMousedownHandler: function() {
        var me = this;
        return function(e) {
            // todo : baidu.event.getTarget();
            e = e || window.event;
            var element = e.target || e.srcElement,
                ui = baidu.ui.get(element);
            //如果在target上面或者me内部
            if (element == me.getTarget() || (ui && ui.uiType == me.uiType)) {
                return;
            }
            me.hide();
        };
    },

    /**
     * 外部事件绑定
     * @private
     * @return {Function}
     */
    _getWindowBlurHandler: function() {
        var me = this;
        return function() {
            me.hide();
        };
    },

    /**
     * 销毁suggesiton
     * @public
     * @return {Null}
     */
    dispose: function() {
        var me = this;
        me.dispatchEvent('dispose');

        baidu.dom.remove(me.mainId);

        baidu.lang.Class.prototype.dispose.call(this);
    }
});

/* IGNORE API: baidu.dom.g */



/**
 * 支持背景遮罩掩盖select、flash、iframe元素
 * @name baidu.ui.Suggestion.Suggestion$coverable
 * @addon baidu.ui.Suggestion
 */
baidu.extend(baidu.ui.Suggestion.prototype, {
    coverable: true,
    coverableOptions: {}
});

baidu.ui.Suggestion.register(function(me) {

    if (me.coverable) {

        me.addEventListener('onshow', function() {
            me.Coverable_show();
        });

        me.addEventListener('onhide', function() {
            me.Coverable_hide();
        });
    }
});

/**
 * 为Suggestion提供数据内存缓存，可对其扩展做本地缓存
 * @name baidu.ui.Suggestion.Suggestion$data
 * @addon baidu.ui.Suggestion
 * @author berg
 */

baidu.ui.Suggestion.extend({
    /**
     * 设置一组数据给suggestion，调用者可以选择是否立即显示这组数据: noShow
	 * @name baidu.ui.Suggestion.Suggestion$data
	 * @addon baidu.ui.Suggestion
	 * @function
	 * @param  {String}  word     关键字
	 * @param  {Array}   data     数据数组，例如["aaa","bbb"]
	 * @param  {Boolean} noShow  为true则不立即显示这组数据
     * @return {null}
     */
    setData: function(word, data, noShow) {
        var me = this;
		me.dataCache[word] = data;
        if (!noShow) {
            me.show(word, me.dataCache[word]);
        }
    }
});

baidu.ui.Suggestion.register(function(me) {
    //初始化dataCache
    me.dataCache = {},
    /*
     * 获取一个词对应的me数据
     * 通过事件返回结果
     */
    me.addEventListener('onneeddata', function(ev, word) {
        var dataCache = me.dataCache;
        if (typeof dataCache[word] == 'undefined') {
            //没有数据就去取数据
            me.getData(word);
        }else {
            //有数据就直接显示
            me.show(word, dataCache[word]);
        }
    });
});

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.browser.ie */

/* IGNORE API: baidu.dom.getPosition */

/* IGNORE API: baidu.dom.getStyle */

/* IGNORE API: baidu.dom.setStyle */

/* IGNORE API: baidu.dom.setBorderBoxWidth */

/* IGNORE API: baidu.dom._styleFilter.px */

/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 */





/* IGNORE API: baidu.dom.getWindow */

/* IGNORE API: baidu.dom.getStyle */

/* IGNORE API: baidu.dom.getPosition */

/* IGNORE API: baidu.dom.setPosition */

/* IGNORE API: baidu.dom._styleFilter.px */



/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.page.getViewWidth */

/* IGNORE API: baidu.page.getViewHeight */

/* IGNORE API: baidu.page.getScrollTop */

/* IGNORE API: baidu.page.getScrollLeft */


/* IGNORE API: baidu.lang.isFunction */



/* IGNORE API: baidu.fn.bind */

/**
 * @author berg, lxp
 * @behavior 为ui控件添加定位行为
 *
 * 根据用户参数将元素定位到指定位置
 * TODO: 1. 用surround做触边折返场景时, 折返的大小通常是原始高宽+另一元素的高宽
 *
 * });
 */
(function() {
    var Posable = baidu.ui.behavior.posable = function() { };

    /**
     * 将控件或者指定元素的左上角放置到指定的坐标
     * @param {Array|Object} coordinate 定位坐标,相对文档左上角的坐标，可以是{x:200,y:300}格式，也可以是[200, 300]格式.
     * @param {HTMLElement|string} element optional 目标元素或目标元素的id，如果不指定，默认为当前控件的主元素.
     * @param {Object} options optional 选项，包括：position/coordinate/offset/insideScreen.
     */
    Posable.setPosition = function(coordinate, element, options) {
        element = baidu.g(element) || this.getMain();
        options = options || {};
        var me = this,
            args = [element, coordinate, options];
        me.__execPosFn(element, '_positionByCoordinate', options.once, args);
    };

    /**
     * 将元素放置到指定的坐标点
     *
     * @param {HTMLElement|string} source 要定位的元素.
     * @param {Array|Object} coordinate 定位坐标,相对文档左上角的坐标，可以是{x:200,y:300}格式，也可以是[200, 300]格式.
     * @param {Object} options optional 选项，同setPosition.
     */
    Posable._positionByCoordinate = function(source, coordinate, options, _scrollJustify) {
        coordinate = coordinate || [0, 0];
        options = options || {};
        
        var me = this,
            elementStyle = {},
            cH = baidu.page.getViewHeight(),
            cW = baidu.page.getViewWidth(),
            scrollLeft = baidu.page.getScrollLeft(),
            scrollTop  = baidu.page.getScrollTop(),
            sourceWidth = source.offsetWidth,
            sourceHeight = source.offsetHeight,
            offsetParent = source.offsetParent,
            parentPos = (!offsetParent || offsetParent == document.body) ? {left: 0, top: 0} : baidu.dom.getPosition(offsetParent);

        //兼容position大小写
        options.position = (typeof options.position !== 'undefined') ? options.position.toLowerCase() : 'bottomright';

        coordinate = _formatCoordinate(coordinate || [0, 0]);
        options.offset = _formatCoordinate(options.offset || [0, 0]);
    
        coordinate.x += (options.position.indexOf('right') >= 0 ? (coordinate.width || 0) : 0); 
        coordinate.y += (options.position.indexOf('bottom') >= 0 ? (coordinate.height || 0) : 0); 
        
        elementStyle.left = coordinate.x + options.offset.x - parentPos.left;
        elementStyle.top = coordinate.y + options.offset.y - parentPos.top;

        switch (options.insideScreen) {
           case "surround" :
                elementStyle.left += elementStyle.left < scrollLeft ? sourceWidth  + (coordinate.width || 0): 
                                    ((elementStyle.left + sourceWidth ) > (scrollLeft + cW) ? - sourceWidth - (coordinate.width || 0) : 0);
                elementStyle.top  += elementStyle.top  < scrollTop  ? sourceHeight  + (coordinate.height || 0):
                                    ((elementStyle.top  + sourceHeight) > (scrollTop  + cH) ? - sourceHeight - (coordinate.height || 0) : 0);
                break;
            case 'fix' :
                elementStyle.left = Math.max(
                        0 - parseFloat(baidu.dom.getStyle(source, 'marginLeft')) || 0,
                        Math.min(
                            elementStyle.left,
                            baidu.page.getViewWidth() - sourceWidth - parentPos.left
                            )
                        );
                elementStyle.top = Math.max(
                        0 - parseFloat(baidu.dom.getStyle(source, 'marginTop')) || 0,
                        Math.min(
                            elementStyle.top,
                            baidu.page.getViewHeight() - sourceHeight - parentPos.top
                            )
                        );
                break;
            case 'verge':
                var offset = {
                    width: (options.position.indexOf('right') > -1 ? coordinate.width : 0),//是否放在原点的下方
                    height: (options.position.indexOf('bottom') > -1 ? coordinate.height : 0)//是否放在原点的右方
                },
                optOffset = {
                    width: (options.position.indexOf('bottom') > -1 ? coordinate.width : 0),
                    height: (options.position.indexOf('right') > -1 ? coordinate.height : 0)
                };
               
                elementStyle.left -= (options.position.indexOf('right') >= 0 ? (coordinate.width || 0) : 0);
                elementStyle.top -= (options.position.indexOf('bottom') >= 0 ? (coordinate.height || 0) : 0);
                
                elementStyle.left += elementStyle.left + offset.width + sourceWidth - scrollLeft > cW - parentPos.left ?
                    optOffset.width - sourceWidth : offset.width;
                elementStyle.top += elementStyle.top + offset.height + sourceHeight - scrollTop > cH - parentPos.top ?
                    optOffset.height - sourceHeight : offset.height;
                break;
        }
        baidu.dom.setPosition(source, elementStyle);


        //如果因为调整位置令窗口产生了滚动条，重新调整一次。
        //可能出现死循环，用_scrollJustify保证重新调整仅限一次。
        if (!_scrollJustify && (cH != baidu.page.getViewHeight() || cW != baidu.page.getViewWidth())) {
            me._positionByCoordinate(source, coordinate, {}, true);
        }
        _scrollJustify || me.dispatchEvent('onpositionupdate');
    };

    /**
     * 根据参数不同，选择执行一次或者在window resize的时候再次执行某方法
     * @private
     *
     * @param {HTMLElement|string} element 根据此元素寻找window.
     * @param {string} fnName 方法名，会在this下寻找.
     * @param {Boolean} once 是否只执行一次.
     * @return {arguments} args 执行方法的参数.
     */
    Posable.__execPosFn = function(element, fnName, once, args) {
        var me = this;

        if (typeof once == 'undefined' || !once) {
            baidu.event.on(
                baidu.dom.getWindow(element),
                'resize',
                baidu.fn.bind.apply(me, [fnName, me].concat([].slice.call(args)))
            );
        }
        me[fnName].apply(me, args);
    };
    /**
     * 格式化坐标格式
     * @param {Object|array} coordinate 要调整的坐标格式.
     * @return {Object} coordinate 调整后的格式
     * 类似：{x : number, y : number}.
     */
    function _formatCoordinate(coordinate) {
        coordinate.x = coordinate[0] || coordinate.x || coordinate.left || 0;
        coordinate.y = coordinate[1] || coordinate.y || coordinate.top || 0;
        return coordinate;
    }
})();



/**
 * 为Suggestion提供位置校准功能
 * @name  baidu.ui.Suggestion.Suggestion$fixWidth
 * @addon baidu.ui.Suggestion
 * @author berg
 */
baidu.ui.Suggestion.extend({
    posable: true,
    fixWidth: true,
    getWindowResizeHandler: function() {
        var me = this;
        return function() {
            me.adjustPosition(true);
        };
    },

	/*
     * 重新放置suggestion
     * @private
     */
    adjustPosition: function(onlyAdjustShown) {
       var me = this,
            target = me.getTarget(),
            targetPosition,
            main = me.getMain(),
            pos;

        if (!me._isShowing() && onlyAdjustShown) {
            return;
        }
        targetPosition = baidu.dom.getPosition(target),
        pos = {
                top: (targetPosition.top + target.offsetHeight - 1),
                left: targetPosition.left,
                width: target.offsetWidth
            };
        //交给用户的view函数计算
        pos = typeof me.view == 'function' ? me.view(pos) : pos;

        me.setPosition([pos.left, pos.top], null, {once: true});
        baidu.dom.setOuterWidth(main, pos.width);
    }
});
baidu.ui.Suggestion.register(function(me) {

    me.windowResizeHandler = me.getWindowResizeHandler();

    me.addEventListener('onload', function() {
        me.adjustPosition();
        //监听搜索框与suggestion弹出层的宽度是否一致。
        if (me.fixWidth) {
            me.fixWidthTimer = setInterval(function() {
                var main = me.getMain(),
                    target = me.getTarget();
                if (main.offsetWidth != 0 && target && target.offsetWidth != main.offsetWidth) {
                    me.adjustPosition();
                    main.style.display = 'block';
                }
            }, 100);
        }
        //当窗口变化的时候重新放置
        me.on(window, 'resize', me.windowResizeHandler);
    });

    //每次出现的时候都重新定位，保证用户在初始化之后修改了input的位置，也不会出现混乱
    me.addEventListener('onshow', function() {
        me.adjustPosition();
    });

    me.addEventListener('ondispose', function() {
        clearInterval(me.fixWidthTimer);
    });

});

/* IGNORE API: baidu.event.stop */

/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */
/**
 * 支持快捷键操作，如上下，回车等
 * @name  baidu.ui.Suggestion.Suggestion$input
 * @addon baidu.ui.Suggestion
 */
baidu.ui.Suggestion.register(function(me) {
    var target,

        //每次轮询获得的value
        oldValue = '',

        //一打开页面就有的input value
        keyValue,

        //使用pick方法上框的input value
        pickValue,
        mousedownView = false,
        stopCircleTemporary = false;
    
    function initKeyValue(){
        setTimeout(function(){//防止opera和ie回退时自动打开sug
            keyValue = me.getTarget().value;
        }, 20);
    }

    me.addEventListener('onload', function() {
        target = this.getTarget();

        initKeyValue();
        
        me.on(window, 'onload', initKeyValue);

        //生成dom事件函数
        me.targetKeydownHandler = me.getTargetKeydownHandler();

        //加入dom事件
        me.on(target, 'keydown', me.targetKeydownHandler);

        target.setAttribute('autocomplete', 'off');

        //轮询计时器
        me.circleTimer = setInterval(function() {
            if (stopCircleTemporary) {
                return;
            }

            if (baidu.g(target) == null) {
                me.dispose();
            }

            var nowValue = target.value;
            //todo,这里的流程可以再简化一点
            if (
                nowValue == oldValue &&
                nowValue != '' &&
                nowValue != keyValue &&
                nowValue != pickValue
              ) {
                if (me.requestTimer == 0) {
                    me.requestTimer = setTimeout(function() {
                        me.dispatchEvent('onneeddata', nowValue);
                    }, 100);
                }
            }else {
                clearTimeout(me.requestTimer);
                me.requestTimer = 0;
                if (nowValue == '' && oldValue != '') {
                    pickValue = '';
                    me.hide();
                }
                oldValue = nowValue;
                if (nowValue != pickValue) {
                    me.defaultIptValue = nowValue;
                }
                if (keyValue != target.value) {
                    keyValue = '';
                }
            }
        }, 10);

        me.on(target, 'beforedeactivate', me.beforedeactivateHandler);
    });

    me.addEventListener('onitemclick', function() {
        stopCircleTemporary = false;
        //更新oldValue，否则circle的时候会再次出现suggestion
        me.defaultIptValue = oldValue = me.getTargetValue();
    });

    me.addEventListener('onpick', function(event) {
        //firefox2.0和搜狗输入法的冲突
        if (mousedownView)
            target.blur();
        target.value = pickValue = event.data.item.value;
        if (mousedownView)
            target.focus();
    });

    me.addEventListener('onmousedownitem', function(e) {
        mousedownView = true;
        //chrome和搜狗输入法冲突的问题
        //在chrome下面，输入到一半的字会进框，如果这个时候点击一下suggestion，就会清空里面的东西，导致suggestion重新被刷新
        stopCircleTemporary = true;
        setTimeout(function() {
            stopCircleTemporary = false;
            mousedownView = false;
        },500);
    });
    me.addEventListener('ondispose', function() {
        clearInterval(me.circleTimer);
    });
});

baidu.ui.Suggestion.extend({
    /*
     * IE和M$输入法打架的问题
     * 在失去焦点的时候，如果是点击在了suggestion上面，那就取消其默认动作(默认动作会把字上屏)
     */
    beforedeactivateHandler: function() {
        return function() {
            if (mousedownView) {
                window.event.cancelBubble = true;
                window.event.returnValue = false;
            }
        };
    },

    getTargetKeydownHandler: function() {
        var me = this;

        /*
         * 上下键对suggestion的处理
         */
        function keyUpDown(up) {

            if (!me._isShowing()) {
                me.dispatchEvent('onneeddata', me.getTargetValue());
                return;
            }

            var enableIndex = me.enableIndex,
                currentIndex = me.currentIndex;

            //当所有的data都处于disable状态。直接返回
            if (enableIndex.length == 0) return;
            if (up) {
                switch (currentIndex) {
                    case -1:
                        currentIndex = enableIndex.length - 1;
                        me.pick(enableIndex[currentIndex]);
                        me.highLight(enableIndex[currentIndex]);
                        break;
                    case 0:
                        currentIndex = -1;
                        me.pick(me.defaultIptValue);
                        me.clearHighLight();
                        break;
                    default:
                        currentIndex--;
                        me.pick(enableIndex[currentIndex]);
                        me.highLight(enableIndex[currentIndex]);
                        break;
                }
            }else {
                switch (currentIndex) {
                    case -1:
                        currentIndex = 0;
                        me.pick(enableIndex[currentIndex]);
                        me.highLight(enableIndex[currentIndex]);
                        break;
                    case enableIndex.length - 1:
                        currentIndex = -1;
                        me.pick(me.defaultIptValue);
                        me.clearHighLight();
                        break;
                    default:
                        currentIndex++;
                        me.pick(enableIndex[currentIndex]);
                        me.highLight(enableIndex[currentIndex]);
                        break;
                }
            }
            me.currentIndex = currentIndex;
        }
        return function(e) {
            var up = false, index;
            e = e || window.event;
            switch (e.keyCode) {
                case 9:     //tab
                case 27:    //esc
                    me.hide();
                    break;
                case 13:    //回车，默认为表单提交
                    baidu.event.stop(e);
                    me.confirm( me.currentIndex == -1 ? me.getTarget().value : me.enableIndex[me.currentIndex], 'keyboard');
                    break;
                case 38:    //向上，在firefox下，按上会出现光标左移的现象
                    up = true;
                case 40:    //向下
                    baidu.event.stop(e);
                    keyUpDown(up);
                    break;
                default:
                   me.currentIndex = -1;
            }
        };
    },

    /*
     * pick选择之外的oldValue
     */
    defaultIptValue: ''

});


/**
 * Tangram
 * Copyright 2010 Baidu Inc. All rights reserved.
 * path: ui/tree/Tree.js
 * author: fx
 * version: 1.0.0
 * date: 2010-10-27
 */



/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.array.remove */

/* IGNORE API: baidu.dom.addClass */

/* IGNORE API: baidu.dom.children */

/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.dom.insertHTML */

/* IGNORE API: baidu.dom.insertBefore */

/* IGNORE API: baidu.dom.insertAfter */

/* IGNORE API: baidu.dom.hide */

/* IGNORE API: baidu.dom.remove */

/* IGNORE API: baidu.dom.removeClass */

/* IGNORE API: baidu.dom.show */

/* IGNORE API: baidu.event.stopPropagation */

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.string.encodeHTML */

/**
 * Tree：管理和操作TreeNode
 * @name baidu.ui.Tree
 * @class
 * @grammar new baidu.ui.Tree(options)
 * @param {Object} options
 * @config {Object} data 节点数据集合 {text: "", children: [{text: ""},{text: ""}]}
 * @config {Boolean} expandable  是否改变trunk的状态到leaf,当一个trunk的子节点数为0时，如果为true,那么就变为leaf的状态，否则就不会变
 * @config {Function} onclick  节点被点击后触发。
 * @config {Function} ontoggle  节点被展开或收起后触发。
 * @config {Function} onload  Tree渲染后触发。
 */

//  _rootNode : 根节点,默认值为null,
// _currentNode : 当前节点，默认值为null

baidu.ui.Tree = baidu.ui.createUI(function(options) {
    //树的所有节点的集合 树的ID与实例的键值对
    this._treeNodes = {};
});

//TreeNode类 

//此类做了以下优化。
//1. TreeNode通过字符串拼装HTML来代替模板format,因为多次使用
//   format是非常耗性能的。
//2. 弃用了baidu.ui.createUI的方法，在多次使用createUI有性能瓶颈。
//3. 增加了分步渲染机制。
//4. 优化了_getId,_getClass,_getCallRef等调用次数较多的方法。
//5. 减少函数调用的次数。比如_getId(),在初始化时，是通过字符串拼接来实现，因为一个函数多次调用
//   也对性能有影响。
//6. 用数组push再join代替字符串拼装。
//   如果字符串的叠加次数小于3至5，建议还是用字符串叠加，因为多次实例化一个Array，并且再join(''),
//   也挺消耗性能的。
//7. 去掉了不必要的HTML与样式，这些都会耗损渲染性能。

/**
 * 树节点类TreeNode
 * @name baidu.ui.Tree.TreeNode
 * @class
 * @grammar new baidu.ui.Tree.TreeNode(options)
 * @param {Object} options
 * @config {Boolean} isExpand  是否是展开, 默认值为false
 * @config {Array} children 子节点options数组  默认值为null
 * @config {Boolean} isRoot  是否是根节点,默认值为false
 * @config {Boolean} type  节点类型 trunk|leaf, 默认值为'leaf'
 * @config {String} id  节点的唯一标识ID。默认为null
 * @config {String} text  节点显示名称. 默认值为null
 * @config {String} href 节点的链接href. 默认值为null
 * @config {String} target 节点链接的target,有href的时候才生效。默认值为null
 * @config {String} icon 节点图标的路径. 默认值为null
 * @config {String} skin 节点样式选择符. 默认值为null
 * @config {Boolean} isToggle 是否支持节点展开或收起 默认值为true
 */
baidu.ui.Tree.TreeNode = function(options) {
    var me = this;
    baidu.object.extend(me, options);
    //这里只所以需要判断是因为_getId()的实现已经调用到了me.id,而me.id是对外开放的属性。
    me.id = me.id || baidu.lang.guid();
    me.childNodes = [];
    me._children = [];
    window['$BAIDU$']._instances[me.id] = me;
    me._tree = {};
    me._stringArray = [];
    
};



baidu.ui.Tree.TreeNode.prototype =  
/**
 * @lends baidu.ui.Tree.TreeNode.prototype
 */
{
    //ui控件的类型 **必须**
    uiType: 'tree-node',
    //节点的文本属性
    text: '' ,
    //节点类型：root trunk leaf
    type: 'leaf',
    //是否支持toggle
    isToggle: true,
    /**
     * 用来为HTML元素的ID属性生成唯一值。
     * @param {String} key
     * @return {String} id.
     * @private
     */
    _getId: function(key) {
       return this.id + '-' +key;
    },
    /**
     * 用来为HTML元素的class属性生成唯一值。
     * @param {String} key
     * @return {String} class.
     * @private
     */
    _getClass: function(key) {
        var me = this,
            className = 'tangram-tree-node-' + key;
        if( me.skin){
            className += ' '+me.skin+'-'+key;
        }
        return className;
    },
    /**
     * 生成当前实例所对应的字符串
     * @return {String} stringRef.
     * @private
     */
    _getCallRef: function() {
        return "window['$BAIDU$']._instances['" + this.id + "']";
    },
    /**
     * @private
     * 获得TreeNode dom的html string
     * @return {String} htmlstring.
     */
    getString: function() {
        var me = this,
            stringArray = me._stringArray,
            style='';
        stringArray.push('<dl id="',me.id,'">');
        me._createBodyStringArray();
        style = me.isExpand ? "display:''" : 'display:none';
        stringArray.push('<dd  style="'+style+'" id="',me.id,'-subNodeId"></dd></dl>');
        return stringArray.join('');
    },
    /**
     * 取得节点的父节点
     * @return {TreeNode} treeNode.
     */
    getParentNode: function() {
        return this.parentNode;
    },
    /**
     * 设置节点的父节点
     * @param {TreeNode} treeNode
     */
    setParentNode: function(parentNode) {
        var me = this;
        me.parentNode = parentNode;
        me._level = parentNode._level + 1;
    },
    /**
     * 取得节点的子节点数组
     * @return {Array} treeNodes.
     */
    getChildNodes: function() {
        return this.childNodes;
    },
    /**
     * 设置节点的对应的Tree
     * @param {Tree} tree
     */
    setTree: function(tree) {
        var me = this;
        me._tree = tree;
        me._tree._treeNodes[me.id] = me;
    },
    /**
     * 取得节点的对应的Tree
     * @return {Tree} tree.
     */
    getTree: function() {
        return this._tree;
    },
    /**
     * 增加一组children数据。数据格式:[{text:"",href:"",children:[{text:"",href:""}
     * ,{text:"",href:""}]},{text:""},{text:""}]
     * 可以数组里面嵌套数组
     * @param {Array} array
     */
    appendData: function(childrenData) {
        var me = this;
        baidu.dom.insertHTML(me._getSubNodesContainer(), 'beforeEnd'
        , me._getSubNodeString(childrenData));
        me._isRenderChildren = true;
    },
    /**
     * 取得所有子节点返回的HTMLString
     * @param {Array } array
     * @return {String} string.
     * @private
     */
    _getSubNodeString: function(childrenData) {
        var me = this,
            treeNode,
            len,
            stringArray = [],
            ii = 0,
            item,
            len = childrenData.length;
        for (; ii < len; ii++) {
            item = childrenData[ii];
            treeNode = new baidu.ui.Tree.TreeNode(item);
            if (ii == (len - 1)) {
                treeNode._isLast = true;
            }
            me._appendChildData(treeNode, len - 1);
            stringArray.push(treeNode.getString());
        }
        return stringArray.join('');
    },

    /**
     * 递归判断本节点是否是传进来treeNode的父节点
     * @param {TreeNode} treeNode 节点.
     */
    isParent: function(treeNode) {
        var me = this,
            parent = treeNode;
        while (!parent.isRoot && (parent = parent.getParentNode()) ) {
            if (parent == me) {
                return true;
            }
        }
        return false;
    },
    /**
     * 将已有节点添加到目标节点中，成为这个目标节点的子节点。
     * @param {TreeNode} parentNode 节点对象
     */
    appendTo: function(parentNode) {
        var me = this;
        me.getParentNode()._removeChildData(me);
        parentNode.appendChild(me);
        me.dispatchEvent('appendto');
    },
    /**
     * 将此节点移动至一个目标节点,成为这个目标节点的next节点
     * @param {TreeNode}  treeNode 移动至目标节点
     */
    moveTo: function(treeNode) {
        var me = this,
            oldParent = me.getParentNode(),
            newParent,
            index;
        if (oldParent == null) {
            return false;
        }
        //当treeNode是展开并且treeNode有子节点的时候。
        if (treeNode.isExpand && treeNode.getChildNodes().length > 0) {
            newParent = treeNode;
        }
        else {
            newParent = treeNode.getParentNode();
        }
        oldParent._removeChildData(me);
        index = (newParent == treeNode) ? -1 : treeNode.getIndex();
        newParent.appendChild(me, index);
        me.dispatchEvent('moveto');
    },
    /**
     * 新增一个子节点 只是单一的管理数据结构，没有渲染元素的职责。
     * @param {TreeNode} treeNode 需要加入的节点.
     * @param {TreeNode} index 索引，用来定位将节点加到索引对应的节点下.
     * @param {Boolean} isDynamic 是否是动态新增 用来区分动态新增节点和初始化json。
     * 初始化的json里面的children是有数据的，而动态新增节点的children是需要手动加的，
     * 所以如果初始化json就不需要对children进行维护，反之亦然.
     * @private
     */
    _appendChildData: function(treeNode,index,isDynamic) {
        var me = this,
            nodes = me.getChildNodes();
        treeNode.parentNode = me;
        treeNode.setTree(me.getTree());

        if (isDynamic) {
            nodes.splice(index+1 , 0, treeNode);
            //me.children = me.children || [];
            me._children.splice(index+1 , 0, treeNode.json);
        }
        else {
            nodes.push(treeNode);
            me._children.push(treeNode.json);
            //me.children.push(treeNode.json);
        }
    },

    /**
     * 新增一个子节点，1.先判断子节点是否被渲染过，如果渲染过，就将子节点append到自己subNodes容器里，否则就inertHTML的子节点的getString，2.对parentNode与childNodes进行变更， 3.更新treeNode与tree的update。
     * @param  {TreeNode}  treeNode 需要加入的节点(分为已经渲染的节点和为被渲染的节点)，通过treeNode._getContainer()返回值来判断是否被渲染.
     * @param  {Number}  index 此节点做为 节点集合的[index+1]的值
     * @return {TreeNode} treeNode 返回被新增的child
    */
    appendChild: function(treeNode,index) {
        var me = this,
            oldParent,
            string,
            childNodes,
            treeNodeContainer = treeNode._getContainer(),
            subNodeContainer = me._getSubNodesContainer();
        if (index == null) {
            index = me.getChildNodes().length - 1;
        }
        me._appendChildData(treeNode, index, true);
        childNodes = me.getChildNodes();
        oldParent = treeNode.getParentNode();
        string = treeNode.getString();
        //如果是已经被渲染过的节点
        if (treeNodeContainer) {
            //当本节点为展开的trunk节点
            if (index == -1) {
                //当本节点在treeNode加入之前的childNode的length为0时
                if (childNodes.length == 1) {
                    subNodeContainer.appendChild(treeNodeContainer);
                }
                else {
                    baidu.dom.insertBefore(treeNodeContainer, childNodes[1]._getContainer());
                }
            }
            else {
                baidu.dom.insertAfter(treeNodeContainer, childNodes[index]._getContainer());
            }
        }
        else {
            //console.log('-----appendData--------'+index);
            //当本节点为展开的trunk节点
            if (index == -1) {
                //当本节点在treeNode加入之前的childNode的length为0时
                if (childNodes.length == 1) {
                    baidu.dom.insertHTML(subNodeContainer, 'beforeEnd', string);
                }
                else {
                    baidu.dom.insertHTML(childNodes[1]._getContainer(), 'beforeBegin', string);
                }
            }
            else {
                baidu.dom.insertHTML(childNodes[index]._getContainer(), 'afterEnd', string);
            }
        }
        treeNode._updateAll();
        treeNode._updateOldParent(oldParent);
        if (me.type == 'leaf') {
            me.type = 'trunk';
            me._getIconElement().className = me._getClass('trunk');
        }
        me._getSpanElement().innerHTML = me._getImagesString();
        return treeNode;
    },
    /**
     * @private
     * @param {TreeNode} oldParentNode 节点之前的父节点
     * 修改节点原来父节点的状态.
     */
    _updateOldParent: function(oldParent) {
        var me = this;
        if (!oldParent) {
            return false;
        }
        if (oldParent.getLastChild()) {
            oldParent.getLastChild()._update();
        }
        else {
            if (me.getTree().expandable) {
                oldParent._getIconElement().className = me._getClass('leaf');
                oldParent.type = 'leaf';
            }
            oldParent._update();
        }
    },
    /**
     * 内部方法
     * @private
     * 只删除此节点的数据结构关系，而不删除dom元素对象。这个方法被用于appendTo
     * @param {TreeNode} treeNode
     * @param {Boolean} recursion  如果为true,那么就递归删除子节点
     * 主要是在将有子节点的节点做排序的时候会用到。.
     */
    _removeChildData: function(treeNode,recursion) {
        var me = this;
        baidu.array.remove(me._children, treeNode.json);
        baidu.array.remove(me.childNodes, treeNode);
        delete me.getTree().getTreeNodes()[treeNode.id];
        if (recursion) {
            while (treeNode.childNodes[0]) {
                treeNode._removeChildData(treeNode.childNodes[0]);
            }
        }
    },
    /**
     * 批量删除一个节点下的所有子节点
    */
    removeAllChildren: function() {
        var me = this,
            childNodes = me.getChildNodes();
        while (childNodes[0]) {
            me.removeChild(childNodes[0], true);
        }
    },
    /**
    *删除一个子节点
    *1.删除此节点对象的数据结构
    *2.删除此节点所对应的dom元素对象
    *@param {TreeNode} treeNode
    */
    removeChild: function(treeNode) {
        if (treeNode.getParentNode() == null) {
            return false;
        }
        var me = this,
            nodes = me.getChildNodes();
        me._removeChildData(treeNode, true);
        delete me.getTree().getTreeNodes()[treeNode.id];
        baidu.dom.remove(treeNode._getContainer());
        me.getTree().setCurrentNode(null);
        if (nodes.length <= 0 && !me.isRoot) {
            me._getSubNodesContainer().style.display = 'none';
            if (me.getTree().expandable) {
                me._getIconElement().className = me._getClass('leaf');
                me.type = 'leaf';
            }
        }
        me._updateAll();
    },
   /**
    * 除了更新节点的缩进图标状态外，还更新privious的状态
    * @private
    */
    _updateAll: function() {
        var me = this,
            previous = me.getPrevious();
        previous && previous._update();
        me._update();
    },
   /**
    * 更新节点的缩进，以及图标状态
    * @private
    */
    _update: function() {
        var me = this;
        me._getSpanElement().innerHTML = me._getImagesString();
        baidu.array.each(me.childNodes, function(item) {
            item._update();
        });
    },
    /**
    *更新节点的一系列属性
    *1.如有text,就更新text.
    *2.如有icon
    *@param {Object} options
    */
    update: function(options) {
        var me = this,
            hrefElement = me._getHrefElement(),
            textElement = me._getTextElement();
        baidu.extend(me, options);
        (hrefElement ? hrefElement : textElement).innerHTML = me.text;
    },
   /**
    * 切换toggle状态
    * @param {String} "block" or "none"
    * @param {String} "Lminus" or "Lplus"
    * @param {String} "Tminus" or "Tplus"
    * @param {Boolean} true or false
    * @private
    */
    _switchToggleState: function(display,lastClassName,className,flag) {
        var me = this,
            toggleElement = me._getToggleElement();
        if (me.type == 'leaf') {
            return false;
        }
        me.isExpand = flag;
        if (toggleElement) {
            toggleElement.className = me._getClass(me.isLastNode() ? lastClassName : className);
        }
        if (me.getChildNodes() && me.getChildNodes().length > 0) {
            me._getSubNodesContainer().style.display = display;
        }
    },
    /**
     * 展开节点
     * 分步渲染。第一次expand会渲染节点
     */
    expand: function() {
        var me = this;
        if (!me._isRenderChildren) {
            me.appendData(me.children);
        }
        me._switchToggleState('block', 'Lminus', 'Tminus', true);
    },
   /**
    * 收起节点
    */
    collapse: function() {
        this._switchToggleState('none', 'Lplus', 'Tplus', false);
    },
    /**
     * 切换，收起或者展开
     */
    toggle: function() {
        var me = this;
        if (me.type == 'leaf') {
            return false;
        }
        me.isExpand ? me.collapse() : me.expand();
    },

    /**
     * 切换focus的状态
     * @param {String className} className
     * @param {Bollean flag} flag
     * @param {String methodName} 方法名.
     * @private
     */
    _switchFocusState: function(className,flag,methodName) {
        var me = this;
        baidu.dom[methodName](me._getNodeElement() , me._getClass('current'));
        if (me.type != 'leaf') {
            me._getIconElement().className = me._getClass(className);
            me.isOpen = flag;
        }
    },
    /**
     * 失去焦点,让当前节点取消高亮。
     */
    blur: function() {
        var me = this;
        me._switchFocusState('trunk', false, 'removeClass');
        me.getTree().setCurrentNode(null);
    },
   /**
    * 取得焦点,并且让当前节点高亮，让上一节点取消高亮。
    */
    focus: function() {
        var me = this,
            oldNode = me.getTree().getCurrentNode();
        if (oldNode != null) {
            oldNode.blur();
        }
        me._switchFocusState('open-trunk', true, 'addClass');
        me.getTree().setCurrentNode(me);
        baidu.dom.removeClass(me._getNodeElement(), me._getClass('over'));
    },
    /**
     * 鼠标放上去的效果
     * @private
     */
    _onMouseOver: function(event) {
        var me = this;
        if (me != me.getTree().getCurrentNode()) {
            baidu.dom.addClass(me._getNodeElement(), me._getClass('over'));
        }
        me.dispatchEvent('draghover', {event: event});
        me.dispatchEvent('sorthover', {event: event});
    },
    /**
     * 鼠标离开的效果
     * @private
     */
    _onMouseOut: function() {
        var me = this;
        baidu.dom.removeClass(me._getNodeElement(), me._getClass('over'));
        me.getTree().dispatchEvent('mouseout', {treeNode: me});
    },
   /**
    * 点击节点时候的效果
    * @private
    */
    _onClick: function(eve) {
        var me = this;
        me.focus();
        me.getTree().dispatchEvent('click', {treeNode: me});
    },
   /**
    * mousedown节点时候的效果
    * @private
    */
    _onMouseDown: function(event) {
        var me = this;
        me.dispatchEvent('dragdown', {event: event});
    },
    
   /**
    * 当鼠标双击节点时的效果
    * @private
    */
    _onDblClick: function(event) {
        var me = this;
        me.focus();
        me.isToggle && me.toggle();
        me.getTree().dispatchEvent('dblclick', {
            treeNode: me,
            event: event
        });
    },
   /**
    * 当鼠标右击节点时的效果\
    * @private
    */
    _onContextmenu: function(event) {
        var me = this;
        return me.getTree().dispatchEvent('contextmenu', {
            treeNode: me,
            event: event
        });

    },
   /**
    * 点击toggle图标时候的效果
    * @private
    */
    _onToggleClick: function(event) {
        var me = this;
        me.isToggle && me.toggle();
        me.getTree().dispatchEvent('toggle', {treeNode: me});
        baidu.event.stopPropagation(event);
    },
    /**
     * 获得TreeNode  body的html string
     * @return {String} htmlstring.
     * @private
     */
    _createBodyStringArray: function() {
        var me = this,
            stringArray = me._stringArray;
        stringArray.push('<dt id="',me.id,'-node" class="tangram-tree-node-node"');
        if(me.skin){
            stringArray.push(' ',me.skin,'-node');
        }
        stringArray.push(' onclick="',me._getCallRef() + ('._onClick(event)'),'"> <span id="',
            me.id,'-span">',me._getImagesString(true),'</span>');
        me._createIconStringArray();
        me._createTextStringArray();
        stringArray.push('</dt>');
    },
    /**
     * 获得TreeNode  Images的html string
     * @param {Array} stringArray.
     * @param {isInit} 是否是初始化节点.
     * @return {Array} stringArray.
     * @private
     */
    _getImagesString: function(isInit) {
        var me = this,
            string = '';
        string += me._getIdentString(isInit);
        if (me.type == 'leaf') {
            string += me._getTLString(isInit);
        }
        else if (me.type == 'trunk') {
            if (me.children && me.children.length > 0) {
                string += me._getToggleString(isInit);
            } else {
                string += me._getTLString(isInit);
            }
        }
        return string;
    },
    /**
     * 获得TreeNode 缩进线条的String
     * @param {isInit} 是否是初始化节点.
     * @return {string} htmlstring.
     * @private
     */
    _getIdentString: function(isInit) {
        var me = this,
            string = '',
            prifix;
        while (me.getParentNode() && me.getParentNode().type != 'root') {
            me = me.getParentNode();
            prifix =( me.isLastNode(isInit) ? 'blank' : 'I');
            className = 'tangram-tree-node-' + prifix;
            if(me.skin){
                className += ' '+me.skin+ '-'+prifix;
            }
            string = '<span   class="'+className+'"></span>' + string;
        }
        return string;
    },
    /**
     * 获得TreeNode T线条或者L线条的String
     * @param {Array} stringArray.
     * @param {isInit} 是否是初始化节点.
     * @private
     */
    _getTLString: function(isInit) {
        var me = this,
            prifix = (me.isLastNode(isInit) ? 'L' : 'T');
            className = 'tangram-tree-node-' + prifix;
        if(me.skin){
            className += ' '+me.skin+'-'+prifix; 
        }
        return '<span   class="' + className + '" ></span>';
    },
    /**
     * 组建TreeNode  Toggle string
     * @param {Array} stringArray.
     * @param {isInit} 是否是初始化节点.
     * @private
     */
    _getToggleString: function(isInit) {
        var me = this,
            type = me.isExpand ? 'minus' : 'plus',
            prifix =  (me.isLastNode(isInit) ? 'L' : 'T') + type,
            className = 'tangram-tree-node-' + prifix;
        if(me.skin){
            className += ' '+me.skin+'-'+prifix;
        }
        return ['<span onclick="', me._getCallRef(),
                '._onToggleClick(event)" class="',className,
                '" id="',me.id,'-toggle"></span>'].join('');
    },
    /**
     * 组建TreeNode  Toggle string
     * @private
     */
    _createIconStringArray: function() {
        var me = this,
            className = (me.type == 'leaf' ? 'leaf' : 'trunk'),
            stringArray = me._stringArray;
        if (me.isOpen) {
            className = 'open-trunk';
        }
        stringArray.push('<span  class="tangram-tree-node-',className);
        if(me.skin) {
            stringArray.push(' ',me.skin,'-',className);
        }
        stringArray.push('" style="',me.icon ? 'background-image:url(' + me.icon + ')' : '',
            '" id="', me.id,'-icon"></span>');
    },
    /**
     * 获得TreeNode  text string
     * @return {String} htmlstring.
     * @private
     */
    _createTextStringArray: function() {

        var me = this,
            text = (me.href ? me._createHrefStringArray() : me.text),
            stringArray = me._stringArray;
        stringArray.push('<span title="',me.title || me.text,'" id="',
            me.id,'-text" >',text,'</span></span>');
    },
    /**
     * 获得TreeNode  href string
     * @return {String} htmlstring.
     * @private
     */
    _createHrefStringArray: function() {
        var me = this,
            stringArray = me._stringArray;
        stringArray.push('<a id="',me.id,'-link',
            (me.target ? "target='" + me.target + "'" : ''),' hidefocus="on" " href="',
            me.href,'" >',me.text,'</a>');
    },
    /**
     * 取得图标(线或者blank)的容器
     * @return {HTMLObject} span.
     * @private
     */
    _getSpanElement: function() {
        return baidu.g(this._getId('span'));
    },
    /**
     * 取得节点图标的HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getIconElement: function() {
        return baidu.g(this._getId('icon'));
    },
    /**
     * 取得文本父容器的HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getTextContainer: function() {
        return baidu.g(this._getId('textContainer'));
    },
    /**
     * 取得文本容器的HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getTextElement: function() {
        return baidu.g(this._getId('text'));
    },
    /**
     * 取得切换展开或收起的image HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getToggleElement: function() {
        return baidu.g(this._getId('toggle'));
    },
    /**
     * 取得装子节点的父容器 HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getSubNodesContainer: function() {
        return baidu.g(this._getId('subNodeId'));
    },
    /**
     * 取得href的容器 HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getHrefElement: function() {
        return baidu.g(this._getId('link'));
    },
    /**
     * 取得node(不包括子节点)的 HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getNodeElement: function() {
        return baidu.g(this._getId('node'));
    },
    /**
     * 取得node(包括子节点的dom)的容器 HTMLObject
     * @return {HTMLObject}
     * @private
     */
    _getContainer: function() {
        return baidu.g(this.id);
    },
    /**
     * 隐藏节点，但不包括它的子节点。
     */
    hide: function() {
        baidu.dom.hide(this._getNodeElement());
    },
    /**
     * 显示节点。
     */
    show: function() {
        baidu.dom.show(this._getNodeElement());
    },
    /**
     * 递归展开所有子节点
     */
    expandAll: function() {
        var me = this;
        if(me.children) {
            me.expand();
        }
        baidu.array.each(me.getChildNodes(), function(item) {
            item.expandAll();
        });
    },
    /**
     * 递归收起所有子节点
     */
    collapseAll: function() {
        var me = this;
        if (me.getChildNodes().length > 0) {
            me.collapse();
        }
        baidu.array.each(me.getChildNodes(), function(item) {
            item.collapseAll();
        });
    },
    /**
     * 取得本节点所对应父节点的索引
     * @return {int} index.
     */
    getIndex: function() {
        var me = this,
            nodes = me.isRoot ? [] : me.getParentNode().getChildNodes(),
            index = -1;
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (nodes[i] == me) {
                return i;
            }
        }
        return index;
    },
    /**
     * 取得本节点的下一个节点
     * 如果没有就返回自己
     * @return {TreeNode} next.
     */
    getNext: function() {
        var me = this, 
            index = me.getIndex(),
            nodes;
        if(me.isRoot) {
            return me;
        }
        nodes = me.getParentNode().getChildNodes();
        return (index + 1 >= nodes.length) ? me : nodes[index + 1];
    },
    /**
     * 取得本节点的上一个节点
     * 如果没有就返回自己
     * @return {TreeNode} previous.
     */
    getPrevious: function() {
        var me = this, 
            index = me.getIndex(),
            nodes ;
        if(me.isRoot) {
            return me;
        }
        nodes = me.getParentNode().getChildNodes();
        return (index - 1 < 0) ? me : nodes[index - 1];
    },
    /**
     * 取得本节点的第一个子节点
     * 如果没有就返回null
     * @return {TreeNode} previous.
     */
    getFirstChild: function() {
        var me = this,
            nodes = me.getChildNodes();
        return (nodes.length <= 0) ? null : nodes[0];
    },
    /**
     * 取得本节点的最后一个子节点
     * 如果没有就返回null
     * @return {TreeNode} previous.
     */
    getLastChild: function() {
        var me = this,
            nodes = me.getChildNodes();
        return nodes.length <= 0 ? null : nodes[nodes.length - 1];
    },
    /**
     * 是否是最后一个节点
     * 在初始渲染节点的时候，自己维护了一个_isLast,就不用去动态算是否是最后一个子节点。
     * 而在动态新增，删除节点时，动态的处理是否是最后一个节点能方便代码实现，
     * 这样做的目的既能保证初始化时的性能，也能够方便动态功能的实现。.
     * @return {Boolean} true | false.
     */
     //isInit不作为参数做文档描述，是一个内部参数。
    isLastNode: function(isInit) {
        var me = this;
        if (isInit) {
            return me._isLast;
        }
        if(me.isRoot) {
            return true;
        }
            
        return me.getIndex() == (me.parentNode.childNodes.length - 1);
    }
    

};

baidu.object.extend(baidu.ui.Tree.TreeNode.prototype, baidu.lang.Class.prototype);

baidu.ui.Tree.extend(
    /**
     *  @lends baidu.ui.Tree.prototype
     */
    {
    //ui类型
    uiType: 'tree',
    //模板
    tplDOM: "<div class='#{class}'>#{body}</div>",
    /**
     * 取得html string
	 * @private
     * @return tree的htmlstring,
     */
    getString: function() {
        var me = this;
        return baidu.format(me.tplDOM, {
            'class' : me.getClass(),
            body: me._getBodyString()
        });
    },
    /**
     * 渲染树
     * @param {HTMLElement|String} main
     */
    render: function(main) {
        var me = this;
        me.renderMain(main).innerHTML = me.getString();
        me.dispatchEvent('onload');
    },
    /**
     * 内部方法,取得树的HTML的内容
     * @return {String} string.
     * @private
     */
    _getBodyString: function() {
        var string = '',
            me = this;
        if (me.data) {
            me._rootNode = new baidu.ui.Tree.TreeNode(me.data);
            me._rootNode.isRoot = true;
            me._rootNode.type = 'root';
            me._rootNode._level = 0;
            me._rootNode.setTree(me);
            //初始化树形结构
            string = me._rootNode.getString();
        }
        return string;
        
    },
    /**
     * 取得树的节点的集合map,treeNode的id与treeNode的键值对。
     * @return {Object} map.
     */
    getTreeNodes: function() {
        return this._treeNodes;
    },
    /**
     * 取得树的最根节点
     * @return {TreeNode} treeNode.
     */
    getRootNode: function() {
        return this._rootNode;
    },
    /**
     * 通过id属性来取得treeNode
     * @param {String} id       节点id
     * @return {TreeNode} treeNode.
     */
    getTreeNodeById: function(id) {
        return this.getTreeNodes()[id];
    },
    /**
     * 取得树的当前节点
     * @return {TreeNode} treeNode.
     */
    getCurrentNode: function() {
        return this._currentNode;
    },
    /**
     * 设置节点为树的当前节点
     * @return {TreeNode} treeNode.
     */
    setCurrentNode: function(treeNode) {
        this._currentNode = treeNode;
    },
    /**
     *销毁Tree对象
     */
    dispose: function() {
        var me = this;
        me.dispatchEvent('dispose');
        baidu.dom.remove(me.getMain());
        baidu.lang.Class.prototype.dispose.call(me);
    }
});


/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: ui/behavior/decorator.js
 * author: berg
 * version: 1.1.0
 * date: 2010/11/1
 */



/* IGNORE API: baidu.dom.insertBefore */

/* IGNORE API: baidu.dom.children */

/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.string.format */

/**
 * 装饰器控件基类
 * @name baidu.ui.Decorator
 * @class
 * @private
 */

baidu.ui.Decorator = baidu.ui.createUI(function(options){

}).extend({
    uiType : "decorator",

    type: 'box',

    //装饰器模板
    tpl : {
        "box" : "<table cellspacing='0' cellpadding='0' border='0' id='#{id}'>" + 
                "<tr>" + 
                "<td #{class}></td>" + 
                "<td #{class}></td>" + 
                "<td #{class}></td>" +
                "</tr>" + 
                "<tr>" + 
                //在ie中若td为空，当内容缩小时，td高度缩不去
                "<td #{class}><i style='visibility:hidden'>&nbsp;</i></td>" + 
                "<td #{class} id='#{innerWrapId}' valign='top'></td>" + 
                "<td #{class}><i style='visibility:hidden'>&nbsp;</i></td>" + 
                "</tr>" + 
                "<tr>" + 
                "<td #{class}></td>" + 
                "<td #{class}></td>" + 
                "<td #{class}></td>" + 
                "</tr>" + 
                "</table>"
    },

    //装饰器模板的Class填充列表
    tplClass : {
        "box" : ['lt', 'ct', 'rt', 'lc', 'cc', 'rc', 'lb', 'cb', 'rb']
    },

    /**
     * 获得装饰器内部ui的body元素
     */
    getInner : function(){
        return baidu.g(this.innerId);
    },
    
    getBox:function(){
        return baidu.g(this.getId('table'));
    },

    /**
     * 获得装饰器内部ui的main元素的外包装
     */
    _getBodyWrap : function(){
        return baidu.g(this.getId("body-wrap"));
    },

    /**
     *
     * 渲染装饰器
     *
     * 2010/11/15 调整实现方式，新的实现不会修改ui原来的main元素
     */
    render : function(){
        var me = this,
            decoratorMain = document.createElement('div'),
            uiMain = me.ui.getMain(),
            style = uiMain.style,
            ruleCount = 0;

        document.body.appendChild(decoratorMain);
        me.renderMain(decoratorMain),

        decoratorMain.className = me.getClass(me.type + "-main");

        decoratorMain.innerHTML = baidu.format(
            me.tpl[me.type], {
                id : me.getId('table'),
                'class' : function (value){
                    return "class='" + me.getClass(me.type + "-" + me.tplClass[me.type][ruleCount++]) + "'"
                },
                innerWrapId : me.getId("body-wrap")
            }
        );

        baidu.each(baidu.dom.children(uiMain), function(child){
            me._getBodyWrap().appendChild(child);
        });
        uiMain.appendChild(decoratorMain);

        me.innerId = uiMain.id;
        uiMain.getBodyHolder = me._getBodyWrap();
    }
    
});



/* IGNORE API: baidu.lang.isString */

/* IGNORE API: baidu.array.each */

/**
 * 为ui控件添加装饰器
 */
(function(){
    var Decorator = baidu.ui.behavior.decorator = function(){
        this.addEventListener("onload", function(){
            var me = this,
                opt;
            baidu.each(me.decorator, function(decoratorName, i){
                opt = { ui : me , skin : me.skin };
                if(baidu.lang.isString(decoratorName)){
                    opt['type'] = decoratorName;
                }else{
                    baidu.extend(opt, decoratorName);
                }
                me._decoratorInstance[i] = new baidu.ui.Decorator(opt);
                me._decoratorInstance[i].render();
            });
        });

        this.addEventListener("ondispose", function(){
            this._decoratorInstance = [];
            baidu.each(this._decoratorInstance, function(decorator){
                decorator.dispose();
            });
        });
    };

    /**
     * 存放装饰器控件实例
     */
    Decorator._decoratorInstance = [];

    /**
     * 获取所有装饰器控件实例
     * @return {array|Decorator} 所有装饰器的数组或者单个装饰器
     */
    Decorator.getDecorator = function(){
        var instance = this._decoratorInstance;
        return instance.length > 0 ? instance : instance[0];
    };
})();


/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 * 
 * path: ui/behavior/droppable.js
 * author: rocy
 * version: 1.0.0
 * date: 2010/09/16
 */


/* IGNORE API: baidu.dom.droppable */

/**
 *
 * 为ui控件添加容纳拖拽控件的行为
 * ui控件初始化参数增加如下:
 * {
 * 	droppable  : 是否有drop行为
 *  dropHandler: 用于drop的DOM元素,
 *  dropOptions: 与baidu.dom.droppable的参数一致,
 *  
 * }
 */
(function(){
	var Droppable = baidu.ui.behavior.droppable = function(){
		var me = this;
		//默认仅发送事件
		me.dropOptions = baidu.extend({
            ondropover : function(event){
                me.dispatchEvent("ondropover",event);
            },
            ondropout : function(event){
                me.dispatchEvent("ondropout", event);
            },
            ondrop : function(event){
                me.dispatchEvent("ondrop", event);
            }
        },me.dropOptions);
        
		me.addEventListener("onload",function(){
			me.dropHandler = me.dropHandler || me.getBody();
			me.dropUpdate(me);
		});
	};
	
	Droppable.dropUpdate = function(options){
		var me = this;
		options && baidu.extend(me, options);
		//使已有drop失效,必须在droppable判定之前,使droppable支持动态修改
		me._theDroppable && me._theDroppable.cancel();
		if(!(me.droppable)){
			return;
		}
		me._theDroppable = baidu.dom.droppable(me.dropHandler, me.dropOptions);
	};
})();

/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/* IGNORE API: baidu.dom.getPosition */

/**
 * 将控件或者指定元素与指定的元素对齐
 *
 * @param {HTMLElement|string} target 要对齐到的元素.
 * @param {HTMLElement|string} element optional 要对齐的元素或元素id，如果不指定，默认为当前控件的主元素.
 * @param {Object} options optional 选项，同setPosition方法.
 */
baidu.ui.behavior.posable.setPositionByElement =
    function(target, element, options) {
        target = baidu.g(target);
        element = baidu.g(element) || this.getMain();
        options = options || {};

        this.__execPosFn(element, '_setPositionByElement', options.once, arguments);
    };

/**
 * 将控件或者指定元素与指定的元素对齐
 * @private
 *
 * @param {HTMLElement|string} target 要对齐到的元素.
 * @param {HTMLElement|string} element optional 要对齐的元素或元素id，如果不指定，默认为当前控件的主元素.
 * @param {Object} options optional 选项，同setPosition方法.
 */
baidu.ui.behavior.posable._setPositionByElement = function(target, element, options){
    var targetPos = baidu.dom.getPosition(target);
    options.once = false;
    options.insideScreen = options.insideScreen || 'verge';
    targetPos.width = target.offsetWidth;
    targetPos.height = target.offsetHeight;
    this._positionByCoordinate(element, targetPos, options, true);
};

/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 */



/* IGNORE API: baidu.page.getMousePosition */

/**
 * 将控件或者指定元素放置到当前鼠标位置
 *
 * @param {HTMLElement|string} element optional 要对齐的元素或元素id，如果不指定，默认为当前控件的主元素.
 * @param {Object} options optional 选项，同setPosition方法.
 */
baidu.ui.behavior.posable.setPositionByMouse = function(element, options) {
    var me = this;
    element = baidu.g(element) || me.getMain();
    me._positionByCoordinate(element, baidu.page.getMousePosition(), options);
};


/**
 * Tangram UI
 * Copyright 2009 Baidu Inc. All rights reserved.
 *
 * path: ui/behavior/sortable.js
 * author: fx
 * version: 1.0.0
 * date: 2010-12-21
 *
 */


/* IGNORE API: baidu.dom.setStyles */

/* IGNORE API: baidu.dom.getStyle */


/* IGNORE API: baidu.dom.draggable */

/* IGNORE API: baidu.dom.droppable */

/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.dom.insertBefore */

/* IGNORE API: baidu.dom.insertAfter */

/* IGNORE API: baidu.page.getWidth */

/* IGNORE API: baidu.page.getHeight */

/* IGNORE API: baidu.dom.getPosition */

/* IGNORE API: baidu.object.extend */

//2011-2-23做了以下优化，在初始化的时候生成一个坐标与对象的键值对集合。
//再判断拖拽元素的坐标是否在键值对范围内，如果是就做排序操作。
(function() {

    var Sortable = baidu.ui.behavior.sortable = function() {
        this.addEventListener("dispose", function(){
            baidu.event.un(me.element, 'onmousedown', handlerMouseDown);
        });
    };

    /**
     * sortable : 组件公共行为，用来完成dom元素位置的交换.
     * 可以用于树的节点的排序，列表的排序等等.
     *
     *
     * @param {Array}  sortElements 被排序的元素数组.
     * @param {Array}  sortParentElement 被排序的元素的父元素，用来做事件代理的。.
     * @param {Object} options 可子定义参数.
     * sortHandlers {Array} 默认值[]  拖拽句柄数组，这个需要与elements一一对应.
     *                  如果handlers为空,那么整个sortElement都是可以进行拖拽。.
     *
     * sortDisabled {Boolean} 默认值
     *
     * sortRangeElement {HTMLElement} 默认值 null  定义拖拽的边界元素，就能在这个元素范围内进行拖拽
     *
     * sortRange {Array}    默认值[0,0,0,0] 鼠标的样式 排序的范围,排序的元素只能在这个范围进行拖拽
     *
     * onsortstart {Function}  排序开始的时候的事件
     *
     * onsort {Function}  正在排序时候的事件
     *
     * onsortend {Function}  排序结束时候的事件
     *
     */
     // TODO axis {String}   默认值 null .  坐标，当坐标为"x",元素只能水平拖拽，当坐标为"y",元素只能垂直拖拽。
     // TODO  delay {Integer}  默认值 0  当鼠标mousedown的时候延长多长时间才可以执行到onsortstart。
     //                        这个属性可以满足只点击但不排序的用户
     // TODO  useProxy 默认值 false  是否需要代理元素，在拖拽的时候是元素本身还是代理
     // 实现思路
     // 点击一组元素其中一个，在mousedown的时候将这个元素的position设为absolute,在拖动的时候判断
     // 此元素与其他元素是否相交，相交就在相交的元素下面生成一个空的占位符（宽和高与拖动元素一样），dragend的
     // 时候将此拖拽的元素替代占位符.那么排序就完成。
     // 完成此效果可以借助baidu.dom.drag来辅助实现.
     // 规则:
     // 1.这一组元素的style.position应该是一致的.
     // 2.这一组元素应该是同一html标签的元素.

    Sortable.sortUpdate = function(sortElements, sortParentElement, options) {
        var position,
            element,
            handler,
            me = this,
            rangeElementPostion,
            options = options || {};
        if (me.sortDisabled) {
            return false;
        }
        options.sortElements = sortElements;
        baidu.object.extend(me, options);
        me.sortHandlers = me.sortHandlers || me.sortElements;
        me.element = sortParentElement;
        me.sortRangeElement = baidu.g(me.sortRangeElement) || document.body;
        rangeElementPostion = baidu.dom.getPosition(me.sortRangeElement);
        //先将elements的position值存下来.在这里说明一下sortable的规则，对于elements,
        //应该是一组position值相同的元素。
        if (me.sortElements) {
            me._sortPosition = baidu.dom.getStyle(me.sortElements[0], 'position');
        }
        //设置range 上右下左
        if(!me.sortRange){
            me.sortRange = [
                rangeElementPostion.top,
                rangeElementPostion.left + me.sortRangeElement.offsetWidth,
                rangeElementPostion.top + me.sortRangeElement.offsetHeight,
                rangeElementPostion.left
            ];
        }

        baidu.event.on(me.element, 'onmousedown', mouseDownHandler);

    };

    function isInElements(elements, element) {
        var len = elements.length,
            i = 0;
        for (; i < len; i++) {
            if (elements[i] == element) {
                return true;
            }
        }
    }
    
    /*
     * 事件代理，放在sortElement的父元素上
     */
    function mouseDownHandler(event) {
        var element = baidu.event.getTarget(event),
            position = baidu.dom.getPosition(element),
            parent = element.offsetParent,
            parentPosition = (parent.tagName == 'BODY') ? {left: 0, top: 0} : baidu.dom.getPosition(parent);
            if (!isInElements(me.sortElements, element)) {
                return false;
            }
            baidu.dom.setStyles(element, {
                left: (position.left - parentPosition.left) + 'px',
                top: (position.top - parentPosition.top) + 'px',
                //如果position为relative,拖动元素，还会占有位置空间，所以在这里将
                //position设置为'absolute'
                position: 'absolute'
            });
            me._sortBlankDivId = me._sortBlankDivId || _createBlankDiv(element, me).id;
            baidu.dom.drag(element, {range: me.sortRange,
                ondragstart: function(trigger) {
                    me.sortElementsMap = _getElementsPosition(me.sortHandlers);
                    me.dispatchEvent('sortstart', {trigger: trigger});
                },
                ondrag: function(trigger) {
                    var elements = me.sortHandlers,
                        i = 0,
                        len = elements.length,
                        target,
                        position = baidu.dom.getPosition(trigger);
                    target = getTarget(
                            position.left,
                            position.top,
                            trigger.offsetWidth,
                            trigger.offsetHeight,
                            me.sortElementsMap
                        );
                    if (target != null) {
                        me._sortTarget = target;
                        baidu.dom.insertAfter(_getBlankDiv(me), target);
                    }
                    me.dispatchEvent('sort', {trigger: trigger});
                },

                ondragend: function(trigger) {
                    if (me._sortTarget) {
                        baidu.dom.insertAfter(trigger, me._sortTarget);
                        me.dispatchEvent('sortend', {trigger: trigger, reciever: me._sortTarget});
                    }
                    baidu.dom.remove(_getBlankDiv(me));
                    me._sortBlankDivId = null;
                    baidu.dom.setStyles(trigger, {position: me._sortPosition, left: '0px', top: '0px'});

                }
            });

    }

    //通过拖拽的元素的x,y坐标和宽高来定位到目标元素。
    function getTarget(left, top, width, height, map) {
        var i,
            _height,
            _width,
            _left,
            _top,
            array,
            max = Math.max,
            min = Math.min;
        for (i in map) {
            array = i.split('-');
            _left = +array[0];
            _top = +array[1];
            _width = +array[2];
            _height = +array[3];
            if (max(_left, left) <= min(_left + _width, left + width)
               && max(_top, top) <= min(_top + _height, top + height)) {
               return map[i];
            }
        }
        return null;
    }


    //取得一组元素的定位与元素的map
    function _getElementsPosition(elements) {
        var map = {},
            position;
        baidu.each(elements, function(item) {
            position = baidu.dom.getPosition(item);
            map[position.left + '-' + position.top + '-' + item.offsetWidth + '-' + item.offsetHeight] = item;
        });
        return map;
    }



    //取得空占位符的dom元素
    function _getBlankDiv(me) {
        return baidu.g(me.getId('sortBlankDiv'));
    }

    //创建一个空占位符的层
    function _createBlankDiv(trigger, me) {
        var div = baidu.dom.create('div', {
            id: me.getId('sortBlankDiv'),
            className: trigger.className
        });
        baidu.dom.setStyles(div, {
            width: trigger.offsetWidth + 'px',
            height: trigger.offsetHeight + 'px',
            borderWidth: '0px'
        });
        baidu.dom.insertBefore(div, trigger);
        return div;
    }

})();



/**
 * Tangram UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path: ui/behavior/statable/setStateHandler.js
 * author: berg
 * version: 1.0.0
 * date: 2010/12/14
 */



/* IGNORE API: baidu.object.extend */

/**
 * 为statable行为添加DOM节点添加事件支持
 */

baidu.extend(baidu.ui.behavior.statable, {

    /**
     * dom的事件触发侦听器
     * @param {String} eventType 事件类型
     * @param {Object} group 状态类型，同一类型的相同状态会被加上相同的css
     * @param {Object} key 索引，在同一类中的索引
     * @param {Event} evnt 事件触发时的Event对象
     */
    _statableMouseHandler : function(eventType, group, key, evnt){
        this._fireEvent(eventType, group, key, evnt);
    },
    
    /**
     * 使用dom的形式为该节点增加事件
     * @param {html-element} element 事件源
     * @param {Object} group 状态类型，同一类型的相同状态会被加上相同的css
     * @param {Object} key 索引，在同一类中的索引
     * @memberOf {TypeName}
	 * @private
     * @return {Object} 格式：{evntName0 : handler0, evntName1 : handler1}
     */
    setStateHandler : function(element, group, key){
        var me = this, handler = {};
        if(typeof key == 'undefined'){group = key = "";}
        baidu.array.each(me._allEventsName, function(item){
            handler[item] = baidu.fn.bind("_statableMouseHandler", me, item, group, key);
            baidu.event.on(element, item, handler[item]);
        });
        me.addEventListener("dispose", function(){
            baidu.object.each(handler, function(item, key){
                baidu.event.un(element, key, item);
            });
        });
    }
});
/**
 * Tangram
 * Copyright 2009 Baidu Inc. All rights reserved.
 */






/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.dom.setStyles */

/* IGNORE API: baidu.dom.remove */

/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.dom.insertHTML */

/* IGNORE API: baidu.lang.toArray */

/* IGNORE API: baidu.dom.children */

/* IGNORE API: baidu.object.each */

/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.dom.getAttr */

/* IGNORE API: baidu.dom.setAttr */

 /**
 * 弹出tip层,类似鼠标划过含title属性元素的效果
 * @class
 * @grammar new baidu.ui.Tooltip(options)
 * @param       {Object}          options         选项.
 * @config      {String|Array}    target          目标元素或元素id。可直接设置多个目标元素
 * @config      {String}          type            （可选）触发展开的类型，可以为:hover和click。默认为click
 * @config      {Element}         contentElement  （可选）Tooltip元素的内部HTMLElement。
 * @config      {String}          content         （可选）Tooltip元素的内部HTML String。若target存在title，则以title为准
 * @config      {String}          width           （可选）宽度
 * @config      {String}          height          （可选）高度
 * @config      {Array|Object}    offset          （可选）偏移量。若为数组，索引0为x方向，索引1为y方向；若为Object，键x为x方向，键y为y方向。单位：px，默认值：[0,0]。
 * @config      {boolean}         single          （可选）是否全局单例。若该值为true，则全局共用唯一的浮起tooltip元素，默认为true。
 * @config      {Number}          zIndex          （可选）浮起tooltip层的z-index值，默认为3000。
 * @config      {String}          positionBy      （可选）浮起tooltip层的位置参考，取值['mouse','element']，分别对应针对鼠标位置或者element元素计算偏移，默认mouse
 * @config      {Element}         positionElement （可选）定位元素，设置此元素且positionBy为element时，根据改元素计算位置
 * @config      {Boolean}         autoRender       是否自动渲染。
 * @config      {Function}        onopen          （可选）打开tooltip时触发。
 * @config      {Function}        onclose         （可选）关闭tooltip时触发。
 * @config      {Function}        onbeforeopen    （可选）打开tooltip前触发。
 * @config      {Function}        onbeforeclose   （可选）关闭tooltip前触发。
 * @plugin      click				支持单击隐藏显示
 * @plugin      close				支持关闭按钮
 * @plugin      fx					动画效果
 * @plugin      hover				支持鼠标滑过隐藏显示
 * @return     {baidu.ui.Tooltip}        Tooltip实例
 */

baidu.ui.Tooltip = baidu.ui.createUI(function(options) {
    
    var me = this;
    me.target = me.getTarget();
    me.offset = options.offset || [0, 0];
    me.positionElement = null;

    baidu.ui.Tooltip.showing[me.guid] = me;

}).extend(
/**
 *  @lends baidu.ui.Tooltip.prototype
 */
{
    uiType: 'tooltip',

    width: '',
    height: '',
    zIndex: 3000,
    currentTarget: null,

    type: 'click',

    posable: true,
    positionBy: 'element',
	offsetPosition: 'bottomright',

    isShowing: false,

    tplBody: '<div id="#{id}" class="#{class}"></div>',

    /**
     * 获取Tooltip的HTML字符串
     * @private
     * @return {String} TooltipHtml
     */
    getString: function() {
		var me = this;
		return baidu.format(me.tplBody, {
			id: me.getId(),
			'class' : me.getClass()
		});
	},

    /**
	 * 开关函数,返回false时不显示
     * @private
     */
	toggle: function() {return true},
    
    /**
     * 渲染Tooltip到HTML
     * @public 
     */
    render: function() {
        var me = this,
            main,title;

        main = me.renderMain();

        baidu.each(me.target, function(t,index){
            if((title = baidu.getAttr(t, 'title')) && title != ''){
                baidu.setAttr(t, 'tangram-tooltip-title', title);
                baidu.setAttr(t, 'title', '');
            }
        });
        baidu.dom.insertHTML(main,"beforeend",me.getString());
        me._update();
        me._close();
        
        me.dispatchEvent('onload');
    },

	/**
	 * 打开tooltip
	 * @public
     * @param {HTMLElement} [target] 显示tooltip所参照的html元素
	 */
	open: function(target) {
		var me = this,
            showTooltip = baidu.ui.Tooltip.showing,
            isSingleton = baidu.ui.Tooltip.isSingleton,
            target = target || me.target[0],
            currentTarget = me.currentTarget,
            body = me.getBody();

         //判断是否为当前打开tooltip的target
         //若是，则直接返回
        if(currentTarget === target) return;
        
        //若target为本组中之一，则关闭当前current
        me.isShowing && me.close(currentTarget);

        //查看当前tooltip全局设置,若为单例，关闭当前打开的tooltip
        if(isSingleton){
            baidu.object.each(showTooltip,function(tooltip,key){
                if(key != me.guid && tooltip.isShowing){
                    tooltip.close(); 
                } 
            });
        }

        //若toggle函数返回false，则直接返回
        if (typeof me.toggle == 'function' && !me.toggle()) return;

        me.currentTarget = target;

        me._updateBodyByTitle();
        me._setPosition();
        me.isShowing = true;
        
        //若onbeforeopen事件返回值为false，则直接返回
        if (me.dispatchEvent('onbeforeopen')){
            me.dispatchEvent('open');
            return;
        }
	},

    _updateBody: function(options){
        var me = this,
            options = options || {},
            body = me.getBody(),
            title;

        if(me.contentElement && me.contentElement !== body.firstChild){
            
            //若存在me.content 并且该content和content里面的firstChild不一样
            body.innerHTML = '';
            body.appendChild(me.contentElement);
            me.contentElement = body.firstChild;
        
        }else if(typeof options.contentElement != 'undefined'){
            
            //若options.content存在，则认为用户向对content进行更新
            body.innerHTML = '';
            options.contentElement != null && body.appendChild(options.contentElement);
        
        }
        
        if(!options.contentElement){
            if(typeof options.content == 'string'){

                //若存在options.contentText，则认为用户相对contentText进行更新
                body.innerHTML = '';
                body.innerHTML = options.content;

            }else if(typeof me.content == 'string' && baidu.dom.children(body).length == 0 ) {
                //第一次new Tooltip时传入contentText，进行渲染
                body.innerHTML = me.content;
            }
        }
    },
	
    _updateBodyByTitle:function(){
        var me = this,
            body = me.getBody();
        
        if(!me.contentElement && !me.content && me.currentTarget){
            if((title = baidu.getAttr(me.currentTarget, 'tangram-tooltip-title')) && title != ''){
                body.innerHTML = title;
            }else{
                body.innerHTML = '';
            }
        }

    },

    /**
     * 更新tooltip属性值
     * @private
     * @param {Object} options 属性集合
     */
    _update: function(options){
        var me = this,
            options = options || {},
            main = me.getMain(),
            body = me.getBody();

        me._updateBody(options);
        baidu.object.extend(me, options);
        me.contentElement = baidu.dom.children(body).length > 0 ? body.firstChild : null;
        me._updateBodyByTitle();

        //更新寛高数据
        baidu.dom.setStyles(main, {
            zIndex: me.zIndex,
            width: me.width,
            height: me.height,
            // 防止插件更改display属性,比如fx.
            display: ''
        });
    },
    
    /**
     * 更新options
     * @public
     * @param       {Object}          options         选项.
     * @config      {String|Array}    target          目标元素或元素id。可直接设置多个目标元素
     * @config      {String}          type            （可选）触发展开的类型，可以为:hover和click。默认为click
     * @config      {Element}         contentElement  （可选）Tooltip元素的内部HTMLElement。
     * @config      {String}          content         （可选）Tooltip元素的内部HTML String。若target存在title，则以title为准
     * @config      {String}          width           （可选）宽度
     * @config      {String}          height          （可选）高度
     * @config      {Array|Object}    offset          （可选）偏移量。若为数组，索引0为x方向，索引1为y方向；若为Object，键x为x方向，键y为y方向。单位：px，默认值：[0,0]。
     * @config      {boolean}         single          （可选）是否全局单例。若该值为true，则全局共用唯一的浮起tooltip元素，默认为true。
     * @config      {Number}          zIndex          （可选）浮起tooltip层的z-index值，默认为3000。
     * @config      {String}          positionBy      （可选）浮起tooltip层的位置参考，取值['mouse','element']，分别对应针对鼠标位置或者element元素计算偏移，默认mouse。
     * @config      {Element}         positionElement （可选）定位元素，设置此元素且positionBy为element时，根据改元素计算位置
     * @config      {Boolean}         autoRender       是否自动渲染。
     * @config      {Function}        onopen          （可选）打开tooltip时触发。
     * @config      {Function}        onclose         （可选）关闭tooltip时触发。
     * @config      {Function}        onbeforeopen    （可选）打开tooltip前触发。
     * @config      {Function}        onbeforeclose   （可选）关闭tooltip前触发。
     */
    update: function(options){
        var me = this;
        me._update(options);
        me._setPosition();
        me.dispatchEvent('onupdate');
    },

    /**
     * 设置position
     * @private
     */
	_setPosition: function() {
		var me = this,
            insideScreen = typeof me.insideScreen == 'string' ? me.insideScreen : 'surround',
			positionOptions = {
				once: true,
				offset: me.offset,
				position: me.offsetPosition,
				insideScreen: insideScreen 
			};
		switch (me.positionBy) {
			case 'element':
				me.setPositionByElement(me.positionElement || me.currentTarget, me.getMain(), positionOptions);
				break;
			case 'mouse':
				me.setPositionByMouse(me.getMain(), positionOptions);
				break;
			default :
				break;
		}
	},

	/**
	 * 关闭tooltip
	 * @public
	 */
	close: function() {
		var me = this;

        if(!me.isShowing) return;
        
        me.isShowing = false;
        if(me.dispatchEvent('onbeforeclose')){
            me._close();
            me.dispatchEvent('onclose');
        }
        me.currentTarget = null;
    },


    _close: function() {
        var me = this;
                
        me.getMain().style.left = '-100000px';
    },
	/**
	 * 销毁控件
	 * @public
	 */
	dispose: function() {
		var me = this;
		me.dispatchEvent('ondispose');
		if (me.getMain()) {
			baidu.dom.remove(me.getMain());
		}
        delete(baidu.ui.Tooltip.showing[me.guid]);
		baidu.lang.Class.prototype.dispose.call(me);
	},
    /**
     * 获取target元素
	 * @private
	 */
    getTarget: function() {
        var me = this,
            target = [];
            
        baidu.each(baidu.lang.toArray(me.target),function(item){
            target.push(baidu.G(item));
        });

        return target;
    }
});

baidu.ui.Tooltip.isSingleton = false;
baidu.ui.Tooltip.showing = {};

/* IGNORE API: baidu.event.on */

/* IGNORE API: baidu.event.un */

/* IGNORE API: baidu.event.getTarget */

/* IGNORE API: baidu.dom.getAncestorBy */


/* IGNORE API: baidu.lang.isArray */

/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.array.contains */


/* IGNORE API: baidu.event.stop */

/**
 * 支持单击隐藏显示Tooltip
 * @name  baidu.ui.Tooltip.Tooltip$click
 * @addon baidu.ui.Tooltip
 */
baidu.ui.Tooltip.register(function(me) {
    
    if (me.type == 'click') {

        //onload时绑定显示方法
        me.addEventListener("onload",function(){
            baidu.each(me.target,function(target){
                baidu.on(target, 'click', showFn); 
            });
        });

        //dispose时接触事件绑定
        me.addEventListener("ondispose",function(){
            baidu.each(me.target,function(target){
                baidu.un(target, 'click', showFn); 
            });

            baidu.un(document, 'click', hideFn);
        });

        //tooltip打开时，绑定和解除方法
        me.addEventListener('onopen', function(){
            baidu.un(me.currentTarget, 'click', showFn);
            baidu.on(me.currentTarget, 'click', hideFn);
            baidu.on(document, 'click', hideFn);
        });

        //tooltip隐藏时，绑定和解除方法
        me.addEventListener('onclose', function(){
            
            baidu.on(me.currentTarget, 'click', showFn);
            baidu.un(me.currentTarget, 'click', hideFn);
            baidu.un(document, 'click', hideFn);

        });

        //显示tooltip
        function showFn(e){
            me.open(this);
            
            //停止默认事件及事件传播
            baidu.event.stop(e || window.event);
        }

        //隐藏tooltip
        function hideFn(e){
            var target = baidu.event.getTarget(e || window.event),
                judge = function(el){
                    return me.getBody() == el;
                };
            if(judge(target) || baidu.dom.getAncestorBy(target, judge) || baidu.ui.get(target) == me){
                return;
            }

            me.close();
            //停止默认事件及事件传播
            baidu.event.stop(e || window.event);
        }
    }
});

/* IGNORE API: baidu.string.format */

/* IGNORE API: baidu.dom.insertHTML */


/**
 * 创建关闭按钮
 * @param {String} headContent  内容
 * @name  baidu.ui.Tooltip.Tooltip$close
 * @addon baidu.ui.Tooltip
 */
baidu.ui.Tooltip.extend({
    headContent: '',
    tplhead: '<div class="#{headClass}" id="#{id}">#{headContent}</div>'
});

baidu.ui.Tooltip.register(function(me) {
    me.addEventListener('onload', function() {
        var me = this,
            button;
        
        baidu.dom.insertHTML(me.getBody(), 'afterBegin', baidu.format(me.tplhead, {
            headClass: me.getClass('head'),
            id: me.getId('head')
        }));

        button = new baidu.ui.Button({
            content: me.headContent,
            onclick: function(){
                me.close();
            }
        });
        button.render(me.getId('head'));
    });
});

/* IGNORE API: baidu.dom.g */
/*
 * JavaScript framework: mz
 * Copyright (c) 2010 meizz, http://www.meizz.com/
 *
 * http://www.meizz.com/mz/license/ MIT-style license
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software
 */


/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.dom.show */

/* IGNORE API: baidu.browser.ie */

/* IGNORE API: baidu.object.extend */

/* IGNORE API: baidu.lang.Event */
/**
 * 提供各种公共的动画功能
 * @namespace baidu.fx
 */
baidu.fx = baidu.fx || {} ;


/* IGNORE API: baidu.lang.Event */

/* IGNORE API: baidu.lang.Class */

/* IGNORE API: baidu.lang.inherits */

/* IGNORE API: baidu.object.extend */

/**
 * 提供一个按时间进程的时间线类
 *
 * 本类提供两个方法：
 *  cancel()    取消操作
 *  end()       直接结束
 *
 * 使用本类时需要实现五个接口：
 *  initialize()            用于类初始化时的操作
 *  transition(percent)    重新计算时间线进度曲线
 *  finish()                用于类结束时时的操作
 *  render(schedule)        每个脉冲在DOM上的效果展现
 *  restore()               效果被取消时作的恢复操作
 *
 * @config {Number} interval 脉冲间隔时间（毫秒）
 * @config {Number} duration 时间线总时长（毫秒）
 * @config {Number} percent  时间线进度的百分比
 */
 
 
 
/**
 * 提供一个按时间进程的时间线类
 * @class
 * @grammar new baidu.fx.Timeline(options)
 * @param {Object} options 参数
 * @config {Number} interval 脉冲间隔时间（毫秒）
 * @config {Number} duration 时间线总时长（毫秒）
 * @config {Number} percent  时间线进度的百分比
 */
baidu.fx.Timeline = function(options){
    baidu.lang.Class.call(this);

    this.interval = 16;
    this.duration = 500;
    this.dynamic  = true;

    baidu.object.extend(this, options);
};
baidu.lang.inherits(baidu.fx.Timeline, baidu.lang.Class, "baidu.fx.Timeline").extend({
/**
 *  @lends baidu.fx.Timeline.prototype
 */
    /**
     * 启动时间线
     * @return {instance} 类实例
     */
    launch : function(){
        var me = this;
        me.dispatchEvent("onbeforestart");

        /**
        * initialize()接口，当时间线初始化同步进行的操作
        */
        typeof me.initialize =="function" && me.initialize();

        me["\x06btime"] = new Date().getTime();
        me["\x06etime"] = me["\x06btime"] + (me.dynamic ? me.duration : 0);
        me["\x06pulsed"]();

        return me;
    }

    /**
     * 每个时间脉冲所执行的程序
     * @ignore
     * @private
     */
    ,"\x06pulsed" : function(){
        var me = this;
        var now = new Date().getTime();
        // 当前时间线的进度百分比
        me.percent = (now - me["\x06btime"]) / me.duration;
        me.dispatchEvent("onbeforeupdate");

        // 时间线已经走到终点
        if (now >= me["\x06etime"]){
            typeof me.render == "function" && me.render(me.transition(me.percent = 1));

            // [interface run] finish()接口，时间线结束时对应的操作
            typeof me.finish == "function" && me.finish();

            me.dispatchEvent("onafterfinish");
            me.dispose();
            return;
        }

        /**
        * [interface run] render() 用来实现每个脉冲所要实现的效果
        * @param {Number} schedule 时间线的进度
        */
        typeof me.render == "function" && me.render(me.transition(me.percent));
        me.dispatchEvent("onafterupdate");

        me["\x06timer"] = setTimeout(function(){me["\x06pulsed"]()}, me.interval);
    }
    /**
     * 重新计算 schedule，以产生各种适合需求的进度曲线
     * @function
     * @param {Function} percent 
     */
    ,transition: function(percent) {
        return percent;
    }

    /**
     * 撤销当前时间线的操作，并引发 restore() 接口函数的操作
     * @function
     */
    ,cancel : function() {
        this["\x06timer"] && clearTimeout(this["\x06timer"]);
        this["\x06etime"] = this["\x06btime"];

        // [interface run] restore() 当时间线被撤销时的恢复操作
        typeof this.restore == "function" && this.restore();
        this.dispatchEvent("oncancel");

        this.dispose();
    }

    /**
     * 直接将时间线运行到结束点
     */
    ,end : function() {
        this["\x06timer"] && clearTimeout(this["\x06timer"]);
        this["\x06etime"] = this["\x06btime"];
        this["\x06pulsed"]();
    }
});

/**
 * 效果基类。
 * @function
 * @grammar baidu.fx.collapse(element, options, fxName)
 * @param     {HTMLElement}           element            添加效果的DOM元素
 * @param     {JSON}                  options            时间线的配置参数对象
 * @config    {Function}              transition         function(schedule){return schedule;},时间线函数
 * @config    {Function}              onbeforestart      function(){},//效果开始前执行的回调函数
 * @config    {Function}              onbeforeupdate     function(){},//每次刷新画面之前会调用的回调函数
 * @config    {Function}              onafterupdate      function(){},//每次刷新画面之后会调用的回调函数
 * @config    {Function}              onafterfinish      function(){},//效果结束后会执行的回调函数
 * @config    {Function}              oncancel           function(){},//效果被撤销时的回调函数
 * @param     {String}                fxName             效果名（可选）
 * @return {baidu.fx.Timeline}  时间线类的一个实例
 */
baidu.fx.create = function(element, options, fxName) {
    var timeline = new baidu.fx.Timeline(options);

    timeline.element = element;
    timeline.__type = fxName || timeline.__type;
    timeline["\x06original"] = {};   // 20100708
    var catt = "baidu_current_effect";

    /**
     * 将实例的guid记录到DOM元素上，以便多个效果叠加时的处理
     */
    timeline.addEventListener("onbeforestart", function(){
        var me = this, guid;
        me.attribName = "att_"+ me.__type.replace(/\W/g, "_");
        guid = me.element.getAttribute(catt);
        me.element.setAttribute(catt, (guid||"") +"|"+ me.guid +"|", 0);

        if (!me.overlapping) {
            (guid = me.element.getAttribute(me.attribName)) 
                && window[baidu.guid]._instances[guid].cancel();

            //在DOM元素上记录当前效果的guid
            me.element.setAttribute(me.attribName, me.guid, 0);
        }
    });

    /**
     * 打扫dom元素上的痕迹，删除元素自定义属性
     */
    timeline["\x06clean"] = function(e) {
    	var me = this, guid;
        if (e = me.element) {
            e.removeAttribute(me.attribName);
            guid = e.getAttribute(catt);
            guid = guid.replace("|"+ me.guid +"|", "");
            if (!guid) e.removeAttribute(catt);
            else e.setAttribute(catt, guid, 0);
        }
    };

    /**
     * 在时间线结束时净化对DOM元素的污染
     */
    timeline.addEventListener("oncancel", function() {
        this["\x06clean"]();
        this["\x06restore"]();
    });

    /**
     * 在时间线结束时净化对DOM元素的污染
     */
    timeline.addEventListener("onafterfinish", function() {
        this["\x06clean"]();
        this.restoreAfterFinish && this["\x06restore"]();
    });

    /**
     * 保存原始的CSS属性值 20100708
     */
    timeline.protect = function(key) {
        this["\x06original"][key] = this.element.style[key];
    };

    /**
     * 时间线结束，恢复那些被改过的CSS属性值
     */
    timeline["\x06restore"] = function() {
        var o = this["\x06original"],
            s = this.element.style,
            v;
        for (var i in o) {
            v = o[i];
            if (typeof v == "undefined") continue;

            s[i] = v;    // 还原初始值

            // [TODO] 假如以下语句将来达不到要求时可以使用 cssText 操作
            if (!v && s.removeAttribute) s.removeAttribute(i);    // IE
            else if (!v && s.removeProperty) s.removeProperty(i); // !IE
        }
    };

    return timeline;
};


/**
 * fx 的所有 【属性、方法、接口、事件】 列表
 *
 * property【七个属性】                 默认值 
 *  element             {HTMLElement}           效果作用的DOM元素
 *  interval            {Number}        16      脉冲间隔时间（毫秒）
 *  duration            {Number}        500     时间线总时长（毫秒）
 *  percent             {Number}                时间线进度的百分比
 *  dynamic             {Boolean}       true    是否渐进式动画还是直接显示结果
 *  overlapping         {Boolean}       false   效果是否允许互相叠加
 *  restoreAfterFinish  {Boolean}       false   效果结束后是否打扫战场
 *
 * method【三个方法】
 *  end()       直接结束
 *  cancel()    取消操作
 *  protect()   保存元素原始的CSS属性值，以便自动 restore 操作
 *
 * event【四个事件】
 *  onbeforestart()
 *  onbeforeupdate()
 *  onafterupdate()
 *  onafterfinish()
 *
 * interface【五个接口】
 *  initialize()            用于类初始化时的操作
 *  transition(percent)     重新计算时间线进度曲线
 *  finish()                用于类结束时时的操作
 *  restore()               效果结束后的恢复操作
 *  render(schedule)        每个脉冲在DOM上的效果展现
 */


 
/**
 * 控制元素的透明度 渐变
 * @function
 * @grammar baidu.fx.opacity(element, options)
 * @param       {String|Object}           element               元素或者元素的ID
 * @param       {Object}                  options               选项。参数的详细说明如下表所示
 * @config      {Number}                  from                  0,//效果起始值。介于0到1之间的一个数字，默认为0。
 * @config      {Number}                  to                    1,//效果结束值。介于0到1之间的一个数字，默认为1。
 * @config      {Number}                  duration              500,//效果持续时间，默认值为500ms。
 * @config      {Number}                  interval              16, //动画帧间隔时间，默认值为16ms。
 * @config      {Function}                transition            function(schedule){return schedule;},时间线函数
 * @config      {Function}                onbeforestart         function(){},//效果开始前执行的回调函数
 * @config      {Function}                onbeforeupdate        function(){},//每次刷新画面之前会调用的回调函数
 * @config      {Function}                onafterupdate         function(){},//每次刷新画面之后会调用的回调函数
 * @config      {Function}                onafterfinish         function(){},//效果结束后会执行的回调函数
 * @config      {Function}                oncancel              function(){},//效果被撤销时的回调函数
 */

baidu.fx.opacity = function(element, options) {
    if (!(element = baidu.dom.g(element))) return null;

    options = baidu.object.extend({from: 0,to: 1}, options||{});

    var e = element;

    var fx = baidu.fx.create(e, baidu.object.extend({
        //[Implement Interface] initialize
        initialize : function() {
            baidu.dom.show(element);

            if (baidu.browser.ie) {
                this.protect("filter");
            } else {
                this.protect("opacity");
                this.protect("KHTMLOpacity");
            }

            this.distance = this.to - this.from;
        }

        //[Implement Interface] render
        ,render : function(schedule) {
            var n = this.distance * schedule + this.from;

            if(!baidu.browser.ie) {
                e.style.opacity = n;
                e.style.KHTMLOpacity = n;
            } else {
                e.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity:"+
                    Math.floor(n * 100) +")";
            }
        }
    }, options), "baidu.fx.opacity");

    return fx.launch();
};


 
/**
 * 渐现渐变效果。注意，如果元素的visibility属性如果为hidden，效果将表现不出来。
 * @function
 * @grammar baidu.fx.fadeIn(element, options)
 * @param      {string|HTMLElement}     element            元素或者元素的ID
 * @param      {Object}                 options            选项。参数的详细说明如下表所示
 * @config     {Number}                 duration           500,//效果持续时间，默认值为500ms
 * @config     {Number}                 interval           16, //动画帧间隔时间，默认值为16ms
 * @config     {Function}               transition         function(schedule){return schedule;},时间线函数
 * @config     {Function}               onbeforestart      function(){},//效果开始前执行的回调函数
 * @config     {Function}               onbeforeupdate     function(){},//每次刷新画面之前会调用的回调函数
 * @config     {Function}               onafterupdate      function(){},//每次刷新画面之后会调用的回调函数
 * @config     {Function}               onafterfinish      function(){},//效果结束后会执行的回调函数
 * @config     {Function}               oncancel           function(){},//效果被撤销时的回调函数
 * @see baidu.fx.fadeOut
 */

baidu.fx.fadeIn = function(element, options) {
    if (!(element = baidu.dom.g(element))) return null;

    var fx = baidu.fx.opacity(element,
        baidu.object.extend({from:0, to:1, restoreAfterFinish:true}, options||{})
    );
    fx.__type = "baidu.fx.fadeIn";

    return fx;
};

/* IGNORE API: baidu.dom.g */

/* IGNORE API: baidu.dom.hide */


 
/**
 * 渐隐渐变效果，效果执行结束后会将元素完全隐藏起来。
 * @function
 * @grammar baidu.fx.fadeOut(element, options)
 * @param {string|HTMLElement} element 元素或者元素的ID
 * @param {Object} options 选项。参数的详细说明如下表所示
 * @config     {Number}                 duration           500,//效果持续时间，默认值为500ms
 * @config     {Number}                 interval           16, //动画帧间隔时间，默认值为16ms
 * @config     {Function}               transition         function(schedule){return schedule;},时间线函数
 * @config     {Function}               onbeforestart      function(){},//效果开始前执行的回调函数
 * @config     {Function}               onbeforeupdate     function(){},//每次刷新画面之前会调用的回调函数
 * @config     {Function}               onafterupdate      function(){},//每次刷新画面之后会调用的回调函数
 * @config     {Function}               onafterfinish      function(){},//效果结束后会执行的回调函数
 * @config     {Function}               oncancel           function(){},//效果被撤销时的回调函数
 * @see baidu.fx.fadeIn
 * @remark
 * 1.0.0开始支持
 */
baidu.fx.fadeOut = function(element, options) {
    if (!(element = baidu.dom.g(element))) return null;

    var fx = baidu.fx.opacity(element,
        baidu.object.extend({from:1, to:0, restoreAfterFinish:true}, options||{})
    );
    fx.addEventListener("onafterfinish", function(){baidu.dom.hide(this.element);});
    fx.__type = "baidu.fx.fadeOut";

    return fx;
};



/* IGNORE API: baidu.dom.g */

/**
 * 为Tooltip添加动画效果支持
 * @name  baidu.ui.Tooltip.Tooltip$fx
 * @addon baidu.ui.Tooltip
 */

baidu.ui.Tooltip.extend({
	//是否使用效果,默认开启
	enableFx: true,
	//显示效果,默认是fadeIn
	showFx: baidu.fx.fadeIn,
	showFxOptions: {duration: 500},
	//消失效果,默认是fadeOut
	hideFx: baidu.fx.fadeOut,
	hideFxOptions: {duration: 500}
});


baidu.ui.Tooltip.register(function(me) {
	if (me.enableFx) {
	
        var fxHandle = null;

        //TODO:fx目前不支持事件队列，此处打补丁解决
        //等fx升级后更新
        me.addEventListener('beforeopen', function(e) {
	        me.dispatchEvent('onopen');
            'function' == typeof me.showFx && me.showFx(me.getMain(), me.showFxOptions);
            e.returnValue = false;
	    });
		
        me.addEventListener('beforeclose', function(e) {
	        me.dispatchEvent('onclose');
            
            fxHandle = me.hideFx(me.getMain(), me.hideFxOptions);
            fxHandle.addEventListener('onafterfinish', function() {
	              me._close();
	        });
	        e.returnValue = false;
		});

        me.addEventListener('ondispose', function(){
            fxHandle && fxHandle.end(); 
        });
	}
});

/* IGNORE API: baidu.event._eventFilter.mouseenter */

/* IGNORE API: baidu.event._eventFilter.mouseleave */

/* IGNORE API: baidu.event.getTarget */

/* IGNORE API: baidu.dom.getAncestorBy */

/* IGNORE API: baidu.lang.isArray */

/* IGNORE API: baidu.array.each */

/* IGNORE API: baidu.event.stop */
/**
 * 支持鼠标滑过隐藏显示
 * @name  baidu.ui.Tooltip.Tooltip$hover
 * @addon baidu.ui.Tooltip
 */
baidu.ui.Tooltip.extend({
    hideDelay: 500
});

baidu.ui.Tooltip.register(function(me) {
    
    if (me.type != 'hover') {return;}//断言句式

    var hideHandle = null,
        mouseInContainer = false;//用标识鼠标是否落在Tooltip容器内

    //onload时绑定显示方法
    me.addEventListener("onload", function(){
        baidu.each(me.target,function(target){
            me.on(target, 'mouseenter', showFn);
            me.on(target, 'mouseleave', hideFn);
        });
        me.on(me.getBody(), 'mouseover', setMouseInContainer);
        me.on(me.getBody(), 'mouseout', setMouseInContainer);
    });
    
    //用于设置鼠标在移入和移出Tooltip-body时标识状态
    function setMouseInContainer(evt){
        mouseInContainer = (evt.type.toLowerCase() == 'mouseover');
        !mouseInContainer && hideFn(evt);
    }
    
    //显示tooltip
    function showFn(e){
        hideHandle && clearTimeout(hideHandle);
        me.open(this);
    }

    //隐藏tooltip
    function hideFn(e){
        hideHandle = setTimeout(function(){
            !mouseInContainer && me.close();
        }, me.hideDelay);
    }
});
;T.undope=true;
/**
 *  niut: noah ui 
 *  @author :noah fe team
 */
var nuit= nuit || (nuit ={});

/*
 *  nuit.tab.js : nuit tab 
 */
nuit.Tab || (nuit.Tab=baidu.ui.createUI(function(opt){
    if(opt.element){
        this.element=baidu.g(opt.element);
        this.render(this.element);
    }
}).extend({
    items:[],
    uiType:"nuit-tab",
    classPrefix:"nuit-tab",
	speed:50,
	maxCharacters:15,// 最多显示15个字符
	_initUL:'<div class="wrapper"><ul class="clearfix"></ul></div>',
    render:function(element){
		
        var me = this,ul=baidu.dom.query("ul",me.element)[0];
		
        (!baidu.dom.hasClass(me.element,"nuit-tab")) && (baidu.dom.addClass(me.element,"nuit-tab"));
        if(!ul){//没有ul子节点，添加
            baidu.dom.empty(me.element);
            me.element.innerHTML=me._initUL;
            ul=baidu.dom.query("ul",me.element)[0];
        }
		me.head = T.dom.getParent(T.dom.query('ul',me.element)[0]);
        baidu.event.on(ul,"click",function(e){
            var srcEl  = e.originalTarget||e.srcElement,tn=srcEl.tagName.toLowerCase(),tabIndex=-1,oli=null,siblings=null;
            if(tn=="a" || tn=="b"){//switch or remove
                oli = srcEl.parentNode; 
                siblings= baidu.dom.query(">li",oli.parentNode);
                for(var i =0,l=siblings.length;i<l;i++){
                    if(oli==siblings[i]){
                        tabIndex = i;
                        break;
                    }
                } 
                if(tabIndex!=-1){
                    me[{"a":"switchTab","b":"removeTab"}[tn]](tabIndex);
                }
            } 
        });
        baidu.event.on(me.element,"click",function(e){
            var srcEl  = e.originalTarget||e.srcElement;
            if(baidu.dom.hasClass(srcEl,"scroller")){
                me._scroll(srcEl);
            }
        });
        //添加js定义的标签
        baidu.array.each(me.items,function(tab){
            me.addTab(tab);
        });
        me.dispatchEvent("load");
    },
    /*
    *   getTabLength:获取tab个数
    */
    getTabLength:function(){
		
        return baidu.dom.query(">ul>li",this.head).length;
    },
    /**
    *   getActiveIndex:获取当前激活的tab的序号
    */
    getActiveIndex:function(){
        var me=this,activeIndex = -1,tabs=baidu.dom.query(">ul>li",me.head);
		
        for(var i=0,l=tabs.length;i<l;i++){
            var tab= tabs[i];
            if(tab.className.indexOf("active")!=-1){
                activeIndex = i;
                break;
            }
        }
        return activeIndex; 
    },
    /*
    *   switchTab:切换Tab
    */
    switchTab:function(tabIndex){
        var me = this,activeIndex = me.getActiveIndex(),tabhead=null,tabbody=null,heads=baidu.dom.query(">ul>li:eq("+tabIndex+")",me.head);
        if(heads.length==0) return false;
        if(tabIndex==activeIndex) return false;
        tabhead= heads[0];
		//tabIndex = tabIndex + 1;
        tabbody= baidu.dom.query(">div:eq("+(tabIndex+1)+")",me.element)[0];
		
		if(!me.dispatchEvent("beforeswitch",{tabhead:tabhead,tabIndex:tabIndex,tabbody:tabbody,activeIndex:activeIndex})) return false; 
        baidu.array.each(baidu.dom.query("ul>li",me.element),function(oli){
            if(oli==tabhead){
                baidu.dom.addClass(oli,"active");
            }else{
                baidu.dom.removeClass(oli,"active");
            }
        });
        baidu.array.each(baidu.dom.query(">div",me.element),function(odiv){
            if(odiv==tabbody){
                baidu.dom.addClass(odiv,"active");
            }else{
                baidu.dom.removeClass(odiv,"active");
            }
        });
        me.dispatchEvent("switch",{tabhead:tabhead,tabIndex:tabIndex,tabbody:tabbody,activeIndex:activeIndex}); 
        return true;
    },
    /*
    *   removeTab:删除Tab  
    */
    removeTab:function(tabIndex){
        var me = this,activeIndex = me.getActiveIndex(),tabhead=null,tabbody=null,heads=baidu.dom.query(">ul>li:eq("+tabIndex+")",me.head);
        if(!heads.length) return false;
        tabhead= heads[0];
        tabbody= baidu.dom.query(">div:eq("+(tabIndex+1)+")",me.element)[0];
        if(!me.dispatchEvent("beforeremove",{tabhead:tabhead,tabIndex:tabIndex,tabbody:tabbody})) return false; 
        baidu.dom.remove(tabhead);
        baidu.dom.remove(tabbody);
        if(activeIndex==tabIndex){//善蹴当前激活页签，激活第一个页签
            me.switchTab(0);
        }
        me.resize();
        me.dispatchEvent("remove",{tabIndex:tabIndex}); 
    },
    /**
    *   addTab:添加页签
    *   id属性非必须，可以通过getTabIndexById()获取tab序号index
    *   新增页签时会检查id是否重复，重复标签id不能添加(addTab返回false)，id未设置不做该检查
    *   @param tab:
    *   形如{head:"页签标题",body:"页签内容",closable:是否可以关闭,active:初始是否激活,id:tab唯一id}
    *   @param beforeIndex 在beforeIndex下表的页签前面插入，可空，默认追加到最后
    */
    addTab:function(tab,beforeIndex){
        var me = this,ul=baidu.dom.query("ul",me.element)[0],newhead=document.createElement("li"),newbody=document.createElement("div"),heads=ul?baidu.dom.query(">li",ul):[];  
        if(!ul){//没有ul子节点，添加
			baidu.dom.empty(me.element);
            me.element.innerHTML=me._initUL;
            ul=baidu.dom.query("ul",me.element)[0]
        }
		me.head = T.dom.getParent(T.dom.query('ul',me.element)[0]);
		
        //检查是否已经存在相同tabid,如果存在相同的，激活页签
        if(typeof(tab.id)!="undefined"){
            var i=me.getTabIndexById(tab.id)
            if(i!=-1){
                me.switchTab(i);
                return false;
            }
        }
        if(typeof(tab.id)!="undefined"){
            newhead.setAttribute("data-tabid",tab.id);
        }
        beforeIndex = typeof(beforeIndex)=="undefined"?(heads.length):parseInt(beforeIndex,10);
		
        newhead.innerHTML=("<a href='javascript:void(0)'>"+(tab.head||"&nbsp;")+"</a>"+(tab.closable?"<b>☒</b>":""));
        newhead.className=(tab.closable?"closable":"");
        newbody.innerHTML=(tab.body||"");
        if(beforeIndex==heads.length){
            ul.appendChild(newhead);
            me.element.appendChild(newbody);
        }else{
            ul.insertBefore(newhead,heads[beforeIndex]);
			
            me.element.insertBefore(newbody,baidu.dom.query(">div:eq("+(beforeIndex + 1)+")",me.element)[0]);
        }
		me.resize();
        if(tab.active){
            me.switchTab(beforeIndex);
        } 
        
        me.dispatchEvent("add",{newhead:newhead,newbody:newbody});
    },
    /*
    *   getTabIndexById: 根据tabId获取tabIndex,不存在返回-1
    */
    getTabIndexById:function(tabId){
        var me = this,tabIndex=-1;
        baidu.array.each(baidu.dom.query(">ul>li",me.head),function(head,i){
            if(head.getAttribute("data-tabid")==tabId){
                tabIndex=i;
                return false;
            }
        });
        return tabIndex;
    },
	
	_getHeaderInfo:function(){
		var me=this,oUL = baidu.dom.query(">ul",me.head)[0];
		var ml = T.dom.getStyle(oUL,'margin-left');
			ml = parseInt(ml,10);
		var headers = T.dom.query("li",oUL);
		var width = 0;
		
		T.array.each(headers,function(item,i){
			
			width += item.offsetWidth+parseInt(T.dom.getStyle(item,'margin-left'))+parseInt(T.dom.getStyle(item,'margin-right'));//parseInt(T.dom.getStyle(item,'width'));//item.offsetWidth; //offsetWidth 引发DOM元素的repaint操作
		});
		var headerWidth = me.head.offsetWidth - me._getScrollWidth();
		return {
			headerWidth:headerWidth,
			width:width,
			ml:ml
		}
	},
	_getScrollWidth:function(){
		var me = this,sLeft = baidu.dom.query(">.scroller-left",me.element)[0],sRight=baidu.dom.query(">.scroller-right",me.element)[0];
		if(sLeft){
			return sLeft.offsetWidth + sRight.offsetWidth;
		}
		return 0;
	},
    /*
    *   resize:计算< > 是否显示
    */
    resize:function(){
       var me=this,isOverFlow=false,scrollerAdded=false,oUL = baidu.dom.query(">ul",me.head)[0],heads=[],activeIndex=me.getActiveIndex();
	   
        if(!oUL) return ;
        heads= baidu.dom.query(">li",oUL);
        if(heads.length==0) return ;
		var info = me._getHeaderInfo();
		
		var width = info.width,headerWidth=info.headerWidth,ml=info.ml;
		if(width > headerWidth ){
			scrollerAdded  = baidu.dom.query(">.scroller",me.element).length>0; 
            if(!scrollerAdded){//加scroller DOM节点
                var scrollerLeft = baidu.dom.create("a",{"class":"scroller scroller-left","href":"javascript:void(0)"}),
                    scrollerRight = baidu.dom.create("a",{"class":"scroller scroller-right","href":"javascript:void(0)"});
                scrollerLeft.innerHTML="<";
                scrollerRight.innerHTML=">";
               
                me.element.insertBefore(scrollerLeft,me.element.childNodes[0]);
                me.element.insertBefore(scrollerRight,me.element.childNodes[0]);
				
            }
			if(!T.dom.hasClass(me.element,"nuit-tab-scroll")){
				baidu.dom.addClass(me.element,"nuit-tab-scroll");				
				headerWidth = me._getHeaderInfo().headerWidth;
			}
			
			var wl = width - headerWidth;
			T.dom.setStyle(oUL,'margin-left',-1*wl);
			
			var sRight = baidu.dom.query(">.scroller-right",me.element)[0],sLeft = baidu.dom.query(">.scroller-left",me.element)[0];
			baidu.dom.addClass(sRight,"scroller-disabled");
			baidu.dom.removeClass(sLeft,"scroller-disabled");
			}else{
				
				baidu.dom.removeClass(me.element,"nuit-tab-scroll");
				T.dom.setStyle(oUL,'margin-left',0);
		    }
    },
    _scroll:function(scroller){
        var me=this,left=baidu.dom.hasClass(scroller,"scroller-left"),heads=baidu.dom.query(">ul>li",me.head),
            sLeft = baidu.dom.query(">.scroller-left",me.element)[0],sRight=baidu.dom.query(">.scroller-right",me.element)[0],activeIndex=me.getActiveIndex();
        if(baidu.dom.hasClass(scroller,"scroller-disabled")) return ;
		var oUL = baidu.dom.query(">ul",me.head)[0];
		var info = me._getHeaderInfo();
		var ml = info.ml,headerWidth=info.headerWidth,width=info.width;
		if(left){			
			if(ml + me.speed < 0){
				T.dom.setStyle(oUL,"margin-left",ml+me.speed);
			}else{
				T.dom.setStyle(oUL,"margin-left",0);
				
			}
		
		}else{
			
			if(width+ml-me.speed < headerWidth){
				T.dom.setStyle(oUL,"margin-left",headerWidth - (width + ml));
							
			}else{
				T.dom.setStyle(oUL,"margin-left",ml- me.speed);		
			}
		}
		info = me._getHeaderInfo();
		ml = info.ml,headerWidth=info.headerWidth,width=info.width;
		
		if(ml < 0){
			baidu.dom.removeClass(sLeft,"scroller-disabled");
		}else{
			baidu.dom.addClass(sLeft,"scroller-disabled");
		}
		
		if(width+ml > headerWidth ){
			baidu.dom.removeClass(sRight,"scroller-disabled");
		}else{
			baidu.dom.addClass(sRight,"scroller-disabled");
		}
        
    },
    /**
     * 销毁实例的析构
     */
    dispose: function(){
        var me = this;
        me.dispatchEvent('ondispose');
        baidu.dom.remove(me.getMain());
        baidu.lang.Class.prototype.dispose.call(me);
    }
}));

/*
 * Grid,based on Tangram lib
 * Tangram Grid is the Grid you need!
 * @author yanghengfeng
 * @param	{Object}	options选项
 * @config	{String}	element ID或者DOM
 * @config	{Number}	height 控件的高度
 * @config	{Boolean}	autoHeight 自动高度 默认为false，如果autoHeight==true 内容<=height 高度设置为height。内容>height 使用内容height
 * @config	{String}	docktop 表格上部固定内容，计算表格高度会加上该元素的高度
 * @config	{Array}		columns 列模型 格时形如 [｛field:'NAME',header:"姓名",width:300,fix:true,type:'checkbox'/function｝]
 * @config	{Function}	onRowClick 行点击事件 参数为 ｛rowIndex:rowIndex,row:rowdata｝
 * @config	{Function}	onRowDblClick 行双击点击事件 参数为 ｛rowIndex:rowIndex,row:rowdata｝
 * @config	{Function}	onCellClick 单元格点击 参数为  ｛columnIndex:columnIndex,refIndex:refIndex,rowIndex:rowIndex,resizable:true,sortable:true｝
 * @config	{Function}	onSelect 单元格选择触发 参数为｛rowIndex:rowIndex,row:rowdata｝
 * @config	{Function}	onUnSelect 单元格取消选择触发 参数为｛rowIndex:rowIndex,row:rowdata｝
 * @config	{Number}	selectMode 行选择模式:0 不选择,1 单行选择,2 多行选择，默认为0
 * @config	{String|Function}	selectBy 初始选中是否选中字段或者判断函数，如果是字段名，则判断该字段是否为true/1，如果是函数，函数接收参数{rowdata:rowdata,rowIndex:rowIndex}
 * @config	{Boolean}	strip 隔行变色效果 默认为true
 * @config	{Boolean}	hoverhighlight hover是否高亮行，默认是true
 * @config	{Boolean|Object|String}	page===false：不分页，否则为分页参数 分页参数默认为｛perPage:10,pagenumbers:[10,20,50,100],curPage:1,pages:0,from:0,to:0,total:0,tools:"自定义分页中间的工具html"} 如果page是字符串，则作为自定分页控件的容器
 * @config	{String}	url	ajax请求url
 * @config	{Object}	ajaxOption	ajax请求参数
 * @config	{Function}	onBeforeRequest ajax请求前执行方法
 * @config	{Function}	onBeforeLoad 数据加载前执行方法(ajax请求回调)
 * @config	{Function}	onAfterLoad 数据加载后执行方法
 * @config	{String}	orderBy 初始排序字段
 * @config	{String}	order 初始排序类型desc /asc
 * @config	{Function}	onBeforeSort排序前执行方法参数为｛orderBy:"字段",order:"asc/desc"｝
 * @config	{Boolean}	loadMask，ajax请求是否显示遮罩
 * @config	{String}	loadMessage，遮罩时提示文本,默认为"正在加载..."
 */
baidu.ui.Grid = baidu.ui.createUI(function(opt){
	opt.autoRender=true;
	this.element= baidu.g(opt.element);
}).extend({
	uiType: "grid",
	
	/**
	 * 设置宽度和高度
	 * @param {Object} o ｛width:w,height:h} w可以是数字和"auto" h 只能是数字 
	 */
	setSize:function(o){
		if (o && o.width) { 
			if(isNaN(o.width)){
				baidu.dom.setStyle(this.element,"width",o.width);
			}else{
				baidu.dom.setStyle(this.element,"width",o.width);
			}
		}
		if (o && o.height) { 
			this._setHeight(o.height);
		}else{
			this._setHeight(this.height);
		}
		this._fixColWidth();
		this._sizeScroller();
		this.dispatchEvent("resize",{});
	},
	/**
	 * 调整grid的大小
	 */
	resize:function(){
		this.setSize();
	},
	/**
	 * 计算自适应列的宽度
	 */
	_fixColWidth:function(){
		var g= this,fixColIndex=g.fixColIndex,
			t=baidu.dom.query(".gridtable",g.ref.gbody),
			y=parseInt(baidu.dom.getStyle(g.ref.gbody.parentNode,"height"),10)||g.ref.gbody.parentNode.clientHeight,
			s=g.ref.gheader.style,fixcol=null,
			hdContentWidth = g.ref.gheader.parentNode.offsetWidth-parseInt(baidu.dom.getStyle(g.ref.gheader,"border-left-width"),10)-parseInt(baidu.dom.getStyle(g.ref.gheader,"border-right-width"),10),
		w=hdContentWidth;
		if(fixColIndex!=-1){
			var t = baidu.dom.query(".gridtable",g.ref.gbody);
			for (i = 0, l = g.ref.ghcells.length; i < l; i++) {
				var c=g.ref.ghcells[i],refcol=c.getAttribute("refcol"); 
				if ((!g.columns[refcol].fix) || (!refcol)) {
					w -= c.offsetWidth;
				}else{
					fixcol= c;
				}
			}
			if (fixcol && w>20) {
				w= w- parseInt(baidu.dom.getStyle(fixcol,"border-left-width"),10)- parseInt(baidu.dom.getStyle(fixcol,"border-right-width"),10);
				if (t.length > 0 && t[0].offsetHeight > y && (!g.autoHeight)) {
					w=w-17;
				}
				baidu.dom.setBorderBoxWidth(fixcol,w);
				g.columns[g.fixColIndex].width = w;
				if(g.ref.gbody){
					var fixbodycell = baidu.dom.query("[refcol="+g.fixColIndex+"]",g.ref.gbody);
					baidu.array.each(fixbodycell,function (c){
						baidu.dom.setBorderBoxWidth(fixbodycell[0],w);
					});
				}
			}
		}
	},
	/**
	 * 根据表格数据内容计算横向/纵向滚动条的位置和大小
	 */
	_sizeScroller:function(){
		var g =this,t=baidu.dom.query(".gridtable",g.ref.gbody);
		//set the top of yscroller
		g.ref.yscroller.style.top=g.ref.gheader.offsetHeight+"px";
		if(t.length>0 && g.ref.gbody){
			t[0].style.width=g.ref.gheader.childNodes[0].clientWidth+"px";
			var t=t[0],tHeight=t.offsetHeight,tWidth=t.offsetWidth,bodySibings = g.ref.gbody.parentNode.childNodes,
			y=parseInt(baidu.dom.getStyle(g.ref.gbody.parentNode,"height"),10)||g.ref.gbody.parentNode.clientHeight,
			s=g.ref.gheader.style,
			x=g.ref.gheader.parentNode.offsetWidth-parseInt(baidu.dom.getStyle(g.ref.gheader,"border-left-width"),10)-parseInt(baidu.dom.getStyle(g.ref.gheader,"border-right-width"),10);
			for(var i = 0,l=bodySibings.length;i<l;i++){
				if( (baidu.dom.getStyle(bodySibings[i],"position")=="static" || baidu.dom.getStyle(bodySibings[i],"position")=="relative") && bodySibings[i]!=g.ref.gbody){
					y-=bodySibings[i].offsetHeight;
				}
			}
			var xOverFlow=x<tWidth,
			yOverFlow=y<tHeight;
			
			g.ref.xscroller.style.display=(xOverFlow?"block":"none");
			g.ref.yscroller.style.display=(yOverFlow?"block":"none");
			g.ref.rbcorner.style.display=((xOverFlow && yOverFlow)?"block":"none");
			
			baidu.dom.setStyle(g.ref.xscroller,"width",(yOverFlow?(x-17):x));
			baidu.dom.setStyle(g.ref.xstrecher,"width",tWidth);
			
			baidu.dom.setStyle(g.ref.yscroller,"height",(xOverFlow?(y-17):y));
			baidu.dom.setStyle(g.ref.ystrecher,"height",tHeight);
			
			baidu.dom.setStyle(g.ref.gbody,"width",(yOverFlow?(x-17):x));
			baidu.dom.setStyle(g.ref.gbody,"height",(xOverFlow?(y-17):y));
			
			g.ref.xscroller.scrollLeft=0;
			g.ref.yscroller.scrollTop=0;
			if(g.ref.gbody.childNodes.length>0)g.ref.gbody.childNodes[0].style.marginLeft="0px";
			g.ref.gheader.childNodes[0].style.marginLeft="0px";
			t.style.marginBottom="0px";
			if(g.autoHeight){
				var gridcontainer = baidu.dom.query("> .tangramgridcontainer",g.element);
				//如果autoHeight==true 内容<=height 高度设置为height。内容>height 使用内容height
				if(yOverFlow){
					g.ref.xscroller.style.display=(xOverFlow?"block":"none");
					g.ref.yscroller.style.display="none";
					g.ref.rbcorner.style.display="none";
					
					baidu.dom.setStyle(g.ref.xscroller,"width",x);
					baidu.dom.setStyle(g.ref.xstrecher,"width",tWidth);
					
					
					baidu.dom.setStyle(g.ref.gbody,"width",x);
					baidu.dom.setStyle(g.ref.gbody,"height","auto");
					
					if(gridcontainer.length) baidu.dom.setStyle(gridcontainer[0],"height","auto");
					
					
				}
				if(xOverFlow){
					t.style.marginBottom="17px";
					baidu.dom.setStyle(g.ref.gbody,"height","auto");
				}
				var h =0,nodes = g.element.childNodes;
				for(var i = 0,l=nodes.length;i<l;i++){
					if( (baidu.dom.getStyle(nodes[i],"position")=="static" || baidu.dom.getStyle(nodes[i],"position")=="relative")){
						h+=nodes[i].offsetHeight;
					}
				}
				baidu.dom.setStyle(g.element,"height",h);
			}
		}
	},
	/**
	 * 绑定滚动条事件
	 */
	_bindScroller:function(){
		var g=this;
		function scrolllX(){
			var l = this.scrollLeft;
			g.ref.gbody.childNodes[0].style.marginLeft="-"+l+"px";
			g.ref.gheader.childNodes[0].style.marginLeft="-"+l+"px";
		}
		function scrollY(){
			var t = this.scrollTop;
			g.ref.gbody.scrollTop=t;
		}
		baidu.event.on(g.ref.xscroller,"scroll",scrolllX);
		baidu.event.on(g.ref.yscroller,"scroll",scrollY);
		//scroll when mouse wheel
		function wheel(ev){
			var delta = ev.wheelDelta ? (ev.wheelDelta / 120) : (- ev.detail / 3); 
			g.ref.yscroller.scrollTop= g.ref.yscroller.scrollTop-(delta*20);
			g.ref.gbody.scrollTop=g.ref.yscroller.scrollTop;
		}
		if(!baidu.browser.isGecko){
			baidu.event.on(g.ref.gbody,"mousewheel",wheel);
		}else{//FireFox 
			baidu.event.on(g.ref.gbody,"DOMMouseScroll",wheel);
		}
	},
	/**
	 * 设置高度
	 * @param {Number} h 高度
	 */
	_setHeight:function(h){
		var g = this;
		g.height=h;
		g.element.style.height=h+"px";
		var boxes= g.element.childNodes,
			gridcontainer = baidu.dom.query(".tangramgridcontainer",g.element)[0],
			nodes = gridcontainer.childNodes;
		for (var i = 0, l = boxes.length; i < l; i++) {
			if (boxes[i] != gridcontainer && (baidu.dom.getStyle(boxes[i], "position") == "static" || baidu.dom.getStyle(boxes[i], "position") == "relative")) {
				h -= boxes[i].offsetHeight;
			}
		}
		baidu.dom.setBorderBoxHeight(gridcontainer,h);
		for (var i = 0, l = nodes.length; i < l; i++) {
			if ( (baidu.dom.getStyle(nodes[i], "position") == "static" || baidu.dom.getStyle(nodes[i], "position") == "relative") && nodes[i] != g.ref.gbody) {
				h -= nodes[i].offsetHeight;
			}
		}
		baidu.dom.setBorderBoxHeight(g.ref.gbody,h);
		
	},
	/**
	 * 显示遮罩层
	 */
	showMask:function(){
		var g=this, mask= baidu.dom.query("> .gridloadmask",g.element),maskmessage=  baidu.dom.query("> .gridloadmessge",g.element);
		if (mask.length) {
			mask[0].style.height=g.element.clientHeight+"px";
			mask[0].style.display = "block";
		}
		if(maskmessage.length) maskmessage[0].style.display="block";
		
	},
	/**
	 * 隐藏遮罩层
	 */
	hideMask:function(){
		var g=this, mask= baidu.dom.query("> .gridloadmask",g.element),maskmessage=  baidu.dom.query("> .gridloadmessge",g.element);
		if (mask.length)  mask[0].style.display="none";
		if(maskmessage.length) maskmessage[0].style.display="none";
	},
	/**
	 * ajax加载加载数据
	 * @param {Object} param 传递的额外参数可以是string 也可以是｛key:value}
	 */
	request:function(param){
		var g=this,opt= g.ajaxOption||{},data=opt.data||"",param= param||{},orderBy=g.orderBy||"",ordercol=g._getCol(orderBy);
		if(baidu.lang.isString(param)) param = baidu.url.queryToJson(param);
		data = baidu.url.queryToJson(data);
		//grid param
		data.curPage = g.page.curPage;
		data.perPage = g.page.perPage;
		(ordercol && ordercol.field) && (data.orderBy =ordercol.field);
		data.order=g.order||"";
		
		data=baidu.object.extend(data,param);
		opt.onsuccess=function(xhr,result){
			if(g.loadMask){
				g.hideMask();
			}
			var ajaxResult = baidu.json.parse(result);
			g.dispatchEvent("datafilter",ajaxResult);//datafilter
			g.loadData(ajaxResult);
		}
		if(g.page===false){
			delete data.curPage;
			delete data.perPage;
		}
		opt.data=data;
		//function onBeforeRequest can change request option
		if(!g.dispatchEvent("beforerequest",opt)){return ;}
		if(typeof(g.onBeforeRequest)=="function"  && g.onBeforeRequest({},opt)===false ) {return;}
		
		opt.data = baidu.url.jsonToQuery(opt.data,function(a){return a;});//不转义特殊字符
		g.ajaxOption=opt;//remember the ajaxOption.data
		g.page.curPage = data.curPage;//remember current page
		//g.orderBy=data.orderBy;
		//g.order=data.order;
		
		if(g.loadMask){
			g.showMask();
		}
		if(g.url)baidu.ajax.request(g.url,opt);
	},
	/**
	 * 加载数据
	 * @param {Object} data
	 */
	loadData:function(data){
		var g=this;
		if(!g.dispatchEvent("beforeload",data)){return ;}
		if(typeof(g.onBeforeLoad)=="function") g.onBeforeLoad({},data);
		var rows=data.data.list||[],arr=[" border='0' cellspacing='0' cellpadding='0' ><tbody>"],cols = g.columns,realColumnsLength=0;
		g.data=data;
		g.selectedRows=[];//clear selections
				
		
		arr.push("<tr>");
		for(var j=0,ll=cols.length;j<ll;j++){
			var col= cols[j],w=col.width;
			if (!col.columns) {
				arr.push("<td refcol='" + j + "' style='width:" + w + "px;height:0px; border-bottom-width:0px;" + (col.hide ? "display:none;" : "") + "' ></td>");
				realColumnsLength++;
			}else{
				for(var subi=0,subl=col.columns.length;subi<subl;subi++){
					realColumnsLength++;
					var subcol = col.columns[subi],w=subcol.width;
					arr.push("<td refcol='" + j+"-"+subi + "' style='width:" + w + "px;height:0px; border-bottom-width:0px;" + (subcol.hide ? "display:none;" : "") + "' ></td>");
				}
			}
		}
		arr.push("</tr>");
		for(var i=0,l=rows.length;i<l;i++){
			var row=rows[i],select=((!!g.selectMode) && (!!g.selectBy));//是否选中
			if(select){
				if(baidu.lang.isString(g.selectBy)){
					select = (row[g.selectBy]=="1" || row[g.selectBy]==true);
				}
				if(baidu.lang.isFunction(g.selectBy)){
					select  = g.selectBy({rowdata:row,rowIndex:i});
					select = (select=="1" || select==true);
				}
			}
			if(select){
				if (g.selectedRows.length >= 1 && g.selectMode == 1) {//单选
					select = false;
				}else {
					g.selectedRows.push(i);
				}
			}
			//beginrowjoin and the performance????
			g.dispatchEvent("beginrowjoin",{realColumnsLength:realColumnsLength,rowdata:row,rowIndex:i,joinedArray:arr});
			arr.push("<tr rowindex="+i+"   class=' gridrow "+(g.strip===false?"":(i%2?"even":"odd"))+" "+(select?"selected":"")+" '>");
			for(var j=0,ll=cols.length;j<ll;j++){
				var col= cols[j];
				if (!col.columns) {
					arr.push("<td class='gridcell' nowrap='nowrap' style='" + (col.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (col.align || "left") + ";' > " + g._getCellContent(col,i,{select:select}) + "</span></td>");
				}else{
					for(var subi=0,subl=col.columns.length;subi<subl;subi++){
						var subcol = col.columns[subi];
						arr.push("<td class='gridcell' nowrap='nowrap' style='" + (subcol.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (subcol.align || "left") + ";' > " + g._getCellContent(subcol,i,{select:select}) + "</span></td>");
					}
				}
			}
			arr.push("</tr>");
			//endrowjoin and the performance????
			g.dispatchEvent("endrowjoin",{realColumnsLength:realColumnsLength,rowdata:row,rowIndex:i,joinedArray:arr});
		}
		g.dispatchEvent("endrowsjoin",{joinedArray:arr});
		arr.push("</tbody></table></div>");
		arr.unshift("<div class='grid-tablecontainer'><table class='gridtable' style='width:"+g.ref.gheader.childNodes[0].clientWidth+"px' ");
		g.ref.gbody.innerHTML=arr.join("");
		this.setSize();
		//pager
		if(g.page && g._useDefaultPager){
			if(!data.data.page)data.data.page={};
			data.data.page.total=parseInt(data.data.page.total,10);//parse into number
			g.page.total= parseInt(data.data.page.total||Math.max(rows.length,g.page.total,10));//如果server端没有返回total，尝试是否有缓存(在翻页时可以缓存总记录条数)
			var p  = g.ref.pager,c= g.page.curPage,
			pages= parseInt((data.data.page.total-1)/g.page.perPage,10)+1,
			from = Math.max((g.page.curPage-1)*g.page.perPage+1,1),
			to= Math.min((g.page.curPage)*g.page.perPage,data.data.page.total);
			p.first.disabled = (c<=1 || pages<=1);
			p.prev.disabled = (c<=1 || pages<=1);
			p.curPage.value =c;
			p.pages.innerHTML =pages;
			p.next.disabled = (c>=pages || pages<=1);
			p.last.disabled = (c>=pages || pages<=1);
			p.from.innerHTML =from;
			p.to.innerHTML =to;
			p.total.innerHTML =data.data.page.total;
		
			//remember the data 
			g.page.pages=pages;
			g.page.from=from;
			g.page.to=to;
			g.page.total=data.data.page.total;
			
		}
		g.dispatchEvent("afterload",data);
		if(typeof(g.onAfterLoad)=="function") g.onAfterLoad({},data);
	},
	/**
	 * 根据单元格配置属性获取单元格内容html
	 * @param {Object} col 
	 * @param {Number} rowIndex 行序号
	 * @param {Object} extraParam 添加的额外参数可空
	 * @return {String} 内容html
	 */
	_getCellContent:function(col,rowIndex,extraParam){
		var g=this,row= g.getData().data.list[rowIndex]||{},
		celltext=row[(col.field||"")],
		celltext=(celltext=="0"?celltext:(celltext||"")),
		coltype = baidu.ui.Grid.ext.coltype[col.renderer||""],
		param = {cellvalue:celltext,colopts:col,rowdata:row,rowIndex:rowIndex};
		if(baidu.lang.isObject(extraParam)){baidu.object.extend(param,extraParam)};
		if (baidu.lang.isObject(coltype) && coltype && baidu.lang.isFunction(coltype.format)) {
			celltext = coltype.format.call(g, param) || "";
		}
		if (baidu.lang.isFunction(col.renderer)) {
			celltext = col.renderer.call(g, param) || "";
		}
		return celltext;
	},
	/**
	 * 获取表格数据
	 */
	getData:function(){
		return this.data;
	},
	/**
	 * 选中
	 * @param {Object} rowIndex 行序号 从0开始
	 * @param {Object} e event对象，可选参数
	 * @param {Object} data 事件传递参数，可选参数
	 */
	selectRow:function(rowIndex,e,data){
		var g =this,rowIndex = parseInt(rowIndex,10),isSelected  = (baidu.array.indexOf(g.selectedRows,rowIndex) != -1);
		if(!data) data ={rowIndex:rowIndex,row:g.data.data.list[rowIndex]};
		//select
		if (g.selectMode) {
			if (g.selectMode == 1) {
				//清除选中
				baidu.array.each(g.selectedRows, function(i){
					/*var row = baidu.dom.query("[rowindex=" + i + "]", g.gbody)[0];
					baidu.dom.removeClass(row, "selected");*/
					baidu.array.each(baidu.dom.query("[rowindex=" + i + "]", g.ref.gbody),function(row){
						baidu.dom.removeClass(row, "selected");
					});
					var removedata={rowIndex:i,row:g.data.data.list[i]};
					g.dispatchEvent("unselect",removedata);
					if(typeof(g.onUnSelect)=="function") g.onUnSelect(e,removedata);
				});
				g.selectedRows = [];
			}
			
			/*if (!g.dispatchEvent("beforeselect", data)) { return; }
			if (typeof(g.onBeforeSelect) == "function" && (!g.onBeforeSelect(e, data))) { return;}*/
			/*var newrow = baidu.dom.query("[rowindex=" + rowIndex + "]", g.gbody)[0];
			baidu.dom.addClass(newrow, "selected");*/
			if(g.selectMode==2 && isSelected) return true;//多选，已经选中，直接返回
			baidu.array.each(baidu.dom.query("[rowindex=" + rowIndex + "]", g.ref.gbody),function(row){
				baidu.dom.addClass(row, "selected");
			});
			g.selectedRows.push(rowIndex);
			g.selectedRows.sort();
			g.dispatchEvent("select",data);
			if(typeof(g.onSelect)=="function") g.onSelect(e,data);
		}
		return true;
	},
	/**
	 * 选中
	 * @param {Object} rowIndex 行序号 从0开始
	 * @param {Object} e event对象，可选参数
	 * @param {Object} data 事件传递参数，可选参数
	 */
	unSelectRow:function(rowIndex,e,data){
		
		var g =this,rowIndex = parseInt(rowIndex,10),isSelected  = (baidu.array.indexOf(g.selectedRows, rowIndex) != -1);
		if(!data) data ={rowIndex:rowIndex,row:g.data.data.list[rowIndex]};
		if(isSelected){
			/*if (!g.dispatchEvent("beforeunselect", data)) {return false;}
			if (typeof(g.onBeforeUnSelect) == "function" && (!g.onBeforeUnSelect(e, data))) {return false;}*/
				
			/*var row = baidu.dom.query("[rowindex=" + rowIndex + "]", g.gbody)[0];
			baidu.dom.removeClass(row,"selected");*/
			baidu.array.each(baidu.dom.query("[rowindex=" +rowIndex + "]", g.ref.gbody),function(row){
				baidu.dom.removeClass(row, "selected");
			});
			baidu.array.remove(g.selectedRows,rowIndex);//splice 
			
			g.dispatchEvent("unselect",data);
			if(typeof(g.onUnSelect)=="function") g.onUnSelect(e,data);
		}
		
	},
	/**
	 * 选中/不选中
	 * @param {Object} rowIndex 行序号 从0开始
	 * @param {Object} e event对象，可选参数
	 * @param {Object} data 事件传递参数，可选参数
	 */
	toggleSelectRow:function(rowIndex,e,data){
		var g =this,rowIndex = parseInt(rowIndex,10),isSelected  = (baidu.array.indexOf(g.selectedRows,rowIndex) != -1);
		if(!data) data ={rowIndex:rowIndex,row:g.data.data.list[rowIndex]};
		if(isSelected){
			g.unSelectRow(rowIndex,e,data);
		}else{
			g.selectRow(rowIndex,e,data);
		}
		
	},
	/**
	 * 获取选中行数据(只返回一行数据)
	 * @param fields {String|Array}指定列名称
	 */
	getSelected:function(fields){
		var selections = this.getSelections();
		if(selections.length>0){
			return selections[0];
		}else{
			return null;
		}
	},
	/**
	 * 获取选中行(多行)
	 */
	getSelections:function(fields){
		var result=[],g=this;
		baidu.array.each(g.selectedRows,function (i){
			var row = {},datarow = g.data.data.list[i];
			if(baidu.lang.isString(fields)){
				row[fields]= datarow[fields];
			}else if(baidu.lang.isArray(fields)){
				baidu.array.each(fields,function(f){
					row[f]= datarow[f];
				});
			}else{
				row =  datarow;
			}
			result.push(row);
			//result.push(field?g.data.data.list[i][field]:g.data.data.list[i]);
		});
		return result;
	},
	/**
	 * 按照字段排序 
	 * @param {Object} colIndex 排序字段序号
	 * @param {Object} order 排序类型 desc / asc
	 * @param {Object} e  event对象，可空 e如果为空，默认找到字段的第一个列排序
	 */
	reOrder: function(colIndex,order,e){
		var g =this,s=g._getSrc(e),col=g._getCol(colIndex),
			data={orderBy:col.field,order:order,curPage:1,colIndex:colIndex},
			isdesc=(order=="asc"),
			cell=s.cell?[s.cell]:[];
		if(col.sortable===false || col.columns ){return ;}
		if(!cell.length){
			cell= baidu.dom.query("[refcol="+colIndex.toString()+"]",g.ref.gheader);
		}
		if(cell.length==0) {return ;}
		if(!g.dispatchEvent("beforesort",data)){return ;}
		if(typeof(g.onBeforeSort)=="function" && g.onBeforeSort(e,data)===false) {return ;}
		
		//remember order status
		g.order=order;
		g.orderBy=colIndex;
		
		//reset all sorted field
		//<span class='sorter sort-asc' style='font-family:Arial'>▲</span> //▼
		baidu.array.each(baidu.dom.query(".sorter",g.ref.gheader),function(o){
			baidu.dom.remove(o);
		});
		
		var sorter= baidu.dom.create("span",{
			"className": "sorter " + (isdesc ? "sort-asc" : "sort-desc")
		});
		sorter.innerHTML = (isdesc?"▲":"▼");
		baidu.array.each(cell,function(c){
			c.childNodes[0].appendChild(sorter);
		});
		delete data.colIndex;
		g.request(data);
	},
	/**
	 * 隐藏列
	 * @param {Object} colIndex 列序号。从0开始
	 */
	hideColumn:function(colIndex){
		var g=this,colIndex=colIndex.toString(),nodes = baidu.dom.query(".gridtable",g.ref.gbody),col=g._getCol(colIndex);
		col.hide=true;
		if (colIndex.indexOf("-") != -1) {//show parent
			var parentColIndex = colIndex.substr(0, colIndex.indexOf("-")), parentCol = g._getCol(parentColIndex),allhidden=true;
			for (var i = parentCol.columns.length - 1; i >= 0; i--){
				if(!parentCol.columns[i].hide) allhidden=false;
			};
			parentCol.hide= allhidden;
		}else if(col.columns){
			for (var i = col.columns.length - 1; i >= 0; i--){
				col.columns[i].hide= true;
			};
		}
		
		g.render(g.element);
		g.dispatchEvent("hidecolumn",{colIndex:colIndex});
	},
	/**
	 * 显示列
	 * @param {Object} colIndex 列序号
	 */
	showColumn:function(colIndex){
		var g=this,nodes = baidu.dom.query(".gridtable",g.ref.gbody),colIndex=colIndex.toString(),col=g._getCol(colIndex);
		col.hide=false;
		if (colIndex.indexOf("-") != -1) {//show parent
			var parentColIndex = colIndex.substr(0, colIndex.indexOf("-")), parentCol = g._getCol(parentColIndex);
			parentCol.hide = false;
		}if(col.columns){
			for (var i = col.columns.length - 1; i >= 0; i--){
				col.columns[i].hide= false;
			};
		}
		g.render(g.element);
		g.dispatchEvent("showcolumn",{colIndex:colIndex});
	},
	/**
	 * 新增行
	 * @param {Object} row 行数据
	 * @param {Number} rowIndex  在第rowIndex行后新增，rowIndex如果不指定，行数据追加到表格最后。rowIndex从1开始，rowIndex如果为0，则在最上方添加行
	 */
	addRow:function(row,rowIndex){
		if(typeof(rowIndex)=="undefined") rowIndex = this.data.data.list.length;
		this.data.data.list.splice(rowIndex,0,row);
		if(this.data.data.page && typeof(this.data.data.page.total)!="undefined") this.data.data.page.total++;
		this.loadData(this.data);
		this.dispatchEvent("addrow",{row:row,rowIndex:rowIndex});
	},
	/**
	 * 更新行
	 * @param {Object} row 行数据
	 * @param {Number} rowIndex 替换行的下标，从0开始
	 */
	updateRow:function(row,rowIndex){
		this.data.data.list[rowIndex]=row;
		this.loadData(this.data);
		this.dispatchEvent("updaterow",{row:row,rowIndex:rowIndex});
	},
	/**
	 * 删除行
	 * @param {Number} rowIndex 删除下标为rowIndex行后的行
	 */
	deleteRow:function(rowIndex){
		baidu.array.remove(this.selectedRows,rowIndex);
		this.data.data.list.splice(rowIndex,1);
		if(this.data.data.page && typeof(this.data.data.page.total)!="undefined") this.data.data.page.total--;
		this.loadData(this.data);
		this.dispatchEvent("deleterow",{rowIndex:rowIndex});
	},
	/**
	 * 添加行
	 * @param {Object} rowdata 行数据
	 * @param {Object} rowIndex 在rowIndex行后添加
	 * @return {Number} 返回新增行的rowIndex
	 */
	addDOMRow:function(rowdata,rowIndex){
		var g=this,tables = baidu.dom.query(".gridtable",g.ref.gbody);
		if(typeof(rowIndex)=="undefined") rowIndex = g.getData().data.list.length;
		g.getData().data.list.push(rowdata);
		var newRowIndex = g.getData().data.list.length - 1;
		baidu.array.each(tables,function(t){
			var row0= t.rows[0],
				cells= row0.cells,
				rows=baidu.dom.query(".gridrow[rowindex="+rowIndex+"]",t),
				row =rows.length>0?rows[0]:baidu.dom.query("tr:last",t)[0],
				rowNextSibling = rows.length>0?row:row.nextSibling;
			if(!row){return true;}	
			var newRow = document.createElement("tr");
			newRow.className="gridrow";
			newRow.setAttribute("rowindex",newRowIndex);
			for(var i=0,l=cells.length;i<l;i++){
				var c = cells[i],refcol= c.getAttribute("refcol"),col= g._getCol(refcol);
				var td = document.createElement("td");
				td.className="gridcell";
				td.setAttribute("nowrap","nowrap");
				td.setAttribute("noWrap","noWrap");
				if(col.hide) td.style.display="none";
				td.innerHTML="<span class='cellcontent' style='text-align:" + (col.align || "left") + ";' >" + g._getCellContent(col,newRowIndex) + "</span>";
				newRow.appendChild(td);
			}
			if(rowNextSibling){
				rowNextSibling.parentNode.insertBefore(newRow,rowNextSibling);
			}else{
				row.parentNode.appendChild(newRow);
			}
		});
		g.resize();
		this.dispatchEvent("addomrow",{rowIndex:rowIndex,newRowIndex:newRowIndex,rowdata:rowdata});
		return newRowIndex;
	},
	/**
	 * 更新行
	 * @param {Object} rowdata 行数据
	 * @param {Object} rowIndex 行号
	 */
	updateDOMRow:function(rowdata,rowIndex){
		var g=this,tables = baidu.dom.query(".gridtable",g.ref.gbody);
		g.getData().data.list[rowIndex]=rowdata;//update model;
		baidu.array.each(tables,function(t){
			var row0= t.rows[0],
				cells= row0.cells,
				row = (baidu.dom.query(".gridrow[rowindex="+rowIndex+"]",t)[0]);
			if(!row){return true;}	
			var newRow = document.createElement("tr");
			newRow.className="gridrow";
			newRow.setAttribute("rowindex",rowIndex);
			for(var i=0,l=cells.length;i<l;i++){
				var c = cells[i],refcol= c.getAttribute("refcol"),col= g._getCol(refcol);
				var td = document.createElement("td");
				td.className="gridcell";
				td.setAttribute("nowrap","nowrap");
				td.setAttribute("noWrap","noWrap");
				if(col.hide) td.style.display="none";
				td.innerHTML="<span class='cellcontent' style='text-align:" + (col.align || "left") + ";' >" + g._getCellContent(col,rowIndex) + "</span>";
				newRow.appendChild(td);
			}
			row.parentNode.replaceChild(newRow,row);
		});
		g.resize();
		this.dispatchEvent("updatedomrow",{rowIndex:rowIndex,rowdata:rowdata});
	},
	/**
	 * 删除行
	 * @param {Object} rowIndex 行号
	 */
	deleteDOMRow:function(rowIndex){
		var g=this,tables = baidu.dom.query(".gridtable",g.ref.gbody);
		baidu.array.remove(g.selectedRows,rowIndex);
		//删除DOM row。不删除model数据
		//g.getData().data.list.splice(rowIndex,1);
		baidu.array.each(tables,function(t){
			var row = (baidu.dom.query(".gridrow[rowindex="+rowIndex+"]",t)[0]);
			if(!row){return true;}	
			row.parentNode.removeChild(row);
		});
		g.resize();
		this.dispatchEvent("deletedomrow",{rowIndex:rowIndex});
	},
	/**
	 * 单元格遍历函数
	 * @param fn {Function} 遍历函数，如果该方法返回false,遍历结束,函数接收参数｛column:colopts,cell:cell,row:row,colIndex:refcol,rowIndex:rowIndex,rowdata:g.getData().data.list[rowIndex]}
	 */
	cellIterator:function(fn){
		var g = this,tables = baidu.dom.query("table",g.ref.gbody);
		for(var ti=0,tl=tables.length;ti<tl;ti++){
			var table = tables[ti],rows= table.rows,row0cells=rows[0].cells;
			for(var i=1,l=rows.length;i<l;i++){//skip the first row
				var row = rows[i],rowIndex  = row.getAttribute("rowindex");
				if(typeof(rowIndex)=="undefined" || (!baidu.dom.hasClass(row,"gridrow"))) {continue;}
				rowIndex= parseInt(rowIndex,10);
				for(var ii=0,ll=row0cells.length;ii<ll;ii++){
					var cell= row.cells[ii],
						refcol=row0cells[ii].getAttribute("refcol"),
						col= g._getCol(refcol),
						cellvalue= g.getData().data.list[rowIndex][col.field||""];
						param={column:col,cell:cell,row:row,colIndex:refcol,rowIndex:rowIndex,rowdata:g.getData().data.list[rowIndex]};
						cellvalue = (cellvalue=="0"?cellvalue:(cellvalue||""));
						param.cellvalue=cellvalue;
						if (col) {
							var fnReusult = fn.call(g, param);
							if (fnReusult === false) 
								return;
						}
				}
			}
				
		}
	},
	_getSrc:function(e){
		if(!e){return {};}
		var g=this,src=e.srcElement||e.target,cell=null,row=null,table=null,o = src,rowIndex=-1;
		while(o.parentNode && o!=g.element){
			if(baidu.dom.hasClass(o,"gridcell")){cell=o;}
			if(o.className.indexOf("gridrow")!=-1){
				row=o;
				rowIndex=o.getAttribute("rowindex");
				if(typeof(rowIndex)!="undefined") rowIndex = parseInt(rowIndex,10);
			}
			if(o.className.indexOf("gridtable")!=-1){table=o;}
			if(cell && row  && table ){break;}
			o=o.parentNode;
		}
		//考虑有表格嵌套的情况，需要对找到的src进行校验
		if(table && (table.parentNode.parentNode == g.ref.gbody || table.parentNode == g.ref.gbody || table.parentNode == g.ref.gheader) ){
			return {cell:cell,row:row,table:table,rowIndex:rowIndex,src:src};
		}else{
			return {};
		}
	},
	_getCol:function(colIndex){
		if(!this._originColumns) {
			this._originColumns  = baidu.object.clone(this.columns);
		}
		colIndex=colIndex.toString();
		if(colIndex.indexOf("-")==-1){
			return this.columns[colIndex];
		}else{
			return this.columns[colIndex.substr(0,colIndex.indexOf("-"))].columns[colIndex.substr(colIndex.indexOf("-")+1)];
		}
	},
	/**
	 * 绑定事件,统一使用冒泡事件
	 */
	_bindEvents:function(){
		var g = this;
		
		function gbodyClick(e,data){
			var s=g._getSrc(e);
			if(s.cell){//cell clicked
				//columnIndex 在table中是第几列 从0开始
				//refIndex 在grid.optoins.columns中的下标
				var columnIndex =-1,siblings=s.cell.parentNode.childNodes,refIndex=-1;
				for(var i=0,l=siblings.length;i<l;i++){
					if(siblings[i]==s.cell) {columnIndex=i;break;}
				}
				refIndex= parseInt(s.table.rows[0].cells[columnIndex].getAttribute("refcol"),10);
				var data ={columnIndex:columnIndex,refIndex:refIndex,rowIndex:s.rowIndex,ref:s,column:g._getCol(refIndex)};
				
				//约定先dispatchEvent然后执行onxxx选项事件
				g.dispatchEvent("cellclick",data);
				if(typeof(g.onCellClick)=="function") g.onCellClick(e,data);
				
			}
			if(s.row){//row clicked
				var data = {rowIndex:s.rowIndex,row:g.data.data.list[s.rowIndex],ref:s};
				g.dispatchEvent("rowclick",data);
				if(typeof(g.onRowClick)=="function") g.onRowClick(e,data);
				if(g.clickToSelect!==false)g.toggleSelectRow(s.rowIndex,e);
			}
			
		}
		baidu.event.on(g.ref.gbody,"click",gbodyClick);
		
		function gbodyDblClick(e,data){
			var s=g._getSrc(e);
			if(s.row){//row double clicked
				var data = {rowIndex:s.rowIndex,row:g.data.data.list[s.rowIndex],ref:s};
				g.dispatchEvent("dblrowclick",data);
				if(typeof(g.onRowDblClick)=="function") g.onRowDblClick(e,data);
			}
			
		}
		baidu.event.on(g.ref.gbody,"dblclick",gbodyDblClick);
		
		function gbodyHover(e){
			var s  = g._getSrc(e);
			if(s.row){
				gbodyOut();
				/*baidu.array.each(baidu.dom.query("[rowindex="+s.rowIndex+"]",g.ref.gbody),function(row){
					baidu.dom.addClass(row,"hover");
				});*/
				baidu.dom.addClass(s.row,"hover");
				g.highLightedRow=s.rowIndex;
			}
		}
		function gbodyOut(){
			baidu.array.each(baidu.dom.query(".hover",g.ref.gbody),function(row){
				baidu.dom.removeClass(row,"hover");
			});
			g.highLightedRow=-1;
		}
		if (g.hoverhighlight!==false) {
			baidu.event.on(g.ref.gbody, "mousemove", gbodyHover);
			baidu.event.on(g.ref.gbody, "mouseout", gbodyOut);
		}
		
		function headerClick(e,data){
			var s=g._getSrc(e),cell = s.cell;
			if(cell){
				if (baidu.dom.hasClass(cell,"header-sortable-col") && baidu.dom.hasClass(s.src,"headercoltext") ) {//点击字段排序
					var refcol = cell.getAttribute("refcol"), col = g._getCol(refcol), field = col.field, 
					isdesc = (baidu.dom.query(".sort-desc", cell).length > 0 || baidu.dom.query(".sorter", cell).length == 0),//当前状态是否是降序
 					order = isdesc ? "asc" : "desc";
					g.reOrder(refcol,order,e);
				}
				g.dispatchEvent("headercellclick",{ref:s});
			}
		}
		baidu.event.on(g.ref.gheader,"click",headerClick);
		
		//column resizable
		var headerLeft= baidu.dom.getPosition(g.ref.gheader).left,isResizing=false,cell=null,l=0;
		function resizing(e){
			if(isResizing){
				var x = baidu.event.getPageX(e);
				g.ref.resizerproxy.style.left=(x-headerLeft)+"px";
			}
		}
		function stopResizing(e){
			if (isResizing) {
				var x = baidu.event.getPageX(e),l = baidu.dom.getPosition(cell).left,colWidth = (x-l),
					refcol=cell.getAttribute("refcol"),
					column=g._getCol(refcol),
					bodycell= baidu.dom.query("[refcol="+refcol+"]",g.ref.gbody),
					t= baidu.dom.query(".gridtable",g.ref.gbody),
					offset = g._getCol(refcol).width-colWidth;
				
				cell.style.width= colWidth+"px";
				
				baidu.array.each(baidu.dom.query("[refcol="+refcol+"]",g.ref.gheader),function(c){
					c.style.width=colWidth+"px";
				});
				
				column.width=colWidth;
				
				baidu.array.each(bodycell,function(cell){
					cell.style.width=colWidth+"px";
				});
				baidu.array.each(t,function(table){
					var tWidth = parseInt(baidu.dom.getStyle(table, "width"), 10);
					table.style.width = (tWidth - offset) + "px";
				});
				g.ref.resizerproxy.style.display="none";
				g._sizeScroller();
				g.dispatchEvent("columnresize",{column:column});
			}
			isResizing=false;
			cell==null;
		}
		function startResize(e){
			var s = g._getSrc(e),src= s.src,e=baidu.event.get(e);
			headerLeft= baidu.dom.getPosition(g.ref.gheader).left;
			if (src && baidu.dom.hasClass(src,"header-col-resizer")) {
				cell = s.cell;
				l = baidu.dom.getPosition(cell).left;
				var x = baidu.event.getPageX(e);
				g.ref.resizerproxy.style.left = (x - headerLeft) + "px";
				g.ref.resizerproxy.style.height = g.element.clientHeight+"px";
				g.ref.resizerproxy.style.display = "block";
				isResizing = true;
				g.clearSelection();
				e.stopPropagation();
			}
		}
		baidu.event.on(g.ref.gheader,"mousedown",startResize);
		baidu.event.on(g.ref.gheader,"mousemove",resizing);
		baidu.event.on(g.element,"mouseup",stopResizing);
		
		
	},
	tplFrame:'#{loadmask}#{docktop}<div class="tangramgridcontainer"><div class="gridheader" id="#{element}-gridheader"><table border="0" cellspacing="0" cellpadding="0" class="gridtable"><tbody>#{hcols}</tbody></table></div><div class="gridbody"  id="#{element}-gridbody"><div class="grid-tablecontainer"></div></div><div class="grid-yscroller"><div class="grid-y-strecher" ></div></div><div class="grid-xscroller"><div class="grid-x-strecher"></div></div><div class="grid-rb-corner"></div><div class="grid-resizer-proxy"></div></div>#{dockbottom}',
	tplPager:"<div class='tgpager'><span class='tgpager-info'><span class='tgpager-from'>#{from}</span>-<span class='tgpager-to'>#{to}</span> of <span class='tgpager-total'>#{total}</span></span><select class='tgpager-pagenumbers'>#{pnoptions}</select><button class='tgpager-first' disabled='disabled'>|◄</button><button class='tgpager-prev'  disabled='disabled'>◄</button><span class='tgpager-sep'></span><input type='text' class='tgpager-curPage' value='#{curPage}' />/<span class='tgpager-pages'>#{pages}</span><span class='tgpager-sep'></span><button class='tgpager-next'  disabled='disabled'>►</button><button class='tgpager-last'  disabled='disabled'>►|</button>#{tools}</div>",
	/**
	 * 初始化grid
	 * @param {Object} target
	 */
	render:function(target){
		if(!baidu.g(target)){return ;}
		this.fixColIndex=-1;// the index of  column  to fix width
		var g = this,
		frameHtml=baidu.format(g.tplFrame,{
			element:g.element.id,
			dockbottom:(function(){
				if(g.page===false){ return "";}//不分页
				if(g.page===true) g.page={};//分页&默认配置
				if (baidu.lang.isString(g.page)) {//自定义分页
					g._useDefaultPager = false;
					return g.page;
				}else {
					g._useDefaultPager = true;
					g.page = baidu.object.merge(g.page || {}, {
						perPage: 10,
						pagenumbers: [10, 20, 50, 100],
						curPage: 1,
						pages: 0,
						from: 0,
						to: 0,
						total: 0
					});
					return baidu.format(g.tplPager, baidu.object.extend(g.page, {
						pnoptions: (function(){
							var arr = [];
							baidu.array.each(g.page.pagenumbers, function(o){
								arr.push("<option value='" + o + "' " + (o == g.page.perPage ? " selected='selected' " : "") + ">" + o + "</option>");
							});
							return arr.join("");
						})()
					}));
				}
			})(),
			docktop:g.docktop||"",
			loadmask:'<div class="gridloadmask"></div><div class="gridloadmessge">'+(g.loadMessage||"正在加载...")+'</div>',
			hcols:(function(){
				var arr=["<tr class='gridrow'>"],grouped =false,arr2=["<tr class='gridrow'>"];
				for (i = 0, l = g.columns.length; i < l; i++) {
					if (g.columns[i].columns && g.columns[i].columns.length) {
						grouped = true;
						break;
					}
				}
				g.grouped = grouped;
				for(i=0,l=g.columns.length;i<l;i++){
					var w = isNaN(parseInt(g.columns[i].width,10))?"200px":(parseInt(g.columns[i].width,10)+"px"),col= g.columns[i];
					if(col.fix && (!col.columns)) g.fixColIndex=i;
					if(col.columns) w="auto";
					//没有指定宽度的列默认取200
					if(!col.width)col.width=200;
					
					var header= (col.header||"");
					var coltype=baidu.ui.Grid.ext.coltype[col.renderer||""];//读取扩展属性
					if(baidu.lang.isObject(coltype) && coltype){
						if(baidu.lang.isFunction(coltype.headerformat)){
							header= coltype.headerformat.call(g,header,col,i)||"";
						}
						if(baidu.lang.isFunction(coltype.init)){
							coltype.init.call(g,col);
						}
					}
					var sort =((g.orderBy==i && (!col.columns))?"<span class='sorter sort-"+g.order+"'>"+(g.order=="desc"?"▼":"▲")+"</span>":"");
					if(g.orderBy==i)g.orderBy=i;
					var resizer = (( (col.resizable!==false) && (!col.columns))?"<span class='header-col-resizer'></span>":"");
					var colspan = (col.columns?(" colspan='"+col.columns.length+"' "):"");
					arr.push('<td valign="middle" '+((grouped && (!col.columns) ) ?" rowspan='2' ":"")+colspan+'  class="headercol gridcell '+((col.sortable!==false && (!col.columns))?" header-sortable-col ":"")+((grouped && (!col.columns))?" header-rowspan2 ":"")+(col.columns?" header-colspan ":"")+'" unselectable="on" onselectstart="return false;" refcol="'+i+'"  style="width:'+w+';'+(col.hide?"display:none;":"")+'" ><div class="header-col"><span class="headercoltext">'+header+'</span>'+sort+resizer+'</div></td>');
					if(baidu.lang.isArray(col.columns)){
						for(var j = 0,ll=col.columns.length;j<ll;j++){
							var subcol = col.columns[j];
							if(!subcol.width)subcol.width=200;
							var w = isNaN(parseInt(subcol.width,10))?"200px":(parseInt(subcol.width,10)+"px");
							
							var header= (subcol.header||"");
							var coltype=baidu.ui.Grid.ext.coltype[subcol.renderer||""];//读取扩展属性
							if(baidu.lang.isObject(coltype) && coltype){
								if(baidu.lang.isFunction(coltype.headerformat)){
									header= coltype.headerformat.call(g,header,subcol,i)||"";
								}
								if(baidu.lang.isFunction(coltype.init)){
									coltype.init.call(g,subcol);
								}
							}
							var resizer = ((subcol.resizable!==false )?"<span class='header-col-resizer'></span>":"");
							var sort =((g.orderBy==(i+"-"+j))?"<span class='sorter sort-"+g.order+"'>"+(g.order=="desc"?"▼":"▲")+"</span>":"");
							if(g.orderBy==(i+"-"+j))g.orderBy=(i+"-"+j);
							arr2.push('<td   class="headercol gridcell '+( (subcol.sortable!==false)?" header-sortable-col ":"")+'" unselectable="on" onselectstart="return false;" refcol="'+(i+"-"+j)+'"  style="width:'+w+';'+(subcol.hide?"display:none;":"")+'" ><div class="header-col"><span class="headercoltext">'+header+'</span>'+sort+resizer+'</div></td>');
							
						}
					}
				}
				arr.push("</tr>");
				arr2.push("</tr>");
				return arr.join("")+(grouped?arr2.join(""):"");
			})()
		});
		g._clearBindings();
		baidu.dom.addClass(g.element,"tangramgrid");
		g.renderMain(target);
		g.element.innerHTML= frameHtml;
		g.height=g.height||200;
		//cache grid's element references
		g.ref={};
		g.selectedRows=[];//the row index of selected rows
		g.highLightedRow=-1;//current highlighted row index
		g.grouped=false;
		g.ref.gheader= baidu.g(this.element.id+"-gridheader");
		g.ref.gbody= baidu.g(this.element.id+"-gridbody");
		g.ref.ghcells  = baidu.dom.query("table tr:eq(0) td",g.ref.gheader);
		g.ref.yscroller=baidu.dom.query(".grid-yscroller",g.element)[0];
		g.ref.ystrecher=baidu.dom.query(".grid-y-strecher",g.element)[0];
		g.ref.xscroller=baidu.dom.query(".grid-xscroller",g.element)[0];
		g.ref.xstrecher=baidu.dom.query(".grid-x-strecher",g.element)[0];
		g.ref.rbcorner=baidu.dom.query(".grid-rb-corner",g.element)[0];
		g.ref.resizerproxy=baidu.dom.query(".grid-resizer-proxy",g.element)[0];
		
		//g.page
		if(g.page && g._useDefaultPager){
			g.ref.pager={
				pagenumbers:baidu.dom.query(".tgpager-pagenumbers",g.element)[0],
				first:baidu.dom.query(".tgpager-first",g.element)[0],
				prev:baidu.dom.query(".tgpager-prev",g.element)[0],
				curPage:baidu.dom.query(".tgpager-curPage",g.element)[0],
				pages:baidu.dom.query(".tgpager-pages",g.element)[0],
				next:baidu.dom.query(".tgpager-next",g.element)[0],
				last:baidu.dom.query(".tgpager-last",g.element)[0],
				from:baidu.dom.query(".tgpager-from",g.element)[0],
				to:baidu.dom.query(".tgpager-to",g.element)[0],
				total:baidu.dom.query(".tgpager-total",g.element)[0]
			};
			//bind pager events
			var p = g.ref.pager,h =baidu.fn.bind(g._handlePager,g);//bind saved me !
			baidu.event.on(p.pagenumbers, "change", h);
			baidu.event.on(p.first, "click", h);
			baidu.event.on(p.prev, "click", h);
			baidu.event.on(p.curPage, "keydown", h);
			baidu.event.on(p.curPage, "blur",h);
			baidu.event.on(p.next, "click",h);
			baidu.event.on(p.last, "click",h);
		}
		
		this._fixColWidth();
		this._setHeight(g.height);
		this._bindScroller();
		this._bindEvents();
		//notify I am initialized 
		this.dispatchEvent("initialized",{});
		
		//load data if exist
		if(this.data) this.loadData(this.getData());
	},
	_handlePager:function(e){
		var g= this,p = g.ref.pager,e=baidu.event.get(e),
		perPage=p.pagenumbers.options[p.pagenumbers.selectedIndex].value,
		curPage=parseInt(g.page.curPage,10),s = e.target,prevent=false;
		if(s==p.first || s==p.pagenumbers){
			curPage=1;
		}
		if(s==p.prev){
			curPage=Math.max(1,curPage-1);
		}
		if(s==p.next){
			curPage=Math.min(g.page.pages,curPage+1);
		}
		if(s==p.last){
			curPage=g.page.pages;
		}
		if(s==p.curPage){
			var v = p.curPage.value;
			if(e.type=="keydown"){
				var keyCode = baidu.event.getKeyCode(e);
				if(keyCode==13){
					if (isNaN(v)) {
						prevent=true;
					}else{
						curPage  = ~~v;
						if (curPage < 1) {
							curPage = 1;
							prevent=true;
						}
						if (curPage > g.page.pages) {
							curPage = g.page.pages;
							prevent=true;
						}
					}
					p.curPage.value=curPage;
				}else{
					return true;
				}
			}
			if(e.type=="blur"){
				if (isNaN(v)) {
						p.curPage.value=curPage;
						prevent=true;
					}else{
						curPage  = ~~v;
					}
			}
		}
		if(prevent){
			e.preventDefault();
			return false;
		}else{
			g.page.curPage  =curPage;
			g.page.perPage=perPage;
			g.request({
				curPage:curPage,
				perPage:perPage
			});
		}
	},
	clearSelection:function(){
		if (window.getSelection) {
		  	if (window.getSelection().empty) {  // Chrome
		    	window.getSelection().empty();
		  	} else if (window.getSelection().removeAllRanges) {  // Firefox
		    	window.getSelection().removeAllRanges();
		  	}
		} else if (document.selection) {  // IE?
		  	document.selection.empty();
		}
	},
	/**
	 * 清除事件绑定，删除ref引用，防止内存泄漏
	 * 由于grid内的DOM经常读写，事件绑定后没有解除绑定。_clearBindings专用于回收该部分内存
	 */
	_clearBindings:function(){
		var g = this;
		if(!g.ref) return ;
		var events=["click","dblclick","mousemove","mousedown","change","keydown","blur","dommousescroll","mouseup","mouseout","scroll"];
		g.ref.element = g.element;
		for(var refkey in g.ref){
			var obj = g.ref[refkey];
			if(obj.nodeType){
				baidu.array.each(events,function(eventName){
					baidu.event.un(obj,eventName);
				});
			}else{
				for (var k  in obj) {
					if(obj[k].nodeType){//eg: g.ref.pager.next
						baidu.array.each(events,function(eventName){
							baidu.event.un(obj[k],eventName);
						});
					}
				}
			}
		}
		delete g.ref;
	},
	dispose : function(){
        var g =this;
        g._clearBindings();
		baidu.dom.empty(g.element);
        g.dispatchEvent("dispose",{});
		baidu.lang.Class.prototype.dispose.call(g);
	}
});
/*baidu.ui.Grid扩展*/
baidu.ui.Grid.ext={coltype:{}};
baidu.ui.Grid.ext.coltype.checkbox={
	headerformat:function (header,colopt,colIndex){
		//this为grid对象
		colopt.resizable=false;
		colopt.sortable=false;
		return (this.selectMode==2)?"<input type='checkbox' class='tg-cball' />":"&nbsp;";
	},
	format:function(data){
		if(!this.selectMode){return "";}
		//{cellvalue:celltext,colopts:col,rowdata:row,rowIndex:i}
		var f = data.colopts.field||"",v = data.rowdata[f],v= (v=="0"?v:(v||""));
		//是否禁用checkbox
		var d=((typeof(data.colopts.disableBy)=="function") && data.colopts.disableBy(data)===false)?" disabled='disabled' ":"";
		return "<input type='checkbox' class='tg-cb' name='"+f+"' value='"+v+"' "+(data.select?" checked='checked' ":"")+" "+d+" />";
	},
	init:function(){//初始话行为(在Grid初始化时执行)
		var g= this;
		g.addEventListener("select",function(e,data){
			var cbs = baidu.dom.query("[rowindex="+data.rowIndex+"] .tg-cb",g.ref.gbody);
			baidu.array.each(cbs,function(cb){
				cb.checked=true;
			});
		});
		g.addEventListener("unselect",function(e,data){
			var cbs = baidu.dom.query("[rowindex="+data.rowIndex+"] .tg-cb",g.ref.gbody);
			baidu.array.each(cbs,function(cb){
				cb.checked=false;
			});
		});
		g.addEventListener("headercellclick",function(e,data){
			var g=this,s = data.ref.src;
			if(s && baidu.dom.hasClass(s,"tg-cball")){
				var rows = baidu.dom.query("[rowindex]",g.ref.gbody);
				if(s.checked){//check all
					baidu.array.each(rows,function(row){
						var rowIndex = parseInt(row.getAttribute("rowindex"),10);
						g.selectRow(rowIndex,e);
					});
					
				}else{//uncheckall
					baidu.array.each(rows,function(row){
						var rowIndex = parseInt(row.getAttribute("rowindex"),10);
						g.unSelectRow(rowIndex,e);
					});
				}
			}
		});
		if (g.clickToSelect===false) {
			g.addEventListener("cellclick", function(e, data){
				var g = this,e=baidu.event.get(e);
				if (baidu.dom.hasClass(data.ref.src, "tg-cb")) {//checkbox is clicked
					if (data.ref.row) {
						g.toggleSelectRow(data.ref.row.getAttribute("rowindex"));
					}
					e.stopPropagation();
				}
			});
		}
	}
};

/**
 * @author yanghengfeng
 * column drag sortable addon
 */
baidu.ui.Grid.register(function(g){
	if(g.columndraggable){
		g.addEventListener("initialized",function(){
			if(!g.ref.columndragproxy){
				var columndragproxy = document.createElement("div");
				columndragproxy.className="columndragproxy";
				g.ref.gheader.appendChild(columndragproxy);
				columndragproxy.innerHTML="<span class='headercoltext'></span>";
				g.ref.columndragproxy= columndragproxy;
				
			}
			if(!g._cds_dragstart_bind) g._cds_dragstart_bind = baidu.fn.bind(g._cds_dragstart,g);
			baidu.event.on(g.ref.gheader,"mousedown",g._cds_dragstart_bind);
			
			if(!g._cds_dragging_bind) g._cds_dragging_bind = baidu.fn.bind(g._cds_dragging,g);
			baidu.event.on(g.ref.gheader,"mousemove",g._cds_dragging_bind);
			
			if(!g._cds_dragend_bind) g._cds_dragend_bind = baidu.fn.bind(g._cds_dragend,g);
			baidu.event.un(document.body,"mouseup",g._cds_dragend_bind);
			baidu.event.on(document.body,"mouseup",g._cds_dragend_bind);
			
		});
	}
});
baidu.ui.Grid.extend({
	//cds = column drag sortable
	_cds_dragstart:function(e){
		var g =this,s = g._getSrc(e),e= baidu.event.get(e);
		if(s.cell && (baidu.dom.hasClass(s.src,"headercol") || baidu.dom.hasClass(s.src,"header-col")) ){
			var colIndex =s.cell.getAttribute("refcol"),col= g._getCol(colIndex);
			g.ref.columndragproxy.innerHTML ="<span class='headercoltext'>"+(col.header||"")+"</span>";
			baidu.dom.setStyles(g.ref.columndragproxy,{
				"display":"block",
				top:(colIndex.indexOf("-")==-1?"-1px":((s.cell.offsetHeight-1)+"px")),
				left:(s.cell.offsetLeft-1+"px"),
				width:(s.cell.clientWidth+"px"),
				height:(s.cell.clientHeight+"px")
			});
			g._cd={dragx:e.clientX,dragy:e.clientY,originleft:s.cell.offsetLeft-1,colIndex:colIndex,originwidth:s.cell.clientWidth};
			e.stopPropagation();
			g.clearSelection();
		}
	},
	_cds_dragging:function(e){
		var g= this,cd=g._cd;
		if(cd){
			var newLeft =cd.originleft+(e.clientX-cd.dragx),zIndex =g.ref.columndragproxy.style.zIndex ;
			g.ref.columndragproxy.style.zIndex ="-1";
			var  elem = document.elementFromPoint(e.clientX,e.clientY),targetcell=elem;
			while((!baidu.dom.hasClass(targetcell,"headercol")) && targetcell!=g.element){
				targetcell=targetcell.parentNode;
			}
			g.ref.columndragproxy.style.zIndex =zIndex;
			var targetColIndex = targetcell.getAttribute("refcol");
			if(targetColIndex!=null){
				
				//列拖放规则：
				// 1.父列只能在父列之前排序
				// 2.子列可以在兄弟列中拖放，还可以拖放在父列相邻列的靠进该列侧(并直接转换成子列兄弟节点的拖放)
				// 所有列够不能拖放在自己周围 源单元格周围的| 不显示(不合法的拖放位置)
				
				//源单元格为父列，目标列不关心子列，将目标列设置为父列 这样第一条拖放规则就可以避免违反
				if(cd.colIndex.toString().indexOf("-")==-1 && targetColIndex.indexOf("-")!=-1){
					targetColIndex = targetColIndex.replace(/\-\d{1,}$/gi,"");
					targetcell = baidu.dom.query("[refcol="+targetColIndex+"]",g.ref.gheader)[0];
				}
				
				var targetCol= g._getCol(targetColIndex),
					l=baidu.dom.getPosition(targetcell).left,
					w=targetcell.offsetWidth,
					isleft = (e.clientX<=(l+w/2)),//当前鼠标位置是在目标单元格的左边，右边?
					proxyleft =isleft?(targetcell.offsetLeft-1):(targetcell.offsetLeft+targetcell.clientWidth),
					proxydisplay="block";//block表示合法的拖放位置，none为不合法的位置
				//源单元格为子列
				if(cd.colIndex.toString().indexOf("-")!=-1){
					//子列到父列(只有相邻才合法)
					var colIndex1=parseInt(cd.colIndex.replace(/\-\d{1,}$/gi,""),10),
						colIndex2= parseInt(cd.colIndex.replace(/^\d{1,}\-/gi,""),10),
						columnscount=(g._getCol(colIndex1).columns||[]).length,
						targetIsParent = targetColIndex.indexOf("-")==-1,//目标列是否为父列
						targetCol1= parseInt(targetColIndex.replace(/\-\d{1,}$/gi,""),10),
						targetCol2=parseInt(targetColIndex.replace(/^\d{1,}\-/gi,""),10),
						targetcolumnscount = (g._getCol(targetCol1).columns||[]).count,
						isrightsibing= (targetCol1==colIndex1+1) && (targetIsParent?isleft:(targetCol2=="0" && isleft )),//是否是右相邻
						isleftsibling = (targetCol1==colIndex1-1) && (targetIsParent?(!isleft):(targetCol2==targetcolumnscount-1 && (!isleft) ));//是否是左相邻
					if(colIndex1!=targetCol1 && (!isrightsibing) && (!isleftsibling) ){//非子列兄弟列 && 不相邻
						proxydisplay="none";
					}
					//如果是左相邻,右相邻，可以等效
					if(isleftsibling){
						isleft = true;
						targetColIndex = colIndex1+"-0";
					}
					if(isrightsibing){
						isleft = false;
						targetColIndex = colIndex1+"-"+targetCol2; 
					}
				}else{//源单元格是父列
					
				}
				
				//所有列够不能拖放在自己周围 源单元格周围的| 不显示(不合法的拖放位置)
				if(Math.abs(proxyleft- cd.originleft)<=1 || Math.abs(cd.originleft+cd.originwidth -proxyleft)<=1){
					proxydisplay = "none";
				}
				
				if(proxydisplay=="none"){
					delete cd.isleft;
					delete cd.targetColIndex;
				}else{
					cd.isleft=isleft;
					cd.targetColIndex=targetColIndex;
				}
				
				
				baidu.dom.setStyles(g.ref.resizerproxy,{
					"display":proxydisplay,
					"height":(g.element.clientHeight+"px"),
					"top":g.ref.columndragproxy.style.top,
					"left":(proxyleft+"px")
				});
			}
			g.ref.columndragproxy.style.left=(newLeft+"px");
			
		}
	},
	_cds_dragend:function(){
		var g =this,cd=g._cd;
		if (cd) {
			g.ref.columndragproxy.style.display="none";
			g.ref.resizerproxy.style.display="none";
			//console.log(cd.colIndex+" "+cd.targetColIndex+" "+ cd.isleft);
			if(typeof(cd.targetColIndex)!="undefined"){
				
				//记住之前的排序字段
				var orderCol= g._getCol(g.orderBy);
				if(orderCol) orderCol._ordered =true;
				
				//copy source column
				var copySource = baidu.object.clone(g._getCol(cd.colIndex));
				//case1: 父列之间的排序
				if(cd.targetColIndex.toString().indexOf("-")==-1 && cd.colIndex.toString().indexOf("-")==-1){
					if(!cd.isleft){
						cd.targetColIndex++;
					}
					if (cd.targetColIndex > cd.colIndex) {
						g.columns.splice(cd.targetColIndex, 0, copySource);
						g.columns.splice(cd.colIndex,1);
					}else{
						g.columns.splice(cd.targetColIndex, 0, copySource);
						g.columns.splice(++cd.colIndex,1);
					}
				}else{//case2 子列之间的排序
					var colIndex1=parseInt(cd.colIndex.toString().replace(/\-\d{1,}$/gi,""),10),
						targetColIndex2= parseInt(cd.targetColIndex.toString().replace(/^\d{1,}\-/gi,""),10),
						colIndex2 = parseInt(cd.colIndex.toString().replace(/^\d{1,}\-/gi,""),10);
					if(!cd.isleft){
						targetColIndex2++;
					}
					if (targetColIndex2 > colIndex2) {
						g.columns[colIndex1].columns.splice(targetColIndex2, 0, copySource);
						g.columns[colIndex1].columns.splice(colIndex2,1);
					}else{
						g.columns[colIndex1].columns.splice(targetColIndex2, 0, copySource);
						g.columns[colIndex1].columns.splice(++colIndex2,1);
					}
				}
			}
			delete g._cd;
			//更新orderBy
			for(i=0,l=g.columns.length;i<l;i++){
				var col= g.columns[i];
				if(col._ordered){
					g.orderBy=i;
					delete col._ordered;
					break;
				}
				if(baidu.lang.isArray(col.columns)){
					for(var j = 0,ll=col.columns.length;j<ll;j++){
						var subcol = col.columns[j];
						if(subcol._ordered){
							g.orderBy=i+"-"+j;
							delete subcol._ordered;
							break;
						}
					}
				}
			}
			g.render(g.element);
		}
	},
	getOriginColumns:function(){return this._originColumns;}
});

/*
 * Grid column freeze
 * @author yanghengfeng
 */
baidu.ui.Grid.register(function(g){
	if(g.freeze){
		
		g.addEventListener("initialized",function(e,data){
			if(g.fixColIndex!=-1){return ;}
			//header
			//BUG 没有考虑分组列头
			var  headertbl = baidu.dom.query("table", g.ref.gheader)[0].cloneNode(true);
			baidu.array.each(headertbl.rows,function(row){
				var cells = row.cells,l = cells.length;
				while (l--) {
					var cell= cells[l],
						colIndex = cell.getAttribute("refcol"),
						col= colIndex.indexOf("-")==-1?parseInt(colIndex):parseInt(colIndex.substr(0,colIndex.indexOf("-")));
					if (col >= g.freeze) {
						cell.parentNode.removeChild(cell);
					}
				}
			});
			baidu.dom.addClass(headertbl, "fixedheadertable");
			g.ref.gheader.appendChild(headertbl);
			
			g.addEventListener("afterload",function(){
				//body
				var bodytbl = baidu.dom.query(".fixedbodytable",g.ref.gbody);
				if(bodytbl.length){
					bodytbl[0].parentNode.removeChild(bodytbl[0]);
				}
				bodytbl = baidu.dom.query("table",g.ref.gbody)[0].cloneNode(true);
				baidu.dom.addClass(bodytbl, "fixedbodytable");
				bodytbl.style.width="auto";
				//realfreeze：实际冻结列数
				var rows = bodytbl.rows,row0= bodytbl.rows[0],realfreeze=g.freeze,row0cells= row0.cells;
				baidu.array.each(row0cells,function(cell,i){
					var colIndex = cell.getAttribute("refcol"),
						col= colIndex.indexOf("-")==-1?parseInt(colIndex):parseInt(colIndex.substr(0,colIndex.indexOf("-")));
						if(col==g.freeze){
							realfreeze= i;
							return false;
						}
				});
				for(var i=0,l=rows.length;i<l;i++){
					var cells = rows[i].cells,ll=cells.length;
					while (ll--) {
						if (ll >= realfreeze) {
							cells[ll].parentNode.removeChild(cells[ll]);
						}
					}
				}
				var headertbl = baidu.dom.query(".fixedheadertable",g.ref.gheader)[0];
				baidu.dom.setBorderBoxWidth(bodytbl,headertbl.offsetWidth);
				g.ref.gbody.appendChild(bodytbl);
			});
			function resizeheadertbl(){
				var bodytbl = baidu.dom.query(".fixedbodytable",g.ref.gbody);
				if (bodytbl.length) {
					var headertbl = baidu.dom.query(".fixedheadertable", g.ref.gheader)[0];
					baidu.dom.setBorderBoxWidth(bodytbl[0], headertbl.offsetWidth);
				}
			}
			g.addEventListener("hidecolumn",resizeheadertbl);
			g.addEventListener("showcolumn",resizeheadertbl);
			g.addEventListener("columnresize",resizeheadertbl);
			
		});
		
	}
	
});

/*
 * Grid editable
 * @author yanghengfeng
 */
baidu.ui.Grid.register(function(g){
	var columns = g.columns;
	if(g.editMode==2){//全部编辑直接将c.renderer= c.editOption.editRenderer;
	
		baidu.dom.addClass(g.element,"tangramgrid-editable");
		
		baidu.array.each(columns,function(c,colIndex){
			c.sortable=false;
			if(c.editable && c.editOption && baidu.lang.isFunction(c.editOption.editRenderer)){
				c.renderer= c.editOption.editRenderer;
				c.resizable=false;
			}
			if(c.columns){
				baidu.array.each(c.columns,function(subc){
					subc.sortable=false;
					if(subc.editable && subc.editOption && baidu.lang.isFunction(subc.editOption.editRenderer)){
						subc.renderer= subc.editOption.editRenderer;
						subc.resizable=false;
					}
				});
			}
		});
		
		//trigger onBeginEdit when data loaded
		g.addEventListener("afterload",function(e,griddata){
			g.cellIterator(function(param){
				if(!baidu.dom.hasClass(param.row,"editing"))baidu.dom.addClass(param.row,"editing")
				if(param.column.editable && param.column.editOption && baidu.lang.isFunction(param.column.editOption.onBeginEdit)){
					param.column.editOption.onBeginEdit.call(g,param);
				}
			});
		});
	}
	if(g.editMode=="3"){//按单元格编辑
		g.addEventListener("cellclick",function(e,data){
			if(baidu.dom.hasClass(data.ref.cell,"editingcell")) return ;
			var cell = data.ref.cell,editingcell = baidu.dom.query(".editingcell",g.ref.gbody);
			editingcell= editingcell.length>0?editingcell[0]:null;
			if(editingcell){//end editing cell
				var columnIndex =-1,refIndex=-1,
					row= editingcell.parentNode,
					siblings=row.childNodes,
					rowIndex = parseInt(row.getAttribute("rowindex"),10);
				for(var i=0,l=siblings.length;i<l;i++){
					if(siblings[i]==editingcell) {columnIndex=i;break;}
				}
				refIndex= data.ref.table.rows[0].cells[columnIndex].getAttribute("refcol");
				var column= g._getCol(refIndex),fieldValue = g._getCellFieldValue(editingcell,column.field);
				g.getData().data.list[rowIndex][column.field]= fieldValue;
				var endeditparam ={columnIndex:columnIndex,refIndex:refIndex,rowIndex:rowIndex,column:g._getCol(refIndex),cell:editingcell,fieldValue:fieldValue};
				if(!g.dispatchEvent("endedit",endeditparam)){return ;}
				if(typeof(g.onEndEdit)=="function"  && g.onEndEdit(e,endeditparam)===false ) {return;}
				editingcell.childNodes[0].innerHTML = g._getCellContent(column,rowIndex);
				baidu.dom.removeClass(editingcell,"editingcell");
			}
			if(data.column && data.column.editable  && data.column.editOption ){
				if(baidu.lang.isFunction(data.column.editOption.editRenderer)){
					//data还少参数
					data.rowdata= g.getData().data.list[data.rowIndex];
					data.cellvalue = data.rowdata[data.column.field];
					data.colopts= data.column;
					data.select= baidu.array.contains(g.selectedRows,rowIndex);
					//{column:col,cell:cell,row:row,colIndex:refcol,rowIndex:rowIndex,rowdata:g.getData().data.list[rowIndex]};
					data.cell = data.ref.cell;
					data.row= data.ref.row;
					data.colIndex = data.refIndex;
					var cellContent = data.column.editOption.editRenderer.call(g,data)||"";
					data.ref.cell.childNodes[0].innerHTML = cellContent;
				}
				baidu.dom.addClass(data.ref.cell,"editingcell");
				if(baidu.lang.isFunction(data.column.editOption.onBeginEdit)){
					data.column.editOption.onBeginEdit.call(g,data);
				}
			}
			g.resize();
		});
	}
});
baidu.ui.Grid.extend({
	/**
	 * 获取最近一次校验错误信息
	 * @return {Array} [｛“错误信息1"},｛“错误信息2"}...]
	 */
	getValidateErrors:function(){
		return this._validateErrors;
	},
	_getCellFieldValue:function(cell,field){
		var elements  = baidu.dom.query("[name="+field+"]",cell),arr=[];
		baidu.array.each(elements,function(el){
			if(el.tagName.toLowerCase()=="input" || el.tagName.toLowerCase()=="textarea"){
				if (el.type == "radio" || el.type=="checkbox") {
					if(el.checked)arr.push(el.value);
				}else{
					arr.push(el.value);
				}
			}
			if(el.tagName.toLowerCase()=="select"){
				arr.push(el.options[el.selectedIndex].value);
			}
		});
		return arr.join(",");
	},
	/**
	 * 校验,逐行逐字段校验，如果校验通过返回true
	 * @param {Number|Array} rowIndex  校验指定行如果为空，所有行都校验，如果是数字，则校验该行，如果是数据，校验数组中行数据
	 * @return {Boolean} 是否校验通过
	 */
	validate:function(rowIndex){
		var g = this,error=false;
		if(!g._validateErrors) g._validateErrors=[];
		g._validateErrors.length=0;//clear errors
		g.cellIterator(function(param){
			if(typeof(rowIndex)=="number" && param.rowIndex!=rowIndex){return true;}
			if(baidu.lang.isArray(rowIndex) && (!baidu.array.contains(parseInt(rowIndex,10),param.rowIndex))){return true;}
			if(g.editMode=="2" && (!baidu.dom.hasClass(param.row,"editing"))){return true;}
			if(g.editMode=="3" && (!baidu.dom.hasClass(param.cell,"editingcell"))){return true;}
			var col = param.column;
			if(col.editable && col.editOption){
				if(baidu.lang.isFunction(col.editOption.getFieldValue)){//自定义获取字段值
					param.fieldValue= col.editOption.getFieldValue.call(g,param);
				}else{//没有定义，去单元格里面找name=[field]的字段值
					param.fieldValue= g._getCellFieldValue(param.cell,col.field);
				}
			}
			if(col.editable && col.editOption && baidu.lang.isFunction(col.editOption.validate)){
				var validateResult = col.editOption.validate.call(g,param);
				if(validateResult===false){//返回false，整个校验结束
					error=true;
					return false;
				}
				if(baidu.lang.isString(validateResult)){//如果返回是字符串，认为是返回错误信息
					g._validateErrors.push(validateResult);
				}
			}
		});
		return g._validateErrors.length==0 && (!error);
	},
	/**
	 * 获取当前编辑数据
	 * @param {Array|String} fields 需要获取的字段，如果为空，获取全部字段
	 * @param {Array|Number} rowIndex 获取数据的行，可以是数字，数字数组，用于提取相应行，若空，获取所有行
	 */
	getCurrentData:function(fields,rowIndex){
		var g=this,result=[],o={},list =g.getData().data.list.slice();
		for (var i = list.length-1; i >=0; i--) {
			var row = g.getData().data.list[i];
			if (typeof(rowIndex) == "number" && i != rowIndex) { continue;}
			if (baidu.lang.isArray(rowIndex) && (!baidu.array.contains(rowIndex, i))) { continue;}
			if (!fields) {result.push(row);}
			if (baidu.lang.isString(fields)) {
				var nrow = {};
				nrow[fields] = row[fields] == "0" ? "0" : (row[fields] || "");
				result.push(nrow);
			}
			if (baidu.lang.isArray(fields)) {
				var nrow = {};
				baidu.array.each(fields, function(f){
					nrow[f] = row[f] == "0" ? "0" : (row[f] || "");
				});
				result.push(nrow);
			}
			//删除行不获取
			if ((g._deletedRowIndexes && baidu.array.contains(g._deletedRowIndexes, i))) {
				list.splice(i,1);
			}else {
				o[i] = result.length - 1;
			}
		}
		g.cellIterator(function(param){
			if(typeof(o[param.rowIndex])=="undefined") return true;//跳过不需要获取的行
			var row = param.row,col= param.column,resultrow = result[o[param.rowIndex]],field=col.field;
			if(baidu.dom.hasClass(row,"editing") &&  col.editable && (typeof(resultrow[field])!="undefined")){
				var newValue=null;
				if(col.editOption && baidu.lang.isFunction(col.editOption.getFieldValue)){//自定义获取字段值
					newValue= col.editOption.getFieldValue.call(g,param);
				}else{//没有定义，去单元格里面找name=[field]的字段值
					newValue= g._getCellFieldValue(param.cell,col.field);
				}
				resultrow[field]=newValue;
			}
		});
		return result;
	},
	/**
	 * 获取正在编辑的行下标数组
	 * @return {Array} 格式形如[rowIndex1,rowIndex2,...]
	 */
	getEditingRowIndexes:function(){
		var g= this,editingRows = baidu.dom.query("table:eq(0) .editing",g.ref.gbody),result=[];
		if(g.editMode!="1") return result;
		baidu.array.each(editingRows,function (row){
			result.push(parseInt(row.getAttribute("rowindex"),10));
		});
		return result;
	},
	/**
	 * 开始编辑行
	 * @param {Number|Array} rowIndexes 需要激活编辑的行序号，数字，激活一行，数组，激活多行,为空的话，不激活任何行
	 */
	beginEditRow:function(rowIndexes){
		if(typeof(rowIndexes)=="undefined") return ;
		if(typeof(rowIndexes)=="number") rowIndexes=[rowIndexes];
		if(typeof(rowIndexes)=="string" && (!isNaN(rowIndexes))) rowIndexes=[parseInt(rowIndexes,10)];
		if(!rowIndexes.length) return ;
		var g = this;
		if(g.editMode!="1") return ;
		g.cellIterator(function(param){
			var row = param.row,col= param.column;
			if( col.editable  && col.editOption  && baidu.array.contains(rowIndexes,param.rowIndex) ){
				if(!baidu.dom.hasClass(row,"editing")){baidu.dom.addClass(row,"editing");}
				if(baidu.lang.isFunction(col.editOption.editRenderer)){
					var cellContent = col.editOption.editRenderer.call(g,param)||"";
					param.cell.childNodes[0].innerHTML = cellContent;
				}
				if(baidu.lang.isFunction(col.editOption.onBeginEdit)){
					col.editOption.onBeginEdit.call(g,param);
				}
				
			}
		});
		g.resize();
	},
	/**
	 * 结束编辑行
	 * @param {Number|Array} rowIndexes 需要结束编辑的行序号，数字，激活一行，数组，激活多行,为空的话，不结束编辑任何行
	 */
	endEditRow:function(rowIndexes){
		if(typeof(rowIndexes)=="undefined") return ;
		if(typeof(rowIndexes)=="number") rowIndexes=[rowIndexes];
		if(typeof(rowIndexes)=="string" && (!isNaN(rowIndexes))) rowIndexes=[parseInt(rowIndexes,10)];
		if(!rowIndexes.length) return ;
		var g = this;
		if(g.editMode!="1") return ;
		g.cellIterator(function(param){
			var row = param.row,col= param.column;
			if( col.editable  && col.editOption  && baidu.array.contains(rowIndexes,param.rowIndex) ){
				if(baidu.dom.hasClass(row,"editing")){baidu.dom.removeClass(row,"editing");}
				param.cell.childNodes[0].innerHTML = g._getCellContent(col,param.rowIndex);
			}
		});
		g.resize();
	},
	/**
	 * 添加编辑行
	 * @param {Object} row 行数据
	 * @param {Object} rowIndex 在行序号为rowIndex之后添加行，如果为空，在最后一行追加
	 */
	/*addEditRow: function(row, rowIndex){
		var g = this, editingRows = g.getEditingRowIndexes(), currentData = g.getCurrentData();
		if(g.editMode!="1") return -1;
		if (typeof(rowIndex) == "undefined") 
			rowIndex = currentData.length;
		currentData.splice(rowIndex, 0, row);
		g.getData().data.list = currentData;
		g.loadData(g.getData());
		for (var i = 0, l = editingRows.length; i < l; i++) {
			if (editingRows[i] >= rowIndex) {
				editingRows[i]++;
			}
		}
		editingRows.push(rowIndex);
		g.beginEditRow(editingRows);
	},*/
	/**
	 * 删除编辑行
	 */
	deleteEditRow:function(rowIndex){
		var g= this;
		if(g.editMode!="1") return ;
		if(baidu.dom.query("[rowindex=" + rowIndex + "]", g.ref.gbody).length==0 || isNaN(rowIndex)) return ;
		window.setTimeout(function(){
			g.deleteDOMRow(rowIndex);
			if(!g._deletedRowIndexes) g._deletedRowIndexes=[];
			g._deletedRowIndexes.push(parseInt(rowIndex,10));
		},50);
	}
});

/*
 * Grid  group & summary
 * @author yanghengfeng
 */
baidu.ui.Grid.ext.summarytype={
	/**
	 * 计数方法统计
	 * @param {Object} previousvalue 上一次调用该方法的返回值
	 * @param {Object} v 此次调用方法的字段值
	 * @param {Object} seqIndex 统计数据组当前行序号
	 * @param {groupdata} sequencelength 需统计数据组长度
	 */
	count:function(previousvalue,v,seqIndex,sequencelength){
		return seqIndex+1;
	},
	sum:function(previousvalue,v,seqIndex){
		if(seqIndex==0){
			return parseFloat(v);
		}else{
			return (previousvalue+parseFloat(v));
		}
	},
	avg:function(previousvalue,v,seqIndex,sequencelength){
		var g=this,result ={};
		//remember iterator times and sumarry value when it is not the last time 
		if(seqIndex==0){
			result= {times:1,value:v};
		}else{
			result= {times:(previousvalue.times+1),value:(previousvalue.value+v)};
		}
		if(result.times==sequencelength){//final average value
			result = (result.value/result.times);
		}
		return result;
	},
	max:function(previousvalue,v,seqIndex){
		if(seqIndex==0) return v;
		if(v>previousvalue){
			return v;
		}else{
			return previousvalue;
		}
	},
	min:function(previousvalue,v,seqIndex){
		if(seqIndex==0) return v;
		if(v<previousvalue){
			return v;
		}else{
			return previousvalue;
		}
	},
	maxnumber:function(previousvalue,v,seqIndex){
		if(seqIndex==0) return v;
		previousvalue=parseFloat(previousvalue);
		v= parseFloat(v);
		if(v>previousvalue){
			return v;
		}else{
			return previousvalue;
		}
	},
	minnumber:function(previousvalue,v,seqIndex){
		if(seqIndex==0) return v;
		previousvalue=parseFloat(previousvalue);
		v= parseFloat(v);
		if(v<previousvalue){
			return v;
		}else{
			return previousvalue;
		}
	}

};
baidu.ui.Grid.register(function(g){
	//if(!g.groupBy) return ;
	g.addEventListener("beforeload",function(e,griddata){
		var g=this,list = griddata.data.list,groupedlist=[],groupedValueSort=[],cols= g.columns;
		g.groupdata = {};//{groupFieldValue:{rows:[],summary:{}}}
		g.summarydata={};//每个字段的总统计值
		var groupdata= g.groupdata;//short reference
		for(var i=0,l=list.length;i<l;i++){
			var row  = list[i],groupFieldValue = row[g.groupBy];
			if (!groupdata[groupFieldValue]) {
				groupdata[groupFieldValue] = {rows:[],summary:{}};
				groupedValueSort.push(groupFieldValue);
			}
			groupdata[groupFieldValue].rows.push(i);
			
			if (g.summary) {
				for (var j = 0, ll = cols.length; j < ll; j++) {
					var col = cols[j], f = col.field;
					if (!col.columns) {
						if (col.summay && typeof(baidu.ui.Grid.ext.summarytype[col.summay]) == "function") {
							g.summarydata[f] = baidu.ui.Grid.ext.summarytype[col.summay](g.summarydata[f], row[f], i, l);
						}
					}
					else {
						for (var subi = 0, subl = col.columns.length; subi < subl; subi++) {
							var subcol = col.columns[subi];
							if (subcol.summay && typeof(baidu.ui.Grid.ext.summarytype[subcol.summay]) == "function") {
								g.summarydata[f] = baidu.ui.Grid.ext.summarytype[subcol.summay](g.summarydata[f], row[f], i, l);
							}
						}
					}
				}
			}
		}
		for (var i = 0, l = groupedValueSort.length; i < l; i++) {
			var groupFieldValue=groupedValueSort[i],data =groupdata[ groupFieldValue ],cols= g.columns ;
			for (var ii = 0, ll = data.rows.length; ii < ll; ii++) {
				
				var listrow = list[data.rows[ii]];
				if(!listrow){
				}
				groupedlist.push(listrow);
				
				if (g.groupSummary) {
					for (var j = 0, cll = cols.length; j < cll; j++) {
						var col = cols[j], f = col.field;
						if (!col.columns) {
							if (col.groupSummary && typeof(baidu.ui.Grid.ext.summarytype[col.groupSummary]) == "function") {
								data.summary[f] = baidu.ui.Grid.ext.summarytype[col.groupSummary](data.summary[f], listrow[f], ii, ll);
							}
						}else {
							for (var subi = 0, subl = col.columns.length; subi < subl; subi++) {
								var subcol = col.columns[subi];
								if (subcol.groupSummary && typeof(baidu.ui.Grid.ext.summarytype[subcol.groupSummary]) == "function") {
									data.summary[f] = baidu.ui.Grid.ext.summarytype[subcol.groupSummary](data.summary[f], listrow[f], ii, ll);
								}
							}
						}
					}
				}
			}
		}
		griddata.data.list=groupedlist;//调整为分组后的顺序
	});
	
	var _lastGroupValue=null;
	g.addEventListener("beginrowjoin",function(e,param){
		//{realColumnsLength:realColumnsLength,rowdata:row,rowIndex:i,joinedArray:arr}
		var groupValue = param.rowdata[g.groupBy],cellValue=groupValue,arr=param.joinedArray,cols=g.columns;
		if(typeof(g.groupHeader)=="function"){
			cellValue= g.groupHeader({groupValue:groupValue,groupData:g.groupdata})||"";
		}
		if(_lastGroupValue!= groupValue){
			if (_lastGroupValue != null && g.groupSummary) {
				arr.push("<tr class='groupsummaryrow' groupfieldvalue='"+groupValue+"'>");
				for (var j = 0, cll = cols.length; j < cll; j++) {
					var col = cols[j];
					if (!col.columns) {
						var  f = col.field||"",groupSummaryValue= g.groupdata[_lastGroupValue].summary[f];
						groupSummaryValue= (groupSummaryValue=="0"?0:(groupSummaryValue||""));
						var cellText = typeof(col.groupSummaryFormat)=="string"?baidu.string.format(col.groupSummaryFormat,{groupSummaryValue:groupSummaryValue}):groupSummaryValue;
						if(typeof(col.groupSummaryFormat)=="function"){
							cellText= col.groupSummaryFormat.call(g,{groupSummaryValue:groupSummaryValue});
						}
						arr.push("<td  nowrap='nowrap' style='" + (col.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (col.align || "left") + ";' > " +cellText + "</span></td>");
						
					}else {
						for (var subi = 0, subl = col.columns.length; subi < subl; subi++) {
							var  subcol= col.columns[subi],f = subcol.field||"",groupSummaryValue= g.groupdata[_lastGroupValue].summary[f];
							groupSummaryValue= (groupSummaryValue=="0"?0:(groupSummaryValue||""));
							var cellText = typeof(subcol.groupSummaryFormat)=="string"?baidu.string.format(subcol.groupSummaryFormat,{groupSummaryValue:groupSummaryValue}):groupSummaryValue;
							if(typeof(subcol.groupSummaryFormat)=="function"){
								cellText= subcol.groupSummaryFormat.call(g,{groupSummaryValue:groupSummaryValue});
							}
							arr.push("<td  nowrap='nowrap' style='" + (subcol.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (subcol.align || "left") + ";' > " +cellText + "</span></td>");
						}
					}
				}
				arr.push("</tr>");
			}
			
			param.joinedArray.push("<tr class='groupheaderrow' groupfieldvalue='"+groupValue+"'><td colspan='"+param.realColumnsLength+"' class='gridcell'><span class='groupheadertoggler expanded '>－</span>"+cellValue+"</td></tr>");
		}
		_lastGroupValue= groupValue;
	});
	
	g.addEventListener("endrowjoin",function(e,param){
		if(param.rowIndex +1==g.getData().data.list.length){
			var groupdata = g.groupdata,arr= param.joinedArray,groupValue = param.rowdata[g.groupBy],cols= g.columns;
			//补齐最后一行的分组合计
			if(groupValue && g.groupSummary && groupdata[groupValue]){
				arr.push("<tr class='groupsummaryrow' groupfieldvalue='"+groupValue+"'>");
				for (var j = 0, cll = cols.length; j < cll; j++) {
					var col = cols[j];
					if (!col.columns) {
						var  f = col.field||"",groupSummaryValue= g.groupdata[groupValue].summary[f];
						groupSummaryValue= (groupSummaryValue=="0"?0:(groupSummaryValue||""));
						var cellText = typeof(col.groupSummaryFormat)=="string"?baidu.string.format(col.groupSummaryFormat,{groupSummaryValue:groupSummaryValue}):groupSummaryValue;
						if(typeof(col.groupSummaryFormat)=="function"){
							cellText= col.groupSummaryFormat.call(g,{groupSummaryValue:groupSummaryValue});
						}
						arr.push("<td  nowrap='nowrap' style='" + (col.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (col.align || "left") + ";' > " +cellText + "</span></td>");
						
					}else {
						for (var subi = 0, subl = col.columns.length; subi < subl; subi++) {
							var  subcol= col.columns[subi],f = subcol.field||"",groupSummaryValue= g.groupdata[groupValue].summary[f];
							groupSummaryValue= (groupSummaryValue=="0"?0:(groupSummaryValue||""));
							var cellText = typeof(subcol.groupSummaryFormat)=="string"?baidu.string.format(subcol.groupSummaryFormat,{groupSummaryValue:groupSummaryValue}):groupSummaryValue;
							if(typeof(subcol.groupSummaryFormat)=="function"){
								cellText= subcol.groupSummaryFormat.call(g,{groupSummaryValue:groupSummaryValue});
							}
							arr.push("<td  nowrap='nowrap' style='" + (subcol.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (subcol.align || "left") + ";' > " +cellText + "</span></td>");
						}
					}
				}
				arr.push("</tr>");
			}
			
		}
	});
	
	g.addEventListener("endrowsjoin",function(e,param){
		var groupdata = g.groupdata,arr= param.joinedArray,cols= g.columns;
		//总计
		if(g.summary){
			arr.push("<tr class='summaryrow'>");
			for (var j = 0, cll = cols.length; j < cll; j++) {
				var col = cols[j];
				if (!col.columns) {
					var  f = col.field||"",summaryValue= g.summarydata[f];
					summaryValue= (summaryValue=="0"?0:(summaryValue||""));
					var cellText = typeof(col.summaryFormat)=="string"?baidu.string.format(col.summaryFormat,{summaryValue:summaryValue}):summaryValue;
					if(typeof(col.summaryFormat)=="function"){
						cellText= col.summaryFormat.call(g,{summaryValue:summaryValue});
					}
					arr.push("<td  nowrap='nowrap' style='" + (col.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (col.align || "left") + ";' > " +cellText + "</span></td>");
					
				}else {
					for (var subi = 0, subl = col.columns.length; subi < subl; subi++) {
						var  subcol= col.columns[subi],f = subcol.field||"",summaryValue= g.summarydata[f];
						summaryValue= (summaryValue=="0"?0:(summaryValue||""));
						var cellText = typeof(subcol.summaryFormat)=="string"?baidu.string.format(subcol.summaryFormat,{summaryValue:summaryValue}):summaryValue;
							if(typeof(subcol.summaryFormat)=="function"){
							cellText= subcol.summaryFormat.call(g,{summaryValue:summaryValue});
						}
						arr.push("<td  nowrap='nowrap' style='" + (subcol.hide ? "display:none;" : "") + "'><span class='cellcontent' style='text-align:" + (subcol.align || "left") + ";' > " +cellText + "</span></td>");
					}
				}
			}
			arr.push("</tr>");
		}
	});
	
	g.addEventListener("cellclick",function(e,data){
		var cell = data.ref.cell,row= cell.parentNode;
		if(baidu.dom.hasClass(row,"groupheaderrow")){// click groupheaderrow to toggle sub rows
			var groupfieldvalue=row.getAttribute("groupfieldvalue"),
				rowIndexes=g.groupdata[groupfieldvalue].rows,
				expander = baidu.dom.query(".groupheadertoggler",cell)[0],
				toUnExpand=baidu.dom.hasClass(expander,"expanded") ;
				if(toUnExpand){
					expander.innerHTML="＋";
					baidu.dom.removeClass(expander,"expanded");
				}else{
					expander.innerHTML="－";
					baidu.dom.addClass(expander,"expanded");
				}
				var crow = row.nextSibling;
				while(crow && crow.getAttribute("rowindex")){
					crow.style.display=(toUnExpand?"none":"");
					crow=  crow.nextSibling;
				}
		}
		
	});
});

/**
 * @author yanghengfeng
 * grid key event addon
 */
baidu.ui.Grid.register(function(g){
	if(!g.keyboard) return ;
	//↓ 40 ↑38 ←37 → 39  PgDn 34 PgUp 33 tab 9
	if(!g.keysrc) g.keysrc= document;
	//focus
	baidu.on(g.element,"click",function(e){
		e= baidu.event.get(e);
		if(!baidu.dom.hasClass(g.element,"tangram-focused")){
			g.focus();
			e.stopPropagation();
		}
	});
	//blur
	baidu.on(document.body,"click",function(e){
		var s = baidu.event.getTarget(e);
		if (!baidu.dom.contains(g.element, s)) {
			g.blur();
		}
	});
	//keyboard handler
	baidu.on(g.keysrc,"keydown",function(e){
		e = baidu.event.get(e);
		var handled= false;
		if(!baidu.dom.hasClass(g.element,"tangram-focused")){return true;}
		
		//↓ 40 ↑38 单选时触发行点击
		if(e.keyCode==40 && g.selectMode==1){
			var rowIndex=-1,nextrow=null;
			if(g.selectedRows.length==0){
				rowIndex = g.getData().data.list.length>0?0:-1;
			}else{
				var selrow = baidu.dom.query(".gridrow[rowindex="+g.selectedRows[0]+"]",g.ref.gbody)[0];
				nextrow=selrow.nextSibling;
				while(nextrow &&  ( (!nextrow.getAttribute("rowindex")) || (nextrow.style.display=="none") || (!baidu.dom.hasClass(nextrow,"gridrow"))) ){
					nextrow= nextrow.nextSibling;
				}
				nextrow && (rowIndex = parseInt(nextrow.getAttribute("rowindex"),10));
				
			}
			if(rowIndex!=-1){
				g.selectRow(rowIndex);
				if(nextrow) {
					nextrow.scrollIntoView();
					g.ref.yscroller.scrollTop=g.ref.gbody.scrollTop;
				}
				handled=true;
			}
		}
		if(e.keyCode==38 && g.selectMode==1){
			var rowIndex=-1,prevrow=null;
			if(g.selectedRows.length==0){
				rowIndex = g.getData().data.list.length>0?0:-1;
			}else{
				var selrow = baidu.dom.query(".gridrow[rowindex="+g.selectedRows[0]+"]",g.ref.gbody)[0];
				prevrow=selrow.previousSibling;
				while(prevrow && ( (!prevrow.getAttribute("rowindex")) || (prevrow.style.display=="none")  ||  (!baidu.dom.hasClass(prevrow,"gridrow")) ) ){
					prevrow= prevrow.previousSibling;
				}
				prevrow && (rowIndex = parseInt(prevrow.getAttribute("rowindex"),10));
			}
			if(rowIndex!=-1){
				g.selectRow(rowIndex);
				if (prevrow) {
					prevrow.scrollIntoView();
					g.ref.yscroller.scrollTop = g.ref.gbody.scrollTop;
				}
				handled=true;
			}
		}
		//<CR> 触发dblclick
		if(e.keyCode==13 && g.selectMode==1 && g.selectedRows.length>0){
			var selrow = baidu.dom.query(".gridrow[rowindex="+g.selectedRows[0]+"]",g.ref.gbody)[0];
			baidu.event.fire(selrow, "dblclick", {});
			handled=true;
		}
		// PgDn 34 PgUp 33 翻页 (非treegrid 可用 ←37 → 39 )
		if(e.keyCode==33 || ((!g.treeoption) && e.keyCode==37 )){
			if (!e.ctrlKey) {
				if (g.ref.pager && g.ref.pager.prev && (!g.ref.pager.prev.disabled)) {
					baidu.event.fire(g.ref.pager.prev, "click", {});
					handled=true;
				}
			}else{
				if (g.ref.pager && g.ref.pager.first && (!g.ref.pager.first.disabled)) {
					baidu.event.fire(g.ref.pager.first, "click", {});
					handled=true;
				}
				
			}
			
		}
		if(e.keyCode==34 || ((!g.treeoption) && e.keyCode==39 )){
			if (!e.ctrlKey) {
				if(g.ref.pager && g.ref.pager.next && (!g.ref.pager.next.disabled)){
					baidu.event.fire(g.ref.pager.next,"click",{});
					handled=true;
				}
			}else{
				if (g.ref.pager && g.ref.pager.last && (!g.ref.pager.last.disabled)) {
					baidu.event.fire(g.ref.pager.last, "click", {});
					handled=true;
				}
			}
		}
		//←37 → 39  TreeGrid节点收缩/展开
		if(e.keyCode==39 && g.treeoption && g.selectMode=="1" && g.selectedRows.length>0){
			var refidv=null,expander = baidu.dom.query("[rowindex="+g.selectedRows[0]+"] .expander[refidv]",g.ref.gbody);
			if(expander.length>0)refidv = expander[0].getAttribute("refidv");
			if (null != refidv) {
				g.expandNode(refidv);
				handled=true;
			}
			
		}
		if(e.keyCode==37 && g.treeoption && g.selectMode=="1" && g.selectedRows.length>0){
			var refidv=null,expander = baidu.dom.query("[rowindex="+g.selectedRows[0]+"] .expander[refidv]",g.ref.gbody);
			if(expander.length>0)refidv = expander[0].getAttribute("refidv");
			if (null != refidv) {
				g.unExpandNode(refidv);
				handled=true;
			}
			
		}
		//可编辑表格 单元格编辑  tab切换单元格
		if(e.keyCode==9){
			if(g.editMode==3){
				if (!e.shiftKey) {
					var nextcell = null, currentcell = null;
					g.cellIterator(function(c){
						if (c.row.style.display == "none" || (!c.column.editable)) {//skip hidden row  and uneditable cell
							return true;
						}
						if (null != currentcell) {
							nextcell = c.cell;
							return false;
						}
						if (baidu.dom.hasClass(c.cell, "editingcell"))  currentcell = c.cell;
						if (null == nextcell)  nextcell = c.cell;
					});
					if (null != nextcell) {
						baidu.event.fire(nextcell.childNodes[0], "click", {});
						handled = true;
					}
				}else{//shift+tab 
					var prevcell=null; currentcell=null;
					g.cellIterator(function(c){
						if (c.row.style.display == "none" || (!c.column.editable)) {//skip hidden row  and uneditable cell
							return true;
						}
						if (baidu.dom.hasClass(c.cell, "editingcell")) {
							return false;
						}
						prevcell = c.cell;
					});
					if (null != prevcell) {
						baidu.event.fire(prevcell.childNodes[0], "click", {});
						handled = true;
					}
				}
			}else{//tab to blur
				g.blur();
				handled=true;
			}
		}
		
		if(handled){
			e.preventDefault();
			e.stopPropagation();
		}
	});
});
baidu.ui.Grid.extend({
	focus:function(){
		baidu.dom.addClass(this.element,"tangram-focused");
		try{this.element.focus();}catch(e){}
	},
	blur:function(){
		baidu.dom.removeClass(this.element,"tangram-focused");
		try{this.element.blur();}catch(e){}
	}
});

/**
 * @author yanghengfeng
 * grid page sort addon
 */
baidu.ui.Grid.register(function(g){
	if(g.page==false){
		g.addEventListener("beforesort",function(e,data){
			var col=g._getCol(data.colIndex),order= data.order;
			if(col.sortable!==false && col.field && (!g.url)){
				var list = g.getData().data.list;
				list.sort(function(a,b){
					if(isNaN(a[col.field]) && isNaN(b[col.field])){//都不是数字，做字符串比较
						return order=="asc"?
							a[col.field].toString().localeCompare(b[col.field].toString()):
							b[col.field].toString().localeCompare(a[col.field].toString());
					}else{//数字比较
						return order=="asc"? a[col.field]-b[col.field]: b[col.field]-a[col.field];
					}
				});
				g.loadData(g.getData());
			}
		});
	}
});

/*
 * Grid row expand addon
 * columns:[
			{
				field:'id',
				width:30,
				align:"center",
				renderer:"rowexpand",//列类型rowexpand
				title:"点击查看/收起详细信息",// +/-提示信息
				onExpand:function(param){
					//param: {expandedrow:expandedrow,expandedcell:expandedcell,data:cellclickdata}
					param.expandedcell.innerHTML=baidu.string.format("<div style='height:50px;padding:30px;'>机器#{name}详细信息</div>",this.getData().data.list[param.data.rowIndex]);
				},
				onUnExpand:function(param){
					//param: {expandedrow:expandedrow,expandedcell:expandedcell,data:cellclickdata}
					console.log("onunexpand");
				}
			},
			//...
 * @author yanghengfeng
 */
baidu.ui.Grid.ext.coltype.rowexpand={
	headerformat:function (header,colopt,colIndex){
		colopt.resizable=false;
		colopt.sortable=false;
		return "&nbsp;";
	},
	format:function(data){
		//{cellvalue:celltext,colopts:col,rowdata:row,rowIndex:i}
		var title =data.colopts.title?(" title="+data.colopts.title):"";
		return "<b class='grid-expand unexpanded'"+title+">＋</b>";
	},
	init:function(){
		var g=this;
		g.addEventListener("cellclick",function(e,data){
			if(baidu.dom.hasClass(data.ref.src,"grid-expand")){//点击+/-
				var row = data.ref.row,col= g._getCol(data.refIndex),expander=data.ref.src ;
				if(row.nextSibling && baidu.dom.hasClass(row.nextSibling,"grid-expandedrow")){//已经展开 收缩
					var expandedrow = row.nextSibling;
					if(baidu.lang.isFunction(col.onUnExpand)){
						col.onUnExpand.call(g,{expandedcell:expandedrow.childNodes[0],expandedrow:expandedrow,data:data});
					}
					expandedrow.parentNode.removeChild(expandedrow);
					expander.innerHTML="＋";
					expander.className="grid-expand";
					baidu.dom.removeClass(data.ref.cell,"grid-expandedcell");
					g.resize();
				}else{//展开
					var expandedrow = document.createElement("tr");
					expandedrow.className="grid-expandedrow";
					var expandedcell  = document.createElement("td");
					expandedcell.setAttribute("colspan",row.cells.length);
					//expandedcell.innerHTML="haha";//TODO
					if(baidu.lang.isFunction(col.onExpand)){
						col.onExpand.call(g,{expandedcell:expandedcell,expandedrow:expandedrow,data:data});
					}
					expandedrow.appendChild(expandedcell);
					if (row.nextSibling) {
						row.parentNode.insertBefore(expandedrow, row.nextSibling);
					}else{
						row.parentNode.appendChild(expandedrow);
					}
					expander.innerHTML="－";
					expander.className="grid-expand expanded";
					baidu.dom.addClass(data.ref.cell,"grid-expandedcell");
					g.resize();
				}
			}
		});
        g.expandAll=function(){
            var expanders=baidu.dom.query(".grid-expand:not(.expanded)",g.element);
            baidu.array.each(expanders,function(e){
                baidu.event.fire(e,"click");
            });
        }
        g.unExpandAll=function(){
            var expanders=baidu.dom.query(".expanded",g.element);
            baidu.array.each(expanders,function(e){
                baidu.event.fire(e,"click");
            });
        }
	}
};

/*
 * Grid row sortable addon
 * add config option rowsortable,if rowsortable=true grid rows are sortable
 * add a method serializeRows return current rows data in grid
 * add events:"rowsortable-dragstart","rowsortable-draggging","rowsortable-dragend"
 * @author yanghengfeng
 */
baidu.ui.Grid.register(function(g){
	if(!g.rowsortable) return ;
	//加载时间前解除事件绑定
	g.addEventListener("beforeload",function(e,data){
		var table = baidu.dom.query(".gridtable",g.ref.gbody);
		if(table.length){
			table= table[0];
			baidu.event.un(table,"mousedown");
		}
	});
	g.addEventListener("afterload",function(e,data){
		var y =0,table = baidu.dom.query(".gridtable",g.ref.gbody)[0],_isdragging=false,_y=0,_row=null;
		
		function dragstart(e){
			var s = g._getSrc(e);
			g._rs={y:e.clientY,row:s.row,table:table};
			baidu.dom.addClass(s.row,"row-dragging");
			g.dispatchEvent("rowsortable-dragstart");
		}
		baidu.event.on(table,"mousedown",dragstart);
		
		if(!g._rs_draggging_bind) g._rs_draggging_bind= baidu.fn.bind(g._rs_draggging,g);
		if(!g._rs_dragend_bind) g._rs_dragend_bind= baidu.fn.bind(g._rs_dragend,g);
		
		baidu.event.un(document,"mousemove",g._rs_draggging_bind);
		baidu.event.on(document,"mousemove",g._rs_draggging_bind);
		baidu.event.un(document,"mouseup",g._rs_dragend_bind);
		baidu.event.on(document,"mouseup",g._rs_dragend_bind);
		
	});
});
baidu.ui.Grid.extend({
	/**
	 * 获取当前数据排序数组
	 * @return {Array} 格式形如 [｛当前第一行数据,rowIndex:原行序号},｛当前第二行数据,rowIndex:原行序号}...]
	 */
	serializeRows:function(){
		var g = this,rows= baidu.dom.query("[rowindex]",g.ref.gbody),result=[];
		baidu.array.each(rows,function(row){
			var rowIndex = row.getAttribute("rowindex");
			result.push(g.data.data.list[rowIndex]);
			result[result.length-1].rowIndex = rowIndex;
		});
		return result;
	},
	/**
	 * 获取当前选中的行排序数组
	 * @return {Array} 格式形如 [｛当前选中第一行数据,rowIndex:原行序号},｛当前选中第二行数据,rowIndex:原行序号}...]
	 */
	getSerializedSelections:function(){
		var g = this,rows= baidu.dom.query("[rowindex]",g.ref.gbody),result=[];
		baidu.array.each(rows,function(row){
			var rowIndex = row.getAttribute("rowindex");
			if(baidu.array.indexOf(g.selectedRows,parseInt(rowIndex,10))!=-1){
				result.push(g.data.data.list[rowIndex]);
				result[result.length-1].rowIndex = rowIndex;
			}
		});
		return result;
	},
	_rs_draggging:function(e){
		var g = this;
		if(g._rs){
			var y = e.clientY,x= e.clientX,down=y>g._rs.y,row= document.elementFromPoint(x,y);
			if (row && baidu.dom.contains(g._rs.table,row)) {
				while (!baidu.dom.hasClass(row, "gridrow") && row!=g._rs.table) {
					row = row.parentNode;
				}
			}
			if(null==row || (!baidu.dom.hasClass(row, "gridrow"))){
				g._rs_dragend();
				return ;
			}
			g.clearSelection();
			if(row!=g._rs.row){
				row.parentNode.insertBefore(g._rs.row, (down ? row.nextSibling : row));
			}
			g._rs.y=y;
			g.dispatchEvent("rowsortable-draggging");
		}
	},
	_rs_dragend:function(e){
		var g = this;
		if(g._rs){
			if(g._rs.row)baidu.dom.removeClass(g._rs.row,"row-dragging");
			delete g._rs;
			g.dispatchEvent("rowsortable-dragend");
			g._webkit();
		}
	}
});

/*
 * Tree Grid  addon
 * @author yanghengfeng
 */
baidu.ui.Grid.register(function(g){
	g.addEventListener("beforeload",function(griddata){
		var list = griddata.data.list,treelist=[],expandNodes=[];
		if (g.treeoption) {
			g.treedata = {root:{children:[],rendered:true,expand:true,deep:0}};//一级节点默认展开
			g._originlist = list.slice();//copy list as _originlist
			//解析树形数据：http://www.blogjava.net/Hafeyang/archive/2011/01/13/how_to_parse_flat_tree_data_to_hierarchy.html
			var o = g.treeoption,d= g.treedata;
			for (var i = 0, l = list.length; i < l; i++) {
				var row = list[i],idv=row[o.idfield],parentv=row[o.parentfield];
				if (!parentv) {
					d.root.children.push(i);
				}else {
					if (!d[parentv]) {//父节点不存在，新建父节点
						d[parentv] = {children: [],rendered: false,expand: false};
					}
					d[parentv].children.push(i);
				}
				if(!d[idv]){
					d[idv]={children: [],rendered: false,expand: false,rowIndex:i};
				}else{
					d[idv].rowIndex=i;
				}
				d[idv].parent=parentv;
				//expandBy
				if(typeof(o.treecol.expandBy)=="function" && o.treecol.expandBy.call(g,{cellvalue:row[o.treecol.field],rowdata:row})===true){
					d[idv].expand=true;
					expandNodes.push(idv);
				}
			}
			//节点展开，父节点也需要展开
			for (var i = 0, l = expandNodes.length; i < l; i++) {
				var n = expandNodes[i],c=n;
				while(c){
					d[c].expand=true;
					c= d[c].parent;
				}
			}
			function traversal(node){
				if(typeof(node.rowIndex)!="undefined"){
					treelist.push(g._originlist[node.rowIndex]);
				}
				if (node.expand) {
					for (var i = 0, l = node.children.length; i < l; i++) {
						var subNodeRowIndex = node.children[i], subNodeRow = g._originlist[subNodeRowIndex], subNode = d[subNodeRow[o.idfield]];
						traversal(subNode);
					}
					node.rendered = true;//rendered:子节点是否都呈现
				}
			}
			traversal(d.root);
			griddata.data.list = treelist;
			
		}
	});
});
baidu.ui.Grid.extend({
	/**
	 * 获取原始数据行
	 */
	getOriginList:function(){
		return this.getData().data._originlist;
	},
	/**
	 * 获取节点的深度
	 * @param {Object} idvalue id字段值
	 */
	getNodeDeep:function(idvalue){
		var g =this,d= g.treedata,deep=0,c=idvalue;
		if(!d[idvalue]){return deep;}
		if (typeof(d[idvalue].deep) == "undefined") {
			while (c) {
				deep++;
				c = d[c].parent;
			}
			d[idvalue].deep=deep; //cache
		}
		return d[idvalue].deep;
	},
	/**
	 * 展开/收缩节点
	 * @param {Object} idvalue id字段值
	 */
	toggleNode:function(idvalue){
		var g= this,d= g.treedata;
		if(d[idvalue].expand){
			g.unExpandNode(idvalue);
		}else{
			g.expandNode(idvalue);
		}
	},
	/**
	 * 呈现节点未呈现的子节点，默认的子节点处于性能考虑不呈现。确保该节点已经呈现
	 * @param {Object} idvalue 节点的id字段值
	 * @return 如果该节点已经呈现所有的子节点，返回该节点的rowIndex,否则返回该节点的最后一个子节点的rowIndex
	 */
	_renderChildren:function(idvalue){
		var g= this,d= g.treedata,subNodes= d[idvalue].children;
		if (!d[idvalue].expand) {
			if (!d[idvalue].rendered) {//render sub rows/nodes
				var row=baidu.dom.query("table:eq(0) .gridrow:has([refidv=" + idvalue + "])", g.ref.gbody),
					 rowIndex = (row.length>0 && row[0].nextSibling)?parseInt(row[0].nextSibling.getAttribute("rowindex")):undefined;
				//if(rowIndex==-1) return ;
				for (var ni = 0, nl = subNodes.length; ni < nl; ni++) {
					var rowdata = g._originlist[subNodes[ni]];
					rowIndex = g.addDOMRow(rowdata, rowIndex);
				}
				d[idvalue].rendered = true;
			}
			//change expander status
			var expanders = baidu.dom.query(".expander[refidv=" + idvalue + "]", g.ref.gbody);
			baidu.array.each(expanders, function(expander){
				baidu.dom.addClass(expander, "expanded");
				expander.innerHTML = "－";
			});
			d[idvalue].expand = true;
		}
		return rowIndex;
	},
	/**
	 * 展开节点
	 * @param {Object} idvalue id字段值
	 * @param {Object} recursive 是否展开所有的子节点,默认为false
	 */
	expandNode:function(idvalue,recursive){
		var g= this,d= g.treedata,subNodes= d[idvalue].children;
		//rowIndex= parseInt(baidu.dom.query("table:eq(0) .gridrow:has([refidv="+idvalue+"])",g.ref.gbody)[0].getAttribute("rowindex"));
		if(!d[idvalue]) return false;
		//可能节点的父节点还没有展开，所以先展开父节点
		var c=idvalue,nodesToExpand=[];
		while(c){
			c= d[c].parent;
			if(c && d[c] && (!d[c].expand)){
				nodesToExpand.unshift(c);
			}
		}
		for(var i=0,l=nodesToExpand.length;i<l;i++){
			g.expandNode(nodesToExpand[i]);
		}
		
		g._renderChildren(idvalue);//呈现当前节点的子节点 
		//show rows/nodes
		for (var ni = 0, nl = subNodes.length; ni < nl; ni++) {
			var rowdata = g._originlist[subNodes[ni]],rowIdValue = rowdata[g.treeoption.idfield];
			var rows = baidu.dom.query(".gridrow:has([refidv="+rowIdValue+"])",g.ref.gbody);
			baidu.array.each(rows,function(r){
				baidu.dom.show(r);
			});
			if(recursive){
				//递归展现所有子节点
				g.expandNode(rowIdValue,true);
			}
		}
		
		g.resize();
	},
	/**
	 * 收缩节点
	 * @param {Object} idvalue id字段值
	 */
	unExpandNode:function(idvalue){
		var g= this,d= g.treedata,subNodes= d[idvalue].children;
		if(!d[idvalue]) return false;
		//change expander status
		var expanders= baidu.dom.query(".expander[refidv="+idvalue+"]",g.ref.gbody);
		baidu.array.each(expanders,function(expander){
			baidu.dom.removeClass(expander,"expanded");
			expander.innerHTML="＋";
		});
		d[idvalue].expand=false;
		for (var ni = 0, nl = subNodes.length; ni < nl; ni++) {
			var subIdValue =g._originlist[subNodes[ni]][g.treeoption.idfield];
			var rows = baidu.dom.query(".gridrow:has([refidv="+subIdValue+"])",g.ref.gbody);
			baidu.array.each(rows,function(r){
				baidu.dom.hide(r);
			});
			g.unExpandNode(subIdValue);
		}
	},
	/**
	 * 添加节点
	 * @param {Object|Array} rows 如果是Object ，当作添加数据，如果是数组，视为节点数据数组,如果是节点数据，要求数据按照深度遍历结果排序(保证父节点出现子节点前)
	 */
	addNode:function(nodes){
		var g = this,d= g.treedata,o= g.treeoption;
		if(baidu.lang.isArray(nodes)){
			for(var i=0,l=nodes.length;i<l;i++){
				g.addNode(nodes[i]);
			}
		}else{//add single node
			var parentIdValue  =nodes[o.parentfield],idValue =  nodes[o.idfield],parent = d[parentIdValue],olist = g._originlist;
			if(!parent) return false;
			g.expandNode(parentIdValue);//展开节点
			var newOriginRowIndex = olist.length;
			olist.push(nodes);
			parent.children.push(newOriginRowIndex);
			d[idValue]={children: [],rendered: false,expand: false,rowIndex:newOriginRowIndex,parent:parentIdValue};
			
			var pp=d[parent.parent||"root"],
				row =baidu.dom.query("table:eq(0) .gridrow:has([refidv="+parentIdValue+"])",g.ref.gbody)[0],
				rowIndex = null;
			if(row.nextSibling){
				rowIndex= parseInt(row.nextSibling.getAttribute("rowindex"),10);
			}
			g.addDOMRow(nodes,rowIndex);
			//update parent row
			var parentrow= baidu.dom.query("table:eq(0) .gridrow:has([refidv="+parentIdValue+"])",g.ref.gbody),
				parentRowIndex = parentrow.length>0?parseInt(parentrow[0].getAttribute("rowindex")):-1;
			if(parentRowIndex!=-1) g.updateDOMRow(olist[parent.rowIndex],parentRowIndex);
			
		}
	},
	/**
	 * 删除节点,删除节点将递归删除所有的子节点
	 */
	deleteNode:function(idvalue){
		var g = this,d= g.treedata,o= g.treeoption,node = d[idvalue],olist = g._originlist;
		if(!node) return ;
		//删除子节点
		var l = node.children.length;
		while(l--){
			var subIdValue=olist[node.children[l]][o.idfield];
			g.deleteNode(subIdValue);
		}
		//删除单独节点
		var parentIdValue = node.parent||"root",parent= d[parentIdValue],nodeOriginRowIndex = node.rowIndex,
			row= baidu.dom.query("table:eq(0) .gridrow:has([refidv="+idvalue+"])",g.ref.gbody),
			rowIndex = row.length>0?parseInt(row[0].getAttribute("rowindex")):-1;
		if (rowIndex != -1) {
			g.deleteDOMRow(rowIndex);
		}
		baidu.array.remove(parent.children,nodeOriginRowIndex);//从父节点的子节点移除
		delete node;
		//更新父节点行显示 
		var parentRow=baidu.dom.query("table:eq(0) .gridrow:has([refidv="+parentIdValue+"])",g.ref.gbody),
			 parentRowIndex = parentRow.length>0?parseInt(parentRow[0].getAttribute("rowindex")):-1;
		if (parentRowIndex != -1) {
			g.updateDOMRow(olist[parent.rowIndex], parentRowIndex);
		}
	}
});
baidu.ui.Grid.ext.coltype.tree={
	headerformat:function (header,colopt,colIndex){
		return header;
	},
	format:function(data){
		var g=this,t = [],idv = data.rowdata[g.treeoption.idfield],node = g.treedata[idv],deep=g.getNodeDeep(idv);
		for(var i=0;i<deep;i++){
			t.push("<span class='spacing'></span>");
		}
		if(node.children.length>0){
			var expander="<span class=' expander "+(node.expand?"expaneded":"")+"' refidv='"+idv+"'>"+(node.expand?"－":"＋")+"</span>";
			t[t.length-1]= expander;
		}
		t.push("<span class='nodecontent'  refidv='"+idv+"'>"+data.cellvalue+"</span>");
		return t.join("");
	},
	init:function(col){
		var g = this;
		if (col.idfield && col.parentfield) {
			g.treeoption = {
				idfield: col.idfield,
				parentfield: col.parentfield,
				treecol:col
			}
		}
		g.addEventListener("cellclick",function(e,data){
			var s = data.ref.src;
			if(baidu.dom.hasClass(s,"expander")){//expander 
				g.toggleNode(s.getAttribute("refidv"));
			}
		});
	}
};
/*
 * nuit grid
 */
(nuit.Grid) || (nuit.Grid=baidu.ui.Grid);

/*
 *  nuit.dialog 对话框
 */

/**
 *  nuit.Msg 消息框
 */
 
/*nuit.Msg */
(nuit.Msg)|| (nuit.Msg= function(opt){
    if(typeof(opt)=="string"){opt={msg:opt};}
    opt=baidu.object.extend({delay:3000,callback:baidu.fn.blank,timeoutclose:true},opt);
    var instance = new nuit.Dialog(baidu.object.extend({
        titleText:"<span class='nuit-Msg-cnt nuit-Msg-"+(opt.type||"success")+"'>"+opt.msg+"</span>",
        contentText:"",
        autoRender:true,
        width:300,
        draggable:false,
        resizable:false,
        tplFooter: "<div id='#{id}' class='#{class}' style='display:none;'></div>",
        modal:false,
        autoDispose:true
    },opt)); 

    //跟IE没关系
    (!document.all) && (baidu.dom.addClass(instance.getMain(),"nuit-Msg-frame"));
    if(!opt.closable){
        baidu.dom.hide(baidu.dom.query(".nuit-dialog-close",instance.getMain())[0]);
    }
    instance.addEventListener("close",opt.callback);
    instance.open();
    
    (!document.all) && (baidu.dom.addClass(instance.getMain(),"nuit-Msg-animation"));
    (!document.all) && (baidu.dom.addClass(instance.getMain(),"nuit-Msg-show"));
    if(instance.timeoutclose!==false){
        setTimeout(function(){
            (!document.all) && (baidu.dom.removeClass(instance.getMain(),"nuit-Msg-show"));
            setTimeout(function(){
                instance.close();
            },500);
        },opt.delay); 
    }
    return instance;
});

/* nuit.Dialog  */
(nuit.Dialog) || (nuit.Dialog = function(opt){
    opt.classPrefix="nuit-dialog";
    return new baidu.ui.Dialog(opt); 
});

(nuit.getLoadingDlg) || (nuit.getLoadingDlg= function(){
    return nuit._loading;
});

/* nuit showLoading & hideLoading */
(nuit.showLoading) || (nuit.showLoading=function(msg){
    if(!nuit._loading) {
        nuit._loading=nuit.Msg({modal:true,timeoutclose:false,type:"loading",msg:"<span id='nuit-loading-msg'>"+(msg||"正在加载...")+"</span>"});
    }else{
        baidu.g("nuit-loading-msg").innerHTML=msg;
    }
});
(nuit.hideLoading) || (nuit.hideLoading=function(msg){
    if(nuit._loading) {
        nuit._loading.close();
        delete nuit._loading;
    }
});

/*
*   tangram.tree.checkbox.js
*   add checkbox support for tangram tree
*   for more infomation: https://github.com/hafeyang/tangram-tree-ext
*   @option.checkbox :true/false 
*   @option.checkMode :1-single check,2-multiple check(default),3-casacade check 
*   @function getCheckNodes(withIndeterminate) : get checked  nodes  ,withIndeterminate : true/false ,with Indeterminate?
*   @author yanghengfeng@baidu.com
*/
(function(){
    
    //Ϊ�������һ������(��д)
    function inheritFunction(Clazz,fnName,ext){
        var oldFn= Clazz.prototype[fnName] ;
        Clazz.prototype[fnName] = function(){
            var args = Array.prototype.slice.apply(arguments);
            args.push(oldFn.apply(this,args));
            ext.apply(this,args);//��չ���������һ��������ԭ�����ĵ��ý��
        };
    }   

    //��д_createTextStringArrayʵ��checkbox��ʾ
    //_createTextStringArray��Դ��
    /*_createTextStringArray: function() {
        var me = this,
            text = (me.href ? me._createHrefStringArray() : me.text),
            stringArray = me._stringArray;
        stringArray.push('<span title="',me.title || me.text,'" id="',
            me.id,'-text" >',text,'</span></span>');
    },*/
    inheritFunction(baidu.ui.Tree.TreeNode,"_createTextStringArray",function(){
        var me=this,treeInstance=me.getTree(),stringArray=me._stringArray;nodetext = stringArray[stringArray.length-2];
        if(treeInstance.checkMode==3 && me.type=="trunk" && me.checked ){
            me.checked=false;
        }
        if(treeInstance.checkMode==1 && me.checked){
            if(!treeInstance._singlechecked) {//singlechecked:��ѡ��
                treeInstance._singlechecked=me.id;
            }else{
                me.checked=false;
            }
        }
        if(treeInstance.checkbox===true){
            stringArray[stringArray.length-2]=("<input class='tangram-tree-checkbox' autocomplete='off' type='checkbox' "+(me.checked?" checked='checked' ":"")+" id='"+me.id+"-checkbox'/><label class='tangram-tree-checkbox-label'  for='"+me.id+"-checkbox'>"+nodetext+"</label>");
        }
    });
    
    //ʹ�ù��Ӹ��¼���ѡ��&&���ڵ㷢��仯(����->��Ӧ���ӷ���/�¼�)
    // appendData       ->appendData
    // appendTo         ->_updateAll
    // moveTo           ->_updateAll
    // appendChild      ->_updateAll
    // removeAllChildren->_updateAll
    // removeChild      ->_updateAll
    // update           ->update

    //����ʼ�������Ҳ������appendData����
    inheritFunction(baidu.ui.Tree.TreeNode,"appendData",function(data){
        var me =this,treeInstance=me.getTree(),nodeid= me.id;
        if(data.length && treeInstance.checkMode==3){
            me.checked?(treeInstance.updateCheckBox(baidu.dom.g(nodeid+"-checkbox"))):(treeInstance.updateAllCheckBox(baidu.dom.g(nodeid+"-subNodeId")));
        }
    }); 

    inheritFunction(baidu.ui.Tree.TreeNode,"_updateAll",function(){
        var me=this,treeInstance=me.getTree(),nodeid=me.id;
        if(treeInstance.checkMode==3){
            me.checked?(treeInstance.updateCheckBox(baidu.dom.g(nodeid+"-checkbox"))):(treeInstance.updateAllCheckBox(baidu.dom.g(nodeid+"-subNodeId")));
        }
    });
    
    inheritFunction(baidu.ui.Tree.TreeNode,"update",function(nodedata){
        var me=this,treeInstance=me.getTree(),nodeid=me.id,nodetext = me.text;
        baidu.g(nodeid+"-text").innerHTML=("<input class='tangram-tree-checkbox' autocomplete='off' type='checkbox' "+(me.checked?" checked='checked' ":"")+" id='"+me.id+"-checkbox' /><label class='tangram-tree-checkbox-label'  for='"+me.id+"-checkbox'>"+nodetext+"</label>");
        if(treeInstance.checkMode==3){
            treeInstance.updateAllCheckBox(baidu.dom.g(me.getParentNode().id+"-subNodeId"))
        }
    });

    //checkbox addon
    baidu.ui.Tree.register(function(treeInstance){
        treeInstance.updateCheckBox = function(sourcecb){
            var me =this,nodeid=sourcecb.id.replace(/-checkbox$/i,""),node= me.getTreeNodeById(nodeid);
            //��ѡȥ������ѡ��
            if(me.checkMode==1){
                var $checked = baidu.dom.query(".tangram-tree-checkbox:checked",me.getMain());
                for(var i=0,l=$checked.length;i<l;i++){
                    var $curchecked = $checked[i],checkedId= $curchecked.id.replace(/-checkbox/i,""),checkedNode = me.getTreeNodeById(checkedId);
                    if(checkedId!=nodeid){
                        checkedNode.checked=false;
                        checkedNode.indeterminate=false;
                        $curchecked.checked=false;
                    }
                }
                //����_singlechecked
                if(me._singlechecked)delete me._singlechecked;
                if(sourcecb.checked) me._singlechecked = nodeid;
            }
            //����״̬
            node.indeterminate = sourcecb.indeterminate;
            node.checked = sourcecb.checked;
            //����ѡ��
            if(me.checkMode==3){
                var curNode = node ;
                //parent->parent
                while(curNode.parentNode){
                    var parentNode= curNode.parentNode,siblings =parentNode.getChildNodes(),checkedLen=0,$parent=baidu.dom.g(parentNode.id+"-checkbox");
                    for(var i=0,l=siblings.length;i<l;i++){
                        if(siblings[i].checked || siblings[i].indeterminate) checkedLen++;
                    }
                    $parent.checked = (checkedLen==siblings.length);
                    $parent.indeterminate  = (checkedLen!=0 && checkedLen!=siblings.length);
                    parentNode.checked = $parent.checked;
                    parentNode.indeterminate = $parent.indeterminate;
                    curNode= curNode.parentNode;
                }
                //->children
                var childrencbs =baidu.dom.query(":checkbox",baidu.dom.g(nodeid+"-node").parentNode.getElementsByTagName("dd")[0]);
                for(var i=0,l=childrencbs.length;i<l;i++){
                    var c = childrencbs[i],cnode = me.getTreeNodeById(c.id.replace(/-checkbox/i,""));
                    cnode.indeterminate = false;
                    cnode.checked = node.checked;
                    c.indeterminate = false;
                    c.checked = node.checked;
                }
            }
            me.dispatchEvent("checkchange",{node:node});
        }
        treeInstance.updateAllCheckBox= function(context){
            var me=this,leafCheckBox=baidu.dom.query("dl:has(dt:has(:checkbox)):has(>dd:empty)",context||me.getMain());
            for(var i=0,l=leafCheckBox.length;i<l;i++){
                me.updateCheckBox(baidu.dom.query(">dt :checkbox",leafCheckBox[i])[0]);
            }
        }
        treeInstance.addEventListener("onload",function(){
            var me=this,$tree= me.getMain();
            baidu.event.on($tree,"click",function(evt){
                //��ȡ�����¼���ԭʼDOM�ڵ�
                var target = evt.target||evt.srcElement,targetClassName= target.className||"";
                if(targetClassName.indexOf("tangram-tree-checkbox")!=-1 && (target.type||"").toLowerCase()=="checkbox"){
                    me.updateCheckBox(baidu.dom.g(target.getAttribute("for")||target.id));
                }
            });
        });
        treeInstance.addEventListener("dispose",function(){
            var me=this,$tree= me.getMain();
            baidu.event.un($tree,"click");
        });
        
        //checkbox�йصķ���
        treeInstance.getCheckedNodes= function(withIndeterminate){
            var me=this,checkedNodes=[];
            if(me.checkMode==1){
                if(me._singlechecked){
                    checkedNodes.push(me.getTreeNodeById(me._singlechecked));
                }
                return checkedNodes;
            }
            //�������ڵ�
            var root= me.getRootNode(),arr=[root],currentIndex=0;
            if(root.checked || (withIndeterminate && root.indeterminate)) checkedNodes.push(root);
            while(currentIndex<arr.length){
                var cnode = arr[currentIndex],children= cnode.getChildNodes()||[];
                for(var i=0,l=children.length;i<l;i++){
                    var c= children[i];
                    if(c.checked || (withIndeterminate && c.indeterminate)) checkedNodes.push(c);
                    arr.push(c);
                }
                currentIndex++;
            }
            return checkedNodes;
        }
    });

})();

/*
*   nuit.tree: Tree 树
*/
(nuit.Tree) || (nuit.Tree= function(opt){
    opt.classPrefix = "nuit-tree";
    var instance = new baidu.ui.Tree(opt);
    instance.addEventListener("click",function(e,data){
        //bug:新增节点导致currentNode不正确 可以选择多个节点
        //修复办法:手动去掉非最后一次选中的节点的选择样式
        var tree= e.target,currentNodeId = tree.getCurrentNode().id,
            nodes=baidu.dom.query(".tangram-tree-node-current",baidu.g(tree.mainId));
        baidu.array.each(nodes,function(node,i){
            (node.id!=(currentNodeId+"-node")) && ( baidu.dom.removeClass(node,"tangram-tree-node-current"));
        });
    });
    return instance;
});

/**
 *  nuit.servicetree 服务树控件
 *  @depends [nuit.Dialog,nuit.Tree,trangram.Tree.checkboxExtension]
 */
(nuit.SeriviceTree) || (nuit.ServiceTree= baidu.ui.createUI(function(opt){
}).extend({
    uiType:"servicetree",
    /**
    *   default options
    */
    loadNodesUrl:"/noah/index.php?r=selectMachine/loadTree&objectType=host",
    searchUrl:"/noah/index.php?r=selectMachine/searchMachine",
    iconsPath:"/nuit/css/src/tree/images/",
    showSearch:true,
    treeOptions:{},
    dialogOptions:{},
    ajaxOptions:{},
    parseData:function(requestData,eventData){
        var me=this,treedata = [],isSearch=eventData.data.indexOf("token=")!=-1;
        if(!isSearch){
            baidu.array.each(requestData,function(row){
                if(row.leaf){//机器
                    row.type="leaf";
                    row.icon=me.iconsPath+"machine.png";
                    treedata.push(row);
                }else{
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
    /*
     *  public methods
     */
    open:function(){
        var me =this;
        if(!me.dialog){
           me.dialog =new nuit.Dialog(baidu.object.extend({
                buttons: {
                    accept: {
                        content: "<div class='nuit-dialog-button-label' >确定</div>",
                        onclick :baidu.fn.bind(me._ondlgok,me)
                    },
                    cancel: {
                        content: "<div class='nuit-dialog-button-label' >取消</div>",
                        onclick :function(e){
                            me.dialog.close();
                        }
                    }
                },
                contentText:"<div style='margin:5px 0px;display:"+(me.showSearch?"":"none")+";'><input type='text' id='"+me.guid+"mtreekey' placeholder='请输入关键字' style='width:270px;'  />&nbsp; <input type='button' value='搜索' id='"+me.guid+"searchmtree' />&nbsp;<input type='button' value='重置' id='"+me.guid+"resetmtree' /></div><div id='"+me.guid+"mtreebox' style='height:"+(me.showSearch?"320":"355")+"px;overflow:auto;margin:0px 5px;'><div id='"+me.guid+"mtree'>正在加载...</div></div>",
                width:400,
                height:360,
                titleText:"请选择节点/机器",
                modal:true,
                resizable:false
            },me.dialogOptions));
            me.dialog.render();
            me._initTree();
            //重置
            (baidu.g(me.guid+"resetmtree")) && (baidu.g(me.guid+"resetmtree").onclick= function(){
                me.tree.dispose();//表扬一下tangram tree
                me.tree=null;
                baidu.g(me.guid+"mtreebox").innerHTML="<div id='"+me.guid+"mtree'>正在加载...</div>";
                baidu.g(me.guid+"mtreekey").value="";
                me._initTree();
            });
            (baidu.g(me.guid+"searchmtree")) && (baidu.g(me.guid+"searchmtree").onclick=baidu.fn.bind(me._beginsearch,me));
            (baidu.g(me.guid+"mtreekey")) && (baidu.g(me.guid+"mtreekey").onkeydown=function(e){
                e=baidu.event.get(e);
                if(e.keyCode==13){
                    me._beginsearch();
                    e.preventDefault();
                    return false;
                }
            });
        }
        me.dialog.addEventListener("dispose",function(){
            (me.tree) &&(me.tree.dispose());
            me.tree=null;
        });
        me.dialog.open();
    },
    close:function(){
        (this.dialog) && (this.dialog.close());
    },
    getTree:function(){return this.tree;},
    getDialog:function(){return this.dialog;},
    _initTree:function(){
        var me =this,loadNodesUrl=me.loadNodesUrl,iconsPath=me.iconsPath;
        if(!me.tree){
            //先请求根节点 
            var eventDataRoot ={url:loadNodesUrl,data:"nodeid=0"};
            me.dispatchEvent("beforerequest",eventDataRoot);
            baidu.ajax.request(eventDataRoot.url,baidu.object.extend({
                data:eventDataRoot.data,
                onsuccess:function(xhr,responseText){
                    var rootnode= baidu.json.parse(responseText)[0],rootid=rootnode.id,treedata =(me.parseData([rootnode],eventDataRoot)||[])[0],eventData1={url:loadNodesUrl,data:"nodeid="+rootid}; 
                    me.dispatchEvent("beforerequest",eventData1);
                    //请求一级节点
                    baidu.ajax.request(eventData1.url,baidu.object.extend({
                        data:eventData1.data,
                        onsuccess:function(xhr,responseText){
                            var nodes=me.parseData(baidu.json.parse(responseText),eventData1)||[];
                            treedata.children= nodes;
                            //初始化树
                            baidu.g(me.guid+"mtree").innerHTML="";
                            me.tree = new nuit.Tree(baidu.object.extend({
                                data:treedata,
                                onload:function(e){e.target.getRootNode().expand();},
                                expandable:false
                            },me.treeOptions));

                            //展开节点是加载子节点
                            me.tree.addEventListener("toggle",function(e,data){
                                var node = e.treeNode,tree= e.target;
                                if(node.isExpand && node.childNodes.length==1 && node.childNodes[0].id==("loading-"+node.id)){
                                    var eventData = {url:loadNodesUrl,data:"nodeid="+node.id,node:node};
                                    me.dispatchEvent("beforerequest",eventData);
                                    //加载子节点
                                    baidu.ajax.request(eventData.url,baidu.object.extend({data:eventData.data,onsuccess:function(xhr,responseText){
                                        var nodes= me.parseData(baidu.json.parse(responseText),eventData)||[];
                                        node.removeAllChildren();//remove loading node
                                        if(nodes.length>0){
                                            node.appendData(nodes);  
                                            node.expand();
                                        }else{
                                            //node.update({type:"leaf"});//貌似没用
                                        }
                                    }},me.ajaxOptions));
                                    
                                } 
                            });
                            me.tree.render(me.guid+"mtree");

                        }
                    },me.ajaxOptions));
                }
            },me.ajaxOptions));
        }
    },
    _beginsearch:function(){
        var me=this,mtreekey = baidu.g(me.guid+"mtreekey").value;
        if(mtreekey.length<3){
            alert("不能少于三个字符");
            return ;
        }
        me.tree.dispose();//表扬一下tangram tree
        me.tree=null;
        baidu.g(me.guid+"mtreebox").innerHTML="<div id='"+me.guid+"mtree'>正在加载...</div>";
        me._searchTree(mtreekey);
    },
    _searchTree:function(mtreekey){
        var me =this ,iconsPath=me.iconsPath,eventData={url:me.searchUrl,data:"node=1&nodeid=1&token="+mtreekey};
        me.dispatchEvent("beforerequest",eventData);
        baidu.ajax.request(eventData.url,baidu.object.extend({data:eventData.data,onsuccess:function(xhr,responseText){
            var treedata = me.parseData(baidu.json.parse(responseText),eventData);
            me.tree = new nuit.Tree(baidu.object.extend({
                data:treedata,
                onload:function(e){e.target.getRootNode().expand();}
            },me.treeOptions));
            baidu.g(me.guid+"mtree").innerHTML="";
            me.tree.render(me.guid+"mtree");
        }},me.ajaxOptions)); 
    },
    _ondlgok:function(e,data){
        this.dispatchEvent("ok");
    },
    dispose:function(){
        var me =this;
        me.dispatchEvent("dispose");
        //dispose顺序从里到外
        (me.tree) && (me.tree.dispose());
        (me.dialog) && (me.dialog.dispose());
        (me.getMain()) && (baidu.dom.remove(me.getMain())); 
        me.tree=null;
        me.dialog=null;
        baidu.lang.Class.prototype.dispose.call(me);
    }
}));

/*
 *  nuit suggestion: extenstion for Tangram Suggestion
 */
(nuit.Suggestion) || (nuit.Suggestion = function(opt){
    opt.classPrefix="nuit-suggestion";
    if(opt.multiple){
        opt.spliter=opt.spliter||";";
        var originGetDataByIndex =opt.getDataByIndex||baidu.fn.blank;
        opt.getDataByIndex=function(index){
            if(isNaN(index) || (!this.currentData[index])) return {};
            var value =  this.currentData[index].value,
                curValue = this.getTarget().value,
                newValue="";
            if((new RegExp("\\"+opt.spliter+"$","i")).test(curValue)){
                //end with ; replace the last x; with value
                newValue = curValue.replace(new RegExp("[^\\"+opt.spliter+"]+\\"+opt.spliter+"$","i"),"")+value+opt.spliter;
            }else{
                //replace c of  aa;bb;c  with value
                newValue=curValue.replace(new RegExp("[^\\"+opt.spliter+"]+$",i),"")+value+opt.spliter;
            }    
            value = newValue;
            //remove the duplicate item  in value
            var o ={},arr= value.split(opt.spliter),resultArr=[];
            for(var i=0,l=arr.length;i<l;i++){
                if(arr[i] && (!o[arr[i]])){
                    resultArr.push(arr[i]);
                    o[arr[i]]=1;
                }
            }
            value = resultArr.join(opt.spliter)+opt.spliter;
            this.currentData[index] = {content:value,value:value};
            originGetDataByIndex.apply(this,[index]);
            return {item:this.currentData[index],index:index}; 
        };
        var originOnBeforePick=opt.onbeforepick||baidu.fn.blank;
        opt.onbeforepick=function(e,data){
            if(isNaN(e.data.index)) return ;
            var value =  e.data.item.value,
                curValue = this.getTarget().value,
                newValue="";
            if((new RegExp("\\"+opt.spliter+"$","i")).test(curValue)){
                //end with ; replace the last x; with value
                newValue = curValue.replace(new RegExp("[^\\"+opt.spliter+"]+\\"+opt.spliter+"$","i"),"")+value+opt.spliter;
            }else{
                //replace c of  aa;bb;c  with value
                newValue=curValue.replace(new RegExp("[^\\"+opt.spliter+"]+$","i"),"")+value+opt.spliter;
            }
            value = newValue;

            //remove the duplicate item  in value
            var o ={},arr= value.split(opt.spliter),resultArr=[];
            for(var i=0,l=arr.length;i<l;i++){
                if(arr[i] && (!o[arr[i]])){
                    resultArr.push(arr[i]);
                    o[arr[i]]=1;
                }
            }
            value = resultArr.join(opt.spliter)+opt.spliter;
            this.currentData[e.data.index].value = value;
            originOnBeforePick.apply(this,[e,data]);
        };
        var originGetData=opt.getData||baidu.fn.blank;
        opt.getData=function(word){
            word=word.split(opt.spliter).pop();
            (word!="") && originGetData.apply(this,[word]);
        }
    }
    var instance  =new baidu.ui.Suggestion(opt);
    if(opt.element){
        instance.render(baidu.g(opt.element));
    }
    return instance;
});

/*
 *  nuit.tooltip 提示框 
 */
(nuit.Tooltip) || (nuit.Tooltip = function(opt){
    opt.classPrefix="nuit-tooltip";
    return new baidu.ui.Tooltip(opt); 
});

/**
 * @author mengqinghui
 * @descirption pager
 */
baidu.ui.tpager = baidu.ui.createUI(function(options){
	var me = this;
    var def = {
        curPage:1,
        perPage:10,
        pageCount:1,
        totalCount:1,
        leftItemCount:4,
        totalItemCount:9,
        textmap:{//文字提醒部分
            first:'首页',
            last:'尾页 ',
            prev:'上一页',
            next:'下一页'
        }
    };
    options = T.object.extend(def,options);
    me = T.object.extend(me,options);
}).extend({
	
    uiType:'nuitPager',
	bodyTpl:'<div id="#{id}_container" class="pager"><span class="pager-content" id="#{id}_content"><ul id="#{id}" class="pages" onclick="#{onclick}">#{content}</ul></span></div>',
	totalcount:1,//页数
	totalrecords:1,//条数
	getString:function(){
		var me = this;
        var id = me.getId();
	    return T.string.format(me.bodyTpl,{
            id:id,
			'onclick':me.getCallRef() + "._handleOnClick(event, this);"
		});
	},
	getPager:function(){
	    var me = this;
		return me.getId('body');
	},
    _getId:function(key){
        var me = this;
        return T.g(me.getId() + '_' + key);
    },
    getContent:function(){
        var me = this;
        return  me._getId('content');          
    },
    getContainer:function(){
        var me = this;
        return me._getId('container');
    },
	_renderItem:function(label, pagenumber, pagecount, totalcount){
		var me = this;
	    var destPage = 1;
        var textmap = me.textmap; 
		var txtLabel="";
        switch (label) {
            case "first":
                destPage = 1;
				txtLabel = textmap.first;
                break;
            case "prev":
                destPage = pagenumber - 1;
				txtLabel = textmap.prev;
                break;
            case "next":
                destPage = pagenumber + 1;
				txtLabel = textmap.next;
                break;
            case "last":
                destPage = pagecount;
				txtLabel = textmap.last;
                break;
			case "total":
                destPage = -1;
				txtLabel = "<span class='summary' id='"+me.getId()+"_nav_container'>"+me._renderNavContainer()+"</span>";
                break;
        }
       
        var itemTpl = '<li class="pgNext btn01" page="#{page}">#{label}</li>';
        if (label == "first" || label == "prev") {
	           if( pagenumber <= 1 ){
				   itemTpl = '<li class="pgNext btn01 btndisabled" page="#{page}">#{label}</li>';
				   destPage = -1;
				}
        }else if(label == "total") {
			itemTpl = '<li class="pgNext pgTotal" page="#{page}">#{label}</li>'
			
		}else{

            if(pagenumber >= pagecount){
			   itemTpl = '<li class="pgNext btn01 btndisabled" page="#{page}">#{label}</li>';
               destPage = -1;
			}
        }
        return T.string.format(itemTpl,{
			page:destPage,
			label:txtLabel
		});
       
	},
    renderContent:function(pageNumber,pageCount,totalCount){
        var me = this;
        var startPoint = 1;
        var endPoint = me.totalItemCount;
	    var pager = [];
        if (pageNumber > me.leftItemCount) {
            startPoint = pageNumber - me.leftItemCount;
			endPoint = startPoint + me.totalItemCount - 1;
        }
        if (endPoint > pageCount) {
            startPoint = pageCount - me.totalItemCount + 1;
            endPoint = pageCount;
        }
        if (startPoint < 1) {
            startPoint = 1;
        }
        // loop thru visible pages and render buttons
        for (var page = startPoint; page <= endPoint; page++) {
            var currentItem = '<li class="page-number btn01" page="#{page}">#{page}</li>';
            page == pageNumber ? (currentItem = '<li class="page-number pgCurrent btn02" page="#{page}">#{page}</li>' ):'';
            pager.push(T.string.format(currentItem,{page:page}));
        }
        return pager;
    },
    onhandlerResult:function(){
        var me = this;
        var temptotalCount = me.total;
        var tempperPage = me.perPage; 
        var temp = parseInt(temptotalCount / tempperPage);
        var temppageCount = temptotalCount %tempperPage==0?temp:temp+1;
        var pageCount =temppageCount;

        me.totalCount = temptotalCount;
        me.pageCount = pageCount;
    },
	_renderPager:function(){
		var me = this;
        me.dispatchEvent('handlerResult');
        var pageCount = me.pageCount;
        var pageNumber = me.curPage;
        var totalCount = me.totalCount;
        var pager = [];

		pager.push(me._renderItem('first', pageNumber, pageCount, totalCount));
		pager.push(me._renderItem('prev', pageNumber, pageCount, totalCount));
        
        //me.dispatchEvent('renderContent',{pageNumber:pageNumber});
        if(pageCount != 0){
            pager = pager.concat(me.renderContent(pageNumber,pageCount,totalCount));
        }
        
        pager.push(me._renderItem('next', pageNumber, pageCount, totalCount));
		pager.push(me._renderItem('last', pageNumber, pageCount, totalCount));

        if(pageCount == 0){
            pageNumber = 0;
        }
		pager.push(me._renderItem('total', pageNumber, pageCount, totalCount));
		
        
        return pager.join('');
	},
    update:function(opts){
        var me = this;
        
        me.dispatchEvent('update',{opts:opts});  
    },
    onupdate:function(e){
           
        var me = this;
        var opts = e.opts;
        me = T.object.extend(me,opts);
        var content = T.g(me.getId());
        content.innerHTML = me._renderPager();
        me.dispatchEvent('afterRender');
    
    },
    
	_handleOnClick: function (evt){
		
        evt = baidu.event.get(evt);
        var me = this,
            el = T.event.getTarget(evt),
            page = Number(el.getAttribute('page'));
		    callback = me.onItemClick;
		if(!page || page == -1){
		    return;
		}

        me.update({curPage:page});
		callback&&callback(page);
       
    },
    setCurPage:function(curPage){
        var me = this;
        me.curPage = curPage;
    },
    setPerPage:function(perPage){
        var me = this;
        me.perPage = perPage;
    },
	render:function(element){
		var me = this;
		element = element || me.element;
	    element = T.g(element);
		if(!element) return;    
		element.innerHTML = me.getString();
        me.dispatchEvent('beforeRender');
        var content = T.g(me.getId());
        content.innerHTML = me._renderPager();
        me.dispatchEvent('afterRender');
		me.dispatchEvent('onload');	
        me.rendered = true;
	},
	dispose:function(){
	    var me = this;
        baidu.dom.remove(baidu.dom.g(me.getId()));
        me.dispatchEvent('dispose');
	}
});

/*
 * 添加 每页显示多少条 和跳转 的功能
 */
baidu.ui.tpager.register(function(me){
    if(me.perpages){
	    me._renderPerpage = function(label,arr){
	        label = label || '每页显示：';
		    arr  = arr|| me.perpages;
            var tpl ='<span id="#{id}_perpage" class="pager-perpage"><label class="pager-perpage-lbl">#{label}</label><select class="pager-perpage-sel" onchange="#{onchangeFun}">#{options}</select></span>';
		    var optionsTpl = '<option value="#{value}" #{selected}  >#{content}</option>';
            var optionsHtml = [];
		    var selected = '';
		    T.array.each(arr,function(item,i){
			    selected = '';
			    if(parseInt(item.value) == parseInt(me.perPage)){
			        selected = 'selected = "selected"';
			    }
		        optionsHtml.push(T.string.format(optionsTpl,{
			        value:item.value,
			        content:item.text,
			        selected:selected
			    }));
		    });
		    optionsHtml = optionsHtml.join('');
		    return T.string.format(tpl,{
                id:me.getId(),
		        label:label,
			    'onchangeFun':me.getCallRef() + "._handleOnchange(event, this);",
			    'options':optionsHtml
		    });
        };
        me._handleOnchange = function(evt,obj){
		    if(obj){
		        var index = obj.selectedIndex;
			    value = me.perpages[index].value;//不知道为什么，IE下面得不到值 obj.options[index].value || obj.options[index].attributes['value'].nodeValue;
		    }
		    value = parseInt(value);
            var id = me.getId() + '-input';
            var containerId = id+'-container';
	        if(!value){
                var container = T.g(containerId);
                if(!container){
                    var html = '<span id="'+containerId+'"> <input type="text"  value="'+me.defaultTips+'" id="'+id+'"><button class="btn02" style="margin-top:-3px">确定</button></span>';
                    T.dom.insertHTML(obj,'afterEnd',html);
                }else{
                    T.dom.show(container);  
                }
                var input = T.g(id);
                T.event.un(input,'focus');
                T.event.on(input,'focus',function(){
                    input.value = '';        
                });
                var btn = T.dom.next(input);
                T.event.un(btn,'click');
                T.event.on(btn,'click',function(){
                    value = parseInt(input.value);
                    if(T.g(containerId)){
                        T.dom.hide(containerId);
                    }
                    
                    if(isNaN(value)){
                        value = 10;
                    }
                    /*if(!(me.beforeperpagechange && me.beforeperpagechange(value))){
                        return ;
                    }*/
                    me.setPerPage(value);
                    
                    var perpages = me.perpages;
                    var inArray = false;
                    var arrs = perpages.slice(0,perpages.length-1);
                    for(var i = 0,len = arrs.length;i<len;i++){
                        if(arrs[i].value == value){
                            inArray = true;
                            obj.selectedIndex = i;
                            break;
                        }
                    }
                    if(!inArray){
                        me.insertOption(obj,value);
                    }
                    
                    me.dispatchEvent('perpagechange',{perPage:value});
                    me.update({perPage:value,curPage:1})
                    input.value = me.defaultTips;
                });
        
            }else{
                /*if(!(me.beforeperpagechange && me.beforeperpagechange(value))){
                     return ;
                }*/
                if(T.g(containerId)){
                    T.dom.hide(containerId);
                }
                me.setPerPage(value);
                me.dispatchEvent('perpagechange',{perPage:value});
            }	
	    };
        me.insertOption = function(select,value,index){//select 添加一项
            var options = select.options;
            var arrs = me.perpages;
            var position = arrs.length - 1;
            if(!index){
                for(var i = 0,len = arrs.length - 1;i<len;i++){
                    if(arrs[i].value > value){
                        position = i;
                        break;
                    }
                }
            }
            
            var option = options[position];
            for(var i = arrs.length;i>position;i--){
                arrs[i] = arrs[i-1];
            }
            arrs[position] = {value:value,text:value+''};
            try{
                options.add(new Option(value,value+''),option);
            }catch(e){
                //options.add(new Option(value,value+''));
                
                options.length = 0;
                T.array.each(arrs,function(item){
                    options.add(new Option(item.text,item.value));        
                });
            }
            select.selectedIndex = position;

        };
    
        me.getPerpageContainer = function(){
            return me._getId('perpage');
        };
        me.defaultTips = '每页个数';
        me.addEventListener('beforeRender',function(e){
            var content = me.getContent();
            var html = me._renderPerpage(); 
            T.dom.insertHTML(content,'beforeBegin',html);
        });
    }



    
    //if(me.forward){//跳转到
       me.getNavContainer = function(){
            return me._getId('nav_container');
       };
       me._renderNavContainer = function(){
	        var navTpl = '<input type="text" id="#{id}_nav_input" class="pager-nav-input pager-nav-state-info" value="#{text}"/><input type="button" value="#{value}" class="pager-nav-button btn02" onclick="#{onbtnclick}"/><span>共#{total}条</span>';
            var id = me.getId(); 
            
            var html = T.string.format(navTpl,{
                id:id,
                value:me.navConfirmTitle || 'GO',
                text:me.curPage+'/'+me.pageCount+'页',
                total:me.totalCount,
			    onbtnclick:me.getCallRef() + "._handleNav(event, this);"
            });
            return html;
       
       };
	   me._handleNav = function(evt){
		    var id = me.getId() + "_nav_input";
		    var obj = T.g(id);
            if(T.dom.hasClass(obj,'info')){return false;}
		    obj && (value = obj.value);
		    value = parseInt(T.string.trim(value));
            if(isNaN(value)){
                value = 1;
            }
            value = value < 1?1:value;
            value = value > me.pageCount ? me.pageCount : value;
            if(!me.beforeForward(value)){return;}
            me.setCurPage(value);
            me.dispatchEvent('forward',{curPage:value});
	   };
       me.onforward = function(e){
            var curPage = e.curPage;
            me.update({curPage:curPage});
            me.onItemClick && me.onItemClick(curPage);

       };
       me.beforeForward = function(value){
            if(value > me.pageCount ||  value < 1){
                return false;
            }
            return true;
       };
       me.addEventListener('afterRender',function(e){
		    var id = me.getId() + "_nav_input";
            var input = T.g(id);
            T.event.on(input,'focus',function(){
                if(T.dom.hasClass(input,'pager-nav-state-info')){
                    input.value = '';
                    T.dom.removeClass(input,'pager-nav-state-info');
                    T.dom.addClass(input,'pager-nav-state-input');
                }    

            });

       });     
       me.addEventListener('load',function(){
            T.event.on(document.body,'click',function(e){
                var target = T.event.getTarget(e);
                var container = me.getNavContainer();
                if(!container) return;
                if(!T.dom.contains(container,target)){
		            var id = me.getId() + "_nav_input";
                    var input = T.g(id);
                    if(T.dom.hasClass(input,'pager-nav-state-input')){
                        input.value = me.curPage+'/'+me.pageCount+'页';
                        T.dom.removeClass(input,'pager-nav-state-input');
                        T.dom.addClass(input,'pager-nav-state-info');
                    }    
                    
                }
            });
                
       });
       me.addEventListener('dispose',function(){
            T.dom.remove(me.getNavContainer());        
       });
    //}
});
(nuit.Pager) || (nuit.Pager = baidu.ui.tpager);


var nuit = nuit || {};
/**
 * 模拟select下拉框
 * 支持选中+输入
 * 支持下拉列表自定义
 * @author lifayu@baidu.com
 * @version 1.0
 * @param {Object} options
 * @config {int} 			width 元素宽度
 * @config {int} 			contentWidth 下拉框宽度，当需要下拉列表自定义的时候有效
 * @config {String} 		defaultText 默认显示文字，当需要下拉列表自定义的时候有效
 * @config {String} 		element 目标元素
 * @config {Boolean} 		autoRender 是否自动渲染
 * @config {Array/Object} 	data 数据项，支持三种格式：
 * 							1. ["",""] 
 * 							2. [{text:"xxx",value:"xxx"},{...}] 
 * 							3. {"group":[{text:"xxx",value:"xxx"},{...}]}
 * @config {String} 		content 自定义下拉列表内容
 * @config {String} 		type 可选值：panel，当需要下拉列表自定义的时候需要该项，同时需要重写getValue和setValue方法
 * @config {Boolean} 		editable 是否允许输入
 * @config {Function} 		onchange 当选中项改变时触发，如果editable为true，或者有自定义下拉列表，该项无效
 * 
 * @method  				update(Array data)/update(Object data) 更新下拉列表
 * @method 					getValue()	获取选中值
 * @method 					setValue(String value) 设置选中值
 * @method 					showList() 显示下拉框
 * @method 					hideList() 隐藏下拉框
 */
/**
 * 用法
 * new nuit.Combox({
 * 		data:[{
 * 			text:"text",
 * 			value:1
 * 		}],
 * 		defaultValue:1,
 * 		width:200,
 * 		editable:true
 * });
 *
 * new nuit.Combox({
 * 		data:{
 * 			"FE":[{text:1,value:1},{}]
 * 			"RD":[{},{}]
 * 		}
 * 		......
 * });
 *
 * new nuit.Combox({
 * 		content:"",
 * 		defaultText:"请选择xxx",
 * 		width:200,
 * 		contentWidth:300
 * });
 */
nuit.Combox = baidu.ui.createUI(function() {}).extend({
	uiType : "combox",
	width : 100,
	editable : false,
	data : [],
	classPrefix : "nuit-combox",
	tplString : '<div id="#{id}" class="#{wrapInner}"><div class="#{arrow}"></div><div class="#{text}">#{content}</div></div><div class="#{list}"></div><input type="hidden" id="#{input}" value="#{value}"/>',
	tplEditableString : '<div id="#{id}" class="#{wrapInner}"><div class="#{arrow}"></div><div class="#{text}"><input type="text" id="#{input}" value="#{value}"/></div></div><div class="#{list}"></div>',
	tplContentString : '<div id="#{id}" class="#{wrapInner}"><div class="#{arrow}"></div><div class="#{text}">#{defaultText}</div></div><div class="#{list}" style="width:#{contentWidth}px;"><div class="#{listInner}">#{content}</div></div><input type="hidden" id="#{input}" value="#{value}"/>',
	getString : function() {
		var me = this;
		var dft = me.getDefaultData();
		//{text:1,value:1};
		var str = me.tplString;
		if(me.editable) {
			str = me.tplEditableString;
		}
		return baidu.string.format(str, {
			id : me.getId(),
			input : me.getId("input"),
			wrapInner : me.getClass("wrap-inner"),
			text : me.getClass("text"),
			arrow : me.getClass("arrow"),
			list : me.getClass("list"),
			content : dft.text,
			value : dft.value
		});
	},
	getContentString : function() {
		var me = this;
		me.contentWidth = me.contentWidth || me.width;
		return baidu.string.format(me.tplContentString, {
			id : me.getId(),
			input : me.getId("input"),
			wrapInner : me.getClass("wrap-inner"),
			text : me.getClass("text"),
			arrow : me.getClass("arrow"),
			list : me.getClass("list"),
			listInner : me.getClass("list-inner"),
			content : me.content,
			defaultText : me.defaultText,
			value : "",
			contentWidth : me.contentWidth
		});
	},
	getDefaultData : function() {
		var me = this, ret = {
			text : "data 数据格式不正确",
			value : null
		};
		var data = me.data;
		if(baidu.lang.isArray(data)) {
			if(data.length == 0) {
				ret = {
					text : "data为空",
					value : null
				};
			} else {
				var t = data[0];
				if(baidu.lang.isObject(t)) {
					ret = t;
				} else {
					ret = {
						text : t,
						value : t
					};
				}
			}
		} else if(baidu.lang.isObject(data)) {
			baidu.object.each(data, function(item, i) {
				ret = item[0];
				return false;
			});
		}
		return ret;
	},
	render : function(main) {
		var me = this;
		me.el = baidu.dom.g(main);
		baidu.dom.setStyle(me.el, "width", me.width);
		baidu.dom.addClass(me.el, me.getClass("wrap"));
		if(me.type == "panel") {
			me.el.innerHTML = me.getContentString();
		} else {
			me.el.innerHTML = me.getString();
		}
		me.list = baidu.dom.q(me.getClass("list"),me.el)[0];
		me.input = baidu.dom.g(me.getId("input"));
		me.arrow = baidu.dom.q(me.getClass("arrow"),me.el)[0];
		me.text = baidu.dom.q(me.getClass("text"),me.el)[0];
		if(me.type != "panel") {
			me.update(me.data);
		}
        baidu.dom.setStyle(me.list,"zIndex",(me.zIndex || 10));
		me._bindEvent();
	},
	_fixPosition : function() {
		var me = this;
		var left = baidu.dom.getPosition(me.el).left;
		var width = baidu.page.getViewWidth();
		if(left + me.contentWidth > width) {
			baidu.dom.setStyle(me.list, "left", me.width - me.contentWidth);
		} else {
			baidu.dom.setStyle(me.list, "left", 0);
		}
	},
	/**
	 * 更新列表
	 */
	update : function(data) {
		var me = this, htm = [];
		me.dispatchEvent("onupdate");
		me.data = data;
		htm.push("<div class='" + me.getClass("list-inner") + "'>");
		if(baidu.lang.isArray(data)) {
			htm.push("<ul>");
			baidu.array.each(data, function(item, i) {
				if(baidu.lang.isObject(item)) {
					htm.push("<li data-value='" + item.value + "' data-index='"+i+"'>" + item.text + "</li>");
				} else {
					htm.push("<li data-value='" + item + "' data-index='"+i+"'>" + item + "</li>");
				}
			});
			htm.push("</ul>");
			htm.push("</div>");
			me.list.innerHTML = htm.join("");
			var lis = baidu.dom.query("li", me.list);
			baidu.each(lis, function(li, i) {
				baidu.event.on(li, "click", function(event) {
					var d = baidu.event.getTarget(event);
					var text = d.innerHTML;
					var value = baidu.dom.getAttr(d, "data-value");
					var index = parseInt(baidu.dom.getAttr(d, "data-index"),10);
					if(me.editable) {
						me.input.value = value;
					} else {
						me.text.innerHTML = text;
						var oldV = me.input.value;
						me.input.value = value;
						if(oldV != value) {
							me.dispatchEvent("onchange", oldV, value,me.data[index]||{});
						}
					}
				});

				baidu.event.on(li, "mouseover", function(event) {

                    var target = T.event.getTarget(event);
                    if(target.tagName.toUpperCase() !== 'LI'){
                        return;
                    }
					var d = baidu.event.getTarget(event),
					    idx = parseInt(baidu.dom.getAttr(d, "data-index")||-1,10),
                        row=me.data[idx] || false;
                    row && me.dispatchEvent("mouseover",baidu.object.extend(row,{originEvent:event}));
				});
				baidu.event.on(li, "mouseout", function(event) {
					var d = baidu.event.getTarget(event),
					    idx = parseInt(baidu.dom.getAttr(d, "data-index")||-1,10),
                        row=me.data[idx]||false;
                    row && me.dispatchEvent("mouseout",baidu.object.extend(row,{originEvent:event}));

				});
			});
		} else {
			baidu.object.each(data, function(group, dt) {
				htm.push("<dl>");
				htm.push("<dt>" + dt + "</dt>");
				baidu.array.each(group, function(item, i) {
					htm.push("<dd data-value='" + item.value + "' data-group='"+dt+"' data-index='"+i+"'>" + item.text + "</dd>");
				});
				htm.push("</dl>");
			});
			htm.push("</div>");
			me.list.innerHTML = htm.join("");
			var dds = baidu.dom.query("dd", me.list);
			baidu.each(dds, function(li, i) {
				baidu.event.on(li, "click", function(event) {
					var d = baidu.event.getTarget(event);
					var text = d.innerHTML;
					var value = baidu.dom.getAttr(d, "data-value");
					var group = baidu.dom.getAttr(d, "data-group");
					var index = parseInt(baidu.dom.getAttr(d, "data-index"),10);
					me.text.innerHTML = text;
					var oldV = me.input.value;
					me.input.value = value;
					if(oldV != value) {
						me.dispatchEvent("onchange", oldV, value,me.data[group][index]);
					}
				})
			});
			var dts = baidu.dom.query("dt", me.list);
			baidu.each(dts, function(dt, i) {
				baidu.event.on(dt, "click", function(event) {
					baidu.event.stop(event);
				});
			});
		}
		me.setValue(me.getDefaultData().value);
		me.dispatchEvent("afterupdate");
	},
	/**
	 * 显示列表
	 */
	showList : function() {
		baidu.dom.addClass(this.arrow, this.getClass("arrow-open"));
		this.list.style.display = "block";
		if(this.type == "panel") {
			this._fixPosition();
		}
	},
	/**
	 * 隐藏列表
	 */
	hideList : function() {
		baidu.dom.removeClass(this.arrow, this.getClass("arrow-open"));
		this.list.style.display = "none";
	},
	/**
	 * 获取选中值
	 */
	getValue : function() {
		return this.input.value;
	},
	/**
	 * 设置选中值
	 */
	setValue : function(value) {
		var me = this;
		var data = me.data;
        var old = me.input.value;
        var row={};
		me.input.value = value;
		if(me.editable)
			return;
		if(baidu.lang.isArray(data)) {
			baidu.each(data, function(item, i) {
				if(baidu.lang.isObject(item)) {
					if(item.value == value) {
						me.text.innerHTML = item.text;
                        row=item;
						return false;
					}
                }else{
                    me.text.innerHTML = value;
                    row=value;
                    return false;
                }
			});
		} else if(baidu.lang.isObject(data)) {
			var isFind = false;
			baidu.object.each(data, function(g, key) {
				baidu.each(g, function(item, i) {
					if(item.value == value) {
						me.text.innerHTML = item.text;
						isFind = true;
                        row=item;
						return false;
					}
				});
				if(isFind)
					return false;
			});
		}
        if(old != value){
            me.dispatchEvent("onchange",old,value,row);
        }
	},
	_bindEvent : function() {
		var me = this;
		baidu.event.on(document, "click", function(event) {
			me.hideList();
		});
		baidu.event.on(me.getId(), "mousedown", function(event) {
			me.dispatchEvent("onmousedown");
			//me.hideList();
		});
		baidu.event.on(me.getId(), "mouseup", function(event) {
			me.dispatchEvent("onmouseup");
			if(!baidu.dom.hasClass(me.arrow, me.getClass("arrow-open"))) {
				setTimeout(function() {
					me.showList();
				}, 1);
			}
		});
		if(me.type == "panel") {
			baidu.event.on(me.list, "click", function(event) {
				baidu.event.stopPropagation(event);
			});
		}
	}
});

/*
 *  NUIT: Button Menu Conponent
 */
(nuit.ButtonMenu) || (nuit.ButtonMenu=baidu.ui.createUI(function(opt){
    
}).extend({
    uiType:"buttonMenu",
    options:[],
    zIndex:999,
    width:80,
    render:function(element){
        var me=this;
        element=baidu.g(element||me.element);
        baidu.event.on(element,"click",function(e){
            e=baidu.event.get(e);
            me.show(element);
            e.stopPropagation();
            var o=baidu.g(me.guid+"-"+element.id+"-options");
            //隐藏其他的下拉菜单
            baidu.array.each(baidu.dom.query("> .nuit-buttonmenu-options",document.body),function(bt){
                if(bt!=o) baidu.dom.hide(bt);
            });
        });
        baidu.event.on(document.body,"click",function(){
            me.hide(element);
        });
    },
    /*
    *   隐藏指定菜单
    */
    hide:function(element){
        var me=this;
        element=baidu.g(element||me.element);
        (baidu.g(me.guid+"-"+element.id+"-options")) && (baidu.dom.hide(baidu.g(me.guid+"-"+element.id+"-options")));
    },
    /*
    *   隐藏所有菜单
    */
    hideAll:function(){
        baidu.array.each(baidu.dom.query("> .nuit-buttonmenu-options",document.body),function(bt){
            baidu.dom.hide(bt);
        });
    },
    /*
    *   显示菜单
    */
    show:function(element){
        element=baidu.g(element||me.element);
        var me=this,pos= baidu.dom.getPosition(element),eh=element.offsetHeight,ceh=element.childNodes.length?element.childNodes[0].offsetHeight:eh,o=baidu.g(me.guid+"-"+element.id+"-options"),arr=["<ul>"],w=Math.max(me.width,element.offsetWidth);
        if(!o){
            o= document.createElement("div");
            o.id= me.guid+"-"+element.id+"-options";
            o.className="nuit-buttonmenu-options";
            baidu.array.each(me.options,function(op,i){
                arr.push("<li class='"+(op.className||"")+" "+(op.disabled?" nuit-buttonmenu-option-disabled ":"")+"' data-index='"+i+"'>"+op.html+"</li>");
            });
            arr.push("</ul>");
            o.innerHTML=arr.join("");
            document.body.childNodes.length?document.body.insertBefore(o,document.body.childNodes[0]):document.body.appendChild(o);
            baidu.event.on(o,"click",function(e,data){
                e=baidu.event.get(e);
                var src = e.srcElement|| e.target,idx=src.getAttribute("data-index");
                if(null!=idx){ 
                    if( (!baidu.dom.hasClass(src,"nuit-buttonmenu-option-disabled"))
                        && (me.options[idx].onclick||baidu.fn.blank).apply(me,[e,src])!==false  
                        && me.dispatchEvent("itemclick",{src:src,index:idx})!==false  ){
                        baidu.dom.hide(o);
                    }
                    e.stopPropagation();
                }
            });
        }
		/**edit by mengqinghui*/
        baidu.dom.show(o);
		var x = pos.left;
		var y = pos.top;
		var vw =  T.page.getViewWidth();
		var vh =  T.page.getViewHeight();
		var left = x+w>vw?"auto":x;
		var right = x+w>vw?(vw-pos.left-element.offsetWidth):"auto";
		var maxEh = Math.max(eh,ceh);
		var minEh = Math.min(eh,ceh);
		var oh = o.offsetHeight;
		
		
		var top = y + maxEh + oh > vh? (y - oh - 2) : (y+ maxEh);
		
		baidu.dom.setStyles(o,{
			"z-index":me.zIndex,
			left:left,
			right:right,
			top:top,
			"display":"block"
		});
        baidu.dom.setBorderBoxWidth(o,w);
    },
    /**
    *   禁用菜单项
    */
    disable:function(element,idx){
        var me =this,opts=me.options,opt=opts[idx],objOpt=null;
        if(!opt) return ;
        opt.disabled=true;
        element=baidu.g(element||me.element);
        objOpt=baidu.dom.query(" >ul >li:eq("+idx+")",baidu.g(me.guid+"-"+element.id+"-options"));
        objOpt.length && (baidu.dom.addClass(objOpt[0],"nuit-buttonmenu-option-disabled"));
    },
    /*
    *   启用菜单项
    */
    enable:function(element,idx){
        var me =this,opts=me.options,opt=opts[idx],objOpt=null;
        if(!opt) return ;
        opt.disabled=false;
        element=baidu.g(element||me.element);
        objOpt=baidu.dom.query(" >ul >li:eq("+idx+")",baidu.g(me.guid+"-"+element.id+"-options"));
        objOpt.length && (baidu.dom.removeClass(objOpt[0],"nuit-buttonmenu-option-disabled"));
    }
}));

/**
*   nuit Validator 数据校验
*/
(nuit.Validator)  ||(nuit.Validator = baidu.ui.createUI(function(opt){
    var me =this;
    me.element= baidu.g(opt.element);
    //开始校验字段时去掉.erroritem  样式
    me.addEventListener("fieldbeginvalidate",function(e,data){
        var el = data.elements[0],dl= baidu.dom.getAncestorByTag(el,"dl");
        dl && (baidu.dom.removeClass(dl,"erroritem"));
    });
    //默认的字段错误提示添加.erroritem  样式
    me.addEventListener("fielderror",function(e,data){
        var el = data.elements[0],dl= baidu.dom.getAncestorByTag(el,"dl");
        dl && (baidu.dom.addClass(dl,"erroritem"));
    });
    //默认的错误处理，聚焦到第一个错误的控件上
    me.addEventListener("error",function(e,data){
        for(var fieldName in data.errors){
            try{ data.fields[fieldName].elements[0].focus() } catch(e){}
            break;
        } 
    });
}).extend({
    uiType:"nuitValidator",
    rules:{},
    /**
     * 返回表单值
     */
    _serialize:function(){
        var result = {},me=this,inputs=baidu.dom.query(":input",me.element);
        baidu.array.each(inputs,function(o,i){
            if(o.name){
                result[o.name] || (result[o.name]={elements:[],value:"",rules:{}});
                var so = result[o.name];
                so.elements.push(o);
                baidu.object.extend(so.rules,me.rules[o.name]||{});
                try{
                    baidu.object.extend(so.rules,baidu.json.parse(baidu.dom.getAttr(o,"data-validate")||"{}"));
                }catch(e){
                }
                if(o.type=="checkbox" || o.type=="radio"){
                    if(o.type=="checkbox") {
                        (!baidu.lang.isArray(so.value) ) && (so.value=[]);  
                        o.checked && (so.value.push(o.value));
                    } 
                    if(o.checked && o.type=="radio") {
                        so.value=(o.value);
                    } 
                } else if(o.type=="select-one" || o.type=="select-multiple"){
                    var opts = o.options;
                    (o.type=="select-multiple" && (!baidu.lang.isArray(so.value))) && (so.value=[]);
                    baidu.array.each(opts,function(opt){
                        if(opt.selected && o.type=="select-one"){
                            so.value = opt.value;
                        }
                        if(opt.selected && o.type=="select-multiple"){
                            so.value.push( opt.value );
                        }
                    });
                }else{
                    so.value = o.value;
                }
            }
        });
        return result;
    },
    /*
    *   getErrors：获取最近一次校验错误
    */
    getErrors:function(){
        return this.errors||{};
    },
    validate:function(){
        var me=this,vresult=true,serilizedForm = me._serialize(); 
        me.errors={};//reset errors
        for(var fieldName in serilizedForm){
            var field = serilizedForm[fieldName],rules = field.rules;
            field.name = fieldName;
            me.dispatchEvent("fieldbeginvalidate",field);
            for(var ruleName in rules){
                var fn =  nuit.Validator.methods[ruleName],params= rules[ruleName];
                params=[params];
                params.unshift(field.value);
                if(baidu.lang.isFunction(fn)){
                    var fieldvresult = fn.apply(baidu.object.extend(field,{validator:me}),params);
                    if(fieldvresult === false){
                        me.errors[field] || (me.errors[field]=[]);
                        me.errors[field].push(ruleName);
                        vresult = false;
                        me.dispatchEvent("fielderror",baidu.object.extend(field,{rule:ruleName,params:params}));
                    }
                }
            }
        }
        if(!vresult){
            me.dispatchEvent("error",{errors:me.errors,fields:serilizedForm});
        }
        return vresult;
    }
}));



/*
 *  nuit.validator.methods：提供一些校验的基本方法 
 */
(nuit.Validator.methods) ||(nuit.Validator.methods={});

baidu.object.extend(nuit.Validator.methods,{
    isEmpty:function(s){return s=="" || null==s || undefined==s},
    required:function(s){return !nuit.Validator.methods.isEmpty(s)},
    rangelen:function(s,p){
        return (s.length>=p[0] && s.length<=p[1]);
    },
    range:function(s,p){
        s =parseFloat(s)||0;
        min=parseFloat(p[0]);
        max=parseFloat(p[1]);
        return s>=min && s<=max;
    },
    minlen:function(s,min){return s.length>=min;},
    maxlen:function(s,max){return s.length<=max;},
    isEmail:function(s){
        return /^(?:[a-z\d]+[_\-\+\.]?)*[a-z\d]+@(?:([a-z\d]+\-?)*[a-z\d]+\.)+([a-z]{2,})+$/i.test(s);
    },
    isNumber:function(s){
        return !isNaN(s);
    },
    isInteger:function(s){ //整数
        return /^-?[1-9]\d*$/i.test(s);
    },
    isInteger10:function(s){ //正整数+0
        return /^[1-9]\d*|0$/i.test(s);
    },
    isInteger1:function(s){ //正整数
        return /^[1-9]\d*$/i.test(s);
    }
});
