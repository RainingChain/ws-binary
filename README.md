Binary WebSocket Wrapper
==================================================

**ws-binary** is a wrapper around [websocket](https://www.npmjs.com/package/websocket).

This library's API is similar to [Socket.IO](http://socket.io/) API.

However, while Socket.IO focuses on reliability and retro-compabitibility, ws-binary focuses on performance.

This library only supports browsers that support WebSockets and typed-arrays.

ws-binary is meant to be used in conjunction with a binary encoder such as [BinSON](https://github.com/RainingChain/BinSON). 

For even greater performance, you can use [schema-encoder](https://github.com/RainingChain/schema-encoder) to reduce the bandwidth.

##### Check `/example` for a full example using express, ws-binary, BinSON and schema-encoder.

##### Check the MMORPG [RainingChain](http://rainingchain.com/) for a real-life application of ws-binary. 

---

### Bandwidth Comparaison:

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

	42["newMonster",{"hitpoints":100,"name":"Bob","strength":30,"position":{"mapModel":11,"x":125,"y":114}}]

ws-binary, BinSON and schema-encoder: length = 15 bytes

	2ÀBob__>__r_b__ 
	
	or 
	
	[0, 133, 50, 24, 192, 66, 111, 98, 133, 62, 138, 114, 98, 135, 158] as binary



## Basic Usage with Express

Install `websocket` dependency via `npm install websocket`.

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
	


## `wsBinary.init(serv:http.Server,options?)`

`serv` is a http server created via `require('http').createServer(...)`.

`options`:

- `encoder`: Encoder used to encode and decode the data sent. More info below.

- `originIsAllowed`:`(origin:string) => boolean` Function that returns true if the connection request should be accepted.

- `errorHandler`:`(err:Error) => void` Function triggered upon error while encoding, decoding or calling the event callback.

Check `/example` for a concret example.

## `wsBinary.connect(url:string,options?)`

url is the url to the server. Ex: `'ws://localhost:4000'`

`options`:

- `encoder`: Encoder used to encode and decode the data sent. More info below.

- `errorHandler`:`(err:Error) => void` Function triggered upon error while encoding, decoding or calling the event callback.

Check `/example` for concret example.



## Encoder

The encoder must implement the functions

`encode(data:any) => Buffer | Uint8Array` : Converts any object to binary. 

`decode(data:Buffer | Uint8Array) => any` : Converts binary into object.

**Important** The first byte of the binary buffer is reserved for the event id.
This means, the encoder must create a buffer with 1 extra byte at the beginning and not use it.

By default, ws-binary comes with a basic unefficient encoder. It is highly recommended to use a real binary such as [BinSON](https://github.com/RainingChain/BinSON). If using BinSON, make sure to set the option `startOffset` to 1 for the event id.

Note: The server and the client must use the same encoder.


## Limitations

- Event ids must be a integer between 0 and 255. The use of `enum` is recommended.

- Only `socket.emit` and `socket.on` are supported. (No broadcast nor room system.)

	
# License

MIT.

