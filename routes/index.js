var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("Redirecting");
  res.redirect('/catalog');
});

module.exports = router;




//Check it ---- http://expressjs.com/en/guide/routing.html