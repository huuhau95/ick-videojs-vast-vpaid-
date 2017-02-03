/*
 * ad. Config
 */
// 加载 ad-engine.js 的url。
//var ADMAX_STATIC_HOST = "http://rtb.iax.optimix.asia/static/";

// 点击 展示 PV 数 的地址。 http://adx.optimix.asia/api
// http://52.68.216.39:8080/api/
//var ADMAX_MAIN_HOST = "http://tracking.iax.optimix.asia";
// 请求广告的地址
//var ADMAX_API_HOST = "http://rtb.iax.optimix.asia";

// local test . 
(function(){
	if (typeof window.iax === "undefined") window.iax = {};
	else return;
	window.iax.constants={
			ADIAX_STATIC_HOST : "./",
			ADIAX_MAIN_HOST : "http://api.iax.optimix.asia/",
			ADIAX_API_HOST : "http://api.iax.optimix.asia/"
	}
})();
(function(win, doc) {
	if (typeof win.iax === "undefined") win.iax = {};
	
	var dd = doc.documentElement;
	if (!!win.iax.util) {
		return;
	}
	var adUtil = win.iax.util = {
		/* JS Variable */
		encode : encodeURIComponent,
		isIE6 : !!win.ActiveXObject && !win.XMLHttpRequest,
		isIE7: /MSIE 7/.test(navigator.userAgent),
	    isIE8: /MSIE 8/.test(navigator.userAgent),
		isChrome : window.navigator.userAgent.indexOf("Chrome") !== -1,
		isUndefined : function(test) {
			return typeof test == "undefined";
		},
		isArray : function(arr) {
			return Object.prototype.toString.call(arr).indexOf('Array') > 0;
		},
		isObject:function(obj){
			return typeof obj === 'object';
		},
		isNull:function(o){
			return o === null;
		},
	    isFunction:function(str){
		    return typeof str === 'function';
		},
		clearArray:function(arr){
			for(var i=0;i<arr.length;i++){
				if(!arr[i] || arr[i] == ""){
					arr.splice(i,1);
				}
			}
			return arr;
		},
		extend : function(a, b) {
			for ( var i in b) {
				if (typeof b[i] == "object") {
					if (!a[i] || a[i].length == 0 || a[i] == b[i]) {
						a[i] = adUtil.clearArray(b[i]);
					} else {
						if (adUtil.isArray(b[i])) {
							for (var o = 0, length = b[i].length; o < length; ++o) {
								a[i].push(b[i][o]);
							}
						} else {
							adUtil.extend(a[i], b[i]);
						}
					}
				} else {
					if(!!b[i]) {
						a[i] = b[i];
					}
				}
			}
			return a;
		},
		/* DOM */
		createElem : function(eTag, eId, eClass, eStyle, eText, eUrl) {
			// for internal use, should not document.
			var newEle = doc.createElement(eTag);
			if (eTag == "a") {
				newEle.href = eUrl || "javascript:;";
				newEle.target = "_blank";
			}
			if (eTag == "link") {
				newEle.rel = "stylesheet";
				newEle.type = "text/css";
				newEle.href = eUrl;
			};
			if (eId)
				newEle.id = eId;
			if (eClass)
				newEle.className = eClass;
			if (eStyle)
				newEle.style.cssText = eStyle;
			if (eText)
				newEle.innerHTML = eText;
			return newEle;
		},
		getElemsByTN : function(element, tagName) {
			return element.getElementsByTagName(tagName);
		},
		getElemById : function(id) {
			return doc.getElementById(id);
		},
		addClass : function(ele, className) {
			if (!this.hasClass(ele, className)) {
				ele.className += (ele.className ? " " : "") + className;
			}
		},
		loadScript : function(params) {
			// params is an object, its properties are: url (string), callback (function, optional)
			var scriptEle = doc.createElement('script');
			scriptEle.src = params.url;
			scriptEle.type = 'text/javascript';
			scriptEle.charset = params.charset || 'utf-8';
			if (!adUtil.isUndefined(params.callback)) {
				scriptEle.onload = params.callback;
				scriptEle.onreadystatechange = function() {
					if (/complete|loaded/.test(this.readyState)) {
						params.callback();
					}
				};
			}
			(params.pnode || adUtil.getElemsByTN(doc, "head")[0])
					.appendChild(scriptEle);
		},
		loadStyle : function(css) {
			var styleElem = doc.createElement("style");
			styleElem.type = 'text/css';
			if (styleElem.styleSheet) {
				styleElem.styleSheet.cssText = css;
			} else {
				styleElem.appendChild(doc.createTextNode(css));
			}
			doc.getElementsByTagName("head")[0].appendChild(styleElem);
		},
		fixed : function(el, eltop, elleft) {
			//fix ie6 position:fixed bug
			win.onscroll = function() {
				el.style.top = (dd.scrollTop + eltop) + "px";
			}
		},
		getMeta : function(regex) {
			var meta = "";
			var metas = document.getElementsByTagName('meta');
			if (!!metas) {
				for ( var x = 0, y = metas.length; x < y; x++) {
					if (regex.test(metas[x].name)) {
						meta += metas[x].content;
					}
				}
			}
			return meta.length > 200 ? meta.substring(0, 200) : meta;
		},
		/* Process */
		ready: function(callback) {
			var done = false, top = true,
			add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
			rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
			pre = doc.addEventListener ? '' : 'on',
			init = function(e) {
				if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
				(e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
				if (!done && (done = true)) callback.call(win, e.type || e);
			},
			poll = function() {
				try { dd.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
				init('poll');
			};
			if (doc.readyState == 'complete') callback.call(win, 'lazy');
			else {
				if (doc.createEventObject && dd.doScroll) {
					try { top = !win.frameElement; } catch(e) { }
					if (top) poll();
				}
				doc[add](pre + 'DOMContentLoaded', init, false);
				doc[add](pre + 'readystatechange', init, false);
				win[add](pre + 'load', init, false);
			}
		},
		createAdmObject: function (namespace) {
			if (!!win['iax'][namespace]) {
				return win['iax'][namespace];
			}
			win['iax'][namespace] = {
					config : {
						iax_ad_client : "",
						iax_ad_unit :"",
						iax_ad_width :"",
						iax_ad_height:""
					},
					params : {},
					slotInfo : {},
					slotIslo : {}
			};
			return win['iax'][namespace];
	    }
	    ,Obj2str: function(o) {
                if (o == undefined) {
                    return "";
                }
                var r = [];
                if (typeof o == "string") return "\"" + o.replace(/([\"\\])/g, "\\$1").replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r").replace(/(\t)/g, "\\t") + "\"";
                if (typeof o == "object") {
                    if (!o.sort) {
                        for (var i in o)
                            r.push("\"" + i + "\":" + this.Obj2str(o[i]));
                        if (!!document.all && !/^\n?function\s*toString\(\)\s*\{\n?\s*\[native code\]\n?\s*\}\n?\s*$/.test(o.toString)) {
                            r.push("toString:" + o.toString.toString());
                        }
                        r = "{" + r.join() + "}"
                    } else {
                        for (var i = 0; i < o.length; i++)
                            r.push(this.Obj2str(o[i]))
                        r = "[" + r.join() + "]";
                    }
                    return r;
                }
                return o.toString().replace(/\"\:/g, '":""');
            }
	    ,ajax:function(options){
	    	options = options || {};
	        options.type = (options.type || "GET").toUpperCase();
	        options.dataType = options.dataType || "json";
	        var params = adUtil.formatParams(options.data);

	        //创建 - 非IE6 - 第一步
	        if (window.XMLHttpRequest) {
	            var xhr = new XMLHttpRequest();
	        } else { //IE6及其以下版本浏览器
	            var xhr = new ActiveXObject('Microsoft.XMLHTTP');
	        }
	        //接收 - 第三步
	        xhr.onreadystatechange = function () {
	            if (xhr.readyState == 4) {
	                var status = xhr.status;
	                if (status >= 200 && status < 300) {
	                    options.success && options.success(xhr.responseText, xhr.responseXML);
	                } else {
	                    options.fail && options.fail(status);
	                }
	            }
	        }
	        //连接 和 发送 - 第二步
	        if (options.type == "GET") {
	            xhr.open("GET", options.url + "?" + params, true);
	            xhr.setRequestHeader("Accept", "application/json");
	            xhr.send(null);
	        } else if (options.type == "POST") {
	            xhr.open("POST", options.url, true);
	            //设置表单提交时的内容类型
	            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	            xhr.setRequestHeader("Accept", "application/json");
	            xhr.send(params);
	        }
	    }
	    ,formatParams:function(data){
	    	var arr = [];
	        for (var name in data) {
	            arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
	        }
	        arr.push(("v=" + Math.random()).replace(".",""));
	        return arr.join("&");
	    }
	    ,cimg:function(url){
			var img = adUtil.createElem("img","","","width:0px;height:0px;");
			img.src = url;
			return img;
		}
	    ,set_innerHTML:function(obj_id, html, time){
        	win.iax.statics.global_html_pool = []; 
        	win.iax.statics.global_script_pool = []; 
        	win.iax.statics.global_script_src_pool = []; 
        	win.iax.statics.global_lock_pool = []; 
        	win.iax.statics.innerhtml_lock = null; 
        	win.iax.statics.document_buffer = ""; 
        	
        	if (win.iax.statics.innerhtml_lock == null) { 
                win.iax.statics.innerhtml_lock = obj_id; 
            } 
            else if (typeof(time) == "undefined") { 
                win.iax.statics.global_lock_pool[obj_id + "_html"] = html; 
                window.setTimeout("set_innerHTML('" + obj_id + "', win.iax.statics.global_lock_pool['" + obj_id + "_html']);", 10); 
                return; 
            } 
            else if (win.iax.statics.innerhtml_lock != obj_id) { 
                win.iax.statics.global_lock_pool[obj_id + "_html"] = html; 
                window.setTimeout("set_innerHTML('" + obj_id + "', win.iax.statics.global_lock_pool['" + obj_id + "_html'], " + time + ");", 10); 
                return; 
            } 
            function get_script_id() { 
                return "script_" + (new Date()).getTime().toString(36) 
                  + Math.floor(Math.random() * 100000000).toString(36); 
            } 
            win.iax.statics.document_buffer = ""; 
            document.write = function (str) { 
                win.iax.statics.document_buffer += str; 
            } 
            document.writeln = function (str) { 
                win.iax.statics.document_buffer += str + "\n"; 
            } 
            win.iax.statics.global_html_pool = []; 
            var scripts = []; 
            html = html.split(/<\/script>/i); 
            for (var i = 0; i < html.length; i++) { 
                win.iax.statics.global_html_pool[i] = html[i].replace(/<script[\s\S]*$/ig, ""); 
                scripts[i] = {text: '', src: '' }; 
                scripts[i].text = html[i].substr(win.iax.statics.global_html_pool[i].length); 
                scripts[i].src = scripts[i].text.substr(0, scripts[i].text.indexOf('>') + 1); 
                scripts[i].src = scripts[i].src.match(/src\s*=\s*(\"([^\"]*)\"|\'([^\']*)\'|([^\s]*)[\s>])/i); 
                if (scripts[i].src) { 
                    if (scripts[i].src[2]) { 
                        scripts[i].src = scripts[i].src[2]; 
                    } 
                    else if (scripts[i].src[3]) { 
                        scripts[i].src = scripts[i].src[3]; 
                    } 
                    else if (scripts[i].src[4]) { 
                        scripts[i].src = scripts[i].src[4]; 
                    } 
                    else { 
                        scripts[i].src = ""; 
                    } 
                    scripts[i].text = ""; 
                } 
                else { 
                    scripts[i].src = ""; 
                    scripts[i].text = scripts[i].text.substr(scripts[i].text.indexOf('>') + 1); 
                    scripts[i].text = scripts[i].text.replace(/^\s*<\!--\s*/g, ""); 
                } 
            } 
            var s; 
            if (typeof(time) == "undefined") { 
                s = 0; 
            } 
            else { 
                s = time; 
            } 
            var script, add_script, remove_script; 
            for (var i = 0; i < scripts.length; i++) { 
                var add_html = "window.iax.statics.document_buffer += window.iax.statics.global_html_pool[" + i + "];\n"; 
                add_html += "document.getElementById('" + obj_id + "').innerHTML = window.iax.statics.document_buffer;\n"; 
                script = document.createElement("script"); 
                if (scripts[i].src) { 
                    script.src = scripts[i].src; 
                    if (typeof(win.iax.statics.global_script_src_pool[script.src]) == "undefined") { 
                        win.iax.statics.global_script_src_pool[script.src] = true; 
                        s += 2000; 
                    } 
                    else { 
                        s += 10; 
                    } 
                } 
                else { 
                    script.text = scripts[i].text; 
                    s += 10; 
                } 
                script.defer = true; 
                script.type =  "text/javascript"; 
                script.id = get_script_id(); 
                win.iax.statics.global_script_pool[script.id] = script; 
                add_script = add_html; 
                add_script += "document.getElementsByTagName('head').item(0)"; 
                add_script += ".appendChild(window.iax.statics.global_script_pool['" + script.id + "']);\n"; 
                window.setTimeout(add_script, s); 
                remove_script = "document.getElementsByTagName('head').item(0)"; 
                remove_script += ".removeChild(document.getElementById('" + script.id + "'));\n"; 
                remove_script += "delete window.iax.statics.global_script_pool['" + script.id + "'];\n"; 
                window.setTimeout(remove_script, s + 10000); 
            } 
            var end_script = "if (window.iax.statics.document_buffer.match(/<\\/script>/i)) {\n"; 
            end_script += "set_innerHTML('" + obj_id + "', window.iax.statics.document_buffer, " + s + ");\n"; 
            end_script += "}\n"; 
            end_script += "else {\n"; 
            end_script += "document.getElementById('" + obj_id + "').innerHTML = window.iax.statics.document_buffer;\n"; 
            end_script += "window.iax.statics.innerhtml_lock = null;\n"; 
            end_script += "}"; 
            window.setTimeout(end_script, s); 
        }
	    ,forEach:function(obj, iterator, context){
	    	var key, length;
	        if (obj) {
	          if (adUtil.isFunction(obj)) {
	            for (key in obj) {
	              // Need to check if hasOwnProperty exists,
	              // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
	              if (key !== 'prototype' && key !== 'length' && key !== 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
	                iterator.call(context, obj[key], key, obj);
	              }
	            }
	          } else if (adUtil.isArray(obj)) {
	            var isPrimitive = typeof obj !== 'object';
	            for (key = 0, length = obj.length; key < length; key++) {
	              if (isPrimitive || key in obj) {
	                iterator.call(context, obj[key], key, obj);
	              }
	            }
	          } else if (obj.forEach && obj.forEach !== forEach) {
	            obj.forEach(iterator, context, obj);
	          } else {
	            for (key in obj) {
	              if (obj.hasOwnProperty(key)) {
	                iterator.call(context, obj[key], key, obj);
	              }
	            }
	          }
	        }
	        return obj;
	    }
	    ,addEventListener:function(el, type, handler){
	    	if(adUtil.isArray(el)){
	    		  adUtil.forEach(el, function(e) {
	    			  adUtil.addEventListener(e, type, handler);
	              });
	          return;
	        }

	        if(adUtil.isArray(type)){
	          adUtil.forEach(type, function(t) {
	        	  adUtil.addEventListener(el, t, handler);
	          });
	          return;
	        }

	        if (el.addEventListener) {
	          el.addEventListener(type, handler, false);
	        } else if (el.attachEvent) {
	          // WARNING!!! this is a very naive implementation !
	          // the event object that should be passed to the handler
	          // would not be there for IE8
	          // we should use "window.event" and then "event.srcElement"
	          // instead of "event.target"
	          el.attachEvent("on" + type, handler);
	        }
	    }
	    ,removeEventListener:function(el, type, handler){
	    	if(adUtil.isArray(el)){
	    	  adUtil.forEach(el, function(e) {
	    		 adUtil.removeEventListener(e, type, handler);
    	      });
    	      return;
    	    }

    	    if(adUtil.isArray(type)){
	    	  adUtil.forEach(type, function(t) {
	    		  adUtil.removeEventListener(el, t, handler);
    	      });
    	      return;
    	    }

    	    if (el.removeEventListener) {
    	      el.removeEventListener(type, handler, false);
    	    } else if (el.detachEvent) {
    	      el.detachEvent("on" + type, handler);
    	    } else {
    	      el["on" + type] = null;
    	    }
	    }
	    ,expend:function(obj){
	    	var arg, i, k;
	        for (i = 1; i < arguments.length; i++) {
	          arg = arguments[i];
	          for (k in arg) {
	            if (arg.hasOwnProperty(k)) {
	              if (adUtil.isObject(obj[k]) && !adUtil.isNull(obj[k]) && adUtil.isObject(arg[k])) {
	                obj[k] = adUtil.expend({}, obj[k], arg[k]);
	              } else {
	                obj[k] = arg[k];
	              }
	            }
	          }
	        }
	        return obj;
	    }
	    ,adsSetupPlugin:function(opts){
	    	var player = this;
	        var options = adUtil.expend({}, this.options_, opts);

	        var pluginSettings = {
	          playAdAlways: true,
	          adCancelTimeout: options.adCancelTimeout || 3000,
	          adsEnabled: !!options.adsEnabled,
	          vpaidFlashLoaderPath: './scripts/VPAIDFlash.swf'
	        };

	        if(options.adTagUrl){
	          pluginSettings.adTagUrl = options.adTagUrl;
	        }

	        if(options.adTagXML) {
	          pluginSettings.adTagXML = options.adTagXML;
	        }

	        var vastAd = player.vastClient(pluginSettings);

	        player.on('reset', function () {
	          if (player.options().plugins['ads-setup'].adsEnabled) {
	            vastAd.enable();
	          } else {
	            vastAd.disable();
	          }
	        });

	        player.on('vast.aderror', function(evt) {
	          var error = evt.error;

	          if(error && error.message) {
	            console.log(error.message);
	          }
	        });
	    }
	};
	var statics = win.iax.statics = {
		ADIAX_STATIC_HOST : win.iax.constants.ADIAX_STATIC_HOST,
		ADIAX_MAIN_HOST : win.iax.constants.ADIAX_MAIN_HOST,
		ADIAX_API_HOST:win.iax.constants.ADIAX_API_HOST,
		ADIAX_SLOT_PREFIX : "ADIAX_",
		po_1008:"left:0px;",
		po_1009:"right:0px;",
		po_1010:"top:0px;",
		po_1011:"bottom:0px;",
		po_1012:"top:0px;left:0px;",
		po_1013:"top:0px;right:0px;",
		po_1014:"bottom:0px;left:0px;",
		po_1015:"bottom:0px;right:0px;"
		
	};
	statics.ADIAX_CLOSE_PATH = statics.ADIAX_STATIC_HOST + "/images/richc.gif";
	statics.ADIAX_ADS_PATH = statics.ADIAX_API_HOST + "/adx/seller/ads/v1.0/reqAd";
})(window, document);
(function (namespace, win, doc) {
	if (typeof win.iax === "undefined") win.iax = {};
	
	var adUtil = win.iax.util,statics = win.iax.statics;
	var adIax = adUtil.createAdmObject(namespace);
	win.iax.engineArr=win.iax.engineArr || [];
	adIax.light = function() {
		if(!adUtil.loadEngine){
			return;
		}
		for (var i = 0; i < win.iax.engineArr.length; i++) {
			adUtil.loadEngine(win.iax.engineArr[i]);
			win["iax"][win.iax.engineArr[i]].start();	
		};
	};
	
	adIax.init = function() {
		var reg = /Chrome|Safari|Mozilla|Opera|Firefox|MSIE|iPhone/i;
		if (!reg.test(navigator.userAgent)) {
			return;
		}
		// Parse options
		var config={};
		config.pubid = win.pubid;
		config.unitid =win.unitid ;
		config.w =win.w; 
		config.h =win.h;
		if (!config.unitid) {
			return;
		};
		namespace=win.iax.statics.ADIAX_SLOT_PREFIX+config.unitid;
		var iax_obj = adUtil.createAdmObject(namespace);
		adUtil.extend(iax_obj.config, config || {});
		
		if (!iax_obj.slotInfo[config.unitid]) {
			iax_obj.slotInfo[config.unitid]={
				filled:false
			}
		};
		if (!iax_obj.slotIslo[config.unitid]) {
			iax_obj.slotIslo[config.unitid]={
				load:false
			}
		};
		win.iax.engineArr.push(namespace);
		document.write("<div id='"+namespace+"'></div>");
		
	};
	adIax.init();
	adIax.loadEngine = function() {
		if (!adUtil.isReady) {
//			adUtil.isReady = true;
			var engine = {
				url : statics.ADIAX_STATIC_HOST
						+ "ad-engineOrg.js",
				callback : adIax.light
			};
			adUtil.loadScript(engine);
		}
	};
	win.iax.engineArr.length > 1 ? adIax.loadEngine() : adUtil
			.ready(adIax.loadEngine);
})("adIax", window, document);