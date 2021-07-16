var Book = require("../models/book");
var BookInstance = require("../models/bookinstance");
var Author = require("../models/author");
var Genre = require("../models/genre");
var async = require("async");
var { body, validationResult } = require("express-validator");

exports.index = function (req, res) {
  async.parallel(
    {
      author: function (callback) {
        Author.countDocuments({}, callback);
      },
      genre: function (callback) {
        Genre.countDocuments({}, callback);
      },
      book: function (callback) {
        Book.countDocuments({}, callback);
      },
      bookinstance: function (callback) {
        BookInstance.countDocuments({}, callback);
      },
      bookavailable: function (callback) {
        BookInstance.countDocuments({ status: "Available" }, callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Local Library Home",
        error: err,
        data: results,
      });
    }
  );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.find({}, "title author")
    .populate("author")
    .exec(function (err, list_books) {
      if (err) {
        return next(err);
      }
      res.render("book_list", { title: "Book List", book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate("_id")
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      book_instances: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("book_detail", {
        title: results.book.title,
        book: results.book,
        book_instances: results.book_instances,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
  async.parallel(
    {
      authors: function (callback) {
        Author.find().exec(callback);
      },
      genres: function (callback) {
        Genre.find().exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("book_form", {
        title: "Create Book",
        genres: results.genres,
        authors: results.authors,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        console.log();
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    // Does this work without the next?
    next();
  },
  body("title", "Title is required").trim().isLength({ min: 1 }).escape(),
  body("author", "Author is required").trim().isLength({ min: 1 }).escape(),
  body("summary", "Summary is required").trim().isLength({ min: 1 }).escape(),
  body("isbn", "ISBN is required").trim().isLength({ min: 1 }).escape(),
  body("genre.*", "At least one genre is required").escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: function (callback) {
            Author.find().exec(callback);
          },
          genres: function (callback) {
            Genre.find().exec(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }
          console.log(results.genres.length);
          for (let i; i < results.genres.length - 1; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Create a book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors,
          });
        }
      );
    } else {
      book.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(book.url);
      });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Book delete GET");
};

exports.book_delete_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Book delete POST");
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        console.log(req.params.id);
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      authors: function (callback) {
        Author.find().exec(callback);
      },
      genres: function (callback) {
        Genre.find().exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (!results.book) {
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // if this doesn't work, it's probably this loop
      for (
        let genreIter = 0;
        genreIter < results.genres.length - 1;
        genreIter++
      ) {
        for (
          let bgenreIter = 0;
          bgenreIter < results.book.genre.length - 1;
          bgenreIter++
        ) {
          if (
            results.genres[genreIter]._id.toString() ==
            results.book.genres[bgenreIter]._id.toString()
          ) {
            results.genres[genreIter].checked = "true";
          }
        }
      }
      res.render("book_form", {
        title: "Update book",
        books: results.book,
        genres: results.genres,
        authors: results.authors,
      });
    }
  );
};

// Handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      // if this doesn't work wrap undefined in ''
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
        return;
      }
      req.body.genres = Array(req.body.genres);
    }
    next();
  },
  body("genre").trim().escape().isLength({ min: 1 }),
  body("title").trim().escape().isLength({ min: 1 }),
  body("author").trim().escape().isLength({ min: 1 }),
  body("summary").trim().escape().isLength({ min: 1 }),
  body("isbn").trim().escape().isLength({ min: 1 }),

  (req, res, next) => {
    var errors = validationResult(req);

    // make a new book object with given params
    const book = new Book({
      title: req.body.title,
      genre: typeof req.body.genre != "undefined" ? req.body.genre : [],
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      _id: req.params.id,
    });

    // check if there are any errors
    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: function (callback) {
            Author.find().exec(callback);
          },
          genres: function (callback) {
            Genre.find().exec(callback);
          },
        },
        function (err, results) {
          if (err) {
            next(err);
          }
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id)) {
              results.genres[i].checked = "true";
            }
          }
          res.render("book_form", {
            title: "Update Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors,
          });
          return;
        }
      );
    }

    Book.findByIdAndUpdate(req.params.id, book, function (err, results) {
      if (err) {
        return next(err);
      }
      res.redirect(results.url);
    });
    // otherwise render page while updating stuff
  },
];
