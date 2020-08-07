var async = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookInstance');


exports.index = function(req, res) {
    console.log('In Book Controller');
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

exports.index_api = function(req, res) {
    async.parallel({
        bookCount: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        bookInstanceCount: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        bookInstanceAvailableCount: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        authorCount: function(callback) {
            Author.countDocuments({}, callback);
        },
        genreCount: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        if(err){
            return res.status(500).json({
                error: err.message
            })
        }
        res.status(200).json({
            data: results
        })
        // res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// Display list of all books.
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author').populate('author').then(books => {
        res.render('book_list', {title: 'Book List', book_list: books})
    }).catch(err => {
        next(err)
    })
};

exports.book_list_api = function(req, res, next) {
    Book.find({}, 'title author').populate('author').then(books => {
        // res.render('book_list', {title: 'Book List', book_list: books})
        res.status(200).json({
            books: books
        })
    }).catch(err => {
        return res.status(500).json({
            error: err.message
        })
    })
};

// Display detail page for a specific book.
exports.book_detail = function(req, res,next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
        },
        bookInstance: function(callback){
            BookInstance.find({
                book: req.params.id
            }, callback);
        }
    },
    function(err, results){
        if(err){
            return next(err)
        }
        if(results.book == null){
            res.status = 404;
            return next(new Error('No Book Found'))
        }

        res.render('book_detail', {
            title: 'Book Detail',
            book: results.book,
            book_instances: results.bookInstance
        })
    })
};

exports.book_detail_api = function(req, res,next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
        },
        bookInstance: function(callback){
            BookInstance.find({
                book: req.params.id
            }, callback);
        }
    },
    function(err, results){
        if(err){
            return res.status(500).json({
                error: err.message
            })
        }
        if(results.book == null){
            const error = new Error('No Book Found')
            return res.status(404).json({
                error: error.message
            })
        }

        res.status(200).json({
            book: results.book,
            bookInstances: results.bookInstance
        })
    })
};

// Display book create form on GET.
exports.book_create_get = function(req, res) {
    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });
};

exports.book_create_get_api = function(req, res) {
    
    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { 
            return res.status(500).json({
            error: err.message
        }) 
    }

    res.status(200).json({
        authors: results.authors,
        genres: results.genres
    })
    });
};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),
  
    // Sanitize fields (using wildcard).
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];

exports.book_create_post_api = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),
  
    // Sanitize fields (using wildcard).
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { 
                    return res.status(500).json({
                        error: err.message
                    })
                 }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.status(400).json({
                    authors:results.authors,
                    genres:results.genres, 
                    book: book, 
                    error: "Validation Error",
                    errors: errors.array()
                })
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { 
                    return res.status(500).json({
                        error: err.message
                    })
                 }
                   //successful - redirect to new book record.
                   res.status(201).json({
                       book:book
                   });
                });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
          },
          bookInstances: function(callback) {
            BookInstance.find({ 'book': req.params.id }).exec(callback)
          },
    }, function(err, results){
         if(err){
             return next(err)
         }
 
         if(results.book == null){
             console.log('Null');
             res.status(404);
             res.redirect('/catalog/books');
             return;
         }
 
         res.render('book_delete', {
             title: 'Delete Book',
             book: results.book,
             book_instances: results.bookInstances
         })
    })
};

exports.book_delete_get_api = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
          },
          bookInstances: function(callback) {
            BookInstance.find({ 'book': req.params.id }).exec(callback)
          },
    }, function(err, results){
         if(err){
             return res.status(500).json({
                 error: err.message
             })
         }
 
         if(results.book == null){
             console.log('Null');
             res.status(404).json({
                 error: 'No book exists for this ID'
             });
            //  res.redirect('/catalog/books');
             return;
         }
 
         res.status(200).json( {
             book: results.book,
             bookInstances: results.bookInstances
         })
    })
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book: function(callback) {
          Book.findById(req.body.bookid).populate('author').populate('genre').exec(callback)
        },
        bookInstances: function(callback) {
          BookInstance.find({ 'book': req.body.bookid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        console.log('//Success');
        if (results.bookInstances.length > 0) {
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.bookInstances } );
            return;
        }
        else {
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                // Success - go to books list
                res.redirect('/catalog/books')
            })
        }
    });
};

exports.book_delete_post_api = function(req, res, next) {
    async.parallel({
        book: function(callback) {
          Book.findById(req.body.bookid).populate('author').populate('genre').exec(callback)
        },
        bookInstances: function(callback) {
          BookInstance.find({ 'book': req.body.bookid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { 
            return  res.status(500).json({
            error: err.message
        }) 
    }
        // Success
        console.log('//Success');
        if(results.book == null){
            console.log('Null');
            res.status(404).json({
                error: 'No book exists for this ID'
            });
           //  res.redirect('/catalog/books');
            return;
        }
        if (results.bookInstances.length > 0) {
            res.status(405).json({
                error: 'Delete the copies of this book, before trying delete this book',
                book: results.book, 
                bookInstances: results.bookInstances 
            } );
            return;
        }
        else {
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { 
                    return res.status(500).json({
                        error: err.message
                    })
                 }
                // Success - go to books list
                res.status(200).json({
                    success: true
                })
            })
        }
    });
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { // No results.
                var err = new Error('Book not found');
                res.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
        });

};

exports.book_update_get_api = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { 
                return res.status(500).json({
                    error: err.message
                })
             }
            if (results.book==null) { // No results.
                var err = new Error('Book not found');
                return res.status(404).json({
                    error: err.message
                })
            }
            // Success.
            // Mark our selected genres as checked.
            for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            res.status(200).json({ 
                authors: results.authors, 
                genres: results.genres, 
                book: results.book 
            });
        });

};

// Handle book update on POST.
exports.book_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },
   
    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

    // Sanitize fields.
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
];

exports.book_update_post_api = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },
   
    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),

    // Sanitize fields.
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { 
                    return res.status(500).json({
                        error: err.message
                    })
                }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.status(400).json({
                    error: "Validation Error",
                    errors: errors.array(),
                    authors: results.authors, 
                    genres: results.genres, 
                    book: book
                })
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book,{new: true, runValidators: true}, function (err,updatedBook) {
                if (err) { 
                    return res.status(500).json({
                        error: err.message
                    })
                 }
                   // Successful - redirect to book detail page.
                   res.status(200).json({
                       book: updatedBook
                   });
                });
        }
    }
];