notify = function(sender, msg) {
	if("Notification" in window) {
		var do_notice = function() {
			var n = new Notification(sender, {body: msg, icon:"../images/ssicon-2.png"});
			n.addEventListener("click", function() {
			});
		};
		if(Notification.permission === "granted") {
			do_notice();
		}
		else {
			if(Notification.permission !== "denied") {
				Notification.requestPermission(function(permission) {
					if(Notification.permission === "granted") {
						do_notice();
					}
				});
			}
		}
	}
};
