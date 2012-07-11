global.CONSTANTS = require('./inc/constants.js');

var fs = require('fs');

var common = require('./common.js');
var Logger = require('./inc/logger.js');
var mysql = require('./inc/mysql.js').init();
var Worker = require('./inc/worker.js').Worker;
var ThreadPool = require('./inc/threadpool.js');


//
// Set up worker manager
//
var worker = new Worker(mysql);

//
// Set Up Logging
//
global.log = new Logger();
global.error = function(type, err) {
  if (err && err.stack) {
    global.log.debug(err.stack);
  }
  if (err) {
    global.error(type + ' - ' + err);
  }
};

//
// Initialize threadPools
//
var threadPool = new ThreadPool(worker, global.CONSTANTS.threadpool.maxThreads, global.CONSTANTS.threadpool.interval);
threadPool.start();





//
// Initiailize controllers
//
var controllers = readControllers();
for (var name in controllers) {
  if (!controllers.hasOwnProperty(name)) continue;
  var controller = controllers[name];
  global.log.info('Initializing ' + controller.name + ' with period of ' + controller.interval + 'ms');

  bootstrapController(controller);
}


function bootstrapController(controller) {
  mysql.query('SELECT * FROM controllers WHERE controller=? ORDER BY timestamp DESC', [controller.name], function(err, res) {
    if (err) {
      global.error('mysql', err);
      return;
    }
    if (!res || !res.length) {
      runController(controller);
    } else {
      var timeleft = res[0].timestamp + controller.interval - common.time();
      if (timeleft < 0) timeleft = 0;

      setTimeout(function() {
        runController(controller);
      }, timeleft);
    }
  });
}
// Run a controller with a given interval
function runController(controller) {
    global.log.info('Running controller ' + controller.name);
    mysql.query('INSERT INTO controllers(controller, timestamp) VALUES(?,?)', [controller.name, common.time()], function(err, res) {
      if (err) {
        global.error('mysql',err);
        return;
      }

      controller.poll(worker, function() {
        global.log.info('Controller ' + controller.name + ' has finished running');

        setTimeout(function() {
          runController(controller);
        }, controller.interval);

      });
    });
}


// Read from ./controllers directory the full list of controllers
function readControllers() {
  var controllerFiles = fs.readdirSync(__dirname + '/controllers');
  var controllers = {};

  for (var i=0;i<controllerFiles.length;++i) {
    (function loadController(file) {
      if (!file.match(/\.js$/)) return;

      var controllerFile = './controllers/' + file;
      var name = file.replace(/\.js$/gi,'').toLowerCase();
      controllers[name] = require(controllerFile);
    })(controllerFiles[i]);    
  }
  return controllers;
}
