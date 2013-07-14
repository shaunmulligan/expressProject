var sys = require('sys');
var gcm = require('node-gcm');

var sendPush = function(phone,messageString){

        var sender = new gcm.Sender('AIzaSyCfJl7ogiY9msupTeN3M7UM2pDKvANvrsI');
        var registrationIds = [];
        var phone1 = new Array( 'APA91bEUEj38gQ3OX_bP-MegjKKmJbRoXyJJq-oaqj3cyaepfKk9gcMKtAuUzRQNf26O-iYeswuApezXyxldWoqTSmI8qFCOO6eDxqE6fVoJzSE-U6EJEXT1ZgZK-URKg4KtW5wLzODOz_41QwdO2vEOlWV5n36DfA');
        var phone2 = new Array( 'APA91bEKh6Ob2Rz_qGh-UOhvkO7XWdCpkyK5-9zZBcFAvrDna1ZqRlSkWE1tp09CbzmZfD8jYeUNA81ZUTbDMIGC1CoLfPHesVE9wQswRpSZvTUZXqnrxu9dUF6m8pfufDXVksioMSbre4HLruPmijUQKu3OMdXXhQ');

        var message = new gcm.Message({
                delayWhileIdle: false,
                timeToLive: 3,
                data: {
                        message: messageString
                }
        });

        registrationIds.push(phone1[0]);
        registrationIds.push(phone2[0]);

        if(phone == '1')
        {
                sender.send(message, phone1, 4, function (err, result) {console.log(result);});
        }
        else if(phone == '2')
        {
                sender.send(message, phone2, 4, function (err, result) { console.log(result);});
        }
        else
        {
                sender.send(message, registrationIds, 4, function (err, result) { console.log(result);});
        }

}

exports.sendPush = sendPush;
