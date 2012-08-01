var Phantom = new require('phantom-sync').Phantom;
var Sync =  new require('phantom-sync').Sync;


var proxy = module.exports = {
	getProxy: function(cb) {
		mysql.query('SELECT * FROM proxies WHERE latency>=0 ORDER BY lastverified DESC LIMIT 0,1', function(err, res) {
			if (err) {
				global.error(err);
			} else if (!res || !res.length) {
				cb(new Error('No available proxy'), false);
			} else {
				cb(null, {server: res[0].server, port: res[0].port});
			}
		});
	},

	checkProxies: function checkProxies(mysql) {
		mysql.query('SELECT * FROM proxies WHERE 1 ORDER BY lastverified ASC LIMIT 0,1', function(err, doc) {
			var start = (new Date()).getTime();
			var now = Math.round(start / 1000);
			var phantom = new Phantom({mode: 'mixed'});
			if (err) {
				global.error(err);
			} else {
				if (doc && doc.length) {
					global.log.info('Testing Proxy ' + doc[0].server + ':' + doc[0].port);
					Sync(function() {

						var ph = phantom.create('--load-images=no','--local-to-remote-url-access=no', '--disk-cache=no', '--proxy='+doc[0].server+':'+doc[0].port);
						var page = ph.createPage();
						page.set('settings.userAgent', getUserAgent());

										

						page.open(global.CONSTANTS.proxy.testURL, function (status) {
							var end = (new Date()).getTime();
						
							if (status !== 'success') {
								mysql.query('UPDATE proxies SET lastverified=?, latency=-1', [now], function(err, res) {
									done();
								});
							} else {
								var latency = end - start;						
								mysql.query('UPDATE proxies SET lastverified=?, latency=?', [now, latency], function(err, res) {
									done();
								});
							}

						});

					});
				}
			}
		});

		function done() {
			setTimeout(function() {
				proxy.checkProxies(mysql);
			}, global.CONSTANTS.proxy.testInterval);
		}
	}
};