# zerobounce-code

An app written in Node.js that validates a batch of emails using ZeroBounce API. 

When cloning this project, run ```npm install``` to install all necessary external packages used in this project.

To run this app, clone this repository, then in your command line / terminal, change directory to this file and run ```npm start```

My code can be found in the ```routes/index.js``` and ```views/index.html``` folder. If you use this code, PLEASE update the ```api_key``` in ```routes/index.js```.

In order to use properly, you must upload a CSV file with columns ```Email (required)``` and ```IP address (can be 'null')``` A sample email list to be uploaded can be found in ```public/emails.csv```. The sample email csv contains a list of emails that won't charge your account on ZeroBounce.
