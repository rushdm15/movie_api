const mongoose = require("mongoose");
const Models = require("./models.js");
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");

const Movies = Models.Movie;
const Users = Models.User;
const app = express();

mongoose.connect("mongodb://localhost:27017/myFlixDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(bodyParser.json());
app.use(morgan("common"));
app.use(express.static("public"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

let movies = [
  {
    title: "Harry Potter and the Sorcerer's Stone",
    director: "J.K. Rowling"
  },
  {
    title: "Lord of the Rings",
    director: "J.R.R. Tolkien"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  },
  {
    title: "Twilight",
    director: "Stephanie Meyer"
  }
];

// GET requests
// app.get("/", (req, res) => {
//   res.send("Welcome to my movie club!");
// });
//
// app.get("/documentation", (req, res) => {
//   res.sendFile("public/documentation.html", { root: __dirname });
// });
//
// app.get("/movies", (req, res) => {
//   res.json(topMovies);
// });

// // listen for requests
// app.listen(8080, () => {
//   console.log("Your app is listening on port 8080.");
// });

// Gets the list of data about ALL movies

app.get("/movies", (req, res) => {
  res.json(movies);
});
// Gets the data about a single movie, by title

app.get("/movies/:title", (req, res) => {
  res.json(
    movies.find(movie => {
      return movie.title === req.params.title;
    })
  );
});

//Return data about a genre (description) by name/title (e.g., “Thriller”)

//Allow new users to register
//Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post("/users", (req, res) => {
  Users.findOne({ Username: req.body.Username })
    .then(user => {
      if (user) {
        return res.status(400).send(req.body.Username + "already exists");
      } else {
        Users.create({
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
          .then(user => {
            res.status(201).json(user);
          })
          .catch(error => {
            console.error(error);
            res.status(500).send("Error: " + error);
          });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send("Error: " + error);
    });
});

// Adds data for a new movie to our list of favorites.
app.post("/movies", (req, res) => {
  let newMovie = req.body;

  if (!newMovie.title) {
    const message = "Missing title in request body";
    res.status(400).send(message);
  } else {
    newMovie.title = uuid.v4();
    movies.push(newMovie);
    res.status(201).send(newMovie);
  }
});

// Deletes a movie from our list of favorites
app.delete("/movies/:title", (req, res) => {
  let movie = movies.find(movie => {
    return movie.title === req.params.title;
  });

  if (movie) {
    movies = movies.filter(obj => {
      return obj.title !== req.params.title;
    });
    res.status(201).send("Movie " + req.params.title + " was deleted.");
  }
});

// Get all users
app.get("/users", (req, res) => {
  Users.find()
    .then(users => {
      res.status(201).json(users);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// // Update the "user info" of a user by username
// app.put("/users/:username", (req, res) => {
//   let movie = movies.find(movie => {
//     return movie.title === req.params.title;
//   });
// });

// Update a user's info, by username
/* We’ll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/
app.put("/users/:Username", (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

// Get a user by username
app.get("/users/:Username", (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then(user => {
      res.json(user);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// Add a movie to a user's list of favorites
app.post("/users/:Username/Movies/:MovieID", (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $push: { FavoriteMovies: req.params.MovieID }
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

//   if (movie) {
//     movie.classes[req.params.class] = parseInt(req.params.grade);
//     res
//       .status(201)
//       .send(
//         "Movie " +
//           req.params.name +
//           " was assigned a grade of " +
//           req.params.grade +
//           " in " +
//           req.params.class
//       );
//   } else {
//     res
//       .status(404)
//       .send("User with the username " + req.params.name + " was not found.");
//   }
// });

// Gets the director of a movie
app.get("/movies/:title/director", (req, res) => {
  let movie = movies.find(movie => {
    return movie.title === req.params.title;
  });

  if (movie) {
    let movieDirector = Object.values(movie.director); // Object.values() filters out object's keys and keeps the values that are returned as a new array
    // let sumOfGrades = 0;
    // classesGrades.forEach(grade => {
    //   sumOfGrades = sumOfGrades + grade;
    // });

    // let gpa = sumOfGrades / classesGrades.length;
    // console.log(sumOfGrades);
    // console.log(classesGrades.length);
    // console.log(gpa);
    // res.status(201).send("" + gpa);
    // //res.status(201).send(gpa);
  } else {
    res
      .status(404)
      .send("Director with the name " + req.params.name + " was not found.");
  }
});

//Allow existing users to deregister (showing only a text that a user email has been removed—more on this later)

app.listen(8080, () => {
  console.log("Your app is listening on port 8080");
});
