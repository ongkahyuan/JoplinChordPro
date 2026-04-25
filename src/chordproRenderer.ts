import { processSong } from './chordpro/songProcessor';
import { injectMetadata } from './chordpro/htmlInjector';
import { buildStyles } from './chordpro/styles';

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
				let columnCount = 1;
				try {
					const { renderedHtml: rawRendered, creditsHtml, metaLineHtml, columnCount: cc } = processSong(rawContent);
					columnCount = cc;
					renderedHtml = injectMetadata(rawRendered, creditsHtml, metaLineHtml);
				} catch (e) {
					renderedHtml = `<div class="chordpro-error">Failed to parse ChordPro: ${(e as Error).message}</div>`;
				}

				const isDarkTheme = ruleOptions && ruleOptions.theme && ruleOptions.theme.appearance === 'dark';
				const darkClass = isDarkTheme ? ' chordpro--dark-theme' : '';

				if (columnCount > 1) {
					renderedHtml = renderedHtml.replace(
						'<div class="chord-sheet"',
						`<div class="chord-sheet" style="column-count: ${columnCount}; column-gap: 1.5em;"`,
					);
				}

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
			return [{ inline: true, text: buildStyles(theme), mime: 'text/css' }];
		},
	};
}