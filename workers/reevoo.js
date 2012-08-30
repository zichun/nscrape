var _url = require('url');
var q = require('q');
var common = require('../common.js');
var reevoo = require('./reevoo/reevoo.js');

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
			if (err) {
				cb(err, false);
				return;
			}
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
				if ($next.size() && $next.hasClass('disabled') === false) {
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
	},

	parseProduct: function(url, proxies, worker, cb) {
		common.openUrlWithJquery(url, proxies, function(err, body, $) {
			if (err) {
				cb(err, false);
				return;
			}
			function process() {
				var name = $("#breadcrumbs li.last").text();
				var rating = parseFloat($("#question-8").find('td').text().trim());
				var img = $('.main-image').find('img').attr('src');
				var description = $("#product-features-tab-content").text().trim();
				var category = $("#breadcrumbs").find('li').eq(2).text().trim();
				return {
					name: name,
					url: url,
					img: img,
					rating: rating,
					description: description,
					category: category,

					review: $('.button.large.grey.ajax-pagination').attr('href')
				};
			}

			function parseRes(res) {
				reevoo.insertProduct(res, worker.mysql, function(err, ret) {
					if (err) {
						cb(err, false);
					} else {
						if (res.review) {
							worker.newWork('reevoo', 'parseReview', [_url.resolve(url, res.review), ret]);
						}
						cb(null, true);
					}
				});
			}

			parseRes(process());
		});
	},


	parseReview: function(url, product_id, proxies, worker, cb) {
		common.openUrlWithJquery(url, proxies, function(err, body, $) {
			if (err) {
				cb(err, false);
				return;
			}

			function process() {
				var $reviews = $("#reviews .review");
				var reviews = [];
				$reviews.each(function() {
					var $this = $(this);
					var reviewer = $this.find('.left-column .title').text().trim();
					var rating = $this.find('.left-column .score-border .value').text().trim();
					var pro = $this.find('.centre-column dd.pros').text().trim();
					var con = $this.find('.centre-column dd.cons').text().trim();
					var date = $this.find('.purchase_date .date').text().trim();

					reviews.push( {
						reviewer: reviewer,
						rating: rating,
						pro: pro,
						con: con,
						date: date
					});
				});

				var $nextPage = $('.next_page'), nextPage = false;
				if ($nextPage.size() && !$nextPage.hasClass('disabled')) {
					nextPage = $nextPage.attr('href');
				}

				return {
					reviews: reviews,
					nextPage: nextPage
				};
			}

			function parseRes(res) {
				reevoo.insertReviews(product_id, url, res, worker.mysql, function(err, ret) {
					if (err) {
						cb(err, false);
					} else {
						cb(null, true);
					}
				});
			}

			var parse = process();
			parseRes(parse.reviews);

			if (parse.nextPage) {
				worker.newWork('reevoo', 'parseReview', [_url.resolve(url, parse.nextPage), product_id]);
			}
		});
	}
};

module.exports = workers;