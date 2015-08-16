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

function placeOrder(order) {

  var url = UBER_BASE_URL + '/products?' + qs.stringify({
    latitude: order.start.lat,
    longitude: order.start.long
  });
  var options = {
    url: url,
    headers: {
      'Authorization': 'Token ' + process.env.UBER_SERVER_TOKEN
    }
  };
  request.get(options, function (err, response, body) {
    body = JSON.parse(body);
    grabAverageWaitTimeForProducts(body.products, order);
  });
}

function grabAverageWaitTimeForProducts(products, order) {
  var totalTime = 0;
  async.each(products, function (product, callback) {
    var url = UBER_BASE_URL + '/requests/estimate?' + qs.stringify({
      product_id: product.product_id,
      start_latitude: order.start.lat,
      start_longitude: order.start.long,
      end_latitude: order.end.lat,
      end_longitude: order.end.long
    });
    logger.info('finding estimate via: ' + url);

    var options = {
      url: url,
      headers: {
        'Authorization': 'Bearer ' + process.env.MY_UBER_ACCESS_TOKEN
      }
    };

    request.post(options, function (err, response, body) {
      body = JSON.parse(body);
      totalTime += body.pickup_estimate;

      logger.info('got: ' + JSON.stringify(body, null, 2));
      callback();
    });
  }, function (err) {
    logger.info('average wait time: ' + totalTime / products.length);
  });
}
