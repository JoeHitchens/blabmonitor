
require("sleepless");

process.on("SIGHUP", function() {
	console.log("SIGHUP");
	process.exit(0);
});


maws = require("maws"); maws.dbg = function(s) { console.log("MAWS: "+s) }

seq = 0

connect = function(req, cb_accept) {

	var cb_msg = function(m) {
		var fun = global["msg_"+m.msg];
		if(typeof fun === "function") {
			fun(client, m);
		}
		else {
			m.reply({ error:"Unrecognized message: "+m.msg })
		}
	}

	var cb_ctrl = function(s, xtra) {
		console.log("[CTRL] "+name+": "+s + (xtra ? (", ["+JSON.stringify(xtra)+"]") : ""));
	}

	var name = "client-"+(seq += 1)
	var socket = cb_accept(cb_msg, cb_ctrl)
	var client = { name:name, socket:socket };

}

maws.listen(9900, connect, "docroot")


// 	-	-	-	-	-	-	-	-	

var DS = require("ds").DS
ds = new DS()
if(ds.data === undefined) {
	ds.data = {};
}


msg_hello = function(client, m) {
	m.reply({msg:"welcome", name:client.name})
}

msg_authenticate = function(client, m) {

	var username = ""+m.username;
	var password = ""+m.password;

	var user = ds.data[username];
	if(!user) {
		// first time seeing this username.  Store it with provided password
		user = {
			username: username,
			password: password,
			created: time(),
		};
		ds.data[username] = user;
		ds.save();
		console.log("Created new user: "+username);
	}

	m.reply({})

	//client.socket.send({msg:"ping"}, function(r) {
	//	console.log(JSON.stringify(r));
	//})
}


