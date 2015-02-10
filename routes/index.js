var express = require('express');
var request = require('request');
var router  = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/call/spotify/search', function(req, res) {
    searchCall = 'https://api.spotify.com/v1/search';
    request.get({url: searchCall, qs: req.query}, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            res.send(response.body);
        }
        else res.status(500).send({});
    });
});

module.exports = router;
