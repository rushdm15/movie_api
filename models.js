const mongoose = require("mongoose"); //Must require this
const bcrypt = require("bcrypt");


/**
 * Below is model schema,  defined through a set of keys and values that will 
 * dictate the format for documents of a certain collection.
 * The syntax is as follows:
 * let <collectionSchema> = mongoose.<Schema>({
 *   Key: {Value},
 *   Key: {Value},
 *   Key: {
 *     Key: Value,
 *     Key: Value
 *  }
 * });
*/
let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
  },
  Actors: [String],
  ImagePath: String,
  Featured: Boolean,
});

let userSchema = mongoose.Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
});

userSchema.statics.hashPassword = function (password) {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.Password);
};

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;

/**
 * Models should be kept in a seprate file (models.js)
 * Model = a class that constructs documents according to a specified schema, 
 * similar to how a table in SQL specifies all the properties, data types, 
 * and other settings (e.g., if they’re required) for the data it stores. 
 * A model specifies what data to store and how to store it for each document in a collection. 
 * This whole process is often referred to as business logic.
 * Execute npm install mongoose (or npm install mongoose --save),  install locally
 * -You must have MondoDB running before this command
 */
