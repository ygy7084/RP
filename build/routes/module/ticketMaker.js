'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _hummus = require('hummus');

var _hummus2 = _interopRequireDefault(_hummus);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ticketMaker = function ticketMaker(info) {
    //req.body.data -> info.data
    //req.body.combine -> info.combine
    return new Promise(function (resolve, reject) {
        /*
        PDF 전송 이전 임시 파일 생성
         */
        _tmp2.default.file(function (err, filepath) {
            if (err) throw err;

            var PDF = filepath + '.pdf';
            resolve(PDF);
        });
    }).then(function (PDF) {
        /*
        티켓 기본 PDF는
        public/tickets.pdf 를 사용한다.
         */
        var pdfWriter = _hummus2.default.createWriter(PDF);
        var copyingContext = pdfWriter.createPDFCopyingContext(_path2.default.join(__dirname, '../../../public', '/tickets.pdf'));

        for (var i = 0; i < info.data.length; i++) {
            var seat = info.data[i];

            /*
            R이면 PDF의 첫번째 페이지를 사용하고
            VIP이면 PDF의 두번째 페이지를 사용한다.
             */
            if (seat.seat_class === 'R') copyingContext.appendPDFPageFromPDF(0);else if (seat.seat_class === 'VIP') copyingContext.appendPDFPageFromPDF(1);else return null;

            if (info.combine) break;
        }
        pdfWriter.end();

        return PDF;
    }).then(function (PDF) {
        /*
        PDF에 그린다.
         */

        var pdfWriter = _hummus2.default.createWriterToModify(PDF);
        var data = void 0;

        for (var i = 0; i < info.data.length; i++) {
            if (info.combine) data = info.data;else data = [info.data[i]];

            var axis = {
                /*
                가변되는 좌표들은 이곳에서 관리하며
                '석', '소월아트홀'처럼 위치가 고정된 좌표는 밑의 그리는 코드에 코딩되어있다.
                x : 왼쪽부터 0
                y : 밑에부터 0
                즉, x:0 y:0 은 좌하단 끝점을 의미한다.
                size는 font 크기이다.
                 */
                seat_class: { x: 270, y: 230, size: 15 },
                date: { x: 312, y: 210, size: 15 },
                time: { x: 320, y: 198, size: 11 },
                leftBase: { x: 10, y: 195, size: 9 },
                rightBase: { x: 150, y: 195, size: 9 }
            };

            var days = ['일', '월', '화', '수', '목', '금', '토'];
            var dateObj = new Date(data[0].show_date);
            var month = dateObj.getMonth() + 1;
            var date = dateObj.getDate();
            var day = dateObj.getDay();
            var hours = dateObj.getHours();
            var minutes = dateObj.getMinutes();

            var seats = void 0;
            var seat_class = data[0].seat_class;
            var ticket_price = data[0].ticket_price;
            if (ticket_price !== 0 && !ticket_price || ticket_price === '') ticket_price = seat_class === 'VIP' ? '50000' : '40000';

            seats = {
                seat_class: seat_class,
                date: month + '/' + date + '·' + days[day],
                time: hours + '시' + minutes + '분',
                datetime: '공연시간 : ' + month + '.' + date + '.' + days[day] + ' / ' + hours + '시 ' + minutes + '분',
                ticket_price: ticket_price,
                number: data.length,
                seats_picked: []
            };

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var seat = _step.value;

                    seats.seats_picked.push({
                        col: seat.seat_position.col,
                        num: seat.seat_position.num
                    });
                } /*
                  글자 수에 따라 X좌표를 바꿔줌으로써 글자가 좌우로 균형이 맞도록 한다.
                   */
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

            if (seats.seat_class === 'VIP') axis.seat_class.x = 263;
            if (seats.date.length === 5) axis.date.x = 317;
            if (seats.date.length === 7) axis.date.size = 13;
            if (seats.time.length === 5) axis.time.x = 317;
            if (seats.time.length === 6) {
                axis.time.size = 10;
                axis.time.x = 315;
            }

            /*
            좌석이 5개 초과인지 아닌지에 따라 y좌표를 변경한다.
             */
            if (seats.seats_picked.length < 6) {
                axis.leftBase.y -= axis.leftBase.size + 2;
                axis.rightBase.y -= axis.rightBase.size + 2;
            }

            /*
            폰트
             */
            var fontSRC = _path2.default.join(__dirname, '../../../public', '/malgunbd.ttf');
            var font = void 0;
            font = pdfWriter.getFontForFile(fontSRC);

            var pageModifier = new _hummus2.default.PDFPageModifier(pdfWriter, i);
            pageModifier.startContext().getContext().writeText(seats.seat_class, axis.seat_class.x, axis.seat_class.y, { font: font, size: axis.seat_class.size, color: 'white' }).writeText('석', 270, 220, { font: font, size: 10, color: 'white' }).writeText(seats.seat_class, axis.seat_class.x - 260, axis.seat_class.y, { font: font, size: axis.seat_class.size, color: 'white' }).writeText('석', 10, 220, { font: font, size: 10, color: 'white' }).writeText('소월아트홀', 315, 225, { font: font, size: 9, color: 'white' }).writeText(seats.date, axis.date.x, axis.date.y, { font: font, size: axis.date.size, color: 'white' }).writeText(seats.time, axis.time.x, axis.time.y, { font: font, size: axis.time.size, color: 'white' }).writeText(seats.datetime, axis.leftBase.x, axis.leftBase.y, { font: font, size: axis.leftBase.size, color: 'black' }).writeText('인원 : ' + seats.number + ' 명', axis.leftBase.x, axis.leftBase.y - (axis.leftBase.size + 2), { font: font, size: axis.leftBase.size, color: 'black' }).writeText('좌석 : ' + seats.seat_class + '석 ' + seats.ticket_price + '원', axis.leftBase.x, axis.leftBase.y - (axis.leftBase.size + 2) * 2, { font: font, size: axis.leftBase.size, color: 'black' }).writeText('소월아트홀', axis.leftBase.x, 90, { font: font, size: axis.leftBase.size, color: 'black' }).writeText(seats.datetime, axis.rightBase.x, axis.rightBase.y, { font: font, size: axis.rightBase.size, color: 'black' }).writeText('인원 : ' + seats.number + ' 명', axis.rightBase.x, axis.rightBase.y - (axis.rightBase.size + 2), { font: font, size: axis.rightBase.size, color: 'black' }).writeText('좌석 : ' + seats.seat_class + '석 ' + seats.ticket_price + '원', axis.rightBase.x, axis.rightBase.y - (axis.rightBase.size + 2) * 2, { font: font, size: axis.rightBase.size, color: 'black' });

            for (var _i = 0; _i < Math.ceil(seats.seats_picked.length / 2); _i++) {
                var con = pageModifier.startContext().getContext();
                var index = _i * 2;
                var str = seats.seats_picked[index].col + '-열 ' + seats.seats_picked[index].num + '번 ';
                if (seats.seats_picked[index + 1]) {
                    index++;
                    str += seats.seats_picked[index].col + '-열 ' + seats.seats_picked[index].num + '번';
                }
                con.writeText(str, axis.leftBase.x, axis.leftBase.y - (axis.leftBase.size + 2) * (3 + _i), { font: font, size: axis.leftBase.size, color: 'black' });
            }
            for (var _i2 = 0; _i2 < Math.ceil(seats.seats_picked.length / 5); _i2++) {
                var _con = pageModifier.startContext().getContext();
                var _index = _i2 * 5;
                var _str = '';
                for (var j = 0; seats.seats_picked[_index + j] && j < 5; j++) {
                    _str += seats.seats_picked[_index + j].col + '-열 ' + seats.seats_picked[_index + j].num + '번 ';
                }_con.writeText(_str, axis.rightBase.x, axis.rightBase.y - (axis.rightBase.size + 2) * (3 + _i2), { font: font, size: axis.leftBase.size, color: 'black' });
            }

            pageModifier.endContext().writePage();
            if (info.combine) break;
        }

        pdfWriter.end();

        return PDF;
    });
}; /*
   PDF를 생성한다.
    */

exports.default = ticketMaker;