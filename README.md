# n.scrape

A web scrapper powered by node.js, phantomjs and MySQL.

## Works

Works are defined by its namespace, method and arguments. Pending works are serialized and stored in the works database, and are identified with the field ```completed=0```. When it's being worked on, the ```completed``` field will have a value of ```1```. This is done with a MySQL stored procedure ```GetWork()``` that gets the oldest work from the database, updates the ```completed``` field to 1, and then return the row. The stored procedure is to ensure the atomicity of the operation.

```js
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
};
```

## Threads

Threads are managed by the ThreadPool object that will periodically poll the Worker object for work to be done. It will then load the relevant namespace and call the method of the namespace with the arguments.

## Controllers

Controllers will bootstrap the entire crawling process. It will be called periodically based on a given period. New controllers can be added by creating a new file in the ```./controllers/``` folder.

Each controller is an object that has the keys ```interval``` (integer representing the number of milliseconds that it will be called, as well as ```poll```, the function that will be called. The ```poll``` function will be given the Worker object so that the controller and add new work to the pool.

## Todo

- Fallback to proxy servers
- Better encapsulation of worker object