var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var Firebase = require('firebase');

var fb = new Firebase('https://lazysound.firebaseio.com/');


var routes = require('./routes/index');
var users = require('./routes/users');
var dj = require('./routes/dj');

var app = express();

// view engine setup
var hbs = exphbs.create({
    defaultLayout: 'main',
    partialsDir : [
        'shared/templates/',
        'views/partials/'
    ]
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Copied from `express-handlebars` "advanced example"
// https://github.com/ericf/express-handlebars/blob/master/examples/advanced/server.js
function exposePartials(req, res, next) {
    // `hbs.getTemplates(dirPath, [options])`
    // Retrieves the all the templates in the specified `dirPath` and returns a
    // Promise for an object mapping the compiled templates in the form
    // `{filename: template}`.
    hbs.getTemplates('shared/templates/', {
        cache     : app.enabled('view cache'),
        precompiled: true
    }).then(function (templates) {
        // RegExpp to remove the `.handlebars` extension from template names
        var extRegex = new RegExp(hbs.extname + '$');

        // Creates an array of templates exposed in `res.locals.templates`
        templates = Object.keys(templates).map(function (name) {
            return {
                name    : name.replace(extRegex, ''),
                template: templates[name]
            };
        });

        // Exposes templates during view rendering
        if (templates.length) {
            res.locals.templates = templates;
        }

        setImmediate(next);
    })
    .catch(next);
}

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("this a secret which is very spoooooooooooooooooooooooky"));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use('/users', users);
app.use('/dj', exposePartials, dj);

// catch 404 and forward to error handler

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
