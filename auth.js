const jwtSecret = "your_jwt_secret"; //This has to be the same key used in the JWTStrategy

const jwt = require("jsonwebtoken"),
  passport = require("passport");

require("./passport"); //Your local passport filter

let generateJWTToken = user => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, //This is the username you're encoding in the JWTStrategy
    expiresIn: "7d", //This specifies that the tokem will expire in 7 days
    algorithm: "HS256" //This is the algorithm used to "sign" or encode the values of the JWTStrategy
  });
};

/* POST login. */
module.exports = router => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user
        });
      }
      req.login(user, { session: false }, error => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};

/**
 * JWT—JSON Web Token—is a JSON-based standard for creating web tokens that can be 
 * used for authentication (and authorization). 
 * It’s the de facto standard for most modern web applications. 
 * You’ll use a middleware library called Passport to generate JWTs for you!
 * The first thing you need to do is install Passport, 
 * and the libraries for the authentication methods:
 * $ npm install --save passport
 * $ npm install --save passport-local
 * $ npm install --save passport-jwt
 * $ npm install --save jsonwebtoken
 * 
 * OR single command:
 * npm install --save passport passport-local passport-jwt jsonwebtoken
 */