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
		logger.info(body);
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
	var time = /^(\d\d?)\s?:?\s?(\d\d)?\s?(\w)?/i.exec(message);
	var hours = time[1];
	var minutes = time[2] || 0;
	var marker = time[3];

	logger.info('TimeParser hours %d minutes %d', hours, minutes);

	if (!hours && (hours < 0 || hours >= 24)) {
		hours = undefined;
	}

	if (!minutes && (minutes < 0 || minutes >= 60)) {
		minutes = undefined;
	}

	if ((hours !== undefined && hours !== null) && (hours < 12 && marker !== undefined)) {
		hours = parseInt(hours);
		hours += (marker.toLowerCase() === 'p') ? 12 : 0;
	}

	return {hours: hours, minutes: minutes};
}

function parseCancel(message) {
	return /cancel/i.test(message);
}