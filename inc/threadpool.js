function ThreadPool(worker, threads, interval) {
	var self = this;
	if (!threads) threads = 5;

	this.maxthreads = threads;
	this.used = 0;
	this.started = false;
	this.timeout = global.CONSTANTS.threadpool.timeout;

	this.populatePool = function() {
		var work;

		function startWork(controller, work) {
			var args = JSON.parse(work['arguments']);
			args.push(work['proxy']);
			args.push(worker);
			args.push(createCallback(work.id, work.method, work.controller));

			self.used++;
			global.log.info('Starting Worker thread ' + work.controller + ':' + work.method + ' ['+self.used+'/'+threads+']');
			controller[work.method].apply( controller, args );
		}

		function createCallback(id, method, controller) {
			var done = false;
			var timeoutHandle = setTimeout(function() {
				global.log.error('Worker thread ' + controller + ':' + method + ' timed-out!');
				done = true;
				self.used--;
			}, self.timeout);

			return function(err, res) {
				if (done) return;
				done = true;
				self.used--;

				clearTimeout(timeoutHandle);

				if (err) {
					global.log.error('Worker thread ' + controller + ':' + method + ' died with error ' + err.toString());
				} else {
					global.log.info('Worker thread ' + controller + ':' + method + ' completed');
					worker.completeWork(id, function() {

					});
				}
			};
		}
		
		if (self.used < threads) {
			worker.getWork(function(err, work) {
				if (work) {
					var controller = require('../workers/' + work.controller + '.js');
					if (typeof controller[work.method] === 'undefined') {
						global.log.warn('Method ' + work.method + ' not implemented for controller ' + work.controller);
					} else {
						startWork(controller, work);
					}

					if (self.used < threads) {
						self.populatePool();
					} else {
						nextTick();
					}
				} else {
					nextTick();
				}
			});
		} else {
			nextTick();
		}

		var called = false;
		function nextTick() {
			if (called) return; // defensive: ensure that tick is called only once per call to populatePool
			called = true;
			setTimeout(function() {
				self.populatePool();
			}, interval);
		}

	};

	return this;
}

ThreadPool.prototype.start = function() {
	if (!this.started) {
		this.started = true;
		this.populatePool();
	} else {
		throw(new Error('ThreadPool already started'));
	}
};

ThreadPool.prototype.threads = function() {
	return this.used;
};


module.exports = ThreadPool;