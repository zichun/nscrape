module.exports = {
	APP_VERSION: '0.0.1',
	APP_HOST: '127.0.0.1',
	APP_LOG_FOLDER: './log',

	mysql: {
		host: '127.0.0.1',
		user: 'nscrape',
		password: 'nscrape',
		database: 'nscrape'
	},

	threadpool: {
		maxThreads: 5,
		interval: 1000,
		timeout: 120000 // 2 min
	}
};