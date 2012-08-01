var _url = require('url');
var q = require('q');
var compress = require('../inc/compress.js');
var common = require('../common.js');
var hgw_helper = require('./hungrygowhere/helper.js');

var workers = {

	// Given a search result page
	//	1. retrieves all restaurants listed
	//	2. check if there is a next page for search listing
	parseSearch: function(url, proxies, worker, cb) {
		common.openUrlWithJquery(url, function(err, ph, page) {
			if (err) {
				cb(err, false); return;
			}
			page.evaluate(
				function() {
					// get the search result listing (list of restaurants' links)
					var $links = $('.item-content .gae_link');
					var l = $links.size(), tr = [];
					for (var i=0;i<l;++i) {
						tr.push( ['parseRestaurant', $links.eq(i).attr('href').trim()] );
					}

					// check for next page button
					var $nextpage = $('img[src="/images/btn_next.gif"]');
					if ($nextpage.size()) {
						tr.push( ['parseSearch', $nextpage.parent().attr('href')] );
					}

					return tr;
				},
				function(res) {
					ph.exit();
					if (!res) {
						cb(new Error('Phantomjs Error'), false);
						return;
					}
					for (var i=0;i<res.length;++i) {
						worker.newWork('hungrygowhere', res[i][0], [_url.resolve(url, res[i][1])] );
					}

					cb(null, true);
					
				}
			);
		});
	},


	// Given a restaurant page
	//	1. gets all metadata
	//  2. (todo) gets picture
	//	3. gets review page and insert work (restaurant rating is only mined at reviews page)
	//
	//  a. if restaurant exists in database, then update
	//  b. otherwise, insert a new row
	parseRestaurant: function(url, proxies, worker, cb) {
		common.openUrlWithJquery(url, function(err, ph, page) {
			if (err) {
				cb(err, false); return;
			}
			page.evaluate(
				function() {
					var i, j;
					var name = $('.fn.org').text();
					var address = $("#restaurant-address").text();
					var tel = $('.web-email span').eq(1).text();
					var thumbnail = $("#cp-placeholder img").attr('src');
					var email=null, website=null, $web_email = $('.web-email a');
					if ($web_email.size()) {
						for (i=0;i<$web_email.size();++i) {
							if ($web_email.eq(i).text() === 'Email') {
								email = $web_email.eq(i).attr('href').replace(/mailto:\s/i, '');
							} else {
								website = $web_email.eq(i).attr('href');
							}
						}
					}

				var type_of_place, type_of_cuisine, recommended_for;

					var $tagsul = $("#restaurant-tags>ul>li");
					for (i=0;i<$tagsul.size();++i) {
						var $li = $tagsul.eq(i);
						var cls = $li.find('ul li:first').text().trim();
						var tags = [];

						var $tags = $li.find('ul li.tags');
						for (j=0;j<$tags.size();++j) {
							if ($tags.eq(i).hasClass('seeMoreTgas')  || $tags.eq(i).hasClass('seeLessTags')) continue;
							tags.push($tags.eq(i).text().trim());
						}


						switch(cls) {
							case 'Type of Place':
								type_of_place = tags;
								break;
							case 'Type of Cuisine':
								type_of_cuisine = tags;
								break;
							case 'This place is recommended for':
								recommended_for = tags;
								break;
						}
					}

					var opening_hours = $('.opening-hours').next().text();
					var price_pax = $('#restaurant-price dd:first').text().trim();
					var price_range = $('#restaurant-price dd').eq(1).text().trim();
					var recommended = $('#recommend-percent .average').text();
					var recommended_votes = $('#recommend-volume .votes').text();


					var review_url = $("#main-restaurant-tabs li").eq(1).find('a').attr('href');

					return {
						name: name,
						thumbnail: thumbnail,
						address:address,
						tel: tel,
						email: email,
						website: website,
						type_of_place: type_of_place,
						type_of_cuisine: type_of_cuisine,
						recommended_for: recommended_for,
						opening_hours: opening_hours,
						price_pax: price_pax,
						price_range: price_range,
						recommended: recommended,
						recommended_votes: recommended_votes,
						review_url: review_url
					};
				},
				function(res) {
					ph.exit();
					if (!res) {
						cb(new Error('Phantomjs Error'), false);
						return;
					}
					if (!res['name']) {
						// probably a broken page
						cb(null, false);
						return;
					}
					hgw_helper.getRestaurantByUrl(url, worker.mysql, function(err, doc) {
						if (err) {
							cb(err, doc);
							return;
						}

						res['url'] = url;
						if (doc && doc.length) {
							// update
							hgw_helper.updateRestaurantByURL(res, worker.mysql, function(err, doc) {
								cb(err, false);
							});
						} else {
							// insert
							hgw_helper.insertRestaurant(res, worker.mysql, function(err, doc) {
								cb(err, true);
							});
						}
					});


					// review url
					var review_url = _url.resolve(url, res['review_url']);
					worker.newWork('hungrygowhere', 'parseReviews', [url, review_url, true]);
				}
			);
		});
	},


	parseReviews: function(restaurant_url, review_url, firstpage, proxies, worker, cb) {
		common.openUrlWithJquery(review_url, function(err, ph, page, Sync) {
			if (err) {
				cb(err, false); return;
			}
			Sync(function() {
				var res = page.evaluate(
					function() {
						var $reviews = $('.review-item');
						var tr = [];

						for (var i=0;i<$reviews.size();++i) {
							$review = $reviews.eq(i);
							
							var poster = $review.find('.reviewer-display-name').text().trim();
							var recommend = $review.find('.would-you-return-0,.would-you-return-1,.would-you-return-2').text().trim();
							var price_pax = $review.find('.avg-spending').text().trim();

							var $rating = $review.find('.review-ratings span');
							var rating_food = $rating.eq(0).text().split(': ')[1].trim();
							var rating_ambience = $rating.eq(0).text().split(': ')[1].trim();
							var rating_value = $rating.eq(0).text().split(': ')[1].trim();
							var rating_service = $rating.eq(0).text().split(': ')[1].trim();
							var rating_overall = $review.find('.overall-score.value').text();

							if (rating_food === 'na' || !rating_food) rating_food = null;
							if (rating_ambience === 'na' || !rating_ambience) rating_ambience = null;
							if (rating_value === 'na' || !rating_value) rating_value = null;
							if (rating_service === 'na' || !rating_service) rating_service = null;
							if (rating_overall === 'na' || !rating_overall) rating_overall = null;

							var must_tries = $review.find('.review-must-tries').text();
							var title = $review.find('.review-head').text().trim();
							var review_date = $review.find('.review-date .value-title').attr('title');
							var review = $review.find('.review-text:first').text().trim();

							tr.push( {
								poster: poster,
								recommend: recommend,
								price_pax: price_pax,
								rating_overall: rating_overall,
								rating_food: rating_food,
								rating_ambience: rating_ambience,
								rating_value: rating_value,
								rating_service: rating_service,
								title: title,
								review_date: review_date,
								review: review,
								must_tries: must_tries
							});
						}

						var $score = $('#scores');
						var orating_overall = $score.find('.body12').eq(1).text();
						var orating_food = $score.find('.body12').eq(3).text();
						var orating_ambience = $score.find('.body12').eq(5).text();
						var orating_value = $score.find('.body12').eq(7).text();
						var orating_service = $score.find('.body12').eq(9).text();
						

						var $nextpage = $('img[src="/img/graphics/ui/page_no_next.gif"]');
						var nextpage = false;
						if ($nextpage.size()) {
							nextpage = $nextpage.parent().attr('href');
						}

						var toreturn = {
							reviews: tr,
							rating_overall: orating_overall,
							rating_food: orating_food,
							rating_ambience: orating_ambience,
							rating_value: orating_value,
							rating_service: orating_service,
							nextpage: nextpage
						};
						return toreturn;
					}
				);
				ph.exit();
				parseRes(res);
			});

			function parseRes(res) {
				if (!res) {
					cb(new Error('Phantomjs Error'), false);
					return;
				}

				// get restaurant_id from the given url
				hgw_helper.getRestaurantByUrl(restaurant_url, worker.mysql, function(err, doc) {
					if (err) {
						cb(err, false);
						return;
					} else if(!doc || !doc.length) {
						if (err) {
							global.log.error('No such restaurant exists for url ' + restaurant_url);
						}
						cb('No such restaurant exists ' + restaurant_url, false);
						return;
					}

					var rid = doc[0].id;
					var promises = [];
					for (var i=0;i<res.reviews.length;++i) {
						promises.push(
							q.ncall(hgw_helper.insertReview, hgw_helper, rid, res.reviews[i], worker.mysql));
					}

					if (firstpage) {
						// update ratings
						promises.push(
							q.ncall(hgw_helper.updateRating, hgw_helper, rid, res['rating_overall'], res['rating_food'], res['rating_ambience'], res['rating_value'], res['rating_service'], worker.mysql));
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

				});

				if (res['nextpage']) {
					// insert next page
					worker.newWork('hungrygowhere', 'parseReviews', [restaurant_url, _url.resolve(review_url, res['nextpage']), false]);
				}
			}
		});
	}
};


module.exports = workers;

