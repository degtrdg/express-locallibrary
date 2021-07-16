var Author = require("../models/author");
var Book = require("../models/book");
var async = require("async");
const { body, validationResult } = require("express-validator");
const genre = require("../models/genre");

exports.author_list = function (req, res, next) {
  // if doesn't work change sort
  Author.find()
    .sort({ family_name: "asc" })
    .exec(function (err, result) {
      if (err) {
        return next(err);
      }
      console.log(result);
      res.render("author_list", { title: "Author List:", list: result });
    });
};

exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      books: function (callback) {
        Book.find({ author: req.params.id })
          .sort({ title: "asc" })
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        next(err);
      }
      if (!results.author) {
        res.status = 404;
        var error = new Error("Author not found");
        next(error);
      } else {
        res.render("author_detail", {
          title: "Author Details: ",
          author: results.author,
          books: results.books,
        });
      }
    }
  );
};
exports.author_create_get = function (req, res) {
  res.render("author_form", { title: "Create Author" });
};
exports.author_create_post = [
  body("first_name", "First Name required")
    .trim()
    .isLength({ min: 1 })
    .isAlphanumeric()
    .withMessage("No special stuff")
    .escape(),
  body("family_name", "Last Name required")
    .trim()
    .isLength({ min: 1 })
    .isAlphanumeric()
    .escape(),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Create Author",
        author: req.body,
        date_of_birth: req.body,
        date_of_death: req.body,
        errors: errors.array(),
      });
      return;
    }

    var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_death: req.body.date_of_death,
      date_of_birth: req.body.date_of_birth,
    });
    Author.findOne({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_death: req.body.date_of_death,
      date_of_birth: req.body.date_of_birth,
    }).exec(function (err, result) {
      if (err) {
        return next(err);
      }
      if (result) {
        res.redirect(result.url);
      } else {
        author.save(function (err) {
          if (err) {
            return next(err);
          }
          res.redirect(author.url);
        });
      }
    });
  },
];

exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      author_books: function (callback) {
        // if this doesn't work wrap author in quotes
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        res.redirect("/catalog/authors");
        return;
      }
      res.render("author_delete", {
        title: "Delete Author",
        author: results.author,
        books: results.author_books,
      });
    }
  );
};

exports.author_delete_post = function (req, res) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.authorid).exec(callback);
      },
      author_books: function (callback) {
        // if this doesn't work wrap author in quotes
        Book.find({ author: req.params.authorid }).exec(callback);
      },
    },

    function (err, result) {
      if (err) {
        return next(err);
      }

      if (result.author_books.length > 0) {
        res.render("author_delete", {
          title: "Delete Author",
          author: result.author,
          books: result.author_books,
        });
        return;
      }
      Author.findByIdAndDelete(req.body.authorid, function (err) {
        if (err) {
          next(err);
        }
        res.redirect("/catalog/authors");
      });
    }
  );
};
exports.author_update_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Author update get");
};
exports.author_update_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Author update post");
};
