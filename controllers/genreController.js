var async = require('async');
var validator = require('express-validator');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var Genre = require('../models/genre');
var Book = require('../models/book');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find({}, (err, genre_list) => {
        if(err){
            return next(err);
        }
        res.render('genre_list', {
            title: 'Genre List',
            genre_list
        });
    })
};

exports.genre_list_api = function(req, res) {
    Genre.find({}, (err, genre_list) => {
        if(err){
            return res.status(500).json({
                error: err.message
            });
        }
        res.status(200).json({
            genres: genre_list
        });
    })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback){
            Book.find({
                genre: req.params.id
            }).exec(callback);
        }
    },
    function(err, results){
        if(err){
            return next(err);
        }

        if(results.genre ==  null){
            res.status(404)
            next(new Error('Genre not found'))
        }

        res.render('genre_detail', {
            title: 'Genre Detail',
            genre: results.genre,
            genre_books: results.genre_books
        });
    })
};

exports.genre_detail_api = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback){
            Book.find({
                genre: req.params.id
            }).exec(callback);
        }
    },
    function(err, results){
        if(err){
            return res.status(500).json({
                error: err.message
            });
        }

        if(results.genre ==  null){
            return res.status(404).json({
                error: 'Genre not found'
            });
        }

        res.status(200).json({
            genre: results.genre,
            genreBooks: results.genre_books
        });
    })
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = function(req, res,next) {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre( { name: req.body.name });


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
      return;
    }else{

        Genre.findOne({ name: req.body.name }).exec(function(err, existing_genre){
            if(err){
                return next(err);
            }
            if(existing_genre){
                return res.redirect(existing_genre.url);
            }else{
                genre.save(function(err, savedGenre){
                    if(err){
                        return next(err)
                    }
                    res.redirect(savedGenre.url);
                })
            }
        })
    }
};

exports.genre_create_post_api = function(req, res,next) {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre( { name: req.body.name });


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.status(400).json({
           error: "Validation Error",
           genre: genre, 
           errors: errors.array()
        });
      return;
    }else{

        Genre.findOne({ name: req.body.name }).exec(function(err, existing_genre){
            if(err){
                return res.status(500).json({
                    error: err.message
                });
            }
            if(existing_genre){
                return res.status(400).json({
                    error: "Genre already exists"
                });
            }else{
                genre.save(function(err, savedGenre){
                    if(err){
                        return res.status(500).json({
                            error: err.message
                        })
                    }
                    res.status(201).json({
                        genre: savedGenre
                    });
                })
            }
        })
    }
};

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback){
            Book.find({
                'genre': req.params.id
            }).exec(callback)
        }
    }, function(err, results){
         if(err){
             return next(err)
         }
 
         if(results.genre == null){
             res.status(404);
             res.redirect('/catalog/genres');
             return;
         }
 
         res.render('genre_delete', {
             title: 'Delete Genre',
             genre: results.genre,
             genre_books: results.genre_books
         })
    })
};

exports.genre_delete_get_api = function(req, res) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback){
            Book.find({
                'genre': req.params.id
            }).exec(callback)
        }
    }, function(err, results){
         if(err){
            return res.status(500).json({
                error: err.message
            })
         }
 
         if(results.genre == null){
             return res.status(404).json({
                error: "Genre not found, it might have been deleted already"
            })
         }
 
         res.status(200).json({
             genre: results.genre,
             genreBooks: results.genre_books
         })
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
          Genre.findById(req.body.genreid).exec(callback)
        },
        genre_books: function(callback) {
          Book.find({ 'genre' : req.body.genreid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        console.log('//Success');
        if (results.genre_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
            return;
        }
        else {
            Genre.findByIdAndRemove(req.body.genreid, function deletegenre(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/genres')
            })
        }
    });    
};

exports.genre_delete_post_api = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
          Genre.findById(req.body.genreid).exec(callback)
        },
        genre_books: function(callback) {
          Book.find({ 'genre' : req.body.genreid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { 
            return res.status(500).json({
                error: err.message
            })
         }
        // Success
        
        console.log('//Success');
        if(results.genre == null){
            res.status(404).json({ 
                error: 'No Genre Found for this Name'
            } );
            return; 
        }
        if (results.genre_books.length > 0) {
            res.status(405).json({ 
                genre: results.genre, 
                genreBooks: results.genre_books,
                error: 'Can\'t delete Genre as it has books associated'
            } );
            return;
        }
        else {
            Genre.findByIdAndRemove(req.body.genreid, function deletegenre(err) {
                if (err) { 
                    return res.status(500).json({
                        error: err.message
                    })
                 }
                res.status(200).json({
                    success: true
                })
            })
        }
    });    
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec(function(err, genre ){
        if(err){
            return next(err)
        }
        if(genre == null){
            res.status(404)
            return next("Genre not found")
        }
        res.render('genre_form', { title: 'Update Genre', genre: genre});
    })
   
};

exports.genre_update_get_api = function(req, res, next) {
    Genre.findById(req.params.id).exec(function(err, genre ){
        if(err){
            return res.status(500).json({
                err: err.message
            })
        }
        if(genre == null){
            return res.status(404).json({
                err: err.message
            })
        }
        res.render('genre_form', { title: 'Update Genre', genre: genre});
    })
   
};

// Handle Genre update on POST.
exports.genre_update_post = [validator.body('name', 'Genre name required').trim().isLength({ min: 1 }),
                            validator.sanitizeBody('name').escape(),
                            function(req, res, next){
    const errors = validator.validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = { name: req.body.name };


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array()});
      return;
    }else{

        Genre.findOne({ name: req.body.name }).exec(function(err, existing_genre){
            if(err){
                return next(err);
            }
            if(existing_genre){
                return res.redirect(existing_genre.url);
            }else{
                Genre.findByIdAndUpdate(req.params.id, genre, {new: true, runValidators: true}).exec(function(err, updatedGenre){
                    if(err){
                        return next(err)
                    }
                    res.redirect(updatedGenre.url);
                })
                
            }
        })
    }
}]


exports.genre_update_post_api = [validator.body('name', 'Genre name required').trim().isLength({ min: 1 }),
                            validator.sanitizeBody('name').escape(),
                            function(req, res, next){
    const errors = validator.validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = { name: req.body.name };


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.status(400).json({ 
          error: "Validation Error",
          genre: genre, 
          errors: errors.array()
        });
      return;
    }else{

        Genre.findOne({ name: req.body.name }).exec(function(err, existing_genre){
            if(err){
                return res.status(500).json({
                    error: err.message
                });
            }
            if(existing_genre && existing_genre._id != req.params.id){
                return res.redirect(existing_genre.url);
            }else{
                Genre.findByIdAndUpdate(req.params.id, genre, {new: true, runValidators: true}).exec(function(err, updatedGenre){
                    if(err){
                        return  res.status(500).json({
                            error: err.message
                        });
                    }
                    res.status(200).json({
                        genre: updatedGenre
                    });
                })
            }
        })
    }
}]