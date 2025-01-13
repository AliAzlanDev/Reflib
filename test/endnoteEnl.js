import {expect} from 'chai';
import {compareTestRefs} from './data/blue-light.js';
import * as reflib from '../lib/default.js';
import fspath from 'node:path';
import mlog from 'mocha-logger';
import temp from 'temp';

let __dirname = fspath.resolve(fspath.dirname(decodeURI(new URL(import.meta.url).pathname)));

// FIXME: Needs .enl files creating
describe.skip('Module: EndNoteENL', ()=> {

	it('should parse an EndNoteENL file', function () {
		this.timeout(30 * 1000); //= 30s

		return reflib.readFile(`${__dirname}/data/blue-light.enl`)
			.then(refs => {
				expect(refs).to.be.an('array');
				expect(refs).to.have.length(102);
			})
	});

	// End-to-end test {{{
	it('should run a parse -> write -> parse test with all references', function() {
		this.timeout(60 * 1000); //= 1m

		let tempPath = temp.path({prefix: 'reflib-', suffix: '.enl'});
		let originalRefs;
		return Promise.resolve()
			.then(()=> mlog.log('Reading ref file'))
			.then(()=> reflib.readFile(`${__dirname}/data/blue-light.enl`))
			.then(refs => {
				expect(refs).to.have.length(102);
				originalRefs = refs;
			})
			.then(()=> mlog.log('Writing ref file'))
			.then(()=> reflib.writeFile(tempPath, originalRefs))
			.then(()=> mlog.log(`SDB file available at ${tempPath}`))
			.then(()=> mlog.log('Re-reading ref file'))
			.then(()=> reflib.readFile(tempPath))
			.then(newRefs => {
				mlog.log('Comparing', newRefs.length, 'references');
				expect(newRefs).to.have.length(originalRefs.length);
				newRefs.forEach((ref, refOffset) =>
					expect(ref).to.deep.equal(originalRefs[refOffset])
				);
			})
	});
	// }}}
});
