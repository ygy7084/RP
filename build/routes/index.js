'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _excel = require('./excel');

var _excel2 = _interopRequireDefault(_excel);

var _reservation = require('./reservation');

var _reservation2 = _interopRequireDefault(_reservation);

var _show = require('./show');

var _show2 = _interopRequireDefault(_show);

var _showtime = require('./showtime');

var _showtime2 = _interopRequireDefault(_showtime);

var _theater = require('./theater');

var _theater2 = _interopRequireDefault(_theater);

var _seats = require('./seats');

var _seats2 = _interopRequireDefault(_seats);

var _ticket = require('./ticket');

var _ticket2 = _interopRequireDefault(_ticket);

var _seatsSerial = require('./seatsSerial');

var _seatsSerial2 = _interopRequireDefault(_seatsSerial);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.use('/excel', _excel2.default);
router.use('/reservation', _reservation2.default);
router.use('/show', _show2.default);
router.use('/showtime', _showtime2.default);
router.use('/theater', _theater2.default);
router.use('/seats', _seats2.default);
router.use('/ticket', _ticket2.default);
router.use('/seatsSerial', _seatsSerial2.default);

exports.default = router;