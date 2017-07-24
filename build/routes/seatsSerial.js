'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _models = require('../models');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/:date', function (req, res) {
    var date = new Date(parseInt(req.params.date));
    _models.SeatsSerial.find({ date: date }).lean().exec(function (err, results) {
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

exports.default = router;