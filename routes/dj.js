var express = require('express');
var Queue   = require('queue');
var Firebase = require('firebase');
var router = express.Router();

var utils = require('./dj/utils.js');

var fb = new Firebase('https://lazysound.firebaseio.com/');
var firequeues = {};

router.all('/*', function(req, res, next) {
    console.log("big brother is watching");
    if (fb.getAuth()) {
        console.log("We are auth'd");
        res.cookie('userID', "" + fb.getAuth().uid+"", {signed: true});
        return next();
    }
    authAnon();
    //get that weak shit outta here
    console.log("Not auth'd, get that weak shit outta here");
    // return next();
    //redirects to home post auth
    return res.redirect('back');
})

router.get('/', function(req, res, next) {
    var queueName = req.query.name || "";

    utils.validate(queueName, function(data) {
        // this queue exist already
        if (!data.error && !data.unique) {
            // this queue exist already
            res.redirect("/dj/" + data.name);
        } else {
            res.status(400).json(data.error);
        }
    });
});

router.get('/:id', function(req, res, next) {
    // TODO check if queues exist/are password protected
    // send user token etc etc
    var queueName = req.params.id;
    console.log("this be cookie   " + req.signedCookies['userID']);
    fb.child('names').child(queueName).once('value', function(snap) {
        var key = snap.val();
        res.cookie('' + snap.val(), ''+  req.signedCookies['userID'], {signed: true});
        res.cookie('' + queueName, ''+  snap.val(), {signed: true});
        // Check if the queue exists already
        if (!key) {
            // Queue does not exist, add a new one!
            // TODO 404?!
            res.redirect('/dj/new?q='+queueName);
        } else {
            res.render('queue', {
                id:    queueName,
                hbs:   true,
                key: key
            });
        }
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
// Rest: localhost:3000/dj/<id>/action/<action>
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
    var id     = req.params.id;
    data.user = req.signedCookies['userID'];
    data.queueID = req.signedCookies['' + req.params.id];
    data.song = JSON.parse(data.song);
    var respond = function(error) {
        if (error) {
            res.status(500).send("Error");
        }
        else {
            res.send("OK");
        }
    }

    if (synccalls[action]) {
        var serialize = firequeues[id];

        if (serialize == undefined) {
            firequeues[id] = new Queue();
            serialize = firequeues[id];
        }
        serialize.push(function(cb) {
            synccalls[action](data, respond);
            cb();
        });

        if (!serialize.running) {
            serialize.start();
        }
    }
    else {
        calls[action](data, respond);
    }
});

// API for adding a song:
// Rest: localhost:3000/dj/<id>/action/add
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
    if (!data.queueID || !data.song.name) {
    // if (!data.queueID || !data['song[name]']) {
        callback(false);
    }
    var queue = fb.child('queues/' + data.queueID);

    var newSong = queue.push( { song: data.song }, function(error) {
        if (!error) {
            queue.child(newSong.key()).setPriority(0);
        }
        callback(error);
    });
}

// API for upvoting a song:
// Rest: localhost:3000/dj/<id>/action/unvote
//       localhost:3000/dj/<id>/action/upvote
//       localhost:3000/dj/<id>/action/downvote
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
    var votes = fb.child('votes/'  + data.queueID + '/' + data.songID);

    song.once('value', function(sSnap) {
        if (sSnap.val()) {
            votes.child(data.user).once('value', function(uSnap) {
                if (uSnap.val() == value) {
                    // User already voted
                    callback(true);
                }
                else {
                    newVote = {};
                    newVote[data.user] = value;

                    if (!value) {
                        // User is un-voting
                        value = -uSnap.val();
                    }
                    votes.update(newVote);

                    song.setPriority(sSnap.getPriority() + value);
                    callback(false);
                }
            });
        }
        else callback(true);
    });
}

// API for upvoting a song:
// Rest: localhost:3000/dj/<id>/action/veto
// Data:
// {
//     "queueID": "-JiSZLt18d9C5zmpQDBw",
//     "songID":  "-JiSa8KGapFRM7fb2nIX",
//     "user":    "lol"
// }
var removeSong = function(data, callback) {
    if (!data || !data.songID || !data.queueID || !data.user) {
        callback(true);
    }

    var removeSong = {};
    removeSong[data.songID] = null;

    fb.child('queues').child(data.queueID).update(removeSong, function(err) {
        callback(err);
    });
}

var calls = {
    'add':  addSong,
    'veto': removeSong
};
var synccalls  = {
    'upvote':   vote.bind(undefined,  1),
    'downvote': vote.bind(undefined, -1),
    'unvote':   vote.bind(undefined,  null)
};

var authenticate = function(id, user, callback) {
    callback(false);
}

var removeQueue = function(metaID, finish) {
    fb.child('metaqueues/' + metaID).once('value', function(snap) {
        var removeName  = {};
        var removeQueue = {};
        var removeMeta  = {};
        var removeVotes = {};
        removeName[snap.val()['name']]      = null;
        removeQueue[snap.val()['queue-id']] = null;
        removeMeta[metaID] = null;

        fb.child('queues').update(removeQueue);
        fb.child('names').update(removeName);
        fb.child('metaqueues').update(removeMeta);
        fb.child('votes').update(removeQueue);
        finish();
    });
}

var authAnon = function() {
    fb.authAnonymously(function(error, authData) {
        console.log("anonAuth");
        if (error) {
            console.log("Login Failed!", error);
        } else {
            console.log("Authenticated successfully with payload:", authData);

        }
    } );
}

var authUser = function() {
    fb.authAnonymously(function(error, authData) {
        console.log("anonUser");
        if (error) {
            console.log("Login Failed!", error);
        } else {
            console.log("Authenticated successfully with payload:", authData);
        }
    } );
}


var cleanFirebase = function() {
    var oldestQueues = fb.child('metaqueues').orderByChild('expiration');

    oldestQueues.once('value', function(snap) {
        var queues = snap.val();
        var diff     = utils.oneDay;
        var total    = 0;
        var finished = 0;

        var resweep = function(wait) {
            wait += 100;
            console.log('Time until next sweep: ' + wait + 'ms');
            setTimeout(cleanFirebase, wait);
        };

        for (key in queues) {
            diff = queues[key].expiration - (new Date().getTime());
            ++total;

            if (diff < 100) {
                console.log(" " + diff);
                removeQueue(key, function() {
                    if (++finished == total) {
                        resweep(diff);
                    }
                });
            }
            else break;
        }

        resweep(diff);
    });
}
// cleanFirebase();

module.exports = router;
