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

// GET movies by genre
app.get('/movies/genre/:Name', asyncHandler(async (req, res, next) => {
  let movies = await Movies.find({ 'Genre.Name': req.params.Name });

  if (!movies) {
    res.status(404);
    throw new Error('Movie not found.');
  }

  res.status(200).json(movies);
}));


// GET directors information
app.get('/movies/directors/:Name', asyncHandler(async (req, res, next) => {
  let movies = await Movies.findOne({ 'Director.Name': req.params.Name });

  if (!movies) {
    res.status(404);
    throw new Error('Director not found.');
  }

  res.status(200).json(movies.Director);
}));


// Create User
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
app.post('/users/:Username/movies/:MovieID', asyncHandler(async (req, res, next) => {
  const updatedUser = await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $addToSet: { FavoriteMovies: req.params.MovieID } },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    res.status(404);
    throw new Error(`User "${req.params.Username}" not found`);
  }

  res.status(200).json(updatedUser);
}));


// Delets movie from user's favorite movies
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovie = user.favoriteMovie.filter(title => title !== movieTitle);
    res.status(200).send(`${movieTitle} has been removed from user ${id}'s favorite list`);
  } else {
    res.status(400).send('no such user')
  }
})

// Delets user's email
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    users = users.filter(user => user.id != id);
    res.status(200).send(`user Email has been removed`);
  } else {
    res.status(400).send('no such user')
  }
})

app.use(express.static('public'));

// Listen for request
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});