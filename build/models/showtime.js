'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Show 스키마
 show,    // 공연 ID
 theater, // 공연장 ID
 schedule :[{
    date,    // 공연 날짜 및 시각
    url,     // 크롤링 url
    reservations    // 예약 ID
    }]
 */
var Schema = _mongoose2.default.Schema;
var Showtime = new Schema({
    theater: { type: Schema.Types.ObjectId, ref: 'theater' },
    show: { type: Schema.Types.ObjectId, ref: 'show' },
    schedule: [{
        _id: false,
        date: Date,
        url: String,
        reservations: [{ _id: { type: Schema.Types.ObjectId, ref: 'reservation' } }]
    }]
});

Showtime.index({ theater: 1, show: 1 }, { unique: true });

var model = _mongoose2.default.model('showtime', Showtime);

exports.default = model;