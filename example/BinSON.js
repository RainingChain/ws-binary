/// <reference path="C:\\rc\rainingchain\_references.d.ts"/>
var MODULE_BinSON;
(function (MODULE_BinSON) {
    var START_INDEX = 0;
    var BUFFER_SIZE = 100000;
    var maskTable = new Array(9);
    var powTable = new Array(9);
    var reversePowTable = new Array(9);
    for (var f = 0; f < 9; f++) {
        maskTable[f] = ~((powTable[f] = Math.pow(2, f) - 1) ^ 0xFF);
        reversePowTable[f] = Math.pow(10, f);
    }
    var bitStream = null;
    var decodeBitstream = null;
    var bitValue = 0;
    var bitsLeft = 8;
    var streamIndex = START_INDEX;
    var POS = START_INDEX;
    var errorHandler = function (msg) { logHandler('Error: ' + msg); };
    var logHandler = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        console['log'].apply(console, arguments);
    };
    function write(val, count) {
        var overflow = count - bitsLeft, use = bitsLeft < count ? bitsLeft : count, shift = bitsLeft - use;
        if (overflow > 0) {
            bitValue += val >> overflow << shift;
        }
        else {
            bitValue += val << shift;
        }
        bitsLeft -= use;
        if (bitsLeft === 0) {
            bitStream[POS++] = bitValue;
            bitsLeft = 8;
            bitValue = 0;
            if (overflow > 0) {
                bitValue += (val & powTable[overflow]) << (8 - overflow);
                bitsLeft -= overflow;
            }
        }
    }
    function read(count) {
        var overflow = count - bitsLeft, use = bitsLeft < count ? bitsLeft : count, shift = bitsLeft - use;
        // Wrap bits over to next byte
        var val = (bitValue & maskTable[bitsLeft]) >> shift;
        bitsLeft -= use;
        if (bitsLeft === 0) {
            bitValue = decodeBitstream[++streamIndex];
            bitsLeft = 8;
            if (overflow > 0) {
                val = val << overflow | ((bitValue & maskTable[bitsLeft]) >> 8 - overflow);
                bitsLeft -= overflow;
            }
        }
        if (streamIndex > decodeBitstream.length) {
            return 7;
        }
        return val;
    }
    function _encode(value, top) {
        // Numbers
        if (typeof value === 'number') {
            if (isNaN(value)) {
                value = 0;
                errorHandler('Numberic value is isNaN.');
            }
            else if (value > 214748364) {
                value = 214748364;
                errorHandler('Numberic value is greater than 214748364.');
            }
            else if (value < -214748364) {
                value = -214748364;
                errorHandler('Numberic value is less than -214748364.');
            }
            var type = value !== (value | 0) ? 1 : 0, sign = 0;
            if (value < 0) {
                value = -value;
                sign = 1;
            }
            write(1 + type, 3);
            // Float
            if (type) {
                var shift = 0, step = 10, m = value, tmp = 0;
                // Figure out the exponent
                do {
                    m = value * step;
                    step *= 10;
                    shift++;
                    tmp = m | 0;
                } while (m - tmp > 1 / step && shift < 8 && m < 214748364);
                // Correct if we overshoot
                step = tmp / 10;
                if (step === (step | 0)) {
                    tmp = step;
                    shift--;
                }
                value = tmp;
            }
            // 2 size 0-3: 0 = < 16 1 = < 256 2 = < 65536 3 >=
            if (value < 2) {
                write(value, 4);
            }
            else if (value < 16) {
                write(1, 3);
                write(value, 4);
            }
            else if (value < 256) {
                write(2, 3);
                write(value, 8);
            }
            else if (value < 4096) {
                write(3, 3);
                write(value >> 8 & 0xff, 4);
                write(value & 0xff, 8);
            }
            else if (value < 65536) {
                write(4, 3);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);
            }
            else if (value < 1048576) {
                write(5, 3);
                write(value >> 16 & 0xff, 4);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);
            }
            else if (value < 16777216) {
                write(6, 3);
                write(value >> 16 & 0xff, 8);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);
            }
            else {
                write(7, 3);
                write(value >> 24 & 0xff, 8);
                write(value >> 16 & 0xff, 8);
                write(value >> 8 & 0xff, 8);
                write(value & 0xff, 8);
            }
            write(sign, 1);
            if (type) {
                write(shift, 4);
            }
        }
        else if (typeof value === 'string') {
            var len = value.length;
            write(3, 3);
            if (len > 65535) {
                write(31, 5);
                write(len >> 24 & 0xff, 8);
                write(len >> 16 & 0xff, 8);
                write(len >> 8 & 0xff, 8);
                write(len & 0xff, 8);
            }
            else if (len > 255) {
                write(30, 5);
                write(len >> 8 & 0xff, 8);
                write(len & 0xff, 8);
            }
            else if (len > 28) {
                write(29, 5);
                write(len, 8);
            }
            else {
                write(len, 5);
            }
            // Write a raw string to the stream
            if (bitsLeft !== 8) {
                bitStream[POS++] = bitValue;
                bitValue = 0;
                bitsLeft = 8;
            }
            for (var i = 0; i < len; i++)
                bitStream[POS++] = value.charCodeAt(i);
        }
        else if (typeof value === 'boolean') {
            write(+value, 4);
        }
        else if (value === null || value === undefined || typeof value === 'function') {
            write(7, 3);
            write(0, 1);
        }
        else if (value instanceof Array) {
            write(4, 3);
            for (var i = 0, l = value.length; i < l; i++) {
                _encode(value[i], false);
            }
            if (!top) {
                write(6, 3);
            }
        }
        else {
            write(5, 3);
            for (var e in value) {
                _encode(e, false);
                _encode(value[e], false);
            }
            if (!top) {
                write(6, 3);
            }
        }
    }
    var BinSON = (function () {
        function BinSON() {
        }
        BinSON.init = function (param) {
            param = param || {};
            var bufferSize = param.bufferSize || 100000;
            var startOffset = param.startOffset || 0;
            errorHandler = param.errorHandler || errorHandler;
            logHandler = param.logHandler || logHandler;
            START_INDEX = startOffset;
            if (typeof Buffer !== 'undefined')
                bitStream = new Buffer(bufferSize);
            else if (typeof Uint8Array !== 'undefined') {
                bitStream = new Uint8Array(bufferSize);
                if (!Uint8Array.prototype.slice) {
                    Uint8Array.prototype.slice = function (start, end) {
                        if (typeof end === 'undefined')
                            end = this.length;
                        if (typeof start === 'undefined')
                            start = 0;
                        var a = new Uint8Array(end - start);
                        for (var i = start; i < end; i++)
                            a[i] = this[i];
                        return a;
                    };
                }
            }
            else
                bitStream = new Array(bufferSize);
            return BinSON;
        };
        BinSON.encode = function (value) {
            bitsLeft = 8;
            bitValue = 0;
            POS = START_INDEX;
            _encode(value, true);
            write(7, 3);
            write(1, 1);
            if (bitValue > 0) {
                bitStream[POS++] = bitValue;
            }
            if (POS > bitStream.length)
                errorHandler('Trying to send package larger than the buffer size. Increase via bufferSize parameter. Package size= ' + POS);
            return bitStream.slice(0, POS);
        };
        BinSON.decode = function (data) {
            var stack = [], i = -1, decoded, type, top, value, getKey = false, key, isObj;
            bitsLeft = 8;
            streamIndex = START_INDEX;
            decodeBitstream = data;
            bitValue = decodeBitstream[streamIndex];
            while (true) {
                // Grab type
                type = read(3);
                switch (type) {
                    // Bool
                    case 0:
                        value = read(1) ? true : false;
                        break;
                    // EOS / Stream Overrun / Null
                    case 7:
                        switch (read(1)) {
                            case 1:
                                return decoded;
                            case 7:
                                return undefined;
                            default:
                                value = null;
                        }
                        break;
                    // Integer / Float
                    case 1:
                    case 2:
                        switch (read(3)) {
                            case 0:
                                value = read(1);
                                break;
                            case 1:
                                value = read(4);
                                break;
                            case 2:
                                value = read(8);
                                break;
                            case 3:
                                value = (read(4) << 8)
                                    + read(8);
                                break;
                            case 4:
                                value = (read(8) << 8)
                                    + read(8);
                                break;
                            case 5:
                                value = (read(4) << 16)
                                    + (read(8) << 8)
                                    + read(8);
                                break;
                            case 6:
                                value = (read(8) << 16)
                                    + (read(8) << 8)
                                    + read(8);
                                break;
                            case 7:
                                value = (read(8) << 24)
                                    + (read(8) << 16)
                                    + (read(8) << 8)
                                    + read(8);
                                break;
                        }
                        if (read(1)) {
                            value = -value;
                        }
                        if (type === 2) {
                            value /= reversePowTable[read(4)];
                        }
                        break;
                    // String
                    case 3:
                        var size = read(5);
                        switch (size) {
                            case 31:
                                size = (read(8) << 24)
                                    + (read(8) << 16)
                                    + (read(8) << 8)
                                    + read(8);
                                break;
                            case 30:
                                size = (read(8) << 8)
                                    + read(8);
                                break;
                            case 29:
                                size = read(8);
                                break;
                        }
                        // Read a raw string from the stream
                        if (bitsLeft !== 8) {
                            streamIndex++;
                            bitValue = 0;
                            bitsLeft = 8;
                        }
                        value = '';
                        for (var myI = 0; myI < size; myI++)
                            value += String.fromCharCode(decodeBitstream[streamIndex + myI]);
                        streamIndex += size;
                        bitValue = decodeBitstream[streamIndex];
                        if (getKey) {
                            key = value;
                            getKey = false;
                            continue;
                        }
                        break;
                    // Open Array / Objects
                    case 4:
                    case 5:
                        getKey = type === 5;
                        value = getKey ? {} : [];
                        if (decoded === undefined) {
                            decoded = value;
                        }
                        else {
                            if (isObj) {
                                top[key] = value;
                            }
                            else {
                                top.push(value);
                            }
                        }
                        top = stack[++i] = value;
                        isObj = !(top instanceof Array);
                        continue;
                    // Close Array / Object
                    case 6:
                        top = stack[--i];
                        getKey = isObj = !(top instanceof Array);
                        continue;
                }
                // Assign value to top of stack or return value
                if (isObj) {
                    top[key] = value;
                    getKey = true;
                }
                else if (top !== undefined) {
                    top.push(value);
                }
                else {
                    return value;
                }
            }
        };
        BinSON.compareSize = function (obj) {
            return (1 - BinSON.encode(obj).length / JSON.stringify(obj).length) * 100 + '% smaller';
        };
        BinSON.compareSpeed = function (obj, count) {
            count = count || 100;
            var start = Date.now();
            for (var i = 0; i < count; i++) {
                JSON.stringify(obj);
            }
            var json = Date.now() - start;
            var start = Date.now();
            for (var i = 0; i < count; i++) {
                BinSON.encode(obj);
            }
            return 'x' + (Date.now() - start) / json + ' slower';
        };
        BinSON.dencode = function (obj) {
            return BinSON.decode(BinSON.encode(obj));
        };
        BinSON.testValidity = function (obj, log, name) {
            name = name || '';
            var a = JSON.parse(JSON.stringify(obj));
            a = BinSON.convertFloatToInt(a, true);
            var goal = JSON.stringify(a);
            var res = JSON.stringify(BinSON.dencode(a));
            var same = goal === res;
            if (log && !same && name.length > 5) {
                logHandler('##################\r\nnot same @ ' + name);
                logHandler('original', obj);
                logHandler('##########');
                logHandler('goal', goal);
                logHandler('##########');
                logHandler('BinSON', res);
                logHandler('###################');
                for (var i in obj)
                    BinSON.testValidity(obj[i], true, name + '.' + i);
            }
            return same;
        };
        BinSON.convertFloatToInt = function (obj, cap32Bit) {
            /*jshint bitwise: false */
            if (typeof obj === 'number')
                return obj | 0;
            if (obj === null || typeof obj !== 'object')
                return obj;
            for (var i in obj) {
                if (typeof obj[i] === 'number') {
                    if (cap32Bit && obj[i] > 214748364)
                        obj[i] = 214748364;
                    if (cap32Bit && obj[i] < 214748364)
                        obj[i] = -214748364;
                    obj[i] = obj[i] | 0;
                }
                else if (obj[i] !== null && typeof obj[i] === 'object')
                    BinSON.convertFloatToInt(obj[i], cap32Bit);
            }
            return obj;
            /*jshint bitwise: true */
        };
        BinSON.unitTest = function () {
            var assert = function (id, t) { if (!t)
                throw new Error(id); };
            var obj = {
                x: 1000,
                y: 1000,
                b: {
                    c: [
                        'asdasd',
                        1,
                        null,
                        [
                            10
                        ]
                    ],
                    d: {
                        h: 'asdasdas'
                    },
                    e: null
                }
            };
            var res = BinSON.dencode(obj);
            assert(0, res.x === 1000);
            assert(0.1, res.b.c[0] === 'asdasd');
            assert(0.1, res.b.e === null);
            assert(0.1, res.c[3][0] === 10);
        };
        return BinSON;
    }());
    MODULE_BinSON.BinSON = BinSON;
    if (typeof exports !== 'undefined') {
        exports.init = function (param) {
            return BinSON.init(param);
        };
        exports.BinSON = BinSON;
    }
    else {
        window['BinSON'] = BinSON;
    }
})(MODULE_BinSON || (MODULE_BinSON = {}));
/**
  * Copyright (c) 2009-2012 Ivo Wetzel.
 
    var p = {};

    dance: for(var i in player){
        p[i] = player[i];
        INFO(i);
        var r = BinSON.decode(BinSON.encode(p));
        for(var j in p)
            if(r[j] === undefined){
                INFO('!!broke!!');
                INFO(r);
                break dance;
            }
    }
  
  
    if(Math.random() < 0.02){
            var start = Date.now();
            for(var i = 0 ; i < 200; i++){
                sock   et.emit('change2', sa);
            }
            var json = Date.now()-start;
            
            var start = Date.now();
            for(var i = 0 ; i < 200; i++){
                soc   ket.emit('change2', BinSON.encode(sa));
            }
            INFO('bison=',Date.now()-start,'json=',json,JSON.stringify(sa));
        }
  
  
  
  
  */ 
//# sourceMappingURL=BinSON.js.map