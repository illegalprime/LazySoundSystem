var Firebase = require('firebase');
var fb = new Firebase('https://lazysound.firebaseio.com/andrewtest');

var utils = {};

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
utils.addQueue = function(name, callback, error) {
    var names  = fb.child('names');
    var metas  = fb.child('metaqueues');
    var queues = fb.child('queues');

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
};

utils.consumeError = function(error) {
    if (error) console.log('Data could not be saved.' + error);
    else       console.log('Data saved successfully.');
}

utils.doesQueueExist = function(fb, name, callback) {
    var names = fb.child('names');
    names.child(name).once('value', function(snapshot) {
        callback(snapshot);
    });
};

utils.validate = function(queueName, callback) {
    queueName = queueName || "";
    var illegalChars = new RegExp("[^A-Za-z0-9-_]", "g");
    var result = { name : queueName };
    if (!illegalChars.exec(queueName) && (queueName.length !== 0)) {
        // valid (no illegal characters) name
        utils.doesQueueExist(fb, queueName, function(snapshot) {
            // if this name is not already taken
            result.unique = !snapshot.val();
            callback(result);
        });
    } else {
        result.error = {
            name: "Invalid characters in the name."
        }
        callback(result);
    }
}

module.exports = utils;
