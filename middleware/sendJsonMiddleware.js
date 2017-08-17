

const Polyglot = require('node-polyglot');
const polyglot = new Polyglot({	locale: "fr"});

//const err_code = require('./err_code');
//polyglot.extend(err_code);

module.exports.rest = function(req, res, next) {
	
	let language = (req.headers['accept-language'] === 'vi' || req.headers['accept-language'] === 'en') ? req.headers['accept-language'] : 'vi';
	
	if(language === 'vi') polyglot.extend(require('../language/vi'));
	
	if(language === 'en') polyglot.extend(require('../language/en'));
	
	res.sendJson = function(message) {
		let tmp = {};
		tmp.message = message;
		res.json(tmp);
	}
	
	res.sendError = function(tmp) {
		console.log(tmp);
		//tmp.message = polyglot.t(code + '.' + language, {_: 'not found'});
		tmp.message = polyglot.t(tmp.code, {_: 'not found'});
		res.json(tmp)
	}
	next();
}