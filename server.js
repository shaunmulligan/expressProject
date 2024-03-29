var sendGCM = require("./pushMessage");
var express = require('express');
//init database 
//*************************************************************************
var fs = require("fs");
var sqlite3 = require("sqlite3");
var repo = "employeesDB.sqlite";
fs.exists(repo,function(exists){
	if(exists){
		console.log("DB exists");
	}else{
		console.log("DB not found");
	}
});
//*************************************************************************
var server = express();
server.configure(function(){

	server.use(express.bodyParser());
  
	//server.use(express.static(__dirname + '/public'));
});
//listen for post requests from new android devices
server.post('/reg', function(req, res) {
	var db = new sqlite3.Database(repo);
	//acknowledge request
	res.send({ status: 'SUCCESS' });
	console.log(req.body);
	USERNAME = req.body.username;
	REGID = req.body.regId;
	//write new employee registration to employees database
	//*************************************************************************
	db.run("INSERT INTO users (name, regID, onDuty) VALUES ('"+USERNAME+"','"+REGID+"',0)",function(error){
		if(!error){
			console.log("new user has been added to DB");
			//notify new user with regId:REGID of successful registration
			sendGCM.sendPush(REGID,"Successful Registration");	
		}else{
			console.log("error, new user not added to DB");
		}
		db.close();
	});
	//*************************************************************************	
});
//this is the entry page, allowing changes in who is on duty
server.get('/',function(req,res){	
	var db = new sqlite3.Database(repo);
	var response = "<h2>Update Whos is on duty</h2><br>";
		response+= "<form action=\"update\" method=\"post\">";
	    
	    //get all registered employees from DB and display as radio buttons
		//*************************************************************************
		var stmt = "SELECT name FROM users";
		db.each(stmt,function(err,row){
			console.log("user name read from DB: "+row.name);
			response += "<input type=\"radio\" name="+row.name+" value="+row.name+">"+row.name+"</input><br>";
			
		},function(error,numberRows){
			response += "<button type=submit>update</button>";
		  	response += "</form>";
		  	res.send(response);
		  	console.log("response has been sent");
		});
	db.close(); 	 
});

server.post('/update',function(req,res){
	var db = new sqlite3.Database(repo);
	var response = "The following will receive doorbell notifications: ";
	db.serialize(function(){
		//reset all users to off duty
		db.run("UPDATE users SET onDuty = 0 WHERE onDuty=1");
		//cycle through emplyees submitted from radio buttons as on duty.
		for (var key in req.body){
			var username = req.body[key];
			//update who is on duty.
			//*************************************************************************
			db.run("UPDATE users SET onDuty = 1 WHERE name = ?", key);
			response += username+", ";
			//*************************************************************************
		}//end of for loop;
	db.close();
	res.send(response);
	});//serialize db
});

//*************************************************************************
//event emitter
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

  //push message to all who are on duty
  //put this in ee.on('stateChange'....)
  //*************************************************************************
  var db = new sqlite3.Database(repo);
  var stmt = "SELECT name,regID FROM users WHERE onDuty=1";
  db.each(stmt,function(err,row){
  	console.log("message pushed to "+row.name);
  	sendGCM.sendPush(row.regID,"Someone is at the Door!");
  },function(error,numberRows){
  	db.close();
  	console.log(numberRows+" messages where pushed");
  });
  //*************************************************************************

});
//*************************************************************************

//*************************************************************************
server.listen(3000);
//*************************************************************************
