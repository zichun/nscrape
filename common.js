var Phantom = new require('phantom-sync').Phantom;
var Sync =  new require('phantom-sync').Sync;

module.exports = {
	openUrlWithJquery: function(url, cb) {

		var phantom = new Phantom({mode: 'mixed'});

		try {
			Sync(function() {
				var ph = phantom.create('--load-images=no','--local-to-remote-url-access=no', '--disk-cache=yes');
				var page = ph.createPage();
				
				global.log.debug('Opening url ' + url);
				page.open(url, function (status) {
					global.log.debug('Retrieved url ' + url);
					if (status !== 'success') {
						cb(new Error('Error opening ' + url + ': ' + status), false);
					} else {
						page.injectJs('./inc/jquery.js', function() {
							cb(null, ph, page, Sync);
						});
					}
				});
			});

		} catch (e) {
			cb(e, null);
		}

	},

	time: function() {
		return (new Date()).getTime();
	},

	htmlString: function(str) {
		return str.replace(/\s+/g, ' ');
	}
};