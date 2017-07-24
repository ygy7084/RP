'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _models = require('../models');

var _xlsx = require('xlsx');

var _xlsx2 = _interopRequireDefault(_xlsx);

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _module = require('./module');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

// 파일 업로드 모듈. 최대 사이즈 : 30MB
var upload = (0, _multer2.default)({
    storage: _multer2.default.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 30 }
});

router.post('/parse/showtime', upload.single('file'), function (req, res) {
    //차후 show의 schedule 업데이트할 주소
    //<1. 엑셀 파일 로드>
    //엑셀 파일 버퍼 읽기
    var Excel_file_buffer = req.file.buffer;
    var Excel_file = _xlsx2.default.read(Excel_file_buffer);

    //엑셀 시트 읽기
    var Excel_sheet = Excel_file.Sheets[Excel_file.SheetNames[0]];
    var Excel_sheet_range = _xlsx2.default.utils.decode_range(Excel_sheet['!ref'].toString());

    var columns_parser = {
        date: 0,
        time: 1,
        url: 2
    };
    var parsed = [];

    for (var r = Excel_sheet_range.s.r; r <= Excel_sheet_range.e.r; r++) {
        var row = {};
        for (var col in columns_parser) {
            var cell_address = _xlsx2.default.utils.encode_cell({ c: columns_parser[col], r: r });
            row[col] = Excel_sheet[cell_address].v;
        }
        parsed.push(row);
    }

    var results = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = parsed[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var o = _step.value;

            var obj = {
                date: '',
                url: o.url
            };
            var year = new RegExp('[0-9]+(?=년)').exec(o.date)[0];
            var mon = new RegExp('[0-9]+(?=월)').exec(o.date)[0];
            var day = new RegExp('[0-9]+(?=일)').exec(o.date)[0];
            var hour = new RegExp('[0-9]+(?=시)').exec(o.time)[0];
            var min = new RegExp('[0-9]+(?=분)').exec(o.time)[0];
            obj.date = new Date(_momentTimezone2.default.tz([year, mon - 1, day, hour, min], 'Asia/Seoul').format());

            results.push(obj);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    res.json({ data: results });
});
router.post('/parse/theater', upload.single('file'), function (req, res) {
    /*
     column은 반드시 다음의 순서를 맞춰야 한다.
     층 수, 열, 번호, 등급
     */
    //엑셀 파일 버퍼 읽기
    var Excel_file_buffer = req.file.buffer;
    var Excel_file = _xlsx2.default.read(Excel_file_buffer);

    //엑셀 시트 읽기
    var Excel_sheet = Excel_file.Sheets[Excel_file.SheetNames[0]];
    var Excel_sheet_range = _xlsx2.default.utils.decode_range(Excel_sheet['!ref'].toString());

    var columns_parser = {
        floor: 0,
        col: 1,
        num: 2,
        seat_class: 3
    };
    var seats = [];
    for (var r = Excel_sheet_range.s.r; r <= Excel_sheet_range.e.r; r++) {
        var seat = {};
        for (var col in columns_parser) {

            var cell_address = _xlsx2.default.utils.encode_cell({ c: columns_parser[col], r: r });
            seat[col] = Excel_sheet[cell_address].v;
        }
        seats.push(seat);
    }
    res.json({ data: seats });
});
// 엑셀 파일 업로드
/*
 <프로세스>
 1. 엑셀 파일 로드
 2. 파싱 데이터 로드
 3. 파싱
 4. 파싱되지 않은 값에 기본값 대입
 5. 파싱된 데이터를 통해 예매 데이터로 변환
 6. 예매 데이터 출력
 */
router.post('/parse/reservation', upload.single('file'), function (req, res) {

    //<1. 엑셀 파일 로드>
    //엑셀 파일 버퍼 읽기
    var Excel_file_buffer = req.file.buffer;
    var Excel_file = _xlsx2.default.read(Excel_file_buffer);

    //엑셀 시트 읽기
    var Excel_sheet = Excel_file.Sheets[Excel_file.SheetNames[0]];
    var Excel_sheet_range = _xlsx2.default.utils.decode_range(Excel_sheet['!ref'].toString());

    //<2. 파싱 데이터 로드>
    //source(ex.쿠팡)를 이용하여 엑셀 파싱 데이터 로드
    /* 파싱할 값. 필수->반드시 파싱되어야 할 값
     customer_name,         //필수 - 고객 이름
     customer_phone,        //필수 - 고객 번호 (뒤 4자리)
     show_date_year,        //없을 시 month가 현재 월보다 작으면 올해+1 아니면 올해 - 공연 연도
     show_date_month,       //필수 - 공연 월
     show_date_day,         //필수 - 공연 일
     show_time_hour,        //필수 - 공연 시간
     show_time_minute,      //없을 시 0 - 공연 분
     seat_class,            //필수 - 좌석 등급
     seat_position_floor,   //없을 시 undefined - 좌석 층수
     seat_position_col,     //없을 시 undefined - 좌석 열
     seat_position_num,     //없을 시 undefined - 좌석 번호
     ticket_quantity,       //없을 시 1 - 티켓 수량
     ticket_code,           //필수 - 예약 번호, 주문 번호, 티켓 번호 등 각 사이트별 코드
     ticket_price,          //필수 - 티켓 가격
     discount               //없을시 undefined
     */
    //타 조회처럼 Excel.find().lean().exec()으로 조회시 검색 시간이 빨라지나,
    //파싱 데이터에 저장된 함수를 Mongoose가 함수로 파싱하지 못한다.
    _models.Excel.find({ _id: req.body._id }).exec(function (err, results) {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Excel Upload Error - ' + err.message });
        }

        var excel = results[0]; //단순 object가 아니라 mongoose object 파일이다.(함수 정보 존


        //<3. 파싱>
        //필드가 들어있는 row의 위치를 찾아 저장한다.
        //모든 필드는 같은 row에 있어야 한다.
        //엑셀 파싱 데이터의 customer_name에 있는 필드명은 반드시 있어야 한다.
        var key = excel.parsing_rule.customer_name.field;
        var field_row = -1;
        for (var r = Excel_sheet_range.s.r; r <= Excel_sheet_range.e.r; r++) {
            for (var c = Excel_sheet_range.s.c; c <= Excel_sheet_range.e.c; c++) {
                var cell_address = _xlsx2.default.utils.encode_cell({ c: c, r: r });
                if (Excel_sheet[cell_address] && Excel_sheet[cell_address].v === key) {
                    field_row = r;
                }
            }
        }
        //필드가 있는 row를 못찾으면 에러 리턴
        if (field_row === -1) {
            return res.status(400).json({ message: 'Excel Upload Error - ' + 'cannot find customer_name in excel file' });
        }

        //필드 row에서 필드명에 따른 column의 위치를 저장
        for (var _c = Excel_sheet_range.s.c; _c <= Excel_sheet_range.e.c; _c++) {

            var _cell_address = _xlsx2.default.utils.encode_cell({ c: _c, r: field_row });

            for (var i in excel.parsing_rule) {
                if (excel.parsing_rule.hasOwnProperty(i)) {

                    if (excel.parsing_rule[i] && excel.parsing_rule[i].field === Excel_sheet[_cell_address].v) {

                        excel.parsing_rule[i].c = _c;
                    } else {}
                }
            }
        }

        //파싱 데이터에 필드명이 있는데 칼럼을 못찾았을 경우 에러 리턴
        for (var _i in excel.parsing_rule) {
            if (excel.parsing_rule.hasOwnProperty(_i)) {
                if (excel.parsing_rule[_i] && excel.parsing_rule[_i].field) {

                    if (excel.parsing_rule[_i].c !== 0 && !excel.parsing_rule[_i].c || excel.parsing_rule[_i].c === '') {
                        return res.status(400).json({ message: 'Excel Upload Error - ' + 'cannot parse ' + _i });
                    }
                }
            }
        }

        //파싱한 내용을 저장할 객체 초기화
        var parsed_rows = {};
        for (var row = field_row + 1; row <= Excel_sheet_range.e.r; row++) {
            parsed_rows[row] = {};
        }

        try {
            //파싱 진행
            for (var _i2 in excel.parsing_rule) {

                if (excel.parsing_rule.hasOwnProperty(_i2) && excel.parsing_rule[_i2] && excel.parsing_rule[_i2].field && (excel.parsing_rule[_i2].c || excel.parsing_rule[_i2].c === 0)) {
                    for (var _row = field_row + 1; _row <= Excel_sheet_range.e.r; _row++) {
                        //셀의 내용 접근
                        var _cell_address2 = _xlsx2.default.utils.encode_cell({ c: excel.parsing_rule[_i2].c, r: _row });

                        //v는 셀의 내용의 raw 데이터
                        var cell_data = Excel_sheet[_cell_address2].v;
                        //정규식을 이용한 파싱 직전에 셀의 내용에서 공백과 빈칸을 전부 없앤다.
                        if (typeof cell_data === 'string') cell_data = cell_data.replace(/\s/gi, "");
                        //정규식을 이용한 파싱 (정규식 코드 없으면 셀 내용 변경 안함)
                        if (excel.parsing_rule[_i2] && excel.parsing_rule[_i2].code) {
                            // console.log(i +' - '+Excel_sheet[cell_address]);
                            cell_data = excel.parsing_rule[_i2].code(cell_data);
                        }
                        parsed_rows[_row][_i2] = cell_data;
                    }
                }
            }
        } catch (e) {
            console.log(e);
            return res.status(400).json({ message: 'Excel Upload Error - ' + '파싱 코드에 문제가 있습니다.' });
        }

        //<4. 파싱되지 않은 값에 기본값 대입>
        //필수적인 파싱 데이터 존재 확인. 필수적이지 않은 데이터는 파싱되지 않았을 시 기본값으로 초기화
        var parsed_rows_array = [];
        for (var _i3 in parsed_rows) {
            var o = parsed_rows[_i3];
            //필수 데이터 확인
            if (!(o['customer_name'] && o['customer_phone'] && o['show_date_month'] && o['show_date_day'] && o['show_time_hour'] && o['seat_class'] && o['ticket_code'] && o['ticket_price'])) {
                return res.status(400).json({ message: 'Excel Upload Error - ' + '필수적인 파싱 내용 빠짐' });
            }
            //공연 연도 미입력 시 현재 연도 입력.
            //단, 현재 월보다 공연 월이 적은 값일 경우 내년이라고 인식하고 현재 연도+1을 입력
            if (!o['show_date_year']) {
                var month = o['show_date_month'];

                var current_month = new Date((0, _momentTimezone2.default)().tz("Asia/Seoul").format()).getMonth() + 1;
                var year = new Date((0, _momentTimezone2.default)().tz("Asia/Seoul").format()).getFullYear();
                if (month < current_month) year++;
                o['show_date_year'] = year;
            }
            //분 초기화 -> 0
            if (!o['show_time_minute']) {
                o['show_time_minute'] = 0;
            }
            //층수 초기화
            if (!o['seat_position_floor']) {
                o['seat_position_floor'] = undefined;
            }
            // 열 초기화
            if (!o['seat_position_col']) {
                o['seat_position_col'] = undefined;
            }
            // 번호 초기화
            if (!o['seat_position_num']) {
                o['seat_position_num'] = undefined;
            }
            // 티켓 수량 초기화
            if (!o['ticket_quantity']) {
                o['ticket_quantity'] = 1;
            }
            // 할인 초기화
            if (!o['discount']) {
                o['discount'] = undefined;
            }
            parsed_rows_array.push(o);
        }

        //<5. 파싱된 데이터를 통해 예매 데이터로 변환>
        /*파싱된 데이터를 통해 표준 예매 데이터로 변환
         source,              //공연 예매 출처
         customer_name,       //고객 성함
         customer_phone,      //고객 번호(뒷 4자리)
         show_date : '',      //공연 날짜 및 시간 (DATE 객체)
         seat_class : '',     //좌석 등급
         seat_position : {    //좌석 위치 -> 없을 시 undefined
         floor,
         col,
         num
         },
         ticket_quantity,     //티켓 수량
         ticket_code,         //예약 번호, 주문 번호, 티켓 번호 등 각 사이트별 코드
         ticket_price,        //티켓 가격
         theater,             //공연장 참조
         show,                //공연 참조
         discount             //할인 내역
         */
        var outputs = [];
        for (var _i4 = 0; _i4 < parsed_rows_array.length; _i4++) {
            var _row2 = parsed_rows_array[_i4];
            var output = {};
            output.source = excel.source;
            output.customer_name = _row2.customer_name;
            output.customer_phone = _row2.customer_phone;

            output.show_date = new Date(_momentTimezone2.default.tz([_row2.show_date_year, _row2.show_date_month - 1, _row2.show_date_day, _row2.show_time_hour, _row2.show_time_minute], 'Asia/Seoul').format());

            output.seat_class = _row2.seat_class;
            if (!_row2.seat_position_floor && !_row2.seat_position_col && !_row2.seat_position_num) output.seat_position = undefined;else output.seat_position = {
                floor: _row2.seat_position_floor,
                col: _row2.seat_position_col,
                num: _row2.seat_position_num
            };
            output.ticket_quantity = _row2.ticket_quantity;
            output.ticket_code = _row2.ticket_code;
            output.ticket_price = _row2.ticket_price;
            output.theater = req.body.theater;
            output.show = req.body.show;
            output.discount = _row2.discount;
            outputs.push(output);
        }

        //<6. 예매 데이터 출력>
        return res.json({
            data: outputs
        });
    });
});
router.post('/parse/naverReservation', upload.single('file'), function (req, res) {

    //엑셀 파일 버퍼 읽기
    var Excel_file_buffer = req.file.buffer;
    var Excel_file = _xlsx2.default.read(Excel_file_buffer);

    //엑셀 시트 읽기
    var Excel_sheet = Excel_file.Sheets[Excel_file.SheetNames[0]];
    var Excel_sheet_range = _xlsx2.default.utils.decode_range(Excel_sheet['!ref'].toString());

    var wb = _xlsx2.default.utils.book_new();
    var ws_name = "naver";
    //
    var ws_data = [[]];

    var field_row = -1;
    for (var r = Excel_sheet_range.s.r; r <= Excel_sheet_range.e.r; r++) {
        for (var c = Excel_sheet_range.s.c; c <= Excel_sheet_range.e.c; c++) {
            var cell_address = _xlsx2.default.utils.encode_cell({ c: c, r: r });
            if (Excel_sheet[cell_address] && Excel_sheet[cell_address].v === '예약번호') {
                field_row = r;
            }
        }
    }
    //         //필드가 있는 row를 못찾으면 에러 리턴
    if (field_row === -1) {}
    // return res.status(400).json({message:'Excel Upload Error - '+'cannot find customer_name in excel file'});


    //필드 row에서 필드명에 따른 column의 위치를 저장
    var columns = [];
    for (var _c2 = Excel_sheet_range.s.c; _c2 <= Excel_sheet_range.e.c; _c2++) {
        var _cell_address3 = _xlsx2.default.utils.encode_cell({ c: _c2, r: field_row });

        var cell_data = Excel_sheet[_cell_address3].v;
        columns.push(cell_data);
        ws_data[0].push(cell_data);
    }
    ws_data[0].push('좌석등급');
    ws_data[0].push('티켓가격');

    var prohibitedIndex = {
        ticket_quantity: columns.findIndex(function (s) {
            return s === '수량';
        }),
        ticket_quantity_VIP: columns.findIndex(function (s) {
            return s === '가격분류1-VIP석_네이버예약60%할인';
        }),
        ticket_quantity_R: columns.findIndex(function (s) {
            return s === '가격분류2-R석_네이버예약시60%할인';
        }),
        ticket_price: columns.findIndex(function (s) {
            return s === '실결제금액';
        })
    };

    for (var row = field_row + 1; row <= Excel_sheet_range.e.r; row++) {
        var ticket_quantity = parseInt(Excel_sheet[_xlsx2.default.utils.encode_cell({ c: prohibitedIndex.ticket_quantity, r: row })].v);
        var ticket_quantity_VIP = parseInt(Excel_sheet[_xlsx2.default.utils.encode_cell({ c: prohibitedIndex.ticket_quantity_VIP, r: row })].v);
        var ticket_quantity_R = parseInt(Excel_sheet[_xlsx2.default.utils.encode_cell({ c: prohibitedIndex.ticket_quantity_R, r: row })].v);

        var ticket_price_temp = Excel_sheet[_xlsx2.default.utils.encode_cell({ c: prohibitedIndex.ticket_price, r: row })].v;
        var split = ticket_price_temp.split(',');
        var _r = '';
        for (var i = 0; i < split.length; i++) {
            _r = _r.concat(split[i]);
        }
        var ticket_price = parseInt(_r);

        var ticket_code_index = columns.findIndex(function (s) {
            return s === '예약번호';
        });

        for (var _i5 = 0; _i5 < ticket_quantity_VIP; _i5++) {
            var row_data = [];
            for (var _c3 = Excel_sheet_range.s.c; _c3 <= Excel_sheet_range.e.c; _c3++) {
                if (_c3 === prohibitedIndex.ticket_quantity || _c3 === prohibitedIndex.ticket_quantity_VIP || _c3 === prohibitedIndex.ticket_quantity_R || _c3 === prohibitedIndex.ticket_price) {

                    row_data.push('');
                    continue;
                }

                var _cell_address4 = _xlsx2.default.utils.encode_cell({ c: _c3, r: row });

                var _cell_data = Excel_sheet[_cell_address4].v;

                if (_c3 === ticket_code_index) _cell_data += '-' + (_i5 + 1);

                row_data.push(String(_cell_data));
            }
            row_data.push('VIP');
            row_data.push(parseInt(ticket_price) / parseInt(ticket_quantity));
            ws_data.push(row_data);
        }
        for (var _i6 = 0; _i6 < ticket_quantity_R; _i6++) {
            var _row_data = [];
            for (var _c4 = Excel_sheet_range.s.c; _c4 <= Excel_sheet_range.e.c; _c4++) {
                if (_c4 === prohibitedIndex.ticket_quantity || _c4 === prohibitedIndex.ticket_quantity_VIP || _c4 === prohibitedIndex.ticket_quantity_R || _c4 === prohibitedIndex.ticket_price) {

                    _row_data.push('');
                    continue;
                }

                var _cell_address5 = _xlsx2.default.utils.encode_cell({ c: _c4, r: row });

                var _cell_data2 = Excel_sheet[_cell_address5].v;

                if (_c4 === ticket_code_index) _cell_data2 += '-' + (_i6 + 1 + ticket_quantity_VIP);

                _row_data.push(String(_cell_data2));
            }
            _row_data.push('R');
            _row_data.push(Math.round(parseInt(ticket_price) / parseInt(ticket_quantity)));
            ws_data.push(_row_data);
        }
    }

    var ws = _xlsx2.default.utils.aoa_to_sheet(ws_data);

    wb.SheetNames.push(ws_name);

    wb.Sheets[ws_name] = ws;

    _tmp2.default.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) throw err;
        _xlsx2.default.writeFile(wb, path);
        return res.download(path, 'naver.xlsx');
    });
});

router.post('/ticketExcel', function (req, res) {
    var wb = _xlsx2.default.utils.book_new();
    var ws_name = "tickets";

    var ws_data = [["단체명", "공연일시", "발권인원", "좌석등급", "판매가", "좌석번호"]];

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = req.body.data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var r = _step2.value;

            var date = new _module.datetime(r.show_date);

            ws_data.push([r.source, date.datetimeString, r.ticket_quantity, r.seat_class, r.ticket_price, r.seat_position.col + '열 ' + r.seat_position.num + '번']);
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    var ws = _xlsx2.default.utils.aoa_to_sheet(ws_data);

    wb.SheetNames.push(ws_name);

    wb.Sheets[ws_name] = ws;

    _tmp2.default.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) throw err;
        _xlsx2.default.writeFile(wb, path);
        return res.download(path, 'tickets.xlsx');
    });
});
router.get('/showtime/:showtime/date/:date', function (req, res) {
    var input = {
        showtime: req.params.showtime,
        date: new Date(parseInt(req.params.date))
    };

    _models.Showtime.find({ _id: input.showtime }).populate('theater').exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Data Read Error - ' + err.message });
        }
        if (!results || results.length < 1) {
            return res.status(500).json({ message: 'Data Read Error - ' + '공연일정(Showtime)을 _id로 찾을 수 없습니다.' });
        }
        if (!results[0].theater) {
            return res.status(500).json({ message: 'Data Read Error - ' + '공연장(Theater)을 _id로 찾을 수 없습니다.' });
        }

        var schedules = results[0].schedule;
        var theater_seats = results[0].theater.seats;
        var Arr = [];

        var i = 0;
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = theater_seats[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var seat = _step3.value;

                Arr.push({
                    num: ++i,
                    show_date: input.date,
                    ticket_quantity: 1, // 좌석 당 예약은 하나
                    seat_class: seat.seat_class,
                    ticket_price: seat.seat_class === 'VIP' ? 50000 : seat.seat_class === 'R' ? 40000 : undefined,
                    seat_position: { col: seat.col, num: seat.num },
                    source: undefined,
                    group_name: undefined,
                    customer_name: undefined,
                    customer_phone: undefined,
                    discount: undefined
                });
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        var schedule = void 0;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = schedules[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var s = _step4.value;

                if (new Date(s.date).getTime() === parseInt(req.params.date)) schedule = s;
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        var wrapper = {
            data: input
        };
        fetch(req.protocol + '://' + req.get('Host') + '/api/showtime/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wrapper)
        }).then(function (response) {
            if (response.ok) return response.json();else return response.json().then(function (err) {
                throw err;
            });
        }).then(function (response) {

            /*
              본 주석 코드를 사용하면
            크롤링 된 내역들이 '인터파크' , '미확인' 으로 기본적으로 들어간다.
               */
            // const crawled_seats = response.data;
            //
            // const reserved_seats = theater_seats.filter((ts) => {
            //     return crawled_seats.filter((cs) => {
            //             return ts.col===cs.col && ts.floor === cs.floor && ts.num === cs.num
            //         }).length===0;
            // });
            // for(let c of reserved_seats) {
            //     let obj = Arr.find((item) => {
            //         if (
            //             item.seat_position.col === c.col &&
            //             item.seat_position.num === c.num
            //         )
            //             return true;
            //     });
            //     if(obj) {
            //         obj.source = '인터파크';
            //         obj.customer_name = '미확인';
            //         obj.customer_phone = '미확인';
            //     }
            //
            // }


            _models.Reservation.populate(schedule.reservations, { path: '_id' }, function (err, results) {
                results.forEach(function (r) {
                    var reservation = r._id; // _id로 객체가 감싸여 있다,
                    //mongoose documnet to javascript object
                    if (reservation && reservation.seat_position && reservation.seat_position.col && reservation.seat_position.num) {

                        var obj = Arr.find(function (item) {
                            if (item.seat_position.col === reservation.seat_position.col && item.seat_position.num === reservation.seat_position.num) return true;
                        });

                        if (obj) {
                            obj.customer_name = reservation.customer_name;
                            obj.customer_phone = reservation.customer_phone;
                            obj.group_name = reservation.group_name;
                            obj.source = reservation.source;
                            obj.ticket_price = reservation.ticket_price;
                            obj.discount = reservation.discount;
                        } else {
                            // console.log(reservation.seat_position);
                        }
                    }
                });

                var wb = _xlsx2.default.utils.book_new();
                var ws_name = "reservations";
                var ws_data = [["일련번호", "공연일시", "발권인원", "좌석등급", "판매가", "좌석번호", "구매처", "단체명", "구매자성명", "전화번호", "할인내역"]];

                var ws_body = [];
                var ws_body2 = [];

                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = Arr[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var r = _step5.value;

                        for (var prop in r) {
                            r[prop] = r[prop] ? r[prop] : '';
                        }var _date = new _module.datetime(r.show_date);

                        ws_body.push([0, _date.datetimeString, String(r.ticket_quantity), String(r.seat_class), String(r.ticket_price), r.seat_position.col + '열 ' + r.seat_position.num + '번', r.source, r.group_name, r.customer_name, String(r.customer_phone), r.discount]);
                        ws_body2.push({
                            serialNum: null,
                            col: r.seat_position.col,
                            num: r.seat_position.num
                        });
                    }
                } catch (err) {
                    _didIteratorError5 = true;
                    _iteratorError5 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion5 && _iterator5.return) {
                            _iterator5.return();
                        }
                    } finally {
                        if (_didIteratorError5) {
                            throw _iteratorError5;
                        }
                    }
                }

                var infoForSeatsSerial = [];
                var temp_infoForSeatsSerial = [];

                var result = [];
                var temp = [];

                var n = 0;
                for (var _i7 = 0; _i7 < ws_body.length; _i7++) {
                    if (ws_body[_i7][6] === '인터파크') {
                        ws_body[_i7][0] = ++n;
                        result.push(ws_body[_i7]);

                        ws_body2[_i7].serialNum = n;
                        infoForSeatsSerial.push(ws_body2[_i7]);
                    } else {
                        temp.push(ws_body[_i7]);
                        temp_infoForSeatsSerial.push(ws_body2[_i7]);
                    }
                }

                for (var _i8 = 0; _i8 < temp.length; _i8++) {
                    temp[_i8][0] = ++n;
                    temp_infoForSeatsSerial[_i8].serialNum = n;
                }

                var result_seat = result.concat(temp);

                var result_infoForSeatsSerial = infoForSeatsSerial.concat(temp_infoForSeatsSerial);
                var date = Arr[0].show_date;
                _models.SeatsSerial.update({
                    date: date
                }, { $set: { seats: result_infoForSeatsSerial } }, { upsert: true }).exec(function (err, results) {

                    var ws = _xlsx2.default.utils.aoa_to_sheet(ws_data.concat(result_seat));

                    wb.SheetNames.push(ws_name);

                    wb.Sheets[ws_name] = ws;

                    _tmp2.default.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
                        if (err) throw err;
                        _xlsx2.default.writeFile(wb, path);
                        return res.download(path, 'reservations.xlsx');
                    });
                });
            });
        });
    });
});
//엑셀 파싱 룰을 생성한다.
router.post('/create', function (req, res) {
    var excel = new _models.Excel(req.body.data);
    excel.save(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Excel Create Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});
//엑셀 파싱 룰을 조회한다.
router.get('/read/:key_name/:key_value', function (req, res) {

    var key_name = req.params.key_name;
    var key_value = req.params.key_value;

    var keys = ['source', '_id'];
    if (keys.indexOf(key_name) < 0) return res.status(500).json({ message: 'Excel Read Error - ' + '잘못된 key 이름을 입력하셨습니다 : ' + key_name });

    var query = {};
    query[key_name] = key_value;

    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Excel.find(query).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Excel Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});
//엑셀 파싱 룰을 전체 조회한다.
router.get('/read', function (req, res) {
    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Excel.find({}).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Excel Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});
//엑셀 파싱 룰을 수정한다.
router.put('/update', function (req, res) {
    _models.Excel.update({ _id: req.body.data._id }, { $set: req.body.data.update }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Excel Modify Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});
//엑셀 파싱 룰을 삭제한다.
router.delete('/delete', function (req, res) {
    _models.Excel.remove({ _id: req.body.data._id }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Excel Delete Error - ' + err.message });
        } else {
            console.log(results);
            return res.json({
                data: results.result
            });
        }
    });
});

exports.default = router;