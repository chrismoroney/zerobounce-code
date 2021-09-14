var express = require('express');    //Express Web Server 
var router = express.Router();

var busboy = require('connect-busboy'); //middleware for form/file upload
var path = require('path');     //used for file path
var fs = require('fs-extra');       //File System - for file manipulation
var csv = require("csv-parser");
var request = require('request');
var axios = require('axios');
var converter = require('json-2-csv');


router.use(busboy());
router.use(express.static(path.join(__dirname, 'public')));

var results_file = "public/listOfEmails.csv"

router.post('/', function(req, res, next) {
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function(fieldname, file, filename) {
      console.log("Uploading: " + filename);

      //Path where image will be uploaded
      var filepath = "public/" + filename;
      fstream = fs.createWriteStream(filepath);
      file.pipe(fstream);
      fstream.on('close', function () {    
          console.log("Upload Finished of " + filename); 
          console.log("Processing CSV");             
          fs.truncate(results_file);
          var data_to_send = {
            api_key: "5ccba0ad00ff421c88c5f948908467bd",
            email_batch: []
          }
          fs.createReadStream(filepath)
          .pipe(csv())
          .on('data', function(data){
              try {
                  data_to_send.email_batch.push({email_address: data.Email, ip_address: data.IP})
              }
              catch(err) {
                  //error handler
              }
          })
          .on('end',function(){
              validate_batch_mail(data_to_send)
          });  
      });
      
  });
});

async function validate_batch_mail(data_to_send) {
    await axios
    .post('https://bulkapi.zerobounce.net/v2/validatebatch', data_to_send)
    .then(res => { 
      converter.json2csv(res.data["email_batch"], (err, csv) => {
        if (err) {
            throw err;
        }
        fs.writeFileSync(results_file, csv);
      });
    })
    .catch(error => {
      console.error(error)
    })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile('index.html', {root: 'views'});
});


module.exports = router;
