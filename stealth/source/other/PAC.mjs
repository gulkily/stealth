
import { Buffer, isFunction, isObject } from '../../extern/base.mjs';
import { URL                          } from '../parser/URL.mjs';



const _generate_script = (address, host, port) => `
function FindProxyForURL(url, host) {
	if (host === "${host}") return "DIRECT";
	if (host === "${address}") return "DIRECT";
	return "PROXY ${host}:${port}; DIRECT";
}
`;



const PAC = {

	send: function(data, callback) {

		data     = isObject(data)       ? data     : null;
		callback = isFunction(callback) ? callback : null;


		if (data !== null) {

			let payload = null;
			let url     = data.url || null;

			if (url !== null) {

				let host = null;
				let port = null;

				let ref = URL.parse(url);
				if (ref.domain !== null) {

					if (ref.subdomain !== null) {
						host = ref.subdomain + '.' + ref.domain;
					} else {
						host = ref.domain;
					}

				} else if (ref.host !== null) {

					if (ref.host.includes(':')) {
						host = '[' + ref.host + ']';
					} else {
						host = ref.host;
					}

				}

				if (ref.port !== null) {
					port = ref.port;
				}

				let headers = data.headers      || {};
				let address = headers['@local'] || 'localhost';
				if (address.startsWith('::ffff:')) {
					address = address.substr(7);
				}

				if (address !== null && host !== null && port !== null) {
					payload = Buffer.from(_generate_script(address, host, port), 'utf8');
				}

			}


			if (payload !== null) {

				if (callback !== null) {

					callback({
						headers: {
							'@code':   200,
							'@status': '200 OK'
						},
						payload: payload
					});

				} else {

					return {
						headers: {
							'@code':   200,
							'@status': '200 OK'
						},
						payload: payload
					};

				}

			} else {

				if (callback !== null) {
					callback(null);
				} else {
					return null;
				}

			}

		} else {

			if (callback !== null) {
				callback(null);
			} else {
				return null;
			}

		}

	}

};


export { PAC };

