import {
	ChordProParser,
	HtmlDivFormatter,
	Key,
	Song,
	Tag,
	ChordLyricsPair,
	Comment,
} from 'chordsheetjs';
import { toString } from './utils';
import { buildCreditsHtml, buildMetaLineHtml } from './metadataBuilder';

const parser = new ChordProParser();
const formatter = new HtmlDivFormatter();

export function findTransposeDirective(song: Song): string | null {
	for (const line of song.lines) {
		for (const item of line.items) {
			if (item instanceof Tag && (item as any).name === 'transpose') {
				return (item as any).value || null;
			}
		}
	}
	return null;
}

function extractCapo(song: Song): number | null {
	const rawCapo = song.capo;
	if (rawCapo === null || rawCapo === undefined) return null;

	const capoStr = Array.isArray(rawCapo) ? rawCapo[0] : String(rawCapo);
	const parsed = parseInt(capoStr, 10);
	if (!isNaN(parsed) && parsed > 0) return parsed;
	return null;
}

function computeDisplayedKey(
	originalKey: string | null,
	transposeDirective: string | null,
): string | null {
	if (!originalKey) return null;

	let displayedKey = originalKey;
	if (transposeDirective !== null) {
		const trimmed = transposeDirective.trim();
		let transposeDelta = 0;
		if (/^-?\d+$/.test(trimmed)) {
			transposeDelta = parseInt(trimmed, 10);
		} else {
			try {
				transposeDelta = Key.distance(originalKey, trimmed);
			} catch {
				transposeDelta = 0;
			}
		}
		if (transposeDelta !== 0) {
			try {
				displayedKey = Key.wrapOrFail(originalKey)
					.transpose(transposeDelta)
					.normalize()
					.toString();
			} catch {
				displayedKey = originalKey;
			}
		}
	}
	return displayedKey;
}

function removeTransposeTags(song: Song): void {
	for (const line of song.lines) {
		line.items = line.items.filter(
			(item) => !(item instanceof Tag && (item as any).name === 'transpose'),
		);
		(line as any).transposeKey = null;
	}
}

function parseTransposeDelta(transposeDirective: string | null): number {
	if (transposeDirective === null) return 0;
	const trimmed = transposeDirective.trim();
	if (/^-?\d+$/.test(trimmed)) {
		return parseInt(trimmed, 10);
	}
	return 0;
}

export function processSong(
	rawContent: string,
): { renderedHtml: string; creditsHtml: string; metaLineHtml: string } {
	const song = parser.parse(rawContent);
	const capoValue = extractCapo(song);

	const transposeDirective = findTransposeDirective(song);
	const displayedKey = computeDisplayedKey(toString(song.key), transposeDirective);
	const transposeDelta = parseTransposeDelta(transposeDirective);

	removeTransposeTags(song);

	const totalDelta = -(capoValue ?? 0) + transposeDelta;
	const songToRender = totalDelta !== 0 ? song.transpose(totalDelta) : song;
	const renderedHtml = formatter.format(songToRender);

	const creditsHtml = buildCreditsHtml(songToRender);
	const metaLineHtml = buildMetaLineHtml(displayedKey, songToRender, capoValue);

	return { renderedHtml, creditsHtml, metaLineHtml };
}