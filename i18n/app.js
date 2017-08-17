/**
 * Created by achiliku on 13/08/2017.
 */
const express = require('express');
const app     = express();
const i18n    = require('../middleware/i18n_middleware');

app.use(i18n);

app.get('/', function(req, res) {
	res.sendJson()
})

app.get('/1', function(req, res) {
	res.sendError({code: '404'})
})

app.get('/2', function(req, res) {
	res.sendLanguage({"xinchao": "hello"});
})

app.listen(3000, function() {
	console.log('App is listen at port 3000');
})


