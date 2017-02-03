(function(win, doc) {
	var adUtil = win.iax.util, statics = win.iax.statics, dd = doc.documentElement;
	adUtil.loadEngine = function(namespace) {
		var adIax = win["iax"][namespace];
		win["adIax" + namespace] = adIax;
		adIax = adUtil.extend(adIax, {
			config : {
				pubid : "",
				unitid : "",
				w : "",
				h : ""
			},
			params : {},
			slotInfo : {},
			slotIslo : {},
			isFailed : true
		});

		adIax.serve = {
			getAds : function(o) {
				adIax.stats.prepare();
				var param = adIax.params;
				if (param.sl === 0)
					return;
//				var url = o.url + "?ts=" + param.ts + "&time=" + param.ts
//						+ "&url=" + param.url + "&pubid=" + param.pubid 
//						+ "&unitid=" + param.unitid
//						+ "&w=" + param.w
//						+ "&h=" + param.h
//						+"&ti="+ param.ti + "&mk=" + param.mk
//						+ (!!param.bid ? "&bid=" + param.bid : "") + "&md="
//						+ param.md + "&callback=" + o.callback+"&type=banner";
//				adUtil.loadScript({
//					url : url
//				});
				adUtil.ajax({
					url:o.url,
					type:"GET",
					data:param,
					dataType:"json",
					success:function(response,xml){
						var resjs=eval("("+response+")");
						adIax.render.fill(resjs.ads);
					},
					fail:function(status){
						
					}
				})
			},
			callback : function(data) {
				// eid: response ads id
				adIax.render.fill(data.ads);
			}
		};
		adIax.render = {
			fill : function(ads) {
				// Fill the inventory
				var i, length;
				for (i = 0, length = ads.length; i < length; ++i) {
					var sinfo = adIax.slotInfo[ads[i].unitid], adData = adUtil.extend(ads[i], sinfo);
					if (sinfo.filled)
						continue;
					adIax.render.create(adData);
					
				}
			},
			factory : function(type) {
				return adIax.render[type];
			},
			create : function(adData) {
				// create ads
				var container, adom, style, elem;
				container = adUtil.getElemById(statics.ADIAX_SLOT_PREFIX
						+ adData.unitid);
				style = "width:" + adData.w + "px;height:" + adData.h
						+ "px;line-height:0px;";
				// set position of banner

				adom = adUtil.createElem("div");
				container.appendChild(adom);
				adData.container = container;
				
				adIax.render.factory("third")(adData);
				
				if (adData.pos){
					style += statics["po_"+adData.pos];
					if(parseInt(adData.pos,10)<1008){
						//style +="position:fixed"
					}else{
						adIax.render.loadRichCss(adData.unitid);
						adData.isClose = true;
					}
				}
				
				if (container)
					container.style.cssText = style;

				if (adData.isClose) {
					elem = adUtil.createElem("span", "buzzClose_" + adData.unitid,
							"buzzClose");
					adom.appendChild(elem);
					elem.onclick = function() {
						container.parentNode.removeChild(container);
					};
				}
				
				if (adUtil.isIE6) {
					adUtil.fixed(container,
							(container.offsetTop - dd.scrollTop));
				}
				if(adData.cmurls){
					for(var i=0;i<adData.cmurls.length;i++){
						container.appendChild(adUtil.cimg(adData.cmurls[i]));
					}
				}
			},
			
			third : function(adData) {
				var objcon = adData.container;
				if(!adData.adm && adData.backfillcode){
					adUtil.set_innerHTML(objcon.id,adData.backfillcode);
				}else{
					var content = adData.adm ? adData.adm : "<html><head><head><body style='padding:0px;margin:0px;' >" + adData.link + "</body></html>";
	//				var content = (adData.link.indexOf("html")>-1) ? adData.link : "<html><head><head><body style='padding:0px;margin:0px;' >" + adData.link + "</body></html>";
					var ifrId = "adIax-outer-iframe_" + adData.unitid;
					var n_ifr = '<iframe id="' + ifrId + '" width="' + adData.w
							+ '" height="' + adData.h
							+ '" style="display:none"';
					var ifr_src = " src=\"javascript:void((function(){try{var d=document;d.open();d.domain='"
							+ doc.domain
							+ "';d.write('');d.close();}catch(e){}})())\"";
					var ifr_sty = ' border="0" frameborder="0" scrolling="no" marginwidth="0" allowTransparency="true" marginheight="0"  style="border: 0pt none;"></iframe>';
					(function x(count) {
						if (count > 10) {
							adIax.isFailed = false;
							return false;
						}
						var ifr = n_ifr;
						if (win.navigator.userAgent.toLowerCase().indexOf("msie") > -1
								&& doc.domain !== doc.location.hostname) {
							ifr += ifr_src;
						}
						ifr += ifr_sty;
						objcon.firstChild.innerHTML = ifr;
						win.setTimeout(function() {
							try {
								var tempIfr = doc.getElementById(ifrId);
								var ifr_doc = tempIfr.contentWindow.document;
								ifr_doc.open("text/html", "replace");
								ifr_doc.write(content);
								win.setTimeout(function() {
									ifr_doc.close();
	
								}, 250);
								tempIfr.style.display = "";
								if (tempIfr.style.display === "none") {
									win.setTimeout(function() {
										tempIfr.style.display = "";
									}, 200);
								}
								adIax.isFailed = true;
							} catch (F) {
								tempIfr.parentNode.removeChild(tempIfr);
								ifr = n_ifr + ifr_src + ifr_sty;
								objcon.firstChild.innerHTML = ifr;
								if (!count) {
									count = 1;
								} else {
									count++;
								}
								x(count);
							}
						}, 200);
					})();
				}
			},
			loadRichCss : function(id) {
				adUtil.loadStyle("body{_background-image:url(about:blank);_background-attachment:fixed;}#"
								+ statics.ADIAX_SLOT_PREFIX
								+ id
								+ "{position:fixed;_position:absolute;z-index:10000;}.buzzClose{position:absolute;background:url("
								+ statics.ADIAX_CLOSE_PATH
								+ ") no-repeat 0px 0px;"
								+ "display:inline-block;right:0px;top:0px;width:12px;height:12px;text-align:center;cursor:pointer;opacity:0.8;filter:alpha(opacity=80)}.buzzClose:hover{opacity:1;filter:alpha(opacity=100)}");
			}
		};
		adIax.stats = {
			prepare : function() {
				// request ads
				var param = adIax.params, slotes = adIax.config.slots, s = 0, i, length;
				if (adIax.slotIslo[adIax.config["unitid"]] !== undefined) {
					if (!adIax.slotIslo[adIax.config["unitid"]].load) {
						adIax.slotIslo[adIax.config["unitid"]].load = true;
						for(var k in adIax.config){
							if(adIax.config[k]!==undefined){
								param[k]=adIax.config[k];
							}
						}
						s++;
					}

				}

				if (adIax.slotInfo[adIax.config["unitid"]] !== undefined) {
					adIax.slotInfo[adIax.config.unitid] = adUtil.extend(
							adIax.slotInfo[adIax.config.unitid],
							adIax.config);
				}
				;
				param.sl = s;
				if (s === 0) {
					return;
				}
				param.page = adUtil.encode(doc.location.href);
				param.ts = (new Date()).getTime();
//				param.s = s.join("[iax]");
				param.ti = /([^-_]*).*/.exec(doc.title)[1];
				param.mk = adUtil.getMeta(/^keywords$/i);
				param.md = adUtil.getMeta(/^description$/i);
				param.cs = doc.charset;
				param.ref = adUtil.encode(doc.referrer);
				// param.z = parseInt(10000 * Math.random()) + param.url +
				// doc.cookie;
			}
		};
		adIax.start = function() {
			adIax.serve.getAds({
				url : statics.ADIAX_ADS_PATH,
				callback : "window.adIax" + namespace + ".serve.callback"
			});
		};

	};
})(window, document);