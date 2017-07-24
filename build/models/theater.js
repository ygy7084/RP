'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Reservation 스키마
 name,    // 공연장 이름
 seats_quantity,  // 좌석 수량
 seats            // 좌석
                  //ex)좌석 예제
 seats : [ {floor, col, num, seat_class, x, y}, ...] //x,y는 필요시 화면상의 좌표
 */
var Schema = _mongoose2.default.Schema;
var Theater = new Schema({
    name: String,
    seats_quantity: Number,
    seats: [{
        _id: false,
        serialNum: Number,
        floor: String,
        col: String,
        num: String,
        seat_class: String,
        x: Number,
        y: Number
    }]
});

Theater.index({ name: 1 }, { unique: true });

var model = _mongoose2.default.model('theater', Theater);

exports.default = model;