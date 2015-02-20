var express = require('express');
var request = require('request');
var router  = express.Router();
var Firebase = require('firebase');
var fb = new Firebase('https://lazysound.firebaseio.com/');





/* GET home page. */
router.get('/', function(req, res, next) {
  authAnon();
  res.render('index', { title: 'The LazySoundSystem' });
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

var authAnon = function() {
    fb.authAnonymously(function(error, authData) {
        if (error) {
            console.log("Login Failed!", error);
        } else {
            console.log("Authenticated successfully with payload:", authData);

        }
    } );
}


module.exports = router;
