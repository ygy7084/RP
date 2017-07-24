'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _mongooseFunction = require('mongoose-function');

var _mongooseFunction2 = _interopRequireDefault(_mongooseFunction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//함수를 저장할 수 있도록
(0, _mongooseFunction2.default)(_mongoose2.default);

/* Excel 스키마
 source,                     //예매 출처 ex)쿠팡
 parsing_rule :              //파싱 규칙
     customer_name :         //고객명
              field,         //엑셀상의 필드 - ex)쿠폰구매자
              code           //파싱을 진행하는 함수 코드의 문자열

                             //파싱함수 예제
                             //파싱함수의 input은 cell의 raw 데이터이다.
                             //모든 빈칸 및 공백이 제거된 상태로 input된다.

                             "function(cell_value) {
                             let regex;
                             let return_value;
                             regex = new RegExp('[0-9][0-9](?=월)');
                             return_value = regex.exec(cell_value)[0];
                             return_value = parseInt(return_value);
                             return return_value;\n" +
                             };"

     customer_phone,         //고객 번호(뒷 4자리)
     show_date_year,         //공연 연도
     show_date_month,        //공연 월
     show_date_day,          //공연 일
     show_time_hour,         //공연 시간
     show_time_minute,       //공연 분
     seat_class,             //좌석 등급
     seat_position_floor,    //좌석 층
     seat_position_col,      //좌석 열
     seat_position_num,      //좌석 번호
     ticket_quantity,        //티켓 수량
     ticket_code,            //티켓 코드
     ticket_price,           //티켓 가격
     discount                //할인 내역
*/
var Schema = _mongoose2.default.Schema;
var Excel = new Schema({
    source: String,
    parsing_rule: {
        customer_name: {
            field: String,
            code: Function
        },
        customer_phone: {
            field: String,
            code: Function
        },
        show_date_year: {
            field: String,
            code: Function
        },
        show_date_month: {
            field: String,
            code: Function
        },
        show_date_day: {
            field: String,
            code: Function
        },
        show_time_hour: {
            field: String,
            code: Function
        },
        show_time_minute: {
            field: String,
            code: Function
        },
        seat_class: {
            field: String,
            code: Function
        },
        seat_position_floor: {
            field: String,
            code: Function
        },
        seat_position_col: {
            field: String,
            code: Function
        },
        seat_position_num: {
            field: String,
            code: Function
        },
        ticket_quantity: {
            field: String,
            code: Function
        },
        ticket_code: {
            field: String,
            code: Function
        },
        ticket_price: {
            field: String,
            code: Function
        },
        discount: {
            field: String,
            code: Function
        }
    }
});

//source 값은 유일하다 ex)쿠팡
Excel.index({ source: 1 }, { unique: true });

var model = _mongoose2.default.model('excel', Excel);

exports.default = model;