'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _module = require('./module');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.post('/print', function (req, res) {
    (0, _module.ticketMaker)(req.body).then(function (file) {
        res.download(file);
    });
});

exports.default = router;