var express = require('express');
var wikiRouter = express.Router();

wikiRouter.get('/', (req, res, next) => {
    res.send('Wiki Home Page');
});

wikiRouter.get('/about', (req, res, next) => {
    res.send('About Wiki');
});

module.exports = wikiRouter;