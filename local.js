

var cur_blabs = {};
var cur_twits = {};

replicate("tpl_blab", []);


refresh = function() {

	secs = 60;

	var keywords = localStorage.getItem("keywords").split(/[,]/).map(function(s) {
		return s.toLowerCase().trim();
	});



	var blabs = null;
	$.get("https://api.blab.im/stream/list?count=100&tags=&states=started&offset=0", function(list) {

		var new_blabs = {};
		var new_twits = {};

		blabs = list.result;
		blabs.sort(function(a, b) {
			if(a.stream_id < b.stream_id) { return -1; }
			if(a.stream_id > b.stream_id) { return  1; }
			return 0;
		});

		var meet = new Meet();

		replicate("tpl_blab", blabs, function(e, d, i) {

			var stream_id = d.stream_id;
			e.id = stream_id;

			$(e).hide();

			// show those blabs where title matches 1 or more keywords
			var theme = d.theme.toLowerCase();
			keywords.forEach(function(s) {
				if((s) && (!s.startsWith("@")) && (theme.indexOf(s) >= 0)) {
					$(e).show();
					new_blabs[stream_id] = d;
				}
			});

			// fetch the full list of viewers for this blab
			meet.start(function(done) {
				$.get("https://api.blab.im/stream/viewers?stream_id="+stream_id, function(dd) {
					var twits = dd.result.map(function(o) {
						var twit = o.twitter_username.toLowerCase();
						keywords.forEach(function(s) {
							if((s) && (s.startsWith("@")) && (twit.indexOf(s.substr(1)) >= 0)) {
								// matched a twit
								new_twits[twit] = o;
								twit = "<span class=hilite>"+twit+"</span>"; // -- hilite this one
								$(e).show();
							}
						});
						return "@"+twit;
					});
					$("#who_"+stream_id).html(twits.join(", "));
					done();
				});
			});

		});


		var newbies = [];
		meet.allDone(function(){
			//console.log("meet done");

			// pop a notice if new twits have appeared since last check
			for(var k in new_twits) {
				if(cur_twits[k] === undefined) {
					// new twit appeared
					var o = new_twits[k];
					newbies.push(o.twitter_username.abbr(30) + " ("+o.viewer_count+")");
				}
			}
			cur_twits = new_twits;
			if(newbies.length > 0) {
				notify("Sleepless Blab Detector Mark IV", newbies.join("   "));
			}

		});


		// pop a notice if new blabs have appeared since last check
		var newbies = [];
		for(var k in new_blabs) {
			if(cur_blabs[k] === undefined) {
				// new blab appeared
				var o = new_blabs[k];
				newbies.push(o.theme.abbr(30) + " ("+o.viewer_count+")");
			}
		}
		cur_blabs = new_blabs;
		if(newbies.length > 0) {
			notify("Sleepless Blab Detector Mark IV", newbies.join("   "));
		}


	});
}


secs = 60;
setInterval(tick = function() {
	if(secs > 0) {
		secs -= 1;
	}
	else {
		refresh();
	}
	$("#secs").html(secs);
}, 1000);



var v = localStorage.getItem("keywords");
if(!v) {
	v = "god,religion,religious,faith,prayer,belief,believe,truth,christian,muslim,good,tarot,spirit,@magnabosco,@CJRobbemond,@vansliger";
}
$("#keywords").val(v).change(function() {
	localStorage.setItem("keywords", this.value);
	refresh();
}).change();


