var common = require('../../common.js');

module.exports = {
	getRestaurantByUrl: function(url, mysql, cb) {
		mysql.query('SELECT * FROM hgw_restaurants WHERE url=?', [url], function(err, res) {
			if (err) {
				global.error('mysql', err);
			}
			cb(err, res);
		});
	},


	insertRestaurant: function(obj, mysql, cb) {
		var time = common.time();
		if (!obj['recommended']) obj['recommended'] = null;
		if (!obj['recommended_votes']) obj['recommended_votes'] = null;

		mysql.query('INSERT INTO hgw_restaurants(url, thumbnail, name, address, website, email, tel, type_of_place, type_of_cuisine, recommended_for, opening_hours, price_pax, price_range, recommended, recommended_votes, first_mined, last_mined) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
						[
							obj['url'],
							obj['thumbnail'],
							obj['name'],
							obj['address'],
							obj['website'],
							obj['email'],
							obj['tel'],
							JSON.stringify( obj['type_of_place'] ),
							JSON.stringify( obj['type_of_cuisine'] ),
							JSON.stringify( obj['recommended_for'] ),
							obj['opening_hours'],
							obj['price_pax'],
							obj['price_range'],
							obj['recommended'],
							obj['recommended_votes'],
							time,
							time
						],
						function(err, doc) {
							if (err) {
								global.error('mysql', err);
							}
							cb(err, doc);
						});
	},

	insertReview: function(restaurant_id, obj, mysql, cb) {
		var time = common.time();
		mysql.query('SELECT * FROM hgw_restaurant_reviews WHERE hgw_restaurant_id=? AND poster=? and review_date=? and review=?',
			[
				restaurant_id,
				obj['poster'],
				obj['review_date'],
				obj['review']
			],
			function(err, doc) {
				if (err) {
					global.error('mysql', err);
					cb(err, false);
				} else if (!doc || !doc.length) {
					// does not exists, insert
					ins();
				} else {
					//global.log.debug('Review on '+obj['review_date']+' by '+obj['poster']+' for restaurant_id '+restaurant_id+' already exists');
					cb(null, false);
				}
			});

		function ins() {
			if (!obj['rating_overall']) obj['rating_overall'] = null;
			if (!obj['rating_food']) obj['rating_food'] = null;
			if (!obj['rating_ambience']) obj['rating_ambience'] = null;
			if (!obj['rating_value']) obj['rating_value'] = null;
			if (!obj['rating_service']) obj['rating_service'] = null;
			mysql.query('INSERT INTO hgw_restaurant_reviews(hgw_restaurant_id, recommend, price_pax, rating_overall, rating_food, rating_ambience, rating_value, rating_service, poster, title, review_date, review, must_tries, mined_on) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
						[
							restaurant_id,
							obj['recommend'],
							obj['price_pax'],
							obj['rating_overall'],
							obj['rating_food'],
							obj['rating_ambience'],
							obj['rating_value'],
							obj['rating_service'],
							obj['poster'],
							obj['title'],
							obj['review_date'],
							obj['review'],
							obj['must_tries'],
							time
						],
						function(err, doc) {
							if (err) {
								global.error('mysql', err);
							}
							cb(err, doc);
						});
		}
	},


	updateRestaurantByURL: function(obj, mysql, cb) {
		var time = common.time();
		if (!obj['recommended']) obj['recommended'] = null;
		if (!obj['recommended_votes']) obj['recommended_votes'] = null;
		mysql.query('UPDATE hgw_restaurants SET thumbnail=?, name=?, address=?, website=?, email=?, tel=?, type_of_place=?, type_of_cuisine=?, recommended_for=?, opening_hours=?, price_pax=?, price_range=?, recommended=?, recommended_votes=?, last_mined=? WHERE url=?',
						[
							obj['thumbnail'],
							obj['name'],
							obj['address'],
							obj['website'],
							obj['email'],
							obj['tel'],
							JSON.stringify( obj['type_of_place'] ),
							JSON.stringify( obj['type_of_cuisine'] ),
							JSON.stringify( obj['recommended_for'] ),
							obj['opening_hours'],
							obj['price_pax'],
							obj['price_range'],
							obj['recommended'],
							obj['recommended_votes'],
							time,
							obj['url']
						],
						function(err, doc) {
							if (err) {
								global.error('mysql', err);
							}
							cb(err, doc);
						});

	},


	updateRating: function(restaurant_id, rating_overall, rating_food, rating_ambience, rating_value, rating_service, mysql, cb) {
		var time = common.time();
		if (!rating_overall || rating_overall === 'N/A' || rating_overall === '?') rating_overall = null;
		if (!rating_food || rating_food === 'N/A') rating_food = null;
		if (!rating_ambience || rating_ambience === 'N/A') rating_ambience = null;
		if (!rating_value || rating_value === 'N/A') rating_value = null;
		if (!rating_service || rating_service === 'N/A') rating_service = null;

		mysql.query('UPDATE hgw_restaurants SET rating_overall=?, rating_food=?, rating_ambience=?, rating_value=?, rating_service=? WHERE id=?',
			[rating_overall, rating_food, rating_ambience, rating_value, rating_service, restaurant_id],
			function(err, doc) {
				if (err) {
					console.log(rating_overall);
					global.error('mysql', err);
				}
				cb(err, doc);
			});
	}
};

