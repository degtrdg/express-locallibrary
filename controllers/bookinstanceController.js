var BookInstance = require("../models/bookinstance");
var Book = require("../models/book");
var { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find({})
    .populate("book")
    .exec(function (err, results) {
      if (err) {
        next(err);
      }
      res.render("bookinstance_list", {
        title: "Book Instances:",
        list: results,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, result) {
      if (err) {
        next(err);
      }
      if (!result) {
        var err = new Error("Book copy not found");
        err.status = 404;
        next(err);
      }
      res.render("bookinstance_detail", {
        title: "Copy: " + result.book.title,
        bookinstance: result,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find().exec(function (err, results) {
    if (err) {
      return next(err);
    }

    res.render("bookinstance_form", {
      title: "Create a Book Instance",
      books: results,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("imprint", "Imprint required").trim().isLength({ min: 1 }).escape(),
  body("due_back", "Date required")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1 })
    .isDate()
    .withMessage("Proper date required")
    .escape(),
  //I might not need the isDate so check that out
  (req, res, next) => {
    const errors = validationResult(req);

    var instance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });
    if (!errors.isEmpty()) {
      Book.find().exec(function (err, results) {
        const obj = {
          title: "Create a Book Instance",
          books: results,
          errors: errors.array(),
          due_back: req.body.due_back,
          status: req.body.status,
          bookinstance: instance,
          selected_book: instance.book._id,
        };
        console.log(obj);

        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Create a Book Instance",
          books: results,
          errors: errors.array(),
          due_back: req.body.due_back,
          status: req.body.status,
          bookinstance: instance,
          selected_book: instance.book._id,
        });
        return;
      });
    } else {
      instance.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(instance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED: BookInstance delete GET");
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res) {
  res.send("NOT IMPLEMENTED: BookInstance delete POST");
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res) {
  res.send("NOT IMPLEMENTED: BookInstance update GET");
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function (req, res) {
  res.send("NOT IMPLEMENTED: BookInstance update POST");
};
