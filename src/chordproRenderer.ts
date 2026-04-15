import {
	ChordProParser,
	HtmlDivFormatter,
} from 'chordsheetjs';

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
				} catch (e) {
					renderedHtml = `<div class="chordpro-error">Failed to parse ChordPro: ${(e as Error).message}</div>`;
				}

				const capoBadge = capoValue !== null
					? `<div class="chordpro-capo-badge">Capo ${capoValue}</div>`
					: '';

				return `<div class="joplin-editable">
					<pre class="joplin-source" hidden
						data-joplin-language="chordpro"
						data-joplin-source-open="\`\`\`chordpro&#10;"
						data-joplin-source-close="&#10;\`\`\`&#10;"
					>${contentHtml}</pre>
					${capoBadge}
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
