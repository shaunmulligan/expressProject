var sendGCM = require("./pushMessage");
var express = require('express');
var nano 	= require('nano')('http://localhost:5984');
var employeesDB = nano.db.use('employees');

var server = express();
server.configure(function(){

	server.use(express.bodyParser());
  
	//server.use(express.static(__dirname + '/public'));
});

//listen for post requests from new android devices
server.post('/reg', function(req, res) {
	//acknowledge request
	res.send({ status: 'SUCCESS' });
	console.log(req.body);
	USERNAME = req.body.username;
	REGID = req.body.regId;

	//write new employee registration to employees database
	employeesDB.insert({ regId: REGID , onDuty: "false" }, USERNAME, function(err, body) {
  	if (!err)
    	console.log('the following was added to db: '+body);
	});

	//notify new user with regId:REGID of successful registration
	sendGCM.sendPush(REGID,"Successful Registration");	
});

//this is the entry page, allowing changes in who is on duty
server.get('/',function(req,res){
	var response = "<h2>select who is on duty</h2><br>";
		response+= "<form action=\"update\" method=\"post\">";
	    
	    //get all registered employees
		employeesDB.view('employeesList','employeesList',function(err,body){
	  		if(!err){
		  		body.rows.forEach(function(doc){
		  			response += "<input type=\"radio\" name="+doc.key+" value="+doc.key+">"+doc.key+"</input><br>";
		  		});
	  		}
	  		response += "<button type=submit>update</button>";
	  		response += "</form>";
	  		res.send(response);
	  	});   
});

server.post('/update',function(req,res){
	resetOnDutyList();
	//cycle through emplyees submitted as on duty.
	for (var key in req.body){
		console.log("key: "+key);
		console.log("value: "+req.body[key]);
		//update who is on duty.
		employeesDB.get(key, { revs_info: true }, function(err, body) {
		  if (!err)
		    console.log(body._rev);
			employeesDB.insert({onDuty: true, "_rev": body._rev}, key, 
		    function (error, response) {
		      if(!error) {
		        console.log("it worked");
		      } else {
		        console.log("sad panda");
		      }
	    	});
		});

	}
	res.send(req.body.shaun);
});

//*************************************************************************
//simulated doorbell press
var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
stdin.setRawMode( true );

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();

// i don't want binary, do you?
stdin.setEncoding( 'utf8' );

// on any data into stdin
stdin.on( 'data', function( key ){
  // ctrl-c ( end of text )
  if ( key === '\u0003' ) {
    process.exit();
  }
  // write the key to stdout all normal like
  process.stdout.write( key );
  employeesDB.view('onDuty','onDutyList',function(err,body){
  	if(!err){
  		body.rows.forEach(function(doc){
  			console.log('push notification sent to: '+doc.key);
  			sendGCM.sendPush(doc.value,"hello "+ doc.key);
  		});
  	}
  });

});
//*************************************************************************
server.listen(3000);

//sets everyone off duty.
function resetOnDutyList(){
		employeesDB.view('employeesList','employeesList',function(err,body){
	  		if(!err){
		  		body.rows.forEach(function(doc){
		  			employeesDB.get(doc.key, { revs_info: false }, function(err, body) {
					  if (!err)
					    console.log(body._rev);
						employeesDB.insert({onDuty: false, "_rev": body._rev}, doc.key, 
					    function (error, response) {
					      if(!error) {
					        console.log("it worked");
					      } else {
					        console.log("sad panda");
					      }
				    	});
					});
		  		});
	  		}
		});
}

// one can check couchDB content at http://localhost:5984/_utils/
//*************************************************************************
