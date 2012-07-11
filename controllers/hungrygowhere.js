var page = 'http://www.hungrygowhere.com/search_results.php?f_foodplace=%s&f_recommend=na&f_cuisine=na&f_price=na&city=147&f_zone=0&alpha_check=1&location-alpha-select=07&location-postal-select=%s&f_zip=07&searchcat=Category&f_name=';
var util = require('util');
var q = require('q');

var controller = {
	name: 'hungrygowhere',
	domain: 'www.hungrygowhere.com',
	interval: 60 * 60 * 24 * 7 * 1000,

	poll: function(worker, cb) {
		var tp = [];


		for (var f_foodplace in f_foodplaces) {
			if (!f_foodplaces.hasOwnProperty(f_foodplace)) continue;

			for (var location_postal_select in location_postal_selects) {
				if (!location_postal_selects.hasOwnProperty(location_postal_select)) continue;

				var url = util.format(page, f_foodplace, location_postal_select);

				tp.push(url);
			}
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

var f_foodplaces = {
	"1":"Bakery/Dessert",
	"26":"Beer",
	"25":"Bistro/Brasserie",
	"2":"Cafe",
	"15":"Catering",
	"21":"Cha Chaan Teng",
	"14":"Coffee Shop",
	"10":"Dance Clubs",
	"3":"Deli",
	"16":"Delivery",
	"13":"Fast Food",
	"5":"Karaoke",
	"12":"Kiosk/Stall",
	"9":"Lounge",
	"6":"Pub/Bar",
	"11":"Restaurant",
	"7":"Tea",
	"8":"Wine/Spirits"
};

var location_postal_selects = {
	"01": "Marina South",
	"02": "Marina East",
	"03": "Esplanade/Suntec",
	"04": "Raffles Place",
	"05": "Chinatown",
	"06": "Shenton Way",
	"07": "Anson Road",
	"08": "Tanjong Pagar",
	"17": "Clarke Qy/Hill St",
	"18": "Bugis/Victoria",
	"19": "Beach Rd",
	"09": "H.front/Telok Blgh",
	"10": "Depot Road",
	"11": "Pasir Panjang",
	"12": "Clementi",
	"13": "Dover/Buona Vista",
	"14": "Queenstown/C'wealth",
	"15": "Bt Merah/Alexandra",
	"16": "Outram/Tiong Bahru",
	"60": "Jurong East",
	"61": "Taman Jurong",
	"62": "Jurong/Joo Koon",
	"63": "Jurong/Tuas",
	"64": "Jurong West/Boon Lay",
	"65": "Bukit Batok",
	"66": "Hillview",
	"67": "Bukit Panjang",
	"68": "Choa Chu Kang",
	"69": "Tengah",
	"70": "Lim Chu Kang",
	"22": "Scotts Rd/Newton",
	"23": "Orchard Road",
	"24": "Tanglin/River Valley",
	"26": "Bt Timah/Farrer Rd",
	"27": "Holland/Ghim Moh",
	"25": "Bt Timah/Stevens Rd",
	"28": "Bt Timah/Old Turfclub",
	"29": "Thomson Road",
	"30": "Novena",
	"58": "Bukit Timah Hill",
	"59": "King Albert Park",
	"20": "Lavender/Jln Besar",
	"21": "Little India",
	"31": "Braddell/Toa Payoh",
	"32": "Balestier",
	"33": "Geylang Bahru",
	"34": "Macpherson",
	"35": "Potong Pasir",
	"36": "MacPherson Road",
	"37": "Old Airport",
	"38": "Kallang/Geylang",
	"39": "Stadium",
	"40": "Paya Lebar",
	"41": "Kembangan",
	"42": "Katong/Joo Chiat",
	"43": "Katong/Tanjong Rhu",
	"44": "Marine Parade",
	"45": "Siglap",
	"46": "Bedok/Chai Chee",
	"47": "Bedok Reservoir",
	"48": "Singapore Expo",
	"49": "Changi Coast",
	"50": "Loyang",
	"51": "Pasir Ris",
	"52": "Tampines/Simei",
	"81": "Changi Airport",
	"53": "Hougang/Yio Chu Kang",
	"55": "Serangoon",
	"56": "Ang Mo Kio",
	"57": "Bishan/Thomson Rd",
	"54": "Sengkang/Buangkok",
	"79": "Seletar",
	"80": "Yio Chu Kang",
	"82": "Punggol",
	"71": "Neo Tiew/Kranji",
	"72": "Mandai",
	"73": "Woodlands",
	"75": "Sembawang",
	"76": "Yishun/Khatib",
	"77": "Nee Soon",
	"78": "Spring Leaf"
};
