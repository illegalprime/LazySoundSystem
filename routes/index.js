var express = require('express');
var request = require('request');
var router  = express.Router();
var utils   = require('./dj/utils.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'The LazySoundSystem' });
});

/**
 * POST requests to homepage.
 * This acts as a directory for the queues.
 *
 * Queue names are in the body of the request (form data)
 * under the `name` key.
 *
 * 2 types of response are given:
 *  - if it is an ajax request or there is an error in server-side
 * validation then a json reply with the result is sent back to the
 * client (refer to `/routes/dj/utils.js`.validate for more
 * information).
 *  - otherwise the response is redirected to either the prexisting
 * queue page or we construct a new queue and then go there.
 *
 */
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
