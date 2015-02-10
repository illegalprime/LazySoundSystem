var express = require('express');
var router = express.Router();

router.get('/:id', function(req, res, next) {
    res.render('queue', { id: req.params.id });
});

// spotify api search redirect is still in `index.js`

module.exports = router;
