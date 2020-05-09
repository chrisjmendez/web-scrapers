// URLs to scrape
const data = require('./data');

const fs = require('fs');
const util = require("util");
const https = require('https');
// https://www.npmjs.com/package/better-queue
const Queue = require('better-queue');
// https://cheerio.js.org
const cheerio = require('cheerio');
// https://www.npmjs.com/package/dotenv
const dotenv = require('dotenv').config();
// Create a .env file and paste API from ScrapingBee
const API_KEY = process.env.SCRAPING_BEE_API

/**
 * ScrapingBee configuration
 * https://www.scrapingbee.com/documentation/#advanced-usage
 */
const config = (url) => {
    return {
        hostname: 'app.scrapingbee.com',
        port: '443',
        url: url,
        path: util.format('/api/v1?api_key=%s&url=%s', API_KEY, encodeURIComponent(url)),
        method: 'GET'
    }
}

/**
 * Save a complete or partial HTML document
 */
const save = async (fileName, data) => {
    try {
        await fs.writeFile(fileName, data, (err) => {
            if(err) return console.log(err);
            console.log("Document Saved:", fileName)
        })
    } catch (err) {
        console.error("error::save", err.message);
    }
}

/**
 * Parse the HTML using jQuery DOM tactics
 */
const parseData = async (fileName, html) => {
    try {
        // Use jQuery to parse the DOM
        let $ = cheerio.load( html );
        // Select the <body>
        var data = $('.jobsearch-JobComponent')
        // Remove any <script> tags
        data.find('script').remove();
        return await data.html();
    } catch( err ){
        console.log("err:parseData: ", err.message)
    }
}

/**
 * A queue system for downloading documents in sequence.
 */
const q = new Queue( (url, cb) => {
    let options = config(url);
    // A. Request the entire document without images or advertisements
    let req = https.request(options, res => {
        console.log(`\nStatusCode: ${ res.statusCode }`);
        
		// B. Use the URL string to name the file
        let fileName = options.url.split('/').pop();
        let filePath = `./html/${fileName}.html`;
		
        // C. Create an array to store data from Request
        let body = [];
        res
			// D. Push the data to the array
            .on('data', html => {
                body.push(html);
            })
			// E. Finish & Parse
            .on('end', () => {
	            // F. Convert the Buffer data to HTML
	            body = Buffer.concat(body).toString();
            })
            .on('close', async () => {
                // F. Parse the HTML
                parseData(fileName, body)
                .then( (data) => {
					// G. Save the HTML document
                    save(filePath, data)
					.then( () => {
						// H. Go to Next Item in Queue
						cb()
					})
                });
            });
    })
    req.on('error', err => {
        console.error("onError:", err.message);
        process.exit(1);
    });
    req.end();
});

/**
 * Events on Queue
 * https://github.com/diamondio/better-queue#events-on-queue
 */
q.on('task_started', (taskId, obj) => {
    console.log('task_started', taskId, obj);
});

q.on('task_finish', (taskId, result, stats) => {
    console.log('task_finish', taskId, stats);
});

q.on('task_failed', (taskId, err, stats) => {
    console.log('task_failed:', taskId, stats);
});

/**
 * Events on Ticket
 * https://github.com/diamondio/better-queue#events-on-ticket
 */
q.on('started', (result) => {
    console.log('started');
});

q.on('finish', (result) => {
    console.log('finish', result);
});

q.on('failed', (err) => {
    console.log('failed', err);
});

// All tasks have been pulled off of the queue
// (there may still be tasks running!)
q.on('empty', () => {
    console.log('empty');
});

// There are no more tasks on the queue and no tasks running
q.on('drain', () => {
    console.log('drain');
    // Stop Node Application
});


/**
 * App Start
 */
data.forEach(function (item) {
    q.push(item);
});

/**
 * App End
 */
process.on('exit', function(code) {
    return console.log(`About to exit with code ${code}`);
});
