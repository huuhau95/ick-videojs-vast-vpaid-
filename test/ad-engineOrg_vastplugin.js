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
					if(adData.adm && adData.adm.indexOf("</VAST>")>-1){
						var vastJs = {
							url : "vast.plugin.min.js",
							callback : function(){
								adIax.render["vast"](adData);
							}
						};
						adUtil.loadScript(vastJs);
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
				}
			},
			vast: function(adData){
				var objcon = adData.container;
				var impurls = adData.impurls;
				var admFormat = adData.adm;
				var startdelay = adData.startdelay;
				var containerId = statics.ADIAX_SLOT_PREFIX+ adData.unitid;
				adUtil.loadStyle('#'+containerId+' > * {width:100%!important;height:100%!important;}.vjs-controls{z-index:600!important;}.vjs-link{width:100%;height:100%;overflow:hidden;top:0px;left:0px;position:absolute!important;z-index:500!important;}.vjs-link span,.vjs-link a{display:block;text-decoration:none;font-size:240px;z-index:501;width:100%;height:100%;line-height:100%;}.video-js{background-color:#000;position:relative;padding:0;font-size:10px;vertical-align:middle}.video-js .vjs-tech{position:absolute;top:0;left:0;width:100%;height:100%}.video-js:-moz-full-screen{position:absolute}body.vjs-full-window{padding:0;margin:0;height:100%;overflow-y:auto}.video-js.vjs-fullscreen{position:fixed;overflow:hidden;z-index:1000;left:0;top:0;bottom:0;right:0;width:100%!important;height:100%!important;_position:absolute}.video-js:-webkit-full-screen{width:100%!important;height:100%!important}.vjs-poster{margin:0 auto;padding:0;cursor:pointer;position:relative;width:100%;max-height:100%}.video-js .vjs-text-track-display{text-align:center;position:absolute;bottom:4em;left:1em;right:1em;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}.video-js .vjs-text-track{display:none;color:#fff;font-size:1.4em;text-align:center;margin-bottom:.1em;background:#000;background:rgba(0,0,0,0.50)}.video-js .vjs-subtitles{color:#fff}.video-js .vjs-captions{color:#fc6}.vjs-tt-cue{display:block}.vjs-fade-in{visibility:visible!important;opacity:1!important;-webkit-transition:visibility 0s linear 0s,opacity .3s linear;-moz-transition:visibility 0s linear 0s,opacity .3s linear;-ms-transition:visibility 0s linear 0s,opacity .3s linear;-o-transition:visibility 0s linear 0s,opacity .3s linear;transition:visibility 0s linear 0s,opacity .3s linear}.vjs-fade-out{visibility:hidden!important;opacity:0!important;-webkit-transition:visibility 0s linear 1.5s,opacity 1.5s linear;-moz-transition:visibility 0s linear 1.5s,opacity 1.5s linear;-ms-transition:visibility 0s linear 1.5s,opacity 1.5s linear;-o-transition:visibility 0s linear 1.5s,opacity 1.5s linear;transition:visibility 0s linear 1.5s,opacity 1.5s linear}.vjs-default-skin .vjs-controls{position:absolute;bottom:0;left:0;right:0;margin:0;padding:0;height:2.6em;color:#fff;border-top:1px solid #404040;background:#242424;background:-moz-linear-gradient(top,#242424 50%,#1f1f1f 50%,#171717 100%);background:-webkit-gradient(linear,0% 0,0% 100%,color-stop(50%,#242424),color-stop(50%,#1f1f1f),color-stop(100%,#171717));background:-webkit-linear-gradient(top,#242424 50%,#1f1f1f 50%,#171717 100%);background:-o-linear-gradient(top,#242424 50%,#1f1f1f 50%,#171717 100%);background:-ms-linear-gradient(top,#242424 50%,#1f1f1f 50%,#171717 100%);background:linear-gradient(top,#242424 50%,#1f1f1f 50%,#171717 100%);visibility:hidden;opacity:0}.vjs-default-skin .vjs-control{position:relative;float:left;text-align:center;margin:0;padding:0;height:2.6em;width:2.6em}.vjs-default-skin .vjs-control:focus{outline:0}.vjs-default-skin .vjs-control-text{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}.vjs-default-skin .vjs-play-control{width:5em;cursor:pointer!important}.vjs-default-skin.vjs-paused .vjs-play-control div{width:15px;height:17px;background:url("http://vjs.zencdn.net/c/video-js.png");margin:.5em auto 0}.vjs-default-skin.vjs-playing .vjs-play-control div{width:15px;height:17px;background:url("http://vjs.zencdn.net/c/video-js.png") -25px 0;margin:.5em auto 0}.vjs-default-skin .vjs-rewind-control{width:5em;cursor:pointer!important}.vjs-default-skin .vjs-rewind-control div{width:19px;height:16px;background:url("http://vjs.zencdn.net/c/video-js.png");margin:.5em auto 0}.vjs-default-skin .vjs-mute-control{width:3.8em;cursor:pointer!important;float:right}.vjs-default-skin .vjs-mute-control div{width:22px;height:16px;background:url("http://vjs.zencdn.net/c/video-js.png") -75px -25px;margin:.5em auto 0}.vjs-default-skin .vjs-mute-control.vjs-vol-0 div{background:url("http://vjs.zencdn.net/c/video-js.png") 0 -25px}.vjs-default-skin .vjs-mute-control.vjs-vol-1 div{background:url("http://vjs.zencdn.net/c/video-js.png") -25px -25px}.vjs-default-skin .vjs-mute-control.vjs-vol-2 div{background:url("http://vjs.zencdn.net/c/video-js.png") -50px -25px}.vjs-default-skin .vjs-volume-control{width:5em;float:right}.vjs-default-skin .vjs-volume-bar{position:relative;width:5em;height:.6em;margin:1em auto 0;cursor:pointer!important;-moz-border-radius:.3em;-webkit-border-radius:.3em;border-radius:.3em;background:#666;background:-moz-linear-gradient(top,#333,#666);background:-webkit-gradient(linear,0% 0,0% 100%,from(#333),to(#666));background:-webkit-linear-gradient(top,#333,#666);background:-o-linear-gradient(top,#333,#666);background:-ms-linear-gradient(top,#333,#666);background:linear-gradient(top,#333,#666)}.vjs-default-skin .vjs-volume-level{position:absolute;top:0;left:0;height:.6em;-moz-border-radius:.3em;-webkit-border-radius:.3em;border-radius:.3em;background:#fff;background:-moz-linear-gradient(top,#fff,#ccc);background:-webkit-gradient(linear,0% 0,0% 100%,from(#fff),to(#ccc));background:-webkit-linear-gradient(top,#fff,#ccc);background:-o-linear-gradient(top,#fff,#ccc);background:-ms-linear-gradient(top,#fff,#ccc);background:linear-gradient(top,#fff,#ccc)}.vjs-default-skin .vjs-volume-handle{position:absolute;top:-0.2em;width:.8em;height:.8em;background:#ccc;left:0;border:1px solid #fff;-moz-border-radius:.6em;-webkit-border-radius:.6em;border-radius:.6em}.vjs-default-skin div.vjs-progress-control{position:absolute;left:4.8em;right:4.8em;height:1.0em;width:auto;top:-1.3em;border-bottom:1px solid #1f1f1f;border-top:1px solid #222;background:#333;background:-moz-linear-gradient(top,#222,#333);background:-webkit-gradient(linear,0% 0,0% 100%,from(#222),to(#333));background:-webkit-linear-gradient(top,#222,#333);background:-o-linear-gradient(top,#333,#222);background:-ms-linear-gradient(top,#333,#222);background:linear-gradient(top,#333,#222)}.vjs-default-skin .vjs-progress-holder{position:relative;cursor:pointer!important;padding:0;margin:0;height:1.0em;-moz-border-radius:.6em;-webkit-border-radius:.6em;border-radius:.6em;background:#111;background:-moz-linear-gradient(top,#111,#262626);background:-webkit-gradient(linear,0% 0,0% 100%,from(#111),to(#262626));background:-webkit-linear-gradient(top,#111,#262626);background:-o-linear-gradient(top,#111,#262626);background:-ms-linear-gradient(top,#111,#262626);background:linear-gradient(top,#111,#262626)}.vjs-default-skin .vjs-progress-holder .vjs-play-progress,.vjs-default-skin .vjs-progress-holder .vjs-load-progress{position:absolute;display:block;height:1.0em;margin:0;padding:0;left:0;top:0;-moz-border-radius:.6em;-webkit-border-radius:.6em;border-radius:.6em}.vjs-default-skin .vjs-play-progress{background:#fff;background:-moz-linear-gradient(top,#fff 0,#d6d6d6 50%,#fff 100%);background:-webkit-gradient(linear,0% 0,0% 100%,color-stop(0%,#fff),color-stop(50%,#d6d6d6),color-stop(100%,#fff));background:-webkit-linear-gradient(top,#fff 0,#d6d6d6 50%,#fff 100%);background:-o-linear-gradient(top,#fff 0,#d6d6d6 50%,#fff 100%);background:-ms-linear-gradient(top,#fff 0,#d6d6d6 50%,#fff 100%);background:linear-gradient(top,#fff 0,#d6d6d6 50%,#fff 100%);background:#efefef;background:-moz-linear-gradient(top,#efefef 0,#f5f5f5 50%,#dbdbdb 50%,#f1f1f1 100%);background:-webkit-gradient(linear,0% 0,0% 100%,color-stop(0%,#efefef),color-stop(50%,#f5f5f5),color-stop(50%,#dbdbdb),color-stop(100%,#f1f1f1));background:-webkit-linear-gradient(top,#efefef 0,#f5f5f5 50%,#dbdbdb 50%,#f1f1f1 100%);background:-o-linear-gradient(top,#efefef 0,#f5f5f5 50%,#dbdbdb 50%,#f1f1f1 100%);background:-ms-linear-gradient(top,#efefef 0,#f5f5f5 50%,#dbdbdb 50%,#f1f1f1 100%);filter:progid:DXImageTransform.Microsoft.gradient(startColorstr="#efefef",endColorstr="#f1f1f1",GradientType=0);background:linear-gradient(top,#efefef 0,#f5f5f5 50%,#dbdbdb 50%,#f1f1f1 100%)}.vjs-default-skin .vjs-load-progress{opacity:.8;background:#666;background:-moz-linear-gradient(top,#666,#333);background:-webkit-gradient(linear,0% 0,0% 100%,from(#666),to(#333));background:-webkit-linear-gradient(top,#666,#333);background:-o-linear-gradient(top,#666,#333);background:-ms-linear-gradient(top,#666,#333);background:linear-gradient(top,#666,#333)}.vjs-default-skin div.vjs-seek-handle{position:absolute;width:16px;height:16px;margin-top:-0.3em;left:0;top:0;background:url("http://vjs.zencdn.net/c/video-js.png") 0 -50px;-moz-border-radius:.8em;-webkit-border-radius:.8em;border-radius:.8em;-webkit-box-shadow:0 2px 4px 0 #000;-moz-box-shadow:0 2px 4px 0 #000;box-shadow:0 2px 4px 0 #000}.vjs-default-skin .vjs-time-controls{position:absolute;right:0;height:1.0em;width:4.8em;top:-1.3em;border-bottom:1px solid #1f1f1f;border-top:1px solid #222;background-color:#333;font-size:1em;line-height:1.0em;font-weight:normal;font-family:Helvetica,Arial,sans-serif;background:#333;background:-moz-linear-gradient(top,#222,#333);background:-webkit-gradient(linear,0% 0,0% 100%,from(#222),to(#333));background:-webkit-linear-gradient(top,#222,#333);background:-o-linear-gradient(top,#333,#222);background:-ms-linear-gradient(top,#333,#222);background:linear-gradient(top,#333,#222)}.vjs-default-skin .vjs-current-time{left:0}.vjs-default-skin .vjs-duration{right:0;display:none}.vjs-default-skin .vjs-remaining-time{right:0}.vjs-time-divider{display:none}.vjs-default-skin .vjs-time-control{font-size:1em;line-height:1;font-weight:normal;font-family:Helvetica,Arial,sans-serif}.vjs-default-skin .vjs-time-control span{line-height:25px}.vjs-secondary-controls{float:right}.vjs-default-skin .vjs-fullscreen-control{width:3.8em;cursor:pointer!important;float:right}.vjs-default-skin .vjs-fullscreen-control div{width:16px;height:16px;background:url("http://vjs.zencdn.net/c/video-js.png") -50px 0;margin:.5em auto 0}.vjs-default-skin.vjs-fullscreen .vjs-fullscreen-control div{background:url("http://vjs.zencdn.net/c/video-js.png") -75px 0}.vjs-default-skin .vjs-big-play-button{display:block;z-index:2;position:absolute;top:50%;left:50%;width:8.0em;height:8.0em;margin:-42px 0 0 -42px;text-align:center;vertical-align:center;cursor:pointer!important;border:.2em solid #fff;opacity:.95;-webkit-border-radius:25px;-moz-border-radius:25px;border-radius:25px;background:#454545;background:-moz-linear-gradient(top,#454545 0,#232323 50%,#161616 50%,#3f3f3f 100%);background:-webkit-gradient(linear,0% 0,0% 100%,color-stop(0%,#454545),color-stop(50%,#232323),color-stop(50%,#161616),color-stop(100%,#3f3f3f));background:-webkit-linear-gradient(top,#454545 0,#232323 50%,#161616 50%,#3f3f3f 100%);background:-o-linear-gradient(top,#454545 0,#232323 50%,#161616 50%,#3f3f3f 100%);background:-ms-linear-gradient(top,#454545 0,#232323 50%,#161616 50%,#3f3f3f 100%);filter:progid:DXImageTransform.Microsoft.gradient(startColorstr="#454545",endColorstr="#3f3f3f",GradientType=0);background:linear-gradient(top,#454545 0,#232323 50%,#161616 50%,#3f3f3f 100%);-webkit-box-shadow:4px 4px 8px #000;-moz-box-shadow:4px 4px 8px #000;box-shadow:4px 4px 8px #000}.vjs-default-skin div.vjs-big-play-button:hover{-webkit-box-shadow:0 0 80px #fff;-moz-box-shadow:0 0 80px #fff;box-shadow:0 0 80px #fff}.vjs-default-skin div.vjs-big-play-button span{position:absolute;top:50%;left:50%;display:block;width:35px;height:42px;margin:-20px 0 0 -15px;background:url("http://vjs.zencdn.net/c/video-js.png") -100px 0}.vjs-loading-spinner{display:none;position:absolute;top:50%;left:50%;width:55px;height:55px;margin:-28px 0 0 -28px;-webkit-animation-name:rotatethis;-webkit-animation-duration:1s;-webkit-animation-iteration-count:infinite;-webkit-animation-timing-function:linear;-moz-animation-name:rotatethis;-moz-animation-duration:1s;-moz-animation-iteration-count:infinite;-moz-animation-timing-function:linear}@-webkit-keyframes rotatethis{0%{-webkit-transform:scale(0.6) rotate(0deg)}12.5%{-webkit-transform:scale(0.6) rotate(0deg)}12.51%{-webkit-transform:scale(0.6) rotate(45deg)}25%{-webkit-transform:scale(0.6) rotate(45deg)}25.01%{-webkit-transform:scale(0.6) rotate(90deg)}37.5%{-webkit-transform:scale(0.6) rotate(90deg)}37.51%{-webkit-transform:scale(0.6) rotate(135deg)}50%{-webkit-transform:scale(0.6) rotate(135deg)}50.01%{-webkit-transform:scale(0.6) rotate(180deg)}62.5%{-webkit-transform:scale(0.6) rotate(180deg)}62.51%{-webkit-transform:scale(0.6) rotate(225deg)}75%{-webkit-transform:scale(0.6) rotate(225deg)}75.01%{-webkit-transform:scale(0.6) rotate(270deg)}87.5%{-webkit-transform:scale(0.6) rotate(270deg)}87.51%{-webkit-transform:scale(0.6) rotate(315deg)}100%{-webkit-transform:scale(0.6) rotate(315deg)}}@-moz-keyframes rotatethis{0%{-moz-transform:scale(0.6) rotate(0deg)}12.5%{-moz-transform:scale(0.6) rotate(0deg)}12.51%{-moz-transform:scale(0.6) rotate(45deg)}25%{-moz-transform:scale(0.6) rotate(45deg)}25.01%{-moz-transform:scale(0.6) rotate(90deg)}37.5%{-moz-transform:scale(0.6) rotate(90deg)}37.51%{-moz-transform:scale(0.6) rotate(135deg)}50%{-moz-transform:scale(0.6) rotate(135deg)}50.01%{-moz-transform:scale(0.6) rotate(180deg)}62.5%{-moz-transform:scale(0.6) rotate(180deg)}62.51%{-moz-transform:scale(0.6) rotate(225deg)}75%{-moz-transform:scale(0.6) rotate(225deg)}75.01%{-moz-transform:scale(0.6) rotate(270deg)}87.5%{-moz-transform:scale(0.6) rotate(270deg)}87.51%{-moz-transform:scale(0.6) rotate(315deg)}100%{-moz-transform:scale(0.6) rotate(315deg)}}div.vjs-loading-spinner .ball1{opacity:.12;position:absolute;left:20px;top:0;width:13px;height:13px;background:#fff;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;border:1px solid #ccc}div.vjs-loading-spinner .ball2{opacity:.25;position:absolute;left:34px;top:6px;width:13px;height:13px;background:#fff;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;border:1px solid #ccc}div.vjs-loading-spinner .ball3{opacity:.37;position:absolute;left:40px;top:20px;width:13px;height:13px;background:#fff;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;border:1px solid #ccc}div.vjs-loading-spinner .ball4{opacity:.50;position:absolute;left:34px;top:34px;width:13px;height:13px;background:#fff;border-radius:10px;-webkit-border-radius:10px;-moz-border-radius:15px;border:1px solid #ccc}div.vjs-loading-spinner .ball5{opacity:.62;position:absolute;left:20px;top:40px;width:13px;height:13px;background:#fff;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;border:1px solid #ccc}div.vjs-loading-spinner .ball6{opacity:.75;position:absolute;left:6px;top:34px;width:13px;height:13px;background:#fff;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;border:1px solid #ccc}div.vjs-loading-spinner .ball7{opacity:.87;position:absolute;left:0;top:20px;width:13px;height:13px;background:#fff;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;border:1px solid #ccc}div.vjs-loading-spinner .ball8{opacity:1.00;position:absolute;left:6px;top:6px;width:13px;height:13px;background:#fff;border-radius:13px;-webkit-border-radius:13px;-moz-border-radius:13px;border:1px solid #ccc}.vjs-default-skin .vjs-menu-button{float:right;margin:.2em .5em 0 0;padding:0;width:3em;height:2em;cursor:pointer!important;border:1px solid #111;-moz-border-radius:.3em;-webkit-border-radius:.3em;border-radius:.3em;background:#4d4d4d;background:-moz-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:-webkit-gradient(linear,left top,left bottom,color-stop(0%,#4d4d4d),color-stop(50%,#3f3f3f),color-stop(50%,#333),color-stop(100%,#252525));background:-webkit-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:-o-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:-ms-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%)}.vjs-default-skin .vjs-menu-button div{background:url("http://vjs.zencdn.net/c/video-js.png") 0 -75px no-repeat;width:16px;height:16px;margin:.2em auto 0;padding:0}.vjs-default-skin .vjs-menu-button ul{display:none;opacity:.8;padding:0;margin:0;position:absolute;width:10em;bottom:2em;max-height:15em;left:-3.5em;background-color:#111;border:2px solid #333;-moz-border-radius:.7em;-webkit-border-radius:1em;border-radius:.5em;-webkit-box-shadow:0 2px 4px 0 #000;-moz-box-shadow:0 2px 4px 0 #000;box-shadow:0 2px 4px 0 #000;overflow:auto}.vjs-default-skin .vjs-menu-button:focus ul,.vjs-default-skin .vjs-menu-button:hover ul{display:block;list-style:none}.vjs-default-skin .vjs-menu-button ul li{list-style:none;margin:0;padding:.3em 0 .3em 20px;line-height:1.4em;font-size:1.2em;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;text-align:left}.vjs-default-skin .vjs-menu-button ul li.vjs-selected{text-decoration:underline;background:url("http://vjs.zencdn.net/c/video-js.png") -125px -50px no-repeat}.vjs-default-skin .vjs-menu-button ul li:focus,.vjs-default-skin .vjs-menu-button ul li:hover,.vjs-default-skin .vjs-menu-button ul li.vjs-selected:focus,.vjs-default-skin .vjs-menu-button ul li.vjs-selected:hover{background-color:#ccc;color:#111;outline:0}.vjs-default-skin .vjs-menu-button ul li.vjs-menu-title{text-align:center;text-transform:uppercase;font-size:1em;line-height:2em;padding:0;margin:0 0 .3em 0;color:#fff;font-weight:bold;cursor:default;background:#4d4d4d;background:-moz-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:-webkit-gradient(linear,left top,left bottom,color-stop(0%,#4d4d4d),color-stop(50%,#3f3f3f),color-stop(50%,#333),color-stop(100%,#252525));background:-webkit-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:-o-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:-ms-linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%);background:linear-gradient(top,#4d4d4d 0,#3f3f3f 50%,#333 50%,#252525 100%)}.vjs-default-skin .vjs-captions-button div{background-position:-25px -75px}.vjs-default-skin .vjs-chapters-button div{background-position:-100px -75px}.vjs-default-skin .vjs-chapters-button ul{width:20em;left:-8.5em}.vjs-skip-button{position:absolute;background:#333;height:28px;width:80px;right:0;bottom:40px;z-index:600!important;cursor:pointer;color:white;font-size:12px;font-weight:bolder;line-height:28px;text-transform:uppercase;text-align:center;border-radius:5px 0 0 5px;opacity:.5!important;transition:all .1s ease-in-out;-o-transition:all .1s ease-in-out;-ms-transition:all .1s ease-in-out;-moz-transition:all .1s ease-in-out;-webkit-transition:all .1s ease-in-out}.vjs-skip-button.vjs-fade-in{opacity:.5!important}');
				var videoTag = '<video class="video-js vjs-default-skin" controls autoplay preload="auto" poster=""  >' +
		           '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' +
		           '<source src="http://vjs.zencdn.net/v/oceans.webm" type="video/webm"/>' +
		           '<source src="http://vjs.zencdn.net/v/oceans.ogv" type="video/ogg"/>' +
		           '<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
		           '<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>' +
		           '</p>' +
		          '</video>';
				objcon.innerHTML = videoTag;
				setTimeout(function() {
		          var videoEl = objcon.querySelector('.video-js');
		          videoEl.id = "video_"+containerId;
		          var options = {
		        		  ads: {
		        			    'skipAd': {
		        		    		'enabled': true,
		        		    		'timeOut': adData.minduration
		        			    },
		        			    'servers'  : [
		        				{
		        				    'apiAddress': '',
		        				    'apiXML':'<VAST version="2.0"><Ad id="601364"><InLine><AdSystem>Acudeo Compatible</AdSystem><AdTitle>VAST 2.0 Instream Test 1</AdTitle><Description>VAST 2.0 Instream Test 1</Description><Error>http://myErrorURL/error</Error><Impression>http://myTrackingURL/impression</Impression><Creatives><Creative AdID="601364"><Linear><Duration>00:00:30</Duration><TrackingEvents><Tracking event="creativeView">http://myTrackingURL/creativeView</Tracking><Tracking event="start">http://myTrackingURL/start</Tracking><Tracking event="midpoint">http://myTrackingURL/midpoint</Tracking><Tracking event="firstQuartile">http://myTrackingURL/firstQuartile</Tracking><Tracking event="thirdQuartile">http://myTrackingURL/thirdQuartile</Tracking><Tracking event="complete">http://myTrackingURL/complete</Tracking></TrackingEvents><VideoClicks><ClickThrough>http://www.tremormedia.com</ClickThrough><ClickTracking>http://myTrackingURL/click</ClickTracking></VideoClicks><MediaFiles><MediaFile delivery="progressive" type="video/x-flv" bitrate="500" width="400" height="300" scalable="true" maintainAspectRatio="true">http://cdnp.tremormedia.com/video/acudeo/Carrot_400x300_500kb.flv</MediaFile></MediaFiles></Linear></Creative><Creative AdID="601364-Companion"><CompanionAds><Companion width="300" height="250"><StaticResource creativeType="image/jpeg">http://demo.tremormedia.com/proddev/vast/Blistex1.jpg</StaticResource><TrackingEvents><Tracking event="creativeView">http://myTrackingURL/firstCompanionCreativeView</Tracking></TrackingEvents><CompanionClickThrough>http://www.tremormedia.com</CompanionClickThrough></Companion><Companion width="728" height="90"><StaticResource creativeType="image/jpeg">http://demo.tremormedia.com/proddev/vast/728x90_banner1.jpg</StaticResource><CompanionClickThrough>http://www.tremormedia.com</CompanionClickThrough></Companion></CompanionAds></Creative></Creatives></InLine></Ad></VAST>'
		        				    //'apiAddress' : 'http://www.adotube.com/php/services/player/OMLService.php?avpid=oRYYzvQ&platform_version=vast20&ad_type=linear&groupbypass=1&HTTP_REFERER=http://www.longtailvideo.com&video_identifier=longtailvideo.com,test', //for xdr only
		        				    //'xdrMethod': 'yql' //['yql' | 'xdr']
		        				}
		        			    ],
		        			    'schedule' : []
		        			}
	                };
		          if(startdelay>0){
		        	  options.ads.schedule.push({'position':'mid-roll','startTime':startdelay});
		          }else if(startdelay==0){
		        	  options.ads.schedule.push({'position':'pre-roll'});
		          }else{
		        	  options.ads.schedule.push({'position':'post-roll'});
		          }
		          _V_(videoEl.id, options);
		
		        }, 0);
				
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