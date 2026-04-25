export function buildStyles(theme: any): string {
	const isDark = theme && theme.appearance === 'dark';
	const textColor = isDark ? '#d1d1d1' : '#333333';
	const textColorSecondary = isDark ? '#999999' : '#666666';
	const textColorFaded = isDark ? '#999999' : '#888888';
	const accentColor = isDark ? 'rgb(166,166,255)' : '#4da6ff';
	const titleColor = isDark ? '#e8e8e8' : '#1a1a1a';
	const errorBg = isDark ? 'rgba(220,53,69,0.15)' : 'rgba(220,53,69,0.1)';
	const errorBorder = isDark ? 'rgba(220,53,69,0.4)' : 'rgba(220,53,69,0.3)';
	const chorusBorder = accentColor;

	return `
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
	line-height: 1.2;
	white-space: nowrap;
}

.chordpro-rendered .chord-sheet .chord:not(:empty) {
	padding-right: 0px;
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
}