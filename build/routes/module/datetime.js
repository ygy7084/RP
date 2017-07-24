'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     서버에서 한국 시간 문자열을 출력한다.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     서버 내 엑셀 출력을 위함.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var days = ['일', '월', '화', '수', '목', '금', '토'];

var datetime = function () {
    function datetime(date) {
        _classCallCheck(this, datetime);

        this.dateObj = {};
        this.dateFormat = _momentTimezone2.default.tz(new Date(date), "Asia/Seoul").format();
        var regex = /[0-9]+(?=[-T])|[0-9]+(?=:)/gmi;
        var str = this.dateFormat;
        var m = void 0;
        var index = 0;
        while ((m = regex.exec(str)) !== null && index < 5) {
            switch (index) {
                case 0:
                    this.dateObj.year = parseInt(m[0]);
                    break;
                case 1:
                    this.dateObj.month = parseInt(m[0]);
                    break;
                case 2:
                    this.dateObj.date = parseInt(m[0]);
                    break;
                case 3:
                    this.dateObj.hour = m[0];
                    break;
                case 4:
                    this.dateObj.minute = m[0];
                    break;
            }
            index++;
        }
    }

    _createClass(datetime, [{
        key: 'year',
        get: function get() {
            return this.dateObj.year;
        }
    }, {
        key: 'month',
        get: function get() {
            return this.dateObj.month;
        }
    }, {
        key: 'date',
        get: function get() {
            return this.dateObj.date;
        }
    }, {
        key: 'day',
        get: function get() {
            return new Date(this.year, this.month - 1, this.date).getDay();
        }
    }, {
        key: 'hour',
        get: function get() {
            return this.dateObj.hour;
        }
    }, {
        key: 'minute',
        get: function get() {
            return this.dateObj.minute;
        }
    }, {
        key: 'datetimeString',
        get: function get() {
            return this.year + '-' + this.month + '-' + this.date + '-' + days[this.day] + '-' + this.hour + ':' + this.minute;
        }
    }]);

    return datetime;
}();

exports.default = datetime;