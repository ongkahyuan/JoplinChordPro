import {
	ChordProParser,
	HtmlDivFormatter,
} from 'chordsheetjs';

const STANDARD_META_KEYS = new Set([
	'title', 'subtitle', 'artist', 'composer', 'lyricist',
	'copyright', 'album', 'year', 'key', 'time', 'tempo',
	'duration', 'capo', '_key',
]);

function toString(value: string | string[] | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (Array.isArray(value)) return value.join(', ');
	return value;
}

function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildCreditsHtml(song: any): string {
	const parts: string[] = [];

	const artist = toString(song.artist);
	if (artist) parts.push(`By ${artist}`);

	const lyricist = toString(song.lyricist);
	if (lyricist) parts.push(`Words by ${lyricist}`);

	const composer = toString(song.composer);
	if (composer) parts.push(`Music by ${composer}`);

	const copyright = toString(song.copyright);
	if (copyright) parts.push(`© ${copyright}`);

	const album = toString(song.album);
	if (album) parts.push(`from ${album}`);

	const year = toString(song.year);
	if (year) parts.push(`(${year})`);

	for (const [key, value] of song.metadata) {
		if (STANDARD_META_KEYS.has(key)) continue;
		const strVal = toString(value);
		if (strVal) parts.push(`${capitalizeFirst(key)}: ${strVal}`);
	}

	if (parts.length === 0) return '';
	return `<div class="chordpro-credits">${parts.join(' · ')}</div>`;
}

function buildMetaLineHtml(originalSong: any, songToRender: any, capoValue: number | null): string {
	const parts: string[] = [];

	const key = toString(originalSong.key);
	if (key) parts.push(`Key: ${key}`);

	const time = toString(songToRender.time);
	if (time) parts.push(`Time: ${time}`);

	const tempo = toString(songToRender.tempo);
	if (tempo) parts.push(`Tempo: ${tempo}`);

	const duration = toString(songToRender.duration);
	if (duration) parts.push(duration);

	if (capoValue !== null) {
		parts.push(`Capo ${capoValue}`);
	}

	if (parts.length === 0) return '';
	return `<div class="chordpro-meta-line">${parts.join(' | ')}</div>`;
}

function injectMetadata(renderedHtml: string, creditsHtml: string, metaLineHtml: string): string {
	if (!creditsHtml && !metaLineHtml) return renderedHtml;

	const afterTitleMatch = renderedHtml.match(/(<h2 class="subtitle">[\s\S]*?<\/h2>)/);
	const afterTitle = afterTitleMatch ? afterTitleMatch[0] : null;

	let insertionPoint = '';
	let searchStart = 0;

	if (afterTitle) {
		const subtitleEndIndex = renderedHtml.indexOf('</h2>', searchStart) + 6;
		insertionPoint = renderedHtml.slice(subtitleEndIndex);
		searchStart = subtitleEndIndex;
	} else {
		const titleEndMatch = renderedHtml.match(/<\/h1>/);
		if (titleEndMatch) {
			const titleEndIndex = renderedHtml.indexOf('</h1>', searchStart) + 5;
			insertionPoint = renderedHtml.slice(titleEndIndex);
			searchStart = titleEndIndex;
		} else {
			const chordSheetStart = renderedHtml.indexOf('<div class="chord-sheet"');
			if (chordSheetStart !== -1) {
				insertionPoint = renderedHtml.slice(chordSheetStart);
				searchStart = chordSheetStart;
			} else {
				return renderedHtml;
			}
		}
	}

	const metadataHtml = creditsHtml + metaLineHtml;
	return renderedHtml.slice(0, searchStart) + metadataHtml + insertionPoint;
}

export default function(context: { contentScriptId: string; pluginId: string; postMessage: Function }) {
	return {
		plugin: function(markdownIt: any, _options: any) {
			const defaultRender = markdownIt.renderer.rules.fence || function(tokens: any, idx: any, options: any, env: any, self: any) {
				return self.renderToken(tokens, idx, options, env, self);
			};

			markdownIt.renderer.rules.fence = function(tokens: any, idx: any, options: any, env: any, self: any) {
				const token = tokens[idx];
				const language = (token.info || '').trim().toLowerCase();

				if (language !== 'chordpro') {
					return defaultRender(tokens, idx, options, env, self);
				}

				const rawContent = token.content.trimEnd();
				const contentHtml = markdownIt.utils.escapeHtml(rawContent);

				let renderedHtml = '';
				let capoValue: number | null = null;

				try {
					const parser = new ChordProParser();
					const song = parser.parse(rawContent);

					const rawCapo = song.capo;
					if (rawCapo !== null && rawCapo !== undefined) {
						const capoStr = Array.isArray(rawCapo) ? rawCapo[0] : String(rawCapo);
						const parsed = parseInt(capoStr, 10);
						if (!isNaN(parsed) && parsed > 0) {
							capoValue = parsed;
						}
					}

					const formatter = new HtmlDivFormatter();
					const songToRender = capoValue !== null ? song.transpose(capoValue) : song;
					renderedHtml = formatter.format(songToRender);

					const creditsHtml = buildCreditsHtml(songToRender);
					const metaLineHtml = buildMetaLineHtml(song, songToRender, capoValue);
					renderedHtml = injectMetadata(renderedHtml, creditsHtml, metaLineHtml);
				} catch (e) {
					renderedHtml = `<div class="chordpro-error">Failed to parse ChordPro: ${(e as Error).message}</div>`;
				}

				return `<div class="joplin-editable">
					<pre class="joplin-source" hidden
						data-joplin-language="chordpro"
						data-joplin-source-open="\`\`\`chordpro&#10;"
						data-joplin-source-close="&#10;\`\`\`&#10;"
					>${contentHtml}</pre>
					<div class="chordpro-rendered">${renderedHtml}</div>
				</div>`;
			};
		},

		assets: function() {
			return [
				{ name: 'chordproRenderer.css' },
			];
		},
	};
}
