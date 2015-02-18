var express = require('express');
var Queue   = require('queue');
var Firebase = require('firebase');
var router = express.Router();

var fb = new Firebase("https://lazysound.firebaseio.com/");
var firequeues = {};
var synccalls  = ['upvote', 'downvote'];

router.post('/', function(req, res, next) {
    res.redirect('/dj/' + req.body.name);
});

router.get('/:id', function(req, res, next) {
    // TODO check if queues exist/are password protected
    // send user token etc etc

    var queueName = req.params.id;
    var names = fb.child("names");

    names.child(queueName).once('value', function(snapshot) {
      // Check if the queue exists already
      if (snapshot.val() !== null) {
          res.render('queue', { id: queueName, hbs: true });
      } else {
          res.render('queue', { id: "No existing queue" });
      }
    });
});

router.get('/:id/:user/', function(req, res, next) {
    authenticate(req.params.id, req.params.user, function(authenticated) {
        if (!authenticated) {
            res.status(403).send('Not Authenticated!');
        }
    });
});

router.get('/:id/:user/:action', function(req, res) {
    var action = req.params.action;
    var user   = req.params.user;
    var id     = req.params.id;

    if (synccalls.indexOf(action) != -1) {
        var queue = firequeues[id];

        if (queue == undefined) {
            firequeues[id] = new Queue();
            queue = firequeues[id];
        }

        queue.push(function(cb) {
            res.send(firecall(id, user, action, req.body));
            cb();
        });

        if (!queue.running) {
            queue.start();
        }
    }
    else {
        res.send(firecall(id, user, action, req.body));
    }
});

var error = function(error) {
    if (error) {
        console.log("Data could not be saved." + error);
    } else {
        console.log("Data saved successfully.");
    }
}

var firecall = function(id, user, action, data) {
    var queue = fb.child("queue");
    // queue.update({
    //     name: 'Michael\'s Queue',
    //     songs: {}
    // }, error);

    queue.child('songs/0-' + new Date().getTime()).push({
            "album" : "Smash",
            "artist" : "Martin Solveig",
            "song" : "Get Away From You",
            "stream" : "this-is-a-url"
        }, error);
    return 'Firecalled: ' + id + '\t'  + user + '\t'  + action;
}

var authenticate = function(id, user, callback) {
    callback(false);
}

// spotify api search redirect is still in `index.js`

module.exports = router;
