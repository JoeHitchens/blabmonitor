
DB = function(user, pass) {
	this.sql = function(sql, args, cb) {
		cb = cb || function(){};
		var json = o2j({
			user: user,
			pass: pass,
			sql: sql,
			args: args,
		});
		$.ajax({
			type: "POST",
			url: "./db.php",
			async: true,
			data: {data:json},
			dataType: "json",
			success: function(resp) {
				cb(resp);
			},
			error: function(xhr, err) {
				cb({error:err}); 
			},
		});
	}
}


