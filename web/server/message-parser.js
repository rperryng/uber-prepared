'use strict';

var request = require('request');
var logger = require('logger');

module.exports = {
	parseLocation: parseLocation,
	parseConfirmation: parseConfirmation,
	parseTime: parseTime,
	parseCancel: parseCancel
};

function parseLocation(message, cb) {
	var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
	url += '?query=' + encodeURIComponent(message);
	url += '&key=' + process.env.API_KEY;

	request.get({url: url}, function (err, response, body) {
		if (err) return cb(err);

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

function parseConfirmation(message) {
	return /^y/i.test(message);
}

function parseTime(message) {
	var time = /^(\d\d?)[^\d]*([mh])[^\d]*(\d\d?)?/i.exec(message);
	var hoursOrMins = time[1];
	var timeUnit = time[2];
	var minutesOrNothing = time[3] || 0;

	var hours = 0;
	var minutes = 0;

	if (hoursOrMins && timeUnit) {
		if (timeUnit.toLowerCase() === 'h') {
			hours = hoursOrMins;
			minutes = minutesOrNothing;
		} else {
			hours = 0;
			minutes = hoursOrMins;
		}
	}

	return {hours: hours, minutes: minutes};
}

function parseCancel(message) {
	return /cancel/i.test(message);
}
