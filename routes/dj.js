var express = require('express');
var Queue   = require('queue');
var router = express.Router();

var firequeues = {};
var synccalls  = ['upvote', 'downvote'];

router.post('/', function(req, res, next) {
    res.redirect('/dj/' + req.body.name);
});

router.get('/:id', function(req, res, next) {
    res.render('queue', { id: req.params.id });
});

router.get('/:id/:user/', function(req, res, next) {
    authenticate(req.params.id, req.params.user, function(authenticated) {
        if (authenticated) {
            next();
        }
        next('unauthenticated');
    });
});

router.get('/:id/:user/:track/:action', function(req, res) {
    var action = req.params.action;
    var track  = req.params.track;
    var user   = req.params.user;
    var id     = req.params.id;

    if (synccalls.indexOf(action) != -1) {
        var queue = firequeues[id];

        if (queue == undefined) {
            firequeues[id] = new Queue();
            queue = firequeues[id];
        }

        queue.push(function(cb) {
            res.send(firecall(id, user, track, action));
            cb();
        });

        if (!queue.running) {
            queue.start();
        }
    }
    else {
        res.send(firecall(id, user, track, action));
    }
});

var firecall = function(id, user, track, action) {
    return 'Firecalled: ' + id + '\t'  + user + '\t'  + track + '\t'  + action;
}

var authenticate = function(id, user, callback) {
    callback(false);
}

// spotify api search redirect is still in `index.js`

module.exports = router;
