var common = require('../common.js');

function Worker(mysql) {
	var self = this;

	self.mysql = mysql;

	return self;
}

Worker.prototype.newWork = function(controller, method, arg, cb) {
	this.mysql.query(
		'INSERT INTO works(`controller`, `method`, `arguments`, `created`, `completed`) VALUES(?,?,?,?,?)',
		[controller, method, JSON.stringify(arg), common.time(), 0],
		function(err, res) {
			if (err) {
				global.error('mysql', err);
			}
			if (cb) {
				cb(err, res);
			}
		});
};

// get a current outstanding work
//	immediately marks work as being worked on. atomic operation
Worker.prototype.getWork = function(cb) {
	var mysql = this.mysql;

	mysql.query('CALL `GetWork()`;', function(err, res) {
		if (err) {
			global.error('mysql',err);
			cb(err, null);
		} else {
			if (res && res.length && res[0] && res[0].length) {
				cb(err, res[0][0]);
			} else {
				cb(err, false);
			}
		}
	});
	/*
	mysql.query('SELECT * FROM works WHERE completed=0 ORDER BY created ASC LIMIT 0,1', function(err, res) {
		if (err) {
			global.error('mysql', err);
			cb(err, null);
		} else {
			if (res.length) {
				mysql.query('UPDATE works SET completed=1 WHERE id=?', [res[0].id], function (err, doc) {
					if (err) {
						global.error('mysql', err);
					}

					cb(err, res[0]);
				});
			} else {
				cb(err, false);
			}
		}
	});*/
};

Worker.prototype.completeWork = function(id, cb) {
	this.mysql.query('UPDATE works SET completed=? WHERE id=?', [common.time(), id], function(err, doc) {
		if (err) {
			global.error('mysql', err);
		}
		cb(err, doc);
	});
};

module.exports = {
	Worker: Worker
};