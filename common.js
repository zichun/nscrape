var Phantom = new require('phantom-sync').Phantom;
var Sync =  new require('phantom-sync').Sync;
var proxy = require('./inc/proxy.js');
var cheerio = require('cheerio');
var request = require('request');

module.exports = {
	openUrlWithJquery: function(url, proxies, cb) {
		global.log.debug('Opening url ' + url);
		request( { uri: url }, function(err, res, body) {
			if (err || res.statusCode !== 200) {
				global.log.error('Error opening url ' + url);
				cb(err, null);
				return;
			}

			global.log.debug('Retrieved url ' + url + ' ['+body.length+' bytes]');

			var $ = cheerio.load(body);
			if (!$) {
				console.log(res);
				console.log(body);
			}
			cb(null, body, $);
		});
	},
	openUrlWithJqueryOld: function(url, proxies, cb) {

		var phantom = new Phantom({mode: 'mixed'});

		try {
			Sync(function() {
				var ph;
				if (!proxies) {
					ph = phantom.create('--load-images=no','--local-to-remote-url-access=no', '--disk-cache=yes'); // try with no proxy first
					processPh(ph);
				} else {
					proxy.getProxy(function(err, res) {
						if (!err) {
							ph = phantom.create('--load-images=no','--local-to-remote-url-access=no', '--disk-cache=yes', '--proxy='+res.server + ':' + res.port); // try with no proxy first
							processPh(ph);
						} else {
							cb(err, false);
						}

					});
				}

				function processPh(ph) {
					var page = ph.createPage();
					page.set('settings.userAgent', getUserAgent());

					global.log.debug('Opening url ' + url);
					page.open(url, function (status) {
						global.log.debug('Retrieved url ' + url);
						if (status !== 'success') {
							cb(new Error('Error opening ' + url + ': ' + status), false);
						} else {
							page.injectJs('./inc/jquery.js', function() {
								page.injectJs('./inc/compress.js', function() {
									cb(null, ph, page, Sync);
								});
							});
						}
					});
				}
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

var getUserAgent = (function() {
	var cur = 0;
	return function() {
		++cur;
		if (cur >= userAgents.length) cur = 0;
		return userAgents[cur];
	};
})();


var userAgents = [
'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
'Mozilla/5.0 (compatible; MSIE 10.0; Macintosh; Intel Mac OS X 10_7_3; Trident/6.0)',
'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 7.1; Trident/5.0)',
'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Win64; x64; Trident/5.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 2.0.50727; Media Center PC 6.0)',
'Mozilla/5.0 ( ; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)',
'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1092.0 Safari/536.6',
'Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6',
'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/19.77.34.5 Safari/537.1',
'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.9 Safari/536.5',
'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.22 (KHTML, like Gecko) Chrome/19.0.1047.0 Safari/535.22',
'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10',
'Mozilla/5.0 (Windows NT 6.1; rv:15.0) Gecko/20120716 Firefox/15.0a2',
'Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20120403211507 Firefox/14.0.1',
'Mozilla/5.0 (Windows NT 6.1; de;rv:12.0) Gecko/20120403211507 Firefox/12.0',
'Mozilla/5.0 (compatible; Windows; U; Windows NT 6.2; WOW64; en-US; rv:12.0) Gecko/20120403211507 Firefox/12.0'];