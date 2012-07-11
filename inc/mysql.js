var mysql = require('mysql');

module.exports = {
	init: function() {
		var tr = mysql.createConnection({
			host			: global.CONSTANTS.mysql.host,
			user			: global.CONSTANTS.mysql.user,
			password		: global.CONSTANTS.mysql.password,
			database		: global.CONSTANTS.mysql.database
		});
		
		return tr;
	}
};