// require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Models = require("./models.js");
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const passport = require("passport");
require("./passport");
const cors = require("cors");
let allowedOrigins = [
  "http://localhost:8080",
  "http://testsite.com",
  "http://localhost:1234",
];

const { check, validationResult } = require("express-validator");

const Movies = Models.Movie;
const Users = Models.User;
const app = express();

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());
let auth = require("./auth")(app);
app.use(morgan("common"));
app.use(express.static("public"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to my movie club!");
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn't found on the list of allowed allowedOrigins

        let message =
          "The CORS policy for this application doesn't allow acces from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

// Gets the list of data about ALL movies
app.get(
  "/movies",

  passport.authenticate("jwt", {
    session: false,
  }),

  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Gets the data about a single movie, by title
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get data about a genre by title
app.get(
  "/movies/Genres/:Title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res
          .status(201)
          .json(
            "Genre: " +
            movie.Genre.Name +
            ". Description: " +
            movie.Genre.Description
          );
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

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
// app.post(
//   "/users",
//   // Validation logic here for request
//   //you can either use a chain of methods like .not().isEmpty()
//   //which means "opposite of isEmpty" in plain english "is not empty"
//   //or use .isLength({min: 5}) which means
//   //minimum value of 5 characters are only allowed
//   [
//     check("Username", "Username is required").isLength({ min: 5 }),
//     check(
//       "Username",
//       "Username contains non alphanumeric characters - not allowed."
//     ).isAlphanumeric(),
//     check("Password", "Password is required").not().isEmpty(),
//     check("Email", "Email does not appear to be valid").isEmail(),
//   ],
//   (req, res) => {
//     // check the validation object for errors
//     let errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(422).json({ errors: errors.array() });
//     }

//     let hashedPassword = Users.hashPassword(req.body.Password);

//     Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
//       .then((user) => {
//         if (user) {
//           //If the user is found, send a response that it already exists
//           return res.status(400).send(req.body.Username + "already exists");
//         } else {
//           Users.create({
//             Username: req.body.Username,
//             Password: req.body.Password,
//             Email: req.body.Email,
//             Birthday: req.body.Birthday,
//           })
//             .then((user) => {
//               res.status(201).json(user);
//             })
//             .catch((error) => {
//               console.error(error);
//               res.status(500).send("Error: " + error);
//             });
//         }
//       })
//       .catch((error) => {
//         console.error(error);
//         res.status(500).send("Error: " + error);
//       });
//   }
// );

app.post(
  "/users",
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  // passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      let hashedPassword = await bcrypt.hash(req.body.Password, 10);

      let user = await Users.findOne({ Username: req.body.Username });
      if (user) {
        return res.status(400).send(req.body.Username + "already exists");
      }

      let usercreate = await Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      });
      //https://flexnet91.herokuapp.com

      return res.status(201).json(usercreate);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error: " + error);
    }
  }
);

// Deletes a movie from list of user's favorite movies
app.delete("/users/:Username/movies/:_id",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndUpdate(
      {
        Username: req.params.Username,
      },
      {
        $pull: {
          FavoriteMovies: req.params._id,
        },
      },
      {
        new: true,
      },
      // This line makes sure that the updated document is returned
      function (err, updatedUser) {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// Get all users
app.get("/users",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  });

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
app.put("/users/:Username",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
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
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Add a movie to a user's list of favorites
app.post(
  "/users/:Username/Movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findByIdAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
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
  }
);

// Gets the director of a movie
app.get(
  "/movies/:title/director",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Director.Name": req.params.Name })
      .then((movie) => {
        res
          .status(201)
          .json(
            "Name: " +
            movie.Director.Name +
            ". Bio: " +
            movie.Director.Bio +
            " Birth: " +
            movie.Director.Birth +
            ". Death: " +
            movie.Director.Death +
            "."
          );
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Delete a user from registration database
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//Allow existing users to deregister (showing only a text that a user email has been removed—more on this later)

// app.listen(8080, () => {
//   console.log("Your app is listening on port 8080");
// });

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
