const express = require("express"),
  morgan = require('morgan');
fs = require('fs');
path = require('path');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })

let topMovies = [
  {
    title: '',
    director: ''
  }
]

app.use(morgan('combined', { stream: accessLogStream }));

// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix');
})

app.use(express.static('public'));

app.get('/movies', (req, res) => {
  res.json(topMovies);
})

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Listen for request
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});