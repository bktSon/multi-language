const express = require('express');
const app     =  express();
const router  = require('./router');
const rest    = require('../middleware/sendJsonMiddleware');

app.use(rest.rest)

app.use(router);

app.listen(3000, function() {
	console.log('App is listen at port 3000');
})