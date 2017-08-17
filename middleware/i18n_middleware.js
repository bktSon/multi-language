/**
 * Created by achiliku on 13/08/2017.
 */

const i18n = require("i18n");
const _    = require('lodash');

i18n.configure({
	locales:['en', 'de', 'vi', 'zh', 'fr'],
	directory: __dirname + '/../i18n/locales/',
	defaultLocale: 'vi',
	objectNotation: true,
});

module.exports = function(req, res, next) {
	let language = (req.headers['accept-language'] === 'vi' || req.headers['accept-language'] === 'en') ? req.headers['accept-language'] : 'vi';
	
	i18n.setLocale(req.headers['accept-language']);
	
	res.sendJson = function() {
		res.send({message: i18n.__("greeting.placeholder.in", { name: 'Marcus' })})
	}
	
	res.sendError = function(obj) {
		res.send({code: obj.code, message: i18n.__(obj.code)})
	}
	
	res.sendLanguage = function(object) {
		let a = {};
		_.forEach(object, function(value) {
			a[value] = i18n.__(value)
		});
		res.send(a)
	}
	next();
}