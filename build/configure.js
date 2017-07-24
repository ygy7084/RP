'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//환경설정 파일을 읽는다
var file_location = _path2.default.join('./', 'config.json');
var config = JSON.parse(_fs2.default.readFileSync(file_location, 'utf8'));

//환경설정 구조
var config_key = ['MONGO_URL', 'PORT'];

//환경설정 입력할 객체
var configuration = {
    'MONGO_URL': '',
    'PORT': ''
};

//위의 객체에 환경설정 입력
(function () {
    for (var i = 0; i < config_key.length; i++) {
        if (config[config_key[i]]) configuration[config_key[i]] = config[config_key[i]];
    }
    configuration.PORT = process.env.PORT || 8080;
})();

exports.default = configuration;