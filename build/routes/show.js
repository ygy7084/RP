'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _models = require('../models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

//공연을 만든다.
router.post('/create', function (req, res) {
    var show = new _models.Show(req.body.data);
    show.save(function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Show Create Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//공연을 조회한다.
router.get('/read/:key_name/:key_value', function (req, res) {
    var key_name = req.params.key_name;
    var key_value = req.params.key_value;

    var keys = ['_id'];

    if (keys.indexOf(key_name) < 0) return res.status(500).json({ message: 'Show Read Error - ' + '잘못된 key 이름을 입력하셨습니다 : ' + key_name });

    var query = {};
    query[key_name] = key_value;

    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Show.find(query).lean().exec(function (err, results) {
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
//공연을 조회한다.
router.get('/read', function (req, res) {
    //lean() -> 조회 속도 빠르게 하기 위함
    _models.Show.find({}).lean().exec(function (err, results) {
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

//공연을 수정한다.
router.put('/update', function (req, res) {
    _models.Show.update({ _id: req.body.data._id }, { $set: req.body.data }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Show Modify Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

//공연을 삭제한다.
router.delete('/delete', function (req, res) {
    _models.Show.remove({ _id: req.body.data._id }, function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Show Delete Error - ' + err.message });
        } else {
            return res.json({
                data: results
            });
        }
    });
});

exports.default = router;