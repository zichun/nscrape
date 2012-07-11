function ThreadPool(worker, threads, interval) {
	var self = this;
	if (!threads) threads = 5;

	this.maxthreads = threads;
	this.used = 0;
	this.started = false;


	this.populatePool = function() {
		var work;

		function createCallback(id, method, controller) {
			return function(err, res) {
				self.used--;
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
						global.log.warning('Method ' + work.method + ' not implemented for controller ' + work.controller);
					} else {
						
						var args = JSON.parse(work['arguments']);
						args.push(worker);
						args.push(createCallback(work.id, work.method, work.controller));

						self.used++;
						global.log.info('Starting Worker thread ' + work.controller + ':' + work.method + ' ['+self.used+'/'+threads+']');
						controller[work.method].apply( controller, args );
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

		function nextTick() {
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