var Firebase = require('firebase');
var fb = new Firebase('https://lazysound.firebaseio.com/');

var actions = {};

// API for adding a song:
// Rest: localhost:3000/dj/<id>/add
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
actions.addSong = function(data, callback) {
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
};

// API for upvoting a song:
// Rest: localhost:3000/dj/<id>/unvote
//       localhost:3000/dj/<id>/upvote
//       localhost:3000/dj/<id>/downvote
// Data:
// {
//     "queueID": "-JiSZLt18d9C5zmpQDBw",
//     "songID":  "-JiSa8KGapFRM7fb2nIX",
//     "user":    "lol"
// }
actions.vote = function(value, data, callback) {
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
};

// API for upvoting a song:
// Rest: localhost:3000/dj/<id>/veto
// Data:
// {
//     "queueID": "-JiSZLt18d9C5zmpQDBw",
//     "songID":  "-JiSa8KGapFRM7fb2nIX",
//     "user":    "lol"
// }
actions.removeSong = function(data, callback) {
    if (!data || !data.songID || !data.queueID || !data.user) {
        callback(true);
    }

    var removeSong = {};
    removeSong[data.songID] = null;

    fb.child('queues').child(data.queueID).update(removeSong, function(err) {
        callback(err);
    });
};

module.exports = actions;
