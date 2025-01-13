import Emitter from '../shared/emitter.js';
import {default as SQLite} from 'sql.js';

/**
* EndNote/SDB column to RefLib column mappings
* Column ID's not present within this list are generally scrapped
*
* @type {Array<Object>}
* @property {String} sl The Sqlite/SDB column within the `refs` table
* @property {String} rl The Reflib column (see README.md)
*/
export const columnMappings = [
	{sl: 'id', rl: 'recNumber'},
	// 'trash_state',
	// 'text_styles',
	// 'reference_type',
	// 'author',
	// 'year',
	{sl: 'title', rl: 'title'},
	{sl: 'pages', rl: 'pages'},
	// 'secondary_title',
	{sl: 'volume', rl: 'volume'},
	{sl: 'number', rl: 'number'},
	// 'number_of_volumes',
	// 'secondary_author',
	// 'place_published',
	// 'publisher',
	// 'subsidiary_author',
	// 'edition',
	// 'keywords',
	// 'type_of_work',
	// 'date',
	{sl: 'abstract', rl: 'abstract'},
	{sl: 'label', rl: 'label'},
	// 'url',
	// 'tertiary_title',
	// 'tertiary_author',
	{sl: 'notes', rl: 'notes'},
	{sl: 'isbn', rl: 'isbn'},
	{sl: 'custom_1', rl: 'custom1'},
	{sl: 'custom_2', rl: 'custom2'},
	{sl: 'custom_3', rl: 'custom3'},
	{sl: 'custom_4', rl: 'custom4'},
	// 'alternate_title',
	// 'accession_number',
	// 'call_number',
	// 'short_title',
	{sl: 'custom_5', rl: 'custom5'},
	{sl: 'custom_6', rl: 'custom6'},
	{sl: 'section', rl: 'section'},
	// 'original_publication',
	// 'reprint_edition',
	// 'reviewed_item',
	// 'author_address',
	// 'caption',
	{sl: 'custom_7', rl: 'custom7'},
	// 'electronic_resource_number',
	// 'translated_author',
	// 'translated_title',
	// 'name_of_database',
	// 'database_provider',
	{sl: 'research_notes', rl: 'researchNotes'},
	{sl: 'language', rl: 'language'},
	// 'access_date',
	// 'last_modified_date',
	// 'record_properties',
	// 'added_to_library',
	// 'record_last_updated',
	// 'reserved3',
	// 'fulltext_downloads',
	// 'read_status',
	// 'rating',
	// 'reserved7',
	// 'reserved8',
	// 'reserved9',
	// 'reserved10'
];

/**
* Lookup object for Sqlite columns to the column mapping object
* @type {Object<Object>} Each column mapping item with the Sqlite column name as the key
*/
export const columnMappingSL2RL = Object.fromEntries(
	columnMappings
		.map(cm => [cm.sl, cm])
)

export function readStream(stream) {
	let emitter = Emitter();

	// Queue up the parser in the next tick (so we can return the emitter first)
	setTimeout(()=> {
		let chunks = []; // Gathered buffer chunks, used to make an arrayBuffer later

		stream
			.on('data', chunk => chunks.push(chunk))
			.on('error', e => emitter.emit('error', e))
			.on('end', ()=> {
				Promise.resolve()
					// Parse chunks into an arrayBuffer {{{
					.then(()=> {
						let buf = new Uint8Array(
							chunks.reduce((total, chunk) => total + chunk.length, 0)
						);

						let position = 0;
						chunks.forEach(chunk => {
							buf.set(chunk, position);
							position += chunk.length;
						});

						// Release chunks to free up memory
						chunks = [];
						return buf;
					})
					// }}}
					// Init database {{{
					.then(buf => SQLite()
						.then(sqli => ({sqli, buf}))
					)
					// }}}
					// Create SQLi database {{{
					.then(({sqli, buf}) => new sqli.Database(
						new Uint8Array(buf)
					))
					// }}}
					// Slurp all references {{{
					.then(db => db.exec('SELECT * from refs'))
					.then(([{columns, values}]) => {
						values.forEach(v => {
							let ref = columns.reduce((ref, col, colIndex) => {
								if (columnMappingSL2RL[col]) // Is a column we have a mapping for (implied else - ignore the data)
									ref[col] = v[colIndex];

								return ref;
							}, {});
							emitter.emit('ref', ref);
						})
					})
					// }}}
					// Signal end of parsing {{{
					.finally(()=> emitter.emit('end'))
					// }}}
			})
	});

	return emitter;
}
