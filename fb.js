
// Called with the results from from FB.getLoginStatus().
function fb_statusChangeCallback(response) {

    // response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation for FB.getLoginStatus().
	
	//console.log(o2j(response));

	var fun = window["fb_ready"] || function(){}

    if(response.status !== "connected") {
		fun(null)
		return;
	}

	FB.api('/me', function(response) {
		FB.api("/me/picture?width=180&height=180",  function(r) {
			response.pic = r.data.url
			fun(response)
		})
	});

}


// Called when someone finishes with the Login button.
// See the onlogin handler attached to it in the sample code below.
function checkLoginState() {
    FB.getLoginStatus(function(response) {
		fb_statusChangeCallback(response);
    });
}


window.fbAsyncInit = function() {
	FB.init({
		appId: '1588719808071936',
		cookie: true,  // enable cookies to allow the server to access the session
		xfbml: true,  // parse social plugins on this page
		version: 'v2.2' // use version 2.2
	});
	FB.getLoginStatus(function(response) {
		fb_statusChangeCallback(response);
	});
};


// load the fb SDK asynchronously
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


