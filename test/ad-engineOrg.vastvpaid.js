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
							url : "ad-vastPlugin.js",
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
				var containerId = statics.ADIAX_SLOT_PREFIX+ adData.unitid;
				adUtil.loadStyle("#"+containerId+" > * {width:100%!important;height:100%!important;}.vjs-default-skin{color:#cccccc;}@font-face{font-family:'VideoJS';src:url('font/vjs.eot');src:url('font/vjs.eot?#iefix') format('embedded-opentype'),url('font/vjs.woff') format('woff'),url('font/vjs.ttf') format('truetype'),url('font/vjs.svg#icomoon') format('svg');font-weight:normal;font-style:normal;}.vjs-default-skin .vjs-slider{outline:0;position:relative;cursor:pointer;padding:0;background-color:#333333;background-color:rgba(51,51,51,0.9);}.vjs-default-skin .vjs-slider:focus{-webkit-box-shadow:0 0 2em #ffffff;-moz-box-shadow:0 0 2em #ffffff;box-shadow:0 0 2em #ffffff;}.vjs-default-skin .vjs-slider-handle{position:absolute;left:0;top:0;}.vjs-default-skin .vjs-slider-handle:before{content:'\e009';font-family:VideoJS;font-size:1em;line-height:1;text-align:center;text-shadow:0em 0em 1em #fff;position:absolute;top:0;left:0;-webkit-transform:rotate(-45deg);-moz-transform:rotate(-45deg);-ms-transform:rotate(-45deg);-o-transform:rotate(-45deg);transform:rotate(-45deg);}.vjs-default-skin .vjs-control-bar{display:none;position:absolute;bottom:0;left:0;right:0;height:3.0em;background-color:#07141e;background-color:rgba(7,20,30,0.7);}.vjs-default-skin.vjs-has-started .vjs-control-bar{display:block;visibility:visible;opacity:1;-webkit-transition:visibility 0.1s,opacity 0.1s;-moz-transition:visibility 0.1s,opacity 0.1s;-o-transition:visibility 0.1s,opacity 0.1s;transition:visibility 0.1s,opacity 0.1s;}.vjs-default-skin.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar{display:block;visibility:hidden;opacity:0;-webkit-transition:visibility 1s,opacity 1s;-moz-transition:visibility 1s,opacity 1s;-o-transition:visibility 1s,opacity 1s;transition:visibility 1s,opacity 1s;}.vjs-default-skin.vjs-controls-disabled .vjs-control-bar{display:none;}.vjs-default-skin.vjs-using-native-controls .vjs-control-bar{display:none;}.vjs-default-skin.vjs-error .vjs-control-bar{display:none;}.vjs-audio.vjs-default-skin.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar{opacity:1;visibility:visible;}@media \0screen{.vjs-default-skin.vjs-user-inactive.vjs-playing .vjs-control-bar:before{content:';}}.vjs-default-skin .vjs-control{outline:none;position:relative;float:left;text-align:center;margin:0;padding:0;height:3.0em;width:4em;}.vjs-default-skin .vjs-control:before{font-family:VideoJS;font-size:1.5em;line-height:2;position:absolute;top:0;left:0;width:100%;height:100%;text-align:center;text-shadow:1px 1px 1px rgba(0,0,0,0.5);}.vjs-default-skin .vjs-control:focus:before,.vjs-default-skin .vjs-control:hover:before{text-shadow:0em 0em 1em #ffffff;}.vjs-default-skin .vjs-control:focus{}.vjs-default-skin .vjs-control-text{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;}.vjs-default-skin .vjs-play-control{width:5em;cursor:pointer;}.vjs-default-skin .vjs-play-control:before{content:'\e001';}.vjs-default-skin.vjs-playing .vjs-play-control:before{content:'\e002';}.vjs-default-skin .vjs-playback-rate .vjs-playback-rate-value{font-size:1.5em;line-height:2;position:absolute;top:0;left:0;width:100%;height:100%;text-align:center;text-shadow:1px 1px 1px rgba(0,0,0,0.5);}.vjs-default-skin .vjs-playback-rate.vjs-menu-button .vjs-menu .vjs-menu-content{width:4em;left:-2em;list-style:none;}.vjs-default-skin .vjs-mute-control,.vjs-default-skin .vjs-volume-menu-button{cursor:pointer;float:right;}.vjs-default-skin .vjs-mute-control:before,.vjs-default-skin .vjs-volume-menu-button:before{content:'\e006';}.vjs-default-skin .vjs-mute-control.vjs-vol-0:before,.vjs-default-skin .vjs-volume-menu-button.vjs-vol-0:before{content:'\e003';}.vjs-default-skin .vjs-mute-control.vjs-vol-1:before,.vjs-default-skin .vjs-volume-menu-button.vjs-vol-1:before{content:'\e004';}.vjs-default-skin .vjs-mute-control.vjs-vol-2:before,.vjs-default-skin .vjs-volume-menu-button.vjs-vol-2:before{content:'\e005';}.vjs-default-skin .vjs-volume-control{width:5em;float:right;}.vjs-default-skin .vjs-volume-bar{width:5em;height:0.6em;margin:1.1em auto 0;}.vjs-default-skin .vjs-volume-level{position:absolute;top:0;left:0;height:0.5em;width:100%;background:#66a8cc url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAP0lEQVQIHWWMAQoAIAgDR/QJ/Ub//04+w7ZICBwcOg5FZi5iBB82AGzixEglJrd4TVK5XUJpskSTEvpdFzX9AB2pGziSQcvAAAAAAElFTkSuQmCC) -50% 0 repeat;}.vjs-default-skin .vjs-volume-bar .vjs-volume-handle{width:0.5em;height:0.5em;left:4.5em;}.vjs-default-skin .vjs-volume-handle:before{font-size:0.9em;top:-0.2em;left:-0.2em;width:1em;height:1em;}.vjs-default-skin .vjs-volume-menu-button .vjs-menu{display:block;width:0;height:0;border-top-color:transparent;}.vjs-default-skin .vjs-volume-menu-button .vjs-menu .vjs-menu-content{height:0;width:0;}.vjs-default-skin .vjs-volume-menu-button:hover .vjs-menu,.vjs-default-skin .vjs-volume-menu-button .vjs-menu.vjs-lock-showing{border-top-color:rgba(7,40,50,0.5);}.vjs-default-skin .vjs-volume-menu-button:hover .vjs-menu .vjs-menu-content,.vjs-default-skin .vjs-volume-menu-button .vjs-menu.vjs-lock-showing .vjs-menu-content{height:2.9em;width:10em;}.vjs-default-skin .vjs-progress-control{position:absolute;left:0;right:0;width:auto;font-size:0.3em;height:1em;top:-1em;-webkit-transition:all 0.4s;-moz-transition:all 0.4s;-o-transition:all 0.4s;transition:all 0.4s;}.vjs-default-skin:hover .vjs-progress-control{font-size:.9em;-webkit-transition:all 0.2s;-moz-transition:all 0.2s;-o-transition:all 0.2s;transition:all 0.2s;}.vjs-default-skin .vjs-progress-holder{height:100%;}.vjs-default-skin .vjs-progress-holder .vjs-play-progress,.vjs-default-skin .vjs-progress-holder .vjs-load-progress,.vjs-default-skin .vjs-progress-holder .vjs-load-progress div{position:absolute;display:block;height:100%;margin:0;padding:0;width:0;left:0;top:0;}.vjs-default-skin .vjs-play-progress{background:#66a8cc url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAP0lEQVQIHWWMAQoAIAgDR/QJ/Ub//04+w7ZICBwcOg5FZi5iBB82AGzixEglJrd4TVK5XUJpskSTEvpdFzX9AB2pGziSQcvAAAAAAElFTkSuQmCC) -50% 0 repeat;}.vjs-default-skin .vjs-load-progress{background:#646464;background:rgba(255,255,255,0.2);}.vjs-default-skin .vjs-load-progress div{background:#787878;background:rgba(255,255,255,0.1);}.vjs-default-skin .vjs-seek-handle{width:1.5em;height:100%;}.vjs-default-skin .vjs-seek-handle:before{padding-top:0.1em;}.vjs-default-skin.vjs-live .vjs-time-controls,.vjs-default-skin.vjs-live .vjs-time-divider,.vjs-default-skin.vjs-live .vjs-progress-control{display:none;}.vjs-default-skin.vjs-live .vjs-live-display{display:block;}.vjs-default-skin .vjs-live-display{display:none;font-size:1em;line-height:3em;}.vjs-default-skin .vjs-time-controls{font-size:1em;line-height:3em;}.vjs-default-skin .vjs-current-time{float:left;}.vjs-default-skin .vjs-duration{float:left;}.vjs-default-skin .vjs-remaining-time{display:none;float:left;}.vjs-time-divider{float:left;line-height:3em;}.vjs-default-skin .vjs-fullscreen-control{width:3.8em;cursor:pointer;float:right;}.vjs-default-skin .vjs-fullscreen-control:before{content:'\e000';}.vjs-default-skin.vjs-fullscreen .vjs-fullscreen-control:before{content:'\e00b';}.vjs-default-skin .vjs-big-play-button{left:0.5em;top:0.5em;font-size:3em;display:block;z-index:2;position:absolute;width:4em;height:2.6em;text-align:center;vertical-align:middle;cursor:pointer;opacity:1;background-color:#07141e;background-color:rgba(7,20,30,0.7);border:0.1em solid #3b4249;-webkit-border-radius:0.8em;-moz-border-radius:0.8em;border-radius:0.8em;-webkit-box-shadow:0px 0px 1em rgba(255,255,255,0.25);-moz-box-shadow:0px 0px 1em rgba(255,255,255,0.25);box-shadow:0px 0px 1em rgba(255,255,255,0.25);-webkit-transition:all 0.4s;-moz-transition:all 0.4s;-o-transition:all 0.4s;transition:all 0.4s;}.vjs-default-skin.vjs-big-play-centered .vjs-big-play-button{left:50%;margin-left:-2.1em;top:50%;margin-top:-1.4000000000000001em;}.vjs-default-skin.vjs-controls-disabled .vjs-big-play-button{display:none;}.vjs-default-skin.vjs-has-started .vjs-big-play-button{display:none;}.vjs-default-skin.vjs-using-native-controls .vjs-big-play-button{display:none;}.vjs-default-skin:hover .vjs-big-play-button,.vjs-default-skin .vjs-big-play-button:focus{outline:0;border-color:#fff;background-color:#505050;background-color:rgba(50,50,50,0.75);-webkit-box-shadow:0 0 3em #ffffff;-moz-box-shadow:0 0 3em #ffffff;box-shadow:0 0 3em #ffffff;-webkit-transition:all 0s;-moz-transition:all 0s;-o-transition:all 0s;transition:all 0s;}.vjs-default-skin .vjs-big-play-button:before{content:'\e001';font-family:VideoJS;line-height:2.6em;text-shadow:0.05em 0.05em 0.1em #000;text-align:center;position:absolute;left:0;width:100%;height:100%;}.vjs-error .vjs-big-play-button{display:none;}.vjs-error-display{display:none;}.vjs-error .vjs-error-display{display:block;position:absolute;left:0;top:0;width:100%;height:100%;}.vjs-error .vjs-error-display:before{content:'X';font-family:Arial;font-size:4em;color:#666666;line-height:1;text-shadow:0.05em 0.05em 0.1em #000;text-align:center;vertical-align:middle;position:absolute;left:0;top:50%;margin-top:-0.5em;width:100%;}.vjs-error-display div{position:absolute;bottom:1em;right:0;left:0;font-size:1.4em;text-align:center;padding:3px;background:#000000;background:rgba(0,0,0,0.5);}.vjs-error-display a,.vjs-error-display a:visited{color:#F4A460;}.vjs-loading-spinner{display:none;position:absolute;top:50%;left:50%;font-size:4em;line-height:1;width:1em;height:1em;margin-left:-0.5em;margin-top:-0.5em;opacity:0.75;}.vjs-waiting .vjs-loading-spinner,.vjs-seeking .vjs-loading-spinner{display:block;-webkit-animation:spin 1.5s infinite linear;-moz-animation:spin 1.5s infinite linear;-o-animation:spin 1.5s infinite linear;animation:spin 1.5s infinite linear;}.vjs-error .vjs-loading-spinner{display:none;-webkit-animation:none;-moz-animation:none;-o-animation:none;animation:none;}.vjs-default-skin .vjs-loading-spinner:before{content:'\e01e';font-family:VideoJS;position:absolute;top:0;left:0;width:1em;height:1em;text-align:center;text-shadow:0em 0em 0.1em #000;}@-moz-keyframes spin{0%{-moz-transform:rotate(0deg);}100%{-moz-transform:rotate(359deg);}}@-webkit-keyframes spin{0%{-webkit-transform:rotate(0deg);}100%{-webkit-transform:rotate(359deg);}}@-o-keyframes spin{0%{-o-transform:rotate(0deg);}100%{-o-transform:rotate(359deg);}}@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(359deg);}}.vjs-default-skin .vjs-menu-button{float:right;cursor:pointer;}.vjs-default-skin .vjs-menu{display:none;position:absolute;bottom:0;left:0em;width:0em;height:0em;margin-bottom:3em;border-left:2em solid transparent;border-right:2em solid transparent;border-top:1.55em solid #000000;border-top-color:rgba(7,40,50,0.5);}.vjs-default-skin .vjs-menu-button .vjs-menu .vjs-menu-content{display:block;padding:0;margin:0;position:absolute;width:10em;bottom:1.5em;max-height:15em;overflow:auto;left:-5em;background-color:#07141e;background-color:rgba(7,20,30,0.7);-webkit-box-shadow:-0.2em -0.2em 0.3em rgba(255,255,255,0.2);-moz-box-shadow:-0.2em -0.2em 0.3em rgba(255,255,255,0.2);box-shadow:-0.2em -0.2em 0.3em rgba(255,255,255,0.2);}.vjs-default-skin .vjs-menu-button:hover .vjs-control-content .vjs-menu,.vjs-default-skin .vjs-control-content .vjs-menu.vjs-lock-showing{display:block;}.vjs-default-skin.vjs-scrubbing .vjs-menu-button:hover .vjs-control-content .vjs-menu{display:none;}.vjs-default-skin .vjs-menu-button ul li{list-style:none;margin:0;padding:0.3em 0 0.3em 0;line-height:1.4em;font-size:1.2em;text-align:center;text-transform:lowercase;}.vjs-default-skin .vjs-menu-button ul li.vjs-selected{background-color:#000;}.vjs-default-skin .vjs-menu-button ul li:focus,.vjs-default-skin .vjs-menu-button ul li:hover,.vjs-default-skin .vjs-menu-button ul li.vjs-selected:focus,.vjs-default-skin .vjs-menu-button ul li.vjs-selected:hover{outline:0;color:#111;background-color:#ffffff;background-color:rgba(255,255,255,0.75);-webkit-box-shadow:0 0 1em #ffffff;-moz-box-shadow:0 0 1em #ffffff;box-shadow:0 0 1em #ffffff;}.vjs-default-skin .vjs-menu-button ul li.vjs-menu-title{text-align:center;text-transform:uppercase;font-size:1em;line-height:2em;padding:0;margin:0 0 0.3em 0;font-weight:bold;cursor:default;}.vjs-default-skin .vjs-subtitles-button:before{content:'\e00c';}.vjs-default-skin .vjs-captions-button:before{content:'\e008';}.vjs-default-skin .vjs-chapters-button:before{content:'\e00c';}.vjs-default-skin .vjs-chapters-button.vjs-menu-button .vjs-menu .vjs-menu-content{width:24em;left:-12em;}.vjs-default-skin .vjs-captions-button:focus .vjs-control-content:before,.vjs-default-skin .vjs-captions-button:hover .vjs-control-content:before{-webkit-box-shadow:0 0 1em #ffffff;-moz-box-shadow:0 0 1em #ffffff;box-shadow:0 0 1em #ffffff;}.video-js{background-color:#000;position:relative;padding:0;font-size:10px;vertical-align:middle;font-weight:normal;font-style:normal;font-family:Arial,sans-serif;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}.video-js .vjs-tech{position:absolute;top:0;left:0;width:100%;height:100%;}.video-js:-moz-full-screen{position:absolute;}body.vjs-full-window{padding:0;margin:0;height:100%;overflow-y:auto;}.video-js.vjs-fullscreen{position:fixed;overflow:hidden;z-index:1000;left:0;top:0;bottom:0;right:0;width:100% !important;height:100% !important;_position:absolute;}.video-js:-webkit-full-screen{width:100% !important;height:100% !important;}.video-js.vjs-fullscreen.vjs-user-inactive{cursor:none;}.vjs-poster{background-repeat:no-repeat;background-position:50% 50%;background-size:contain;background-color:#000000;cursor:pointer;margin:0;padding:0;position:absolute;top:0;right:0;bottom:0;left:0;}.vjs-poster img{display:block;margin:0 auto;max-height:100%;padding:0;width:100%;}.video-js.vjs-has-started .vjs-poster{display:none;}.video-js.vjs-audio.vjs-has-started .vjs-poster{display:block;}.video-js.vjs-controls-disabled .vjs-poster{display:none;}.video-js.vjs-using-native-controls .vjs-poster{display:none;}.video-js .vjs-text-track-display{position:absolute;top:0;left:0;bottom:3em;right:0;pointer-events:none;}.vjs-caption-settings{position:relative;top:1em;background-color:#000;opacity:0.75;color:#FFF;margin:0 auto;padding:0.5em;height:15em;font-family:Arial,Helvetica,sans-serif;font-size:12px;width:40em;}.vjs-caption-settings .vjs-tracksettings{top:0;bottom:2em;left:0;right:0;position:absolute;overflow:auto;}.vjs-caption-settings .vjs-tracksettings-colors,.vjs-caption-settings .vjs-tracksettings-font{float:left;}.vjs-caption-settings .vjs-tracksettings-colors:after,.vjs-caption-settings .vjs-tracksettings-font:after,.vjs-caption-settings .vjs-tracksettings-controls:after{clear:both;}.vjs-caption-settings .vjs-tracksettings-controls{position:absolute;bottom:1em;right:1em;}.vjs-caption-settings .vjs-tracksetting{margin:5px;padding:3px;min-height:40px;}.vjs-caption-settings .vjs-tracksetting label{display:block;width:100px;margin-bottom:5px;}.vjs-caption-settings .vjs-tracksetting span{display:inline;margin-left:5px;}.vjs-caption-settings .vjs-tracksetting > div{margin-bottom:5px;min-height:20px;}.vjs-caption-settings .vjs-tracksetting > div:last-child{margin-bottom:0;padding-bottom:0;min-height:0;}.vjs-caption-settings label > input{margin-right:10px;}.vjs-caption-settings input[type='button']{width:40px;height:40px;}.vjs-hidden{display:none !important;}.vjs-lock-showing{display:block !important;opacity:1;visibility:visible;}.vjs-no-js{padding:2em;color:#ccc;background-color:#333;font-size:1.8em;font-family:Arial,sans-serif;text-align:center;width:30em;height:15em;margin:0 auto;}.vjs-no-js a,.vjs-no-js a:visited{color:#F4A460;}");
				videojs.plugin('ads-setup', adUtil.adsSetupPlugin);
				var videoTag = '<video class="video-js vjs-default-skin" controls autoplay preload="auto" poster="http://vjs.zencdn.net/v/oceans.png" >' +
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
		          var adPluginOpts = {
	                  "plugins": {
	                    "ads-setup":{
	                      "adCancelTimeout":20000,// Wait for ten seconds before canceling the ad.
	                      "adsEnabled": true
	                    }
	                  }
	                };
		          adPluginOpts.plugins["ads-setup"].adTagXML = function(done){
		            //The setTimeout is to simulate asynchrony
		            setTimeout(function () {
		              done(null, '<?xml version="1.0" encoding="UTF-8" standalone="no"?><VAST version="2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd">  <Ad id="812030">    <InLine>      <AdSystem>FT</AdSystem>      <AdTitle>Flashtalking mobile vast template 2.0</AdTitle>      <Description>date of revision 10-04-14</Description>             	<Impression id="ft_vast_i">          <![CDATA[http://servedby.flashtalking.com/imp/1/31714;812030;201;gif;DailyMail;640x360VASTHTML5/?ft_creative=377314&ft_configuration=0&cachebuster=1031654219]]>        </Impression>        <Impression id="3rdparty">          <![CDATA[]]>        </Impression>        <Impression id="3rdparty">          <![CDATA[]]>        </Impression>        <Impression id="3rdparty">          <![CDATA[]]>        </Impression>        <Impression id="3rdparty">          <![CDATA[]]>        </Impression>        <Impression id="3rdparty">          <![CDATA[]]>        </Impression>        <Impression id="3rdparty">          <![CDATA[]]>        </Impression>      <Creatives>        <Creative sequence="1">          <Linear>            <Duration>00:00:15</Duration>            <TrackingEvents>              <Tracking event="start">                  <![CDATA[http://stat.flashtalking.com/reportV3/ft.stat?34923237-0-13-0-31381941248527-1031654219]]>              </Tracking>              <Tracking event="midpoint">                  <![CDATA[http://stat.flashtalking.com/reportV3/ft.stat?34923237-0-15-0-31381941248527-1031654219]]>              </Tracking>              <Tracking event="firstQuartile">                  <![CDATA[http://stat.flashtalking.com/reportV3/ft.stat?34923237-0-14-0-31381941248527-1031654219]]>              </Tracking>              <Tracking event="thirdQuartile">                  <![CDATA[http://stat.flashtalking.com/reportV3/ft.stat?34923237-0-16-0-31381941248527-1031654219]]>              </Tracking>              <Tracking event="complete">                  <![CDATA[http://stat.flashtalking.com/reportV3/ft.stat?34923237-0-17-0-31381941248527-1031654219]]>              </Tracking>              <Tracking event="mute">                  <![CDATA[http://stat.flashtalking.com/reportV3/ft.stat?34923237-0-38-0-31381941248527-1031654219]]>              </Tracking>              <Tracking event="fullscreen">                  <![CDATA[http://stat.flashtalking.com/reportV3/ft.stat?34923237-0-313-0-31381941248527-1031654219]]>              </Tracking>            </TrackingEvents>            <VideoClicks>              <ClickThrough>                  <![CDATA[http://servedby.flashtalking.com/click/1/31714;812030;377314;211;0/?random=1031654219&ft_width=640&ft_height=360&url=http://www.google.co.uk]]>              </ClickThrough>            </VideoClicks>            <MediaFiles>              <MediaFile id="1" delivery="progressive" type="video/mp4" bitrate="524" width="640" height="360">                  <![CDATA[http://cdn.flashtalking.com/17601/30988_26752_WacoClub_640x360_384kbps.mp4]]>              </MediaFile>            </MediaFiles>          </Linear>        </Creative>        <Creative sequence="1">          <CompanionAds>          </CompanionAds>        </Creative>      </Creatives>    </InLine>  </Ad></VAST>');
		            }, 10000);
		          };
		          player = videojs(videoEl, adPluginOpts);
		
		          if(player) {
		            player.on('vast.adStart', function() {
		              player.one('vast.adEnd', function() {
		              });
		            });
		          }
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