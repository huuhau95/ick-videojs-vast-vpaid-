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
						if(response!=""){
							var resjs=eval("("+response+")");
							adIax.render.fill(resjs.ads);
						}
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
				if(adData.impurls){
					for(var i=0;i<adData.impurls.length;i++){
						container.appendChild(adUtil.cimg(adData.impurls[i]));
					}
				}
			},
			
			third : function(adData) {
				var objcon = adData.container;
				if(!adData.adm && adData.backfillcode){
					adUtil.set_innerHTML(objcon.id,adData.backfillcode);
				}else{
					if(adData.adm && (adData.adm.indexOf("</VAST>")>-1 || adData.adm.indexOf("</VideoAdServingTemplate>")>-1)){
						var vastJs = {
							url : "videojs.vast.plugin.min.js",
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
				var w = adData.w,h = adData.h;
				if (adUtil.isChrome && (w<400 || h<300)) {
					w = 400;
					h = 300;
				};
				var link = adUtil.createElem("link","","","","",statics.ADIAX_STATIC_HOST+"css/video-js.min.css");
				document.getElementsByTagName("head")[0].appendChild(link);
				// adUtil.loadStyle('.vjs-default-skin{color:#ccc}@font-face{font-family:VideoJS;src:url(http://vjs.zencdn.net/f/3/vjs.eot);src:url(http://vjs.zencdn.net/f/3/vjs.eot?#iefix) format("embedded-opentype"),url(http://vjs.zencdn.net/f/3/vjs.woff) format("woff"),url(http://vjs.zencdn.net/f/3/vjs.ttf) format("truetype"),url(http://vjs.zencdn.net/f/3/vjs.svg#icomoon) format("svg");font-weight:400;font-style:normal}.vjs-default-skin .vjs-slider{outline:0;position:relative;cursor:pointer;padding:0;background-color:#333;background-color:rgba(51,51,51,.9)}.vjs-default-skin .vjs-slider:focus{-webkit-box-shadow:0 0 2em #fff;-moz-box-shadow:0 0 2em #fff;box-shadow:0 0 2em #fff}.vjs-default-skin .vjs-slider-handle{position:absolute;left:0;top:0}.vjs-default-skin .vjs-slider-handle:before{content:"\\e009";font-family:VideoJS;font-size:1em;line-height:1;text-align:center;text-shadow:0 0 1em #fff;position:absolute;top:0;left:0;-webkit-transform:rotate(-45deg);-moz-transform:rotate(-45deg);-ms-transform:rotate(-45deg);-o-transform:rotate(-45deg);transform:rotate(-45deg)}.vjs-default-skin .vjs-control-bar{display:none;position:absolute;bottom:0;left:0;right:0;height:3em;background-color:#07141e;background-color:rgba(7,20,30,.7)}.vjs-default-skin.vjs-has-started .vjs-control-bar{display:block;visibility:visible;opacity:1;-webkit-transition:visibility .1s,opacity .1s;-moz-transition:visibility .1s,opacity .1s;-o-transition:visibility .1s,opacity .1s;transition:visibility .1s,opacity .1s}.vjs-default-skin.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar{display:block;visibility:hidden;opacity:0;-webkit-transition:visibility 1s,opacity 1s;-moz-transition:visibility 1s,opacity 1s;-o-transition:visibility 1s,opacity 1s;transition:visibility 1s,opacity 1s}.vjs-default-skin.vjs-controls-disabled .vjs-control-bar{display:none}.vjs-default-skin.vjs-using-native-controls .vjs-control-bar{display:none}.vjs-default-skin.vjs-error .vjs-control-bar{display:none}@media \0screen{.vjs-default-skin.vjs-user-inactive.vjs-playing .vjs-control-bar :before{content:""}}.vjs-default-skin .vjs-control{outline:0;position:relative;float:left;text-align:center;margin:0;padding:0;height:3em;width:4em}.vjs-default-skin .vjs-control:before{font-family:VideoJS;font-size:1.5em;line-height:2;position:absolute;top:0;left:0;width:100%;height:100%;text-align:center;text-shadow:1px 1px 1px rgba(0,0,0,.5)}.vjs-default-skin .vjs-control:focus:before,.vjs-default-skin .vjs-control:hover:before{text-shadow:0 0 1em #fff}.vjs-default-skin .vjs-control:focus{}.vjs-default-skin .vjs-control-text{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}.vjs-default-skin .vjs-play-control{width:5em;cursor:pointer}.vjs-default-skin .vjs-play-control:before{content:"\\e001"}.vjs-default-skin.vjs-playing .vjs-play-control:before{content:"\\e002"}.vjs-default-skin .vjs-playback-rate .vjs-playback-rate-value{font-size:1.5em;line-height:2;position:absolute;top:0;left:0;width:100%;height:100%;text-align:center;text-shadow:1px 1px 1px rgba(0,0,0,.5)}.vjs-default-skin .vjs-playback-rate.vjs-menu-button .vjs-menu .vjs-menu-content{width:4em;left:-2em;list-style:none}.vjs-default-skin .vjs-mute-control,.vjs-default-skin .vjs-volume-menu-button{cursor:pointer;float:right}.vjs-default-skin .vjs-mute-control:before,.vjs-default-skin .vjs-volume-menu-button:before{content:"\\e006"}.vjs-default-skin .vjs-mute-control.vjs-vol-0:before,.vjs-default-skin .vjs-volume-menu-button.vjs-vol-0:before{content:"\\e003"}.vjs-default-skin .vjs-mute-control.vjs-vol-1:before,.vjs-default-skin .vjs-volume-menu-button.vjs-vol-1:before{content:"\\e004"}.vjs-default-skin .vjs-mute-control.vjs-vol-2:before,.vjs-default-skin .vjs-volume-menu-button.vjs-vol-2:before{content:"\\e005"}.vjs-default-skin .vjs-volume-control{width:5em;float:right}.vjs-default-skin .vjs-volume-bar{width:5em;height:.6em;margin:1.1em auto 0}.vjs-default-skin .vjs-volume-menu-button .vjs-menu-content{height:2.9em}.vjs-default-skin .vjs-volume-level{position:absolute;top:0;left:0;height:.5em;width:100%;background:#66a8cc url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAP0lEQVQIHWWMAQoAIAgDR/QJ/Ub//04+w7ZICBwcOg5FZi5iBB82AGzixEglJrd4TVK5XUJpskSTEvpdFzX9AB2pGziSQcvAAAAAAElFTkSuQmCC) -50% 0 repeat}.vjs-default-skin .vjs-volume-bar .vjs-volume-handle{width:.5em;height:.5em;left:4.5em}.vjs-default-skin .vjs-volume-handle:before{font-size:.9em;top:-.2em;left:-.2em;width:1em;height:1em}.vjs-default-skin .vjs-volume-menu-button .vjs-menu .vjs-menu-content{width:6em;left:-4em}.vjs-default-skin .vjs-progress-control{position:absolute;left:0;right:0;width:auto;font-size:.3em;height:1em;top:-1em;-webkit-transition:all .4s;-moz-transition:all .4s;-o-transition:all .4s;transition:all .4s}.vjs-default-skin:hover .vjs-progress-control{font-size:.9em;-webkit-transition:all .2s;-moz-transition:all .2s;-o-transition:all .2s;transition:all .2s}.vjs-default-skin .vjs-progress-holder{height:100%}.vjs-default-skin .vjs-progress-holder .vjs-play-progress,.vjs-default-skin .vjs-progress-holder .vjs-load-progress,.vjs-default-skin .vjs-progress-holder .vjs-load-progress div{position:absolute;display:block;height:100%;margin:0;padding:0;width:0;left:0;top:0}.vjs-default-skin .vjs-play-progress{background:#66a8cc url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAP0lEQVQIHWWMAQoAIAgDR/QJ/Ub//04+w7ZICBwcOg5FZi5iBB82AGzixEglJrd4TVK5XUJpskSTEvpdFzX9AB2pGziSQcvAAAAAAElFTkSuQmCC) -50% 0 repeat}.vjs-default-skin .vjs-load-progress{background:#646464;background:rgba(255,255,255,.2)}.vjs-default-skin .vjs-load-progress div{background:#787878;background:rgba(255,255,255,.1)}.vjs-default-skin .vjs-seek-handle{width:1.5em;height:100%}.vjs-default-skin .vjs-seek-handle:before{padding-top:.1em}.vjs-default-skin.vjs-live .vjs-time-controls,.vjs-default-skin.vjs-live .vjs-time-divider,.vjs-default-skin.vjs-live .vjs-progress-control{display:none}.vjs-default-skin.vjs-live .vjs-live-display{display:block}.vjs-default-skin .vjs-live-display{display:none;font-size:1em;line-height:3em}.vjs-default-skin .vjs-time-controls{font-size:1em;line-height:3em}.vjs-default-skin .vjs-current-time{float:left}.vjs-default-skin .vjs-duration{float:left}.vjs-default-skin .vjs-remaining-time{display:none;float:left}.vjs-time-divider{float:left;line-height:3em}.vjs-default-skin .vjs-fullscreen-control{width:3.8em;cursor:pointer;float:right}.vjs-default-skin .vjs-fullscreen-control:before{content:"\\e000"}.vjs-default-skin.vjs-fullscreen .vjs-fullscreen-control:before{content:"\\e00b"}.vjs-default-skin .vjs-big-play-button{left:.5em;top:.5em;font-size:3em;display:block;z-index:2;position:absolute;width:4em;height:2.6em;text-align:center;vertical-align:middle;cursor:pointer;opacity:1;background-color:#07141e;background-color:rgba(7,20,30,.7);border:.1em solid #3b4249;-webkit-border-radius:.8em;-moz-border-radius:.8em;border-radius:.8em;-webkit-box-shadow:0 0 1em rgba(255,255,255,.25);-moz-box-shadow:0 0 1em rgba(255,255,255,.25);box-shadow:0 0 1em rgba(255,255,255,.25);-webkit-transition:all .4s;-moz-transition:all .4s;-o-transition:all .4s;transition:all .4s}.vjs-default-skin.vjs-big-play-centered .vjs-big-play-button{left:50%;margin-left:-2.1em;top:50%;margin-top:-1.4000000000000001em}.vjs-default-skin.vjs-controls-disabled .vjs-big-play-button{display:none}.vjs-default-skin.vjs-has-started .vjs-big-play-button{display:none}.vjs-default-skin.vjs-using-native-controls .vjs-big-play-button{display:none}.vjs-default-skin:hover .vjs-big-play-button,.vjs-default-skin .vjs-big-play-button:focus{outline:0;border-color:#fff;background-color:#505050;background-color:rgba(50,50,50,.75);-webkit-box-shadow:0 0 3em #fff;-moz-box-shadow:0 0 3em #fff;box-shadow:0 0 3em #fff;-webkit-transition:all 0s;-moz-transition:all 0s;-o-transition:all 0s;transition:all 0s}.vjs-default-skin .vjs-big-play-button:before{content:"\\e001";font-family:VideoJS;line-height:2.6em;text-shadow:.05em .05em .1em #000;text-align:center;position:absolute;left:0;width:100%;height:100%}.vjs-error .vjs-big-play-button{display:none}.vjs-error-display{display:none}.vjs-error .vjs-error-display{display:block;position:absolute;left:0;top:0;width:100%;height:100%}.vjs-error .vjs-error-display:before{content:"X";font-family:Arial;font-size:4em;color:#666;line-height:1;text-shadow:.05em .05em .1em #000;text-align:center;vertical-align:middle;position:absolute;top:50%;margin-top:-.5em;width:100%}.vjs-error-display div{position:absolute;font-size:1.4em;text-align:center;bottom:1em;right:1em;left:1em}.vjs-error-display a,.vjs-error-display a:visited{color:#F4A460}.vjs-loading-spinner{display:none;position:absolute;top:50%;left:50%;font-size:4em;line-height:1;width:1em;height:1em;margin-left:-.5em;margin-top:-.5em;opacity:.75}.vjs-waiting .vjs-loading-spinner,.vjs-seeking .vjs-loading-spinner{display:block;-webkit-animation:spin 1.5s infinite linear;-moz-animation:spin 1.5s infinite linear;-o-animation:spin 1.5s infinite linear;animation:spin 1.5s infinite linear}.vjs-error .vjs-loading-spinner{display:none;-webkit-animation:none;-moz-animation:none;-o-animation:none;animation:none}.vjs-default-skin .vjs-loading-spinner:before{content:"\\e01e";font-family:VideoJS;position:absolute;top:0;left:0;width:1em;height:1em;text-align:center;text-shadow:0 0 .1em #000}@-moz-keyframes spin{0%{-moz-transform:rotate(0deg)}100%{-moz-transform:rotate(359deg)}}@-webkit-keyframes spin{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(359deg)}}@-o-keyframes spin{0%{-o-transform:rotate(0deg)}100%{-o-transform:rotate(359deg)}}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(359deg)}}.vjs-default-skin .vjs-menu-button{float:right;cursor:pointer}.vjs-default-skin .vjs-menu{display:none;position:absolute;bottom:0;left:0;width:0;height:0;margin-bottom:3em;border-left:2em solid transparent;border-right:2em solid transparent;border-top:1.55em solid #000;border-top-color:rgba(7,40,50,.5)}.vjs-default-skin .vjs-menu-button .vjs-menu .vjs-menu-content{display:block;padding:0;margin:0;position:absolute;width:10em;bottom:1.5em;max-height:15em;overflow:auto;left:-5em;background-color:#07141e;background-color:rgba(7,20,30,.7);-webkit-box-shadow:-.2em -.2em .3em rgba(255,255,255,.2);-moz-box-shadow:-.2em -.2em .3em rgba(255,255,255,.2);box-shadow:-.2em -.2em .3em rgba(255,255,255,.2)}.vjs-default-skin .vjs-menu-button:hover .vjs-menu{display:block}.vjs-default-skin .vjs-menu-button ul li{list-style:none;margin:0;padding:.3em 0;line-height:1.4em;font-size:1.2em;text-align:center;text-transform:lowercase}.vjs-default-skin .vjs-menu-button ul li.vjs-selected{background-color:#000}.vjs-default-skin .vjs-menu-button ul li:focus,.vjs-default-skin .vjs-menu-button ul li:hover,.vjs-default-skin .vjs-menu-button ul li.vjs-selected:focus,.vjs-default-skin .vjs-menu-button ul li.vjs-selected:hover{outline:0;color:#111;background-color:#fff;background-color:rgba(255,255,255,.75);-webkit-box-shadow:0 0 1em #fff;-moz-box-shadow:0 0 1em #fff;box-shadow:0 0 1em #fff}.vjs-default-skin .vjs-menu-button ul li.vjs-menu-title{text-align:center;text-transform:uppercase;font-size:1em;line-height:2em;padding:0;margin:0 0 .3em;font-weight:700;cursor:default}.vjs-default-skin .vjs-subtitles-button:before{content:"\\e00c"}.vjs-default-skin .vjs-captions-button:before{content:"\\e008"}.vjs-default-skin .vjs-chapters-button:before{content:"\\e00c"}.vjs-default-skin .vjs-chapters-button.vjs-menu-button .vjs-menu .vjs-menu-content{width:24em;left:-12em}.vjs-default-skin .vjs-captions-button:focus .vjs-control-content:before,.vjs-default-skin .vjs-captions-button:hover .vjs-control-content:before{-webkit-box-shadow:0 0 1em #fff;-moz-box-shadow:0 0 1em #fff;box-shadow:0 0 1em #fff}.video-js{background-color:#000;position:relative;padding:0;font-size:10px;vertical-align:middle;font-weight:400;font-style:normal;font-family:Arial,sans-serif;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.video-js .vjs-tech{position:absolute;top:0;left:0;width:100%;height:100%}.video-js:-moz-full-screen{position:absolute}body.vjs-full-window{padding:0;margin:0;height:100%;overflow-y:auto}.video-js.vjs-fullscreen{position:fixed;overflow:hidden;z-index:1000;left:0;top:0;bottom:0;right:0;width:100%!important;height:100%!important;_position:absolute}.video-js:-webkit-full-screen{width:100%!important;height:100%!important}.video-js.vjs-fullscreen.vjs-user-inactive{cursor:none}.vjs-poster{background-repeat:no-repeat;background-position:50% 50%;background-size:contain;cursor:pointer;height:100%;margin:0;padding:0;position:relative;width:100%}.vjs-poster img{display:block;margin:0 auto;max-height:100%;padding:0;width:100%}.video-js.vjs-using-native-controls .vjs-poster{display:none}.video-js .vjs-text-track-display{text-align:center;position:absolute;bottom:4em;left:1em;right:1em}.video-js.vjs-user-inactive.vjs-playing .vjs-text-track-display{bottom:1em}.video-js .vjs-text-track{display:none;font-size:1.4em;text-align:center;margin-bottom:.1em;background-color:#000;background-color:rgba(0,0,0,.5)}.video-js .vjs-subtitles{color:#fff}.video-js .vjs-captions{color:#fc6}.vjs-tt-cue{display:block}.vjs-default-skin .vjs-hidden{display:none}.vjs-lock-showing{display:block!important;opacity:1;visibility:visible}.vjs-no-js{padding:20px;color:#ccc;background-color:#333;font-size:18px;font-family:Arial,sans-serif;text-align:center;width:300px;height:150px;margin:0 auto}.vjs-no-js a,.vjs-no-js a:visited{color:#F4A460}.vast-skip-button{display:block;position:absolute;top:5px;right:0;width:auto;background-color:#000;color:#AAA;font-size:12px;font-style:italic;line-height:12px;padding:10px;z-index:2}.vast-skip-button.enabled{cursor:pointer;color:#fff}.vast-skip-button.enabled:hover{cursor:pointer;background:#333}.vast-blocker{display:block;position:absolute;margin:0;padding:0;height:100%;width:100%;top:0;left:0;right:0;bottom:0}.vjs-ad-playing.vjs-ad-playing .vjs-progress-control{pointer-events:none}.vjs-ad-playing.vjs-ad-playing .vjs-play-progress{background-color:#ffe400}.vjs-ad-playing.vjs-ad-loading .vjs-loading-spinner{display:block}');
				var videoTag = '<video loop id="video_'+containerId+'" class="video-js vjs-default-skin" autoplay controls  preload="auto" poster=""  data-setup="{}" width="'+w+'" height="'+h+'">' +
		           '<source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4"/>' +
		           '<source src="http://vjs.zencdn.net/v/oceans.webm" type="video/webm"/>' +
		           '<source src="http://vjs.zencdn.net/v/oceans.ogv" type="video/ogg"/>' +
		           '<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
		           '<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>' +
		           '</p>' +
		          '</video>';
				objcon.innerHTML = videoTag;
		        var vid = adUtil.videoJs("video_"+containerId);
		        var options = {
	        		  // url: {
	        		  // 	xml:admFormat
	        		  // },
	        		  url:'./xml_test.xml',
				      skip:-1,
				      loop:true
		        };
		        console.log(admFormat);
		        vid.muted(true);
				vid.ads();
    			vid.vast(options);
    			if (adUtil.isChrome) {
	    			setTimeout(function(){
				      document.getElementById("video_"+containerId).style="width:"+adData.w+"px;height:"+adData.h+"px;";
				      if(document.getElementById("video_"+containerId+"_flash_api")){
					      document.getElementById("video_"+containerId+"_flash_api").width=adData.w+"px";
					      document.getElementById("video_"+containerId+"_flash_api").height=adData.h+"px";
					  }
				    },100)
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