var express = require('express');
var Queue   = require('queue');
var Firebase = require('firebase');
var router = express.Router();

var fb = new Firebase('https://lazysound.firebaseio.com/');
var firequeues = {};

router.post('/', function(req, res, next) {
    if (req.body.name) {
        doesQueueExist(req.body.name, function(snapshot) {
            if (snapshot.val()) {
                res.redirect('/dj/' + req.body.name);
            } else {
                res.redirect('/dj/new/'+req.body.name);
            }
        });
    } else {
        res.status(405).send("Invalid POST request to /dj/");
    }
});

router.get('/new?', function(req, res, next) {
    res.render('newQueue', { name : req.query.q });
});

router.get('/new/:id', function(req, res, next) {
    doesQueueExist(req.params.id, function(snapshot) {
        if (snapshot.val()) {
            // this queue already exists, no need to make a new one
            res.redirect('/dj/'+req.params.id);
        } else {
            res.redirect('/dj/new?q='+req.params.id);
        }
    })
});

router.post('/new', function(req, res, next) {
    var queueName = req.body.name;
    // TODO add err catcher
    addQueue(queueName, function(key) {
        res.redirect('/dj/'+queueName);
    });
});

router.get('/:id', function(req, res, next) {
    // TODO check if queues exist/are password protected
    // send user token etc etc
    var queueName = req.params.id;

    doesQueueExist(queueName, function(snapshot) {
        var key = snapshot.val();
        // Check if the queue exists already
        if (!key) {
            // Queue does not exist, add a new one!
            key = addQueue(queueName); // this line doesn't work because async
            // TODO redirect to "make new queue page"
        }
        res.render('queue', {
            id:    queueName,
            hbs:   true,
            queue: key
        });
    });
});

// router.get('/:id/:user/', function(req, res, next) {
//     authenticate(req.params.id, req.params.user, function(authenticated) {
//         if (!authenticated) {
//             res.status(403).send('Not Authenticated!');
//         }
//     });
// });

// Requests are of this form:
// GET /action/:action
//
// Request Body (Elements exist if applicable):
// {
//     'userKey': '-Ji756Q4yxaqR8R3iq53'
//     'queueID': '-JiPg6Q4yXaqWQR3Rq53',
//     'songID' : '-JiPfQmCAuMrk-kM1TQO', // Omit if adding song
//     'song': {               // Only if adding song
//         'artist' : artist,
//         'album'  : album,
//         'name'   : name,
//         'cover'  : cover,
//         'stream' : stream
//     }
// }
router.post('/:id/action/:action', function(req, res) {
    var id     = req.params.id;
    var action = req.params.action;
    // if (synccalls[action] !== null) {
    //     var serialize = firequeues[id];
    //
    //     if (serialize == undefined) {
    //         firequeues[id] = new Queue();
    //         serialize = firequeues[id];
    //     }
    //     serialize.push(function(cb) {
    //         synccalls[action](req.body);
    //         res.send("OK");
    //         cb();
    //     });
    //
    //     if (!serialize.running) {
    //         serialize.start();
    //     }
    // }
    // else {
    //     calls[action](req.body);
    //     res.send("OK");
    // }
    calls[action](req.body);
});

var consumeError = function(error) {
    if (error) console.log('Data could not be saved.' + error);
    else       console.log('Data saved successfully.');
}

var add = function(queue, data) {
    console.log("Called Add Song!");
    // queue.push({
    //     'priority' : 0,
    //     'votes'    : {},
    //     'song': {
    //         'artist' : data.artist,
    //         'album'  : data.album,
    //         'name'   : data.name,
    //         'cover'  : data.cover,
    //         'stream' : data.stream
    //     }
    // }, error);
}

var upvote = function(queue, data, user) {
    queue.child()
}

var calls = {
    'add':  add
    // 'veto': remove
};
var synccalls  = {
    // 'upvote':   upvote,
    // 'downvote': downvote
};

var authenticate = function(id, user, callback) {
    callback(false);
}

var addQueue = function(name, callback) {
    /*
    TODO: Add CAPTCHA Functionality
    */
    var names = fb.child('names');
    var queues = fb.child('queues');

    var newQueue = queues.push({
        'name':  name,
        'songs': {}
    }, consumeError);

    var nameEntry = {};
    nameEntry[name] = newQueue.key();
    names.update(nameEntry);

    // TODO I (Andrew) just added this ad-hoc... review needed
    callback(newQueue.key());

    return newQueue.key();
}

var doesQueueExist = function(name, callback) {
    var names = fb.child('names');
    names.child(name).once('value', callback);
}

// spotify api search redirect is still in `index.js`

module.exports = router;
