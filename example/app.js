var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.use(express.static('./'));

serv.listen(4000, function() {
    console.log('Go to localhost:4000/index.html');
});

SchemaEncoder = require('./SchemaEncoder').SchemaEncoder;
BinSON = require('./BinSON').BinSON;
require('./shared');	//init BinSON and create schemas

var io = require('./ws-binary').wsBinary.init(serv,{
	encoder:BinSON,
});

io.on('connection', function (socket){
	socket.emit(MSG.newMonster,monsterSchema.encode(myMonster));
	socket.on(MSG.any,function(data){
		console.log(data);
	});	
});

var myMonster = {
	hitpoints:100,
	name:"Bob",
	strength:30,
	position:{
		mapModel:11,
		x:125,
		y:114,
	}		
}









