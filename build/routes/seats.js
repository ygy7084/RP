'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _models = require('../models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/pre/showtime/:showtime/date/:date', function (req, res) {
    var input = {
        showtime: req.params.showtime,
        date: new Date(parseInt(req.params.date))
    };
    _models.Showtime.find({ _id: input.showtime }).populate('theater').exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Crawling Data Read Error - ' + err.message });
        }
        if (!results || results.length < 1) {
            return res.status(500).json({ message: 'Crawling Data Read Error - ' + '공연일정(Showtime)을 _id로 찾을 수 없습니다.' });
        }
        if (!results[0].theater) {
            return res.status(500).json({ message: 'Crawling Data Read Error - ' + '공연장(Theater)을 _id로 찾을 수 없습니다.' });
        }

        var schedules = results[0].schedule;
        var theater_seats = results[0].theater.seats;
        var schedule = void 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = schedules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var s = _step.value;

                if (new Date(s.date).getTime() === parseInt(req.params.date)) schedule = s;
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

        _models.Reservation.populate(schedule.reservations, { path: '_id' }, function (err, results) {

            var preTicketted_seats = [];
            results.forEach(function (excel_seat) {
                //mongoose documnet to javascript object
                var o = JSON.parse(JSON.stringify(excel_seat._id));

                if (o && o.seat_position && o.printed && !o.delivered) {
                    preTicketted_seats.push(o.seat_position);
                }
            });

            //difference 연산
            var printed_seats = theater_seats.filter(function (ts) {
                return preTicketted_seats.filter(function (cs) {
                    return ts.col === cs.col && ts.floor === cs.floor && ts.num === cs.num;
                }).length !== 0;
            });
            return res.json({
                data: {
                    printed_seats: printed_seats
                }
            });
        });
    });
});
router.get('/showtime/:showtime/date/:date', function (req, res) {
    var input = {
        showtime: req.params.showtime,
        date: new Date(parseInt(req.params.date))
    };
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
        _models.Showtime.find({ _id: input.showtime }).populate('theater').exec(function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Crawling Data Read Error - ' + err.message });
            }
            if (!results || results.length < 1) {
                return res.status(500).json({ message: 'Crawling Data Read Error - ' + '공연일정(Showtime)을 _id로 찾을 수 없습니다.' });
            }
            if (!results[0].theater) {
                return res.status(500).json({ message: 'Crawling Data Read Error - ' + '공연장(Theater)을 _id로 찾을 수 없습니다.' });
            }

            var schedules = results[0].schedule;
            var theater_seats = results[0].theater.seats;
            var schedule = void 0;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = schedules[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var s = _step2.value;

                    if (new Date(s.date).getTime() === parseInt(req.params.date)) schedule = s;
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

            _models.Reservation.populate(schedule.reservations, { path: '_id' }, function (err, results) {
                var excel_seats = [];
                results.forEach(function (excel_seat) {

                    //mongoose documnet to javascript object
                    var o = JSON.parse(JSON.stringify(excel_seat._id));

                    if (o && o.seat_position) {
                        excel_seats.push(o.seat_position);
                    }
                });

                //difference 연산
                var reserved_seats = void 0;
                var not_reserved_seats = void 0;

                reserved_seats = [];
                /*
                  본 주석 코드를 사용하면 크롤링 데이터가 들어간다.
                   */

                // const crawled_seats = response.data;
                // reserved_seats = theater_seats.filter((ts) => {
                //     return crawled_seats.filter((cs) => {
                //             return ts.col===cs.col && ts.floor === cs.floor && ts.num === cs.num
                //         }).length===0;
                // });

                var _loop = function _loop(es) {
                    if (!reserved_seats.find(function (rs) {
                        return es.col === rs.col && es.floor === rs.floor && es.num === rs.num;
                    })) {
                        var es_added_coords = theater_seats.find(function (ts) {
                            return es.col === ts.col && es.floor === ts.floor && es.num === ts.num;
                        });
                        reserved_seats.push(es_added_coords);
                    }
                };

                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = excel_seats[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var es = _step3.value;

                        _loop(es);
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

                not_reserved_seats = theater_seats.filter(function (ts) {
                    return reserved_seats.filter(function (rs) {
                        return ts.col === rs.col && ts.floor === rs.floor && ts.num === rs.num;
                    }).length === 0;
                });
                return res.json({
                    data: {
                        reserved_seats: reserved_seats,
                        not_reserved_seats: not_reserved_seats
                    }
                });
            });
        });
    }).catch(function (err) {
        var message = err;
        if (err.message && err.message !== '') message = err.message;
        return res.status(500).json({ message: message });
    });
});

exports.default = router;