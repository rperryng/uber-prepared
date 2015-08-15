'use strict';

var request = require('request');
var logger = require('logger');

var COMMANDS = {
	SUPPORT: 'SUPPORT',
	HELP: 'HELP',
	REQUEST: 'REQUEST',
	STOP: 'STOP',
	MODIFY: 'MODIFY',
	CANCEL: 'CANCEL'
};

module.exports = {
	parseMessage: parseMessage
};

function parseMessage(message, cb) {
	var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query='
		+ encodeURIComponent(message) + '&key=' + process.env.API_KEY;

	request.get({url: url}, function (err, response, body) {
		if (err) {
			cb(err);
			return;
		}

		body = JSON.parse(body);
		var bestMatch = body.results[0];
		var data = {
			address: bestMatch.formatted_address,
			location: bestMatch.geometry.location,
			name: bestMatch.name
		};
		cb(null, data);
	});
}
