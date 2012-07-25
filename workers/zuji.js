var _url = require('url');
var q = require('q');
var common = require('../common.js');
var zuji = require('./zuji/zuji.js');

var workers = {
	parseSearch: function(url, worker, cb) {
		common.openUrlWithJquery(url, function(err, ph, page) {
			if (err) {
				cb(err, false); return;
			}

			page.evaluate(function() {
				var hotelInformation = $('.hotel-card-title .to-hotel-information');
				var tp = [];

				for (var i=0;i<hotelInformation.length;++i) {
					tp.push({m: 'parseHotel', url: hotelInformation[i].href });
				}

				var $li = $('.list-pagination li.active').next();
				if ($li.size()) {
					tp.push({m: 'parseSearch', url: $li.find('a').attr('href') });
				}

				return tp;
			}, function(res) {
				ph.exit();
				if (!res) {
					cb(new Error('Phantomjs Error'), false);
					return;
				}
				for (var i=0;i<res.length;++i) {
					worker.newWork('zuji', res[i].m, [_url.resolve(url, res[i].url)] );
				}

				cb(null, true);
			});
		});
	},

	parseHotel: function(url, worker, cb) {
		common.openUrlWithJquery(url, function(err, ph, page) {
			if (err) {
				cb(err, false); return;
			}

			eval();

			function eval() {
				page.evaluate(function() {
					var name = $('.titleCard').text();
					var country = $('.destination').text();
					var thumbnail = $('.photo-tab img').attr('src');
					var star = $('.rating a').attr('title') ? parseInt($('.rating a').attr('title').split(' ')[0], 10) : 0;
					var rating = null;
					if ($('.rate.os45 img').size()) {
						rating = parseFloat($('.rate.os45 img').attr('alt').split(' ')[0]);
					} else {
						rating = 0;
					}
					var address = $('.address').size() ? $('.address').text() : null;
					var contact = $('.phoneNumber').size() ? $(".phoneNumber").text() : null;
					var rate = $('.product-price.product-price-h201').text();
					var desc = $('.hotel-description .taxes').attr('href');

					var $review = $('.hotel-review');
					var reviews = [];
					for (var i=0;i<$review.size();++i) {
						var $r = $review.eq(i);
						var title = $r.find('h4').text();
						var review = $r.find('.review-description').text();
						var date = $r.find('.date').text();
						var location = $r.find('.location').text();
						var rrating = $r.find('.rate img').attr('alt') ? parseFloat($r.find('.rate img').attr('alt').split('/')[0]) : 0;

						reviews.push({
							title: title,
							review: review,
							date: date,
							location: location,
							rating: rrating
						});
					}
					return {
						hotel: {
							name: name,
							country: country,
							thumbnail: thumbnail,
							star: star,
							rating: rating,
							address: address,
							contact: contact,
							rate: rate,
							desc: desc
						},
						reviews: reviews,
						tmp: $('.review-description').size()
					};
				}, function(res) {
					ph.exit();
					if (!res || !res.hotel || !res.hotel.name) {
						cb('Pull error', false);
					}
					if (res.hotel.thumbnail) {
						res.hotel.thumbnail = _url.resolve(url, res.hotel.thumbnail);
					}
					res.hotel.url = url;
					zuji.insertHotel(res.hotel, worker.mysql, function(err, hotel_id) {
						if (err) {
							cb(err, false);
						} else {
							if (res.hotel.desc) {
								var descurl = _url.resolve(url, res.hotel.desc);
								worker.newWork('zuji', 'getHotelDescription', [hotel_id, descurl] );
							}


							var promises = [];
							for (var i=0;i<res.reviews.length;++i) {
								promises.push(
									q.ncall(zuji.insertReview, zuji, hotel_id, res.reviews[i], worker.mysql));
							}

							q
							.allResolved(promises)
							.then(function(promises) {
								var err = [];
								var done = [];
								promises.forEach(function(promise) {
									if (promise.isFulfilled()) {
										done.push(promise.valueOf());
									} else {
										err.push(promise.valueOf().exception);
									}
								});

								cb(err.length ? err : null, done);
							});

						}
					});

				});
			}
		});
	},

	getHotelDescription: function(hotel_id, url, worker, cb) {
		common.openUrlWithJquery(url, function(err, ph, page) {
			if (err) {
				cb(err, false); return;
			}
			global.log.debug('getHotelDescription getUrl done');
			page.evaluate(function() {
				return $(".supporting-info").html();
			}, function(res) {
				ph.exit();
				global.log.debug('getHotelDescription evaluate done');
				zuji.setDescription(hotel_id, res, worker.mysql, function(err, res) {
					global.log.debug('getHotelDescription sql done');
					if (err) cb(err, false);
					else cb(null, true);
				});
			});
		});
	}
};

module.exports = workers;