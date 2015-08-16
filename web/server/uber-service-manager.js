'use strict';

var request = require('request');
var async = require('async');
var logger = require('logger');
var qs = require('querystring');
var moment = require('moment');
var agendaInstance = require('../agenda-instance.js');
var User = require('./user.model.js');

module.exports = {
  placeOrder: placeOrder
};

// 2 STRONQ
var UBER_BASE_URL = 'https://api.uber.com/v1';

function placeOrder(user) {
  var url = UBER_BASE_URL + '/products?' + qs.stringify({
    latitude: user.start.lat,
    longitude: user.start.lng
  });
  var options = {
    url: url,
    headers: {'Authorization': 'Token ' + process.env.UBER_SERVER_TOKEN}
  };
  request.get(options, function (err, response, body) {
    body = JSON.parse(body);
    grabAverageWaitTimeForProducts(body.products, user, user.access_token);
  });
}

function grabAverageWaitTimeForProducts(products, user) {
  var totalTime = 0;
  async.each(products, function (product, callback) {
    var url = UBER_BASE_URL + '/requests/estimate';
    var postData = {
      product_id: product.product_id,
      start_latitude: user.start.lat,
      start_longitude: user.start.lng,
      end_latitude: user.end.lat,
      end_longitude: user.end.lng
    };

    var options = {
      url: url,
      headers: {'Authorization': 'Bearer ' + user.access_token},
      body: postData,
      json: true
    };

    request.post(options, function (err, response, body) {
      if (err) logger.error(err.stack || err);
      logger.debug(body);
      totalTime += body.pickup_estimate;
      callback();
    });

  }, function (err) {
    var averageWaitTime = (totalTime / products.length);
    var timeDiff = (user.time - moment().unix()) / 60;

    logger.info('averageWaitTime: ' + averageWaitTime);
    logger.info('timeDiff: ' + timeDiff);

    if (timeDiff <= averageWaitTime) {
      logger.info('order uber ...');
      agendaInstance.cancel({name: user.number}, function (err, numRemoved) {
        if (err) logger.error('couldn\'t cancel job ' + user.number);
        logger.info('cancelling job: ' + user.number);
      });
      return;
    }

    var job = agendaInstance.create(user.number, {number: user.number});
    if (timeDiff > moment.duration(35, 'minutes')) {
      job.schedule('in 15 minutes');
      logger.verbose('new job set for 15 minutes');
    } else {
      job.schedule('in 1 minute');
      logger.verbose('new job set in 1 minute');
    }

    agendaInstance.define(user.number, function (job, done) {
      var data = job.attrs.data;
      User.findOne({number: data.number}, function (err, user) {
        if (err) {
          logger.error('Failed to find ' + data.number + ' job');
          return;
        }

        placeOrder(user);
      });
    });
    job.save();
  });
}

function orderUber(product_id, user) {
  var url = UBER_BASE_URL + '/requests';
  var postData = {
    product_id: product_id,
    start_latitude: user.start.lat,
    start_longitude: user.start.lng,
    end_latitude: user.end.lat,
    end_longitude: user.end.lng
  };
  var options = {
    url: url,
    headers: {'Authorization': 'Bearer ' + user.access_token},
    body: postData,
    json: true
  };

  async.parallel({
    // uberResponse: function (callback) {
    //   request.post(options, function (err, response, body) {
    //     callback(err, body);
    //   });
    // },
    user: function (callback) {
      user.state = 'clean';
      user.save(callback);
    }
  },
  function (err, results) {
    if (err) {
      logger.error(err.stack || err);
      return;
    }

    logger.info('got response %j', results.uberResponse);
  });
}
