/**
 * Created by achiliku on 11/08/2017.
 */

const Promise = require('bluebird');

const getResponseBody = function(res) {
	return new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error("Timed out")), 30000);
		
		let oldWrite = res.write,
		    oldEnd = res.end;
		
		let chunks/*: any[]*/ = [];
		
		res.write = function (chunk/*: any*/) {
			chunks.push(new Buffer(chunk));
			return oldWrite.apply(res, arguments);
		};
		
		res.end = function (chunk/*?: any*/)/*: void*/ {
			if (chunk) {
				chunks.push(new Buffer(chunk));
			}
			
			const bodyJSON = Buffer.concat(chunks).toString("utf8");
			
			oldEnd.apply(res, arguments);
			
			resolve(bodyJSON);
		};
	});
}

const polyglot = function() {
	return async function (req, res, next) {
		
		let response = getResponseBody(res);
		
		response.then((rs) => {
			console.log('1111', new Date());
			console.log('44444', rs);
		})
		
		next();
		
		let a = await response;
		
		setTimeout(function() {
			console.log('333', new Date());
			console.log('response time 2', a, new Date());
		}, 2000)
		
		//let jsonBody = await response;
		////console.log(jsonBody);
		//
		//if(jsonBody.message !== 'success') console.log('hello world');
		//
		//return;
		//
		//getResponseBody(res).then((rs) => {
		//	console.log(rs);
		//})
	}
}

module.exports = polyglot();
