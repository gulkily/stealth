
import process from 'process';



export const console = (function() {

	const BLINK = {
		colors:   [
			16, 17, 18, 19, 20,
			21, 27, 33, 39, 45,
			45, 39, 33, 27, 21,
			20, 19, 18, 17, 16
		],
		index:    0,
		interval: null
	};

	const DIFF = {
		insert: '\u001b[48;5;22m',
		normal: '\u001b[40m',
		remove: '\u001b[48;5;88m'
	};

	const PALETTE = {
		'Boolean':  38,
		'Keyword': 204,
		'Literal': 174,
		'Number':  197,
		'String':   77,
		'Type':    174
	};

	const align = function(array, other) {

		let result = new Array(other.length).fill(null);
		let temp   = other.slice();
		let split  = 0;

		for (let t = 0; t < temp.length; t++) {

			let line_a = temp[temp.length - 1 - t];
			let line_b = array[array.length - 1 - t];

			if (line_a === line_b) {
				result[result.length - 1 - t] = line_a;
			} else {
				split = array.length - 1 - t;
				break;
			}

		}

		for (let s = 0; s <= split; s++) {
			result[s] = array[s];
		}

		return result;

	};

	const highlight = function(str, type) {

		let color = PALETTE[type] || null;
		if (color !== null) {
			return '\u001b[38;5;' + color + 'm' + str + '\u001b[39m';
		} else {
			return str;
		}

	};

	const isArray = function(arr) {
		return Object.prototype.toString.call(arr) === '[object Array]';
	};

	const isBuffer = function(buffer) {

		if (buffer instanceof Buffer) {
			return true;
		} else if (Object.prototype.toString.call(buffer) === '[object Buffer]') {
			return true;
		} else if (Object.prototype.toString.call(buffer) === '[object Uint8Array]') {
			return true;
		}


		return false;

	};

	const isDate = function(dat) {
		return Object.prototype.toString.call(dat) === '[object Date]';
	};

	const isError = function(obj) {
		return Object.prototype.toString.call(obj).includes('Error');
	};

	const isFunction = function(fun) {
		return Object.prototype.toString.call(fun) === '[object Function]';
	};

	const isMatrix = function(obj) {

		if (isArray(obj) === true && obj.length > 4) {

			let check = obj.filter((v) => isNumber(v));
			if (check.length === obj.length) {

				let dim = Math.floor(Math.sqrt(obj.length));
				if (dim * dim === obj.length) {
					return true;
				}

			}

		}

		return false;

	};

	const isNumber = function(num) {
		return Object.prototype.toString.call(num) === '[object Number]';
	};

	const isObject = function(obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

	const isPrimitive = function(data) {

		if (
			data === null
			|| data === undefined
			|| typeof data === 'boolean'
			|| typeof data === 'number'
		) {
			return true;
		}


		return false;

	};

	const isString = function(str) {
		return Object.prototype.toString.call(str) === '[object String]';
	};

	const INDENT      = '    ';
	const WHITESPACE  = new Array(512).fill(' ').join('');
	const format_date = (n) => (n < 10 ? '0' + n : '' + n);

	const cleanify = function(raw) {

		let str = '';

		for (let r = 0, rl = raw.length; r < rl; r++) {

			let code = raw.charCodeAt(r);
			if (code === 9) {
				str += '\\t';
			} else if (code === 10) {
				str += '\\n';
			} else if (code === 13) {
				str += '\\r';
			} else if (code === 27) {

				if (raw[r + 1] === '[') {

					let index = raw.indexOf('m', r + 2);
					if (index !== -1) {
						r = index;
					}

				}

			} else if (code >= 32 && code <= 127) {
				str += raw.charAt(r);
			}

		}

		str = str.split('\r').join('\\r');
		str = str.split('\n').join('\\n');

		return str;

	};

	const diffify = function(data, indent) {

		indent = isString(indent) ? indent : '';


		let str = '';

		if (
			typeof data === 'boolean'
			|| data === null
			|| data === undefined
			|| (
				typeof data === 'number'
				&& (
					data === Infinity
					|| data === -Infinity
					|| Number.isNaN(data) === true
				)
			)
		) {

			if (data === null) {
				str = indent + highlight('null', 'Keyword');
			} else if (data === undefined) {
				str = indent + highlight('undefined', 'Keyword');
			} else if (data === false) {
				str = indent + highlight('false', 'Boolean');
			} else if (data === true) {
				str = indent + highlight('true', 'Boolean');
			} else if (data === Infinity) {
				str = indent + highlight('Infinity', 'Keyword');
			} else if (data === -Infinity) {
				str = indent + highlight('-Infinity', 'Keyword');
			} else if (Number.isNaN(data) === true) {
				str = indent + highlight('NaN', 'Number');
			}

		} else if (isNumber(data) === true) {

			str = indent + highlight(data.toString(), 'Number');

		} else if (isString(data) === true) {

			str = indent + highlight('"' + cleanify(data) + '"', 'String');

		} else if (isArray(data) === true) {

			if (data.length === 0) {

				str = indent + highlight('[]', 'Literal');

			} else {

				str  = indent;
				str += highlight('[', 'Literal') + '\n';

				for (let d = 0, dl = data.length; d < dl; d++) {

					str += stringify(data[d], '\t' + indent);

					if (d < dl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight(']', 'Literal');

			}

		} else if (isBuffer(data) === true) {

			str  = indent;
			str += highlight('Buffer', 'Type') + '.from(';

			let tmp = cleanify(data.toString('utf8'));
			if (tmp.length > 0) {
				str += highlight('"' + tmp + '"', 'String');
			}

			str += ', ' + highlight('"utf8"', 'String') + ')';

		} else if (isDate(data) === true) {

			str  = indent;

			str += data.getUTCFullYear()               + '-';
			str += format_date(data.getUTCMonth() + 1) + '-';
			str += format_date(data.getUTCDate())      + 'T';
			str += format_date(data.getUTCHours())     + ':';
			str += format_date(data.getUTCMinutes())   + ':';
			str += format_date(data.getUTCSeconds())   + 'Z';

		} else if (data[Symbol.toStringTag] !== undefined && typeof data.toJSON === 'function') {

			let json = data.toJSON();
			if (
				isObject(json) === true
				&& isString(json.type) === true
				&& isObject(json.data) === true
			) {

				str  = indent;
				str += highlight(json.type, 'Type') + '.from(' + highlight('{', 'Literal') + '\n';

				let keys = Object.keys(json);
				for (let k = 0, kl = keys.length; k < kl; k++) {

					let key = keys[k];

					str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
					str += stringify(json[key], '\t' + indent).trim();

					if (k < kl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight('}', 'Literal') + ')';

			} else {

				let keys = Object.keys(data);
				if (keys.length === 0) {

					str = indent + highlight('{}', 'Literal');

				} else {

					str  = indent;
					str += highlight('{', 'Literal') + '\n';

					for (let k = 0, kl = keys.length; k < kl; k++) {

						let key = keys[k];

						str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
						str += stringify(data[key], '\t' + indent).trim();

						if (k < kl - 1) {
							str += ',';
						}

						str += '\n';

					}

					str += indent + highlight('}', 'Literal');

				}

			}

		} else if (isObject(data) || data[Symbol.toStringTag] !== undefined) {

			let keys = Object.keys(data);
			if (keys.length === 0) {

				str = indent + highlight('{}', 'Literal');

			} else {

				str  = indent;

				if (data[Symbol.toStringTag] !== undefined) {
					str += '(' + highlight(data[Symbol.toStringTag] + 'Type') + ') ';
				}

				str += highlight('{', 'Literal') + '\n';

				for (let k = 0, kl = keys.length; k < kl; k++) {

					let key = keys[k];

					str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
					str += stringify(data[key], '\t' + indent).trim();

					if (k < kl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight('}', 'Literal');

			}

		}


		return str;

	};

	const stringify = function(data, indent) {

		indent = isString(indent) ? indent : '';


		let str = '';

		if (
			typeof data === 'boolean'
			|| data === null
			|| data === undefined
			|| (
				typeof data === 'number'
				&& (
					data === Infinity
					|| data === -Infinity
					|| Number.isNaN(data) === true
				)
			)
		) {

			if (data === null) {
				str = indent + highlight('null', 'Keyword');
			} else if (data === undefined) {
				str = indent + highlight('undefined', 'Keyword');
			} else if (data === false) {
				str = indent + highlight('false', 'Boolean');
			} else if (data === true) {
				str = indent + highlight('true', 'Boolean');
			} else if (data === Infinity) {
				str = indent + highlight('Infinity', 'Keyword');
			} else if (data === -Infinity) {
				str = indent + highlight('-Infinity', 'Keyword');
			} else if (Number.isNaN(data) === true) {
				str = indent + highlight('NaN', 'Number');
			}

		} else if (isError(data) === true) {

			let type = Object.prototype.toString.call(data);
			if (type.startsWith('[object') && type.endsWith(']')) {
				type = type.substr(7, type.length - 8).trim();
			}

			let msg   = (data.message || '').trim();
			let stack = (data.stack   || '').trim().split('\n');

			if (msg.length > 0 && stack.length > 0) {

				let origin = null;

				for (let s = 0, sl = stack.length; s < sl; s++) {

					let line = stack[s].trim();
					if (line.includes('(file://') && line.includes(')')) {

						let tmp = line.split('(file://')[1].split(')').shift().trim();
						if (tmp.includes('.mjs')) {
							origin = tmp;
							break;
						}

					}

				}

				str = indent + highlight(type, 'Keyword') + ': ' + highlight('"' + msg + '"', 'String') + '\n';

				if (origin !== null) {
					str += origin;
				}

			} else if (msg.length > 0) {

				str = indent + highlight(type, 'Keyword') + ': ' + highlight('"' + msg + '"', 'String') + '\n';

			}

		} else if (isNumber(data) === true) {

			str = indent + highlight(data.toString(), 'Number');

		} else if (isString(data) === true) {

			str = indent + highlight('"' + cleanify(data) + '"', 'String');

		} else if (isFunction(data) === true) {

			str = '';

			let lines = data.toString().split('\n');

			for (let l = 0, ll = lines.length; l < ll; l++) {

				let line = lines[l];

				if (l > 0 && l < ll - 1) {


					// TODO: Replace trim() with correctly indented \t before


					str += indent + '\t' + line.trim();

				} else {
					str += indent + line.trim();
				}

				if (l < ll - 1) {
					str += '\n';
				}

			}

			str += '\n';

		} else if (isArray(data) === true) {

			if (data.length === 0) {

				str = indent + highlight('[]', 'Literal');

			} else if (isMatrix(data) === true) {

				str  = indent;
				str += highlight('[', 'Literal') + '\n';

				let line = Math.floor(Math.sqrt(data.length));
				let max  = data.reduce((a, b) => Math.max((' ' + a).length, ('' + b).length), '');

				for (let d = 0, dl = data.length; d < dl; d++) {

					let margin = (max - ('' + data[d]).length);

					if (d % line === 0) {

						if (d > 0) {
							str += '\n';
						}

						str += stringify(data[d], '\t' + indent + WHITESPACE.substr(0, margin));

					} else {

						str += WHITESPACE.substr(0, margin);
						str += stringify(data[d]);

					}

					if (d < dl - 1) {
						str += ', ';
					} else {
						str += '  ';
					}

				}

				str += '\n' + indent + highlight(']', 'Literal');

			} else {

				str  = indent;
				str += highlight('[', 'Literal') + '\n';

				for (let d = 0, dl = data.length; d < dl; d++) {

					str += stringify(data[d], '\t' + indent);

					if (d < dl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight(']', 'Literal');

			}

		} else if (isBuffer(data) === true) {

			str  = indent;
			str += highlight('Buffer', 'Type') + '.from(';

			let tmp = cleanify(data.toString('utf8'));
			if (tmp.length > 0) {
				str += highlight('"' + tmp + '"', 'String');
			}

			str += ', ' + highlight('"utf8"', 'String') + ')';

		} else if (isDate(data) === true) {

			str  = indent;

			str += data.getUTCFullYear()               + '-';
			str += format_date(data.getUTCMonth() + 1) + '-';
			str += format_date(data.getUTCDate())      + 'T';
			str += format_date(data.getUTCHours())     + ':';
			str += format_date(data.getUTCMinutes())   + ':';
			str += format_date(data.getUTCSeconds())   + 'Z';

		} else if (data[Symbol.toStringTag] !== undefined && typeof data.toJSON === 'function') {

			let json = data.toJSON();
			if (
				isObject(json) === true
				&& isString(json.type) === true
				&& isObject(json.data) === true
			) {

				str  = indent;
				str += highlight(json.type, 'Type') + '.from(' + highlight('{', 'Literal') + '\n';

				let keys = Object.keys(json);
				for (let k = 0, kl = keys.length; k < kl; k++) {

					let key = keys[k];

					str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
					str += stringify(json[key], '\t' + indent).trim();

					if (k < kl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight('}', 'Literal') + ')';

			} else {

				let keys = Object.keys(data);
				if (keys.length === 0) {

					str = indent + highlight('{}', 'Literal');

				} else {

					str  = indent;
					str += highlight('{', 'Literal') + '\n';

					for (let k = 0, kl = keys.length; k < kl; k++) {

						let key = keys[k];

						str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
						str += stringify(data[key], '\t' + indent).trim();

						if (k < kl - 1) {
							str += ',';
						}

						str += '\n';

					}

					str += indent + highlight('}', 'Literal');

				}

			}

		} else if (isObject(data) || data[Symbol.toStringTag] !== undefined) {

			let keys = Object.keys(data);
			if (keys.length === 0) {

				str = indent + highlight('{}', 'Literal');

			} else {

				str  = indent;

				if (data[Symbol.toStringTag] !== undefined) {
					str += '(' + highlight(data[Symbol.toStringTag] + 'Type') + ') ';
				}

				str += highlight('{', 'Literal') + '\n';

				for (let k = 0, kl = keys.length; k < kl; k++) {

					let key = keys[k];

					str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
					str += stringify(data[key], '\t' + indent).trim();

					if (k < kl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight('}', 'Literal');

			}

		}


		return str;

	};

	const stringify_arguments = function(args, color) {

		color = isString(color) ? color : ('' + color).trim();

		if (args.length === 2 && isString(args[1]) === true) {

			return '\u001b[' + color + 'm' + args[0] + ' ' + args[1] + '\u001b[K\u001b[0m\n';

		} else {

			let chunks    = args.slice(1).map((value) => stringify(value));
			let multiline = chunks.find((value) => value.includes('\n')) !== undefined;
			if (multiline === true) {

				let lines = [];

				if (color !== '') {
					lines.push('\u001b[' + color + 'm' + args[0] + '\u001b[K');
				} else {
					lines.push(args[0]);
				}

				chunks.forEach((raw) => {

					raw.split('\n').forEach((line) => {

						if (line.includes('\t')) {
							line = line.split('\t').join(INDENT);
						}

						if (line.includes('\r')) {
							line = line.split('\r').join('\\r');
						}

						if (color !== '') {
							lines.push('\u001b[' + color + 'm' + line + '\u001b[K');
						} else {
							lines.push(line);
						}

					});

				});

				return lines.join('\n') + '\u001b[0m\n';

			} else {

				if (color !== '') {
					return '\u001b[' + color + 'm' + args[0] + ' ' + chunks.join(', ') + '\u001b[K\u001b[0m\n';
				} else {
					return args[0] + ' ' + chunks.join(', ') + '\u001b[0m\n';
				}

			}

		}

	};

	const blink = function() {

		let al   = arguments.length;
		let args = [ '(!)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		if (BLINK.interval === null) {

			BLINK.interval = setInterval(() => {
				BLINK.index++;
			}, (1000 / BLINK.colors.length) * 2);

		}


		let color = BLINK.colors[BLINK.index % BLINK.colors.length] || null;
		if (color !== null) {
			process.stdout.write(stringify_arguments(args, '48;5;' + color));
		} else {
			process.stdout.write(stringify_arguments(args, 40));
		}

	};

	const clear = function(partial) {

		partial = typeof partial === 'boolean' ? partial : false;


		if (partial === true) {

			process.stdout.moveCursor(null, -1);
			process.stdout.clearLine(1);

		} else {

			// clear screen and reset cursor
			process.stdout.write('\x1B[2J\x1B[0f');

			// clear scroll buffer
			process.stdout.write('\u001b[3J');

		}

	};

	const debug = function() {

		let al   = arguments.length;
		let args = [ '(E)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		process.stdout.write(stringify_arguments(args, 41));

	};

	const offset_color = function(index) {

		let min = this.lastIndexOf('\u001b', index);
		let max = this.indexOf('m', index) + 1;

		if (min !== -1 && max !== -1) {

			let check = this.substr(min, max - min);
			let regexp = new RegExp('^\u001b\\[\\d+(?:;\\d+)*m$', 'g');
			if (regexp.test(check) === true) {
				return [ min, max ];
			}

		}

		return null;

	};

	const compare = function(str1, str2) {

		let offset = [ -1, -1, -1 ];

		for (let s = 0, sl = Math.max(str1.length, str2.length); s < sl; s++) {

			if (str1[s] === str2[s]) {
				offset[0] = s;
			} else {
				offset[0] = s;
				break;
			}

		}

		if (offset[0] > 0) {

			let search = -1;

			for (let s = offset[0] + 1, sl = Math.max(str1.length, str2.length); s < sl; s++) {

				if (str1[s] !== str2[s]) {
					search = s;
				} else {
					search = s;
					break;
				}

			}

			if (search !== -1) {
				offset[1] = search;
				offset[2] = search;
			}

		}

		if (str1 === str2) {

			if (offset[0] === -1) {
				offset[0] = 0;
			}

			if (offset[1] === -1) {
				offset[1] = 0;
			}

			if (offset[2] === -1) {
				offset[2] = 0;
			}

		} else {

			if (offset[0] === -1) {
				offset[0] = 0;
			}

			if (offset[1] === -1) {
				offset[1] = str1.length;
			}

			if (offset[2] === -1) {
				offset[2] = str2.length;
			}

			if (str1.length !== str2.length) {
				offset[1] = str1.length;
				offset[2] = str2.length;
			}

		}

		let range01 = offset_color.call(str1, offset[0]);
		let range02 = offset_color.call(str2, offset[0]);

		if (range01 !== null && range02 !== null) {
			offset[0] = Math.min(range01[0], range02[0]);
		} else if (range01 !== null) {
			offset[0] = range01[0];
		} else if (range02 !== null) {
			offset[0] = range02[0];
		}

		let range1 = offset_color.call(str1, offset[1]);
		if (range1 !== null) {
			offset[1] = range1[1];
		}

		let range2 = offset_color.call(str2, offset[2]);
		if (range2 !== null) {
			offset[2] = range2[1];
		}

		return offset;

	};

	const diff = function() {

		if (arguments.length === 2) {

			let value_a = diffify(arguments[0]);
			let value_b = diffify(arguments[1]);

			if (isPrimitive(arguments[0]) === true && isPrimitive(arguments[1]) === true) {

				if (arguments[0] === arguments[1]) {

					let msg = '';

					msg += DIFF.normal;
					msg += value_a;

					msg += DIFF.normal;
					msg += ' ';

					msg += DIFF.normal;
					msg += value_b;

					msg += DIFF.normal;
					msg += ' ';
					msg += '\u001b[0m\n';

					process.stdout.write(msg);

				} else {

					let msg = '';

					msg += DIFF.remove;
					msg += value_a;

					msg += DIFF.normal;
					msg += ' ';

					msg += DIFF.insert;
					msg += value_b;

					msg += DIFF.normal;
					msg += ' ';
					msg += '\u001b[0m\n';

					process.stdout.write(msg);

				}

			} else {

				let lines_a = value_a.split('\t').join(INDENT).split('\n');
				let lines_b = value_b.split('\t').join(INDENT).split('\n');
				let result  = [];

				if (lines_a.length > lines_b.length) {
					lines_b = align(lines_b, lines_a);
				} else if (lines_b.length > lines_a.length) {
					lines_a = align(lines_a, lines_b);
				}

				for (let l = 0, ll = Math.max(lines_a.length, lines_b.length); l < ll; l++) {

					let line_a = lines_a[l];
					let line_b = lines_b[l];

					if (line_a === null) {
						result.push([ '+', '', line_b ]);
					} else if (line_b === null) {
						result.push([ '-', line_a, '' ]);
					} else if (line_a === line_b) {
						result.push([ '', line_a, line_b ]);
					} else {
						result.push([ '-+', line_a, line_b ]);
					}

				}

				let max = 0;

				result.forEach((values) => {
					max = Math.max(max, cleanify(values[1]).length, cleanify(values[2]).length);
				});

				result.forEach((values) => {

					let op     = values[0];
					let line_a = values[1];
					let line_b = values[2];
					let div_a  = WHITESPACE.substr(0, max - cleanify(line_a).length);
					let div_b  = WHITESPACE.substr(0, max - cleanify(line_b).length);

					if (op === '') {

						let msg = '';

						msg += DIFF.normal;
						msg += line_a;

						msg += DIFF.normal;
						msg += div_a;

						msg += DIFF.normal;
						msg += ' ';

						msg += DIFF.normal;
						msg += line_b;

						msg += DIFF.normal;
						msg += div_b;

						msg += DIFF.normal;
						msg += ' ';
						msg += '\u001b[0m\n';

						process.stdout.write(msg);

					} else if (op === '+') {

						let msg = '';

						msg += DIFF.normal;
						msg += line_a;

						msg += DIFF.normal;
						msg += div_a;

						msg += DIFF.normal;
						msg += ' ';

						msg += DIFF.insert;
						msg += line_b;

						msg += DIFF.normal;
						msg += div_b;

						msg += DIFF.normal;
						msg += ' ';
						msg += '\u001b[0m\n';

						process.stdout.write(msg);

					} else if (op === '-') {

						let msg = '';

						msg += DIFF.remove;
						msg += line_a;

						msg += DIFF.normal;
						msg += div_a;

						msg += DIFF.normal;
						msg += ' ';

						msg += DIFF.normal;
						msg += line_b;

						msg += DIFF.normal;
						msg += div_b;

						msg += DIFF.normal;
						msg += ' ';
						msg += '\u001b[0m\n';

						process.stdout.write(msg);

					} else if (op === '-+') {

						let msg    = '';
						let offset = compare(line_a, line_b);

						if (offset[0] !== -1 && offset[1] !== -1 && offset[2] !== -1) {

							msg += DIFF.normal;
							msg += line_a.substr(0, offset[0]);
							msg += DIFF.remove;
							msg += line_a.substr(offset[0], offset[1] - offset[0]);
							msg += DIFF.normal;
							msg += line_a.substr(offset[1]);

							msg += DIFF.normal;
							msg += div_a;

							msg += DIFF.normal;
							msg += ' ';

							msg += DIFF.normal;
							msg += line_b.substr(0, offset[0]);
							msg += DIFF.insert;
							msg += line_b.substr(offset[0], offset[2] - offset[0]);
							msg += DIFF.normal;
							msg += line_b.substr(offset[2]);

							msg += DIFF.normal;
							msg += div_b;

							msg += DIFF.normal;
							msg += ' ';
							msg += '\u001b[0m\n';

							process.stdout.write(msg);

						} else {

							msg += DIFF.remove;
							msg += line_a;

							msg += DIFF.normal;
							msg += div_a;

							msg += DIFF.normal;
							msg += ' ';

							msg += DIFF.insert;
							msg += line_b;

							msg += DIFF.normal;
							msg += div_b;

							msg += DIFF.normal;
							msg += ' ';
							msg += '\u001b[0m\n';

							process.stdout.write(msg);

						}

					}

				});

			}

		}

	};

	const error = function() {

		let al   = arguments.length;
		let args = [ '(E)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		process.stdout.write(stringify_arguments(args, 41));

	};

	const info = function() {

		let al   = arguments.length;
		let args = [ '(I)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		process.stdout.write(stringify_arguments(args, 42));

	};

	const log = function() {

		let al   = arguments.length;
		let args = [ '(L)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		process.stdout.write(stringify_arguments(args, 40));

	};

	const warn = function() {

		let al   = arguments.length;
		let args = [ '(W)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		process.stdout.write(stringify_arguments(args, 43));

	};



	const console = {
		blink: blink,
		clear: clear,
		debug: debug,
		diff:  diff,
		error: error,
		info:  info,
		log:   log,
		warn:  warn
	};


	return console;

})();

