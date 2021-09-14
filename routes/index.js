var express = require('express');  //Express Web Server 
var router = express.Router();

/* EXTERNAL PACKAGES */
var busboy = require('connect-busboy'); // Busboy -- middleware for form/file upload
var fs = require('fs-extra'); // File System -- for file manipulation
var csv = require("csv-parser"); // CSV (comma-separated values) -- for reading uploaded csv file.
var axios = require('axios'); // Axios -- for creating browser request to ZeroBounce API
var converter = require('json-2-csv'); // JSON-2-CSV -- convering JSON object to CSV

// Use busboy library in our router to allow file upload from form in views/index.html
router.use(busboy()); 

// Initialize directory for where we store results
var results_file = "public/listOfEmails.csv"

// POST request from node app, activated on 'submit' input in views/index.html
router.post('/', function(req, res) {
  var fileStream; // Initialize filestream which will be used later.

  // use pipe on busboy in order to combine functions on file uploaded
  req.pipe(req.busboy);
  // when user has submitted file, do the following...
  req.busboy.on('file', function(fieldname, file, filename) {
      console.log("Uploading: " + filename);
      // Path where user's uploaded file will be located
      var filepath = "public/" + filename;
      // Create a writeStream in order to start writing data into local /public/ folder
      fileStream = fs.createWriteStream(filepath);
      // Pipe to combine functions
      file.pipe(fileStream);
      // When we finish copying the file onto our local file...
      fileStream.on('close', function () {    
          console.log("Upload Finished of " + filename); 
          console.log("Processing CSV");
          // Erase all content in our return/results file. Ensures user gets clean csv results
          fs.truncate(results_file);
          // ZeroBounce's Batch Email validator request data format. Consists of an API key and batch of emails and IP addresses.
          // This data format is a JSON, which is what ZeroBounce accepts.
          var data_to_send = {
            api_key: "5ccba0ad00ff421c88c5f948908467bd", // CHANGE YOUR API KEY HERE
            email_batch: [] // Leave this blank.
          }
          // create a readStream from our local file that we wrote to
          fs.createReadStream(filepath)
          // Combine operations with pipe for our csv operations
          .pipe(csv())
          // while there is data found in the file...
          .on('data', function(data){
              try {
                  // input the email and ip address into data_to_send
                  data_to_send.email_batch.push({email_address: data.Email, ip_address: data.IP})
              }
              catch(err) {
                  //error handler
              }
          })
          // When there is no more data found in the file...
          .on('end', function(){
              // call validate_batch_email, which will call ZeroBounce's API and return our values.
              validate_batch_email(data_to_send)
              // Send status 204 which allows user to stay on same page. 
              res.status(204).send();
          });  
      });
      
  });
});

// Helper async function that sends request to ZeroBounce's API. We input the data generated from our JSON object
async function validate_batch_email(data_to_send) {
  // Since we aren't sure how long zerobounce may take, we must await in order to account for receiving our results from zerobounce. 
  await axios
    // create post request with this API link and our data
    .post('https://bulkapi.zerobounce.net/v2/validatebatch', data_to_send)
    // After submitting the API request...
    .then(res => { 
      // Convert the data recieved from JSON to CSV format
      converter.json2csv(res.data["email_batch"], (err, csv) => {
        if (err) {
            throw err;
        }
        // Take the converted data and write it into our results/return file (csv file). 
        fs.writeFileSync(results_file, csv);
      });
      
    })
    .catch(error => {
      console.error(error)
    })
}

// Get request for app.
router.get('/', function(req, res, next) {
  // Clear results file when loading page
  fs.truncate(results_file);
  res.sendFile('index.html', {root: 'views'});
});


module.exports = router;
