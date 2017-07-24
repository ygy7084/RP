'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Show 스키마
 name    // 공연 이름
 */
var Schema = _mongoose2.default.Schema;
var Show = new Schema({
  name: String
});

Show.index({ name: 1 }, { unique: true });

var model = _mongoose2.default.model('show', Show);

exports.default = model;