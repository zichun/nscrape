var common = require('../../common.js');
var q = require('q');

var reevoo = module.exports = {
	insertProduct: function(obj, mysql, cb) {
		var time = common.time();
		if (Number.isNaN(obj.rating) || !obj.rating) {
			obj.rating = null;
		}

		reevoo.getProductByUrl(obj.url, mysql, function(err, res) {
			if (err) {
				cb(err, false);
			} else if (!res || !res.length) {
				insert();
			} else {
				update(res.id);
			}
		});

		function insert() {
			mysql.query('INSERT INTO `reevoo_products`(name, url, img, rating, category, description, first_mined, last_mined) VALUES(?,?,?,?,?,?,?,?)',
						[obj.name, obj.url, obj.img, obj.rating, obj.category, obj.description, time, time],
						function(err, res) {
							if (err) {
								global.error(err);
								cb(err, false);
							} else {
								cb(err, res.insertId, true);
							}
						});
		}

		function update(product_id) {
			mysql.query('UPDATE `reevoo_products` SET `name`=?, `url`=?, `img`=?, `rating`=?, `category`=?, `description`=?, `last_mined`=? WHERE `id`=?',
						[obj.name, obj.url, obj.img, obj.rating, obj.category, obj.description, time, product_id],
						function(err, res) {
							if (err) {
								global.error(err);
								cb(err, false);
							} else {
								cb(err, product_id, false);
							}
						});
		}
	},

	getProductByUrl: function(url, mysql, cb) {
		mysql.query('SELECT * FROM `reevoo_products` WHERE url=?', [url], cb);
	},

	insertReviews: function(product_id, url, reviews, mysql, cb) {
		var time = common.time();
		var nxt = [];
		for (var i=0;i<reviews.length;++i) {
			nxt.push(q.ncall(
						mysql.query,
						mysql,
						'INSERT into `reevoo_reviews`(product_id, reviewer, pro, con, rating, url, date, mined_on) VALUES(?,?,?,?,?,?,?,?)',
						[
							product_id,
							reviews[i].reviewer,
							reviews[i].pro,
							reviews[i].con,
							reviews[i].rating,
							url,
							reviews[i].date,
							time
						]));

		}
		q
		.allResolved(nxt)
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
};