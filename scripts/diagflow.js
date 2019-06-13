// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
const http = require('http');

exports.weatherWebhook = (req, res) => {
    if (req.body.metadata.intentName == "Weather intent") {
        HandleWeather(req, res);
    } else if (req.body.metadata.intentName == "Bitcoin conversion intent") {
        HandleBtcConvertion(res);
    }
};

function HandleBtcConvertion(res) {
    callBtcTradeApi().then((output) => {
        // Return the results of the weather API to Dialogflow
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
    });
}


function callBtcTradeApi() {
    const host = 'https://api.bitcointrade.com.br';
    const apiKey = 'U2FsdGVkX1+Xt8N9NmAVW7Kn2v0rQ5fVPYf8z4Y/yzg=';

    return new Promise((resolve, reject) => {
        // Create the path for the HTTP request to get the weather
        let path = '/v1/market/estimated_price?amount=1&currency=BTC&type=buy';
        console.log('API Request: ' + host + path);
        // Make the HTTP request to get the weather
        http.get({ host: host, path: path, headers: { 'Authorization': 'ApiToken ' + apiKey } }, (res) => {
            let body = ''; // var to store the response chunks
            res.on('data', (d) => { body += d; }); // store each response chunk
            res.on('end', () => {
                // After all the data has been received parse the JSON for desired data
                let response = JSON.parse(body);
                let price = response['data']['price'][0];
                let dateNow = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

                // Create response
                let output = "Cotação BTC: R$" + price + " (" + dateNow + ")";
                // Resolve the promise with the output text
                console.log(output);
                resolve(output);
            });
            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}

function HandleWeather(req, res) {
    let city = req.body.result.contexts[0].parameters['geo-city']; // city is a required param
    // Get the date for the weather forecast (if present)
    let date = '';
    if (req.body.result.contexts[0].parameters['date']) {
        date = req.body.result.contexts[0].parameters['date'];
        console.log('Date: ' + date);
    }

    callWeatherApi(city, date).then((output) => {
        // Return the results of the weather API to Dialogflow
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
    });
}

function callWeatherApi(city, date) {

    const wwoHost = 'api.worldweatheronline.com';
    const wwoApiKey = 'ec56115089594af4b4f235911181503';

    return new Promise((resolve, reject) => {
        // Create the path for the HTTP request to get the weather
        let path = '/premium/v1/weather.ashx?format=json&num_of_days=1' +
            '&q=' + encodeURIComponent(city) + '&key=' + wwoApiKey + '&date=' + date;
        console.log('API Request: ' + wwoHost + path);
        // Make the HTTP request to get the weather
        http.get({ host: wwoHost, path: path }, (res) => {
            let body = ''; // var to store the response chunks
            res.on('data', (d) => { body += d; }); // store each response chunk
            res.on('end', () => {
                // After all the data has been received parse the JSON for desired data
                let response = JSON.parse(body);
                let forecast = response['data']['weather'][0];
                let location = response['data']['request'][0];
                let conditions = response['data']['current_condition'][0];
                let currentConditions = conditions['weatherDesc'][0]['value'];
                // Create response
                let output = `Current conditions in ${location['query']} are ${currentConditions} with a projected high of ${forecast['maxtempC']}°C or ${forecast['maxtempF']}°F and a low of ${forecast['mintempC']}°C or ${forecast['mintempF']}°F on ${forecast['date']}.`;
                // Resolve the promise with the output text
                console.log(output);
                resolve(output);
            });
            res.on('error', (error) => {
                reject(error);
            });
        });
    });
}

