

log = function(s) { console.log(s); }

function getQueryData(key) {
	var o = {}
	var s = document.location.search
	if(s) {
		var kv = s.substr(1).split("&")
		for(var i = 0; i < kv.length; i++) {
			var aa = kv[i].split("=")
			o[aa[0]] = decodeURIComponent(aa[1])
		}
	}
	if(key !== undefined) {
		return o[key];
	}
	return o;
}


replicate("tpl_who", []);

cur_ver = null;

cur_blabs = {};
total_blabs = 0;
matched_blabs = 0;
matched_users = 0;

cached_users = {};

replicate("tpl_blab", []);


keywords = [];

analyze = function(blabs) {

	var new_blabs = {};

	total_blabs = blabs.length;
	matched_blabs = 0;
	matched_users = 0;

	blabs.forEach(function(blab) {
		var stream_id = blab.stream_id;

		blab.show = 0;

		// show those blabs where title matches 1 or more keywords
		var theme = blab.theme.toLowerCase();
		keywords.forEach(function(s) {
			if(s) {
				if( ! s.startsWith("@") ) {
					if(theme.indexOf(s) >= 0) {
						blab.show = 1;
						matched_blabs += 1;
						new_blabs[stream_id] = blab;
					}
				}
			}
		});

		for(var c = 0; c < blab.callers.length; c++) {
			var caller = blab.callers[c];
			for(var u = 0; u < blab.users.length; u++) {
				var user = blab.users[u];
				if(caller.user_id == user.user_id) {
					user.caller = 1;
					break;
				}
			}
			if(u == blab.users.length) {
				// caller wasn't found in users array
				caller.caller = 1;
				blab.users.push(caller);
			}
		}
		

		var users = blab.users;
		users.forEach(function(user) {
			var user_id = user.user_id;
			user.hilite = 0;
			var twitter_username = user.twitter_username.toLowerCase();
			keywords.forEach(function(s) {
				if(s) {
					if(s.startsWith("@")) {
						if(twitter_username.indexOf(s.substr(1)) >= 0) {
							user.hilite = 1;
							blab.show = 1;
							matched_users += 1;
							new_blabs[stream_id] = blab;
						}
					}
					else {
						// check full name
					}
				}
			});
		});

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
}


display = function(blabs) {
	$("#total_blabs").html(total_blabs);
	$("#matched_blabs").html(matched_blabs);
	$("#matched_users").html(matched_users);
	replicate("tpl_blab", blabs, function(e_blab, blab, i) {
		$(e_blab).find(".preview").click(function(evt) {
			evt.stopPropagation();	
			var url= "http://blab.im/"+blab.friendly_url;
			$("#blab_frame").attr("src", url);
			$("#monitor").click();
		});
		e_blab.id = "blab_"+blab.stream_id;
		replicate("tpl_user_"+blab.stream_id, blab.users, function(e_user, user) {
			var user_id = user.user_id;
			e_user.id = "user_"+user_id;

			var e = $(e_user).find(".fullname").get(0);
			var u = cached_users[user_id];
			if(u) {
				e.innerHTML = u.fullname;
				$(e_user).find("img").attr("src", u.image_square);
			}
			else {
				$.get("https://api.blab.im/user/"+user_id, function(u) {
					cached_users[user_id] = u;
					e.innerHTML = u.fullname;
					$(e_user).find("img").attr("src", u.image_square);
				});
			}

			$(e_user).click(function(evt) {
				evt.stopPropagation();	
				socket.send({msg:"user_info", user:user});
			});

		});
		/*
		replicate("tpl_xc_"+blab.stream_id, blab.users, function(e, user) {
			$(e).html(user.user_id.abbr(8));
		});
		replicate("tpl_xu_"+blab.stream_id, blab.callers, function(e, user) {
			$(e).html(user.user_id.abbr(8));
		});
		*/
	});
}


refresh = function() {

	secs = 60;

	keywords = localStorage.getItem("keywords").split(/[,]/).map(function(s) {
		var s = s.toLowerCase().trim();
		return s ? s : null;
	});

	var blabs = [];

	$.get("https://api.blab.im/stream/list?count=100&tags=&states=started&offset=0", function(r) {

		blabs = r.result;

		// sort the blabs by stream_id so they are in a consistent order for change detection
		blabs.sort(function(a, b) {
			if(a.stream_id < b.stream_id) { return -1; }
			if(a.stream_id > b.stream_id) { return  1; }
			return 0;
		});


		// load the user data for each blab
		var m = new Meet();
		blabs.forEach(function(blab) {
			m.start(function(cb) {
				blab.users = [];
				$.get("https://api.blab.im/stream/viewers?count=100&stream_id="+blab.stream_id, function(r) {
					var users = r.result;
					var m2 = new Meet();
					users.forEach(function(user) {
						blab.users.push(user);
					});
					m2.allDone(function() {
						// sort users by user id for consistency in change detection
						blab.users.sort(function(a, b) {
							if(a.user_id < b.user_id) { return -1; }
							if(a.user_id > b.user_id) { return  1; }
							return 0;
						});

						cb();
					});
				});
			});
		});
		m.allDone(function() {
			analyze(blabs);
			display(blabs);
		});

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
	v = "god,religion,religious,faith,prayer,belief,believe,truth,christian,muslim,karma,tarot,spirit";
}
$("#keywords").val(v).change(function() {
	localStorage.setItem("keywords", this.value);
	refresh();
}).change();



nick = "";
pic = "";

fb_ready = function(data) {
	//log("fb_ready: "+o2j(data));
	if(data) {
		log("facebook session in effect")
		nick = data.first_name+" "+data.last_name;
		pic = data.pic;
		//log("pic="+pic);
		//use_nick(data.first_name);
		//ws_connect()
	}
	else {
		nick = "Guest-"+(toInt(Math.random() * 100000));
		pic = "";
	}
	log("fb nick="+nick);
	showNickname(nick);
	ping();
}


showNickname = function(n) {
	$("#nickname").html(n);
}

var who = {};
replicate("tpl_who", []);

beforeUnload = function() {
	return null;
}



ping = function() {

/*
	db.sql("delete from users where name='Guest' or ping < date_sub(now(), interval 30 second)", [], function(r) {
		//log("culled "+o2j(r.affected_rows));
		db.sql("select * from users where ping >= date_sub(now(), interval 15 second) order by name", [], function(r) {
			//log("r="+o2j(r));
			replicate("tpl_who", r.records, function(e, d) {
				$(e).find("img").attr("src", d.pic);
			});
		});
	});

	if(nick) {
		db.sql("update users set ping=now(), pic=? where name=?", [pic, nick], function(r) {
			if(r.affected_rows < 1) {
				db.sql("insert into users (pic, name, ping) values(?, ?, now())", [pic, nick], function(r) {
					log("inserted "+nick);
				});
			}
			else {
				//log("updated "+nick);
			}
		});
	}
*/

	$.get("./version.txt", function(s) {
		cur_ver = localStorage.getItem("current_version");
		if(!cur_ver) {
			log("noting cur_ver "+s);
			localStorage.setItem("current_version", s);
		}
		else {
			if(cur_ver != s) {
				localStorage.setItem("current_version", s);
				// log("version update!");
				document.location.reload();
			}
		}
	});
}


maws_init = function() {

	log = function(s) {
		console.log(s)
	} 

	//MAWS.dbg = function(s) { log("MAWS: "+s) }

	cb_msg = function(m) {
		if(m.msg == "ping") {
			m.reply({msg:"pong"});
			return
		}
	}

	cb_ctrl = function(m, x) {
		log("CTRL: "+m+", ["+o2j(x)+"]")

		if(m === "disconnected") {
			log("reconnecting ...");
			setTimeout(function() {
				socket = MAWS.connect(cb_msg, cb_ctrl)
			}, 5000);
			return
		}

		if(m === "connected") {
			socket.send({msg:"hello"}, function(r) {
				log("I've been welcomed as "+r.name)
				nick = r.name;
				showNickname(nick);
			});
			return
		}
	}

	socket = MAWS.connect(cb_msg, cb_ctrl)
}

collectNickname = function(evt) {
	evt.stopPropagation();	

	$(".dlg").hide();		// hide all dialogs

	/*
	$("#okay").onclick = function() {
		nick = $("#new_nick");
		log("new nick is "+nick);
		showNickname(nick);
		$("#glass").hide();
	};
	*/

	$("#glass").show();
	$("#get_nick_dlg").show();	// show the one I want


	//var nick = LS.get("nick") || "";
	//$("#nick").val(nick);
	//$("#nick_entry").show()
	//$("#nick").focus()
}




$(document).ready(function() {

	setInterval(ping, 15 * 1000);
	ping();

	maws_init();

	var next = "-20px";
	$("#monitor").click(function(evt) {
		evt.stopPropagation();	
		var prev = $(this).css("right");
		$(this).animate({right:next}, 100, function(){
			next = prev;
		});
	});

	$("#toggler").click(function(evt) {
		evt.stopPropagation();	
		$("#monitor").click();
	});

	$("#nickname").click(collectNickname);

	$("#clear_blab").click(function() {
		$("#blab_frame").attr("src", "");
	});

	$("#glass").click(function() {
		$(this).hide();
	});

	$("#cancel").click(function() {
		log("CANCEL");
		$("#glass").hide();
	});

	$(".dlg, .dlg_wrapper").click(function(evt) {
		evt.stopPropagation();	
	});

	setTimeout(function() {
		$("#monitor").click();
	}, 2000);
	
});

