'use strict';

var request = require('request');
var async = require('async');
var logger = require('logger');
var qs = require('querystring');

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
    headers: {
      'Authorization': 'Token ' + process.env.UBER_SERVER_TOKEN
    }
  };
  request.get(options, function (err, response, body) {
    body = JSON.parse(body);
    grabAverageWaitTimeForProducts(body.products, user, user.access_token);
  });
}

function grabAverageWaitTimeForProducts(products, user, auth_token) {
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
      headers: {
        'Authorization': 'Bearer ' + auth_token
      },
      body: postData,
      json: true
    };

    request.post(options, function (err, response, body) {
      if (err) logger.error(err.stack || err);
      totalTime += body.pickup_estimate;
      callback();
    });

  }, function (err) {
    var averageWaitTime = (totalTime / products.length);

  });
}
