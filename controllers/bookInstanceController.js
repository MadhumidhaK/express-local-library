const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const moment = require('moment');

var BookInstance = require('../models/bookInstance');
var Book = require('../models/book');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
    BookInstance.find({}).populate('book').exec(function(err, bookInstance_list){
        if(err){
            return next(err);
        }
        res.render('bookinstance_list',{
            title: 'Book Instance List',
            bookinstance_list : bookInstance_list   
        });
    })
};

exports.bookinstance_list_api = function(req, res) {
    BookInstance.find({}).populate('book').exec(function(err, bookInstance_list){
        if(err){
            return res.status(500).json({
                error: err.message
            })
        }
        res.status(200).json({
            bookinstanceList : bookInstance_list   
        });
    })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })
    
};

exports.bookinstance_detail_api = function(req, res) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { 
        return res.status(500).json({
            error: err.message
        })
       }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          return res.status(404).json({
            error: err.message
        })
        }
      // Successful, so render.
      res.status(200).json({ bookInstance:  bookinstance});
    })
    
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
    Book.find({}, 'title', function(err, books){
        if(err){
            return next(err);
        }

        res.render('bookinstance_form', {
            title: 'Create Book Instance',
            books_list: books
        })
    })
};

exports.bookinstance_create_get_api = function(req, res) {
    Book.find({}, 'title', function(err, books){
        if(err){
            return res.status(404).json({
                error: err.message
            })
        }

        res.status(200).json({
            books: books
        })
    })
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post =[
    // Validate fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
 function(req, res, next) {
   // Extract the validation errors from a request.
   const errors = validationResult(req);

   // Create a BookInstance object with escaped and trimmed data.
   var bookinstance = new BookInstance(
     { book: req.body.book,
       imprint: req.body.imprint,
       status: req.body.status,
       due_back: req.body.due_back
      });

   if (!errors.isEmpty()) {
       // There are errors. Render form again with sanitized values and error messages.
       Book.find({},'title')
           .exec(function (err, books) {
               if (err) { return next(err); }
               // Successful, so render.
               res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
       });
       return;
   }
   else {
       // Data from form is valid.
       bookinstance.save(function (err) {
           if (err) { return next(err); }
              // Successful - redirect to new record.
              res.redirect(bookinstance.url);
           });
   }
}]

exports.bookinstance_create_post_api =[
    // Validate fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
 function(req, res, next) {
   // Extract the validation errors from a request.
   const errors = validationResult(req);

   // Create a BookInstance object with escaped and trimmed data.
   var bookinstance = new BookInstance(
     { book: req.body.book,
       imprint: req.body.imprint,
       status: req.body.status,
       due_back: req.body.due_back
      });

   if (!errors.isEmpty()) {
       // There are errors. Render form again with sanitized values and error messages.
       Book.find({},'title')
           .exec(function (err, books) {
               if (err) { 
                    return res.status(500).json({
                        error: err.message
                    })
                }
               res.status(400).json({
                   error: "Validation error",
                   errors: errors.array(),
                   books: books,
                   selectedBook: bookinstance.book._id , 
                   bookInstance: bookinstance
               })
       });
       return;
   }
   else {
       // Data from form is valid.
       bookinstance.save(function (err) {
           if (err) { 
                return res.status(500).json({
                    error: err.message
                })
            }
              // Successful - redirect to new record.
              res.status(200).json({
                  bookInstance: bookinstance
              });
           });
   }
}]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id).populate('book').exec(function(err, bookInstance){
        if(err){
            return next(err);
        }
        if(bookInstance == null){
            console.log('Null');
             res.status(404);
             res.redirect('/catalog/bookinstances');
             return;
        }

        res.render('bookinstance_delete', {
            title: 'Delete Book Instance',
            bookinstance: bookInstance
        })
    })
};

exports.bookinstance_delete_get_api = function(req, res, next) {
    BookInstance.findById(req.params.id).populate('book').exec(function(err, bookInstance){
        if(err){
            return res.status(500).json({
                error: err.message
            })
        }
        if(bookInstance == null){
             return res.status(404).json({
                error: "No book instance exists, it might have been deleted already."
            })
        }

        res.status(200).json({
            bookInstance: bookInstance
        })
    })
};



// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deletebookInstance(err) {
        if (err) { return next(err); }
        // Success - go to author list
        res.redirect('/catalog/bookinstances')
    })
};

exports.bookinstance_delete_post_api = function(req, res) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deletebookInstance(err) {
        if (err) { 
            return res.status(500).json({
                error: err.message
            })
        }
        // Success - go to author list
        if(bookInstance == null){
            return res.status(404).json({
               error: "No book instance exists, it might have been deleted already."
           })
       }
        res.status(200).json({
            success: true
        })
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {

    BookInstance.findById(req.params.id).populate('book').exec(function(err, bookInstance){
        if(err){
            next(err)
        }
        if(bookInstance == null){
            res.status(404);
            next(new Error('No Book Instance Found'));
            return;
        }
        res.render('bookinstance_form', { title: 'Update BookInstance', book_list: [], selected_book: bookInstance.book._id , bookinstance: bookInstance })
    })
};

exports.bookinstance_update_get_api = function(req, res) {

    BookInstance.findById(req.params.id).populate('book').exec(function(err, bookInstance){
        if(err){
           return res.status(500).json({
               error: err.message
           })
        }
        if(bookInstance == null){
            const err = new Error('No Book Instance Found');
            return res.status(404).json({
                error: err.message
            });
        }
        res.status(200).json({ 
            bookList: [],
            selectedBook: bookInstance.book._id , 
            bookInstance: bookInstance 
        })
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validate fields.
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
   
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
 async function(req, res, next) {
   // Extract the validation errors from a request.
   const errors = validationResult(req);

   // Create a BookInstance object with escaped and trimmed data.

   var oldBookInstance = await BookInstance.findById(req.params.id).populate('book');
   var bookinstance = { 
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      };

   if (!errors.isEmpty()) {
        req.body.book = oldBookInstance.book;
        req.body.due_back_formatted = req.body.due_back ? moment(req.body.due_back).format('YYYY-MM-DD') : '';;
        res.render('bookinstance_form', { title: 'Update BookInstance', 
        book_list: [], selected_book: req.params.id , errors: errors.array(), bookinstance: req.body });
        return;
   }
   else {
       // Data from form is valid.
       BookInstance.findByIdAndUpdate(req.params.id, bookinstance).exec(function(err, updatedBookInstance){
        if (err) {
            console.log(err);
             return next(err); 
            }
    
        res.redirect(updatedBookInstance.url);
       })
   }
}]

exports.bookinstance_update_post_api = [
    // Validate fields.
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
   
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
 async function(req, res, next) {
   // Extract the validation errors from a request.
   const errors = validationResult(req);

   // Create a BookInstance object with escaped and trimmed data.

   var oldBookInstance = await BookInstance.findById(req.params.id).populate('book');
   var bookinstance = { 
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      };

   if (!errors.isEmpty()) {
        req.body.book = oldBookInstance.book;
        req.body.due_back_formatted = req.body.due_back ? moment(req.body.due_back).format('YYYY-MM-DD') : '';;
        res.status(400).json({
            error: "Validation Error",
            book_list: [], 
            selected_book: req.params.id , 
            errors: errors.array(), 
            bookinstance: req.body 
        });
        return;
   }
   else {
       // Data from form is valid.
       BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {new: true}).exec(function(err, updatedBookInstance){
        if (err) {
            console.log(err);
             return res.status(500).json({
                 error: err.message
             }); 
            }
    
        res.status(200).json({
            bookInstance: updatedBookInstance
        });
       })
   }
}]