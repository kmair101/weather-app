const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  condition: String,
});

const WeatherData = mongoose.model('WeatherData', weatherSchema);

module.exports = WeatherData;
