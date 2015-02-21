var express = require('express');
var router = express.Router();
var Firebase = require('firebase');

var utils = require('./utils.js');

var fb = new Firebase('https://lazysound.firebaseio.com/andrewtest');

router.get('/?', function(req, res, next) {
    utils.doesQueueExist(fb, req.query.q, function(snapshot) {
        if (snapshot.val()) {
            // this queue already exists, no need to make a new one
            res.redirect('/dj/'+req.query.q);
        } else {
            res.render('newQueue', { name : req.query.q });
        }
    });
});

// TODO form validation here
// receive ajax requests from client-side (after client-side validation)
// if the data is valid then create queue and redirect to the proper
// site (probably as a callback sent to the creation function)
//
// TODO block or reject regular post requests? we probably could just
// treat all post requests the same?
router.post('/', function(req, res, next) {
    var queueName = req.body.name.toLowerCase();
    var illegalChars = new RegExp("[^A-Za-z0-9-_]", "g");

    if (!illegalChars.exec(queueName) || queueName === "new") {
        // valid (no illegal characters) name
        utils.doesQueueExist(fb, queueName, function(snapshot) {
            // if this name is not already taken
            if (!snapshot.val()) {
                addQueue({ name: queueName }, function(key) {
                    res.redirect('/dj/' + queueName);
                });
            } else {
                res.json({
                    name: "Sorry there is already a queue with this name.",
                    duplicateName: true
                });
            }
        });
    } else {
        res.json({
            name: "Invalid characters in the name.",
            illegalChars: true
        });
    }
});

/**
 * Adds a queue with a certain name to Firebase.
 * TODO: fully implement the error system
 *
 * @param name (String) of the new queue
 * @param callback (Function) called upon successful addition to Firebase
 *      `callback` is supplied with a String with the new queue's "id".
 * @param error (Function) called when something fails (hopefully with an error)
 *      `error` is supplied with an Object that describes the error.
 *      TODO The keys of the Object coorespond with the keys in the new queue
 *      that caused the error.
 */
var addQueue = function(params, callback, error) {
    var names  = fb.child('names');
    var metas  = fb.child('metaqueues');
    var queues = fb.child('queues');

    var name = params.name;

    var oneDay = 86400000;

    var newQueue = queues.push({
        'filler': true
    });

    var newMetaQueue = metas.push({
        'name':  name,
        'expiration': (new Date().getTime()) + oneDay,
        'queue-id': newQueue.key(),
    }, utils.consumeError);

    var nameEntry = {};
    nameEntry[name] = newMetaQueue.key();
    names.update(nameEntry);

    callback(newQueue.key());

    return newQueue.key();
}

module.exports = router;
