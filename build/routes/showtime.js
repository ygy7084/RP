'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _models = require('../models');

var _module = require('./module');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

//크롤러
router.post('/crawl', function (req, res) {
    function toMongoID(id) {
        return new _mongoose2.default.mongo.ObjectId(id);
    }
    _models.Showtime.aggregate([{ $match: { _id: toMongoID(req.body.data.showtime) } }, { $project: {
            theater: true,
            show: true,
            schedule: { $filter: {
                    input: '$schedule',
                    as: 'schedule',
                    cond: { $and: [{ $eq: ['$$schedule.date', new Date(req.body.data.date)] }]
                    } }
            } } }]).exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Showtime Crawler Error - ' + err.message });
        }
        if (results[0] && results[0].schedule[0]) (0, _module.cralwer)(results[0].schedule[0].url).then(function (results) {
            return res.json({
                data: results
            });
        });else return res.json({
            data: null
        });
    });
});

//공연 일정을 만든다.
router.post('/create', function (req, res) {
    var show = new _models.Showtime(req.body.data);
    show.save(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Showtime Create Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});
//공연 일정을 조회한다.
router.get('/read/theater/:theater/show/:show', function (req, res) {
    var query = {
        theater: req.params.theater,
        show: req.params.show
    };
    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Showtime.find(query).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Showtime Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

router.get('/read/showtime/:showtime/date/:date/phone/:phone', function (req, res) {
    // Showtime.find({_id:input.showtime})
    //     .populate('theater')
    //     .exec((err, results) => {
    //         if (err) {
    //             console.error(err);
    //             return res.status(500).json({message: 'Crawling Data Read Error - ' + err.message});
    //         }
    //         if (!results || results.length < 1) {
    //             return res.status(500).json({message: 'Crawling Data Read Error - ' + '공연일정(Showtime)을 _id로 찾을 수 없습니다.'});
    //         }
    //         if (!results[0].theater) {
    //             return res.status(500).json({message: 'Crawling Data Read Error - ' + '공연장(Theater)을 _id로 찾을 수 없습니다.'});
    //         }
    //
    //         const schedules = results[0].schedule;
    //         const theater_seats = results[0].theater.seats;
    //         let schedule;
    //         for (let s of schedules)
    //             if (new Date(s.date).getTime() === parseInt(req.params.date))
    //                 schedule = s;
    //
    //         Reservation.populate(schedule.reservations, {path: '_id'}, (err, results) => {
    //             let excel_seats = [];
    //             results.forEach((excel_seat) => {
    //
    //                 //mongoose documnet to javascript object
    //                 let o = JSON.parse(JSON.stringify(excel_seat._id));
    //
    //                 if (o.seat_position) {
    //                     excel_seats.push(o.seat_position);
    //                 }
    //             });
    //         })
    //     }
});

//공연 일정을 조회한다.
router.get('/read/:key_name/:key_value', function (req, res) {

    var key_name = req.params.key_name;
    var key_value = req.params.key_value;

    var keys = ['_id'];

    if (keys.indexOf(key_name) < 0) return res.status(500).json({ message: 'Showtime Read Error - ' + '잘못된 key 이름을 입력하셨습니다 : ' + key_name });

    var query = {};
    query[key_name] = key_value;

    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Showtime.find(query).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Showtime Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

router.get('/read', function (req, res) {
    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Showtime.find({}).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Showtime Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//공연 일정을 수정한다.
router.put('/update', function (req, res) {
    _models.Showtime.update({ _id: req.body.data._id }, { $set: req.body.data.update }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Showtime Modify Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//공연 일정을 삭제한다.
router.delete('/delete', function (req, res) {
    _models.Showtime.remove({ _id: req.body.data._id }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Showtime Delete Error - ' + err.message });
        } else {
            return res.json({
                data: results.result
            });
        }
    });
});

exports.default = router;