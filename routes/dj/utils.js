module.exports = {
    oneDay : 86400000,

    consumeError : function(error) {
        if (error) console.log('Data could not be saved.' + error);
        else       console.log('Data saved successfully.');
    },

    doesQueueExist : function(fb, name, callback) {
        var names = fb.child('names');
        names.child(name).once('value', callback);
    }
}
