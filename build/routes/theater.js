'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _models = require('../models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

//공연장을 만든다.
router.post('/create', function (req, res) {
    var theater = new _models.Theater(req.body.data);
    theater.save(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Theater Create Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//공연장을 조회한다.
router.get('/read/:key_name/:key_value', function (req, res) {
    var key_name = req.params.key_name;
    var key_value = req.params.key_value;

    var keys = ['_id'];

    if (keys.indexOf(key_name) < 0) return res.status(500).json({ message: 'Theater Read Error - ' + '잘못된 key 이름을 입력하셨습니다 : ' + key_name });

    var query = {};
    query[key_name] = key_value;

    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Theater.find(query).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Show Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});
//공연장을 조회한다.
router.get('/read', function (req, res) {
    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Theater.find({}).lean().exec(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Show Read Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

router.put('/update/coords', function (req, res) {
    _models.Theater.update({
        _id: req.body.data._id,
        seats: {
            "$elemMatch": {
                floor: req.body.data.floor,
                num: req.body.data.num,
                col: req.body.data.col
            }
        }
    }, { $set: {
            "seats.$.x": req.body.data.x,
            "seats.$.y": req.body.data.y } }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Theater Modify Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//공연장을 수정한다.
router.put('/update', function (req, res) {
    //공연장의 좌석 배치를 수정한다.
    for (var i = 1; i <= req.body.data.seats.length; i++) {
        req.body.data.seats[i - 1].serialNum = i;
    }_models.Theater.update({ _id: req.body.data._id }, { $set: { seats_quantity: req.body.data.seats.length,
            seats: req.body.data.seats } }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Theater Modify Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//공연장을 삭제한다.
router.delete('/delete', function (req, res) {
    _models.Theater.remove({ _id: req.body.data._id }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Theater Delete Error - ' + err.message });
        } else {
            return res.json({
                data: results.result
            });
        }
    });
});

exports.default = router;