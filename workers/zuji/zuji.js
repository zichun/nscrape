var common = require('../../common.js');

function htmlString(str){
	if(typeof str !== 'string' || !str.replace) {
		return str;
	} else {
		return common.htmlString(str).trim();
	}
}

module.exports = {
	setDescription: function(hotel_id, desc, mysql, cb) {
		mysql.query('UPDATE zuji_hotels SET description=? WHERE id=?', [desc.trim(), hotel_id], function(err, res) {
			if (err) {
				global.log.error(err);
			}
			cb(err, res);
		});
	},

	insertHotel: function(obj, mysql, cb) {

		mysql.query('SELECT * FROM zuji_hotels where name=? and country=?', [htmlString(obj.name), htmlString(obj.country)], function(err, res) {
			if (err) {
				global.log.error(err);
				cb(err, res);
			} else {
				if (res && res.length) {
					update(res[0].id);
				} else {
					ins();
				}
			}
		});
		var stuff = [
					htmlString(obj.name),
					htmlString(obj.country),
					obj.url,
					obj.thumbnail,
					obj.star,
					obj.rating,
					htmlString(obj.address),
					htmlString(obj.contact),
					htmlString(obj.rate)
				];
		function ins() {
			mysql.query('INSERT INTO zuji_hotels(`name`,`country`,`url`,`thumbnail`,`star`,`rating`, `address`,`contact`,`rate`) VALUES(?,?,?,?,?,?,?,?,?)',
				stuff,
				function(err, res) {
					if (err) {
						global.log.error(err);
						cb(err, res);
					} else{
						cb(err, res.insertId);
					}
				});
		}
		function update(hotel_id) {
			stuff.push(hotel_id);
			mysql.query('UPDATE zuji_hotels SET `name`=?, `country`=?, `url`=?, `thumbnail`=?, `star`=?, `rating`=?, `address`=?, `contact`=?, `rate`=? WHERE id=?',
				stuff,
				function(err, res) {
					if (err) {
						global.log.error(err);
						cb(err, res);
					} else{
						cb(err, hotel_id);
					}
				});
		}
	},

	insertReview: function(hotel_id, reviews, mysql, cb) {
		mysql.query('INSERT INTO zuji_hotel_reviews(zuji_hotel_id, date, title, review, location, rating) VALUES(?,?,?,?,?,?)',
			[
				hotel_id,
				htmlString(reviews.date),
				htmlString(reviews.title),
				htmlString(reviews.review),
				htmlString(reviews.location),
				reviews.rating
			],
			function(err, res) {
				if (err) {
					global.error(err);
					cb(err, res);
				} else {
					cb(err, res.insertId);
				}
			});
	}
};