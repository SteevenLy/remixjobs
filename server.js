// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var fs 				 = require('fs');
var request 	 = require('request');
var cheerio 	 = require('cheerio');
var async 		 = require('async');
var app        = express();

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port     = process.env.PORT || 2929; // set our port
//steeven
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/'); // connect to our database
var Job     = require('./app/models/job');

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {//steeven
	// do logging
	console.log('Appel API');
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {//steeven
	res.json({ message: 'Vous êtes sur l\'API RemixJob' });
});

// on routes that end in /bears
// ----------------------------------------------------
router.route('/jobs')

	// create a bear (accessed at POST http://localhost:2929/bears)
	.post(function(req, res) {

		var job = new Job();		// create a new instance of the Bear model

		job.title = req.body.title;
		job.company = req.body.company;
		job.localization = req.body.localization;
		job.category = req.body.category;//steeven
		job.description = req.body.description;
		job.contract = req.body.contract;
		job.date = req.body.date;
		job.tags = req.body.tags;
//steeven
		job.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Job created!' });
		});


	})

	.get(function(req, res) {
		Job.find(function(err, jobs) {
			if (err)
				res.send(err);//steeven

			res.json(jobs);
		});
	});//steeven

// ----------------------------------------------------
router.route('/jobs/:jeanmicheljarre')


	// get the bear with that id
	.get(function(req, res) {

		if(req.params.jeanmicheljarre == "latest")
		{
			var query = Job.find({});
			query.sort({date : -1});//steeven
			query.limit(15);
			query.exec(function(err, job) {
				if (err)//steeven
					res.send(err);
				res.json(job);
			});
		}
		else {
			Job.findById(req.params.jeanmicheljarre, function(err, job) {
				if (err)
					res.send(err);//steeven
				res.json(job);
			});
		}
	})

	// update the bear with this id
	.put(function(req, res) {
		Job.findById(req.params.jeanmicheljarre, function(err, job) {

			if (err)
				res.send(err);//steeven

			job.name = req.body.name;
			job.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Job updated!' });
			});

		});//steeven
	})

	// delete the bear with this id
	.delete(function(req, res) {
		Job.remove({
			_id: req.params.jeanmicheljarre
		}, function(err, job) {
			if (err)
				res.send(err);
			res.json({ message: 'Successfully deleted' });
		});//steeven
	});

	router.route('/companies')
		.get(function(req, res) {
				if(req.query.company)
				{
					var query = Job.find({});
					query.where("company" , req.query.company);
					query.exec(function(err, job) {
						if (err)//steeven
							res.send(err);
						res.json(job);
					});
				}//steeven
				else {
					Job.aggregate([{$group : { _id : "$company", count : {$sum : 1} }}, {$sort : { count : -1 }}]).exec(function(err, job)
					{
						if (err)
							res.send(err);

						res.json(job);
			});
				}
});
//steeven
// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

app.get('/scrape', function(req, res){
//steeven
	Job.remove({}, function(err) {
   console.log('collection removed')
});

var pagesToScrape = new Array();

for (var i = 1; i < 15; i++) {
//steeven
	url = 'https://remixjobs.com/?page=' + i + '&in=all';
	pagesToScrape.push({ "url": url });
}//steeven

console.log('Start Scrapping...');
console.log('Be patient... It takes a few seconds');

async.map(pagesToScrape,function(opts, callback) {

	request(opts, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);

			$('.jobs-list').children().each(function(){
		        var data = $(this);
//steeven
						var job = new Job();

						job.title = data.find('.job-title').children().first().text();
						job.company = data.find('.company').text();
						job.localization = data.find('.workplace').text();
						job.category = data.find('.job-link').attr("href").split("/")[2];
						//job.description = req.body.description;
						var co = data.find('.contract').text();
						co = co.replace(/\s+/g, '');
						job.contract = co;
//steeven
						// traitement date
						var date = data.find('.job-details-right').text();

						//cas d'un job récent (minutes ou heures)
						if (date.indexOf("minutes") >= 0 || date.indexOf("heures") >= 0 || date.indexOf("heure") >= 0) {
							job.date = new Date();
						}
						else {//steeven
								//yyyy-MM-dd

								var dateString = "";

								var year = date.split(" ")[2];
								var gettingMonth = date.split(" ")[1];
								gettingMonth = gettingMonth.replace(".", "");
								var month = "";
//steeven
								switch (gettingMonth) {
								    case "jan":
								        month = "01";
								        break;
								    case "fev":
								        month = "02";
								        break;
								    case "mars":
								        month = "03";
								        break;//steeven
								    case "avr":
								        month = "04";
								        break;
								    case "mai":
								        month = "05";
								        break;
								    case "juin":
								        month = "06";
								        break;
								    case "juil":
								        month = "07";
								        break;
												case "août":
										        month = "08";
										        break;
														case "sept":
												        month = "09";
												        break;//steeven
																case "oct":
														        month = "10";
														        break;
																		case "nov":
																        month = "11";
																        break;
																				case "déc":
																		        month = "12";
																		        break;
																					}
												var day = new Number(date.split(" ")[0]);
												var dayString = "";
												if (day < 10)
													dayString = "0" + day.toString();
													else {
														dayString = day.toString();
													}//steeven

													dateString = year + "-" + month + "-" + dayString;

								job.date = Date.parse(dateString);
						}

						data.find('.tag').each(function(){
							var lol = $(this).text();
							lol = lol.replace(/\s+/g, '');
							job.tags.push(lol);

						})//steeven

						//getting description
						var yolo = "https://remixjobs.com" + data.find('.job-link').attr("href");
						var desc = "";

						request(yolo, function(error, response, html){
							if(!error){
								var $ = cheerio.load(html);
								desc = $('.job-description').text();
								job.description = desc;

								job.save(function(err) {
									if (err)
										res.send(err);
								});
								}})
	        });
}})
})//steeven
})
//steeven
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Connection started at port: ' + port);
