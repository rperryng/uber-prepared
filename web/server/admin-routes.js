'use strict';

var express = require('express');
var logger = require('logger');
var User = require('./user.model.js');

var app = module.exports = express();
var router = express.Router();

app.use('/admin', router);

router.delete('/:number', function (req, res, next) {
  var number = req.params.number;
  User.find({number: number}).remove(function (err) {
    if (err) return next(err);

    res.sendStatus(200);
  });
});

router.use(function (err, req, res, next) {
  logger.error(err.stack || err);
  if (res) res.sendStatus(500);
});
