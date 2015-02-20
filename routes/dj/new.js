var express = require('express');
var router = express.Router();
var Firebase = require('firebase');

var utils = require('./utils.js');

var fb = new Firebase('https://lazysound.firebaseio.com/');

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

// TODO slowly deprecating this
router.get('/:id', function(req, res, next) {
    res.redirect('/dj/new?q='+req.params.id);
});

// TODO form validation here
// receive ajax requests from client-side (after client-side validation)
// if the data is valid then create queue and redirect to the proper
// site (probably as a callback sent to the creation function)
//
// TODO block or reject regular post requests? we probably could just
// treat all post requests the same?
router.post('/', function(req, res, next) {
    // req.xhr will be a boolean indicating if the request is ajax
    var queueName = req.body.name;
    // TODO add err catcher
    addQueue(queueName, function(key) {
        res.redirect('/dj/'+queueName);
    });
});


var addQueue = function(name, callback) {
    /*
    TODO: Add CAPTCHA Functionality
    */
    var names  = fb.child('names');
    var metas  = fb.child('metaqueues');
    var queues = fb.child('queues');

    var oneDay = 86400000;

    var newQueue = queues.push({});

    var newMetaQueue = metas.push({
        'name':  name,
        'expiration': (new Date().getTime()) + oneDay,
        'queue-id': newQueue.key(),
    }, utils.consumeError);

    var nameEntry = {};
    nameEntry[name] = newMetaQueue.key();
    names.update(nameEntry);

    // TODO I (Andrew) just added this ad-hoc... review needed
    callback(newQueue.key());

    return newQueue.key();
}

module.exports = router;
