'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _crawler = require('crawler');

var _crawler2 = _interopRequireDefault(_crawler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var crawler = function crawler(url) {
    return new Promise(function (resolve, reject) {
        new _crawler2.default({
            maxConnections: 10,
            callback: function callback(error, res, done) {
                if (error) {
                    console.log(error);
                } else {
                    var $ = res.$;
                    var found = $(".stySeat");
                    var array = [];
                    for (var i in found) {
                        if (found[i].attribs && found[i].attribs.alt) {
                            var seatInfo = found[i].attribs.alt;
                            var seat = {
                                seat_class: new RegExp('[a-zA-Z]+(?=석)').exec(seatInfo)[0],
                                floor: new RegExp('[0-9](?=층)').exec(seatInfo)[0],
                                col: new RegExp('[가-힣](?=열)').exec(seatInfo)[0],
                                num: new RegExp('[0-9]+$').exec(seatInfo)[0]
                            };
                            array.push(seat);
                        }
                    }
                    done();
                    resolve(array);
                }
            } }).queue(url);
    });
};

exports.default = crawler;