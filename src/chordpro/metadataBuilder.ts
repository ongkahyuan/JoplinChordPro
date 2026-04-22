import { Song } from 'chordsheetjs';
import { toString, capitalizeFirst } from './utils';

const STANDARD_META_KEYS = new Set([
	'title', 'subtitle', 'artist', 'composer', 'lyricist',
	'copyright', 'album', 'year', 'key', 'time', 'tempo',
	'duration', 'capo', 'transpose', '_key',
]);

export function buildCreditsHtml(song: Song): string {
	const parts: string[] = [];

	const creditExtractors = [
		{ key: 'artist', format: (v: string) => `By ${v}` },
		{ key: 'lyricist', format: (v: string) => `Words by ${v}` },
		{ key: 'composer', format: (v: string) => `Music by ${v}` },
		{ key: 'copyright', format: (v: string) => `© ${v}` },
		{ key: 'album', format: (v: string) => `from ${v}` },
		{ key: 'year', format: (v: string) => `(${v})` },
	];

	for (const { key, format } of creditExtractors) {
		const value = toString(song[key as keyof Song] as any);
		if (value) parts.push(format(value));
	}

	if ('metadata' in song && song.metadata instanceof Map) {
		for (const [key, value] of song.metadata) {
			if (STANDARD_META_KEYS.has(key)) continue;
			const strVal = toString(value);
			if (strVal) parts.push(`${capitalizeFirst(key)}: ${strVal}`);
		}
	}

	if (parts.length === 0) return '';
	return `<div class="chordpro-credits">${parts.join(' · ')}</div>`;
}

export function buildMetaLineHtml(
	displayedKey: string | null,
	song: Song,
	capoValue: number | null,
): string {
	const parts: string[] = [];

	const metaExtractors = [
		{ key: 'key', label: 'Key:', value: displayedKey },
		{ key: 'time', label: 'Time:', getValue: () => toString(song.time) },
		{ key: 'tempo', label: 'Tempo:', getValue: () => toString(song.tempo) },
		{ key: 'duration', label: '', getValue: () => toString(song.duration) },
	];

	for (const { label, getValue, value } of metaExtractors) {
		if ('getValue' in metaExtractors[0]) {
			const val = getValue!();
			if (val) parts.push(label ? `${label} ${val}` : val);
		} else if (value) {
			parts.push(`${label} ${value}`);
		}
	}

	if (capoValue !== null) {
		parts.push(`Capo ${capoValue}`);
	}

	if (parts.length === 0) return '';
	return `<div class="chordpro-meta-line">${parts.join(' | ')}</div>`;
}