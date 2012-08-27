var common = require('../common.js');
var page = 'http://www.reevoo.com/categories';
var util = require('util');
var q = require('q');

var controller = {
	interval: 60 * 60 * 24 * 7 * 1000,
	name: 'reevoo',
	poll: function(worker, cb) {
		var categories = [];
		worker.newWork(controller.name, 'getCategories', page, function(err, res) {
			if (err) {
				cb(err, false);
			} else {
				cb(null, true);
			}
		});
	}
};