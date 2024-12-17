const express = require('express');
const WeatherData = require('./models/WeatherData');
const mongoose = require('mongoose');
const axios = require('axios');
const readline = require('readline');

require('dotenv').config();

const app = express();
const MONGO_URI = 'mongodb+srv://kmair1:7SZElhgGDwnzlxMY@cluster0.dqtzy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const API_K = "92d36a8535af86179c63db6f5c8c197c";

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// readline interface 
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Command line interface function refernced project 4 to implement this
async function startCommandLineInterface() {
  rl.setPrompt('Type Stop to shutdown the server: ');
  rl.prompt();

  rl.on('line', (line) => {
      line = line.trim();
      switch (line) {
          case 'stop':
              console.log("Shutting down the server");
              rl.close();
              process.exit(0);
          default:
              console.log(`Invalid command: ${line}`);
              break;
      }
      rl.prompt();
  }).on('close', () => {
      process.exit(0);
  });
}

// Obtaning cmd args
const args = process.argv.slice(2); 
const port = args[args.length - 1] || 3000;

// MongoDB connection
mongoose.connect(MONGO_URI, {
  //useNewUrlParser: true,
})
  .then(() => {
    app.listen(port, () => {
      console.log('Connected to MongoDB')
      console.log(`Server is running on http://localhost:${port}`);
      startCommandLineInterface();
    })
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Home route to display the form and weather data
app.get('/', async (req, res) => {
  const weatherRecords = await WeatherData.find().sort({ date: -1 }).limit(20); // Show 5 most recent weather queries
  res.render('index', { weatherRecords });
});

// POST route to handle form submission and fetch weather data
app.post('/get-weather', async (req, res) => {

  const city = req.body.city;
  const country = 'US';
  const state = 'MD';

  try {
    // Get geolocation data
    const geoResponse = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
      params: {
        q: city,country,state,
        limit: 1,
        appid: API_K,
      },
    });

    const location = geoResponse.data[0];

    if (!location) {
      return res.send('Location not found. Please try again with a valid city.');
    }

    // Step 2: Get  weather data using latitude and longitude
    const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: location.lat,
        lon: location.lon,
        appid: API_K,
        units: 'metric',
      },
    });

    const weather = weatherResponse.data;

    // Step 3: Save weather data to MongoDB
    const weatherData = new WeatherData({
      city: weather.name,
      temperature: weather.main.temp,
      condition: weather.weather[0].description,
    });
    await weatherData.save();

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.send('Error fetching weather data. Please try again.');
  }
});

// Removes all weather queries from database and displays number of queries removed
app.post('/remove', async (req, res) => {
  try {
      let deletedCount = await main(); 

      res.render('remove', {
          deletedCount: deletedCount
      });
  } catch (err) {
      console.error("Error during removal:", err);
      res.status(500).send("Error occurred while removing applicants.");
  }
   
});

// Helps with removing all users from database refernced mongo db examples 
async function main() {
  try {
      const result = await WeatherData.deleteMany({}); 
      const deletedCount = result.deletedCount;
      return deletedCount;

  } catch (e) {
      console.error(e);
      throw e; 
  }
}

