var _url = require('url');
var q = require('q');
var common = require('../common.js');

var workers = {
	getCategories: function(url, proxies, worker, cb) {
		common.openUrlWithJquery(url, proxies, function(err, body, $) {
			if (err) {
				cb(err, false);
				return;
			}
			function process() {
				var lnks = [];
				$('ol a').each(function() {
					lnks.push($(this).attr('href'));
				});
				return lnks;
			}
			function parseRes(res) {
				if (!res || !res.length) {
					cb('problem with extracting categories', false);
				}
				for (var i=0;i<res.length;++i) {
					worker.newWork('reevoo', 'parseCategory', [_url.resolve(url, res[i])] );
				}

				cb(null, true);
			}

			parseRes(process());
		});
	},

	parseCategory: function(url, proxies, worker, cb) {
		common.openUrlWithJquery(url, proxies, function(err, body, $) {
			function process() {
				// Get Product Links
				var res = [];

				var $products = $('.product-module a.name');
				$products.each(function() {
					var $this = $(this);
					res.push({
						url: $this.attr('href'),
						type: 'parseProduct'
					});
				});

				// Get Next page
				var $next = $('.next_page');
				if ($next.size() && $next.is('.disabled') === false) {
					res.push({
						url: $next.attr('href'),
						type: 'parseCategory'
					});
				}

				return res;
			}

			function parseRes(res) {
				if (!res) {
					cb('Error parsing cateogry', false);
					return;
				}

				for (var i=0;i<res.length;++i) {
					worker.newWork('reevoo', res[i].type, [_url.resolve(url, res[i].url)]);
				}
				cb(null, true);

			}

			parseRes(process());
		});
	}
};