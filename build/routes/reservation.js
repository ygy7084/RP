'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _models = require('../models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.post('/create', function (req, res) {
    var reservation = new _models.Reservation(req.body.data);
    reservation.save(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Reservation Create Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

router.post('/ticketting', function (req, res) {
    var inputs = req.body.data;
    //inputs 안의 모든 데이터의 theater 와 show는 각각 같은 값으로 이뤄져야 함

    var bulk = [];
    var wrong_data = [];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = inputs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var o = _step.value;

            bulk.push({
                updateOne: {
                    filter: {
                        _id: o._id
                    },
                    update: {
                        $set: {
                            seat_position: o.seat_position,
                            input_date: o.input_date,
                            printed: o.printed,
                            delivered: o.delivered
                        }
                    },
                    upsert: true
                }
            });
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

    if (bulk.length !== 0) {
        _models.Reservation.bulkWrite(bulk).then(function (results) {

            return res.json({
                data: {
                    wrong_data: wrong_data
                }
            });
        });
    }
});

router.post('/groupTicketting', function (req, res) {
    var inputs = req.body.data;
    var theater = inputs[0].theater;
    var show = inputs[0].show;
    //inputs 안의 모든 데이터의 theater 와 show는 각각 같은 값으로 이뤄져야 함

    _models.Showtime.find({ theater: theater, show: show }).exec(function (err, results) {
        var schedule = results[0].schedule.map(function (e) {
            return new Date(e.date).getTime();
        });

        var insertBulk = [];
        var wrong_data = [];

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = inputs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var o = _step2.value;

                if (schedule.indexOf(new Date(o.show_date).getTime()) < 0) wrong_data.push(o);else {
                    o.ticket_code = _mongoose2.default.Types.ObjectId();
                    insertBulk.push(o);
                }
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

        if (insertBulk.length !== 0) {
            _models.Reservation.insertMany(insertBulk).then(function (results) {
                var updateBulk = [];
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = results[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var inserted = _step3.value;

                        updateBulk.push({
                            updateOne: {
                                filter: {
                                    show: inserted.show,
                                    theater: inserted.theater,
                                    'schedule.date': inserted.show_date
                                },
                                update: { $addToSet: { "schedule.$.reservations": { _id: inserted._id } } }
                            }
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

                if (updateBulk.length !== 0) {
                    _models.Showtime.bulkWrite(updateBulk).then(function (results) {
                        return res.json({
                            data: results
                        });
                    }).catch(function (e) {
                        return res.status(500).json({ error: e, message: '발권 에러 : reservation을 showtime에 입력하는데 오류가 있습니다.' });
                    });
                } else return res.json({
                    data: {
                        wrong_data: wrong_data
                    }
                });
            }).catch(function (e) {

                var errIndex = e.index;

                if (!errIndex) return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });

                var rollbackBulk = [];
                for (var i = 0; i < errIndex; i++) {
                    rollbackBulk.push({
                        deleteOne: {
                            filter: {
                                ticket_code: insertBulk[i].ticket_code
                            }
                        }
                    });
                }_models.Reservation.bulkWrite(rollbackBulk).then(function () {
                    return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });
                }).catch(function (e) {
                    return res.status(500).json({ error: e, message: '알수없는오류' });
                });
            });
        } else return res.json({
            data: {
                wrong_data: wrong_data
            }
        });
    });
});

router.post('/tickettingWithoutCustomer', function (req, res) {
    var inputs = req.body.data;
    var theater = inputs[0].theater;
    var show = inputs[0].show;
    //inputs 안의 모든 데이터의 theater 와 show는 각각 같은 값으로 이뤄져야 함

    _models.Showtime.find({ theater: theater, show: show }).exec(function (err, results) {
        var schedule = results[0].schedule.map(function (e) {
            return new Date(e.date).getTime();
        });

        var insertBulk = [];
        var wrong_data = [];

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = inputs[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var o = _step4.value;

                if (schedule.indexOf(new Date(o.show_date).getTime()) < 0) wrong_data.push(o);else {
                    o.ticket_code = _mongoose2.default.Types.ObjectId();
                    insertBulk.push(o);
                }
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

        if (insertBulk.length !== 0) {
            _models.Reservation.insertMany(insertBulk).then(function (results) {
                var updateBulk = [];
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = results[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var inserted = _step5.value;

                        updateBulk.push({
                            updateOne: {
                                filter: {
                                    show: inserted.show,
                                    theater: inserted.theater,
                                    'schedule.date': inserted.show_date
                                },
                                update: { $addToSet: { "schedule.$.reservations": { _id: inserted._id } } }
                            }
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

                if (updateBulk.length !== 0) {
                    _models.Showtime.bulkWrite(updateBulk).then(function (results) {
                        return res.json({
                            data: results
                        });
                    }).catch(function (e) {
                        return res.status(500).json({ error: e, message: '발권 에러 : reservation을 showtime에 입력하는데 오류가 있습니다.' });
                    });
                } else return res.json({
                    data: {
                        wrong_data: wrong_data
                    }
                });
            }).catch(function (e) {

                var errIndex = e.index;

                if (!errIndex) return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });

                var rollbackBulk = [];
                for (var i = 0; i < errIndex; i++) {
                    rollbackBulk.push({
                        deleteOne: {
                            filter: {
                                ticket_code: insertBulk[i].ticket_code
                            }
                        }
                    });
                }_models.Reservation.bulkWrite(rollbackBulk).then(function () {
                    return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });
                }).catch(function (e) {
                    return res.status(500).json({ error: e, message: '알수없는오류' });
                });
            });
        } else return res.json({
            data: {
                wrong_data: wrong_data
            }
        });
    });
});

router.post('/tickettingWithCustomer', function (req, res) {

    var inputs = req.body.data;
    //inputs 안의 모든 데이터의 theater 와 show는 각각 같은 값으로 이뤄져야 함

    var bulk = [];
    var wrong_data = [];

    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = inputs[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var o = _step6.value;

            bulk.push({
                updateOne: {
                    filter: {
                        _id: o._id
                    },
                    update: {
                        $set: {
                            seat_position: o.seat_position,
                            input_date: o.input_date,
                            printed: o.printed,
                            delivered: o.delivered
                        }
                    }
                }
            });
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
        }
    }

    if (bulk.length !== 0) {
        _models.Reservation.bulkWrite(bulk).then(function (results) {

            return res.json({
                data: {
                    wrong_data: wrong_data
                }
            });
        }).catch(function (e) {

            var errIndex = e.index;

            if (!errIndex) return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });

            var rollbackBulk = [];
            for (var i = 0; i < errIndex; i++) {
                rollbackBulk.push({
                    updateOne: {
                        filter: {
                            _id: inputs[i]._id
                        },
                        update: {
                            $set: {
                                seat_position: undefined,
                                printed: false,
                                delivered: false
                            }
                        }
                    }
                });
            }_models.Reservation.bulkWrite(rollbackBulk).then(function () {
                return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });
            }).catch(function (e) {
                return res.status(500).json({ error: e, message: '알수없는오류' });
            });
        });
    } else {
        return res.status(500).json({ message: '데이터가 서버로 전송되지 않았습니다.' });
    }
});

router.post('/preTicketting', function (req, res) {
    var inputs = req.body.data;
    var theater = inputs[0].theater;
    var show = inputs[0].show;
    //inputs 안의 모든 데이터의 theater 와 show는 각각 같은 값으로 이뤄져야 함

    _models.Showtime.find({ theater: theater, show: show }).exec(function (err, results) {
        var schedule = results[0].schedule.map(function (e) {
            return new Date(e.date).getTime();
        });

        var insertBulk = [];
        var wrong_data = [];

        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
            for (var _iterator7 = inputs[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var o = _step7.value;

                if (schedule.indexOf(new Date(o.show_date).getTime()) < 0) wrong_data.push(o);else {
                    o.ticket_code = _mongoose2.default.Types.ObjectId();
                    //임시 티켓 코드 (테이블 키 중복에 걸리지 않도록)

                    insertBulk.push(o);
                }
            }
        } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                    _iterator7.return();
                }
            } finally {
                if (_didIteratorError7) {
                    throw _iteratorError7;
                }
            }
        }

        if (insertBulk.length !== 0) {
            _models.Reservation.insertMany(insertBulk).then(function (results) {
                var updateBulk = [];
                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;

                try {
                    for (var _iterator8 = results[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var inserted = _step8.value;

                        updateBulk.push({
                            updateOne: {
                                filter: {
                                    show: inserted.show,
                                    theater: inserted.theater,
                                    'schedule.date': inserted.show_date
                                },
                                update: { $addToSet: { "schedule.$.reservations": { _id: inserted._id } } }
                            }
                        });
                    }
                } catch (err) {
                    _didIteratorError8 = true;
                    _iteratorError8 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion8 && _iterator8.return) {
                            _iterator8.return();
                        }
                    } finally {
                        if (_didIteratorError8) {
                            throw _iteratorError8;
                        }
                    }
                }

                if (updateBulk.length !== 0) {
                    _models.Showtime.bulkWrite(updateBulk).then(function (results) {
                        return res.json({
                            data: results
                        });
                    }).catch(function (e) {
                        return res.status(500).json({ error: e, message: '발권 에러 : reservation을 showtime에 입력하는데 오류가 있습니다.' });
                    });
                } else return res.json({
                    data: {
                        wrong_data: wrong_data
                    }
                });
            }).catch(function (e) {

                var errIndex = e.index;

                if (!errIndex) return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });

                var rollbackBulk = [];
                for (var i = 0; i < errIndex; i++) {
                    rollbackBulk.push({
                        deleteOne: {
                            filter: {
                                ticket_code: insertBulk[i].ticket_code
                            }
                        }
                    });
                }_models.Reservation.bulkWrite(rollbackBulk).then(function () {
                    return res.status(500).json({ message: '이미 예매 또는 발권된 좌석이 있어, 발권이 불가능합니다.' });
                }).catch(function (e) {
                    return res.status(500).json({ error: e, message: '알수없는오류' });
                });
            });
        } else return res.json({
            data: {
                wrong_data: wrong_data
            }
        });
    });
});
router.post('/createMany', function (req, res) {
    var inputs = req.body.data;
    var theater = inputs[0].theater;
    var show = inputs[0].show;
    //inputs 안의 모든 데이터의 theater 와 show는 각각 같은 값으로 이뤄져야 함

    var bulk = [];
    var wrong_data = [];

    _models.Showtime.find({ theater: theater, show: show }).exec(function (err, results) {
        var schedule = results[0].schedule.map(function (e) {
            return new Date(e.date).toLocaleString();
        });

        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
            for (var _iterator9 = inputs[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                var o = _step9.value;

                if (schedule.indexOf(new Date(o.show_date).toLocaleString()) < 0) wrong_data.push(o);else {

                    //인터파크
                    if (o.seat_position) bulk.push({
                        //source,show_date,show,theater,seat_position 없으면 insert 있으면 nothing
                        updateOne: {
                            filter: {
                                source: o.source,
                                show_date: new Date(o.show_date),
                                seat_position: o.seat_position,
                                ticket_code: o.ticket_code ? o.ticket_code : _mongoose2.default.Types.ObjectId()
                            },
                            update: o,
                            upsert: true
                        }
                    });else bulk.push({
                        //source,show_date,ticket_code 없으면 insert 있으면 nothing
                        updateOne: {
                            filter: {
                                source: o.source,
                                show_date: new Date(o.show_date),
                                ticket_code: o.ticket_code ? o.ticket_code : _mongoose2.default.Types.ObjectId()
                            },
                            update: o,
                            upsert: true
                        }
                    });
                }
            }
        } catch (err) {
            _didIteratorError9 = true;
            _iteratorError9 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion9 && _iterator9.return) {
                    _iterator9.return();
                }
            } finally {
                if (_didIteratorError9) {
                    throw _iteratorError9;
                }
            }
        }

        if (bulk.length !== 0) {
            _models.Reservation.bulkWrite(bulk).then(function (results) {
                var changed_index = Object.keys(results.upsertedIds);

                var bulk = [];
                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = changed_index[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var i = _step10.value;

                        bulk.push({
                            updateOne: {
                                filter: {
                                    show: inputs[i].show, theater: inputs[i].theater,
                                    'schedule.date': new Date(inputs[i].show_date)
                                },
                                update: { $addToSet: { "schedule.$.reservations": { _id: results.upsertedIds[i] } } }
                            }
                        });
                    }
                } catch (err) {
                    _didIteratorError10 = true;
                    _iteratorError10 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion10 && _iterator10.return) {
                            _iterator10.return();
                        }
                    } finally {
                        if (_didIteratorError10) {
                            throw _iteratorError10;
                        }
                    }
                }

                if (bulk.length !== 0) {
                    _models.Showtime.bulkWrite(bulk).then(function (results) {
                        return res.json({
                            data: results
                        });
                    });
                } else return res.json({
                    data: {
                        wrong_data: wrong_data
                    }
                });
            });
        } else {
            return res.json({
                data: {
                    wrong_data: wrong_data
                }
            });
        }
    });
});

router.get('/interpark/showtime/:showtime/date/:date', function (req, res) {
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
        var _iteratorNormalCompletion11 = true;
        var _didIteratorError11 = false;
        var _iteratorError11 = undefined;

        try {
            for (var _iterator11 = theater_seats[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                var seat = _step11.value;

                Arr.push({
                    num: ++i,
                    show_date: input.date.toLocaleString(),
                    ticket_quantity: 1, // 좌석 당 예약은 하나
                    seat_class: seat.seat_class,
                    ticket_price: seat.seat_class === 'VIP' ? 50000 : seat.seat_class === 'R' ? 40000 : undefined,
                    seat_position: { col: seat.col, num: seat.num },
                    source: undefined,
                    group_name: undefined,
                    customer_name: undefined,
                    customer_phone: undefined
                });
            }
        } catch (err) {
            _didIteratorError11 = true;
            _iteratorError11 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion11 && _iterator11.return) {
                    _iterator11.return();
                }
            } finally {
                if (_didIteratorError11) {
                    throw _iteratorError11;
                }
            }
        }

        var schedule = void 0;
        var _iteratorNormalCompletion12 = true;
        var _didIteratorError12 = false;
        var _iteratorError12 = undefined;

        try {
            for (var _iterator12 = schedules[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                var s = _step12.value;

                if (new Date(s.date).getTime() === parseInt(req.params.date)) schedule = s;
            }
        } catch (err) {
            _didIteratorError12 = true;
            _iteratorError12 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion12 && _iterator12.return) {
                    _iterator12.return();
                }
            } finally {
                if (_didIteratorError12) {
                    throw _iteratorError12;
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
            var crawled_seats = response.data;

            var reserved_seats = theater_seats.filter(function (ts) {
                return crawled_seats.filter(function (cs) {
                    return ts.col === cs.col && ts.floor === cs.floor && ts.num === cs.num;
                }).length === 0;
            });

            var _loop = function _loop(c) {
                var obj = Arr.find(function (item) {
                    if (item.seat_position.col === c.col && item.seat_position.num === c.num) return true;
                });
                if (obj) {
                    obj.source = '인터파크';
                    obj.customer_name = '미확인';
                    obj.customer_phone = '미확인';
                } else {
                    console.log(c);
                }
            };

            var _iteratorNormalCompletion13 = true;
            var _didIteratorError13 = false;
            var _iteratorError13 = undefined;

            try {
                for (var _iterator13 = reserved_seats[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                    var c = _step13.value;

                    _loop(c);
                }
            } catch (err) {
                _didIteratorError13 = true;
                _iteratorError13 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion13 && _iterator13.return) {
                        _iterator13.return();
                    }
                } finally {
                    if (_didIteratorError13) {
                        throw _iteratorError13;
                    }
                }
            }

            _models.Reservation.populate(schedule.reservations, { path: '_id' }, function (err, results) {
                results.forEach(function (r) {
                    var reservation = r._id; // _id로 객체가 감싸여 있다,
                    //mongoose documnet to javascript object
                    if (reservation && reservation.seat_position && reservation.seat_position.col && reservation.seat_position.num) {

                        var _obj = Arr.find(function (item) {
                            if (item.seat_position.col === reservation.seat_position.col && item.seat_position.num === reservation.seat_position.num) return true;
                        });

                        if (_obj) {
                            _obj.customer_name = reservation.customer_name;
                            _obj.customer_phone = reservation.customer_phone;
                            _obj.group_name = reservation.group_name;
                            _obj.source = reservation.source;
                            _obj.ticket_price = reservation.ticket_price;
                        } else {
                            console.log(reservation.seat_position);
                        }
                    }
                });

                var interpark = [];

                var _iteratorNormalCompletion14 = true;
                var _didIteratorError14 = false;
                var _iteratorError14 = undefined;

                try {
                    for (var _iterator14 = Arr[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                        var r = _step14.value;

                        for (var prop in r) {
                            r[prop] = r[prop] ? r[prop] : '';
                        }if (r.source === '인터파크') interpark.push({
                            show_date: new Date(r.show_date),
                            seat_class: r.seat_class,
                            seat_position: r.seat_position,
                            ticket_quantity: 1,
                            ticket_price: r.ticket_price,
                            source: r.source
                        });
                    }
                } catch (err) {
                    _didIteratorError14 = true;
                    _iteratorError14 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion14 && _iterator14.return) {
                            _iterator14.return();
                        }
                    } finally {
                        if (_didIteratorError14) {
                            throw _iteratorError14;
                        }
                    }
                }

                return res.json({
                    data: interpark
                });
            });
        });
    });
});

router.delete('/delete/source', function (req, res) {
    var data = req.body.data;

    _models.Reservation.find({
        theater: data.theater,
        show: data.show,
        source: data.source }).exec(function (err, results) {

        var bulk = [];
        var ids = [];
        var _iteratorNormalCompletion15 = true;
        var _didIteratorError15 = false;
        var _iteratorError15 = undefined;

        try {
            for (var _iterator15 = results[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                var i = _step15.value;

                bulk.push({
                    updateOne: {
                        filter: {
                            show: i.show, theater: i.theater, 'schedule.reservations._id': i._id
                        },
                        update: { $pull: { "schedule.$.reservations": { _id: i._id } } }
                    }
                });
                ids.push(i._id);
            }
        } catch (err) {
            _didIteratorError15 = true;
            _iteratorError15 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion15 && _iterator15.return) {
                    _iterator15.return();
                }
            } finally {
                if (_didIteratorError15) {
                    throw _iteratorError15;
                }
            }
        }

        if (bulk.length) {
            _models.Showtime.bulkWrite(bulk).then(function (results) {
                _models.Reservation.remove({ '_id': { '$in': ids } }, function (err, results) {
                    return res.json({
                        data: results
                    });
                });
            });
        } else return res.json({
            data: {}
        });
    });
});

router.delete('/delete/all', function (req, res) {
    var data = req.body.data;

    _models.Reservation.find({
        theater: data.theater,
        show: data.show }).exec(function (err, results) {

        var bulk = [];
        var ids = [];
        var _iteratorNormalCompletion16 = true;
        var _didIteratorError16 = false;
        var _iteratorError16 = undefined;

        try {
            for (var _iterator16 = results[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                var i = _step16.value;

                bulk.push({
                    updateOne: {
                        filter: {
                            show: i.show, theater: i.theater, 'schedule.reservations._id': i._id
                        },
                        update: { $pull: { "schedule.$.reservations": { _id: i._id } } }
                    }
                });
                ids.push(i._id);
            }
        } catch (err) {
            _didIteratorError16 = true;
            _iteratorError16 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion16 && _iterator16.return) {
                    _iterator16.return();
                }
            } finally {
                if (_didIteratorError16) {
                    throw _iteratorError16;
                }
            }
        }

        if (bulk.length) {
            _models.Showtime.bulkWrite(bulk).then(function (results) {
                _models.Reservation.remove({ '_id': { '$in': ids } }, function (err, results) {
                    return res.json({
                        data: results
                    });
                });
            });
        } else return res.json({
            data: {}
        });
    });
});

router.delete('/delete/source2', function (req, res) {
    var data = req.body.data;

    _models.Reservation.find({
        theater: data.theater,
        show: data.show,
        source: data.source,
        show_date: data.show_date }).exec(function (err, results) {

        var bulk = [];
        var ids = [];
        var _iteratorNormalCompletion17 = true;
        var _didIteratorError17 = false;
        var _iteratorError17 = undefined;

        try {
            for (var _iterator17 = results[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                var i = _step17.value;

                bulk.push({
                    updateOne: {
                        filter: {
                            show: i.show, theater: i.theater, 'schedule.reservations._id': i._id
                        },
                        update: { $pull: { "schedule.$.reservations": { _id: i._id } } }
                    }
                });
                ids.push(i._id);
            }
        } catch (err) {
            _didIteratorError17 = true;
            _iteratorError17 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion17 && _iterator17.return) {
                    _iterator17.return();
                }
            } finally {
                if (_didIteratorError17) {
                    throw _iteratorError17;
                }
            }
        }

        if (bulk.length) {
            _models.Showtime.bulkWrite(bulk).then(function (results) {
                _models.Reservation.remove({ '_id': { '$in': ids } }, function (err, results) {
                    return res.json({
                        data: results
                    });
                });
            });
        } else return res.json({
            data: {}
        });
    });
});

router.delete('/delete/all2', function (req, res) {
    var data = req.body.data;

    _models.Reservation.find({
        theater: data.theater,
        show: data.show,
        show_date: data.show_date }).exec(function (err, results) {

        var bulk = [];
        var ids = [];
        var _iteratorNormalCompletion18 = true;
        var _didIteratorError18 = false;
        var _iteratorError18 = undefined;

        try {
            for (var _iterator18 = results[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                var i = _step18.value;

                bulk.push({
                    updateOne: {
                        filter: {
                            show: i.show, theater: i.theater, 'schedule.reservations._id': i._id
                        },
                        update: { $pull: { "schedule.$.reservations": { _id: i._id } } }
                    }
                });
                ids.push(i._id);
            }
        } catch (err) {
            _didIteratorError18 = true;
            _iteratorError18 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion18 && _iterator18.return) {
                    _iterator18.return();
                }
            } finally {
                if (_didIteratorError18) {
                    throw _iteratorError18;
                }
            }
        }

        if (bulk.length) {
            _models.Showtime.bulkWrite(bulk).then(function (results) {
                _models.Reservation.remove({ '_id': { '$in': ids } }, function (err, results) {
                    return res.json({
                        data: results
                    });
                });
            });
        } else return res.json({
            data: {}
        });
    });
});

//예매 내역을 조회한다.
router.get('/read/theater/:theater/show/:show/date/:date', function (req, res) {
    var query = {
        theater: req.params.theater,
        show: req.params.show,
        show_date: new Date(parseInt(req.params.date))
    };
    _models.Reservation.find(query).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Reservation Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//예매 내역을 조회한다.
router.get('/read/:key_name/:key_value', function (req, res) {
    var key_name = req.params.key_name;
    var key_value = req.params.key_value;

    var keys = ['_id'];

    if (keys.indexOf(key_name) < 0) return res.status(500).json({ message: 'Reservation Read Error - ' + '잘못된 key 이름을 입력하셨습니다 : ' + key_name });

    var query = {};
    query[key_name] = key_value;

    _models.Reservation.find(query).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Reservation Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});
//예매 내역을 조회한다.
router.get('/read', function (req, res) {
    _models.Reservation.find({}).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Reservation Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//예매 내역을 수정한다.
router.put('/update', function (req, res) {
    _models.Reservation.update({ _id: req.body.data._id }, { $set: req.body.data }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Reservation Modify Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//예매 내역을 삭제한다.
router.delete('/delete', function (req, res) {
    _models.Reservation.remove({ _id: req.body.data._id }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Reservation Delete Error - ' + err.message });
        } else {
            return res.json({
                data: results.result
            });
        }
    });
});

exports.default = router;