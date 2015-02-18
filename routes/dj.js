var express = require('express');
var Queue   = require('queue');
var Firebase = require('firebase');
var router = express.Router();

var fb = new Firebase('https://lazysound.firebaseio.com/');
var firequeues = {};

var oneDay = 86400000;

router.post('/', function(req, res, next) {
    if (req.body.name) {
        doesQueueExist(req.body.name, function(snapshot) {
            if (snapshot.val()) {
                res.redirect('/dj/' + req.body.name);
            } else {
                res.redirect('/dj/new?q='+req.body.name);
            }
        });
    } else {
        res.status(405).send("Invalid POST request to /dj/");
    }
});

router.get('/new?', function(req, res, next) {
    doesQueueExist(req.query.q, function(snapshot) {
        if (snapshot.val()) {
            // this queue already exists, no need to make a new one
            res.redirect('/dj/'+req.query.q);
        } else {
            res.render('newQueue', { name : req.query.q });
        }
    });
});

// TODO slowly deprecating this
router.get('/new/:id', function(req, res, next) {
    res.redirect('/dj/new?q='+req.params.id);
});

// TODO form validation here
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
            res.redirect('/dj/new?q='+queueName);
        }
        res.render('queue', {
            id:    queueName,
            hbs:   true,
            key: key
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
    var action = req.params.action;
    var data   = req.body;
    data.name  = req.params.id;

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
    calls[action](data, function(error) {
        if (error) {
            res.status(500).send("Error");
        }
        else {
            res.send("OK");
        }
    });
});

var consumeError = function(error) {
    if (error) console.log('Data could not be saved.' + error);
    else       console.log('Data saved successfully.');
}

// API for adding a song:
// {
//     "queueID": "-JiSZLt18d9C5zmpQDBw",
//     "song": {
//         "artist": "The Dandy Warhols",
//         "album":  "Thirteen Tales From Urban Bohemia",
//         "name":   "Bohemian Like You",
//         "cover":  "https://images.juno.co.uk/full/CS1863225-02A-BIG.jpg",
//         "stream": "https://play.spotify.com/looooong_url"
//     }
// }
var addSong = function(data, callback) {
    if (!data.queueID || !data.song) {
        callback(false);
    }

    var song  = data.song;
    var queue = fb.child('queues/' + data.queueID);

    var newSong = queue.push({
        'song': {
            'artist' : song.artist,
            'album'  : song.album,
            'name'   : song.name,
            'cover'  : song.cover,
            'stream' : song.stream
        }
    }, function(error) {
        if (!error) {
            queue.child(newSong.key()).setPriority(0);
        }
        callback(error);
    });
}

// API for upvoting a song:
// Rest: localhost:3000/dj/Michael/action/unvote
//       localhost:3000/dj/Michael/action/upvote
//       localhost:3000/dj/Michael/action/downvote
// Data:
// {
//     "queueID": "-JiSZLt18d9C5zmpQDBw",
//     "songID":  "-JiSa8KGapFRM7fb2nIX",
//     "user":    "lol"
// }
var vote = function(value, data, callback) {
    if (!data.queueID || !data.songID || !data.user) {
        callback(true);
    }

    var song  = fb.child('queues/' + data.queueID + '/' + data.songID);
    var votes = song.child('votes');

    song.once('value', function(sSnap) {
        if (sSnap.val()) {
            votes.once('value', function(vSnap) {
                newVote = {};
                newVote[data.user] = value;

                if (vSnap.val()) votes.update(newVote);
                else             votes.set(newVote);

                if (!value) {
                    votes.child(data.user).once('value', function(uSnap) {
                        // TODO: This is always null, why?
                        console.log(uSnap.val());
                        if (uSnap.val()) {
                            song.setPriority(sSnap.getPriority() - uSnap.val());
                            callback(false);
                        }
                        else callback(true);
                    });
                }
                else {
                    song.setPriority(sSnap.getPriority() + value);
                    callback(false);
                }
            });
        }
        else callback(true);
    });
}

var calls = {
    'add':      addSong,
    'upvote':   vote.bind(undefined,  1),  // Should be Sync!
    'downvote': vote.bind(undefined, -1),
    'unvote':   vote.bind(undefined,  null),
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
    var names  = fb.child('names');
    var metas  = fb.child('metaqueues');
    var queues = fb.child('queues');

    var newQueue = queues.push({
        'filler': true
    });

    var newMetaQueue = metas.push({
        'name':  name,
        'expiration': (new Date().getTime()) + oneDay,
        'queue-id': newQueue.key(),
    }, consumeError);

    var nameEntry = {};
    nameEntry[name] = newMetaQueue.key();
    names.update(nameEntry);

    // TODO I (Andrew) just added this ad-hoc... review needed
    callback(newQueue.key());

    return newQueue.key();
}

var doesQueueExist = function(name, callback) {
    var names = fb.child('names');
    names.child(name).once('value', callback);
}

var cleanFirebase = function(queueID) {
}
// cleanFirebase();

// spotify api search redirect is still in `index.js`

module.exports = router;
