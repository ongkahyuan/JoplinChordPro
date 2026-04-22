import {
	ChordProParser,
	HtmlDivFormatter,
	Key,
} from 'chordsheetjs';

const STANDARD_META_KEYS = new Set([
	'title', 'subtitle', 'artist', 'composer', 'lyricist',
	'copyright', 'album', 'year', 'key', 'time', 'tempo',
	'duration', 'capo', 'transpose', '_key',
]);

function toString(value: string | string[] | null | undefined): string | null {
	if (value === null || value === undefined) return null;
	if (Array.isArray(value)) return value.join(', ');
	return value;
}

function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function findFirstTransposeDirective(song: any): string | null {
	for (const line of song.lines) {
		for (const item of line.items) {
			if (item && item._name === 'transpose' && item._value) {
				return item._value;
			}
		}
	}
	return null;
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

function buildMetaLineHtml(displayedKey: string | null, songToRender: any, capoValue: number | null): string {
	const parts: string[] = [];

	if (displayedKey) parts.push(`Key: ${displayedKey}`);

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
		plugin: function(markdownIt: any, _options: any, ruleOptions: any) {
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

					const originalKey = toString(song.key);
					let displayedKey: string | null = originalKey;
					if (originalKey) {
						const rawTranspose = findFirstTransposeDirective(song);
						if (rawTranspose !== null) {
							const trimmed = rawTranspose.trim();
							let transposeDelta = 0;
							if (/^-?\d+$/.test(trimmed)) {
								transposeDelta = parseInt(trimmed, 10);
							} else {
								try {
									transposeDelta = Key.distance(originalKey, trimmed);
								} catch { transposeDelta = 0; }
							}
							if (transposeDelta !== 0) {
								try {
									displayedKey = Key.wrapOrFail(originalKey).transpose(transposeDelta).normalize().toString();
								} catch { displayedKey = originalKey; }
							}
						}
					}

					const creditsHtml = buildCreditsHtml(songToRender);
					const metaLineHtml = buildMetaLineHtml(displayedKey, songToRender, capoValue);
					renderedHtml = injectMetadata(renderedHtml, creditsHtml, metaLineHtml);
				} catch (e) {
					renderedHtml = `<div class="chordpro-error">Failed to parse ChordPro: ${(e as Error).message}</div>`;
				}

				const isDarkTheme = ruleOptions && ruleOptions.theme && ruleOptions.theme.appearance === 'dark';
				const darkClass = isDarkTheme ? ' chordpro--dark-theme' : '';

				return `<div class="joplin-editable">
					<pre class="joplin-source" hidden
						data-joplin-language="chordpro"
						data-joplin-source-open="\`\`\`chordpro&#10;"
						data-joplin-source-close="&#10;\`\`\`&#10;"
					>${contentHtml}</pre>
					<div class="chordpro-rendered${darkClass}">${renderedHtml}</div>
				</div>`;
			};
		},

		assets: function(theme: any) {
			const isDark = theme && theme.appearance === 'dark';
			const textColor = isDark ? '#d1d1d1' : '#333333';
			const textColorSecondary = isDark ? '#999999' : '#666666';
			const textColorFaded = isDark ? '#999999' : '#888888';
			const accentColor = isDark ? 'rgb(166,166,255)' : '#4da6ff';
			const titleColor = isDark ? '#e8e8e8' : '#1a1a1a';
			const errorBg = isDark ? 'rgba(220,53,69,0.15)' : 'rgba(220,53,69,0.1)';
			const errorBorder = isDark ? 'rgba(220,53,69,0.4)' : 'rgba(220,53,69,0.3)';
			const chorusBorder = accentColor;

			const css = `
.chordpro-rendered .chord-sheet {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
	font-size: 15px;
	line-height: 1.6;
	color: ${textColor};
	background: transparent;
	padding: 0;
	margin: 0;
}

.chordpro-rendered .chord-sheet .title {
	font-size: 1.4em;
	font-weight: 700;
	margin: 0 0 0.25em 0;
	color: ${titleColor};
}

.chordpro-rendered .chord-sheet .subtitle {
	font-size: 1em;
	font-weight: 400;
	color: ${textColorSecondary};
	margin: 0 0 0.75em 0;
}

.chordpro-rendered .chord-sheet .paragraph {
	margin: 0 0 1em 0;
}

.chordpro-rendered .chord-sheet .paragraph.chorus {
	padding-left: 1em;
	border-left: 3px solid ${chorusBorder};
	margin-left: 0;
}

.chordpro-rendered .chord-sheet .paragraph.verse {
	font-style: italic;
}

.chordpro-rendered .chord-sheet .paragraph.tab,
.chordpro-rendered .chord-sheet .paragraph.grid {
	font-family: 'Courier New', Courier, monospace;
	font-size: 0.9em;
}

.chordpro-rendered .chord-sheet .row {
	display: flex;
	flex-wrap: wrap;
}

.chordpro-rendered .chord-sheet .column {
	display: flex;
	flex-direction: column;
}

.chordpro-rendered .chord-sheet .chord {
	font-family: 'Courier New', Courier, monospace;
	font-weight: 600;
	color: ${accentColor};
	min-width: 0.5em;
	line-height: 1.2;
	white-space: nowrap;
}

.chordpro-rendered .chord-sheet .chord:not(:empty) {
	padding-right: 10px;
}

.chordpro-rendered .chord-sheet .chord::after,
.chordpro-rendered .chord-sheet .lyrics::after {
	content: '\\200b';
}

.chordpro-rendered .chord-sheet .lyrics {
	white-space: pre-wrap;
	color: ${textColor};
}

.chordpro-rendered .chord-sheet .label {
	font-size: 0.85em;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: ${textColorFaded};
	margin: 0 0 0.25em 0;
}

.chordpro-rendered .chord-sheet .comment {
	font-style: italic;
	color: ${textColorSecondary};
	font-size: 0.9em;
}

.chordpro-rendered .chord-sheet .annotation {
	font-style: italic;
	color: ${textColorFaded};
	font-size: 0.85em;
}

.chordpro-rendered .chord-sheet .empty-line {
	min-height: 1.6em;
}

.chordpro-rendered .chordpro-credits {
	font-size: 0.9em;
	color: ${textColorSecondary};
	margin: 0.25em 0 0.5em 0;
	font-style: italic;
}

.chordpro-rendered .chordpro-meta-line {
	font-size: 0.8em;
	color: ${textColorFaded};
	margin: 0 0 0.75em 0;
}

.chordpro-rendered .chordpro-error {
	font-family: 'Courier New', Courier, monospace;
	background: ${errorBg};
	border: 1px solid ${errorBorder};
	border-radius: 4px;
	padding: 1em;
	color: #dc3545;
	white-space: pre-wrap;
}
`;
			return [{ inline: true, text: css, mime: 'text/css' }];
		},
	};
}
