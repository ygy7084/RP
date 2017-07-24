'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _configure = require('./configure');

var _configure2 = _interopRequireDefault(_configure);

require('isomorphic-fetch');

var _routes = require('./routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//서버와 포트 초기화


//서버사이드 ajax를 위한 fetch
var app = (0, _express2.default)();

//api 라우트 로드

var port = _configure2.default.PORT;

//몽고디비 연결 설정
var db = _mongoose2.default.connection;
_mongoose2.default.connect(_configure2.default.MONGO_URL);

//Mongoose 모듈의 Promise 변경 - 모듈 권고사항 (deprecated)
_mongoose2.default.Promise = global.Promise;

//몽고디비 연결
db.on('error', console.error);
db.once('open', function () {
    console.log('MongoDB is connected : ' + _configure2.default.MONGO_URL);
});

//POST 연결을 위한 설정
app.use(_bodyParser2.default.urlencoded({ extended: true, limit: '5mb' }));
app.use(_bodyParser2.default.json({ limit: '5mb' }));
app.enable('trust proxy');

//API 라우트
app.use('/api', _routes2.default);

//정적 파일 라우트
app.use('/', _express2.default.static(_path2.default.join(__dirname, './../public')));

//메인 html
app.get('/*', function (req, res) {
    res.sendFile(_path2.default.resolve(__dirname, './../public/index.html'));
});

//404 에러
app.use(function (req, res) {
    res.status(404).send('NOT FOUND');
});

//서버 시작
app.listen(port, function () {
    console.log("Server is listening on this port : " + port);
});