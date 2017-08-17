/**
 * Created by achiliku on 11/08/2017.
 */
/**
 * Created by achiliku on 01/08/2017.
 */

//import * as Express from "express";
//import * as Redis from "redis";

/*type Partial<T> = {
 [P in keyof T]?: T[P];
 };
 
 interface IOptionsType {
 headerNames: string[];
 expireTimeInSeconds: number;
 namespace: string;
 };*/

class CustomRedisWrapper {
	
	constructor (/*private*/ client/*: Redis.RedisClient*/) {
		this.client = client;
		this.REDIS_KEYS_PREFIX = "COMMON_SERVICES";
	}
	
	set(namespace/*: string*/, key/*: string*/, value/*: string*/, expireTimeInSeconds/*: number*/) {
		namespace = `${this.REDIS_KEYS_PREFIX}:${namespace}`;
		const namespacedKey = `${namespace}:${key}`;
		
		this.client.sadd(namespace, key);
		this.client.set(namespacedKey, value);
		this.client.expire(namespacedKey, expireTimeInSeconds);
	}
	
	get(namespace/*: string*/, key/*: string*/)/*: Promise<string | null>*/ {
		namespace = `${this.REDIS_KEYS_PREFIX}:${namespace}`;
		
		return new Promise/*<string | null>*/((resolve, reject) => {
			const namespacedKey = `${namespace}:${key}`;
			this.client.get(namespacedKey, (err, reply) => {
				if (err) {
					reject(err);
				}
				resolve(reply);
			});
		});
	}
	
	del(namespace/*: string*/)/*: Promise<void>*/ {
		namespace = `${this.REDIS_KEYS_PREFIX}:${namespace}`;
		
		return new Promise/*<void>*/((resolve, reject) => {
			this.client.smembers(namespace, (err/*: Error*/, hashKeys/*: string[]*/) => {
				if (err) {
					console.log(err);
					reject(err);
				}
				
				const namespacedKeys = hashKeys.map(m => `${namespace}:${m}`);
				
				if (namespacedKeys.length > 0) {
					this.client.del(namespacedKeys, (err/*: Error*/) => {
						if (err) {
							console.log(err);
							reject(err);
						}
						resolve();
					});
				}
				else {
					resolve();
				}
			});
		});
	}
}

class Cache {
	/*private options: IOptionsType;
	 private customRedisWrapper: CustomRedisWrapper;*/
	
	constructor(client/*: Redis.RedisClient*/, options/*: Partial<IOptionsType>*/ = {}) {
		this.options = {
			headerNames: options.headerNames != null ? options.headerNames.map(m => m.toLowerCase()) : [],
			expireTimeInSeconds: options.expireTimeInSeconds || 300,
			namespace: options.namespace || "default"
		};
		
		this.customRedisWrapper = new CustomRedisWrapper(client);
	}
	
	isResponseSuccessful(bodyJSON) {
		if (JSON.parse(bodyJSON).status  === 'success') {
			return true;
		}
		return false;
	}
	
	useCache(options/*: Partial<IOptionsType>*/ = {}) {
		if (options.headerNames) { // Lowercase headerNames property
			options = Object.assign({}, options, {
				headerNames: options.headerNames.map(m => m.toLowerCase())
			});
		}
		
		const finalOptions/*: IOptionsType*/ = Object.assign({}, this.options, options);
		
		
		return async (req/*: Express.Request*/, res/*: Express.Response*/, next/*: Express.NextFunction*/) => {
			const queryHash = this.getHash(req.query);
			
			const headers/*: any*/ = {};
			
			for (const key in req.headers) {
				if (finalOptions.headerNames.includes(key)) {
					headers[key] = req.headers[key];
				}
			}
			
			const headersHash = this.getHash(headers);
			const urlPath = req.path;
			const httpMethod = req.method;
			
			const key = this.getHash([httpMethod, urlPath, queryHash, headersHash]);
			const reply = await this.customRedisWrapper.get(finalOptions.namespace, key);
			
			if (reply) {
				return res.json(JSON.parse(reply));
			}
			
			// Request was not cached. Create a new one after response is sent.
			const responseBodyJSONPromise = this.getResponseBodyJSON(res);
			next();
			
			const bodyJSON = await responseBodyJSONPromise;
			
			// Cache only if the response is success
			if (this.isResponseSuccessful(bodyJSON)) {
				this.customRedisWrapper.set(finalOptions.namespace, key, bodyJSON, finalOptions.expireTimeInSeconds);
			}
			
			return;
		};
	}
	
	invalidateCache(namespace/*?: string*/) {
		const finalNamespace = namespace == null ? this.options.namespace : namespace;
		return async (req/*: Express.Request*/, res/*: Express.Response*/, next/*: Express.NextFunction*/) => {
			const responseBodyJSONPromise = this.getResponseBodyJSON(res);
			next();
			
			const bodyJSON = await responseBodyJSONPromise;
			
			// Cache only if the response is success
			if (this.isResponseSuccessful(bodyJSON)) {
				this.customRedisWrapper.del(finalNamespace);
			}
		};
	}
	
	getOrderedProps(inputObject/*: any*/)/*: any*/ {
		if (Object(inputObject) !== inputObject) {
			return inputObject;
		}
		
		let inputObjectProps/*: any[]*/ = [];
		
		if (Array.isArray(inputObject)) {
			inputObject.forEach(m => {
				const subObjHash = this.getOrderedProps(m);
				inputObjectProps.push(subObjHash);
			});
		} else {
			for (const propName in inputObject) {
				if (inputObject.hasOwnProperty(propName)) {
					const subObjHash = this.getOrderedProps(inputObject[propName]);
					inputObjectProps.push([propName, subObjHash]);
				}
			}
		}
		
		const orderedProps = inputObjectProps.sort((a, b) => {
			if ( a[0] < b[0] ) { return -1; }
			if ( a[0] > b[0] ) { return 1; }
			return 0;
		});
		
		return orderedProps;
	}
	
	getHash(inputObject/*: any*/)/*: string*/ {
		return JSON.stringify(this.getOrderedProps(inputObject));
	}
	
	getResponseBodyJSON(res/*: Express.Response*/)/*: Promise<string>*/{
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
				
				// USE BODY HERE!
				resolve(bodyJSON);
				// END
				oldEnd.apply(res, arguments);
			};
		});
	}
}


module.exports = Cache;