var request = require('request'),
    cheerio = require('cheerio');
 
request('http://encosia.com', function(error, response, body) {
  // Hand the HTML response off to Cheerio and assign that to
  //  a local $ variable to provide familiar jQuery syntax.
  var $ = cheerio.load(body);
 
  // Exactly the same code that we used in the browser before:
  $('h2').each(function() {
    console.log($(this).text());
  });
});