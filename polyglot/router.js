/**
 * Created by achiliku on 11/08/2017.
 */

const express = require('express');
const router  = express.Router();
const Polyglot = require('node-polyglot');
const polyglot = new Polyglot({	locale: "fr"});
//const polyglotmiddleware = require('../middleware/polyglot_middleware');

const err_code = require('../language/err_code');

polyglot.extend(err_code);

// TODO translation

router.get('/translation', function(req, res) {
	res.send(polyglot.t("en"))
})

// TODO interpolation

router.get('/interpolation', function(req, res) {
	res.send(polyglot.t("hello_name", {name: "world", my_name: "anonymous"}))
})

router.get('/interpolation2', function(req, res) {
	res.send(polyglot.t("nav.sidebar.welcome"))
})

// TODO pluralization

router.get('/pluralization', function(req, res) {
	res.send(polyglot.locale())
})

router.get('/pluralization2', function(req, res) {
	res.send(polyglot.t("num_cars", {smart_count: 2}))
})

// TODO default value
router.get('/default', function(req, res) {
	res.send(polyglot.t("i_like_to_write_in_language", {_: "My name is %{name}", name: "anonymous"}))
})

router.get('/', function(req, res) {
	//console.log(req.headers['accept-language']);
	let language = req.headers['accept-language'];
	//res.send(polyglot.t(`404.${language}`, {_: 'not found'}))
	//res.send({code: "404", message: polyglot.t(`404.${language}`)})
	res.sendError({code: "404"});
})

// TODO some demo
router.get('/some', function(req, res) {
	let array = [{a : 1, b : 2}, {a : 2 , b: 4}]
	
	if(array.some((e) => e.a === 5))
		console.log('hello world');
	else
		console.log('nothing');
	
	res.send('hello world')
})
// 	polyglot.replace() will remove all key

module.exports = router;
