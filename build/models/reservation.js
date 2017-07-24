'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Reservation 스키마
 input_date,          //예약이 입력된 시간 및 날짜
 source,              //공연 예매 출처
 customer_name,       //고객 성함
 customer_phone,      //고객 번호(뒷 4자리)
 group_name,          //단체 명
 show_date : '',      //공연 날짜 및 시간 (DATE 객체)
 seat_class : '',     //좌석 등급
 seat_position : {    //좌석 위치 -> 없을 시 null
 floor,
 col,
 num
 },
 ticket_quantity,     //티켓 수량
 ticket_code,         //예약 번호, 주문 번호, 티켓 번호 등 각 사이트별 코드
 ticket_price,        //티켓 가격
 theater,             //공연장 참조
 show,                 //공연 참조
 printed               //발권 유무,
 dilievered,           //할당 유무
 discount              //할인내역
 */
var Schema = _mongoose2.default.Schema;
var Reservation = new Schema({
    input_date: Date,
    source: String,
    customer_name: String,
    customer_phone: String,
    group_name: String,
    show_date: Date,
    seat_class: String,
    seat_position: {
        floor: String,
        col: String,
        num: String
    },
    seat_serialNumber: Number,
    ticket_quantity: Number,
    ticket_code: String,
    ticket_price: Number,
    theater: { type: Schema.Types.ObjectId, ref: 'theater' },
    show: { type: Schema.Types.ObjectId, ref: 'show' },
    printed: Boolean,
    delivered: Boolean,
    discount: String
});

Reservation.index({ source: 1, show_date: 1, ticket_code: 1 }, { unique: true, sparse: true });
Reservation.index({ theater: 1, show: 1, show_date: 1, 'seat_position.floor': 1, 'seat_position.col': 1, 'seat_position.num': 1 }, { unique: true,
    partialFilterExpression: {
        'seat_position.floor': { $exists: true },
        'seat_position.col': { $exists: true },
        'seat_position.num': { $exists: true }
    } });

var model = _mongoose2.default.model('reservation', Reservation);

exports.default = model;