var Rc;
(function (Rc) {
    var io_Socket = (function () {
        function io_Socket(connection, onServer, params) {
            this.connection = null;
            this.events = {};
            this.key = null;
            this.beingRemoved = false;
            this.onServer = false;
            this.encoder = null;
            this.errorHandler = null;
            params = params || {};
            this.onServer = !!onServer;
            this.encoder = params.encoder || {
                encode: function (data) {
                    var str = JSON.stringify(data);
                    var buf = typeof Buffer === 'undefined' ? new Uint8Array(1 + str.length) : new Buffer(1 + str.length);
                    for (var i = 0, strLen = str.length; i < strLen; i++)
                        buf[i + 1] = str.charCodeAt(i);
                    return buf;
                },
                decode: function (data) {
                    return JSON.parse(String.fromCharCode.apply(null, data.slice(1)));
                }
            };
            this.errorHandler = params.errorHandler || function (err) {
                throw err;
            };
            var self = this;
            this.connection = connection;
            var onmessageRaw = function (message) {
                var msgBin = self.onServer ? message.binaryData : new Uint8Array(message.data);
                var what = msgBin[0];
                var data = self.encoder.decode(msgBin);
                if (self.events[what])
                    self.events[what](data);
            };
            var onmessage = function (message) {
                try {
                    onmessageRaw(message);
                }
                catch (err) {
                    self.errorHandler(err);
                }
            };
            if (this.onServer)
                connection.on('message', onmessage);
            else
                connection.onmessage = onmessage;
            var ondisconnect = function (reasonCode, description) {
                try {
                    if (self.events['disconnect'])
                        self.events['disconnect']();
                }
                catch (err) {
                    self.errorHandler(err);
                }
            };
            if (this.onServer)
                connection.on('close', ondisconnect);
            else
                connection.onclose = ondisconnect;
        }
        io_Socket.prototype.isReady = function () {
            return this.connection.readyState === this.connection.OPEN;
        };
        io_Socket.prototype.emit = function (id, data, schemaEncoder) {
            if (schemaEncoder === void 0) { schemaEncoder = null; }
            if (typeof id !== 'number')
                throw new Error(id + ' is not a number.');
            if (this.connection.readyState !== this.connection.OPEN)
                return false;
            var msgBin = this.encoder.encode(schemaEncoder ? schemaEncoder.encode(data) : data);
            msgBin[0] = id;
            if (this.onServer)
                this.connection.sendBytes(msgBin);
            else
                this.connection.send(msgBin.buffer);
            return true;
        };
        io_Socket.prototype.on = function (id, cb, schemaEncoder) {
            if (schemaEncoder === void 0) { schemaEncoder = null; }
            this.events[id] = !schemaEncoder
                ? cb
                : function (data) {
                    cb(schemaEncoder.decode(data));
                };
        };
        io_Socket.prototype.disconnect = function (quick) {
            if (quick === void 0) { quick = false; }
            if (quick)
                this.connection.onclose = function () { };
            this.connection.close();
        };
        return io_Socket;
    }());
    Rc.io_Socket = io_Socket;
    var wsBinary = (function () {
        function wsBinary() {
        }
        wsBinary.on = function (id, func) {
            if (id !== 'connection' && id !== 'error')
                throw new Error('Only "connection" and "error" supported.');
            wsBinary.events[id] = func;
        };
        wsBinary.connect = function (url, params) {
            if (typeof WebSocket === 'undefined')
                return null;
            var connection = new WebSocket(url, "echo-protocol");
            connection.binaryType = "arraybuffer";
            return new io_Socket(connection, false, params);
        };
        wsBinary.init = function (server, params) {
            params = params || {};
            var originIsAllowed = params.originIsAllowed || function (origin) {
                return true;
            };
            var WebSocketServer = require('websocket').server;
            var wsServer = new WebSocketServer({
                httpServer: server,
                autoAcceptConnections: false
            });
            wsServer.on('request', function (request) {
                try {
                    if (!originIsAllowed(request.origin)) {
                        request.reject();
                        return;
                    }
                    var connection = request.accept('echo-protocol', request.origin);
                    var socket = new io_Socket(connection, true, params);
                    if (wsBinary.events['connection'])
                        wsBinary.events['connection'](socket);
                }
                catch (err) {
                    if (wsBinary.events['error'])
                        wsBinary.events['error'](err);
                    else
                        throw err;
                }
            });
            return wsBinary;
        };
        wsBinary.events = {};
        return wsBinary;
    }());
    Rc.wsBinary = wsBinary;
    if (typeof exports !== 'undefined')
        exports.wsBinary = wsBinary;
    else
        window['wsBinary'] = wsBinary;
})(Rc || (Rc = {}));
//# sourceMappingURL=ws-binary.js.map