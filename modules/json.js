import Emitter from '../shared/emitter.js';
import JSONStream from 'JSONStream';

/**
* @see modules/interface.js
*/
export function readStream(stream) {
	let recNumber = 1;
	let emitter = Emitter();

	// Queue up the parser in the next tick (so we can return the emitter first)
	setTimeout(()=>
		stream.pipe(
			JSONStream.parse('*')
				.on('data', ref => emitter.emit('ref', {
					recNumber: recNumber++,
					...ref,
				}))
				.on('end', ()=> emitter.emit('end'))
				.on('error', emitter.emit.bind('error'))
		)
	);

	return emitter;
}


/**
* @see modules/interface.js
* @param {Object} [options] Additional options to use when parsing
* @param {string} [options.lineSuffix='\n'] Optional line suffix for each output line of JSON
*/
export function writeStream(stream, options) {
	let settings = {
		lineSuffix: '\n',
		...options,
	};

	let lastRef; // Hold last refrence string in memory so we know when we've reached the end (last item shoulnd't have a closing comma)

	return {
		start: ()=> {
			stream.write('[\n');
			return Promise.resolve();
		},
		write: ref => {
			if (lastRef) stream.write(lastRef + ',' + settings.lineSuffix); // Flush last reference to disk with comma
			lastRef = JSON.stringify(ref);
			return Promise.resolve();
		},
		end: ()=> {
			if (lastRef) stream.write(lastRef + settings.lineSuffix); // Flush final reference to disk without final comma
			stream.write(']');
			return new Promise((resolve, reject) =>
				stream.end(err => err ? reject(err) : resolve())
			);
		},
	};
}
