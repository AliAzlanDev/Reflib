import {expect} from 'chai';
import {compareTestRefs} from './data/blue-light.js';
import * as reflib from '../lib/default.js';
import fspath from 'node:path';

let __dirname = fspath.resolve(fspath.dirname(decodeURI(new URL(import.meta.url).pathname)));

describe('Module: sqlite', ()=> {

	it('should parse an EndNote/SDB file', function () {
		this.timeout(30 * 1000); //= 30s

		return reflib.readFile(`${__dirname}/data/blue-light.sdb`)
			.then(refs => {
				expect(refs).to.be.an('array');
				expect(refs).to.have.length(102);
			})
	});

});
