'use strict';

var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var logger = require('logger');

var app = module.exports = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}));

app.set('view engine', 'jade');
app.set('views', __dirname);

var router = express.Router();
app.use('/', router);

router.get('/', function (req, res) {
  if (req.session.isAuthenticated) {
    return res.redirect('/login');
  }

  res.render('login', {
    scripts: ['login'],
    styles: ['login']
  });
});

router.get('/login', function (req, res) {
  if (req.session.isAuthenticated) {
    return res.redirect('/');
  }
});

router.use(function (err, req, res, next) {
  logger.error(err.stack || err);
  if (res) res.sendStatus(500);
});
