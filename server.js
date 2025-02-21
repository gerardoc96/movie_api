const express = require("express"),
  fs = require('fs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');


const Movies = Models.Movie;
const Users = Models.User;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/MyFlix');
    console.log('Connected to MyFlix');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
connectDB();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// Centrelized Error handeling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
app.use((err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ message: err.message || 'Sever Error' });
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Welcome to MyFlix');
})

// GET all movies
app.get('/movies', asyncHandler(async (req, res, next) => {
  let movies = await Movies.find();

  if (!movies.length) {
    res.status(404);
    throw new Error('No movies available.');
  }

  res.status(200).json(movies);
}));

// GET a movie by title
app.get('/movies/:Title', asyncHandler(async (req, res, next) => {
  let movies = await Movies.findOne({ Title: req.params.Title });

  if (!movies) {
    res.status(404);
    throw new Error('Movie not found.');
  }

  res.status(200).json(movies);
}));

// GET information on a genre
app.get('/movies/genre/:genreName', asyncHandler(async (req, res, next) => {
  let genres = await Movies.findOne({ 'Genre.Name': req.params.genreName });

  if (!genres) {
    res.status(404);
    throw new Error('Genre not found.');
  }

  res.status(200).json(genres.Genre);
}));


// GET directors information
app.get('/movies/directors/:directorName', asyncHandler(async (req, res, next) => {
  let directors = await Movies.findOne({ 'Director.Name': req.params.directorName });

  if (!directors) {
    res.status(404);
    throw new Error('Director not found.');
  }

  res.status(200).json(directors.Director);
}));


// Create a new user
app.post('/users', asyncHandler(async (req, res, next) => {
  let existingUser = await Users.findOne({ Username: req.body.Username });

  if (existingUser) {
    res.status(404);
    throw new Error(`${req.body.Username} already exists`);
  }

  let newUser = await Users.create({
    Username: req.body.Username,
    Password: req.body.Password,
    Email: req.body.Email,
    Birthday: req.body.Birthday
  });

  res.status(201).json(newUser);
}));

// Update user's info
app.put('/users/:Username', asyncHandler(async (req, res, next) => {
  let updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true })

  if (!updatedUser) {
    res.status(404);
    throw new Error(`User ${req.params.Username} does not exists`);
  }

  res.status(200).json(updatedUser);
}));

// Adds movie to user's favorite movies
app.post('/users/:Username/:MovieID', asyncHandler(async (req, res, next) => {
  const updatedUser = await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $addToSet: { FavoriteMovies: req.params.MovieID } },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    res.status(404);
    throw new Error(`User "${req.params.Username}" not found`);
  }

  res.status(200).send(`${req.params.MovieID} has been added to ${req.params.Username}'s favorite list`);
}));


// Deletes movie from user's favorite movies
app.delete('/users/:Username/:MovieID', asyncHandler(async (req, res, next) => {
  const updatedUserFav = await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $pull: { FavoriteMovies: req.params.MovieID } },
    { new: true, runValidators: true }
  );

  if (!updatedUserFav) {
    res.status(404);
    throw new Error(`User "${req.params.Username}" not found`);
  }

  res.status(200).send(`${req.params.MovieID} has been removed from ${req.params.Username}'s favorite list`);
}));


// Delets a user by username
app.delete('/users/:Username', asyncHandler(async (req, res, next) => {
  const deletedUser = await Users.findOneAndDelete({ Username: req.params.Username });

  if (!deletedUser) {
    res.status(404);
    throw new Error(`User "${req.params.Username}" not found`);
  }

  res.status(200).send(`${req.params.Username} was deleted`);
}));

// Listen for request
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});