var phantom = require('phantom');

module.exports = {
	openUrlWithJquery: function(url, cb) {
		global.log.debug('Opening url ' + url);

		phantom.create('--load-images=no','--local-to-remote-url-access=no', '--disk-cache=yes',function(ph) {
			ph.createPage(function(page) {
				return page.open(url, function (status) {
					if (status !== 'success') {
						cb('Error opening ' + url + ': ' + status, false);
					} else {
						page.injectJs('./jquery.js', function() {
							cb(null, ph, page);
						});
					}
				});
			});
		});

	},

	time: function() {
		return (new Date()).getTime();
	}
};