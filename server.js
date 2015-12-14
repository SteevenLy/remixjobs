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

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/'); // connect to our database
var Job     = require('./app/models/job');

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Appel API');
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
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
		job.category = req.body.category;
		job.description = req.body.description;
		job.contract = req.body.contract;
		job.date = req.body.date;
		job.tags = req.body.tags;

		job.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Job created!' });
		});


	})

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		Job.find(function(err, jobs) {
			if (err)
				res.send(err);

			res.json(jobs);
		});
	});

// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/jobs/:job_id')

	// get the bear with that id
	.get(function(req, res) {
		Job.findById(req.params.job_id, function(err, job) {
			if (err)
				res.send(err);
			res.json(job);
		});
	})

	// update the bear with this id
	.put(function(req, res) {
		Job.findById(req.params.job_id, function(err, job) {

			if (err)
				res.send(err);

			job.name = req.body.name;
			job.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Job updated!' });
			});

		});
	})

	// delete the bear with this id
	.delete(function(req, res) {
		Job.remove({
			_id: req.params.job_id
		}, function(err, job) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});


// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

app.get('/scrape', function(req, res){

	Job.remove({}, function(err) {
   console.log('collection removed')
});

var pagesToScrape = new Array();

for (var i = 1; i < 20; i++) {

	url = 'https://remixjobs.com/?page=' + i + '&in=all';
	pagesToScrape.push({ "url": url });
}

async.map(pagesToScrape,function(opts, callback) {

	request(opts, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);

			$('.jobs-list').children().each(function(){
		        var data = $(this);

						var job = new Job();

						job.title = data.find('.job-title').children().first().text();
						job.company = data.find('.company').text();
						job.localization = data.find('.workplace').text();
						job.category = data.find('.job-link').attr("href").split("/")[2];
						//job.description = req.body.description;
						var co = data.find('.contract').text();
						co = co.replace(/\s+/g, '');
						job.contract = co;

						// traitement date
						var date = data.find('.job-details-right').text();

						//cas d'un job récent (minutes ou heures)
						if (date.indexOf("minutes") >= 0 || date.indexOf("heures") >= 0 || date.indexOf("heure") >= 0) {
							job.date = new Date();
						}
						else {
								//job.date = data.find('.job-details-right').text();
						}

						data.find('.tag').each(function(){
							var lol = $(this).text();
							lol = lol.replace(/\s+/g, '');
							job.tags.push(lol);

						})

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
})
})

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Connection started at port: ' + port);
