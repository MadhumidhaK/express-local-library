var async = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var moment = require('moment');
var debug = require('debug')('author');

var Author = require('../models/author');
var Book = require('../models/book');

// Display list of all Authors.
exports.author_list = function(req, res, next) {
    console.log('Author list');
    Author.find().sort([['last_name', 'ascending']]).exec(function(err, author_list){
        if(err){
            debug('update error:' + err);
            return next(err);
        }
        res.render('author_list', {
            title: 'Author List',
            author_list: author_list
        });
    });
};

exports.author_list_api = function(req, res, next) {
    console.log('Author list api');
    Author.find().sort([['last_name', 'ascending']]).exec(function(err, author_list){
        if(err){
            console.log(err);
            // debug('update error:' + err);
            return res.status(500).json({
                error: err.message
            });
        }
        res.status(200).json({
            authors: author_list
        });
    });
};


exports.getAuthor = function(req,res, next) {
    Author.findById(req.params.id).exec(function(err, author){
        if(err){
            return res.status(500).json({
                error: err.message
            })
        }

        if(author == null){
            return res.status(404).json({
                error: "No Author found"
            });
        }

        return res.status(200).json({
            author: author
        })
    })
}

// Display detail page for a specific Author.
exports.author_detail = function(req, res,next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id).exec(callback)
        },
        author_books: function(callback){
            Book.find({
                author: req.params.id
            }).exec(callback)
        }
    },
    function(err, results){
        if(err){
            debug('update error:' + err);
            return next(err)
        }

        if(results.author == null){
            res.status = 404;
            var error = new Error('No Author Found')
            debug('update error:' + error);
            return next(error)
        }

        res.render('author_detail', {
            title: results.author.name,
            author: results.author,
            author_books: results.author_books
        })
    })
};

exports.author_detail_api = function(req, res,next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id).exec(callback)
        },
        author_books: function(callback){
            Book.find({
                author: req.params.id
            }).exec(callback)
        }
    },
    function(err, results){
        if(err){
            debug('update error:' + err);
            return res.status(500).json({
                error: err.message
            })
        }

        if(results.author == null){
            var error = new Error('No Author Found')
            debug('update error:' + error);
            return res.status(404).json({
                error: error.message
            })
        }


        res.status(200).json({
            title: results.author.name,
            author: results.author,
            author_books: results.author_books
        })
    })
};

// Display Author create form on GET.
exports.author_create_get = function(req, res) {
    res.render('author_form', { title: 'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [
    // Validate fields.
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('last_name').isLength({ min: 1 }).trim().withMessage('Last name must be specified.')
    .isAlphanumeric().withMessage('Last name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),
    //Sanitize fields
    sanitizeBody('first_name').escape(),
    sanitizeBody('last_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    function(req, res, next) {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
        }else{
            
            Author.findOne({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            }).exec(function(err, existingAuthor){
                if(err){
                        debug('update error:' + err);
                        return next(err);
                }
                if(existingAuthor){
                    res.redirect(existingAuthor.url)
                }else{
                    var author = new Author({
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        date_of_birth: req.body.date_of_birth,
                        date_of_death: req.body.date_of_death
                    })
                    author.save(function (err) {
                        if (err) {
                                debug('update error:' + err);
                                return next(err); 
                            }
                        // Successful - redirect to new author record.
                        res.redirect(author.url);
                    });
                }
            })
            
        }
    }];


exports.author_create_post_api = [
    // Validate fields.
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('last_name').isLength({ min: 1 }).trim().withMessage('Last name must be specified.')
    .isAlphanumeric().withMessage('Last name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),
    //Sanitize fields
    sanitizeBody('first_name').escape(),
    sanitizeBody('last_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    function(req, res, next) {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            // return res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return res.status(400).json({
                author:req.body,
                error: "Validation Error",
                errors: errors.array()
            })
        }else{
            
            Author.findOne({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            }).exec(function(err, existingAuthor){
                if(err){
                        debug('update error:' + err);
                        return res.status(500).json({
                            error: err.message
                        })
                }
                if(existingAuthor){
                    res.status(400).json({
                        error: 'Author already exists'
                    })
                }else{
                    var author = new Author({
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        date_of_birth: req.body.date_of_birth,
                        date_of_death: req.body.date_of_death
                    })
                    author.save(function (err) {
                        if (err) {
                                debug('update error:' + err);
                                return res.status(500).json({
                                    error: err.message
                                })
                            }
                        // Successful - redirect to new author record.
                        res.status(201).json({
                            author: author
                        });
                    });
                }
            })
            
        }
}];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res) {
   async.parallel({
       author: function(callback){
           Author.findById(req.params.id).exec(callback)
       },
       author_books: function(callback){
           Book.find({
               author: req.params.id
           }).exec(callback)
       }
   }, function(err, results){
        if(err){
            debug('update error:' + err);
            return next(err)
        }

        if(results.author == null){
            res.status(404);
            res.redirect('/catalog/authors');
            return;
        }

        res.render('author_delete', {
            title: 'Delete Author',
            author: results.author,
            author_books: results.author_books
        })
   })
};

exports.author_delete_get_api = function(req, res) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id).exec(callback)
        },
        author_books: function(callback){
            Book.find({
                author: req.params.id
            }).exec(callback)
        }
    }, function(err, results){
         if(err){
             debug('update error:' + err);
             return res.status(500).json({
                 error: err.message
             })
         }
 
         if(results.author == null){
             res.status(404).json({
                error: "No Author found"
            })
             return;
         }
 
         res.status(200).json({
             author: results.author,
             authorBooks: results.author_books
         })
    })
 };

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {

    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { 
            console.log('ERROR');
            debug('update error:' + err);
            return next(err); 
        }
        // Success
        console.log('//Success');
        if (results.authors_books.length > 0) {
            
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            console.log('Author has no books. Delete object and redirect to the list of authors.')
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) {
                    debug('update error:' + err);
                    return next(err); 
                }
                // Success - go to author list
                res.redirect('/catalog/authors')
            })
        }
    });
};

exports.author_delete_post_api = function(req, res, next) {

    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { 
            console.log('ERROR');
            debug('update error:' + err);
            return res.status(500).json({
                error: err.message
            });
        }
        // Success
        console.log('//Success');
        if(results.author == null){
            res.status(404).json({
               error: "No Author found"
           })
            return;
        }
        if (results.authors_books.length > 0) {
            
            // Author has books. Render in same way as for GET route.
            return res.status(405).json({
                error: 'Author has books. Delete the books before attempting to delete this author',
                author: results.author,
                author_books: results.author_books
            })
            // res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            console.log('Author has no books. Delete object and redirect to the list of authors.')
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) {
                    debug('update error:' + err);
                    return res.status(500).json({
                        error: err.message
                    });
                }
                // Success - go to author list
                res.status(200).json({
                    success: true
                })
            })
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    Author.findById(req.params.id).exec(function(err, author){
        if(err){
            debug('update error:' + err);
            next(err)
        }
        if(author == null){
            res.status(404);
            var error = new Error('No Author Found')
            debug('update error:' + error);
            next(error);
            return;
        }
        res.render('author_form', { title: 'Update Author', author: author})
    })
};

// Handle Author update on POST.
exports.author_update_post = [
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('last_name').isLength({ min: 1 }).trim().withMessage('Last name must be specified.')
    .isAlphanumeric().withMessage('Last name has non-alphanumeric characters.:  '),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),
    //Sanitize fields
    sanitizeBody('first_name').escape(),
    sanitizeBody('last_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    async function(req, res, next) {
        const errors = validationResult(req);
        try
        {
        if(!errors.isEmpty()){
            req.body.date_of_birth_formatted = req.body.date_of_birth ? moment(req.body.date_of_birth).format('YYYY-MM-DD') : '';
            req.body.date_of_death_formatted = req.body.date_of_death ? moment(req.body.date_of_death).format('YYYY-MM-DD') : '';
            return res.render('author_form', { title: 'Update Author', author: req.body, errors: errors.array() });
        }else{
            
            Author.findOne({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            }).exec(function(err, existingAuthor){
                if(err){
                    debug('update error:' + err);
                    return next(err);
                }
                if(existingAuthor){
                    res.redirect(existingAuthor.url)
                }else{
                    var author = {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        date_of_birth: req.body.date_of_birth,
                        date_of_death: req.body.date_of_death
                    }
                    
                    Author.findByIdAndUpdate(req.params.id, author,{new: true, runValidators: true}, function(err, updatedAuthor){
                        if (err) {
                            debug('update error:' + err);
                             return next(err); 
                            }
                    
                        res.redirect(updatedAuthor.url);
                    })
                }
            })
            
        }
    }catch(err){
        debug('update error:' + err);
        next(err);
    }
    }
]



exports.author_update_post_api = [
    body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('last_name').isLength({ min: 1 }).trim().withMessage('Last name must be specified.')
    .isAlphanumeric().withMessage('Last name has non-alphanumeric characters.:  '),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),
    //Sanitize fields
    sanitizeBody('first_name').escape(),
    sanitizeBody('last_name').escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),
    async function(req, res, next) {
        const errors = validationResult(req);
        try
        {
        if(!errors.isEmpty()){
            req.body.date_of_birth_formatted = req.body.date_of_birth ? moment(req.body.date_of_birth).format('YYYY-MM-DD') : '';
            req.body.date_of_death_formatted = req.body.date_of_death ? moment(req.body.date_of_death).format('YYYY-MM-DD') : '';
            return res.status(400).json({
                author:req.body,
                error: "Validation Error",
                errors: errors.array()
            })
        }else{
            
            Author.findOne({
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            }).exec(function(err, existingAuthor){
                if(err){
                    debug('update error:' + err);
                    return res.status(500).json({
                        error: err.message
                    })
                }
                if(existingAuthor && existingAuthor._id != req.params.id){
                    res.status(400).json({
                        author: existingAuthor,
                        error: 'Author already exists'
                    })
                }else{
                    var author = {
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        date_of_birth: req.body.date_of_birth,
                        date_of_death: req.body.date_of_death
                    }
                    
                    Author.findByIdAndUpdate(req.params.id, author, {new: true, runValidators: true}, function(err, updatedAuthor){
                        if (err) {
                            debug('update error:' + err);
                            return res.status(500).json({
                                error: err.message
                            })
                            }
                    
                            res.status(200).json({
                                author: updatedAuthor
                            });
                    })
                }
            })
            
        }
    }catch(err){
        debug('update error:' + err);
        return res.status(500).json({
            error: err.message
        })
    }
    }
]