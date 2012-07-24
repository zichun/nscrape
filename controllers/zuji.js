var common = require('../common.js');
var util = require('util');
var q = require('q');

var url = 'http://www.zuji.com.sg/trips/hotellist/listInternal?ac_city=%s&pTxId=409470&startIndex=0&checkInDate=2013-01-05&checkOutDate=2013-01-06&hotelMaxReturnPerPage=25&guestCounts=2&guestCodes=ADULT&configId=S37971682&numRooms=1&path=hotels';

var controller = {
	interval: 60 * 60 * 24 * 7 * 1000,
	name: 'zuji',
	poll: function(worker, cb) {
		var tp = [];

		for (var i=0;i<cities.length;++i) {
			var x = util.format(url, cities[i]);
			tp.push(x);
		}

		var cnt = 0;
		function getNext() {
			var nxt = [];
			for (var i=0; i<30 && cnt < tp.length;++cnt, ++i) {
				nxt.push( q.ncall( worker.newWork, worker, controller.name, 'parseSearch', [tp[cnt]]) );
			}
			return nxt;
		}
		
		function qception(nxt) {
			return q
			.all(nxt)
			.then(function(res) {
				var nxt = getNext();
				if (nxt.length) {
					return qception(nxt);
				} else {
					cb(null, true);
				}
			})
			.fail(cb);
		}

		return qception(getNext());
	}
};

module.exports = controller;

var cities = ['London',
'Bangkok',
'Paris',
'Singapore',
'Hong Kong',
'New York City',
'Dubai',
'Rome',
'Seoul',
'Barcelona',
'Dublin',
'Bahrain',
'Shanghai',
'Toronto',
'Kuala Lumpur',
'Madrid',
'Istanbul',
'Amsterdam',
'Mecca',
'Prague',
'Moscow',
'Beijing',
'Vienna',
'Taipei',
'St.Petersburg',
'Cancun',
'Macau',
'Venice',
'Warsaw',
'Mexico',
'Los Angeles',
'Guangzhou',
'Benidorm',
'Berlin',
'Rio De',
'Budapest',
'San Francisco',
'Orlando',
'Miami',
'Munich',
'Shenzen',
'Milan',
'Sydney',
'Honolulu',
'Cairo',
'Florence',
'Lisbon',
'Las Vegas',
'Hangzhou',
'Marrakesh',
'Tokyo',
'Abu Dhabi',
'Varadero',
'Copenhagen',
'Zurich',
'Edinburgh',
'Cape Town',
'Zhuhai',
'Suzhou',
'Seville',
'Nice',
'São Paulo',
'Washington DC',
'Chicago',
'Guilin',
'Stockholm',
'Tallinn',
'Boston',
'Krakow',
'La Havana',
'Salvador de Bahia',
'Melbourne',
'Manchester',
'Salzburg',
'Tianjin',
'Nanjing',
'Helsinki',
'Xi\'an',
'Qingdao',
'Xiamen',
'Birmingham',
'Glasgow',
'Hamburg',
'Lyon',
'Montreal',
'Mumbai',
'Dalian',
'San Diego',
'Bruges',
'Antwerp',
'Liverpool',
'New Delhi',
'Valencia',
'Kunming',
'Granada',
'Wuxi',
'Chennai',
'Geneva',
'Agra',
'Chongquing',
'Innsbruck',
'Oslo',
'Chengdu',
'Fortaleza',
'Atlanta',
'Houston',
'Bratislava',
'Oxford',
'Foz',
'Gothenburg',
'San Jose',
'Luxembourg City',
'Bristol',
'Buenos Aires',
'Reykjavik',
'Nürnberg',
'Naples',
'Buzios',
'Cardiff',
'Cambridge',
'Seattle',
'Newcastle',
'Florianópolis',
'Monaco',
'Leeds',
'Brighton',
'Ghent',
'York',
'Inverness',
'Heidelberg',
'Bath',
'Dijon',
'Genova',
'Dresden',
'Reims',
'Nottingham',
'Graz',
'Reading',
'Goa',
'Linz',
'Bilbao',
'Aberdeen',
'Marseille',
'Chester',
'Jerusalem',
'Saragossa',
'Tarragona',
'Malmö',
'Bregenz',
'Turku'];