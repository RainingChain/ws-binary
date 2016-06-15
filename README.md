Binary WebSocket Wrapper
==================================================

This library is a wrapper around [websocket](https://www.npmjs.com/package/websocket).

The `ws-binary` API is similar to [Socket.IO](http://socket.io/) API.

However, while Socket.IO focuses on reliability and retro-compabitibility, `ws-binary` focuses on performance.

This library only supports browsers that support WebSockets and typed-arrays (ES5).

ws-binary is meant to be used in conjunction with a binary encoder such as [BinSON](https://github.com/RainingChain/BinSON). For even greater performance, [schema-encoder](https://github.com/RainingChain/schema-encoder) can be used to reduce the bandwidth even further.

#### Check inside `/example` for a full example using express, ws-binary, BinSON and schema-encoder.

#### Bandwidth Comparaison:

	socket.emit('newMonster',{
		hitpoints:100,
		name:"Bob",
		strength:30,
		position:{
			mapModel:11,
			x:125,
			y:114,
		}		
	})
	
	Socket.IO by default: length = 104 bytes
	
		`42["newMonster",{"hitpoints":100,"name":"Bob","strength":30,"position":{"mapModel":11,"x":125,"y":114}}]`
	
	ws-binary, BinSON and schema-encoder: length = 15 bytes
	
		`2ÀBob__>__r_b__` or `[0, 133, 50, 24, 192, 66, 111, 98, 133, 62, 138, 114, 98, 135, 158]` as binary



## Basic Usage with Express

Server-side: `app.js`
	
	var express = require('express');
	var app = express();
	var serv = require('http').Server(app);
	app.use(express.static('./'));
	
	var MSG = {ping:0,pong:1};
	var io = require('./ws-binary').wsBinary.init(serv); 
	io.on('connection',function(socket){
		socket.on(MSG.pong,function(data){
			console.log('pong');
		});
		socket.emit(MSG.ping,{pingData:1000});
	});
	serv.listen(4000,function(){
		console.log('Go to localhost:4000/index.html');
	});
	
	

Client-side: `index.html`

	<script src="ws-binary.js"></script>
	<script>
	var MSG = {ping:0,pong:1};
	var socket = wsBinary.connect('ws://localhost:4000'); 
	socket.on(MSG.ping,function(data){
		console.log('received ping',data);
		socket.emit(MSG.pong,{myKey:1000});
	});
	</script>
	


## Options for `wsBinary.init()`

- `encoder`: Encoder used to encode and decode the data sent. More info below.

- `originIsAllowed`:`(origin:string) => boolean` Function that returns true if the connection request should be accepted.

- `errorHandler`:`(err:Error) => void` Function triggered upon error while encoding, decoding or calling the event callback.




## Encoder

The encoder must implement the functions

`encode(data:any) => Buffer | Uint8Array` : Converts any object to binary. 

**Important** The first byte of the binary buffer returned will be overwritten to hold the message type.
This means, the encoder must create a buffer with 1 extra byte at the beginning and not use it.

`decode(data:Buffer | Uint8Array) => any` : Converts binary into object.

By default, `ws-binary` comes with a basic unefficient encoder. It is highly recommended to use a real binary such as [BinSON](https://github.com/RainingChain/BinSON).

The server and the client must use the same encoder.


## Limitations

- Event ids must be a integer between 0 and 255. The use of `enum` is recommended.

- Only `socket.emit` and `socket.on` are supported. (No broadcast nor room system.)

	
# License

MIT.
