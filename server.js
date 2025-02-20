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


app.get('/', (req, res) => {
  res.send('Welcome to MyFlix');
})

// GET all movies
app.get('/movies', (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// GET all Users
app.get('/users', (req, res) => {
  Users.find()
    .then((user) => {
      res.status(201).json(user);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});


// GET movie by title
app.get('/movies/:Title', (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.status(201).json(movie);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// GET movies by genre
app.get('/movies/genre/:Name', (req, res) => {
  Movies.find({ 'Genre.Name': req.params.Name })
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});


// GET directors information
app.get('/movies/directors/:Name', (req, res) => {
  Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movie) => {
      res.status(200).json(movie.Director);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});


// Create User
app.post('/users', (req, res) => {
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exist');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
          .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Update user's username
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find(user => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('no such user')
  }
})

// Adds movie to user's favorite movies
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovie.push(movieTitle)
    res.status(200).send(`${movieTitle} has been added to user ${id}'s favorite movies`);
  } else {
    res.status(400).send('no such user')
  }
})

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Listen for request
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});