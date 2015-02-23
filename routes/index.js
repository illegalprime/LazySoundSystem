var express = require('express');
var request = require('request');
var router  = express.Router();
var utils   = require('./dj/utils.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'The LazySoundSystem' });
});

router.post('/', function(req, res, next) {
    var name = req.body.name;
    utils.validate(name, function(result) {
        if (req.xhr || result.error) {
            res.json(result);
        } else {
            if (result.unique === true) {
                utils.addQueue(name, function() {
                    res.redirect('/dj/'+name);
                });
            } else {
                res.redirect('/dj/'+name);
            }
        }
    });
})

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
