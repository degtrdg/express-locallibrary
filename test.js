var Book = require("./models/book");

console.log(Book.find({}, "title author"));
