/*
 * Noah UI
 *
 * path: /watermelon/static/js/noah.js
 * author: ouzhencong
 * date: 2012/8/6
 *
 */
/*
 * 基础方法，也是对外提供的基础API
 */
var ui = ui || {};
// {{{ ui.showCnt
/*
 * ui.showCnt(url, type)
 * 在下面的iframe中打开一个链接
 * @param {string} url 需要打开的链接
 * @param {number} type 是否与服务树关联，0代表不关联，1代表关联
 * 
 */
ui.ArgumentTestRegex = /\?[\-\w]+=[\-\w]+/;
ui.showCnt = function(url, type) {
    var currentNode, nodeId = "1";
    type = type || 0;
    if(!type) {
        top.frames["main-frame"].location.href = url;
    } else {
        currentNode = serviceTree.getCurrentNode();
        if(currentNode){
            nodeId = currentNode.id;
        }
        if(ui.ArgumentTestRegex.test(url)) {
            top.frames["main-frame"].location.href = url + "&nodeId=" + nodeId + "&nodeid=" + nodeId;
        } else {
            top.frames["main-frame"].location.href = url + "?nodeId=" + nodeId + "&nodeid=" + nodeId;
        }
    }
};
// }}}
// {{{ ui.nodeChange
/*
 * ui.nodeChange(nodeObj)
 * 通过nodeId，调整下面iframe中展示内容的url，并且重新加载下面的页面
 * @param {obj} treeNode 当前被选中的服务树节点
 * @return {bool} true-调整成功, false-调整失败或不需要调整
 */
ui.nodeChange = function(treeNode) {
    var frame = top.frames["main-frame"],
        id = treeNode.id,
        url = location.href.substring(location.href.indexOf("#") + 1); 
    if(!url) {
        return false;
    }
    if(url.indexOf("suid") != -1){
        return false;
    } else if(url.indexOf("aos-web")!= -1 && (!/page=LaunchList\.ChooseSu/i.test(url)&&!/ViewServiceUnit/i.test(url))) {
        return false;
    }else if(/tree_addnode\.html/i.test(url)){
        return false;
    }else if(url.indexOf("del=1")!=-1){ 
        return false;
    }else if(url.indexOf("ShowNodeInfo")!=-1){ 
        return false;
    }else{
        url2=url.replace(/nodeid=(:|\w)*/g,"nodeid="+id);

        url2=url2.replace(/nodeId=(:|\w)*/g,"nodeId="+id);
        url2=url2.replace(/treeId=(:|\w)*/g,"treeId="+treeNode.treeId || 1);

        url2=url2.replace(/treeId=\d+/g,"treeId="+treeNode.treeId || 1);

        // if(url.indexOf("aos-web")!= -1 && obj){ 
        //      url2 = url2.replace(/id=(:|\w)*/g,"id="+obj.suid);
        // }
        if(url!=url2){

            if(/\Wop_\w*=/i.test(url2)){
                url2=url2.replace(/&op_\w*=(\w)*/g,"");
                url2=url2.replace(/\?op_\w*=\w*&/g,"?");
                url2=url2.replace(/\?op_\w*=\w*$/g,"");
            }
            //url2 = delQuery(url2, 'ref'); 
            //url2 = delQuery(url2, 'productLine'); 
            location.href= "#" + url2;
        }
    }
    if(typeof top.frames["main-frame"].treeCallback == 'function'){
        top.rightFrame.treeCallback(treeNode);
    }
    return true;
};
// }}}
// {{{ ui.getNodeId
/*
 * ui.getNodeId()
 * 获取当前被选中的节点
 * @return {number} 若服务树有被选中的节点，则返回改节点id，若无则返回-1
 */
ui.getNodeId = function() {
    var currentNode = serviceTree.getCurrentNode();
    if(currentNode) {
        return currentNode.id;
    } else {
        return -1;
    }
};
// }}}
// {{{ ui.getNodeAttributes
/*
 * ui.getNodeAttributes()
 * 获取当前选中节点的所有属性
 * @return {object} 当前被选中的节点，若无，则返回对象{id: -1}
 *
 */
ui.getNodeAttributes = function() {
    var currentNode = serviceTree.getCurrentNode();
    if(currentNode) {
        return currentNode;
    } else {
        return {id: -1};
    }
};
// }}}
// {{{ ui.ajax
/*
 * ui.ajax(url, [success, [error]])
 * 此方法根据本项目的特点对ajax请求进行了封装，简化了调用方式
 * @param {string} url 请求的url
 * @param {function} success 当请求成功时回调的函数，可选
 * @param {function} error 当请求失败后，回调的函数，可选
 *
 */
ui.ajax = function(url, success, error) {
    if(!url || url.length === 0) {
        return ;
    }
    $.ajax({
        url: url,
        dataType: "JSON",
        data: "GET",
        success: function(data, status, jqXHR) {
            if(success) {
                success(data.data);
            }
        },
        error: function(jqXHR, status, error) {
            if(error) {
                error(jqXHR, status);
            }
        }
    });
};
// }}}
ui.cookie = {};
// {{{ ui.cookie.get(name)
/*
 * ui.cookie.get(name)
 * 用于获取指定名称的cookie
 * @param {string} name 获取cookie的名称
 * @return {string} 获取cookie的值
 *
 */
ui.cookie.get = function(name) {
    var cookieName = encodeURIComponent(name) + "=",
        cookieStart = document.cookie.indexOf(cookieName),
        cookieValue = null, cookieEnd;
    if(cookieStart > -1) {
        cookieEnd = document.cookie.indexOf(";", cookieStart);
        if(cookieEnd === -1) {
            cookieEnd = document.cookie.length;
        }
        cookieValue = decodeURIComponent(document.cookie.substring(cookieStart + cookieName.length, cookieEnd));
    }
    return cookieValue;
};
// }}}
// {{{ ui.cookie.set(name, value, expires, path, domain, secure)
/*
 * ui.cookie.set(name, value, expires, path, domain, secure)
 * 用于设置cookie值的方法
 * @param {string} name cookie名称
 * @param {string} value cookie值
 * @param {Date} expires 过期的时间
 * @param {string} path 路径
 * @param {string} domain 域
 * @param {boolean} secure
 */
ui.cookie.set = function(name, value, expires, path, domain, secure) {
    var cookieText = encodeURIComponent(name) + "=" +
                     encodeURIComponent(value);
    if(expires instanceof Date) {
        cookieText += "; expires=" + expires.toGMTString();
    }
    if(path) {
        cookieText += "; path=" + path;
    }
    if(domain) {
        cookieText += "; domain=" + domain;
    }
    if(secure) {
        cookieText += "; secure";
    }
    document.cookie = cookieText;
};
// }}}
// {{{ ui.cookie.unset(name, path, domain, secure)
/*
 * ui.cookie.unset(name, path, domain, secure)
 * 删除cookie
 * @param {string} name
 * @param {string} path
 * @param {string} domain
 * @param {boolean} secure
 */
ui.cookie.unset = function(name, path, domain, secure) {
    ui.cookie.set(name, "", new Date(0), path, domain, secure);
};
// }}}
ui.ls = {};
// {{{ ui.ls.item
/*
 * ui.ls.item(key, value)
 * ui.ls.item(key)
 * 用与本地存储的方法的简单抽象
 * 当传一个参数时，会被当作是key读取对应的value
 * 当传两个参数时，则是改写或存入该key的value
 *
 * @param {string} key 获取或保存值的key
 * @param {string} value 保存或覆盖对应key的值
 * @return {string} 返回value;
 */
ui.ls.item = function() {
    var key, value;
    if(!window.localStorage || arguments.length === 0) {
        return ;
    }
    if(arguments.length === 1) {
        key = arguments[0];
        value = localStorage.getItem(key);
        return value;
    } else if(arguments.length >= 2) {
        key = arguments[0];
        value = arguments[1];
        localStorage.setItem(key, value);
        return value;
    }
};
// }}}

ui.controller = {};
// {{{ ui.controller.Router
ui.PathTestRegex = /^http[s]?:\/\//;
ui.controller.Router = Backbone.Router.extend({
    el_topMenu: undefined,
    regex: /appId=(\d+)&subId=(\d+)/,
    routes: {
        "*path": "goToPath"
    },
    initialize: function(el_topMenu) {
        this.el_topMenu = el_topMenu; 
    },

    goToPath: function(path) {
        var self = this, appId, subId, realPath;
        if(path === "") {
            return ;
        }
        if(self.regex.test(path)) {
            appId = RegExp.$1;
            subId = RegExp.$2;
            setTimeout(function() {
                ui.TopMenu.setSelectedMenu(appId, subId);
            }, 500);
        }
        if(!ui.PathTestRegex.test(path)) {
            path = "/" + path;
        }
        top.frames["main-frame"].location.href = path;
    }
});
// }}}

ui.model = {};
// {{{ui.model.Menu
ui.model.Menu = Backbone.Model.extend({
    subMenu: {},
    initialize: function(attributes) {
        var subMenuList = attributes.menuList, i, length, id;
        if(subMenuList) {
            for(i = 0, length = subMenuList.length; i < length; i++) {
                id = subMenuList[i].id.toString();
                this.subMenu[id] = subMenuList[i];
            }
        } else {
            this.set("menuList", []);
        }
    },
    /*
     * 返回该Menu下的某一子菜单是否与服务树相关
     *
     * @param {number} subMenuId 相应的子菜单Id
     * @return {number} 0或1，0表示不相关，1表示相关
     *
     */
    isRelativeTree: function(subMenuId) {
        return this.subMenu[subMenuId].relationTree;
    }
});
// }}}
// {{{ ui.model.MenuList
ui.model.MenuList = Backbone.Collection.extend({
    model: ui.model.Menu,
    /*
     * 向服务器保存当前服务树Id顺序，记录用户的自定义菜单
     * @param {string} url 保存的地址
     */
    save: function(url) {
        ui.ajax(url+this.pluck("id").join(","));
        //ui.ls.item("userMenus", JSON.stringify(this.toJSON()));
    }
});
// }}}

ui.view = {};
// {{{ ui.view.DraggableMenuView 
ui.view.DraggableMenuView = Backbone.View.extend({
        tagName: "li",
    className: "draggable",
    template: _.template($("#tpl-draggableMenuItem").html()),

    render: function() {
        var self = this, subMenu;
        $(this.el).html(this.template(this.model.toJSON()));
        subMenu = this.$(".sub-menu");
        this.$(".detail").hover(function(evt) {
            var positionTop = $(this.parentNode).position().top,
                targetParent = evt.target.parentNode;
            if(positionTop > 200) {
                self.$(".sub-menu").css({"bottom": "28px"});
            } else {
                self.$(".sub-menu").css({"top":"28px"});
            }
            $(targetParent).removeAttr("style");
            subMenu.toggleClass("hide");
        }, function(obj) {
            subMenu.toggleClass("hide");
            self.$(".sub-menu").removeAttr("style");
        });
        $(this.el).attr("data-uid", this.model.get("id"));
        return this;
    }
});
// }}}
// {{{ ui.view.TopMenuView
ui.view.TopMenuView = Backbone.View.extend({
    tagName: "li",
    className: "top-menu-btn",
    template: _.template($("#tpl-topNavMenuItem").html()),
    subMenuHeight: 0,
    events: {
        "click a": "_showInFrame"
    },

    render: function() {
        var self = this, subMenus = self.model.get("menuList"), i, length;
        self.model.view = self;
        $(self.el).html(self.template(self.model.toJSON()));
        $(self.el).hover(function(evt) {
            var documentWidth = $(document).width(),
                positionLeft = $(evt.target).position().left,
                subMenu = self.$(".popup-panel"),
                target = evt.target;
            if($(target).hasClass("top-menu-btn")) {
                setTimeout(function() {
                    self._showSubMenu(positionLeft);
                }, 80);
            } else if(target.tagName === "SPAN") {
                setTimeout(function() {
                    self._showSubMenu(positionLeft);
                }, 80);
            }
        }, function(evt) {
            setTimeout(function() {
                self.$(".popup-panel").addClass("hide");
            }, 100);
        });
        $(self.el).attr("data-uid", self.model.get("id"));
        self.model.view = self;
        return self;
    },
    /*
     * 返回当前的顶部一级菜单项中的宽度
     * @return {number} 一级菜单在顶部导航中的宽度
     */
    totalWidth: function() {
        return $(this.el).outerWidth();
    },
    /*
     * 把当前被选中的一级菜单项设置为未选中状态
     *
     */
    unselect: function() {
        var self = this;
        self.$("span").removeClass("selected");
        self.$("a").removeClass("selected");
    },

    /*
     * 把当前显示的相应的系统的菜单改为选中状态
     * 特别是在通过hash路径进入的时候，把该路径中的子系统
     * 设置为选中状态
     */
    selected: function(subId) {
        var self = this;
        self.$("span").addClass("selected");
        self.$("a[data-uid='"+subId+"']").addClass("selected");
        ui.view.TopMenuView.CurrentMenu = this;
        return this;
    },

    _showSubMenu: function(left) {
        var self = this, documentWidth = $(document).width(),
            subMenu = self.$(".popup-panel");
        if(left < (documentWidth / 2)) {
            subMenu.css({"left": left, "right": "auto"});
        } else {
            subMenu.css({"right": documentWidth - (left + 100), "left": "auto"});
        }
        subMenu.removeClass("hide");

    },

    _showInFrame: function(evt) {
        var anchor = evt.target, href = anchor.getAttribute("href"),
            id = anchor.getAttribute("data-uid"),
            index = href.indexOf("#"), realHref = href.substring(index + 1),
            nodeId = ui.getNodeId() === -1 ? 1 : ui.getNodeId(),
            appId = this.model.get("id"),
            menuPath = "appId="+appId+"&subId="+id;
        if(ui.view.TopMenuView.CurrentMenu) {
            ui.view.TopMenuView.CurrentMenu.unselect();
        }
        if(this.model.isRelativeTree(id)) {
            if(ui.ArgumentTestRegex.test(href)) {
                href = href + "&nodeId=" + nodeId + "&nodeid=" + nodeId;
            } else {
                href = href + "?nodeId=" + nodeId + "&nodeid=" + nodeId;
            }
        }
        if(ui.ArgumentTestRegex.test(href)) {
            href = href + "&" + menuPath;
        } else {
            href = href + "?" + menuPath;
        }
        location.href = href;
        return false;
    }
}, {
    CurrentMenu: undefined
});
// }}}
// {{{ ui.view.CustomizeMenuPanel
ui.view.CustomizeMenuPanel = Backbone.View.extend({
    el: $("#js-customize-menu-panel"),
    menuPanel: this.$("div.container"),

    el_close: this.$("#js-customize-menu-panel-close"),
    el_selectedList: this.$(".selected-area"),
    el_unselectedList: this.$(".unselected-area"),
    el_showBtn: this.$("#js-show-btn"),
    el_hideBtn: this.$("#js-hide-btn"),
    el_tips: this.$(".tips"),

    otherMenus: new ui.model.MenuList(),
    isRemove: false,
    menus: undefined,

    events: {
        "click .close-btn": "_saveUserApp"
    },

    initialize: function(menus) {
        var self = this, el = self.el, menuPanel = self.menuPanel,
            $document = $(document),
            documentWidth = $document.width(),
            documentHeight = $document.height(),
            positionTop = (documentHeight - 400) / 2,
            positionLeft = (documentWidth - 600) / 2,
            otherMenus = self.otherMenus;
        $("div.container").draggable({
            cursor: "move",
            cancel: ".draggable-area"
        });
        self.menus = menus;
        $(menuPanel[0]).css({"top": positionTop, "left": positionLeft});
        menus.each(function(obj, index) {
            self._addSelectedMenu(obj, menus, {"index": index});
        });
        self.otherMenus.on("add", self._addUnselectedMenu, self);

        ui.ajax("/platform/AppController/getAllApp", function(data){
            otherMenus.add(data.otherApp);
        });

        $(self.el_selectedList).sortable({
            connectWith: ".unselected-area",
            opacity: 0.7,
            cancel: ".tips",
            items: ".draggable",
            handle: ".draggable-title",
            receive: function(evt, ui) {
                var id = $(ui.item[0]).attr("data-uid"),
                    receiveItem = self.otherMenus.get(id),
                    selectedAreaChildren = self.el_selectedList.children(),
                    index = selectedAreaChildren.index(ui.item[0]), tips;
                if($(this).children().length === 2) {
                    tips = $("li", this).first().detach();
                    tips.appendTo(this);
                }
                menus.add(receiveItem.attributes, {at: index});
                self.otherMenus.remove(receiveItem);
            },
            stop: function(evt, ui) {
                if(self.isRemove) {
                    self.isRemove = false;
                    return ;
                } else {
                    var id = $(ui.item[0]).attr("data-uid"),
                        selectMenuChildren = self.el_selectedList.children(),
                        index = selectMenuChildren.index(ui.item[0]),
                        moveItem = menus.get(id);
                    menus.remove(moveItem);
                    menus.add(moveItem.attributes, {at: index});
                }
            },
            remove: function(evt, ui) {
                var id = $(ui.item[0]).attr("data-uid"),
                    removeItem = menus.get(id);
                menus.remove(removeItem);
                self.otherMenus.add(removeItem.attributes, {silent: true});
                self.isRemove = true;
            }
        });
        $(self.el_unselectedList).sortable({
            connectWith: ".selected-area",
            handle: ".draggable-title",
            opacity: 0.7
        });
    },

    _addSelectedMenu: function(obj, collection, opts) {
        var view = new ui.view.DraggableMenuView({model: obj}),
            selectMenuChildren = this.el_selectedList.children(),
            selectMenuLength = selectMenuChildren.length;
        if(selectMenuChildren[opts.index]) {
            this.el_selectedList[0]
                .insertBefore(view.render().el, selectMenuChildren[opts.index]);
        } else {
            this.el_selectedList[0].appendChild(view.render().el);
        }
    },

    _addUnselectedMenu: function(obj, collection, opts) {
        var view = new ui.view.DraggableMenuView({model: obj}),
            unselectMenuChildren = this.el_unselectedList.children(),
            unselectMenuLength = unselectMenuChildren.length;
        if(unselectMenuChildren[opts.index]) {
            this.el_unselectedList[0]
                .insertBefore(view.render().el, unselectMenuChildren[opts.index]);
        } else {
            this.el_unselectedList[0].appendChild(view.render().el);
        }
    },

    _saveUserApp: function() {
        $(this.el).addClass("hide");
        this.menus.save("/platform/UserViewController/saveUserView?appIds=");
    },

    adjustDisplayPosition: function(documentWidth, documentHeight) {
        var self = this,
            positionTop = (documentHeight - 400 - 200) / 2,
            positionLeft = (documentWidth - 600) / 2;
        $(self.menuPanel[0]).css({ "top": positionTop, "left": positionLeft });
    }
});
// }}}
// {{{ ui.view.AccountMenuView
ui.view.AccountMenuView = Backbone.View.extend({
    el: $("#js-account-menu"),

    events: {
        "click a": "_showInFrame"
    },

    _showInFrame: function(evt) {
        var anchor = evt.target, href = anchor.getAttribute("href"),
            el_serviceTree = $("#js-tree-container");
        if(!el_serviceTree.hasClass("hide")) {
            el_serviceTree.addClass("hide");
            ui.util.hideServiceTreeLoading();
        }
        $(this.el).toggleClass("hide");
        if(href.indexOf("http://") === -1) {
            location.href=href;
        } else if($(anchor).hasClass("logout")) {
            location.href = href;
        } else {
            window.open(href);
        }
        return false;
    },

    show: function() {
        $(this.el).removeClass("hide");
    },
    hide: function() {
        $(this.el).addClass("hide");
    }
});
// }}}
// {{{ ui.view.TopMenuPanel
/*
 * 这个类是整个程序的起点，控制着整个菜单的创建与调整等功能。
 */
ui.view.TopMenuPanel = Backbone.View.extend({
    el: $("#header"),

    el_serviceTree: $("#js-tree-container"),
    el_topMenu: $("#js-top-nav-menu"),
    el_shiftBtn: $("#js-shiftBtn"),
    el_leftBtn: $("#js-left-btn"),
    el_rightBtn: $("#js-right-btn"),
    el_treePath: $("#js-currentTree"),

    leftBound: 0,
    rightBound: 0,
    displayMenuWidth: 0,
    totalMenuWidth: 0,
    displayableItemNumber: 0,
    isShiftBtnShow: false,
    customizeMenuPanel: undefined,
    accountMenu: new ui.view.AccountMenuView(),
    resizing: false,
    menus: new ui.model.MenuList(),
    router: undefined,
    menuViewMap: {},

    events: {
        "click #js-account-btn": "_clear", 
        "click #js-service-tree-button": "_toggleServiceTree",
        "click #js-left-btn": "_shiftLeft",
        "click #js-right-btn": "_shiftRight",
        "click #js-more-menu": "_showCustomizeMenuPanel",
        "selectstart": function(evt) { evt.preventDefault(); },
        "click": "_hideEverything"
    },

    initialize: function() {
        var $document = $(document),
            availWidth = $document.width(),
            self = this,
            userName = ui.cookie.get("USER_NOAH");
        if(userName) {
            self.$("#js-account-btn").text(userName);
        } else {
            location.href = "http://tc-oped-dev03.tc.baidu.com:8287/olive/index.php?r=Passport/Logging/Index&url=http://tc-oped-dev03.tc.baidu.com:8090/watermelon/templates/";
        }



        self._setdisplayMenuWidth(availWidth);
        self.menus.on("add", this._addTopMenu, this);
        self.menus.on("remove", this._removeTopMenu, this);

        self._getUserCustomizedMenu(function(userMenuData) {
            self.menus.add(userMenuData);
        });
        self._addResponseToResize();
        self.router = new ui.controller.Router(self.el_topMenu);
    },

    /*
     * ui.TopMenu.setTreePath(treePath)
     * 提供给服务树，当服务树节点被选中时，显示服务树的路径
     * @param {string} treePath 被选中节点的服务树路径
     *
     */
    setTreePath: function(treePath) {
        var self = this, length = treePath && treePath.length;
        if(length > 24) {
            self.el_treePath.text(".." + treePath.substring(treePath.length - 24));
        } else {
            self.el_treePath.text(treePath);
        }
        self.el_treePath.attr("title", treePath);
    },

    setSelectedMenu: function(appId, subId) {
        var self = this;
        self.menuViewMap[appId].selected(subId);
    },

    _getUserCustomizedMenu: function(callback) {
        ui.ajax("/platform/AppController/getAppByUser", callback);
    },

    _adjustShiftBtnDisplay: function() {
        var self = this, topMenus = self.el_topMenu.children(), menuSize = topMenus.size();
        if(self.leftBound === 0) {
            self.el_leftBtn.addClass("disable");
        } else {
            self.el_leftBtn.removeClass("disable");
        }
        if(self.rightBound === menuSize) {
            self.el_rightBtn.addClass("disable");
        } else {
            self.el_rightBtn.removeClass("disable");
        }
    },

    _adjustMenuItemDisplay: function(topMenus, topMenusSize) {
        var self = this, i,
            leftBound = self.leftBound,
            rightBound = self.rightBound;
        for(i = 0; i < topMenusSize; i++) {
            if(i < leftBound || i >= rightBound) {
                $(topMenus[i]).addClass("hide");
            } else {
                $(topMenus[i]).removeClass("hide");
            }
        }
    },

    _adjustMenuDisplay: function() {
        var self = this, topMenus = self.el_topMenu.children(), menuSize = topMenus.size(); 
        if(menuSize <= self.displayableItemNumber) {
            self.el_shiftBtn.addClass("hide");
            self.$(".top-menu-btn").removeClass("hide");
        } else {
            self.el_shiftBtn.removeClass("hide");
            if(self.rightBound === menuSize) {
                self.leftBound = self.rightBound - self.displayableItemNumber;
            } else {
                if(menuSize - self.rightBound
                        < self.displayableItemNumber - (self.rightBound - self.leftBound)) {
                    self.rightBound = menuSize;
                    self.leftBound = menuSize - self.displayableItemNumber;
                } else {
                    self.rightBound = self.leftBound + self.displayableItemNumber;
                }
            }
            self._adjustShiftBtnDisplay();
            self._adjustMenuItemDisplay(topMenus, menuSize);
        }
    },

    _addResponseToResize: function() {
        var self = this, $document = $(document);
        $(window).resize(function() {
            self.resizing = true;
            setTimeout(function() {
                if(self.resizing) {
                    var width = $document.width();
                    self.resizing = false;
                    self._setdisplayMenuWidth(width);
                    self._adjustMenuDisplay();
                    if(self.customizeMenuPanel) {
                        self.customizeMenuPanel.adjustDisplayPosition(width, $document.height());
                    }
                }
            }, 500);
        });
    },

    _setdisplayMenuWidth: function(availWidth) {
        var self = this, width = availWidth - 460;
        self.el_topMenu.css("width", width);
        self.displayMenuWidth = width;
        self.displayableItemNumber = Math.floor(self.displayMenuWidth / 112);
        return width;
    },

    _addTopMenu: function(obj, collection, options) {
        var self = this, view = new ui.view.TopMenuView({model: obj}),
            topNavMenuChildren = this.el_topMenu.children(),
            topNavMenuLength = topNavMenuChildren.length;
        if(topNavMenuChildren[options.index]) {
            this.el_topMenu[0]
                .insertBefore(view.render().el, topNavMenuChildren[options.index]);
        } else {
            this.el_topMenu[0].appendChild(view.render().el);
        }
        self.menuViewMap[obj.get("id")] = view;
        if(options.index < self.leftBound) {
            $(view.el).addClass("hide");
        }
        self._adjustMenuDisplay();
    },

    _removeTopMenu: function(obj, collection, options) {
        var self = this, topNavMenuChildren = this.el_topMenu[0].children,
            showLength = this.rightBound - this.leftBound;
        $(topNavMenuChildren[this.rightBound]).removeClass("hide");
        this.el_topMenu[0].removeChild(topNavMenuChildren[options.index]);
        self.menuViewMap[obj.get("id")] = null;
        if(options.index < self.leftBound) {
            self.leftBound--;
        }
        self._adjustMenuDisplay();
    },

    _shiftLeft: function(evt) {
        var topNavMenuList = this.el_topMenu.children();
        if($(evt.target).hasClass("disable")) return ;
        $(topNavMenuList[--this.leftBound]).removeClass("hide");
        $(topNavMenuList[--this.rightBound]).addClass("hide");
        this.el_rightBtn.removeClass("disable");
        if(this.leftBound === 0) {
            this.el_leftBtn.addClass("disable");
        }
    },

    _shiftRight: function(evt) {
        var length = this.menus.size(),
            topNavMenuList = this.el_topMenu.children();
        if($(evt.target).hasClass("disable")) return ;
        $(topNavMenuList[this.rightBound++]).removeClass("hide");
        $(topNavMenuList[this.leftBound++]).addClass("hide");
        this.el_leftBtn.removeClass("disable");
        if(this.rightBound === length) {
            this.el_rightBtn.addClass("disable");
        }
    },

    _showCustomizeMenuPanel: function() {
        var self = this;
        if(!self.customizeMenuPanel) {
            self.customizeMenuPanel = new ui.view.CustomizeMenuPanel(this.menus);
        }
        $(self.customizeMenuPanel.el).removeClass("hide");
    },

    _clear: function() {
        var self = this;
        $(self.accountMenu.el).toggleClass("hide");
        if(!$(self.el_serviceTree).hasClass("hide")) {
            $(self.el_serviceTree).addClass("hide");
            ui.util.hideServiceTreeLoading();
        }
    },

    _toggleServiceTree: function() {
        var self = this;
        if($(self.el_serviceTree).hasClass("hide")) {
            $(self.el_serviceTree).removeClass("hide");
        } else {
            $(self.el_serviceTree).addClass("hide");
            ui.util.hideServiceTreeLoading();
        }
        return false;
    },

    _hideEverything: function(evt) {
        var self = this, targetId = evt.target.id;
        if(targetId !== "js-account-btn") {
            self.accountMenu.hide();
        }

    }
});
// }}}
// {{{ top.controll
/*
 * 这个主要是为了适应以前系统中历史遗留的问题. 所有的方法都指向ui模块中的方法
 * 在这里由于有个别系统反向调用了自己所在的iframe中的路径来获取nodeid
 * 因此，这里把原来的目前的main-frame映射到原来依赖的rightFrame中
 */
var controll = new (function() {
    var me = this;
    me.showCnt = ui.showCnt;
    me.getNode = ui.getNodeId;
    me.getNodeAttributes = ui.getNodeAttributes;
    window.frames["rightFrame"] = window.frames["main-frame"];
})();
// }}}

(function() {
    ui.TopMenu = new ui.view.TopMenuPanel();
    Backbone.history.start({pushState: false});
})();
